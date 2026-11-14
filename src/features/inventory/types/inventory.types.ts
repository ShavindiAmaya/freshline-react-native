import { FoodCategory, FoodItem, StorageLocation } from '@/types/food';

/**
 * Storage filter options: All items or filtered by specific storage location
 */
export type StorageFilter = 'all' | StorageLocation;

/**
 * Input payload for adding a new FoodItem
 */
export interface CreateFoodItemInput {
  name: string;
  category: FoodCategory;
  storage_location: StorageLocation;
  quantity: number;
  unit: string;
  expiry_date: string; // ISO 8601 string (e.g. YYYY-MM-DD or full timestamp)
  icon?: string;
  notes?: string;
}

/**
 * Input payload for updating an existing FoodItem
 */
export interface UpdateFoodItemInput {
  name?: string;
  category?: FoodCategory;
  storage_location?: StorageLocation;
  quantity?: number;
  unit?: string;
  expiry_date?: string;
  icon?: string;
  notes?: string;
}

/**
 * Field-level validation errors
 */
export interface InventoryValidationErrors {
  name?: string;
  category?: string;
  storage_location?: string;
  quantity?: string;
  unit?: string;
  expiry_date?: string;
  general?: string;
}
