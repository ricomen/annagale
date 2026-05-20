// Подключение функционала "Чертогов Фрилансера"
import { isMobile, _slideDown, _slideUp } from "./functions.js";
// Подключение списка активных модулей
import { MhzCart } from "./cart_main.js";
import { MhzCartSidebar } from "./cart_sidebar.js";
import  "./modules.js";

let cartSidebar = null;

document.addEventListener("DOMContentLoaded", function () {
  const header = document.querySelector('.header');
  const wrapper = document.querySelector('.wrapper');
  header&&wrapper ? setWrapperPadding(header, wrapper) : null;
  setProductListMaxHeight();
  window.addEventListener('resize', function () {
    header&&wrapper ? setWrapperPadding(header, wrapper) : null;
    setProductListMaxHeight();
  })
  window.addEventListener('scroll', function () {
    header&&wrapper ? setWrapperPadding(header, wrapper) : null;
  })
  
  const cartMain = document.querySelector('.main-cart');
  if (cartMain) {
    const cartSteps = cartMain.querySelectorAll('[data-step]');
    const cartProducts = document.querySelector('.mhz-cart__body .products-cart');
    if (cartSteps.length&&cartProducts) {
      new MhzCart(cartMain, cartSteps, cartProducts, 1, true)
    }
  }


  const cartSidebarEl = document.querySelector('.mhz-cart_sidebar');
  if (cartSidebarEl) {
    cartSidebar = new MhzCartSidebar(cartSidebarEl);
    window.cartSidebar = cartSidebar;
  }
})


function setWrapperPadding(header, wrapper) {
  document.body.style.setProperty('--pt', header.offsetHeight + 'px');
  setTimeout(() => {
    document.body.style.setProperty('--pt', header.offsetHeight + 'px');
  }, 500);
}

function setProductListMaxHeight() {
  const cartSidebar = document.querySelector('.mhz-cart_sidebar');

  if (cartSidebar) {
    const productsCartTop = cartSidebar.querySelector('.products-cart__top');
    const productsCartHead = cartSidebar.querySelector('.products-cart__head');
    const productsCartPromo = cartSidebar.querySelector('.products-cart__promo');
    const productsCartSumm = cartSidebar.querySelector('.products-cart__summ');
    const productsCartButton = cartSidebar.querySelector('.products-cart__button');
    let sidebarHeight = cartSidebar.offsetHeight;
  
    const productsCartList = cartSidebar.querySelector('.products-cart__list');
    if (productsCartList) {
      let productsCartTopHeight = productsCartTop ? productsCartTop.offsetHeight : 0;
      let productsCartHeadHeight = productsCartHead ? productsCartHead.offsetHeight : 0;
      let productsCartPromoHeight = productsCartPromo ? productsCartPromo.offsetHeight : 0;
      let productsCartSummHeight = productsCartSumm ? productsCartSumm.offsetHeight : 0;
      let productsCartButtonHeight = productsCartButton ? productsCartButton.offsetHeight : 0;

      let minusHeight = productsCartTopHeight + productsCartHeadHeight + productsCartPromoHeight + productsCartSummHeight + productsCartButtonHeight + 67;
  
      // productsCartList.style.maxHeight = sidebarHeight - minusHeight > 150 ? sidebarHeight - minusHeight + 'px' : '150px';
    }
  }
  

  const cartInContainer = document.querySelector('.mhz-cart__container .products-cart__list');
  if (cartInContainer) {
    const cartInContainerItems =cartInContainer.querySelectorAll('.item-cart');
    let height = 0;
    cartInContainerItems.forEach((item, index) => {
      if (index < 3) {
        height += item.offsetHeight;
      }
    })
    height > 0 ? cartInContainer.style.maxHeight = height-1 + 'px' : null;
  }
}


document.addEventListener('click', function (e) {
  if (e.target.closest('[data-sidecart-open]')) {
    document.documentElement.classList.add('sidecart-open');
    document.documentElement.classList.add('lock');
    if (!isMobile.any()) {
      document.body.style.paddingRight = `17px`;
      document.querySelector('.header') ? document.querySelector('.header').style.paddingRight = `17px` : null;
    }
    setProductListMaxHeight();
  }
  if (e.target.closest('[data-sidecart-close]')) {
    if (document.querySelector('.main-cart')&&!e.target.classList.contains('mhz-cart__backdrop')) {
      history.back();
    } else {
      document.documentElement.classList.remove('sidecart-open');
      document.documentElement.classList.remove('lock');
      document.body.style.paddingRight = ``;
      document.querySelector('.header') ? document.querySelector('.header').style.paddingRight = `` : null;
    }
  }

  const checkCartClose = e.target.closest('.check-cart__close');
  if (checkCartClose) {
    const checkCart = checkCartClose.closest('.check-cart');
    if (checkCart) {
      checkCart.classList.add('_hide');
      setTimeout(() => {
        checkCart.hidden = true;
      }, 300);
    }
  }

  const cartDel = e.target.closest('.item-cart__del');
  if (cartDel) {
    const cartItem = cartDel.closest('.item-cart');
    if (cartItem) {
      _slideUp(cartItem);
    }
  }
})

