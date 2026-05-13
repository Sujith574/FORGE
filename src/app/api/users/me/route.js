/**
 * GET /api/users/me
 * Returns the current logged-in user's profile.
 */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth/getAuthUser';
import { connectDB } from '@/lib/mongodb/connect';
import { User } from '@/lib/mongodb/models/User';
import { BrainNode } from '@/lib/mongodb/models/BrainNode';

export async function GET(request) {
  const { userId, error } = getAuthUser(request);
  if (error) return error;

  await connectDB();

  const user = await User.findById(userId).select('-password_hash');

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Check if they've completed onboarding (have any nodes)
  const nodeCount = await BrainNode.countDocuments({ user_id: userId });

  return NextResponse.json({ 
    user,
    needsOnboarding: nodeCount === 0 
  }, { status: 200 });
}
