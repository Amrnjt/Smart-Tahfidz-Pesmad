# Dashboard navigation regression tests

The fixture renders the real Ustadz dashboard, desktop navigation, mobile navigation,
and navigation hook with synthetic records. Browser requests to other origins are
blocked, so the tests do not read or write production data.

Install the browser test runner without changing the app dependencies:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
```

Start Vite in one terminal:

```sh
npm run dev
```

Run the suite in another terminal:

```sh
node --test tests/browser/dashboard.test.mjs
```

Optional environment variables:

- `TEST_BASE_URL`: local Vite origin (defaults to `http://127.0.0.1:3000`).
- `BROWSER_CHANNEL`: installed browser channel, for example `msedge`.
- `PLAYWRIGHT_MODULE`: absolute module path when using a preinstalled runner.

The suite checks desktop card separation, live desktop/mobile navigation, immediate
entrance during rapid tab changes, Back navigation and scroll reset, Setor/Kelola
menus and active indicators, real chart marks after resize and tab changes, recovery
from zero dimensions, and reduced motion. It does not replace an on-device check of
Safari or the full authenticated app.
