/**
 * POST /api/warroom/message
 * Situation 4 — War Room real-time chat with an AI employee.
 * Conversations are NOT persisted (reset on page refresh — v1 spec).
 *
 * Body:
 *   employee_id          — destroyer | researcher | engineer | strategist | fundraiser
 *   conversation_history — array of { role: 'user'|'assistant', content: string }
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { warRoomChat } from '@/lib/claude/claudeService';

export async function POST(request) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { employee_id, conversation_history } = body;

  const VALID_EMPLOYEES = ['destroyer', 'researcher', 'engineer', 'strategist', 'fundraiser'];

  if (!employee_id || !conversation_history) {
    return NextResponse.json(
      { error: 'employee_id and conversation_history are required' },
      { status: 400 }
    );
  }

  if (!VALID_EMPLOYEES.includes(employee_id)) {
    return NextResponse.json({ error: `Invalid employee_id` }, { status: 400 });
  }

  if (!Array.isArray(conversation_history) || conversation_history.length === 0) {
    return NextResponse.json({ error: 'conversation_history must be a non-empty array' }, { status: 400 });
  }

  // Validate message format
  const validMessages = conversation_history.every(
    (msg) => msg.role && msg.content && typeof msg.content === 'string'
  );
  if (!validMessages) {
    return NextResponse.json(
      { error: 'Each message in conversation_history must have role and content' },
      { status: 400 }
    );
  }

  // Fetch company context
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('name, company_name')
    .eq('id', user.id)
    .single();

  const companyContext = userData
    ? `Company: ${userData.company_name} | Founder: ${userData.name}`
    : 'A startup';

  // Call Claude (Situation 4)
  let reply;
  try {
    reply = await warRoomChat({
      employeeId: employee_id,
      conversationHistory: conversation_history,
      companyContext,
    });
  } catch (aiError) {
    console.error('War Room Claude call failed:', aiError);
    return NextResponse.json(
      { error: 'AI employee is unavailable right now. Please try again.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ reply }, { status: 200 });
}
