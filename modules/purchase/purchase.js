import { supabase } from '../../js/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    let purchaseCart = [];
    
    // HTML मधील इनपुट बॉक्सेस
    const barcodeInput = document.getElementById('purchaseBarcodeInput');
    const supplierInput = document.getElementById('supplierName');
    const invoiceInput = document.getElementById('purchaseInvoiceNo');
    const saveBtn = document.getElementById('savePurchaseBtn');

    // १. बारकोड/SKU टाकल्यावर डेटाबेसमधून प्रॉडक्ट शोधणे
    if (barcodeInput) {
        barcodeInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const code = barcodeInput.value.trim();
                if (code) {
                    await searchProductForPurchase(code);
                    barcodeInput.value = '';
                    barcodeInput.focus();
                }
            }
        });
    }

    async function searchProductForPurchase(code) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .or(`sku.eq.${code},barcode.eq.${code}`)
                .single();

            if (error || !data) {
                alert('❌ प्रॉडक्ट सापडले नाही! कृपया SKU बरोबर आहे का ते तपासा.');
                return;
            }

            addToPurchaseCart(data);
        } catch (err) {
            console.error('Search error:', err);
        }
    }

    function addToPurchaseCart(product) {
        const existing = purchaseCart.find(item => item.id === product.id);
        if (existing) {
            existing.qty += 1;
        } else {
            // खरेदीसाठी कार्टमध्ये टाकताना आपण 'खरेदी किंमत' (purchase_price) वापरतो
            purchaseCart.push({ ...product, qty: 1, current_purchase_price: product.purchase_price });
        }
        renderPurchaseCart();
    }

    // २. खरेदी कार्ट स्क्रीनवर दाखवणे
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
                        <input type="number" min="1" value="${item.qty}" onchange="updatePurchaseQty(${index}, this.value)" class="w-20 p-1 border rounded text-center">
                    </td>
                    <td class="p-3">
                        <input type="number" min="0" value="${item.current_purchase_price}" onchange="updatePurchasePrice(${index}, this.value)" class="w-24 p-1 border rounded text-center">
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

    // ग्लोबल फंक्शन्स (कार्ट अपडेट करण्यासाठी)
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

    // ३. खरेदी सेव्ह करणे आणि स्टॉक वाढवणे (Auto Stock Addition)
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
                // १. Purchases (मुख्य बिल) टेबलमध्ये डेटा टाका
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

                // २. प्रत्येक आयटम सेव्ह करा आणि प्रॉडक्टचा 'स्टॉक' वाढवा
                for (let item of purchaseCart) {
                    
                    // Purchase Items मध्ये सेव्ह करा
                    await supabase.from('purchase_items').insert([{
                        purchase_id: purchaseData.id,
                        product_id: item.id,
                        qty: item.qty,
                        purchase_price: item.current_purchase_price,
                        total: item.current_purchase_price * item.qty
                    }]);

                    // सर्वात महत्त्वाचे: स्टॉक वाढवणे! (Current Stock + New Qty)
                    const newStock = item.stock + item.qty;
                    
                    // स्टॉक अपडेट करणे (आणि जर सप्लायरने नवीन भाव लावला असेल तर खरेदी किंमतही अपडेट करणे)
                    await supabase.from('products').update({ 
                        stock: newStock,
                        purchase_price: item.current_purchase_price 
                    }).eq('id', item.id);
                }

                alert('✅ खरेदीचे बिल यशस्वीरित्या सेव्ह झाले आणि स्टॉक अपडेट झाला!');
                
                // फॉर्म रिकामा करा
                purchaseCart = [];
                supplierInput.value = '';
                invoiceInput.value = '';
                renderPurchaseCart();
                barcodeInput.focus();

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
