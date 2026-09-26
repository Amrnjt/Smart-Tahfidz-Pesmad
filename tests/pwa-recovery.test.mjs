import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const boundary = readFileSync(new URL('../src/components/AppErrorBoundary.tsx', import.meta.url), 'utf8');
const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

test('installed app registers a service worker and handles Vite preload errors', () => {
  assert.match(indexHtml, /serviceWorker\.register\('\/sw\.js'/);
  assert.match(indexHtml, /vite:preloadError/);
  assert.match(indexHtml, /pesmad_pwa_recovery_v1/);
  assert.match(indexHtml, /RECOVERY_WINDOW_MS = 45000/);
});

test('startup failure never leaves an empty root forever', () => {
  assert.match(indexHtml, /pesmad-startup-recovery/);
  assert.match(indexHtml, /startupTimer = window\.setTimeout/);
  assert.match(indexHtml, /Muat Versi Terbaru/);
});

test('React root is protected by an error boundary', () => {
  assert.match(main, /<AppErrorBoundary>/);
  assert.match(boundary, /getDerivedStateFromError/);
  assert.match(boundary, /Aplikasi perlu dimuat ulang/);
});

test('service worker preserves hashed assets and provides navigation fallback', () => {
  assert.match(sw, /url\.pathname\.startsWith\('\/assets\/'\)/);
  assert.match(sw, /const cached = await cache\.match\(request\)/);
  assert.match(sw, /request\.mode === 'navigate'/);
  assert.match(sw, /const cachedShell = await cache\.match\('\/'\)/);
  assert.match(sw, /MAX_RUNTIME_ENTRIES = 120/);
});
