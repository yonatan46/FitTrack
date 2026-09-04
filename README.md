# FitTrack Pro

A mobile-first fitness app built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## Getting started

1. Install Node.js 20 or newer.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase project values.
4. Start the app with `npm run dev`.

The current Phase 1 flow includes Supabase email authentication, first-run onboarding, profile persistence, starter plan generation, workout session/set logging, sign-out, and a dashboard shell with rest timer and progress views. Run `supabase/schema.sql` in the Supabase SQL editor before testing the app.

## Commands

- `npm run dev` starts the development server.
- `npm run lint` runs ESLint.
- `npm run build` creates a production build.
