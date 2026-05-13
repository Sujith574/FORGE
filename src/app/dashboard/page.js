'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Save, Target, Activity, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { motion, useDragControls } from 'framer-motion';

export default function BrainMap() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authFetch } = useAuth();
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      const res = await authFetch('/api/nodes');
      const data = await res.json();
      if (data.nodes) setNodes(data.nodes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateNodePosition = async (id, x, y) => {
    try {
      await authFetch(`/api/nodes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ x, y }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const addNode = async () => {
    const label = prompt('Enter node name:');
    if (!label) return;

    try {
      const res = await authFetch('/api/nodes', {
        method: 'POST',
        body: JSON.stringify({ label, x: 500, y: 300 }),
      });
      const data = await res.json();
      if (data.node) setNodes([...nodes, data.node]);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'validated': return <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />;
      case 'at-risk': return <AlertCircle className="w-4 h-4 text-[var(--error)]" />;
      case 'in-progress': return <Activity className="w-4 h-4 text-[var(--warning)]" />;
      default: return <HelpCircle className="w-4 h-4 text-[var(--text-muted)]" />;
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-8 z-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Brain Map</h1>
          <p className="text-[var(--text-secondary)]">The visual logic of your startup.</p>
        </div>
        <button onClick={addNode} className="btn btn-primary">
          <Plus className="w-5 h-5" /> Add Node
        </button>
      </div>

      <div 
        ref={canvasRef}
        className="flex-1 relative bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden bg-grid"
        style={{ cursor: 'grab' }}
      >
        {/* Connection Lines (Simplified for v1) */}
        <svg className="absolute inset-0 pointer-events-none">
          {nodes.map(node => {
            if (node.is_core) return null;
            const coreNode = nodes.find(n => n.is_core);
            if (!coreNode) return null;
            return (
              <line 
                key={`line-${node._id}`}
                x1={coreNode.x} y1={coreNode.y}
                x2={node.x} y2={node.y}
                stroke="var(--accent)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
            );
          })}
        </svg>

        {nodes.map((node) => (
          <motion.div
            key={node._id}
            drag
            dragMomentum={false}
            onDragEnd={(e, info) => {
              const newX = node.x + info.offset.x;
              const newY = node.y + info.offset.y;
              updateNodePosition(node._id, newX, newY);
              // Update local state immediately
              setNodes(prev => prev.map(n => n._id === node._id ? { ...n, x: newX, y: newY } : n));
            }}
            initial={{ x: node.x, y: node.y }}
            className={`absolute w-40 p-4 rounded-2xl border cursor-pointer select-none group ${
              node.is_core 
              ? 'bg-[var(--accent)] border-[var(--accent-light)] shadow-[0_0_20px_var(--accent-glow)]' 
              : 'bg-[var(--bg)] border-[var(--border)] hover:border-[var(--accent)]'
            }`}
            style={{ 
              left: 0, 
              top: 0,
              transform: `translate(${node.x}px, ${node.y}px)` 
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center">
                {node.is_core ? <Target className="w-4 h-4 text-white" /> : <Brain className="w-4 h-4 text-[var(--accent-light)]" />}
              </div>
              {!node.is_core && getStatusIcon(node.status)}
            </div>
            <p className={`font-semibold truncate ${node.is_core ? 'text-white' : 'text-[var(--text)]'}`}>
              {node.label}
            </p>
            <p className={`text-[10px] uppercase tracking-widest mt-1 ${node.is_core ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
              {node.is_core ? 'Core Strategy' : 'Brain Node'}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Floating Instructions */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full text-xs text-[var(--text-secondary)] border border-[var(--border)]">
        Drag nodes to rearrange. Core nodes are interconnected automatically.
      </div>
    </div>
  );
}

function Brain(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z" />
    </svg>
  );
}
