import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  consolidateBinnadzorClasses,
  getClassGroup,
  isBinnadzorClass,
} from '../src/utils/classUtils.ts';
import type { Kelas } from '../src/types/index.ts';

const legacyClass = (
  id: string,
  namaKelas: string,
  tipeKelas: string,
  santriIds: string[],
  musyrifId?: string,
): Kelas => ({
  id,
  namaKelas,
  tipeKelas: tipeKelas as Kelas['tipeKelas'],
  musyrif: musyrifId ? `Ustadz ${musyrifId}` : '',
  musyrifId,
  musyrifIds: musyrifId ? [musyrifId] : [],
  santriIds,
  createdAt: '2026-09-01T00:00:00.000Z',
});

test('legacy Binnadzor A/B labels normalize to the single Binnadzor group', () => {
  assert.equal(getClassGroup('Binnadzor A'), 'Binnadzor');
  assert.equal(getClassGroup('Binnadzor B'), 'Binnadzor');
  assert.equal(getClassGroup('Binnadzor'), 'Binnadzor');
});

test('consolidation merges A/B students and pengampu into one Binnadzor class', () => {
  const result = consolidateBinnadzorClasses([
    legacyClass('BA', 'Binnadzor A', 'Binnadzor A', ['S-001', 'S-002'], 'U-1'),
    legacyClass('BB', 'Binnadzor B', 'Binnadzor B', ['S-002', 'S-003'], 'U-2'),
    legacyClass('TH', 'Tahfidz', 'Tahfidz', ['S-004'], 'U-3'),
  ]);

  const binnadzor = result.filter(isBinnadzorClass);
  assert.equal(binnadzor.length, 1);
  assert.equal(binnadzor[0].namaKelas, 'Binnadzor');
  assert.equal(binnadzor[0].tipeKelas, 'Binnadzor');
  assert.deepEqual(new Set(binnadzor[0].santriIds), new Set(['S-001', 'S-002', 'S-003']));
  assert.deepEqual(new Set(binnadzor[0].musyrifIds), new Set(['U-1', 'U-2']));
  assert.equal(result.some(kelas => kelas.id === 'TH'), true);
});

test('existing canonical Binnadzor id is preserved while legacy variants are absorbed', () => {
  const result = consolidateBinnadzorClasses([
    legacyClass('BA', 'Binnadzor A', 'Binnadzor A', ['S-001'], 'U-1'),
    legacyClass('BIN', 'Binnadzor', 'Binnadzor', ['S-002'], 'U-2'),
  ]);
  const binnadzor = result.find(isBinnadzorClass);
  assert.equal(binnadzor?.id, 'BIN');
  assert.deepEqual(new Set(binnadzor?.santriIds), new Set(['S-001', 'S-002']));
});

test('active class type and SantriManagement expose Binnadzor only', () => {
  const types = readFileSync(new URL('../src/types/index.ts', import.meta.url), 'utf8');
  const santriManagement = readFileSync(
    new URL('../src/components/SantriManagement.tsx', import.meta.url),
    'utf8',
  );

  assert.match(types, /\| 'Binnadzor'/);
  assert.doesNotMatch(types, /\| 'Binnadzor A'/);
  assert.doesNotMatch(types, /\| 'Binnadzor B'/);
  assert.match(santriManagement, /<option value="Binnadzor">Binnadzor<\/option>/);
  assert.doesNotMatch(santriManagement, /<option value="Binnadzor A">/);
  assert.doesNotMatch(santriManagement, /<option value="Binnadzor B">/);
});

test('master-data reads and realtime cache collapse legacy Binnadzor variants', () => {
  const storage = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
  const realtime = readFileSync(new URL('../src/services/realtimeService.ts', import.meta.url), 'utf8');

  assert.match(storage, /return consolidateBinnadzorClasses\(normalized\)/);
  assert.match(storage, /const consolidatedKelas = consolidateBinnadzorClasses/);
  assert.match(realtime, /const consolidated = consolidateBinnadzorClasses/);
});

test('Superadmin migration rewrites class, santri, and legacy user class references atomically', () => {
  const storage = readFileSync(new URL('../src/services/storageService.ts', import.meta.url), 'utf8');
  const start = storage.indexOf('async consolidateLegacyBinnadzorClasses');
  const end = storage.indexOf('getAppConfig(): AppConfig', start);
  assert.ok(start >= 0 && end > start);
  const block = storage.slice(start, end);

  assert.match(block, /this\.assertCanManageAccounts\(\)/);
  assert.match(block, /const candidates = rawKelas\.filter\(isBinnadzorClass\)/);
  assert.match(block, /normalizeKelas\(santri\.kelas\) === 'Binnadzor'/);
  assert.match(block, /batch\.set\(doc\(db, COLLECTIONS\.KELAS, canonicalId\)/);
  assert.match(block, /batch\.delete\(doc\(db, COLLECTIONS\.KELAS, id\)\)/);
  assert.match(block, /\{ kelas: 'Binnadzor' \}/);
  assert.match(block, /\{ kelasId: canonicalId \}/);
  assert.match(block, /await batch\.commit\(\)/);
});

test('production Superadmin login triggers the one-time cloud consolidation', () => {
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(app, /normalizedRole !== 'superadmin'/);
  assert.match(app, /window\.location\.hostname/);
  assert.match(app, /hostname === 'tahfidzpesmad\.my\.id'/);
  assert.match(app, /hostname === 'www\.tahfidzpesmad\.my\.id'/);
  assert.match(app, /if \(!isProductionHost\) return undefined/);
  assert.match(app, /storageService\.consolidateLegacyBinnadzorClasses\(\)/);
  assert.match(app, /Kelas Binnadzor berhasil disatukan/);
});
