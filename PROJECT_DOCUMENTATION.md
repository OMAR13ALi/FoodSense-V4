# Calorie Tracker App - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Core Features](#core-features)
5. [Screens & Navigation](#screens--navigation)
6. [Services & Backend Integration](#services--backend-integration)
7. [Components](#components)
8. [Data Management](#data-management)
9. [AI Integration](#ai-integration)
10. [Authentication & User Management](#authentication--user-management)
11. [Database Schema](#database-schema)
12. [Key Functionalities](#key-functionalities)

---

## Project Overview

**Calorie Tracker App** (also referred to as "FoodSense") is a React Native mobile application built with Expo that enables users to track their daily nutrition intake using AI-powered meal analysis. The app provides an intuitive, Apple Notes-style free-writing interface where users can simply type what they eat, and the AI automatically calculates calories and macronutrients.

### Key Highlights
- **AI-Powered Nutrition Analysis**: Automatically extracts calories, protein, carbs, and fat from natural language meal descriptions
- **Real-time Tracking**: Live calorie and macro tracking with visual progress indicators
- **Cloud Sync**: All data synchronized to Supabase for multi-device access
- **Beautiful UI**: Modern, clean interface inspired by Apple Notes design
- **Cross-Platform**: Works on iOS, Android, and Web

---

## Technology Stack

### Frontend Framework
- **React Native** (v0.81.5) with **Expo** (v54.0.22)
- **Expo Router** (v6.0.14) for file-based routing
- **TypeScript** (v5.9.2) for type safety

### State Management
- **React Context API** with useReducer for global state
- **Custom Hooks** for theme and color scheme management

### Backend & Database
- **Supabase** (v2.80.0) for:
  - Authentication (email/password)
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions

### AI Services
- **OpenRouter API** (Gemini models) for nutrition analysis
- **Perplexity Sonar API** as alternative provider
- Request queue system to prevent rate limiting
- Multi-level caching (static USDA cache + API response cache)

### UI Libraries
- **React Native Reanimated** (v4.1.1) for animations
- **React Native Gifted Charts** (v1.4.65) for data visualization
- **React Native Toast Message** (v2.3.3) for notifications
- **Expo Linear Gradient** for gradient backgrounds
- **Expo Haptics** for tactile feedback

### Other Key Dependencies
- **Axios** (v1.13.2) for HTTP requests
- **AsyncStorage** for local caching
- **Expo Secure Store** for sensitive data
- **React Native Gesture Handler** for touch interactions

---

## Architecture

### Project Structure
```
calorie-app/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   ├── onboarding/       # Onboarding flow
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
├── contexts/             # React Context providers
├── services/             # Business logic & API services
├── hooks/                # Custom React hooks
├── constants/            # Constants & theme
├── types/                # TypeScript type definitions
├── config/               # Configuration files
└── supabase/             # Database migrations
```

### State Management Architecture
- **AppContext**: Manages meals, settings, favorites, and totals
- **AuthContext**: Handles authentication state and user session
- **Reducer Pattern**: Uses useReducer for predictable state updates
- **Automatic Sync**: State changes automatically sync to Supabase

### Data Flow
1. User input → Text editor
2. Debounced AI analysis (1.5s delay)
3. AI service processes meal text
4. Results update AppContext
5. Context updates trigger Supabase sync (debounced 2s)
6. UI reflects changes in real-time

---

## Core Features

### 1. AI-Powered Meal Analysis
- **Natural Language Processing**: Users type meal descriptions in plain English
- **Automatic Nutrition Extraction**: AI calculates:
  - Total calories
  - Protein (grams)
  - Carbohydrates (grams)
  - Fat (grams)
- **Confidence Scoring**: Each analysis includes confidence level (0-1)
- **Source Attribution**: Shows data sources used (USDA, nutrition databases, etc.)
- **Explanation**: Provides reasoning for calculated values

### 2. Real-Time Calorie Tracking
- **Daily Goal Progress**: Visual progress bar showing calories consumed vs. goal
- **Macro Breakdown**: Real-time tracking of protein, carbs, and fat
- **Remaining Calories**: Calculates remaining calories for the day
- **Animated Updates**: Smooth animations when values change

### 3. Meal History & Management
- **Daily Meal Log**: View all meals logged for the current day
- **Historical Data**: Browse meals from previous days
- **Edit & Delete**: Modify or remove meal entries
- **Nutrition Details Modal**: View detailed nutrition breakdown for each meal

### 4. Favorites System
- **Save Favorite Meals**: Save frequently eaten meals for quick access
- **Quick Add**: One-tap to add favorite meals to daily log
- **Usage Tracking**: Tracks how often favorites are used
- **Smart Sorting**: Most-used favorites appear first

### 5. Progress Tracking
- **Weekly Trends**: View calorie and macro trends over the past week
- **Visual Charts**: Line charts for calories, bar charts for macros
- **Weekly Statistics**: Total calories, average per day, total meals
- **Date Navigation**: Navigate between weeks to view historical progress

### 6. User Settings
- **Customizable Goals**: Set daily calorie goal and macro targets
- **Theme Preferences**: Light/dark mode support
- **Meal Reminders**: Toggle meal reminder notifications
- **Water Tracking**: Enable/disable water intake tracking

---

## Screens & Navigation

### Authentication Flow
1. **Welcome Screen** (`app/onboarding/welcome.tsx`)
   - App introduction
   - "Get Started" button → Onboarding
   - "I already have an account" → Login

2. **Onboarding Flow** (`app/onboarding/`)
   - User Info: Height, weight, age, gender
   - Dietary Preferences: Vegetarian, vegan, keto, etc.
   - Goals: Daily calorie goal, activity level
   - Completion: Final step before signup

3. **Login/Signup** (`app/(auth)/`)
   - Email/password authentication
   - Automatic profile creation on signup
   - Error handling and validation

### Main App Tabs (`app/(tabs)/`)

#### 1. Dashboard (`index.tsx`) - Main Entry Point
- **Apple Notes-style Text Editor**: Free-form text input
- **Inline Calorie Display**: Calories shown next to each line
- **Animated Status Indicators**: 
  - "Calculating..." → "Sources" (with animated circles) → Final calories
- **Favorites Panel**: Quick access to saved meals
- **Calorie Progress Bar**: Fixed at bottom showing daily progress
- **Real-time Analysis**: AI processes each line as user types (debounced)

#### 2. Summary (`summary.tsx`) - Daily Overview
- **Quick Stats Dashboard**: 
  - Main calories card with progress bar
  - Protein, carbs, fat cards with mini progress bars
  - Meal count
- **Macro Breakdown Section**: 
  - Detailed progress bars for each macro
  - Percentage of goal achieved
- **Meal History**: List of all meals logged today
- **Delete Functionality**: Swipe or tap to delete meals

#### 3. Progress (`progress.tsx`) - Weekly Trends
- **Week Navigator**: Navigate between weeks
- **Weekly Summary Cards**: 
  - Total calories
  - Average per day
  - Total meals
- **Calorie Trend Chart**: Line chart showing daily calorie intake
- **Macro Breakdown Chart**: Bar chart showing protein, carbs, fat per day
- **Empty States**: Helpful messages when no data available

#### 4. Explore (`explore.tsx`) - Historical Data
- **Date Picker**: Select any past date
- **Date Navigation**: Previous/next day buttons
- **Daily Totals Card**: Summary of calories and macros for selected date
- **Meal List**: All meals logged on selected date
- **Empty States**: Messages when no meals logged

#### 5. Settings (`settings.tsx`) - User Preferences
- **Nutrition Goals Section**: 
  - Daily calorie goal (editable)
  - Target protein (editable)
  - Target carbs (editable)
  - Target fat (editable)
- **Preferences Section**: 
  - Dark mode toggle
- **About Section**: 
  - App version
  - Help & support

#### 6. Profile (`profile.tsx`) - User Profile
- User information display
- Profile management (if implemented)

---

## Services & Backend Integration

### 1. AI Service (`services/ai-service.ts`)
**Purpose**: Handles all AI-powered nutrition analysis

**Key Functions**:
- `analyzeNutrition(mealText: string)`: Main analysis function
- `createDebouncedAnalyzer()`: Creates debounced analyzer for real-time input

**Features**:
- **Multi-Provider Support**: 
  - OpenRouter (Gemini models)
  - Perplexity Sonar
- **Caching Strategy**:
  1. Static USDA cache (instant results for common foods)
  2. API response cache (recent API responses)
  3. Queue API request if not cached
- **Error Handling**: 
  - Retry logic with exponential backoff
  - Network error detection
  - Rate limit handling
  - Fallback text extraction if JSON parsing fails
- **Response Parsing**: 
  - Handles JSON responses
  - Removes markdown code blocks
  - Validates required fields
  - Extracts citations from Perplexity

### 2. Database Service (`services/database-service.ts`)
**Purpose**: All Supabase database operations

**Key Functions**:
- `saveMeals()`: Save meals for a specific date
- `loadMeals()`: Load meals for a specific date
- `saveSettings()`: Save user settings
- `loadSettings()`: Load user settings
- `getDailySummaries()`: Get aggregated daily data
- `getRecentDailySummaries()`: Get last N days of summaries
- `exportAllData()`: Export all user data as JSON
- `importAllData()`: Import data from JSON backup

**Features**:
- Automatic user authentication check
- Date-based meal organization
- Batch operations for efficiency
- Error handling with user-friendly messages

### 3. Storage Service (`services/storage-service.ts`)
**Purpose**: Debounced wrapper around database service

**Key Functions**:
- `saveMeals()`: Debounced save (2s delay)
- `saveMealsImmediate()`: Force immediate save
- `loadMeals()`: Load meals for date
- `saveSettings()`: Debounced settings save
- `saveSettingsImmediate()`: Force immediate save

**Features**:
- Prevents excessive API calls
- Automatic debouncing
- Manual override for critical saves

### 4. Auth Service (`services/auth-service.ts`)
**Purpose**: Authentication operations using Supabase Auth

**Key Functions**:
- `signUp()`: Create new user account
- `signIn()`: Authenticate existing user
- `signOut()`: Log out current user
- `getCurrentUser()`: Get authenticated user
- `resetPassword()`: Send password reset email
- `updatePassword()`: Update user password
- `updateEmail()`: Update user email

**Features**:
- Automatic profile creation on signup
- Profile existence verification
- Fallback profile creation if trigger fails
- Error handling with detailed messages

### 5. Favorites Service (`services/favorites-service.ts`)
**Purpose**: Manage favorite meals

**Key Functions**:
- `getFavorites()`: Get all favorites (sorted by frequency)
- `addFavorite()`: Add new favorite meal
- `updateFavorite()`: Update existing favorite
- `deleteFavorite()`: Remove favorite
- `incrementFavoriteUsage()`: Track when favorite is used
- `getTopFavorites()`: Get most frequently used
- `getRecentFavorites()`: Get recently used
- `searchFavorites()`: Search by name

**Features**:
- Frequency-based sorting
- Usage tracking
- Search functionality

### 6. Request Queue (`services/request-queue.ts`)
**Purpose**: Prevent API rate limiting

**Features**:
- Sequential request processing
- Prevents simultaneous API calls
- Global queue instance

### 7. Caching Services
- **Nutrition Cache** (`services/nutrition-cache.ts`): Static USDA food database
- **API Response Cache** (`services/api-response-cache.ts`): Caches recent API responses

### 8. Profile Service (`services/profile-service.ts`)
**Purpose**: User profile management

**Features**:
- Load user profile from database
- Update profile information
- Handle onboarding data

---

## Components

### Core UI Components

#### 1. AnimatedCalorieText (`components/AnimatedCalorieText.tsx`)
- Displays calorie count with animation
- Shows status: calculating → sources → done
- Animated source circles during "sources" phase
- Tap to view details

#### 2. CalorieProgressBar (`components/CalorieProgressBar.tsx`)
- Fixed bottom progress bar
- Shows consumed vs. goal calories
- Visual percentage indicator
- Tap to focus text input

#### 3. CircularProgress (`components/CircularProgress.tsx`)
- Circular progress indicator
- Used for macro tracking
- Animated updates

#### 4. CircularSettingsButton (`components/CircularSettingsButton.tsx`)
- Circular settings icon button
- Navigates to settings screen
- Consistent across screens

#### 5. MealEntryCard (`components/MealEntryCard.tsx`)
- Displays individual meal entry
- Shows calories and macros
- Delete functionality
- Tap for details

#### 6. NutritionDetailsModal (`components/NutritionDetailsModal.tsx`)
- Modal showing detailed nutrition info
- Editable calorie and macro values
- AI explanation display
- Source attribution

#### 7. FavoritesPanel (`components/FavoritesPanel.tsx`)
- Horizontal scrollable list of favorites
- Quick-add functionality
- Shows frequency/usage indicators
- Empty state when no favorites

#### 8. MotivationalBanner (`components/MotivationalBanner.tsx`)
- Encouraging messages
- Goal achievement celebrations

#### 9. SourceCircles (`components/SourceCircles.tsx`)
- Animated circles representing data sources
- Staggered animation entrance
- Visual feedback during AI analysis

#### 10. SourceIcon (`components/SourceIcon.tsx`)
- Icon representing data source type
- Used in source circles

### Form Components

#### 1. AuthInput (`components/auth/AuthInput.tsx`)
- Styled text input for authentication
- Error state handling
- Validation feedback

#### 2. AuthButton (`components/auth/AuthButton.tsx`)
- Styled button for auth actions
- Loading state
- Disabled state

### Settings Components

#### 1. SettingsRow (`components/SettingsRow.tsx`)
- Reusable settings row component
- Icon, label, value display
- Optional chevron for navigation
- Custom right component support

#### 2. ToggleSwitch (`components/ToggleSwitch.tsx`)
- Custom toggle switch
- Animated state changes
- Theme-aware colors

### Utility Components

#### 1. LoadingIndicator (`components/LoadingIndicator.tsx`)
- Loading spinner
- Used throughout app

#### 2. ThemedText (`components/themed-text.tsx`)
- Theme-aware text component
- Automatic color adaptation

#### 3. ThemedView (`components/themed-view.tsx`)
- Theme-aware view component
- Background color adaptation

---

## Data Management

### State Structure (AppContext)

```typescript
interface AppState {
  meals: MealEntry[];           // All meals for current day
  settings: UserSettings;        // User preferences and goals
  favorites: FavoriteMeal[];    // Saved favorite meals
  totalCalories: number;         // Calculated total
  totalProtein: number;          // Calculated total
  totalCarbs: number;            // Calculated total
  totalFat: number;              // Calculated total
}
```

### Meal Entry Structure

```typescript
interface MealEntry {
  id: string;                    // UUID
  text: string;                  // Meal description
  calories: number;             // Total calories
  protein?: number;             // Protein in grams
  carbs?: number;               // Carbs in grams
  fat?: number;                 // Fat in grams
  timestamp: Date;             // When meal was logged
  aiExplanation?: string;       // AI's reasoning
  confidence?: number;          // 0-1 confidence score
  sources?: string[];            // Data sources used
  error?: string;               // Error message if analysis failed
  isLoading?: boolean;          // Loading state
}
```

### User Settings Structure

```typescript
interface UserSettings {
  dailyCalorieGoal: number;     // Daily calorie target
  targetProtein: number;        // Protein goal (grams)
  targetCarbs: number;          // Carbs goal (grams)
  targetFat: number;            // Fat goal (grams)
  mealReminders: boolean;        // Enable reminders
  trackWater: boolean;          // Enable water tracking
  darkMode: boolean;            // Theme preference
}
```

### Data Synchronization
- **Automatic Sync**: State changes automatically sync to Supabase
- **Debouncing**: Saves debounced by 2 seconds to prevent excessive API calls
- **Error Handling**: Failed syncs are logged and user is notified
- **Offline Support**: Data persists locally, syncs when online

---

## AI Integration

### Analysis Flow

1. **User Input**: User types meal description in text editor
2. **Debounce**: 1.5 second delay after user stops typing
3. **Cache Check**: 
   - First checks static USDA cache
   - Then checks API response cache
4. **API Request**: If not cached, queues request
5. **Processing**: 
   - OpenRouter (Gemini) or Perplexity Sonar
   - JSON response parsing
   - Validation
6. **Result Display**: 
   - Updates UI with calories
   - Shows sources with animated circles
   - Displays confidence and explanation

### AI Providers

#### OpenRouter (Primary)
- **Models**: Google Gemini models
- **Features**: 
  - JSON response format support
  - Temperature: 0.3 (consistent results)
  - Max tokens: 1024
- **Special Handling**: Gemini models don't support `response_format` parameter

#### Perplexity Sonar (Alternative)
- **Features**: 
  - Real-time web search
  - Citation support
  - International nutrition databases
- **Sources**: 
  - USDA FoodData Central
  - WHO Global Food Composition Database
  - Regional databases (UK, Canada, Australia, etc.)

### Caching Strategy

1. **Static Cache**: Pre-populated USDA food database (instant results)
2. **API Response Cache**: Recent API responses stored locally
3. **Request Queue**: Prevents simultaneous API calls
4. **Retry Logic**: Exponential backoff for server errors

### Error Handling

- **Network Errors**: User-friendly messages, retry option
- **Rate Limits**: Queue system prevents 429 errors
- **Parse Errors**: Fallback text extraction
- **Timeout**: 30-second timeout with retry
- **Invalid Responses**: Validation and error messages

---

## Authentication & User Management

### Authentication Flow

1. **Welcome Screen**: New users start onboarding
2. **Onboarding**: Collects user info, preferences, goals
3. **Signup**: Creates account with email/password
4. **Profile Creation**: Automatic profile creation via database trigger
5. **Login**: Existing users sign in
6. **Session Management**: Automatic session restoration

### User Profile Structure

```typescript
interface UserProfile {
  id: string;                   // References auth.users(id)
  email: string;
  
  // Physical data
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  
  // Dietary preferences
  dietary_preference?: 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
  allergies?: string[];
  
  // Nutrition goals
  daily_calorie_goal: number;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  
  // App preferences
  theme: 'light' | 'dark' | 'auto';
  meal_reminders: boolean;
  track_water: boolean;
  
  // Privacy & consent
  data_sharing_consent: boolean;
  analytics_enabled: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  last_active?: string;
}
```

### Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic Profile Creation**: Database trigger creates profile on signup
- **Fallback Profile Creation**: Service layer creates profile if trigger fails
- **Session Management**: Automatic session refresh
- **Error Handling**: Graceful handling of missing profiles

---

## Database Schema

### Tables

#### 1. `auth.users` (Supabase Auth)
- Managed by Supabase
- Email/password authentication
- Session management

#### 2. `user_profiles`
- User profile information
- Linked to `auth.users` via `id`
- Contains onboarding data and preferences

#### 3. `meals`
- Individual meal entries
- Nutrition data (calories, protein, carbs, fat)
- AI metadata (explanation, confidence, sources)
- Timestamp for date organization

#### 4. `user_settings`
- User preferences and goals
- Daily calorie goal
- Macro targets
- App settings

#### 5. `favorite_meals`
- Saved favorite meals
- Usage frequency tracking
- Last used timestamp

#### 6. `daily_summaries` (Optional)
- Pre-aggregated daily statistics
- Performance optimization for queries

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only SELECT their own data
- Users can only INSERT their own data
- Users can only UPDATE their own data
- Users can only DELETE their own data

### Indexes

- `meals`: Indexed on `user_id`, `date`, `timestamp`
- `user_profiles`: Indexed on `id`, `email`
- `favorite_meals`: Indexed on `user_id`, `frequency_count`

---

## Key Functionalities

### 1. Real-Time Meal Analysis
- **Input**: Free-form text in Apple Notes-style editor
- **Processing**: 
  - Debounced analysis (1.5s after typing stops)
  - Multi-level caching
  - Queue-based API requests
- **Output**: 
  - Calories and macros displayed inline
  - Animated status indicators
  - Source attribution
  - Confidence scores

### 2. Daily Calorie Tracking
- **Real-time Totals**: Automatically calculated from meals
- **Progress Visualization**: Progress bar showing consumed vs. goal
- **Remaining Calories**: Calculated and displayed
- **Macro Tracking**: Protein, carbs, fat tracked separately

### 3. Historical Data Analysis
- **Date Navigation**: Browse meals from any past date
- **Weekly Trends**: View calorie and macro trends over weeks
- **Charts**: Visual representation of progress
- **Statistics**: Weekly totals and averages

### 4. Favorites Management
- **Save Meals**: Save frequently eaten meals
- **Quick Add**: One-tap to add favorites to daily log
- **Usage Tracking**: Automatically tracks how often favorites are used
- **Smart Sorting**: Most-used favorites appear first

### 5. Settings & Customization
- **Goals**: Customizable daily calorie and macro targets
- **Theme**: Light/dark mode support
- **Preferences**: Meal reminders, water tracking toggles
- **Profile**: User information management

### 6. Data Synchronization
- **Cloud Sync**: All data automatically synced to Supabase
- **Multi-Device**: Access data from any device
- **Offline Support**: Data persists locally, syncs when online
- **Debouncing**: Prevents excessive API calls

### 7. Error Handling & Recovery
- **Network Errors**: User-friendly error messages
- **API Failures**: Retry logic with exponential backoff
- **Parse Errors**: Fallback text extraction
- **Profile Issues**: Automatic profile creation fallback

### 8. Performance Optimizations
- **Caching**: Multi-level caching for instant results
- **Debouncing**: Reduces API calls
- **Request Queue**: Prevents rate limiting
- **Lazy Loading**: Data loaded on demand
- **Optimistic Updates**: UI updates immediately

### 9. User Experience Features
- **Animations**: Smooth transitions and status changes
- **Haptic Feedback**: Tactile responses for interactions
- **Toast Notifications**: Success/error messages
- **Loading States**: Clear feedback during operations
- **Empty States**: Helpful messages when no data

### 10. Accessibility & Theming
- **Dark Mode**: Full dark mode support
- **Theme System**: Consistent theming across app
- **Color Schemes**: Automatic adaptation to system preferences
- **Responsive Design**: Works on various screen sizes

---

## Development Notes

### Environment Configuration
- API keys stored in environment variables
- Supabase credentials in config
- Debug mode for development logging

### Testing Considerations
- Mock data available in `constants/mockData.ts`
- Error scenarios handled gracefully
- Network failure simulation possible

### Future Enhancements (Potential)
- Meal photos
- Barcode scanning
- Recipe import
- Social sharing
- Meal planning
- Water intake tracking
- Weight tracking
- Exercise integration
- Nutrition insights and recommendations

---

## Conclusion

The Calorie Tracker App is a comprehensive nutrition tracking application that combines the simplicity of natural language input with the power of AI to provide accurate nutrition analysis. With cloud synchronization, beautiful UI, and robust error handling, it offers a seamless experience for users to track their daily nutrition goals.

The architecture is designed for scalability, with clear separation of concerns, type safety, and efficient data management. The multi-provider AI integration ensures reliable nutrition analysis, while the caching strategy provides instant results for common foods.

---

*Documentation generated from codebase inspection - Last Updated: 2024*

