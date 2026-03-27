// MY DEESA SHOPPING - Simple JSON Product Loader
// Loads products from products.json instead of Google Sheets

function loadProductsFromSheets() {
  console.log('Loading My Deesa products from products.json...');
  
  fetch('/products.json')
    .then(res => res.ok ? res.json() : Promise.reject('fetch failed'))
    .then(products => {
      console.log(`✅ Loaded ${products.length} My Deesa products`);
      window.products = products;
      if (typeof initStore === 'function') {
        initStore();
      }
    })
    .catch(err => {
      console.error('❌ Error loading products:', err);
      window.products = [];
    });
}

// Load products when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadProductsFromSheets);
} else {
  loadProductsFromSheets();
}
