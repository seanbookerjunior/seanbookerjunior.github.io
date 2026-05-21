class LabsProductHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <div class="product-nav">
          <a href="/" class="product-nav-brand">
            <img src="/images/Elvyn new logo.PNG" alt="ELVYN Labs" class="product-nav-logo" />
            <span class="product-nav-name">ELVYN <span>Labs</span></span>
          </a>
          <a href="/" class="product-back">← Back to Labs</a>
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
