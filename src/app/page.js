'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Brain, Zap, Shield, Cpu, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dot">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center bg-[var(--accent)] shadow-accent">
              <Zap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight text-white">FORGE</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#ai-employees" className="hover:text-white transition-colors">AI Employees</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary px-6 py-2.5 text-sm">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--accent-light)] mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
              </span>
              Now powered by Groq Llama 3.3
            </div>
            <h1 className="text-6xl md:text-7xl font-display font-bold leading-[1.1] mb-6 text-white">
              The AI-Powered <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-light)] to-[#7c6af7]">Operating System</span> <br />
              for Founders
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-xl leading-relaxed">
              FORGE gives you a full team of AI employees to challenge your assumptions, 
              automate your documentation, and guide your strategy from zero to one.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="btn btn-primary text-lg px-8 py-4">
                Build Your Brain Map <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="btn btn-secondary text-lg px-8 py-4">
                Watch Demo
              </a>
            </div>
            
            <div className="mt-12 flex items-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 font-display font-bold text-xl">
                <Cpu className="w-6 h-6" /> TECHCRUNCH
              </div>
              <div className="flex items-center gap-2 font-display font-bold text-xl">
                <Terminal className="w-6 h-6" /> Y COMBINATOR
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-[var(--accent)] to-transparent opacity-20 blur-3xl rounded-full"></div>
            <div className="relative rounded-2xl overflow-hidden border border-[var(--border-bright)] shadow-2xl">
              <img 
                src="/hero.png" 
                alt="FORGE Brain Map Interface" 
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">Institutional Memory, Augmented</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Stop losing insights in Slack threads. FORGE organizes your entire startup logic into a visual, living document.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-8 h-8 text-[var(--accent-light)]" />,
                title: "Visual Brain Map",
                desc: "Map your entire company logic visually. From market segments to technology stack."
              },
              {
                icon: <Zap className="w-8 h-8 text-[var(--success)]" />,
                title: "AI Decision Logs",
                desc: "Get brutal honesty from AI employees. Every major decision reviewed and logged."
              },
              {
                icon: <Shield className="w-8 h-8 text-[var(--info)]" />,
                title: "Live Blueprint",
                desc: "Auto-generated pitch decks and business plans based on your actual work history."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="card p-8 bg-[var(--bg)]"
              >
                <div className="mb-6">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap className="text-[var(--accent)] w-6 h-6" />
            <span className="text-xl font-display font-bold text-white">FORGE</span>
          </div>
          <p className="text-[var(--text-muted)] text-sm">
            © 2026 FORGE Inc. Built for founders by founders.
          </p>
          <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
