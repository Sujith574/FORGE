/**
 * MongoDB connection using Mongoose.
 * Uses a module-level cache so Next.js hot-reload doesn't
 * open multiple connections in development.
 *
 * Import `connectDB` at the top of every API route and await it.
 */
import mongoose from 'mongoose';

// Cache the connection across hot-reloads in dev
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable. Add it to .env.local');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
