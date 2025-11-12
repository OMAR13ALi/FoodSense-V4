Calorie App - Phase 2 Implementation Plan

 Overview

 Transform the local-only app into a full-featured, multi-user platform with:
 - Supabase backend (PostgreSQL + Auth + Storage)
 - Email + Social authentication (Google, Apple)
 - Comprehensive user profiles with health data
 - 3-tiered recommendation system (simple, personalized, AI-powered)
 - Meal templates/favorites
 - AI request tracking for cost monitoring
 - Migration from AsyncStorage to cloud sync

 Phase 2A: Database & Authentication (Week 1-2)

 1. Supabase Setup

 - Create Supabase project
 - Run database migrations (extend existing schema)
 - Configure authentication providers
 - Set up Row Level Security (RLS) policies
 - Configure Supabase Storage for future meal photos

 2. Enhanced Database Schema

 New tables to add:
 - user_profiles - extended health/fitness data
 - meal_templates - saved favorite meals
 - weight_logs - weight tracking history
 - recommendations_history - track recommendation quality
 - ai_request_logs - monitor API usage/costs

 Updates to existing tables:
 - Add goal_type (lose/maintain/gain) to user settings
 - Add activity_level, target_weight, weekly_goal
 - Add template_id reference to meals table

 3. Authentication Implementation

 - Install @supabase/supabase-js + @supabase/auth-helpers-react
 - Email/password signup + login screens
 - Google OAuth integration
 - Apple OAuth integration
 - Protected routes (require auth)
 - Session management
 - Password reset flow

 4. User Onboarding Flow

 New screens:
 - Welcome screen
 - Sign up / Sign in
 - Profile setup wizard (5 steps):
   a. Basic info (name, age, gender)
   b. Current stats (height, weight)
   c. Activity level selection
   d. Goal selection (lose/maintain/gain)
   e. Target weight + timeline

 Calculate TDEE automatically:
 - Use Mifflin-St Jeor equation
 - Apply activity multiplier
 - Set calorie goal based on weight goal

 Phase 2B: Profile & Settings Enhancement (Week 2-3)

 5. Profile Screen (NEW)

 - User avatar (Supabase Storage)
 - Display name, email
 - Current weight vs target weight
 - Progress chart (weight over time)
 - Stats: days tracked, meals logged, streak
 - Edit profile button

 6. Enhanced Settings Screen

 Add new sections:
 - Account: Email, password change, linked accounts
 - Profile: Edit health data (weight, height, activity)
 - Goals: Modify targets, weekly goal, calorie calculation method
 - Privacy: Data export, delete account

 Keep existing:
 - Nutrition goals (now auto-calculated but editable)
 - Preferences (reminders, water, dark mode)

 7. Weight Tracking

 - Add "Log Weight" button in profile/settings
 - Weight log modal with date picker
 - Weight history chart (line graph)
 - Auto-update calorie goal when weight changes
 - Show progress towards target weight

 Phase 2C: Meal Templates & Favorites (Week 3-4)

 8. Meal Templates System

 UI Changes:
 - "Favorites" tab in bottom navigation (4 tabs total)
 - Long-press meal in dashboard → "Save as template"
 - Template library screen with search
 - Quick-add from templates (one tap logging)

 Features:
 - Save any logged meal as template
 - Edit template nutrition values
 - Add custom tags/categories
 - Frequency tracking (most used)
 - Share templates (future)

 9. AI Request Tracking

 Purpose: Monitor costs, improve caching
 - Store every AI request in ai_request_logs table
 - Track: timestamp, provider, model, tokens, cost, success/error
 - Admin dashboard (your eyes only):
   - Daily/weekly/monthly costs
   - Cache hit rates
   - Most expensive queries
   - Error rate trends

 User-facing:
 - "Powered by AI" badge with cost savings info
 - "You've saved $X this month with caching"

 Phase 2D: Recommendations System (Week 4-5)

 10. Smart Recommendations Engine

 Tier 1: Simple Logic-Based
 - Show when macros are low/high
 - "You need 50g more protein today" → suggest chicken, eggs, protein shake
 - "800 calories remaining" → suggest dinner ideas

 Tier 2: Personalized History
 - "You often eat [meal] on [day of week]"
 - "Your favorite high-protein meals: ..."
 - "Quick-add: You logged this 5 times last month"
 - Learn patterns from user's meal history

 Tier 3: AI-Powered Suggestions
 - Generate meal ideas with AI based on:
   - Remaining macros
   - User preferences (from history)
   - Dietary restrictions (new field)
   - Time of day
   - Goal (weight loss → lower calorie density)
 - Example prompt: "Suggest a 500-calorie dinner with 40g protein, user prefers Asian food"

 UI for Recommendations:
 - New "Suggestions" section on dashboard (below input)
 - Swipeable cards with meal ideas
 - Tap to auto-fill input
 - "Not interested" to improve suggestions
 - Track recommendation acceptance rate

 Phase 2E: Data Migration & Sync (Week 5-6)

 11. AsyncStorage → Supabase Migration

 Strategy: Dual-write during transition
 - Keep AsyncStorage as local cache
 - Sync to Supabase on auth
 - Conflict resolution (server wins)
 - Export existing local data on first login
 - Import to Supabase account

 Offline Support:
 - Queue mutations when offline
 - Sync on reconnect
 - Optimistic UI updates
 - Sync status indicator

 12. Real-time Sync (optional)

 - Use Supabase Realtime for cross-device sync
 - Update UI when data changes on another device
 - Sync status: "Synced", "Syncing...", "Offline"

 Technical Architecture Updates

 New Services

 - supabase-client.ts - Supabase configuration
 - auth-service.ts - Authentication logic
 - profile-service.ts - User profile CRUD
 - template-service.ts - Meal templates CRUD
 - recommendation-service.ts - 3-tier recommendation engine
 - weight-tracking-service.ts - Weight logs CRUD
 - sync-service.ts - Data synchronization
 - analytics-service.ts - AI cost tracking

 Updated Services

 - storage-service.ts - Add Supabase sync
 - ai-service.ts - Add request logging

 New Components

 - AuthForm.tsx - Login/signup forms
 - OnboardingWizard.tsx - Multi-step profile setup
 - ProfileHeader.tsx - User info display
 - WeightChart.tsx - Line chart for weight history
 - TemplateCard.tsx - Meal template display
 - RecommendationCard.tsx - Swipeable suggestion cards
 - SyncStatusBadge.tsx - Cloud sync indicator
 - ProtectedRoute.tsx - Auth-required wrapper

 New Screens

 - app/auth/login.tsx
 - app/auth/signup.tsx
 - app/auth/onboarding.tsx
 - app/(tabs)/profile.tsx (NEW TAB)
 - app/(tabs)/favorites.tsx (NEW TAB)
 - app/modals/edit-profile.tsx
 - app/modals/log-weight.tsx
 - app/modals/save-template.tsx

 Updated Context

 - AppContext.tsx → Add user, profile, templates, recommendations
 - Or split into multiple contexts:
   - AuthContext.tsx
   - UserContext.tsx
   - MealsContext.tsx
   - RecommendationsContext.tsx

 Database Schema (Complete)

 Tables:
 1. users (Supabase Auth, extended with profiles)
 2. user_profiles - health data, goals, preferences
 3. meals - meal entries with AI analysis
 4. meal_templates - saved favorite meals
 5. daily_summaries - pre-aggregated stats
 6. weight_logs - weight tracking history
 7. ai_request_logs - API usage tracking
 8. recommendations_history - track suggestion quality
 9. user_preferences - dietary restrictions, allergies

 Key additions:
 - Foreign keys to auth.users
 - RLS policies for all tables
 - Indexes on user_id, date, created_at
 - Full-text search on meal templates
 - Triggers for auto-updating summaries

 UI/UX Enhancements

 Navigation Changes

 - 4-5 tabs: Track, Summary, Favorites, Profile, (Settings)
 - Or keep 3 tabs + Profile in header
 - Bottom sheet for quick actions

 Design Updates

 - User avatar in header
 - Sync status indicator
 - Loading states for API calls
 - Empty states for new users
 - Onboarding tooltips
 - Success/error toasts

 New User Flows

 1. First Launch: Signup → Onboarding → Dashboard
 2. Returning User: Auto-login → Sync → Dashboard
 3. Add Meal: Type → AI analyze → Save → Suggest next meal
 4. Use Template: Favorites → Tap template → Logged instantly
 5. Track Weight: Profile → Log weight → See progress chart

 Environment Variables (Updated)

 # Supabase
 SUPABASE_URL=https://xxx.supabase.co
 SUPABASE_ANON_KEY=xxx
 SUPABASE_SERVICE_ROLE_KEY=xxx (server only)

 # OAuth
 GOOGLE_CLIENT_ID=xxx
 APPLE_CLIENT_ID=xxx

 # AI (existing)
 OPENROUTER_API_KEY=xxx
 PERPLEXITY_API_KEY=xxx

 Testing Strategy

 - Test AsyncStorage → Supabase migration with dummy data
 - Test offline sync (airplane mode)
 - Test auth flows (signup, login, OAuth, password reset)
 - Test recommendations accuracy
 - Test AI cost tracking
 - Load testing (100+ meals per user)

 Success Metrics

 - User signup conversion rate
 - Onboarding completion rate
 - Daily active users (DAU)
 - Meal logging frequency
 - Template usage rate
 - Recommendation acceptance rate
 - AI cost per user per month
 - Cache hit rate (target: 80%+)
 - Sync conflicts (target: <1%)

 Implementation Order

 1. ✅ Supabase project + schema migration
 2. ✅ Authentication (email + social)
 3. ✅ Onboarding flow
 4. ✅ Profile screen + weight tracking
 5. ✅ Data migration tool
 6. ✅ Meal templates/favorites
 7. ✅ AI request tracking
 8. ✅ Recommendations (tier 1 & 2)
 9. ✅ Recommendations (tier 3 - AI)
 10. ✅ Testing + refinement

 Total Timeline: 5-6 weeks for complete Phase 2 implementation

 This plan maintains your current working functionality while adding enterprise-grade features. All new      
 features are additive - existing users won't be disrupted.
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌