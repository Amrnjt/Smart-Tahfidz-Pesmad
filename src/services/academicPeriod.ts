import type { AppConfig, SemesterAkademik } from '../types';

export function getDefaultAcademicPeriod(now = new Date()): { tahunPelajaran: string; semester: SemesterAkademik } {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 7 ? year : year - 1;
  return {
    tahunPelajaran: `${startYear}/${startYear + 1}`,
    semester: month >= 7 ? 'Ganjil' : 'Genap'
  };
}

export function isValidTahunPelajaran(value: string): boolean {
  const match = /^(\d{4})\/(\d{4})$/.exec(value.trim());
  return Boolean(match && Number(match[2]) === Number(match[1]) + 1);
}

export function getNextTahunPelajaran(value: string): string {
  const match = /^(\d{4})\/(\d{4})$/.exec(value.trim());
  if (!match || Number(match[2]) !== Number(match[1]) + 1) {
    throw new Error('Tahun pelajaran aktif tidak valid.');
  }
  const nextStart = Number(match[2]);
  return `${nextStart}/${nextStart + 1}`;
}

export function createDefaultAppConfig(): AppConfig {
  const academic = getDefaultAcademicPeriod();
  return {
    programLiburanActive: false,
    programLiburanJudul: 'Program Pantauan Liburan Santri',
    tahunPelajaranAktif: academic.tahunPelajaran,
    semesterAkademikAktif: academic.semester,
    updatedAt: new Date().toISOString()
  };
}
