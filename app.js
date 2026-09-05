/* ==========================================================================
   hm_accessoire31 - Customer Frontend REST API Application Logic
   ========================================================================== */

const API_BASE = ''; // Same origin

let products = [];
let wilayas = [];
let cart = JSON.parse(localStorage.getItem('hm_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('hm_wishlist')) || [];

let activeCategory = "all";
let currentSearch = "";
let currentSort = "featured";
let selectedProductForModal = null;
let selectedColorInModal = "";

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    await fetchWilayas();
    await fetchProducts();
    updateBadges();
    setupEventListeners();
}

// Fetch 58 Wilayas & Rates from REST API
async function fetchWilayas() {
    try {
        const res = await fetch(`${API_BASE}/api/delivery`);
        const data = await res.json();
        if (data.success) {
            wilayas = data.wilayas;
            renderWilayasDropdown();
        }
    } catch (err) {
        console.error('Failed to load delivery rates:', err);
    }
}

// Fetch Products from REST API
async function fetchProducts() {
    try {
        let url = `${API_BASE}/api/products?category=${activeCategory}`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
            products = data.products;
            renderProducts();
        }
    } catch (err) {
        console.error('Failed to fetch products:', err);
    }
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    let filtered = products.filter(p => {
        if (!activeCategory || activeCategory === 'all') return true;
        const pCat = (p.category_id || p.category || '').replace('cat-', '').toLowerCase();
        const aCat = activeCategory.replace('cat-', '').toLowerCase();
        return pCat === aCat;
    });

    // Sorting
    if (currentSort === "price-low") filtered.sort((a, b) => a.price - b.price);
    else if (currentSort === "price-high") filtered.sort((a, b) => b.price - a.price);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;" class="glass-card">
                <i class="fa-solid fa-box-open" style="font-size: 3rem; color: var(--gold-primary); margin-bottom: 15px;"></i>
                <h3>لم يتم العثور على أي منتج!</h3>
                <p class="text-muted">جرب البحث بكلمات أخرى أو اختر فئة مختلفة.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const inWishlist = wishlist.includes(p.id);
        const oldPriceHtml = p.old_price || p.oldPrice ? `<span class="price-del">${(p.old_price || p.oldPrice).toLocaleString()} د.ج</span>` : '';
        const badgeHtml = p.badge ? `<span class="badge-tag">${p.badge}</span>` : '';
        const img = (p.images && p.images[0]) || p.image_url || 'assets/images/watch_gold.jpg';
        const colors = Array.isArray(p.colors) ? p.colors : (p.colors ? p.colors.split(',') : ['ذهبي']);

        return `
            <div class="product-card" data-id="${p.id}">
                <div class="product-image-box">
                    ${badgeHtml}
                    <button class="wishlist-card-btn ${inWishlist ? 'active' : ''}" onclick="toggleWishlist('${p.id}', event)">
                        <i class="fa-${inWishlist ? 'solid' : 'regular'} fa-heart"></i>
                    </button>
                    <img src="${img}" alt="${p.title}" loading="lazy">
                </div>
                <div class="product-body">
                    <span class="product-cat">${getCategoryName(p.category_id || p.category)}</span>
                    <h3 class="product-title">${p.title}</h3>
                    
                    <div class="colors-swatches">
                        ${colors.map(c => `<span class="swatch-dot" style="background: ${getColorHex(c)};" title="${c}"></span>`).join('')}
                    </div>

                    <div class="product-footer-row">
                        <div class="price-container">
                            <span class="price-main">${parseFloat(p.price).toLocaleString()} د.ج</span>
                            ${oldPriceHtml}
                        </div>
                        <div class="card-actions-btn">
                            <button class="btn-glass btn-sm" onclick="openProductModal('${p.id}')">التفاصيل</button>
                            <button class="btn-icon-gold" onclick="quickAddToCart('${p.id}')" title="إضافة للسلة">
                                <i class="fa-solid fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getCategoryName(cat) {
    if (cat === "watches" || cat === "cat-watches") return "⌚ ساعات فاخرة";
    if (cat === "bracelets" || cat === "cat-bracelets") return "📿 أساور راقية";
    if (cat === "sunglasses" || cat === "cat-sunglasses") return "🕶️ نظارات شمسية";
    return "اكسسوارات";
}

function getColorHex(colorName) {
    if (colorName.includes("ذهبي") || colorName.includes("18K")) return "#D4AF37";
    if (colorName.includes("فضي")) return "#C0C0C0";
    if (colorName.includes("أسود")) return "#1A1A1A";
    if (colorName.includes("روز")) return "#E8A398";
    if (colorName.includes("بني")) return "#8B5A2B";
    return "#D4AF37";
}

function openProductModal(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    selectedProductForModal = prod;
    const colors = Array.isArray(prod.colors) ? prod.colors : (prod.colors ? prod.colors.split(',') : ['ذهبي']);
    selectedColorInModal = colors[0] || "افتراضي";
    const img = (prod.images && prod.images[0]) || prod.image_url || 'assets/images/watch_gold.jpg';

    document.getElementById('modalMainImg').src = img;
    document.getElementById('modalBadge').textContent = prod.badge || "فاخر";
    document.getElementById('modalCategoryTag').textContent = getCategoryName(prod.category_id || prod.category);
    document.getElementById('modalTitle').textContent = prod.title;
    document.getElementById('modalPrice').textContent = `${parseFloat(prod.price).toLocaleString()} د.ج`;
    
    const oldP = prod.old_price || prod.oldPrice;
    document.getElementById('modalOldPrice').textContent = oldP ? `${parseFloat(oldP).toLocaleString()} د.ج` : '';
    document.getElementById('modalDiscount').textContent = oldP ? `خصم ${Math.round((1 - prod.price/oldP)*100)}%` : '';
    document.getElementById('modalDesc').textContent = prod.description || '';
    document.getElementById('modalQty').value = 1;

    // Colors
    const colorsContainer = document.getElementById('modalColors');
    colorsContainer.innerHTML = colors.map((c, idx) => `
        <button class="color-pill ${idx === 0 ? 'active' : ''}" onclick="selectModalColor('${c}', this)">
            <span class="swatch-dot" style="background: ${getColorHex(c)};"></span> ${c}
        </button>
    `).join('');

    document.getElementById('selectedColorName').textContent = selectedColorInModal;
    document.getElementById('productModal').classList.add('active');
}

function selectModalColor(color, el) {
    selectedColorInModal = color;
    document.getElementById('selectedColorName').textContent = color;
    document.querySelectorAll('.color-pill').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
}

function quickAddToCart(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    const colors = Array.isArray(prod.colors) ? prod.colors : (prod.colors ? prod.colors.split(',') : ['ذهبي']);
    addToCart(prod, 1, colors[0] || "افتراضي");
}

function addToCart(product, qty, color) {
    const existingIndex = cart.findIndex(item => item.id === product.id && item.color === color);
    if (existingIndex > -1) {
        cart[existingIndex].qty += qty;
    } else {
        cart.push({
            id: product.id,
            title: product.title,
            price: parseFloat(product.price),
            image: (product.images && product.images[0]) || product.image_url || 'assets/images/watch_gold.jpg',
            color: color,
            qty: qty
        });
    }

    saveCart();
    showToast(`تمت إضافة "${product.title}" إلى السلة بنجاح!`);
    openCartDrawer();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCartDrawer();
}

function updateCartQty(index, delta) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    saveCart();
    renderCartDrawer();
}

function saveCart() {
    localStorage.setItem('hm_cart', JSON.stringify(cart));
    updateBadges();
}

function updateBadges() {
    const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cartBadge').textContent = cartCount;
    document.getElementById('cartDrawerCount').textContent = cartCount;

    document.getElementById('wishlistBadge').textContent = wishlist.length;
    const wlCount = document.getElementById('wishlistDrawerCount');
    if (wlCount) wlCount.textContent = wishlist.length;
}

function renderCartDrawer() {
    const body = document.getElementById('cartDrawerBody');
    if (cart.length === 0) {
        body.innerHTML = `
            <div style="text-align: center; padding: 50px 10px;">
                <i class="fa-solid fa-basket-shopping text-gold" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3>سلة التسوق فارغة حالياً</h3>
                <p class="text-muted">استمتع بتصفح الساعات والأساور والنظارات واطلب الآن.</p>
            </div>
        `;
        document.getElementById('cartSubtotal').textContent = "0 د.ج";
        return;
    }

    let subtotal = 0;
    body.innerHTML = cart.map((item, idx) => {
        subtotal += item.price * item.qty;
        return `
            <div class="cart-item">
                <img src="${item.image}" class="cart-item-img" alt="${item.title}">
                <div class="cart-item-info">
                    <span class="cart-item-title">${item.title}</span>
                    <span class="cart-item-color">اللون: ${item.color}</span>
                    <div class="cart-item-bottom">
                        <span class="cart-item-price">${(item.price * item.qty).toLocaleString()} د.ج</span>
                        <div class="quantity-selector" style="transform: scale(0.85); transform-origin: right;">
                            <button onclick="updateCartQty(${idx}, -1)">-</button>
                            <input type="text" value="${item.qty}" readonly>
                            <button onclick="updateCartQty(${idx}, 1)">+</button>
                        </div>
                    </div>
                </div>
                <button class="cart-remove-btn" onclick="removeFromCart(${idx})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    }).join('');

    document.getElementById('cartSubtotal').textContent = `${subtotal.toLocaleString()} د.ج`;
}

function openCartDrawer() {
    renderCartDrawer();
    document.getElementById('cartDrawerOverlay').classList.add('active');
}

function toggleWishlist(id, event) {
    if (event) event.stopPropagation();
    const idx = wishlist.indexOf(id);
    if (idx > -1) {
        wishlist.splice(idx, 1);
        showToast("تمت إزالة المنتج من المفضلة");
    } else {
        wishlist.push(id);
        showToast("تمت إضافة المنتج إلى المفضلة ❤️");
    }
    localStorage.setItem('hm_wishlist', JSON.stringify(wishlist));
    updateBadges();
    renderProducts();
}

async function fetchWilayas() {
    try {
        const res = await fetch(`${API_BASE}/api/delivery`);
        const data = await res.json();
        if (data.success && data.wilayas && data.wilayas.length > 0) {
            wilayas = data.wilayas;
            renderWilayasDropdown();
            return;
        }
    } catch (err) {
        console.error('Failed to load delivery rates:', err);
    }

    wilayas = JSON.parse(localStorage.getItem('hm_wilayas')) || [];
    renderWilayasDropdown();
}

function renderWilayasDropdown() {
    const select = document.getElementById('custWilaya');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>اختر الولاية (58 ولاية)</option>' + 
        wilayas.map(w => `<option value="${w.wilaya_id || w.id}">${w.wilaya_id || w.id} - ${w.wilaya_name || w.name}</option>`).join('');
}

function calculateCheckoutTotal() {
    const selectedWilayaId = document.getElementById('custWilaya').value;
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked')?.value || "stopdesk";

    let productsTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('checkoutProductsTotal').textContent = `${productsTotal.toLocaleString()} د.ج`;

    const wilayaObj = wilayas.find(w => (w.wilaya_id || w.id) == selectedWilayaId || parseInt(w.wilaya_id || w.id) == parseInt(selectedWilayaId));

    if (!wilayaObj) {
        document.getElementById('stopDeskFeeBadge').textContent = "اختر الولاية أولاً";
        document.getElementById('homeFeeBadge').textContent = "اختر الولاية أولاً";
        document.getElementById('checkoutShippingFee').textContent = "-- د.ج";
        document.getElementById('checkoutGrandTotal').textContent = `${productsTotal.toLocaleString()} د.ج`;
        return;
    }

    const stopdeskFee = parseFloat(wilayaObj.stopdesk_fee || wilayaObj.stopdesk || 400);
    const homeFee = parseFloat(wilayaObj.home_fee || wilayaObj.home || 600);

    document.getElementById('stopDeskFeeBadge').textContent = `${stopdeskFee.toLocaleString()} د.ج`;
    document.getElementById('homeFeeBadge').textContent = `${homeFee.toLocaleString()} د.ج`;

    let fee = (deliveryType === "home") ? homeFee : stopdeskFee;
    document.getElementById('checkoutShippingFee').textContent = `${fee.toLocaleString()} د.ج`;

    let grandTotal = productsTotal + fee;
    document.getElementById('checkoutGrandTotal').textContent = `${grandTotal.toLocaleString()} د.ج`;
}

// Order Submission via REST API
async function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (cart.length === 0) {
        showToast("سلة التسوق فارغة!");
        return;
    }

    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const wilayaId = document.getElementById('custWilaya').value;
    const baladiya = document.getElementById('custBaladiya').value.trim();
    const deliveryType = document.querySelector('input[name="deliveryType"]:checked').value;

    try {
        const res = await fetch(`${API_BASE}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                phone,
                wilayaId,
                baladiya,
                deliveryType,
                items: cart
            })
        });

        const data = await res.json();
        if (data.success) {
            cart = [];
            saveCart();
            document.getElementById('checkoutModal').classList.remove('active');
            showOrderSuccessReceipt(data.order);
        } else {
            showToast(data.message || 'حدث خطأ أثناء حفظ الطلب');
        }
    } catch (err) {
        showToast('تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً');
    }
}

function showOrderSuccessReceipt(order) {
    const receiptBox = document.getElementById('receiptDetails');
    receiptBox.innerHTML = `
        <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 10px;">
            <strong>رقم الطلب: <span class="text-gold">${order.id || order.order_number}</span></strong><br>
            <small>تاريخ الطلب: ${order.date || order.created_at}</small>
        </div>
        <p><strong>العميل:</strong> ${order.customerName || order.customer_name}</p>
        <p><strong>رقم الهاتف:</strong> ${order.phone}</p>
        <p><strong>العنوان:</strong> ${order.wilaya || order.wilaya_name} - ${order.baladiya}</p>
        <p><strong>نوع التوصيل:</strong> ${order.deliveryType || order.delivery_type} (${(order.deliveryFee || order.delivery_fee).toLocaleString()} د.ج)</p>
        <hr style="border-color: var(--border-color); margin: 10px 0;">
        <h4 style="margin-bottom: 8px;">المنتجات المطلوبة:</h4>
        <ul style="margin-bottom: 10px;">
            ${order.items.map(i => `<li>- ${i.title || i.product_title} (${i.color}) × ${i.qty || i.quantity} = ${((i.price) * (i.qty || i.quantity)).toLocaleString()} د.ج</li>`).join('')}
        </ul>
        <div style="font-size: 1.15rem; font-weight: 800; color: var(--gold-primary); border-top: 1px dashed var(--gold-primary); padding-top: 8px;">
            المبلغ الإجمالي المستحق عند الاستلام: ${(order.grandTotal || order.grand_total).toLocaleString()} د.ج
        </div>
    `;
    document.getElementById('orderSuccessModal').classList.add('active');
}

function setupEventListeners() {
    document.querySelectorAll('.nav-link, .tab-btn, .footer-category-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const cat = btn.getAttribute('data-category') || btn.getAttribute('data-cat');
            if (cat) {
                activeCategory = cat;
                document.querySelectorAll('.nav-link, .tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll(`[data-category="${cat}"], [data-cat="${cat}"]`).forEach(b => b.classList.add('active'));
                fetchProducts();
            }
        });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            fetchProducts();
        });
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }

    document.getElementById('closeProductModal').addEventListener('click', () => {
        document.getElementById('productModal').classList.remove('active');
    });

    document.getElementById('modalAddToCartBtn').addEventListener('click', () => {
        if (!selectedProductForModal) return;
        const qty = parseInt(document.getElementById('modalQty').value) || 1;
        addToCart(selectedProductForModal, qty, selectedColorInModal);
        document.getElementById('productModal').classList.remove('active');
    });

    document.getElementById('qtyMinus').addEventListener('click', () => {
        const input = document.getElementById('modalQty');
        let val = parseInt(input.value) || 1;
        if (val > 1) input.value = val - 1;
    });

    document.getElementById('qtyPlus').addEventListener('click', () => {
        const input = document.getElementById('modalQty');
        let val = parseInt(input.value) || 1;
        input.value = val + 1;
    });

    document.getElementById('cartNavBtn').addEventListener('click', openCartDrawer);
    document.getElementById('closeCartDrawer').addEventListener('click', () => {
        document.getElementById('cartDrawerOverlay').classList.remove('active');
    });

    document.getElementById('wishlistNavBtn').addEventListener('click', () => {
        document.getElementById('wishlistDrawerOverlay').classList.add('active');
    });
    document.getElementById('closeWishlistDrawer').addEventListener('click', () => {
        document.getElementById('wishlistDrawerOverlay').classList.remove('active');
    });

    document.getElementById('checkoutTriggerBtn').addEventListener('click', () => {
        if (cart.length === 0) {
            showToast("سلة التسوق فارغة!");
            return;
        }
        document.getElementById('cartDrawerOverlay').classList.remove('active');
        document.getElementById('checkoutModal').classList.add('active');
        calculateCheckoutTotal();
    });

    document.getElementById('closeCheckoutModal').addEventListener('click', () => {
        document.getElementById('checkoutModal').classList.remove('active');
    });

    document.getElementById('custWilaya').addEventListener('change', calculateCheckoutTotal);
    document.querySelectorAll('input[name="deliveryType"]').forEach(r => {
        r.addEventListener('change', calculateCheckoutTotal);
    });

    document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
    document.getElementById('closeSuccessModalBtn').addEventListener('click', () => {
        document.getElementById('orderSuccessModal').classList.remove('active');
    });

    const openTrackModal = () => document.getElementById('trackOrderModal').classList.add('active');
    document.getElementById('trackOrderNavBtn').addEventListener('click', openTrackModal);
    document.getElementById('openTrackFooter').addEventListener('click', (e) => {
        e.preventDefault();
        openTrackModal();
    });
    document.getElementById('closeTrackModal').addEventListener('click', () => {
        document.getElementById('trackOrderModal').classList.remove('active');
    });
}

function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-gold"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
