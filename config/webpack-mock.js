import fs from 'fs';
import path from 'path';

const cartJsonPath = path.resolve('src/files/mock/cart.json');

function loadCart() {
	return JSON.parse(fs.readFileSync(cartJsonPath, 'utf8'));
}

function formatPrice(value) {
	return `${String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;
}

function recalc(cart) {
	const sum = cart.products.reduce((acc, product) => acc + product._price * product.quantity, 0);
	cart.total_products = cart.products.reduce((acc, product) => acc + Number(product.quantity), 0);
	cart.totals.products.text = formatPrice(sum);
	cart.totals.total.text = formatPrice(sum);
	cart.products.forEach((product) => {
		product.total = formatPrice(product._price * product.quantity);
	});
	return cart;
}

function parseFields(req) {
	return new Promise((resolve) => {
		const chunks = [];
		req.on('data', (chunk) => chunks.push(chunk));
		req.on('end', () => {
			const raw = Buffer.concat(chunks).toString('latin1');
			const fields = {};
			const multipart = /name="([^"]+)"\r\n\r\n([^\r]*)/g;
			let match;
			while ((match = multipart.exec(raw))) {
				fields[match[1]] = match[2];
			}
			if (!Object.keys(fields).length) {
				new URLSearchParams(raw).forEach((value, key) => {
					fields[key] = value;
				});
			}
			resolve(fields);
		});
	});
}

function sendJson(res, data) {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'application/json; charset=utf-8');
	res.end(JSON.stringify(data));
}

export function createCartMockMiddleware() {
	let cart = recalc(loadCart());

	return async (req, res, next) => {
		const url = new URL(req.url, 'http://localhost');
		if (url.pathname !== '/index.php') {
			return next();
		}

		const route = url.searchParams.get('route') || '';

		if (route === 'checkout/mhz966/getCart') {
			return sendJson(res, cart);
		}

		if (route === 'checkout/mhz966/validateStepFirst') {
			await parseFields(req);
			return sendJson(res, { success: true });
		}

		if (route === 'checkout/mhz966/coupon') {
			const fields = await parseFields(req);
			const code = (fields.coupon || '').trim();
			if (code) {
				cart.totals.coupon = {
					title: `Купон (${code})`,
					text: '-500 ₽'
				};
			} else {
				delete cart.totals.coupon;
			}
			recalc(cart);
			return sendJson(res, {});
		}

		if (route === 'checkout/mhz966/setBoxCart') {
			await parseFields(req);
			return sendJson(res, {});
		}

		if (route === 'checkout/cart/edit') {
			const fields = await parseFields(req);
			const product = cart.products.find((item) => String(item.cart_id) === String(fields.key));
			if (product && fields.quantity) {
				product.quantity = Math.max(1, parseInt(fields.quantity, 10) || 1);
				recalc(cart);
			}
			return sendJson(res, {
				total_price: cart.totals.total.text,
				total: cart.total_products
			});
		}

		if (route === 'checkout/cart/remove') {
			const fields = await parseFields(req);
			cart.products = cart.products.filter((item) => String(item.cart_id) !== String(fields.key));
			recalc(cart);
			return sendJson(res, {
				total_price: cart.totals.total.text,
				total: cart.total_products
			});
		}

		if (route.startsWith('checkout/') || route.startsWith('extension/')) {
			if (req.method !== 'GET') {
				await parseFields(req);
			}
			return sendJson(res, { success: true });
		}

		return next();
	};
}
