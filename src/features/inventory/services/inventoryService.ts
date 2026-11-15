import { INITIAL_FOOD_ITEMS } from '@/data/mock-food-data';
import { FoodCategory, FreshnessStatus } from '@/types/food';
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

/**
 * Default icon mapping per FoodCategory
 */
export const CATEGORY_DEFAULT_ICONS: Record<FoodCategory, string> = {
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
 * Helper to get today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * INVENTORY CRUD SERVICE (ISOLATED MOCK SERVICE)
 *
 * NOTE: This is an isolated, mock in-memory data store for Member B development.
 * It provides an async Promise-based interface so it can be cleanly replaced or
 * wired to Supabase by the Integration Lead once the client is ready.
 *
 * Freshness calculations follow minimal mock fallbacks to satisfy the shared FoodItem
 * contract without infringing on Member C's domain.
 */
class InventoryService {
  private items: InventoryFoodItem[] = INITIAL_FOOD_ITEMS.map((item) => ({
    ...item,
    purchase_date: item.created_at ? item.created_at.split('T')[0] : getTodayDateString(),
  }));

  /**
   * Helper to derive mock days_left and status to satisfy FoodItem contract.
   * Full freshness prediction logic is owned by Member C.
   */
  private deriveMockStatus(expiryDateIso: string): {
    days_left: number;
    status: FreshnessStatus;
    status_label: 'Use Today' | 'Use Soon' | 'Fresh';
  } {
    const target = new Date(expiryDateIso).getTime();
    const now = Date.now();
    const diffDays = Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));

    let status: FreshnessStatus = 'fresh';
    let status_label: 'Use Today' | 'Use Soon' | 'Fresh' = 'Fresh';

    if (diffDays === 0) {
      status = 'use_today';
      status_label = 'Use Today';
    } else if (diffDays <= 2) {
      status = 'use_soon';
      status_label = 'Use Soon';
    }

    return { days_left: diffDays, status, status_label };
  }

  /**
   * Fetch all inventory items
   */
  async getAll(): Promise<InventoryFoodItem[]> {
    return Promise.resolve([...this.items]);
  }

  /**
   * Fetch a single item by id
   */
  async getById(id: string): Promise<InventoryFoodItem | null> {
    const item = this.items.find((i) => i.id === id);
    return Promise.resolve(item ? { ...item } : null);
  }

  /**
   * Fetch items filtered by storage location
   */
  async getByLocation(location: StorageFilter): Promise<InventoryFoodItem[]> {
    if (location === 'all') {
      return this.getAll();
    }
    const filtered = this.items.filter((item) => item.storage_location === location);
    return Promise.resolve([...filtered]);
  }

  /**
   * Create a new food item in inventory
   */
  async create(input: CreateFoodItemInput): Promise<InventoryFoodItem> {
    // Default purchase_date to today if omitted
    const effectivePurchaseDate = input.purchase_date?.trim() || getTodayDateString();
    const payloadWithDefault: CreateFoodItemInput = {
      ...input,
      purchase_date: effectivePurchaseDate,
    };

    const errors = validateCreateFoodItem(payloadWithDefault);
    if (hasValidationErrors(errors)) {
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }

    const { days_left, status, status_label } = this.deriveMockStatus(input.expiry_date);
    const fallbackIcon = CATEGORY_DEFAULT_ICONS[input.category] || '🥗';

    const newItem: InventoryFoodItem = {
      id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: input.name.trim(),
      category: input.category,
      storage_location: input.storage_location,
      quantity: input.quantity,
      unit: input.unit.trim(),
      purchase_date: effectivePurchaseDate,
      expiry_date: input.expiry_date,
      days_left,
      status,
      status_label,
      icon: input.icon || fallbackIcon,
      notes: input.notes?.trim() || undefined,
      is_used: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.items = [newItem, ...this.items];
    return Promise.resolve({ ...newItem });
  }

  /**
   * Update an existing food item
   */
  async update(id: string, input: UpdateFoodItemInput): Promise<InventoryFoodItem> {
    const errors = validateUpdateFoodItem(input);
    if (hasValidationErrors(errors)) {
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }

    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`FoodItem with id "${id}" not found`);
    }

    const existing = this.items[index];
    const updatedExpiry = input.expiry_date ?? existing.expiry_date;
    const { days_left, status, status_label } = this.deriveMockStatus(updatedExpiry);

    const updatedItem: InventoryFoodItem = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      category: input.category ?? existing.category,
      storage_location: input.storage_location ?? existing.storage_location,
      quantity: input.quantity ?? existing.quantity,
      unit: input.unit !== undefined ? input.unit.trim() : existing.unit,
      purchase_date:
        input.purchase_date !== undefined
          ? input.purchase_date.trim()
          : existing.purchase_date,
      expiry_date: updatedExpiry,
      days_left,
      status,
      status_label,
      icon: input.icon ?? existing.icon,
      notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
      updated_at: new Date().toISOString(),
    };

    this.items[index] = updatedItem;
    return Promise.resolve({ ...updatedItem });
  }

  /**
   * Delete an item from inventory
   */
  async delete(id: string): Promise<boolean> {
    const initialLength = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    return Promise.resolve(this.items.length < initialLength);
  }

  /**
   * Reset store to initial mock data (helpful for dev/testing)
   */
  async resetToMockData(): Promise<void> {
    this.items = INITIAL_FOOD_ITEMS.map((item) => ({
      ...item,
      purchase_date: item.created_at ? item.created_at.split('T')[0] : getTodayDateString(),
    }));
    return Promise.resolve();
  }
}

export const inventoryService = new InventoryService();
