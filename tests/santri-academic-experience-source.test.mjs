import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const santri = readFileSync(new URL('../src/components/SantriDashboard.tsx', import.meta.url), 'utf8');

test('santri dashboard resolves the logged-in linked santri only', () => {
  assert.match(santri, /santriList\.find\(santri => santri\.idSantri === currentUser\.idSantri\)/);
  assert.match(santri, /const currentSantriId = currentSantri\?\.idSantri \|\| ''/);
});

test('santri academic report is scoped to currentSantri without another student selector', () => {
  assert.match(santri, /label: 'Rekap Akademik Saya'/);
  assert.match(santri, /onClick: \(\) => setShowAcademicReport\(true\)/);
  assert.match(santri, /<AcademicReportModal/);
  assert.match(santri, /santri=\{currentSantri\}/);
  assert.match(santri, /currentUser=\{currentUser\}/);
  assert.doesNotMatch(santri, /setReportSantri\(/);
});

test('santri dashboard explicitly separates formal identity from Quran learning class', () => {
  assert.match(santri, /Santri · \$\{currentSantri\.satuanPendidikan\} · Kelas \$\{currentSantri\.kelasFormal\}/);
  assert.match(santri, /Kelas Al-Qur'an:/);
  assert.match(santri, /<AcademicContextStrip appConfig=\{appConfig\} santri=\{currentSantri\} \/>/);
});

test('santri dashboard provides rolling 7-day and 30-day summaries', () => {
  assert.match(santri, /addDaysToDateInput\(today, -6\)/);
  assert.match(santri, /addDaysToDateInput\(today, -29\)/);
  assert.match(santri, /label="Aktivitas 7 Hari"/);
  assert.match(santri, /label="Hari Aktif"/);
  assert.match(santri, /label="Aktivitas 30 Hari"/);
  assert.match(santri, /label="Ziyadah 30 Hari"/);
});

test('fokus berikutnya is derived from latest Ustadz feedback and its actual material', () => {
  assert.match(santri, /Fokus Berikutnya/);
  assert.match(santri, /latestFeedback\.category/);
  assert.match(santri, /latestFeedback\.material/);
  assert.match(santri, /latestFeedback\.catatan/);
  assert.match(santri, /latestFeedback\.inputBy/);
});

test('app wires notification feedback into santri academic report flow', () => {
  const blockStart = app.indexOf('<SantriDashboard');
  const blockEnd = app.indexOf('/>', blockStart);
  assert.ok(blockStart >= 0 && blockEnd > blockStart);
  const block = app.slice(blockStart, blockEnd);
  assert.match(block, /onNotify=\{notify\}/);
});


test('santri latest setoran identifies the teacher as penyimak', () => {
  assert.match(santri, />Penyimak:<\/span>/);
});
