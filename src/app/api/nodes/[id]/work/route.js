/**
 * POST /api/nodes/[id]/work
 * GET /api/nodes/[id]/work
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { BrainNode } from '@/lib/mongodb/models/BrainNode';
import { WorkItem } from '@/lib/mongodb/models/WorkItem';

const VALID_TYPES = ['decision', 'insight', 'blocker', 'milestone', 'question', 'note'];

export async function POST(request, { params }) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  const { id: nodeId } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, text, author } = body;

  if (!type || !text) {
    return NextResponse.json({ error: 'type and text are required' }, { status: 400 });
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  // Verify ownership
  const node = await BrainNode.findOne({ _id: nodeId, user_id: userId });
  if (!node) {
    return NextResponse.json({ error: 'Node not found' }, { status: 404 });
  }

  const workItem = await WorkItem.create({
    node_id: nodeId,
    user_id: userId,
    type,
    text: text.trim(),
    author: author?.trim() || 'Founder',
  });

  return NextResponse.json({ workItem }, { status: 201 });
}

export async function GET(request, { params }) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  const { id: nodeId } = params;

  // Verify ownership
  const node = await BrainNode.findOne({ _id: nodeId, user_id: userId });
  if (!node) {
    return NextResponse.json({ error: 'Node not found' }, { status: 404 });
  }

  const workItems = await WorkItem.find({ node_id: nodeId }).sort({ created_at: -1 });

  return NextResponse.json({ workItems }, { status: 200 });
}
