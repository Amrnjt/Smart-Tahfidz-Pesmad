// TDD RED: this guard must fail until auth + role integration is complete.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const main = readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
const cloudGate = readFileSync(new URL('../src/services/cloudCommitGate.ts', import.meta.url), 'utf8');

function requireText(source, needle, message) {
  assert.ok(source.includes(needle), message);
}

requireText(main, "import SecureApp from './SecureApp", 'main.tsx must boot through SecureApp');
requireText(main, 'installCloudCommitGate', 'main.tsx must install the Cloud commit gate');
requireText(main, 'installSecureAccountBridge', 'main.tsx must install the secure account bridge explicitly');
requireText(main, 'installRoleScopedSync', 'main.tsx must install role-scoped sync');
requireText(main, '<SecureApp />', 'main.tsx must render SecureApp rather than App directly');

const cloudIndex = main.indexOf('installCloudCommitGate();');
const secureIndex = main.indexOf('installSecureAccountBridge();');
const roleIndex = main.indexOf('installRoleScopedSync();');
const renderIndex = main.indexOf('createRoot(');

assert.ok(cloudIndex >= 0 && secureIndex >= 0 && roleIndex >= 0 && renderIndex >= 0,
  'all security bootstrap calls must be explicit');
assert.ok(cloudIndex < secureIndex,
  'installCloudCommitGate() must run before installSecureAccountBridge() so secure account methods win');
assert.ok(secureIndex < roleIndex,
  'installSecureAccountBridge() must run before role-scoped sync');
assert.ok(roleIndex < renderIndex,
  'all security installers must complete before React renders');

for (const forbidden of [
  'storageService.addUser =',
  'storageService.updateUser =',
  'storageService.addSantri ='
]) {
  assert.ok(!cloudGate.includes(forbidden),
    `cloudCommitGate must not own account lifecycle anymore: found ${forbidden}`);
}

const secureApp = readFileSync(new URL('../src/SecureApp.tsx', import.meta.url), 'utf8');
assert.ok(!/^\s*installSecureAccountBridge\(\);\s*$/m.test(secureApp),
  'SecureApp.tsx must not install the account bridge as an import side effect');

console.log('Security bootstrap integration guard passed.');
