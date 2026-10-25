'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import PrintModal, { StudentRecord } from '@/components/PrintModal';

interface DashboardData {
  stats: {
    totalStudents: number;
    newAdmissions: number;
    approvedApplications: number;
    pendingApplications: number;
    rejectedApplications: number;
  };
  recentStudents: StudentRecord[];
  gradeDistribution: { grade_applying: string; count: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [printStudent, setPrintStudent] = useState<StudentRecord | null>(null);

  const { showToast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      const json = await res.json();
      setData(json);
    } catch {
      showToast('Failed to refresh dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

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
    approvedApplications: 0,
    pendingApplications: 0,
    rejectedApplications: 0,
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
      label: 'APPROVED APPLICATIONS',
      value: stats.approvedApplications,
      borderClass: 'border-l-emerald-500',
      icon: (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'PENDING APPLICATIONS',
      value: stats.pendingApplications,
      borderClass: 'border-l-amber-500',
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            Admissions Overview
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time enrollment statistics and application workflow status
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
              Newly submitted student admission forms and their current review status
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
                <th className="py-3 px-5">Student ID</th>
                <th className="py-3 px-5">Student Name</th>
                <th className="py-3 px-5">Class / Grade</th>
                <th className="py-3 px-5">Parent / Contact</th>
                <th className="py-3 px-5">Admission Date</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.recentStudents && data.recentStudents.length > 0 ? (
                data.recentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-blue-600">
                      {student.student_id}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{student.full_name}</div>
                      <span className="text-[11px] text-slate-400 capitalize">{student.gender}</span>
                    </td>
                    <td className="py-3.5 px-5 font-medium text-slate-800">
                      {student.grade_applying}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="text-xs text-slate-800 font-medium">{student.parent_name}</div>
                      <span className="text-[11px] text-slate-500">{student.phone}</span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-600">
                      {student.admission_date
                        ? new Date(student.admission_date).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`badge ${
                          student.status === 'Approved'
                            ? 'badge-approved'
                            : student.status === 'Rejected'
                            ? 'badge-rejected'
                            : 'badge-pending'
                        }`}
                      >
                        {student.status}
                      </span>
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
                          href={`/dashboard/students?search=${encodeURIComponent(student.student_id)}`}
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    No student registrations found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Distribution Overview */}
      {data?.gradeDistribution && data.gradeDistribution.length > 0 && (
        <div className="card-base p-6">
          <h3 className="text-sm font-bold text-[#161938] uppercase tracking-wider mb-4">
            Class / Grade Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {data.gradeDistribution.map((item, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center"
              >
                <p className="text-xs font-semibold text-slate-600 truncate">{item.grade_applying}</p>
                <p className="text-xl font-bold text-[#161938] mt-1">{item.count}</p>
                <span className="text-[10px] text-slate-400">Enrolled</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Printable Slip Modal */}
      <PrintModal
        isOpen={Boolean(printStudent)}
        onClose={() => setPrintStudent(null)}
        student={printStudent}
      />
    </div>
  );
}
