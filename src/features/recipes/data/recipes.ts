
import { Recipe } from '../types/recipe.types';

export const recipes: Recipe[] = [
  {
    id: '1',
    name: 'Chicken Fried Rice',
    description: 'A simple and delicious chicken fried rice.',
    ingredients: ['Chicken', 'Rice', 'Egg', 'Onion'],
    preparationMinutes: 25,
    category: 'Main Course',
    instructions: [
      'Cook the rice.',
      'Cut chicken and onion into small pieces.',
      'Cook the chicken in a pan.',
      'Add onion and egg.',
      'Add rice and mix everything well.',
      'Serve hot.'
    ]
  },

  {
    id: '2',
    name: 'Tomato Omelette',
    description: 'A quick omelette with fresh tomatoes.',
    ingredients: ['Egg', 'Tomato', 'Onion', 'Salt'],
    preparationMinutes: 10,
    category: 'Breakfast',
    instructions: [
      'Beat the eggs in a bowl.',
      'Chop tomato and onion.',
      'Mix the ingredients with salt.',
      'Heat a pan with a little oil.',
      'Cook the omelette on both sides.',
      'Serve warm.'
    ]
  },

  {
    id: '3',
    name: 'Chicken Curry',
    description: 'A homemade chicken curry.',
    ingredients: ['Chicken', 'Onion', 'Tomato', 'Curry Powder'],
    preparationMinutes: 35,
    category: 'Main Course',
    instructions: [
      'Cut the chicken into pieces.',
      'Chop onion and tomato.',
      'Heat oil in a pan.',
      'Add onion and curry powder.',
      'Add chicken and tomato.',
      'Cook thoroughly and serve.'
    ]
  },

  {
    id: '4',
    name: 'Egg Sandwich',
    description: 'An easy egg sandwich for breakfast.',
    ingredients: ['Egg', 'Bread', 'Onion', 'Butter'],
    preparationMinutes: 10,
    category: 'Breakfast',
    instructions: [
      'Boil the eggs.',
      'Chop the eggs and onion.',
      'Mix with a little butter.',
      'Spread the mixture on bread.',
      'Place another slice on top.',
      'Serve the sandwich.'
    ]
  },

  {
    id: '5',
    name: 'Tomato Pasta',
    description: 'A simple pasta with tomato sauce.',
    ingredients: ['Pasta', 'Tomato', 'Onion', 'Garlic'],
    preparationMinutes: 20,
    category: 'Main Course',
    instructions: [
      'Boil the pasta.',
      'Chop tomato, onion and garlic.',
      'Cook the vegetables in a pan.',
      'Add the cooked pasta.',
      'Mix everything together.',
      'Serve warm.'
    ]
  },

  {
    id: '6',
    name: 'Chicken Salad',
    description: 'A simple chicken and vegetable salad.',
    ingredients: ['Chicken', 'Tomato', 'Cucumber', 'Lettuce'],
    preparationMinutes: 20,
    category: 'Healthy',
    instructions: [
      'Cook the chicken thoroughly.',
      'Cut tomato and cucumber.',
      'Wash and prepare the lettuce.',
      'Cut the cooked chicken into pieces.',
      'Mix all ingredients.',
      'Serve fresh.'
    ]
  }
];
