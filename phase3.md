 1. Onboarding flow BEFORE signup - Collect height, weight, dietary preferences (skippable)
  2. Email/password auth - Simple, no verification required
  3. Saved favorite meals - Quick-add frequently eaten meals
  4. AI meal recommendations - Based on user profile (future feature)
  5. Account management - Change email, password, delete account

  This is a more comprehensive design. Let me create a detailed implementation plan:

────────────────────────────────────────────────────────────────────────────────────────────────────────────
 Ready to code?

 Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Complete Auth + Profile Implementation Plan

 Overview

 Transform the app from device-ID based to fully authenticated with user profiles, onboarding flow, and     
 favorite meals feature.

 ---
 PHASE 1: Onboarding Flow (NEW - Before Auth)

 New Screens (app/onboarding/)

 1. welcome.tsx - App intro, "Get Started" button
 2. user-info.tsx - Collect: height, weight, age, gender (skippable)
 3. dietary-preferences.tsx - Vegan, vegetarian, keto, allergies (skippable)
 4. goals.tsx - Daily calorie goal, activity level (skippable)
 5. completion.tsx - "All set! Create account to save progress"

 Flow Navigation

 App Launch (first time)
   → Welcome
   → User Info (can skip)
   → Dietary Preferences (can skip)
   → Goals (can skip)
   → Signup/Login choice

 App Launch (returning)
   → Check auth
   → If logged in → (tabs)/index
   → If not → Login screen

 ---
 PHASE 2: Authentication System

 New Screens (app/(auth)/)

 1. login.tsx - Email + password, "Sign up" link
 2. signup.tsx - Email + password + confirm password
 3. forgot-password.tsx - Password reset (future)

 Auth Service (services/auth-service.ts)

 - signUp(email, password) - Create account
 - signIn(email, password) - Login
 - signOut() - Logout
 - getCurrentUser() - Get session
 - updatePassword(newPassword) - Change password

 Auth Context (contexts/AuthContext.tsx)

 - Global auth state
 - Auto-login on app start
 - Redirect logic

 ---
 PHASE 3: Database Schema Updates

 New Tables (Migration: 002_add_auth_and_profiles.sql)

 user_profiles - Extended user data
 CREATE TABLE user_profiles (
   id UUID PRIMARY KEY REFERENCES auth.users(id),
   email TEXT UNIQUE NOT NULL,

   -- Physical data (from onboarding)
   height_cm INTEGER,
   weight_kg NUMERIC(5,2),
   age INTEGER,
   gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),

   -- Dietary preferences
   dietary_preference TEXT CHECK (dietary_preference IN ('none', 'vegetarian', 'vegan', 'pescatarian',      
 'keto', 'paleo')),
   allergies TEXT[], -- Array of allergens

   -- Goals (from onboarding OR existing settings)
   daily_calorie_goal INTEGER DEFAULT 2000,
   activity_level TEXT DEFAULT 'moderate',
   target_protein INTEGER DEFAULT 150,
   target_carbs INTEGER DEFAULT 250,
   target_fat INTEGER DEFAULT 65,

   -- App preferences
   theme TEXT DEFAULT 'auto',

   -- Migration
   device_id TEXT,
   migrated_at TIMESTAMPTZ,

   created_at TIMESTAMPTZ DEFAULT NOW(),
   updated_at TIMESTAMPTZ DEFAULT NOW()
 );

 favorite_meals - Saved frequent meals
 CREATE TABLE favorite_meals (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
   name TEXT NOT NULL,
   calories NUMERIC(10,2) NOT NULL,
   protein NUMERIC(10,2),
   carbs NUMERIC(10,2),
   fat NUMERIC(10,2),
   emoji TEXT, -- Optional emoji icon
   frequency_count INTEGER DEFAULT 0, -- Track usage
   last_used TIMESTAMPTZ,
   created_at TIMESTAMPTZ DEFAULT NOW()
 );

 Update existing tables
 ALTER TABLE meals ADD COLUMN user_id UUID REFERENCES auth.users(id);
 ALTER TABLE daily_summaries ADD COLUMN user_id UUID REFERENCES auth.users(id);

 ---
 PHASE 4: Profile & Account Management

 Profile Screen (app/(tabs)/profile.tsx)

 Replace or extend settings.tsx with:

 Sections:
 1. User Info Card
   - Email
   - Height, Weight, Age (tap to edit)
   - Dietary preference badge
 2. Nutrition Goals (existing settings)
   - Daily calorie goal
   - Macros (protein, carbs, fat)
 3. Favorite Meals
   - List of saved meals
   - "Add new favorite" button
   - Quick-add to today
 4. Account
   - Change email
   - Change password
   - Delete account (with confirmation)
   - Logout button

 New Components

 1. ProfileHeader - Email, avatar placeholder, edit button
 2. FavoriteMealCard - Meal name, calories, quick-add button
 3. AccountSettingRow - Similar to existing SettingsRow
 4. DeleteAccountModal - Confirmation dialog

 ---
 PHASE 5: Favorite Meals Feature

 New Screen (app/favorite-meals/)

 1. add-favorite.tsx - Create favorite meal
   - Name input
   - Calories (manual or from AI analysis)
   - Macros
   - Optional emoji picker
 2. edit-favorite.tsx - Edit existing favorite

 Integration Points

 1. Track Screen (index.tsx)
   - Add "Favorites" button above text input
   - Opens bottom sheet with favorite meals
   - Tap to quick-add to current day
 2. Database Service
   - addFavoriteMeal()
   - updateFavoriteMeal()
   - deleteFavoriteMeal()
   - getFavoriteMeals(userId)
   - incrementFavoriteUsage(id) - Track frequency

 ---
 PHASE 6: AI Meal Recommendations (Future)

 Preparation (Database)

 CREATE TABLE meal_recommendations (
   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
   user_id UUID REFERENCES auth.users(id),
   meal_name TEXT NOT NULL,
   calories INTEGER,
   protein INTEGER,
   reason TEXT, -- Why recommended
   based_on TEXT, -- 'goals' | 'preferences' | 'history'
   shown_at TIMESTAMPTZ DEFAULT NOW(),
   accepted BOOLEAN DEFAULT FALSE
 );

 UI Location

 - Summary screen: "Recommended for you" section
 - Based on: remaining calories, dietary preferences, meal history

 ---
 UI/UX DESIGN SPECIFICATIONS

 Onboarding Screens Design

 Style: Modern, minimal, friendly
 - Large icons/illustrations
 - Progress indicator (dots at top)
 - "Skip" button (top-right)
 - Large "Continue" button (bottom)

 Color Scheme:
 - Primary: #4A90E2 (existing blue)
 - Background: White/Dark based on system
 - Cards: Same 16px border radius

 Example: User Info Screen
 ┌────────────────────────────────────┐
 │  ○ ● ○ ○                    Skip  │ ← Progress + Skip
 │                                    │
 │         👤                         │ ← Icon
 │    Tell us about you               │ ← Title
 │  (Optional - helps with            │ ← Subtitle
 │   personalized recommendations)    │
 │                                    │
 │  ┌──────────────────────────────┐ │
 │  │ Height (cm)                  │ │ ← Input
 │  │ 175                   ▼      │ │
 │  └──────────────────────────────┘ │
 │                                    │
 │  ┌──────────────────────────────┐ │
 │  │ Weight (kg)                  │ │
 │  │ 70                    ▼      │ │
 │  └──────────────────────────────┘ │
 │                                    │
 │  ┌──────────────────────────────┐ │
 │  │ Age                          │ │
 │  │ 25                    ▼      │ │
 │  └──────────────────────────────┘ │
 │                                    │
 │        [Continue]                  │ ← Button
 └────────────────────────────────────┘

 Auth Screens Design

 Style: Clean, secure feeling

 Login Screen:
 ┌────────────────────────────────────┐
 │                                    │
 │         🔐                         │
 │      Welcome Back                  │
 │                                    │
 │  ┌──────────────────────────────┐ │
 │  │ 📧 Email                     │ │
 │  │ you@example.com              │ │
 │  └──────────────────────────────┘ │
 │                                    │
 │  ┌──────────────────────────────┐ │
 │  │ 🔒 Password                  │ │
 │  │ ••••••••                     │ │
 │  └──────────────────────────────┘ │
 │                                    │
 │             Forgot password?       │
 │                                    │
 │        [Sign In]                   │
 │                                    │
 │    Don't have an account?          │
 │          Sign Up                   │
 └────────────────────────────────────┘

 Profile Screen Design

 Style: Card-based, organized sections

 ┌────────────────────────────────────┐
 │  Profile                     ⚙️   │ ← Header
 │                                    │
 │  ┌──────────────────────────────┐ │
 │  │  👤  user@email.com          │ │ ← User card
 │  │  Height: 175cm  Weight: 70kg │ │
 │  │  🌱 Vegetarian               │ │
 │  └──────────────────────────────┘ │
 │                                    │
 │  NUTRITION GOALS                   │
 │  ┌──────────────────────────────┐ │
 │  │ Daily Calories    2000 cal  >│ │
 │  │ Protein           150g      >│ │
 │  │ Carbs             250g      >│ │
 │  └──────────────────────────────┘ │
 │                                    │
 │  FAVORITE MEALS                    │
 │  ┌──────────────────────────────┐ │
 │  │ 🍳 Breakfast Bowl   320 cal  │ │
 │  │ 🥗 Caesar Salad     280 cal  │ │
 │  │ + Add Favorite               │ │
 │  └──────────────────────────────┘ │
 │                                    │
 │  ACCOUNT                           │
 │  ┌──────────────────────────────┐ │
 │  │ Change Email              >  │ │
 │  │ Change Password           >  │ │
 │  │ Delete Account            >  │ │
 │  └──────────────────────────────┘ │
 │                                    │
 │        [Log Out]                   │
 └────────────────────────────────────┘

 Favorite Meals Quick-Add

 Location: Track screen (index.tsx)
 Design: Bottom sheet with favorites

 Track Screen:
 ┌────────────────────────────────────┐
 │  Today               🔄  ⚙️        │
 │                                    │
 │  [⭐ Favorites]  ← NEW BUTTON      │
 │                                    │
 │  ┌──────────────────────────────┐ │
 │  │ What did you eat?            │ │
 │  │                              │ │
 │  └──────────────────────────────┘ │
 │  ...                               │
 └────────────────────────────────────┘

 Taps "Favorites" → Bottom Sheet:
 ┌────────────────────────────────────┐
 │  ═══                               │ ← Drag handle
 │  Your Favorite Meals               │
 │                                    │
 │  ┌──────────────────────────────┐ │
 │  │ 🍳 Breakfast Bowl           │ │
 │  │ 320 cal • 25g protein    [+]│ │
 │  └──────────────────────────────┘ │
 │  ┌──────────────────────────────┐ │
 │  │ 🥗 Caesar Salad             │ │
 │  │ 280 cal • 15g protein    [+]│ │
 │  └──────────────────────────────┘ │
 │  ┌──────────────────────────────┐ │
 │  │ 🍗 Grilled Chicken          │ │
 │  │ 450 cal • 45g protein    [+]│ │
 │  └──────────────────────────────┘ │
 │                                    │
 │        + Add New Favorite          │
 └────────────────────────────────────┘

 ---
 IMPLEMENTATION PHASES

 Phase 1: Database & Auth Foundation (Days 1-3)

 - Create migration 002_add_auth_and_profiles.sql
 - Update supabase-client.ts (enable auth, AsyncStorage)
 - Create auth-service.ts
 - Create AuthContext.tsx
 - Add RLS policies

 Phase 2: Onboarding Screens (Days 4-6)

 - Create app/onboarding/ directory
 - welcome.tsx
 - user-info.tsx
 - dietary-preferences.tsx
 - goals.tsx
 - Onboarding navigation logic

 Phase 3: Auth Screens (Days 7-9)

 - Create app/(auth)/ directory
 - login.tsx
 - signup.tsx
 - AuthInput component
 - AuthButton component
 - Form validation

 Phase 4: Profile Screen (Days 10-12)

 - Create app/(tabs)/profile.tsx
 - ProfileHeader component
 - Account management screens
 - Change email/password functionality
 - Delete account with confirmation
 - Logout functionality

 Phase 5: Favorite Meals (Days 13-16)

 - Create favorite_meals table
 - Database service functions
 - Add favorite screen
 - Edit favorite screen
 - Favorites bottom sheet on track screen
 - Quick-add functionality

 Phase 6: Data Migration & Testing (Days 17-20)

 - Device data migration flow
 - Test onboarding → auth → track
 - Test favorites workflow
 - Test account management
 - Polish animations
 - Bug fixes

 ---
 NEW FILES TO CREATE

 Services

 1. services/auth-service.ts - Auth logic
 2. services/profile-service.ts - Profile CRUD
 3. services/favorites-service.ts - Favorite meals

 Contexts

 1. contexts/AuthContext.tsx - Auth state

 Types

 1. types/auth.ts - Auth interfaces
 2. types/profile.ts - Profile interfaces
 3. types/favorites.ts - Favorite meals

 Screens (Onboarding)

 1. app/onboarding/welcome.tsx
 2. app/onboarding/user-info.tsx
 3. app/onboarding/dietary-preferences.tsx
 4. app/onboarding/goals.tsx
 5. app/onboarding/_layout.tsx

 Screens (Auth)

 1. app/(auth)/login.tsx
 2. app/(auth)/signup.tsx
 3. app/(auth)/_layout.tsx

 Screens (Profile)

 1. app/(tabs)/profile.tsx
 2. app/account/change-email.tsx
 3. app/account/change-password.tsx

 Screens (Favorites)

 1. app/favorites/add.tsx
 2. app/favorites/edit.tsx

 Components

 1. components/auth/AuthInput.tsx
 2. components/auth/AuthButton.tsx
 3. components/profile/ProfileHeader.tsx
 4. components/favorites/FavoriteMealCard.tsx
 5. components/favorites/FavoritesList.tsx
 6. components/favorites/QuickAddSheet.tsx

 Database

 1. supabase/migrations/002_add_auth_and_profiles.sql

 ---
 SUMMARY

 This plan creates a complete authentication system with:
 ✅ Pre-auth onboarding (height, weight, dietary prefs - all skippable)
 ✅ Email/password auth (no verification for fast onboarding)
 ✅ User profiles with physical data
 ✅ Account management (change email/password, delete account)
 ✅ Favorite meals feature (save frequent meals for quick-add)
 ✅ Data migration from device-ID to user accounts
 ✅ Future-ready for AI meal recommendations

 Estimated timeline: 20 days for full implementation
 Core auth + profile: 12 days
 Favorite meals: 4 days
 Testing + polish: 4 days


 ⚠️ Note about existing data

  If you already have meals data in your database (from testing), the migration will:
  - ✅ Keep all existing data safe
  - ✅ Add new user_id columns (nullable, so existing rows won't break)
  - ✅ Allow both device_id and user_id based queries during transition
  - ✅ Provide migration function to move device data to user accounts later

  ---
  Would you like me to:
  1. ⏭️ Proceed to Phase 2 (Auth Service Layer) assuming you'll apply the migration manually
  2. 🔍 Help troubleshoot the Supabase connection to apply it automatically
  3. 📝 Create a manual setup guide with screenshots

  Let me know and we'll continue!

  Todos
  ☒ PHASE 1: Database schema - Create user_profiles table
  ☒ PHASE 1: Database schema - Create favorite_meals table
  ☒ PHASE 1: Database schema - Add user_id to existing tables
  ☒ PHASE 1: Database schema - Add RLS policies
  ☐ PHASE 2: Auth foundation - Update supabase-client.ts
  ☐ PHASE 2: Auth foundation - Create auth-service.ts
  ☐ PHASE 2: Auth foundation - Create AuthContext.tsx
  ☐ PHASE 2: Auth foundation - Create auth types
  ☐ PHASE 3: Auth UI - Create login screen
  ☐ PHASE 3: Auth UI - Create signup screen
  ☐ PHASE 3: Auth UI - Create AuthInput component
  ☐ PHASE 3: Auth UI - Create AuthButton component
  ☐ PHASE 3: Auth UI - Update root _layout for auth routing
  ☐ PHASE 4: Onboarding - Create welcome screen
  ☐ PHASE 4: Onboarding - Create user-info screen
  ☐ PHASE 4: Onboarding - Create dietary-preferences screen
  ☐ PHASE 4: Onboarding - Create goals screen
  ☐ PHASE 4: Onboarding - Implement skip functionality
  ☐ PHASE 5: Profile - Create profile screen
  ☐ PHASE 5: Profile - Create profile-service.ts
  ☐ PHASE 5: Profile - Add change email screen
  ☐ PHASE 5: Profile - Add change password screen
  ☐ PHASE 5: Profile - Add delete account functionality
  ☐ PHASE 5: Profile - Add logout functionality
  ☐ PHASE 6: Favorites - Create favorites-service.ts
  ☐ PHASE 6: Favorites - Create add favorite screen
  ☐ PHASE 6: Favorites - Create FavoriteMealCard component
  ☐ PHASE 6: Favorites - Add favorites button to track screen
  ☐ PHASE 6: Favorites - Create quick-add bottom sheet
  ☐ PHASE 7: Migration - Create device data migration function
  ☐ PHASE 7: Migration - Test signup with device data claim
  ☐ PHASE 7: Migration - Add migration UI flow
  ☐ PHASE 8: Testing - Test complete auth flow
  ☐ PHASE 8: Testing - Test onboarding skip functionality
  ☐ PHASE 8: Testing - Test profile management
  ☐ PHASE 8: Testing - Test favorites workflow 