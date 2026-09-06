import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Santri, User, WiridYaumiyyahRecord } from '../types';
import { isStaffRole } from '../utils/roles';

const prayers = [['shubuh', 'Subuh'], ['dzuhur', 'Dzuhur'], ['ashar', 'Ashar'], ['maghrib', 'Maghrib'], ['isya', 'Isya']] as const;
const surahs = [['alWaqiah', 'Al-Waqi’ah'], ['alMulk', 'Al-Mulk'], ['alInsyirah', 'Al-Insyirah']] as const;
function localDate() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }

export function PantauanReport({ currentUser, santriList }: { currentUser: User; santriList: Santri[] }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(localDate);
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<WiridYaumiyyahRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const staff = isStaffRole(currentUser.role);
  useEffect(() => {
    if (!staff || !open || !date) return;
    setLoading(true); setError(''); setRecords([]);
    return onSnapshot(query(collection(db, 'wirid_yaumiyyah'), where('timestamp', '>=', date + ' 00:00'), where('timestamp', '<=', date + ' 23:59')), { includeMetadataChanges: true }, snap => {
      setRecords(snap.docs.map(d => ({ ...d.data(), id: d.id }) as WiridYaumiyyahRecord));
      setLoading(snap.metadata.fromCache);
    }, () => { setLoading(false); setError('Laporan belum dapat dimuat. Periksa koneksi atau izin akses.'); });
  }, [staff, open, date]);
  if (!staff) return null;
  const nameOf = (r: WiridYaumiyyahRecord) => santriList.find(s => s.idSantri === r.idSantri)?.namaSantri || r.namaSantri || r.idSantri;
  const filtered = records.filter(r => `${nameOf(r)} ${r.idSantri}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  return <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 min-w-0" aria-label="Laporan pantauan wali">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="min-h-11 w-full text-left flex justify-between items-center gap-3 font-bold text-emerald-950"><span>Laporan Pantauan Liburan dari Wali</span><span aria-hidden="true">{open ? '−' : '+'}</span></button>
    {open && <div className="space-y-4 mt-3">
      <p className="text-sm text-slate-500">Laporan hanya dapat dibaca oleh admin dan ustadz. Pengisian dilakukan oleh wali. Laporan tersimpan tetap dapat dilihat saat program OFF.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm font-semibold">Tanggal<input type="date" value={date} onChange={e => setDate(e.target.value)} className="block min-h-11 mt-1 w-full min-w-0 border rounded-xl px-3 bg-white" /></label>
        <label className="text-sm font-semibold">Cari santri<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nama atau ID santri" className="block min-h-11 mt-1 w-full min-w-0 border rounded-xl px-3 bg-white" /></label>
      </div>
      {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : !date ? <p className="text-sm">Pilih tanggal laporan.</p> : loading ? <p role="status" className="text-sm">Memuat laporan…</p> : <>
        <p className="text-sm text-slate-600">{filtered.length} catatan pada tanggal {date}.</p>
        {filtered.length === 0 && <p className="text-sm text-slate-500">Belum ada laporan yang sesuai. Tidak adanya laporan tidak berarti santri tidak melaksanakan ibadah.</p>}
        <div className="grid lg:grid-cols-2 gap-3">{filtered.map(r => <article key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 min-w-0">
          <div><h4 className="font-bold text-slate-900 break-words">{nameOf(r)}</h4><p className="text-xs text-slate-500">{r.idSantri}</p></div>
          <ul className="space-y-1 text-sm">{surahs.map(([key, label]) => <li key={key} className="flex justify-between gap-2"><span>{label}</span><span className={r[key] ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>{r[key] ? 'Sudah dibaca' : 'Belum dicentang'}</span></li>)}</ul>
          <dl className="border-t pt-2 space-y-1 text-sm">{prayers.map(([key, label]) => <div key={key} className="flex justify-between gap-2"><dt>{label}</dt><dd className="font-semibold">{r[key] || 'Belum diisi'}</dd></div>)}</dl>
        </article>)}</div>
      </>}
    </div>}
  </section>;
}
