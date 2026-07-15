import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Falls back to placeholder values instead of throwing when the env vars
// aren't set (e.g. a build environment that hasn't configured them yet) —
// createClient() throws synchronously otherwise, which crashes the build
// during static prerendering of any page that imports this module, even
// pages like /submit that only ever call Supabase from a client event
// handler. With the fallback, the module loads fine and any real request
// just fails at call time with a normal, catchable network error.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

// Runs once wherever this module is evaluated — during Next's server-side
// render (visible in Vercel's function/build logs) and again in the
// browser when the client bundle loads. Only logs presence/shape, never
// the actual key, so it's safe to leave in.
console.log(
  '[lib/supabase] url:', supabaseUrl ? supabaseUrl : '(missing — using placeholder)',
  '| anon key present:', Boolean(supabaseAnonKey),
  '| using placeholder fallback:', !supabaseUrl || !supabaseAnonKey
);
