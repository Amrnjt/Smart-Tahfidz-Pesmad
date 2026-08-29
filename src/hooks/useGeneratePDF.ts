import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import { ZiyadahRecord, MurojaahRecord, Santri, User } from '../types';
import { formatTanggalLengkap, parseDateSafe } from '../utils/dateFormatter';

export interface ReportOptions {
  includeIdentity: boolean;
  includeSummary: boolean;
  includeHistory: boolean;
  includeChart: boolean;
  includeNotes: boolean;
}

export interface ReportPeriod {
  month: number;
  year: number;
}

export interface ReportData {
  santri: Santri | null;
  currentUser: User;
  ziyadahRecords: ZiyadahRecord[];
  murojaahRecords: MurojaahRecord[];
  period: ReportPeriod;
  options: ReportOptions;
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Colors as RGB tuples for jsPDF
const C = {
  emerald: [4, 120, 87] as [number, number, number],
  emeraldDark: [6, 95, 70] as [number, number, number],
  emeraldLight: [236, 253, 245] as [number, number, number],
  teal: [13, 148, 136] as [number, number, number],
  tealLight: [240, 253, 250] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  amberLight: [254, 252, 232] as [number, number, number],
  rose: [225, 29, 72] as [number, number, number],
  roseLight: [254, 226, 226] as [number, number, number],
  sky: [37, 99, 235] as [number, number, number],
  skyLight: [239, 246, 255] as [number, number, number],
  slate: [30, 41, 59] as [number, number, number],
  slateMid: [71, 85, 105] as [number, number, number],
  slateLight: [100, 116, 139] as [number, number, number],
  slateBorder: [226, 232, 240] as [number, number, number],
  slateBg: [248, 250, 252] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function setFill(pdf: jsPDF, color: [number, number, number]) {
  pdf.setFillColor(color[0], color[1], color[2]);
}
function setText(pdf: jsPDF, color: [number, number, number]) {
  pdf.setTextColor(color[0], color[1], color[2]);
}
function setDraw(pdf: jsPDF, color: [number, number, number]) {
  pdf.setDrawColor(color[0], color[1], color[2]);
}

export function useGeneratePDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const generatePDF = useCallback(async (data: ReportData) => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;
      let y = margin;

      const periodPrefix = `${data.period.year}-${(data.period.month + 1).toString().padStart(2, '0')}`;

      const periodZiyadah = data.ziyadahRecords.filter(r => {
        const dp = r.timestamp.split(' ')[0] || r.timestamp;
        return dp.startsWith(periodPrefix);
      });
      const periodMurojaah = data.murojaahRecords.filter(r => {
        const dp = r.timestamp.split(' ')[0] || r.timestamp;
        return dp.startsWith(periodPrefix);
      });

      const totalAyatZiyadah = periodZiyadah.reduce((s, r) => s + Math.max(1, r.ayatAkhir - r.ayatAwal + 1), 0);
      const totalSurahZiyadah = new Set(periodZiyadah.map(r => r.surah)).size;
      const allPeriod = [...periodZiyadah, ...periodMurojaah];
      const sangatLancarCount = allPeriod.filter(r => r.nilai === 'Sangat Lancar').length;
      const lancarCount = allPeriod.filter(r => r.nilai === 'Lancar').length;
      const perluUlangCount = allPeriod.filter(r => r.nilai === 'Perlu Ulang').length;

      const santriName = data.santri?.namaSantri || data.currentUser.nama || 'Santri';

      // ── Header ──
      setFill(pdf, C.emerald);
      pdf.rect(0, 0, pageW, 4, 'F');
      y += 6;

      setText(pdf, C.emerald);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text("Laporan Mutaba'ah Hafalan Al-Qur'an", pageW / 2, y, { align: 'center' });
      y += 6;

      setText(pdf, C.slateLight);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Pesantren Madrasah Darul Fikri • MTsN 3 Bojonegoro', pageW / 2, y, { align: 'center' });
      y += 4;
      pdf.setFontSize(8);
      pdf.text('Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro', pageW / 2, y, { align: 'center' });
      y += 6;

      // Period badge
      setFill(pdf, C.emeraldLight);
      const badgeText = `Periode: ${NAMA_BULAN[data.period.month]} ${data.period.year}`;
      const badgeW = pdf.getTextWidth(badgeText) + 14;
      pdf.roundedRect((pageW - badgeW) / 2, y - 4, badgeW, 7, 2, 2, 'F');
      setText(pdf, C.emerald);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(badgeText, pageW / 2, y + 0.5, { align: 'center' });
      y += 10;

      setDraw(pdf, C.slateBorder);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageW - margin, y);
      y += 6;

      // ── Identitas Santri ──
      if (data.options.includeIdentity) {
        setText(pdf, C.emerald);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('Identitas Santri', margin, y);
        y += 2;
        setDraw(pdf, C.slateBorder);
        pdf.line(margin, y, pageW - margin, y);
        y += 5;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        setText(pdf, C.slate);

        const idRows: [string, string][] = [
          ['Nama', santriName],
          ['ID / NIS', data.santri?.idSantri || data.currentUser.idSantri || data.currentUser.username || '-'],
          ['Kelas / Halaqah', data.santri?.kelas || '-'],
          ['Target Hafalan', data.santri?.targetHafalan || '-'],
        ];
        if (data.santri?.waliNama) idRows.push(['Wali', data.santri.waliNama]);
        if (data.santri?.waliKontak) idRows.push(['Kontak Wali', data.santri.waliKontak]);

        idRows.forEach(([label, val]) => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${label}:`, margin, y);
          pdf.setFont('helvetica', 'normal');
          pdf.text(val, margin + 35, y);
          y += 5.5;
        });
        y += 4;
      }

      // ── Ringkasan ──
      if (data.options.includeSummary) {
        if (y > pageH - 60) { pdf.addPage(); y = margin; }

        setText(pdf, C.emerald);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('Ringkasan Hafalan Periode Ini', margin, y);
        y += 2;
        setDraw(pdf, C.slateBorder);
        pdf.line(margin, y, pageW - margin, y);
        y += 6;

        // 4 stat cards
        const cardW = (contentW - 9) / 4;
        const cardH = 18;
        const cards: { val: string; label: string; bg: [number, number, number]; fg: [number, number, number] }[] = [
          { val: String(periodZiyadah.length), label: 'Setoran Ziyadah', bg: C.emeraldLight, fg: C.emerald },
          { val: String(periodMurojaah.length), label: "Setoran Muroja'ah", bg: C.tealLight, fg: C.teal },
          { val: String(totalAyatZiyadah), label: 'Total Ayat Ziyadah', bg: C.amberLight, fg: C.amber },
          { val: String(totalSurahZiyadah), label: 'Surah Berbeda', bg: C.skyLight, fg: C.sky },
        ];

        cards.forEach((c, i) => {
          const x = margin + i * (cardW + 3);
          setFill(pdf, c.bg);
          pdf.roundedRect(x, y, cardW, cardH, 2, 2, 'F');
          setText(pdf, c.fg);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(16);
          pdf.text(c.val, x + cardW / 2, y + 8, { align: 'center' });
          setText(pdf, C.slateLight);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          pdf.text(c.label, x + cardW / 2, y + 13, { align: 'center' });
        });
        y += cardH + 5;

        // Distribusi nilai
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        const distItems: { label: string; count: number; bg: [number, number, number]; fg: [number, number, number] }[] = [
          { label: 'Sangat Lancar', count: sangatLancarCount, bg: C.emeraldLight, fg: C.emerald },
          { label: 'Lancar', count: lancarCount, bg: C.amberLight, fg: C.amber },
          { label: 'Perlu Ulang', count: perluUlangCount, bg: C.roseLight, fg: C.rose },
        ];
        let dx = margin;
        distItems.forEach(d => {
          const txt = `${d.label}: ${d.count}`;
          const tw = pdf.getTextWidth(txt) + 8;
          setFill(pdf, d.bg);
          pdf.roundedRect(dx, y - 4, tw, 6, 1.5, 1.5, 'F');
          setText(pdf, d.fg);
          pdf.setFont('helvetica', 'bold');
          pdf.text(txt, dx + 4, y);
          dx += tw + 3;
        });
        y += 8;
      }

      // ── Grafik ──
      if (data.options.includeChart && (periodZiyadah.length > 0 || periodMurojaah.length > 0)) {
        if (y > pageH - 60) { pdf.addPage(); y = margin; }

        setText(pdf, C.emerald);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('Grafik Progres Hafalan', margin, y);
        y += 2;
        setDraw(pdf, C.slateBorder);
        pdf.line(margin, y, pageW - margin, y);
        y += 6;

        const chartH = 45;
        setFill(pdf, C.slateBg);
        pdf.roundedRect(margin, y, contentW, chartH, 2, 2, 'F');

        const bars: { label: string; val: number; color: [number, number, number] }[] = [
          { label: `Ziyadah (${periodZiyadah.length})`, val: periodZiyadah.length, color: C.emerald },
          { label: `Muroja'ah (${periodMurojaah.length})`, val: periodMurojaah.length, color: C.teal },
          { label: `Sangat Lancar (${sangatLancarCount})`, val: sangatLancarCount, color: C.emeraldDark },
        ];
        const maxVal = Math.max(...bars.map(b => b.val), 1);
        const barW = (contentW - 20) / bars.length - 6;
        bars.forEach((b, i) => {
          const barH = (b.val / maxVal) * (chartH - 16);
          const bx = margin + 10 + i * (barW + 6);
          const by = y + chartH - 8 - barH;
          setFill(pdf, b.color);
          pdf.roundedRect(bx, by, barW, barH, 1.5, 1.5, 'F');
          setText(pdf, C.slateMid);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          pdf.text(b.label, bx + barW / 2, y + chartH - 3, { align: 'center' });
        });
        y += chartH + 6;
      }

      // ── Daftar Riwayat ──
      if (data.options.includeHistory) {
        if (y > pageH - 40) { pdf.addPage(); y = margin; }

        setText(pdf, C.emerald);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('Daftar Riwayat Setoran', margin, y);
        y += 2;
        setDraw(pdf, C.slateBorder);
        pdf.line(margin, y, pageW - margin, y);
        y += 5;

        const items = [
          ...periodZiyadah.map(z => ({ id: z.id, type: 'Ziyadah', ts: z.timestamp, materi: `${z.surah} (Ayat ${z.ayatAwal}-${z.ayatAkhir})`, nilai: z.nilai })),
          ...periodMurojaah.map(m => ({ id: m.id, type: "Muroja'ah", ts: m.timestamp, materi: m.surahAtauJuz, nilai: m.nilai })),
        ].sort((a, b) => parseDateSafe(b.ts).getTime() - parseDateSafe(a.ts).getTime());

        // Table header
        setFill(pdf, C.slateBg);
        pdf.rect(margin, y - 4, contentW, 6, 'F');
        setText(pdf, C.slate);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text('Tanggal', margin + 2, y);
        pdf.text('Jenis', margin + 60, y);
        pdf.text('Materi', margin + 85, y);
        pdf.text('Nilai', pageW - margin - 30, y);
        y += 4;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);

        if (items.length === 0) {
          setText(pdf, C.slateLight);
          pdf.text('Tidak ada setoran pada periode ini.', pageW / 2, y + 4, { align: 'center' });
          y += 10;
        } else {
          items.forEach((item, idx) => {
            if (y > pageH - 12) { pdf.addPage(); y = margin; }

            if (idx % 2 === 0) {
              setFill(pdf, C.slateBg);
              pdf.rect(margin, y - 4, contentW, 5.5, 'F');
            }

            setText(pdf, C.slate);
            const dateStr = formatTanggalLengkap(item.ts);
            const shortDate = dateStr.length > 28 ? dateStr.slice(0, 27) + '…' : dateStr;
            pdf.text(shortDate, margin + 2, y);

            setText(pdf, item.type === 'Ziyadah' ? C.emerald : C.teal);
            pdf.setFont('helvetica', 'bold');
            pdf.text(item.type, margin + 60, y);
            pdf.setFont('helvetica', 'normal');

            setText(pdf, C.slate);
            const materi = item.materi.length > 45 ? item.materi.slice(0, 44) + '…' : item.materi;
            pdf.text(materi, margin + 85, y);

            setText(pdf, item.nilai === 'Sangat Lancar' ? C.emerald : item.nilai === 'Lancar' ? C.amber : C.rose);
            pdf.text(item.nilai, pageW - margin - 30, y);

            y += 5.5;
          });
        }
        y += 4;
      }

      // ── Catatan ──
      if (data.options.includeNotes) {
        const allNotes = [...periodZiyadah, ...periodMurojaah]
          .filter(r => r.catatan && r.catatan.trim())
          .sort((a, b) => parseDateSafe(b.timestamp).getTime() - parseDateSafe(a.timestamp).getTime());

        if (allNotes.length > 0) {
          if (y > pageH - 40) { pdf.addPage(); y = margin; }

          setText(pdf, C.emerald);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(12);
          pdf.text('Catatan & Evaluasi dari Pengajar', margin, y);
          y += 2;
          setDraw(pdf, C.slateBorder);
          pdf.line(margin, y, pageW - margin, y);
          y += 5;

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);

          allNotes.forEach((r, idx) => {
            const materiStr = (r as any).surah
              ? `${(r as any).surah} (Ayat ${(r as any).ayatAwal}-${(r as any).ayatAkhir})`
              : (r as any).surahAtauJuz;
            const headerLine = `${formatTanggalLengkap(r.timestamp)} — ${materiStr}`;
            const noteLine = `"${r.catatan}"`;
            const byLine = `Oleh: ${r.inputBy}`;

            const wrappedNote = pdf.splitTextToSize(noteLine, contentW - 6);
            const blockH = 5 + (wrappedNote.length * 4) + 4;

            if (y + blockH > pageH - 15) { pdf.addPage(); y = margin; }

            setFill(pdf, C.slateBg);
            pdf.roundedRect(margin, y - 4, contentW, blockH, 1.5, 1.5, 'F');

            setText(pdf, C.slate);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.text(headerLine, margin + 3, y);
            y += 4;

            pdf.setFont('helvetica', 'normal');
            setText(pdf, C.slateMid);
            pdf.text(wrappedNote, margin + 3, y);
            y += wrappedNote.length * 4;

            setText(pdf, C.slateLight);
            pdf.setFontSize(7);
            pdf.text(byLine, margin + 3, y);
            y += blockH - 5 - (wrappedNote.length * 4);
          });
          y += 4;
        }
      }

      // ── Footer ──
      if (y > pageH - 30) { pdf.addPage(); y = margin; }
      y += 6;
      setDraw(pdf, C.slateBorder);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageW - margin, y);
      y += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      setText(pdf, C.slateLight);
      pdf.text(`Dicetak pada: ${formatTanggalLengkap(new Date())}`, margin, y);
      pdf.text('Sistem Mutaba\'ah Tahfidz Digital', margin, y + 4);

      pdf.text(`Pembimbing: ${data.currentUser.nama}`, pageW - margin, y, { align: 'right' });
      pdf.text('Tanda Tangan: _______________', pageW - margin, y + 4, { align: 'right' });

      // Save
      const cleanName = santriName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `Laporan_Hafalan_${cleanName}_${NAMA_BULAN[data.period.month]}_${data.period.year}.pdf`;
      pdf.save(fileName);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error:', err);
      setError('Gagal membuat PDF. Silakan coba kembali.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { isGenerating, error, success, generatePDF };
}

export { NAMA_BULAN };
