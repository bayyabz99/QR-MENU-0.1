const ADMIN_API_BASE = '/api/admin';

const showSidebarNotification = (message, type = 'success') => {
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

const injectProfileSettingsModal = () => {
    if (document.getElementById('adminProfileModal')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="modal" id="adminProfileModal">
            <div class="modal-content" style="max-width:520px;">
                <div class="modal-header">
                    <h2>Admin Hesabı</h2>
                    <button class="modal-close" id="closeAdminProfileModal">&times;</button>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom:14px;color:var(--text-light);font-size:13px;">
                        Güvenlik için mevcut şifrenizi iki kez girmeniz zorunludur.
                    </p>
                    <div class="form-group">
                        <label for="accountCurrentPassword">Mevcut Şifre *</label>
                        <input type="password" id="accountCurrentPassword" autocomplete="current-password">
                    </div>
                    <div class="form-group">
                        <label for="accountCurrentPasswordRepeat">Mevcut Şifre (Tekrar) *</label>
                        <input type="password" id="accountCurrentPasswordRepeat" autocomplete="current-password">
                    </div>
                    <div class="form-group">
                        <label for="accountNewUsername">Yeni Admin Kullanıcı Adı</label>
                        <input type="text" id="accountNewUsername" placeholder="Boş bırakırsanız değişmez" autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="accountNewPassword">Yeni Şifre</label>
                        <input type="password" id="accountNewPassword" placeholder="En az 6 karakter" autocomplete="new-password">
                    </div>
                    <div class="form-group">
                        <label for="accountNewPasswordRepeat">Yeni Şifre (Tekrar)</label>
                        <input type="password" id="accountNewPasswordRepeat" autocomplete="new-password">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="cancelAdminProfileBtn">Vazgeç</button>
                    <button class="btn btn-primary" id="saveAdminProfileBtn">Kaydet</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(wrapper.firstElementChild);
};

const wireProfileSettings = () => {
    const token = sessionStorage.getItem('adminToken');
    if (!token) return;

    injectProfileSettingsModal();

    const profileBtn = document.querySelector('.user-profile');
    const modal = document.getElementById('adminProfileModal');
    const closeBtn = document.getElementById('closeAdminProfileModal');
    const cancelBtn = document.getElementById('cancelAdminProfileBtn');
    const saveBtn = document.getElementById('saveAdminProfileBtn');

    const openModal = () => modal && modal.classList.add('show');
    const closeModal = () => {
        if (modal) modal.classList.remove('show');
        ['accountCurrentPassword', 'accountCurrentPasswordRepeat', 'accountNewPassword', 'accountNewPasswordRepeat']
            .forEach((id) => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
    };

    if (profileBtn) {
        profileBtn.style.cursor = 'pointer';
        profileBtn.title = 'Admin hesabını düzenle';
        profileBtn.addEventListener('click', openModal);
    }
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    fetch(`${ADMIN_API_BASE}/settings`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then((res) => res.ok ? res.json() : [])
        .then((settings) => {
            const brandSetting = Array.isArray(settings)
                ? settings.find((s) => s.key === 'admin_brand_text')
                : null;
            const brandText = (brandSetting && brandSetting.value) ? brandSetting.value : 'ZİFT STUDİO';
            document.querySelectorAll('.logo-text').forEach((el) => {
                el.textContent = brandText;
            });
        })
        .catch(() => {});

    fetch(`${ADMIN_API_BASE}/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then((res) => res.ok ? res.json() : null)
        .then((profile) => {
            if (!profile) return;
            const username = profile.username || '';
            const letter = username ? username.charAt(0).toUpperCase() : 'Y';
            document.querySelectorAll('.profile-letter').forEach((el) => {
                el.textContent = letter;
            });
            const usernameInput = document.getElementById('accountNewUsername');
            if (usernameInput) usernameInput.value = username;
        })
        .catch(() => {});

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const currentPassword = document.getElementById('accountCurrentPassword')?.value || '';
            const currentPasswordRepeat = document.getElementById('accountCurrentPasswordRepeat')?.value || '';
            const newUsername = document.getElementById('accountNewUsername')?.value || '';
            const newPassword = document.getElementById('accountNewPassword')?.value || '';
            const newPasswordRepeat = document.getElementById('accountNewPasswordRepeat')?.value || '';

            if (!currentPassword || !currentPasswordRepeat) {
                showSidebarNotification('Mevcut şifre ve tekrarı zorunludur', 'error');
                return;
            }
            if (currentPassword !== currentPasswordRepeat) {
                showSidebarNotification('Mevcut şifre tekrarı eşleşmiyor', 'error');
                return;
            }
            if (!newUsername.trim() && !newPassword) {
                showSidebarNotification('Yeni kullanıcı adı veya yeni şifre girin', 'error');
                return;
            }
            if (newPassword && newPassword !== newPasswordRepeat) {
                showSidebarNotification('Yeni şifre tekrarı eşleşmiyor', 'error');
                return;
            }

            try {
                const response = await fetch(`${ADMIN_API_BASE}/account/change-credentials`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        current_password_confirm: currentPasswordRepeat,
                        new_username: newUsername.trim(),
                        new_password: newPassword,
                        new_password_confirm: newPasswordRepeat
                    })
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Hesap güncellenemedi');
                }

                if (result.token) {
                    sessionStorage.setItem('adminToken', result.token);
                }
                if (result.username) {
                    const letter = result.username.charAt(0).toUpperCase();
                    document.querySelectorAll('.profile-letter').forEach((el) => {
                        el.textContent = letter || 'Y';
                    });
                }

                showSidebarNotification(result.message || 'Hesap güncellendi', 'success');
                closeModal();
            } catch (error) {
                showSidebarNotification('Hata: ' + error.message, 'error');
            }
        });
    }
};

const wireAdminSearch = () => {
    const searchButton = document.querySelector('.header-icon-btn[title="Ara"]');
    if (!searchButton) return;

    if (!document.getElementById('adminSearchModal')) {
        const wrap = document.createElement('div');
        wrap.innerHTML = `
            <div class="modal" id="adminSearchModal">
                <div class="modal-content" style="max-width:640px;">
                    <div class="modal-header">
                        <h2>Yönetim İçi Arama</h2>
                        <button class="modal-close" id="closeAdminSearchModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <input type="text" id="adminSearchInput" placeholder="Özellik, sayfa veya menü ara...">
                        </div>
                        <div id="adminSearchResults" style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow:auto;"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(wrap.firstElementChild);
    }

    const modal = document.getElementById('adminSearchModal');
    const input = document.getElementById('adminSearchInput');
    const results = document.getElementById('adminSearchResults');
    const closeBtn = document.getElementById('closeAdminSearchModal');
    let activeIndex = -1;

    const getSearchEntries = () => {
        const seen = new Set();
        const entries = [];
        document.querySelectorAll('.sidebar .nav-item').forEach((item) => {
            const href = item.getAttribute('href');
            const label = (item.textContent || '').replace(/\s+/g, ' ').trim();
            if (!href || href === '#' || !label) return;
            const key = `${label}__${href}`;
            if (seen.has(key)) return;
            seen.add(key);
            entries.push({ label, href });
        });
        return entries;
    };

    const updateActiveResult = () => {
        const buttons = Array.from(results.querySelectorAll('button[data-href]'));
        buttons.forEach((btn, i) => {
            if (i === activeIndex) {
                btn.style.borderColor = 'var(--primary-color)';
                btn.style.boxShadow = '0 0 0 3px rgba(195,66,78,0.12)';
                btn.scrollIntoView({ block: 'nearest' });
            } else {
                btn.style.borderColor = 'var(--border-color)';
                btn.style.boxShadow = 'none';
            }
        });
    };

    const renderResults = (query = '') => {
        const q = query.toLowerCase().trim();
        const entries = getSearchEntries().filter((e) => {
            if (!q) return true;
            return e.label.toLowerCase().includes(q) || e.href.toLowerCase().includes(q);
        });

        if (!entries.length) {
            results.innerHTML = `<div style="padding:10px;color:var(--text-light);font-size:13px;">Sonuç bulunamadı.</div>`;
            activeIndex = -1;
            return;
        }

        results.innerHTML = entries.map((e) => `
            <button type="button" data-href="${e.href}" style="text-align:left;padding:10px 12px;border:1px solid var(--border-color);border-radius:8px;background:#fff;cursor:pointer;">
                <div style="font-weight:600;color:var(--text-color);">${e.label}</div>
                <div style="font-size:12px;color:var(--text-light);">${e.href}</div>
            </button>
        `).join('');

        results.querySelectorAll('button[data-href]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const href = btn.getAttribute('data-href');
                if (href) window.location.href = href;
            });
        });
        activeIndex = 0;
        updateActiveResult();
    };

    const openModal = () => {
        modal.classList.add('show');
        renderResults('');
        setTimeout(() => input.focus(), 50);
    };
    const closeModal = () => {
        modal.classList.remove('show');
        activeIndex = -1;
    };

    searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
    closeBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    input?.addEventListener('input', (e) => renderResults(e.target.value));
    input?.addEventListener('keydown', (e) => {
        const buttons = Array.from(results.querySelectorAll('button[data-href]'));
        if (!buttons.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % buttons.length;
            updateActiveResult();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + buttons.length) % buttons.length;
            updateActiveResult();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const target = buttons[Math.max(0, activeIndex)];
            target?.click();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) {
            closeModal();
        }
    });
};

const wireQrAutoFromMenuUrl = () => {
    const menuUrlInput = document.getElementById('menuUrl');
    const canvas = document.getElementById('qrCodeCanvas');
    if (!menuUrlInput || !canvas || typeof QRCode === 'undefined') return;

    let timer = null;
    const drawQr = () => {
        const url = (menuUrlInput.value || '').trim();
        if (!url) return;
        QRCode.toCanvas(canvas, url, { width: 250, margin: 2 }, () => {});
        const imagePreview = document.getElementById('qrCodeImagePreview');
        if (imagePreview) imagePreview.style.display = 'none';
        canvas.style.display = 'block';
    };

    menuUrlInput.addEventListener('input', () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(drawQr, 350);
    });
    menuUrlInput.addEventListener('blur', drawQr);
};

// Sidebar navigation toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    wireProfileSettings();
    wireAdminSearch();
    wireQrAutoFromMenuUrl();

    // Get current page path
    const currentPath = window.location.pathname;

    // Map paths to section text (Turkish)
    const pathToSectionMap = {
        '/yonetim/bannerlar': 'Bannerlar',
        '/yonetim/media': 'İçerikler',
        '/yonetim/kategori-siralama': 'Ürünler',
        '/yonetim/mesajlar': 'Mesajlar',
        '/yonetim/firma-bilgileri': 'Menü Ayarları',
        '/yonetim/tasarim-secenekleri': 'Menü Ayarları',
        '/yonetim/tanitim-alanlari': 'Menü Ayarları',
        '/yonetim/sosyal-medya': 'Menü Ayarları',
        '/yonetim/araci-firmalar': 'Menü Ayarları'
    };

    // Determine which section should be open based on current path
    let sectionToOpen = null;
    for (const [path, sectionName] of Object.entries(pathToSectionMap)) {
        if (currentPath.startsWith(path)) {
            sectionToOpen = sectionName;
            break;
        }
    }

    // Find and open the relevant section
    document.querySelectorAll('.nav-section').forEach(section => {
        const title = section.querySelector('.nav-section-title span');
        if (title) {
            const sectionText = title.textContent.trim();

            // Open the section if it matches the current page
            if (sectionToOpen && sectionText === sectionToOpen) {
                section.classList.remove('collapsed');
                // Also ensure the section items are visible
                const items = section.querySelector('.nav-section-items');
                if (items) {
                    items.style.maxHeight = items.scrollHeight + 'px';
                    items.style.opacity = '1';
                }
            } else {
                // Close other sections by default (except if they have active items)
                const hasActiveItem = section.querySelector('.nav-item.active');
                if (!hasActiveItem && !sectionToOpen) {
                    section.classList.add('collapsed');
                }
            }
        }
    });

    // Toggle nav sections on click
    document.querySelectorAll('.nav-section-title').forEach(title => {
        title.addEventListener('click', (e) => {
            // Don't toggle if clicking on a link inside
            if (e.target.closest('a')) return;

            const section = title.closest('.nav-section');
            section.classList.toggle('collapsed');
        });
    });
});

