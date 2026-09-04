# Supabase setup

Run `schema.sql` in the Supabase SQL editor. It is idempotent (safe to re-run) and:

- creates all Phase 1 tables (`user_preferences`, `exercises`, `workout_plans`, `plan_exercises`,
  `body_logs`, `workout_sessions`, `session_sets`);
- seeds the built-in exercise library — **required** for plan generation to produce any exercises;
- adds a unique index so there is one body-weight entry per user per day;
- enables Row Level Security and the per-user access policies.

`migrations/002_seed_exercises.sql` contains just the exercise seed if you only need to refresh that.

Then add the project URL and publishable/anon key to `.env.local` (see `.env.example`).
