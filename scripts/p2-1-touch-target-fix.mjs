import fs from 'node:fs';
const path = 'src/app-shell.css';
let source = fs.readFileSync(path, 'utf8');
const before = '  min-height: 42px !important;';
const after = '  min-height: 44px !important;';
if (!source.includes(before)) throw new Error('desktop nav touch target marker not found');
source = source.replace(before, after);
fs.writeFileSync(path, source);
console.log('P2.1 desktop navigation touch target normalized to 44px.');
