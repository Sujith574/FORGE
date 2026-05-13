'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Zap, 
  LayoutDashboard, 
  FileText, 
  Inbox, 
  MessageSquare, 
  Settings, 
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Brain Map', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Documents', icon: FileText, path: '/dashboard/documents' },
    { name: 'Decision Inbox', icon: Inbox, path: '/dashboard/logs' },
    { name: 'War Room', icon: MessageSquare, path: '/dashboard/warroom' },
  ];

  return (
    <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-[var(--surface)] border-r border-[var(--border)]">
        <div className="h-20 flex items-center px-8 border-b border-[var(--border)]">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="text-[var(--accent)] w-6 h-6" />
            <span className="text-xl font-display font-bold text-white">FORGE</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all group ${
                pathname === item.path 
                ? 'bg-[var(--accent)]/10 text-[var(--accent-light)]' 
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </div>
              {pathname === item.path && (
                <motion.div layoutId="activeNav" className="w-1.5 h-1.5 rounded-full bg-[var(--accent-light)]" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[var(--accent)] to-[var(--accent-light)] flex items-center justify-center font-bold text-white">
              {user?.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user?.company_name}</p>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--error)]/5 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header Mobile */}
        <header className="lg:hidden h-16 flex items-center justify-between px-6 bg-[var(--surface)] border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Zap className="text-[var(--accent)] w-5 h-5" />
            <span className="text-lg font-display font-bold text-white">FORGE</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6 text-white" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-dot">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-80 bg-[var(--surface)] z-[70] lg:hidden flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Zap className="text-[var(--accent)] w-5 h-5" />
                  <span className="text-lg font-display font-bold text-white">FORGE</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              <nav className="flex-1 p-6 space-y-4">
                {navItems.map((item) => (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 p-4 rounded-xl text-lg ${
                      pathname === item.path ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
