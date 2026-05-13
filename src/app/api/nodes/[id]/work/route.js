/**
 * POST /api/nodes/[id]/work
 * Add a work item (decision, insight, blocker, etc.) to a Brain Map node.
 *
 * Body:
 *   type    — decision | insight | blocker | milestone | question | note
 *   text    — the content
 *   author  — who logged it (founder, co-founder, engineer, or AI employee name)
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

const VALID_TYPES = ['decision', 'insight', 'blocker', 'milestone', 'question', 'note'];

export async function POST(request, { params }) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

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
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // Verify the node belongs to this user
  const { data: node } = await supabaseAdmin
    .from('brain_nodes')
    .select('id')
    .eq('id', nodeId)
    .eq('user_id', user.id)
    .single();

  if (!node) {
    return NextResponse.json({ error: 'Node not found' }, { status: 404 });
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('work_items')
    .insert({
      node_id: nodeId,
      user_id: user.id,
      type,
      text: text.trim(),
      author: author?.trim() || 'Founder',
    })
    .select()
    .single();

  if (dbError) {
    console.error('Failed to create work item:', dbError);
    return NextResponse.json({ error: 'Failed to create work item' }, { status: 500 });
  }

  return NextResponse.json({ workItem: data }, { status: 201 });
}

/**
 * GET /api/nodes/[id]/work
 * Get all work items for a node.
 */
export async function GET(request, { params }) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  const { id: nodeId } = params;

  // Verify ownership
  const { data: node } = await supabaseAdmin
    .from('brain_nodes')
    .select('id')
    .eq('id', nodeId)
    .eq('user_id', user.id)
    .single();

  if (!node) {
    return NextResponse.json({ error: 'Node not found' }, { status: 404 });
  }

  const { data, error: dbError } = await supabaseAdmin
    .from('work_items')
    .select('*')
    .eq('node_id', nodeId)
    .order('created_at', { ascending: false });

  if (dbError) {
    return NextResponse.json({ error: 'Failed to fetch work items' }, { status: 500 });
  }

  return NextResponse.json({ workItems: data }, { status: 200 });
}
