import { supabase } from '../../js/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    let purchaseCart = [];
    
    // नवीन HTML IDs
    const searchInput = document.getElementById('purchaseProductSearch');
    const resultsDiv = document.getElementById('searchResults');
    const supplierInput = document.getElementById('supplierName');
    const invoiceInput = document.getElementById('purchaseInvoiceNo');
    const saveBtn = document.getElementById('savePurchaseBtn');

    // १. नावाने किंवा SKU ने प्रॉडक्ट शोधणे (Live Search)
    if (searchInput) {
        searchInput.addEventListener('input', async (e) => {
            const query = e.target.value.trim();
            
            // जर २ पेक्षा कमी अक्षरे असतील तर रिझल्ट बॉक्स लपवा
            if (query.length < 2) {
                resultsDiv.classList.add('hidden');
                return;
            }

            try {
                // डेटाबेसमधून नाव किंवा SKU ने शोधणे
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
                    .limit(10); // जास्तीत जास्त १० प्रॉडक्ट्स दाखवा

                if (error) throw error;

                resultsDiv.innerHTML = ''; // जुने रिझल्ट्स पुसा

                if (data && data.length > 0) {
                    // आलेले प्रॉडक्ट्स यादीत (Dropdown) दाखवणे
                    data.forEach(item => {
                        const div = document.createElement('div');
                        div.className = 'p-3 cursor-pointer hover:bg-blue-100 border-b text-gray-800 font-semibold';
                        div.innerHTML = `${item.name} <span class="text-sm text-gray-500 font-normal ml-2">(${item.sku}) - स्टॉक: ${item.stock}</span>`;
                        
                        // यादीतील नावावर क्लिक केल्यावर कार्टमध्ये ॲड करा
                        div.onclick = () => {
                            addToPurchaseCart(item);
                            searchInput.value = ''; // सर्च बॉक्स रिकामा करा
                            resultsDiv.classList.add('hidden'); // यादी लपवा
                        };
                        resultsDiv.appendChild(div);
                    });
                    resultsDiv.classList.remove('hidden');
                } else {
                    // जर काहीच सापडले नाही
                    resultsDiv.innerHTML = '<div class="p-3 text-red-500">कोणतेही प्रॉडक्ट सापडले नाही...</div>';
                    resultsDiv.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Search error:', err);
            }
        });

        // बॉक्सच्या बाहेर क्लिक केल्यावर यादी लपवणे
        document.addEventListener('click', (e) => {
            if (e.target !== searchInput && e.target !== resultsDiv) {
                resultsDiv.classList.add('hidden');
            }
        });
    }

    // २. प्रॉडक्ट कार्टमध्ये जोडणे
    function addToPurchaseCart(product) {
        const existing = purchaseCart.find(item => item.id === product.id);
        if (existing) {
            existing.qty += 1;
        } else {
            purchaseCart.push({ ...product, qty: 1, current_purchase_price: product.purchase_price });
        }
        renderPurchaseCart();
    }

    // ३. कार्ट स्क्रीनवर दाखवणे
    function renderPurchaseCart() {
        const tbody = document.getElementById('purchaseCartBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        let grandTotal = 0;

        purchaseCart.forEach((item, index) => {
            let rowTotal = item.current_purchase_price * item.qty;
            grandTotal += rowTotal;

            tbody.innerHTML += `
                <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="p-3">${index + 1}</td>
                    <td class="p-3 font-semibold">${item.name} <br><span class="text-xs text-gray-500">स्टॉक: ${item.stock}</span></td>
                    <td class="p-3">
                        <input type="number" min="1" value="${item.qty}" onchange="updatePurchaseQty(${index}, this.value)" class="w-20 p-1 border rounded text-center focus:outline-none focus:border-blue-500">
                    </td>
                    <td class="p-3">
                        <input type="number" min="0" value="${item.current_purchase_price}" onchange="updatePurchasePrice(${index}, this.value)" class="w-24 p-1 border rounded text-center focus:outline-none focus:border-blue-500">
                    </td>
                    <td class="p-3 font-bold text-gray-700">₹${rowTotal.toFixed(2)}</td>
                    <td class="p-3 text-center">
                        <button onclick="removePurchaseItem(${index})" class="text-red-500 hover:bg-red-100 p-2 rounded">❌</button>
                    </td>
                </tr>
            `;
        });

        const totalEl = document.getElementById('purchaseGrandTotal');
        if(totalEl) totalEl.textContent = `₹${grandTotal.toFixed(2)}`;
    }

    window.updatePurchaseQty = (index, qty) => {
        purchaseCart[index].qty = parseInt(qty) || 1;
        renderPurchaseCart();
    };

    window.updatePurchasePrice = (index, price) => {
        purchaseCart[index].current_purchase_price = parseFloat(price) || 0;
        renderPurchaseCart();
    };

    window.removePurchaseItem = (index) => {
        purchaseCart.splice(index, 1);
        renderPurchaseCart();
    };

    // ४. खरेदी सेव्ह करणे आणि स्टॉक अपडेट करणे
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (purchaseCart.length === 0) {
                alert('कार्ट रिकामी आहे! कृपया प्रॉडक्ट ॲड करा.');
                return;
            }
            if (!supplierInput.value || !invoiceInput.value) {
                alert('कृपया सप्लायरचे नाव आणि बिल नंबर टाका.');
                return;
            }

            saveBtn.innerText = '⏳ सेव्ह करत आहे...';
            saveBtn.disabled = true;

            let totalAmount = purchaseCart.reduce((sum, item) => sum + (item.current_purchase_price * item.qty), 0);

            try {
                // Purchases टेबलमध्ये सेव्ह करणे
                const { data: purchaseData, error: purchaseError } = await supabase
                    .from('purchases')
                    .insert([{
                        supplier_name: supplierInput.value,
                        invoice_no: invoiceInput.value,
                        total_amount: totalAmount
                    }])
                    .select()
                    .single();

                if (purchaseError) throw purchaseError;

                // Purchase Items मध्ये सेव्ह करून स्टॉक वाढवणे
                for (let item of purchaseCart) {
                    await supabase.from('purchase_items').insert([{
                        purchase_id: purchaseData.id,
                        product_id: item.id,
                        qty: item.qty,
                        purchase_price: item.current_purchase_price,
                        total: item.current_purchase_price * item.qty
                    }]);

                    const newStock = item.stock + item.qty;
                    await supabase.from('products').update({ 
                        stock: newStock,
                        purchase_price: item.current_purchase_price 
                    }).eq('id', item.id);
                }

                alert('✅ खरेदीचे बिल यशस्वीरित्या सेव्ह झाले आणि स्टॉक अपडेट झाला!');
                
                // फॉर्म रिसेट करणे
                purchaseCart = [];
                supplierInput.value = '';
                invoiceInput.value = '';
                renderPurchaseCart();
                searchInput.focus();

            } catch (err) {
                console.error('Purchase error:', err);
                alert('❌ बिल सेव्ह करताना त्रुटी आली: ' + err.message);
            } finally {
                saveBtn.innerText = '💾 Save Purchase';
                saveBtn.disabled = false;
            }
        });
    }
});
