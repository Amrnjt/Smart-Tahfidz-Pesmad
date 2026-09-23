import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const reader = readFileSync(new URL('../src/components/MushafPageReader.tsx', import.meta.url), 'utf8');

test('M3 switches to a two-page spread on wide screens', () => {
  assert.match(reader, /matchMedia\('\(min-width: 900px\)'\)/);
  assert.match(reader, /data-mushaf-layout=\{isSpreadLayout \? 'spread' : 'single'\}/);
  assert.match(reader, /aspect-\[4\/3\] grid-cols-2/);
  assert.match(reader, /aspect-\[6\/13\] sm:aspect-\[2\/3\]/);
});

test('M3 preserves physical RTL page placement', () => {
  assert.match(reader, /getSpreadRightPage/);
  assert.match(reader, /safePage % 2 === 0 \? safePage - 1 : safePage/);
  assert.match(reader, /renderPageLeaf\(spreadLeftPage, 'left'\)/);
  assert.match(reader, /renderPageLeaf\(spreadRightPage, 'right'\)/);
});

test('M3 turns wide-screen navigation into spread navigation', () => {
  assert.match(reader, /spreadRightPage \+ 2/);
  assert.match(reader, /spreadRightPage - 2/);
  assert.match(reader, /canGoPrevious/);
  assert.match(reader, /canGoNext/);
  assert.match(reader, /spread berikutnya/);
});

test('M3 loads the companion page and matching QCF page font', () => {
  assert.match(reader, /companionPage/);
  assert.match(reader, /loadOfficialQcfPage\(companionPage\)/);
  assert.match(reader, /loadQcfV2PageFont\(companionPage\)/);
  assert.match(reader, /companionPageData/);
  assert.match(reader, /companionFontFamily/);
});

test('M3 spread fits immersive viewport and keeps a physical gutter', () => {
  assert.match(reader, /46\.154dvh/);
  assert.match(reader, /133\.334dvh/);
  assert.match(reader, /bottom-\[4%\] top-\[4\.5%\]/);
  assert.match(reader, /left-1\/2 z-20/);
  assert.match(reader, /rounded-l-\[1\.35rem\] rounded-r-\[0\.35rem\]/);
  assert.match(reader, /rounded-l-\[0\.35rem\] rounded-r-\[1\.35rem\]/);
});

test('M3 retains M1 glyph pairing and M2 immersive controls', () => {
  assert.match(reader, /dangerouslySetInnerHTML=\{\{ __html: word\.code_v2 \}\}/);
  assert.match(reader, /static\.qurancdn\.com\/fonts\/quran\/hafs\/v2\/woff2/);
  assert.match(reader, /toggleReaderControls/);
  assert.match(reader, /BOOKMARKS_KEY/);
  assert.match(reader, /READER_THEME_KEY/);
});
