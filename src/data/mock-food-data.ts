import { FoodItem, FoodSummaryStats, UserProfile } from '@/types/food';

/**
 * Mock Food Data for FreshLine
 *
 * Prepared for future Supabase PostgreSQL integration.
 * In production, these will be populated from:
 * `supabase.from('food_items').select('*').order('days_left', { ascending: true })`
 */

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr_freshline_01',
  full_name: 'Alex Johnson',
  greeting_time: 'Good morning!',
  tagline: "Let's keep your food fresh.",
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  streak_days: 5,
};

export const INITIAL_SUMMARY_STATS: FoodSummaryStats = {
  total_items: 12,
  expiring_soon: 3,
  food_saved: 8,
  co2_saved_kg: 3.4,
  money_saved_usd: 42.5,
};

export const INITIAL_FOOD_ITEMS: FoodItem[] = [
  {
    id: 'food_1',
    name: 'Milk',
    category: 'dairy',
    storage_location: 'fridge',
    quantity: 1,
    unit: 'carton (1L)',
    days_left: 0,
    expiry_date: new Date().toISOString(),
    status: 'use_today',
    status_label: 'Use Today',
    icon: '🥛',
    notes: 'Whole milk • Open 4 days ago',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'food_2',
    name: 'Chicken Breast',
    category: 'meat',
    storage_location: 'fridge',
    quantity: 500,
    unit: 'g',
    days_left: 1,
    expiry_date: new Date(Date.now() + 1 * 86400000).toISOString(),
    status: 'use_soon',
    status_label: 'Use Soon',
    icon: '🍗',
    notes: 'Organic boneless • Marinate or freeze',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'food_3',
    name: 'Tomatoes',
    category: 'produce',
    storage_location: 'pantry',
    quantity: 4,
    unit: 'pcs',
    days_left: 2,
    expiry_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'use_soon',
    status_label: 'Use Soon',
    icon: '🍅',
    notes: 'Vine ripe • Great for pasta sauce',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'food_4',
    name: 'Eggs',
    category: 'dairy',
    storage_location: 'fridge',
    quantity: 12,
    unit: 'pack',
    days_left: 10,
    expiry_date: new Date(Date.now() + 10 * 86400000).toISOString(),
    status: 'fresh',
    status_label: 'Fresh',
    icon: '🥚',
    notes: 'Free-range brown eggs',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

