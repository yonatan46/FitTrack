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
  multi-day workout plan from the exercise library (`full gym`, `home basics`, or `bodyweight`).
- **Dashboard** – shows today's session from your actual plan (rotating through the plan's days),
  last-used weights pulled from your history, a live rest timer, a real weekly-consistency strip,
  momentum stats, and a body-weight sparkline.
- **My workouts** – full plan with day tabs, per-set weight/reps logging, running volume total,
  session history, and a one-click "regenerate plan".
- **Progress** – log body weight (one entry per day, re-logging updates in place) and see an
  area chart of weight over time.
- **Settings** – edit preferences; changing training days or equipment rebuilds the plan.
- **Exercise library** – searchable, filterable, with form-demo links.

## Commands

- `npm run dev` – development server
- `npm run lint` – ESLint
- `npm run build` – production build
