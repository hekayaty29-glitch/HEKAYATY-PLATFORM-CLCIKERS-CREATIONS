import { createClient } from '@supabase/supabase-js';

// Project URL and anon key must be supplied via environment variables.
// Vite automatically exposes env vars prefixed with VITE_ at build/runtime.
// Make sure to add these two variables (without quotes) to `client/.env`:
//   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
//   VITE_SUPABASE_ANON=YOUR_PUBLIC_ANON_KEY
// Do NOT commit your service role key.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON || 'placeholder-key';

// Debug: Log environment variables to console
console.log('Environment check:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON: import.meta.env.VITE_SUPABASE_ANON ? 'SET' : 'NOT SET',
  supabaseUrl,
  supabaseAnonKey: supabaseAnonKey ? 'SET' : 'NOT SET'
});

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON env variables. Using placeholder values - app will not function properly until real values are set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    // cookie options can be tweaked here if needed
  },
});

export type SupabaseClient = typeof supabase;
