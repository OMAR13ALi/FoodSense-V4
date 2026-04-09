# FoodSense Architecture Diagram

```mermaid
graph TD
    subgraph Client["Mobile Application (React Native + Expo)"]
        direction TB
        
        subgraph UI["UI Layer"]
            Screens["Screens (Dashboard, MealEntry, Profile)"]
            Components["Components (Charts, Modals)"]
            Hooks["Hooks (Theme, Haptic)"]
        end
        
        subgraph State["State Management"]
            AppContext["AppContext (Meals, Settings)"]
            AuthContext["AuthContext (User, Session)"]
        end
        
        subgraph Services["Service Layer"]
            AIService["AI Service"]
            AuthService["Auth Service"]
            DBService["Database Service"]
            StorageService["Storage Service"]
        end
        
        subgraph LocalCache["Local Caching Layer"]
            USDA["USDA Static Cache"]
            AsyncStorage["AsyncStorage (API Response Cache)"]
        end
        
        UI --> State
        State --> Services
        Services --> LocalCache
    end

    subgraph Backend["Supabase Backend"]
        direction TB
        Auth["Auth Service (GoTrue)"]
        
        subgraph DB["PostgreSQL Database"]
            Users["auth.users"]
            Profiles["user_profiles"]
            Meals["meals"]
            Favs["favorite_meals"]
            Summaries["daily_summaries"]
            Settings["user_settings"]
        end
        
        RLS["RLS Policies"]
    end

    subgraph AI["AI Services"]
        Perplexity["Perplexity Sonar Pro (Primary)"]
        OpenRouter["OpenRouter / DeepSeek (Fallback)"]
    end

    %% Client to Backend
    AuthService <--> Auth
    DBService <--> RLS
    RLS <--> DB
    
    %% Client to AI
    AIService -- "Analysis Request" --> Perplexity
    Perplexity -- "Success" --> AIService
    Perplexity -. "Fail" .-> OpenRouter
    OpenRouter -- "Fallback Response" --> AIService

    %% Internal Data Flows
    Users --> Profiles
    Users --> Meals
    
    %% Styling
    classDef app fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef ai fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    
    class Client,UI,State,Services,LocalCache app;
    class Backend,Auth,DB,RLS backend;
    class AI,Perplexity,OpenRouter ai;
```

## AI Nutrition Analysis Pipeline

```mermaid
flowchart TD
    Start([User Input: "grilled chicken..."]) --> StaticCache{Check Static Cache\n(USDA DB)}
    
    StaticCache -- Hit --> ReturnResult([Return Cached Nutrition])
    StaticCache -- Miss --> APICache{Check API Cache\n(AsyncStorage)}
    
    APICache -- Hit --> ReturnResult
    APICache -- Miss --> Queue[Request Queue\n(Rate Limiting)]
    
    Queue --> PrimaryAI{Call Primary AI\n(Perplexity Sonar)}
    
    PrimaryAI -- Success --> Process[Process Response\nParse & Validate]
    PrimaryAI -- Fail --> FallbackAI{Call Fallback AI\n(OpenRouter)}
    
    FallbackAI -- Success --> Process
    FallbackAI -- Fail --> Error([Return Error])
    
    Process --> CacheNew[Cache Result]
    CacheNew --> ReturnResult
```
