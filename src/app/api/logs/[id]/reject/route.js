/**
 * PATCH /api/logs/[id]/reject
 * Founder rejects a Decision Log with a reason.
 * Triggers Situation 3: Claude decides to revise or push back.
 *
 * Body: { rejection_reason: string }
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { handleRejection } from '@/lib/claude/claudeService';

export async function PATCH(request, { params }) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  const { id } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { rejection_reason } = body;

  if (!rejection_reason || !rejection_reason.trim()) {
    return NextResponse.json({ error: 'rejection_reason is required' }, { status: 400 });
  }

  // Fetch the log
  const { data: log } = await supabaseAdmin
    .from('decision_logs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!log) {
    return NextResponse.json({ error: 'Decision Log not found' }, { status: 404 });
  }

  // Ask Claude: revise or push back? (Situation 3)
  let aiResponse;
  try {
    aiResponse = await handleRejection({
      employeeId: log.employee_id,
      originalLog: log,
      rejectionReason: rejection_reason.trim(),
    });
  } catch (aiError) {
    console.error('Claude rejection handling failed:', aiError);
    return NextResponse.json({ error: 'AI failed to process rejection. Please try again.' }, { status: 502 });
  }

  const newHistoryEntry = {
    action: 'rejected',
    reason: rejection_reason.trim(),
    timestamp: new Date().toISOString(),
    version: log.version,
    ai_response: aiResponse.action,
  };

  let updatePayload = {
    history: [...(log.history || []), newHistoryEntry],
    version: (log.version || 1) + 1,
    pushback_reason: null,
  };

  if (aiResponse.action === 'revise') {
    // AI agreed and rewrote the log
    const revised = aiResponse.content;
    updatePayload = {
      ...updatePayload,
      status: 'revised',
      title: revised.title,
      situation: revised.situation,
      recommendation: revised.recommendation,
      reasoning: revised.reasoning,
      risk_if_ignored: revised.risk_if_ignored,
      confidence: revised.confidence,
      urgency: revised.urgency,
      node_ref: revised.node_ref,
    };
  } else if (aiResponse.action === 'pushback') {
    // AI disagrees with the founder
    updatePayload = {
      ...updatePayload,
      status: 'pushback',
      pushback_reason: aiResponse.pushback_reason,
    };
  } else {
    return NextResponse.json({ error: 'Unexpected AI response action' }, { status: 502 });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('decision_logs')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to update log after rejection:', updateError);
    return NextResponse.json({ error: 'Failed to save rejection response' }, { status: 500 });
  }

  return NextResponse.json({ log: updated, aiAction: aiResponse.action }, { status: 200 });
}
