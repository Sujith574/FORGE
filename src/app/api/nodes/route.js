/**
 * GET  /api/nodes      — Get all Brain Map nodes for the current user
 * POST /api/nodes      — Create a new node
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
    .from('brain_nodes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (dbError) {
    console.error('Failed to fetch nodes:', dbError);
    return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
  }

  return NextResponse.json({ nodes: data }, { status: 200 });
}

export async function POST(request) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

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

  const { data, error: dbError } = await supabaseAdmin
    .from('brain_nodes')
    .insert({
      user_id: user.id,
      label: label.trim(),
      x: x ?? 400,
      y: y ?? 300,
      status,
      is_core: false,
      connections: [],
    })
    .select()
    .single();

  if (dbError) {
    console.error('Failed to create node:', dbError);
    return NextResponse.json({ error: 'Failed to create node' }, { status: 500 });
  }

  return NextResponse.json({ node: data }, { status: 201 });
}
