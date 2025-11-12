/**
 * Nutrition Cache Service
 * Provides instant nutrition data for common foods using USDA FoodData Central data
 */

import { AIAnalysisResult } from '@/types';

/**
 * Nutrition data for common foods
 * Data sourced from USDA FoodData Central
 * Values are per standard serving size
 */
export const nutritionCache: Record<string, Omit<AIAnalysisResult, 'confidence' | 'sources'>> = {
  // Fruits
  'apple': {
    calories: 95,
    protein: 0,
    carbs: 25,
    fat: 0,
    explanation: 'Medium apple (182g). Based on USDA standard reference data.',
  },
  'banana': {
    calories: 105,
    protein: 1,
    carbs: 27,
    fat: 0,
    explanation: 'Medium banana (118g). Based on USDA standard reference data.',
  },
  'orange': {
    calories: 62,
    protein: 1,
    carbs: 15,
    fat: 0,
    explanation: 'Medium orange (131g). Based on USDA standard reference data.',
  },
  'grapes': {
    calories: 104,
    protein: 1,
    carbs: 27,
    fat: 0,
    explanation: '1 cup of grapes (151g). Based on USDA standard reference data.',
  },
  'strawberries': {
    calories: 49,
    protein: 1,
    carbs: 12,
    fat: 0,
    explanation: '1 cup of strawberries (152g). Based on USDA standard reference data.',
  },
  'watermelon': {
    calories: 46,
    protein: 1,
    carbs: 11,
    fat: 0,
    explanation: '1 cup diced watermelon (152g). Based on USDA standard reference data.',
  },

  // Fast Food / Common Meals
  'burger': {
    calories: 540,
    protein: 25,
    carbs: 40,
    fat: 25,
    explanation: 'Standard fast food hamburger with cheese (150g). Includes bun, beef patty, cheese, lettuce, tomato.',
  },
  'cheeseburger': {
    calories: 563,
    protein: 28,
    carbs: 38,
    fat: 33,
    explanation: 'Standard cheeseburger (155g). Based on USDA fast food composite data.',
  },
  'pizza': {
    calories: 285,
    protein: 12,
    carbs: 36,
    fat: 10,
    explanation: 'One slice of cheese pizza (107g). Based on typical pizza chain data.',
  },
  'fries': {
    calories: 365,
    protein: 4,
    carbs: 48,
    fat: 17,
    explanation: 'Medium french fries (117g). Based on USDA fast food data.',
  },
  'french fries': {
    calories: 365,
    protein: 4,
    carbs: 48,
    fat: 17,
    explanation: 'Medium french fries (117g). Based on USDA fast food data.',
  },
  'hot dog': {
    calories: 290,
    protein: 10,
    carbs: 24,
    fat: 17,
    explanation: 'Hot dog with bun (98g). Based on USDA standard reference.',
  },
  'sandwich': {
    calories: 350,
    protein: 15,
    carbs: 42,
    fat: 12,
    explanation: 'Basic deli sandwich (150g). Turkey/ham with cheese, lettuce, tomato on bread.',
  },
  'taco': {
    calories: 210,
    protein: 9,
    carbs: 13,
    fat: 13,
    explanation: 'One crunchy beef taco (78g). Based on USDA fast food data.',
  },

  // Protein Foods
  'chicken breast': {
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 4,
    explanation: '100g cooked chicken breast (skinless). Based on USDA standard reference.',
  },
  'salmon': {
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 12,
    explanation: '100g cooked Atlantic salmon. Based on USDA standard reference.',
  },
  'steak': {
    calories: 271,
    protein: 26,
    carbs: 0,
    fat: 18,
    explanation: '100g beef steak, cooked. Based on USDA standard reference.',
  },
  'eggs': {
    calories: 155,
    protein: 13,
    carbs: 1,
    fat: 11,
    explanation: 'Two large eggs (100g). Based on USDA standard reference.',
  },
  'egg': {
    calories: 78,
    protein: 6,
    carbs: 1,
    fat: 5,
    explanation: 'One large egg (50g). Based on USDA standard reference.',
  },

  // Grains & Carbs
  'rice': {
    calories: 206,
    protein: 4,
    carbs: 45,
    fat: 2,
    explanation: '1 cup cooked white rice (158g). Based on USDA standard reference.',
  },
  'pasta': {
    calories: 220,
    protein: 8,
    carbs: 43,
    fat: 1,
    explanation: '1 cup cooked pasta (140g). Based on USDA standard reference.',
  },
  'bread': {
    calories: 79,
    protein: 4,
    carbs: 15,
    fat: 1,
    explanation: 'One slice of whole wheat bread (28g). Based on USDA standard reference.',
  },
  'toast': {
    calories: 79,
    protein: 4,
    carbs: 15,
    fat: 1,
    explanation: 'One slice of toasted whole wheat bread (28g). Based on USDA standard reference.',
  },
  'oatmeal': {
    calories: 158,
    protein: 6,
    carbs: 28,
    fat: 3,
    explanation: '1 cup cooked oatmeal (234g). Based on USDA standard reference.',
  },

  // Vegetables
  'broccoli': {
    calories: 55,
    protein: 4,
    carbs: 11,
    fat: 1,
    explanation: '1 cup chopped broccoli (156g). Based on USDA standard reference.',
  },
  'carrots': {
    calories: 52,
    protein: 1,
    carbs: 12,
    fat: 0,
    explanation: '1 cup chopped carrots (128g). Based on USDA standard reference.',
  },
  'salad': {
    calories: 33,
    protein: 3,
    carbs: 6,
    fat: 0,
    explanation: '1 cup mixed green salad (55g), no dressing. Based on USDA standard reference.',
  },
  'lettuce': {
    calories: 5,
    protein: 0,
    carbs: 1,
    fat: 0,
    explanation: '1 cup shredded lettuce (47g). Based on USDA standard reference.',
  },

  // Dairy
  'milk': {
    calories: 149,
    protein: 8,
    carbs: 12,
    fat: 8,
    explanation: '1 cup whole milk (244g). Based on USDA standard reference.',
  },
  'yogurt': {
    calories: 149,
    protein: 8,
    carbs: 11,
    fat: 8,
    explanation: '1 cup plain whole milk yogurt (245g). Based on USDA standard reference.',
  },
  'cheese': {
    calories: 114,
    protein: 7,
    carbs: 1,
    fat: 9,
    explanation: '1 oz cheddar cheese (28g). Based on USDA standard reference.',
  },

  // Beverages
  'water': {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    explanation: 'Water contains no calories. Hydration is important for health!',
  },
  'coffee': {
    calories: 2,
    protein: 0,
    carbs: 0,
    fat: 0,
    explanation: 'Black coffee (240ml). Add calories for milk/sugar.',
  },
  'tea': {
    calories: 2,
    protein: 0,
    carbs: 0,
    fat: 0,
    explanation: 'Plain tea (240ml). Add calories for milk/sugar.',
  },
  'soda': {
    calories: 140,
    protein: 0,
    carbs: 39,
    fat: 0,
    explanation: '12 oz can of cola (355ml). Based on typical soda nutrition data.',
  },
  'juice': {
    calories: 112,
    protein: 2,
    carbs: 26,
    fat: 0,
    explanation: '1 cup orange juice (248g). Based on USDA standard reference.',
  },

  // Snacks
  'chips': {
    calories: 152,
    protein: 2,
    carbs: 15,
    fat: 10,
    explanation: '1 oz potato chips (28g). Based on USDA standard reference.',
  },
  'popcorn': {
    calories: 31,
    protein: 1,
    carbs: 6,
    fat: 0,
    explanation: '1 cup air-popped popcorn (8g). Based on USDA standard reference.',
  },
  'nuts': {
    calories: 165,
    protein: 6,
    carbs: 6,
    fat: 14,
    explanation: '1 oz mixed nuts (28g). Based on USDA standard reference.',
  },
  'almonds': {
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    explanation: '1 oz almonds (28g, ~23 almonds). Based on USDA standard reference.',
  },
  'peanuts': {
    calories: 161,
    protein: 7,
    carbs: 5,
    fat: 14,
    explanation: '1 oz peanuts (28g). Based on USDA standard reference.',
  },
  'chocolate': {
    calories: 235,
    protein: 3,
    carbs: 26,
    fat: 13,
    explanation: '1.5 oz milk chocolate bar (43g). Based on USDA standard reference.',
  },
  'cookie': {
    calories: 49,
    protein: 1,
    carbs: 7,
    fat: 2,
    explanation: 'One chocolate chip cookie (12g). Based on USDA standard reference.',
  },
  'ice cream': {
    calories: 207,
    protein: 4,
    carbs: 24,
    fat: 11,
    explanation: '1/2 cup vanilla ice cream (66g). Based on USDA standard reference.',
  },

  // Breakfast Foods
  'cereal': {
    calories: 147,
    protein: 3,
    carbs: 33,
    fat: 1,
    explanation: '1 cup corn flakes (28g) with no milk. Based on USDA standard reference.',
  },
  'pancakes': {
    calories: 227,
    protein: 6,
    carbs: 28,
    fat: 10,
    explanation: 'Two 4-inch pancakes (76g). Based on USDA standard reference.',
  },
  'waffle': {
    calories: 218,
    protein: 6,
    carbs: 25,
    fat: 11,
    explanation: 'One 7-inch waffle (75g). Based on USDA standard reference.',
  },
  'bacon': {
    calories: 43,
    protein: 3,
    carbs: 0,
    fat: 3,
    explanation: 'One slice of cooked bacon (8g). Based on USDA standard reference.',
  },

  // Composite/Fast Food Meals
  'grilled cheese': {
    calories: 420,
    protein: 18,
    carbs: 38,
    fat: 22,
    explanation: 'Grilled cheese sandwich with 2 slices bread and 2 oz cheese. Based on USDA composite data.',
  },
  'milkshake': {
    calories: 350,
    protein: 9,
    carbs: 56,
    fat: 11,
    explanation: '12 oz vanilla milkshake. Based on typical fast food data.',
  },
  'shake': {
    calories: 350,
    protein: 9,
    carbs: 56,
    fat: 11,
    explanation: '12 oz vanilla shake. Based on typical fast food data.',
  },
  'chicken nuggets': {
    calories: 280,
    protein: 13,
    carbs: 18,
    fat: 17,
    explanation: '6-piece chicken nuggets (100g). Based on fast food composite data.',
  },
  'chicken sandwich': {
    calories: 440,
    protein: 28,
    carbs: 41,
    fat: 16,
    explanation: 'Fried chicken sandwich with bun, lettuce, mayo. Based on fast food data.',
  },
  'fish sandwich': {
    calories: 390,
    protein: 16,
    carbs: 39,
    fat: 19,
    explanation: 'Fried fish sandwich with tartar sauce. Based on fast food data.',
  },
  'sub sandwich': {
    calories: 410,
    protein: 22,
    carbs: 47,
    fat: 13,
    explanation: '6-inch sub with deli meat, cheese, veggies. Based on typical sub shop data.',
  },
  'burrito': {
    calories: 510,
    protein: 20,
    carbs: 66,
    fat: 17,
    explanation: 'Chicken burrito with rice, beans, cheese, salsa (250g). Based on fast food data.',
  },
  'quesadilla': {
    calories: 490,
    protein: 19,
    carbs: 39,
    fat: 28,
    explanation: 'Cheese quesadilla with sour cream (200g). Based on restaurant data.',
  },
  'nachos': {
    calories: 560,
    protein: 15,
    carbs: 56,
    fat: 30,
    explanation: 'Nachos with cheese, meat, sour cream (250g). Based on restaurant data.',
  },

  // More Breakfast Items
  'muffin': {
    calories: 426,
    protein: 7,
    carbs: 61,
    fat: 17,
    explanation: 'One large blueberry muffin (110g). Based on USDA data.',
  },
  'bagel': {
    calories: 277,
    protein: 11,
    carbs: 55,
    fat: 2,
    explanation: 'One plain bagel (95g). Based on USDA standard reference.',
  },
  'croissant': {
    calories: 231,
    protein: 5,
    carbs: 26,
    fat: 12,
    explanation: 'One medium croissant (57g). Based on USDA data.',
  },
  'donut': {
    calories: 269,
    protein: 3,
    carbs: 31,
    fat: 15,
    explanation: 'One glazed donut (60g). Based on USDA data.',
  },
  'french toast': {
    calories: 340,
    protein: 10,
    carbs: 42,
    fat: 14,
    explanation: 'Two slices of french toast with syrup (130g). Based on USDA data.',
  },
  'scrambled eggs': {
    calories: 204,
    protein: 14,
    carbs: 4,
    fat: 15,
    explanation: 'Two scrambled eggs with butter (140g). Based on USDA data.',
  },
  'omelette': {
    calories: 280,
    protein: 18,
    carbs: 4,
    fat: 21,
    explanation: 'Three-egg cheese omelette (180g). Based on USDA data.',
  },
  'sausage': {
    calories: 286,
    protein: 15,
    carbs: 1,
    fat: 24,
    explanation: 'Two breakfast sausage links (85g). Based on USDA data.',
  },
  'hash browns': {
    calories: 265,
    protein: 3,
    carbs: 35,
    fat: 13,
    explanation: 'One serving hash browns (120g). Based on fast food data.',
  },

  // More Beverages
  'smoothie': {
    calories: 215,
    protein: 4,
    carbs: 50,
    fat: 1,
    explanation: '16 oz fruit smoothie (450ml). Based on typical smoothie shop data.',
  },
  'protein shake': {
    calories: 220,
    protein: 20,
    carbs: 25,
    fat: 3,
    explanation: 'One scoop protein powder with milk (350ml). Based on typical products.',
  },
  'energy drink': {
    calories: 110,
    protein: 0,
    carbs: 28,
    fat: 0,
    explanation: '8 oz energy drink (240ml). Based on typical energy drink data.',
  },
  'beer': {
    calories: 153,
    protein: 2,
    carbs: 13,
    fat: 0,
    explanation: '12 oz regular beer (355ml). Based on USDA data.',
  },
  'wine': {
    calories: 125,
    protein: 0,
    carbs: 4,
    fat: 0,
    explanation: '5 oz glass of red wine (148ml). Based on USDA data.',
  },
  'latte': {
    calories: 190,
    protein: 10,
    carbs: 18,
    fat: 7,
    explanation: '12 oz latte with whole milk (355ml). Based on coffee shop data.',
  },
  'cappuccino': {
    calories: 120,
    protein: 6,
    carbs: 10,
    fat: 4,
    explanation: '8 oz cappuccino with whole milk (240ml). Based on coffee shop data.',
  },
  'iced coffee': {
    calories: 80,
    protein: 4,
    carbs: 15,
    fat: 0,
    explanation: '16 oz iced coffee with milk, no sugar (480ml). Based on coffee shop data.',
  },

  // More Protein Foods
  'tuna': {
    calories: 132,
    protein: 28,
    carbs: 0,
    fat: 1,
    explanation: '100g canned tuna in water. Based on USDA standard reference.',
  },
  'shrimp': {
    calories: 99,
    protein: 24,
    carbs: 0,
    fat: 1,
    explanation: '100g cooked shrimp. Based on USDA standard reference.',
  },
  'pork chop': {
    calories: 231,
    protein: 23,
    carbs: 0,
    fat: 15,
    explanation: '100g cooked pork chop. Based on USDA standard reference.',
  },
  'ground beef': {
    calories: 250,
    protein: 26,
    carbs: 0,
    fat: 15,
    explanation: '100g cooked ground beef (80% lean). Based on USDA data.',
  },
  'turkey breast': {
    calories: 135,
    protein: 30,
    carbs: 0,
    fat: 1,
    explanation: '100g roasted turkey breast (skinless). Based on USDA data.',
  },
  'ham': {
    calories: 145,
    protein: 21,
    carbs: 1,
    fat: 6,
    explanation: '100g deli ham. Based on USDA standard reference.',
  },
  'tofu': {
    calories: 76,
    protein: 8,
    carbs: 2,
    fat: 5,
    explanation: '100g firm tofu. Based on USDA standard reference.',
  },

  // More Carbs & Sides
  'potatoes': {
    calories: 130,
    protein: 3,
    carbs: 30,
    fat: 0,
    explanation: 'One medium baked potato (150g). Based on USDA data.',
  },
  'mashed potatoes': {
    calories: 210,
    protein: 4,
    carbs: 35,
    fat: 7,
    explanation: '1 cup mashed potatoes with butter and milk (210g). Based on USDA data.',
  },
  'sweet potato': {
    calories: 112,
    protein: 2,
    carbs: 26,
    fat: 0,
    explanation: 'One medium sweet potato (130g). Based on USDA data.',
  },
  'quinoa': {
    calories: 222,
    protein: 8,
    carbs: 39,
    fat: 4,
    explanation: '1 cup cooked quinoa (185g). Based on USDA data.',
  },
  'couscous': {
    calories: 176,
    protein: 6,
    carbs: 36,
    fat: 0,
    explanation: '1 cup cooked couscous (157g). Based on USDA data.',
  },
  'beans': {
    calories: 225,
    protein: 15,
    carbs: 40,
    fat: 1,
    explanation: '1 cup black beans (172g). Based on USDA data.',
  },
  'mac and cheese': {
    calories: 350,
    protein: 14,
    carbs: 40,
    fat: 14,
    explanation: '1 cup mac and cheese (200g). Based on typical prepared food data.',
  },

  // More Vegetables
  'corn': {
    calories: 132,
    protein: 5,
    carbs: 29,
    fat: 2,
    explanation: '1 cup corn kernels (154g). Based on USDA data.',
  },
  'peas': {
    calories: 134,
    protein: 9,
    carbs: 25,
    fat: 0,
    explanation: '1 cup green peas (160g). Based on USDA data.',
  },
  'green beans': {
    calories: 44,
    protein: 2,
    carbs: 10,
    fat: 0,
    explanation: '1 cup green beans (125g). Based on USDA data.',
  },
  'spinach': {
    calories: 7,
    protein: 1,
    carbs: 1,
    fat: 0,
    explanation: '1 cup raw spinach (30g). Based on USDA data.',
  },
  'tomato': {
    calories: 22,
    protein: 1,
    carbs: 5,
    fat: 0,
    explanation: 'One medium tomato (123g). Based on USDA data.',
  },
  'cucumber': {
    calories: 16,
    protein: 1,
    carbs: 4,
    fat: 0,
    explanation: '1 cup sliced cucumber (119g). Based on USDA data.',
  },
  'bell pepper': {
    calories: 30,
    protein: 1,
    carbs: 7,
    fat: 0,
    explanation: 'One medium bell pepper (119g). Based on USDA data.',
  },
  'mushrooms': {
    calories: 15,
    protein: 2,
    carbs: 2,
    fat: 0,
    explanation: '1 cup sliced mushrooms (70g). Based on USDA data.',
  },
  'onion': {
    calories: 44,
    protein: 1,
    carbs: 10,
    fat: 0,
    explanation: 'One medium onion (110g). Based on USDA data.',
  },

  // More Snacks & Desserts
  'pretzels': {
    calories: 108,
    protein: 3,
    carbs: 23,
    fat: 1,
    explanation: '1 oz pretzels (28g). Based on USDA data.',
  },
  'crackers': {
    calories: 130,
    protein: 2,
    carbs: 21,
    fat: 4,
    explanation: '5 whole wheat crackers (28g). Based on USDA data.',
  },
  'granola bar': {
    calories: 140,
    protein: 3,
    carbs: 19,
    fat: 6,
    explanation: 'One granola bar (30g). Based on typical product data.',
  },
  'protein bar': {
    calories: 200,
    protein: 20,
    carbs: 22,
    fat: 7,
    explanation: 'One protein bar (60g). Based on typical product data.',
  },
  'trail mix': {
    calories: 173,
    protein: 5,
    carbs: 17,
    fat: 11,
    explanation: '1 oz trail mix (28g). Based on USDA data.',
  },
  'peanut butter': {
    calories: 188,
    protein: 8,
    carbs: 7,
    fat: 16,
    explanation: '2 tablespoons peanut butter (32g). Based on USDA data.',
  },
  'hummus': {
    calories: 70,
    protein: 2,
    carbs: 6,
    fat: 5,
    explanation: '2 tablespoons hummus (30g). Based on USDA data.',
  },
  'brownie': {
    calories: 227,
    protein: 3,
    carbs: 36,
    fat: 9,
    explanation: 'One brownie (56g). Based on USDA data.',
  },
  'cake': {
    calories: 240,
    protein: 3,
    carbs: 35,
    fat: 10,
    explanation: 'One slice of cake (74g). Based on USDA data.',
  },
  'pie': {
    calories: 296,
    protein: 2,
    carbs: 43,
    fat: 14,
    explanation: 'One slice of apple pie (117g). Based on USDA data.',
  },
  'pudding': {
    calories: 140,
    protein: 4,
    carbs: 26,
    fat: 3,
    explanation: '1/2 cup chocolate pudding (130g). Based on typical product data.',
  },

  // More Fruits
  'pear': {
    calories: 96,
    protein: 1,
    carbs: 26,
    fat: 0,
    explanation: 'One medium pear (166g). Based on USDA data.',
  },
  'peach': {
    calories: 59,
    protein: 1,
    carbs: 14,
    fat: 0,
    explanation: 'One medium peach (150g). Based on USDA data.',
  },
  'plum': {
    calories: 30,
    protein: 0,
    carbs: 8,
    fat: 0,
    explanation: 'One medium plum (66g). Based on USDA data.',
  },
  'mango': {
    calories: 99,
    protein: 1,
    carbs: 25,
    fat: 1,
    explanation: '1 cup sliced mango (165g). Based on USDA data.',
  },
  'pineapple': {
    calories: 82,
    protein: 1,
    carbs: 22,
    fat: 0,
    explanation: '1 cup diced pineapple (165g). Based on USDA data.',
  },
  'blueberries': {
    calories: 84,
    protein: 1,
    carbs: 21,
    fat: 0,
    explanation: '1 cup blueberries (148g). Based on USDA data.',
  },
  'raspberries': {
    calories: 64,
    protein: 1,
    carbs: 15,
    fat: 1,
    explanation: '1 cup raspberries (123g). Based on USDA data.',
  },
  'blackberries': {
    calories: 62,
    protein: 2,
    carbs: 14,
    fat: 1,
    explanation: '1 cup blackberries (144g). Based on USDA data.',
  },
  'cherries': {
    calories: 87,
    protein: 1,
    carbs: 22,
    fat: 0,
    explanation: '1 cup cherries (138g). Based on USDA data.',
  },
  'kiwi': {
    calories: 42,
    protein: 1,
    carbs: 10,
    fat: 0,
    explanation: 'One medium kiwi (69g). Based on USDA data.',
  },
};

/**
 * Normalize text for cache lookup
 * Handles variations like "Apple" vs "apple", extra spaces, etc.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Common words to ignore in fuzzy matching
 */
const IGNORE_WORDS = new Set(['a', 'an', 'the', 'with', 'and', 'or', 'of', 'in', 'on', 'large', 'small', 'medium', '1', '2', '3', 'one', 'two', 'three']);

/**
 * Fuzzy match food items - finds closest match in cache
 * @param text Normalized text to search for
 * @returns Cached food key if found, null otherwise
 */
function fuzzyMatch(text: string): string | null {
  // Try exact match first
  if (text in nutritionCache) {
    return text;
  }

  // Split into words and filter out common words
  const words = text.split(' ').filter(word => !IGNORE_WORDS.has(word) && word.length > 2);

  // Try to find cache entries that contain any of the words
  const cacheKeys = Object.keys(nutritionCache);

  for (const word of words) {
    // Try direct word match
    if (word in nutritionCache) {
      return word;
    }

    // Try partial match - cache key contains the word
    for (const key of cacheKeys) {
      if (key.includes(word) || word.includes(key)) {
        return key;
      }
    }
  }

  // Try multi-word phrases (e.g., "grilled cheese" in "grilled cheese sandwich")
  for (let i = words.length; i > 0; i--) {
    for (let j = 0; j <= words.length - i; j++) {
      const phrase = words.slice(j, j + i).join(' ');
      if (phrase in nutritionCache) {
        return phrase;
      }
    }
  }

  return null;
}

/**
 * Get cached nutrition data for a food item
 * Uses fuzzy matching to find similar items
 * @param mealText The food item text to look up
 * @returns Nutrition data if found in cache, null otherwise
 */
export function getCachedNutrition(mealText: string): AIAnalysisResult | null {
  const normalized = normalizeText(mealText);

  // Try fuzzy matching
  const matchedKey = fuzzyMatch(normalized);

  if (matchedKey) {
    const cached = nutritionCache[matchedKey];
    return {
      ...cached,
      confidence: matchedKey === normalized ? 0.95 : 0.85, // Lower confidence for fuzzy matches
      sources: ['USDA FoodData Central (Cached)'],
    };
  }

  return null;
}

/**
 * Check if a food item is in the cache
 */
export function isCached(mealText: string): boolean {
  const normalized = normalizeText(mealText);
  return normalized in nutritionCache;
}

/**
 * Get all cached food names
 */
export function getCachedFoodNames(): string[] {
  return Object.keys(nutritionCache);
}
