import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const navigation = readFileSync(new URL('../src/hooks/useActiveTabNavigation.ts', import.meta.url), 'utf8');
const chromeTransitionCss = readFileSync(new URL('../src/chrome-transition-fix.css', import.meta.url), 'utf8');
const scrollReveal = readFileSync(new URL('../src/components/ScrollReveal.tsx', import.meta.url), 'utf8');
const ustadzDashboard = readFileSync(new URL('../src/components/UstadzDashboard.tsx', import.meta.url), 'utf8');
const ustadzCss = readFileSync(new URL('../src/ustadz-experience-finish.css', import.meta.url), 'utf8');

test('tab navigation resets the new page scroll position inside the transition commit', () => {
  assert.match(navigation, /const resetNavigationScroll = \(\) => \{/);
  assert.match(navigation, /window\.scrollTo\(\{\s*top:\s*0,\s*left:\s*0,\s*behavior:\s*'auto'\s*\}\);/);
  assert.match(navigation, /flushSync\(update\);\s*resetNavigationScroll\(\);/);
  assert.match(navigation, /if \(reduceMotion \|\| !transitionDocument\.startViewTransition\) \{\s*update\(\);\s*resetNavigationScroll\(\);/);
});

test('persistent top chrome is never promoted into its own View Transition snapshot', () => {
  assert.match(chromeTransitionCss, /\.p3-chrome-stack\s*\{[\s\S]*?view-transition-name:\s*none/);
  assert.doesNotMatch(chromeTransitionCss, /view-transition-name:\s*p3-app-chrome/);
  assert.doesNotMatch(chromeTransitionCss, /::view-transition-(?:group|old|new)\(p3-app-chrome\)/);
});

test('Ustadz analytics bypass delayed ScrollReveal lifecycle so Recharts can measure immediately', () => {
  assert.match(ustadzDashboard, /<ScrollReveal delay=\{80\} className="p323-deferred-surface space-y-3">/);
  assert.match(scrollReveal, /const revealImmediately = className\.split\(\/\\s\+\/\)\.includes\('p323-deferred-surface'\);/);
  assert.match(scrollReveal, /useState\(revealImmediately\)/);
  assert.match(scrollReveal, /if \(revealImmediately\) return;/);
  assert.match(ustadzCss, /\.p3-ustadz-page \.p323-deferred-surface\s*\{[\s\S]*?content-visibility:\s*visible;[\s\S]*?contain:\s*none;/);
  assert.match(ustadzCss, /\.p3-ustadz-page \.p323-deferred-surface \.recharts-responsive-container\s*\{[\s\S]*?min-height:\s*240px;/);
});
