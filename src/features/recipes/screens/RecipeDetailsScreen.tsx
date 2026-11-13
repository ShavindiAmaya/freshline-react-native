

import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

import { recipes } from '../data/recipes';

import { FoodItem } from '../../../types/food';

import { matchRecipe } from '../services/recipe-matcher';

import IngredientMatchList from '../components/IngredientMatchList';

interface Props {
  recipeId: string;
  foodItems: FoodItem[];
}

export default function RecipeDetailsScreen({
  recipeId,
  foodItems
}: Props) {

  const recipe = recipes.find(
    item => item.id === recipeId
  );

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text>Recipe not found.</Text>
      </View>
    );
  }

  const match = matchRecipe(recipe, foodItems);

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        {recipe.name}
      </Text>

      <Text style={styles.description}>
        {recipe.description}
      </Text>

      <View style={styles.infoCard}>
        <Text style={styles.info}>
          Preparation Time: {recipe.preparationMinutes} minutes
        </Text>

        <Text style={styles.info}>
          Category: {recipe.category || 'General'}
        </Text>

        <Text style={styles.info}>
          Ingredient Match: {match.matchPercentage}%
        </Text>
      </View>

      <IngredientMatchList match={match} />

      {match.urgentIngredientsUsed.length > 0 && (
        <View style={styles.urgentCard}>
          <Text style={styles.urgentTitle}>
            Help Reduce Food Waste!
          </Text>

          <Text style={styles.urgentText}>
            This recipe can use:
            {' '}
            {match.urgentIngredientsUsed.join(', ')}
          </Text>
        </View>
      )}

      <View style={styles.instructionsCard}>

        <Text style={styles.sectionTitle}>
          Preparation Instructions
        </Text>

        {recipe.instructions.map((step, index) => (
          <View key={index} style={styles.step}>

            <Text style={styles.stepNumber}>
              {index + 1}.
            </Text>

            <Text style={styles.stepText}>
              {step}
            </Text>

          </View>
        ))}

      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F5',
    padding: 16
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#183C2B',
    marginTop: 10
  },

  description: {
    color: '#777777',
    fontSize: 15,
    marginTop: 10
  },

  infoCard: {
    backgroundColor: '#E8F3EA',
    padding: 15,
    borderRadius: 14,
    marginTop: 20
  },

  info: {
    color: '#25834D',
    fontWeight: '600',
    marginVertical: 5
  },

  urgentCard: {
    backgroundColor: '#FFF3E8',
    padding: 15,
    borderRadius: 14,
    marginTop: 15
  },

  urgentTitle: {
    color: '#C46B24',
    fontWeight: 'bold',
    fontSize: 16
  },

  urgentText: {
    color: '#8A552B',
    marginTop: 7
  },

  instructionsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginTop: 18,
    marginBottom: 30
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#183C2B',
    marginBottom: 15
  },

  step: {
    flexDirection: 'row',
    marginBottom: 13
  },

  stepNumber: {
    fontWeight: 'bold',
    color: '#25834D',
    width: 25
  },

  stepText: {
    flex: 1,
    color: '#444444',
    lineHeight: 22
  }
});
