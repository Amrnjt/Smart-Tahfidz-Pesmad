import type jsPDF from 'jspdf';
import type { AcademicReportSummary } from '../services/academicReportService';

type RGB = [number, number, number];

const C = {
  emerald: [4, 120, 87] as RGB,
  emeraldDark: [6, 78, 59] as RGB,
  emeraldLight: [236, 253, 245] as RGB,
  indigo: [79, 70, 229] as RGB,
  indigoLight: [238, 242, 255] as RGB,
  amber: [217, 119, 6] as RGB,
  amberLight: [254, 252, 232] as RGB,
  rose: [225, 29, 72] as RGB,
  roseLight: [255, 241, 242] as RGB,
  slate: [30, 41, 59] as RGB,
  slateMid: [71, 85, 105] as RGB,
  slateLight: [100, 116, 139] as RGB,
  slateBg: [248, 250, 252] as RGB,
  slateBorder: [226, 232, 240] as RGB,
  white: [255, 255, 255] as RGB,
};

function setFill(pdf: jsPDF, color: RGB) {
  pdf.setFillColor(...color);
}

function setText(pdf: jsPDF, color: RGB) {
  pdf.setTextColor(...color);
}

function setDraw(pdf: jsPDF, color: RGB) {
  pdf.setDrawColor(...color);
}

function qualityLabel(index: number | null): string {
  if (index === null) return 'Belum ada data';
  return `${index.toFixed(2)} / 4`;
}

function categoryLabel(type: string): string {
  if (type === 'Murojaah') return "Muroja'ah";
  if (type === 'Pembelajaran') return 'Pembelajaran/Materi';
  return type;
}

function formatDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function sanitizeFileName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function ensurePage(pdf: jsPDF, y: number, requiredHeight: number, margin: number): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + requiredHeight <= pageHeight - margin) return y;
  pdf.addPage();
  return margin;
}

function drawInfoBox(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
): void {
  setFill(pdf, C.slateBg);
  setDraw(pdf, C.slateBorder);
  pdf.roundedRect(x, y, width, 15, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  setText(pdf, C.slateLight);
  pdf.text(label.toUpperCase(), x + 3, y + 4);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  setText(pdf, C.slate);
  const lines = pdf.splitTextToSize(value || '-', width - 6);
  pdf.text(lines.slice(0, 2), x + 3, y + 9);
}

function drawMetricCard(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  value: string,
  label: string,
  bg: RGB,
  fg: RGB,
): void {
  setFill(pdf, bg);
  pdf.roundedRect(x, y, width, 18, 2, 2, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  setText(pdf, fg);
  pdf.text(value, x + width / 2, y + 8, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  setText(pdf, C.slateMid);
  pdf.text(label, x + width / 2, y + 14, { align: 'center' });
}

export async function downloadAcademicReportPdf(
  summary: AcademicReportSummary,
  generatedBy: string,
): Promise<void> {
  const { default: JsPDF } = await import('jspdf');
  const pdf = new JsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  setFill(pdf, C.emeraldDark);
  pdf.roundedRect(margin, y, contentWidth, 28, 3, 3, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  setText(pdf, C.white);
  pdf.text('REKAP AKADEMIK SMART TAHFIDZ', margin + 6, y + 9);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(summary.periodLabel, margin + 6, y + 15);
  pdf.text(`Rentang data: ${formatDate(summary.startDate)} - ${formatDate(summary.endDate)}`, margin + 6, y + 21);
  y += 34;

  // Identity
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setText(pdf, C.emeraldDark);
  pdf.text('IDENTITAS SANTRI', margin, y);
  y += 4;

  const gap = 3;
  const half = (contentWidth - gap) / 2;
  drawInfoBox(pdf, margin, y, half, 'Nama Santri', summary.santri.namaSantri);
  drawInfoBox(pdf, margin + half + gap, y, half, 'ID Santri', summary.santri.idSantri);
  y += 18;
  drawInfoBox(pdf, margin, y, half, 'Pendidikan Formal', `MTs · ${summary.formalClassLabel}`);
  drawInfoBox(pdf, margin + half + gap, y, half, "Kelas Al-Qur'an", summary.quranClassLabel);
  y += 18;
  drawInfoBox(pdf, margin, y, half, 'Status Akademik', summary.academicStatus);
  drawInfoBox(pdf, margin + half + gap, y, half, 'Target Hafalan', summary.santri.targetHafalan || '-');
  y += 22;

  // Main metrics
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setText(pdf, C.emeraldDark);
  pdf.text('RINGKASAN CAPAIAN', margin, y);
  y += 5;

  const cardGap = 3;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  drawMetricCard(pdf, margin, y, cardWidth, String(summary.totalSetoran), 'Total setoran', C.emeraldLight, C.emerald);
  drawMetricCard(pdf, margin + (cardWidth + cardGap), y, cardWidth, String(summary.activeDays), 'Hari aktif', C.indigoLight, C.indigo);
  drawMetricCard(pdf, margin + (cardWidth + cardGap) * 2, y, cardWidth, String(summary.totalZiyadahAyat), 'Ayat Ziyadah', C.amberLight, C.amber);
  drawMetricCard(pdf, margin + (cardWidth + cardGap) * 3, y, cardWidth, qualityLabel(summary.qualityIndex), 'Indeks kualitas', C.slateBg, C.slate);
  y += 24;

  // Category table
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setText(pdf, C.emeraldDark);
  pdf.text('REKAP PER JENIS', margin, y);
  y += 4;

  setFill(pdf, C.slateBg);
  setDraw(pdf, C.slateBorder);
  pdf.rect(margin, y, contentWidth, 9, 'FD');
  const cols = [0, 78, 118, contentWidth];
  const headers = ['Jenis', 'Jumlah', 'Indeks Kualitas'];
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setText(pdf, C.slate);
  headers.forEach((header, index) => {
    pdf.text(header, margin + cols[index] + 3, y + 5.7);
  });
  y += 9;

  pdf.setFont('helvetica', 'normal');
  summary.categories.forEach((category, index) => {
    setDraw(pdf, C.slateBorder);
    if (index % 2 === 1) {
      setFill(pdf, C.slateBg);
      pdf.rect(margin, y, contentWidth, 8, 'F');
    }
    setText(pdf, C.slate);
    pdf.setFontSize(8);
    pdf.text(categoryLabel(category.type), margin + 3, y + 5.3);
    pdf.text(String(category.count), margin + cols[1] + 3, y + 5.3);
    pdf.text(qualityLabel(category.qualityIndex), margin + cols[2] + 3, y + 5.3);
    y += 8;
  });
  y += 5;

  // Score distribution
  y = ensurePage(pdf, y, 42, margin);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setText(pdf, C.emeraldDark);
  pdf.text('DISTRIBUSI NILAI SETORAN', margin, y);
  y += 5;

  const nilaiRows: Array<[string, number, RGB, RGB]> = [
    ['Sangat Baik', summary.nilaiCounts['Sangat Baik'], C.emeraldLight, C.emerald],
    ['Baik', summary.nilaiCounts.Baik, C.indigoLight, C.indigo],
    ['Kurang', summary.nilaiCounts.Kurang, C.amberLight, C.amber],
    ['Mengulang', summary.nilaiCounts.Mengulang, C.roseLight, C.rose],
  ];

  nilaiRows.forEach(([label, count, bg, fg]) => {
    setFill(pdf, bg);
    pdf.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    setText(pdf, fg);
    pdf.text(label, margin + 3, y + 5.3);
    pdf.text(String(count), margin + contentWidth - 3, y + 5.3, { align: 'right' });
    y += 10;
  });

  // Activity excerpt
  y = ensurePage(pdf, y + 3, 46, margin);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setText(pdf, C.emeraldDark);
  pdf.text('AKTIVITAS TERBARU DALAM PERIODE', margin, y);
  y += 5;

  const recent = summary.records.slice(0, 20);
  if (recent.length === 0) {
    setFill(pdf, C.slateBg);
    pdf.roundedRect(margin, y, contentWidth, 14, 2, 2, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setText(pdf, C.slateMid);
    pdf.text('Belum ada setoran pada periode yang dipilih.', margin + 3, y + 8);
    y += 18;
  } else {
    recent.forEach((record, index) => {
      y = ensurePage(pdf, y, 12, margin);
      if (index % 2 === 1) {
        setFill(pdf, C.slateBg);
        pdf.rect(margin, y, contentWidth, 11, 'F');
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      setText(pdf, C.slate);
      pdf.text(`${formatDate(record.timestamp)} · ${categoryLabel(record.type)} · ${record.nilai}`, margin + 2, y + 4);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      setText(pdf, C.slateMid);
      const material = pdf.splitTextToSize(record.materi || '-', contentWidth - 4);
      pdf.text(material[0] || '-', margin + 2, y + 8.5);
      y += 11;
    });
  }

  y = ensurePage(pdf, y + 4, 24, margin);
  setDraw(pdf, C.slateBorder);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  setText(pdf, C.slateLight);
  pdf.text(
    'Catatan: Indeks Kualitas menggunakan skala internal 1-4 dari predikat Mengulang, Kurang, Baik, dan Sangat Baik; bukan nilai rapor sekolah formal.',
    margin,
    y,
    { maxWidth: contentWidth },
  );
  y += 8;
  pdf.text(`Dibuat oleh: ${generatedBy || 'Smart Tahfidz'} · Sumber: ${summary.source === 'server' ? 'Cloud Firestore' : 'Scoped cache'}`, margin, y);

  const safeName = sanitizeFileName(summary.santri.namaSantri) || summary.santri.idSantri;
  const safePeriod = summary.tahunPelajaran.replace('/', '-');
  const scope = summary.mode === 'year' ? 'Tahunan' : `Semester-${summary.semester}`;
  pdf.save(`Rekap-Akademik-${safeName}-${safePeriod}-${scope}.pdf`);
}
