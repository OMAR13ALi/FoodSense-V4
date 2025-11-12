/**
 * AI Service - Nutrition Analysis
 * Handles communication with OpenRouter (Gemini) and Perplexity Sonar APIs
 */

import axios, { AxiosError } from 'axios';
import config, { getCurrentProviderConfig } from '@/config/env';
import { AIAnalysisResult, APIError } from '@/types';
import { globalRequestQueue } from './request-queue';
import { getCachedNutrition } from './nutrition-cache';
import { getCachedAPIResponse, saveAPIResponse } from './api-response-cache';

// System prompt for nutrition analysis
const NUTRITION_PROMPT = `You are a nutrition analysis assistant. When given a meal description, analyze and return the nutritional information.

CRITICAL: You MUST respond with ONLY a valid JSON object, no other text before or after. Use this exact format:

{
  "calories": 450,
  "protein": 25,
  "carbs": 35,
  "fat": 15,
  "explanation": "A detailed explanation of how you calculated these values, including sources and assumptions",
  "confidence": 0.85,
  "sources": ["USDA FoodData Central", "nutrition database"]
}

Rules:
- All numeric values must be numbers (not strings)
- calories, protein, carbs, fat are REQUIRED
- explanation should include your reasoning and sources
- confidence is a number between 0 and 1 (e.g., 0.85 for 85% confident)
- sources is an array of strings naming your data sources
- If the description is vague, make reasonable assumptions (standard portion sizes) and explain them
- Return ONLY the JSON object, no markdown, no code blocks, no extra text`;

/**
 * Retry helper with exponential backoff for server errors
 * NOTE: 429 rate limit errors should not occur with request queue in place
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Only retry on server errors (5xx), NOT rate limit errors (429)
      const isServerError =
        axios.isAxiosError(error) &&
        error.response?.status &&
        error.response.status >= 500;

      // If not server error or last attempt, throw immediately
      if (!isServerError || attempt === maxRetries) {
        throw error;
      }

      // Calculate exponential backoff delay: 1s, 2s
      const delay = baseDelay * Math.pow(2, attempt);

      if (config.debugMode) {
        console.log(`Server error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Analyzes meal text using AI to extract nutrition information
 * 1. Checks static USDA cache first for instant results
 * 2. Checks API response cache for recent API responses
 * 3. If not cached, queues API request to prevent rate limits
 * 4. Saves API response to cache for future use
 */
export async function analyzeNutrition(
  mealText: string
): Promise<AIAnalysisResult> {
  if (!mealText || mealText.trim().length === 0) {
    throw createAPIError('Meal text cannot be empty', 'EMPTY_INPUT', false);
  }

  // Step 1: Check static USDA cache first for instant results
  const cachedResult = getCachedNutrition(mealText);
  if (cachedResult) {
    if (config.debugMode) {
      console.log('Static cache hit for:', mealText);
    }
    // Add smooth UX delay for cached results to show animation
    await new Promise(resolve => setTimeout(resolve, 350));
    return cachedResult;
  }

  // Step 2: Check API response cache for recent responses
  const apiCachedResult = await getCachedAPIResponse(mealText);
  if (apiCachedResult) {
    if (config.debugMode) {
      console.log('API cache hit for:', mealText);
    }
    // Add smooth UX delay for cached results to show animation
    await new Promise(resolve => setTimeout(resolve, 350));
    return apiCachedResult;
  }

  // Step 3: If not cached anywhere, use request queue to prevent rate limits
  if (config.debugMode) {
    console.log('Cache miss, queuing API request for:', mealText);
  }

  const providerConfig = getCurrentProviderConfig();

  try {
    // Queue the API request to prevent simultaneous calls
    const result = await globalRequestQueue.enqueue(async () => {
      // Wrap API calls with retry logic for server errors
      return await withRetry(async () => {
        if (providerConfig.provider === 'openrouter') {
          return await analyzeWithOpenRouter(mealText, providerConfig);
        } else {
          return await analyzeWithPerplexity(mealText, providerConfig);
        }
      });
    });

    // Step 4: Save API response to cache for future use
    await saveAPIResponse(mealText, result);

    return result;
  } catch (error) {
    if (config.debugMode) {
      console.error('AI Analysis Error:', error);

      // Log detailed axios error info
      if (axios.isAxiosError(error)) {
        console.error('Axios Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          message: error.message,
          code: error.code,
        });
      }
    }
    throw handleAPIError(error);
  }
}

/**
 * OpenRouter (Gemini) implementation
 */
async function analyzeWithOpenRouter(
  mealText: string,
  providerConfig: ReturnType<typeof getCurrentProviderConfig>
): Promise<AIAnalysisResult> {
  // Detect if it's a Gemini model (requires different handling)
  const isGeminiModel = providerConfig.model.toLowerCase().includes('gemini');

  // Build request body
  const requestBody: any = {
    model: providerConfig.model,
    messages: [
      {
        role: 'system',
        content: NUTRITION_PROMPT,
      },
      {
        role: 'user',
        content: `Analyze the nutritional content of: "${mealText}"`,
      },
    ],
    temperature: 0.3,
    max_tokens: 1024, // Prevent unbounded generation
  };

  // Only add response_format for non-Gemini models
  // Gemini doesn't support OpenAI's response_format parameter
  if (!isGeminiModel) {
    requestBody.response_format = { type: 'json_object' };
  }

  // Debug logging
  if (config.debugMode) {
    console.log('OpenRouter Request:', {
      url: `${providerConfig.baseURL}/chat/completions`,
      model: providerConfig.model,
      isGeminiModel,
      hasResponseFormat: !isGeminiModel,
      mealText,
    });
  }

  const response = await axios.post(
    `${providerConfig.baseURL}/chat/completions`,
    requestBody,
    {
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://calorie-tracker-app.com',
        'X-Title': 'Calorie Tracker',
      },
      timeout: 30000,
    }
  );

  // Debug logging
  if (config.debugMode) {
    console.log('OpenRouter Response:', {
      status: response.status,
      model: response.data.model,
      hasChoices: !!response.data.choices?.length,
      contentPreview: response.data.choices?.[0]?.message?.content?.substring(0, 200),
    });
  }

  const content = response.data.choices[0]?.message?.content;
  if (!content) {
    throw createAPIError(
      'No response from AI',
      'EMPTY_RESPONSE',
      true
    );
  }

  return parseAIResponse(content);
}

/**
 * Perplexity Sonar implementation
 */
async function analyzeWithPerplexity(
  mealText: string,
  providerConfig: ReturnType<typeof getCurrentProviderConfig>
): Promise<AIAnalysisResult> {
  const response = await axios.post(
    `${providerConfig.baseURL}/chat/completions`,
    {
      model: providerConfig.model,
      messages: [
        {
          role: 'system',
          content: NUTRITION_PROMPT,
        },
        {
          role: 'user',
          content: `Analyze the nutritional content of: "${mealText}".

Search for accurate nutrition data from reliable international sources including:
- WHO Global Food Composition Database
- USDA FoodData Central (USA)
- McCance and Widdowson (UK)
- Canadian Nutrient File (Canada)
- AUSNUT (Australia)
- EuroFIR (Europe)
- Indian Food Composition Database
- Regional nutrition databases when applicable

Prioritize region-appropriate sources for the food item. For example, use UK sources for British foods, Indian sources for Indian foods, etc.`,
        },
      ],
      temperature: 0.3,
      return_citations: true,
    },
    {
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const content = response.data.choices[0]?.message?.content;
  if (!content) {
    throw createAPIError(
      'No response from AI',
      'EMPTY_RESPONSE',
      true
    );
  }

  // Extract citations from Perplexity response
  const citations = response.data.citations || [];

  const result = parseAIResponse(content);

  // Add citations to sources if not already present
  if (citations.length > 0 && (!result.sources || result.sources.length === 0)) {
    result.sources = citations;
  }

  return result;
}

/**
 * Parse AI response JSON
 */
function parseAIResponse(content: string): AIAnalysisResult {
  try {
    // Clean the content - remove markdown code blocks if present
    let cleanedContent = content.trim();

    // Remove markdown json code blocks: ```json ... ``` or ``` ... ```
    const codeBlockMatch = cleanedContent.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      cleanedContent = codeBlockMatch[1].trim();
    }

    // Debug log the content we're trying to parse
    if (config.debugMode) {
      console.log('Parsing AI response:', {
        originalLength: content.length,
        cleanedLength: cleanedContent.length,
        startsWithBrace: cleanedContent.startsWith('{'),
        preview: cleanedContent.substring(0, 100),
      });
    }

    const parsed = JSON.parse(cleanedContent);

    // Validate required fields
    if (
      typeof parsed.calories !== 'number' ||
      typeof parsed.protein !== 'number' ||
      typeof parsed.carbs !== 'number' ||
      typeof parsed.fat !== 'number'
    ) {
      throw new Error('Invalid nutrition data format');
    }

    return {
      calories: Math.round(parsed.calories),
      protein: Math.round(parsed.protein),
      carbs: Math.round(parsed.carbs),
      fat: Math.round(parsed.fat),
      explanation: parsed.explanation || 'No explanation provided',
      confidence: parsed.confidence || 0.8,
      sources: parsed.sources || [],
    };
  } catch (error) {
    if (config.debugMode) {
      console.error('JSON parse failed, falling back to text extraction:', error);
    }
    // Fallback: Try to extract numbers from text if JSON parsing fails
    return extractNutritionFromText(content);
  }
}

/**
 * Fallback: Extract nutrition info from plain text response
 */
function extractNutritionFromText(text: string): AIAnalysisResult {
  const calorieMatch = text.match(/(\d+)\s*(?:cal|kcal|calories)/i);
  const proteinMatch = text.match(/(\d+)\s*(?:g|grams?)?\s*(?:of\s+)?protein/i);
  const carbsMatch = text.match(/(\d+)\s*(?:g|grams?)?\s*(?:of\s+)?carb/i);
  const fatMatch = text.match(/(\d+)\s*(?:g|grams?)?\s*(?:of\s+)?fat/i);

  if (!calorieMatch) {
    throw createAPIError(
      'Could not extract calorie information from AI response',
      'PARSE_ERROR',
      false
    );
  }

  return {
    calories: parseInt(calorieMatch[1], 10),
    protein: proteinMatch ? parseInt(proteinMatch[1], 10) : 20,
    carbs: carbsMatch ? parseInt(carbsMatch[1], 10) : 30,
    fat: fatMatch ? parseInt(fatMatch[1], 10) : 10,
    explanation: text.substring(0, 500), // First 500 chars as explanation
    confidence: 0.6, // Lower confidence for parsed text
    sources: [],
  };
}

/**
 * Handle API errors and convert to APIError type
 */
function handleAPIError(error: unknown): APIError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    // Network errors
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return createAPIError(
        'Request timed out. Please check your connection.',
        'TIMEOUT',
        true
      );
    }

    if (!axiosError.response) {
      return createAPIError(
        'Network error. Please check your internet connection.',
        'NETWORK_ERROR',
        true
      );
    }

    // API errors
    const status = axiosError.response.status;
    if (status === 401) {
      return createAPIError(
        'Invalid API key. Please check your configuration.',
        'AUTH_ERROR',
        false
      );
    }

    if (status === 429) {
      return createAPIError(
        'Rate limit exceeded. Please wait a moment.',
        'RATE_LIMIT',
        true
      );
    }

    if (status >= 500) {
      return createAPIError(
        'AI service is temporarily unavailable.',
        'SERVER_ERROR',
        true
      );
    }

    return createAPIError(
      `API error: ${axiosError.message}`,
      'API_ERROR',
      true
    );
  }

  if (error instanceof Error) {
    return createAPIError(error.message, 'UNKNOWN_ERROR', false);
  }

  return createAPIError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    false
  );
}

/**
 * Create standardized API error
 */
function createAPIError(
  message: string,
  code: string,
  retryable: boolean
): APIError {
  return {
    message,
    code,
    retryable,
  };
}

/**
 * Debounced nutrition analysis
 * Returns a function that debounces calls to analyzeNutrition
 */
export function createDebouncedAnalyzer(delayMs: number = 1500) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let currentController: AbortController | null = null;

  return async (mealText: string): Promise<AIAnalysisResult> => {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Abort previous request
    if (currentController) {
      currentController.abort();
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        currentController = new AbortController();
        try {
          const result = await analyzeNutrition(mealText);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  };
}
