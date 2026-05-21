class LabsProductHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <div class="product-nav">
          <a href="/" class="product-nav-brand">
            <img src="/images/Elvyn new logo.PNG" alt="ELVYN Labs" class="product-nav-logo" />
            <span class="product-nav-name">ELVYN <span>Labs</span></span>
          </a>
          <div style="display:flex;align-items:center;gap:0.85rem;">
            <button class="cart-nav-btn" onclick="openCart()" aria-label="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span id="cart-badge"></span>
            </button>
            <a href="/" class="product-back">← Back to Labs</a>
          </div>
        </div>
      </header>
    `;
  }
}
customElements.define('labs-product-header', LabsProductHeader);

class LabsProductDisclaimer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <p class="product-disclaimer">
        For research purposes only. Not for human consumption. Must be 18 or older to purchase.
        These statements have not been evaluated by the Food and Drug Administration.
        This product is not intended to diagnose, treat, cure, or prevent any disease.
      </p>
    `;
  }
}
customElements.define('labs-product-disclaimer', LabsProductDisclaimer);
