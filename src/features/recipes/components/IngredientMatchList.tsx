

import {
    StyleSheet,
    Text,
    View
} from 'react-native';

import { RecipeMatch } from '../types/recipe.types';

interface Props {
  match: RecipeMatch;
}

export default function IngredientMatchList({
  match
}: Props) {

  return (
    <View style={styles.container}>

      <Text style={styles.heading}>
        Available Ingredients
      </Text>

      {match.availableIngredients.length === 0 ? (
        <Text style={styles.empty}>
          No ingredients available.
        </Text>
      ) : (
        match.availableIngredients.map(item => (
          <Text key={item} style={styles.available}>
            ✓ {item}
          </Text>
        ))
      )}

      <Text style={styles.heading}>
        Missing Ingredients
      </Text>

      {match.missingIngredients.length === 0 ? (
        <Text style={styles.empty}>
          You have all required ingredients!
        </Text>
      ) : (
        match.missingIngredients.map(item => (
          <Text key={item} style={styles.missing}>
            ✕ {item}
          </Text>
        ))
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 14
  },

  heading: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#183C2B',
    marginBottom: 10,
    marginTop: 10
  },

  available: {
    color: '#25834D',
    marginBottom: 8,
    fontSize: 15
  },

  missing: {
    color: '#D97736',
    marginBottom: 8,
    fontSize: 15
  },

  empty: {
    color: '#777777',
    marginBottom: 8
  }
});
