
import 'dotenv/config';

export default {
  expo: {
    name: 'calorie-app',
    slug: 'calorie-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'calorieapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png'
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png'
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000'
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    // This is where your .env variables will be accessible
    extra: {
      openRouterApiKey: process.env.OPENROUTER_API_KEY,
      perplexityApiKey: process.env.PERPLEXITY_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
};






//OLD APP.JSON
// {
//   "expo": {
//     "name": "calorie-app",
//     "slug": "calorie-app",
//     "version": "1.0.0",
//     "orientation": "portrait",
//     "icon": "./assets/images/icon.png",
//     "scheme": "calorieapp",
//     "userInterfaceStyle": "automatic",
//     "newArchEnabled": true,
//     "ios": {
//       "supportsTablet": true
//     },
//     "android": {
//       "adaptiveIcon": {
//         "backgroundColor": "#E6F4FE",
//         "foregroundImage": "./assets/images/android-icon-foreground.png",
//         "backgroundImage": "./assets/images/android-icon-background.png",
//         "monochromeImage": "./assets/images/android-icon-monochrome.png"
//       },
//       "edgeToEdgeEnabled": true,
//       "predictiveBackGestureEnabled": false
//     },
//     "web": {
//       "output": "static",
//       "favicon": "./assets/images/favicon.png"
//     },
//     "plugins": [
//       "expo-router",
//       [
//         "expo-splash-screen",
//         {
//           "image": "./assets/images/splash-icon.png",
//           "imageWidth": 200,
//           "resizeMode": "contain",
//           "backgroundColor": "#ffffff",
//           "dark": {
//             "backgroundColor": "#000000"
//           }
//         }
//       ]
//     ],
//     "experiments": {
//       "typedRoutes": true,
//       "reactCompiler": true
//     }
//   }
// }
