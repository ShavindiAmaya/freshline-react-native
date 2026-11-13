
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import { Recipe, RecipeMatch } from '../types/recipe.types';

interface Props {
  recipe: Recipe;
  match: RecipeMatch;
  onPress: () => void;
}

export default function RecipeCard({
  recipe,
  match,
  onPress
}: Props) {

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
    >
      <Text style={styles.category}>
        {recipe.category || 'Recipe'}
      </Text>

      <Text style={styles.name}>
        {recipe.name}
      </Text>

      <Text style={styles.description}>
        {recipe.description}
      </Text>

      <Text style={styles.time}>
        Preparation: {recipe.preparationMinutes} minutes
      </Text>

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progress,
            { width: `${match.matchPercentage}%` }
          ]}
        />
      </View>

      <Text style={styles.percentage}>
        {match.matchPercentage}% Match
      </Text>

      <Text style={styles.ingredientText}>
        Available: {match.availableIngredients.length}
      </Text>

      <Text style={styles.missingText}>
        Missing: {match.missingIngredients.length}
      </Text>

      {match.urgentIngredientsUsed.length > 0 && (
        <Text style={styles.urgent}>
          Uses urgent food: {
            match.urgentIngredientsUsed.join(', ')
          }
        </Text>
      )}

      <Text style={styles.viewDetails}>
        View Recipe Details →
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EDE7'
  },

  category: {
    color: '#25834D',
    fontSize: 12,
    fontWeight: 'bold'
  },

  name: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#183C2B',
    marginTop: 6
  },

  description: {
    color: '#777777',
    marginTop: 5
  },

  time: {
    marginTop: 10,
    color: '#555555'
  },

  progressBackground: {
    height: 8,
    backgroundColor: '#E6EEE8',
    borderRadius: 10,
    marginTop: 14,
    overflow: 'hidden'
  },

  progress: {
    height: 8,
    backgroundColor: '#2E9D5B'
  },

  percentage: {
    color: '#25834D',
    fontWeight: 'bold',
    marginTop: 7
  },

  ingredientText: {
    marginTop: 8,
    color: '#25834D'
  },

  missingText: {
    marginTop: 4,
    color: '#D97736'
  },

  urgent: {
    color: '#D97736',
    fontWeight: 'bold',
    marginTop: 9
  },

  viewDetails: {
    color: '#25834D',
    fontWeight: 'bold',
    marginTop: 14
  }
});
