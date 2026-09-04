# FitTrack Pro

A mobile-first fitness app built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## Getting started

1. Install Node.js 20 or newer.
2. Install dependencies with `npm install`.
3. In the [Supabase](https://supabase.com) SQL editor, run `supabase/schema.sql` (creates tables, seeds the exercise library, and sets Row Level Security).
4. Copy `.env.example` to `.env.local` and add your Supabase project URL and publishable/anon key.
5. Start the app with `npm run dev`.

On Vercel, add the same two environment variables in **Project → Settings → Environment Variables**.

## What works

- **Auth** – Supabase email sign-up / sign-in, route protection via middleware, sign-out.
- **Onboarding** – captures goal, weight, training days, and equipment, then generates a real
  workout plan from the exercise library. The default is a body-part split —
  **chest & triceps / back & biceps / legs & shoulders**, repeated for days 4–6 — adapted for
  `full gym`, `home basics`, or `bodyweight`.
- **Dashboard** – shows today's session from your actual plan, anchored to the calendar
  (Monday = Day 1; weekdays past your training-day count, incl. Sunday, are rest days),
  last-used weights from your history, a live rest timer, weekly-consistency strip, momentum
  stats, and a body-weight sparkline. Tap any exercise for its photo demo + steps; tap a
  **missed past day** in the week strip to log the session you had planned.
- **My workouts** – full plan with day tabs, per-set weight/reps logging, running volume total,
  a per-exercise "how to" popover (photo demo + steps), session history, one-click "regenerate plan".
- **Progress** – log body weight (one entry per day, re-logging updates in place) and see an
  area chart of weight over time.
- **Settings** – edit preferences; changing training days or equipment rebuilds the plan.
- **Exercise library** – ~68 exercises, searchable and filterable by muscle. Each has a
  two-frame photo demo (start → end, alternating) and numbered instructions, shown in-app.
  Demo photos are vendored into `public/exercises/` (source: the public-domain
  [free-exercise-db](https://github.com/yuhonas/free-exercise-db)).

## Updating an existing database

If you already ran an earlier `schema.sql`, re-run the current one — it is idempotent. It adds the
new `exercises` columns and reseeds the library. Existing users should hit **Regenerate plan**
(Workouts or Settings) once, since exercise names changed.

## Commands

- `npm run dev` – development server
- `npm run lint` – ESLint
- `npm run build` – production build
