import { supabase } from '@/lib/supabase';
import { DashboardFoodCategory, ExpiryStatus, StorageLocation } from '@/types/food';
import {
  CreateFoodItemInput,
  InventoryFoodItem,
  StorageFilter,
  UpdateFoodItemInput,
} from '../types/inventory.types';
import {
  hasValidationErrors,
  validateCreateFoodItem,
  validateUpdateFoodItem,
} from '../validation/inventoryValidation';

// ─────────────────────────────────────────────────────────────
// UI helpers (still imported by AddFoodModal / EditFoodModal)
// ─────────────────────────────────────────────────────────────

/**
 * Sets a default emoji for each food category.
 * Used in the form preview only, not saved to the database.
 */
export const CATEGORY_DEFAULT_ICONS: Record<DashboardFoodCategory, string> = {
  dairy: '🥛',
  meat: '🍗',
  produce: '🥦',
  bakery: '🍞',
  pantry: '🥫',
  frozen: '🧊',
  beverages: '🧃',
  other: '🥗',
};

/**
 * Returns today's date formatted as YYYY-MM-DD using local time.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Internal helper functions

/**
 * Checks the expiry date and returns the correct status.
 * Compares dates without considering the time.
 */
function deriveStatus(expiryDate: string): ExpiryStatus {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  // Parse expiry as a local calendar date to avoid UTC offset shifts
  const parts = expiryDate.substring(0, 10).split('-').map(Number);
  const expiryStart = new Date(parts[0], parts[1] - 1, parts[2]).getTime();

  const diffMs = expiryStart - todayStart;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Use Today';
  if (diffDays <= 2) return 'Use Soon';
  return 'Fresh';
}
/**
 * Changes database data into the FoodItem format used in the app.
 * Also sets the item's expiry status.
 */
function mapRow(row: any): InventoryFoodItem {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    category: row.category as string,
    quantity: row.quantity as number,
    unit: row.unit as string,
    purchaseDate: row.purchase_date as string,
    expiryDate: row.expiry_date as string,
    storageLocation: row.storage_location as StorageLocation,
    createdAt: row.created_at as string,
    status: deriveStatus(row.expiry_date as string),
  };
}

/**
 * Gets the logged-in user's ID.
 * Shows an error if no user is logged in.
 */
async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Not authenticated. Please sign in to access your inventory.');
  }
  return data.user.id;
}

// Inventory service

/**
 * Handles adding, viewing, updating, and deleting food items in Supabase.
 * Each operation works only with the logged-in user's data.
 * Converts database data into the FoodItem format used in the app.
 * Calculates expiry status from the expiry date.
 */
class InventoryService {
  /**
  * Gets the current user's food items, newest first.
  */
  async getAll(): Promise<InventoryFoodItem[]> {
    const uid = await getCurrentUserId();
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to load inventory: ${error.message}`);
    return (data ?? []).map(mapRow);
  }

  /**
 * Gets one food item by ID for the logged-in user.
 */
  async getById(id: string): Promise<InventoryFoodItem | null> {
    const uid = await getCurrentUserId();
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error(`Failed to fetch item: ${error.message}`);
    }
    return data ? mapRow(data) : null;
  }

  /**
 * Gets food items by storage location.
 * Returns all items if 'all' is selected.
 */
  async getByLocation(location: StorageFilter): Promise<InventoryFoodItem[]> {
    if (location === 'all') return this.getAll();

    const uid = await getCurrentUserId();
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .eq('user_id', uid)
      .eq('storage_location', location)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to filter inventory: ${error.message}`);
    return (data ?? []).map(mapRow);
  }

  /**
  * Adds a new food item for the logged-in user.
  * Checks the details before saving.
  * Uses today's date if the purchase date is not provided.
  */
  async create(input: CreateFoodItemInput): Promise<InventoryFoodItem> {
    const effectivePurchaseDate = input.purchase_date?.trim() || getTodayDateString();
    const payloadWithDefault: CreateFoodItemInput = {
      ...input,
      purchase_date: effectivePurchaseDate,
    };

    const errors = validateCreateFoodItem(payloadWithDefault);
    if (hasValidationErrors(errors)) {
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }

    const uid = await getCurrentUserId();

    const { data, error } = await supabase
      .from('food_items')
      .insert({
        user_id: uid,
        name: input.name.trim(),
        category: input.category,
        quantity: input.quantity,
        unit: input.unit.trim(),
        purchase_date: effectivePurchaseDate,
        expiry_date: input.expiry_date,
        storage_location: input.storage_location,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create item: ${error.message}`);
    return mapRow(data);
  }

  /**
   * Update an existing food item by id.
   * Validates the partial update payload.
   * Only columns present in the input are updated.
   */
  async update(id: string, input: UpdateFoodItemInput): Promise<InventoryFoodItem> {
    const errors = validateUpdateFoodItem(input);
    if (hasValidationErrors(errors)) {
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }

    const uid = await getCurrentUserId();

    // Build only the columns being updated
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.category !== undefined) patch.category = input.category;
    if (input.quantity !== undefined) patch.quantity = input.quantity;
    if (input.unit !== undefined) patch.unit = input.unit.trim();
    if (input.purchase_date !== undefined) patch.purchase_date = input.purchase_date.trim();
    if (input.expiry_date !== undefined) patch.expiry_date = input.expiry_date;
    if (input.storage_location !== undefined) patch.storage_location = input.storage_location;

    const { data, error } = await supabase
      .from('food_items')
      .update(patch)
      .eq('id', id)
      .eq('user_id', uid)
      .select()
      .single();

    if (error) throw new Error(`Failed to update item: ${error.message}`);
    return mapRow(data);
  }

  /**
 * Deletes a food item by ID.
 * Returns true if deleted, or false if not found.
 * Waste record integration will be added by Member E later.
 */
  async delete(id: string): Promise<boolean> {
    const uid = await getCurrentUserId();
    const { error, count } = await supabase
      .from('food_items')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', uid);

    if (error) throw new Error(`Failed to delete item: ${error.message}`);
    return (count ?? 0) > 0;
  }
}

export const inventoryService = new InventoryService();

// Makes deriveStatus available to UI components.
export { deriveStatus };
