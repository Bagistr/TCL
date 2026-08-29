/**
 * Air Group — Mobile-First Store App (05.ru / Wildberries / Ozon Style)
 * Chips Filtering, Mobile Bottom Sheet Filter, 1-Click WhatsApp Ordering
 */

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    activeChip: 'all', // 'all', '43', '50', '55', '65', '75', '85+', 'in-stock', 'custom'
    selectedDiagonals: [],
    selectedStock: [],
    selectedTech: [],
    sortBy: 'popular'
  };

  const productsGrid = document.getElementById('products-grid');
  const countDisplay = document.getElementById('catalog-count-display');
  const sortSelect = document.getElementById('sort-select');
  const filterDrawerBackdrop = document.getElementById('filter-drawer-backdrop');
  const orderModal = document.getElementById('order-modal');
  const specsModal = document.getElementById('specs-modal');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  const formatPrice = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
  };

  // Render Products
  function renderProducts() {
    if (!productsGrid) return;

    let list = [...AIR_GROUP_CONFIG.products];

    // Quick Chip Filter
    if (state.activeChip !== 'all') {
      if (state.activeChip === 'in-stock') {
        list = list.filter(p => p.inStockKaspiysk || p.inStockIzberbash);
      } else if (state.activeChip === 'custom') {
        list = list.filter(p => p.isCustomOrder);
      } else if (state.activeChip === '85+') {
        list = list.filter(p => p.diagonal >= 85);
      } else {
        const d = parseInt(state.activeChip);
        list = list.filter(p => p.diagonal === d);
      }
    }

    // Detailed Drawer Filters (if active)
    if (state.selectedDiagonals.length > 0) {
      list = list.filter(p => {
        return state.selectedDiagonals.some(d => {
          if (d === '85+') return p.diagonal >= 85;
          return p.diagonal === parseInt(d);
        });
      });
    }

    if (state.selectedStock.length > 0) {
      list = list.filter(p => {
        if (state.selectedStock.includes('kaspiysk') && p.inStockKaspiysk) return true;
        if (state.selectedStock.includes('izberbash') && p.inStockIzberbash) return true;
        if (state.selectedStock.includes('custom') && p.isCustomOrder) return true;
        return false;
      });
    }

    if (state.selectedTech.length > 0) {
      list = list.filter(p => {
        return state.selectedTech.some(t => {
          if (t === 'qled') return p.tech.toLowerCase().includes('qled');
          if (t === 'miniled') return p.tech.toLowerCase().includes('mini-led');
          if (t === '4k') return p.tech.toLowerCase().includes('4k');
          return true;
        });
      });
    }

    // Sorting
    if (state.sortBy === 'price-asc') {
      list.sort((a, b) => (a.customDiscountPrice || a.price) - (b.customDiscountPrice || b.price));
    } else if (state.sortBy === 'price-desc') {
      list.sort((a, b) => (b.customDiscountPrice || b.price) - (a.customDiscountPrice || a.price));
    } else if (state.sortBy === 'size-desc') {
      list.sort((a, b) => b.diagonal - a.diagonal);
    }

    if (countDisplay) {
      countDisplay.innerHTML = `В наличии и под заказ: <strong>${list.length} моделей</strong>`;
    }

    if (list.length === 0) {
      productsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 36px 16px; text-align: center;">
          <i class="fa-solid fa-tv" style="font-size: 2rem; color: #94a3b8; margin-bottom: 8px;"></i>
          <h4 style="font-size: 1rem; margin-bottom: 4px;">Модели не найдены</h4>
          <p style="color: #64748b; font-size: 0.82rem; margin-bottom: 14px;">Привезем любую редкую диагональ TCL под заказ из Москвы за 7–10 дней со скидкой 5%!</p>
          <a href="custom-order.html" class="btn btn-primary btn-sm">Заказать из Москвы (-5%)</a>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = list.map(item => {
      const price = item.isCustomOrder && item.customDiscountPrice ? item.customDiscountPrice : item.price;
      
      let stockTag = '';
      if (item.inStockKaspiysk) {
        stockTag = `<div class="product-stock-tag"><i class="fa-solid fa-circle" style="font-size: 0.55rem;"></i> В наличии (Каспийск)</div>`;
      } else if (item.inStockIzberbash) {
        stockTag = `<div class="product-stock-tag partner"><i class="fa-solid fa-store" style="font-size: 0.65rem;"></i> Магазин в Избербаше</div>`;
      } else {
        stockTag = `<div class="product-stock-tag order"><i class="fa-solid fa-plane" style="font-size: 0.65rem;"></i> Из Москвы (7–10 дней, -5%)</div>`;
      }

      return `
        <div class="product-card" data-id="${item.id}">
          <div class="product-card-badges">
            <span class="badge ${item.isBestseller ? 'badge-red' : 'badge-green'}">
              ${item.isBestseller ? 'Хит' : item.diagonalStr}
            </span>
            <span class="badge ${item.isCustomOrder ? 'badge-purple' : 'badge-green'}">
              ${item.isCustomOrder ? '-5%' : 'Оригинал'}
            </span>
          </div>

          <div class="product-img-box" onclick="openSpecsModal('${item.id}')" style="cursor: pointer;">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
          </div>

          <a href="javascript:void(0)" onclick="openSpecsModal('${item.id}')" class="product-title" title="${item.name}">
            ${item.shortName}
          </a>

          ${stockTag}

          <div class="gift-tag">
            <i class="fa-solid fa-gift"></i> Подарок от магазина
          </div>

          <div class="product-price-row">
            <span class="price-val">${formatPrice(price)}</span>
            <span class="price-strike">${formatPrice(item.oldPrice)}</span>
          </div>

          <div class="product-actions-grid">
            <button class="btn btn-primary btn-block btn-sm" onclick="openOrderModal('${item.id}')">
              <i class="fa-solid fa-bolt"></i> Купить
            </button>
            <button class="btn btn-secondary btn-sm" title="Характеристики" onclick="openSpecsModal('${item.id}')">
              <i class="fa-solid fa-info"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Horizontal Category Chip Clicks
  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeChip = chip.dataset.chip;
      renderProducts();
    });
  });

  // Sorting
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderProducts();
    });
  }

  // Mobile Filter Drawer Toggle
  window.openFilterDrawer = () => {
    if (filterDrawerBackdrop) filterDrawerBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeFilterDrawer = () => {
    if (filterDrawerBackdrop) filterDrawerBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  };

  window.applyDrawerFilters = () => {
    state.selectedDiagonals = Array.from(document.querySelectorAll('.drawer-cb-diag:checked')).map(c => c.value);
    state.selectedStock = Array.from(document.querySelectorAll('.drawer-cb-stock:checked')).map(c => c.value);
    state.selectedTech = Array.from(document.querySelectorAll('.drawer-cb-tech:checked')).map(c => c.value);
    closeFilterDrawer();
    renderProducts();
  };

  window.resetDrawerFilters = () => {
    document.querySelectorAll('.filter-drawer input[type="checkbox"]').forEach(c => c.checked = false);
    state.selectedDiagonals = [];
    state.selectedStock = [];
    state.selectedTech = [];
    closeFilterDrawer();
    renderProducts();
  };

  // Order Modal
  window.openOrderModal = (productId) => {
    const product = AIR_GROUP_CONFIG.products.find(p => p.id === productId);
    if (!product || !orderModal) return;

    const price = product.isCustomOrder && product.customDiscountPrice ? product.customDiscountPrice : product.price;

    const summary = document.getElementById('order-modal-summary');
    if (summary) {
      summary.innerHTML = `
        <img src="${product.image}" alt="${product.name}" style="width: 54px; height: 40px; object-fit: cover; border-radius: 4px;">
        <div>
          <div style="font-weight: 700; font-size: 0.88rem; line-height: 1.2;">${product.name}</div>
          <div style="font-size: 0.78rem; color: #64748b;">${product.diagonalStr} • ${product.tech}</div>
          <div style="font-weight: 800; font-size: 1.05rem; color: var(--accent-red); margin-top: 2px;">${formatPrice(price)}</div>
        </div>
      `;
    }

    orderModal.dataset.productName = product.name;
    orderModal.dataset.productPrice = price;
    orderModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Specs Modal
  window.openSpecsModal = (productId) => {
    const product = AIR_GROUP_CONFIG.products.find(p => p.id === productId);
    if (!product || !specsModal) return;

    const title = document.getElementById('specs-modal-title');
    const content = document.getElementById('specs-modal-content');

    if (title) title.innerText = product.name;
    if (content) {
      content.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px;">
          <img src="${product.image}" alt="${product.name}" style="max-height: 140px; margin: 0 auto; border-radius: 6px;">
        </div>
        <p style="color: #475569; font-size: 0.85rem; margin-bottom: 12px; line-height: 1.4;">${product.description}</p>
        <table class="specs-table">
          <tr><td>Диагональ</td><td>${product.diagonalStr}</td></tr>
          <tr><td>Разрешение</td><td>${product.resolution}</td></tr>
          <tr><td>Матрица</td><td>${product.tech} (${product.screenType})</td></tr>
          <tr><td>Частота</td><td>${product.refreshRate}</td></tr>
          <tr><td>Система</td><td>${product.os}</td></tr>
          <tr><td>Звук</td><td>${product.sound}</td></tr>
          <tr><td>HDR</td><td>${product.hdr}</td></tr>
          <tr><td>Разъемы</td><td>${product.ports}</td></tr>
          <tr><td>Наличие</td><td>${product.inStockKaspiysk ? 'В наличии в Каспийске' : product.inStockIzberbash ? 'В магазине в Избербаше' : 'Под заказ из Москвы (-5%)'}</td></tr>
        </table>
        <button class="btn btn-primary btn-block btn-sm" onclick="closeModals(); openOrderModal('${product.id}')">
          <i class="fa-solid fa-bolt"></i> Оформить заказ
        </button>
      `;
    }

    specsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeModals = () => {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target === el || el.classList.contains('modal-close') || el.closest('.modal-close')) {
        closeModals();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModals();
      closeFilterDrawer();
    }
  });

  // WhatsApp Order
  window.submitOrderWhatsApp = () => {
    const productName = orderModal.dataset.productName || "Телевизор TCL";
    const productPrice = orderModal.dataset.productPrice || "";
    const nameInput = document.getElementById('order-name');
    const phoneInput = document.getElementById('order-phone');
    const locationSelect = document.getElementById('order-location');

    const name = nameInput ? nameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const location = locationSelect ? locationSelect.options[locationSelect.selectedIndex].text : "Самовывоз Каспийск";

    let msg = `Здравствуйте! Хочу заказать в Air Group:\n\n`;
    msg += `📺 Модель: ${productName}\n`;
    if (productPrice) msg += `💰 Цена со склада: ${formatPrice(productPrice)}\n`;
    msg += `📍 Способ получения: ${location}\n`;
    if (name) msg += `👤 Имя: ${name}\n`;
    if (phone) msg += `📞 Телефон: ${phone}\n\n`;
    msg += `Подскажите по времени выдачи/доставки и подарку к заказу.`;

    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/${AIR_GROUP_CONFIG.company.whatsapp}?text=${encoded}`;
    window.open(url, '_blank');
    closeModals();
  };

  // Custom Order to WhatsApp
  window.submitCustomOrderWhatsApp = () => {
    const modelInput = document.getElementById('custom-model-name');
    const nameInput = document.getElementById('custom-user-name');
    const cityInput = document.getElementById('custom-user-city');

    const model = modelInput ? modelInput.value.trim() : "Редкая модель TCL";
    const name = nameInput ? nameInput.value.trim() : "";
    const city = cityInput ? cityInput.value.trim() : "";

    let msg = `Здравствуйте! Хочу заказать модель TCL со скидкой 5% из Москвы:\n\n`;
    msg += `📺 Модель / размер: ${model}\n`;
    if (name) msg += `👤 Имя: ${name}\n`;
    if (city) msg += `📍 Город: ${city}\n\n`;
    msg += `Готов обсудить условия и внести 30% предоплаты.`;

    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/${AIR_GROUP_CONFIG.company.whatsapp}?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Wholesale to WhatsApp
  window.submitWholesaleWhatsApp = () => {
    const orgInput = document.getElementById('ws-org');
    const qtyInput = document.getElementById('ws-qty');
    const phoneInput = document.getElementById('ws-phone');

    const org = orgInput ? orgInput.value.trim() : "Оптовый запрос";
    const qty = qtyInput ? qtyInput.value.trim() : "от 3-5 шт";
    const phone = phoneInput ? phoneInput.value.trim() : "";

    let msg = `Здравствуйте! Интересует оптовый прайс на телевизоры TCL (B2B):\n\n`;
    msg += `🏢 Организация: ${org}\n`;
    msg += `📦 Количество: ${qty}\n`;
    if (phone) msg += `📞 Номер: ${phone}\n\n`;
    msg += `Вышлите актуальный дилерский прайс.`;

    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/${AIR_GROUP_CONFIG.company.whatsapp}?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Mobile menu toggle
  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      mobileNav.classList.toggle('active');
    });
  }

  // Initial render
  renderProducts();
});
