/**
 * PATCH /api/logs/[id]/accept
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { DecisionLog } from '@/lib/mongodb/models/DecisionLog';

export async function PATCH(request, { params }) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  const { id } = params;

  const log = await DecisionLog.findOne({ _id: id, user_id: userId });

  if (!log) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (log.status === 'accepted') {
    return NextResponse.json({ error: 'Already accepted' }, { status: 400 });
  }

  const updated = await DecisionLog.findByIdAndUpdate(
    id,
    {
      $set: { status: 'accepted' },
      $push: {
        history: {
          action: 'accepted',
          timestamp: new Date().toISOString(),
          version: log.version,
        }
      }
    },
    { new: true }
  );

  return NextResponse.json({ log: updated }, { status: 200 });
}
