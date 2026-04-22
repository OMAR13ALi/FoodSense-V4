


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    created_at,
    updated_at,
    last_active
  ) VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_user_profile"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."daily_summaries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "total_calories" numeric DEFAULT 0 NOT NULL,
    "total_protein" numeric DEFAULT 0 NOT NULL,
    "total_carbs" numeric DEFAULT 0 NOT NULL,
    "total_fat" numeric DEFAULT 0 NOT NULL,
    "meal_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "daily_summaries_meal_count_check" CHECK (("meal_count" >= 0)),
    CONSTRAINT "daily_summaries_total_calories_check" CHECK (("total_calories" >= (0)::numeric)),
    CONSTRAINT "daily_summaries_total_carbs_check" CHECK (("total_carbs" >= (0)::numeric)),
    CONSTRAINT "daily_summaries_total_fat_check" CHECK (("total_fat" >= (0)::numeric)),
    CONSTRAINT "daily_summaries_total_protein_check" CHECK (("total_protein" >= (0)::numeric))
);


ALTER TABLE "public"."daily_summaries" OWNER TO "postgres";


COMMENT ON TABLE "public"."daily_summaries" IS 'Pre-aggregated daily nutrition statistics';



CREATE TABLE IF NOT EXISTS "public"."favorite_meals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "calories" numeric NOT NULL,
    "protein" numeric,
    "carbs" numeric,
    "fat" numeric,
    "emoji" "text",
    "notes" "text",
    "frequency_count" integer DEFAULT 0 NOT NULL,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "favorite_meals_calories_check" CHECK ((("calories" >= (0)::numeric) AND ("calories" <= (10000)::numeric))),
    CONSTRAINT "favorite_meals_carbs_check" CHECK ((("carbs" IS NULL) OR (("carbs" >= (0)::numeric) AND ("carbs" <= (2000)::numeric)))),
    CONSTRAINT "favorite_meals_fat_check" CHECK ((("fat" IS NULL) OR (("fat" >= (0)::numeric) AND ("fat" <= (500)::numeric)))),
    CONSTRAINT "favorite_meals_frequency_count_check" CHECK (("frequency_count" >= 0)),
    CONSTRAINT "favorite_meals_name_check" CHECK ((("length"("name") > 0) AND ("length"("name") <= 100))),
    CONSTRAINT "favorite_meals_protein_check" CHECK ((("protein" IS NULL) OR (("protein" >= (0)::numeric) AND ("protein" <= (1000)::numeric))))
);


ALTER TABLE "public"."favorite_meals" OWNER TO "postgres";


COMMENT ON TABLE "public"."favorite_meals" IS 'User-saved favorite meals for quick adding';



CREATE TABLE IF NOT EXISTS "public"."meals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "calories" numeric NOT NULL,
    "protein" numeric,
    "carbs" numeric,
    "fat" numeric,
    "timestamp" timestamp with time zone NOT NULL,
    "ai_explanation" "text",
    "confidence" numeric,
    "sources" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "meals_calories_check" CHECK (("calories" >= (0)::numeric)),
    CONSTRAINT "meals_carbs_check" CHECK ((("carbs" IS NULL) OR ("carbs" >= (0)::numeric))),
    CONSTRAINT "meals_confidence_check" CHECK ((("confidence" IS NULL) OR (("confidence" >= (0)::numeric) AND ("confidence" <= (1)::numeric)))),
    CONSTRAINT "meals_fat_check" CHECK ((("fat" IS NULL) OR ("fat" >= (0)::numeric))),
    CONSTRAINT "meals_protein_check" CHECK ((("protein" IS NULL) OR ("protein" >= (0)::numeric)))
);


ALTER TABLE "public"."meals" OWNER TO "postgres";


COMMENT ON TABLE "public"."meals" IS 'Individual meal entries with nutrition information';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "height_cm" integer,
    "weight_kg" numeric,
    "age" integer,
    "gender" "text",
    "dietary_preference" "text" DEFAULT 'none'::"text" NOT NULL,
    "allergies" "text"[],
    "daily_calorie_goal" integer DEFAULT 2000 NOT NULL,
    "activity_level" "text" DEFAULT 'moderate'::"text" NOT NULL,
    "target_protein" integer DEFAULT 150 NOT NULL,
    "target_carbs" integer DEFAULT 250 NOT NULL,
    "target_fat" integer DEFAULT 65 NOT NULL,
    "theme" "text" DEFAULT 'auto'::"text" NOT NULL,
    "meal_reminders" boolean DEFAULT false NOT NULL,
    "track_water" boolean DEFAULT false NOT NULL,
    "data_sharing_consent" boolean DEFAULT false NOT NULL,
    "analytics_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_active" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_profiles_activity_level_check" CHECK (("activity_level" = ANY (ARRAY['sedentary'::"text", 'light'::"text", 'moderate'::"text", 'active'::"text", 'very_active'::"text"]))),
    CONSTRAINT "user_profiles_age_check" CHECK ((("age" IS NULL) OR (("age" >= 13) AND ("age" <= 120)))),
    CONSTRAINT "user_profiles_daily_calorie_goal_check" CHECK ((("daily_calorie_goal" >= 1000) AND ("daily_calorie_goal" <= 10000))),
    CONSTRAINT "user_profiles_dietary_preference_check" CHECK (("dietary_preference" = ANY (ARRAY['none'::"text", 'vegetarian'::"text", 'vegan'::"text", 'pescatarian'::"text", 'keto'::"text", 'paleo'::"text"]))),
    CONSTRAINT "user_profiles_gender_check" CHECK ((("gender" IS NULL) OR ("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text", 'prefer_not_to_say'::"text"])))),
    CONSTRAINT "user_profiles_height_cm_check" CHECK ((("height_cm" IS NULL) OR (("height_cm" >= 100) AND ("height_cm" <= 300)))),
    CONSTRAINT "user_profiles_target_carbs_check" CHECK ((("target_carbs" >= 0) AND ("target_carbs" <= 2000))),
    CONSTRAINT "user_profiles_target_fat_check" CHECK ((("target_fat" >= 0) AND ("target_fat" <= 500))),
    CONSTRAINT "user_profiles_target_protein_check" CHECK ((("target_protein" >= 0) AND ("target_protein" <= 1000))),
    CONSTRAINT "user_profiles_theme_check" CHECK (("theme" = ANY (ARRAY['light'::"text", 'dark'::"text", 'auto'::"text"]))),
    CONSTRAINT "user_profiles_weight_kg_check" CHECK ((("weight_kg" IS NULL) OR (("weight_kg" >= (20)::numeric) AND ("weight_kg" <= (500)::numeric))))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_profiles" IS 'Extended user profile data linked to auth.users';



CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "user_id" "uuid" NOT NULL,
    "daily_calorie_goal" integer DEFAULT 2000 NOT NULL,
    "target_protein" integer DEFAULT 150 NOT NULL,
    "target_carbs" integer DEFAULT 250 NOT NULL,
    "target_fat" integer DEFAULT 65 NOT NULL,
    "meal_reminders" boolean DEFAULT false NOT NULL,
    "track_water" boolean DEFAULT false NOT NULL,
    "dark_mode" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_settings_daily_calorie_goal_check" CHECK ((("daily_calorie_goal" >= 1000) AND ("daily_calorie_goal" <= 10000))),
    CONSTRAINT "user_settings_target_carbs_check" CHECK ((("target_carbs" >= 0) AND ("target_carbs" <= 2000))),
    CONSTRAINT "user_settings_target_fat_check" CHECK ((("target_fat" >= 0) AND ("target_fat" <= 500))),
    CONSTRAINT "user_settings_target_protein_check" CHECK ((("target_protein" >= 0) AND ("target_protein" <= 1000)))
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_settings" IS 'User-specific app settings and preferences';



ALTER TABLE ONLY "public"."daily_summaries"
    ADD CONSTRAINT "daily_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorite_meals"
    ADD CONSTRAINT "favorite_meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_summaries"
    ADD CONSTRAINT "unique_user_date" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_daily_summaries_user_date" ON "public"."daily_summaries" USING "btree" ("user_id", "date" DESC);



CREATE INDEX "idx_favorite_meals_frequency" ON "public"."favorite_meals" USING "btree" ("user_id", "frequency_count" DESC);



CREATE INDEX "idx_favorite_meals_user" ON "public"."favorite_meals" USING "btree" ("user_id");



CREATE INDEX "idx_meals_user_timestamp" ON "public"."meals" USING "btree" ("user_id", "timestamp" DESC);



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_last_active" ON "public"."user_profiles" USING "btree" ("last_active");



ALTER TABLE ONLY "public"."daily_summaries"
    ADD CONSTRAINT "daily_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorite_meals"
    ADD CONSTRAINT "favorite_meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow profile creation on signup" ON "public"."user_profiles" FOR INSERT WITH CHECK ((("auth"."uid"() = "id") OR ("auth"."role"() = 'service_role'::"text")));



CREATE POLICY "Users can delete own favorites" ON "public"."favorite_meals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own meals" ON "public"."meals" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own profile" ON "public"."user_profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete own settings" ON "public"."user_settings" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own summaries" ON "public"."daily_summaries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own favorites" ON "public"."favorite_meals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own meals" ON "public"."meals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own settings" ON "public"."user_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own summaries" ON "public"."daily_summaries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own favorites" ON "public"."favorite_meals" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own meals" ON "public"."meals" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own settings" ON "public"."user_settings" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own summaries" ON "public"."daily_summaries" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own favorites" ON "public"."favorite_meals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own meals" ON "public"."meals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own settings" ON "public"."user_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own summaries" ON "public"."daily_summaries" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."daily_summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."favorite_meals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "service_role";


















GRANT ALL ON TABLE "public"."daily_summaries" TO "anon";
GRANT ALL ON TABLE "public"."daily_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."favorite_meals" TO "anon";
GRANT ALL ON TABLE "public"."favorite_meals" TO "authenticated";
GRANT ALL ON TABLE "public"."favorite_meals" TO "service_role";



GRANT ALL ON TABLE "public"."meals" TO "anon";
GRANT ALL ON TABLE "public"."meals" TO "authenticated";
GRANT ALL ON TABLE "public"."meals" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();


