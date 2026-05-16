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

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}`;
};

let allMessages = [];
let filteredMessages = [];

const loadMessages = async () => {
    try {
        const response = await fetch(`${API_BASE}/messages`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            // If messages table doesn't exist, return empty array
            if (response.status === 404) {
                allMessages = [];
                filteredMessages = [];
                renderMessages([]);
                return;
            }
            throw new Error('Mesajlar yüklenemedi');
        }
        
        allMessages = await response.json();
        filteredMessages = allMessages;
        renderMessages(filteredMessages);
    } catch (error) {
        console.error('Load error:', error);
        // Show empty state if error
        allMessages = [];
        filteredMessages = [];
        renderMessages([]);
    }
};

const renderMessages = (messages) => {
    const tbody = document.getElementById('messagesTableBody');
    
    if (messages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Henüz mesaj bulunmamaktadır.</td></tr>';
        updateItemCount(0);
        return;
    }
    
    tbody.innerHTML = messages.map(message => `
        <tr data-id="${message.id}" class="message-row ${message.is_read === 0 ? 'unread' : ''}">
            <td>
                <input type="checkbox" class="message-checkbox" data-id="${message.id}">
            </td>
            <td>
                <strong>${message.name || 'İsimsiz'}</strong>
                ${message.email ? `<br><small style="color: var(--text-light);">${message.email}</small>` : ''}
            </td>
            <td>${message.subject || 'Konu yok'}</td>
            <td>
                <span class="date-status">${formatDate(message.created_at)}</span>
            </td>
            <td>
                <span class="status-badge ${message.is_read === 0 ? 'inactive' : 'active'}">
                    ${message.is_read === 0 ? 'Okunmamış' : 'Okunmuş'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="viewMessage(${message.id})" title="Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMessage(${message.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    updateItemCount(messages.length);
    
    // Add click handler to rows
    document.querySelectorAll('.message-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (!e.target.closest('button') && !e.target.closest('input')) {
                const id = parseInt(row.dataset.id);
                viewMessage(id);
            }
        });
        row.style.cursor = 'pointer';
    });
};

const updateItemCount = (count) => {
    const countElements = document.querySelectorAll('#messageItemCount, #messageItemCountFooter');
    countElements.forEach(el => {
        if (el) el.textContent = `${count} öge`;
    });
};

const viewMessage = async (id) => {
    try {
        const message = allMessages.find(m => m.id === id);
        if (!message) {
            showNotification('Mesaj bulunamadı', 'error');
            return;
        }
        
        // Mark as read
        if (message.is_read === 0) {
            await markAsRead(id);
        }
        
        // Show modal
        const modal = document.getElementById('messageModal');
        const modalTitle = document.getElementById('messageModalTitle');
        const modalBody = document.getElementById('messageModalBody');
        
        modalTitle.textContent = message.subject || 'Mesaj Detayı';
        modalBody.innerHTML = `
            <div class="message-detail">
                <div class="message-detail-row">
                    <strong>Gönderen:</strong>
                    <span>${message.name || 'İsimsiz'}</span>
                </div>
                ${message.email ? `
                <div class="message-detail-row">
                    <strong>E-posta:</strong>
                    <span><a href="mailto:${message.email}">${message.email}</a></span>
                </div>
                ` : ''}
                ${message.phone ? `
                <div class="message-detail-row">
                    <strong>Telefon:</strong>
                    <span><a href="tel:${message.phone}">${message.phone}</a></span>
                </div>
                ` : ''}
                <div class="message-detail-row">
                    <strong>Tarih:</strong>
                    <span>${formatDate(message.created_at)}</span>
                </div>
                <div class="message-detail-content">
                    <strong>Mesaj:</strong>
                    <p>${message.message || 'Mesaj içeriği yok'}</p>
                </div>
            </div>
        `;
        
        modal.classList.add('show');
    } catch (error) {
        console.error('View message error:', error);
        showNotification('Mesaj yüklenemedi', 'error');
    }
};

const markAsRead = async (id) => {
    try {
        const response = await fetch(`${API_BASE}/messages/${id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const message = allMessages.find(m => m.id === id);
            if (message) {
                message.is_read = 1;
            }
            loadMessages();
        }
    } catch (error) {
        console.error('Mark as read error:', error);
    }
};

const deleteMessage = async (id) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/messages/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Mesaj silinemedi');
        
        showNotification('Mesaj başarıyla silindi!', 'success');
        loadMessages();
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Hata: ' + error.message, 'error');
    }
};

const searchMessages = () => {
    const searchTerm = document.getElementById('messageSearchInput')?.value.toLowerCase() || '';
    if (!searchTerm) {
        filteredMessages = allMessages;
    } else {
        filteredMessages = allMessages.filter(message => 
            (message.name || '').toLowerCase().includes(searchTerm) ||
            (message.email || '').toLowerCase().includes(searchTerm) ||
            (message.subject || '').toLowerCase().includes(searchTerm) ||
            (message.message || '').toLowerCase().includes(searchTerm)
        );
    }
    renderMessages(filteredMessages);
};

const filterMessages = () => {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    
    let filtered = allMessages;
    
    // Status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(message => {
            switch (statusFilter) {
                case 'unread':
                    return message.is_read === 0;
                case 'read':
                    return message.is_read === 1;
                case 'replied':
                    return message.is_replied === 1;
                default:
                    return true;
            }
        });
    }
    
    // Date filter
    if (dateFilter !== 'all') {
        const now = new Date();
        filtered = filtered.filter(message => {
            const messageDate = new Date(message.created_at);
            switch (dateFilter) {
                case 'today':
                    return messageDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return messageDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return messageDate >= monthAgo;
                default:
                    return true;
            }
        });
    }
    
    filteredMessages = filtered;
    renderMessages(filteredMessages);
};

// Select all handler
const handleSelectAll = () => {
    const selectAll = document.getElementById('selectAllMessages');
    const checkboxes = document.querySelectorAll('.message-checkbox');
    
    if (selectAll) {
        selectAll.addEventListener('change', (e) => {
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
        });
    }
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const allChecked = Array.from(checkboxes).every(c => c.checked);
            const someChecked = Array.from(checkboxes).some(c => c.checked);
            if (selectAll) {
                selectAll.checked = allChecked;
                selectAll.indeterminate = someChecked && !allChecked;
            }
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;
    
    // Event listeners
    document.getElementById('searchMessagesBtn')?.addEventListener('click', searchMessages);
    document.getElementById('messageSearchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchMessages();
    });
    
    document.getElementById('filterMessagesBtn')?.addEventListener('click', filterMessages);
    document.getElementById('statusFilter')?.addEventListener('change', filterMessages);
    document.getElementById('dateFilter')?.addEventListener('change', filterMessages);
    
    document.getElementById('closeMessageModal')?.addEventListener('click', () => {
        document.getElementById('messageModal').classList.remove('show');
    });
    document.getElementById('closeMessageModalBtn')?.addEventListener('click', () => {
        document.getElementById('messageModal').classList.remove('show');
    });
    
    document.getElementById('replyMessageBtn')?.addEventListener('click', () => {
        const modalBody = document.getElementById('messageModalBody');
        const emailLink = modalBody.querySelector('a[href^="mailto:"]');
        if (emailLink) {
            window.location.href = emailLink.href;
        }
    });
    
    // Modal close on outside click
    document.getElementById('messageModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'messageModal') {
            document.getElementById('messageModal').classList.remove('show');
        }
    });
    
    handleSelectAll();
    loadMessages();
});

