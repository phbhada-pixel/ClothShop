// modules/dashboard/dashboard.js
import { supabase } from '../../js/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // १. युजर ऑथेंटिकेशन चेक करा
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = session.user.email;

    // लॉगआउट फंक्शन
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    });

    // २. डॅशबोर्ड डेटा लोड करा (Dummy/Real logic)
    loadDashboardStats();
    renderChart();
});

async function loadDashboardStats() {
    // प्रत्यक्ष प्रोजेक्टमध्ये इथे Supabase Database क्वेरीज येतील
    // उदाहरणार्थ: await supabase.from('sales').select('total_amount').eq('date', today);
    
    // सध्या UI टेस्टिंगसाठी आपण स्टॅटिक डेटा दाखवू:
    document.getElementById('todaySales').textContent = '₹12,450.00';
    document.getElementById('todayProfit').textContent = '₹3,200.00';
    document.getElementById('stockValue').textContent = '₹5,40,000.00';
    document.getElementById('lowStockAlerts').textContent = '14';
}

function renderChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'],
            datasets: [{
                label: 'विक्री (Sales ₹)',
                data: [5000, 7500, 6000, 9200, 11000, 15000, 12450],
                borderColor: '#3b82f6', // Tailwind blue-500
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}