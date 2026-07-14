import { supabase } from '../../js/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    
    setInterval(() => {
        document.getElementById('currentDateTime').innerText = new Date().toLocaleString('mr-IN');
    }, 1000);

    let cart = [];
    const barcodeInput = document.getElementById('barcodeInput');
    const discountInput = document.getElementById('posDiscount');
    const saveBillBtn = document.getElementById('saveBillBtn'); // नवीन बटण

    // १. बारकोड स्कॅन केल्यावर प्रॉडक्ट शोधणे
    barcodeInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const code = barcodeInput.value.trim();
            if (code) {
                await searchProductFromDB(code);
                barcodeInput.value = ''; 
                barcodeInput.focus();
            }
        }
    });

    discountInput.addEventListener('input', renderCart);

    // Supabase मधून प्रॉडक्ट आणणे
    async function searchProductFromDB(code) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .or(`sku.eq.${code},barcode.eq.${code}`)
                .single();

            if (error || !data) {
                alert('❌ प्रॉडक्ट सापडले नाही! SKU बरोबर आहे का ते तपासा.');
                return;
            }

            // स्टॉक संपला आहे का ते चेक करा
            if (data.stock <= 0) {
                alert(`⚠️ सावधान! "${data.name}" चा स्टॉक संपला आहे (Out of Stock).`);
                return;
            }

            addToCart(data);
        } catch (err) {
            console.error('Search error:', err);
            alert('❌ प्रॉडक्ट शोधताना त्रुटी आली.');
        }
    }

    function addToCart(product) {
        const existing = cart.find(item => item.id === product.id);
        
        // जर कार्टमध्ये टाकलेली Qty आणि दुकानातील स्टॉक समान असेल, तर अजून ॲड करू नका
        if (existing) {
            if (existing.qty >= product.stock) {
                alert(`⚠️ तुम्ही ${product.stock} पेक्षा जास्त ${product.name} देऊ शकत नाही, कारण स्टॉक संपला आहे!`);
                return;
            }
            existing.qty += 1;
        } else {
            cart.push({ ...product, qty: 1 });
        }
        renderCart();
    }

    function renderCart() {
        const tbody = document.getElementById('posCartBody');
        tbody.innerHTML = '';
        
        let subTotal = 0;
        let taxTotal = 0;

        cart.forEach((item, index) => {
            let itemAmount = item.retail_price * item.qty;
            let gstAmount = (itemAmount * (item.gst_percent || 0)) / 100;
            let finalTotal = itemAmount + gstAmount;

            subTotal += itemAmount;
            taxTotal += gstAmount;

            tbody.innerHTML += `
                <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="p-3">${index + 1}</td>
                    <td class="p-3 font-semibold">${item.name} <br><span class="text-xs text-gray-500">${item.sku}</span></td>
                    <td class="p-3">₹${item.retail_price}</td>
                    <td class="p-3">
                        <input type="number" min="1" max="${item.stock}" value="${item.qty}" onchange="updatePosQty(${index}, this.value)" class="w-16 p-1 border rounded dark:bg-gray-700 text-center">
                    </td>
                    <td class="p-3">${item.gst_percent || 0}%</td>
                    <td class="p-3 font-bold">₹${finalTotal.toFixed(2)}</td>
                    <td class="p-3 text-center">
                        <button onclick="removePosItem(${index})" class="text-red-500 font-bold hover:bg-red-100 p-2 rounded">❌</button>
                    </td>
                </tr>
            `;
        });

        const discount = parseFloat(discountInput.value) || 0;
        const grandTotal = (subTotal + taxTotal) - discount;

        document.getElementById('posSubTotal').textContent = `₹${subTotal.toFixed(2)}`;
        document.getElementById('posTax').textContent = `₹${taxTotal.toFixed(2)}`;
        document.getElementById('posGrandTotal').textContent = `₹${Math.max(0, grandTotal).toFixed(2)}`;
    }

    // २. फायनल बिल सेव्ह करणे आणि स्टॉक कमी करणे
    if(saveBillBtn) {
        saveBillBtn.addEventListener('click', async () => {
            if (cart.length === 0) {
                alert('कार्ट रिकामी आहे! कृपया प्रॉडक्ट ॲड करा.');
                return;
            }

            saveBillBtn.innerText = '⏳ सेव्ह करत आहे...';
            saveBillBtn.disabled = true;

            const discount = parseFloat(discountInput.value) || 0;
            const subTotal = cart.reduce((sum, item) => sum + (item.retail_price * item.qty), 0);
            const taxTotal = cart.reduce((sum, item) => sum + (((item.retail_price * item.qty) * (item.gst_percent || 0)) / 100), 0);
            const grandTotal = (subTotal + taxTotal) - discount;
            const invoiceNo = `INV-${Date.now()}`; // ऑटोमॅटिक बिल नंबर

            try {
                // १. Sales टेबलमध्ये बिल सेव्ह करा
                const { data: saleData, error: saleError } = await supabase
                    .from('sales')
                    .insert([{
                        invoice_no: invoiceNo,
                        subtotal: subTotal,
                        tax_amount: taxTotal,
                        discount: discount,
                        grand_total: grandTotal,
                        payment_mode: 'Cash'
                    }])
                    .select()
                    .single();

                if (saleError) throw saleError;

                // २. बिलातील प्रत्येक आयटम सेव्ह करा आणि स्टॉक कमी करा
                for (let item of cart) {
                    // Sales Items मध्ये टाका
                    await supabase.from('sales_items').insert([{
                        sale_id: saleData.id,
                        product_id: item.id,
                        qty: item.qty,
                        price: item.retail_price,
                        total: item.retail_price * item.qty
                    }]);

                    // प्रॉडक्टच्या स्टॉकमधून Qty वजा करा
                    const newStock = item.stock - item.qty;
                    await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
                }

                alert(`✅ बिल यशस्वीरित्या सेव्ह झाले!\nबिल नंबर: ${invoiceNo}`);
                
                // प्रिंटची कमांड द्या
                window.print();

                // कार्ट रिकामी करून नवीन बिलासाठी तयार करा
                cart = [];
                discountInput.value = 0;
                renderCart();
                barcodeInput.focus();

            } catch (err) {
                console.error('Checkout error:', err);
                alert('❌ बिल सेव्ह करताना त्रुटी आली: ' + err.message);
            } finally {
                saveBillBtn.innerText = '🖨️ Save & Print Bill';
                saveBillBtn.disabled = false;
            }
        });
    }

    window.updatePosQty = (index, qty) => {
        let newQty = parseInt(qty);
        if(newQty > cart[index].stock) {
            alert(`स्टॉक उपलब्ध नाही! जास्तीत जास्त ${cart[index].stock} देऊ शकता.`);
            newQty = cart[index].stock;
        }
        cart[index].qty = newQty > 0 ? newQty : 1;
        renderCart();
    };

    window.removePosItem = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    document.getElementById('clearCartBtn').addEventListener('click', () => {
        if(cart.length === 0) return;
        if(confirm('तुम्हाला खरोखरच हे बिल रद्द करायचे आहे का?')) {
            cart = [];
            discountInput.value = 0;
            renderCart();
            barcodeInput.focus();
        }
    });
});
