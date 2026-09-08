import fs from 'node:fs';

const path = 'src/components/HistoryTable.tsx';
let source = fs.readFileSync(path, 'utf8');

const replacements = [
  [
    '<div className="bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200/90  flex flex-col lg:max-h-[calc(100dvh-140px)]">',
    '<div className="p2-history bg-white rounded-xl p-2.5 sm:p-4 border border-slate-200/90 flex flex-col lg:max-h-[calc(100dvh-140px)]">'
  ],
  [
    '<div className="pb-2 border-b border-slate-100 flex-shrink-0 space-y-2">',
    '<div className="p2-history-toolbar pb-2 border-b border-slate-100 flex-shrink-0 space-y-2">'
  ],
  [
    '<div className="flex-1 lg:overflow-y-auto min-h-0 rounded-2xl border border-slate-200 bg-white overflow-hidden">',
    '<div className="p2-history-results flex-1 lg:overflow-y-auto min-h-0 rounded-2xl border border-slate-200 bg-white overflow-hidden">'
  ],
  [
    '<div key={item.id} className={`transition-colors ${isSelected ? \'bg-emerald-50/40\' : \'bg-white hover:bg-slate-50/70\'}`}>',
    '<div key={item.id} data-selected={isSelected ? \'true\' : \'false\'} className={`p2-history-record transition-colors ${isSelected ? \'bg-emerald-50/40\' : \'bg-white hover:bg-slate-50/70\'}`}>'
  ],
  [
    '<div className="lg:hidden px-4 py-3.5">',
    '<div className="p2-history-mobile-row lg:hidden px-4 py-3.5">'
  ],
  [
    '<div id={`history-mobile-detail-${item.id}`} className="mt-3 ml-6 rounded-r-xl border-l-2 border-slate-200 bg-slate-50/70 pl-3 pr-3 py-3">',
    '<div id={`history-mobile-detail-${item.id}`} className="p2-history-mobile-detail mt-3 ml-6 rounded-r-xl border-l-2 border-slate-200 bg-slate-50/70 pl-3 pr-3 py-3">'
  ],
  [
    'className="hidden lg:flex items-center gap-2.5 px-4 py-3 cursor-pointer"',
    'className="p2-history-desktop-row hidden lg:flex items-center gap-2.5 px-4 py-3 cursor-pointer"'
  ],
  [
    '<div id={`history-desktop-detail-${item.id}`} className="hidden lg:block px-2.5 sm:px-4 pb-3 pt-2 bg-slate-50/70 border-t border-slate-200/80 rounded-b-lg space-y-2 text-xs">',
    '<div id={`history-desktop-detail-${item.id}`} className="p2-history-desktop-detail hidden lg:block px-2.5 sm:px-4 pb-3 pt-2 bg-slate-50/70 border-t border-slate-200/80 rounded-b-lg space-y-2 text-xs">'
  ],
  [
    '<div className="lg:hidden flex flex-col items-center justify-center py-10 px-5 text-center">',
    '<div className="p2-history-empty lg:hidden flex flex-col items-center justify-center py-10 px-5 text-center">'
  ],
  [
    '<div className="hidden lg:flex flex-col items-center justify-center py-8 px-4 text-center text-slate-400">',
    '<div className="p2-history-empty hidden lg:flex flex-col items-center justify-center py-8 px-4 text-center text-slate-400">'
  ]
];

for (const [before, after] of replacements) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`Expected exactly one match for marker: ${before.slice(0, 80)}... found ${count}`);
  }
  source = source.replace(before, after);
}

fs.writeFileSync(path, source);
console.log('P2.4 history semantic markers applied.');
