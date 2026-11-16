import { supabase } from '@/lib/supabase';
import type { FoodOutcome, WasteRecord } from '@/types/waste';
import { mapDbRowToWasteRecord, type WasteRecordDbRow } from './mapper';

/**
 * Waste Service
 *
 * Handles recording consumed/wasted food item outcomes and retrieving
 * waste history for the signed-in user via Supabase.
 */

/**
 * Records food item outcome via the atomic Supabase RPC `finish_food_item`.
 * This RPC records a waste_record and deletes the food_item in a single atomic transaction.
 * It does NOT insert or delete anything separately, preventing partial state failures.
 * Throws a clear Error on failure.
 */
export async function finishFood(
  foodItemId: string,
  outcome: FoodOutcome
): Promise<void> {
  const { error } = await supabase.rpc('finish_food_item', {
    p_food_item_id: foodItemId,
    p_outcome: outcome,
  });

  if (error) {
    throw new Error(`Failed to finish food item (${outcome}): ${error.message}`);
  }
}

/**
 * Fetches all waste records for the currently authenticated user.
 * First verifies an active session; throws "Please sign in to see your insights" if not signed in.
 * Supabase Row Level Security (RLS) ensures only the signed-in user's rows are returned:
 *   "waste_select_own": using (user_id = (select auth.uid()))
 * Maps all snake_case columns to camelCase with quantity as a number.
 */
export async function listWasteRecords(): Promise<WasteRecord[]> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Authentication error: ${sessionError.message}`);
  }

  if (!sessionData?.session) {
    throw new Error('Please sign in to see your insights');
  }

  const { data, error } = await supabase
    .from('waste_records')
    .select(
      'id, user_id, food_item_id, food_name, category, outcome, quantity, unit, recorded_at'
    )
    .order('recorded_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list waste records: ${error.message}`);
  }

  return (data || []).map((row: WasteRecordDbRow) =>
    mapDbRowToWasteRecord(row)
  );
}
