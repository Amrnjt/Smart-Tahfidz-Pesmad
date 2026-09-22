import type jsPDF from 'jspdf';
import type { CollectiveAcademicReportSummary } from '../services/collectiveAcademicReportService';

type RGB = [number, number, number];

const C = {
  emerald: [4, 120, 87] as RGB,
  emeraldDark: [6, 78, 59] as RGB,
  emeraldLight: [236, 253, 245] as RGB,
  indigo: [79, 70, 229] as RGB,
  indigoLight: [238, 242, 255] as RGB,
  amber: [217, 119, 6] as RGB,
  amberLight: [254, 252, 232] as RGB,
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

function qualityLabel(value: number | null): string {
  return value === null ? '—' : value.toFixed(2);
}

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function safeFileName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function drawMetric(
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
  pdf.roundedRect(x, y, width, 17, 2, 2, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  setText(pdf, fg);
  pdf.text(value, x + width / 2, y + 7.5, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  setText(pdf, C.slateMid);
  pdf.text(label, x + width / 2, y + 13, { align: 'center' });
}

function drawTableHeader(
  pdf: jsPDF,
  x: number,
  y: number,
  widths: number[],
): void {
  const labels = [
    'No.',
    'Nama Santri',
    "Kelas Al-Qur'an",
    'Status',
    'Ziy.',
    "Mur.",
    'Bdz.',
    'Materi',
    'Total',
    'Hari',
    'Ayat',
    'Indeks',
  ];
  setFill(pdf, C.emeraldDark);
  pdf.rect(x, y, widths.reduce((sum, width) => sum + width, 0), 8, 'F');

  let currentX = x;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  setText(pdf, C.white);
  labels.forEach((label, index) => {
    pdf.text(label, currentX + 1.5, y + 5.2);
    currentX += widths[index];
  });
}

export async function downloadCollectiveAcademicReportPdf(
  summary: CollectiveAcademicReportSummary,
  generatedBy: string,
): Promise<void> {
  const { default: JsPDF } = await import('jspdf');
  const pdf = new JsPDF('l', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  setFill(pdf, C.emeraldDark);
  pdf.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  setText(pdf, C.white);
  pdf.text('REKAP KOLEKTIF SMART TAHFIDZ', margin + 6, y + 8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(
    `MTs · Kelas ${summary.kelasFormal} · ${summary.periodLabel}`,
    margin + 6,
    y + 14,
  );
  pdf.text(
    `Rentang: ${formatDate(summary.range.startDate)} - ${formatDate(summary.range.endDate)}`,
    margin + 6,
    y + 20,
  );
  y += 31;

  const gap = 3;
  const metricWidth = (contentWidth - gap * 4) / 5;
  drawMetric(pdf, margin, y, metricWidth, String(summary.totalSantri), 'Santri terdaftar', C.emeraldLight, C.emerald);
  drawMetric(pdf, margin + (metricWidth + gap), y, metricWidth, String(summary.santriAktifSetoran), 'Aktif setor', C.indigoLight, C.indigo);
  drawMetric(pdf, margin + (metricWidth + gap) * 2, y, metricWidth, String(summary.totalSetoran), 'Total setoran', C.slateBg, C.slate);
  drawMetric(pdf, margin + (metricWidth + gap) * 3, y, metricWidth, String(summary.totalZiyadahAyat), 'Ayat Ziyadah', C.amberLight, C.amber);
  drawMetric(pdf, margin + (metricWidth + gap) * 4, y, metricWidth, qualityLabel(summary.qualityIndex), 'Indeks kualitas', C.slateBg, C.slate);
  y += 23;

  const widths = [10, 42, 35, 21, 13, 13, 13, 15, 14, 13, 14, 16];
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);
  if (tableWidth > contentWidth) {
    throw new Error('Lebar tabel rekap kolektif melebihi area PDF.');
  }

  drawTableHeader(pdf, margin, y, widths);
  y += 8;

  const drawHeaderIfNeeded = () => {
    if (y + 8 <= pageHeight - margin) return;
    pdf.addPage();
    y = margin;
    drawTableHeader(pdf, margin, y, widths);
    y += 8;
  };

  if (summary.students.length === 0) {
    setFill(pdf, C.slateBg);
    pdf.rect(margin, y, tableWidth, 12, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setText(pdf, C.slateMid);
    pdf.text('Tidak ada santri dengan snapshot kelas pada periode terpilih.', margin + 3, y + 7.5);
    y += 12;
  } else {
    summary.students.forEach((student, index) => {
      drawHeaderIfNeeded();

      const rowHeight = 9;
      if (index % 2 === 1) {
        setFill(pdf, C.slateBg);
        pdf.rect(margin, y, tableWidth, rowHeight, 'F');
      }
      setDraw(pdf, C.slateBorder);
      pdf.line(margin, y + rowHeight, margin + tableWidth, y + rowHeight);

      const cells = [
        String(index + 1),
        student.namaSantri,
        student.kelasAlQuran,
        student.academicStatus,
        String(student.ziyadahCount),
        String(student.murojaahCount),
        String(student.binnadzorCount),
        String(student.pembelajaranCount),
        String(student.totalSetoran),
        String(student.activeDays),
        String(student.totalZiyadahAyat),
        qualityLabel(student.qualityIndex),
      ];

      let currentX = margin;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.5);
      setText(pdf, C.slate);
      cells.forEach((cell, cellIndex) => {
        const maxWidth = widths[cellIndex] - 3;
        const text = pdf.splitTextToSize(cell || '—', maxWidth)[0] || '—';
        pdf.text(text, currentX + 1.5, y + 5.7);
        currentX += widths[cellIndex];
      });

      y += rowHeight;
    });
  }

  y += 5;
  if (y + 24 > pageHeight - margin) {
    pdf.addPage();
    y = margin;
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setText(pdf, C.slate);
  pdf.text('Distribusi Nilai Setoran', margin, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  setText(pdf, C.slateMid);
  pdf.text(
    `Sangat Baik: ${summary.nilaiCounts['Sangat Baik']} · Baik: ${summary.nilaiCounts.Baik} · Kurang: ${summary.nilaiCounts.Kurang} · Mengulang: ${summary.nilaiCounts.Mengulang}`,
    margin,
    y,
  );
  y += 6;

  pdf.text(
    'Catatan: Indeks Kualitas adalah skala internal 1–4 dari predikat setoran, bukan nilai rapor sekolah formal.',
    margin,
    y,
  );
  y += 5;
  pdf.text(
    `Dibuat oleh: ${generatedBy || 'Smart Tahfidz'} · Sumber: ${summary.source === 'server' ? 'Cloud Firestore' : 'Scoped cache'}`,
    margin,
    y,
  );

  const scope = summary.mode === 'year'
    ? 'Tahunan'
    : `Semester-${summary.semester || 'Ganjil'}`;
  const filename = [
    'Rekap-Kolektif',
    'MTs',
    `Kelas-${summary.kelasFormal}`,
    summary.tahunPelajaran.replace('/', '-'),
    scope,
  ].map(safeFileName).filter(Boolean).join('-');

  pdf.save(`${filename}.pdf`);
}
