// Supabase Edge Function: resolve-food
// Looks up nutrition for an unknown food, writes to public.foods + public.food_aliases.
// Strategy:
//   1. If the food already exists in public.foods (by canonical name or alias), return it directly
//      (backfilling a missing description via Gemini if needed). No AI calls on cache hit.
//   2. Otherwise resolve nutrition via Perplexity (→ OpenRouter fallback on 429/5xx/timeout),
//      then generate a description via Gemini on OpenRouter.
// Secrets required: PERPLEXITY_API_KEY, OPENROUTER_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const NUTRITION_PROMPT = `You are a nutrition analysis assistant. Given a food name (not a portion), research the food and return nutrition per 100 grams and a typical serving size.

CRITICAL: Respond with ONLY a valid JSON object, no prose, no markdown. Use this exact shape:

{
  "canonical_name": "brika",
  "display_name": "Brika",
  "aliases": ["brik", "brika tunisienne"],
  "per_100g": { "calories": 280, "protein": 11, "carbs": 28, "fat": 14 },
  "default_serving_g": 70,
  "default_serving_unit": "piece",
  "density_g_per_ml": null,
  "region": "TN",
  "confidence": 0.88,
  "sources": ["USDA FoodData Central"]
}

Rules:
- per_100g values are for 100 grams of the edible portion, not per serving.
- default_serving_g is the mass (grams) of ONE typical serving of default_serving_unit.
- default_serving_unit is one of: serving | piece | slice | cup | tbsp | tsp | can | bottle.
- density_g_per_ml is only set for liquids; null otherwise.
- confidence is 0..1.
- Return ONLY the JSON object.`;

const DESCRIPTION_PROMPT = `You are a food writer. Given a food name, write a short, engaging description.

CRITICAL: Respond with ONLY a valid JSON object, no prose, no markdown, of this exact shape:
{ "description": "..." }

Rules for the description text:
- 3 to 5 sentences, warm and conversational — not a recipe card.
- Cover: (1) what the food is and its cultural or regional origin, (2) typical ingredients or preparation, (3) a nutrition highlight or health-relevant note, and optionally (4) how it is commonly served or eaten.
- Do NOT mention calorie math, gram amounts, or portion sizes.
- Do NOT cite or reference sources inside the text.
- Do NOT repeat the food name more than twice.`;

const VALID_UNITS = new Set(["serving", "piece", "slice", "cup", "tbsp", "tsp", "can", "bottle"]);

interface FoodPayload {
  canonical_name: string;
  display_name: string;
  aliases: string[];
  per_100g: { calories: number; protein: number; carbs: number; fat: number };
  default_serving_g: number;
  default_serving_unit: string;
  density_g_per_ml: number | null;
  region: string | null;
  confidence: number;
  sources: string[];
  explanation: string;
  provider: "perplexity" | "openrouter";
}

function cleanJson(content: string): string {
  const trimmed = content.trim();
  const fence = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  return fence ? fence[1].trim() : trimmed;
}

function validate(parsed: any, provider: "perplexity" | "openrouter", extraSources: string[]): FoodPayload {
  const p100 = parsed.per_100g ?? parsed.per100g;
  if (
    !p100 ||
    typeof p100.calories !== "number" ||
    typeof p100.protein !== "number" ||
    typeof p100.carbs !== "number" ||
    typeof p100.fat !== "number" ||
    typeof parsed.default_serving_g !== "number" ||
    parsed.default_serving_g <= 0
  ) {
    throw new Error("missing required per-100g fields");
  }
  const unitRaw = String(parsed.default_serving_unit ?? "serving").toLowerCase();
  const unit = VALID_UNITS.has(unitRaw) ? unitRaw : "serving";
  const sources = Array.isArray(parsed.sources) ? parsed.sources.map(String) : [];

  return {
    canonical_name: String(parsed.canonical_name ?? "").toLowerCase().trim(),
    display_name: String(parsed.display_name ?? parsed.canonical_name ?? ""),
    aliases: Array.isArray(parsed.aliases) ? parsed.aliases.map((a: any) => String(a).toLowerCase().trim()) : [],
    per_100g: {
      calories: p100.calories,
      protein: p100.protein,
      carbs: p100.carbs,
      fat: p100.fat,
    },
    default_serving_g: parsed.default_serving_g,
    default_serving_unit: unit,
    density_g_per_ml: typeof parsed.density_g_per_ml === "number" ? parsed.density_g_per_ml : null,
    region: typeof parsed.region === "string" ? parsed.region : null,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
    sources: sources.length > 0 ? sources : extraSources,
    explanation: "", // filled in separately by Gemini (or stub) after nutrition resolves
    provider,
  };
}

function stubDescription(displayName: string, calories: number): string {
  const cal = Number.isFinite(calories) ? Math.round(calories) : 0;
  const name = displayName?.trim() || "This food";
  return `${name} — about ${cal} kcal per 100 g.`;
}

function rowToPayload(row: any): FoodPayload {
  const unitRaw = String(row.default_serving_unit ?? "serving").toLowerCase();
  const unit = VALID_UNITS.has(unitRaw) ? unitRaw : "serving";
  const sourcesRaw = row.sources;
  const sources: string[] = Array.isArray(sourcesRaw)
    ? sourcesRaw.map((s: any) => String(s))
    : typeof sourcesRaw === "string"
      ? (() => { try { const j = JSON.parse(sourcesRaw); return Array.isArray(j) ? j.map(String) : []; } catch { return []; } })()
      : [];
  const providerRaw = String(row.provider ?? "perplexity");
  const provider: "perplexity" | "openrouter" = providerRaw === "openrouter" ? "openrouter" : "perplexity";

  return {
    canonical_name: String(row.canonical_name ?? "").toLowerCase().trim(),
    display_name: String(row.display_name ?? row.canonical_name ?? ""),
    aliases: [],
    per_100g: {
      calories: Number(row.per_100g_calories),
      protein: Number(row.per_100g_protein),
      carbs: Number(row.per_100g_carbs),
      fat: Number(row.per_100g_fat),
    },
    default_serving_g: Number(row.default_serving_g),
    default_serving_unit: unit,
    density_g_per_ml: row.density_g_per_ml != null ? Number(row.density_g_per_ml) : null,
    region: typeof row.region === "string" ? row.region : null,
    confidence: row.confidence != null ? Number(row.confidence) : 0.8,
    sources,
    explanation: typeof row.description === "string" ? row.description : "",
    provider,
  };
}

async function callGeminiForDescription(payload: FoodPayload): Promise<string | null> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://calorie-tracker-app.com",
        "X-Title": "Calorie Tracker",
      },
      body: JSON.stringify({
        model: "google/gemma-4-31b-it:free",
        messages: [
          { role: "system", content: DESCRIPTION_PROMPT },
          {
            role: "user",
            content: `Write a description for the food "${payload.display_name}" (canonical name: "${payload.canonical_name}"${payload.region ? `, region: ${payload.region}` : ""}).`,
          },
        ],
        temperature: 0.6,
        max_tokens: 400,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.warn(`gemini description failed: ${res.status}`);
      return null;
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(cleanJson(content));
    const text = typeof parsed?.description === "string" ? parsed.description.trim() : "";
    return text || null;
  } catch (err) {
    console.warn("gemini description error:", (err as Error).message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callPerplexity(canonicalKey: string): Promise<FoodPayload> {
  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
  if (!apiKey) throw new Error("PERPLEXITY_API_KEY not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: NUTRITION_PROMPT },
        {
          role: "user",
          content: `Return per-100g nutrition for: "${canonicalKey}". Use region-appropriate authoritative sources (USDA, McCance and Widdowson, AUSNUT, EuroFIR, Indian Food Composition Database, regional databases).`,
        },
      ],
      temperature: 0.2,
      return_citations: true,
    }),
  }).finally(() => clearTimeout(timer));

  if (res.status === 429 || res.status >= 500) {
    throw new Error(`perplexity transient ${res.status}`);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`perplexity ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("perplexity empty response");
  const citations: string[] = Array.isArray(json?.citations) ? json.citations : [];
  const parsed = JSON.parse(cleanJson(content));
  return validate(parsed, "perplexity", citations);
}

async function callOpenRouter(canonicalKey: string): Promise<FoodPayload> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://calorie-tracker-app.com",
      "X-Title": "Calorie Tracker",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-chat-v3-0324:free",
      messages: [
        { role: "system", content: NUTRITION_PROMPT },
        { role: "user", content: `Return per-100g nutrition for: "${canonicalKey}"` },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    }),
  }).finally(() => clearTimeout(timer));

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`openrouter ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("openrouter empty response");
  const parsed = JSON.parse(cleanJson(content));
  return validate(parsed, "openrouter", []);
}

async function resolveNutrition(canonicalKey: string): Promise<FoodPayload> {
  try {
    return await callPerplexity(canonicalKey);
  } catch (err) {
    console.warn("perplexity failed, falling back to openrouter:", (err as Error).message);
    return await callOpenRouter(canonicalKey);
  }
}

async function resolveFood(
  canonicalKey: string,
): Promise<{ payload: FoodPayload; descriptionWasGenerated: boolean }> {
  const payload = await resolveNutrition(canonicalKey);
  const description = await callGeminiForDescription(payload);
  if (description) {
    payload.explanation = description;
    return { payload, descriptionWasGenerated: true };
  }
  payload.explanation = stubDescription(payload.display_name, payload.per_100g.calories);
  return { payload, descriptionWasGenerated: false };
}

async function findExistingFood(
  admin: ReturnType<typeof createClient>,
  canonicalKey: string,
): Promise<any | null> {
  const { data: direct } = await admin
    .from("foods")
    .select("*")
    .eq("canonical_name", canonicalKey)
    .maybeSingle();
  if (direct) return direct;

  const { data: aliasRow } = await admin
    .from("food_aliases")
    .select("food_id, foods(*)")
    .eq("alias", canonicalKey)
    .maybeSingle();
  const row = (aliasRow as any)?.foods;
  return row ?? null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const canonicalKey = String(body?.canonicalKey ?? "").trim().toLowerCase();
  if (!canonicalKey) {
    return new Response(JSON.stringify({ error: "canonicalKey required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Early return: if a foods row already exists for this canonical key
    // (directly or via alias), reuse it and skip all AI calls. Backfill the
    // description via Gemini only if the row is missing one.
    const existingRow = await findExistingFood(admin, canonicalKey);
    if (existingRow) {
      const payload = rowToPayload(existingRow);
      if (!payload.explanation) {
        const description = await callGeminiForDescription(payload);
        if (description) {
          payload.explanation = description;
          await admin
            .from("foods")
            .update({ description })
            .eq("id", existingRow.id);
        } else {
          // Gemma failed (likely upstream 429). Return a stub for this response
          // but leave foods.description NULL so the next request retries Gemma.
          payload.explanation = stubDescription(payload.display_name, payload.per_100g.calories);
        }
      }
      return new Response(JSON.stringify({ food: payload, food_id: existingRow.id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { payload, descriptionWasGenerated } = await resolveFood(canonicalKey);

    const insertName = payload.canonical_name || canonicalKey;

    const { data: existing } = await admin
      .from("foods")
      .select("id")
      .eq("canonical_name", insertName)
      .maybeSingle();

    let foodId: string;
    if (existing?.id) {
      foodId = existing.id;
    } else {
      const { data: inserted, error: insErr } = await admin
        .from("foods")
        .insert({
          canonical_name: insertName,
          display_name: payload.display_name || insertName,
          per_100g_calories: payload.per_100g.calories,
          per_100g_protein: payload.per_100g.protein,
          per_100g_carbs: payload.per_100g.carbs,
          per_100g_fat: payload.per_100g.fat,
          default_serving_g: payload.default_serving_g,
          default_serving_unit: payload.default_serving_unit,
          density_g_per_ml: payload.density_g_per_ml,
          region: payload.region,
          confidence: payload.confidence,
          sources: payload.sources,
          provider: payload.provider,
          description: descriptionWasGenerated ? payload.explanation : null,
        })
        .select("id")
        .single();
      if (insErr || !inserted) throw new Error(`foods insert failed: ${insErr?.message}`);
      foodId = inserted.id;
    }

    const seen = new Set<string>();
    const aliasRows: Array<{ alias: string; food_id: string }> = [];
    for (const candidate of [insertName, canonicalKey, ...payload.aliases]) {
      const a = String(candidate ?? "").trim().toLowerCase();
      if (!a || seen.has(a)) continue;
      seen.add(a);
      aliasRows.push({ alias: a, food_id: foodId });
    }
    if (aliasRows.length > 0) {
      const { error: aliasErr } = await admin
        .from("food_aliases")
        .upsert(aliasRows, { onConflict: "alias" });
      if (aliasErr) throw new Error(`food_aliases upsert failed: ${aliasErr.message}`);
    }

    return new Response(JSON.stringify({ food: payload, food_id: foodId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = (err as Error).message ?? "unknown error";
    console.error("resolve-food error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
});
