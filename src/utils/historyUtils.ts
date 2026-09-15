import type { CombinedHistoryItem } from '../types';

export interface HistoryDateGroup {
  dateKey: string;
  items: CombinedHistoryItem[];
}

export function getHistoryItemKey(item: Pick<CombinedHistoryItem, 'type' | 'id'>): string {
  return `${item.type}:${item.id}`;
}

export function deduplicateHistoryItems(items: CombinedHistoryItem[]): CombinedHistoryItem[] {
  const seen = new Set<string>();

  return items.filter(item => {
    const key = getHistoryItemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getHistoryDateKey(timestamp: string): string | null {
  const match = timestamp.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s]|$)/);
  return match?.[1] ?? null;
}

export function groupHistoryItemsByDate(items: CombinedHistoryItem[]): HistoryDateGroup[] {
  const groups = new Map<string, CombinedHistoryItem[]>();

  items.forEach(item => {
    const dateKey = getHistoryDateKey(item.timestamp);
    if (!dateKey) return;

    const group = groups.get(dateKey);
    if (group) group.push(item);
    else groups.set(dateKey, [item]);
  });

  return Array.from(groups, ([dateKey, groupedItems]) => ({
    dateKey,
    items: groupedItems,
  }));
}
