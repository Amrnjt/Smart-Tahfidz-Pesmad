import fs from 'node:fs';

const patches = [
  {
    path: 'src/components/SantriManagement.tsx',
    before: 'return (\n    <div className="space-y-6">',
    after: 'return (\n    <div className="p3-management-page p3-santri-management space-y-6">'
  },
  {
    path: 'src/components/KelasManagement.tsx',
    before: 'return (\n    <div className="space-y-6">',
    after: 'return (\n    <div className="p3-management-page p3-kelas-management space-y-6">'
  },
  {
    path: 'src/components/MushafQuran.tsx',
    before: "className={`space-y-4 ${playbackMode !== 'idle' ?",
    after: "className={`p3-mushaf-page space-y-4 ${playbackMode !== 'idle' ?"
  }
];

for (const patch of patches) {
  let source = fs.readFileSync(patch.path, 'utf8');
  const index = source.indexOf(patch.before);
  if (index < 0) throw new Error(`Marker target not found in ${patch.path}`);
  if (source.indexOf(patch.before, index + patch.before.length) >= 0) {
    throw new Error(`Marker target is ambiguous in ${patch.path}`);
  }
  source = source.replace(patch.before, patch.after);
  fs.writeFileSync(patch.path, source);
  console.log(`P3.0 marker applied: ${patch.path}`);
}
