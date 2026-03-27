const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSJy-xzoHUd_Mv8wL4fZNJW9PO7u2bPsanbYNAQX2dxjyd8I3K1ZFUb_pNAfPSgbmq6PKS1pwtILbVJ/pub?gid=861706525&single=true&output=csv";
const APPS_SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
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

const SAMPLE_PRODUCTS = [
  { id: 'prod_1', name: 'Dental Health Poster', category: 'Posters', price: 299, description: 'Educational poster for dental awareness.', image: 'https://via.placeholder.com/300x250/ff6b35/ffffff?text=Dental+Poster' },
  { id: 'prod_2', name: '3D Dental Model', category: '3D Models', price: 999, description: 'Detailed 3D printed dental anatomy model.', image: 'https://via.placeholder.com/300x250/0077b6/ffffff?text=3D+Model' },
  { id: 'prod_3', name: 'Handcrafted Clay Art', category: 'Handicrafts', price: 499, description: 'Beautiful handmade clay decorative piece.', image: 'https://via.placeholder.com/300x250/2a9d8f/ffffff?text=Clay+Art' },
  { id: 'prod_4', name: 'Oral Care Guide', category: 'Posters', price: 199, description: 'Complete guide to daily oral care routine.', image: 'https://via.placeholder.com/300x250/e9c46a/333333?text=Oral+Care' },
  { id: 'prod_5', name: 'Custom Keychain', category: 'Other', price: 149, description: 'Personalized 3D printed keychain.', image: 'https://via.placeholder.com/300x250/f4a261/ffffff?text=Keychain' },
  { id: 'prod_6', name: 'Dental Hygiene Chart', category: 'Posters', price: 249, description: 'Visual chart for proper brushing technique.', image: 'https://via.placeholder.com/300x250/e76f51/ffffff?text=Hygiene+Chart' },
  { id: 'prod_7', name: 'Mini Dental Kit', category: 'Other', price: 399, description: 'Compact dental care kit for travel.', image: 'https://via.placeholder.com/300x250/457b9d/ffffff?text=Dental+Kit' },
  { id: 'prod_8', name: 'Wooden Art Piece', category: 'Handicrafts', price: 799, description: 'Hand-carved wooden decorative item.', image: 'https://via.placeholder.com/300x250/d62828/ffffff?text=Wooden+Art' }
];

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

function parseCSV(str) {
  const arr = [];
  let quote = false;
  let row = [], col = '';
  for (let c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c+1];
    if (cc == '"' && quote && nc == '"') { col += cc; ++c; continue; }
    if (cc == '"') { quote = !quote; continue; }
    if (cc == ',' && !quote) { row.push(col.trim()); col = ''; continue; }
    if ((cc == '\n' || cc == '\r') && !quote) {
      row.push(col.trim());
      if(row.length > 1) arr.push(row);
      col = ''; row = [];
      if(cc == '\r' && nc == '\n') c++;
      continue;
    }
    col += cc;
  }
  if (col.length > 0) row.push(col.trim());
  if (row.length > 0) arr.push(row);
  return arr;
}

async function fetchProducts() {
  try {
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.text();
    const rows = parseCSV(data);
    rows.shift();
    products = rows.map((row, index) => ({
      id: `prod_${index}`,
      name: row[0] || "Unnamed Product",
      image: row[1] || "https://via.placeholder.com/300x250/ff6b35/ffffff?text=No+Image",
      price: parseFloat(row[5]) || 0,
      description: row[6] || "",
      category: row[7] || "Other"
    })).filter(p => p.name !== "Unnamed Product" && p.price > 0);
    
    if (products.length === 0) {
      products = SAMPLE_PRODUCTS;
    }
    
    renderProducts();
    loadingText.classList.add('hidden');
  } catch (e) {
    console.error('Fetch error:', e);
    products = SAMPLE_PRODUCTS;
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
    productGrid.innerHTML = '<p class="no-products">No products found.</p>';
    return;
  }
  
  filtered.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-image">
        <img src="${prod.image}" alt="${prod.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x250/ff6b35/ffffff?text=No+Image'">
        <span class="product-category">${prod.category}</span>
      </div>
      <div class="product-info">
        <h3 class="product-name">${prod.name}</h3>
        <p class="product-desc">${prod.description.substring(0, 60)}${prod.description.length > 60 ? '...' : ''}</p>
        <div class="product-price">₹${prod.price}</div>
        <button class="btn-add-to-cart" onclick="addToCart('${prod.id}')">
          <span class="cart-icon">+</span> Add to Cart
        </button>
      </div>
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
    cartItemsContainer.innerHTML = '<p class="empty-cart"><span class="empty-cart-icon">🛒</span>Your cart is empty.</p>';
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
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">₹${item.price} × ${item.qty}</div>
        </div>
        <div class="cart-item-actions">
          <button class="qty-btn minus" onclick="updateQty('${item.id}', -1)">-</button>
          <span class="qty-display">${item.qty}</span>
          <button class="qty-btn plus" onclick="updateQty('${item.id}', 1)">+</button>
          <button class="remove-btn" onclick="removeFromCart('${item.id}')">🗑️</button>
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
