const NAMA_HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const NAMA_BULAN_PENDEK = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export function parseDateSafe(dateInput?: string | Date): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  const isoStr = dateInput.includes('T') ? dateInput : dateInput.replace(' ', 'T');
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function formatTanggalLengkap(dateInput?: string | Date): string {
  const d = parseDateSafe(dateInput);
  const hari = NAMA_HARI[d.getDay()];
  const tgl = d.getDate();
  const bln = NAMA_BULAN[d.getMonth()];
  const thn = d.getFullYear();
  return `${hari}, ${tgl} ${bln} ${thn}`;
}

export const formatTanggalIndo = formatTanggalLengkap;

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

export function formatTanggalRingkas(dateInput?: string | Date): string {
  const d = parseDateSafe(dateInput);
  const tgl = d.getDate();
  const bln = NAMA_BULAN_PENDEK[d.getMonth()];
  const thn = d.getFullYear();
  return `${tgl} ${bln} ${thn}`;
}

export function getTodayInputFormat(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeInputFormat(): string {
  const d = new Date();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
