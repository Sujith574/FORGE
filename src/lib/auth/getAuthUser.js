/**
 * JWT Auth Middleware
 * Verifies the Bearer token from the Authorization header.
 * Uses jsonwebtoken — no Supabase involved.
 *
 * Returns { userId, error }
 * - userId: MongoDB ObjectId string of the logged-in founder
 * - error: NextResponse 401 if token is missing/invalid
 *
 * Usage in any route:
 *   const { userId, error } = getAuthUser(request);
 *   if (error) return error;
 */
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export function getAuthUser(request) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
  }
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      userId: null,
      error: NextResponse.json({ error: 'Unauthorized — missing token' }, { status: 401 }),
    };
  }

  const token = authHeader.replace('Bearer ', '').trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId, error: null };
  } catch (err) {
    return {
      userId: null,
      error: NextResponse.json({ error: 'Unauthorized — invalid or expired token' }, { status: 401 }),
    };
  }
}
