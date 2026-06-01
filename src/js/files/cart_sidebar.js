import { CHECKOUT_BASE_URL, ENDPOINTS, ROUTE_BASE } from "./constants.js";

export class MhzCartSidebar {
  cartJson = {};
  cardParts = {};
  cartSidebar;
  coutEl = document.querySelector('[data-sidecart-open] .cout__holder')
  baseUrl = CHECKOUT_BASE_URL;
  notSoBaseUrl = ROUTE_BASE;

  constructor(cartSidebar) {
    this.cartSidebar = cartSidebar;
    this.init();
  }
  async init() {
    this.unHideSidebar();
    this.setCartParts();
    await this.getCart();
    this.renderCart();

    this.setHandlers();
  }

  unHideSidebar() {
    setTimeout(() => {
      this.cartSidebar.style.display = '';
      if (document.querySelector('.mhz-cart__backdrop')) {
        document.querySelector('.mhz-cart__backdrop').style.display = '';
      }
    }, 500);
  }

  setCartParts() {
    const cartListEl = this.cartSidebar.querySelector('.products-cart__list');
    const cartList = cartListEl.querySelector('.simplebar-content') ? cartListEl.querySelector('.simplebar-content') : cartListEl;
    const cartCouponForm = this.cartSidebar.querySelector('.promo-cart');
    let cartCouponInput;
    let cartCouponButton;
    let cartCouponButtonSuccess;
    if (cartCouponForm) {
      cartCouponInput = cartCouponForm.querySelector('.promo-cart__input');
      cartCouponButton = cartCouponForm.querySelector('.promo-cart__button[type="submit"]');
      cartCouponButtonSuccess = cartCouponForm.querySelector('.promo-cart__button[type="button"]');
    }
    const cartSumm = this.cartSidebar.querySelector('.summ-cart');

    this.cardParts = {
      cartList,
      cartSumm,
      cartCouponForm: {
        cartCouponForm,
        cartCouponInput,
        cartCouponButton,
        cartCouponButtonSuccess
      }
    }
  }

  async getCart() {
    await fetch(ENDPOINTS.getCart)
      .then(res => res.json())
      .then(res => {
        this.cartJson = res;
        this.renderCart();
      })
      .catch(err => console.error(err));

    if (this.coutEl) {
      this.coutEl.innerHTML = this.cartJson.total_products ? parseInt(this.cartJson.total_products) : 0
    }
  }

  renderCart() {
    this.renderCartList();
    this.renderCartCoupon();
    this.renderCartSumm();
  }

  renderCartList() {
    if (this.cartJson.products && this.cartJson.products.length && this.cardParts.cartList) {
      let md661 = matchMedia('(min-width:630px)');
      md661.matches ? this.cardParts.cartList.style.minWidth = '661px' : null;
      const button = document.querySelector('.products-cart__button');
      const promo = document.querySelector('.promo-cart');
      button ? button.hidden = false : null;
      promo ? promo.hidden = false : null;
      let str = '';
      this.cartJson.products.forEach(product=>{
        str+=`
        <div class="products-cart__item item-cart" data-id="${product.cart_id}">
          <a href="${product.href}" class="item-cart__image" title="${product.name}">
            <img src="${product.thumb}" alt="image">
          </a>
          <div class="item-cart__body">
            <a href="${product.href}" class="item-cart__name" title="${product.name}">${product.name}</a>
            <div class="item-cart__prices">
              <div class="item-cart__actprice">${product.total}</div>
            </div>
            <div class="quantity item-cart__quantity">
              <button type="button" class="quantity__button quantity__button_minus"></button>
              <div class="quantity__input">
                <input autocomplete="off" type="text" name="form[]" value="${product.quantity}">
              </div>
              <button type="button" class="quantity__button quantity__button_plus"></button>
            </div>
            <a href="javascript:void(0);" class="item-cart__del">
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none">
                <path d="M8 11h16M14 15v6M18 15v6M9 11l1 12c0 .5.2 1 .6 1.4.4.4.9.6 1.4.6h8c.5 0 1-.2 1.4-.6.4-.4.6-.9.6-1.4l1-12M13 11V8c0-.3.1-.5.3-.7.2-.2.4-.3.7-.3h4c.3 0 .5.1.7.3.2.2.3.4.3.7v3"></path>
              </svg>
            </a>
          </div>
        </div>
        \n`
      });
      this.cardParts.cartList.innerHTML = str;
    } else {
      if (document.querySelector('.mhz-cart__body')) {
        window.location.href = '/';
      }
    }
  }

  renderCartSumm() {
    const cartSummEl = this.cardParts.cartSumm;
    const cartTotals = this.cartJson.totals;
    const toFreeShipping = this.cartJson?.toFreeShipping;
    const coupunFreeShipping = this.cartJson?.coupon_info?.shipping;

    if (cartSummEl&&cartTotals) {
      cartSummEl.hidden = false;
      let str = `
      ${cartTotals.total ? `
        <div class="summ-cart__row">
          <div class="summ-cart__key">${cartTotals.total.title.toUpperCase()}</div>
          <div class="summ-cart__value">
            ${cartTotals.total.text}
          </div>
        </div>
      ` : ''}
      ${cartTotals.coupon ? `
      <div class="summ-cart__row summ-cart__row_small">
        <div class="summ-cart__key">${cartTotals.coupon.title}</div>
        <div class="summ-cart__value">
        ${cartTotals.coupon.text}
        </div>
      </div>
      ` : ''
      }\n
      ${cartTotals.handling ? `
      <div class="summ-cart__row summ-cart__row_small">
        <div class="summ-cart__key">${cartTotals.handling.title}</div>
        <div class="summ-cart__value">
        ${cartTotals.handling.text}
        </div>
      </div>
      ` : ''
      }\n
      `;

      let price = parseInt(cartTotals.total.text.replaceAll(' ', ''));
      if (toFreeShipping > 0 && price < toFreeShipping && coupunFreeShipping != 1) {
        let leftToFreeShipping = toFreeShipping - price;
        // ${leftToFreeShipping.toLocaleString()}  ₽
        str += `
        <div class="summ-cart__row summ-cart__row_small">
          <div class="summ-cart__key">До бесплатной доставки осталось</div>
          <div class="summ-cart__value">
          ${leftToFreeShipping.toLocaleString()} руб
          </div>
        </div>
        `;
      }

      str.length > 0 ? cartSummEl.innerHTML = str : null;
    }
  }

  renderCartCoupon() {
    const cartCoupon = this.cartJson?.totals?.coupon;
    const thisForm = this.cardParts?.cartCouponForm;
    if (cartCoupon&&thisForm) {
      let couponText = cartCoupon.title.split(':')[1].replaceAll(')','').trim();
      if (couponText.length > 0) {
        thisForm.cartCouponInput ? thisForm.cartCouponInput.value = couponText : null;
        thisForm.cartCouponInput ? thisForm.cartCouponInput.setAttribute('readonly', '')  : null;
        thisForm.cartCouponButton ? thisForm.cartCouponButton.hidden = true : null;
        thisForm.cartCouponButtonSuccess ? thisForm.cartCouponButtonSuccess.hidden = false : null;
      }
    } else {
      thisForm.cartCouponInput ? thisForm.cartCouponInput.value = '' : null;
      thisForm.cartCouponInput ? thisForm.cartCouponInput.removeAttribute('readonly')  : null;
      thisForm.cartCouponButton ? thisForm.cartCouponButton.hidden = false : null;
      thisForm.cartCouponButtonSuccess ? thisForm.cartCouponButtonSuccess.hidden = true : null;
    }
  }

  setHandlers() {
    document.addEventListener('click', (e)=>{
      const delBtn = e.target.closest('.item-cart__del');
      if (delBtn) {
        this.removeProduct(delBtn);
      }

      const mhzPlusBtn = e.target.closest('.quantity__button_plus')||e.target.closest('.quantity__button_minus');
      if (mhzPlusBtn) {
        this.plusProduct(mhzPlusBtn);
      }

      const amountBtn = e.target.closest('.amount__btn');
      if (amountBtn) {
        this.setAmountProduct(amountBtn);
      }

      const cartListButton = e.target.closest('.button-cart-list');
      if (cartListButton) {
        setTimeout(() => {
          this.afterButtonCartListClick();
        }, 100);
      }

      const cleanPromo = e.target.closest('[data-promo-clean]');
      if (cleanPromo) {
        this.cleanPromo(cleanPromo);
      }
    })


    document.addEventListener('formSent', (e)=>{
      const form = e.detail.form;
      const responseResult = e.detail.responseResult;
      const thisForm = this.cardParts.cartCouponForm;

      if (form.classList.contains('promo-cart')) {
        this.afterCouponSend(thisForm, responseResult);
      }
    })
  }

  cleanPromo(cleanPromo) {
    const form = cleanPromo.closest('form.promo-cart');
    if (form) {
      const input = form.querySelector('input');
      const submitBtn = form.querySelector('[type="submit"]');
      if (input&&submitBtn) {
        input.removeAttribute('readonly');
        input.removeAttribute('data-required');
        input.value = '';
        cleanPromo.hidden = true;
        submitBtn.hidden = false;
        submitBtn.click();
        setTimeout(() => {
          input.setAttribute('data-required', '');
        }, 500);
      }
    }
  }

  async afterCouponSend(thisForm, responseResult) {
    if (responseResult.error) {
      setTimeout(() => {
        thisForm.cartCouponForm.classList.add('_form-error');
        // thisForm.cartCouponForm.insertAdjacentHTML('beforeend', `<div class="form__error">${responseResult.error}</div>`);
      }, 10);
    }
    await this.getCart();
    this.renderCart();
  }

  async afterButtonCartListClick() {
    await this.getCart();
    this.renderCart();
  }

  async removeProduct(delBtn) {
    const product = delBtn.closest('[data-id]');
    if (product) {
      let id = product.dataset.id;
      let answer;
      let body = new FormData();
      body.append('key', id);
      await fetch(ENDPOINTS.cartRemove, {
        method: 'POST',
        body,
      })
        .then(res=>res.json())
        .then(res=>{
          answer = res;
        })
        .catch(err=>console.error(err));

        if (answer&&answer.total_price) {
          if (this.cardParts.cartSumm) {
            const cartSummValue = this.cardParts.cartSumm.querySelector('.summ-cart__value');
            if (cartSummValue) {
              cartSummValue.innerHTML = answer.total_price;
            }
          }
        }
    }
    
    this.getCart();
  }

  async plusProduct(mhzPlusBtn) {
    const product = mhzPlusBtn.closest('[data-id]');
    let quantity = 1;
    const quantityParent = mhzPlusBtn.closest('.quantity');
    if (quantityParent) {
      const quantityInput = quantityParent.querySelector('input');
      if (quantityInput&&quantityInput.value.trim()) {
        quantity = !isNaN(parseInt(quantityInput.value)) ? parseInt(quantityInput.value) : 1
      }
    }
    if (product) {
      let id = product.dataset.id;
      let answer;
      let body = new FormData();
      body.append('key', id);
      body.append('quantity', quantity);
      await fetch(ENDPOINTS.cartEdit, {
        method: 'POST',
        body,
      })
        .then(res=>res.json())
        .then(async (res)=> {
          answer = res;
        })
        .catch(err=>console.error(err));
      if (answer&&answer.total_price) {
        if (this.cardParts.cartSumm) {
          const cartSummValue = this.cardParts.cartSumm.querySelector('.summ-cart__value');
          if (cartSummValue) {
            cartSummValue.innerHTML = answer.total_price;
          }
        }
      }
      if (answer&&answer.total&&this.coutEl) {
        this.coutEl.innerHTML = answer.total;
      }
    }

    this.getCart();
  }

  async setAmountProduct(amountBtn) {
    const amount = amountBtn.closest('.amount');
    let key = false;
    let quantityOld = false;
    let quantity = false;
    let price = false;
    let actionMinus = amountBtn.className.indexOf('minus') >= 0;
    let actionPlus = amountBtn.className.indexOf('plus') >= 0;
    if (amount) {
      const parent = amount.closest('.added-items__block');
      const forPriceEl = parent.querySelector('.added-items__price');

      const keyEl = amount.querySelector('[data-key]');
      const quantityEl = amount.querySelector('input');
      const priceEl = document.querySelector('[data-price]');

      if (keyEl) {
        key = keyEl.dataset.key;
      }
      if (quantityEl) {
        quantityOld = quantityEl.value;
      }
      if (priceEl) {
        price = keyEl.dataset.price;
      }

      if (quantityOld) {
        if (actionMinus) {
          if (quantityOld > 1) {
            quantity = parseInt(quantityOld) - 1;
          }
        }
        if (actionPlus) {
          quantity = parseInt(quantityOld) + 1;
        }

        quantityEl.value = quantity ? quantity : 1;
      }

      if (price && forPriceEl && quantity) {
        let summ = price * quantity;
        forPriceEl.innerHTML = `${summ.toLocaleString()} РУБ`;
      }

      if (key&&quantity) {
        let answer;
        let body = new FormData();
        body.append('key', key);
        body.append('quantity', quantity);
        await fetch(ENDPOINTS.cartEdit, {
          method: 'POST',
          body,
        })
          .then(res=>res.json())
          .then(res=>{
            answer = res;
          })
          .catch(err=>console.error(err));
        if (answer&&answer.total_price) {
          if (this.cardParts.cartSumm) {
            const cartSummValue = this.cardParts.cartSumm.querySelector('.summ-cart__value');
            if (cartSummValue) {
              cartSummValue.innerHTML = answer.total_price;
            }
          }
        }
        if (answer&&answer.total&&this.coutEl) {
          this.coutEl.innerHTML = answer.total;
        }
      }
    }
    
    this.getCart();
  }
}

