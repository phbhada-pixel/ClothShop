// modules/settings/settings.js
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    themeToggleBtn.addEventListener('click', () => {
        if (htmlElement.classList.contains('dark')) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerHTML = '🌙 Dark Mode';
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerHTML = '☀️ Light Mode';
        }
    });

    // Set initial button text
    if (localStorage.getItem('theme') === 'dark') {
        themeToggleBtn.innerHTML = '☀️ Light Mode';
    } else {
        themeToggleBtn.innerHTML = '🌙 Dark Mode';
    }
});