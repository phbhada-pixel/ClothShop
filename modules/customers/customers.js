// modules/customers/customers.js
document.addEventListener('DOMContentLoaded', () => {
    
    const paymentModal = document.getElementById('paymentModal');
    const closePayModalBtn = document.getElementById('closePayModal');

    closePayModalBtn.addEventListener('click', () => {
        paymentModal.classList.add('hidden');
    });

    // Mock Customer Data
    const customersData = [
        { id: 1, name: 'रमेश पाटील', mobile: '9876543210', total_purchase: 15400, outstanding: 2500 },
        { id: 2, name: 'स्नेहा कुलकर्णी', mobile: '8877665544', total_purchase: 4200, outstanding: 0 },
        { id: 3, name: 'अमित देशमुख', mobile: '7788990011', total_purchase: 28900, outstanding: 12400 }
    ];

    function renderCustomers() {
        const tbody = document.getElementById('customerTableBody');
        tbody.innerHTML = '';

        customersData.forEach(cust => {
            let outClass = cust.outstanding > 0 ? 'text-red-500 font-bold' : 'text-green-500 font-bold';
            
            tbody.innerHTML += `
                <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="p-4 font-semibold">${cust.name}</td>
                    <td class="p-4 text-gray-500">${cust.mobile}</td>
                    <td class="p-4">₹${cust.total_purchase.toFixed(2)}</td>
                    <td class="p-4 text-right ${outClass}">₹${cust.outstanding.toFixed(2)}</td>
                    <td class="p-4 text-center space-x-2">
                        <button class="text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm">Ledger</button>
                        ${cust.outstanding > 0 ? 
                            `<button onclick="openPayment('${cust.name}', ${cust.outstanding})" class="text-white bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-sm font-bold">Receive</button>` 
                            : ''
                        }
                    </td>
                </tr>
            `;
        });
    }

    window.openPayment = (name, amount) => {
        document.getElementById('payCustomerName').innerText = name;
        document.getElementById('payOutstandingAmt').innerText = `₹${amount.toFixed(2)}`;
        paymentModal.classList.remove('hidden');
    };

    renderCustomers();
});