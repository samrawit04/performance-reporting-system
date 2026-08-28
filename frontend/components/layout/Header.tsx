'use client';

import React from 'react';
import { useAuth } from '../../context/auth-context';
import { Button } from '../ui/Button';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--card)] px-8 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-[var(--foreground)]">
          Executive Performance Management
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* User profile capsule */}
        {user && (
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-[var(--border)]">
            <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center">
              {user.first_name[0]}
              {user.last_name[0]}
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-[var(--foreground)] leading-tight">
                {user.first_name} {user.last_name}
              </div>
              <div className="text-[10px] text-[var(--muted)] leading-tight">
                {user.department || user.role}
              </div>
            </div>
          </div>
        )}

        {/* Logout button */}
        <Button variant="ghost" size="sm" onClick={logout}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
