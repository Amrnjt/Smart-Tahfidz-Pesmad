import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('src/services/storageService.ts', 'utf8');

test('Pimpinan role survives authentication and session normalization', () => {
  assert.match(source, /import \{ normalizeUserRole \} from '\.\.\/utils\/roles';/);
  assert.match(source, /const normalizedRole = normalizeUserRole\(matched\.role\);/);
  assert.match(source, /matched\.role = normalizedRole;/);
  assert.match(source, /const normalizedRole = normalizeUserRole\(user\.role\);/);
  assert.match(source, /if \(!normalizedRole\) return null;/);
});

test('Pimpinan cloud mutations are blocked at the service layer', () => {
  assert.match(source, /function assertCloudMutationAllowed\(session: User \| null\): void/);
  assert.match(source, /normalizeUserRole\(session\?\.role\) === 'Pimpinan'/);

  const methods = [
    'saveZiyadah', 'saveMurojaah', 'saveBinnadzor', 'savePembelajaran',
    'deleteRecord', 'deleteRecordsBatch', 'restoreTrashRecord',
    'permanentlyDeleteTrashRecord', 'emptyTrash', 'updateRecord',
    'setProgramLiburanActive', 'savePantauanLiburan', 'deletePantauanLiburan',
    'addSantri', 'updateSantri', 'deleteSantri',
    'addUser', 'updateUser', 'deleteUser',
    'addKelas', 'updateKelas', 'deleteKelas'
  ];

  for (const method of methods) {
    const start = source.indexOf(`async ${method}`);
    assert.notEqual(start, -1, `method ${method} should exist`);
    const snippet = source.slice(start, start + 520);
    assert.match(
      snippet,
      /assertCloudMutationAllowed\(this\.getSession\(\)\);/,
      `${method} must enforce the Pimpinan read-only guard`,
    );
  }
});

test('Pimpinan accounts are never linked to a santri id by user persistence', () => {
  assert.match(source, /\['Ustadz', 'Superadmin', 'Pimpinan'\]\.includes\(user\.role\)/);
  assert.match(source, /\['Ustadz', 'Superadmin', 'Pimpinan'\]\.includes\(cleanUpdate\.role\)/);
});
