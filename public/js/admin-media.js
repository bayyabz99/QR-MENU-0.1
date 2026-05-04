const API_BASE = '/api/admin';

const getAuthHeaders = () => {
    const token = sessionStorage.getItem('adminToken');
    return {
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

let selectedMedia = new Set();
let currentView = 'grid';

const loadMedia = async () => {
    try {
        const response = await fetch(`${API_BASE}/media`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Medya yüklenemedi');
        
        const media = await response.json();
        renderMedia(media);
        updateMediaCount(media.length);
    } catch (error) {
        console.error('Load error:', error);
        showNotification('Medya yüklenemedi', 'error');
    }
};

const renderMedia = (media) => {
    const grid = document.getElementById('mediaGrid');
    
    if (media.length === 0) {
        grid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 40px;">Henüz medya eklenmemiş.</div>';
        return;
    }
    
    if (currentView === 'grid') {
        grid.innerHTML = media.map(item => `
            <div class="media-item" data-id="${item.id}">
                <input type="checkbox" class="media-checkbox" data-id="${item.id}">
                <img src="${item.path}" alt="${item.filename}" loading="lazy">
            </div>
        `).join('');
    } else {
        grid.innerHTML = media.map(item => `
            <div class="media-item list-view" data-id="${item.id}" style="display: flex; align-items: center; gap: 15px; padding: 10px;">
                <input type="checkbox" class="media-checkbox" data-id="${item.id}">
                <img src="${item.path}" alt="${item.filename}" style="width: 80px; height: 80px; object-fit: cover;">
                <div>
                    <strong>${item.filename}</strong>
                    <p style="font-size: 12px; color: #666; margin-top: 5px;">${(item.size / 1024).toFixed(2)} KB</p>
                </div>
            </div>
        `).join('');
    }
    
    // Add checkbox listeners
    document.querySelectorAll('.media-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = parseInt(e.target.dataset.id);
            if (e.target.checked) {
                selectedMedia.add(id);
            } else {
                selectedMedia.delete(id);
            }
            updateBulkSelectBtn();
        });
    });
};

const updateMediaCount = (total) => {
    const countEl = document.getElementById('mediaCount');
    if (countEl) {
        countEl.textContent = `${total} ortam ögesinden ${total} tanesi görüntüleniyor`;
    }
};

const updateBulkSelectBtn = () => {
    const btn = document.getElementById('bulkSelectBtn');
    if (btn) {
        btn.textContent = selectedMedia.size > 0 
            ? `Seçili: ${selectedMedia.size}` 
            : 'Toplu seçim';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentView = btn.dataset.view;
            loadMedia();
        });
    });

    // Upload modal
    document.getElementById('addMediaBtn')?.addEventListener('click', () => {
        document.getElementById('uploadModal').classList.add('show');
    });

    document.getElementById('closeUploadModal')?.addEventListener('click', () => {
        document.getElementById('uploadModal').classList.remove('show');
    });

    document.getElementById('cancelUploadBtn')?.addEventListener('click', () => {
        document.getElementById('uploadModal').classList.remove('show');
    });

    // Upload form
    document.getElementById('uploadForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const files = document.getElementById('mediaFile').files;
        
        if (files.length === 0) {
            showNotification('Lütfen dosya seçin', 'error');
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        const token = sessionStorage.getItem('adminToken');
        
        try {
            const response = await fetch(`${API_BASE}/media`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) throw new Error('Dosyalar yüklenemedi');
            
            showNotification('Dosyalar başarıyla yüklendi!', 'success');
            document.getElementById('uploadModal').classList.remove('show');
            document.getElementById('uploadForm').reset();
            loadMedia();
        } catch (error) {
            showNotification('Hata: ' + error.message, 'error');
        }
    });

    // Select all
    document.getElementById('selectAllBanners')?.addEventListener('change', (e) => {
        document.querySelectorAll('.media-checkbox').forEach(cb => {
            cb.checked = e.target.checked;
            const id = parseInt(cb.dataset.id);
            if (e.target.checked) {
                selectedMedia.add(id);
            } else {
                selectedMedia.delete(id);
            }
        });
        updateBulkSelectBtn();
    });

    loadMedia();
});

