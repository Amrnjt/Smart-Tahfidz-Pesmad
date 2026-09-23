import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const preloaders = readFileSync(new URL('../src/routes/routePreloaders.ts', import.meta.url), 'utf8');

test('lazy routes share reusable loaders with post-login prefetch', () => {
  for (const loader of [
    'loadUstadzDashboard',
    'loadWaliDashboard',
    'loadSantriDashboard',
    'loadHistoryTable',
    'loadMushafQuran',
    'loadPantauanLiburanPage'
  ]) {
    assert.match(app, new RegExp(`lazy\\(${loader}\\)`));
    assert.match(preloaders, new RegExp(`export const ${loader}`));
  }
});

test('active dashboard starts preloading before login state switches', () => {
  const start = app.indexOf('const handleLoginSuccess');
  const end = app.indexOf('const handleLogout', start);
  assert.ok(start >= 0 && end > start);
  const block = app.slice(start, end);

  assert.match(block, /preloadDashboardForUser\(user\)/);
  assert.ok(
    block.indexOf('preloadDashboardForUser(user)') < block.indexOf('setCurrentUser(user)'),
    'dashboard preload must start before authenticated render'
  );
});

test('post-login route prefetch is idle, sequential, and cancellable', () => {
  assert.match(preloaders, /requestIdleCallback/);
  assert.match(preloaders, /queue\.shift\(\)/);
  assert.match(preloaders, /\.finally\(scheduleNext\)/);
  assert.match(preloaders, /cancelIdleCallback/);
  assert.match(preloaders, /clearTimeout/);
});

test('role queues avoid prefetching management and setoran forms for wali and santri', () => {
  const waliStart = preloaders.indexOf("if (role === 'wali')");
  const santriStart = preloaders.indexOf("if (role === 'santri')", waliStart);
  const pimpinanStart = preloaders.indexOf("if (role === 'pimpinan')", santriStart);
  const ustadzStart = preloaders.indexOf('return [', pimpinanStart);

  assert.ok(waliStart >= 0 && santriStart > waliStart && pimpinanStart > santriStart && ustadzStart > pimpinanStart);

  const waliBlock = preloaders.slice(waliStart, santriStart);
  const santriBlock = preloaders.slice(santriStart, pimpinanStart);
  for (const block of [waliBlock, santriBlock]) {
    assert.doesNotMatch(block, /loadSantriManagement|loadKelasManagement|loadZiyadahForm|loadMurojaahForm/);
  }
});

test('loading copy is delayed so fast cached navigation does not flash', () => {
  assert.match(app, /setShowMessage\(true\), 180/);
  assert.match(app, /showMessage \? 'Memuat halaman\.\.\.' : null/);
});
