// File: static/user/login.js
const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission
            handleLogin();
        });
    }
});

async function handleLogin() {
    const email = document.getElementById('log-email').value;
    const password = document.getElementById('log-password').value;

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    });

    if (res.ok) {
        const data = await res.json();
        localStorage.setItem('user_token', data.token);
        // Redirect to the correct dashboard path, which is now served from /static/user/
        window.location.href = '/static/user/index.html'; 
    } else {
        alert('Error logging in. Please check your credentials.');
    }
}