'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
      
      if (data.needsOnboarding) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dot">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent)] shadow-accent mb-4 cursor-pointer">
            <Zap className="text-white w-7 h-7" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-white">Welcome Back</h1>
          <p className="text-[var(--text-secondary)] mt-2">Resume your startup operations</p>
        </div>

        <div className="card p-8 glass">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="sujith@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[var(--error)]/10 border border-[var(--error)]/20 text-[var(--error)] text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3.5 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Access Forge <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[var(--accent-light)] hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
