// modules/inventory/inventory.js
document.addEventListener('DOMContentLoaded', () => {
    
    const adjustmentModal = document.getElementById('adjustmentModal');
    const closeAdjModalBtn = document.getElementById('closeAdjModal');

    closeAdjModalBtn.addEventListener('click', () => {
        adjustmentModal.classList.add('hidden');
    });

    // Mock Inventory Data
    const inventoryData = [
        { sku: 'MEN-1001', name: 'Cotton Formal Shirt - White', rack: 'Rack A1', stock: 150 },
        { sku: 'WOM-2045', name: 'Silk Saree - Red', rack: 'Rack B3', stock: 5 }, // Low Stock
        { sku: 'KID-3090', name: 'Boys Denim Jeans', rack: 'Rack C2', stock: 0 }  // Out of stock
    ];

    function renderInventory() {
        const tbody = document.getElementById('inventoryTableBody');
        tbody.innerHTML = '';

        inventoryData.forEach(item => {
            // Determine status and color based on stock count
            let statusBadge = '';
            if (item.stock > 10) {
                statusBadge = `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">In Stock</span>`;
            } else if (item.stock > 0) {
                statusBadge = `<span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">Low Stock</span>`;
            } else {
                statusBadge = `<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">Out of Stock</span>`;
            }

            tbody.innerHTML += `
                <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td class="p-4 font-mono text-sm">${item.sku}</td>
                    <td class="p-4 font-semibold">${item.name}</td>
                    <td class="p-4 text-gray-500">${item.rack}</td>
                    <td class="p-4 font-bold text-lg">${item.stock}</td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4 text-center">
                        <button onclick="openAdjustment('${item.name}')" class="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded shadow-sm border border-blue-200">
                            Adjust
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // Global function for modal
    window.openAdjustment = (productName) => {
        document.getElementById('adjProductName').innerText = productName;
        adjustmentModal.classList.remove('hidden');
    };

    renderInventory();
});