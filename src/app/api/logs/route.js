/**
 * GET /api/logs
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { DecisionLog } from '@/lib/mongodb/models/DecisionLog';

export async function GET(request) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  const logs = await DecisionLog.find({ user_id: userId }).sort({ created_at: -1 });

  return NextResponse.json({ logs }, { status: 200 });
}
