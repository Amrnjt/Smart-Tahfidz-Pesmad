import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const strip = readFileSync(new URL('../src/components/dashboard/AcademicContextStrip.tsx', import.meta.url), 'utf8');
const ustadz = readFileSync(new URL('../src/components/UstadzDashboard.tsx', import.meta.url), 'utf8');
const wali = readFileSync(new URL('../src/components/WaliDashboard.tsx', import.meta.url), 'utf8');
const santri = readFileSync(new URL('../src/components/SantriDashboard.tsx', import.meta.url), 'utf8');

test('app keeps academic config in shared realtime master state', () => {
  assert.match(app, /const \[appConfig, setAppConfig\] = useState<AppConfig>/);
  assert.match(app, /setAppConfig\(storageService\.getAppConfig\(\)\)/);
  assert.match(app, /storageService\.subscribeMasterData\(refreshMasterData\)/);
});

test('app passes the same academic config to all dashboard roles', () => {
  const dashboardProps = app.match(/appConfig=\{appConfig\}/g) || [];
  assert.equal(dashboardProps.length, 3);
});

test('shared strip distinguishes formal class from Quran learning class', () => {
  assert.match(strip, /Periode Akademik Aktif/);
  assert.match(strip, /Semester \$\{appConfig\.semesterAkademikAktif\}/);
  assert.match(strip, /\$\{santri\.satuanPendidikan\} · Kelas \$\{santri\.kelasFormal\}/);
  assert.match(strip, /Kelas Al-Qur'an · \$\{santri\.kelas\.trim\(\)\}/);
  assert.match(strip, /statusAkademikFormal/);
  assert.match(strip, /Alumni/);
});

test('staff dashboard shows shared academic period without pretending to have one student identity', () => {
  assert.match(ustadz, /<AcademicContextStrip appConfig=\{appConfig\} \/>/);
});

test('wali and santri dashboards show period plus linked student academic identity', () => {
  assert.match(wali, /<AcademicContextStrip appConfig=\{appConfig\} santri=\{targetSantri\} \/>/);
  assert.match(santri, /<AcademicContextStrip appConfig=\{appConfig\} santri=\{currentSantri\} \/>/);
});

test('wali dashboard consumes the shared app config instead of reading storage directly for dashboard state', () => {
  assert.match(wali, /const programLiburanActive = appConfig\.programLiburanActive;/);
  assert.doesNotMatch(wali, /storageService\.getAppConfig\(\)/);
});
