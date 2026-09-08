import fs from 'node:fs';

const path = 'src/components/HistoryTable.tsx';
let source = fs.readFileSync(path, 'utf8');

const displayMarker = `  }, [combinedItems, dateFilterMode, activeMonthKey, customStartDate, customEndDate, kategoriFilter, searchQuery, nilaiFilter]);\n\n  // Active period text for footer and export`;
const displayReplacement = `  }, [combinedItems, dateFilterMode, activeMonthKey, customStartDate, customEndDate, kategoriFilter, searchQuery, nilaiFilter]);\n\n  // Batch selections must never outlive the currently visible result set.\n  // This prevents a filtered-out record from remaining silently selected.\n  useEffect(() => {\n    const visibleIds = new Set(displayedItems.map(item => item.id));\n    setSelectedIds(prev => {\n      const next = new Set(Array.from(prev).filter(id => visibleIds.has(id)));\n      return next.size === prev.size ? prev : next;\n    });\n  }, [displayedItems]);\n\n  const visibleSelectedCount = useMemo(\n    () => displayedItems.reduce((count, item) => count + (selectedIds.has(item.id) ? 1 : 0), 0),\n    [displayedItems, selectedIds]\n  );\n\n  // Active period text for footer and export`;

if (!source.includes(displayMarker)) throw new Error('displayedItems marker not found');
source = source.replace(displayMarker, displayReplacement);

const batchMarker = `      const itemsToDel = combinedItems.filter(i => selectedIds.has(i.id)).map(i => ({ type: i.type, id: i.id }));`;
const batchReplacement = `      const itemsToDel = displayedItems.filter(i => selectedIds.has(i.id)).map(i => ({ type: i.type, id: i.id }));`;
if (!source.includes(batchMarker)) throw new Error('batch delete marker not found');
source = source.replace(batchMarker, batchReplacement);

const sizeOccurrences = source.match(/selectedIds\.size/g)?.length ?? 0;
if (sizeOccurrences < 8) throw new Error(`unexpected selectedIds.size occurrence count: ${sizeOccurrences}`);
source = source.replaceAll('selectedIds.size', 'visibleSelectedCount');

fs.writeFileSync(path, source);
console.log(`P1.4 patched ${path}; replaced ${sizeOccurrences} selection-count references.`);
