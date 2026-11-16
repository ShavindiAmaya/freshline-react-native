import type { FoodOutcome, WasteRecord } from '@/types/waste';

// One row of the waste_records table in Supabase
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

// Converts a database row into a WasteRecord 
// quantity is turned into a number

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
