/**
 * Food Item Types for FreshLine
 * Designed to map cleanly to Supabase PostgreSQL schema:
 * - Table: `food_items`
 * - Table: `user_profiles`
 * - Table: `food_waste_logs`
 */

export type FoodCategory =
  | 'dairy'
  | 'meat'
  | 'produce'
  | 'bakery'
  | 'pantry'
  | 'frozen'
  | 'beverages'
  | 'other';

export type StorageLocation = 'fridge' | 'freezer' | 'pantry';

export type FreshnessStatus = 'use_today' | 'use_soon' | 'fresh';

export interface FoodItem {
  id: string;
  user_id?: string;
  name: string;
  category: FoodCategory;
  storage_location: StorageLocation;
  quantity: number;
  unit: string;
  days_left: number;
  expiry_date: string; // ISO 8601 string for Supabase timestamptz
  status: FreshnessStatus;
  status_label: 'Use Today' | 'Use Soon' | 'Fresh';
  icon: string;
  notes?: string;
  is_used?: boolean;
  created_at: string;
  updated_at?: string;
}

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

export type DashboardTab = 'home' | 'inventory' | 'recipes' | 'insights' | 'profile';

