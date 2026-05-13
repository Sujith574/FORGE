/**
 * GET  /api/logs           — Get all Decision Logs for the current user
 * POST /api/logs/generate  — Intentionally in a separate file
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  // Load ALL logs on page open (per spec — no lazy loading)
  const { data, error: dbError } = await supabaseAdmin
    .from('decision_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (dbError) {
    console.error('Failed to fetch decision logs:', dbError);
    return NextResponse.json({ error: 'Failed to fetch decision logs' }, { status: 500 });
  }

  return NextResponse.json({ logs: data }, { status: 200 });
}
