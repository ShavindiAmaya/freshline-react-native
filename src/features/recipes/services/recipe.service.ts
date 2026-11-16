import { PREDEFINED_RECIPES, Recipe } from '@/features/recipes/data/recipes';
import { getFoodItems } from '@/features/inventory/services/inventory.service';
import { getProfile } from '@/features/profile/services/profile.service';
import { FoodItem, getDaysRemaining } from '@/types/food';

export interface RecipeRecommendation {
  recipe: Recipe;
  matchScore: number;
  availableIngredients: string[];
  missingIngredients: string[];
  expiringIngredients: string[];
  isFavoriteCuisine: boolean;
}

// Common aliases for kitchen inventory matching
const INGREDIENT_ALIASES: Record<string, string[]> = {
  tomato: ['tomato', 'tomatoes', 'cherry tomato'],
  tomatoes: ['tomato', 'tomatoes', 'cherry tomato'],
  chicken: ['chicken', 'chicken breast', 'chicken curry cut', 'cooked chicken'],
  egg: ['egg', 'eggs'],
  eggs: ['egg', 'eggs'],
  milk: ['milk', 'fresh milk', 'heavy cream', 'cream'],
  bread: ['bread', 'toast', 'sliced bread'],
  butter: ['butter', 'ghee'],
  rice: ['rice', 'cooked rice', 'basmati rice', 'white rice'],
  carrot: ['carrot', 'carrots'],
  carrots: ['carrot', 'carrots'],
  onion: ['onion', 'onions', 'spring onion', 'spring onions'],
  onions: ['onion', 'onions', 'spring onion', 'spring onions'],
  garlic: ['garlic', 'garlic cloves'],
  pasta: ['pasta', 'spaghetti', 'penne', 'macaroni', 'noodles'],
  banana: ['banana', 'bananas'],
  bananas: ['banana', 'bananas'],
  yogurt: ['yogurt', 'curd', 'yoghurt', 'greek yogurt'],
  potato: ['potato', 'potatoes'],
  potatoes: ['potato', 'potatoes'],
  spinach: ['spinach', 'spinach leaves', 'palak'],
};

/**
 * Checks whether an inventory item matches a recipe key ingredient.
 */
export function isIngredientMatch(
  inventoryItemName: string,
  keyIngredient: string
): boolean {
  const inv = inventoryItemName.toLowerCase().trim();
  const req = keyIngredient.toLowerCase().trim();

  // 1. Direct substring matching
  if (inv.includes(req) || req.includes(inv)) {
    return true;
  }

  // 2. Alias matching
  for (const [aliasKey, aliasList] of Object.entries(INGREDIENT_ALIASES)) {
    if (req.includes(aliasKey)) {
      if (aliasList.some((alias) => inv.includes(alias))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Computes recommendations from given items and profile preferences.
 * Pure function: easy to test and calculate synchronously in UI.
 */
export function calculateRecipeRecommendations(
  items: FoodItem[],
  profile: any
): RecipeRecommendation[] {
  // 1. Filter active (non-used and non-expired) items
  const activeItems = (items || []).filter((item) => {
    if (item.isUsed) return false;
    const days = getDaysRemaining(item.expiryDate);
    // Ignore expired items (daysRemaining < 0)
    return days >= 0;
  });

  // Extract user preferences
  const dietaryPref = profile?.dietary_preference || 'not_set';
  const userAllergies: string[] = Array.isArray(profile?.allergies)
    ? profile.allergies.map((a: string) => a.toLowerCase().trim())
    : [];
  const disliked: string[] = Array.isArray(profile?.disliked_ingredients)
    ? profile.disliked_ingredients.map((d: string) => d.toLowerCase().trim())
    : [];
  const favoriteCuisines: string[] = Array.isArray(profile?.favorite_cuisines)
    ? profile.favorite_cuisines.map((c: string) => c.toLowerCase().trim())
    : [];

  const recommendations: RecipeRecommendation[] = [];

  for (const recipe of PREDEFINED_RECIPES) {
    // 2. Filter by Dietary Preference
    if (dietaryPref === 'vegan' && recipe.dietaryType !== 'Vegan') {
      continue;
    }
    if (
      dietaryPref === 'vegetarian' &&
      recipe.dietaryType !== 'Vegetarian' &&
      recipe.dietaryType !== 'Vegan'
    ) {
      continue;
    }

    // 3. Exclude recipes with known user allergens
    if (userAllergies.length > 0 && recipe.allergens?.length) {
      const hasAllergen = recipe.allergens.some((allergen) =>
        userAllergies.includes(allergen.toLowerCase().trim())
      );
      if (hasAllergen) {
        continue;
      }
    }

    // 4. Exclude recipes with disliked ingredients
    if (disliked.length > 0) {
      const hasDisliked = recipe.keyIngredients.some((ing) => {
        const ingLower = ing.toLowerCase().trim();
        return disliked.some(
          (dis) => ingLower.includes(dis) || dis.includes(ingLower)
        );
      });
      if (hasDisliked) {
        continue;
      }
    }

    // 5. Compare ingredients with available active inventory items
    const availableIngredients: string[] = [];
    const missingIngredients: string[] = [];
    const expiringIngredients: string[] = [];

    for (const keyIng of recipe.keyIngredients) {
      // Find matching items in user's active inventory
      const matchingItems = activeItems.filter((item) =>
        isIngredientMatch(item.name, keyIng)
      );

      if (matchingItems.length > 0) {
        availableIngredients.push(keyIng);

        // Check if any matching item is expiring within 3 days (0 to 3 days remaining)
        const isExpiring = matchingItems.some((item) => {
          const days = getDaysRemaining(item.expiryDate);
          return days >= 0 && days <= 3;
        });

        if (isExpiring) {
          expiringIngredients.push(keyIng);
        }
      } else {
        missingIngredients.push(keyIng);
      }
    }

    // 6. Calculate scoring (out of 100 points maximum)
    const totalIngredients = Math.max(1, recipe.keyIngredients.length);

    // Available ingredients score: up to 50 points
    const availableRatio = availableIngredients.length / totalIngredients;
    const availableScore = Math.round(availableRatio * 50);

    // Expiring ingredients priority: up to 40 points
    // (Each expiring ingredient gives up to 20 bonus points, capped at 40)
    const expiringScore = Math.min(40, expiringIngredients.length * 20);

    // Favorite cuisine preference: 10 points
    const isFavoriteCuisine = favoriteCuisines.includes(
      (recipe.cuisine || '').toLowerCase().trim()
    );
    const cuisineScore = isFavoriteCuisine ? 10 : 0;

    const totalScore = Math.min(100, availableScore + expiringScore + cuisineScore);

    recommendations.push({
      recipe,
      matchScore: totalScore,
      availableIngredients,
      missingIngredients,
      expiringIngredients,
      isFavoriteCuisine,
    });
  }

  // 7. Sort recipes by match score descending
  recommendations.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    // Secondary tie-breaker: more expiring ingredients first
    if (b.expiringIngredients.length !== a.expiringIngredients.length) {
      return b.expiringIngredients.length - a.expiringIngredients.length;
    }
    // Tertiary tie-breaker: more available ingredients first
    return b.availableIngredients.length - a.availableIngredients.length;
  });

  return recommendations;
}

//  Fetches the user's inventory
export async function getRecommendedRecipes(): Promise<RecipeRecommendation[]> {
  try {
    const [items, profile] = await Promise.all([
      getFoodItems().catch(() => []),
      getProfile().catch(() => null),
    ]);

    return calculateRecipeRecommendations(items, profile);
  } catch (error) {
    console.error('Error getting recommended recipes:', error);
    // Fallback: return default recipes with 0 score
    return PREDEFINED_RECIPES.map((recipe) => ({
      recipe,
      matchScore: 0,
      availableIngredients: [],
      missingIngredients: [...recipe.keyIngredients],
      expiringIngredients: [],
      isFavoriteCuisine: false,
    }));
  }
}
