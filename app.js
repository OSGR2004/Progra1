// --- Carrito (localStorage) + exportar PDF con jsPDF (CDN) ---
const CART_KEY = 'mi_menu_cart_v1';

const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const saveCart = (c) => { localStorage.setItem(CART_KEY, JSON.stringify(c)); syncBadge(); };
const clearCart = () => { saveCart([]); renderCart(); };

function addToCart(item){
  const cart = getCart();
  const i = cart.findIndex(p => p.name === item.name);
  if(i >= 0) cart[i].qty += item.qty || 1;
  else cart.push({ name: item.name, price: +item.price||0, qty: item.qty||1, category: item.category||'' });
  saveCart(cart);
  openCart();
  renderCart();
}

function removeFromCart(name){
  saveCart(getCart().filter(p => p.name !== name));
  renderCart();
}

function updateQty(name, qty){
  const cart = getCart();
  const i = cart.findIndex(p => p.name === name);
  if(i >= 0){
    cart[i].qty = Math.max(1, +qty||1);
    saveCart(cart);
    renderCart();
  }
}

const cartTotal = () => getCart().reduce((s,p) => s + p.price * p.qty, 0);

function syncBadge(){
  const n = getCart().reduce((s,p) => s + p.qty, 0);
  document.querySelectorAll('[data-cart-badge]').forEach(el => el.textContent = n);
}

const openCart = () => document.querySelector('.cart-drawer')?.classList.add('open');
const closeCart = () => document.querySelector('.cart-drawer')?.classList.remove('open');

function renderCart(){
  const itemsEl = document.querySelector('.cart-items');
  if(!itemsEl) return;
  const cart = getCart();
  itemsEl.innerHTML = '';
  if(cart.length === 0){
    itemsEl.innerHTML = `<p class="small">Tu carrito está vacío. Agrega productos desde cualquier página.</p>`;
  } else {
    cart.forEach(p => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div>
          <div><strong>${p.name}</strong></div>
          <div class="small">${p.category || ''}</div>
          <div class="small">Precio: $${p.price.toFixed(2)}</div>
        </div>
        <input class="input" type="number" min="1" value="${p.qty}" aria-label="Cantidad">
        <button class="btn gray" aria-label="Quitar">✕</button>
      `;
      row.querySelector('input').addEventListener('input', e => updateQty(p.name, e.target.value));
      row.querySelector('button').addEventListener('click', () => removeFromCart(p.name));
      itemsEl.appendChild(row);
    });
  }
  const totalEl = document.querySelector('[data-cart-total]');
  if(totalEl) totalEl.textContent = `$${cartTotal().toFixed(2)}`;
  syncBadge();
}

function exportCartPDF(){
  if(typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined'){
    alert('No se pudo cargar jsPDF desde el CDN. Revisa tu conexión.');
    return;
  }
  const doc = new (window.jspdf ? window.jspdf.jsPDF : window.jsPDF)({unit:'pt'});
  const cart = getCart();
  const date = new Date().toLocaleString();

  doc.setFont('helvetica','bold');
  doc.setFontSize(18);
  doc.text('Pedido - Carrito', 40, 50);

  doc.setFont('helvetica','normal');
  doc.setFontSize(11);
  doc.text(`Generado: ${date}`, 40, 70);

  let y = 100;

  doc.setFont('helvetica','bold');
  doc.text('Producto', 40, y);
  doc.text('Cant.', 320, y);
  doc.text('P. Unit.', 380, y);
  doc.text('Importe', 460, y);
  doc.setLineWidth(.6);
  doc.line(40, y + 6, 555, y + 6);

  y += 24;
  doc.setFont('helvetica','normal');

  if(cart.length === 0){
    doc.text('Carrito vacío.', 40, y);
  } else {
    cart.forEach(p => {
      const imp = p.price * p.qty;
      doc.text(String(p.name), 40, y);
      doc.text(String(p.qty), 320, y, {align:'right'});
      doc.text(`$${p.price.toFixed(2)}`, 380, y, {align:'right'});
      doc.text(`$${imp.toFixed(2)}`, 500, y, {align:'right'});
      y += 20;
      if(y > 740){
        doc.addPage();
        y = 60;
      }
    });
  }

  y += 10;
  doc.setLineWidth(.6);
  doc.line(40, y, 555, y);

  y += 24;
  doc.setFont('helvetica','bold');
  doc.text(`Total: $${cartTotal().toFixed(2)}`, 40, y);

  doc.save('pedido.pdf');
}

function wireAddButtons(){
  document.querySelectorAll('[data-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const {name, price, category, qtyId} = btn.dataset;
      const qtyInput = document.getElementById(qtyId);
      const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

      addToCart({
        name,
        price: +price,
        category,
        qty
      });
    });
  });
}

// Init
window.addEventListener('DOMContentLoaded', () => {
  syncBadge();
  renderCart();
  wireAddButtons();

  document.querySelectorAll('[data-open-cart]').forEach(b => b.addEventListener('click', openCart));
  document.querySelectorAll('[data-close-cart]').forEach(b => b.addEventListener('click', closeCart));
  document.querySelectorAll('[data-export-pdf]').forEach(b => b.addEventListener('click', exportCartPDF));
  document.querySelectorAll('[data-clear-cart]').forEach(b => b.addEventListener('click', clearCart));
});
