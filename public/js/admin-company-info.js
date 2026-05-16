// Include common functions
const API_BASE = '/api/admin';

// Get auth headers
const getAuthHeaders = () => {
    const token = sessionStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Show notification
const showNotification = (message, type = 'success') => {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

// Check auth
const checkAuth = () => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/yonetim';
        return false;
    }
    return true;
};

// Generate QR Code
const generateQRCode = (url, canvasId) => {
    if (typeof QRCode === 'undefined') return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    QRCode.toCanvas(canvas, url, { width: 250, margin: 2 }, (error) => {
        if (error) console.error('QR Code error:', error);
    });
};

// Generate QR Code from URL input
const generateQRFromUrl = () => {
    const urlInput = document.getElementById('menuUrl');
    if (!urlInput || !urlInput.value.trim()) {
        showNotification('Lütfen bir URL girin!', 'error');
        return;
    }
    
    const url = urlInput.value.trim();
    const canvas = document.getElementById('qrCodeCanvas');
    const preview = document.getElementById('qrCodePreview');
    const imagePreview = document.getElementById('qrCodeImagePreview');
    const removeBtn = document.getElementById('removeQRBtn');
    
    if (typeof QRCode === 'undefined') {
        showNotification('QR Code kütüphanesi yüklenemedi!', 'error');
        return;
    }
    
    // Canvas'ı göster
    canvas.style.display = 'block';
    imagePreview.style.display = 'none';
    
    QRCode.toCanvas(canvas, url, { width: 250, margin: 2 }, (error) => {
        if (error) {
            console.error('QR Code error:', error);
            showNotification('QR kod oluşturulurken hata oluştu!', 'error');
        } else {
            showNotification('QR kod başarıyla oluşturuldu!', 'success');
            // QR kod görseli yüklüyse kaldır
            document.getElementById('qrCodeImage').value = '';
        }
    });
};

// Remove QR Code Image
const removeQRCodeImage = () => {
    document.getElementById('qrCodeImage').value = '';
    document.getElementById('qrCodeImagePreview').src = '';
    document.getElementById('qrCodeImagePreview').style.display = 'none';
    document.getElementById('qrCodeCanvas').style.display = 'block';
    document.getElementById('removeQRBtn').style.display = 'none';
    const preview = document.getElementById('qrCodePreview');
    preview.querySelector('i').style.display = 'block';
    preview.querySelectorAll('p')[0].style.display = 'block';
    preview.querySelectorAll('p')[1].style.display = 'block';
};

// Copy URL
const copyUrl = () => {
    const urlInput = document.getElementById('menuUrl');
    if (urlInput) {
        urlInput.select();
        document.execCommand('copy');
        showNotification('URL kopyalandı!', 'success');
    }
};

// View URL
const viewUrl = () => {
    const urlInput = document.getElementById('menuUrl');
    if (urlInput) window.open(urlInput.value, '_blank');
};

// Download QR
const downloadQR = () => {
    const canvas = document.getElementById('qrCodeCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = canvas.toDataURL();
    link.click();
};

// Load settings
const loadSettings = async () => {
    try {
        const response = await fetch(`${API_BASE}/settings`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Ayarlar yüklenemedi');
        
        const settings = await response.json();
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });

        // Fill form
        if (settingsObj.restaurant_name || settingsObj.company_name) {
            document.getElementById('companyName').value = settingsObj.restaurant_name || settingsObj.company_name;
        }
        if (settingsObj.restaurant_slogan || settingsObj.company_slogan) {
            document.getElementById('companySlogan').value = settingsObj.restaurant_slogan || settingsObj.company_slogan;
        }
        if (settingsObj.restaurant_logo || settingsObj.company_logo) {
            const preview = document.getElementById('logoPreview');
            preview.innerHTML = `<img src="${settingsObj.restaurant_logo || settingsObj.company_logo}" alt="Logo">`;
        }
        if (settingsObj.restaurant_icon || settingsObj.company_icon) {
            const preview = document.getElementById('iconPreview');
            preview.innerHTML = `<img src="${settingsObj.restaurant_icon || settingsObj.company_icon}" alt="Icon">`;
        }
        if (settingsObj.menu_url) {
            document.getElementById('menuUrl').value = settingsObj.menu_url;
        }
        if (settingsObj.admin_brand_text) {
            const brandInput = document.getElementById('adminBrandText');
            if (brandInput) brandInput.value = settingsObj.admin_brand_text;
        }
        
        // QR kod görseli varsa göster
        if (settingsObj.qr_code_image) {
            const imagePreview = document.getElementById('qrCodeImagePreview');
            const canvas = document.getElementById('qrCodeCanvas');
            const removeBtn = document.getElementById('removeQRBtn');
            const preview = document.getElementById('qrCodePreview');
            
            imagePreview.src = settingsObj.qr_code_image;
            imagePreview.style.display = 'block';
            canvas.style.display = 'none';
            removeBtn.style.display = 'block';
            preview.querySelector('i').style.display = 'none';
            preview.querySelectorAll('p')[0].style.display = 'none';
            preview.querySelectorAll('p')[1].style.display = 'none';
        } else if (settingsObj.menu_url) {
            // URL varsa ama görsel yoksa QR kod oluştur
            generateQRCode(settingsObj.menu_url, 'qrCodeCanvas');
        }
    } catch (error) {
        console.error('Settings load error:', error);
    }
};

// Update settings
const updateSettings = async () => {
    try {
        const formData = new FormData();
        const companyName = document.getElementById('companyName').value;
        const companySlogan = document.getElementById('companySlogan').value;
        const adminBrandText = document.getElementById('adminBrandText')?.value || '';
        formData.append('company_name', companyName);
        formData.append('restaurant_name', companyName);
        formData.append('slogan', companySlogan);
        formData.append('restaurant_slogan', companySlogan);
        formData.append('admin_brand_text', adminBrandText);
        formData.append('menu_url', document.getElementById('menuUrl').value);

        const logoFile = document.getElementById('companyLogo').files[0];
        const iconFile = document.getElementById('companyIcon').files[0];
        const qrCodeFile = document.getElementById('qrCodeImage').files[0];

        if (logoFile) formData.append('logo', logoFile);
        if (iconFile) formData.append('icon', iconFile);
        if (qrCodeFile) formData.append('qr_code_image', qrCodeFile);
        
        // Eğer QR kod görseli yoksa ve URL varsa, canvas'tan QR kod oluştur
        if (!qrCodeFile && document.getElementById('menuUrl').value.trim()) {
            const canvas = document.getElementById('qrCodeCanvas');
            if (canvas && canvas.style.display !== 'none') {
                canvas.toBlob((blob) => {
                    if (blob) {
                        formData.append('qr_code_image', blob, 'qr-code.png');
                        sendUpdateRequest(formData);
                    } else {
                        sendUpdateRequest(formData);
                    }
                }, 'image/png');
                return;
            }
        }

        sendUpdateRequest(formData);
    } catch (error) {
        console.error('Update error:', error);
        showNotification('Hata: ' + error.message, 'error');
    }
};

// Send update request
const sendUpdateRequest = async (formData) => {
    try {
        const token = sessionStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE}/settings/company`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Ayarlar güncellenemedi');

        showNotification('Ayarlar başarıyla güncellendi!', 'success');
        setTimeout(() => location.reload(), 1000);
    } catch (error) {
        console.error('Update error:', error);
        showNotification('Hata: ' + error.message, 'error');
    }
};

// Image preview handlers
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    // Logo upload
    const logoArea = document.getElementById('logoUploadArea');
    const logoInput = document.getElementById('companyLogo');
    const logoPreview = document.getElementById('logoPreview');

    logoArea.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Icon upload
    const iconArea = document.getElementById('iconUploadArea');
    const iconInput = document.getElementById('companyIcon');
    const iconPreview = document.getElementById('iconPreview');

    iconArea.addEventListener('click', () => iconInput.click());
    iconInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                iconPreview.innerHTML = `<img src="${e.target.result}" alt="Icon">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // QR Code Image upload
    const qrCodeArea = document.getElementById('qrCodeUploadArea');
    const qrCodeInput = document.getElementById('qrCodeImage');
    const qrCodeImagePreview = document.getElementById('qrCodeImagePreview');
    const qrCodeCanvas = document.getElementById('qrCodeCanvas');
    const removeQRBtn = document.getElementById('removeQRBtn');
    const preview = document.getElementById('qrCodePreview');

    qrCodeArea.addEventListener('click', () => qrCodeInput.click());
    qrCodeInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                qrCodeImagePreview.src = e.target.result;
                qrCodeImagePreview.style.display = 'block';
                qrCodeCanvas.style.display = 'none';
                removeQRBtn.style.display = 'block';
                preview.querySelector('i').style.display = 'none';
                preview.querySelectorAll('p')[0].style.display = 'none';
                preview.querySelectorAll('p')[1].style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });

    // URL değiştiğinde QR kod oluşturma seçeneği sun
    const menuUrl = document.getElementById('menuUrl');
    if (menuUrl) {
        menuUrl.addEventListener('input', () => {
            // URL değiştiğinde otomatik QR kod oluşturma yerine buton göster
            // Kullanıcı isterse butona tıklayarak oluşturabilir
        });
    }

    // Load settings
    loadSettings();
});

