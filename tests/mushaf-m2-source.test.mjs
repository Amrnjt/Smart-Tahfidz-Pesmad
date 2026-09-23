import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const reader = readFileSync(new URL('../src/components/MushafPageReader.tsx', import.meta.url), 'utf8');

test('M2 persists reader theme with light, sepia, and night choices', () => {
  assert.match(reader, /type ReaderTheme = 'light' \| 'sepia' \| 'night'/);
  assert.match(reader, /READER_THEME_KEY/);
  assert.match(reader, /localStorage\.setItem\(READER_THEME_KEY, theme\)/);
  assert.match(reader, /bg-\[#f4ecd8\]/);
});

test('M2 persists page bookmarks and exposes a jump list', () => {
  assert.match(reader, /BOOKMARKS_KEY/);
  assert.match(reader, /getInitialBookmarks/);
  assert.match(reader, /toggleBookmark/);
  assert.match(reader, /Bookmark \(\{bookmarks\.length\}\)/);
  assert.match(reader, /bookmarks\.includes\(page\)/);
});

test('M2 has native fullscreen with CSS focus fallback', () => {
  assert.match(reader, /requestFullscreen/);
  assert.match(reader, /document\.exitFullscreen/);
  assert.match(reader, /fullscreenchange/);
  assert.match(reader, /data-focus-mode/);
  assert.match(reader, /fixed inset-0 z-\[80\]/);
  assert.match(reader, /CSS focus mode remains active/);
});

test('M2 immersive controls can auto-hide and are restored by user activity', () => {
  assert.match(reader, /CONTROL_HIDE_DELAY = 3200/);
  assert.match(reader, /toggleReaderControls/);
  assert.match(reader, /setControlsVisible\(false\)/);
  assert.match(reader, /onMouseMove=\{isFocusMode \? showControls/);
  assert.match(reader, /controlsVisible \? 'opacity-100'/);
});

test('M2 keeps swipe navigation from toggling controls accidentally', () => {
  assert.match(reader, /didSwipeRef\.current = true/);
  assert.match(reader, /if \(didSwipeRef\.current\)/);
  assert.match(reader, /deltaX <= -48[\s\S]*goNextPage\(\)/);
  assert.match(reader, /deltaX >= 48[\s\S]*goPreviousPage\(\)/);
});

test('M2 keeps last-read persistence and official M1 QCF pairing', () => {
  assert.match(reader, /LAST_PAGE_KEY/);
  assert.match(reader, /localStorage\.setItem\(LAST_PAGE_KEY, String\(page\)\)/);
  assert.match(reader, /api\.quran\.com\/api\/v4\/verses\/by_page/);
  assert.match(reader, /static\.qurancdn\.com\/fonts\/quran\/hafs\/v2\/woff2/);
  assert.match(reader, /dangerouslySetInnerHTML=\{\{ __html: word\.code_v2 \}\}/);
});
