// Made in My Deesa - Product Loader from products.json
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx7FcRGU-yBrEI6RY_5i8z_425ocBqYqU3szDgrVsvpMqucywzfHXy78EM4vVnx05A3/exec";
const RAZORPAY_HANDLE = "StatusRing";

let products = [];
let currentCategory = "all";
let currentSort = "default";
let cart = JSON.parse(localStorage.getItem("made_in_deesa_cart")) || [];

const productGrid = document.getElementById('product-grid');
const loadingText = document.getElementById('loading');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartOverlay = document.getElementById('cart-overlay');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalAmount = document.getElementById('cart-total-amount');
const checkoutBtn = document.getElementById('checkout-btn');
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckout = document.getElementById('close-checkout');
const checkoutFinalAmount = document.getElementById('checkout-final-amount');
const checkoutForm = document.getElementById('checkout-form');
const cartModalTitle = document.getElementById('cart-modal-title');
const cartTotalText = document.getElementById('cart-total-text');
const checkoutTitle = document.getElementById('checkout-title');

const categoryBtns = document.querySelectorAll('.category-btn');
const sortBtn = document.getElementById('sort-btn');

// DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateCartUI();
    setupEventListeners();
    setupCategoryFilters();
    setupSort();
    setupSearch();
});

function setupEventListeners() {
    cartBtn.onclick = () => cartOverlay.classList.add('active');
    closeCart.onclick = () => cartOverlay.classList.remove('active');
    
    checkoutBtn.onclick = () => {
        if (cart.length === 0) return showToast('Your cart is empty!');
        cartOverlay.classList.remove('active');
        checkoutModal.classList.add('active');
        checkoutFinalAmount.innerText = `₹${getCartTotal()}`;
    };
    
    closeCheckout.onclick = () => checkoutModal.classList.remove('active');
    checkoutForm.onsubmit = handleCheckoutSubmit;
}

function setupCategoryFilters() {
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.getAttribute('data-category');
            renderProducts();
        });
    });
}

function setupSort() {
    if (sortBtn) {
        sortBtn.addEventListener('change', () => {
            currentSort = sortBtn.value;
            renderProducts();
        });
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', renderProducts);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(renderProducts, 300);
        });
    }
}

async function fetchProducts() {
    try {
        console.log('Loading My Deesa products from products.json...');
        const response = await fetch('/products.json');
        if (!response.ok) throw new Error('fetch failed');
        
        products = await response.json();
        console.log(`✅ Loaded ${products.length} My Deesa products`);
        
        renderProducts();
        loadingText.classList.add('hidden');
    } catch (e) {
        console.error('❌ Error loading products:', e);
        products = [];
        renderProducts();
        loadingText.classList.add('hidden');
    }
}

function renderProducts() {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    let filtered = products;
    
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
    }
    
    if (currentSort === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (currentSort === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (currentSort === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    productGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        productGrid.innerHTML = `<div class="no-products"><p>No products found.</p></div>`;
        return;
    }
    
    filtered.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${prod.image}" alt="${prod.name}" loading="lazy">
            <span class="category-badge">${prod.category}</span>
            <h3>${prod.name}</h3>
            <p>${prod.description.substring(0, 60)}${prod.description.length > 60 ? '...' : ''}</p>
            <div class="price">₹${prod.price}</div>
            <button class="add-to-cart-btn" onclick="addToCart('${prod.id}')">
                <i class="fas fa-plus"></i> Add to Cart
            </button>
        `;
        productGrid.appendChild(card);
    });
}

window.addToCart = (productId) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    
    const existing = cart.find(item => item.id === productId);
    if (existing) existing.qty += 1;
    else cart.push({ ...p, qty: 1 });
    
    saveCart();
    showToast(`"${p.name}" added to cart!`);
};

function saveCart() {
    localStorage.setItem("made_in_deesa_cart", JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
    cartCount.innerText = totalItems;
    cartCount.classList.toggle('has-items', totalItems > 0);
    
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<div class="empty-cart"><p>🛒 Your cart is empty.</p></div>`;
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('disabled');
    } else {
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('disabled');
        
        cart.forEach(item => {
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price} × ${item.qty}</p>
                </div>
                <div class="cart-item-controls">
                    <button onclick="updateQty('${item.id}', -1)">−</button>
                    <span>${item.qty}</span>
                    <button onclick="updateQty('${item.id}', 1)">+</button>
                    <button onclick="removeFromCart('${item.id}')">🗑️</button>
                </div>
            `;
            cartItemsContainer.appendChild(el);
        });
    }
    
    const total = getCartTotal();
    cartTotalAmount.innerText = `₹${total}`;
    if (cartTotalText) cartTotalText.innerText = `Total: ₹${total}`;
    if (cartModalTitle) cartModalTitle.innerText = `Shopping Cart (${totalItems})`;
}

window.updateQty = (productId, change) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    item.qty += change;
    if (item.qty <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
    }
};

window.removeFromCart = (productId) => {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
};

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.qty), 0);
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('checkoutName')?.value || '';
    const phone = document.getElementById('checkoutPhone')?.value || '';
    const address = document.getElementById('checkoutAddress')?.value || '';
    const totalAmount = getCartTotal();
    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    const razorpayNote = `Order: ${orderId} | Name: ${name} | Phone: ${phone}`;
    
    window.location.href = `https://razorpay.me/@${RAZORPAY_HANDLE}?amount=${totalAmount}&note=${encodeURIComponent(razorpayNote)}`;
}

// Toast notification
function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Scroll to top functionality
function setupScrollToTop() {
    const scrollBtn = document.querySelector('.scroll-top');
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            scrollBtn.classList.toggle('visible', window.scrollY > 300);
        });
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId !== '#') {
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
});

// Sticky header
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (header) {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }
    
    const btn = document.querySelector('.scroll-top');
    if (btn) {
        btn.classList.toggle('visible', window.scrollY > 300);
    }
});

// Initialize on load
setupScrollToTop();
