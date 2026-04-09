# FoodSense - System Architecture

## 1. High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FOODSENSE ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌──────────────┐     ┌─────────────────────────┐
│   Mobile    │     │   Supabase   │     │      AI Services        │
│    App      │◄───►│   Backend    │     │                         │
│             │     │              │     │  ┌─────────────────┐    │
│ React Native│     │ ┌──────────┐ │     │  │ Perplexity      │    │
│ + Expo      │     │ │PostgreSQL│ │     │  │ Sonar Pro       │    │
│             │     │ │ Database │ │     │  │ (Primary)       │    │
│             │     │ └──────────┘ │     │  └────────┬────────┘    │
│             │     │              │     │           │             │
│             │     │ ┌──────────┐ │     │           ▼             │
│             │─────┼─┤   Auth   │ │     │  ┌─────────────────┐    │
│             │     │ │ Service  │ │     │  │ OpenRouter      │    │
│             │     │ └──────────┘ │     │  │ (DeepSeek)      │    │
│             │     │              │     │  │ (Fallback)      │    │
│             │     │ ┌──────────┐ │     │  └─────────────────┘    │
│             │     │ │   RLS    │ │     │                         │
│             │     │ │ Policies │ │     └─────────────────────────┘
└──────┬──────┘     │ └──────────┘ │
       │            └──────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Local Caching Layer         │
│                                     │
│  ┌───────────┐  ┌────────────────┐  │
│  │  USDA     │  │ API Response   │  │
│  │  Static   │  │ Cache          │  │
│  │  Cache    │  │ (AsyncStorage) │  │
│  └───────────┘  └────────────────┘  │
└─────────────────────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Frontend Layer

```
┌─────────────────────────────────────────────────┐
│              MOBILE APPLICATION                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐  │
│  │   Screens   │  │ Components  │  │  Hooks  │  │
│  │             │  │             │  │         │  │
│  │ • Dashboard │  │ • MealEntry │  │ • Theme │  │
│  │ • Summary   │  │ • Progress  │  │ • Color │  │
│  │ • Progress  │  │ • Charts    │  │ • Haptic│  │
│  │ • Profile   │  │ • Modals    │  │         │  │
│  │ • Settings  │  │ • Auth UI   │  │         │  │
│  │ • Auth      │  │             │  │         │  │
│  │ • Onboard   │  │             │  │         │  │
│  └─────────────┘  └─────────────┘  └─────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │            State Management              │   │
│  │                                          │   │
│  │  AppContext          AuthContext         │   │
│  │  • meals             • user              │   │
│  │  • settings          • session           │   │
│  │  • favorites         • signIn/Out        │   │
│  │  • totals                                │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │              Services Layer              │   │
│  │                                          │   │
│  │  • ai-service        • auth-service      │   │
│  │  • database-service  • profile-service   │   │
│  │  • favorites-service • storage-service   │   │
│  │  • nutrition-cache   • api-response-cache│   │
│  │  • request-queue     • device-id-service │   │
│  └──────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React Native 0.81.5 | Cross-platform mobile |
| Platform | Expo 54.0.22 | Build & deployment |
| Navigation | Expo Router 6.0.14 | File-based routing |
| Language | TypeScript 5.9.2 | Type safety |
| State | Context API + useReducer | Global state |
| UI | React Native Reanimated | Animations |
| Charts | React Native Gifted Charts | Data visualization |
| HTTP | Axios 1.13.2 | API requests |
| Storage | AsyncStorage | Local persistence |

---

## 3. Backend Architecture (Supabase)

### 3.1 Database Schema

```
┌─────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐       ┌─────────────────────────┐  │
│  │   auth.users    │       │     user_profiles       │  │
│  │   (Managed)     │──────►│                         │  │
│  │                 │       │ • id (FK → auth.users)  │  │
│  │ • id            │       │ • height, weight, age   │  │
│  │ • email         │       │ • gender, activity_level│  │
│  │ • password_hash │       │ • dietary_preferences   │  │
│  └─────────────────┘       │ • allergies             │  │
│                            │ • daily_calorie_goal    │  │
│                            │ • macro_targets         │  │
│                            │ • theme, notifications  │  │
│                            │ • privacy_consent       │  │
│                            └─────────────────────────┘  │
│                                                         │
│  ┌─────────────────┐       ┌─────────────────────────┐  │
│  │     meals       │       │    favorite_meals       │  │
│  │                 │       │                         │  │
│  │ • id            │       │ • id                    │  │
│  │ • user_id (FK)  │       │ • user_id (FK)          │  │
│  │ • description   │       │ • description           │  │
│  │ • calories      │       │ • calories, macros      │  │
│  │ • protein       │       │ • emoji                 │  │
│  │ • carbs, fat    │       │ • use_count             │  │
│  │ • ai_explanation│       │ • last_used             │  │
│  │ • confidence    │       └─────────────────────────┘  │
│  │ • sources       │                                    │
│  │ • created_at    │       ┌─────────────────────────┐  │
│  └─────────────────┘       │   daily_summaries       │  │
│                            │                         │  │
│  ┌─────────────────┐       │ • user_id, date         │  │
│  │  user_settings  │       │ • total_calories        │  │
│  │                 │       │ • total_protein         │  │
│  │ • user_id (FK)  │       │ • total_carbs, fat      │  │
│  │ • daily_goal    │       │ • meal_count            │  │
│  │ • macro_targets │       └─────────────────────────┘  │
│  │ • notifications │                                    │
│  └─────────────────┘                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Security Architecture

```
┌─────────────────────────────────────────────┐
│         ROW LEVEL SECURITY (RLS)            │
├─────────────────────────────────────────────┤
│                                             │
│  Policy: Users can only access their data   │
│                                             │
│  SELECT: WHERE user_id = auth.uid()         │
│  INSERT: WHERE user_id = auth.uid()         │
│  UPDATE: WHERE user_id = auth.uid()         │
│  DELETE: WHERE user_id = auth.uid()         │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │     Additional Security Measures      │  │
│  │                                       │  │
│  │  • Encrypted connections (SSL/TLS)    │  │
│  │  • Expo Secure Store for tokens       │  │
│  │  • Auto-expiring sessions             │  │
│  │  • Privacy consent tracking           │  │
│  │  • No PII in logs                     │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 4. AI Service Architecture

### 4.1 Nutrition Analysis Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI NUTRITION ANALYSIS FLOW                    │
└─────────────────────────────────────────────────────────────────┘

User Input: "grilled chicken with rice and broccoli"
                           │
                           ▼
              ┌─────────────────────────┐
              │   1. STATIC CACHE       │
              │   (USDA Nutrition DB)   │
              │                         │
              │   Check for exact match │
              └────────────┬────────────┘
                           │
                    HIT?   │   MISS
                   ┌───────┴───────┐
                   ▼               ▼
            Return cached    ┌─────────────────┐
            nutrition        │  2. API CACHE   │
                            │  (AsyncStorage)  │
                            │                  │
                            │  Check recent    │
                            │  API responses   │
                            └────────┬─────────┘
                                     │
                              HIT?   │   MISS
                             ┌───────┴───────┐
                             ▼               ▼
                      Return cached    ┌─────────────────┐
                      response         │  3. REQUEST     │
                                      │     QUEUE       │
                                      │                 │
                                      │  Rate limiting  │
                                      │  (1 at a time)  │
                                      └────────┬────────┘
                                               │
                                               ▼
                              ┌─────────────────────────────┐
                              │   4. AI API REQUEST         │
                              │                             │
                              │  ┌─────────────────────┐    │
                              │  │  Perplexity Sonar   │    │
                              │  │  (Primary)          │    │
                              │  └──────────┬──────────┘    │
                              │             │               │
                              │      FAIL?  │  SUCCESS      │
                              │     ┌───────┴───────┐       │
                              │     ▼               ▼       │
                              │  ┌──────────┐   Return      │
                              │  │OpenRouter│   Result      │
                              │  │(Fallback)│               │
                              │  └──────────┘               │
                              └─────────────────────────────┘
                                               │
                                               ▼
                              ┌─────────────────────────────┐
                              │   5. RESPONSE PROCESSING    │
                              │                             │
                              │  • Parse JSON response      │
                              │  • Extract nutrition data   │
                              │  • Validate values          │
                              │  • Cache for future use     │
                              └─────────────────────────────┘
                                               │
                                               ▼
                              ┌─────────────────────────────┐
                              │        FINAL OUTPUT         │
                              │                             │
                              │  {                          │
                              │    calories: 450,           │
                              │    protein: 35,             │
                              │    carbs: 40,               │
                              │    fat: 12,                 │
                              │    confidence: 0.85,        │
                              │    sources: ["USDA..."],    │
                              │    explanation: "..."       │
                              │  }                          │
                              └─────────────────────────────┘
```

### 4.2 AI Provider Configuration

```
┌─────────────────────────────────────────────┐
│           AI PROVIDER SETUP                  │
├─────────────────────────────────────────────┤
│                                             │
│  PRIMARY: Perplexity Sonar Pro              │
│  ─────────────────────────────              │
│  • Endpoint: api.perplexity.ai              │
│  • Model: sonar-pro                         │
│  • Use case: Nutrition analysis             │
│  • Features: Source citations               │
│                                             │
│  FALLBACK: OpenRouter                       │
│  ─────────────────────────────              │
│  • Endpoint: openrouter.ai/api              │
│  • Model: deepseek/deepseek-chat            │
│  • Use case: Backup when primary fails      │
│                                             │
│  SYSTEM PROMPT:                             │
│  ─────────────────────────────              │
│  "Analyze the nutritional content...        │
│   Return ONLY valid JSON with:              │
│   calories, protein, carbs, fat,            │
│   confidence, sources, explanation"         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 5. Data Flow Architecture

### 5.1 Authentication Flow

```
┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│  User   │───►│  App    │───►│ Supabase │───►│ Database│
│         │    │         │    │   Auth   │    │         │
└─────────┘    └─────────┘    └──────────┘    └─────────┘
                   │                              │
                   │         Session Token        │
                   │◄─────────────────────────────┤
                   │                              │
                   │    Store in Secure Store     │
                   ▼                              │
            ┌─────────────┐                       │
            │   Secure    │                       │
            │   Storage   │                       │
            └─────────────┘                       │
                   │                              │
                   │    Load User Profile         │
                   │─────────────────────────────►│
                   │                              │
                   │◄─────────────────────────────┤
                   │    Profile Data              │
                   ▼
            ┌─────────────┐
            │  App State  │
            │  (Context)  │
            └─────────────┘
```

### 5.2 Meal Logging Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Input   │──►│  Debounce│──►│    AI    │──►│  State   │──►│  Sync    │
│  Meal    │   │  (1.5s)  │   │ Analysis │   │  Update  │   │  to DB   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │   Return    │
                            │  Nutrition  │
                            │   Data      │
                            └─────────────┘
```

---

## 6. Third-Party Services

| Service | Role | Data Exchanged |
|---------|------|----------------|
| **Supabase** | Backend-as-a-Service | User data, meals, settings, auth |
| **Perplexity API** | AI nutrition analysis | Meal descriptions → nutrition JSON |
| **OpenRouter** | Fallback AI provider | Meal descriptions → nutrition JSON |
| **Expo** | Build & OTA updates | App bundles, configurations |

---

## 7. Scalability Design

```
┌─────────────────────────────────────────────────────────┐
│                 SCALABILITY ARCHITECTURE                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Horizontal Scaling                  │    │
│  │                                                  │    │
│  │  • Supabase auto-scales database connections    │    │
│  │  • Serverless AI APIs (no server management)   │    │
│  │  • CDN for static assets via Expo              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Performance Optimizations           │    │
│  │                                                  │    │
│  │  • 3-tier caching reduces API calls by ~60%    │    │
│  │  • Request queue prevents rate limiting        │    │
│  │  • Debounced inputs reduce server load         │    │
│  │  • Daily summaries for efficient queries       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Future Scaling Options              │    │
│  │                                                  │    │
│  │  • Supabase Pro for higher limits              │    │
│  │  • Edge functions for compute-heavy tasks      │    │
│  │  • Redis cache for shared caching              │    │
│  │  • CDN for global distribution                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Privacy & Compliance

### 8.1 Data Protection Measures

| Measure | Implementation |
|---------|----------------|
| **Encryption at Rest** | Supabase PostgreSQL encryption |
| **Encryption in Transit** | TLS/SSL for all connections |
| **Access Control** | Row Level Security (RLS) |
| **Token Security** | Expo Secure Store |
| **Consent Tracking** | `privacy_consent` field in profiles |
| **Data Minimization** | Only collect necessary health data |

### 8.2 GDPR Alignment

- User consent collected during onboarding
- Data access limited to authenticated user only
- No data sharing with third parties (except AI analysis)
- AI requests contain only meal text (no PII)
- Users can delete account and all associated data

---

## 9. Deployment Architecture

```
┌─────────────────────────────────────────────┐
│           DEPLOYMENT PIPELINE               │
├─────────────────────────────────────────────┤
│                                             │
│  Development                                │
│  ───────────                                │
│  • Local Expo dev server                    │
│  • Supabase local or cloud dev project      │
│                                             │
│  Preview                                    │
│  ───────                                    │
│  • EAS Build preview profile                │
│  • Internal testing distribution            │
│                                             │
│  Production                                 │
│  ──────────                                 │
│  • EAS Build production profile             │
│  • App Store / Google Play submission       │
│  • Supabase production project              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 10. Environment Configuration

```
┌─────────────────────────────────────────────┐
│         ENVIRONMENT VARIABLES               │
├─────────────────────────────────────────────┤
│                                             │
│  EXPO_PUBLIC_SUPABASE_URL                   │
│  EXPO_PUBLIC_SUPABASE_ANON_KEY              │
│  PERPLEXITY_API_KEY                         │
│  OPENROUTER_API_KEY                         │
│                                             │
│  Managed via:                               │
│  • .env file (local development)            │
│  • EAS Secrets (production builds)          │
│  • app.config.js (runtime access)           │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Summary

FoodSense employs a modern, cloud-native architecture with:

- **React Native + Expo** for cross-platform mobile development
- **Supabase** for scalable, secure backend services
- **Multi-provider AI** with intelligent fallback for reliable nutrition analysis
- **3-tier caching** for optimized performance and reduced API costs
- **Row Level Security** ensuring complete data isolation between users
- **Privacy-first design** with consent tracking and minimal data collection

This architecture is designed for scalability, security, and real-world deployment readiness.
