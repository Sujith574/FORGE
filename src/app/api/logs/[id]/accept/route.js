/**
 * PATCH /api/logs/[id]/accept
 * Founder accepts a Decision Log.
 * Sets status to 'accepted'. Appends to history.
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(request, { params }) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  const { id } = params;

  // Fetch existing log to verify ownership and get history
  const { data: log } = await supabaseAdmin
    .from('decision_logs')
    .select('id, status, version, history, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!log) {
    return NextResponse.json({ error: 'Decision Log not found' }, { status: 404 });
  }

  if (log.status === 'accepted') {
    return NextResponse.json({ error: 'Log is already accepted' }, { status: 400 });
  }

  const newHistoryEntry = {
    action: 'accepted',
    timestamp: new Date().toISOString(),
    version: log.version,
  };

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('decision_logs')
    .update({
      status: 'accepted',
      history: [...(log.history || []), newHistoryEntry],
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to accept log:', updateError);
    return NextResponse.json({ error: 'Failed to accept Decision Log' }, { status: 500 });
  }

  return NextResponse.json({ log: updated }, { status: 200 });
}
