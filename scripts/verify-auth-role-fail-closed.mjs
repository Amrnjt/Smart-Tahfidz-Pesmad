import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = [
  'api/auth/login.ts',
  'api/auth/migrate-credentials.ts',
  'api/auth/admin-users.ts'
];

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

for (const relative of targets) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const functionMatch = source.match(/function\s+normalizeRole\s*\([^)]*\)[^{]*\{([\s\S]*?)\n\}/);

  if (!functionMatch) {
    fail(`${relative} must expose an auditable normalizeRole implementation.`);
    continue;
  }

  const body = functionMatch[1];
  if (/return\s+['"]Ustadz['"]\s*;\s*$/.test(body.trim())) {
    fail(`${relative} defaults an unknown role to Ustadz (fail-open privilege escalation).`);
  }

  const hasFailClosedNull = /return\s+null\s*;/.test(body) || /:\s*null\s*;/.test(body);
  if (!hasFailClosedNull) {
    fail(`${relative} must resolve an unknown role to null.`);
  }
}

if (!process.exitCode) {
  console.log('PASS: auth role normalization fails closed for unknown roles.');
}
