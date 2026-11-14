import { FoodCategory, StorageLocation } from '@/types/food';
import {
  CreateFoodItemInput,
  InventoryValidationErrors,
  UpdateFoodItemInput,
} from '../types/inventory.types';

export const VALID_FOOD_CATEGORIES: FoodCategory[] = [
  'dairy',
  'meat',
  'produce',
  'bakery',
  'pantry',
  'frozen',
  'beverages',
  'other',
];

export const VALID_STORAGE_LOCATIONS: StorageLocation[] = [
  'fridge',
  'pantry',
  'freezer',
];

/**
 * Validates a creation payload for a food item.
 */
export function validateCreateFoodItem(
  input: Partial<CreateFoodItemInput>
): InventoryValidationErrors {
  const errors: InventoryValidationErrors = {};

  // Name validation
  if (!input.name || !input.name.trim()) {
    errors.name = 'Food name is required';
  } else if (input.name.trim().length < 2) {
    errors.name = 'Food name must be at least 2 characters';
  } else if (input.name.trim().length > 50) {
    errors.name = 'Food name must not exceed 50 characters';
  }

  // Category validation
  if (!input.category) {
    errors.category = 'Category is required';
  } else if (!VALID_FOOD_CATEGORIES.includes(input.category)) {
    errors.category = 'Invalid food category selected';
  }

  // Storage location validation
  if (!input.storage_location) {
    errors.storage_location = 'Storage location is required';
  } else if (!VALID_STORAGE_LOCATIONS.includes(input.storage_location)) {
    errors.storage_location = 'Invalid storage location selected';
  }

  // Quantity validation
  if (input.quantity === undefined || input.quantity === null || isNaN(input.quantity)) {
    errors.quantity = 'Quantity is required';
  } else if (input.quantity <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  } else if (input.quantity > 9999) {
    errors.quantity = 'Quantity must be less than 10,000';
  }

  // Unit validation
  if (!input.unit || !input.unit.trim()) {
    errors.unit = 'Unit is required (e.g. pcs, pack, g)';
  } else if (input.unit.trim().length > 20) {
    errors.unit = 'Unit must not exceed 20 characters';
  }

  // Expiry date validation
  if (!input.expiry_date || !input.expiry_date.trim()) {
    errors.expiry_date = 'Expiry date is required';
  } else {
    const timestamp = Date.parse(input.expiry_date);
    if (isNaN(timestamp)) {
      errors.expiry_date = 'Invalid expiry date format';
    }
  }

  return errors;
}

/**
 * Validates an update payload for a food item.
 */
export function validateUpdateFoodItem(
  input: UpdateFoodItemInput
): InventoryValidationErrors {
  const errors: InventoryValidationErrors = {};

  if (input.name !== undefined) {
    if (!input.name.trim()) {
      errors.name = 'Food name cannot be empty';
    } else if (input.name.trim().length < 2) {
      errors.name = 'Food name must be at least 2 characters';
    } else if (input.name.trim().length > 50) {
      errors.name = 'Food name must not exceed 50 characters';
    }
  }

  if (input.category !== undefined && !VALID_FOOD_CATEGORIES.includes(input.category)) {
    errors.category = 'Invalid food category selected';
  }

  if (
    input.storage_location !== undefined &&
    !VALID_STORAGE_LOCATIONS.includes(input.storage_location)
  ) {
    errors.storage_location = 'Invalid storage location selected';
  }

  if (input.quantity !== undefined) {
    if (isNaN(input.quantity) || input.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    } else if (input.quantity > 9999) {
      errors.quantity = 'Quantity must be less than 10,000';
    }
  }

  if (input.unit !== undefined) {
    if (!input.unit.trim()) {
      errors.unit = 'Unit cannot be empty';
    } else if (input.unit.trim().length > 20) {
      errors.unit = 'Unit must not exceed 20 characters';
    }
  }

  if (input.expiry_date !== undefined) {
    if (!input.expiry_date.trim() || isNaN(Date.parse(input.expiry_date))) {
      errors.expiry_date = 'Invalid expiry date format';
    }
  }

  return errors;
}

/**
 * Checks if the errors object has any recorded field errors.
 */
export function hasValidationErrors(errors: InventoryValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
