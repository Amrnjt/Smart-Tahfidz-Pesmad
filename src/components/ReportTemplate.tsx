import React from 'react';
import { ZiyadahRecord, MurojaahRecord, Santri, User } from '../types';
import { formatTanggalLengkap, parseDateSafe } from '../utils/dateFormatter';
import { ReportOptions, ReportPeriod, NAMA_BULAN } from '../hooks/useGeneratePDF';

interface ReportTemplateProps {
  santri: Santri | null;
  currentUser: User;
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  period: ReportPeriod;
  options: ReportOptions;
}

export const ReportTemplate: React.FC<ReportTemplateProps> = ({
  santri,
  currentUser,
  ziyadahRecords,
  murojaahRecords,
  period,
  options
}) => {
  const periodPrefix = `${period.year}-${(period.month + 1).toString().padStart(2, '0')}`;

  const periodZiyadah = ziyadahRecords.filter(r => {
    const datePart = r.timestamp.split(' ')[0] || r.timestamp;
    return datePart.startsWith(periodPrefix);
  });
  const periodMurojaah = murojaahRecords.filter(r => {
    const datePart = r.timestamp.split(' ')[0] || r.timestamp;
    return datePart.startsWith(periodPrefix);
  });

  const totalAyatZiyadah = periodZiyadah.reduce((sum, r) => sum + Math.max(1, r.ayatAkhir - r.ayatAwal + 1), 0);
  const totalSurahZiyadah = new Set(periodZiyadah.map(r => r.surah)).size;
  const sangatLancarCount = [...periodZiyadah, ...periodMurojaah].filter(r => r.nilai === 'Sangat Lancar').length;
  const lancarCount = [...periodZiyadah, ...periodMurojaah].filter(r => r.nilai === 'Lancar').length;
  const perluUlangCount = [...periodZiyadah, ...periodMurojaah].filter(r => r.nilai === 'Perlu Ulang').length;

  const allNotes = [...periodZiyadah, ...periodMurojaah]
    .filter(r => r.catatan && r.catatan.trim())
    .sort((a, b) => parseDateSafe(b.timestamp).getTime() - parseDateSafe(a.timestamp).getTime());

  return (
    <div
      style={{
        width: '800px',
        padding: '40px',
        backgroundColor: '#ffffff',
        fontFamily: 'Plus Jakarta Sans, Arial, sans-serif',
        color: '#1e293b',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '3px solid #047857', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#047857', margin: 0 }}>
          Laporan Mutaba'ah Hafalan Al-Qur'an
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Pesantren Madrasah Darul Fikri • MTsN 3 Bojonegoro
        </p>
        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
          Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro
        </p>
        <div style={{ marginTop: '10px', display: 'inline-block', padding: '4px 16px', backgroundColor: '#ecfdf5', borderRadius: '20px', border: '1px solid #a7f3d0' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#047857' }}>
            Periode: {NAMA_BULAN[period.month]} {period.year}
          </span>
        </div>
      </div>

      {/* Identitas Santri */}
      {options.includeIdentity && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#047857', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            Identitas Santri
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: '13px' }}>
            <div><strong>Nama:</strong> {santri?.namaSantri || currentUser.nama}</div>
            <div><strong>ID / NIS:</strong> {santri?.idSantri || currentUser.idSantri || currentUser.username}</div>
            <div><strong>Kelas / Halaqah:</strong> {santri?.kelas || '-'}</div>
            <div><strong>Target Hafalan:</strong> {santri?.targetHafalan || '-'}</div>
            {santri?.waliNama && <div><strong>Wali:</strong> {santri.waliNama}</div>}
            {santri?.waliKontak && <div><strong>Kontak Wali:</strong> {santri.waliKontak}</div>}
          </div>
        </div>
      )}

      {/* Ringkasan Total Hafalan */}
      {options.includeSummary && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#047857', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            Ringkasan Hafalan Periode Ini
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857' }}>{periodZiyadah.length}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Setoran Ziyadah</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f0fdfa', borderRadius: '10px', border: '1px solid #99f6e4', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#0d9488' }}>{periodMurojaah.length}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Setoran Muroja'ah</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#fefce8', borderRadius: '10px', border: '1px solid #fde68a', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#d97706' }}>{totalAyatZiyadah}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Total Ayat Ziyadah</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb' }}>{totalSurahZiyadah}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Surah Berbeda</div>
            </div>
          </div>

          {/* Distribusi Nilai */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '12px', fontSize: '12px' }}>
            <div style={{ padding: '6px 12px', backgroundColor: '#d1fae5', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
              <strong style={{ color: '#047857' }}>Sangat Lancar:</strong> {sangatLancarCount}
            </div>
            <div style={{ padding: '6px 12px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
              <strong style={{ color: '#b45309' }}>Lancar:</strong> {lancarCount}
            </div>
            <div style={{ padding: '6px 12px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
              <strong style={{ color: '#dc2626' }}>Perlu Ulang:</strong> {perluUlangCount}
            </div>
          </div>
        </div>
      )}

      {/* Grafik Progres */}
      {options.includeChart && (periodZiyadah.length > 0 || periodMurojaah.length > 0) && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#047857', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            Grafik Progres Hafalan
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '100%',
                height: `${Math.min(100, periodZiyadah.length * 12)}px`,
                backgroundColor: '#059669',
                borderRadius: '6px 6px 0 0',
                minHeight: '4px'
              }} />
              <span style={{ fontSize: '10px', marginTop: '4px', color: '#64748b' }}>Ziyadah ({periodZiyadah.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '100%',
                height: `${Math.min(100, periodMurojaah.length * 12)}px`,
                backgroundColor: '#0d9488',
                borderRadius: '6px 6px 0 0',
                minHeight: '4px'
              }} />
              <span style={{ fontSize: '10px', marginTop: '4px', color: '#64748b' }}>Muroja'ah ({periodMurojaah.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: '100%',
                height: `${Math.min(100, sangatLancarCount * 12)}px`,
                backgroundColor: '#047857',
                borderRadius: '6px 6px 0 0',
                minHeight: '4px'
              }} />
              <span style={{ fontSize: '10px', marginTop: '4px', color: '#64748b' }}>Sangat Lancar ({sangatLancarCount})</span>
            </div>
          </div>
        </div>
      )}

      {/* Daftar Riwayat Setoran */}
      {options.includeHistory && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#047857', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            Daftar Riwayat Setoran
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 700 }}>Tanggal</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 700 }}>Jenis</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 700 }}>Materi</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 700 }}>Nilai</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const items = [
                  ...periodZiyadah.map(z => ({ id: z.id, type: 'Ziyadah', timestamp: z.timestamp, materi: `${z.surah} (Ayat ${z.ayatAwal}-${z.ayatAkhir})`, nilai: z.nilai })),
                  ...periodMurojaah.map(m => ({ id: m.id, type: "Muroja'ah", timestamp: m.timestamp, materi: m.surahAtauJuz, nilai: m.nilai })),
                ].sort((a, b) => parseDateSafe(b.timestamp).getTime() - parseDateSafe(a.timestamp).getTime());

                if (items.length === 0) {
                  return (
                    <tr>
                      <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
                        Tidak ada setoran pada periode ini.
                      </td>
                    </tr>
                  );
                }
                return items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 8px' }}>{formatTanggalLengkap(item.timestamp)}</td>
                    <td style={{ padding: '6px 8px' }}>{item.type}</td>
                    <td style={{ padding: '6px 8px' }}>{item.materi}</td>
                    <td style={{ padding: '6px 8px' }}>{item.nilai}</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* Catatan Ustadz */}
      {options.includeNotes && allNotes.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#047857', marginBottom: '10px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
            Catatan & Evaluasi dari Pengajar
          </h2>
          {allNotes.map((r, idx) => (
            <div key={idx} style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '6px', fontSize: '12px' }}>
              <div style={{ fontWeight: 600, color: '#334155' }}>
                {formatTanggalLengkap(r.timestamp)} — {(r as any).surah ? `${(r as any).surah} (Ayat ${(r as any).ayatAwal}-${(r as any).ayatAkhir})` : (r as any).surahAtauJuz}
              </div>
              <div style={{ color: '#475569', marginTop: '2px' }}>"{r.catatan}"</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Oleh: {r.inputBy}</div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
        <div>
          <p style={{ margin: 0 }}>Dicetak pada: {formatTanggalLengkap(new Date())}</p>
          <p style={{ margin: '2px 0 0 0' }}>Sistem Mutaba'ah Tahfidz Digital</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0 }}>Pembimbing: {currentUser.nama}</p>
          <p style={{ margin: '2px 0 0 0' }}>Tanda Tangan: _______________</p>
        </div>
      </div>
    </div>
  );
};
