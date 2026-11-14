/**
 * FreshLine Recipes Feature (Member D - Cook What I Have)
 *
 * Public exports for the Integration Lead and other features:
 * - Screens: RecipesScreen, RecipeDetailsScreen
 * - Components: RecipeCard, IngredientMatchList
 * - Services: matchRecipe, matchRecipes, normalizeIngredient, isFoodItemUsable, isFoodItemUrgent
 * - Types: Recipe, RecipeMatchResult
 * - Data: recipes
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
