import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/hooks/useActiveTabNavigation.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source + '\nexport { commitLocalNavigation };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

function loadNavigation(globals = {}) {
  const module = { exports: {} };
  vm.runInNewContext(compiled, { module, exports: module.exports, require, ...globals });
  return module.exports.commitLocalNavigation;
}

test('navigation commits once before resetting scroll, without a native snapshot', () => {
  const events = [];
  const classes = new Set();
  let finish;
  const page = { classList: { add: value => classes.add(value), remove: value => classes.delete(value) } };
  const commit = loadNavigation({
    document: {
      startViewTransition() { assert.fail('navigation must not create a native snapshot'); },
      querySelector: () => page
    },
    window: {
      scrollTo: options => events.push(['scroll', options.top, options.left, options.behavior]),
      setTimeout: callback => { finish = callback; return 1; },
      clearTimeout() {}
    }
  });
  commit(() => events.push(['update']));
  assert.deepEqual(events, [['update'], ['scroll', 0, 0, 'auto']]);
  assert.ok(classes.has('is-navigation-entering'));
  finish();
  assert.equal(classes.has('is-navigation-entering'), false);
});

test('navigation still commits when no page animation target is mounted', () => {
  let updates = 0;
  let resets = 0;
  const commit = loadNavigation({
    document: { querySelector: () => null },
    window: { scrollTo: () => resets++ }
  });
  commit(() => updates++);
  assert.equal(updates, 1);
  assert.equal(resets, 1);
});

test('navigation commits once outside the browser without accessing DOM APIs', () => {
  let updates = 0;
  loadNavigation()(() => updates++);
  assert.equal(updates, 1);
});
