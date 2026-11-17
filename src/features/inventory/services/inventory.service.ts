import { supabase } from '@/lib/supabase';
import { FoodInput, FoodItem, calculateExpiryStatus } from '@/types/food';

// Map database row (snake_case) to FoodItem (camelCase)
function mapFoodItemRow(row: any): FoodItem {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    category: row.category,
    quantity: Number(row.quantity),
    unit: row.unit,
    purchaseDate: row.purchase_date,
    expiryDate: row.expiry_date,
    storageLocation: row.storage_location,
    createdAt: row.created_at,
    status: calculateExpiryStatus(row.expiry_date),
    isUsed: Boolean(row.is_used),
    isWasted: Boolean(row.is_wasted),
    actionDate: row.action_date || null,
  };
}

// 1. Get logged-in user's food items
export async function getFoodItems(): Promise<FoodItem[]> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('getFoodItems auth error:', authError);
      throw new Error('You must be logged in to view food items.');
    }

    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('user_id', user.id)
      .order('expiry_date', { ascending: true });

    if (error) {
      console.error('getFoodItems Supabase error:', error.message, error.code);
      throw new Error(error.message || 'Failed to fetch food items.');
    }

    return (data || []).map(mapFoodItemRow);
  } catch (err: any) {
    console.error('getFoodItems error:', err.message);
    throw err;
  }
}

// 2. Add a new food item
export async function addFoodItem(item: FoodInput): Promise<FoodItem> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('addFoodItem auth error:', authError);
      throw new Error('You must be logged in to add food items.');
    }

    const { data, error } = await supabase
      .from('food_items')
      .insert({
        user_id: user.id,
        name: item.name.trim(),
        category: item.category.trim(),
        quantity: item.quantity,
        unit: item.unit.trim(),
        purchase_date: item.purchaseDate,
        expiry_date: item.expiryDate,
        storage_location: item.storageLocation,
        is_used: false,
      })
      .select()
      .single();

    if (error) {
      console.error('addFoodItem Supabase error:', error.message, error.code);
      throw new Error(error.message || 'Failed to save food item.');
    }

    return mapFoodItemRow(data);
  } catch (err: any) {
    console.error('addFoodItem error:', err.message);
    throw err;
  }
}

// 3. Update an existing food item
export async function updateFoodItem(
  id: string,
  item: Partial<FoodInput>
): Promise<FoodItem> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('updateFoodItem auth error:', authError);
      throw new Error('You must be logged in to update food items.');
    }

    const updatePayload: Record<string, any> = {};
    if (item.name !== undefined) updatePayload.name = item.name.trim();
    if (item.category !== undefined) updatePayload.category = item.category.trim();
    if (item.quantity !== undefined) updatePayload.quantity = item.quantity;
    if (item.unit !== undefined) updatePayload.unit = item.unit.trim();
    if (item.purchaseDate !== undefined)
      updatePayload.purchase_date = item.purchaseDate;
    if (item.expiryDate !== undefined)
      updatePayload.expiry_date = item.expiryDate;
    if (item.storageLocation !== undefined)
      updatePayload.storage_location = item.storageLocation;

    const { data, error } = await supabase
      .from('food_items')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('updateFoodItem Supabase error:', error.message, error.code);
      throw new Error(error.message || 'Failed to update food item.');
    }

    return mapFoodItemRow(data);
  } catch (err: any) {
    console.error('updateFoodItem error:', err.message);
    throw err;
  }
}

// 4. Delete a food item
export async function deleteFoodItem(id: string): Promise<void> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('deleteFoodItem auth error:', authError);
      throw new Error('You must be logged in to delete food items.');
    }

    const { error } = await supabase
      .from('food_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('deleteFoodItem Supabase error:', error.message, error.code);
      throw new Error(error.message || 'Failed to delete food item.');
    }
  } catch (err: any) {
    console.error('deleteFoodItem error:', err.message);
    throw err;
  }
}

// 5. Mark food item as used/unused
export async function markItemAsUsed(
  id: string,
  isUsed: boolean
): Promise<FoodItem> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('markItemAsUsed auth error:', authError);
      throw new Error('You must be logged in to update food items.');
    }

    const payload: Record<string, any> = {
      is_used: isUsed,
      is_wasted: false,
      action_date: isUsed ? new Date().toISOString() : null,
    };

    let { data, error } = await supabase
      .from('food_items')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    // Graceful fallback if is_wasted or action_date columns don't exist yet
    if (error && (error.code === '42703' || error.message?.includes('column'))) {
      const fallback = await supabase
        .from('food_items')
        .update({ is_used: isUsed })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('markItemAsUsed Supabase error:', error.message, error.code);
      throw new Error(error.message || 'Failed to update item status.');
    }

    return mapFoodItemRow(data);
  } catch (err: any) {
    console.error('markItemAsUsed error:', err.message);
    throw err;
  }
}

// 6. Mark food item as wasted/active
export async function markItemAsWasted(
  id: string,
  isWasted: boolean
): Promise<FoodItem> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('markItemAsWasted auth error:', authError);
      throw new Error('You must be logged in to update food items.');
    }

    const payload: Record<string, any> = {
      is_wasted: isWasted,
      is_used: false,
      action_date: isWasted ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('food_items')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('markItemAsWasted Supabase error:', error.message, error.code);
      if (error.code === '42703' || error.message?.includes('column')) {
        throw new Error(
          'Missing "is_wasted" column in database. Please run the provided ALTER TABLE SQL in Supabase SQL editor.'
        );
      }
      throw new Error(error.message || 'Failed to update item wasted status.');
    }

    return mapFoodItemRow(data);
  } catch (err: any) {
    console.error('markItemAsWasted error:', err.message);
    throw err;
  }
}
