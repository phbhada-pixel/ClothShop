// modules/employees/employees.js
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('employeeModal');
    
    document.getElementById('openEmpModalBtn').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });
    
    document.getElementById('closeEmpModal').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    const employees = [
        { name: 'सचिन जोशी (मालक)', email: 'admin@shop.com', role: 'Admin', status: true },
        { name: 'प्रिया पाटील', email: 'priya.pos@shop.com', role: 'Cashier', status: true },
        { name: 'राहुल शर्मा', email: 'rahul@shop.com', role: 'Salesman', status: false }
    ];

    function renderEmployees() {
        const tbody = document.getElementById('employeeTableBody');
        tbody.innerHTML = '';
        employees.forEach(emp => {
            let roleBadge = emp.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
            let statusBadge = emp.status ? '<span class="text-green-500 font-bold">Active</span>' : '<span class="text-red-500 font-bold">Inactive</span>';
            
            tbody.innerHTML += `
                <tr class="border-b dark:border-gray-700">
                    <td class="p-4 font-semibold text-gray-800 dark:text-gray-200">${emp.name}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-400">${emp.email}</td>
                    <td class="p-4"><span class="${roleBadge} px-2 py-1 rounded text-xs font-bold">${emp.role}</span></td>
                    <td class="p-4">${statusBadge}</td>
                    <td class="p-4 text-center">
                        <button class="text-blue-500 hover:underline">Edit</button>
                    </td>
                </tr>
            `;
        });
    }

    renderEmployees();
});