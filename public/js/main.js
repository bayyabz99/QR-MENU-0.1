/* Menü görünümü — referans tasarım (qrclaude) + mevcut API */

const API_BASE = '/api';
window.API_BASE = API_BASE;

/** Modal / rehber için sabit alerjen listesi (Türkçe isim eşlemesi) */
const ALLERGENS = [
  { names: ['gluten', 'glüten', 'buğday', 'bugday'], label: 'Gluten', icon: '🌾' },
  { names: ['süt', 'milk', 'laktoz', 'lactose'], label: 'Süt', icon: '🥛' },
  { names: ['yumurta', 'egg'], label: 'Yumurta', icon: '🥚' },
  { names: ['kuruyemiş', 'fıstık', 'fındık', 'nut', 'peanut'], label: 'Kuruyemiş', icon: '🥜' },
  { names: ['balık', 'fish'], label: 'Balık', icon: '🐟' },
  { names: ['kabuklu', 'shellfish', 'karides', 'istridye'], label: 'Kabuklu deniz', icon: '🦐' },
  { names: ['susam', 'sesame'], label: 'Susam', icon: '🫘' },
  { names: ['soya', 'soy'], label: 'Soya', icon: '🌱' },
  { names: ['sülfit', 'sulfite'], label: 'Sülfit', icon: '🧪' }
];

let currentLang = localStorage.getItem('language') || 'tr';

let cachedCategories = [];
let cachedProducts = [];
let currentPageName = 'menu';
let previousPageName = 'menu';

function adjustColor(hex, amount) {
  const h = (hex || '#6B2D8B').replace('#', '');
  const num = parseInt(h, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function hexToRgba(hex, alpha) {
  const h = (hex || '#6B2D8B').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function categoryIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('ara sıcak') || n.includes('ara sicak')) return '🧆';
  if (n.includes('ana yemek')) return '🍛';
  if (n.includes('börek') || n.includes('borek')) return '🥟';
  if (n.includes('pide')) return '🫓';
  if (n.includes('kebap')) return '🍢';
  if (n.includes('dürüm') || n.includes('durum') || n.includes('wrap')) return '🌯';
  if (n.includes('makarna') || n.includes('pasta')) return '🍝';
  if (n.includes('pilav') || n.includes('rice')) return '🍚';
  if (n.includes('sandviç') || n.includes('sandvic') || n.includes('sandwich')) return '🥪';
  if (n.includes('tost')) return '🧇';
  if (n.includes('aperatif') || n.includes('atıştır') || n.includes('atistir')) return '🍟';
  if (n.includes('çocuk') || n.includes('cocuk')) return '🧸';
  if (n.includes('içecek') || n.includes('icecek')) return '🥤';
  if (n.includes('kahve')) return '☕';
  if (n.includes('çay') || n.includes('cay')) return '🫖';
  if (n.includes('tatlı') || n.includes('tatli') || n.includes('dessert')) return '🍰';
  if (n.includes('dondurma')) return '🍨';
  if (n.includes('waffle') || n.includes('krep')) return '🧇';
  if (n.includes('salata')) return '🥗';
  if (n.includes('çorba') || n.includes('corba')) return '🍲';
  if (n.includes('burger') || n.includes('wrap')) return '🍔';
  if (n.includes('pizza')) return '🍕';
  if (n.includes('kahvaltı') || n.includes('kahvalti')) return '🥐';
  if (n.includes('balık') || n.includes('balik') || n.includes('deniz')) return '🐟';
  if (n.includes('et') || n.includes('ızgara') || n.includes('izgara')) return '🥩';
  if (n.includes('tavuk')) return '🍗';
  if (n.includes('vegan') || n.includes('vejeta')) return '🌱';
  return '🍽️';
}

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
};

const getCategoryImage = (categoryName, categoryImage, categoryId = null) => {
  if (categoryImage && String(categoryImage).trim() !== '') return categoryImage;
  const categoryHash = hashString((categoryName || '').toLowerCase().trim());
  const seed = categoryId != null ? categoryId : categoryHash;
  return `https://picsum.photos/seed/category-${seed}/600/200`;
};

const formatPrice = (price) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(Number(price) || 0);

const showToast = (message) => {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
};

/* —— Dil —— */
const updateLanguage = (lang) => {
  currentLang = lang;
  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('[data-tr]').forEach((el) => {
    const trText = el.getAttribute('data-tr');
    const enText = el.getAttribute('data-en');
    if (lang === 'tr' && trText != null) el.textContent = trText;
    else if (lang === 'en' && enText != null) el.textContent = enText;
  });

  const search = document.getElementById('searchInput');
  if (search) {
    search.placeholder = lang === 'tr' ? 'Menüde ara...' : 'Search menu...';
  }
};

const changeLanguage = (lang) => {
  localStorage.setItem('language', lang);
  updateLanguage(lang);
};

const initLanguage = () => {
  updateLanguage(currentLang);
};

/* —— Sayfa geçişi —— */
const showPage = (name) => {
  if (currentPageName !== name) previousPageName = currentPageName;
  currentPageName = name;
  document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
  const next = document.getElementById('page-' + name);
  if (next) next.classList.add('active');
  const footer = document.getElementById('menuFooter');
  if (footer) footer.style.display = 'none';
  window.scrollTo(0, 0);
};

const goBack = () => {
  if (currentPageName === 'detail') {
    showPage('menu');
    return;
  }
  window.history.back();
};

/* —— Tasarım / restoran —— */
const loadDesignSettings = async () => {
  try {
    const response = await fetch(`${API_BASE}/design-settings`);
    if (!response.ok) return;
    const s = await response.json();
    const root = document.documentElement;
    const primary = s.primary_color || '#6B2D8B';
    const hover = s.hover_color || adjustColor(primary, -15);

    root.style.setProperty('--brand', primary);
    root.style.setProperty('--brand-light', adjustColor(primary, 35));
    root.style.setProperty('--brand-dark', adjustColor(primary, -28));
    root.style.setProperty('--accent', '#E8C547');
    root.style.setProperty('--border', hexToRgba(primary, 0.15));
    if (s.menu_background_color) root.style.setProperty('--bg', s.menu_background_color);
    if (s.text_color) root.style.setProperty('--text', s.text_color);
    if (s.border_radius) {
      root.style.setProperty('--radius', `${parseInt(s.border_radius, 10) || 16}px`);
    }
    if (s.section_spacing) {
      root.style.setProperty('--section-spacing', `${parseInt(s.section_spacing, 10) || 4}px`);
    }
    if (s.font_family) {
      document.body.style.fontFamily = s.font_family;
    }
    if (s.header_color) {
      document.querySelectorAll('.menu-header, .search-bar').forEach((el) => {
        el.style.background = s.header_color;
      });
    }
    const backBtn = document.getElementById('detailBackBtn');
    if (backBtn && String(s.back_button_enabled) === '0') {
      backBtn.style.display = 'none';
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', primary);
  } catch (e) {
    console.warn('Tasarım ayarları:', e);
  }
};

const loadRestaurantInfo = async () => {
  try {
    const response = await fetch(`${API_BASE}/restaurant`);
    if (!response.ok) return;
    const data = await response.json();
    const brand = document.getElementById('menuBrandName');
    if (brand) brand.textContent = data.name || 'Menü';
    document.title = (data.name || 'QR Menü') + ' - QR Menü';
  } catch (e) {
    console.error(e);
  }
};

/* —— Alerjen rehberi (modal içi) —— */
const renderAllergenModalGrid = () => {
  const grid = document.getElementById('allergenFullGrid');
  if (!grid) return;
  grid.innerHTML = ALLERGENS.map(
    (a) => `<div class="afl-item"><div class="afl-icon">${a.icon}</div><div class="afl-name">${a.label}</div></div>`
  ).join('');
};

const openAllergenModal = () => {
  document.getElementById('allergenModal')?.classList.add('active');
};

const closeAllergenModal = () => {
  document.getElementById('allergenModal')?.classList.remove('active');
};

/* —— Menü listesi —— */
const productsForCategory = (catId) =>
  cachedProducts.filter((p) => Number(p.category_id) === Number(catId));

const renderMenuItem = (p) => {
  const img = p.image
    ? `<div class="item-img-wrap"><img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.parentElement.outerHTML='<div class=\\'item-img-placeholder\\'>🍽️</div>'"></div>`
    : `<div class="item-img-placeholder">🍽️</div>`;
  const desc = escapeHtml((p.description || '').trim());
  const shortDesc = desc.length > 120 ? desc.slice(0, 117) + '…' : desc;
  return `
    <div class="menu-item" role="button" tabindex="0" data-slug="${escapeHtml(p.slug)}">
      ${img}
      <div class="item-info">
        <div class="item-name">${escapeHtml(p.name)}</div>
        <div class="item-desc">${shortDesc}</div>
        <div class="item-footer">
          <span class="item-price">${formatPrice(p.price)}</span>
          <div class="item-tags"></div>
        </div>
      </div>
      <div class="item-arrow">›</div>
    </div>`;
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const bindMenuItemClicks = (root) => {
  root.querySelectorAll('.menu-item[data-slug]').forEach((el) => {
    const slug = el.getAttribute('data-slug');
    const open = () => slug && showProductDetail(slug);
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
};

const renderQuickNav = () => {
  const nav = document.getElementById('quickNav');
  if (!nav) return;
  const allLabel = currentLang === 'tr' ? 'Tümü' : 'All';
  nav.innerHTML = `<div class="nav-chip active" data-scroll="all"><span class="chip-icon">🏠</span><span class="chip-label">${allLabel}</span></div>`;
  cachedCategories.forEach((cat) => {
    const label = escapeHtml(cat.name.split(/\s+/)[0] || cat.name);
    const iconHint = `${cat.name || ''} ${cat.slug || ''}`;
    nav.innerHTML += `<div class="nav-chip" data-cat="${cat.id}"><span class="chip-icon">${categoryIcon(iconHint)}</span><span class="chip-label">${label}</span></div>`;
  });
  nav.querySelectorAll('.nav-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      nav.querySelectorAll('.nav-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      if (chip.dataset.scroll === 'all') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const id = chip.dataset.cat;
      const sec = document.getElementById('section-' + id);
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};

const renderCategories = () => {
  const container = document.getElementById('categoriesContainer');
  if (!container) return;
  container.innerHTML = '';

  cachedCategories.forEach((cat) => {
    const list = productsForCategory(cat.id);
    const imageUrl = getCategoryImage(cat.name, cat.image, cat.id);
    const emptyText =
      currentLang === 'tr'
        ? 'Bu kategoride henüz ürün bulunmuyor.'
        : 'No products in this category yet.';
    const section = document.createElement('div');
    section.className = 'category-section';
    section.id = 'section-' + cat.id;
    section.innerHTML = `
      <div class="category-header">
        <img class="cat-bg-img" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(cat.name)}" loading="lazy" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
        <div class="cat-bg-placeholder" style="display:none"></div>
        <div class="cat-overlay">
          <span class="cat-name">${escapeHtml(cat.name)}</span>
          <span class="cat-arrow">▼</span>
        </div>
      </div>
      <div class="category-items" id="items-${cat.id}">
        ${
          list.length
            ? list.map((p) => renderMenuItem(p)).join('')
            : `<div class="menu-item" style="cursor:default;">
                 <div class="item-img-placeholder">🗂️</div>
                 <div class="item-info">
                   <div class="item-name">${currentLang === 'tr' ? 'Yakında' : 'Coming soon'}</div>
                   <div class="item-desc">${emptyText}</div>
                 </div>
               </div>`
        }
      </div>`;
    container.appendChild(section);

    const header = section.querySelector('.category-header');
    const itemsEl = section.querySelector('.category-items');
    header.addEventListener('click', () => {
      header.classList.toggle('open');
      itemsEl.classList.toggle('open');
    });
    bindMenuItemClicks(section);
  });
};

const renderFilteredList = (query) => {
  const q = query.trim().toLowerCase();
  const container = document.getElementById('categoriesContainer');
  if (!container) return;
  if (!q) {
    renderCategories();
    return;
  }
  const filtered = cachedProducts.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
  );
  if (!filtered.length) {
    const msg = currentLang === 'tr' ? 'Sonuç bulunamadı 🔍' : 'No results 🔍';
    container.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text-muted);font-size:15px;">${msg}</div>`;
    return;
  }
  const foundLabel =
    currentLang === 'tr' ? `${filtered.length} sonuç bulundu` : `${filtered.length} results`;
  container.innerHTML =
    `<div style="padding:6px 16px;font-size:12px;color:var(--text-muted);">${foundLabel}</div>` +
    filtered
      .map(
        (p) =>
          `<div style="background:white;margin:0 12px 8px;border-radius:12px;overflow:hidden;box-shadow:var(--shadow-sm);">${renderMenuItem(p)}</div>`
      )
      .join('');
  bindMenuItemClicks(container);
};

const loadMenuListing = async () => {
  const container = document.getElementById('categoriesContainer');
  try {
    const [catsRes, prodRes] = await Promise.all([
      fetch(`${API_BASE}/categories`),
      fetch(`${API_BASE}/products`)
    ]);
    cachedCategories = await catsRes.json();
    cachedProducts = await prodRes.json();
    renderQuickNav();
    renderCategories();
    renderAllergenModalGrid();
  } catch (e) {
    console.error(e);
    if (container) {
      container.innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--text-muted);">Menü yüklenemedi.</div>';
    }
  }
};

/* —— Ürün detayı —— */
const texts = () => ({
  tr: {
    minutes: 'dk',
    about: 'Ürün Hakkında',
    allergenTitle: 'Alerjen Bilgisi',
    nutriTitle: 'Besin Değerleri',
    portionFor: 'için',
    share: 'Paylaş',
    relatedTitle: 'Birlikte İyi Gider',
    deliveryTitle: 'Sipariş',
    copied: 'Link kopyalandı!',
    allergenDisclaimer: 'Bu üründe listelenen alerjenlere göre bilgi verilmiştir.',
    likes: 'beğeni',
    allergenYes: 'İÇERİR',
    allergenNo: 'İÇERMEZ'
  },
  en: {
    minutes: 'min',
    about: 'About this item',
    allergenTitle: 'Allergens',
    nutriTitle: 'Nutritional values',
    portionFor: 'for',
    share: 'Share',
    relatedTitle: 'Goes well with',
    deliveryTitle: 'Order',
    copied: 'Link copied!',
    allergenDisclaimer: 'Information reflects the allergens listed for this product.',
    likes: 'likes',
    allergenYes: 'CONTAINS',
    allergenNo: 'NONE'
  }
});

function matchAllergenToken(nameLower, token) {
  return nameLower.includes(token) || token.includes(nameLower);
}

const allergenMatchesProduct = (allergenRowName, allergenDef) => {
  const n = (allergenRowName || '').toLowerCase().trim();
  return allergenDef.names.some((t) => matchAllergenToken(n, t) || n.includes(t));
};

const loadProductLikes = async (slug) => {
  try {
    const r = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}/likes`);
    const d = await r.json();
    return d.like_count || 0;
  } catch {
    return 0;
  }
};

const incrementProductLike = async (slug) => {
  try {
    const r = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}/like`, { method: 'POST' });
    const d = await r.json();
    return d.like_count ?? null;
  } catch {
    return null;
  }
};

const loadDeliveryCompanies = async () => {
  try {
    const r = await fetch(`${API_BASE}/delivery-companies`);
    const arr = await r.json();
    return (arr || []).filter((c) => c.url && String(c.url).trim());
  } catch {
    return [];
  }
};

const loadSocialForShare = async () => {
  try {
    const r = await fetch(`${API_BASE}/social-media`);
    return await r.json();
  } catch {
    return [];
  }
};

const shareProductAction = (name, url) => {
  const t = texts()[currentLang];
  if (navigator.share) {
    navigator.share({ title: name, text: name + ' - QR Menü', url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => showToast(t.copied));
  }
};

const showProductDetail = async (slug) => {
  const host = document.getElementById('detailContent');
  if (!host) return;
  const t = texts()[currentLang];
  host.innerHTML = `<div class="detail-body" style="padding:80px 20px;text-align:center;color:var(--text-muted);">…</div>`;
  showPage('detail');

  try {
    const productResponse = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`);
    if (!productResponse.ok) throw new Error('not found');
    const product = await productResponse.json();

    const [allergens, nutritionalValues, relatedProducts, deliveryCompanies, socialMedia, likes] =
      await Promise.all([
        fetch(`${API_BASE}/products/${encodeURIComponent(slug)}/allergens`).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`${API_BASE}/products/${encodeURIComponent(slug)}/nutritional-values`).then((r) =>
          r.ok ? r.json() : []
        ),
        fetch(`${API_BASE}/products/${encodeURIComponent(slug)}/related`).then((r) =>
          r.ok ? r.json() : []
        ),
        loadDeliveryCompanies(),
        loadSocialForShare(),
        loadProductLikes(slug)
      ]);

    const likedKey = `product_liked_${product.id}`;
    let isLiked = localStorage.getItem(likedKey) === 'true';

    const userNames = (allergens || []).map((a) => (a.allergen_name || '').toLowerCase());
    const allergenGrid = ALLERGENS.map((def) => {
      const has = userNames.some((un) => allergenMatchesProduct(un, def));
      const st = has ? t.allergenYes : t.allergenNo;
      return `<div class="allergen-item ${has ? 'has' : 'no'}"><div class="allergen-icon">${def.icon}</div><div class="allergen-name">${def.label}</div><div class="allergen-status">${st}</div></div>`;
    }).join('');

    const metaBadges = [];
    if (product.preparation_time != null) {
      metaBadges.push(
        `<div class="detail-badge"><span>⏱️</span>${product.preparation_time} ${t.minutes}</div>`
      );
    }

    const nutriRows =
      nutritionalValues && nutritionalValues.length
        ? nutritionalValues
            .map(
              (n) =>
                `<tr><td>${escapeHtml(n.nutrient_name)}</td><td>${escapeHtml(
                  String(n.nutrient_value)
                )} ${escapeHtml(n.unit || '')}</td></tr>`
            )
            .join('')
        : '';
    const portion =
      nutritionalValues && nutritionalValues[0] && nutritionalValues[0].portion_size
        ? nutritionalValues[0].portion_size
        : '';

    const relatedHtml =
      relatedProducts && relatedProducts.length
        ? `<div class="detail-related-block"><div class="detail-section-title">${t.relatedTitle}</div>${relatedProducts
            .map(
              (rp) => `
          <div class="menu-item" role="button" tabindex="0" data-slug="${escapeHtml(rp.slug)}">
            ${rp.image ? `<div class="item-img-wrap"><img src="${escapeHtml(rp.image)}" alt="" loading="lazy"></div>` : `<div class="item-img-placeholder">🍽️</div>`}
            <div class="item-info">
              <div class="item-name">${escapeHtml(rp.name)}</div>
              <div class="item-footer"><span class="item-price">${formatPrice(rp.price)}</span></div>
            </div>
            <div class="item-arrow">›</div>
          </div>`
            )
            .join('')}</div>`
        : '';

    const deliveryHtml =
      deliveryCompanies.length > 0
        ? `<div class="detail-section-title">${t.deliveryTitle}</div><div class="detail-delivery-links">${deliveryCompanies
            .map(
              (c) =>
                `<a class="variant-opt" href="${escapeHtml(c.url)}" target="_blank" rel="noopener">${escapeHtml(c.name)}</a>`
            )
            .join('')}</div>`
        : '';

    const shareUrl = `${window.location.origin}/urun/${encodeURIComponent(product.slug)}`;
    const wa = (socialMedia || []).find((s) => s.platform.toLowerCase() === 'whatsapp');
    const tg = (socialMedia || []).find((s) => s.platform.toLowerCase() === 'telegram');
    const tw = (socialMedia || []).find(
      (s) => s.platform.toLowerCase() === 'twitter' || s.platform.toLowerCase() === 'x'
    );
    const fb = (socialMedia || []).find((s) => s.platform.toLowerCase() === 'facebook');

    const shareIcons = [
      wa
        ? `<a href="https://wa.me/?text=${encodeURIComponent(product.name + ' ' + shareUrl)}" target="_blank" rel="noopener" title="WhatsApp">📱</a>`
        : '',
      tg
        ? `<a href="https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(product.name)}" target="_blank" rel="noopener" title="Telegram">✈️</a>`
        : '',
      tw
        ? `<a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(product.name)}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener" title="X">𝕏</a>`
        : '',
      fb
        ? `<a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener" title="Facebook">f</a>`
        : ''
    ]
      .filter(Boolean)
      .join('');

    const heroImg = product.image
      ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">`
      : `<div class="detail-hero-placeholder">🍽️</div>`;

    host.innerHTML = `
      <div class="detail-hero">
        ${heroImg}
        <div class="detail-hero-badge">${formatPrice(product.price)}</div>
        <button type="button" class="detail-like-btn ${isLiked ? 'liked' : ''}" id="detailLikeBtn" ${isLiked ? 'disabled' : ''}>
          ♥ <span id="detailLikeCount">${likes}</span>
        </button>
      </div>
      <div class="detail-body">
        <div class="detail-category">${escapeHtml(product.category_name || '')}</div>
        <h1 class="detail-name">${escapeHtml(product.name)}</h1>
        <div class="detail-meta">${metaBadges.join('')}</div>
        <div class="detail-divider"></div>
        <div class="detail-section-title">${t.about}</div>
        <p class="detail-desc">${escapeHtml(product.description || '')}</p>
        <div class="detail-divider"></div>
        <div class="detail-section-title">${t.allergenTitle}</div>
        <p style="font-size:12px;color:var(--text-muted);margin-bottom:10px;">${t.allergenDisclaimer}</p>
        <div class="allergen-grid">${allergenGrid}</div>
        ${
          nutriRows
            ? `<div class="detail-divider"></div><div class="detail-section-title">${t.nutriTitle}</div>${
                portion
                  ? `<p style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">1 ${t.portionFor} ${escapeHtml(portion)}</p>`
                  : ''
              }<table class="detail-nutri-table"><thead><tr><th>${currentLang === 'tr' ? 'Besin' : 'Nutrient'}</th><th>${currentLang === 'tr' ? 'Değer' : 'Value'}</th></tr></thead><tbody>${nutriRows}</tbody></table>`
            : ''
        }
        <div class="detail-divider"></div>
        <div class="detail-share-row">
          <button type="button" class="detail-share-btn" id="detailShareBtn">${t.share}</button>
          <div class="detail-share-icons">${shareIcons}</div>
        </div>
        ${relatedHtml}
        ${deliveryHtml}
        <div style="height:24px;"></div>
      </div>`;

    document.title = `${product.name} - QR Menü`;

    const likeBtn = document.getElementById('detailLikeBtn');
    likeBtn?.addEventListener('click', async () => {
      if (isLiked) return;
      const next = await incrementProductLike(slug);
      if (next != null) {
        isLiked = true;
        localStorage.setItem(likedKey, 'true');
        const c = document.getElementById('detailLikeCount');
        if (c) c.textContent = next;
        likeBtn.classList.add('liked');
        likeBtn.disabled = true;
      }
    });

    document.getElementById('detailShareBtn')?.addEventListener('click', () => {
      shareProductAction(product.name, shareUrl);
    });

    bindMenuItemClicks(host);
  } catch (e) {
    console.error(e);
    host.innerHTML = `<div class="detail-body" style="padding:40px;"><p>${currentLang === 'tr' ? 'Ürün yüklenemedi.' : 'Could not load product.'}</p><button type="button" class="allergen-btn" onclick="document.getElementById('detailBackBtn').click()" style="margin-top:16px;">OK</button></div>`;
  }
};

/* —— Başlatma —— */
document.addEventListener('DOMContentLoaded', async () => {
  await loadDesignSettings();

  /* Sadece ana menü şablonu (#page-menu) — ürün detay sayfası product.js ile yüklenir */
  if (!document.getElementById('page-menu')) return;

  initLanguage();
  renderAllergenModalGrid();

  document.getElementById('allergenGuideBtn')?.addEventListener('click', openAllergenModal);
  document.getElementById('allergenModalClose')?.addEventListener('click', closeAllergenModal);
  document.getElementById('allergenModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'allergenModal') closeAllergenModal();
  });

  document.getElementById('detailBackBtn')?.addEventListener('click', () => goBack());

  const searchInput = document.getElementById('searchInput');
  searchInput?.addEventListener('input', () => renderFilteredList(searchInput.value));

  await loadRestaurantInfo();
  await loadMenuListing();
});

window.goBack = goBack;
