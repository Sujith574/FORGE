'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  FileText, 
  Search, 
  ChevronRight, 
  Save, 
  Check, 
  Loader2,
  Globe,
  Box,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';

const SECTIONS = [
  { id: 'market', name: 'Market Intelligence', icon: Globe, color: 'text-blue-400' },
  { id: 'product', name: 'Product Strategy', icon: Box, color: 'text-purple-400' },
  { id: 'business', name: 'Business Model', icon: TrendingUp, color: 'text-green-400' },
  { id: 'technology', name: 'Technology Stack', icon: Cpu, color: 'text-orange-400' },
];

const FIELDS = {
  market: [
    { id: 'target_customer', label: 'Primary Target Customer', placeholder: 'Who is your ideal customer?' },
    { id: 'market_size', label: 'TAM/SAM/SOM', placeholder: 'What is the scale of the opportunity?' },
    { id: 'competitors', label: 'Key Competitors', placeholder: 'Who are you fighting against?' },
  ],
  product: [
    { id: 'core_value', label: 'Core Value Proposition', placeholder: 'What is the one thing you do best?' },
    { id: 'key_features', label: 'Milestone 1 Features', placeholder: 'What are you building first?' },
  ],
  business: [
    { id: 'revenue_model', label: 'Revenue Streams', placeholder: 'How will you make money?' },
    { id: 'go_to_market', label: 'Acquisition Strategy', placeholder: 'How will you find users?' },
  ],
  technology: [
    { id: 'tech_stack', label: 'Core Stack', placeholder: 'React, Next.js, MongoDB, etc.' },
    { id: 'ai_strategy', label: 'AI Integration', placeholder: 'How is AI used in your product?' },
  ],
};

export default function DocumentsPage() {
  const [activeSection, setActiveSection] = useState('market');
  const [docs, setDocs] = useState({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const { authFetch } = useAuth();

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await authFetch('/api/documents');
      const data = await res.json();
      if (data.documents) setDocs(data.documents);
    } catch (err) {
      console.error(err);
    }
  };

  const saveField = async (section, field, value) => {
    setSaving(true);
    try {
      await authFetch('/api/documents', {
        method: 'PUT',
        body: JSON.stringify({ section_id: section, field_id: field, value }),
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  // Debounce helper
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const debouncedSave = useCallback(debounce(saveField, 800), []);

  const handleFieldChange = (section, field, value) => {
    setDocs(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
    debouncedSave(section, field, value);
  };

  return (
    <div className="flex h-full gap-8">
      {/* Sidebar Navigation */}
      <div className="w-80 space-y-2">
        <h1 className="text-2xl font-display font-bold text-white mb-8 flex items-center gap-3">
          <FileText className="w-6 h-6 text-[var(--accent)]" /> Blueprint
        </h1>
        
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
              activeSection === section.id 
              ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-white' 
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <section.icon className={`w-5 h-5 ${activeSection === section.id ? 'text-[var(--accent-light)]' : ''}`} />
              <span className="font-semibold text-sm">{section.name}</span>
            </div>
            <ChevronRight className={`w-4 h-4 opacity-0 transition-opacity ${activeSection === section.id ? 'opacity-100' : ''}`} />
          </button>
        ))}

        <div className="mt-auto pt-12">
          <div className="card p-4 bg-[var(--accent)]/5 border-dashed border-[var(--accent)]/20">
            <p className="text-xs text-[var(--text-muted)] mb-2 uppercase font-bold">Auto-Saving Enabled</p>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs">
              {saving ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Syncing with Forge...</>
              ) : (
                <><Check className="w-3 h-3 text-[var(--success)]" /> {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'All changes saved'}</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <div className="card p-10 bg-[var(--surface)] min-h-[600px] shadow-2xl relative">
          <div className="mb-10 pb-6 border-b border-[var(--border)]">
            <h2 className="text-3xl font-display font-bold text-white mb-2">
              {SECTIONS.find(s => s.id === activeSection).name}
            </h2>
            <p className="text-[var(--text-secondary)]">These details feed your AI's understanding of your company.</p>
          </div>

          <div className="space-y-10">
            {FIELDS[activeSection].map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-bold text-white mb-3 tracking-tight">
                  {field.label}
                </label>
                <textarea
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-6 py-4 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all min-h-[120px] resize-none leading-relaxed"
                  placeholder={field.placeholder}
                  value={docs[activeSection]?.[field.id] || ''}
                  onChange={(e) => handleFieldChange(activeSection, field.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
