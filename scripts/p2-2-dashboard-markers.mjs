import fs from 'node:fs';

const patches = [
  {
    path: 'src/components/UstadzDashboard.tsx',
    before: '<div className="w-full min-w-0 max-w-full space-y-6">',
    after: '<div className="p2-dashboard p2-dashboard-ustadz w-full min-w-0 max-w-full space-y-6">',
  },
  {
    path: 'src/components/WaliDashboard.tsx',
    before: '<div className="w-full min-w-0 space-y-6">',
    after: '<div className="p2-dashboard p2-dashboard-wali w-full min-w-0 space-y-6">',
  },
  {
    path: 'src/components/SantriDashboard.tsx',
    before: '<div className="w-full min-w-0 space-y-6">',
    after: '<div className="p2-dashboard p2-dashboard-santri w-full min-w-0 space-y-6">',
  },
];

for (const patch of patches) {
  let source = fs.readFileSync(patch.path, 'utf8');
  const matches = source.split(patch.before).length - 1;
  if (matches !== 1) {
    throw new Error(`${patch.path}: expected exactly one dashboard root marker, found ${matches}`);
  }
  source = source.replace(patch.before, patch.after);
  fs.writeFileSync(patch.path, source);
  console.log(`P2.2 marker applied to ${patch.path}`);
}
