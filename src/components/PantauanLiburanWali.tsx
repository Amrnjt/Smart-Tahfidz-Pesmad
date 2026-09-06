import React, { useState, useEffect, useMemo } from 'react';
import { WiridYaumiyyahRecord } from '../types';
import { storageService } from '../services/storageService';
import {
  Moon,
  Lock,
  CircleCheck as CheckCircle2,
  Calendar,
  Save,
  BookOpen,
  Users,
  HeartPulse,
  CircleMinus as MinusCircle,
  Sparkles,
  History
} from 'lucide-react';

type ShalatStatus = "Jama'ah" | 'Berhalangan' | 'Sakit';
type ShalatKey = 'shubuh' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';

interface PantauanLiburanWaliProps {
  idSantri: string;
  namaSantri: string;
  isEnabled: boolean;
  inputBy: string;
  records: WiridYaumiyyahRecord[];
  onSaved: () => void;
}

const WIRID_ITEMS: { key: 'alWaqiah' | 'alMulk' | 'alInsyirah'; label: string; arab: string; note: string }[] = [
  { key: 'alWaqiah', label: "Surah al-Waqi'ah", arab: 'الواقعة', note: 'Dibaca ba’da Shubuh / Ashar' },
  { key: 'alMulk', label: 'Surah al-Mulk', arab: 'الملك', note: 'Dibaca menjelang tidur' },
  { key: 'alInsyirah', label: 'Surah al-Insyirah', arab: 'الشرح', note: 'Dibaca rutin harian' },
];

const SHALAT_ITEMS: { key: ShalatKey; label: string }[] = [
  { key: 'shubuh', label: 'Shubuh' },
  { key: 'dzuhur', label: 'Dzuhur' },
  { key: 'ashar', label: 'Ashar' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isya', label: "Isya'" },
];

const SHALAT_STATUS: { value: ShalatStatus; label: string; icon: React.ComponentType<{ className?: string }>; activeClass: string }[] = [
  { value: "Jama'ah", label: "Jama'ah", icon: Users, activeClass: 'bg-emerald-700 text-white border-emerald-700' },
  { value: 'Berhalangan', label: 'Berhalangan', icon: MinusCircle, activeClass: 'bg-amber-600 text-white border-amber-600' },
  { value: 'Sakit', label: 'Sakit', icon: HeartPulse, activeClass: 'bg-rose-600 text-white border-rose-600' },
];

const todayStr = () => new Date().toISOString().split('T')[0];

export const PantauanLiburanWali: React.FC<PantauanLiburanWaliProps> = ({
  idSantri,
  namaSantri,
  isEnabled,
  inputBy,
  records,
  onSaved
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [wirid, setWirid] = useState({ alWaqiah: false, alMulk: false, alInsyirah: false });
  const [shalat, setShalat] = useState<Record<ShalatKey, ShalatStatus>>({
    shubuh: "Jama'ah",
    dzuhur: "Jama'ah",
    ashar: "Jama'ah",
    maghrib: "Jama'ah",
    isya: "Jama'ah",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const santriRecords = useMemo(
    () => records.filter(r => r.idSantri === idSantri).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [records, idSantri]
  );

  // Pre-fill the form when the selected date already has a saved record
  useEffect(() => {
    const existing = santriRecords.find(r => r.timestamp.startsWith(selectedDate));
    if (existing) {
      setWirid({
        alWaqiah: !!existing.alWaqiah,
        alMulk: !!existing.alMulk,
        alInsyirah: !!existing.alInsyirah,
      });
      setShalat({
        shubuh: existing.shubuh,
        dzuhur: existing.dzuhur,
        ashar: existing.ashar,
        maghrib: existing.maghrib,
        isya: existing.isya,
      });
    } else {
      setWirid({ alWaqiah: false, alMulk: false, alInsyirah: false });
      setShalat({ shubuh: "Jama'ah", dzuhur: "Jama'ah", ashar: "Jama'ah", maghrib: "Jama'ah", isya: "Jama'ah" });
    }
  }, [selectedDate, santriRecords]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await storageService.saveWiridYaumiyyah({
        idSantri,
        namaSantri,
        inputBy,
        timestamp: `${selectedDate} 00:00`,
        alWaqiah: wirid.alWaqiah,
        alMulk: wirid.alMulk,
        alInsyirah: wirid.alInsyirah,
        ...shalat,
      });
      onSaved();
      setToast('Catatan pantauan liburan berhasil disimpan ke Cloud.');
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast('Gagal menyimpan catatan. Silakan coba lagi.');
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const statusBadgeClass = (s: ShalatStatus) =>
    s === "Jama'ah"
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : s === 'Berhalangan'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : 'bg-rose-100 text-rose-800 border-rose-200';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.06] pointer-events-none">
          <Moon className="w-full h-full" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
            <Moon className="w-6 h-6 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">Program Pantauan Liburan Santri</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isEnabled ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200' : 'bg-slate-500/20 border-slate-400/40 text-slate-300'}`}>
                {isEnabled ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-indigo-200/90 mt-1 leading-relaxed">
              Pantauan wirid Yaumiyyah &amp; keaktifan shalat berjama'ah ananda selama masa libur pesantren.
            </p>
          </div>
        </div>
      </div>

      {!isEnabled ? (
        /* Locked / Disabled State */
        <div className="p-8 sm:p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h4 className="font-bold text-slate-700 text-sm sm:text-base">Program Pantauan Sedang Dinonaktifkan</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Fitur pemantauan liburan hanya aktif ketika pengurus pesantren mengaktifkan Program Pantauan dari dasbor admin.
            Silakan menunggu jadwal libur diaktifkan oleh pihak pesantren.
          </p>
        </div>
      ) : (
        <div className="p-5 sm:p-6 space-y-6">
          {toast && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          {/* Date Picker */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Tanggal Pantauan
            </label>
            <input
              type="date"
              value={selectedDate}
              max={todayStr()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
            />
          </div>

          {/* Wirid Yaumiyyah */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <h4 className="text-sm font-bold text-slate-800">Bacaan Wirid Yaumiyyah</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WIRID_ITEMS.map((item) => {
                const checked = wirid[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setWirid(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                    className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      checked
                        ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm leading-snug">{item.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.note}</p>
                      </div>
                      <span className="text-lg font-serif text-emerald-800 flex-shrink-0" lang="ar">{item.arab}</span>
                    </div>
                    <div className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      checked ? 'bg-emerald-700 text-white' : 'bg-white text-slate-500 border border-slate-200'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {checked ? 'Sudah Dibaca' : 'Belum Dibaca'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shalat Berjamaah */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-700" />
              <h4 className="text-sm font-bold text-slate-800">Keaktifan Shalat Berjama'ah</h4>
            </div>
            <div className="space-y-2.5">
              {SHALAT_ITEMS.map((item) => (
                <div key={item.key} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-sm font-bold text-slate-700 w-24 flex-shrink-0">{item.label}</span>
                  <div className="grid grid-cols-3 gap-1.5 flex-1">
                    {SHALAT_STATUS.map((opt) => {
                      const Icon = opt.icon;
                      const active = shalat[item.key] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setShalat(prev => ({ ...prev, [item.key]: opt.value }))}
                          className={`press-feedback flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            active ? opt.activeClass : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Catatan Pantauan'}</span>
          </button>

          {/* Recap / History */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h4 className="text-sm font-bold text-slate-800">Rekap Pantauan Terakhir</h4>
            </div>
            {santriRecords.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Sparkles className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                Belum ada catatan pantauan. Mulai catat aktivitas ibadah ananda hari ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {santriRecords.slice(0, 7).map((rec) => {
                  const wiridCount = [rec.alWaqiah, rec.alMulk, rec.alInsyirah].filter(Boolean).length;
                  return (
                    <div key={rec.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                          {rec.timestamp.split(' ')[0]}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Wirid {wiridCount}/3
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.alWaqiah && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800">al-Waqi'ah</span>}
                        {rec.alMulk && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800">al-Mulk</span>}
                        {rec.alInsyirah && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800">al-Insyirah</span>}
                        {wiridCount === 0 && <span className="text-[10px] text-slate-400 italic">Belum ada wirid tercatat</span>}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {SHALAT_ITEMS.map((s) => (
                          <span key={s.key} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusBadgeClass(rec[s.key])}`}>
                            {s.label}: {rec[s.key]}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
