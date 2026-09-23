import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pageMap = JSON.parse(readFileSync(new URL('../public/quran/qcf_v2_pages.json', import.meta.url), 'utf8'));
const surahStarts = JSON.parse(readFileSync(new URL('../public/quran/qcf_surah_starts.json', import.meta.url), 'utf8'));
const reader = readFileSync(new URL('../src/components/MushafPageReader.tsx', import.meta.url), 'utf8');
const mushaf = readFileSync(new URL('../src/components/MushafQuran.tsx', import.meta.url), 'utf8');

test('M1 ships a complete 604-page QCF V2 glyph map', () => {
  assert.equal(Object.keys(pageMap).length, 604);
  for (let page = 1; page <= 604; page += 1) {
    assert.ok(Array.isArray(pageMap[String(page)]), `page ${page} is missing`);
    assert.ok(pageMap[String(page)].length > 0, `page ${page} has no glyph lines`);
  }
});

test('surah start map covers all 114 surahs', () => {
  const surahs = new Set();
  for (const markers of Object.values(surahStarts)) {
    for (const marker of markers) surahs.add(marker.s);
  }
  assert.equal(surahs.size, 114);
  for (let surah = 1; surah <= 114; surah += 1) {
    assert.ok(surahs.has(surah), `surah ${surah} has no page start`);
  }
});

test('reader loads one QCF V2 font per page and prefetches adjacent pages', () => {
  assert.match(reader, /fonts\/quran\/hafs\/v2\/woff2/);
  assert.match(reader, /new FontFace/);
  assert.doesNotMatch(reader, /if\s*\(\s*document\.fonts\.check/);
  assert.match(reader, /document\.fonts\.add\(font\)/);
  assert.match(reader, /\[page - 1, page \+ 1\]/);
  assert.match(reader, /Promise\.allSettled/);
});

test('RTL page navigation uses left for next and right for previous', () => {
  assert.match(reader, /event\.key === 'ArrowLeft'[\s\S]*goNextPage\(\)/);
  assert.match(reader, /event\.key === 'ArrowRight'[\s\S]*goPreviousPage\(\)/);
  assert.match(reader, /deltaX <= -48[\s\S]*goNextPage\(\)/);
  assert.match(reader, /deltaX >= 48[\s\S]*goPreviousPage\(\)/);
  assert.match(reader, /TOTAL_MUSHAF_PAGES = 604/);
});

test('M1 keeps study mode intact and avoids loading surah API in Mushaf mode', () => {
  assert.match(mushaf, /readerMode.*'mushaf'.*'study'/s);
  assert.match(mushaf, /saved === 'study' \? 'study' : 'mushaf'/);
  assert.match(mushaf, /if \(readerMode !== 'study'\) return;/);
  assert.match(mushaf, /<MushafPageReader/);
  assert.match(mushaf, /https:\/\/equran\.id\/api\/v2\/surat\//);
  assert.match(mushaf, /p3-mushaf-page/);
});
