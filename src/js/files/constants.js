export const ROUTE_BASE = 'index.php?route=';
export const CHECKOUT_BASE_URL = `${ROUTE_BASE}checkout/mhz966/`;

export const ENDPOINTS = {
  getCart: `${CHECKOUT_BASE_URL}getCart`,
  coupon: `${CHECKOUT_BASE_URL}coupon`,
  cartEdit: `${ROUTE_BASE}checkout/cart/edit`,
  cartRemove: `${ROUTE_BASE}checkout/cart/remove`,
};
