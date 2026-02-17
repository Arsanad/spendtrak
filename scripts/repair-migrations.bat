@echo off
echo Marking existing migrations as applied...

call npx supabase migration repair --status applied 001_schema.sql
call npx supabase migration repair --status applied 002_phase1_features.sql
call npx supabase migration repair --status applied 003_phase2_features.sql
call npx supabase migration repair --status applied 004_phase3_features.sql
call npx supabase migration repair --status applied 005_phase4_features.sql
call npx supabase migration repair --status applied 006_behavioral_layer.sql
call npx supabase migration repair --status applied 007_behavioral_layer_v2.sql
call npx supabase migration repair --status applied 009_ai_rate_limiting.sql
call npx supabase migration repair --status applied 010_subscription_system.sql
call npx supabase migration repair --status applied 011_fix_users_insert_policy.sql

echo.
echo Now pushing remaining migrations...
call npx supabase db push

echo.
echo Done!
pause
