/**
 * GET  /api/nodes      — Get all Brain Map nodes for the current user
 * POST /api/nodes      — Create a new node
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { BrainNode } from '@/lib/mongodb/models/BrainNode';

export async function GET(request) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  const nodes = await BrainNode.find({ user_id: userId }).sort({ created_at: 1 });

  return NextResponse.json({ nodes }, { status: 200 });
}

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

  const { label, x, y, status = 'unknown' } = body;

  if (!label) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 });
  }

  const node = await BrainNode.create({
    user_id: userId,
    label: label.trim(),
    x: x ?? 400,
    y: y ?? 300,
    status,
    is_core: false,
    connections: [],
  });

  return NextResponse.json({ node }, { status: 201 });
}
