/**
 * GET /api/documents    — Get all document fields for the current user
 * PUT /api/documents    — Save (upsert) a single document field
 *
 * PUT Body:
 *   section_id  — market | product | business | technology
 *   field_id    — specific field within that section (e.g. 'target_customer')
 *   value       — what the founder typed
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

const VALID_SECTIONS = ['market', 'product', 'business', 'technology'];

export async function GET(request) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('section_id', { ascending: true });

  if (dbError) {
    console.error('Failed to fetch documents:', dbError);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }

  // Return as a nested object grouped by section for easy frontend use
  const grouped = {};
  for (const row of data) {
    if (!grouped[row.section_id]) {
      grouped[row.section_id] = {};
    }
    grouped[row.section_id][row.field_id] = row.value;
  }

  return NextResponse.json({ documents: grouped, raw: data }, { status: 200 });
}

export async function PUT(request) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { section_id, field_id, value } = body;

  if (!section_id || !field_id || value === undefined) {
    return NextResponse.json(
      { error: 'section_id, field_id, and value are required' },
      { status: 400 }
    );
  }

  if (!VALID_SECTIONS.includes(section_id)) {
    return NextResponse.json(
      { error: `Invalid section_id. Must be one of: ${VALID_SECTIONS.join(', ')}` },
      { status: 400 }
    );
  }

  // Upsert — insert if not exists, update if exists
  const { data, error: dbError } = await supabaseAdmin
    .from('documents')
    .upsert(
      {
        user_id: user.id,
        section_id,
        field_id,
        value: String(value),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,section_id,field_id',
      }
    )
    .select()
    .single();

  if (dbError) {
    console.error('Failed to save document field:', dbError);
    return NextResponse.json({ error: 'Failed to save document field' }, { status: 500 });
  }

  return NextResponse.json({ field: data }, { status: 200 });
}
