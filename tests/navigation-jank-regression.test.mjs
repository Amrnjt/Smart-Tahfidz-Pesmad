import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const navigation = readFileSync(new URL('../src/hooks/useActiveTabNavigation.ts', import.meta.url), 'utf8');
const chromeTransitionCss = readFileSync(new URL('../src/chrome-transition-fix.css', import.meta.url), 'utf8');
const scrollReveal = readFileSync(new URL('../src/components/ScrollReveal.tsx', import.meta.url), 'utf8');
const ustadzDashboard = readFileSync(new URL('../src/components/UstadzDashboard.tsx', import.meta.url), 'utf8');
const ustadzCss = readFileSync(new URL('../src/ustadz-experience-finish.css', import.meta.url), 'utf8');

test('stage 2 keeps page content and root pixels out of the visible Native View Transition', () => {
  assert.match(chromeTransitionCss, /\.ui-app-shell > main#main-content,[\s\S]*?\.p3-page-content,[\s\S]*?\.p3-chrome-stack\s*\{[\s\S]*?view-transition-name:\s*none/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*p2-page/);
  assert.match(chromeTransitionCss, /::view-transition-old\(root\),\s*::view-transition-new\(root\)\s*\{[\s\S]*?opacity:\s*0\s*!important/);
  assert.match(chromeTransitionCss, /\.p2-bottom-active-rail\s*\{[\s\S]*?view-transition-name:\s*p2-nav-active/);
  assert.match(chromeTransitionCss, /\.p3-page-content\.is-navigation-entering\s*\{[\s\S]*?animation:/);
});

test('tab scroll reset happens after Native View Transition snapshot readiness, not inside the update callback', () => {
  assert.match(navigation, /const startLocalPageEntrance = \(\) => \{/);
  assert.match(navigation, /flushSync\(update\);/);
  assert.doesNotMatch(navigation, /flushSync\(update\);\s*resetNavigationScroll\(\);/);
  assert.match(navigation, /transition\.ready\.then\(\(\) => \{\s*resetNavigationScroll\(\);\s*startLocalPageEntrance\(\);/);
  assert.match(navigation, /if \(reduceMotion \|\| !transitionDocument\.startViewTransition\) \{\s*update\(\);\s*resetNavigationScroll\(\);\s*startLocalPageEntrance\(\);/);
});

test('persistent top chrome remains live and has no named transition snapshot', () => {
  assert.match(chromeTransitionCss, /\.p3-chrome-stack\s*\{[\s\S]*?view-transition-name:\s*none/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*p3-app-chrome/);
  assert.doesNotMatch(chromeTransitionCss, /::view-transition-(?:group|old|new)\(p3-app-chrome\)/);
});

test('Ustadz analytics gives Recharts explicit measured pixel dimensions without changing Wali or Santri reveal behavior', () => {
  assert.match(ustadzDashboard, /<ScrollReveal delay=\{80\} className="p323-deferred-surface space-y-3">/);
  assert.match(scrollReveal, /const revealImmediately = className\.split\(\/\\s\+\/\)\.includes\('p323-deferred-surface'\);/);
  assert.match(scrollReveal, /new ResizeObserver\(syncMeasuredCharts\)/);
  assert.match(scrollReveal, /new MutationObserver\(syncMeasuredCharts\)/);
  assert.match(scrollReveal, /--p323-chart-width/);
  assert.match(scrollReveal, /--p323-chart-height/);
  assert.match(scrollReveal, /classList\.add\('p323-chart-measured'\)/);
  assert.match(ustadzCss, /\.p3-ustadz-page \.p323-deferred-surface \.recharts-responsive-container\.p323-chart-measured\s*\{[\s\S]*?width:\s*var\(--p323-chart-width\)\s*!important;[\s\S]*?height:\s*var\(--p323-chart-height\)\s*!important;/);
});
