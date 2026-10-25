'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function LoginPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('carab6848@gmail.com');
  const [password, setPassword] = useState('Moha0241');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const res = await login(usernameOrEmail, password);

    if (res.success) {
      showToast('Login successful! Welcome back.', 'success');
      router.push('/dashboard');
    } else {
      showToast(res.error || 'Invalid credentials', 'error');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 p-8 sm:p-10 animate-fadeIn relative z-10">
        
        {/* Brand Header with FTC Logo */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="relative w-24 h-24 mb-3.5 rounded-full p-1 bg-white shadow-xl shadow-blue-900/15 border-2 border-blue-500/30 ring-4 ring-blue-50 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform duration-300">
            <img
              src="/logo.jpg"
              alt="Flight Training Centre Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h1 className="text-2xl font-black text-[#161938] tracking-tight">
            Flight Training Centre
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 mt-1.5 rounded-full bg-blue-50 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Admission & Student Portal
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-2 max-w-[280px]">
            Sign in with your institutional credentials to manage your admissions
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Username or Email
            </label>
            <input
              id="identifier"
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              placeholder="e.g. admin or carab"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 rounded-xl text-sm font-semibold tracking-wide shadow-md"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </div>
        </form>

        {/* Credentials Note & Quick Fill */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Quick Credentials / Demo Access
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setUsernameOrEmail('carab6848@gmail.com');
                setPassword('Moha0241');
              }}
              className="w-full text-left p-2.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100/90 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-blue-900">Flight Training Centre</p>
                <p className="text-[11px] text-blue-600 font-mono">carab6848@gmail.com</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                School Admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUsernameOrEmail('carab');
                setPassword('admin123');
              }}
              className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold text-slate-700">Root Super Admin</p>
                <p className="text-[11px] text-slate-400 font-mono">carab (admin123)</p>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                Super Admin
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
