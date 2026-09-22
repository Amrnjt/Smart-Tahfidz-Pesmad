import type {
  CombinedHistoryItem,
  KelasFormal,
  PredikatNilai,
  RiwayatAkademikRecord,
  Santri,
  SemesterAkademik,
} from '../types';
import { fetchHistoryRange } from './historyRepository';
import { storageService } from './storageService';

export type AcademicReportMode = 'semester' | 'year';

export interface AcademicReportRequest {
  santri: Santri;
  tahunPelajaran: string;
  mode: AcademicReportMode;
  semester?: SemesterAkademik;
}

export interface AcademicReportDateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export interface AcademicReportCategorySummary {
  type: CombinedHistoryItem['type'];
  count: number;
  qualityIndex: number | null;
}

export interface AcademicReportSummary {
  santri: Santri;
  tahunPelajaran: string;
  mode: AcademicReportMode;
  semester?: SemesterAkademik;
  periodLabel: string;
  startDate: string;
  endDate: string;
  formalClassLabel: string;
  quranClassLabel: string;
  academicStatus: string;
  totalSetoran: number;
  activeDays: number;
  totalZiyadahAyat: number;
  qualityIndex: number | null;
  nilaiCounts: Record<PredikatNilai, number>;
  categories: AcademicReportCategorySummary[];
  records: CombinedHistoryItem[];
  academicSnapshots: RiwayatAkademikRecord[];
  source: 'server' | 'scoped-cache';
}

const NILAI_SCORE: Record<PredikatNilai, number> = {
  Mengulang: 1,
  Kurang: 2,
  Baik: 3,
  'Sangat Baik': 4,
};

const RECORD_TYPES: CombinedHistoryItem['type'][] = [
  'Ziyadah',
  'Murojaah',
  'Binnadzor',
  'Pembelajaran',
];

function parseAcademicYear(value: string): { startYear: number; endYear: number } {
  const match = /^(\d{4})\/(\d{4})$/.exec(value.trim());
  if (!match) throw new Error('Tahun pelajaran tidak valid.');
  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (endYear !== startYear + 1) {
    throw new Error('Tahun pelajaran harus berurutan, misalnya 2026/2027.');
  }
  return { startYear, endYear };
}

export function getAcademicReportDateRange(
  tahunPelajaran: string,
  mode: AcademicReportMode,
  semester?: SemesterAkademik,
): AcademicReportDateRange {
  const { startYear, endYear } = parseAcademicYear(tahunPelajaran);

  if (mode === 'year') {
    return {
      startDate: `${startYear}-07-01`,
      endDate: `${endYear}-06-30`,
      label: `Tahun Pelajaran ${tahunPelajaran}`,
    };
  }

  const selectedSemester = semester || 'Ganjil';
  if (selectedSemester === 'Ganjil') {
    return {
      startDate: `${startYear}-07-01`,
      endDate: `${startYear}-12-31`,
      label: `Semester Ganjil ${tahunPelajaran}`,
    };
  }

  return {
    startDate: `${endYear}-01-01`,
    endDate: `${endYear}-06-30`,
    label: `Semester Genap ${tahunPelajaran}`,
  };
}

function averageQualityIndex(records: CombinedHistoryItem[]): number | null {
  if (records.length === 0) return null;
  const scores = records
    .map(record => NILAI_SCORE[record.nilai])
    .filter((value): value is number => Number.isFinite(value));
  if (scores.length === 0) return null;
  return Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(2));
}

function sumZiyadahAyat(records: CombinedHistoryItem[]): number {
  return records
    .filter(record => record.type === 'Ziyadah')
    .reduce((total, record) => {
      const awal = Number(record.ayatAwal || 0);
      const akhir = Number(record.ayatAkhir || 0);
      if (awal <= 0 || akhir < awal) return total;
      return total + (akhir - awal + 1);
    }, 0);
}

function getAcademicSnapshotLabels(
  santri: Santri,
  snapshots: RiwayatAkademikRecord[],
): { formalClassLabel: string; quranClassLabel: string; academicStatus: string } {
  const formalClasses = Array.from(
    new Set(
      snapshots
        .map(item => item.kelasFormal)
        .filter((value): value is KelasFormal => Boolean(value)),
    ),
  );
  const quranClasses = Array.from(
    new Set(snapshots.map(item => item.kelasAlQuran?.trim()).filter(Boolean) as string[]),
  );
  const statuses = Array.from(
    new Set(snapshots.map(item => item.statusAkademikFormal || 'Aktif')),
  );

  return {
    formalClassLabel: formalClasses.length > 0
      ? formalClasses.map(value => `Kelas ${value}`).join(' / ')
      : santri.kelasFormal
      ? `Kelas ${santri.kelasFormal}`
      : 'Belum ditetapkan',
    quranClassLabel: quranClasses.length > 0
      ? quranClasses.join(' / ')
      : santri.kelas || 'Belum ditetapkan',
    academicStatus: statuses.length > 0
      ? statuses.join(' / ')
      : santri.statusAkademikFormal || 'Aktif',
  };
}

export async function fetchAcademicReport(
  request: AcademicReportRequest,
): Promise<AcademicReportSummary> {
  const range = getAcademicReportDateRange(
    request.tahunPelajaran,
    request.mode,
    request.semester,
  );

  const [history, allAcademicSnapshots] = await Promise.all([
    fetchHistoryRange({
      startDate: range.startDate,
      endDate: range.endDate,
      scope: { kind: 'student', idSantri: request.santri.idSantri },
    }),
    storageService.fetchAcademicHistory(request.santri.idSantri),
  ]);

  const academicSnapshots = allAcademicSnapshots.filter(snapshot => {
    if (snapshot.tahunPelajaran !== request.tahunPelajaran) return false;
    if (request.mode === 'semester') {
      return snapshot.semester === (request.semester || 'Ganjil');
    }
    return true;
  });

  const nilaiCounts: Record<PredikatNilai, number> = {
    Mengulang: 0,
    Kurang: 0,
    Baik: 0,
    'Sangat Baik': 0,
  };
  history.records.forEach(record => {
    nilaiCounts[record.nilai] += 1;
  });

  const categories = RECORD_TYPES.map(type => {
    const categoryRecords = history.records.filter(record => record.type === type);
    return {
      type,
      count: categoryRecords.length,
      qualityIndex: averageQualityIndex(categoryRecords),
    };
  });

  const activeDays = new Set(
    history.records.map(record => (record.timestamp || '').slice(0, 10)).filter(Boolean),
  ).size;

  const identity = getAcademicSnapshotLabels(request.santri, academicSnapshots);

  return {
    santri: request.santri,
    tahunPelajaran: request.tahunPelajaran,
    mode: request.mode,
    semester: request.mode === 'semester' ? (request.semester || 'Ganjil') : undefined,
    periodLabel: range.label,
    startDate: range.startDate,
    endDate: range.endDate,
    formalClassLabel: identity.formalClassLabel,
    quranClassLabel: identity.quranClassLabel,
    academicStatus: identity.academicStatus,
    totalSetoran: history.records.length,
    activeDays,
    totalZiyadahAyat: sumZiyadahAyat(history.records),
    qualityIndex: averageQualityIndex(history.records),
    nilaiCounts,
    categories,
    records: history.records,
    academicSnapshots,
    source: history.source,
  };
}
