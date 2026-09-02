'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/auth-context';
import { UserRole } from '../../lib/types';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
  },
  {
    label: 'My Submissions',
    href: '/performance',
    icon: '📝',
    roles: ['MANAGER'],
  },
  {
    label: 'Weekly Update',
    href: '/performance/weekly',
    icon: '⏱️',
    roles: ['MANAGER'],
  },
  {
    label: 'Upload Excel',
    href: '/performance/upload',
    icon: '📥',
    roles: ['MANAGER'],
  },
  {
    label: 'Score History',
    href: '/history',
    icon: '📈',
    roles: ['MANAGER'],
  },
  {
    label: 'CEO Review Queue',
    href: '/review',
    icon: '⚖️',
    roles: ['REVIEWER'],
  },
  {
    label: 'Final Reports',
    href: '/reports',
    icon: '📄',
    roles: ['MANAGER', 'REVIEWER'],
  },
  {
    label: 'Compliance Tracker',
    href: '/compliance',
    icon: '🎯',
    roles: ['ADMIN'],
  },
  {
    label: 'User Management',
    href: '/users',
    icon: '👥',
    roles: ['ADMIN'],
  },
  {
    label: 'System Config',
    href: '/settings',
    icon: '⚙️',
    roles: ['ADMIN'],
  },
  {
    label: 'Audit Logs',
    href: '/audit',
    icon: '📜',
    roles: ['ADMIN'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user ? item.roles.includes(user.role) : false;
  });

  return (
    <aside className="w-64 border-r border-[var(--border)] bg-[var(--card)] flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-lg bg-[var(--primary-light)] flex items-center justify-center text-lg shrink-0">
          📈
        </div>
        <div className="overflow-hidden">
          <div className="font-bold text-sm text-[var(--foreground)] truncate">
            Performance RS
          </div>
          <div className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wider">
            Balanced Scorecard
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
          Main Menu
        </div>
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[var(--foreground)]'
              }`}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Role badge footer */}
      <div className="p-4 border-t border-[var(--border)] bg-slate-50/50 dark:bg-slate-900/50">
        <div className="text-xs text-[var(--muted)] mb-1">Signed in as:</div>
        <div className="text-xs font-semibold text-[var(--foreground)] truncate">
          {user?.first_name} {user?.last_name}
        </div>
        <div className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider bg-[var(--primary-light)] text-[var(--primary)]">
          {user?.role}
        </div>
      </div>
    </aside>
  );
}
