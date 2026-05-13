/**
 * Supabase Admin Client (SERVER SIDE ONLY)
 * Uses the SERVICE_ROLE key — bypasses RLS.
 * ONLY import this in /src/app/api/ route files.
 * NEVER import in React components or client-side code.
 *
 * The client is created lazily (on first use) so the build
 * doesn't fail when env vars are not present at build time.
 */
import { createClient } from '@supabase/supabase-js';

let _adminClient = null;

function getAdminClient() {
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase service key. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local'
    );
  }

  _adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

// Proxy object — behaves exactly like a Supabase client
// but the real client is only created on first access
export const supabaseAdmin = new Proxy(
  {},
  {
    get(_, prop) {
      return getAdminClient()[prop];
    },
  }
);
