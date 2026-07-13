// js/auth.js
import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    // चेक करा युजर आधीच लॉगिन आहे का
    checkUser();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        loginBtn.textContent = 'प्रक्रिया चालू आहे...';
        loginBtn.disabled = true;
        errorMessage.classList.add('hidden');

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // यशस्वी लॉगिन झाल्यावर डॅशबोर्डवर जा
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorMessage.textContent = 'चुकीचा ईमेल किंवा पासवर्ड!';
            errorMessage.classList.remove('hidden');
        } finally {
            loginBtn.textContent = 'लॉगिन करा';
            loginBtn.disabled = false;
        }
    });
});

async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'dashboard.html';
    }
}