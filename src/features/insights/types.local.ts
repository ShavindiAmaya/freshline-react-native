/**
 * Local types for the Insights feature.
 *
 * TODO: Replace this file with shared types from `@/types/waste.ts`
 * once Member B / the shared library lead creates them.
 */

export type FoodOutcome = 'Consumed' | 'Wasted';

export interface WasteRecord {
  id: string;
  userId: string;
  foodItemId: string | null;
  foodName: string;
  category: string;
  outcome: FoodOutcome;
  quantity: number;
  unit: string;
  recordedAt: string; // ISO 8601 timestamp string
}

export interface MonthlyAnalytics {
  consumedCount: number;
  wastedCount: number;
  totalCount: number;
  wasteRate: number; // e.g. 23.1 (%)
  mostWastedCategory: string | null;
}
