import { ParsedPortion, PortionUnit } from '@/types';

const WORD_NUMBERS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  half: 0.5, 'a half': 0.5, quarter: 0.25, 'a quarter': 0.25,
};

const MASS_UNITS = new Set(['g', 'kg', 'mg', 'oz', 'lb']);
const VOLUME_UNITS = new Set(['ml', 'l']);
const SERVING_UNITS = new Set([
  'serving', 'servings',
  'piece', 'pieces', 'pc', 'pcs',
  'slice', 'slices',
  'cup', 'cups',
  'tbsp', 'tablespoon', 'tablespoons',
  'tsp', 'teaspoon', 'teaspoons',
  'can', 'cans',
  'bottle', 'bottles',
]);

function normalizeUnit(raw: string): PortionUnit {
  const u = raw.toLowerCase().replace(/\.$/, '');
  switch (u) {
    case 'g': case 'gram': case 'grams': return 'g';
    case 'kg': case 'kilogram': case 'kilograms': return 'kg';
    case 'mg': case 'milligram': case 'milligrams': return 'mg';
    case 'oz': case 'ounce': case 'ounces': return 'oz';
    case 'lb': case 'lbs': case 'pound': case 'pounds': return 'lb';
    case 'ml': case 'milliliter': case 'milliliters': return 'ml';
    case 'l': case 'liter': case 'liters': case 'litre': case 'litres': return 'l';
    case 'piece': case 'pieces': case 'pc': case 'pcs': return 'piece';
    case 'slice': case 'slices': return 'slice';
    case 'cup': case 'cups': return 'cup';
    case 'tbsp': case 'tablespoon': case 'tablespoons': return 'tbsp';
    case 'tsp': case 'teaspoon': case 'teaspoons': return 'tsp';
    case 'can': case 'cans': return 'can';
    case 'bottle': case 'bottles': return 'bottle';
    default: return 'serving';
  }
}

function parseNumber(token: string): number | null {
  const n = parseFloat(token);
  if (!Number.isNaN(n) && n > 0) return n;
  const word = token.toLowerCase();
  if (word in WORD_NUMBERS) return WORD_NUMBERS[word];
  return null;
}

const MASS_RE = /^(\d+(?:\.\d+)?)\s*(g|kg|mg|oz|lb|lbs|grams?|kilograms?|milligrams?|ounces?|pounds?)\s+(.+)$/i;
const VOLUME_RE = /^(\d+(?:\.\d+)?)\s*(ml|l|milliliters?|liters?|litres?)\s+(.+)$/i;
const COUNT_UNIT_RE = /^(\d+(?:\.\d+)?)\s+(servings?|pieces?|pcs?|slices?|cups?|tbsp|tablespoons?|tsp|teaspoons?|cans?|bottles?)\s+(?:of\s+)?(.+)$/i;
const NUMERIC_PREFIX_RE = /^(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|half|quarter)\s+(.+)$/i;

export function parsePortion(raw: string): ParsedPortion {
  const text = raw.trim().replace(/\s+/g, ' ');
  if (!text) {
    return { quantity: 1, unit: 'serving', foodText: '' };
  }

  let m = text.match(MASS_RE);
  if (m) {
    return { quantity: parseFloat(m[1]), unit: normalizeUnit(m[2]), foodText: m[3].trim() };
  }

  m = text.match(VOLUME_RE);
  if (m) {
    return { quantity: parseFloat(m[1]), unit: normalizeUnit(m[2]), foodText: m[3].trim() };
  }

  m = text.match(COUNT_UNIT_RE);
  if (m) {
    return { quantity: parseFloat(m[1]), unit: normalizeUnit(m[2]), foodText: m[3].trim() };
  }

  m = text.match(NUMERIC_PREFIX_RE);
  if (m) {
    const qty = parseNumber(m[1]);
    if (qty !== null) {
      return { quantity: qty, unit: 'serving', foodText: m[2].trim() };
    }
  }

  return { quantity: 1, unit: 'serving', foodText: text };
}

export const __test = { MASS_UNITS, VOLUME_UNITS, SERVING_UNITS };
