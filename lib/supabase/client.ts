import { createBrowserClient } from '@supabase/ssr';

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient(): ReturnType<typeof createBrowserClient> | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return null if Supabase is not configured
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseClient;
}
