/**
 * Supabase connection details, read from the environment.
 *
 * Supports both the newer "publishable key" name and the classic "anon key"
 * name so the same code works whichever one you set on Vercel / in .env.local.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const SUPABASE_CONFIGURED = SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;
