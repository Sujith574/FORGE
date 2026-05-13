'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Send, 
  User, 
  Bot, 
  MessageSquare, 
  Zap, 
  Shield, 
  Activity, 
  TrendingUp, 
  Cpu,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AGENTS = [
  { id: 'destroyer', name: 'The Destroyer', icon: Shield, color: 'text-red-400', tagline: 'Brutal Reality Check' },
  { id: 'researcher', name: 'The Researcher', icon: Activity, color: 'text-blue-400', tagline: 'Market Intelligence' },
  { id: 'engineer', name: 'The Engineer', icon: Cpu, color: 'text-orange-400', tagline: 'Technical Feasibility' },
  { id: 'strategist', name: 'The Strategist', icon: TrendingUp, color: 'text-green-400', tagline: 'Business Strategy' },
];

export default function WarRoom() {
  const [activeAgentId, setActiveAgentId] = useState('destroyer');
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { authFetch } = useAuth();
  const chatEndRef = useRef(null);

  const activeAgent = AGENTS.find(a => a.id === activeAgentId);
  const currentMessages = messages[activeAgentId] || [
    { role: 'assistant', content: `Hello. I am ${activeAgent.name}. I am here to discuss your startup strategy. What's on your mind?` }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...currentMessages, userMessage];
    
    setMessages({ ...messages, [activeAgentId]: newMessages });
    setInput('');
    setLoading(true);

    try {
      const res = await authFetch('/api/warroom/message', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: activeAgentId,
          conversation_history: newMessages,
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages(prev => ({
          ...prev,
          [activeAgentId]: [...newMessages, { role: 'assistant', content: data.reply }]
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex gap-8">
      {/* Agent Selector Sidebar */}
      <div className="w-80 flex flex-col gap-3">
        <h1 className="text-2xl font-display font-bold text-white mb-8 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-[var(--accent)]" /> War Room
        </h1>
        
        {AGENTS.map((agent) => (
          <button
            key={agent.id}
            onClick={() => setActiveAgentId(agent.id)}
            className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
              activeAgentId === agent.id 
              ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-white shadow-lg' 
              : 'text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-hover)] hover:border-[var(--border)]'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl bg-[var(--bg)] flex items-center justify-center border border-[var(--border)]`}>
              <agent.icon className={`w-6 h-6 ${agent.color}`} />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">{agent.name}</p>
              <p className="text-[10px] uppercase tracking-tighter opacity-60">{agent.tagline}</p>
            </div>
          </button>
        ))}

        <div className="mt-auto card p-4 bg-[var(--surface)] text-[var(--text-muted)] text-xs leading-relaxed italic">
          "War Room conversations are volatile and not persisted between sessions. Discuss, decide, and move on."
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 card bg-[var(--surface)] flex flex-col overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="p-6 border-b border-[var(--border)] bg-[var(--surface-hover)]/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg)] flex items-center justify-center">
            <activeAgent.icon className={`w-5 h-5 ${activeAgent.color}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-none">{activeAgent.name}</h2>
            <p className="text-xs text-[var(--success)] flex items-center gap-1 mt-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse"></span> Active
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth">
          <AnimatePresence initial={false}>
            {currentMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user' 
                  ? 'bg-[var(--accent)] text-white rounded-tr-none' 
                  : 'bg-[var(--bg)] text-[var(--text)] border border-[var(--border)] rounded-tl-none'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-[var(--bg)] p-4 rounded-2xl rounded-tl-none border border-[var(--border)] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-light)]" />
                <span className="text-xs text-[var(--text-muted)] font-medium">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-6 bg-[var(--bg)] border-t border-[var(--border)]">
          <div className="relative">
            <input
              type="text"
              placeholder={`Message ${activeAgent.name}...`}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-6 py-4 pr-16 text-white focus:outline-none focus:border-[var(--accent)] transition-all shadow-inner"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--accent)] rounded-lg flex items-center justify-center text-white hover:bg-[var(--accent-light)] transition-all disabled:opacity-50 disabled:grayscale"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
