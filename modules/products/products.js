import { supabase } from '../../js/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('productModal');
    const openModalBtn = document.getElementById('openAddModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('productForm');
    const generateSkuBtn = document.getElementById('generateSkuBtn');
    const tbody = document.getElementById('productTableBody');

    // १. Modal उघडणे आणि बंद करणे
    const toggleModal = () => modal.classList.toggle('hidden');
    if(openModalBtn) openModalBtn.addEventListener('click', toggleModal);
    if(closeModalBtn) closeModalBtn.addEventListener('click', toggleModal);
    if(cancelBtn) cancelBtn.addEventListener('click', toggleModal);

    // २. Auto Generate SKU
    if(generateSkuBtn) {
        generateSkuBtn.addEventListener('click', () => {
            const category = document.getElementById('p_category').value.substring(0, 3).toUpperCase();
            const randomNum = Math.floor(10000 + Math.random() * 90000);
            document.getElementById('p_sku').value = `${category}-${randomNum}`;
        });
    }

    // ३. डेटाबेसमध्ये नवीन प्रॉडक्ट सेव्ह करणे (Insert Data)
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // फॉर्ममधील डेटा गोळा करणे (Quantity/Stock सह)
            const productData = {
                name: document.getElementById('p_name').value,
                sku: document.getElementById('p_sku').value,
                hsn_code: document.getElementById('p_hsn').value,
                gst_percent: parseFloat(document.getElementById('p_gst').value) || 0,
                purchase_price: parseFloat(document.getElementById('p_purchase_price').value) || 0,
                mrp: parseFloat(document.getElementById('p_mrp').value) || 0,
                retail_price: parseFloat(document.getElementById('p_retail').value) || 0,
                stock: parseInt(document.getElementById('p_stock').value) || 0
            };

            try {
                // Supabase च्या 'products' टेबलमध्ये इन्सर्ट करणे
                const { data, error } = await supabase
                    .from('products')
                    .insert([productData]);

                if (error) throw error; 

                alert('✅ प्रॉडक्ट यशस्वीरित्या डेटाबेसमध्ये सेव्ह केले!');
                form.reset(); // फॉर्म रिकामा करा
                toggleModal(); // पॉप-अप बंद करा
                loadProducts(); // टेबल रिफ्रेश करून नवीन प्रॉडक्ट दाखवा
                
            } catch (error) {
                console.error('Error saving product:', error.message);
                alert('❌ त्रुटी: प्रॉडक्ट सेव्ह होऊ शकले नाही. ' + error.message);
            }
        });
    }

    // ४. डेटाबेसमधून प्रॉडक्ट्स लोड करणे (Fetch Data)
    async function loadProducts() {
        if(!tbody) return;
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">प्रॉडक्ट्स लोड होत आहेत... (Loading...)</td></tr>`;

        try {
            const { data: products, error } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            tbody.innerHTML = ''; // लोडिंग मेसेज काढा

            // जर डेटाबेसमध्ये प्रॉडक्ट्स नसतील
            if (products.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500 dark:text-gray-400">अद्याप कोणतेही प्रॉडक्ट जोडलेले नाही.</td></tr>`;
                return;
            }

            // टेबलमध्ये प्रॉडक्ट्स आणि स्टॉक दाखवणे
            products.forEach(p => {
                let profitAmt = p.retail_price - p.purchase_price;
                
                // स्टॉकनुसार हिरवा किंवा लाल रंग
                let stockBadge = p.stock > 5 
                    ? `<span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">${p.stock} Pcs</span>` 
                    : `<span class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-bold">${p.stock} Pcs (Low)</span>`;

                tbody.innerHTML += `
                    <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td class="p-4 font-mono text-sm dark:text-gray-300">${p.sku}</td>
                        <td class="p-4 font-semibold text-gray-800 dark:text-white">${p.name}</td>
                        <td class="p-4 text-green-600 font-bold">+₹${profitAmt} नफा</td>
                        <td class="p-4 text-gray-600 dark:text-gray-300">₹${p.purchase_price}</td>
                        <td class="p-4 text-gray-800 dark:text-gray-200">₹${p.mrp}</td>
                        <td class="p-4">${stockBadge}</td>
                        <td class="p-4 text-center">
                            <button onclick="deleteProduct('${p.id}')" class="text-red-500 hover:bg-red-50 px-3 py-1 rounded font-bold border border-red-200">Delete</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error('Error fetching products:', error.message);
            tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">डेटा लोड करताना त्रुटी आली!</td></tr>`;
        }
    }

    // ५. प्रॉडक्ट डिलीट करण्याचे फंक्शन
    window.deleteProduct = async (id) => {
        if(confirm('तुम्हाला खरोखरच हे प्रॉडक्ट डिलीट करायचे आहे का?')) {
            try {
                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', id);
                    
                if (error) throw error;
                
                alert('🗑️ प्रॉडक्ट डिलीट झाले!');
                loadProducts(); // टेबल रिफ्रेश करा
            } catch (error) {
                alert('❌ प्रॉडक्ट डिलीट होऊ शकले नाही: ' + error.message);
            }
        }
    };

    // पेज लोड झाल्यावर लगेच प्रॉडक्ट्स दाखवा
    loadProducts();
});
