/**
 * POST /api/auth/signup
 * Register a new founder account.
 *
 * Body: { email, password, name, company_name }
 * Returns: { token, user }
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb/connect';
import { User } from '@/lib/mongodb/models/User';

export async function POST(request) {
  await connectDB();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, password, name, company_name } = body;

  if (!email || !password || !name || !company_name) {
    return NextResponse.json(
      { error: 'email, password, name, and company_name are required' },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  // Check if email already registered
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({
    email: email.toLowerCase().trim(),
    password_hash,
    name: name.trim(),
    company_name: company_name.trim(),
  });

  // Issue JWT
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return NextResponse.json(
    {
      token,
      user: {
        id: user._id,
        name: user.name,
        company_name: user.company_name,
        email: user.email,
      },
      needsOnboarding: true,
    },
    { status: 201 }
  );
}
