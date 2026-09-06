import { ENDPOINTS } from "./constants.js";

let couponWidgetInited = false;

export function getPromoWidgets(root = document) {
  return [...root.querySelectorAll('.promo-cart[data-promo]')];
}

export function getPromoParts(root = document) {
  const cartCouponForm = getPromoWidgets(root)[0];
  let cartCouponInput;
  let cartCouponButton;
  let cartCouponButtonSuccess;
  if (cartCouponForm) {
    cartCouponInput = cartCouponForm.querySelector('.promo-cart__input');
    cartCouponButton = cartCouponForm.querySelector('[data-promo-send]');
    cartCouponButtonSuccess = cartCouponForm.querySelector('[data-promo-clean]');
  }
  return {
    cartCouponForm,
    cartCouponInput,
    cartCouponButton,
    cartCouponButtonSuccess
  };
}

function parseCouponCode(cartCoupon) {
  if (!cartCoupon?.title) return '';
  const afterColon = cartCoupon.title.split(':')[1];
  if (afterColon) return afterColon.replaceAll(')', '').trim();
  const inParens = cartCoupon.title.match(/\(([^)]+)\)/);
  return inParens ? inParens[1].trim() : '';
}

export function applyCouponState(cartCoupon, root = document) {
  const couponText = parseCouponCode(cartCoupon);
  const applied = couponText.length > 0;

  getPromoWidgets(root).forEach((widget) => {
    const input = widget.querySelector('.promo-cart__input');
    const sendBtn = widget.querySelector('[data-promo-send]');
    const cleanBtn = widget.querySelector('[data-promo-clean]');
    if (applied) {
      if (input) {
        input.value = couponText;
        input.setAttribute('readonly', '');
      }
      if (sendBtn) sendBtn.hidden = true;
      if (cleanBtn) cleanBtn.hidden = false;
      return;
    }
    if (input) {
      input.value = '';
      input.removeAttribute('readonly');
    }
    if (sendBtn) sendBtn.hidden = false;
    if (cleanBtn) cleanBtn.hidden = true;
  });
}

export function setPromoWidgetsError(hasError) {
  getPromoWidgets().forEach((widget) => {
    widget.classList.toggle('_form-error', !!hasError);
  });
}

export async function sendCoupon(code) {
  const body = new FormData();
  body.set('coupon', code);
  try {
    const response = await fetch(ENDPOINTS.coupon, {
      method: 'POST',
      body
    });
    if (!response.ok) {
      return { error: true };
    }
    return await response.json();
  } catch (err) {
    console.error(err);
    return { error: true };
  }
}

export function initCouponWidget() {
  if (couponWidgetInited) return;
  couponWidgetInited = true;
  ensureCheckoutPromo();

  document.addEventListener('click', (e) => {
    const sendBtn = e.target.closest('[data-promo-send]');
    const cleanBtn = e.target.closest('[data-promo-clean]');
    if (sendBtn) {
      e.preventDefault();
      submitCouponWidget(sendBtn.closest('.promo-cart'));
    }
    if (cleanBtn) {
      e.preventDefault();
      clearCouponWidget(cleanBtn.closest('.promo-cart'));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const input = e.target.closest('.promo-cart__input');
    if (!input) return;
    e.preventDefault();
    e.stopPropagation();
    submitCouponWidget(input.closest('.promo-cart'));
  });
}

async function submitCouponWidget(widget) {
  if (!widget || widget.classList.contains('_sending')) return;

  const input = widget.querySelector('.promo-cart__input');
  const sendBtn = widget.querySelector('[data-promo-send]');
  const code = (input?.value || '').trim();
  getPromoWidgets().forEach((item) => {
    const otherInput = item.querySelector('.promo-cart__input');
    if (otherInput) otherInput.value = code;
    item.classList.remove('_form-error');
  });
  widget.classList.add('_sending');
  if (sendBtn) sendBtn.hidden = true;

  const result = await sendCoupon(code);

  widget.classList.remove('_sending');
  if (result.error && sendBtn) {
    sendBtn.hidden = false;
  }

  document.dispatchEvent(new CustomEvent('couponSent', {
    detail: {
      widget,
      responseResult: result
    }
  }));
}

async function clearCouponWidget(widget) {
  if (!widget) return;
  getPromoWidgets().forEach((item) => {
    const input = item.querySelector('.promo-cart__input');
    const sendBtn = item.querySelector('[data-promo-send]');
    const cleanBtn = item.querySelector('[data-promo-clean]');
    if (input) {
      input.value = '';
      input.removeAttribute('readonly');
    }
    if (cleanBtn) cleanBtn.hidden = true;
    if (sendBtn) sendBtn.hidden = false;
  });
  await submitCouponWidget(widget);
}

export function ensureCheckoutPromo() {
  const boxes = document.querySelector('.main-cart__boxes.boxes-cart');
  if (!boxes || boxes.querySelector('.promo-cart')) return;
  const source = document.querySelector('.mhz-cart_sidebar .promo-cart[data-promo], .mhz-cart__body .mhz-cart__products .promo-cart[data-promo]');
  if (!source) return;

  let slot = boxes.querySelector('.boxes-cart__promo-slot');
  if (!slot) {
    slot = document.createElement('div');
    slot.className = 'boxes-cart__promo-slot';
    const btn = boxes.querySelector('.boxes-cart__button');
    if (btn) {
      btn.insertAdjacentElement('beforebegin', slot);
    } else {
      boxes.append(slot);
    }
  }

  const clone = source.cloneNode(true);
  clone.removeAttribute('data-da');
  clone.hidden = false;
  slot.append(clone);
}
