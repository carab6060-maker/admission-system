'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMobileToggle: () => void;
}

export default function Topbar({ title, subtitle, onMobileToggle }: TopbarProps) {
  const { user, logout } = useAuth();
  const displayName = user?.fullName || user?.username || 'Administrator';
  const role = user?.role || 'Staff';

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="h-16 px-6 lg:px-8 flex items-center justify-between border-b border-slate-200/80 sticky top-0 z-20 backdrop-blur-md bg-[#F4F6FB]/85">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
          aria-label="Open navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Date badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 text-xs font-medium text-slate-600 shadow-2xs">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{todayStr}</span>
        </div>

        {/* Quick New Admission Button */}
        <Link
          href="/dashboard/register"
          className="btn-primary text-xs py-2 px-3.5 hidden sm:inline-flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Admission</span>
        </Link>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
            {displayName[0] || 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-500 capitalize">
              {role}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
