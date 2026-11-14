import { FoodItem } from '@/types/food';
import { Recipe, RecipeMatchResult } from '../types/recipe.types';

/**
 * Normalizes an ingredient or food name for consistent comparisons:
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips basic English plural suffixes (e.g. "tomatoes" -> "tomato", "eggs" -> "egg")
 */
export function normalizeIngredient(name: string): string {
  let cleaned = name.trim().toLowerCase();

  // Handle words ending in "es" (e.g. tomatoes, potatoes)
  if (
    cleaned.endsWith('es') &&
    (cleaned.endsWith('toes') || cleaned.endsWith('ches') || cleaned.endsWith('shes'))
  ) {
    cleaned = cleaned.slice(0, -2);
  } else if (cleaned.endsWith('s') && !cleaned.endsWith('ss')) {
    // Handle standard plurals ending in "s" (e.g. eggs, onions, apples)
    cleaned = cleaned.slice(0, -1);
  }

  return cleaned;
}

/**
 * Determines whether a FoodItem in inventory is usable for cooking:
 * - Must not be already marked as used/consumed (is_used !== true)
 * - Must not be expired (days_left >= 0)
 *
 * Uses the actual shared FoodItem fields without inventing new status values.
 */
export function isFoodItemUsable(item: FoodItem): boolean {
  if (item.is_used) {
    return false;
  }
  if (typeof item.days_left === 'number' && item.days_left < 0) {
    return false;
  }
  return true;
}

/**
 * Checks if a food item is urgent (needs to be consumed right away):
 * Uses the official shared FreshnessStatus values: 'use_today' and 'use_soon'.
 */
export function isFoodItemUrgent(item: FoodItem): boolean {
  return item.status === 'use_today' || item.status === 'use_soon';
}

/**
 * Checks whether a recipe ingredient matches a specific food item from inventory:
 * 1. Supports exact normalized match (e.g. "tomato" matches "tomatoes").
 * 2. Supports matching a recipe ingredient against a complete word in a longer inventory name
 *    (e.g., recipe ingredient "Chicken" matches inventory item "Chicken Breast").
 * 3. Does NOT allow reverse word-containment (e.g., recipe ingredient "Pasta Sauce"
 *    will NOT match inventory item "Pasta" alone).
 */
function doesIngredientMatchFood(recipeIngredient: string, foodItemName: string): boolean {
  const normIngredient = normalizeIngredient(recipeIngredient);
  const normFood = normalizeIngredient(foodItemName);

  // 1. Direct normalized match (e.g. "tomato" === "tomato")
  if (normIngredient === normFood) {
    return true;
  }

  // 2. Recipe ingredient matches a complete word in inventory food name
  // Example: Recipe ingredient "Chicken" matches inventory item "Chicken Breast"
  const foodWords = foodItemName
    .toLowerCase()
    .split(/\s+/)
    .map(normalizeIngredient);

  if (foodWords.includes(normIngredient)) {
    return true;
  }

  return false;
}

/**
 * Matches a single recipe against the user's available food inventory.
 *
 * Excludes used and expired food items, calculates match percentage,
 * lists available and missing ingredients, and identifies urgent items rescued.
 */
export function matchRecipe(recipe: Recipe, foodItems: FoodItem[]): RecipeMatchResult {
  // Filter for only usable (non-used, non-expired) items
  const usableItems = foodItems.filter(isFoodItemUsable);

  const availableIngredients: string[] = [];
  const missingIngredients: string[] = [];
  const urgentIngredientsUsed: string[] = [];

  for (const ingredient of recipe.ingredients) {
    // Find matching usable item in user's inventory
    const matchedFood = usableItems.find((item) =>
      doesIngredientMatchFood(ingredient, item.name)
    );

    if (matchedFood) {
      availableIngredients.push(ingredient);

      // Track if this rescued an item expiring today or soon
      if (isFoodItemUrgent(matchedFood)) {
        urgentIngredientsUsed.push(ingredient);
      }
    } else {
      missingIngredients.push(ingredient);
    }
  }

  const totalRequired = recipe.ingredients.length;
  const matchedCount = availableIngredients.length;

  // Safe percentage calculation to avoid division by zero
  const matchPercent =
    totalRequired === 0
      ? 0
      : Math.round((matchedCount / totalRequired) * 100);

  // User can cook only if all required ingredients are present and recipe is not empty
  const canCook = totalRequired > 0 && missingIngredients.length === 0;

  return {
    recipe,
    availableIngredients,
    missingIngredients,
    matchPercent,
    urgentIngredientsUsed,
    canCook,
  };
}

/**
 * Matches and ranks multiple recipes against the user's food inventory.
 *
 * Ranking criteria:
 * 1. Primary: Number of urgent (use_today / use_soon) ingredients rescued (highest first)
 * 2. Secondary: Match percentage (highest first)
 * 3. Tie-breaker: Alphabetical recipe name
 */
export function matchRecipes(
  foodItems: FoodItem[],
  recipeList: Recipe[]
): RecipeMatchResult[] {
  const matched = recipeList.map((recipe) => matchRecipe(recipe, foodItems));

  return matched.sort((a, b) => {
    // 1. Primary: Most urgent ingredients rescued
    if (b.urgentIngredientsUsed.length !== a.urgentIngredientsUsed.length) {
      return b.urgentIngredientsUsed.length - a.urgentIngredientsUsed.length;
    }

    // 2. Secondary: Highest match percentage
    if (b.matchPercent !== a.matchPercent) {
      return b.matchPercent - a.matchPercent;
    }

    // 3. Fallback: Alphabetical order
    return a.recipe.name.localeCompare(b.recipe.name);
  });
}
