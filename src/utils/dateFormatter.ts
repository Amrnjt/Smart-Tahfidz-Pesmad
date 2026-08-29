/**
 * Utility untuk memformat tanggal dan waktu dalam bahasa Indonesia
 */

const NAMA_HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const NAMA_BULAN_PENDEK = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Parsing string tanggal ke Date object dengan aman
 */
export function parseDateSafe(dateInput?: string | Date): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  
  // Format yyyy-mm-dd hh:mm atau ISO
  const isoStr = dateInput.includes('T') ? dateInput : dateInput.replace(' ', 'T');
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Format tanggal lengkap dengan hari: "Jumat, 29 Agustus 2026"
 */
export function formatTanggalLengkap(dateInput?: string | Date): string {
  const d = parseDateSafe(dateInput);
  const hari = NAMA_HARI[d.getDay()];
  const tgl = d.getDate();
  const bln = NAMA_BULAN[d.getMonth()];
  const thn = d.getFullYear();
  return `${hari}, ${tgl} ${bln} ${thn}`;
}

/**
 * Format tanggal & jam lengkap: "Jumat, 29 Agu 2026 • 14:30"
 */
export function formatTanggalWaktu(dateInput?: string | Date): string {
  const d = parseDateSafe(dateInput);
  const hari = NAMA_HARI[d.getDay()];
  const tgl = d.getDate();
  const bln = NAMA_BULAN_PENDEK[d.getMonth()];
  const thn = d.getFullYear();
  const jam = d.getHours().toString().padStart(2, '0');
  const menit = d.getMinutes().toString().padStart(2, '0');
  return `${hari}, ${tgl} ${bln} ${thn} • ${jam}:${menit}`;
}

/**
 * Format tanggal ringkas: "29 Agu 2026"
 */
export function formatTanggalRingkas(dateInput?: string | Date): string {
  const d = parseDateSafe(dateInput);
  const tgl = d.getDate();
  const bln = NAMA_BULAN_PENDEK[d.getMonth()];
  const thn = d.getFullYear();
  return `${tgl} ${bln} ${thn}`;
}

/**
 * Helper untuk mendapatkan tanggal hari ini dalam format input YYYY-MM-DD
 */
export function getTodayInputFormat(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper untuk mendapatkan waktu saat ini format HH:mm
 */
export function getCurrentTimeInputFormat(): string {
  const d = new Date();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
