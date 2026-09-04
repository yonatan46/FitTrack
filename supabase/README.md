# Supabase setup

Run `schema.sql` in the Supabase SQL editor. It is idempotent (safe to re-run) and:

- creates all tables (`user_preferences`, `exercises`, `workout_plans`, `plan_exercises`,
  `body_logs`, `workout_sessions`, `session_sets`);
- seeds the exercise library — ~68 exercises with instructions, muscles, and local demo-image
  paths (`/exercises/<slug>/0.jpg` and `1.jpg`, served from the app's `public/` folder);
- adds a unique index so there is one body-weight entry per user per day;
- makes `plan_exercises.exercise_id` cascade on delete, then removes any exercises that are
  not in the current curated set;
- enables Row Level Security and the per-user access policies.

`migrations/002_seed_exercises.sql` is a standalone version of just the exercise library seed.

Then add the project URL and publishable/anon key to `.env.local` (see `.env.example`).

## Demo images

Exercise photos live in `FitTrack/public/exercises/` and ship with the repo. They come from the
public-domain [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense).
