/**
 * GET /api/users/me
 * Returns the current logged-in user's name and company.
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
    .from('users')
    .select('id, name, company_name, email, created_at')
    .eq('id', user.id)
    .single();

  if (dbError || !data) {
    // User exists in auth but not in our users table — needs onboarding
    return NextResponse.json({ needsOnboarding: true }, { status: 200 });
  }

  return NextResponse.json({ user: data }, { status: 200 });
}
