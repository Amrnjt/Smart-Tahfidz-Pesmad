import { useRef, useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
  month: number; // 0-11
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

export function useGeneratePDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  const generatePDF = useCallback(async (data: ReportData, renderedTemplate: HTMLElement) => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      const canvas = await html2canvas(renderedTemplate, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const santriName = (data.santri?.namaSantri || data.currentUser.nama || 'Santri')
        .replace(/[^a-zA-Z0-9]/g, '_');
      const monthName = NAMA_BULAN[data.period.month];
      const fileName = `Laporan_Hafalan_${santriName}_${monthName}_${data.period.year}.pdf`;

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

  return { isGenerating, error, success, generatePDF, templateRef };
}

export { NAMA_BULAN };
