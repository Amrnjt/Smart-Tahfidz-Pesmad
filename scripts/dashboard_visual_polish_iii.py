from pathlib import Path

path = Path('src/components/UstadzDashboard.tsx')
text = path.read_text()

anchor = """  const dailyBreakdownWithShare = dailyBreakdown.map(item => ({
    ...item,
    share: todayActivities.length > 0 ? Math.round((item.value / todayActivities.length) * 100) : 0
  }));

  const categoryTargetTabs: Record<ActivityCategory, ActiveTab> = {
    Ziyadah: 'ziyadah',
    \"Muroja'ah\": 'murojaah',
    Binnadzor: 'binnadzor',
    Pembelajaran: 'pembelajaran'
  };"""
if anchor not in text:
    raise SystemExit('data anchor not found')
replacement = anchor + """

  const sevenDayPulse = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T12:00:00+07:00`);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const count = activities.filter(record => record.timestamp.startsWith(key)).length;
    const label = new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      timeZone: 'Asia/Jakarta'
    }).format(date).replace('.', '');
    return { key, label, count };
  });
  const sevenDayMax = Math.max(1, ...sevenDayPulse.map(day => day.count));
  const sevenDayTotal = sevenDayPulse.reduce((sum, day) => sum + day.count, 0);
  const yesterdayCount = sevenDayPulse[5]?.count ?? 0;
  const todayCount = sevenDayPulse[6]?.count ?? todayActivities.length;
  const momentumDelta = todayCount - yesterdayCount;
  const momentumLabel = momentumDelta > 0
    ? `+${momentumDelta} dari kemarin`
    : momentumDelta < 0
      ? `${momentumDelta} dari kemarin`
      : 'sama dengan kemarin';
  const todayKurangCount = todayAttention.filter(record => record.nilai === 'Kurang').length;
  const todayMengulangCount = todayAttention.filter(record => record.nilai === 'Mengulang').length;

  const openAnalytics = () => {
    setChartView('aktivitas');
    requestAnimationFrame(() => {
      const target = document.getElementById('dashboard-analytics');
      if (!target) return;
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  };"""
text = text.replace(anchor, replacement, 1)

old_pulse = '''          <div aria-hidden="true" className="pointer-events-none absolute right-5 top-20 hidden w-44 rounded-2xl border border-emerald-800 bg-emerald-900/55 p-4 lg:block">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-300">Terakhir hari ini</span>
              <BookOpen className="h-4 w-4 text-emerald-400" />
            </div>
            {latestTodayActivity ? (
              <>
                <p className="mt-4 truncate text-sm font-bold text-white">{latestTodayActivity.namaSantri}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-200">{latestTodayActivity.category} · {latestTodayActivity.material}</p>
                <p className="mt-3 text-xs font-semibold text-emerald-300">{formatTanggalWaktu(latestTodayActivity.timestamp)}</p>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm font-bold text-white">Belum ada setoran</p>
                <p className="mt-1 text-xs leading-5 text-emerald-200">Aktivitas pertama hari ini akan muncul di sini.</p>
              </>
            )}
          </div>'''
new_pulse = '''          <div className="absolute right-5 top-20 hidden w-60 rounded-2xl border border-emerald-800 bg-emerald-900/60 p-4 shadow-[0_16px_34px_-28px_rgba(0,0,0,0.7)] lg:block">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-300">Ritme 7 hari</p>
                <p className="mt-1 text-sm font-bold text-white">{sevenDayTotal} setoran</p>
              </div>
              <span className="rounded-lg border border-emerald-700 bg-emerald-950/70 px-2 py-1 text-xs font-semibold text-emerald-200">{momentumLabel}</span>
            </div>

            <div className="mt-4 flex h-20 items-end gap-2" role="img" aria-label={`Aktivitas tujuh hari terakhir, total ${sevenDayTotal} setoran`}>
              {sevenDayPulse.map(day => (
                <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-14 w-full items-end justify-center rounded-md bg-emerald-950/55 px-1">
                    <span
                      className={`w-full rounded-sm ${day.key === today ? 'bg-emerald-300' : 'bg-emerald-600'}`}
                      style={{ height: `${day.count === 0 ? 8 : Math.max(18, Math.round((day.count / sevenDayMax) * 100))}%` }}
                      title={`${day.label}: ${day.count} setoran`}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${day.key === today ? 'text-white' : 'text-emerald-300'}`}>{day.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-emerald-800 pt-3">
              {latestTodayActivity ? (
                <>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Terakhir hari ini</div>
                  <p className="mt-1.5 truncate text-sm font-bold text-white">{latestTodayActivity.namaSantri}</p>
                  <p className="mt-0.5 truncate text-xs text-emerald-200">{latestTodayActivity.category} · {latestTodayActivity.material}</p>
                </>
              ) : (
                <p className="text-xs leading-5 text-emerald-200">Belum ada setoran hari ini. Aktivitas pertama akan muncul di sini.</p>
              )}
            </div>
          </div>'''
if old_pulse not in text:
    raise SystemExit('desktop pulse block not found')
text = text.replace(old_pulse, new_pulse, 1)

old_today = '''                  <strong className="mt-0.5 block text-2xl font-bold leading-none tabular-nums text-white">{todayActivities.length}</strong>
                </span>'''
new_today = '''                  <strong className="mt-0.5 block text-2xl font-bold leading-none tabular-nums text-white">{todayActivities.length}</strong>
                  <span className="mt-1 block text-xs text-emerald-300">{momentumLabel}</span>
                </span>'''
if old_today not in text:
    raise SystemExit('today metric anchor not found')
text = text.replace(old_today, new_today, 1)

old_attention = '''              <p className="ui-secondary mt-1">Nilai Kurang atau Mengulang dari data setoran aktual.</p>
              <button type="button" onClick={() => setActiveTab('riwayat')} className="group mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950">'''
new_attention = '''              <p className="ui-secondary mt-1">Nilai Kurang atau Mengulang dari data setoran aktual.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-800"><strong>{todayKurangCount}</strong> Kurang</span>
                <span className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-rose-800"><strong>{todayMengulangCount}</strong> Mengulang</span>
              </div>
              <button type="button" onClick={() => setActiveTab('riwayat')} className="group mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-950">'''
if old_attention not in text:
    raise SystemExit('attention summary anchor not found')
text = text.replace(old_attention, new_attention, 1)

old_quality = '''        <div className="ui-panel flex min-h-24 items-center gap-3 px-4 py-4 sm:px-5">
          <div className="relative h-12 w-12 flex-shrink-0" aria-hidden="true">
            <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#d1fae5" strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" pathLength="100" strokeDasharray={`${sangatBaikPercent ?? 0} 100`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-900">{sangatBaikPercent === null ? '—' : `${sangatBaikPercent}%`}</span>
          </div>
          <div className="min-w-0"><p className="ui-meta font-semibold">Kualitas Sangat Baik</p><p className="mt-0.5 text-base font-bold text-slate-950">{sangatBaikPercent === null ? 'Belum ada nilai' : `${sangatBaikPercent}% dari seluruh setoran`}</p><p className="ui-meta mt-0.5">{activities.length === 0 ? 'Belum ada penilaian' : `${sangatBaikCount} dari ${activities.length} setoran`}</p></div>
        </div>'''
new_quality = '''        <button type="button" onClick={openAnalytics} className="ui-panel group flex min-h-24 items-center gap-3 px-4 py-4 text-left transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:px-5" aria-label="Buka analitik aktivitas dan kualitas">
          <div className="relative h-12 w-12 flex-shrink-0" aria-hidden="true">
            <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#d1fae5" strokeWidth="4" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#059669" strokeWidth="4" strokeLinecap="round" pathLength="100" strokeDasharray={`${sangatBaikPercent ?? 0} 100`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-900">{sangatBaikPercent === null ? '—' : `${sangatBaikPercent}%`}</span>
          </div>
          <span className="min-w-0 flex-1"><span className="ui-meta block font-semibold">Kualitas Sangat Baik</span><strong className="mt-0.5 block text-base font-bold text-slate-950">{sangatBaikPercent === null ? 'Belum ada nilai' : `${sangatBaikPercent}% dari seluruh setoran`}</strong><span className="ui-meta mt-0.5 block">{activities.length === 0 ? 'Belum ada penilaian' : `${sangatBaikCount} dari ${activities.length} setoran · buka analitik`}</span></span>
          <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>'''
if old_quality not in text:
    raise SystemExit('quality card block not found')
text = text.replace(old_quality, new_quality, 1)

old_analytics = '''      <ScrollReveal delay={80} className="space-y-3">
        <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">'''
new_analytics = '''      <ScrollReveal delay={80} className="space-y-3">
        <div id="dashboard-analytics" className="scroll-mt-24 flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">'''
if old_analytics not in text:
    raise SystemExit('analytics header anchor not found')
text = text.replace(old_analytics, new_analytics, 1)

for forbidden in ['bg-gradient-to-', 'backdrop-blur', 'Sparkles', 'text-[9px]', 'text-[10px]', 'text-[11px]']:
    if forbidden in text:
        raise SystemExit(f'forbidden token remains: {forbidden}')

path.write_text(text)
