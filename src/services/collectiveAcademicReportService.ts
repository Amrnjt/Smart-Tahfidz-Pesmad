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
import {
  getAcademicReportDateRange,
  type AcademicReportMode,
  type AcademicReportDateRange,
} from './academicReportService';

export interface CollectiveAcademicReportRequest {
  santriList: Santri[];
  kelasFormal: KelasFormal;
  tahunPelajaran: string;
  mode: AcademicReportMode;
  semester?: SemesterAkademik;
}

export interface CollectiveAcademicStudentSummary {
  idSantri: string;
  namaSantri: string;
  kelasFormal: KelasFormal;
  kelasAlQuran: string;
  academicStatus: string;
  totalSetoran: number;
  activeDays: number;
  totalZiyadahAyat: number;
  qualityIndex: number | null;
  ziyadahCount: number;
  murojaahCount: number;
  binnadzorCount: number;
  pembelajaranCount: number;
  currentSantri?: Santri;
  snapshots: RiwayatAkademikRecord[];
}

export interface CollectiveAcademicReportSummary {
  kelasFormal: KelasFormal;
  tahunPelajaran: string;
  mode: AcademicReportMode;
  semester?: SemesterAkademik;
  periodLabel: string;
  range: AcademicReportDateRange;
  totalSantri: number;
  santriAktifSetoran: number;
  totalSetoran: number;
  totalZiyadahAyat: number;
  qualityIndex: number | null;
  nilaiCounts: Record<PredikatNilai, number>;
  students: CollectiveAcademicStudentSummary[];
  cohortSnapshots: RiwayatAkademikRecord[];
  source: 'server' | 'scoped-cache';
}

const NILAI_SCORE: Record<PredikatNilai, number> = {
  Mengulang: 1,
  Kurang: 2,
  Baik: 3,
  'Sangat Baik': 4,
};

function averageQualityIndex(records: CombinedHistoryItem[]): number | null {
  if (records.length === 0) return null;
  const values = records
    .map(record => NILAI_SCORE[record.nilai])
    .filter((value): value is number => Number.isFinite(value));
  if (values.length === 0) return null;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function sumZiyadahAyat(records: CombinedHistoryItem[]): number {
  return records
    .filter(record => record.type === 'Ziyadah')
    .reduce((total, record) => {
      const start = Number(record.ayatAwal || 0);
      const end = Number(record.ayatAkhir || 0);
      if (start <= 0 || end < start) return total;
      return total + (end - start + 1);
    }, 0);
}

function getSnapshotLabels(snapshots: RiwayatAkademikRecord[]): {
  quranClass: string;
  academicStatus: string;
} {
  const quranClasses = Array.from(
    new Set(snapshots.map(item => item.kelasAlQuran?.trim()).filter(Boolean) as string[])
  );
  const statuses = Array.from(
    new Set(snapshots.map(item => item.statusAkademikFormal || 'Aktif'))
  );

  return {
    quranClass: quranClasses.length > 0 ? quranClasses.join(' / ') : 'Belum ditetapkan',
    academicStatus: statuses.length > 0 ? statuses.join(' / ') : 'Aktif',
  };
}

export async function fetchCollectiveAcademicReport(
  request: CollectiveAcademicReportRequest,
): Promise<CollectiveAcademicReportSummary> {
  const selectedSemester = request.mode === 'semester'
    ? (request.semester || 'Ganjil')
    : undefined;
  const range = getAcademicReportDateRange(
    request.tahunPelajaran,
    request.mode,
    selectedSemester,
  );

  const [history, periodSnapshots] = await Promise.all([
    fetchHistoryRange({
      startDate: range.startDate,
      endDate: range.endDate,
      scope: { kind: 'staff' },
    }),
    storageService.fetchAcademicHistoryByPeriod(
      request.tahunPelajaran,
      selectedSemester,
    ),
  ]);

  const cohortSnapshots = periodSnapshots.filter(
    snapshot =>
      snapshot.satuanPendidikan === 'MTs' &&
      snapshot.kelasFormal === request.kelasFormal,
  );

  const snapshotsBySantri = new Map<string, RiwayatAkademikRecord[]>();
  for (const snapshot of cohortSnapshots) {
    const existing = snapshotsBySantri.get(snapshot.idSantri) || [];
    existing.push(snapshot);
    snapshotsBySantri.set(snapshot.idSantri, existing);
  }

  const cohortIds = new Set(snapshotsBySantri.keys());
  const cohortRecords = history.records.filter(record => cohortIds.has(record.idSantri));
  const currentSantriById = new Map(request.santriList.map(santri => [santri.idSantri, santri]));

  const students: CollectiveAcademicStudentSummary[] = Array.from(snapshotsBySantri.entries())
    .map(([idSantri, snapshots]) => {
      const records = cohortRecords.filter(record => record.idSantri === idSantri);
      const currentSantri = currentSantriById.get(idSantri);
      const labels = getSnapshotLabels(snapshots);
      const fallbackName = snapshots[0]?.namaSantri || idSantri;

      return {
        idSantri,
        namaSantri: currentSantri?.namaSantri || fallbackName,
        kelasFormal: request.kelasFormal,
        kelasAlQuran: labels.quranClass,
        academicStatus: labels.academicStatus,
        totalSetoran: records.length,
        activeDays: new Set(
          records.map(record => (record.timestamp || '').slice(0, 10)).filter(Boolean)
        ).size,
        totalZiyadahAyat: sumZiyadahAyat(records),
        qualityIndex: averageQualityIndex(records),
        ziyadahCount: records.filter(record => record.type === 'Ziyadah').length,
        murojaahCount: records.filter(record => record.type === 'Murojaah').length,
        binnadzorCount: records.filter(record => record.type === 'Binnadzor').length,
        pembelajaranCount: records.filter(record => record.type === 'Pembelajaran').length,
        currentSantri,
        snapshots,
      };
    })
    .sort((a, b) => a.namaSantri.localeCompare(b.namaSantri, 'id'));

  const nilaiCounts: Record<PredikatNilai, number> = {
    Mengulang: 0,
    Kurang: 0,
    Baik: 0,
    'Sangat Baik': 0,
  };
  cohortRecords.forEach(record => {
    nilaiCounts[record.nilai] += 1;
  });

  return {
    kelasFormal: request.kelasFormal,
    tahunPelajaran: request.tahunPelajaran,
    mode: request.mode,
    semester: selectedSemester,
    periodLabel: range.label,
    range,
    totalSantri: students.length,
    santriAktifSetoran: students.filter(student => student.totalSetoran > 0).length,
    totalSetoran: cohortRecords.length,
    totalZiyadahAyat: sumZiyadahAyat(cohortRecords),
    qualityIndex: averageQualityIndex(cohortRecords),
    nilaiCounts,
    students,
    cohortSnapshots,
    source: history.source,
  };
}
