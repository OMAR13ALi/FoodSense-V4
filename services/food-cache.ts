import AsyncStorage from '@react-native-async-storage/async-storage';
import { Food, PortionUnit } from '@/types';
import { nutritionCache } from './nutrition-cache';
import { lookupFoodByAlias } from './database-service';

const STORAGE_PREFIX = 'food:';
const L2_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const memory = new Map<string, Food>();

const IGNORE_WORDS = new Set([
  'a', 'an', 'the', 'with', 'and', 'or', 'of', 'in', 'on',
  'large', 'small', 'medium',
  '1', '2', '3', 'one', 'two', 'three',
]);

export function canonicalize(foodText: string): string {
  return foodText
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter((w) => !IGNORE_WORDS.has(w))
    .join(' ') || foodText.toLowerCase().trim();
}

function extractServingGrams(explanation: string): number | null {
  const grams = explanation.match(/\((\d+(?:\.\d+)?)\s*g\b/i) ?? explanation.match(/(\d+(?:\.\d+)?)\s*g\b/i);
  if (grams) return parseFloat(grams[1]);
  const ml = explanation.match(/\((\d+(?:\.\d+)?)\s*ml\b/i);
  if (ml) return parseFloat(ml[1]);
  return null;
}

function inferUnitFromExplanation(explanation: string): PortionUnit {
  const e = explanation.toLowerCase();
  if (/\bslices?\b/.test(e)) return 'slice';
  if (/\bcups?\b/.test(e)) return 'cup';
  if (/\btbsp|tablespoons?\b/.test(e)) return 'tbsp';
  if (/\btsp|teaspoons?\b/.test(e)) return 'tsp';
  if (/\bcans?\b/.test(e)) return 'can';
  if (/\bbottles?\b/.test(e)) return 'bottle';
  if (/\boz\b/.test(e)) return 'oz';
  if (/\bmedium|small|large|one\b/.test(e)) return 'piece';
  return 'serving';
}

function convertStaticEntry(name: string, entry: (typeof nutritionCache)[string]): Food {
  const servingG = extractServingGrams(entry.explanation) ?? 100;
  const scale = 100 / servingG;
  return {
    canonicalName: name,
    displayName: name,
    per100g: {
      calories: entry.calories * scale,
      protein: entry.protein * scale,
      carbs: entry.carbs * scale,
      fat: entry.fat * scale,
    },
    defaultServingG: servingG,
    defaultServingUnit: inferUnitFromExplanation(entry.explanation),
    confidence: 0.9,
    sources: ['USDA FoodData Central (Static)'],
    provider: 'static-cache',
    explanation: entry.explanation,
  };
}

function findStaticMatch(canonicalKey: string): Food | null {
  if (canonicalKey in nutritionCache) {
    return convertStaticEntry(canonicalKey, nutritionCache[canonicalKey]);
  }
  const words = canonicalKey.split(' ').filter((w) => w.length > 2);
  for (const word of words) {
    if (word in nutritionCache) {
      return convertStaticEntry(word, nutritionCache[word]);
    }
    for (const key of Object.keys(nutritionCache)) {
      if (key.includes(word) || word.includes(key)) {
        return convertStaticEntry(key, nutritionCache[key]);
      }
    }
  }
  for (let i = words.length; i > 0; i--) {
    for (let j = 0; j <= words.length - i; j++) {
      const phrase = words.slice(j, j + i).join(' ');
      if (phrase in nutritionCache) {
        return convertStaticEntry(phrase, nutritionCache[phrase]);
      }
    }
  }
  return null;
}

interface L2Entry {
  food: Food;
  expiresAt: number;
}

async function readL2(canonicalKey: string): Promise<Food | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_PREFIX + canonicalKey);
    if (!raw) return null;
    const parsed: L2Entry = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      await AsyncStorage.removeItem(STORAGE_PREFIX + canonicalKey);
      return null;
    }
    return parsed.food;
  } catch {
    return null;
  }
}

async function writeL2(canonicalKey: string, food: Food): Promise<void> {
  try {
    const entry: L2Entry = { food, expiresAt: Date.now() + L2_TTL_MS };
    await AsyncStorage.setItem(STORAGE_PREFIX + canonicalKey, JSON.stringify(entry));
  } catch {
    // non-fatal
  }
}

export async function getFood(canonicalKey: string): Promise<Food | null> {
  const mem = memory.get(canonicalKey);
  if (mem) return mem;

  const l2 = await readL2(canonicalKey);
  if (l2) {
    memory.set(canonicalKey, l2);
    return l2;
  }

  try {
    const remote = await lookupFoodByAlias(canonicalKey);
    if (remote) {
      memory.set(canonicalKey, remote);
      await writeL2(canonicalKey, remote);
      return remote;
    }
  } catch {
    // Network/auth errors fall through to static/AI
  }

  const staticHit = findStaticMatch(canonicalKey);
  if (staticHit) {
    memory.set(canonicalKey, staticHit);
    await writeL2(canonicalKey, staticHit);
    return staticHit;
  }

  return null;
}

export async function putFood(canonicalKey: string, food: Food): Promise<void> {
  memory.set(canonicalKey, food);
  await writeL2(canonicalKey, food);
}

export function clearMemoryCache(): void {
  memory.clear();
}

export async function clearAllCaches(): Promise<void> {
  memory.clear();
  try {
    const keys = await AsyncStorage.getAllKeys();
    const foodKeys = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
    if (foodKeys.length > 0) await AsyncStorage.multiRemove(foodKeys);
  } catch {
    // non-fatal
  }
}
