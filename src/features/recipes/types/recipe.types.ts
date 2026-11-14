/**
 * Recipe types for FreshLine (Member D - Cook What I Have)
 *
 * Kept local to src/features/recipes/ to comply with the team rule:
 * "Write only in your owned feature folder, do not modify shared types".
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
