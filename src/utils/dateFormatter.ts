const NAMA_HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const NAMA_BULAN_PENDEK = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const APP_TIME_ZONE = 'Asia/Jakarta';

function getAppTimeParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);

  const value = (type: string) => parts.find(part => part.type === type)?.value || '';
  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
    minute: value('minute')
  };
}

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

export function getTodayInputFormat(date: Date = new Date()): string {
  const { year, month, day } = getAppTimeParts(date);
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeInputFormat(date: Date = new Date()): string {
  const { hour, minute } = getAppTimeParts(date);
  return `${hour}:${minute}`;
}

export function addDaysToDateInput(dateInput: string, days: number): string {
  const [year, month, day] = dateInput.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = shifted.getUTCFullYear();
  const nextMonth = (shifted.getUTCMonth() + 1).toString().padStart(2, '0');
  const nextDay = shifted.getUTCDate().toString().padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}
