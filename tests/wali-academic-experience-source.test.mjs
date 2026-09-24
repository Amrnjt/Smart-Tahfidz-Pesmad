import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const wali = readFileSync(new URL('../src/components/WaliDashboard.tsx', import.meta.url), 'utf8');

test('wali dashboard resolves one linked santri from current user id', () => {
  assert.match(wali, /santriList\.find\(santri => santri\.idSantri === currentUser\.idSantri\)/);
  assert.match(wali, /const targetSantriId = targetSantri\?\.idSantri \|\| ''/);
});

test('wali academic recap is scoped to the linked target santri only', () => {
  assert.match(wali, /<AcademicReportModal/);
  assert.match(wali, /santri=\{targetSantri\}/);
  assert.match(wali, /currentUser=\{currentUser\}/);
  assert.doesNotMatch(wali, /setReportSantri\(/);
  assert.doesNotMatch(wali, /santriList\.map\([^)]*Rekap Akademik/);
});

test('wali dashboard exposes a true rolling 30-day activity summary', () => {
  assert.match(wali, /addDaysToDateInput\(today, -29\)/);
  assert.match(wali, /date >= thirtyDayStart && date <= today/);
  assert.match(wali, /label="Aktivitas 30 Hari"/);
  assert.match(wali, /label="Hari Aktif"/);
  assert.match(wali, /label="Ziyadah 30 Hari"/);
  assert.match(wali, /label="Catatan Ustadz"/);
});

test('wali dashboard explicitly distinguishes Quran class from formal academic identity', () => {
  assert.match(wali, /Kelas Al-Qur'an:/);
  assert.match(wali, /<AcademicContextStrip appConfig=\{appConfig\} santri=\{targetSantri\} \/>/);
});

test('latest setoran presents the teacher as penyimak and keeps latest teacher note prominent', () => {
  assert.match(wali, />Penyimak:<\/span>/);
  assert.match(wali, /Catatan Ustadz Terbaru/);
  assert.match(wali, /latestNote\.inputBy/);
});

test('app wires notification feedback into wali academic report flow', () => {
  const waliBlockStart = app.indexOf('<WaliDashboard');
  const waliBlockEnd = app.indexOf('/>', waliBlockStart);
  assert.ok(waliBlockStart >= 0 && waliBlockEnd > waliBlockStart);
  const block = app.slice(waliBlockStart, waliBlockEnd);
  assert.match(block, /onNotify=\{notify\}/);
});


test('wali academic recap CTA opens the linked-student modal', () => {
  assert.match(wali, /label: 'Rekap Akademik'/);
  assert.match(wali, /onClick: \(\) => setShowAcademicReport\(true\)/);
  assert.match(wali, /showAcademicReport && \(/);
});
