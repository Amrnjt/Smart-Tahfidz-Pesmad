import React, { forwardRef } from 'react';
import { User, ZiyadahRecord, MurojaahRecord, Santri, PredikatNilai } from '../types';
import { formatTanggalLengkap, parseDateSafe } from '../utils/dateFormatter';
import { NAMA_BULAN } from '../hooks/useGeneratePDF';
import { BookOpen, RotateCw, Calendar, MapPin, User as UserIcon, Target, Award, TrendingUp, FileText } from 'lucide-react';

export interface TahfidzReportPDFProps {
  santri: Santri | null;
  currentUser: User;
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  period: { month: number; year: number };
  options: {
    includeIdentity: boolean;
    includeSummary: boolean;
    includeHistory: boolean;
    includeChart: boolean;
    includeNotes: boolean;
  };
}

export const TahfidzReportPDF = forwardRef<HTMLDivElement, TahfidzReportPDFProps>(
  ({ santri, currentUser, ziyadahRecords, murojaahRecords, period, options }, ref) => {
    const periodPrefix = `${period.year}-${(period.month + 1).toString().padStart(2, '0')}`;

    const periodZiyadah = ziyadahRecords.filter(r => {
      const dp = r.timestamp.split(' ')[0] || r.timestamp;
      return dp.startsWith(periodPrefix);
    });
    const periodMurojaah = murojaahRecords.filter(r => {
      const dp = r.timestamp.split(' ')[0] || r.timestamp;
      return dp.startsWith(periodPrefix);
    });

    const totalAyatZiyadah = periodZiyadah.reduce(
      (s, r) => s + Math.max(1, r.ayatAkhir - r.ayatAwal + 1),
      0
    );
    const totalSurahZiyadah = new Set(periodZiyadah.map(r => r.surah)).size;
    const allPeriod = [...periodZiyadah, ...periodMurojaah];
    const sangatLancarCount = allPeriod.filter(r => r.nilai === 'Sangat Lancar').length;
    const lancarCount = allPeriod.filter(r => r.nilai === 'Lancar').length;
    const perluUlangCount = allPeriod.filter(r => r.nilai === 'Perlu Ulang').length;
    const totalSetoran = allPeriod.length;

    const santriName = santri?.namaSantri || currentUser.nama || 'Santri';
    const santriId = santri?.idSantri || currentUser.idSantri || currentUser.username || '-';
    const santriKelas = santri?.kelas || '-';
    const santriTarget = santri?.targetHafalan || '-';

    const historyItems = [
      ...periodZiyadah.map(z => ({
        id: z.id,
        type: 'Ziyadah' as const,
        ts: z.timestamp,
        materi: `${z.surah} (Ayat ${z.ayatAwal}-${z.ayatAkhir})`,
        nilai: z.nilai,
        catatan: z.catatan,
        inputBy: z.inputBy,
      })),
      ...periodMurojaah.map(m => ({
        id: m.id,
        type: 'Murojaah' as const,
        ts: m.timestamp,
        materi: m.surahAtauJuz,
        nilai: m.nilai,
        catatan: m.catatan,
        inputBy: m.inputBy,
      })),
    ].sort((a, b) => parseDateSafe(b.ts).getTime() - parseDateSafe(a.ts).getTime());

    const notesWithContent = allPeriod
      .filter(r => r.catatan && r.catatan.trim())
      .sort((a, b) => parseDateSafe(b.timestamp).getTime() - parseDateSafe(a.timestamp).getTime());

    const nilaiBadge = (nilai: PredikatNilai) => {
      if (nilai === 'Sangat Lancar')
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300 whitespace-nowrap">Sangat Lancar</span>;
      if (nilai === 'Lancar')
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] border border-amber-300 whitespace-nowrap">Lancar</span>;
      return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-300 whitespace-nowrap">Perlu Ulang</span>;
    };

    const maxBarVal = Math.max(periodZiyadah.length, periodMurojaah.length, sangatLancarCount, lancarCount, perluUlangCount, 1);
    const barData = [
      { label: 'Ziyadah', val: periodZiyadah.length, color: 'bg-emerald-600' },
      { label: "Muroja'ah", val: periodMurojaah.length, color: 'bg-teal-600' },
      { label: 'Sangat Lancar', val: sangatLancarCount, color: 'bg-emerald-800' },
      { label: 'Lancar', val: lancarCount, color: 'bg-amber-500' },
      { label: 'Perlu Ulang', val: perluUlangCount, color: 'bg-rose-500' },
    ];

    return (
      <div
        ref={ref}
        className="bg-white text-slate-800"
        style={{ width: '794px', minHeight: '1123px', padding: '40px', fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: 'border-box' }}
      >
        {/* ════════ HEADER ════════ */}
        <div className="relative overflow-hidden rounded-2xl mb-5" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
          {/* Decorative pattern overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)'
          }} />
          {/* Gold accent line at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #d4af37, #f0d77c, #d4af37)' }} />

          <div className="relative px-7 py-6 flex items-center gap-5">
            {/* Logo placeholder */}
            <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/15 border-2 border-amber-300/40 flex items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-amber-300" />
              </div>
            </div>

            <div className="flex-1 text-white">
              <h1 className="text-2xl font-extrabold tracking-tight leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Laporan Pantauan Pembelajaran Tahfidz
              </h1>
              <p className="text-amber-200 text-sm font-semibold mt-0.5">
                Pesantren Madrasah Darul Fikri &middot; MTsN 3 Bojonegoro
              </p>
              <p className="text-emerald-100 text-[11px] mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro
              </p>
            </div>

            {/* Period badge */}
            <div className="flex-shrink-0 text-center bg-white/10 rounded-xl px-4 py-2.5 border border-amber-300/30">
              <div className="text-[10px] uppercase tracking-widest text-amber-200 font-bold">Periode</div>
              <div className="text-lg font-extrabold text-white leading-tight">{NAMA_BULAN[period.month]}</div>
              <div className="text-sm font-bold text-amber-200">{period.year}</div>
            </div>
          </div>
        </div>

        {/* ════════ IDENTITAS SANTRI ════════ */}
        {options.includeIdentity && (
          <section className="mb-4">
            <SectionHeader icon={<UserIcon className="w-4 h-4" />} title="Identitas Santri" />
            <div className="grid grid-cols-2 gap-3 mt-2.5">
              <InfoCard label="Nama Santri" value={santriName} />
              <InfoCard label="ID / NIS" value={santriId} />
              <InfoCard label="Kelas / Halaqah" value={santriKelas} />
              <InfoCard label="Target Hafalan" value={santriTarget} />
              {santri?.waliNama && <InfoCard label="Wali" value={santri.waliNama} />}
              {santri?.waliKontak && <InfoCard label="Kontak Wali" value={santri.waliKontak} />}
            </div>
          </section>
        )}

        {/* ════════ RINGKASAN HAFALAN ════════ */}
        {options.includeSummary && (
          <section className="mb-4">
            <SectionHeader icon={<TrendingUp className="w-4 h-4" />} title="Ringkasan Progres Hafalan" />
            <div className="grid grid-cols-4 gap-2.5 mt-2.5">
              <StatCard value={periodZiyadah.length} label="Setoran Ziyadah" bg="bg-emerald-50" text="text-emerald-700" border="border-emerald-200" />
              <StatCard value={periodMurojaah.length} label="Setoran Muroja'ah" bg="bg-teal-50" text="text-teal-700" border="border-teal-200" />
              <StatCard value={totalAyatZiyadah} label="Total Ayat Ziyadah" bg="bg-amber-50" text="text-amber-700" border="border-amber-200" />
              <StatCard value={totalSurahZiyadah} label="Surah Berbeda" bg="bg-sky-50" text="text-sky-700" border="border-sky-200" />
            </div>

            {/* Distribusi Nilai */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Distribusi Nilai:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                Sangat Lancar: {sangatLancarCount}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                Lancar: {lancarCount}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
                Perlu Ulang: {perluUlangCount}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                Total: {totalSetoran}
              </span>
            </div>
          </section>
        )}

        {/* ════════ GRAFIK PROGRES ════════ */}
        {options.includeChart && (periodZiyadah.length > 0 || periodMurojaah.length > 0) && (
          <section className="mb-4">
            <SectionHeader icon={<Award className="w-4 h-4" />} title="Grafik Progres Hafalan" />
            <div className="mt-2.5 bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-end justify-around gap-3" style={{ height: '120px' }}>
                {barData.map((bar, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="text-[11px] font-extrabold text-slate-700">{bar.val}</div>
                    <div className="w-full rounded-t-lg flex-1 flex items-end" style={{ minHeight: '10px' }}>
                      <div
                        className={`w-full rounded-t-lg ${bar.color} transition-all`}
                        style={{ height: `${(bar.val / maxBarVal) * 80}px`, minHeight: bar.val > 0 ? '8px' : '0px' }}
                      />
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 text-center leading-tight">{bar.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ════════ DAFTAR RIWAYAT ════════ */}
        {options.includeHistory && (
          <section className="mb-4">
            <SectionHeader icon={<Calendar className="w-4 h-4" />} title="Daftar Riwayat Setoran" />
            <div className="mt-2.5 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="bg-emerald-800 text-white">
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Tanggal</th>
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Jenis</th>
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Materi Hafalan</th>
                    <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px]">Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 text-[11px]">
                        Tidak ada setoran pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    historyItems.slice(0, 20).map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                        <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{formatTanggalLengkap(item.ts)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {item.type === 'Ziyadah' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <BookOpen className="w-3 h-3" /> Ziyadah
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-teal-700 font-bold">
                              <RotateCw className="w-3 h-3" /> Muroja'ah
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700">{item.materi}</td>
                        <td className="py-2 px-3">{nilaiBadge(item.nilai)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {historyItems.length > 20 && (
                <div className="py-2 px-3 bg-slate-50 text-[10px] text-slate-400 text-center border-t border-slate-200">
                  Menampilkan 20 dari {historyItems.length} setoran pada periode ini.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ════════ CATATAN & EVALUASI ════════ */}
        {options.includeNotes && notesWithContent.length > 0 && (
          <section className="mb-4">
            <SectionHeader icon={<FileText className="w-4 h-4" />} title="Catatan & Evaluasi dari Pengajar" />
            <div className="mt-2.5 space-y-2">
              {notesWithContent.slice(0, 8).map((r, idx) => {
                const materiStr = (r as any).surah
                  ? `${(r as any).surah} (Ayat ${(r as any).ayatAwal}-${(r as any).ayatAkhir})`
                  : (r as any).surahAtauJuz;
                return (
                  <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-emerald-800">{formatTanggalLengkap(r.timestamp)} &mdash; {materiStr}</span>
                      {nilaiBadge(r.nilai)}
                    </div>
                    <p className="text-[11px] text-slate-600 italic leading-relaxed">&ldquo;{r.catatan}&rdquo;</p>
                    <p className="text-[10px] text-slate-400 mt-1">&mdash; {r.inputBy}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ════════ KESIMPULAN ════════ */}
        <section className="mb-4">
          <SectionHeader icon={<Target className="w-4 h-4" />} title="Kesimpulan & Rekomendasi" />
          <div className="mt-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200 p-4">
            <p className="text-[11px] text-slate-700 leading-relaxed">
              Pada periode <b>{NAMA_BULAN[period.month]} {period.year}</b>, santri{' '}
              <b>{santriName}</b> telah menyelesaikan{' '}
              <b>{periodZiyadah.length} setoran Ziyadah</b> ({totalAyatZiyadah} ayat dari {totalSurahZiyadah} surah berbeda) dan{' '}
              <b>{periodMurojaah.length} setoran Muroja'ah</b>.
              {sangatLancarCount > 0 && ` Sebanyak ${sangatLancarCount} setoran bernilai "Sangat Lancar".`}
              {perluUlangCount > 0 && ` Terdapat ${perluUlangCount} setoran yang perlu diulang.`}
              {' '}Semoga Allah Tabaraka wa Ta'ala memudahkan hafalan dan istiqamah santri. Aamiin.
            </p>
          </div>
        </section>

        {/* ════════ FOOTER ════════ */}
        <div className="mt-6 pt-4 border-t-2 border-emerald-800/20">
          <div className="flex items-end justify-between">
            <div className="text-[10px] text-slate-400">
              <p>Dicetak pada: {formatTanggalLengkap(new Date())}</p>
              <p className="mt-0.5">Sistem Mutaba'ah Tahfidz Digital &middot; Pesantren Madrasah Darul Fikri</p>
              <p className="mt-0.5">Halaman 1 dari 1</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-slate-400/50 mt-8 pt-1">
                <p className="text-[10px] text-slate-500 font-semibold">Pembimbing Tahfidz</p>
                <p className="text-[11px] text-slate-700 font-bold mt-0.5">{currentUser.nama}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

TahfidzReportPDF.displayName = 'TahfidzReportPDF';

// ── Helper Components ──

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b-2 border-emerald-700/30">
      <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <h2 className="text-sm font-extrabold text-emerald-900 uppercase tracking-wide">{title}</h2>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 px-3.5 py-2.5">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="text-[13px] font-bold text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}

function StatCard({
  value,
  label,
  bg,
  text,
  border,
}: {
  value: number;
  label: string;
  bg: string;
  text: string;
  border: string;
}) {
  return (
    <div className={`rounded-xl border ${border} ${bg} px-3 py-3 text-center`}>
      <div className={`text-2xl font-extrabold ${text} leading-none`}>{value}</div>
      <div className="text-[10px] font-semibold text-slate-500 mt-1.5 leading-tight">{label}</div>
    </div>
  );
}
