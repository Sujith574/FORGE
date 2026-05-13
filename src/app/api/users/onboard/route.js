/**
 * POST /api/users/onboard
 * Called after signup. Saves name + company, creates default nodes,
 * and triggers starter Decision Log generation.
 *
 * Body: { name: string, company_name: string, company_description?: string }
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateStarterLogs } from '@/lib/claude/claudeService';

// The 5 default Brain Map nodes every new company gets
const DEFAULT_NODES = [
  { label: 'Company', x: 500, y: 350, status: 'in-progress', is_core: true },
  { label: 'Market',  x: 750, y: 200, status: 'unknown', is_core: false },
  { label: 'Product', x: 750, y: 500, status: 'unknown', is_core: false },
  { label: 'Business Model', x: 250, y: 200, status: 'unknown', is_core: false },
  { label: 'Technology', x: 250, y: 500, status: 'unknown', is_core: false },
];

export async function POST(request) {
  const { user, error } = await getAuthUser(request);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, company_name, company_description } = body;

  if (!name || !company_name) {
    return NextResponse.json({ error: 'name and company_name are required' }, { status: 400 });
  }

  // 1. Create user row
  const { error: userError } = await supabaseAdmin.from('users').upsert({
    id: user.id,
    name: name.trim(),
    company_name: company_name.trim(),
    email: user.email,
  });

  if (userError) {
    console.error('Failed to create user row:', userError);
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
  }

  // 2. Create default Brain Map nodes
  const nodesToInsert = DEFAULT_NODES.map((node) => ({
    ...node,
    user_id: user.id,
    connections: [],
  }));

  const { data: createdNodes, error: nodesError } = await supabaseAdmin
    .from('brain_nodes')
    .insert(nodesToInsert)
    .select();

  if (nodesError) {
    console.error('Failed to create default nodes:', nodesError);
    // Don't fail onboarding for this — user can add nodes manually
  }

  // 3. Generate 2 starter Decision Logs (async — don't block response)
  // We do this in background so onboarding feels instant
  (async () => {
    try {
      const starterLogs = await generateStarterLogs(
        company_name,
        company_description || 'A new startup'
      );

      for (const { employeeId, logContent } of starterLogs) {
        await supabaseAdmin.from('decision_logs').insert({
          user_id: user.id,
          employee_id: employeeId,
          status: 'pending',
          version: 1,
          title: logContent.title,
          situation: logContent.situation,
          recommendation: logContent.recommendation,
          reasoning: logContent.reasoning,
          risk_if_ignored: logContent.risk_if_ignored,
          confidence: logContent.confidence,
          urgency: logContent.urgency,
          node_ref: logContent.node_ref,
          history: [],
        });
      }
    } catch (err) {
      console.error('Background starter log generation failed:', err);
    }
  })();

  return NextResponse.json({
    success: true,
    message: 'Onboarding complete',
    nodes: createdNodes || [],
  }, { status: 201 });
}
