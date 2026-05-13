'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Zap, Loader2, Rocket, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, authFetch } = useAuth();
  const router = useRouter();

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/users/onboard', {
        method: 'POST',
      });

      if (res && res.ok) {
        setStep(2);
        // Wait 3 seconds to show the animation
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-grid">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--accent)] shadow-accent mb-8">
              <Rocket className="text-white w-8 h-8" />
            </div>
            <h1 className="text-5xl font-display font-bold text-white mb-6">
              Welcome, {user?.name}
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-12 leading-relaxed">
              We're ready to initialize **{user?.company_name}**. <br />
              We'll generate your core Brain Map and deploy your first AI employees.
            </p>
            
            <button
              onClick={handleStart}
              disabled={loading}
              className="btn btn-primary text-xl px-12 py-5 rounded-2xl group shadow-[0_0_40px_var(--accent-glow)]"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Initialize System <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[var(--accent)] blur-3xl opacity-20 animate-pulse"></div>
              <Zap className="text-[var(--accent-light)] w-24 h-24 mx-auto relative z-10 animate-bounce" />
            </div>
            <h2 className="text-4xl font-display font-bold text-white mb-4">Forge Initialized</h2>
            <p className="text-[var(--text-secondary)] text-lg">
              Deploying AI Agents and mapping nodes...
            </p>
            <div className="mt-12 flex justify-center gap-3">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  className="w-3 h-3 rounded-full bg-[var(--accent)]"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
