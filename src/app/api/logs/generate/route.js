/**
 * POST /api/logs/generate
 * Founder clicks '+ Initiate Log'. Triggers Situation 1 + Situation 2.
 *
 * Body:
 *   employee_id   — destroyer | researcher | engineer | strategist | fundraiser
 *   trigger_text  — what the founder wrote as the topic/question
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateDecisionLog, reviewDecisionLog } from '@/lib/claude/claudeService';

export async function POST(request) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { employee_id, trigger_text } = body;

  const VALID_EMPLOYEES = ['destroyer', 'researcher', 'engineer', 'strategist', 'fundraiser'];

  if (!employee_id || !trigger_text) {
    return NextResponse.json({ error: 'employee_id and trigger_text are required' }, { status: 400 });
  }

  if (!VALID_EMPLOYEES.includes(employee_id)) {
    return NextResponse.json({ error: `Invalid employee_id. Must be one of: ${VALID_EMPLOYEES.join(', ')}` }, { status: 400 });
  }

  // --- Step 1: Create a placeholder row so the frontend can show 'Generating...' ---
  const { data: placeholder, error: placeholderError } = await supabaseAdmin
    .from('decision_logs')
    .insert({
      user_id: user.id,
      employee_id,
      status: 'generating',
      version: 1,
      title: 'Generating...',
      situation: '',
      recommendation: '',
      reasoning: '',
      risk_if_ignored: '',
      confidence: 0,
      urgency: 'MEDIUM',
      node_ref: 'other',
      history: [],
    })
    .select()
    .single();

  if (placeholderError) {
    console.error('Failed to create placeholder log:', placeholderError);
    return NextResponse.json({ error: 'Failed to start log generation' }, { status: 500 });
  }

  // --- Fetch company context ---
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('name, company_name')
    .eq('id', user.id)
    .single();

  const companyContext = userData
    ? `Company: ${userData.company_name} | Founder: ${userData.name}`
    : 'A startup company';

  // --- Step 2: Generate log (Situation 1) ---
  let logContent;
  try {
    logContent = await generateDecisionLog({
      employeeId: employee_id,
      companyContext,
      triggerText: trigger_text,
    });
  } catch (aiError) {
    console.error('Claude log generation failed:', aiError);
    // Update placeholder to error state
    await supabaseAdmin
      .from('decision_logs')
      .update({ status: 'error', title: 'Generation Failed' })
      .eq('id', placeholder.id);
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 502 });
  }

  // --- Step 3: Sub-AI quality review (Situation 2) ---
  let review = { quality_score: 75, reviewer_note: 'Review unavailable.' };
  try {
    review = await reviewDecisionLog(logContent);
  } catch (reviewError) {
    console.error('Sub-AI review failed (non-fatal):', reviewError);
    // Non-fatal — log still goes through with default review
  }

  // --- Step 4: Update the log row with full content ---
  const { data: finalLog, error: updateError } = await supabaseAdmin
    .from('decision_logs')
    .update({
      status: 'pending',
      title: logContent.title,
      situation: logContent.situation,
      recommendation: logContent.recommendation,
      reasoning: logContent.reasoning,
      risk_if_ignored: logContent.risk_if_ignored,
      confidence: logContent.confidence,
      urgency: logContent.urgency,
      node_ref: logContent.node_ref,
      review_score: review.quality_score,
      review_note: review.reviewer_note,
    })
    .eq('id', placeholder.id)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to update log after generation:', updateError);
    return NextResponse.json({ error: 'Log generated but failed to save' }, { status: 500 });
  }

  return NextResponse.json({ log: finalLog }, { status: 201 });
}
