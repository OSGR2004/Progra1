// --- Carrito (localStorage) + exportar PDF con jsPDF (CDN) ---
const CART_KEY = 'mi_menu_cart_v1';

const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || '[]');
const saveCart = (c) => { localStorage.setItem(CART_KEY, JSON.stringify(c)); syncBadge(); };
const clearCart = () => { saveCart([]); renderCart(); };

function addToCart(item){
  const cart = getCart();

  // Buscar item idéntico: mismo name + mismos extras
  const i = cart.findIndex(p => JSON.stringify(p.extras) === JSON.stringify(item.extras) && p.name === item.name);

  if(i >= 0){
    cart[i].qty += item.qty || 1;
  } else {
    cart.push({ 
      name: item.name, 
      price: +item.price||0, 
      qty: item.qty||1, 
      category: item.category||'', 
      extras: item.extras || {} 
    });
  }

  saveCart(cart);
  openCart();
  renderCart();

  // Feedback visual
  showToast(`${item.name} agregado al carrito`);
  animateCartIcon();
}

function removeFromCart(name, extras){
  const cart = getCart().filter(p => !(p.name === name && JSON.stringify(p.extras) === JSON.stringify(extras)));
  saveCart(cart);
  renderCart();
}

function updateQty(name, qty, extras){
  const cart = getCart();
  const i = cart.findIndex(p => p.name === name && JSON.stringify(p.extras) === JSON.stringify(extras));
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
          ${p.extras ? `
            <div class="small">Orden: ${p.extras.tipoOrden || '-'}</div>
            <div class="small">Ingredientes: ${(p.extras.ingredientes||[]).join(', ')}</div>
            <div class="small">Notas: ${p.extras.comentarios || '-'}</div>
          ` : ''}
        </div>
        <input class="input" type="number" min="1" value="${p.qty}" aria-label="Cantidad">
        <button class="btn gray" aria-label="Quitar">✕</button>
      `;
      row.querySelector('input').addEventListener('input', e => updateQty(p.name, e.target.value, p.extras));
      row.querySelector('button').addEventListener('click', () => removeFromCart(p.name, p.extras));
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
      y += 16;

      // Extras
      if(p.extras){
        if(p.extras.tipoOrden){
          doc.setFontSize(9);
          doc.text(`Orden: ${p.extras.tipoOrden}`, 60, y);
          y += 12;
        }
        if(p.extras.ingredientes?.length){
          doc.setFontSize(9);
          doc.text(`Ing.: ${p.extras.ingredientes.join(', ')}`, 60, y);
          y += 12;
        }
        if(p.extras.comentarios){
          doc.setFontSize(9);
          doc.text(`Notas: ${p.extras.comentarios}`, 60, y);
          y += 12;
        }
        doc.setFontSize(11);
      }

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
      const {name, price, category, qtyId, extras} = btn.dataset;
      const qtyInput = document.getElementById(qtyId);
      const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

      let extraData = {};
      if (extras) {
        try {
          const cfg = JSON.parse(extras);

          // Tipo de orden
          if (cfg.orderTypeId) {
            const sel = document.getElementById(cfg.orderTypeId);
            extraData.tipoOrden = sel ? sel.value : '';
          }

          // Ingredientes seleccionados
          if (cfg.ingredients) {
            extraData.ingredientes = cfg.ingredients
              .map(opt => {
                const el = document.getElementById(opt.id);
                return el && el.checked ? opt.name : null;
              })
              .filter(Boolean);
          }

          // Comentarios
          if (cfg.commentsId) {
            const el = document.getElementById(cfg.commentsId);
            extraData.comentarios = el ? el.value.trim() : '';
          }
        } catch(e) {
          console.error('Error al parsear extras', e);
        }
      }

      addToCart({
        name,
        price: +price,
        category,
        qty,
        extras: extraData
      });
    });
  });
}

// --- Función para mostrar notificación tipo "toast" ---
function showToast(msg) {
  let toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// --- Animar el ícono del carrito ---
function animateCartIcon() {
  const badge = document.querySelector('[data-cart-badge]');
  if (!badge) return;
  badge.classList.add('bump');
  setTimeout(() => badge.classList.remove('bump'), 400);
}

document.addEventListener("DOMContentLoaded", () => {
  // Cambiar precio según tipo de orden
  const priceRules = {
    pozole: { completa: 95, media: 60 },
    enchiladas: { completa: 70, media: 40 },
    tostadas: { completa: 60, media: 40 },
    flautas: { completa: 70, media: 40 },
    "tacos-rojos": { completa: 70, media: 40 }
  };

  Object.keys(priceRules).forEach((id) => {
    const select = document.getElementById(`order-type-${id}`);
    const card = select.closest(".card");
    const priceElement = card.querySelector(".price");
    const addButton = card.querySelector("[data-add]");

    select.addEventListener("change", () => {
      const value = select.value.toLowerCase();
      const newPrice = priceRules[id][value];

      if (id === "pozole") priceElement.textContent = `$${newPrice} / litro`;
      else priceElement.textContent = `$${newPrice}`;

      addButton.setAttribute("data-price", newPrice);
    });
  });
});

// --- Init ---
window.addEventListener('DOMContentLoaded', () => {
  syncBadge();
  renderCart();
  wireAddButtons();

  document.querySelectorAll('[data-open-cart]').forEach(b => b.addEventListener('click', openCart));
  document.querySelectorAll('[data-close-cart]').forEach(b => b.addEventListener('click', closeCart));
  document.querySelectorAll('[data-export-pdf]').forEach(b => b.addEventListener('click', exportCartPDF));
  document.querySelectorAll('[data-clear-cart]').forEach(b => b.addEventListener('click', clearCart));
});
