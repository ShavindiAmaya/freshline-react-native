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
 * Validates that a string matches the exact YYYY-MM-DD format using a regex
 * and represents a real, valid calendar date (rejecting invalid dates like 2026-02-30).
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;

  // Accept only the exact YYYY-MM-DD format using a regex
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Month and day range checks
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Calendar validity check (rejects non-existent dates such as 2026-02-30 or 2026-04-31)
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Normalizes a date string or timestamp to start-of-day for calendar-day comparison.
 */
export function toStartOfDay(dateStr: string): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  }
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

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
  let hasValidExpiry = false;
  if (!input.expiry_date || !input.expiry_date.trim()) {
    errors.expiry_date = 'Expiry date is required';
  } else if (!isValidDateString(input.expiry_date)) {
    errors.expiry_date = 'Invalid expiry date format (use YYYY-MM-DD)';
  } else {
    hasValidExpiry = true;
  }

  // Purchase date validation
  if (input.purchase_date && input.purchase_date.trim()) {
    if (!isValidDateString(input.purchase_date)) {
      errors.purchase_date = 'Invalid purchase date format (use YYYY-MM-DD)';
    } else if (hasValidExpiry && input.expiry_date) {
      if (toStartOfDay(input.purchase_date) > toStartOfDay(input.expiry_date)) {
        errors.purchase_date = 'Purchase date must not be later than expiry date';
      }
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

  let hasValidExpiry = false;
  if (input.expiry_date !== undefined) {
    if (!input.expiry_date.trim() || !isValidDateString(input.expiry_date)) {
      errors.expiry_date = 'Invalid expiry date format (use YYYY-MM-DD)';
    } else {
      hasValidExpiry = true;
    }
  }

  if (input.purchase_date !== undefined) {
    if (!input.purchase_date.trim() || !isValidDateString(input.purchase_date)) {
      errors.purchase_date = 'Invalid purchase date format (use YYYY-MM-DD)';
    } else if (hasValidExpiry && input.expiry_date) {
      if (toStartOfDay(input.purchase_date) > toStartOfDay(input.expiry_date)) {
        errors.purchase_date = 'Purchase date must not be later than expiry date';
      }
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
