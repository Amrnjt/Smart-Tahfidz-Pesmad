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

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Colors as RGB tuples for jsPDF — Islamic/academic tones
const C = {
  emerald: [4, 120, 87] as [number, number, number],
  emeraldDark: [6, 78, 59] as [number, number, number],
  emeraldDeep: [4, 47, 35] as [number, number, number],
  emeraldLight: [236, 253, 245] as [number, number, number],
  emeraldMid: [5, 102, 75] as [number, number, number],
  teal: [13, 148, 136] as [number, number, number],
  tealLight: [240, 253, 250] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  amberLight: [254, 252, 232] as [number, number, number],
  gold: [212, 175, 55] as [number, number, number],
  goldLight: [240, 215, 124] as [number, number, number],
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

function setFill(pdf: jsPDF, c: [number, number, number]) { pdf.setFillColor(c[0], c[1], c[2]); }
function setText(pdf: jsPDF, c: [number, number, number]) { pdf.setTextColor(c[0], c[1], c[2]); }
function setDraw(pdf: jsPDF, c: [number, number, number]) { pdf.setDrawColor(c[0], c[1], c[2]); }

function drawSectionHeader(pdf: jsPDF, title: string, margin: number, contentW: number, y: number): number {
  // Icon box
  setFill(pdf, C.emerald);
  pdf.roundedRect(margin, y - 4.5, 6, 6, 1, 1, 'F');
  // Title text
  setText(pdf, C.emeraldDeep);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(title.toUpperCase(), margin + 8, y - 0.5);
  // Underline
  setDraw(pdf, C.emerald);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y + 1, margin + contentW, y + 1);
  return y + 5;
}

function drawInfoCard(pdf: jsPDF, label: string, value: string, x: number, y: number, w: number, h: number): void {
  setFill(pdf, C.slateBg);
  pdf.roundedRect(x, y, w, h, 1.5, 1.5, 'F');
  setDraw(pdf, C.slateBorder);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(x, y, w, h, 1.5, 1.5, 'S');

  setText(pdf, C.slateLight);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text(label.toUpperCase(), x + 3, y + 4);

  setText(pdf, C.slate);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  const valStr = value.length > 28 ? value.slice(0, 27) + '…' : value;
  pdf.text(valStr, x + 3, y + 9);
}

function drawStatCard(pdf: jsPDF, value: number, label: string, x: number, y: number, w: number, h: number, bg: [number, number, number], fg: [number, number, number]): void {
  setFill(pdf, bg);
  pdf.roundedRect(x, y, w, h, 2, 2, 'F');

  setText(pdf, fg);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(String(value), x + w / 2, y + 8, { align: 'center' });

  setText(pdf, C.slateLight);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  const labelLines = pdf.splitTextToSize(label, w - 4);
  pdf.text(labelLines, x + w / 2, y + 13, { align: 'center' });
}

function drawNilaiBadge(pdf: jsPDF, nilai: string, x: number, y: number): number {
  let bg = C.roseLight, fg = C.rose, label = 'Perlu Ulang';
  if (nilai === 'Sangat Lancar') { bg = C.emeraldLight; fg = C.emerald; label = 'Sangat Lancar'; }
  else if (nilai === 'Lancar') { bg = C.amberLight; fg = C.amber; label = 'Lancar'; }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  const tw = pdf.getTextWidth(label) + 4;
  setFill(pdf, bg);
  pdf.roundedRect(x, y - 3, tw, 5, 1, 1, 'F');
  setText(pdf, fg);
  pdf.text(label, x + 2, y + 0.5);
  return tw;
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
      const margin = 14;
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
      const totalSetoran = allPeriod.length;

      const santriName = data.santri?.namaSantri || data.currentUser.nama || 'Santri';
      const santriId = data.santri?.idSantri || data.currentUser.idSantri || data.currentUser.username || '-';
      const santriKelas = data.santri?.kelas || '-';
      const santriTarget = data.santri?.targetHafalan || '-';

      // ════════ HEADER ════════
      // Gradient-like header with deep emerald background
      setFill(pdf, C.emeraldDeep);
      pdf.roundedRect(margin, y, contentW, 28, 2, 2, 'F');

      // Gold accent line at bottom of header
      setFill(pdf, C.gold);
      pdf.roundedRect(margin, y + 27, contentW, 1.2, 0, 0, 'F');

      // Logo placeholder box
      setFill(pdf, [255, 255, 255]);
      pdf.setGState(pdf.GState({ opacity: 0.15 }));
      pdf.roundedRect(margin + 4, y + 5, 14, 18, 1.5, 1.5, 'F');
      pdf.setGState(pdf.GState({ opacity: 1 }));

      setFill(pdf, C.emerald);
      pdf.roundedRect(margin + 6, y + 7, 10, 14, 1, 1, 'F');
      setText(pdf, C.goldLight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Q', margin + 11, y + 15, { align: 'center' });

      // Title
      setText(pdf, C.white);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.text("Laporan Pantauan Pembelajaran Tahfidz", margin + 22, y + 10);

      setText(pdf, C.goldLight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Pesantren Madrasah Darul Fikri  •  MTsN 3 Bojonegoro', margin + 22, y + 14);

      setText(pdf, [167, 243, 208]);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.text('Jl. Budi Utomo No. 190 Kepohbaru Bojonegoro', margin + 22, y + 17.5);

      // Period badge (right side)
      setFill(pdf, [255, 255, 255]);
      pdf.setGState(pdf.GState({ opacity: 0.12 }));
      pdf.roundedRect(margin + contentW - 32, y + 4, 28, 20, 1.5, 1.5, 'F');
      pdf.setGState(pdf.GState({ opacity: 1 }));

      setText(pdf, C.goldLight);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text('PERIODE', margin + contentW - 18, y + 8, { align: 'center' });
      setText(pdf, C.white);
      pdf.setFontSize(12);
      pdf.text(NAMA_BULAN[data.period.month], margin + contentW - 18, y + 13, { align: 'center' });
      setText(pdf, C.goldLight);
      pdf.setFontSize(9);
      pdf.text(String(data.period.year), margin + contentW - 18, y + 18, { align: 'center' });

      y += 33;

      // ════════ IDENTITAS SANTRI ════════
      if (data.options.includeIdentity) {
        y = drawSectionHeader(pdf, 'Identitas Santri', margin, contentW, y);

        const cards: [string, string][] = [
          ['Nama Santri', santriName],
          ['ID / NIS', santriId],
          ['Kelas / Halaqah', santriKelas],
          ['Target Hafalan', santriTarget],
        ];
        if (data.santri?.waliNama) cards.push(['Wali', data.santri.waliNama]);
        if (data.santri?.waliKontak) cards.push(['Kontak Wali', data.santri.waliKontak]);

        const cardsPerRow = 3;
        const cardW = (contentW - (cardsPerRow - 1) * 3) / cardsPerRow;
        const cardH = 13;
        cards.forEach((card, i) => {
          const col = i % cardsPerRow;
          const row = Math.floor(i / cardsPerRow);
          drawInfoCard(pdf, card[0], card[1], margin + col * (cardW + 3), y + row * (cardH + 2.5), cardW, cardH);
        });
        y += Math.ceil(cards.length / cardsPerRow) * (cardH + 2.5) + 3;
      }

      // ════════ RINGKASAN PROGRES HAFALAN ════════
      if (data.options.includeSummary) {
        if (y > pageH - 60) { pdf.addPage(); y = margin; }
        y = drawSectionHeader(pdf, 'Ringkasan Progres Hafalan', margin, contentW, y);

        const statCardW = (contentW - 9) / 4;
        const statCardH = 18;
        drawStatCard(pdf, periodZiyadah.length, 'Setoran Ziyadah', margin, y, statCardW, statCardH, C.emeraldLight, C.emerald);
        drawStatCard(pdf, periodMurojaah.length, "Setoran Muroja'ah", margin + statCardW + 3, y, statCardW, statCardH, C.tealLight, C.teal);
        drawStatCard(pdf, totalAyatZiyadah, 'Total Ayat Ziyadah', margin + (statCardW + 3) * 2, y, statCardW, statCardH, C.amberLight, C.amber);
        drawStatCard(pdf, totalSurahZiyadah, 'Surah Berbeda', margin + (statCardW + 3) * 3, y, statCardW, statCardH, C.skyLight, C.sky);
        y += statCardH + 4;

        // Distribusi nilai badges
        setText(pdf, C.slateLight);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text('DISTRIBUSI NILAI:', margin, y);

        const distItems: [string, number, [number, number, number], [number, number, number]][] = [
          ['Sangat Lancar', sangatLancarCount, C.emeraldLight, C.emerald],
          ['Lancar', lancarCount, C.amberLight, C.amber],
          ['Perlu Ulang', perluUlangCount, C.roseLight, C.rose],
          ['Total', totalSetoran, C.slateBg, C.slateMid],
        ];
        let dx = margin + 28;
        distItems.forEach(d => {
          const txt = `${d[0]}: ${d[1]}`;
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          const tw = pdf.getTextWidth(txt) + 5;
          setFill(pdf, d[2]);
          pdf.roundedRect(dx, y - 3.5, tw, 5.5, 1, 1, 'F');
          setText(pdf, d[3]);
          pdf.text(txt, dx + 2.5, y + 0.5);
          dx += tw + 2.5;
        });
        y += 8;
      }

      // ════════ GRAFIK PROGRES ════════
      if (data.options.includeChart && (periodZiyadah.length > 0 || periodMurojaah.length > 0)) {
        if (y > pageH - 55) { pdf.addPage(); y = margin; }
        y = drawSectionHeader(pdf, 'Grafik Progres Hafalan', margin, contentW, y);

        const chartH = 38;
        setFill(pdf, C.slateBg);
        pdf.roundedRect(margin, y, contentW, chartH, 2, 2, 'F');

        const bars: [string, number, [number, number, number]][] = [
          ['Ziyadah', periodZiyadah.length, C.emerald],
          ["Muroja'ah", periodMurojaah.length, C.teal],
          ['S. Lancar', sangatLancarCount, C.emeraldDark],
          ['Lancar', lancarCount, C.amber],
          ['Perlu Ulang', perluUlangCount, C.rose],
        ];
        const maxVal = Math.max(...bars.map(b => b[1]), 1);
        const barSlotW = contentW / bars.length;
        const barW = barSlotW * 0.5;

        bars.forEach((b, i) => {
          const barH = (b[1] / maxVal) * (chartH - 14);
          const bx = margin + i * barSlotW + (barSlotW - barW) / 2;
          const by = y + chartH - 7 - barH;

          setFill(pdf, b[2]);
          pdf.roundedRect(bx, by, barW, barH, 1, 1, 'F');

          setText(pdf, C.slate);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.text(String(b[1]), bx + barW / 2, by - 1.5, { align: 'center' });

          setText(pdf, C.slateLight);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6.5);
          pdf.text(b[0], bx + barSlotW / 2, y + chartH - 2.5, { align: 'center' });
        });
        y += chartH + 5;
      }

      // ════════ DAFTAR RIWAYAT SETORAN ════════
      if (data.options.includeHistory) {
        if (y > pageH - 40) { pdf.addPage(); y = margin; }
        y = drawSectionHeader(pdf, 'Daftar Riwayat Setoran', margin, contentW, y);

        const items = [
          ...periodZiyadah.map(z => ({ id: z.id, type: 'Ziyadah', ts: z.timestamp, materi: `${z.surah} (Ayat ${z.ayatAwal}-${z.ayatAkhir})`, nilai: z.nilai })),
          ...periodMurojaah.map(m => ({ id: m.id, type: "Muroja'ah", ts: m.timestamp, materi: m.surahAtauJuz, nilai: m.nilai })),
        ].sort((a, b) => parseDateSafe(b.ts).getTime() - parseDateSafe(a.ts).getTime());

        // Table header
        setFill(pdf, C.emerald);
        pdf.roundedRect(margin, y - 4, contentW, 6.5, 1, 1, 'F');
        setText(pdf, C.white);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.text('TANGGAL', margin + 2, y);
        pdf.text('JENIS', margin + 62, y);
        pdf.text('MATERI HAFALAN', margin + 88, y);
        pdf.text('NILAI', pageW - margin - 22, y);
        y += 5;

        pdf.setFontSize(7.5);
        const maxRows = Math.min(items.length, 15);
        if (items.length === 0) {
          setText(pdf, C.slateLight);
          pdf.setFont('helvetica', 'normal');
          pdf.text('Tidak ada setoran pada periode ini.', pageW / 2, y + 3, { align: 'center' });
          y += 8;
        } else {
          for (let idx = 0; idx < maxRows; idx++) {
            const item = items[idx];
            if (y > pageH - 15) { pdf.addPage(); y = margin; }

            if (idx % 2 === 0) {
              setFill(pdf, C.slateBg);
              pdf.rect(margin, y - 3.5, contentW, 5.5, 'F');
            }

            setText(pdf, C.slate);
            pdf.setFont('helvetica', 'normal');
            const dateStr = formatTanggalLengkap(item.ts);
            const shortDate = dateStr.length > 26 ? dateStr.slice(0, 25) + '…' : dateStr;
            pdf.text(shortDate, margin + 2, y);

            setText(pdf, item.type === 'Ziyadah' ? C.emerald : C.teal);
            pdf.setFont('helvetica', 'bold');
            pdf.text(item.type, margin + 62, y);

            setText(pdf, C.slate);
            pdf.setFont('helvetica', 'normal');
            const materi = item.materi.length > 42 ? item.materi.slice(0, 41) + '…' : item.materi;
            pdf.text(materi, margin + 88, y);

            drawNilaiBadge(pdf, item.nilai, pageW - margin - 22, y);
            y += 5.5;
          }
          if (items.length > maxRows) {
            setText(pdf, C.slateLight);
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(7);
            pdf.text(`Menampilkan ${maxRows} dari ${items.length} setoran pada periode ini.`, pageW / 2, y + 1, { align: 'center' });
            y += 5;
          }
        }
        y += 3;
      }

      // ════════ CATATAN & EVALUASI ════════
      if (data.options.includeNotes) {
        const allNotes = allPeriod
          .filter(r => r.catatan && r.catatan.trim())
          .sort((a, b) => parseDateSafe(b.timestamp).getTime() - parseDateSafe(a.timestamp).getTime());

        if (allNotes.length > 0) {
          if (y > pageH - 35) { pdf.addPage(); y = margin; }
          y = drawSectionHeader(pdf, 'Catatan & Evaluasi dari Pengajar', margin, contentW, y);

          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          const maxNotes = Math.min(allNotes.length, 6);
          for (let idx = 0; idx < maxNotes; idx++) {
            const r = allNotes[idx];
            const materiStr = (r as any).surah
              ? `${(r as any).surah} (Ayat ${(r as any).ayatAwal}-${(r as any).ayatAkhir})`
              : (r as any).surahAtauJuz;
            const headerLine = `${formatTanggalLengkap(r.timestamp)} — ${materiStr}`;
            const noteLine = `"${r.catatan}"`;
            const byLine = `— ${r.inputBy}`;

            const wrappedNote = pdf.splitTextToSize(noteLine, contentW - 8);
            const blockH = 5 + wrappedNote.length * 3.5 + 4;

            if (y + blockH > pageH - 15) { pdf.addPage(); y = margin; }

            setFill(pdf, C.slateBg);
            pdf.roundedRect(margin, y - 3.5, contentW, blockH, 1.5, 1.5, 'F');

            setText(pdf, C.emerald);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7.5);
            const headerShort = headerLine.length > 65 ? headerLine.slice(0, 64) + '…' : headerLine;
            pdf.text(headerShort, margin + 3, y);

            pdf.setFont('helvetica', 'normal');
            setText(pdf, C.slateMid);
            pdf.setFontSize(8);
            pdf.text(wrappedNote, margin + 3, y + 4);

            setText(pdf, C.slateLight);
            pdf.setFontSize(7);
            pdf.text(byLine, margin + 3, y + 4 + wrappedNote.length * 3.5);

            y += blockH + 2.5;
          }
          y += 2;
        }
      }

      // ════════ KESIMPULAN ════════
      if (y > pageH - 30) { pdf.addPage(); y = margin; }
      y = drawSectionHeader(pdf, 'Kesimpulan & Rekomendasi', margin, contentW, y);

      setFill(pdf, C.emeraldLight);
      pdf.roundedRect(margin, y - 3.5, contentW, 14, 1.5, 1.5, 'F');

      setText(pdf, C.slate);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      let conclusion = `Pada periode ${NAMA_BULAN[data.period.month]} ${data.period.year}, santri ${santriName} telah menyelesaikan ${periodZiyadah.length} setoran Ziyadah (${totalAyatZiyadah} ayat dari ${totalSurahZiyadah} surah berbeda) dan ${periodMurojaah.length} setoran Muroja'ah.`;
      if (sangatLancarCount > 0) conclusion += ` Sebanyak ${sangatLancarCount} setoran bernilai "Sangat Lancar".`;
      if (perluUlangCount > 0) conclusion += ` Terdapat ${perluUlangCount} setoran yang perlu diulang.`;
      conclusion += " Semoga Allah Tabaraka wa Ta'ala memudahkan hafalan dan istiqamah santri. Aamiin.";

      const wrappedConclusion = pdf.splitTextToSize(conclusion, contentW - 8);
      pdf.text(wrappedConclusion, margin + 4, y + 1.5);
      y += 16;

      // ════════ FOOTER ════════
      if (y > pageH - 25) { pdf.addPage(); y = margin; }
      y += 4;
      setDraw(pdf, C.emerald);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageW - margin, y);
      y += 5;

      setText(pdf, C.slateLight);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(`Dicetak pada: ${formatTanggalLengkap(new Date())}`, margin, y);
      pdf.text("Sistem Mutaba'ah Tahfidz Digital  •  Pesantren Madrasah Darul Fikri", margin, y + 3.5);

      // Signature block (right side)
      setText(pdf, C.slateMid);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text('Pembimbing Tahfidz', pageW - margin, y, { align: 'right' });
      setDraw(pdf, C.slateBorder);
      pdf.setLineWidth(0.3);
      pdf.line(pageW - margin - 40, y + 8, pageW - margin, y + 8);
      setText(pdf, C.slate);
      pdf.text(data.currentUser.nama, pageW - margin - 20, y + 12, { align: 'center' });

      // Page number
      setText(pdf, C.slateLight);
      pdf.setFontSize(6.5);
      pdf.text('Halaman 1', pageW / 2, pageH - 5, { align: 'center' });

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
