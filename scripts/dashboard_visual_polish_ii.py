from pathlib import Path

path = Path('src/components/UstadzDashboard.tsx')
text = path.read_text()

old = """  const latestActivities = activities.slice(0, 6);\n  const recentAttention = attentionActivities.slice(0, 4);\n"""
new = """  const latestActivities = activities.slice(0, 6);\n  const recentAttention = attentionActivities.slice(0, 4);\n  const latestTodayActivity = todayActivities[0] ?? null;\n"""
if old not in text:
    raise SystemExit('latest activity anchor not found')
text = text.replace(old, new, 1)

old = """  const dailyBreakdown: { label: ActivityCategory; value: number }[] = [\n    { label: 'Ziyadah', value: todayActivities.filter(record => record.category === 'Ziyadah').length },\n    { label: \"Muroja'ah\", value: todayActivities.filter(record => record.category === \"Muroja'ah\").length },\n    { label: 'Binnadzor', value: todayActivities.filter(record => record.category === 'Binnadzor').length },\n    { label: 'Pembelajaran', value: todayActivities.filter(record => record.category === 'Pembelajaran').length }\n  ];\n"""
new = old + """\n  const dailyBreakdownWithShare = dailyBreakdown.map(item => ({\n    ...item,\n    share: todayActivities.length > 0 ? Math.round((item.value / todayActivities.length) * 100) : 0\n  }));\n"""
if old not in text:
    raise SystemExit('daily breakdown anchor not found')
text = text.replace(old, new, 1)

old = """          <div aria-hidden=\"true\" className=\"pointer-events-none absolute right-5 top-20 hidden h-48 w-36 rounded-t-[999px] border border-emerald-800 bg-emerald-900/35 lg:flex lg:items-center lg:justify-center\">\n            <BookOpen className=\"h-10 w-10 text-emerald-500/45\" />\n          </div>"""
new = """          <div aria-hidden=\"true\" className=\"pointer-events-none absolute right-5 top-20 hidden w-44 rounded-2xl border border-emerald-800 bg-emerald-900/55 p-4 lg:block\">\n            <div className=\"flex items-center justify-between gap-3\">\n              <span className=\"text-xs font-semibold uppercase tracking-[0.08em] text-emerald-300\">Terakhir hari ini</span>\n              <BookOpen className=\"h-4 w-4 text-emerald-400\" />\n            </div>\n            {latestTodayActivity ? (\n              <>\n                <p className=\"mt-4 truncate text-sm font-bold text-white\">{latestTodayActivity.namaSantri}</p>\n                <p className=\"mt-1 line-clamp-2 text-xs leading-5 text-emerald-200\">{latestTodayActivity.category} · {latestTodayActivity.material}</p>\n                <p className=\"mt-3 text-xs font-semibold text-emerald-300\">{formatTanggalWaktu(latestTodayActivity.timestamp)}</p>\n              </>\n            ) : (\n              <>\n                <p className=\"mt-4 text-sm font-bold text-white\">Belum ada setoran</p>\n                <p className=\"mt-1 text-xs leading-5 text-emerald-200\">Aktivitas pertama hari ini akan muncul di sini.</p>\n              </>\n            )}\n          </div>"""
if old not in text:
    raise SystemExit('hero context panel anchor not found')
text = text.replace(old, new, 1)

if 'dailyBreakdown.map((item) =>' not in text:
    raise SystemExit('daily breakdown map anchor not found')
text = text.replace('dailyBreakdown.map((item) =>', 'dailyBreakdownWithShare.map((item) =>', 1)

old = """                    <span className={`mt-0.5 block text-xs ${style.onDarkText}`}>setoran hari ini</span>\n                  </span>"""
new = """                    <span className={`mt-0.5 block text-xs ${style.onDarkText}`}>setoran hari ini</span>\n                    <span className=\"mt-2 block h-1 overflow-hidden rounded-full bg-white/10\" aria-hidden=\"true\">\n                      <span className=\"block h-full rounded-full bg-white/70 transition-[width] duration-300\" style={{ width: `${item.share}%` }} />\n                    </span>\n                  </span>"""
if old not in text:
    raise SystemExit('category progress anchor not found')
text = text.replace(old, new, 1)

old = """                <div key={`${record.category}-${record.id}`} className=\"group grid gap-2 px-4 py-3.5 transition-colors hover:bg-slate-50 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5\">"""
new = """                <button\n                  type=\"button\"\n                  key={`${record.category}-${record.id}`}\n                  onClick={() => setActiveTab('riwayat')}\n                  className=\"group grid w-full gap-2 px-4 py-3.5 text-left transition-[background-color,transform] duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:px-5\"\n                  aria-label={`${record.namaSantri}, ${record.category}, ${record.nilai}. Buka riwayat`}\n                >"""
if old not in text:
    raise SystemExit('recent activity row anchor not found')
text = text.replace(old, new, 1)

old = """                  <div className=\"flex items-center justify-between gap-3 pl-12 sm:block sm:pl-0 sm:text-right\">\n                    <span className={`text-xs font-bold ${getNilaiTextClass(record.nilai)}`}>{record.nilai}</span>\n                    <span className=\"ui-meta whitespace-nowrap sm:mt-1 sm:block\">{formatTanggalWaktu(record.timestamp)}</span>\n                  </div>\n                </div>"""
new = """                  <div className=\"flex items-center justify-between gap-3 pl-12 sm:flex sm:items-center sm:justify-end sm:pl-0 sm:text-right\">\n                    <span>\n                      <span className={`text-xs font-bold ${getNilaiTextClass(record.nilai)}`}>{record.nilai}</span>\n                      <span className=\"ui-meta whitespace-nowrap sm:mt-1 sm:block\">{formatTanggalWaktu(record.timestamp)}</span>\n                    </span>\n                    <ChevronRight className=\"hidden h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 sm:block\" aria-hidden=\"true\" />\n                  </div>\n                </button>"""
if old not in text:
    raise SystemExit('recent activity row close anchor not found')
text = text.replace(old, new, 1)

# Strengthen the command hierarchy without continuous animation.
text = text.replace(
    'className="ui-control press-feedback inline-flex items-center justify-center gap-2 bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-sm transition-[background-color,transform] hover:bg-emerald-200"',
    'className="ui-control press-feedback inline-flex items-center justify-center gap-2 bg-emerald-300 px-4 text-sm font-bold text-emerald-950 shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:bg-emerald-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-100"',
    1,
)

path.write_text(text)
