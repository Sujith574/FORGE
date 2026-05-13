/**
 * PATCH /api/logs/[id]/reject
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { DecisionLog } from '@/lib/mongodb/models/DecisionLog';
import { handleRejection } from '@/lib/claude/claudeService';

export async function PATCH(request, { params }) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  const { id } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { rejection_reason } = body;

  if (!rejection_reason) {
    return NextResponse.json({ error: 'Reason required' }, { status: 400 });
  }

  const log = await DecisionLog.findOne({ _id: id, user_id: userId });

  if (!log) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const aiResponse = await handleRejection({
      employeeId: log.employee_id,
      originalLog: log,
      rejectionReason: rejection_reason.trim(),
    });

    const newHistoryEntry = {
      action: 'rejected',
      reason: rejection_reason.trim(),
      timestamp: new Date().toISOString(),
      version: log.version,
      ai_response: aiResponse.action,
    };

    let updatePayload = {
      $push: { history: newHistoryEntry },
      $inc: { version: 1 },
      $set: { pushback_reason: null }
    };

    if (aiResponse.action === 'revise') {
      const revised = aiResponse.content;
      updatePayload.$set = {
        ...updatePayload.$set,
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
    } else {
      updatePayload.$set = {
        ...updatePayload.$set,
        status: 'pushback',
        pushback_reason: aiResponse.pushback_reason,
      };
    }

    const updated = await DecisionLog.findByIdAndUpdate(id, updatePayload, { new: true });

    return NextResponse.json({ log: updated, aiAction: aiResponse.action }, { status: 200 });

  } catch (aiError) {
    console.error('AI error:', aiError);
    return NextResponse.json({ error: 'AI failed' }, { status: 502 });
  }
}
