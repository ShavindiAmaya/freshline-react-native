import type { FoodOutcome, WasteRecord } from '@/types/waste';

/**
 * Shape of rows in the PostgreSQL public.waste_records table.
 */
export interface WasteRecordDbRow {
  id: string;
  user_id: string;
  food_item_id: string | null;
  food_name: string;
  category: string;
  outcome: string;
  quantity: number | string;
  unit: string;
  recorded_at: string;
}

/**
 * Maps Supabase snake_case database columns to camelCase WasteRecord properties.
 * food_item_id -> foodItemId, food_name -> foodName, recorded_at -> recordedAt, user_id -> userId
 * quantity is converted to number.
 */
export function mapDbRowToWasteRecord(row: WasteRecordDbRow): WasteRecord {
  return {
    id: row.id,
    userId: row.user_id,
    foodItemId: row.food_item_id,
    foodName: row.food_name,
    category: row.category,
    outcome: row.outcome as FoodOutcome,
    quantity: Number(row.quantity),
    unit: row.unit,
    recordedAt: row.recorded_at,
  };
}
