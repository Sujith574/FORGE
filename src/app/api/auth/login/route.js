/**
 * POST /api/auth/login
 * Log in with email and password.
 *
 * Body: { email, password }
 * Returns: { token, user, needsOnboarding }
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb/connect';
import { User } from '@/lib/mongodb/models/User';
import { BrainNode } from '@/lib/mongodb/models/BrainNode';

export async function POST(request) {
  await connectDB();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  // Check if onboarding is done (has any brain nodes)
  const nodeCount = await BrainNode.countDocuments({ user_id: user._id });

  // Issue JWT
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return NextResponse.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      company_name: user.company_name,
      email: user.email,
    },
    needsOnboarding: nodeCount === 0,
  });
}
