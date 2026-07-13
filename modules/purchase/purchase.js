// modules/purchase/purchase.js
document.addEventListener('DOMContentLoaded', () => {
    
    // Set today's date default
    document.getElementById('purchase_date').valueAsDate = new Date();

    // Mock Cart State
    let cart = [
        { id: 1, name: "Silk Saree", rate: 1200, qty: 10, gst: 5 },
        { id: 2, name: "Denim Jeans", rate: 500, qty: 20, gst: 12 }
    ];

    function renderCart() {
        const tbody = document.getElementById('purchaseItemsTable');
        tbody.innerHTML = '';
        
        let subTotal = 0;
        let taxTotal = 0;

        cart.forEach((item, index) => {
            let itemTotal = item.rate * item.qty;
            let gstAmount = (itemTotal * item.gst) / 100;
            let finalRowTotal = itemTotal + gstAmount;

            subTotal += itemTotal;
            taxTotal += gstAmount;

            tbody.innerHTML += `
                <tr class="border-b dark:border-gray-700">
                    <td class="p-3 font-semibold">${item.name}</td>
                    <td class="p-3">₹${item.rate}</td>
                    <td class="p-3">
                        <input type="number" min="1" value="${item.qty}" onchange="updateQty(${index}, this.value)" class="w-full p-1 border rounded dark:bg-gray-700">
                    </td>
                    <td class="p-3">${item.gst}%</td>
                    <td class="p-3">₹${finalRowTotal.toFixed(2)}</td>
                    <td class="p-3 text-center">
                        <button onclick="removeItem(${index})" class="text-red-500 font-bold hover:text-red-700">X</button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('subTotal').textContent = `₹${subTotal.toFixed(2)}`;
        document.getElementById('taxTotal').textContent = `₹${taxTotal.toFixed(2)}`;
        document.getElementById('grandTotal').textContent = `₹${(subTotal + taxTotal).toFixed(2)}`;
    }

    // Attach logic to global window for inline onclick access
    window.updateQty = (index, newQty) => {
        cart[index].qty = parseInt(newQty);
        renderCart();
    };

    window.removeItem = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    // Initial render
    renderCart();
});