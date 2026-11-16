import type { WasteRecord } from '@/types/waste';

export interface MonthlyAnalytics {
  consumedCount: number;
  wastedCount: number;
  totalCount: number;
  wasteRate: number; // e.g. 23.076923...
  mostWastedCategory: string | null;
}

/**
 * Parses a recordedAt string or Date into a Date object evaluated in local time.
 * If a date-only string (YYYY-MM-DD) is provided, it avoids UTC-midnight shifts
 * by constructing a Date using local midnight (year, month - 1, day).
 */
export function parseRecordDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Handle date-only YYYY-MM-DD in local time
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(trimmed);
  }
  return new Date(dateInput);
}

/**
 * Filters waste records strictly for the target month and year using LOCAL time.
 * Defaults to the current month if targetDate is omitted.
 */
export function filterRecordsByMonth(
  records: WasteRecord[],
  targetDate: Date = new Date()
): WasteRecord[] {
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth(); // 0-indexed in local time

  return records.filter((record) => {
    const recordDate = parseRecordDate(record.recordedAt);
    return (
      !isNaN(recordDate.getTime()) &&
      recordDate.getFullYear() === targetYear &&
      recordDate.getMonth() === targetMonth
    );
  });
}

/**
 * Rounds waste rate percentage to 1 decimal place.
 * e.g., 23.076923... -> 23.1, 0 -> 0
 */
export function roundWasteRate(wasteRate: number): number {
  return Math.round(wasteRate * 10) / 10;
}

/**
 * Calculates item counts, waste rate percentage, and most wasted category.
 *
 * NOTE: As required, calculations use discrete ITEM COUNTS (count of records)
 * to avoid adding different units (e.g., kg vs liters vs pieces) together.
 */
export function calculateMonthlyAnalytics(records: WasteRecord[]): MonthlyAnalytics {
  let consumedCount = 0;
  let wastedCount = 0;
  const wastedCategoryCounts: Record<string, number> = {};

  for (const record of records) {
    if (record.outcome === 'Consumed') {
      consumedCount += 1;
      // Consumed items NEVER touch wastedCategoryCounts
    } else if (record.outcome === 'Wasted') {
      wastedCount += 1;
      // Track category frequency strictly from Wasted records
      const cat = record.category ? record.category.trim() : 'Other';
      wastedCategoryCounts[cat] = (wastedCategoryCounts[cat] || 0) + 1;
    }
  }

  const totalCount = consumedCount + wastedCount;

  // Raw waste rate percentage: wasted / total * 100
  // Safe guard: 0 totalCount evaluates to 0, never NaN
  const wasteRate = totalCount > 0 ? (wastedCount / totalCount) * 100 : 0;

  // Find the category with the highest wasted count strictly among Wasted records
  let mostWastedCategory: string | null = null;
  let maxWastedCount = 0;
  for (const [category, count] of Object.entries(wastedCategoryCounts)) {
    if (count > maxWastedCount) {
      maxWastedCount = count;
      mostWastedCategory = category;
    }
  }

  return {
    consumedCount,
    wastedCount,
    totalCount,
    wasteRate,
    mostWastedCategory,
  };
}
