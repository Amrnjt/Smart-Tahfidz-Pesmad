import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const removedPaths = [
  'src/components/SetorActionSheet.tsx',
  'src/components/TrenHafalanBulananChart.tsx',
  'src/components/ZiyadahProgressChart.tsx',
  'src/components/dashboard/DashboardSkeleton.tsx',
  'src/data/sampleDatabase.ts',
  'src/design-system/motion.ts',
  'src/assets/images/masjid_nabawi.jpg',
  'src/assets/images/masjid_nabawi_hero_1789226759124.jpg',
  'src/assets/images/pesmad_logo_1787990840204.jpg',
  'public/masjid_nabawi.jpg',
];

const removedDirectDependencies = [
  '@google/genai',
  '@types/express',
  'dotenv',
  'express',
  'html2canvas',
];

test('P0 removes the audited orphan files and duplicate assets', () => {
  for (const path of removedPaths) {
    assert.equal(existsSync(path), false, `${path} must be removed`);
  }
});

test('P0 removes audited unused direct dependencies', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const directDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const dependency of removedDirectDependencies) {
    assert.equal(
      Object.hasOwn(directDependencies, dependency),
      false,
      `${dependency} must not remain a direct dependency`,
    );
  }
});

test('CI workflows no longer reference removed legacy files', () => {
  const workflows = [
    '.github/workflows/p2-design-foundation.yml',
    '.github/workflows/p3-release-polish.yml',
  ].map(path => readFileSync(path, 'utf8')).join('\n');

  for (const path of removedPaths.filter(path => path.endsWith('.tsx'))) {
    assert.doesNotMatch(workflows, new RegExp(path.replaceAll('/', '\\/')));
  }
});
