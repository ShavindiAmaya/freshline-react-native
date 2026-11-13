

import {
    FlatList,
    StyleSheet,
    Text,
    View
} from 'react-native';

import { recipes } from '../data/recipes';

import { FoodItem } from '../../../types/food';

import { rankRecipes } from '../services/recipe-matcher';

import RecipeCard from '../components/RecipeCard';

interface Props {
  foodItems: FoodItem[];
  onSelectRecipe: (recipeId: string) => void;
}

export default function RecipesScreen({
  foodItems,
  onSelectRecipe
}: Props) {

  const rankedRecipes = rankRecipes(
    recipes,
    foodItems
  );

  return (
    <View style={styles.container}>

      <Text style={styles.heading}>
        Discover Recipes
      </Text>

      <Text style={styles.subtitle}>
        Find delicious meals using ingredients
        you already have.
      </Text>

      {foodItems.length === 0 ? (

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>
            No Food Items Yet
          </Text>

          <Text style={styles.emptyText}>
            Add food to your inventory to discover
            matching recipes.
          </Text>
        </View>

      ) : (

        <FlatList
          data={rankedRecipes}
          keyExtractor={item => item.recipe.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item.recipe}
              match={item.match}
              onPress={() =>
                onSelectRecipe(item.recipe.id)
              }
            />
          )}
          contentContainerStyle={styles.list}
        />

      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F5',
    padding: 16
  },

  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#183C2B'
  },

  subtitle: {
    color: '#777777',
    marginTop: 7,
    marginBottom: 18
  },

  list: {
    paddingBottom: 25
  },

  emptyContainer: {
    marginTop: 50,
    padding: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    alignItems: 'center'
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#183C2B'
  },

  emptyText: {
    color: '#777777',
    textAlign: 'center',
    marginTop: 10
  }
});
