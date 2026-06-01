import { formValidate } from "./forms/forms.js";
import { tabs } from "./functions.js";
import { mhzModules } from "./modules.js";
import { gotoBlock } from "./scroll/gotoblock.js";
import { CHECKOUT_BASE_URL, ENDPOINTS } from "./constants.js";

let md2 = matchMedia('(max-width: 992px)');
export class MhzCart {
  stepEls;
  cartProducts;
  cities;
  dadataCity = '';
  cityInputClean = true;
  sdekObj = {};
  fias = 'c2deb16a-0330-4f05-821f-1d09c93331e6';
  loaders = document.querySelectorAll('.mhz-cart__loader');
  paymentEl = document.querySelector('.payment-cart__body');
  podbuttonEl = document.querySelector('.payment-cart__podbutton');
  oformitBtn = document.querySelector('[data-oformit]')
  firstStepViewed = false;
  secondStepViewed = false;
  thirdStepViewed = false;
  deliveryVariant = 'РФ и СНГ';
  container = document.querySelector('.mhz-container');
  pvzPopup = document.querySelector('#pvzPopup');
  yesStepThree = false;
  pickupId = 'UFA83';
  shippingSaveCounter = 0;

  cartJson = {};
  cartParts = {};

  step = 1;
  activeStepEl;
  cartMain
  firstStepData = {};
  secondStepData = null;
  secondStepDataFD = null;
  observer;
  observe;

  isSessionAjaxed = false;


  baseUrl = CHECKOUT_BASE_URL;
  dadataToken = 'db2462b55ca9eeb87e43838eb182a1d398c8c23e';
  observerConfig = {
    childList: false,
    subtree: false,
    characterDataOldValue: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['class', 'style']
  };

  orderInfo = {
    delivery_where: 'РФ и СНГ',
    country: 'Россия',
    city: 'Москва',
    phone: "8 (999) 888-77-66",
    email: "e@ma.il",
    name: "Галевко Анна Владимировна",
    delivery_method: "Курьерская служба",
    street: "Тверская 27, 12",
    postal_code: null,
    comment: null,
  };

  orderInfoFirst = {
    fullname: 'empty',
    firstname: 'empty',
    lastname: 'empty',
    telephone: "8 (999) 888-77-66",
    email: 'empty@empty.empty',
    coupon: '',
    voucher: '',
    box_type: 'classic',
    comment: '',
    agree: 'on',
    convention2: 'on',
    dadata: '',
    country_id: '',
    delivery_type: 'РФ и СНГ',
    city: '',
    zone_id: 999999
  };

  changeZoneObj = {
    zone_id: 999999,
    zone_name: '',
    country_id: '',
  };


  constructor(cartMain, cartSteps, cartProducts, step=1, observe = true) {
    this.cartMain = cartMain;
    this.stepEls = cartSteps;
    this.cartProducts = cartProducts;
    this.step = step;
    this.observe = observe;
    this.observer = observe ? new MutationObserver(this.mutationCallback) : null;
    // const sidecartOpenBtn = document.querySelector('[data-sidecart-open]');
    // if (sidecartOpenBtn) {
    //   sidecartOpenBtn.hidden = true;
    // }

    this.init();
  }
  async init() {
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
      mainWrapper.style.paddingTop = '10px';
    }
    const productsButtons = document.querySelectorAll('.mhz-cart_sidebar .products-cart__button');
    if (productsButtons.length) {
      productsButtons.forEach(e=>e.innerHTML='ПРОДОЛЖИТЬ');
    }

    this.loaderHide();
    this.setStepsHeightHandler();
    this.setCartParts();
    await this.checkLocalStore()
    // !this.isSessionAjaxed ? this.sessionAjax() : null;
  }
  async checkLocalStore() {
    const isOformitClicked = localStorage.getItem('isOformitClicked');
    if (isOformitClicked == 'true') {
      localStorage.removeItem('isOformitClicked');
      return window.open('/', '_self')
    }

    const next = await this.validateStepFirst();
    if (next) {
      this.getCart();
      this._getHashStep();
      this.setActiveStep();
      this.setHashHandler();
      this.setCommonHandlers();
    }
  }
  loaderShow() {
    if (this.loaders.length) {
      this.loaders.forEach(e=>{
        e.hidden=false;
      });
    }
  }
  loaderHide() {
    if (this.loaders.length) {
      this.loaders.forEach(e=>{
        setTimeout(() => {
          e.hidden=true;
        }, 1500);
      });
    }
    if (this.container?.style?.display) {
      setTimeout(() => {
        this.container.style.display = '';
      }, 1600);
    }
    if (this.pvzPopup) {
      setTimeout(() => {
        this.pvzPopup.hidden = false;
      }, 1600);
    }
  }
  setCommonHandlers() {
    document.addEventListener('formSent', (e)=>{
      const form = e.detail.form;
      const responseResult = e.detail.responseResult;
      const thisForm = this.cartParts.cartCouponForm;

      if (form.classList.contains('promo-cart')) {
        this.afterCouponSend(thisForm, responseResult);
        const cityInput = this.activeStepEl.querySelector('[data-name="city"]');
        if (cityInput&&cityInput.value) this.getShippingMethod();

        const checkedPaymentMethod = document.querySelector('[data-name="payment_method"]:checked');
        const oformitBtn = document.querySelector('[data-oformit]');
        if (checkedPaymentMethod) {
          checkedPaymentMethod.checked = false;
        }
        if (oformitBtn) {
          oformitBtn.hidden = true;
        }
      }
    })
  }
  async afterCouponSend(thisForm, responseResult) {
    if (responseResult.error) {
      setTimeout(() => {
        thisForm.cartCouponForm.classList.add('_form-error');
        // thisForm.cartCouponForm.insertAdjacentHTML('beforeend', `<div class="form__error">${responseResult.error}</div>`);
      }, 10);
    }
    await this.getCart();
  }
  //=================================================================================================
  async validateStepFirst() {
    const body = new FormData();
    Object.keys(this.orderInfoFirst).forEach(key=>{
      body.set(key, this.orderInfoFirst[key]);
    })
    let success = false;

    await fetch(this.baseUrl+'validateStepFirst',{
      method: 'POST',
      body
    })
      .then(res=>res.json())
      .then(res=> success = res.success ? res.success : false)
      .catch(err=>console.error(err));

      if (success) {
        if (this.shippingSaveCounter > 0) {
          this.shippingSave();
        }
        return true;
      } else {
        return false
      }
  }
  setStepsHeightHandler() {
    if (md2.matches) {
      this.setStepsHeight();
      window.addEventListener('resize', this.setStepsHeight.bind(this));
      window.addEventListener('scroll', this.setStepsHeight.bind(this));
      document.addEventListener('click', this.setStepsHeightAfterClick.bind(this));
    }
  }
  setStepsHeightAfterClick() {
    this.setStepsHeight();
    setTimeout(() => {
      this.setStepsHeight();
    }, 550);
  }
  setStepsHeight() {
    const productsHeight = this.cartProducts.offsetHeight;
    const headerHeight = document.querySelector('.header') ? document.querySelector('.header').offsetHeight : 0;
    const footerHeight = document.querySelector('.footer') ? document.querySelector('.footer').offsetHeight : 0;
    const blockCaptionHeight = document.querySelector('.block-caption') ? document.querySelector('.block-caption').offsetHeight : 0;
    const windowHeight = window.innerHeight;
    const maxHeight = windowHeight - headerHeight - footerHeight - blockCaptionHeight - productsHeight;

    if (this.stepEls.length) {
      for (let i = 0; i < this.stepEls.length; i++) {
        const step = this.stepEls[i].getAttribute('data-step');
        if (!md2.matches) {
          if (maxHeight > 0) {
            if (step == 1) {
              this.stepEls[i].style.maxHeight = !md2.matches ? 
              `${productsHeight}px` : 
              `${windowHeight}px`;
            } else {
              this.stepEls[i].style.maxHeight = !md2.matches ? 
              `${productsHeight}px` : 
              `${windowHeight - headerHeight - footerHeight}px`;
            }
          } else {
            this.stepEls[i].style.maxHeight = !md2.matches ? 
            `${productsHeight}px` : 
            ``;
          }
        }
      }
    }
  }
  showSideCart() {
    document.documentElement.classList.add('sidecart-open');
    document.documentElement.classList.add('lock');
    document.querySelector('[data-step="1"]').classList.add('_hidden');
    document.querySelector('.mhz-cart_sidebar').classList.add('_scrolled');
  }
  hideSideCart() {
    document.documentElement.classList.remove('sidecart-open');
    document.documentElement.classList.remove('lock');
    document.querySelector('[data-step="1"]').classList.remove('_hidden');
  }
  //=================================================================================================
	_setHash(hash) {
		history.pushState('', '', location.pathname + location.search + hash);
	}
	_removeHash() {
		history.pushState('', '', window.location.href.split('#')[0])
	}
  _getHashStep() {
    const hash = window.location.hash;
    if (hash.indexOf('step_')>=0) {
      this.step = parseFloat(hash.split('step_')[1]);
    } else {
      this.step = 1;
    }
  }
  setHashHandler() {
    window.addEventListener('hashchange', () => {
      this._getHashStep();
      this.setActiveStep();
    });
  }
  setActiveStep() {
    gotoBlock('body', false, 1);
    if (!this.prevStepValidate(this.step)) {
      this.step = this.step - 1 > 0 ? this.step - 1 : 1;
      this.step > 1 ? this._setHash(`#step_${this.step}`) : this._removeHash();
      this.setActiveStep();
      return
    }
    if (this.stepEls.length) {
      for (let i = 0; i < this.stepEls.length; i++) {
        if (i == this.step - 1) {
          this.stepEls[i].classList.remove('_hidden');
          this.activeStepEl = this.stepEls[i];
          this.setStepActions();
          this.setObserver(i-1);
        } else {
          this.stepEls[i].classList.add('_hidden');
        }
      }
    }
  }
  prevStepValidate(step) {
    const stepEl = document.querySelector(`[data-step="${step}"]`);
    if (!stepEl) return false;

    const validateStep = step - 1;
    if (validateStep <= 0) return true;

    const selector = `[data-step="${validateStep}"]`;
    const validateStepEl = document.querySelector(selector);
    if (!validateStepEl) return false;

    if (step > 2) {
      const validateStepTwo = document.querySelector('[data-step="2"]');
      this.getSecondStepInfo(validateStepTwo);
    }

    if (validateStep === 2) return this.yesStepThree;

    if (formValidate.getErrors(validateStepEl) > 0) return false;

    return true;
  }
  setStepActions() {
    this.loaderHide();
    if (this.step === 1&&!this.firstStepViewed) {
      // if (window.innerWidth <= 992) {
      //   setTimeout(() => {
      //     this.showSideCart();
      //   }, 1200);
      // }
      this.firstStepActions();
      this.firstStepViewed = true;
    } else {
      this.getCart();
    }
    if (this.step === 2&&!this.secondStepViewed) {
      this.secondStepActions();
      this.secondStepViewed = true;
    }
    if (this.step === 3&&!this.thirdStepViewed) {
      this.threeStepActions();
      this.thirdStepViewed = true;
    }
  }
  setCartParts() {
    if (this.cartProducts) {
      const cartTrigger = this.cartProducts.querySelector('.products-cart__trigger');
      const cartList = this.cartProducts.querySelector('.products-cart__list');
      let cartListActual = cartList.querySelector('.simplebar-content') ? cartList.querySelector('.simplebar-content') : cartList;
      const cartBottom = this.cartProducts.querySelector('.bottom-cart');
      const cartSumm = this.cartProducts.querySelector('.summ-cart');
      const cartCouponForm = this.cartProducts.querySelector('.promo-cart');
      let cartCouponInput;
      let cartCouponButton;
      let cartCouponButtonSuccess;
      if (cartCouponForm) {
        cartCouponInput = cartCouponForm.querySelector('.promo-cart__input');
        cartCouponButton = cartCouponForm.querySelector('.promo-cart__button[type="submit"]');
        cartCouponButtonSuccess = cartCouponForm.querySelector('.promo-cart__button[type="button"]');
      }

      this.cartParts = {
        cartTrigger,
        cartList: cartListActual,
        cartBottom,
        cartSumm,
        cartCouponForm: {
          cartCouponForm,
          cartCouponInput,
          cartCouponButton,
          cartCouponButtonSuccess
        }
      }
    }
  }
  //=================================================================================================
  async getCart() {
    this.cartJson = false;
    let answer = false;

    await fetch(ENDPOINTS.getCart)
      .then(res=>res.json())
      .then(res => this.cartJson = res)
      .catch(err=> console.error(err));
      if (this.cartJson&&this.cartJson.products) {
        this.cartRender();
        return true;
      } else {
        window.location.href = '/';
      }
  }
  cartRender() {
    this.renderCartTrigger();
    this.renderProductsList();
    this.renderCartBottom();
    this.renderCartSumm();
    this.renderCartForm();
  }
  renderCartTrigger() {
    const trigger = this.cartParts?.cartTrigger;
    const totalProducts = this.cartJson?.total_products;
    const totalPrice = this.cartJson?.totals?.total?.text;
    if (trigger&&totalProducts&&totalPrice) {
      trigger.innerHTML = `
        В КОРЗИНЕ ${totalProducts} <span class="_mmd2dn">НА СУММУ <span>${totalPrice}</span></span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="7" viewBox="0 0 14 7" fill="none">
          <path d="M1 1L7 6L13 1" stroke="#000" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    }
  }
  renderProductsList() {

    const cartJsonProductList = this.cartJson.products;
    if (cartJsonProductList&&cartJsonProductList.length&&this.cartParts.cartList) {
      let str = ``
      cartJsonProductList.forEach(e=>{
        str += this.setCartItemStr(e);
      });

      this.cartParts.cartList.innerHTML = str;
    }
  }
  renderCartBottom() {
    const bottom = this.cartParts?.cartBottom;
    const totals = this.cartJson?.totals;
    const keys = Object.keys(totals);
    if (bottom&&keys) {
      const coupon = totals['coupon'] ? totals['coupon'] : {title: '', text: '0'};
      let str = '';
      // if (coupon&&totals.total) {
      //   const totalPrice = parseFloat(totals.total.text.replaceAll(' ', ''));
      //   const couponPrice = parseFloat(coupon.text.replaceAll(' ', ''));
      //   str += `
      //   <div class="bottom-cart__row">
      //     <div class="bottom-cart__key">СТОИМОСТЬ ТОВАРОВ</div>
      //     <div class="bottom-cart__value">${(couponPrice < 0 ? couponPrice*-1 : couponPrice) + totalPrice}</div>
      //   </div>
      //   \n`;
      // };
      if (totals.products) {
        str += `
        <div class="bottom-cart__row">
          <div class="bottom-cart__key">${totals.products.title.toUpperCase()}</div>
          <div class="bottom-cart__value">${totals.products.text}</div>
        </div>
        \n`;
      };
      keys.forEach(e=>{
        if (e !== 'coupon'&&e !== 'total'&&e !== 'products') {
          const element = totals[e];
          str += `
          <div class="bottom-cart__row">
            <div class="bottom-cart__key">${element.title ? element.title.toUpperCase() : 'СТОИМОСТЬ ТОВАРОВ'}</div>
            <div class="bottom-cart__value">${element.text}</div>
          </div>
          \n`;
        }
      });
      if (totals.coupon) {
        str += `
        <div class="bottom-cart__row bottom-cart__row_small">
          <div class="bottom-cart__key">${coupon.title.toUpperCase()}</div>
          <div class="bottom-cart__value">${coupon.text}</div>
        </div>
        \n`;
      };
      bottom.innerHTML = str;
      const threeStepBottom = document.querySelector('[data-step="3"] .bottom-cart')
      if (threeStepBottom) {
        threeStepBottom.innerHTML = str;
      }
    }
  }
  renderCartSumm() {
    const summ = this.cartParts?.cartSumm;
    const total = this.cartJson?.totals?.total;
    const threeStepSumm = document.querySelector('[data-step="3"] .summ-cart');
    const toFreeShipping = this.cartJson?.toFreeShipping;
    const coupunFreeShipping = this.cartJson?.coupon_info?.shipping;

    if (summ&&total) {
      let str = `
      <div class="summ-cart__row">
        <div class="summ-cart__key">${total.title.toUpperCase()}</div>
        <div class="summ-cart__value">
          ${total.text}
        </div>
      </div>\n
      `;
      
      const internationalDelivery = document.querySelector('[data-shipping-method="international.international"]');
      let condition = !internationalDelivery||(internationalDelivery&&(internationalDelivery.hidden||internationalDelivery.closest('[hidden]')));
      // let shippingCondition = totalCouponText ? !freeShippingArr.includes(totalCouponText) : true;
      let shippingCondition = coupunFreeShipping != 1;

      if (toFreeShipping > 0 && parseInt(total.text.replaceAll(' ', '')) < toFreeShipping && condition && shippingCondition) {
        let ostalos = toFreeShipping - parseInt(total.text.replaceAll(' ', ''));
        str += `
        <div class="summ-cart__row summ-cart__row_small">
          <div class="summ-cart__key">До бесплатной доставки осталось</div>
          <div class="summ-cart__value">
            ${ostalos.toLocaleString()} ₽
          </div>
        </div>
        `
      }
      summ.innerHTML = str;
      if (threeStepSumm) {
        threeStepSumm.innerHTML = str;
      }
    }
  }
  renderCartForm() {
    const cartCoupon = this.cartJson?.totals?.coupon;
    const thisForm = this.cartParts?.cartCouponForm;
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
  setCartItemStr(product) {
    let str = `
    <div class="products-cart__item item-cart">
      ${product.href ? `
        <a href=${product.href} class="item-cart__image">
          <img src="${product.thumb}" alt="image">
        </a>
      ` : ''}
      <div class="item-cart__body">
        ${product.href&&product.name ? `<a href="${product.href}" class="item-cart__name">${product.name}</a>`: ''}
        <div class="item-cart__prices">
          <div class="item-cart__actprice">
            ${product.total ? `${product.total.replaceAll('руб', '')}` : ''}
          </div>
        </div>
        <div class="quantity item-cart__quantity">
          <span>${product.quantity ? `${product.quantity} ШТ.`: ''}</span>
        </div>
      </div>
    </div>
    \n`;

    return str;
  }
  //=================================================================================================
  async sessionAjax() {
    console.log('sessionAjax');
  }
  //=================================================================================================
  firstStepActions() {
    this.loaderHide();


    const postcardCheckbox = this.activeStepEl.querySelector('.boxes-cart__checkbox');
    if (postcardCheckbox) {
      // this.postcardInputAction(postcardCheckbox);
      postcardCheckbox.addEventListener('change', ()=>{
        this.postcardInputAction(postcardCheckbox)
      });
    }

    document.addEventListener('click', (e)=>{
      if (e.target.closest('.products-cart__button')) {
        e.preventDefault();
        e.stopPropagation();
        this.hideSideCart();
      }
    })

    document.addEventListener('change', (e)=>{
      if (e.target.classList.contains('boxes-cart__radio')) {
        this.selectboxActions(e.target);
      }
    })

    const nextStepButton = this.activeStepEl.querySelector('[data-next-step]');
    if (nextStepButton) {
      nextStepButton.removeAttribute('disabled');
      nextStepButton.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log('Ошибок - '+formValidate.getErrors(this.activeStepEl));
        nextStepButton.setAttribute('disabled', true);
        if (formValidate.getErrors(this.activeStepEl) <= 0) {
          const answer = await this.getFirstStepData(this.activeStepEl);
          if (!answer.error) {
            const next = await this.validateStepFirst();
            if (next) {
              this.loaderShow();
              this.step++;
              this._setHash(`#step_${this.step}`);
              this.setActiveStep();
              nextStepButton.removeAttribute('disabled');
            } else {
              nextStepButton.removeAttribute('disabled');
            }
          } else {
            nextStepButton.removeAttribute('disabled');
          }
        }
      });
    }
  }
  async selectboxActions(target) {
    const name = target.name;
    const value = target.value;
    let answer;
    if (name&&value) {
      let body = new FormData();
      body.set(name, value);
      this.orderInfoFirst[name] = value;

      const next = await this.validateStepFirst();
      if (next) {
        await fetch('/index.php?route=extension/module/selectbox', {
          method: 'POST',
          body
        })
        .then(res=>res.json())
        .then(res=>answer=res)
        .catch(err=>console.error(err));
  
        if (answer) {
          this.getCart();
        }
      }
    }
  }
  postcardInputAction(postcardCheckbox) {
    const postcardInput = this.activeStepEl.querySelector('.boxes-cart__input');
    if (postcardInput) {
      postcardInput.hidden = !postcardCheckbox.checked;
    }
  }
  async getFirstStepData(stepEl) {
    const fd = new FormData();
    const boxesInput = stepEl.querySelector('.boxes-cart__input');
    if (boxesInput) {
      fd.set(boxesInput.name, boxesInput.value);
      let answer = await this.sendPostcardValue(fd);
  
      if (answer.error) {
        boxesInput.classList.add('_form-error');
        boxesInput.parentElement.classList.add('_form-error');
        setTimeout(() => {
          if (boxesInput.parentElement) {
            boxesInput.parentElement.insertAdjacentHTML('beforeend', `<div class="form__error">${answer.error}</div>`);
          }
        }, 20);
      }
      return answer
    }
  }
  async sendPostcardValue(fd) {
    let answer;
    await fetch(this.baseUrl + 'setBoxCart', {method: 'POST',body:fd})
      .then(res => res.json())
      .then(res=>answer=res)
      .catch(err=>console.error(err));

    return answer;
  }
  //=================================================================================================
  secondStepActions() {
    this.loaderHide();
    this.variantsBlock = document.querySelector('[data-variants]');
    const nextStepButton = this.activeStepEl.querySelector('[data-next-step]');
    if (this.variantsBlock) {
      this.variantsTitles = this.variantsBlock.querySelector('[data-variants-titles]');
    }

    this.sdekActions();

    if (this.sdekObj&&this.sdekObj.searchEl) {
      this.sdekObj.searchEl.addEventListener('change', (e)=>{
        this.sdekSearch(this.sdekObj.searchEl);
      })
    }
    
    this.activeStepEl.addEventListener('keydown', (e)=>{
      const onlyEnglishTarget = e.target.closest('[data-only-english]');
      if (onlyEnglishTarget) {
        let onlyEnglishRegex = new RegExp('[а-яА-ЯёЁ]');
        if (onlyEnglishRegex.test(e.key)) {
          e.preventDefault();
        }
      }
    });

    this.activeStepEl.addEventListener('change', async (e)=>{
      if (e.target.tagName === 'INPUT'||e.target.tagName === 'SELECT') {
        this.getSecondStepInfo(this.activeStepEl);
      }

      const variantsPopupTrigger = e.target.closest('.variants-deliveryCart__title');
      if (variantsPopupTrigger) {
        this.shippingMethod = e.target.value;
        this.getSecondStepInfo(this.activeStepEl);
        this.shippingSave(variantsPopupTrigger);
      }

      const deliveryVariantEl = e.target.closest('.tabs-deliveryCart__title');
      if (deliveryVariantEl) {
        const internationalDelivery = document.querySelector('[data-shipping-method="international.international"]');

        if (internationalDelivery&&!internationalDelivery.hidden) {
          this.orderInfoFirst['delivery_method'] = e.target.dataset?.value ? e.target.dataset.value : 'МЕЖДУНАРОДНАЯ ДОСТАВКА';
          this.deliveryVariant = e.target.value;
        } else {
          // this.orderInfoFirst['shipping_method'] = '';
        }
      }

      const deliveryWhere = e.target.closest('[data-name="delivery_where"]');
      const country = e.target.closest('[data-country]');
      if (deliveryWhere||country) {
        if (deliveryWhere) {
          this.changeZoneObj.country_id = '';
          this.changeZoneObj.zone_name = '';
        }
        const cityInput = this.activeStepEl.querySelector('[data-name="city"]');
        if (cityInput) {
          cityInput.value = '';
          this.dadataCity = '';
        }
        this.getSecondStepInfo(this.activeStepEl);
        this.countryQuery();
        if (country&&country.querySelector('select')) {
          this.changeZoneObj.country_id = country.querySelector('select').value;
          this.changeZoneObj.zone_name = '';
        }
        this.changeZoneQuery();
      }

      if (e.target.hasAttribute('data-name')) {
        const dataName = e.target.getAttribute('data-name');
        if (dataName !== 'delivery_where'&&dataName !== 'city') {
          this.getSecondStepInfo(this.activeStepEl);
          await this.validateStepFirst();
        }
      }

      this.validateSecondStep(nextStepButton);
    })

    this.activeStepEl.addEventListener('focusout', (e)=>{
      if (e.target.closest('[data-street]')&&e.target.value.trim()&&e.target.value.length>3) {
        const postalCodeEl = this.activeStepEl.querySelector('[data-postalcode] input');
        if (postalCodeEl) {
          this.getIndex(e.target, [postalCodeEl])
        }
      }
    })

    this.activeStepEl.addEventListener('input', (e)=>{
      const cityEl = e.target.closest('[data-city]');
      if (cityEl&&e.target.value.trim()) {
        if (e.target.value.length>=3) {
          this.renderCityPrompt(e.target, cityEl);
        } else {
          e.target.parentElement.classList.remove('_prompt-active');
        }
      }
      const streetEl = e.target.closest('[data-street]');
      if (streetEl&&e.target.value.trim()&&e.target.value.length>=3) {
        if (e.target.value.length>=3) {
          this.renderStreetPrompt(e.target, streetEl);
        } else {
          e.target.parentElement.classList.remove('_prompt-active');
        }
      }
    })

    this.activeStepEl.addEventListener('focusin', (e)=>{
      const cityEl = e.target.closest('[data-city]');
      const streetEl = e.target.closest('[data-street]');
      if (cityEl&&e.target.value.trim()&&e.target.value.length>=3) {
        this.renderCityPrompt(e.target, cityEl);
      }
      if (streetEl&&e.target.value.trim()&&e.target.value.length>=3) {
        this.renderStreetPrompt(e.target, streetEl);
      }
    })

    document.addEventListener('tabsAction', (e)=>{
      const someEls =document.querySelectorAll('._tab-active[data-popup]');
      if (someEls.length) {
        someEls.forEach(e=>e.classList.remove('_tab-active'));
      }
      const tabsBlock = e.detail.tabsBlock;
      if (this.activeStepEl.contains(tabsBlock)) {
        const inputs = tabsBlock.querySelectorAll('input');
        if (inputs.length) {
          inputs.forEach(input=>{
            if (input.type !== 'radio'&&input.type !== 'hidden') {
              if (input.type === 'checkbox') {
                input.checked = false;
              } else {
                input.value = '';
              }
            }
          })
        }
        const selects =tabsBlock.querySelectorAll('select');
        if (selects.length) {
          selects.forEach(select=>{
            if (select.options.length) {
              select.options[0].selected = true;
              customeSelect ? customeSelect.update('select') : null;
            }
          })
        }
        const deliveryTabsBodies = this.activeStepEl.querySelectorAll('[data-delivery-tab]');
        if (deliveryTabsBodies.length) {
          deliveryTabsBodies.forEach(e=>e.hidden=true);
        }

        const variantsNav = document.querySelector('[data-variants-titles]');
        if (variantsNav) {
          variantsNav.innerHTML = '';
        }
      }
    })

    document.addEventListener('click', (e)=>{

      const promptEl = e.target.closest('[data-prompt]');
      if (promptEl) {
        this.promptValueWrite(e.target, promptEl);
      } 
      if (!promptEl&&!e.target.closest('[data-city]')&&!e.target.closest('[data-street]')) {
        const promptActiveEls = document.querySelectorAll('._prompt-active');
        if (promptActiveEls.length) {
          promptActiveEls.forEach(e=>{
            if (e.closest('[data-city]')) {
              e.querySelector('input') ? e.querySelector('input').value = '' : null;
              
              const promptEl = e.querySelector('[data-prompt]');
              if (promptEl) {
                const li = promptEl.querySelector('li[data-value]');
                if (li&&!li.classList.contains('_prompt-error')) {
                  this.promptValueWrite(li, promptEl);
                }
              }
            }

            e.classList.remove('_prompt-active');
          });
        }
      }

      const mhzBaloon = e.target.closest('.mhz-baloon');
      if (mhzBaloon) {
        let coords = mhzBaloon.getAttribute('data-coords');
        if (coords) {
          coords = coords.split(',');
          this.setMapCenterByCoords(coords);
        }

        const buttons = document.querySelectorAll('[data-choice]');
        buttons.forEach(e=>{
          if (mhzBaloon.contains(e)) {
            e.hidden = false;
          } else {
            e.hidden = true;
          }
        })
      }
      
      const pvzButton = e.target.closest('button[data-choice]');
      if (pvzButton) {
        const address = pvzButton.getAttribute('data-choice');
        const id = pvzButton.getAttribute('data-id');
        const pickupId = pvzButton.getAttribute('data-pickup-id');
        if (pickupId) {
          this.pickupId = pickupId;
        }
        if (address.trim()) {
          const addressInputs = this.activeStepEl.querySelectorAll('[data-name="street"]');
          if (addressInputs.length) {
            addressInputs.forEach(e=>e.value = address);
            pvzButton.classList.add('_selected');
            mhzModules.popup.close('#pvzPopup');
            pvzButton.textContent = 'Выбрано';
            const pvzButtons = document.querySelectorAll(`[data-choice]`);
            if (pvzButtons.length) {
              pvzButtons.forEach(e=>{
                const condition = pvzButton.hasAttribute('data-id') ? e.getAttribute('data-id') !== id : e.getAttribute('data-choice') !== address;
                if (condition) {
                  e.hidden = true;
                  e.classList.remove('_selected');
                  e.textContent = 'Выбрать';
                } else {
                  e.hidden = false;
                  e.classList.add('_selected');
                  e.textContent = 'Выбрано';
                }
              })
            }
          }
        }
      }

      if (e.target.closest('[data-sdek-pvzs]')) {
        mhzModules.popup.open('#pvzPopup');
      }
      
      const deliveryTabTitle = e.target.closest('[data-delivery-tabtitle]');
      if (deliveryTabTitle) {
        this.tabActions(deliveryTabTitle);
      }

      this.validateSecondStep(nextStepButton);
    })
    
    if (nextStepButton) {
      nextStepButton.removeAttribute('disabled');
      nextStepButton.addEventListener('click', async (e)=>{
        e.preventDefault();
        console.log('Ошибок - ' + formValidate.getErrors(this.activeStepEl));
        if (formValidate.getErrors(this.activeStepEl) <= 0) {
          this.getSecondStepInfo(this.activeStepEl);
          const shippingFieldsQuery = await this.shippingFieldsQuery();
          nextStepButton.setAttribute('disabled', true);
          if (shippingFieldsQuery&&this.validateStepFirst()) {
            const getCart = await this.getCart();
            if (getCart) {
              const saveAddressFields = await this.saveAddressFields();
              if (saveAddressFields) {
                const saveShippingMethod = await this.saveShippingMethod();
                if (saveShippingMethod) {
                  this.yesStepThree = true;
                  this.loaderShow();
                  this.step++;
                  this._setHash(`#step_${this.step}`);
                  this.setActiveStep();
                  nextStepButton.removeAttribute('disabled');
                } else {
                  nextStepButton.removeAttribute('disabled');
                }
              } else {
                nextStepButton.removeAttribute('disabled');
              }
            } else {
              nextStepButton.removeAttribute('disabled');
            }
          } else {
            nextStepButton.removeAttribute('disabled');
          }
        }
      });
    }
  }
  validateSecondStep(nextStepButton) {
    setTimeout(() => {
      const internationalDelivery = document.querySelector('[data-shipping-method="international.international"]');

      const condition = internationalDelivery&&!internationalDelivery.hidden ? 
        true : 
        document.querySelector('[data-name="delivery_method"]:checked')
      if (condition) {
        if (nextStepButton&&formValidate.getErrors(this.activeStepEl) <= 0) {
          nextStepButton.hidden = false;
        } else {
          nextStepButton.hidden = true;
        }
      } else {
        console.log('Условие не соблюдено');
        console.log('condition', condition);
        console.log('errors', formValidate.getErrors(this.activeStepEl));
      }
    }, 1000);
  }
  tabActions(deliveryTabTitle) {
    const attr = deliveryTabTitle.getAttribute('data-delivery-tabtitle');
    const titles = this.activeStepEl.querySelectorAll('[data-delivery-tabtitle]');
    const bodies = this.activeStepEl.querySelectorAll('[data-delivery-tab]');
    if (bodies.length) {
      titles.forEach(e=>e.classList.remove('_tab-active'));
      deliveryTabTitle.classList.add('_tab-active');
      const radio = deliveryTabTitle.querySelector('input[type="radio"]');
      if (radio) {
        radio.click();
      }
      bodies.forEach(body=>{
        const bodyAttr = body.getAttribute('data-delivery-tab');
        body.hidden = bodyAttr !== attr;
      })
    }
  }
  cityPromptForming(objects, value) {
    if (!objects.error) {
      let arr = [];
      let html = '';
      objects.forEach((object, index)=>{
        (object.data.city||object.data.area)&&this.filterCityPrompt(object, value, arr) ? arr.push(object) : null;
      });
  
      this.cities = arr;
  
      if (arr.length) {
        arr.forEach((e, index)=>{
          let name = '';
          if (e.data.settlement_with_type) {
            name = e.data.settlement_with_type;
          } else {
            name = e.data.area ? e.data.area : e.data.city
          }
          html += e&&value!==e ? `
            <li data-value="${name}" data-country-iso="${e.data.country_iso_code}" data-index="${index}">
              ${name} <br>
              <small>${e.data.region_with_type}, ${e.data.area_with_type ? e.data.area_with_type : ''}</small>
            </li>\n` : '';
        });
      } else {
        html = `<li class="_prompt-error">Ничего не найдено</li>`
      }
  
      return html;
    } else {
      return '<li class="_prompt-error">Необходимо выбрать страну</li>';
    }
  }
  filterCityPrompt(object, value, arr) {
    if (!arr.length) {
      return true;
    }
    if (object.data?.city?.toLowerCase().indexOf(value)<0||arr.find(e=>e.data.city===object.data.city)) {
      return false;
    }
    return true;
  }
  streetPromptForming(objects, value) {
    let arr = [];
    let html = '';
    objects.forEach(object=>{
      let city = object.data.city;
      object.value&&arr.indexOf(object.value)<0 ? arr.push(object.value.replaceAll(`г ${city}, `, '')) : null;
    });
    arr.forEach(e=>{
      html += e&&e!==value ? `<li data-value="${e}">${e}</li>\n` : '';
    })

    return html;
  }
  getSecondStepInfo(stepEl = document.querySelector('[data-step="2"]')) {
    if (stepEl) {
      const fd = new FormData();
      const fields = stepEl.querySelectorAll('[data-name]');
      if (fields.length) {
        for (let index = 0; index < fields.length; index++) {
          const field = fields[index];
          if (field.type === 'radio'||field.type === 'checkbox') {
            if (field.checked&&!field.closest('[hidden]')) {
              fd.set(field.name, field.value);
              this.orderInfoFirst[field.name] = field.value;
              const deliveryTabTitle = field.closest('[data-delivery-tabtitle]');
              if (deliveryTabTitle) {
                const name = deliveryTabTitle.querySelector('b');
                if (name) {
                  this.orderInfoFirst['delivery_method'] = name.textContent;
                }
              }
            }
          } else {
            if (!field.closest('[hidden]')) {
              const value = field.value ? field.value : ' ';
              fd.set(field.name, value);
              this.orderInfoFirst[field.name] = field.value;
              const countryEl = field.closest('[data-country]');
              if (countryEl) {
                const name = countryEl.querySelector('.select__item--active');
                if (name) {
                  this.orderInfoFirst['country'] = name.textContent;
                }
              }
            }
          }
        }
      }
      this.secondStepData = fd;
    }
  }
  renderShippingMethod() {
    if (this.variantsBlock) {
      if (this.variantsTitles) {
        this.variantsTitles.innerHTML = this.shippingMethodHTML;
        // if (this.variantsTitles.querySelector('pre')) this.variantsTitles.querySelector('pre').remove();
        tabs();
        this.variantsBlock.hidden = false;
      }
    }
  }
  mapInit() {
    try {
      this.sdekObj.map = new ymaps.Map(this.sdekObj.mapEl, {
        center: [59.938785, 30.314817],
        zoom: 10,
        controls: ['zoomControl'],
      });
  
      this.sdekObj.objectManager = new ymaps.ObjectManager({
        clusterize: true,
        gridSize: 32,
        clusterDisableClickZoom: true
      });
  
      this.sdekObj.objectManager.objects.options.set('preset', 'islands#darkGreenDotIcon');
      this.sdekObj.objectManager.clusters.options.set('preset', 'islands#darkGreenClusterIcons');
      this.sdekObj.map.geoObjects.add(this.sdekObj.objectManager);

      document.addEventListener('afterPopupOpen', ()=>{
        this.sdekObj.map.container.fitToViewport()
      });
      document.addEventListener('tabsAction', ()=>{
        setTimeout(() => {
          this.sdekObj.map.container.fitToViewport();
        }, 10);
      });

    } catch(err) {
      setTimeout(() => {
        this.mapInit();
      }, 100);
    }

  }
  renderPvzList(features) {
    if (features&&features.length) {
      let str = ``;
      this.sdekObj.quantityEl.innerHTML = features.length;
      features.forEach((feature, index)=>{
        const object = feature.properties;
        if (index === 0) {
          this.pickupId = object.pickupId;
        }
        const head = object&&object.balloonContentHeader ? object.balloonContentHeader : '';
        const body = object&&object.balloonContentBody ? object.balloonContentBody : '';
        const footer = object&&object.balloonContentFooter ? object.balloonContentFooter : '';
        const coords = feature.geometry.coordinates.join(',');
  
        if (head||body||footer) {
          str += `
          <div class="mhz-baloon" data-coords="${coords}">
            ${head}\n
            ${body}\n
            ${footer}\n
          </div>
          `;
        }
      });
      this.sdekObj.officesList.innerHTML = str;
      const buttons =this.sdekObj.officesList.querySelectorAll('button[data-choice]');
      if (buttons.length) {
        buttons.forEach(e=>e.hidden = true);
      }
    }
  }
  addMapFeatures(featuresObject) {
    this.sdekObj.objectManager.removeAll();
    this.sdekObj.objectManager.add(featuresObject);
    let bounds = this.sdekObj.map.geoObjects.getBounds() ? this.sdekObj.map.geoObjects.getBounds() : [[53.600063741065,52.29049854596301],[56.846209748886125,56.228662375728966]];
    this.sdekObj.map.setBounds(bounds);
  }
  sdekSearch(input) {
    if (input.value.trim()) {
      input.classList.remove('_form-error');
      input.parentElement.querySelector('.form__error') ? input.parentElement.querySelector('.form__error').remove() : null;
      if (this.sdekObj?.featuresObject?.features) {
        const value = input.value.trim().toLowerCase();
        let featuresObj = {
          type:"FeatureCollection",
          features: []
        }

        let features = this.sdekObj?.featuresObject?.features.filter(item => {
          const properties = item.properties;
          if (properties.address.toLowerCase().includes(value)||properties.name.toLowerCase().includes(value)) {
            return item;
          }
        });

        featuresObj.features = features;
        if (features.length)  {
          this.addMapFeatures(featuresObj);
          this.renderPvzList(features);
        } else {
          input.classList.add('_form-error');
          input.parentElement.insertAdjacentHTML('beforeend', '<div class="form__error">Ничего не найдено<div>');
        }
      }
    } else {
      if (this.sdekObj?.featuresObject?.features) {
        this.addMapFeatures(this.sdekObj.featuresObject);
        this.renderPvzList(this.sdekObj.featuresObject.features);
      }
    }
  }
  async getIndex(target, postalCodeEls) {
    console.log('mhz getIndex');
    let address = '';
    const countryEl = this.activeStepEl.querySelector('[data-country] select');
    const cityEl = this.activeStepEl.querySelector('[data-city] input');
    
    // const countryElSelected = countryEl ? countryEl.querySelector(`option[value="${countryEl.value}"]`) : false;
    // if (countryElSelected&&countryElSelected.textContent.trim()) {
    //   address += `${countryElSelected.textContent.trim()}, `;
    // } else {
    //   address += `Россия, `;
    // }

    if (cityEl&&cityEl.value.trim()) {
      address += `${cityEl.value.trim()}, `;
    }
    address+= target.value.trim();
    
    let firstGeoObject;
    var url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";
    var token = this.dadataToken;

    var options = {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Token " + token
        },
        body: JSON.stringify({query: address})
    }

    await fetch(url, options)
    .then(response => response.json())
    .then(result => firstGeoObject = result.suggestions[0])
    .catch(error => console.error(error));

    if (firstGeoObject) {
      const postalCode = firstGeoObject.data.postal_code;
      if (postalCode&&postalCode.trim()) {
        postalCodeEls.forEach(postalCodeEl=>{
          if (!postalCodeEl.closest('[hidden]')) {
            postalCodeEl.value = postalCode;
            postalCodeEl.classList.remove('_form-error');
            postalCodeEl.classList.add('_writed');
            postalCodeEl.parentElement.classList.remove('_form-error');
          }
        })
      } else {
        postalCodeEls.forEach(postalCodeEl=>{
          postalCodeEl.value = '';
        })
      }
    }
  }
  async renderCityPrompt(target, parent) {
    const promptEl = parent.querySelector('[data-prompt]');
    let findGeoObjects = await this.getCities(target);
    let html = this.cityPromptForming(findGeoObjects, target.value);
    parent.classList.add('_prompt-active');
    if (promptEl) {
      promptEl.innerHTML = html;
    }
  }
  async renderStreetPrompt(target, parent) {
    const promptEl = parent.querySelector('[data-prompt]');
    let findGeoObjects = await this.getCities(target, true);
    let html = this.streetPromptForming(findGeoObjects, target.value);
    parent.classList.add('_prompt-active');
    if (promptEl) {
      promptEl.innerHTML = html;
    }
  }
  async getCities(target, cityInclude) {
    let query = '';
    const countryEl = this.activeStepEl.querySelector('[data-country] select');

    if (!countryEl.value) {
      const errObj = {
        error: 'Необходимо выбрать страну'
      }
      return errObj;
    }

    // const countryElSelected = countryEl ? countryEl.querySelector(`option[value="${countryEl.value}"]`) : false;
    // if (countryElSelected&&countryElSelected.textContent.trim()) {
    //   query += `${countryElSelected.textContent.trim()} `;
    // } else {
    //   query += `Россия `;
    // }
    
    if (cityInclude) {
      const cityEl = this.activeStepEl.querySelector('[data-city] input');
      if (cityEl&&cityEl.value.trim()) {
        query += `${cityEl.value.trim()} `;
      }
    }

    query+= target.value.trim();
    
    let findGeoObjects = [];
    var url = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";
    var token = this.dadataToken;
    let body = {
      query: query,
      locations: [{country:'*'}],
      // from_bound: {value:'area'},
      // to_bound: {value:'settlement'},
      count: 20
    }

    var options = {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Token " + token
        },
        body: JSON.stringify(body)
    }

    await fetch(url, options)
    .then(response => response.json())
    .then(result => {findGeoObjects = result.suggestions})
    .catch(error => console.error("error", error));
    return findGeoObjects;
  }
  async countryQuery() {
    let answer = false;
    await fetch(this.baseUrl + 'country',{
      method: 'POST',
      body: this.secondStepData
    }).then(res=>res.json())
      .then(data=>answer = data)
      .catch(err=>console.error(err));
  }
  async changeZoneQuery() {
    const internationalDelivery = document.querySelector('[data-shipping-method="international.international"]');
    let answer = false;
    if (!internationalDelivery||(internationalDelivery&&internationalDelivery.hidden)) {
    }
    const fd = new FormData();
    Object.keys(this.changeZoneObj).forEach(key=>{
      fd.set(key, this.changeZoneObj[key])
    });

    for ( var key in this.dadataCity ) {
      fd.set(`dadata[${key}]`, this.dadataCity[key]);
    }

    await fetch(this.baseUrl + 'changeZone',{
      method: 'POST',
      body: fd
    }).then(res=>res.json())
      .then(data=>answer = data)
      .catch(err=>console.error(err));

    
    await this.getCart();

    return answer;
  }

  async getShippingMethod(render = true) {
    await fetch(this.baseUrl + 'shipping_method')
      .then(res=>res.text())
      .then(res=>this.shippingMethodHTML = res)
      .catch(err=>console.error(err));

      render ? this.renderShippingMethod() : null;
  }
  async sdekActions() {
    this.sdekObj = {
      parent: document.querySelector('#pvzPopup'),
      cityEl: document.querySelector('[data-sdek-city]'),
      quantityEl: document.querySelector('[data-sdek-quantity]'),
      searchEl: document.querySelector('[data-sdek-search]'),
      officesEl: document.querySelector('[data-sdek-offices]'),
      officesList: document.querySelector('[data-sdek-list]'),
      mapEl: document.querySelector('[data-sdek-map]'),
      featuresAddr: '',
      featuresObject: null,
      map: null,
      objectManager: null,
    }

    if (this.sdekObj.mapEl&&ymaps) {
      this.mapInit();
    }
    this.sdekMapListActions();
  }
  async sdekMapListActions() {
    if (this.sdekObj.officesEl) {
      this.sdekObj.featuresAddr = this.sdekObj.officesEl.getAttribute('data-sdek-offices');
      this.sdekObj.featuresObject = await this.getSdekFeatures(this.sdekObj.featuresAddr);
      if (this.sdekObj.featuresObject&&this.sdekObj.officesList) {
        this.renderPvzList(this.sdekObj.featuresObject.features);
      }
      if (this.sdekObj.featuresObject&&this.sdekObj.objectManager) {
        this.addMapFeatures(this.sdekObj.featuresObject);
      }
    }
  }
  async getSdekFeatures(address) {
    let featuresObject = {};
    let fd = new FormData();
    fd.set('city_id', this.fias);

    if (address.trim()) {
      await fetch(address.trim(), {
        method: 'POST',
        body: fd,
      })
        .then(res=>res.json())
        .then(res=>featuresObject = res)
        .catch(err=>console.error(err));
    }

    return featuresObject;
  }
  async setMapCenterByCityName(city) {
    const cityFullName = city.unrestricted_value;
    let coords = [59.938785, 30.314817];
    try {
      coords = (await ymaps.geocode(cityFullName).then((e=>e.geoObjects.get(0)))).geometry.getCoordinates()
      if (this.sdekObj.map) {
        this.sdekObj.map.setCenter(coords);
        this.sdekObj.map.setZoom(10);
      }
    } catch (err) {
      console.warn(err);
      setTimeout(() => {
        this.setMapCenterByCityName(city);
      }, 100);
    }

  }
  async shippingSave(variantsPopupTrigger) {
    let answer = false;
    const url = 'index.php?route=checkout/shipping_method/save';
    const options = {
      method: 'POST',
      body: this.secondStepData
    }

    await fetch(url, options)
      .then(res=>res.json())
      .then(res=>answer = res)
      .catch(err=>console.error(err));
  }
  async shippingFieldsQuery() {
    const url = this.baseUrl + 'shippingFields';
    const options = {
      method: 'POST',
      body: new FormData()
    }
    let answer = false;

    await fetch(url, options)
      .then(res=>res.json())
      .then(res=>answer = res)
      .catch(err=>console.error(err))

    return answer;
  }
  async saveAddressFields() {
    const url = this.baseUrl + 'saveAddressFields';
    console.log('saveAddressFields',url);
    const data = new FormData();
    let answer = false;
    
    const addressEl = this.activeStepEl.querySelectorAll('[data-name="street"]');
    let addressValue = false;
    addressEl.length ? addressEl.forEach(e=>{
      if (!e.closest('[hidden]')) {
        addressValue = e.value;
      }
    }) : null;
    

    const postalCodeEl = this.activeStepEl.querySelectorAll('[data-name="postal_code"]');
    let postalCodeValue = false;
    postalCodeEl.length ? postalCodeEl.forEach(e=>{
      if (!e.closest('[hidden]')) {
        postalCodeValue = e.value;
      }
    }) : null;

    const keysArr = ['street', 'house', 'apartment'];
    if (addressValue&&addressValue.trim()) {
      keysArr.forEach(key=>{
        data.set(key, addressValue);
      })
    }

    if (postalCodeValue) {
      data.set('postcode', postalCodeValue);
    }

    const options = {
      method: 'POST',
      body: data
    }

    await fetch(url, options)
      .then(res=>res.json())
      .then(res=>answer = res)
      .catch(err=>console.error(err));

    return answer;
  }
  async saveShippingMethod() {
    const url = this.baseUrl + 'saveShippingMethod';
    const options = {
      method: 'POST',
      body: this.secondStepData
    };
    let answer = false;

    await fetch(url, options)
      .then(res=>res.json())
      .then(res=>answer = res)
      .catch(err=>console.warn(err));

    return answer;
  }
  setMapCenterByCoords(coords, zoom = 14, bounds = false) {
    if (this.sdekObj.map) {
      this.sdekObj.map.setCenter(coords);
      this.sdekObj.map.setZoom(zoom);
    }
  }
  //=================================================================================================
  async threeStepActions() {
    this.loaderHide();
    this.getPaymentEl();
    this.paymentMethods = await this.getPaymentMethods();
    
    const cartProductsTrigger = document.querySelector('._spoller-init [data-spoller]');
    if (cartProductsTrigger) {
      cartProductsTrigger.click();
    }

    const orderInfoEls = this.activeStepEl.querySelectorAll('[data-order-info]');
    if (orderInfoEls.length) {
      this.setOrderInfo(orderInfoEls);
    }

    this.activeStepEl.addEventListener('change', (e)=>{
      if (e.target.dataset?.name === 'payment_method') {
        this.payment_method = e.target.value;
        this.onPaymentChange();
      }
    })
  }
  getPaymentEl() {
    this.paymentEl = document.querySelector('.payment-cart__body');
  }
  setOrderInfo(orderInfoEls) {
    orderInfoEls.forEach((orderInfoEl, index)=>{
      const keyName = orderInfoEl.dataset.orderInfo;
      if (this.orderInfoFirst[keyName]&&this.orderInfoFirst[keyName].trim()) {
        orderInfoEl.hidden = false;
        orderInfoEl.innerHTML = this.orderInfoFirst[keyName];
      } else {
        orderInfoEl.hidden = true;
      }
    })
  }
  async getPaymentMethods() {
    const url = this.baseUrl + 'payment_method';
    let answer = false;

    await fetch(url)
      .then(res=>res.text())
      .then(res=>answer = res)
      .catch(err=>console.error(err));

    this.renderPaymentMethods(answer);
    return answer;
  }
  renderPaymentMethods(html = this.paymentMethods) {
    if (this.paymentEl) {
      this.paymentEl.innerHTML = html;
    }
  }
  async onPaymentChange() {
    const pickupAnswer = await this.setPickupId();
    if (pickupAnswer) {
      const paymentMethodSave = await this.paymentMethodSave();
      if (paymentMethodSave) {
        const validateAddress = await this.validateAddress();
        if (validateAddress) {
          const sessionCheck = await this.sessionCheck();
          if (sessionCheck?.result == 'redirect') {
            let href = sessionCheck.href || '/';
            window.location.href = href;
            return
          }
          if (sessionCheck) {
            const confirmOrder = await this.confirmOrder();
            if (confirmOrder) {
              if (this.podbuttonEl) {
                // this.podbuttonEl.innerHTML = confirmOrder;
                $('.payment-cart__podbutton').html(confirmOrder);

                setTimeout(() => {
                  const form = this.podbuttonEl.querySelector('form');
                  if (form) {
                    const submitInput = form.querySelector('input[type="submit"');
                    if (submitInput) {
                      submitInput.parentElement.insertAdjacentHTML('beforeend', `
                        <button type="submit" class="payment-cart__button mhz-btn" data-confirm-button>${submitInput.value}</button>
                      `)
                    }
                  }
                  
                  if (this.oformitBtn) {
                    this.oformitBtn.hidden = false;
                    this.oformitBtn.addEventListener('click',(e)=>{
                      localStorage.setItem('isOformitClicked', true);
                      e.preventDefault();
                      e.stopPropagation();

                      const podButtonBtn = 
                        this.podbuttonEl.querySelector('[data-confirm-button]') || 
                        this.podbuttonEl.querySelector('#continue-button') || 
                        this.podbuttonEl.querySelector('#button-confirm') || 
                        this.podbuttonEl.querySelector('#yandexpay-button-1');
                      
                      if (podButtonBtn) {
                        this.loaderShow();
                        podButtonBtn.click();
                      }
                    })
                  }
                }, 500);


              }

              const updateOrder = await this.updateOrder();
              if (updateOrder) {
                await this.getCart();
                await this.saveAddressFields();
                this.newsummJson = await this.newsumm();
                console.log('newsumm', this.newsummJson);
                if (Object.keys(this.newsummJson).length) {
                  const roboOutSumm = document.querySelector('#active_robo [name="OutSum"]');
                  const roboSignature = document.querySelector('#active_robo [name="SignatureValue"]');
                  if (roboOutSumm && this.newsummJson.out_summ) {
                    roboOutSumm.value = this.newsummJson.out_summ;
                    console.log('roboOutSumm.value', roboOutSumm.value);
                  }
                  if (roboSignature && this.newsummJson.signature) {
                    roboSignature.value = this.newsummJson.signature;
                    console.log('roboSignature.value', roboSignature.value);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  async setPickupId() {
    const url = 'index.php?route=extension/shipping/ll_cdek/setPickupId';
    const data = new FormData();
    let answer = false;
    if (this.pickupId) {
      data.set('id', this.pickupId);
      const options = {
        method: 'POST',
        body: data
      }

      await fetch(url, options)
        .then(res=>res.text())
        .then(res=>answer = true)
        .catch(err=>console.error(err));
    }

    return answer;
  }
  async paymentMethodSave() {
    const url = 'index.php?route=checkout/payment_method/save';
    const data = new FormData();
    let answer = false;
    const agreeEl = document.querySelector('[data-name="agree_politic"]');
    if (agreeEl) {
      if (agreeEl.checked) {
        data.set('agree', '1');
        data.set('comment', this.orderInfoFirst.comment);
        data.set('payment_method', this.payment_method);
        const options = {
          method: 'POST',
          body: data
        }

        await fetch(url, options)
          .then(res=>res.text())
          .then(res=>answer = true)
          .catch(err=>console.error(err));

      } else {
        formValidate.getErrors(this.activeStepEl);
      }
    }

    return answer;
  }
  async validateAddress() {
    const url = this.baseUrl + 'validateAddress';
    const options = {
      method: 'POST'
    }
    let answer = false;
    await fetch(url, options)
      .then(res=>res.json())
      .then(res=>answer = res.success)
      .catch(err=>console.error(err));

    return answer;
  }
  async sessionCheck() {
    const url = 'index.php?route=extension/payment/newsumm/sessionCheck';
    let data = new FormData();
    let answer = false;
    if (this.payment_method) {
      data.set('payment_method', this.payment_method);
      const options = {
        method: 'POST',
        body: data
      }

      await fetch(url, options)
        .then(res=>res.json())
        .then(res=>answer = res.result)
        .catch(err=>console.error(err));
  
    }

    return answer;
  }
  async confirmOrder() {
    const url = this.baseUrl + 'confirmOrder';
    let answer = false;

    await fetch(url).then(res=>res.text()).then(res=>answer = res).catch(err=>console.error(err));

    this.confirmOrderHTML = answer;
    return answer;
  }
  async updateOrder() {
    const url = this.baseUrl + 'updateOrder';
    let answer = false;

    await fetch(url).then(res=>res.text()).then(res=>answer = true).catch(err=>console.error(err));

    return answer;
  }
  async newsumm() {
    const url = 'index.php?route=extension/payment/newsumm';
    const options = {method: 'POST'};
    let answer = false;

    await fetch(url,options).then(res=>res.json()).then(res=>answer = res).catch(err=>console.error(err));

    return answer;
  }
  //=================================================================================================
  setObserver(index) {
    this.observer.disconnect();
    const elem = this.stepEls[index];
    elem ? this.observer.observe(elem, this.observerConfig) : null;
  }
  mutationCallback(mutations) {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const oldValue = mutation.oldValue;
        if (oldValue.indexOf('_hidden') >= 0&&!mutation.target.classList.contains('_hidden')) {
          mutation.target.classList.add('_hidden');
        }
      }
    })
  }
  //=================================================================================================
  async promptValueWrite(target, promptEl) {
    const input = promptEl.parentElement.querySelector('input');
    const value = target.dataset.value;
    const index = target.dataset.index;
    const isocode = target.dataset.countryIso;
    if (input&&value) {
      input.value = value;
      if (promptEl.closest('._prompt-active')) {
        promptEl.closest('._prompt-active').classList.remove('_prompt-active');
        if (promptEl.closest('[data-street]')) {
          const postalCodeEls = this.activeStepEl.querySelectorAll('[data-postalcode] input');
          // input.focus();
          if (postalCodeEls.length) {
            this.getIndex(input, postalCodeEls);
          }
        }
        if (promptEl.closest('[data-city]')) {
          this.changeZoneObj.zone_name = value;
          if (index) {
            this.orderInfoFirst.dadata = JSON.stringify(this.cities[index].data);
            this.dadataCity = this.cities[index].data;
            this.fias = this.dadataCity.fias_id;

            if (this.dadataCity.settlement_fias_id) {
              this.fias = this.dadataCity.settlement_fias_id;
            } else if (this.dadataCity.area_fias_id) {
              this.fias = this.dadataCity.area_fias_id;
            }
            
            if (ymaps&&this.sdekObj.map) {
              this.setMapCenterByCoords([this.dadataCity.geo_lon, this.dadataCity.geo_lat], 10, true);
            }
          }
          if (this.sdekObj.cityEl) {
            this.sdekObj.cityEl.innerHTML = value;
          }
          // await this.getCityIds();
          await this.changeZoneQuery();
          this.getShippingMethod();
          this.sdekMapListActions();
        }
      }
    }
  }
  async getCityIds() {
    if (this.fias) {
      let findIds = [];
      var url = "POST https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/delivery";
      var token = this.dadataToken;
  
      var options = {
          method: "POST",
          mode: "cors",
          headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": "Token " + token
          },
          body: JSON.stringify({query: this.fias})
      }

      await fetch(url, options)
        .then(res=>res.json())
        .then(result=>findIds = result)
        .catch(err=>console.error(err));
    }
  }
}
