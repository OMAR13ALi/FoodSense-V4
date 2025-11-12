/**
 * Environment Configuration
 * Manages API keys and provider selection
 */

import Constants from 'expo-constants';

export type AIProvider = 'openrouter' | 'perplexity';

interface EnvConfig {
  aiProvider: AIProvider;
  openRouter: {
    apiKey: string;
    model: string;
    baseURL: string;
  };
  perplexity: {
    apiKey: string;
    model: string;
    baseURL: string;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  debugMode: boolean;
}

// TEMPORARY: Hardcode API keys for testing
 const TEMP_OPENROUTER_KEY = 'api-key';
 const TEMP_PERPLEXITY_KEY = 'model-key';


// Get environment variables from expo-constants
const getEnvVar = (key: string, optional: boolean = false): string => {
  const value = Constants.expoConfig?.extra?.[key];
  if (!value) {
    // Fallback to hardcoded keys for testing
    if (key === 'openRouterApiKey') {
      console.warn('Using temporary hardcoded OpenRouter API key. Fix .env loading for production.');
      return TEMP_OPENROUTER_KEY;
    }
    if (key === 'perplexityApiKey') {
      console.warn('Using temporary hardcoded Perplexity API key. Fix .env loading for production.');
      return TEMP_PERPLEXITY_KEY;
    }
    // If optional, return empty string
    if (optional) {
      return '';
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const config: EnvConfig = {
  // Toggle between 'openrouter' and 'perplexity'
  aiProvider: 'perplexity', // Switched to Perplexity for better rate limits

  openRouter: {
    apiKey: getEnvVar('openRouterApiKey'),
    model: 'deepseek/deepseek-chat-v3-0324:free',
    baseURL: 'https://openrouter.ai/api/v1',
  },

  perplexity: {
    apiKey: getEnvVar('perplexityApiKey'),
    model: 'sonar-pro',
    baseURL: 'https://api.perplexity.ai',
  },

  supabase: {
    url: getEnvVar('supabaseUrl'),
    anonKey: getEnvVar('supabaseAnonKey'),
  },

  debugMode: true,
};

export default config;

// Helper to get current provider config
export const getCurrentProviderConfig = () => {
  const { aiProvider } = config;
  if (aiProvider === 'openrouter') {
    return {
      provider: 'openrouter' as const,
      apiKey: config.openRouter.apiKey,
      model: config.openRouter.model,
      baseURL: config.openRouter.baseURL,
    };
  } else {
    return {
      provider: 'perplexity' as const,
      apiKey: config.perplexity.apiKey,
      model: config.perplexity.model,
      baseURL: config.perplexity.baseURL,
    };
  }
};

//NEW ENV.TS FILE
// /**
//  * Environment Configuration
//  * Manages API keys and provider selection
//  */

// import Constants from 'expo-constants';

// export type AIProvider = 'openrouter' | 'perplexity';

// interface EnvConfig {
//   aiProvider: AIProvider;
//   openRouter: {
//     apiKey: string;
//     model: string;
//     baseURL: string;
//   };
//   perplexity: {
//     apiKey: string;
//     model: string;
//     baseURL: string;
//   };
//   debugMode: boolean;
// }

// const TEMP_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';

// // Get environment variables from expo-constants
// const getEnvVar = (key: string): string => {
//   const value = Constants.expoConfig?.extra?.[key];
//   if (!value) {
//     throw new Error(`Missing required environment variable: ${key}`);
//   }
//   return value;
// };

// const config: EnvConfig = {
//   // Toggle between 'openrouter' and 'perplexity'
//   aiProvider: 'openrouter',

//   openRouter: {
//     apiKey: getEnvVar('openRouterApiKey'),
//     model: 'google/gemini-2.0-flash-exp:free',
//     baseURL: 'https://openrouter.ai/api/v1',
//   },

//   perplexity: {
//     apiKey: getEnvVar('perplexityApiKey'),
//     model: 'llama-3.1-sonar-small-128k-online',
//     baseURL: 'https://api.perplexity.ai',
//   },

//   debugMode: true,
// };

// export default config;

// // Helper to get current provider config
// export const getCurrentProviderConfig = () => {
//   const { aiProvider } = config;
//   if (aiProvider === 'openrouter') {
//     return {
//       provider: 'openrouter' as const,
//       apiKey: config.openRouter.apiKey,
//       model: config.openRouter.model,
//       baseURL: config.openRouter.baseURL,
//     };
//   } else {
//     return {
//       provider: 'perplexity' as const,
//       apiKey: config.perplexity.apiKey,
//       model: config.perplexity.model,
//       baseURL: config.perplexity.baseURL,
//     };
//   }
// };


//old env.ts file
// /**
//  * Environment Configuration
//  * Manages API keys and provider selection
//  */

// // Note: In React Native, we need to access environment variables differently
// // For now, we'll use a simple config object that can be easily modified
// // In production, consider using expo-constants with app.config.js

// export type AIProvider = 'openrouter' | 'perplexity';

// interface EnvConfig {
//   aiProvider: AIProvider;
//   openRouter: {
//     apiKey: string;
//     model: string;
//     baseURL: string;
//   };
//   perplexity: {
//     apiKey: string;
//     model: string;
//     baseURL: string;
//   };
//   debugMode: boolean;
// }

// // TODO: Replace these placeholder keys with your actual API keys
// // For security, consider using expo-secure-store for production
// const config: EnvConfig = {
//   // Toggle between 'openrouter' and 'perplexity'
//   aiProvider: 'openrouter',

//   openRouter: {
//     apiKey: process.env.OPENROUTER_API_KEY || 'YOUR_OPENROUTER_API_KEY',
//     model: 'google/gemini-2.0-flash-exp:free',
//     baseURL: 'https://openrouter.ai/api/v1',
//   },

//   perplexity: {
//     apiKey: process.env.PERPLEXITY_API_KEY || 'YOUR_PERPLEXITY_API_KEY',
//     model: 'llama-3.1-sonar-small-128k-online',
//     baseURL: 'https://api.perplexity.ai',
//   },

//   debugMode: true,
// };

// export default config;

// // Helper to get current provider config
// export const getCurrentProviderConfig = () => {
//   const { aiProvider } = config;
//   if (aiProvider === 'openrouter') {
//     return {
//       provider: 'openrouter' as const,
//       apiKey: config.openRouter.apiKey,
//       model: config.openRouter.model,
//       baseURL: config.openRouter.baseURL,
//     };
//   } else {
//     return {
//       provider: 'perplexity' as const,
//       apiKey: config.perplexity.apiKey,
//       model: config.perplexity.model,
//       baseURL: config.perplexity.baseURL,
//     };
//   }
// };
