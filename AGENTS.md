# AGENTS.md

## What this is
Checkout/cart landing page ("Anna Gale") for an OpenCart store, built on the FLS Gulp+Webpack template ("Чертоги Фрилансера" v3). Comments are in Russian; template docs: https://template.fls.guru/template-docs.

No lint, tests, or CI exist. Verification = `npm run build` completes without webpack/gulp errors.

## Commands
- `npm run dev` — gulp (fonts pass) then webpack dev server; opens `/home.html` (the cart page).
- `npm run build` — production build → `dist/` (gitignored).
- `npm run fonts` — required after adding OTF/TTF files to `src/fonts/`; converts to woff/woff2 and regenerates `_fonts.scss`.
- Gulp behavior is flag-driven — `gulpfile.js` parses argv into `global.app`: `--build`, `--nowebp`, `--rewrite`.
- `npm run deploy` / `zip` need FTP creds in `config/gulp-settings.js` (`configFTP`) — currently empty.

## Build wiring (how code enters the bundle)
- Single webpack entry: `src/js/app.js`; single SCSS entry: `src/scss/style.scss`. Standalone JS/SCSS files are never bundled — new modules must be imported from these two (template style: copy-import an existing commented block).
- HTML partials live in `src/html/` and are inserted with `@@include('html/_head.htm', {"title":"..."})`.
- `@img/...` placeholders in HTML/SCSS are rewritten to real paths at build. Webpack aliases: `@scss`, `@js`, `@img`.
- No `.pug` files exist; if one is added, webpack switches from FileIncludeWebpackPlugin to HtmlWebpackPlugin mode for pages.

## Mock backend
- Dev server middleware `config/webpack-mock.js` intercepts `/index.php?route=...`: `checkout/mhz966/getCart|coupon|setBoxCart|validateStepFirst`, `checkout/cart/edit`, `checkout/cart/remove`; other `checkout/*` and `extension/*` POSTs get a stub `{success:true}`.
- Cart data comes from `src/files/mock/cart.json`; state is in-memory (restart dev server to reset). Price/coupon formatting logic lives in webpack-mock.js.
- Real API endpoints are defined only in `src/js/files/constants.js` (`ENDPOINTS`).

## Dead code / don't edit
- `src/two_step.js` — legacy standalone jQuery checkout (routes `checkout/checkout_two_step/*`), not bundled. Live checkout logic: `src/js/files/cart_main.js`, `cart_sidebar.js`, `coupon.js` (routes `checkout/mhz966/*`).
- `src/prod_backup/` — frozen copy of the old production OpenCart theme (Twig). Reference only.
- `pvzwidget/` — third-party PVZ (CDEK delivery point) widget source/docs. The widget used by the site is `src/files/widjet.js`, loaded from `src/html/_head.htm`.
- `src/componetns/sendmail/` — PHP/PHPMailer form-mail backend for PHP hosting (note the misspelled folder name `componetns`).

## Gotchas
- `src/index.html` is just the template's root page linking to real pages via the dev server.
- `.gitignore` contains a literal `undefined` entry (template artifact) — harmless, don't "fix" it blindly.
