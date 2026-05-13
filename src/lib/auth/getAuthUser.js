/**
 * Auth helper — verifies the JWT from the Authorization header.
 * Use this at the top of every API route to get the current user.
 *
 * Returns { user, error }
 * - user: Supabase auth user object (has user.id)
 * - error: NextResponse with 401 if token missing/invalid
 *
 * Usage:
 *   const { user, error } = await getAuthUser(request);
 *   if (error) return error;
 */
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function getAuthUser(request) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized — missing token' }, { status: 401 }),
    };
  }

  const token = authHeader.replace('Bearer ', '');

  // Create a per-request client with the user's JWT so Supabase validates it
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const { data: { user }, error } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized — invalid token' }, { status: 401 }),
    };
  }

  return { user, error: null };
}
