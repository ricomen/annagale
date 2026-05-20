export const FREE_SHIPPING_THRESHOLD = 5000;

export const ROUTE_BASE = 'index.php?route=';
export const CHECKOUT_BASE_URL = `${ROUTE_BASE}checkout/mhz966/`;

export const ENDPOINTS = {
  getCart: `${CHECKOUT_BASE_URL}getCart`,
  cartEdit: `${ROUTE_BASE}checkout/cart/edit`,
  cartRemove: `${ROUTE_BASE}checkout/cart/remove`,
};
