from pathlib import Path
import re


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, text: str) -> None:
    Path(path).write_text(text)


def replace(path: str, old: str, new: str, count: int | None = None) -> None:
    text = read(path)
    if old not in text:
        raise SystemExit(f'Pattern not found in {path}: {old[:180]!r}')
    text = text.replace(old, new) if count is None else text.replace(old, new, count)
    write(path, text)


def replace_regex(path: str, pattern: str, repl: str, min_count: int = 1, flags: int = 0) -> None:
    text = read(path)
    updated, count = re.subn(pattern, repl, text, flags=flags)
    if count < min_count:
        raise SystemExit(f'Regex matched {count}, expected >= {min_count} in {path}: {pattern[:160]}')
    write(path, updated)


# -----------------------------------------------------------------------------
# App: provide a keyboard skip link and a stable main landmark target.
# -----------------------------------------------------------------------------
path = 'src/App.tsx'
replace(
    path,
    '      {/* Top Navbar */}\n      <Navbar',
    '      <a\n        href="#main-content"\n        className="fixed left-3 top-3 z-[90] -translate-y-24 rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-950 shadow-lg transition-transform focus:translate-y-0"\n      >\n        Lewati ke konten utama\n      </a>\n\n      {/* Top Navbar */}\n      <Navbar',
    1,
)
replace(
    path,
    '      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 pb-24 sm:pb-8 flex-1 space-y-5 relative z-10 min-w-0">',
    '      <main id="main-content" tabIndex={-1} className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 pb-24 sm:pb-8 flex-1 space-y-5 relative z-10 min-w-0">',
    1,
)

# -----------------------------------------------------------------------------
# Navbar: native anchor for brand navigation and keyboard-safe profile popover.
# -----------------------------------------------------------------------------
path = 'src/components/Navbar.tsx'
replace(path, 'const brandRipple = useRipple<HTMLDivElement>();', 'const brandRipple = useRipple<HTMLAnchorElement>();', 1)
replace(
    path,
    '  const profileMenuRef = useRef<HTMLDivElement>(null);',
    '  const profileMenuRef = useRef<HTMLDivElement>(null);\n  const profileTriggerRef = useRef<HTMLButtonElement>(null);',
    1,
)
replace(
    path,
    "  }, [showProfileMenu]);\n\n  // Compute initials from user name",
    "  }, [showProfileMenu]);\n\n  useEffect(() => {\n    if (!showProfileMenu) return;\n\n    const handleEscape = (event: KeyboardEvent) => {\n      if (event.key !== 'Escape') return;\n      event.preventDefault();\n      setShowProfileMenu(false);\n      window.requestAnimationFrame(() => profileTriggerRef.current?.focus());\n    };\n\n    document.addEventListener('keydown', handleEscape);\n    return () => document.removeEventListener('keydown', handleEscape);\n  }, [showProfileMenu]);\n\n  // Compute initials from user name",
    1,
)
replace(
    path,
    '''        <div
          ref={brandRipple.elementRef}
          id="brand-logo-link"
          className="ripple-container flex min-h-11 items-center gap-3 cursor-pointer flex-1 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
          onClick={(e) => { brandRipple.createRipple(e); if (currentUser) setActiveTab('dashboard'); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { brandRipple.createRipple(e); if (currentUser) setActiveTab('dashboard'); } }}
          role="button"
          tabIndex={0}
          aria-label="Beranda Tahfidz Pesantren Madrasah Darul Fikri"
        >''',
    '''        <a
          ref={brandRipple.elementRef}
          id="brand-logo-link"
          href="#main-content"
          className="ripple-container flex min-h-11 items-center gap-3 cursor-pointer flex-1 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-950"
          onClick={(e) => {
            brandRipple.createRipple(e);
            if (currentUser) setActiveTab('dashboard');
          }}
          aria-current={currentUser && activeTab === 'dashboard' ? 'page' : undefined}
          aria-label="Beranda Tahfidz Pesantren Madrasah Darul Fikri"
        >''',
    1,
)
replace(
    path,
    '        </div>\n\n        {/* Right Section: Sync + User Profile Dropdown */}',
    '        </a>\n\n        {/* Right Section: Sync + User Profile Dropdown */}',
    1,
)
replace(
    path,
    '                  ref={syncRipple.elementRef}\n                  onClick=',
    '                  type="button"\n                  ref={syncRipple.elementRef}\n                  onClick=',
    1,
)
replace(
    path,
    '                  aria-label="Sinkronkan Data"',
    '                  aria-label={isRefreshing ? \'Sedang menyinkronkan data\' : \'Sinkronkan data\'}\n                  aria-busy={isRefreshing}',
    1,
)
replace(
    path,
    '                <button\n                  onClick={() => setShowProfileMenu(prev => !prev)}',
    '                <button\n                  type="button"\n                  ref={profileTriggerRef}\n                  onClick={() => setShowProfileMenu(prev => !prev)}',
    1,
)
replace(
    path,
    '                  aria-expanded={showProfileMenu}\n                  aria-label="Menu Pengguna"',
    '                  aria-expanded={showProfileMenu}\n                  aria-controls="profile-menu-popover"\n                  aria-haspopup="true"\n                  aria-label="Menu Pengguna"',
    1,
)
replace(
    path,
    '                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 text-slate-800 py-2 z-50">',
    '                  <div id="profile-menu-popover" role="region" aria-label="Opsi akun pengguna" className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 text-slate-800 py-2 z-50">',
    1,
)
# Button defaults inside the popover / direct logout.
replace_regex(path, r'(?m)^(\s{22})<button\n(\s{24})onClick=', r'\1<button\n\2type="button"\n\2onClick=', min_count=3)
replace(
    path,
    '              <button\n                onClick={onLogout}',
    '              <button\n                type="button"\n                onClick={onLogout}',
    1,
)

# -----------------------------------------------------------------------------
# Bottom navigation: label every nav and expose the central FAB as dialog trigger.
# -----------------------------------------------------------------------------
path = 'src/components/BottomNav.tsx'
replace(
    path,
    '      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1.5 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">',
    '      <nav aria-label="Navigasi bawah" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-1.5 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">',
    1,
)
replace_regex(path, r'(\s+)<button\n(\s+)key=\{item\.id\}', r'\1<button\n\2type="button"\n\2key={item.id}', min_count=1)
replace(
    path,
    '            <button\n              ref={fabRipple.elementRef}',
    '            <button\n              type="button"\n              ref={fabRipple.elementRef}',
    1,
)
replace(
    path,
    '              aria-label="Tambah Setoran Baru"\n              title="Tambah Setoran Baru"',
    '              aria-label="Tambah Setoran Baru"\n              aria-haspopup="dialog"\n              aria-expanded={isActionSheetOpen}\n              title="Tambah Setoran Baru"',
    1,
)
replace(
    path,
    '    <button\n      ref={ripple.elementRef}',
    '    <button\n      type="button"\n      ref={ripple.elementRef}',
    1,
)

# -----------------------------------------------------------------------------
# Setor action sheet: truthful switch naming, nested dialog semantics, touch targets.
# -----------------------------------------------------------------------------
path = 'src/components/SetorActionSheet.tsx'
replace(path, 'className="text-[11px] text-slate-500 leading-4"', 'className="text-xs text-slate-500 leading-4"', 1)
replace(
    path,
    '            onClick={onClose}\n            className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg',
    '            type="button"\n            onClick={onClose}\n            className="min-h-11 min-w-11 -mr-1 flex items-center justify-center rounded-lg',
    1,
)
replace(
    path,
    '              onClick={() => setShowMonitorModal(true)}\n              className=',
    '              onClick={() => setShowMonitorModal(true)}\n              aria-haspopup="dialog"\n              aria-expanded={showMonitorModal}\n              className=',
    1,
)
replace(
    path,
    '              aria-label="Aktifkan Program Pantauan Liburan"',
    '              aria-label={isProgramLiburanActive ? \'Nonaktifkan Program Pantauan Liburan\' : \'Aktifkan Program Pantauan Liburan\'}',
    1,
)
replace_regex(path, r'(\s+)<button\n(\s+)key=\{act\.tab\}', r'\1<button\n\2type="button"\n\2key={act.tab}', min_count=1)
replace(path, 'className="text-[13px] font-bold text-slate-900 truncate"', 'className="text-sm font-bold text-slate-900 truncate"', 1)
replace(path, 'className={`text-[9px] leading-4 font-semibold', 'className={`text-xs leading-4 font-semibold', 1)
replace(path, 'className="text-[10px] text-slate-500 leading-4 truncate"', 'className="text-xs text-slate-500 leading-4 truncate"', 1)
replace(
    path,
    '          <button\n            onClick={() => {\n              onSelect(\'mushaf\');',
    '          <button\n            type="button"\n            onClick={() => {\n              onSelect(\'mushaf\');',
    1,
)
replace(path, 'className="h-9 flex-1 inline-flex', 'className="min-h-11 flex-1 inline-flex', 1)
replace(
    path,
    '          <button\n            onClick={onClose}\n            className="h-9 px-4',
    '          <button\n            type="button"\n            onClick={onClose}\n            className="min-h-11 px-4',
    1,
)

# -----------------------------------------------------------------------------
# Login: connect async/error state to controls and increase reveal target.
# -----------------------------------------------------------------------------
path = 'src/components/LoginModal.tsx'
replace_regex(path, r'<form onSubmit=\{onSubmit\} className="space-y-4">', '<form onSubmit={onSubmit} className="space-y-4" aria-busy={isLoading}>', min_count=2)
replace_regex(path, r'(id="login-username-input"\n\s+type="text")', r'\1\n                autoComplete="username"\n                aria-invalid={!!errorMsg}\n                aria-describedby={errorMsg ? \'login-error-message\' : undefined}', min_count=2)
replace_regex(path, r'(id="login-password-input"\n\s+type=\{showPassword \? \'text\' : \'password\'\})', r'\1\n                autoComplete="current-password"\n                aria-invalid={!!errorMsg}\n                aria-describedby={errorMsg ? \'login-error-message\' : undefined}', min_count=2)
replace_regex(path, r'className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"', 'className="absolute inset-y-0 right-0 min-h-11 min-w-11 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"', min_count=2)
# Both desktop/mobile error surfaces start with a div directly inside errorMsg blocks.
replace_regex(path, r'\{errorMsg && \(\n\s+<div className="([^"]*rose-[^"]*)">', r'{errorMsg && (\n            <div id="login-error-message" role="alert" aria-live="assertive" className="\1">', min_count=2)

# -----------------------------------------------------------------------------
# History: remove nested controls, expose accordion state, improve touch/filters.
# -----------------------------------------------------------------------------
path = 'src/components/HistoryTable.tsx'
replace(path, 'const toggleSelectItem = (id: string, e: React.MouseEvent) => {', 'const toggleSelectItem = (id: string, e: React.SyntheticEvent) => {', 1)
mobile_nested = '''                        <button
                          type="button"
                          onClick={(e) => toggleSelectItem(item.id, e)}
                          className="mt-0.5 flex-shrink-0 text-slate-400"
                          title="Pilih rekaman ini"
                          aria-label="Pilih rekaman ini"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          />
                        </button>'''
mobile_fixed = '''                        <label className="mt-0.5 flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center text-slate-500">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectItem(item.id, e)}
                            aria-label={`Pilih rekaman ${item.type} untuk ${item.namaSantri}`}
                            className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                          />
                        </label>'''
replace(path, mobile_nested, mobile_fixed, 1)
desktop_nested = '''                      <div
                        className="flex-shrink-0 text-slate-400 hover:text-emerald-700 cursor-pointer p-0.5"
                        onClick={(e) => toggleSelectItem(item.id, e)}
                        title="Pilih rekaman ini"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        />
                      </div>'''
desktop_fixed = '''                      <label className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center text-slate-500" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectItem(item.id, e)}
                          aria-label={`Pilih rekaman ${item.type} untuk ${item.namaSantri}`}
                          className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        />
                      </label>'''
replace(path, desktop_nested, desktop_fixed, 1)
replace(
    path,
    '                        onClick={() => toggleRow(item.id)}\n                        className="min-w-0 flex-1 text-left"',
    '                        onClick={() => toggleRow(item.id)}\n                        aria-expanded={isExpanded}\n                        aria-controls={`history-mobile-detail-${item.id}`}\n                        className="min-w-0 flex-1 text-left"',
    1,
)
replace(
    path,
    '                      <div className="mt-3 ml-6 rounded-r-xl border-l-2',
    '                      <div id={`history-mobile-detail-${item.id}`} className="mt-3 ml-6 rounded-r-xl border-l-2',
    1,
)
replace(
    path,
    '''                    {/* Expand icon */}
                    <div className="flex-shrink-0 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>''',
    '''                    {/* Expand control */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleRow(item.id); }}
                      aria-expanded={isExpanded}
                      aria-controls={`history-desktop-detail-${item.id}`}
                      aria-label={`${isExpanded ? 'Tutup' : 'Buka'} detail rekaman ${item.type} untuk ${item.namaSantri}`}
                      className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>''',
    1,
)
# The desktop expanded block is the second matching detail block.
replace_regex(
    path,
    r'\{isExpanded && \(\n\s+<div className="px-2\.5 sm:px-4 pb-3 pt-2 bg-slate-50/70 border-t border-slate-200/80 rounded-b-lg space-y-2 text-xs">',
    '{isExpanded && (\n                    <div id={`history-desktop-detail-${item.id}`} className="px-2.5 sm:px-4 pb-3 pt-2 bg-slate-50/70 border-t border-slate-200/80 rounded-b-lg space-y-2 text-xs">',
    min_count=1,
)
# Touch targets and accessible names for key filter controls.
replace(path, 'className="h-8 px-2 inline-flex items-center gap-1 rounded-lg', 'className="min-h-11 px-3 inline-flex items-center gap-1 rounded-lg', 2)
replace(path, 'className="absolute right-2 top-1.5 w-5 h-5 inline-flex', 'className="absolute right-0 top-0 min-h-11 min-w-11 inline-flex', 1)
replace(path, 'className="h-7 px-2 inline-flex items-center gap-1 rounded-md', 'className="min-h-11 px-3 inline-flex items-center gap-1 rounded-md', 1)
replace_regex(path, r'onClick=\{\(\) => setDateFilterMode\(\'bulan\'\)\}\n\s+className=\{`h-8', "onClick={() => setDateFilterMode('bulan')}\n                    aria-pressed={dateFilterMode === 'bulan'}\n                    className={`min-h-11", min_count=1)
replace_regex(path, r'className=\{`h-8 rounded-md text-xs font-bold transition cursor-pointer \$\{\n\s+dateFilterMode === \'range\'', "aria-pressed={dateFilterMode === 'range'}\n                    className={`min-h-11 rounded-md text-xs font-bold transition cursor-pointer ${\n                      dateFilterMode === 'range'", min_count=1)
replace_regex(path, r'onClick=\{\(\) => setDateFilterMode\(\'all\'\)\}\n\s+className=\{`h-8', "onClick={() => setDateFilterMode('all')}\n                    aria-pressed={dateFilterMode === 'all'}\n                    className={`min-h-11", min_count=1)
replace(path, 'className={`h-8 px-2.5 rounded-lg', 'aria-pressed={activeMonthKey === mk}\n                            className={`min-h-11 px-3 rounded-lg', 1)
replace(path, 'className={`h-8 rounded-lg border text-xs font-semibold', 'aria-pressed={activeDatePreset === preset}\n                          className={`min-h-11 rounded-lg border text-xs font-semibold', 1)
replace(
    path,
    '                placeholder="Cari santri, surah, catatan..."\n                className="w-full pl-8',
    '                placeholder="Cari santri, surah, catatan..."\n                aria-label="Cari riwayat setoran"\n                className="w-full pl-8',
    1,
)
replace(
    path,
    '                    title="Hapus pencarian"',
    '                    title="Hapus pencarian"\n                    aria-label="Hapus pencarian"',
    1,
)
replace(
    path,
    '            <select\n              value={kategoriFilter}',
    '            <select\n              aria-label="Filter kategori setoran"\n              value={kategoriFilter}',
    1,
)
replace(
    path,
    '            <select\n              value={nilaiFilter}',
    '            <select\n              aria-label="Filter nilai setoran"\n              value={nilaiFilter}',
    1,
)
replace(
    path,
    '                onClick={() => setKategoriFilter(cat.id)}\n                className=',
    '                type="button"\n                onClick={() => setKategoriFilter(cat.id)}\n                aria-pressed={isSelected}\n                className=',
    1,
)
replace(path, 'className="inline-flex min-h-9 items-center', 'className="inline-flex min-h-11 items-center', 3)
replace(
    path,
    '                        className="flex-shrink-0 p-1.5 text-slate-400',
    '                        className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center text-slate-400',
    1,
)

# -----------------------------------------------------------------------------
# Santri management: tab state, search naming, table semantics, touch targets.
# -----------------------------------------------------------------------------
path = 'src/components/SantriManagement.tsx'
replace(
    path,
    "            onClick={() => setActiveSubTab('santri')}\n            className=",
    "            type=\"button\"\n            onClick={() => setActiveSubTab('santri')}\n            aria-pressed={activeSubTab === 'santri'}\n            className=",
    1,
)
replace(
    path,
    "            onClick={() => setActiveSubTab('users')}\n            className=",
    "            type=\"button\"\n            onClick={() => setActiveSubTab('users')}\n            aria-pressed={activeSubTab === 'users'}\n            className=",
    1,
)
replace(
    path,
    '            placeholder={activeSubTab === \'santri\' ? \'Cari nama, ID, kelas...\' : \'Cari user, nama, role, NIS...\'}',
    '            placeholder={activeSubTab === \'santri\' ? \'Cari nama, ID, kelas...\' : \'Cari user, nama, role, NIS...\'}\n            aria-label={activeSubTab === \'santri\' ? \'Cari data santri\' : \'Cari akun pengguna\'}',
    1,
)
replace(path, 'min-h-10', 'min-h-11')
replace(
    path,
    '            <table className="w-full text-left text-xs">\n              <thead',
    '            <table className="w-full text-left text-xs">\n              <caption className="sr-only">Daftar akun pengguna dan hak akses</caption>\n              <thead',
    1,
)
replace_regex(path, r'<th className="([^"]*)">([^<]+)</th>', r'<th scope="col" className="\1">\2</th>', min_count=6)
replace(
    path,
    '                              <button\n                                onClick={() => setUserToDelete(u)}\n                                className="p-1.5 text-rose-500',
    '                              <button\n                                type="button"\n                                onClick={() => setUserToDelete(u)}\n                                aria-label={`Hapus akun ${u.nama}`}\n                                className="min-h-11 min-w-11 inline-flex items-center justify-center text-rose-500',
    1,
)

# -----------------------------------------------------------------------------
# Kelas management: progress semantics, disclosure state, target sizes.
# -----------------------------------------------------------------------------
path = 'src/components/KelasManagement.tsx'
replace(
    path,
    '<div className="h-2.5 overflow-hidden rounded-full bg-slate-200" aria-label={`Kelengkapan penempatan ${placementPercent}%`}>',
    '<div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label="Kelengkapan penempatan santri" aria-valuemin={0} aria-valuemax={100} aria-valuenow={placementPercent}>',
    1,
)
replace(path, 'min-h-10', 'min-h-11')
replace(
    path,
    '                onClick={() => setShowUnassignedList(!showUnassignedList)}\n                className=',
    '                type="button"\n                onClick={() => setShowUnassignedList(!showUnassignedList)}\n                aria-expanded={showUnassignedList}\n                aria-controls="unassigned-santri-list"\n                className=',
    1,
)
replace(
    path,
    '            <div className="pt-3 border-t border-amber-200/80">',
    '            <div id="unassigned-santri-list" className="pt-3 border-t border-amber-200/80">',
    1,
)
replace(
    path,
    '                    onClick={() => setKelasToDelete(kls)}\n                    className=',
    '                    type="button"\n                    onClick={() => setKelasToDelete(kls)}\n                    aria-label={`Hapus kelas ${kls.namaKelas}`}\n                    className=',
    1,
)
# Key add-dialog form fields get explicit accessible names without changing state logic.
replace(path, '                  value={newNamaKelas}\n', '                  aria-label="Nama Kelas"\n                  value={newNamaKelas}\n', 1)
replace(path, '                  value={newTipeKelas}\n', '                  aria-label="Tipe Kelas"\n                  value={newTipeKelas}\n', 1)
replace(path, '                  value={newMusyrifId}\n', '                  aria-label="Musyrif atau Pembimbing"\n                  value={newMusyrifId}\n', 1)

# -----------------------------------------------------------------------------
# Four setoran forms: programmatic names, busy state, pressed selection state.
# -----------------------------------------------------------------------------

def add_form_names(path: str, pairs: list[tuple[str, str]]) -> None:
    text = read(path)
    text, count = re.subn(r'<form onSubmit=\{handleSubmit\} className="space-y-5">', '<form onSubmit={handleSubmit} className="space-y-5" aria-busy={isSubmitting}>', text, count=1)
    if count != 1:
        raise SystemExit(f'Form busy state pattern failed in {path}')
    for state, label in pairs:
        needle = f'value={{{state}}}\n'
        if needle not in text:
            raise SystemExit(f'Missing value state {state} in {path}')
        text = text.replace(needle, f'aria-label="{label}"\n                {needle}', 1)
    write(path, text)

add_form_names('src/components/ZiyadahForm.tsx', [
    ('idSantri', 'Pilih Santri'), ('tanggalSetor', 'Tanggal Setoran'), ('waktuSetor', 'Waktu Setoran'),
    ('surahName', 'Pilih Surah'), ('ayatAwal', 'Ayat Awal'), ('ayatAkhir', 'Ayat Akhir'),
    ('nilai', 'Kualitas Hafalan'), ('catatan', 'Catatan Tajwid atau Evaluasi Ustadz'),
])
add_form_names('src/components/MurojaahForm.tsx', [
    ('idSantri', 'Pilih Santri'), ('tanggalSetor', 'Tanggal Setoran'), ('waktuSetor', 'Waktu Setoran'),
    ('surahName', 'Pilih Surah'), ('ayatAwal', 'Ayat Awal'), ('ayatAkhir', 'Ayat Akhir'),
    ('nilai', 'Nilai Kelancaran'), ('catatan', 'Catatan Evaluasi atau Rekomendasi'),
])

# Binnadzor: names plus pressed semantics for segmented controls.
path = 'src/components/BinnadzorForm.tsx'
text = read(path)
text, count = re.subn(r'<form onSubmit=\{handleSubmit\} className="space-y-5">', '<form onSubmit={handleSubmit} className="space-y-5" aria-busy={isSubmitting}>', text, count=1)
if count != 1: raise SystemExit('Binnadzor form busy pattern failed')
for state, label in [
    ('idSantri', 'Pilih Santri'), ('tanggalSetor', 'Tanggal Setoran'), ('waktuSetor', 'Waktu Setoran'),
    ('surahName', 'Surah Binnadzor'), ('ayatAwal', 'Ayat Awal Binnadzor'), ('ayatAkhir', 'Ayat Akhir Binnadzor'),
    ('halamanAwal', 'Halaman Awal Binnadzor'), ('halamanAkhir', 'Halaman Akhir Binnadzor'),
    ('juzNumber', 'Juz Binnadzor'), ('catatan', 'Catatan Binnadzor'),
]:
    needle = f'value={{{state}}}\n'
    if needle not in text: raise SystemExit(f'Missing {state} in Binnadzor')
    text = text.replace(needle, f'aria-label="{label}"\n                {needle}', 1)
for value in ['surah', 'halaman', 'juz']:
    old = f"onClick={{() => setModeInput('{value}')}}\n"
    if old not in text: raise SystemExit(f'Missing Binnadzor mode {value}')
    text = text.replace(old, old + f"                aria-pressed={{modeInput === '{value}'}}\n", 1)
text = text.replace('onClick={() => setNilai(opt.value)}\n', 'onClick={() => setNilai(opt.value)}\n                  aria-pressed={nilai === opt.value}\n', 1)
for setter, state in [('setHukumTajwid','hukumTajwid'),('setMakhrojHuruf','makhrojHuruf'),('setKefasihan','kefasihan'),('setKelancaran','kelancaran')]:
    old = f'onClick={{() => {setter}(level)}}\n'
    if old in text:
        text = text.replace(old, old + f'                      aria-pressed={{{state} === level}}\n', 1)
text = text.replace('className="text-xs font-bold px-2 py-0.5 rounded-md', 'className="min-h-11 text-xs font-bold px-3 py-1 rounded-md')
text = text.replace('className={`py-1 px-1.5 rounded-lg text-xs font-bold', 'className={`min-h-11 py-1 px-1.5 rounded-lg text-xs font-bold')
write(path, text)

# Pembelajaran: names and pressed semantics.
path = 'src/components/PembelajaranForm.tsx'
text = read(path)
text, count = re.subn(r'<form onSubmit=\{handleSubmit\} className="space-y-5">', '<form onSubmit={handleSubmit} className="space-y-5" aria-busy={isSubmitting}>', text, count=1)
if count != 1: raise SystemExit('Pembelajaran form busy pattern failed')
for state, label in [
    ('idSantri', 'Pilih Santri'), ('tanggalSetor', 'Tanggal Setoran'), ('waktuSetor', 'Waktu Setoran'),
    ('halamanUmmi', 'Halaman Jilid Ummi'), ('pokokBahasanUmmi', 'Pokok Bahasan atau Kompetensi'),
    ('halamanIstimewa', 'Halaman atau Lembar Modul'), ('kendalaSantri', 'Catatan Observasi Kendala Santri'),
    ('rekomendasiTindakLanjut', 'Rekomendasi Tindak Lanjut Guru atau Ustadz'), ('catatan', 'Catatan Pembelajaran'),
]:
    needle = f'value={{{state}}}\n'
    if needle not in text: raise SystemExit(f'Missing {state} in Pembelajaran')
    text = text.replace(needle, f'aria-label="{label}"\n                {needle}', 1)
for val in ['Jilid', 'Kelas Istimewa']:
    old = f"onClick={{() => setTipeKelas('{val}')}}\n"
    if old not in text: raise SystemExit(f'Missing tipe kelas {val}')
    text = text.replace(old, old + f"                aria-pressed={{tipeKelas === '{val}'}}\n", 1)
text = text.replace('onClick={() => {\n                        setJilidUmmiIndex(idx);', 'onClick={() => {\n                        setJilidUmmiIndex(idx);', 1)
# Insert aria-pressed after closing onClick blocks via nearby class anchors.
text = text.replace('                      }}\n                      className={`py-2 px-3 rounded-xl text-xs font-bold', '                      }}\n                      aria-pressed={jilidUmmiIndex === idx}\n                      className={`min-h-11 py-2 px-3 rounded-xl text-xs font-bold', 1)
text = text.replace('                      }}\n                      className={`p-2.5 rounded-xl text-left text-xs font-bold', '                      }}\n                      aria-pressed={tahapIstimewaIndex === idx}\n                      className={`min-h-11 p-2.5 rounded-xl text-left text-xs font-bold', 1)
text = text.replace('onClick={() => setNilai(opt.value)}\n', 'onClick={() => setNilai(opt.value)}\n                    aria-pressed={nilai === opt.value}\n', 1)
text = text.replace('onClick={() => setStatusKenaikan(st.value)}\n', 'onClick={() => setStatusKenaikan(st.value)}\n                    aria-pressed={statusKenaikan === st.value}\n', 1)
for setter, state in [('setHukumTajwid','hukumTajwid'),('setMakhrojHuruf','makhrojHuruf'),('setKefasihan','kefasihan'),('setKelancaran','kelancaran')]:
    old = f'onClick={{() => {setter}(l)}}\n'
    if old in text:
        text = text.replace(old, old + f'                      aria-pressed={{{state} === l}}\n', 1)
text = text.replace('className="text-xs font-bold px-2 py-0.5 rounded-md', 'className="min-h-11 text-xs font-bold px-3 py-1 rounded-md')
text = text.replace('className={`py-1 text-xs font-bold rounded-lg', 'className={`min-h-11 py-1 text-xs font-bold rounded-lg')
write(path, text)

# -----------------------------------------------------------------------------
# Progress chart: segmented controls expose pressed state and minimum targets.
# -----------------------------------------------------------------------------
path = 'src/components/ZiyadahProgressChart.tsx'
text = read(path)
for value in ['4weeks', '8weeks', 'all']:
    old = f"onClick={{() => setTimeRange('{value}')}}\n"
    if old not in text: raise SystemExit(f'Missing time range {value}')
    text = text.replace(old, old + f"              type=\"button\"\n              aria-pressed={{timeRange === '{value}'}}\n", 1)
for value in ['ayat', 'setoran']:
    old = f"onClick={{() => setMetricType('{value}')}}\n"
    if old not in text: raise SystemExit(f'Missing metric {value}')
    text = text.replace(old, old + f"              type=\"button\"\n              aria-pressed={{metricType === '{value}'}}\n", 1)
for value, label in [('bar','Diagram batang'), ('area','Grafik area')]:
    old = f"onClick={{() => setChartType('{value}')}}\n"
    if old not in text: raise SystemExit(f'Missing chart type {value}')
    text = text.replace(old, old + f"              type=\"button\"\n              aria-pressed={{chartType === '{value}'}}\n              aria-label=\"{label}\"\n", 1)
text = text.replace('className={`px-2.5 py-1 rounded-lg transition cursor-pointer', 'className={`min-h-11 px-3 py-1 rounded-lg transition cursor-pointer')
text = text.replace('className={`p-1.5 rounded-lg transition cursor-pointer', 'className={`min-h-11 min-w-11 p-1.5 rounded-lg transition cursor-pointer')
write(path, text)

print('P2.14 accessibility patch applied successfully')
