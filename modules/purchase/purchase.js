import { supabase } from '../../js/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    let purchaseCart = [];
    
    const barcodeInput = document.getElementById('purchaseBarcodeInput');
    const addBtn = document.getElementById('addPurchaseItemBtn'); // नवीन बटण जोडले
    const supplierInput = document.getElementById('supplierName');
    const invoiceInput = document.getElementById('purchaseInvoiceNo');
    const saveBtn = document.getElementById('savePurchaseBtn');

    // १. बारकोड/SKU टाकल्यावर डेटाबेसमधून प्रॉडक्ट शोधण्याचे फंक्शन
    async function handleSearch() {
        const code = barcodeInput.value.trim();
        if (code) {
            await searchProductForPurchase(code);
            barcodeInput.value = '';
            barcodeInput.focus();
        }
    }

    // Enter दाबल्यावर शोधणे
    if (barcodeInput) {
        barcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }

    // 'जोडा (Add)' बटणावर क्लिक केल्यावर शोधणे
    if (addBtn) {
        addBtn.addEventListener('click', handleSearch);
    }

    // Supabase मधून प्रॉडक्ट शोधणे
    async function searchProductForPurchase(code) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                // .ilike वापरल्याने कॅपिटल/स्मॉल अक्षरांचा फरक पडणार नाही (उदा. men-123 आणि MEN-123 दोन्ही चालतील)
                .or(`sku.ilike.${code},barcode.ilike.${code}`) 
                .single();

            if (error || !data) {
                alert('❌ प्रॉडक्ट सापडले नाही! कृपया SKU बरोबर आहे का ते तपासा.');
                return;
            }

            addToPurchaseCart(data);
        } catch (err) {
            console.error('Search error:', err);
            alert('❌ प्रॉडक्ट शोधताना त्रुटी आली.');
        }
    }

    function addToPurchaseCart(product) {
        const existing = purchaseCart.find(item => item.id === product.id);
        if (existing) {
            existing.qty += 1;
        } else {
            purchaseCart.push({ ...product, qty: 1, current_purchase_price: product.purchase_price });
        }
        renderPurchaseCart();
    }

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
