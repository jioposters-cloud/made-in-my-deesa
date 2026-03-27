const SHEETS_CONFIG = { URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYyFPzhjSOOAyGEwJ6D4JzhrwJdgnfLG7cnppPU2DC5iT4JRmCQ0Y7MFK1d93nNJuT9n1ebjLt_j8w/pub?gid=0&single=true&output=csv' };


const FALLBACK_PRODUCTS = [];

function loadProductsFromSheets() {
  fetch(SHEETS_CONFIG.URL)
    .then(res => res.ok ? res.text() : Promise.reject('fetch failed'))
    .then(csv => {
      const products = parseCSVToProducts(csv);
      if (products && products.length > 0) {
        window.products = products;
      } else {
        window.products = FALLBACK_PRODUCTS;
      }
      if (typeof initStore === 'function') initStore();
    })
    .catch(err => {
      console.warn('Sheets fetch failed, using fallback:', err);
      window.products = FALLBACK_PRODUCTS;
      if (typeof initStore === 'function') initStore();
    });
}

function parseCSVToProducts(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const hs = parseCSVLine(lines[0]);
  const nI = hs.indexOf('Product Name'), cI = hs.indexOf('Category'), pI = hs.indexOf('Price'), dI = hs.indexOf('Discreption') !== -1 ? hs.indexOf('Discreption') : hs.indexOf('Description'), mI = hs.indexOf('Main image');
  return lines.slice(1).map((l, i) => {
    const cs = parseCSVLine(l);
    return { id: i, name: cs[nI], category: cs[cI], price: parseFloat((cs[pI]||'0').replace(/[^0-9.]/g,''))||0, description: cs[dI] || '', thumbnail: cs[mI], image1: cs[mI], availability: 'Show' };
  }).filter(p => p.name && p.name.trim());
}

function parseCSVLine(l) {
  const r = []; let c = '', q = false;
  for (let i = 0; i < l.length; i++) {
    if (l[i] === '"') q = !q;
    else if (l[i] === ',' && !q) { r.push(c.trim()); c = ''; }
    else c += l[i];
  }
  r.push(c.trim());
  return r;
}

loadProductsFromSheets();
