import { supabase } from '@/lib/supabase';
import type { FoodOutcome, WasteRecord } from '@/types/waste';
import { mapDbRowToWasteRecord, type WasteRecordDbRow } from './mapper';

// Waste service: saves Consumed/Wasted outcomes and loads the user's history

// Marks a food item as Consumed or Wasted
// The Supabase function finish_food_item saves the record and removes the food
// item in one step, so we never insert or delete anything here ourselves
// Throws an Error if it fails
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

// Loads the waste records of the signed-in user, newest first
// Throws an Error if nobody is signed in
// Row Level Security makes sure each user only gets their own rows
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
