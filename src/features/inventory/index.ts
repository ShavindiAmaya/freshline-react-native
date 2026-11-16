/**
 * Member B: Smart Food Inventory Feature Module
 *
 * Provides complete inventory management backed by Supabase PostgreSQL:
 * - Real-time CRUD: add, view, edit and delete food items (food_items table)
 * - User-scoped data: all queries are filtered by the authenticated user's ID
 * - Expiry status: derived from expiryDate at read time — not stored in DB
 * - Storage filters: Fridge, Pantry, Freezer, All
 * - Expiry status filters: All, Use Today, Use Soon, Fresh, Expired
 * - Search by name or category
 * - Add / Edit form modals with full field-level validation
 * - Food Details modal with Finish as Consumed / Wasted buttons (pending Member E)
 * - Delete confirmation dialog
 * - Screen-focus reload via usePathname
 * - Pull-to-refresh and mutation refresh
 */

export * from './types/inventory.types';
export * from './validation/inventoryValidation';
export * from './services/inventoryService';
export * from './components/StorageFilterTabs';
export * from './components/ExpiryFilterChips';
export * from './components/FoodItemCard';
export * from './components/InventoryList';
export * from './components/AddFoodModal';
export * from './components/EditFoodModal';
export * from './components/FoodDetailsModal';
export * from './components/DeleteConfirmDialog';
export * from './screens/InventoryScreen';
