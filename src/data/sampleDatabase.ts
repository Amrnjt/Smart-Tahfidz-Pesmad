import { User, Santri, ZiyadahRecord, MurojaahRecord, BinnadzorRecord, PembelajaranRecord } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: "USR-SUPERADMIN-01",
    username: "anas",
    password: "123",
    role: "Superadmin",
    nama: "Ust. Anas Amrullah",
    idSantri: ""
  },
  {
    id: "USR-001",
    username: "admin",
    password: "123",
    role: "Ustadz",
    nama: "Ustadz Pembina (Admin)",
    idSantri: ""
  },
  {
    id: "USR-002",
    username: "ustadz1",
    password: "123",
    role: "Ustadz",
    nama: "Ustadz Abdullah Robbani, Lc.",
    idSantri: ""
  }
];

export const INITIAL_SANTRI: Santri[] = [];

export const INITIAL_ZIYADAH: ZiyadahRecord[] = [];

export const INITIAL_MUROJAAH: MurojaahRecord[] = [];

export const INITIAL_BINNADZOR: BinnadzorRecord[] = [];

export const INITIAL_PEMBELAJARAN: PembelajaranRecord[] = [];
