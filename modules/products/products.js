import { supabase } from '../../js/supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('productModal');
    const openModalBtn = document.getElementById('openAddModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('productForm');
    const generateSkuBtn = document.getElementById('generateSkuBtn');
    const tbody = document.getElementById('productTableBody');

    // Modal उघडणे आणि बंद करणे
    const toggleModal = () => modal.classList.toggle('hidden');
    openModalBtn.addEventListener('click', toggleModal);
    closeModalBtn.addEventListener('click', toggleModal);
    cancelBtn.addEventListener('click', toggleModal);

    // Auto Generate SKU (उदा. MEN-45812)
    generateSkuBtn.addEventListener('click', () => {
        const category = document.getElementById('p_category').value.substring(0, 3).toUpperCase();
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        document.getElementById('p_sku').value = `${category}-${randomNum}`;
    });

    // १. डेटाबेसमध्ये नवीन प्रॉडक्ट सेव्ह करणे (Insert Data)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // फॉर्ममधील डेटा गोळा करणे
        const productData = {
            name: document.getElementById('p_name').value,
            sku: document.getElementById('p_sku').value,
            hsn_code: document.getElementById('p_hsn').value,
            gst_percent: parseFloat(document.getElementById('p_gst').value),
            purchase_price: parseFloat(document.getElementById('p_purchase_price').value),
            mrp: parseFloat(document.getElementById('p_mrp').value),
            retail_price: parseFloat(document.getElementById('p_retail').value)
        };

        try {
            // Supabase च्या 'products' टेबलमध्ये डेटा इन्सर्ट करणे
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

    // २. डेटाबेसमधून प्रॉडक्ट्स लोड करणे (Fetch Data)
    async function loadProducts() {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-500">प्रॉडक्ट्स लोड होत आहेत... (Loading...)</td></tr>`;

        try {
            // Supabase मधून सर्व प्रॉडक्ट्स आणणे (नवीन प्रॉडक्ट सर्वात वर दिसण्यासाठी order by वापरले आहे)
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

            // डेटाबेस मधून आलेले प्रॉडक्ट्स टेबलमध्ये दाखवणे
            products.forEach(p => {
                // नफा (Profit) काढण्याचे उदाहरण
                let profitAmt = p.retail_price - p.purchase_price;

                tbody.innerHTML += `
                    <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td class="p-4 font-mono text-sm dark:text-gray-300">${p.sku}</td>
                        <td class="p-4 font-semibold text-gray-800 dark:text-white">${p.name}</td>
                        <td class="p-4 text-gray-500 dark:text-gray-400">${p.hsn_code || '-'}</td>
                        <td class="p-4 text-gray-600 dark:text-gray-300">₹${p.purchase_price}</td>
                        <td class="p-4 text-gray-800 dark:text-gray-200">₹${p.mrp}</td>
                        <td class="p-4">
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold">
                                +₹${profitAmt} नफा
                            </span>
                        </td>
                        <td class="p-4 text-center">
                            <button class="text-blue-500 hover:underline">Edit</button>
                            <button onclick="deleteProduct('${p.id}')" class="text-red-500 hover:underline ml-2">Delete</button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error('Error fetching products:', error.message);
            tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">डेटा लोड करताना त्रुटी आली!</td></tr>`;
        }
    }

    // ३. प्रॉडक्ट डिलीट करण्याचे फंक्शन (Global scope मध्ये ठेवले जेणेकरून HTML मधून कॉल करता येईल)
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

    // पेज लोड झाल्यावर प्रॉडक्ट्स दाखवा
    loadProducts();
});
