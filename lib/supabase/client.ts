import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Return a null-like object if Supabase is not configured
  // This allows the app to work without Supabase in demo mode
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client that doesn't break the app
    return {
      channel: () => ({
        on: () => ({ subscribe: () => {} }),
        subscribe: () => {},
        send: () => {},
        unsubscribe: () => {},
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' } }),
        signInWithOAuth: async () => ({ data: { provider: null, url: null }, error: { message: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' } }),
        signUp: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local' } }),
      },
      from: () => ({
        select: () => ({ order: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: async () => ({ error: null }) }),
      }),
    } as any
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      // Secure cookies in production; not in dev, so localhost still works.
      cookieOptions: { secure: process.env.NODE_ENV === 'production' },
    },
  )
}
