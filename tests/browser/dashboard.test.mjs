import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

async function open(t, width = 1280, reducedMotion = 'no-preference') {
  const browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {}) });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  await page.goto(baseURL + '/tests/browser/dashboard.html');
  await page.locator('.p323-operator-hero').waitFor();
  t.after(() => assert.deepEqual(errors, [], 'no uncaught browser errors'));
  return page;
}

test('desktop daily card and rhythm occupy separate rows without overlap', async t => {
  const page = await open(t);
  for (const width of [1024, 1280, 1536]) {
    await page.setViewportSize({ width, height: 900 });
    const daily = await page.getByRole('button', { name: /setoran hari ini. Buka riwayat/ }).boundingBox();
    const rhythm = await page.locator('.p323-rhythm-card').boundingBox();
    assert.ok(daily && rhythm);
    assert.ok(rhythm.y >= daily.y + daily.height + 8, `rhythm must follow daily card at ${width}px`);
  }
});

test('desktop active navigation remains live without a named snapshot', async t => {
  const page = await open(t);
  const nav = page.getByRole('navigation', { name: 'Navigasi utama', exact: true });
  for (const destination of ['Riwayat', 'Beranda']) {
    await nav.getByRole('button', { name: destination, exact: true }).click();
    assert.equal(await nav.locator('[aria-current="page"]').evaluate(el => getComputedStyle(el).viewTransitionName), 'none');
  }
});

test('rapid navigation starts the local entrance before the new page can paint', async t => {
  const page = await open(t, 390);
  const states = await page.evaluate(() => {
    const nav = document.querySelector('nav[aria-label="Navigasi bawah"]');
    return ['Riwayat', 'Beranda', 'Riwayat'].map(label => {
      nav.querySelector(`button[aria-label="${label}"]`).click();
      const content = document.querySelector('.p3-page-content');
      return { tab: content.getAttribute('data-tab'), animation: getComputedStyle(content).animationName };
    });
  });
  assert.deepEqual(states.map(state => state.tab), ['riwayat', 'dashboard', 'riwayat']);
  assert.ok(states.every(state => state.animation === 'chrome-local-page-in'), JSON.stringify(states));
});

test('tab changes and Back keep live DOM and never invoke native snapshots', async t => {
  const page = await open(t, 390);
  await page.evaluate(() => {
    window.snapshotCalls = 0;
    const original = document.startViewTransition?.bind(document);
    document.startViewTransition = callback => {
      window.snapshotCalls++;
      return original ? original(callback) : { ready: Promise.resolve(callback()), finished: Promise.resolve() };
    };
    window.savedNav = document.querySelector('nav[aria-label="Navigasi bawah"]');
  });
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.getByRole('navigation', { name: 'Navigasi bawah', exact: true }).getByRole('button', { name: 'Riwayat', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-tab="riwayat"]'));
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('[data-tab="dashboard"]'));
  }
  assert.equal(await page.evaluate(() => window.snapshotCalls), 0);
  assert.equal(await page.evaluate(() => window.savedNav === document.querySelector('nav[aria-label="Navigasi bawah"]')), true);
  assert.equal(await page.locator('.p2-bottom-active-rail').evaluate(el => getComputedStyle(el).viewTransitionName), 'none');
});

test('mobile Setor and Kelola preserve routes, active rail, and close on navigation', async t => {
  const page = await open(t, 390);
  const nav = page.getByRole('navigation', { name: 'Navigasi bawah', exact: true });
  await nav.getByRole('button', { name: 'Tambah Setoran Baru', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Ziyadah', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-tab="ziyadah"]'));
  await page.getByRole('menu', { name: 'Pilih jenis setoran' }).waitFor({ state: 'detached' });
  assert.equal(await nav.locator('.p2-setor-slot .p2-bottom-active-rail').count(), 1);
  await nav.getByRole('button', { name: 'Buka menu Kelola', exact: true }).click();
  await page.getByRole('menuitem', { name: /Kelas/ }).click();
  await page.waitForFunction(() => document.querySelector('[data-tab="kelas"]'));
  await page.locator('#manage-dropdown-menu').waitFor({ state: 'hidden' });
  assert.equal(await nav.locator('.p2-manage-slot .p2-bottom-active-rail').count(), 1);
  await nav.getByRole('button', { name: 'Tambah Setoran Baru', exact: true }).click();
  await nav.getByRole('button', { name: 'Riwayat', exact: true }).click();
  await page.getByRole('menu', { name: 'Pilih jenis setoran' }).waitFor({ state: 'detached' });
  assert.equal(await nav.locator('.p2-bottom-active-rail').count(), 1);
});

test('Ustadz charts paint real data and fit their frames after switching and resizing', async t => {
  const page = await open(t, 390);
  for (const width of [390, 1280, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const name of ['Tren bulanan', 'Aktivitas & kualitas']) {
      await page.getByRole('button', { name, exact: true }).click();
      await page.waitForFunction(() => [...document.querySelectorAll('.p323-deferred-surface .recharts-surface')].some(svg => svg.querySelector('.recharts-area-area, .recharts-rectangle')));
      const dimensions = await page.locator('.p323-deferred-surface .recharts-wrapper').evaluateAll(charts => charts.map(chart => {
        const svg = chart.querySelector(':scope > svg');
        const frame = (chart.closest('.recharts-responsive-container')?.parentElement || chart.parentElement).getBoundingClientRect();
        return { width: Number(svg?.getAttribute('width')), height: Number(svg?.getAttribute('height')), frameWidth: frame.width, frameHeight: frame.height };
      }));
      assert.ok(dimensions.length > 0);
      for (const size of dimensions) {
        assert.ok(size.width > 0 && size.height > 0);
        assert.ok(size.width <= size.frameWidth + 1 && size.height <= size.frameHeight + 1, JSON.stringify(size));
      }
    }
  }
});

test('Ustadz charts stop rendering at zero dimensions and recover when shown', async t => {
  const page = await open(t, 390);
  await page.locator('.p323-deferred-surface .recharts-wrapper').first().waitFor({ state: 'attached' });
  await page.locator('.p323-deferred-surface').evaluate(el => { el.style.display = 'none'; });
  await page.waitForFunction(() => document.querySelectorAll('.p323-deferred-surface .recharts-wrapper').length === 0, null, { timeout: 2000 });
  await page.locator('.p323-deferred-surface').evaluate(el => { el.style.display = ''; });
  await page.locator('.p323-deferred-surface .recharts-wrapper').first().waitFor({ state: 'visible' });
});

test('reduced motion switches pages without a page entrance animation', async t => {
  const page = await open(t, 390, 'reduce');
  await page.getByRole('button', { name: 'Riwayat uji', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-tab="riwayat"]'));
  assert.equal(await page.locator('.p3-page-content').evaluate(el => getComputedStyle(el).animationName), 'none');
});
