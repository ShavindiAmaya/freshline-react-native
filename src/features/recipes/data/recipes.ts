import { Recipe } from '../types/recipe.types';

/**
 * Curated list of beginner-friendly recipes for FreshLine MVP.
 *
 * Designed to use common household pantry and fridge staples:
 * Chicken, Eggs, Tomatoes, Onion, Milk, Pasta, etc.
 *
 * Ingredients use singular, standard naming (e.g. "Egg", "Tomato")
 * so the matching service can reliably match items regardless of plural forms.
 */
export const recipes: Recipe[] = [
  {
    id: 'recipe_1',
    name: 'Tomato Omelette',
    description: 'A fluffy 10-minute breakfast omelette loaded with fresh diced tomatoes.',
    ingredients: ['Egg', 'Tomato', 'Onion'],
    steps: [
      'Crack the eggs into a bowl, season with salt and pepper, and whisk until smooth.',
      'Finely dice the tomato and onion.',
      'Heat a non-stick pan over medium heat with a drop of oil or butter.',
      'Sauté the diced onion and tomato for 2 minutes until softened.',
      'Pour the beaten eggs evenly over the vegetables.',
      'Cook for 3–4 minutes until edges are firm, fold gently, and serve warm.'
    ],
    minutes: 10,
    category: 'Quick'
  },
  {
    id: 'recipe_2',
    name: 'Chicken Tomato Pasta',
    description: 'Tender chicken bites tossed with fresh stewed tomatoes over warm pasta.',
    ingredients: ['Chicken', 'Tomato', 'Pasta', 'Onion'],
    steps: [
      'Bring a pot of salted water to a boil and cook the pasta according to package directions.',
      'Cut chicken breast into bite-sized pieces and season lightly.',
      'Heat a skillet with olive oil, add chopped onions, and cook until translucent.',
      'Add the chicken pieces and cook until golden brown and cooked through (6–8 minutes).',
      'Stir in diced tomatoes and simmer for 5 minutes until a light sauce forms.',
      'Toss drained pasta with the chicken and sauce, then serve.'
    ],
    minutes: 20,
    category: 'Main'
  },
  {
    id: 'recipe_3',
    name: 'Egg & Onion Scramble',
    description: 'Simple, comforting scrambled eggs with sweet caramelized onions.',
    ingredients: ['Egg', 'Onion', 'Butter'],
    steps: [
      'Thinly slice the onion.',
      'Melt butter in a skillet over medium-low heat.',
      'Add the sliced onion and slowly cook until soft and sweet (around 4 minutes).',
      'Whisk eggs in a bowl and pour directly into the skillet with onions.',
      'Gently stir with a spatula until soft curds form.',
      'Remove from heat immediately to keep creamy and serve.'
    ],
    minutes: 10,
    category: 'Vegetarian'
  },
  {
    id: 'recipe_4',
    name: 'Creamy Tomato Chicken Skillet',
    description: 'Juicy chicken breast simmered in a creamy, rich tomato pan sauce.',
    ingredients: ['Chicken', 'Tomato', 'Milk', 'Onion'],
    steps: [
      'Season chicken breasts with salt, pepper, and garlic powder if available.',
      'Sear chicken in a hot skillet for 5 minutes per side until cooked through, then set aside.',
      'In the same skillet, sauté finely chopped onion and tomatoes until soft.',
      'Lower heat and slowly stir in milk to build a smooth, rich sauce.',
      'Simmer for 3 minutes until slightly thickened.',
      'Return chicken to the skillet, spoon the warm sauce over, and enjoy.'
    ],
    minutes: 25,
    category: 'Main'
  },
  {
    id: 'recipe_5',
    name: 'Chicken Salad',
    description: 'A crisp, refreshing garden salad topped with sliced cooked chicken.',
    ingredients: ['Chicken', 'Tomato', 'Lettuce', 'Cucumber'],
    steps: [
      'Cook or reheat chicken breast until thoroughly cooked, then slice into strips.',
      'Wash and roughly chop the lettuce leaves.',
      'Dice the fresh tomato and slice the cucumber.',
      'Combine lettuce, tomato, and cucumber in a large salad bowl.',
      'Top with warm chicken strips and drizzle with your favorite dressing.'
    ],
    minutes: 15,
    category: 'Quick'
  },
  {
    id: 'recipe_6',
    name: 'Yogurt Fruit Bowl',
    description: 'A light, refreshing snack packed with protein and natural sweetness.',
    ingredients: ['Yogurt', 'Fruit', 'Honey'],
    steps: [
      'Spoon chilled yogurt into a serving bowl.',
      'Chop available fresh fruits (such as berries, bananas, or apples).',
      'Scatter the fruit slices over the top of the yogurt.',
      'Drizzle a golden ribbon of honey over the top and serve immediately.'
    ],
    minutes: 5,
    category: 'Vegetarian'
  }
];
