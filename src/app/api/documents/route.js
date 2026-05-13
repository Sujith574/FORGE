/**
 * GET /api/documents
 * PUT /api/documents
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { Document } from '@/lib/mongodb/models/Document';

const VALID_SECTIONS = ['market', 'product', 'business', 'technology'];

export async function GET(request) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  const data = await Document.find({ user_id: userId });

  const grouped = {};
  for (const row of data) {
    if (!grouped[row.section_id]) {
      grouped[row.section_id] = {};
    }
    grouped[row.section_id][row.field_id] = row.value;
  }

  return NextResponse.json({ documents: grouped }, { status: 200 });
}

export async function PUT(request) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { section_id, field_id, value } = body;

  if (!section_id || !field_id || value === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!VALID_SECTIONS.includes(section_id)) {
    return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
  }

  const doc = await Document.findOneAndUpdate(
    { user_id: userId, section_id, field_id },
    { $set: { value: String(value) } },
    { upsert: true, new: true }
  );

  return NextResponse.json({ field: doc }, { status: 200 });
}
