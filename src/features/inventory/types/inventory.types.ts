import { DashboardFoodCategory, FoodItem, StorageLocation } from '@/types/food';

/**
 * InventoryFoodItem is fully compatible with the shared FoodItem interface.
 * The shared FoodItem already includes all required camelCase fields:
 *   id, userId, name, category, quantity, unit,
 *   purchaseDate, expiryDate, storageLocation, createdAt, status
 *
 * Presentation-only values (icon emoji, days remaining, status label) are
 * derived at render time — they are NOT stored in the database and NOT added
 * as properties here.
 */
export type InventoryFoodItem = FoodItem;

/**
 * Storage filter options: show all items or filter by a specific location.
 */
export type StorageFilter = 'all' | StorageLocation;

/**
 * Expiry status filter options.
 * 'all' shows every item regardless of status.
 * The other values match ExpiryStatus from @/types/food exactly and are
 * derived at render time — no status column is read from or written to Supabase.
 */
export type ExpiryFilter = 'all' | 'Use Today' | 'Use Soon' | 'Fresh' | 'Expired';

/**
 * Input payload for creating a new food item.
 * Uses snake_case property names for form-field compatibility with existing
 * UI components. The service layer maps these to the DB column names.
 *
 * storage_location values: 'Fridge' | 'Freezer' | 'Pantry'  (capitalized)
 */
export interface CreateFoodItemInput {
  name: string;
  category: DashboardFoodCategory;
  storage_location: StorageLocation;
  quantity: number;
  unit: string;
  purchase_date?: string; // YYYY-MM-DD (defaults to today when omitted)
  expiry_date: string;    // YYYY-MM-DD
}

/**
 * Input payload for updating an existing food item.
 * All fields are optional — only supplied fields are updated.
 */
export interface UpdateFoodItemInput {
  name?: string;
  category?: DashboardFoodCategory;
  storage_location?: StorageLocation;
  quantity?: number;
  unit?: string;
  purchase_date?: string; // YYYY-MM-DD
  expiry_date?: string;   // YYYY-MM-DD
}

/**
 * Field-level validation error messages shown beneath each form field.
 */
export interface InventoryValidationErrors {
  name?: string;
  category?: string;
  storage_location?: string;
  quantity?: string;
  unit?: string;
  purchase_date?: string;
  expiry_date?: string;
  general?: string;
}
