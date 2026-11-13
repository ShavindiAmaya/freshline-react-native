
export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  preparationMinutes: number;
  category?: string;
}

export interface RecipeMatch {
  availableIngredients: string[];
  missingIngredients: string[];
  matchPercentage: number;
  urgentIngredientsUsed: string[];
}
