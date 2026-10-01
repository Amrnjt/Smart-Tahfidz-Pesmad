import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const pdfSource = readFileSync(new URL('../src/hooks/useGeneratePDF.ts', import.meta.url), 'utf8');
const modalSource = readFileSync(new URL('../src/components/UnduhLaporanModal.tsx', import.meta.url), 'utf8');

test('PDF progress option renders a time-based trend before activity summary', () => {
  assert.match(pdfSource, /Tren Progres Setoran/);
  assert.match(pdfSource, /Jumlah setoran per bulan/);
  assert.match(pdfSource, /Jumlah setoran per minggu/);
  assert.match(pdfSource, /trendBuckets/);
  assert.match(pdfSource, /pdf\.line\(points\[i - 1\]\.x, points\[i - 1\]\.y, points\[i\]\.x, points\[i\]\.y\)/);
  assert.match(pdfSource, /pdf\.circle\(point\.x, point\.y, 1\.25, 'F'\)/);
});

test('single-month progress groups records into weekly buckets', () => {
  assert.match(pdfSource, /for \(let startDay = 1; startDay <= daysInMonth; startDay \+= 7\)/);
  assert.match(pdfSource, /label: \`M\$\{weekIndex\}\`/);
  assert.match(pdfSource, /parsed\.getDate\(\) >= startDay/);
});

test('multi-month progress groups records by month', () => {
  assert.match(pdfSource, /data\.periodRange/);
  assert.match(pdfSource, /parsed\.getFullYear\(\) === yr && parsed\.getMonth\(\) === m/);
  assert.match(pdfSource, /NAMA_BULAN\[m\]\.slice\(0, 3\)/);
});

test('legacy activity bars remain as a separate evaluation summary', () => {
  assert.match(pdfSource, /Ringkasan Aktivitas & Evaluasi/);
  assert.match(pdfSource, /\['Ziyadah', periodZiyadah\.length/);
  assert.match(pdfSource, /\['Mengulang', mengulangCount/);
  assert.match(modalSource, /Grafik Progres & Evaluasi/);
  assert.match(modalSource, /Tren setoran per minggu\/bulan dan ringkasan aktivitas/);
});
