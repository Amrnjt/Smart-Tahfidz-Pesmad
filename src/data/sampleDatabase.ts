import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord } from '../types';

/**
 * P0.2 — production-safe placeholder only.
 *
 * Production runtime must never import seeded/demo identities or records from
 * this module. Any future demo fixtures must live behind an explicit dev/test
 * entry point and must never be used as a fallback when Cloud/cache is empty.
 */
export const INITIAL_USERS: User[] = [];
export const INITIAL_SANTRI: Santri[] = [];
export const INITIAL_ZIYADAH: ZiyadahRecord[] = [];
export const INITIAL_MUROJAAH: MurojaahRecord[] = [];
export const INITIAL_BINNADZOR: BinnadzorRecord[] = [];
export const INITIAL_PEMBELAJARAN: PembelajaranRecord[] = [];
