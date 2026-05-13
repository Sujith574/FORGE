/**
 * POST /api/warroom/message
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { User } from '@/lib/mongodb/models/User';
import { warRoomChat } from '@/lib/claude/claudeService';

export async function POST(request) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { employee_id, conversation_history } = body;

  if (!employee_id || !conversation_history) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const user = await User.findById(userId);
  const companyContext = user 
    ? `Company: ${user.company_name} | Founder: ${user.name}`
    : 'A startup';

  try {
    const reply = await warRoomChat({
      employeeId: employee_id,
      conversationHistory: conversation_history,
      companyContext,
    });

    return NextResponse.json({ reply }, { status: 200 });
  } catch (aiError) {
    console.error('AI error:', aiError);
    return NextResponse.json({ error: 'AI failed' }, { status: 502 });
  }
}
