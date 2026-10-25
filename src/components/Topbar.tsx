'use client';

import React from 'react';
import { useCompany } from '@/contexts/CompanyContext';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMobileToggle: () => void;
}

export default function Topbar({ title, subtitle, onMobileToggle }: TopbarProps) {
  const { companies, activeCompany, setActiveCompanyId } = useCompany();

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-slate-200/80 sticky top-0 z-20 backdrop-blur-md bg-[#F4F6FB]/90">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger */}
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors flex-shrink-0"
          aria-label="Open navigation"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="min-w-0">
          <h2 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-none truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 hidden sm:block truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Multi-Company Workspace Selector */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <select
            value={activeCompany?.id || 'All'}
            onChange={(e) => setActiveCompanyId(e.target.value === 'All' ? null : e.target.value)}
            className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[190px] truncate"
            title="Switch Workspace Company"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
            <option value="All">All Companies (Global View)</option>
          </select>
        </div>

        {/* Date badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/70 text-xs font-medium text-slate-600 shadow-2xs">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{todayStr}</span>
        </div>
      </div>
    </header>
  );
}
