
import { FoodItem } from '../../../types/food';
import { Recipe, RecipeMatch } from '../types/recipe.types';

function normalizeIngredient(name: string): string {
  return name.trim().toLowerCase();
}

export function matchRecipe(
  recipe: Recipe,
  foodItems: FoodItem[]
): RecipeMatch {

  const availableNames = new Set(
    foodItems
      .filter(item => !item.is_used)
      .map(item => normalizeIngredient(item.name))
  );

  const availableIngredients: string[] = [];
  const missingIngredients: string[] = [];
  const urgentIngredientsUsed: string[] = [];

  recipe.ingredients.forEach(ingredient => {

    const normalized = normalizeIngredient(ingredient);

    if (availableNames.has(normalized)) {

      availableIngredients.push(ingredient);

      const matchedFood = foodItems.find(
        item =>
          normalizeIngredient(item.name) === normalized &&
          !item.is_used
      );

      if (
        matchedFood?.status === 'use_today' ||
        matchedFood?.status === 'use_soon'
      ) {
        urgentIngredientsUsed.push(ingredient);
      }

    } else {
      missingIngredients.push(ingredient);
    }
  });

  const matchPercentage =
    recipe.ingredients.length === 0
      ? 0
      : Math.round(
          (availableIngredients.length /
            recipe.ingredients.length) * 100
        );

  return {
    availableIngredients,
    missingIngredients,
    matchPercentage,
    urgentIngredientsUsed
  };
}

export function rankRecipes(
  recipeList: Recipe[],
  foodItems: FoodItem[]
) {

  return recipeList
    .map(recipe => ({
      recipe,
      match: matchRecipe(recipe, foodItems)
    }))
    .sort((a, b) => {

      if (
        b.match.urgentIngredientsUsed.length !==
        a.match.urgentIngredientsUsed.length
      ) {
        return (
          b.match.urgentIngredientsUsed.length -
          a.match.urgentIngredientsUsed.length
        );
      }

      return (
        b.match.matchPercentage -
        a.match.matchPercentage
      );
    });
}
