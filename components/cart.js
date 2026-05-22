(function () {
  var KEY = 'elvyn-cart';

  /* ── State ── */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(KEY, JSON.stringify(cart));
    updateBadge();
  }

  /* ── Badge ── */
  function updateBadge() {
    var cart = getCart();
    var count = cart.reduce(function (s, i) { return s + i.quantity; }, 0);
    var badge = document.getElementById('cart-badge');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  /* ── Public API ── */
  window.addToCart = function (product) {
    var cart = getCart();
    var existing = cart.find(function (i) { return i.name === product.name; });
    if (existing) { existing.quantity++; } else { cart.push({ name: product.name, price: product.price, quantity: 1 }); }
    saveCart(cart);
    renderCart();
    openSidebar();
  };

  window.openCart = function () { openSidebar(); };

  window.cartUpdateQty = function (name, delta) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.name === name; });
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) cart = cart.filter(function (i) { return i.name !== name; });
    }
    saveCart(cart);
    renderCart();
  };

  window.cartCheckout = async function () {
    var cart = getCart();
    if (!cart.length) return;

    var emailEl   = document.getElementById('cart-email');
    var errEl     = document.getElementById('cart-email-error');
    var netErrEl  = document.getElementById('cart-net-error');
    var addrErrEl = document.getElementById('cart-addr-error');
    var btn       = document.getElementById('cart-checkout-btn');
    var email     = emailEl ? emailEl.value.trim() : '';

    var name    = (document.getElementById('cart-name')    || {}).value || '';
    var street  = (document.getElementById('cart-street')  || {}).value || '';
    var city    = (document.getElementById('cart-city')    || {}).value || '';
    var state   = (document.getElementById('cart-state')   || {}).value || '';
    var zip     = (document.getElementById('cart-zip')     || {}).value || '';
    var country = (document.getElementById('cart-country') || {}).value || '';
    name = name.trim(); street = street.trim(); city = city.trim();
    state = state.trim(); zip = zip.trim(); country = country.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (errEl) errEl.style.display = 'block';
      return;
    }
    if (errEl) errEl.style.display = 'none';

    if (!name || !street || !city || !state || !zip || !country) {
      if (addrErrEl) addrErrEl.style.display = 'block';
      return;
    }
    if (addrErrEl) addrErrEl.style.display = 'none';
    if (netErrEl)  netErrEl.style.display  = 'none';

    btn.disabled    = true;
    btn.textContent = 'Processing…';

    var shipping = { name: name, street: street, city: city, state: state, zip: zip, country: country };

    try {
      var res  = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart: cart, email: email, shipping: shipping }) });
      var data = await res.json();
      if (res.ok && data.checkout_url) {
        localStorage.removeItem(KEY);
        window.location.href = data.checkout_url;
      } else {
        if (netErrEl) { netErrEl.textContent = data.error || 'Something went wrong.'; netErrEl.style.display = 'block'; }
        btn.disabled    = false;
        btn.textContent = 'Checkout';
      }
    } catch {
      if (netErrEl) { netErrEl.textContent = 'Network error. Please try again.'; netErrEl.style.display = 'block'; }
      btn.disabled    = false;
      btn.textContent = 'Checkout';
    }
  };

  /* ── Sidebar ── */
  function openSidebar() {
    var s = document.getElementById('cart-sidebar');
    var o = document.getElementById('cart-overlay');
    if (s) s.classList.add('open');
    if (o) o.classList.add('open');
    renderCart();
  }

  function closeSidebar() {
    var s = document.getElementById('cart-sidebar');
    var o = document.getElementById('cart-overlay');
    if (s) s.classList.remove('open');
    if (o) o.classList.remove('open');
  }

  function renderCart() {
    var cart    = getCart();
    var itemsEl = document.getElementById('cart-items');
    var footerEl = document.getElementById('cart-footer');
    var emptyEl = document.getElementById('cart-empty');
    var totalEl = document.getElementById('cart-total-amount');
    if (!itemsEl) return;

    var total = cart.reduce(function (s, i) { return s + i.price * i.quantity; }, 0);

    if (!cart.length) {
      itemsEl.innerHTML = '';
      if (emptyEl)  emptyEl.style.display  = 'block';
      if (footerEl) footerEl.style.display = 'none';
    } else {
      if (emptyEl)  emptyEl.style.display  = 'none';
      if (footerEl) footerEl.style.display = 'flex';
      itemsEl.innerHTML = cart.map(function (item) {
        return '<div class="cart-item">'
          + '<div class="cart-item-info"><p class="cart-item-name">' + item.name + '</p>'
          + '<p class="cart-item-price">$' + (item.price * item.quantity).toFixed(2) + '</p></div>'
          + '<div class="cart-item-qty">'
          + '<button class="cart-qty-btn" onclick="cartUpdateQty(\'' + item.name + '\',-1)">−</button>'
          + '<span class="cart-qty-num">' + item.quantity + '</span>'
          + '<button class="cart-qty-btn" onclick="cartUpdateQty(\'' + item.name + '\',1)">+</button>'
          + '</div></div>';
      }).join('');
      if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
    }
    updateBadge();
  }

  /* ── Init ── */
  function init() {
    // Styles
    var style = document.createElement('style');
    style.textContent = [
      '#cart-overlay{display:none;position:fixed;inset:0;background:rgba(5,5,9,0.72);backdrop-filter:blur(5px);z-index:8000;}',
      '#cart-overlay.open{display:block;}',
      '#cart-sidebar{position:fixed;top:0;right:0;height:100%;width:440px;max-width:96vw;background:rgba(9,13,24,0.99);border-left:1px solid rgba(148,163,184,0.12);box-shadow:-20px 0 60px rgba(0,0,0,0.6);z-index:8001;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.28s ease;}',
      '#cart-sidebar.open{transform:translateX(0);}',
      '.cart-header{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid rgba(148,163,184,0.1);flex-shrink:0;}',
      '.cart-title{font-size:0.8rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#f9fafb;margin:0;}',
      '.cart-close-btn{background:none;border:none;color:#6b7280;cursor:pointer;font-size:1.1rem;padding:0;transition:color 0.15s;line-height:1;}',
      '.cart-close-btn:hover{color:#e5e7eb;}',
      '#cart-empty{padding:2.5rem 1.5rem;font-size:0.85rem;color:#4b5563;text-align:center;margin:0;}',
      '#cart-items{flex:1;overflow-y:auto;}',
      '.cart-item{display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1.5rem;border-bottom:1px solid rgba(148,163,184,0.07);}',
      '.cart-item-info{flex:1;}',
      '.cart-item-name{font-size:0.88rem;font-weight:600;color:#f9fafb;margin:0 0 0.2rem;}',
      '.cart-item-price{font-size:0.75rem;color:#6b7280;margin:0;}',
      '.cart-item-qty{display:flex;align-items:center;gap:0.5rem;margin-left:1rem;}',
      '.cart-qty-btn{background:rgba(15,23,42,0.9);border:1px solid rgba(148,163,184,0.2);border-radius:999px;color:#e5e7eb;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.9rem;line-height:1;transition:border-color 0.15s;padding:0;}',
      '.cart-qty-btn:hover{border-color:rgba(56,189,248,0.5);}',
      '.cart-qty-num{font-size:0.85rem;color:#f9fafb;min-width:18px;text-align:center;}',
      '#cart-footer{flex-direction:column;padding:1.25rem 1.75rem 1.75rem;border-top:1px solid rgba(148,163,184,0.1);gap:0.75rem;flex-shrink:0;}',
      '.cart-total-row{display:flex;justify-content:space-between;align-items:center;}',
      '.cart-total-label{font-size:0.7rem;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;}',
      '.cart-total-value{font-size:1.05rem;font-weight:700;color:#f9fafb;}',
      '.cart-email-input{width:100%;background:rgba(15,23,42,0.9);border:1px solid rgba(148,163,184,0.3);border-radius:999px;padding:0.65rem 1.1rem;font-size:0.85rem;color:#f9fafb;font-family:inherit;outline:none;box-sizing:border-box;transition:border-color 0.18s;}',
      '.cart-email-input::placeholder{color:#4b5563;}',
      '.cart-email-input:focus{border-color:rgba(56,189,248,0.5);}',
      '#cart-email-error{font-size:0.7rem;color:#f87171;display:none;margin:0;}',
      '#cart-net-error{font-size:0.7rem;color:#f87171;display:none;margin:0;}',
      '#cart-addr-error{font-size:0.7rem;color:#f87171;display:none;margin:0;}',
      '.cart-section-label{font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;color:#4b5563;margin:0.25rem 0 -0.1rem;}',
      '.cart-addr-row{display:flex;gap:0.5rem;}',
      '.cart-addr-half{flex:1;width:auto;}',
      '#cart-footer{overflow-y:auto;max-height:68vh;}',
      '.cart-checkout-btn{width:100%;background:linear-gradient(135deg,#0284c7,#38bdf8);color:#f9fafb;border:1px solid rgba(186,230,253,0.3);border-radius:999px;padding:0.8rem;font-size:0.8rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;font-family:inherit;box-shadow:0 10px 35px rgba(2,132,199,0.3);transition:transform 0.15s,box-shadow 0.15s;}',
      '.cart-checkout-btn:hover{transform:translateY(-1px);box-shadow:0 14px 45px rgba(2,132,199,0.45);}',
      '.cart-checkout-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none;}',
      '.cart-note{font-size:0.62rem;color:#374151;text-align:center;margin:0;letter-spacing:0.04em;}',
      /* Nav cart button */
      '.cart-nav-btn{background:none;border:none;cursor:pointer;color:#9ca3af;padding:0.3rem;position:relative;display:flex;align-items:center;justify-content:center;transition:color 0.15s;}',
      '.cart-nav-btn:hover{color:#f9fafb;}',
      '#cart-badge{position:absolute;top:-5px;right:-5px;background:#38bdf8;color:#050509;font-size:0.5rem;font-weight:700;width:15px;height:15px;border-radius:999px;display:none;align-items:center;justify-content:center;line-height:1;}',
      /* Add to cart buttons */
      '.product-add-to-cart{background:linear-gradient(135deg,#0284c7,#38bdf8);color:#f9fafb;border:1px solid rgba(186,230,253,0.3);border-radius:999px;padding:0.8rem 2rem;font-size:0.85rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;cursor:pointer;font-family:inherit;box-shadow:0 14px 45px rgba(2,132,199,0.3);transition:transform 0.15s,box-shadow 0.15s;display:inline-block;}',
      '.product-add-to-cart:hover{transform:translateY(-1px);box-shadow:0 18px 55px rgba(2,132,199,0.45);}',
      '.product-card-atc{background:rgba(15,23,42,0.8);color:#38bdf8;border:1px solid rgba(56,189,248,0.3);border-radius:999px;padding:0.35rem 0.85rem;font-size:0.65rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;font-family:inherit;transition:background 0.15s,border-color 0.15s;white-space:nowrap;}',
      '.product-card-atc:hover{background:rgba(56,189,248,0.1);border-color:rgba(56,189,248,0.5);}',
      '.product-card-footer{display:flex;align-items:center;justify-content:space-between;gap:0.5rem;}',
      /* Google Places new element */
      '.cart-street-wrap{width:100%;}',
      '.cart-street-wrap gmp-placeautocomplete{width:100%;--gmp-input-background:rgba(15,23,42,0.9);--gmp-input-border-color:rgba(148,163,184,0.3);--gmp-input-border-radius:999px;--gmp-input-color:#f9fafb;--gmp-input-font-size:0.85rem;--gmp-input-padding:0.65rem 1.1rem;}',
    ].join('');
    document.head.appendChild(style);

    // Sidebar HTML
    document.body.insertAdjacentHTML('beforeend',
      '<div id="cart-overlay"></div>' +
      '<div id="cart-sidebar">' +
        '<div class="cart-header">' +
          '<p class="cart-title">Your Cart</p>' +
          '<button class="cart-close-btn" id="cart-close">✕</button>' +
        '</div>' +
        '<p id="cart-empty">Your cart is empty.</p>' +
        '<div id="cart-items"></div>' +
        '<div id="cart-footer">' +
          '<div class="cart-total-row"><span class="cart-total-label">Total</span><span id="cart-total-amount" class="cart-total-value">$0.00</span></div>' +
          '<input id="cart-email" type="email" class="cart-email-input" placeholder="Email address" autocomplete="email" />' +
          '<p id="cart-email-error">Please enter a valid email.</p>' +
          '<p class="cart-section-label">Shipping Address</p>' +
          '<input id="cart-name" type="text" class="cart-email-input" placeholder="Full name" autocomplete="name" />' +
          '<div id="cart-street-wrap" class="cart-street-wrap"></div><input type="hidden" id="cart-street" />' +
          '<div class="cart-addr-row">' +
            '<input id="cart-city" type="text" class="cart-email-input cart-addr-half" placeholder="City" autocomplete="address-level2" />' +
            '<input id="cart-state" type="text" class="cart-email-input cart-addr-half" placeholder="State" autocomplete="address-level1" />' +
          '</div>' +
          '<div class="cart-addr-row">' +
            '<input id="cart-zip" type="text" class="cart-email-input cart-addr-half" placeholder="ZIP code" autocomplete="postal-code" />' +
            '<input id="cart-country" type="text" class="cart-email-input cart-addr-half" placeholder="Country" autocomplete="country-name" value="United States" />' +
          '</div>' +
          '<p id="cart-addr-error">Please fill in your complete shipping address.</p>' +
          '<p id="cart-net-error"></p>' +
          '<button id="cart-checkout-btn" class="cart-checkout-btn" onclick="cartCheckout()">Checkout</button>' +
          '<p class="cart-note">Payments via NexaPay · Settled in USDC</p>' +
        '</div>' +
      '</div>'
    );

    document.getElementById('cart-close').addEventListener('click', closeSidebar);
    document.getElementById('cart-overlay').addEventListener('click', closeSidebar);

    renderCart();
    loadPlacesAutocomplete();
  }

  /* ── Google Places Autocomplete ── */
  function initAutocomplete() {
    var wrap = document.getElementById('cart-street-wrap');
    if (!wrap) return;
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      setTimeout(initAutocomplete, 300); return;
    }
    var placeAC = new google.maps.places.PlaceAutocompleteElement({
      types: ['address'],
    });
    wrap.appendChild(placeAC);

    placeAC.addEventListener('gmp-placeselect', async function (e) {
      var place = e.place;
      await place.fetchFields({ fields: ['addressComponents'] });
      var num = '', route = '', city = '', state = '', zip = '', country = '';
      (place.addressComponents || []).forEach(function (c) {
        var t = c.types;
        if (t.indexOf('street_number') > -1)               num     = c.longText;
        if (t.indexOf('route') > -1)                       route   = c.longText;
        if (t.indexOf('locality') > -1)                    city    = c.longText;
        if (t.indexOf('administrative_area_level_1') > -1) state   = c.shortText;
        if (t.indexOf('postal_code') > -1)                 zip     = c.longText;
        if (t.indexOf('country') > -1)                     country = c.longText;
      });
      var streetHidden = document.getElementById('cart-street');
      if (streetHidden) streetHidden.value = num ? num + ' ' + route : route;
      var f = function (id, val) { var el = document.getElementById(id); if (el) el.value = val; };
      f('cart-city', city); f('cart-state', state); f('cart-zip', zip); f('cart-country', country);
    });
  }

  function loadPlacesAutocomplete() {
    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete(); return;
    }
    var s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyA-ztkjShuqL0x_TRPRX-w7S73HE8ImxiY&libraries=places&v=weekly';
    s.async = true;
    s.onload = function () { initAutocomplete(); };
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
