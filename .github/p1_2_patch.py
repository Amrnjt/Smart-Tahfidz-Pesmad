from pathlib import Path

path = Path('src/components/HistoryTable.tsx')
text = path.read_text(encoding='utf-8')
original = text


def replace_once(old: str, new: str, label: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'{label}: expected 1 match, found {count}')
    text = text.replace(old, new, 1)


replace_once(
    "  const [deleteToast, setDeleteToast] = useState<string | null>(null);\n",
    "  const [deleteToast, setDeleteToast] = useState<string | null>(null);\n  const [showMobileFilters, setShowMobileFilters] = useState(false);\n",
    'mobile filter state'
)

old_reset = """  const resetAllFilters = () => {
    setSearchQuery('');
    setKategoriFilter('ALL');
    setNilaiFilter('ALL');
    setDateFilterMode('bulan');
    setCustomStartDate('');
    setCustomEndDate('');
    setActiveDatePreset('');
    const currentKey = getTodayInputFormat().slice(0, 7);
    if (monthKeys.includes(currentKey)) {
      setActiveMonthKey(currentKey);
    } else if (monthKeys.length > 0) {
      setActiveMonthKey(monthKeys[0]);
    }
  };
"""
new_reset = """  const secondaryFilterCount = useMemo(() => {
    let count = 0;
    if (kategoriFilter !== 'ALL') count += 1;
    if (nilaiFilter !== 'ALL') count += 1;
    if (dateFilterMode !== 'bulan') count += 1;
    return count;
  }, [kategoriFilter, nilaiFilter, dateFilterMode]);

  const resetSecondaryFilters = () => {
    setKategoriFilter('ALL');
    setNilaiFilter('ALL');
    setDateFilterMode('bulan');
    setCustomStartDate('');
    setCustomEndDate('');
    setActiveDatePreset('');
    const currentKey = getTodayInputFormat().slice(0, 7);
    if (monthKeys.includes(currentKey)) {
      setActiveMonthKey(currentKey);
    } else if (monthKeys.length > 0) {
      setActiveMonthKey(monthKeys[0]);
    }
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    resetSecondaryFilters();
  };
"""
replace_once(old_reset, new_reset, 'filter reset helpers')

start_marker = "      {/* Header & Filter Controls */}"
end_marker = "      {/* Date Filter Toolbar & Mode Switcher */}"
start = text.find(start_marker)
end = text.find(end_marker, start)
if start < 0 or end < 0:
    raise RuntimeError('history toolbar markers not found')

new_header = '''      {/* Header & Filter Controls */}
      <div className="pb-2 border-b border-slate-100 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2 min-w-0">
              <span className="truncate">Riwayat Setoran Hafalan</span>
              {isViewOnly && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">View-Only</span>
              )}
            </h3>
          </div>

          {/* Export is intentionally secondary on mobile */}
          <div className="sm:hidden flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setShowReportModal(true)}
              className="h-8 px-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              aria-label="Unduh laporan PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={exportToCSV}
              className="h-8 px-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white text-[10px] font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              aria-label="Unduh riwayat CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Mobile: search is primary, secondary filters collapse behind one control */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari santri, surah, catatan..."
                className="w-full h-8 pl-8 pr-8 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Cari riwayat setoran"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 w-5 h-5 inline-flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowMobileFilters(prev => !prev)}
              className={`h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer flex-shrink-0 ${
                showMobileFilters || secondaryFilterCount > 0
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              aria-expanded={showMobileFilters}
              aria-controls="history-mobile-filter-panel"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
              {secondaryFilterCount > 0 && (
                <span className="min-w-4 h-4 px-1 inline-flex items-center justify-center rounded-full bg-emerald-800 text-white text-[9px] font-bold">
                  {secondaryFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 px-0.5 text-[10px] leading-4 text-slate-500">
            <span className="truncate">
              <b className="font-semibold text-slate-700">{activePeriodLabel}</b> · {displayedItems.length} setoran
            </span>
            {secondaryFilterCount > 0 && (
              <span className="font-semibold text-emerald-700 flex-shrink-0">
                {secondaryFilterCount} filter aktif
              </span>
            )}
          </div>

          {showMobileFilters && (
            <div
              id="history-mobile-filter-panel"
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-900">Filter riwayat</p>
                  <p className="text-[10px] text-slate-500">Perubahan diterapkan langsung.</p>
                </div>
                {secondaryFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetSecondaryFilters}
                    className="h-7 px-2 inline-flex items-center gap-1 rounded-md text-[10px] font-semibold text-slate-600 hover:bg-white hover:text-rose-700 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="block">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Kategori</span>
                  <select
                    value={kategoriFilter}
                    onChange={(e) => setKategoriFilter(e.target.value as KategoriFilter)}
                    className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Semua Kategori</option>
                    <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
                    <option value="Murojaah">Muroja'ah (Pengulangan)</option>
                    <option value="Binnadzor">Binnadzor (Tilawah)</option>
                    <option value="Jilid">Jilid Ummi Dewasa</option>
                    <option value="Istimewa">Kelas Istimewa</option>
                  </select>
                </label>

                <label className="block">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">Nilai</span>
                  <select
                    value={nilaiFilter}
                    onChange={(e) => setNilaiFilter(e.target.value)}
                    className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">Semua Nilai</option>
                    {PREDIKAT_NILAI_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="space-y-2">
                <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">Periode</span>
                <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-200/70 p-0.5">
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('bulan')}
                    className={`h-8 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      dateFilterMode === 'bulan' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Bulan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDateFilterMode('range');
                      if (!customStartDate && !customEndDate) applyDatePreset('bulan_ini');
                    }}
                    className={`h-8 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      dateFilterMode === 'range' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Rentang
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilterMode('all')}
                    className={`h-8 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      dateFilterMode === 'all' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Semua
                  </button>
                </div>

                {dateFilterMode === 'bulan' && (
                  <div className="overflow-x-auto -mx-0.5 px-0.5" style={{ scrollbarWidth: 'thin' }}>
                    <div className="flex items-center gap-1.5 min-w-min pb-0.5">
                      {monthKeys.length === 0 ? (
                        <span className="text-[10px] text-slate-400">Belum ada data setoran</span>
                      ) : (
                        monthKeys.map(mk => (
                          <button
                            key={mk}
                            type="button"
                            onClick={() => setActiveMonthKey(mk)}
                            className={`h-8 px-2.5 rounded-lg text-[10px] font-semibold whitespace-nowrap border transition cursor-pointer ${
                              activeMonthKey === mk
                                ? 'bg-emerald-800 text-white border-emerald-800'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {getMonthLabel(mk)} · {monthCounts[mk] || 0}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {dateFilterMode === 'range' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      <label className="block">
                        <span className="block text-[10px] font-semibold text-slate-500 mb-1">Dari tanggal</span>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => {
                            setCustomStartDate(e.target.value);
                            setActiveDatePreset('custom');
                          }}
                          className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] font-semibold text-slate-500 mb-1">Sampai tanggal</span>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => {
                            setCustomEndDate(e.target.value);
                            setActiveDatePreset('custom');
                          }}
                          className="w-full h-9 px-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        ['hari_ini', 'Hari Ini'],
                        ['7_hari', '7 Hari'],
                        ['30_hari', '30 Hari'],
                        ['bulan_ini', 'Bulan Ini']
                      ].map(([preset, label]) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => applyDatePreset(preset as 'hari_ini' | '7_hari' | '30_hari' | 'bulan_ini')}
                          className={`h-8 rounded-lg border text-[10px] font-semibold transition cursor-pointer ${
                            activeDatePreset === preset
                              ? 'bg-emerald-800 text-white border-emerald-800'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {dateFilterMode === 'all' && (
                  <p className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[10px] leading-4 text-slate-600">
                    Menampilkan seluruh arsip tanpa pembatasan tanggal.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="w-full h-8 rounded-lg bg-white border border-slate-300 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup Filter
              </button>
            </div>
          )}
        </div>

        {/* Desktop/tablet controls remain directly available */}
        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Unduh Laporan PDF</span>
            </button>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
            <div className="relative w-56 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari santri, surah, catatan..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value as KategoriFilter)}
              className="py-1 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[130px]"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Ziyadah">Ziyadah (Hafalan Baru)</option>
              <option value="Murojaah">Muroja'ah (Pengulangan)</option>
              <option value="Binnadzor">Binnadzor (Tilawah)</option>
              <option value="Jilid">Jilid Ummi Dewasa</option>
              <option value="Istimewa">Kelas Istimewa</option>
            </select>
            <select
              value={nilaiFilter}
              onChange={(e) => setNilaiFilter(e.target.value)}
              className="py-1 px-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[120px]"
            >
              <option value="ALL">Semua Nilai</option>
              {PREDIKAT_NILAI_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.emoji} {opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

'''
text = text[:start] + new_header + text[end:]

replace_once(
    '      <div className="flex-shrink-0 pt-2 pb-1.5 space-y-1.5 border-b border-slate-100">\n',
    '      <div className="hidden sm:block flex-shrink-0 pt-2 pb-1.5 space-y-1.5 border-b border-slate-100">\n',
    'desktop date toolbar visibility'
)

replace_once(
    '      <div className="flex-shrink-0 pt-1.5 pb-1.5 overflow-x-auto" style={{ scrollbarWidth: \'thin\' }}>\n',
    '      <div className="hidden sm:block flex-shrink-0 pt-1.5 pb-1.5 overflow-x-auto" style={{ scrollbarWidth: \'thin\' }}>\n',
    'desktop category chips visibility'
)

active_start_marker = "      {/* Active Filter Indicators & Reset Bar */}"
active_end_marker = "      {/* Batch Selection Action Bar */}"
active_start = text.find(active_start_marker)
active_end = text.find(active_end_marker, active_start)
if active_start < 0 or active_end < 0:
    raise RuntimeError('active filter bar markers not found')

new_active_bar = '''      {/* Desktop filter summary — avoid repeating each state as another chip row */}
      {isFilterActive && (
        <div className="hidden sm:flex items-center justify-between gap-2 px-2.5 py-1.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs text-emerald-950 mb-2 flex-shrink-0">
          <span className="font-semibold flex items-center gap-1.5 min-w-0">
            <SlidersHorizontal className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {secondaryFilterCount > 0
                ? `${secondaryFilterCount} filter aktif${searchQuery.trim() ? ' + pencarian' : ''}`
                : 'Pencarian aktif'}
            </span>
          </span>
          <button
            onClick={resetAllFilters}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-white hover:bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 transition cursor-pointer flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filter</span>
          </button>
        </div>
      )}

'''
text = text[:active_start] + new_active_bar + text[active_end:]

if text == original:
    raise RuntimeError('P1.2 patch produced no changes')

path.write_text(text, encoding='utf-8')
print('P1.2 HistoryTable filter architecture patch applied')
