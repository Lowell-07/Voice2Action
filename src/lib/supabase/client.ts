import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseUrl = configuredUrl?.startsWith('http://') || configuredUrl?.startsWith('https://')
  ? configuredUrl
  : 'https://lsuosxjvkxwkccnwcgvu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const globalForSupabase = globalThis as typeof globalThis & {
  supabaseInstance?: SupabaseClient;
};

export function getSupabaseClient(): SupabaseClient {
  if (!globalForSupabase.supabaseInstance) {
    globalForSupabase.supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return globalForSupabase.supabaseInstance;
}

export const supabase = getSupabaseClient();
