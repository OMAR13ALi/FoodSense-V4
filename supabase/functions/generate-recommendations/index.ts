// Supabase Edge Function: generate-recommendations
// Produces a daily AI-generated coaching payload (pacing, meal ideas, tips) based on
// the user's goal + today's intake + recent trend. Uses OpenRouter's free gpt-oss-120b
// model only — this function does not call Perplexity.
// Secrets required: OPENROUTER_API_KEY.

// deno-lint-ignore-file no-explicit-any

const SYSTEM_PROMPT = `You are a concise nutrition and weight coach embedded in a calorie-tracking app.

You receive a JSON object describing the user's goal, today's intake so far, a seven-day average, and (optionally) their recent weight trend. You must return guidance as STRICT JSON — no prose, no markdown fences.

Return exactly this shape:
{
  "pacing": {
    "on_track": true,
    "message": "One sentence comparing actual trajectory to goal pace. Warm, specific, not preachy.",
    "suggested_daily_calories": 2100,
    "weeks_to_goal": 12
  },
  "meal_suggestions": [
    { "name": "Grilled chicken with quinoa", "reason": "Fills ~550 kcal and adds 35g protein toward your remaining target", "calories": 550, "protein": 35, "carbs": 45, "fat": 15 }
  ],
  "tips": [
    { "title": "Front-load protein", "message": "Aim for 30g protein at breakfast to stabilize afternoon cravings." }
  ]
}

Rules:
- pacing.message is ONE sentence, no more than 160 characters.
- pacing.on_track = true if recent trend aligns with pace_kg_per_week for the user's goal_type.
- pacing.suggested_daily_calories: include only if the current goal is not matching the trend; omit otherwise.
- pacing.weeks_to_goal: estimated weeks to reach target_weight_kg at current trend; omit if trend is unknown or goal is maintenance.
- meal_suggestions: 2 or 3 items. Pick foods compatible with dietary_preference and that exclude every item listed in allergies. Each "reason" must reference the user's remaining calorie or macro budget for today.
- tips: 1 or 2 items. Behavioral, concrete, tied to what the user has (or has not) logged today. No generic cliches.
- If goal_type is "weight_loss", nudge toward protein + fiber and a modest deficit. If "weight_gain" or "muscle_gain", nudge toward surplus with protein-dense foods. If "maintenance", keep advice neutral and steady.
- Keep total JSON under 900 tokens. Respond ONLY with the JSON object.`;

interface PacingOut {
  on_track: boolean;
  message: string;
  suggested_daily_calories?: number;
  weeks_to_goal?: number;
}
interface MealOut {
  name: string;
  reason: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}
interface TipOut {
  title: string;
  message: string;
}
interface RecommendationOut {
  pacing: PacingOut;
  meal_suggestions: MealOut[];
  tips: TipOut[];
}

function cleanJson(content: string): string {
  const trimmed = content.trim();
  const fence = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  return fence ? fence[1].trim() : trimmed;
}

function clampNumber(n: unknown, min: number, max: number): number | undefined {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.max(min, Math.min(max, n));
}

function coerceMeal(raw: any): MealOut | null {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.name ?? "").trim();
  if (!name) return null;
  const calories = clampNumber(raw.calories, 0, 3000);
  if (calories === undefined) return null;
  return {
    name: name.slice(0, 80),
    reason: String(raw.reason ?? "").slice(0, 200),
    calories: Math.round(calories),
    protein: clampNumber(raw.protein, 0, 300),
    carbs: clampNumber(raw.carbs, 0, 500),
    fat: clampNumber(raw.fat, 0, 300),
  };
}

function coerceTip(raw: any): TipOut | null {
  if (!raw || typeof raw !== "object") return null;
  const title = String(raw.title ?? "").trim();
  const message = String(raw.message ?? "").trim();
  if (!title || !message) return null;
  return { title: title.slice(0, 60), message: message.slice(0, 240) };
}

function validate(parsed: any): RecommendationOut {
  const pacingRaw = parsed?.pacing ?? {};
  const pacing: PacingOut = {
    on_track: pacingRaw.on_track === true,
    message: String(pacingRaw.message ?? "").slice(0, 200),
    suggested_daily_calories: clampNumber(pacingRaw.suggested_daily_calories, 800, 6000),
    weeks_to_goal: clampNumber(pacingRaw.weeks_to_goal, 0, 260),
  };
  if (pacing.suggested_daily_calories !== undefined) {
    pacing.suggested_daily_calories = Math.round(pacing.suggested_daily_calories);
  }

  const mealsRaw = Array.isArray(parsed?.meal_suggestions) ? parsed.meal_suggestions : [];
  const meals = mealsRaw
    .map(coerceMeal)
    .filter((m): m is MealOut => m !== null)
    .slice(0, 3);

  const tipsRaw = Array.isArray(parsed?.tips) ? parsed.tips : [];
  const tips = tipsRaw
    .map(coerceTip)
    .filter((t): t is TipOut => t !== null)
    .slice(0, 2);

  return { pacing, meal_suggestions: meals, tips };
}

// Deterministic local fallback when the model call fails. Keeps the UI usable
// without ever fabricating meal recommendations.
function mathFallback(context: any): RecommendationOut {
  const goal = context?.daily_calorie_goal ?? 2000;
  const today = context?.today?.calories ?? 0;
  const remaining = Math.max(0, Math.round(goal - today));
  const goalType = context?.goal_type ?? "maintenance";

  let message = `You have ${remaining} kcal left toward today's ${goal} kcal goal.`;
  if (goalType === "weight_loss") {
    message = `You have ${remaining} kcal left in your deficit budget for today.`;
  } else if (goalType === "weight_gain" || goalType === "muscle_gain") {
    message = `You have ${remaining} kcal left to hit your surplus target today.`;
  }

  return {
    pacing: { on_track: true, message },
    meal_suggestions: [],
    tips: [],
  };
}

async function callOpenRouter(context: any): Promise<RecommendationOut> {
  const apiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);

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
        model: "openai/gpt-oss-120b:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(context) },
        ],
        temperature: 0.5,
        max_tokens: 900,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`openrouter ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("openrouter empty response");
    const parsed = JSON.parse(cleanJson(content));
    return validate(parsed);
  } finally {
    clearTimeout(timer);
  }
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

  const context = body?.context;
  if (!context || typeof context !== "object") {
    return new Response(JSON.stringify({ error: "context required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const model = "openai/gpt-oss-120b:free";

  try {
    const recommendation = await callOpenRouter(context);
    return new Response(JSON.stringify({ recommendation, model }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = (err as Error).message ?? "unknown error";
    console.warn("generate-recommendations fallback:", message);
    // Graceful degradation: never fail the UI. Return a math-only pacing line.
    return new Response(
      JSON.stringify({ recommendation: mathFallback(context), model: "fallback", warning: message }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
});
