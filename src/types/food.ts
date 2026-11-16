/**
 * FreshLine Shared Food Types
 * Used by Inventory, Expiry, Recipes and Dashboard.
 */

// =====================================================
// SHARED TYPES - Used by all team members
// =====================================================

export type ExpiryStatus =
  | 'Use Today'
  | 'Use Soon'
  | 'Fresh'
  | 'Expired';

export type StorageLocation =
  | 'Fridge'
  | 'Freezer'
  | 'Pantry';

// A complete food item returned from the database.
export interface FoodItem {
  id: string;
  userId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  storageLocation: StorageLocation;
  createdAt: string;
  status: ExpiryStatus;
}

// Fields needed when adding or editing a food item.
// No id, userId or status: status is derived from expiryDate.
export interface FoodInput {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  storageLocation: StorageLocation;
}

// =====================================================
// LEGACY DASHBOARD TYPES - Existing demo UI only
// Keep these until the dashboard is connected to
// the shared FoodItem model.
// =====================================================

export type DashboardFoodCategory =
  | 'dairy'
  | 'meat'
  | 'produce'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'other';

export type DashboardStorageLocation =
  | 'fridge'
  | 'freezer'
  | 'pantry';

export type DashboardFreshnessStatus =
  | 'use_today'
  | 'use_soon'
  | 'fresh';

export interface DashboardFoodItem {
  id: string;
  user_id?: string;
  name: string;
  category: DashboardFoodCategory;
  storage_location: DashboardStorageLocation;
  quantity: number;
  unit: string;
  days_left: number;
  expiry_date: string;
  status: DashboardFreshnessStatus;
  status_label: 'Use Today' | 'Use Soon' | 'Fresh';
  icon: string;
  notes?: string;
  is_used?: boolean;
  created_at: string;
  updated_at?: string;
}

// =====================================================
// EXISTING DASHBOARD SUPPORT TYPES
// =====================================================

export interface FoodSummaryStats {
  total_items: number;
  expiring_soon: number;
  food_saved: number;
  co2_saved_kg: number;
  money_saved_usd: number;
}

export interface UserProfile {
  id: string;
  full_name: string;
  greeting_time: string;
  tagline: string;
  avatar_url?: string;
  streak_days: number;
}

export type DashboardTab =
  | 'home'
  | 'inventory'
  | 'recipes'
  | 'insights'
  | 'profile';