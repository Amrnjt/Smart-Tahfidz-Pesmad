import fs from 'node:fs';

const cssPath = 'src/release-polish.css';
let css = fs.readFileSync(cssPath, 'utf8');
css = css.replace(/(\.p3-chrome-stack \{[\s\S]*?z-index:) 70;/, '$1 60;');
css = css.replace(/(@media \(max-width: 767px\) \{\s*\.p3-chrome-stack \{\s*z-index:) 70;/, '$1 60;');

const pageContentBlock = `.p3-page-content {\n  min-height: min(62vh, 48rem);\n}\n`;
const rootTransitionBlock = `\n/* Prevent the browser's default whole-document crossfade.\n * Page content and active navigation already have explicit named transitions. */\n::view-transition-old(root),\n::view-transition-new(root) {\n  animation: none;\n  mix-blend-mode: normal;\n}\n`;
if (!css.includes('::view-transition-old(root)')) {
  if (!css.includes(pageContentBlock)) throw new Error('P3 page content block not found');
  css = css.replace(pageContentBlock, pageContentBlock + rootTransitionBlock);
}
fs.writeFileSync(cssPath, css);

for (const path of [
  'src/components/ZiyadahForm.tsx',
  'src/components/MurojaahForm.tsx',
  'src/components/SantriManagement.tsx'
]) {
  let source = fs.readFileSync(path, 'utf8');
  source = source.replaceAll('Belum Ada Data Santri', 'Belum ada santri');
  fs.writeFileSync(path, source);
}

console.log('P3.1 finalizer applied');
