import type {
  KelasFormal,
  MurojaahRecord,
  Santri,
  SatuanPendidikanFormal,
  User,
  ZiyadahRecord
} from '../../types';

export interface SantriStats {
  totalZiyadah: number;
  totalMurojaah: number;
  total: number;
}

export function buildStatsBySantri(
  ziyadahRecords: ZiyadahRecord[],
  murojaahRecords: MurojaahRecord[]
): Map<string, SantriStats> {
  const stats = new Map<string, SantriStats>();

  for (const record of ziyadahRecords) {
    const current = stats.get(record.idSantri) || { totalZiyadah: 0, totalMurojaah: 0, total: 0 };
    current.totalZiyadah += 1;
    current.total += 1;
    stats.set(record.idSantri, current);
  }

  for (const record of murojaahRecords) {
    const current = stats.get(record.idSantri) || { totalZiyadah: 0, totalMurojaah: 0, total: 0 };
    current.totalMurojaah += 1;
    current.total += 1;
    stats.set(record.idSantri, current);
  }

  return stats;
}

export function getSantriStats(stats: Map<string, SantriStats>, idSantri: string): SantriStats {
  return stats.get(idSantri) || { totalZiyadah: 0, totalMurojaah: 0, total: 0 };
}

export function getFormalLabel(santri: Santri): string {
  const parts = [
    santri.satuanPendidikan?.trim(),
    santri.kelasFormal?.trim() ? `Kelas ${santri.kelasFormal.trim()}` : ''
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Belum diisi';
}

export function filterSantriList(
  santriList: Santri[],
  normalizedSearchQuery: string,
  satuanPendidikanFilter: SatuanPendidikanFormal | '',
  kelasFormalFilter: KelasFormal | ''
): Santri[] {
  return santriList.filter((santri) => {
    const matchesSearch = !normalizedSearchQuery || [
      santri.namaSantri,
      santri.idSantri,
      santri.kelas,
      santri.satuanPendidikan || '',
      santri.kelasFormal || ''
    ].some((value) => value.toLowerCase().includes(normalizedSearchQuery));

    const matchesSatuan = !satuanPendidikanFilter || santri.satuanPendidikan === satuanPendidikanFilter;
    const matchesKelasFormal = !kelasFormalFilter || santri.kelasFormal === kelasFormalFilter;
    return matchesSearch && matchesSatuan && matchesKelasFormal;
  });
}

export function filterUsersList(usersList: User[], normalizedSearchQuery: string): User[] {
  return usersList.filter((user) =>
    user.nama.toLowerCase().includes(normalizedSearchQuery) ||
    user.username.toLowerCase().includes(normalizedSearchQuery) ||
    user.role.toLowerCase().includes(normalizedSearchQuery) ||
    Boolean(user.idSantri && user.idSantri.toLowerCase().includes(normalizedSearchQuery))
  );
}

export function buildWaliCredentialText(santri: Santri, usersList: User[]): string {
  const waliUsername = `wali_${santri.idSantri.toLowerCase()}`;
  const userAccount = usersList.find(
    (user) => user.role === 'Wali'
      && (user.idSantri === santri.idSantri || user.username.toLowerCase() === waliUsername)
  );
  const waliPassword = userAccount?.password || '123';
  const appUrl = 'https://tahfidzpesmad.my.id';

  return `Assalamu'alaikum Warahmatullahi Wabarakatuh,
Yth. Bapak/Ibu Wali dari Ananda *${santri.namaSantri}* (Kelas Al-Qur'an: ${santri.kelas}; Jenjang formal: ${getFormalLabel(santri)}),

Berikut informasi akses akun Portal Wali Santri Madrasah Darul Fikri:
🌐 *Link Portal:* ${appUrl}
👤 *Username:* ${waliUsername}
🔑 *Password:* ${waliPassword}

Fasilitas Portal Wali Santri:
1. Memantau capaian hafalan Ziyadah & Muroja'ah ananda secara real-time
2. Membaca Mushaf Digital 30 Juz & audio murattal
3. Mengisi Program Pantauan Liburan Santri (Wirid Yaumiyyah al-Waqi'ah, al-Mulk, al-Insyirah & Shalat 5 Waktu Berjama'ah) ketika liburan diaktifkan oleh Ustadz

Jazakumullah Khairan Katsiran.
Wassalamu'alaikum Warahmatullahi Wabarakatuh.`;
}

export function buildWaliWhatsAppUrl(santri: Santri, usersList: User[]): string {
  const text = buildWaliCredentialText(santri, usersList);
  let phone = (santri.waliKontak || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.substring(1);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function buildUserCredentialText(user: User): string {
  const appUrl = 'https://tahfidzpesmad.my.id';
  return `Assalamu'alaikum Warahmatullahi Wabarakatuh,
Informasi Akun ${user.nama} (${user.role}):
🌐 *Link Portal:* ${appUrl}
👤 *Username:* ${user.username}
🔑 *Password:* ${user.password}
Role: ${user.role}${user.idSantri ? ` (ID Santri: ${user.idSantri})` : ''}

Silakan buka Link Portal di atas untuk masuk ke sistem.
Wassalamu'alaikum Warahmatullahi Wabarakatuh.`;
}
