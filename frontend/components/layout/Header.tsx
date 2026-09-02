'use client';

import React from 'react';
import { useAuth } from '../../context/auth-context';
import { Button } from '../ui/Button';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-20 border-b border-[var(--border)] bg-[var(--card)] px-8 md:px-12 flex items-center justify-between sticky top-0 z-20 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-base md:text-lg font-black text-[var(--foreground)] tracking-tight">
          Executive Performance Management
        </h2>
      </div>

      <div className="flex items-center gap-5">
        {/* User profile capsule */}
        {user && (
          <div className="flex items-center gap-3.5 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full border border-[var(--border)] shadow-xs">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user.first_name[0]}
              {user.last_name[0]}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-[var(--foreground)] leading-tight">
                {user.first_name} {user.last_name}
              </div>
              <div className="text-[10px] text-[var(--muted)] font-medium leading-tight">
                {user.department || user.role}
              </div>
            </div>
          </div>
        )}

        {/* Logout button */}
        <Button variant="ghost" size="sm" onClick={logout} className="px-4 py-2 text-xs font-semibold">
          Sign Out
        </Button>
      </div>
    </header>
  );
}
