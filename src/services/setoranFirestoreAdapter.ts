import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type QuerySnapshot,
} from 'firebase/firestore';
import type { SetoranDateRange } from './setoranQuery.types';
import { db } from './firebase';

export type SetoranCollectionName =
  | 'ziyadah'
  | 'murojaah'
  | 'binnadzor'
  | 'pembelajaran';

export interface SetoranFirestoreAdapter {
  subscribe(
    collectionName: SetoranCollectionName,
    range: SetoranDateRange,
    onData: (records: unknown[]) => void,
    onError: (error: Error) => void,
  ): () => void;
  fetchRange(
    collectionName: SetoranCollectionName,
    range: SetoranDateRange,
  ): Promise<unknown[]>;
  fetchAll(collectionName: SetoranCollectionName): Promise<unknown[]>;
  fetchBySantri(
    collectionName: SetoranCollectionName,
    idSantri: string,
  ): Promise<unknown[]>;
}

function recordsFromSnapshot(snapshot: QuerySnapshot<DocumentData>): unknown[] {
  return snapshot.docs.map(documentSnapshot => {
    const data = documentSnapshot.data();
    return {
      ...data,
      id: typeof data.id === 'string' && data.id ? data.id : documentSnapshot.id,
    };
  });
}

export const setoranFirestoreAdapter: SetoranFirestoreAdapter = {
  subscribe(collectionName, range, onData, onError) {
    const recordsQuery = query(
      collection(db, collectionName),
      where('timestamp', '>=', range.startInclusive),
      where('timestamp', '<', range.endExclusive),
      orderBy('timestamp', 'desc'),
    );

    return onSnapshot(
      recordsQuery,
      snapshot => onData(recordsFromSnapshot(snapshot)),
      onError,
    );
  },

  async fetchRange(collectionName, range) {
    const recordsQuery = query(
      collection(db, collectionName),
      where('timestamp', '>=', range.startInclusive),
      where('timestamp', '<', range.endExclusive),
      orderBy('timestamp', 'desc'),
    );
    return recordsFromSnapshot(await getDocs(recordsQuery));
  },

  async fetchAll(collectionName) {
    return recordsFromSnapshot(await getDocs(collection(db, collectionName)));
  },

  async fetchBySantri(collectionName, idSantri) {
    const recordsQuery = query(
      collection(db, collectionName),
      where('idSantri', '==', idSantri),
    );
    return recordsFromSnapshot(await getDocs(recordsQuery));
  },
};
