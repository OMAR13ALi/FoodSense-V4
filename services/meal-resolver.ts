import { Food, ResolvedMeal } from '@/types';
import { parsePortion } from './portion-parser';
import { canonicalize, getFood, putFood } from './food-cache';
import { fetchFood } from './ai-service';
import { computeNutrition } from './portion-math';

export async function resolveMeal(rawLine: string): Promise<ResolvedMeal> {
  const parsed = parsePortion(rawLine);
  const canonicalKey = canonicalize(parsed.foodText || rawLine);

  let food: Food | null = await getFood(canonicalKey);
  if (!food) {
    food = await fetchFood(canonicalKey);
    await putFood(canonicalKey, food);
  }

  const nutrition = computeNutrition(food, parsed);
  return { parsed, food, nutrition };
}
