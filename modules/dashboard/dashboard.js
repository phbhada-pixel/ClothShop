import { supabase } from '../../js/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // १. युजर ऑथेंटिकेशन चेक करा
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    // युजरचा ईमेल टॉपबारवर दाखवा
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = session.user.email;
    }

    // लॉगआउट फंक्शन
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        });
    }

    // २. रिअल-टाइम डॅशबोर्ड डेटा लोड करा
    await loadDashboardStats();
    await renderChart();
});

// ----------------------------------------------------
// डॅशबोर्डचे आकडे (Stats) कॅल्क्युलेट करणे
// ----------------------------------------------------
async function loadDashboardStats() {
    try {
        // आजची तारीख आणि वेळ सेट करणे (पहाटे 00:00:00 पासून)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // ------------------------------------------------
        // १. आजची एकूण विक्री (Today's Sales)
        // ------------------------------------------------
        const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select('grand_total')
            .gte('created_at', todayISO); // आजच्या तारखेनंतरचे सर्व बिल्स

        if (salesError) throw salesError;

        const todaySales = salesData.reduce((sum, sale) => sum + parseFloat(sale.grand_total), 0);
        document.getElementById('todaySales').textContent = `₹${todaySales.toFixed(2)}`;

        // ------------------------------------------------
        // २. आजचा नफा (Today's Profit)
        // ------------------------------------------------
        // नफा = विक्री किंमत - खरेदी किंमत
        const { data: profitData, error: profitError } = await supabase
            .from('sales_items')
            .select('qty, price, products(purchase_price), sales!inner(created_at)')
            .gte('sales.created_at', todayISO);

        if (profitError) throw profitError;

        let todayProfit = 0;
        profitData.forEach(item => {
            const purchasePrice = item.products?.purchase_price || 0;
            const salePrice = item.price;
            const profitPerItem = salePrice - purchasePrice;
            todayProfit += (profitPerItem * item.qty);
        });
        
        document.getElementById('todayProfit').textContent = `₹${todayProfit.toFixed(2)}`;

        // ------------------------------------------------
        // ३. स्टॉक व्हॅल्यू आणि Low Stock Alerts
        // ------------------------------------------------
        const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('stock, purchase_price');

        if (productsError) throw productsError;

        let totalStockValue = 0;
        let lowStockCount = 0;

        productsData.forEach(product => {
            if (product.stock > 0) {
                totalStockValue += (product.stock * product.purchase_price);
            }
            if (product.stock <= 5) {
                lowStockCount++; // जर स्टॉक 5 किंवा त्याहून कमी असेल
            }
        });

        document.getElementById('stockValue').textContent = `₹${totalStockValue.toFixed(2)}`;
        document.getElementById('lowStockAlerts').textContent = lowStockCount;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// ----------------------------------------------------
// मागील ७ दिवसांचा चार्ट (Graph) बनवणे
// ----------------------------------------------------
async function renderChart() {
    try {
        const labels = [];
        const salesDataArray = [];

        // मागील ७ दिवसांच्या तारखा काढणे
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);

            // तारखेचे स्वरूप (उदा. 14 Jul)
            labels.push(d.toLocaleDateString('mr-IN', { day: 'numeric', month: 'short' }));

            // त्या विशिष्ट दिवसाची विक्री डेटाबेसमधून आणणे
            const { data, error } = await supabase
                .from('sales')
                .select('grand_total')
                .gte('created_at', d.toISOString())
                .lt('created_at', nextDay.toISOString());

            if (!error && data) {
                const dayTotal = data.reduce((sum, sale) => sum + parseFloat(sale.grand_total), 0);
                salesDataArray.push(dayTotal);
            } else {
                salesDataArray.push(0);
            }
        }

        // Chart.js वापरून ग्राफ अपडेट करणे
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'विक्री (Sales ₹)',
                    data: salesDataArray,
                    borderColor: '#3b82f6', // Tailwind blue-500
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
}
