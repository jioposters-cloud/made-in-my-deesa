const SHEETS_CONFIG = { URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJy-xzoHUd_Mv8wL4fZNJW9PO7u2bPsanbYNAQX2dxjyd8I3K1ZFUb_pNAfPSgbmq6PKS1pwtILbVJ/pub?gid=861706525&single=true&output=csv' };

const FALLBACK_PRODUCTS = [
  { id: 0, name: 'Dental Health Poster', category: 'Posters', price: 299, description: 'Educational dental awareness poster', thumbnail: 'https://via.placeholder.com/300x250/ff6b35/ffffff?text=Dental+Poster', image1: 'https://via.placeholder.com/300x250/ff6b35/ffffff?text=Dental+Poster', availability: 'Show' },
  { id: 1, name: '3D Dental Model', category: '3D Models', price: 999, description: '3D printed dental anatomy model', thumbnail: 'https://via.placeholder.com/300x250/0077b6/ffffff?text=3D+Model', image1: 'https://via.placeholder.com/300x250/0077b6/ffffff?text=3D+Model', availability: 'Show' },
  { id: 2, name: 'Handcrafted Clay Art', category: 'Handicrafts', price: 499, description: 'Beautiful handmade clay decoration', thumbnail: 'https://via.placeholder.com/300x250/2a9d8f/ffffff?text=Clay+Art', image1: 'https://via.placeholder.com/300x250/2a9d8f/ffffff?text=Clay+Art', availability: 'Show' },
  { id: 3, name: 'Oral Care Guide', category: 'Posters', price: 199, description: 'Daily oral care routine guide', thumbnail: 'https://via.placeholder.com/300x250/e9c46a/333333?text=Oral+Care', image1: 'https://via.placeholder.com/300x250/e9c46a/333333?text=Oral+Care', availability: 'Show' },
  { id: 4, name: 'Custom Keychain', category: 'Other', price: 149, description: 'Personalized 3D printed keychain', thumbnail: 'https://via.placeholder.com/300x250/f4a261/ffffff?text=Keychain', image1: 'https://via.placeholder.com/300x250/f4a261/ffffff?text=Keychain', availability: 'Show' },
  { id: 5, name: 'Dental Hygiene Chart', category: 'Posters', price: 249, description: 'Proper brushing technique chart', thumbnail: 'https://via.placeholder.com/300x250/e76f51/ffffff?text=Hygiene+Chart', image1: 'https://via.placeholder.com/300x250/e76f51/ffffff?text=Hygiene+Chart', availability: 'Show' },
  { id: 6, name: 'Mini Dental Kit', category: 'Other', price: 399, description: 'Compact travel dental care kit', thumbnail: 'https://via.placeholder.com/300x250/457b9d/ffffff?text=Dental+Kit', image1: 'https://via.placeholder.com/300x250/457b9d/ffffff?text=Dental+Kit', availability: 'Show' },
  { id: 7, name: 'Wooden Art Piece', category: 'Handicrafts', price: 799, description: 'Hand-carved wooden decorative item', thumbnail: 'https://via.placeholder.com/300x250/d62828/ffffff?text=Wooden+Art', image1: 'https://via.placeholder.com/300x250/d62828/ffffff?text=Wooden+Art', availability: 'Show' }
];

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
