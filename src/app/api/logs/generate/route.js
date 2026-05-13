/**
 * POST /api/logs/generate
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { DecisionLog } from '@/lib/mongodb/models/DecisionLog';
import { User } from '@/lib/mongodb/models/User';
import { generateDecisionLog, reviewDecisionLog } from '@/lib/claude/claudeService';

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

  const { employee_id, trigger_text } = body;

  const VALID_EMPLOYEES = ['destroyer', 'researcher', 'engineer', 'strategist', 'fundraiser'];

  if (!employee_id || !trigger_text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!VALID_EMPLOYEES.includes(employee_id)) {
    return NextResponse.json({ error: 'Invalid employee' }, { status: 400 });
  }

  // Create placeholder
  const placeholder = await DecisionLog.create({
    user_id: userId,
    employee_id,
    status: 'generating',
    version: 1,
    title: 'Generating...',
    history: [],
  });

  const user = await User.findById(userId);
  const companyContext = user 
    ? `Company: ${user.company_name} | Founder: ${user.name}`
    : 'A startup';

  try {
    const logContent = await generateDecisionLog({
      employeeId: employee_id,
      companyContext,
      triggerText: trigger_text,
    });

    let review = { quality_score: 75, reviewer_note: 'Review unavailable.' };
    try {
      review = await reviewDecisionLog(logContent);
    } catch (reviewError) {
      console.error('Review failed:', reviewError);
    }

    const finalLog = await DecisionLog.findByIdAndUpdate(
      placeholder._id,
      {
        $set: {
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
        }
      },
      { new: true }
    );

    return NextResponse.json({ log: finalLog }, { status: 201 });

  } catch (aiError) {
    console.error('AI error:', aiError);
    await DecisionLog.findByIdAndUpdate(placeholder._id, { $set: { status: 'error', title: 'Generation Failed' } });
    return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
  }
}
