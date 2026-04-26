import { Food, ParsedPortion, PortionUnit } from '@/types';

const G_PER_OZ = 28.3495;
const G_PER_LB = 453.592;

export function resolveGrams(food: Food, qty: number, unit: PortionUnit): number {
  switch (unit) {
    case 'g':  return qty;
    case 'kg': return qty * 1000;
    case 'mg': return qty / 1000;
    case 'oz': return qty * G_PER_OZ;
    case 'lb': return qty * G_PER_LB;

    case 'ml':
      return qty * (food.densityGPerMl ?? 1);
    case 'l':
      return qty * 1000 * (food.densityGPerMl ?? 1);

    case 'serving':
    case 'piece':
    case 'slice':
    case 'cup':
    case 'tbsp':
    case 'tsp':
    case 'can':
    case 'bottle':
      return qty * food.defaultServingG;
  }
}

export function computeNutrition(food: Food, parsed: ParsedPortion) {
  const grams = resolveGrams(food, parsed.quantity, parsed.unit);
  const scale = grams / 100;
  return {
    calories: food.per100g.calories * scale,
    protein: food.per100g.protein * scale,
    carbs: food.per100g.carbs * scale,
    fat: food.per100g.fat * scale,
    grams,
  };
}
