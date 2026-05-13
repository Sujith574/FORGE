/**
 * POST /api/users/onboard
 * Creates default nodes and triggers starter Decision Log generation.
 * (User profile is already created during signup in MongoDB version)
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { BrainNode } from '@/lib/mongodb/models/BrainNode';
import { DecisionLog } from '@/lib/mongodb/models/DecisionLog';
import { User } from '@/lib/mongodb/models/User';
import { generateStarterLogs } from '@/lib/claude/claudeService';

const DEFAULT_NODES = [
  { label: 'Company', x: 500, y: 350, status: 'in-progress', is_core: true },
  { label: 'Market',  x: 750, y: 200, status: 'unknown', is_core: false },
  { label: 'Product', x: 750, y: 500, status: 'unknown', is_core: false },
  { label: 'Business Model', x: 250, y: 200, status: 'unknown', is_core: false },
  { label: 'Technology', x: 250, y: 500, status: 'unknown', is_core: false },
];

export async function POST(request) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if already onboarded
  const existingNodes = await BrainNode.countDocuments({ user_id: userId });
  if (existingNodes > 0) {
    return NextResponse.json({ error: 'Already onboarded' }, { status: 400 });
  }

  // 1. Create default Brain Map nodes
  const nodesToInsert = DEFAULT_NODES.map((node) => ({
    ...node,
    user_id: userId,
    connections: [],
  }));

  const createdNodes = await BrainNode.insertMany(nodesToInsert);

  // 2. Generate starter logs in background
  (async () => {
    try {
      const starterLogs = await generateStarterLogs(
        user.company_name,
        'A new startup'
      );

      for (const { employeeId, logContent } of starterLogs) {
        await DecisionLog.create({
          user_id: userId,
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
    nodes: createdNodes,
  }, { status: 201 });
}
