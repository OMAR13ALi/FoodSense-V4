/**
 * AI Service — thin client for the resolve-food edge function.
 * Provider selection (Perplexity primary, OpenRouter fallback) lives server-side.
 */

import { APIError, Food, PortionUnit } from '@/types';
import { globalRequestQueue } from './request-queue';
import { supabase } from './supabase-client';

const VALID_SERVING_UNITS = new Set<PortionUnit>([
  'serving', 'piece', 'slice', 'cup', 'tbsp', 'tsp', 'can', 'bottle',
]);

function createAPIError(message: string, code: string, retryable: boolean): APIError {
  return { message, code, retryable };
}

interface EdgeFoodPayload {
  canonical_name: string;
  display_name: string;
  per_100g: { calories: number; protein: number; carbs: number; fat: number };
  default_serving_g: number;
  default_serving_unit: string;
  density_g_per_ml: number | null;
  region: string | null;
  confidence: number;
  sources: string[];
  explanation: string;
  provider: 'perplexity' | 'openrouter';
}

function payloadToFood(canonicalKey: string, p: EdgeFoodPayload): Food {
  const unit: PortionUnit = VALID_SERVING_UNITS.has(p.default_serving_unit as PortionUnit)
    ? (p.default_serving_unit as PortionUnit)
    : 'serving';
  return {
    canonicalName: (p.canonical_name || canonicalKey).toLowerCase(),
    displayName: p.display_name || p.canonical_name || canonicalKey,
    per100g: p.per_100g,
    defaultServingG: p.default_serving_g,
    defaultServingUnit: unit,
    densityGPerMl: p.density_g_per_ml ?? undefined,
    region: p.region ?? undefined,
    confidence: p.confidence,
    sources: p.sources ?? [],
    provider: p.provider,
    explanation: p.explanation,
  };
}

/**
 * Fetch a Food record by invoking the resolve-food edge function.
 * Queued to smooth spikes; the edge function handles provider fallback and DB writes.
 */
export async function fetchFood(canonicalKey: string): Promise<Food> {
  const key = canonicalKey.trim().toLowerCase();
  if (!key) {
    throw createAPIError('Food name cannot be empty', 'EMPTY_INPUT', false);
  }

  return await globalRequestQueue.enqueue(async () => {
    const { data, error } = await supabase.functions.invoke<{ food: EdgeFoodPayload; food_id: string }>(
      'resolve-food',
      { body: { canonicalKey: key } },
    );

    if (error) {
      let detail = error.message || 'resolve-food invocation failed';
      const res = (error as any).context?.response;
      if (res && typeof res.text === 'function') {
        try {
          const body = await res.text();
          if (body) detail = `${detail} — ${body}`;
        } catch {}
      }
      throw createAPIError(detail, 'EDGE_FN_ERROR', true);
    }
    if (!data?.food) {
      throw createAPIError('resolve-food returned no food payload', 'EMPTY_RESPONSE', true);
    }
    return payloadToFood(key, data.food);
  });
}
