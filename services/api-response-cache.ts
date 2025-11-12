/**
 * API Response Cache Service
 * Caches AI API responses locally to reduce API calls
 * Responses are cached for 7 days
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIAnalysisResult } from '@/types';

const CACHE_PREFIX = 'api_cache_';
const CACHE_EXPIRY_DAYS = 7;

interface CachedResponse {
  data: AIAnalysisResult;
  timestamp: number;
  expiresAt: number;
}

/**
 * Generate cache key from meal text
 */
function getCacheKey(mealText: string): string {
  const normalized = mealText.toLowerCase().trim();
  return `${CACHE_PREFIX}${normalized}`;
}

/**
 * Check if cached response is still valid
 */
function isExpired(cachedResponse: CachedResponse): boolean {
  return Date.now() > cachedResponse.expiresAt;
}

/**
 * Get cached API response
 * @param mealText The meal text to look up
 * @returns Cached data if found and not expired, null otherwise
 */
export async function getCachedAPIResponse(mealText: string): Promise<AIAnalysisResult | null> {
  try {
    const key = getCacheKey(mealText);
    const cached = await AsyncStorage.getItem(key);

    if (!cached) {
      return null;
    }

    const parsedCache: CachedResponse = JSON.parse(cached);

    // Check if expired
    if (isExpired(parsedCache)) {
      // Remove expired cache
      await AsyncStorage.removeItem(key);
      return null;
    }

    // Mark as from cache in sources
    const sources = parsedCache.data.sources || [];
    if (!sources.some(s => s.includes('Local Cache'))) {
      sources.push('Local Cache (Recent API Response)');
    }

    return {
      ...parsedCache.data,
      sources,
      confidence: Math.max(parsedCache.data.confidence || 0.8, 0.9), // High confidence for recent API data
    };
  } catch (error) {
    console.error('Error reading from API cache:', error);
    return null;
  }
}

/**
 * Save API response to cache
 * @param mealText The meal text
 * @param data The API response data
 */
export async function saveAPIResponse(mealText: string, data: AIAnalysisResult): Promise<void> {
  try {
    const key = getCacheKey(mealText);
    const expiresAt = Date.now() + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const cacheData: CachedResponse = {
      data,
      timestamp: Date.now(),
      expiresAt,
    };

    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error saving to API cache:', error);
  }
}

/**
 * Clear all expired cache entries
 * Should be called periodically (e.g., on app start)
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));

    for (const key of cacheKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) continue;

      try {
        const parsedCache: CachedResponse = JSON.parse(cached);
        if (isExpired(parsedCache)) {
          await AsyncStorage.removeItem(key);
        }
      } catch (error) {
        // Invalid cache entry, remove it
        await AsyncStorage.removeItem(key);
      }
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}

/**
 * Clear all API response cache
 * Useful for testing or troubleshooting
 */
export async function clearAllAPICache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing all API cache:', error);
  }
}

/**
 * Get cache statistics
 * Useful for debugging
 */
export async function getCacheStats(): Promise<{ total: number; expired: number }> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_PREFIX));

    let expired = 0;
    for (const key of cacheKeys) {
      const cached = await AsyncStorage.getItem(key);
      if (!cached) continue;

      try {
        const parsedCache: CachedResponse = JSON.parse(cached);
        if (isExpired(parsedCache)) {
          expired++;
        }
      } catch (error) {
        expired++;
      }
    }

    return {
      total: cacheKeys.length,
      expired,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { total: 0, expired: 0 };
  }
}
