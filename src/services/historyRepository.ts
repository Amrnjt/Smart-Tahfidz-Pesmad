import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type {
  BinnadzorRecord,
  CombinedHistoryItem,
  MurojaahRecord,
  PembelajaranRecord,
  ZiyadahRecord,
} from '../types';
import { getHistoryItemKey } from '../utils/historyUtils';
import { createHistoryQueryKey } from '../utils/historyQueryKey';
import { db } from './firebase';
import {
  HistoryQueryError,
  type HistoryQueryResult,
  type HistoryQueryScope,
  type HistoryRangeRequest,
} from './historyQueryTypes';

type HistoryRecordType = CombinedHistoryItem['type'];

const HISTORY_COLLECTIONS: Record<HistoryRecordType, string> = {
  Ziyadah: 'ziyadah',
  Murojaah: 'murojaah',
  Binnadzor: 'binnadzor',
  Pembelajaran: 'pembelajaran',
};

const rangeCache = new Map<string, CombinedHistoryItem[]>();

function ensureValidScope(scope: HistoryQueryScope): void {
  if (scope.kind === 'student' && !scope.idSantri.trim()) {
    throw new HistoryQueryError('INVALID_SCOPE', 'ID santri tidak tersedia untuk query riwayat.');
  }
}

function normalizeRecord(
  type: HistoryRecordType,
  docSnap: QueryDocumentSnapshot<DocumentData>,
): CombinedHistoryItem {
  const data = docSnap.data();
  const id = String(data.id || docSnap.id);
  const idSantri = String(data.idSantri || '');
  const namaSantri = String(data.namaSantri || idSantri);

  if (type === 'Ziyadah') {
    const record = data as ZiyadahRecord;
    return {
      id,
      type,
      timestamp: record.timestamp,
      idSantri,
      namaSantri,
      materi: `${record.surah} (Ayat ${record.ayatAwal} - ${record.ayatAkhir})`,
      nilai: record.nilai,
      catatan: record.catatan || '',
      inputBy: record.inputBy || '',
      surah: record.surah,
      ayatAwal: record.ayatAwal,
      ayatAkhir: record.ayatAkhir,
    };
  }

  if (type === 'Murojaah') {
    const record = data as MurojaahRecord;
    return {
      id,
      type,
      timestamp: record.timestamp,
      idSantri,
      namaSantri,
      materi: record.surahAtauJuz,
      nilai: record.nilai,
      catatan: record.catatan || '',
      inputBy: record.inputBy || '',
      surahAtauJuz: record.surahAtauJuz,
    };
  }

  if (type === 'Binnadzor') {
    const record = data as BinnadzorRecord;
    return {
      id,
      type,
      timestamp: record.timestamp,
      idSantri,
      namaSantri,
      materi: record.materi || record.surahAtauHalaman || 'Tilawah',
      nilai: record.nilai,
      catatan: record.catatan || '',
      inputBy: record.inputBy || '',
      surah: record.surah,
      ayatAwal: record.ayatAwal,
      ayatAkhir: record.ayatAkhir,
      surahAtauJuz: record.surahAtauHalaman,
      hukumTajwid: record.hukumTajwid,
      makhrojHuruf: record.makhrojHuruf,
      kefasihan: record.kefasihan,
      kelancaran: record.kelancaran,
    };
  }

  const record = data as PembelajaranRecord;
  return {
    id,
    type,
    timestamp: record.timestamp,
    idSantri,
    namaSantri,
    materi: record.materi
      || record.materiPokok
      || (record.jilid ? `${record.jilid} Hal ${record.halaman ?? '-'}` : 'Materi Pembelajaran'),
    nilai: record.nilai,
    catatan: record.catatan || record.catatanBimbingan || '',
    inputBy: record.inputBy || '',
    tipeKelas: record.tipeKelas,
    jilid: record.jilid || record.jilidAtauKategori,
    halaman: record.halaman ?? record.halamanAwal,
    pokokBahasan: record.pokokBahasan || record.materiPokok,
    tahapIstimewa: record.tahapIstimewa || (record.tipeKelas === 'Kelas Istimewa' ? record.jilidAtauKategori : undefined),
    statusKenaikan: record.statusKenaikan,
    hukumTajwid: record.hukumTajwid || record.tajwid,
    makhrojHuruf: record.makhrojHuruf || record.makhroj,
    kefasihan: record.kefasihan || record.fashohah,
    kelancaran: record.kelancaran,
    kendalaSantri: record.kendalaSantri,
    rekomendasiTindakLanjut: record.rekomendasiTindakLanjut,
  };
}

function dedupeAndSort(items: CombinedHistoryItem[]): CombinedHistoryItem[] {
  const byKey = new Map<string, CombinedHistoryItem>();
  for (const item of items) {
    byKey.set(getHistoryItemKey(item), item);
  }
  return Array.from(byKey.values()).sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
}

function rangeConstraints(request: HistoryRangeRequest): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  if (request.scope.kind === 'student') {
    constraints.push(where('idSantri', '==', request.scope.idSantri));
  }
  constraints.push(
    where('timestamp', '>=', `${request.startDate} 00:00`),
    where('timestamp', '<=', `${request.endDate} 23:59:59`),
    orderBy('timestamp', 'desc'),
  );
  return constraints;
}

function classifyError(error: unknown): HistoryQueryError {
  if (error instanceof HistoryQueryError) return error;
  const code = String((error as { code?: string })?.code || '');
  if (code.includes('failed-precondition')) {
    return new HistoryQueryError(
      'INDEX_REQUIRED',
      'Indeks Firestore untuk riwayat belum tersedia. Silakan deploy indeks yang disiapkan lalu coba lagi.',
      { cause: error },
    );
  }
  if (code.includes('unavailable') || code.includes('network') || code.includes('offline')) {
    return new HistoryQueryError(
      'OFFLINE',
      'Cloud Firestore sedang tidak dapat dijangkau. Periksa koneksi lalu coba lagi.',
      { cause: error },
    );
  }
  return new HistoryQueryError('UNKNOWN', 'Riwayat belum dapat dimuat dari Cloud.', { cause: error });
}

export async function fetchHistoryRange(request: HistoryRangeRequest): Promise<HistoryQueryResult> {
  ensureValidScope(request.scope);
  if (!request.startDate || !request.endDate || request.startDate > request.endDate) {
    throw new HistoryQueryError('UNKNOWN', 'Rentang tanggal riwayat tidak valid.');
  }

  const key = createHistoryQueryKey(request);
  try {
    const snapshots = await Promise.all(
      (Object.entries(HISTORY_COLLECTIONS) as [HistoryRecordType, string][]).map(async ([type, collectionName]) => {
        const snapshot = await getDocs(query(collection(db, collectionName), ...rangeConstraints(request)));
        return Array.from(snapshot.docs, docSnap => normalizeRecord(type, docSnap));
      }),
    );
    const records = dedupeAndSort(snapshots.flat());
    rangeCache.set(key, records);
    return { records, source: 'server' };
  } catch (error) {
    const cached = rangeCache.get(key);
    if (cached) {
      return { records: cached, source: 'scoped-cache' };
    }
    throw classifyError(error);
  }
}

export async function fetchHistoryDate(date: string, scope: HistoryQueryScope): Promise<HistoryQueryResult> {
  return fetchHistoryRange({ startDate: date, endDate: date, scope });
}

export function invalidateHistoryRangeCache(): void {
  rangeCache.clear();
}

export interface HistoryPageCursor {
  Ziyadah?: QueryDocumentSnapshot<DocumentData>;
  Murojaah?: QueryDocumentSnapshot<DocumentData>;
  Binnadzor?: QueryDocumentSnapshot<DocumentData>;
  Pembelajaran?: QueryDocumentSnapshot<DocumentData>;
}

export interface HistoryPageResult {
  records: CombinedHistoryItem[];
  cursor: HistoryPageCursor;
  hasMore: boolean;
}

export async function fetchHistoryPage(
  scope: HistoryQueryScope,
  cursor: HistoryPageCursor = {},
  pageSize = 50,
): Promise<HistoryPageResult> {
  ensureValidScope(scope);

  try {
    const pages = await Promise.all(
      (Object.entries(HISTORY_COLLECTIONS) as [HistoryRecordType, string][]).map(async ([type, collectionName]) => {
        const constraints: QueryConstraint[] = [];
        if (scope.kind === 'student') {
          constraints.push(where('idSantri', '==', scope.idSantri));
        }
        constraints.push(orderBy('timestamp', 'desc'));
        const previous = cursor[type];
        if (previous) constraints.push(startAfter(previous));
        constraints.push(limit(pageSize));

        const snapshot = await getDocs(query(collection(db, collectionName), ...constraints));
        return {
          type,
          docs: snapshot.docs,
          hasMore: snapshot.size === pageSize,
        };
      }),
    );

    const nextCursor: HistoryPageCursor = {};
    const records: CombinedHistoryItem[] = [];
    let hasMore = false;

    for (const page of pages) {
      const lastDoc = page.docs.at(-1);
      if (lastDoc) nextCursor[page.type] = lastDoc;
      else if (cursor[page.type]) nextCursor[page.type] = cursor[page.type];
      hasMore = hasMore || page.hasMore;
      page.docs.forEach(docSnap => records.push(normalizeRecord(page.type, docSnap)));
    }

    return { records: dedupeAndSort(records), cursor: nextCursor, hasMore };
  } catch (error) {
    throw classifyError(error);
  }
}
