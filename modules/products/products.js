// modules/products/products.js
import { supabase } from '../../js/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('productModal');
    const openModalBtn = document.getElementById('openAddModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('productForm');
    const generateSkuBtn = document.getElementById('generateSkuBtn');

    // Modal Toggle
    const toggleModal = () => modal.classList.toggle('hidden');
    openModalBtn.addEventListener('click', toggleModal);
    closeModalBtn.addEventListener('click', toggleModal);
    cancelBtn.addEventListener('click', toggleModal);

    // Auto Generate SKU
    generateSkuBtn.addEventListener('click', () => {
        const category = document.getElementById('p_category').value.substring(0,3).toUpperCase();
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        document.getElementById('p_sku').value = `${category}-${randomNum}`;
    });

    // Save Product to Supabase
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const productData = {
            name: document.getElementById('p_name').value,
            sku: document.getElementById('p_sku').value,
            hsn_code: document.getElementById('p_hsn').value,
            gst_percent: parseFloat(document.getElementById('p_gst').value),
            purchase_price: parseFloat(document.getElementById('p_purchase_price').value),
            mrp: parseFloat(document.getElementById('p_mrp').value),
            retail_price: parseFloat(document.getElementById('p_retail').value)
            // Note: category_id and brand_id foreign keys need actual UUIDs from categories table in production
        };

        try {
            /* 
            // Uncomment to use actual database insert
            const { data, error } = await supabase.from('products').insert([productData]);
            if (error) throw error; 
            */
            
            alert('प्रॉडक्ट यशस्वीरित्या सेव्ह केले!');
            form.reset();
            toggleModal();
            loadProducts(); // Refresh Table
        } catch (error) {
            console.error(error);
            alert('त्रुटी: ' + error.message);
        }
    });

    // Load Products in Table
    async function loadProducts() {
        const tbody = document.getElementById('productTableBody');
        // Dummy data for preview (Replace with Supabase fetch)
        tbody.innerHTML = `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="p-4">MEN-45210</td>
                <td class="p-4 font-semibold">Cotton Formal Shirt</td>
                <td class="p-4">Men</td>
                <td class="p-4">₹450</td>
                <td class="p-4">₹999</td>
                <td class="p-4"><span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">45 Pcs</span></td>
                <td class="p-4 text-center">
                    <button class="text-blue-500 hover:underline">Edit</button>
                </td>
            </tr>
        `;
    }

    loadProducts();
});