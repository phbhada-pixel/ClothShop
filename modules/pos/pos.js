// modules/pos/pos.js
document.addEventListener('DOMContentLoaded', () => {
    
    // Live Clock Display
    setInterval(() => {
        document.getElementById('currentDateTime').innerText = new Date().toLocaleString('mr-IN');
    }, 1000);

    let cart = [];
    const barcodeInput = document.getElementById('barcodeInput');
    const discountInput = document.getElementById('posDiscount');
    
    // Simulated Product Database (In reality, fetch from Supabase)
    const productsDB = {
        '1001': { name: 'Men Cotton Shirt', price: 850, gst: 5 },
        '1002': { name: 'Blue Denim Jeans', price: 1200, gst: 12 },
        '1003': { name: 'Women Kurti', price: 650, gst: 5 }
    };

    // Handle Barcode Scan (Enter key press)
    barcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const code = barcodeInput.value.trim();
            if (code && productsDB[code]) {
                addToCart(code, productsDB[code]);
                barcodeInput.value = ''; // clear input
            } else if (code) {
                alert('प्रॉडक्ट सापडले नाही!');
                barcodeInput.value = '';
            }
        }
    });

    discountInput.addEventListener('input', renderCart);

    function addToCart(code, product) {
        // Check if already in cart
        const existing = cart.find(item => item.code === code);
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ ...product, code: code, qty: 1 });
        }
        renderCart();
    }

    function renderCart() {
        const tbody = document.getElementById('posCartBody');
        tbody.innerHTML = '';
        
        let subTotal = 0;
        let taxTotal = 0;

        cart.forEach((item, index) => {
            let itemAmount = item.price * item.qty;
            let gstAmount = (itemAmount * item.gst) / 100;
            let finalTotal = itemAmount + gstAmount;

            subTotal += itemAmount;
            taxTotal += gstAmount;

            tbody.innerHTML += `
                <tr class="border-b dark:border-gray-700">
                    <td class="p-3">${index + 1}</td>
                    <td class="p-3 font-semibold">${item.name}</td>
                    <td class="p-3">₹${item.price}</td>
                    <td class="p-3">
                        <input type="number" min="1" value="${item.qty}" onchange="updatePosQty(${index}, this.value)" class="w-16 p-1 border rounded dark:bg-gray-700 text-center">
                    </td>
                    <td class="p-3">${item.gst}%</td>
                    <td class="p-3">₹${finalTotal.toFixed(2)}</td>
                    <td class="p-3 text-center">
                        <button onclick="removePosItem(${index})" class="text-red-500 font-bold hover:bg-red-100 p-1 rounded">X</button>
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

    // Global Functions for Inline HTML handlers
    window.updatePosQty = (index, qty) => {
        if(qty < 1) return;
        cart[index].qty = parseInt(qty);
        renderCart();
    };

    window.removePosItem = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    document.getElementById('clearCartBtn').addEventListener('click', () => {
        if(confirm('तुम्हाला खरोखरच बिल रद्द करायचे आहे का?')) {
            cart = [];
            discountInput.value = 0;
            renderCart();
            barcodeInput.focus();
        }
    });
});