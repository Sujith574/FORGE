/**
 * PATCH /api/nodes/[id]   — Update a node (position, status, label, connections)
 * DELETE /api/nodes/[id]  — Delete a node and all its work items
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(request, { params }) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  const { id } = params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Only allow these fields to be updated
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

  // Ensure the node belongs to this user before updating
  const { data, error: dbError } = await supabaseAdmin
    .from('brain_nodes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // Ownership check
    .select()
    .single();

  if (dbError || !data) {
    console.error('Failed to update node:', dbError);
    return NextResponse.json({ error: 'Node not found or update failed' }, { status: 404 });
  }

  return NextResponse.json({ node: data }, { status: 200 });
}

export async function DELETE(request, { params }) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  const { id } = params;

  // First verify ownership
  const { data: node } = await supabaseAdmin
    .from('brain_nodes')
    .select('id, is_core')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!node) {
    return NextResponse.json({ error: 'Node not found' }, { status: 404 });
  }

  if (node.is_core) {
    return NextResponse.json({ error: 'Cannot delete the core company node' }, { status: 400 });
  }

  // Delete all work items belonging to this node first
  await supabaseAdmin
    .from('work_items')
    .delete()
    .eq('node_id', id)
    .eq('user_id', user.id);

  // Then delete the node
  const { error: deleteError } = await supabaseAdmin
    .from('brain_nodes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Failed to delete node:', deleteError);
    return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
