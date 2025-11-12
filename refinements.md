 Create Comprehensive Profile Page + Feature Suggestions

 Part 1: Transform Settings into Profile Screen

 Create/Update:
 1. services/profile-service.ts (NEW)
   - getUserProfile() - Fetch from user_profiles table
   - updateUserProfile() - Update physical stats, dietary prefs
   - updateAppPreferences() - Update theme, reminders, etc.
 2. app/(tabs)/settings.tsx → app/(tabs)/profile.tsx
   - Rename file for clarity
   - Add profile header with email and member since date
   - Physical Stats section (height, weight, age, gender) - editable
   - Dietary Preferences section (preferences, allergies) - editable
   - Nutrition Goals section (already exists) - keep current functionality
   - App Preferences section (dark mode, reminders, water tracking)
   - Account section (sign out button, change password, delete account)
   - Data Management section (export data, clear data)
 3. Update navigation references
   - Update CircularSettingsButton to navigate to /profile

 Part 2: Feature Suggestions for Your App

 🔥 High Priority (Quick Wins):
 1. Weekly Progress View - Show 7-day calorie/macro trends with charts
 2. Meal Templates - Save favorite meals for quick-add (use favorite_meals table)   
 3. Photo Upload - Take photos of meals for visual diary
 4. Daily Streak Tracker - Gamification: track consecutive days logged
 5. Quick Stats Widget - Today's summary at top of Track screen

 📊 Medium Priority (Nice to Have):
 6. Custom Meal Categories - Breakfast, lunch, dinner, snacks
 7. Water Intake Tracking - Simple +/- counter for glasses of water
 8. Weight Progress Tracker - Log weight over time, show chart
 9. Meal Notes - Add notes/context to meals
 10. Search History - Quick access to recently analyzed foods

 🚀 Advanced Features (Future):
 11. Barcode Scanner - Scan product barcodes for instant nutrition
 12. Recipe Builder - Build custom recipes with ingredients
 13. Share Meals - Share meals/recipes with friends
 14. Notifications - Meal reminders, goal milestones
 15. Apple Health Integration - Sync with HealthKit

 📈 Analytics Features:
 16. Macro Pie Charts - Visual breakdown of protein/carbs/fat
 17. Goal Achievement Rate - % of days meeting calorie goals
 18. Nutrition Score - Daily score based on balanced macros
 19. Monthly Reports - Summary of month's nutrition habits

 Implementation Approach

 Phase 1 (This Session): Profile page with sign-out
 Phase 2 (Suggested Next): Favorite meals + quick-add
 Phase 3: Weekly progress view with charts
 Phase 4: Photo upload for meals

 Result

 - Fully functional profile management
 - Clear roadmap for app growth
 - User can update all profile info and sign out
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌