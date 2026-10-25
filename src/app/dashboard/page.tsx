'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import PrintModal, { StudentRecord } from '@/components/PrintModal';
import { useCompany } from '@/contexts/CompanyContext';

interface DashboardData {
  stats: {
    totalStudents: number;
    newAdmissions: number;
    maleStudents: number;
    femaleStudents: number;
  };
  recentStudents: StudentRecord[];
}

export default function DashboardPage() {
  const { activeCompany } = useCompany();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printStudent, setPrintStudent] = useState<StudentRecord | null>(null);

  const { showToast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      const companyQuery = activeCompany ? `?company_id=${activeCompany.id}` : '';
      const res = await fetch(`/api/dashboard${companyQuery}`);
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      const json = await res.json();
      setData(json);
    } catch {
      showToast('Failed to refresh dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, activeCompany]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="spinner" />
      </div>
    );
  }

  const stats = data?.stats || {
    totalStudents: 0,
    newAdmissions: 0,
    maleStudents: 0,
    femaleStudents: 0,
  };

  const kpis = [
    {
      label: 'TOTAL STUDENTS',
      value: stats.totalStudents,
      borderClass: 'border-l-[#161938]',
      icon: (
        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'NEW ADMISSIONS',
      value: stats.newAdmissions,
      borderClass: 'border-l-blue-600',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
    {
      label: 'MALE STUDENTS',
      value: stats.maleStudents,
      borderClass: 'border-l-emerald-500',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: 'FEMALE STUDENTS',
      value: stats.femaleStudents,
      borderClass: 'border-l-purple-500',
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-7 animate-fadeIn">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#161938] tracking-tight">
            {activeCompany ? `${activeCompany.name} Overview` : 'Multi-Company Admissions Overview'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {activeCompany
              ? `Real-time student admissions and operations for ${activeCompany.name} (${activeCompany.code})`
              : 'Aggregated admissions and enrollment data across all registered companies'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="px-3.5 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-all"
            title="Refresh statistics"
          >
            <svg
              className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link
            href="/dashboard/register"
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Register Student</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`card-base p-5 border-l-4 ${kpi.borderClass} card-hover transition-all`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {kpi.label}
              </span>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                {kpi.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#161938] tracking-tight">
                {kpi.value.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Registrations Table Section */}
      <div className="card-base overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="text-base font-bold text-[#161938] tracking-tight">
              Recent Student Registrations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Newly registered students in the system
            </p>
          </div>
          <Link
            href="/dashboard/students"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All Students</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Student Name</th>
                <th className="py-3 px-5">Gender</th>
                <th className="py-3 px-5">Phone</th>
                <th className="py-3 px-5">Email</th>
                <th className="py-3 px-5">Address</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentStudents && data.recentStudents.length > 0 ? (
                data.recentStudents.map((student) => {
                  const studentFullName = `${student.first_name} ${student.middle_name} ${student.last_name}`;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900">{studentFullName}</div>
                        <span className="text-[11px] text-slate-400">
                          DOB: {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-800">
                        {student.gender}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-800 font-medium">
                        {student.phone}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-500">
                        {student.email || '-'}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-600 max-w-[200px] truncate" title={student.address}>
                        {student.address}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Print Admission Slip"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>
                          <Link
                            href={`/dashboard/students?search=${encodeURIComponent(student.first_name)}`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View in directory"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                    No student registrations found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Slip Modal */}
      <PrintModal
        isOpen={Boolean(printStudent)}
        onClose={() => setPrintStudent(null)}
        student={printStudent}
      />
    </div>
  );
}
