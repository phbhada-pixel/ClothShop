import { supabase } from '../../js/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // घड्याळ (Live Clock)
    setInterval(() => {
        document.getElementById('currentDateTime').innerText = new Date().toLocaleString('mr-IN');
    }, 1000);

    let cart = [];
    const barcodeInput = document.getElementById('barcodeInput');
    const discountInput = document.getElementById('posDiscount');
    
    // १. बारकोड स्कॅन केल्यावर / Enter दाबल्यावर डेटाबेसमधून प्रॉडक्ट शोधणे
    barcodeInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const code = barcodeInput.value.trim();
            if (code) {
                await searchProductFromDB(code);
                barcodeInput.value = ''; // इनपुट बॉक्स रिकामा करा
                barcodeInput.focus();
            }
        }
    });

    discountInput.addEventListener('input', renderCart);

    // Supabase मधून प्रॉडक्ट आणण्याचे फंक्शन
    async function searchProductFromDB(code) {
        try {
            // SKU किंवा Barcode दोन्हीने शोधण्याची सोय
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .or(`sku.eq.${code},barcode.eq.${code}`)
                .single(); // फक्त एकच प्रॉडक्ट घ्या

            if (error || !data) {
                alert('❌ प्रॉडक्ट सापडले नाही! कृपया SKU बरोबर आहे का ते तपासा.');
                return;
            }

            addToCart(data);
        } catch (err) {
            console.error('Search error:', err);
            alert('❌ प्रॉडक्ट शोधताना त्रुटी आली.');
        }
    }

    // २. प्रॉडक्ट कार्टमध्ये (बिलात) जोडणे
    function addToCart(product) {
        // जर प्रॉडक्ट आधीच बिलात असेल, तर फक्त Qty वाढवा
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ ...product, qty: 1 });
        }
        renderCart();
    }

    // ३. बिल कॅल्क्युलेट करणे आणि स्क्रीनवर दाखवणे
    function renderCart() {
        const tbody = document.getElementById('posCartBody');
        tbody.innerHTML = '';
        
        let subTotal = 0;
        let taxTotal = 0;

        cart.forEach((item, index) => {
            // retail_price (विक्री किंमत) वापरून हिशोब
            let itemAmount = item.retail_price * item.qty;
            let gstAmount = (itemAmount * (item.gst_percent || 0)) / 100;
            let finalTotal = itemAmount + gstAmount;

            subTotal += itemAmount;
            taxTotal += gstAmount;

            tbody.innerHTML += `
                <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="p-3">${index + 1}</td>
                    <td class="p-3 font-semibold">
                        ${item.name} <br>
                        <span class="text-xs text-gray-500">${item.sku}</span>
                    </td>
                    <td class="p-3">₹${item.retail_price}</td>
                    <td class="p-3">
                        <input type="number" min="1" value="${item.qty}" onchange="updatePosQty(${index}, this.value)" class="w-16 p-1 border rounded dark:bg-gray-700 text-center focus:outline-none focus:border-blue-500">
                    </td>
                    <td class="p-3">${item.gst_percent || 0}%</td>
                    <td class="p-3 font-bold text-gray-700 dark:text-gray-300">₹${finalTotal.toFixed(2)}</td>
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

    // ग्लोबल फंक्शन्स (HTML मधून कॉल करण्यासाठी)
    window.updatePosQty = (index, qty) => {
        if(qty < 1) return;
        cart[index].qty = parseInt(qty);
        renderCart();
    };

    window.removePosItem = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    // संपूर्ण बिल रद्द करणे
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
