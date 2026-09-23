import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const surahStarts = JSON.parse(readFileSync(new URL('../public/quran/qcf_surah_starts.json', import.meta.url), 'utf8'));
const reader = readFileSync(new URL('../src/components/MushafPageReader.tsx', import.meta.url), 'utf8');
const mushaf = readFileSync(new URL('../src/components/MushafQuran.tsx', import.meta.url), 'utf8');

test('M1 uses official QCF V2 page glyphs instead of a mismatched local glyph map', () => {
  assert.match(reader, /https:\/\/api\.quran\.com\/api\/v4\/verses\/by_page/);
  assert.match(reader, /word_fields.*code_v2,text_uthmani,line_number,page_number/s);
  assert.match(reader, /mushaf.*'1'/s);
  assert.match(reader, /groupWordsByLine/);
  assert.match(reader, /grid-rows-\[repeat\(15,minmax\(0,1fr\)\)\]/);
  assert.doesNotMatch(reader, /qcf_v2_pages\.json/);
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

test('reader pairs Quran.com code_v2 with the matching QuranCDN V2 page font', () => {
  assert.match(reader, /https:\/\/static\.qurancdn\.com\/fonts\/quran\/hafs\/v2\/woff2/);
  assert.match(reader, /new FontFace/);
  assert.match(reader, /document\.fonts\.add\(font\)/);
  assert.match(reader, /dangerouslySetInnerHTML=\{\{ __html: word\.code_v2 \}\}/);
  assert.match(reader, /\[page - 1, page \+ 1\]/);
  assert.match(reader, /loadOfficialQcfPage\(candidate\)/);
  assert.match(reader, /loadQcfV2PageFont\(candidate\)/);
  assert.match(reader, /Promise\.allSettled/);
});

test('surah headers reserve the physical Mushaf rows before official word lines', () => {
  assert.match(reader, /const headerLine = marker\.l \+ 1/);
  assert.match(reader, /headerLine \+ 1/);
  assert.match(reader, /marker\.b === 1/);
  assert.match(reader, /lineMap(?:ForPage)?\.get\(lineNumber\)/);
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
