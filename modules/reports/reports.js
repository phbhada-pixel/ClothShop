// modules/reports/reports.js
document.addEventListener('DOMContentLoaded', () => {
    
    // Render Category Pie Chart
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Men (पुरुष)', 'Women (महिला)', 'Kids (लहान मुले)', 'Accessories'],
            datasets: [{
                label: 'Sales ₹',
                data: [120000, 150000, 50000, 25000],
                backgroundColor: [
                    '#3b82f6', // blue
                    '#ec4899', // pink
                    '#f59e0b', // yellow
                    '#10b981'  // green
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#6b7280' } // Adjust for dark mode if needed
                }
            }
        }
    });
});