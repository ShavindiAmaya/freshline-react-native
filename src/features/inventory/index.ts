/**
 * Member B: Smart Food Inventory Feature Module
 *
 * Provides complete inventory management:
 * - Inventory list and item card views
 * - Location filtering (Fridge, Pantry, Freezer, All)
 * - Add Food form modal with validation
 * - Food Details modal
 * - Edit Food form modal with validation
 * - Delete Food confirmation dialog
 * - Isolated CRUD service with mock data
 */

export * from './types/inventory.types';
export * from './validation/inventoryValidation';
export * from './services/inventoryService';
export * from './components/StorageFilterTabs';
export * from './components/FoodItemCard';
export * from './components/InventoryList';
export * from './components/AddFoodModal';
export * from './components/EditFoodModal';
export * from './components/FoodDetailsModal';
export * from './components/DeleteConfirmDialog';
export * from './screens/InventoryScreen';
