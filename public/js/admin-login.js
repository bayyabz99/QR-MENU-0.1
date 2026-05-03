// API Base URL
const API_BASE = '/api/admin';

// Token kontrolü - sessionStorage'da token varsa dashboard'a yönlendir
const checkAuth = () => {
    const token = sessionStorage.getItem('adminToken');
    if (token) {
        window.location.href = '/yonetim/dashboard';
    }
};

// Giriş formu
const handleLogin = async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');
    
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Giriş başarısız');
        }
        
        // Token'ı sessionStorage'a kaydet (tarayıcı kapanınca silinir)
        sessionStorage.setItem('adminToken', data.token);
        sessionStorage.setItem('adminUsername', data.username);
        
        // Dashboard'a yönlendir
        window.location.href = '/yonetim/dashboard';
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.add('show');
    }
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

