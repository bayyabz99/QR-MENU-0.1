const API_BASE = '/api/admin';

const getAuthHeaders = () => {
    const token = sessionStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

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

const checkAuth = () => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/yonetim';
        return false;
    }
    return true;
};

const generateQRCode = (url, canvasId) => {
    if (typeof QRCode === 'undefined') return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    QRCode.toCanvas(canvas, url, { width: 250, margin: 2 }, (error) => {
        if (error) console.error('QR Code error:', error);
    });
};

const copyUrl = () => {
    const urlInput = document.getElementById('menuUrl');
    if (urlInput) {
        urlInput.select();
        document.execCommand('copy');
        showNotification('URL kopyalandı!', 'success');
    }
};

const viewUrl = () => {
    const urlInput = document.getElementById('menuUrl');
    if (urlInput) window.open(urlInput.value, '_blank');
};

const downloadQR = () => {
    const canvas = document.getElementById('qrCodeCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = canvas.toDataURL();
    link.click();
};

let allProducts = [];
let selectedProductIds = [];

const loadProducts = async () => {
    try {
        const response = await fetch(`${API_BASE}/products`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Ürünler yüklenemedi');
        
        allProducts = await response.json();
        renderAvailableProducts();
    } catch (error) {
        console.error('Load error:', error);
    }
};

const loadPromotions = async () => {
    try {
        const response = await fetch(`${API_BASE}/promotions`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Tanıtım alanları yüklenemedi');
        
        const promotion = await response.json();
        
        if (promotion.title_tr) {
            document.getElementById('chefPicksTitleTr').value = promotion.title_tr;
        }
        if (promotion.title_en) {
            document.getElementById('chefPicksTitleEn').value = promotion.title_en;
        }
        if (promotion.product_ids) {
            selectedProductIds = promotion.product_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
            renderSelectedProducts();
        }
    } catch (error) {
        console.error('Load error:', error);
    }
};

const renderAvailableProducts = () => {
    const list = document.getElementById('availableProductsList');
    const available = allProducts.filter(p => !selectedProductIds.includes(p.id));
    
    list.innerHTML = available.map(product => `
        <div class="product-item" onclick="addProduct(${product.id})">
            ${product.name}
        </div>
    `).join('');
};

const renderSelectedProducts = () => {
    const list = document.getElementById('selectedProductsList');
    const selected = allProducts.filter(p => selectedProductIds.includes(p.id));
    
    list.innerHTML = selected.map(product => `
        <div class="product-item" onclick="removeProduct(${product.id})">
            ${product.name}
        </div>
    `).join('');
    
    renderAvailableProducts();
};

const addProduct = (productId) => {
    if (!selectedProductIds.includes(productId)) {
        selectedProductIds.push(productId);
        renderSelectedProducts();
    }
};

const removeProduct = (productId) => {
    selectedProductIds = selectedProductIds.filter(id => id !== productId);
    renderSelectedProducts();
};

const moveProductUp = () => {
    // Implementation for moving products up
    showNotification('Sıralama özelliği yakında eklenecek', 'info');
};

const moveProductDown = () => {
    // Implementation for moving products down
    showNotification('Sıralama özelliği yakında eklenecek', 'info');
};

const updatePromotions = async () => {
    try {
        const data = {
            title_tr: document.getElementById('chefPicksTitleTr').value,
            title_en: document.getElementById('chefPicksTitleEn').value,
            product_ids: selectedProductIds.join(',')
        };
        
        // Menu URL'i de ekle
        const menuUrl = document.getElementById('menuUrl');
        if (menuUrl && menuUrl.value) {
            data.menu_url = menuUrl.value;
        }

        const response = await fetch(`${API_BASE}/promotions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Tanıtım alanları güncellenemedi');

        showNotification('Tanıtım alanları başarıyla güncellendi!', 'success');
    } catch (error) {
        console.error('Update error:', error);
        showNotification('Hata: ' + error.message, 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    // Search
    document.getElementById('productSearch')?.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const items = document.querySelectorAll('#availableProductsList .product-item');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'block' : 'none';
        });
    });

    // Load menu URL for QR
    // Load menu URL and QR code
    const loadMenuUrl = async () => {
        try {
            const response = await fetch(`${API_BASE}/settings`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const settings = await response.json();
                const settingsObj = {};
                settings.forEach(s => {
                    settingsObj[s.key] = s.value;
                });
                
                const menuUrl = document.getElementById('menuUrl');
                if (menuUrl) {
                    if (settingsObj.menu_url) {
                        menuUrl.value = settingsObj.menu_url;
                    }
                    menuUrl.removeAttribute('readonly');
                    
                    // Load QR code image if exists
                    if (settingsObj.qr_code_image) {
                        const qrCodeImagePreview = document.getElementById('qrCodeImagePreview');
                        const qrCodeCanvas = document.getElementById('qrCodeCanvas');
                        if (qrCodeImagePreview) {
                            qrCodeImagePreview.src = settingsObj.qr_code_image;
                            qrCodeImagePreview.style.display = 'block';
                            if (qrCodeCanvas) qrCodeCanvas.style.display = 'none';
                        }
                    } else if (settingsObj.menu_url) {
                        generateQRCode(settingsObj.menu_url, 'qrCodeCanvas');
                    } else if (menuUrl.value) {
                        generateQRCode(menuUrl.value, 'qrCodeCanvas');
                    }
                }
            }
        } catch (error) {
            console.error('Menu URL load error:', error);
            const menuUrl = document.getElementById('menuUrl');
            if (menuUrl && menuUrl.value) {
                menuUrl.removeAttribute('readonly');
                generateQRCode(menuUrl.value, 'qrCodeCanvas');
            }
        }
    };
    
    loadMenuUrl();

    loadProducts();
    loadPromotions();
});

