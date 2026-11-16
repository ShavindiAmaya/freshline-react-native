/**
 * Exports the Recipes feature components, screens, services, types, and data.
 */

// Screens
export { RecipesScreen } from './screens/RecipesScreen';
export type { RecipesScreenProps } from './screens/RecipesScreen';

export { RecipeDetailsScreen } from './screens/RecipeDetailsScreen';
export type { RecipeDetailsScreenProps } from './screens/RecipeDetailsScreen';

// Components
export { RecipeCard } from './components/RecipeCard';
export { IngredientMatchList } from './components/IngredientMatchList';

// Services & Matcher
export {
  matchRecipe,
  matchRecipes,
  normalizeIngredient,
  isFoodItemUsable,
  isFoodItemUrgent,
} from './services/recipe-matcher';

// Data
export { recipes } from './data/recipes';

// Types
export type { Recipe, RecipeMatchResult } from './types/recipe.types';
