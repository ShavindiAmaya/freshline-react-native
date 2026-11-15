import type { FoodOutcome, WasteRecord } from '../types.local';

/**
 * Waste Service
 *
 * Handles recording consumed/wasted food item outcomes and retrieving
 * waste history for the signed-in user.
 *
 * NOTE: The shared Supabase client (`@/lib/supabase`) has not been
 * created yet by the backend team. The database RPC `finish_food_item`
 * and table `waste_records` are already defined in `database/setup.sql`.
 * The active implementation lines are placed inside clearly marked TODOs below.
 */

// TODO: Import shared supabase client once created:
// import { supabase } from '@/lib/supabase';

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

/**
 * Records food item outcome via the atomic Supabase RPC `finish_food_item`.
 * This RPC records a waste_record and deletes the food_item in a single atomic transaction.
 * It does NOT insert or delete anything separately, preventing partial state failures.
 * Throws a clear error on failure.
 */
export async function finishFood(
  foodItemId: string,
  outcome: FoodOutcome
): Promise<void> {
  // TODO: Connect shared Supabase client when available:
  /*
  const { error } = await supabase.rpc('finish_food_item', {
    p_food_item_id: foodItemId,
    p_outcome: outcome,
  });

  if (error) {
    throw new Error(`Failed to finish food item (${outcome}): ${error.message}`);
  }
  */

  // Local stub for MVP offline development:
  console.info(
    `[TODO: Supabase finish_food_item] foodItemId: ${foodItemId}, outcome: ${outcome}`
  );
}

/**
 * Fetches all waste records for the currently authenticated user.
 * Supabase Row Level Security (RLS) ensures only the signed-in user's rows are returned:
 *   "waste_select_own": using (user_id = (select auth.uid()))
 * Maps all snake_case columns to camelCase.
 */
export async function listWasteRecords(): Promise<WasteRecord[]> {
  // TODO: Connect shared Supabase client when available:
  /*
  const { data, error } = await supabase
    .from('waste_records')
    .select('id, user_id, food_item_id, food_name, category, outcome, quantity, unit, recorded_at')
    .order('recorded_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list waste records: ${error.message}`);
  }

  return (data || []).map((row: WasteRecordDbRow) => mapDbRowToWasteRecord(row));
  */

  // Fallback until Supabase client is supplied:
  return [];
}
