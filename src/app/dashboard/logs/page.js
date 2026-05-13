'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Inbox, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  AlertTriangle, 
  Clock,
  User,
  ShieldCheck,
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DecisionInbox() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLogId, setActiveLogId] = useState(null);
  const { authFetch } = useAuth();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await authFetch('/api/logs');
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action, reason = '') => {
    try {
      const res = await authFetch(`/api/logs/${id}/${action}`, {
        method: 'PATCH',
        body: reason ? JSON.stringify({ rejection_reason: reason }) : undefined,
      });
      const data = await res.json();
      if (data.log) {
        setLogs(logs.map(l => l._id === id ? data.log : l));
        if (action === 'reject') {
          // If rejected, AI might push back or revise
          alert(data.aiAction === 'pushback' ? 'AI Agent pushed back!' : 'AI Agent revised the log.');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getEmployeeName = (id) => {
    const map = {
      destroyer: 'The Destroyer',
      researcher: 'The Researcher',
      engineer: 'The Engineer',
      strategist: 'The Strategist',
      fundraiser: 'The Fundraiser'
    };
    return map[id] || id;
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
          <Inbox className="w-8 h-8 text-[var(--accent)]" /> Decision Inbox
        </h1>
        <p className="text-[var(--text-secondary)]">Review recommendations from your AI team.</p>
      </div>

      <div className="space-y-6">
        {logs.length === 0 ? (
          <div className="card p-12 text-center bg-[var(--surface)] border-dashed">
            <Inbox className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">No logs to review yet. Try initializing a log from the Brain Map.</p>
          </div>
        ) : (
          logs.map((log) => (
            <motion.div 
              key={log._id}
              layout
              className={`card overflow-hidden ${activeLogId === log._id ? 'border-[var(--accent)]' : ''}`}
            >
              <div 
                className="p-6 cursor-pointer flex items-center justify-between"
                onClick={() => setActiveLogId(activeLogId === log._id ? null : log._id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    log.status === 'accepted' ? 'bg-[var(--success)]/10 text-[var(--success)]' :
                    log.status === 'rejected' ? 'bg-[var(--error)]/10 text-[var(--error)]' :
                    'bg-[var(--accent)]/10 text-[var(--accent-light)]'
                  }`}>
                    {log.status === 'accepted' ? <CheckCircle2 className="w-6 h-6" /> :
                     log.status === 'rejected' ? <XCircle className="w-6 h-6" /> :
                     <ShieldCheck className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        {getEmployeeName(log.employee_id)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        log.urgency === 'HIGH' ? 'bg-[var(--error)]/20 text-[var(--error)]' :
                        'bg-[var(--surface-hover)] text-[var(--text-secondary)]'
                      }`}>
                        {log.urgency}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{log.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-[var(--text-muted)]">Confidence</p>
                    <p className="text-sm font-bold text-white">{log.confidence}%</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${activeLogId === log._id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              <AnimatePresence>
                {activeLogId === log._id && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-[var(--surface-hover)]/30 border-t border-[var(--border)]"
                  >
                    <div className="p-8 space-y-8">
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-bold uppercase text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <ArrowRight className="w-3 h-3" /> The Situation
                          </h4>
                          <p className="text-[var(--text-secondary)] leading-relaxed">{log.situation}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-[var(--warning)]" /> Risk If Ignored
                          </h4>
                          <p className="text-[var(--text-secondary)] leading-relaxed">{log.risk_if_ignored}</p>
                        </div>
                      </div>

                      <div className="p-6 bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-xl">
                        <h4 className="text-sm font-bold text-white mb-3">Recommendation</h4>
                        <p className="text-lg text-white leading-relaxed">{log.recommendation}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold uppercase text-[var(--text-muted)] mb-3">Reasoning</h4>
                        <p className="text-[var(--text-secondary)] leading-relaxed">{log.reasoning}</p>
                      </div>

                      {log.status === 'pending' || log.status === 'revised' || log.status === 'pushback' ? (
                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[var(--border)]">
                          <button 
                            onClick={() => handleAction(log._id, 'accept')}
                            className="btn btn-primary flex-1 py-4"
                          >
                            <CheckCircle2 className="w-5 h-5" /> Accept Recommendation
                          </button>
                          <button 
                            onClick={() => {
                              const reason = prompt('Why are you rejecting this?');
                              if (reason) handleAction(log._id, 'reject', reason);
                            }}
                            className="btn btn-secondary flex-1 py-4 text-[var(--error)] hover:bg-[var(--error)]/5"
                          >
                            <XCircle className="w-5 h-5" /> Reject with Pushback
                          </button>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-[var(--border)] flex items-center gap-2 text-sm">
                          <CheckCircle2 className={`w-5 h-5 ${log.status === 'accepted' ? 'text-[var(--success)]' : 'text-[var(--error)]'}`} />
                          <span className="text-[var(--text-secondary)] uppercase font-bold tracking-wider">
                            Decided: {log.status}
                          </span>
                        </div>
                      )}

                      {log.pushback_reason && (
                        <div className="mt-4 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-xl">
                          <p className="text-sm font-bold text-[var(--error)] mb-1">AI Pushback:</p>
                          <p className="text-sm text-[var(--text-secondary)] italic">"{log.pushback_reason}"</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
