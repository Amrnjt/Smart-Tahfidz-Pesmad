import type {
  SetoranDataset,
  SetoranDateRange,
} from '../services/setoranQuery.types';

type TimestampedRecord = {
  id: string;
  timestamp: string;
};

const JAKARTA_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatUtcCalendarDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getJakartaCalendarDate(now: Date): Date {
  const parts = JAKARTA_DATE_FORMATTER.formatToParts(now);
  const valueByType = new Map(parts.map(part => [part.type, part.value]));
  const year = Number(valueByType.get('year'));
  const month = Number(valueByType.get('month'));
  const day = Number(valueByType.get('day'));
  return new Date(Date.UTC(year, month - 1, day));
}

export function isCanonicalSetoranTimestamp(timestamp: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?Z?)?)?$/.test(timestamp);
}

export function sortAndDedupeRecords<T extends TimestampedRecord>(
  records: T[],
  onInvalid: (record: T) => void = () => {},
): T[] {
  const recordsById = new Map<string, T>();

  for (const record of records) {
    if (!record.id || !isCanonicalSetoranTimestamp(record.timestamp)) {
      onInvalid(record);
      continue;
    }
    if (!recordsById.has(record.id)) recordsById.set(record.id, record);
  }

  return [...recordsById.values()].sort(
    (left, right) =>
      right.timestamp.localeCompare(left.timestamp) ||
      right.id.localeCompare(left.id),
  );
}

export function mergeSetoranDatasets(
  ...datasets: SetoranDataset[]
): SetoranDataset {
  return {
    ziyadah: sortAndDedupeRecords(datasets.flatMap(dataset => dataset.ziyadah)),
    murojaah: sortAndDedupeRecords(datasets.flatMap(dataset => dataset.murojaah)),
    binnadzor: sortAndDedupeRecords(datasets.flatMap(dataset => dataset.binnadzor)),
    pembelajaran: sortAndDedupeRecords(datasets.flatMap(dataset => dataset.pembelajaran)),
  };
}

export function createRecentRange(
  now: Date,
  calendarDays: number,
): SetoranDateRange {
  if (!Number.isInteger(calendarDays) || calendarDays < 1) {
    throw new RangeError('calendarDays must be a positive integer');
  }

  const today = getJakartaCalendarDate(now);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (calendarDays - 1));
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startInclusive: `${formatUtcCalendarDate(start)} 00:00`,
    endExclusive: `${formatUtcCalendarDate(end)} 00:00`,
  };
}

export function createMonthRange(
  year: number,
  monthIndex: number,
): SetoranDateRange {
  if (!Number.isInteger(year)) {
    throw new RangeError('year must be an integer');
  }
  if (!Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    throw new RangeError('month index must be between 0 and 11');
  }

  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return {
    startInclusive: `${formatUtcCalendarDate(start)} 00:00`,
    endExclusive: `${formatUtcCalendarDate(end)} 00:00`,
  };
}
