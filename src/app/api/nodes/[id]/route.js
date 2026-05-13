/**
 * PATCH /api/nodes/[id]   — Update a node (position, status, label, connections)
 * DELETE /api/nodes/[id]  — Delete a node and all its work items
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { BrainNode } from '@/lib/mongodb/models/BrainNode';
import { WorkItem } from '@/lib/mongodb/models/WorkItem';

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

  const allowedFields = ['label', 'x', 'y', 'status', 'connections'];
  const updates = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const node = await BrainNode.findOneAndUpdate(
    { _id: id, user_id: userId },
    { $set: updates },
    { new: true }
  );

  if (!node) {
    return NextResponse.json({ error: 'Node not found or update failed' }, { status: 404 });
  }

  return NextResponse.json({ node }, { status: 200 });
}

export async function DELETE(request, { params }) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  const { id } = params;

  const node = await BrainNode.findOne({ _id: id, user_id: userId });

  if (!node) {
    return NextResponse.json({ error: 'Node not found' }, { status: 404 });
  }

  if (node.is_core) {
    return NextResponse.json({ error: 'Cannot delete the core company node' }, { status: 400 });
  }

  // Delete work items first
  await WorkItem.deleteMany({ node_id: id, user_id: userId });

  // Then delete node
  await BrainNode.deleteOne({ _id: id, user_id: userId });

  return NextResponse.json({ success: true }, { status: 200 });
}
