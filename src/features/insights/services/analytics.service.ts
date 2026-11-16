import type { WasteRecord } from '@/types/waste';

export interface MonthlyAnalytics {                     
  consumedCount: number;
  wastedCount: number;
  totalCount: number;
  wasteRate: number; // e.g. 23.076...
  mostWastedCategory: string | null;
}

//Turns a date string into a Date using local time
// "YYYY-MM-DD" reads as local midnight to avoid timezone shifts.

export function parseRecordDate(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Manage date-only YYYY-MM-DD in local time
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const parts = trimmed.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(trimmed);
  }
  return new Date(dateInput);
}

// Keeps only the records from the given month (default: this month)

export function filterRecordsByMonth(
  records: WasteRecord[],
  targetDate: Date = new Date()
): WasteRecord[] {
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth(); // 0 = January

  return records.filter((record) => {
    const recordDate = parseRecordDate(record.recordedAt);
    return (
      !isNaN(recordDate.getTime()) &&
      recordDate.getFullYear() === targetYear &&
      recordDate.getMonth() === targetMonth
    );
  });
}

// Rounds to 1 decimal place (23.076 -> 23.1)
export function roundWasteRate(wasteRate: number): number {
  return Math.round(wasteRate * 10) / 10;
}

// Counts consumed and wasted items, the waste rate and the most wasted category
// We count items, not quantities, so different units are never added together
export function calculateMonthlyAnalytics(records: WasteRecord[]): MonthlyAnalytics {
  let consumedCount = 0;
  let wastedCount = 0;
  const wastedCategoryCounts: Record<string, number> = {};

  for (const record of records) {
    if (record.outcome === 'Consumed') {
      consumedCount += 1;
      // Consumed items never touch wasted Category Counts
    } else if (record.outcome === 'Wasted') {
      wastedCount += 1;
      // Count categories from Wasted records only
      const cat = record.category ? record.category.trim() : 'Other';
      wastedCategoryCounts[cat] = (wastedCategoryCounts[cat] || 0) + 1;
    }
  }

  const totalCount = consumedCount + wastedCount;

 // Waste rate = wasted / total * 100 
  const wasteRate = totalCount > 0 ? (wastedCount / totalCount) * 100 : 0;

  // Category with the most wasted items
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
