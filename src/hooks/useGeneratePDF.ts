import { useState, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ZiyadahRecord, MurojaahRecord, Santri, User } from '../types';

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

export function useGeneratePDF() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDF = useCallback(async (data: ReportData) => {
    setIsGenerating(true);
    setError(null);
    setSuccess(false);

    try {
      // Wait for the hidden report component to render
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = reportRef.current;
      if (!element) {
        throw new Error('Report element not found');
      }

      // Capture the styled React component at high DPI
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions to fit A4 with margins
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

      // If content fits on one page, add it; otherwise paginate
      if (imgH <= pageH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
      } else {
        // Multi-page: slice the canvas across pages
        let remainingHeight = imgH;
        let position = 0;

        while (remainingHeight > 0) {
          if (position > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
          position -= pageH;
          remainingHeight -= pageH;
        }
      }

      const santriName = data.santri?.namaSantri || data.currentUser.nama || 'Santri';
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

  return { isGenerating, error, success, generatePDF, reportRef };
}
