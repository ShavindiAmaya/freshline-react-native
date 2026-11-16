
/**
 * Defines the types used in the FreshLine Recipes feature.
 */

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  minutes: number;
  category?: string;
  description?: string;
}

export interface RecipeMatchResult {
  recipe: Recipe;
  availableIngredients: string[];
  missingIngredients: string[];
  matchPercent: number;
  urgentIngredientsUsed: string[];
  canCook: boolean;
}
