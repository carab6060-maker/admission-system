'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import PrintModal, { StudentRecord } from '@/components/PrintModal';

const gradesList = [
  'All',
  'Kindergarten',
  'Pre-K',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

const statusesList = ['All', 'Pending', 'Approved', 'Rejected'];

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get('status') || 'All';
  const initialSearchParam = searchParams.get('search') || '';

  const { showToast } = useToast();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearchParam);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState(initialStatusParam);

  // Modals state
  const [viewStudent, setViewStudent] = useState<StudentRecord | null>(null);
  const [editStudent, setEditStudent] = useState<StudentRecord | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<StudentRecord | null>(null);
  const [printStudent, setPrintStudent] = useState<StudentRecord | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<StudentRecord>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch students with search & filters
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedGrade !== 'All') params.set('grade', selectedGrade);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);

      const res = await fetch(`/api/students?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setStudents(data.data || []);
    } catch {
      showToast('Error loading student records', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedGrade, selectedStatus, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  // Quick Status Update
  const handleStatusChange = async (student: StudentRecord, newStatus: string) => {
    try {
      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();

      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, status: newStatus } : s))
      );

      if (viewStudent && viewStudent.id === student.id) {
        setViewStudent({ ...viewStudent, status: newStatus });
      }

      showToast(`Status updated to ${newStatus} for ${student.full_name}`, 'success');
    } catch {
      showToast('Could not update application status', 'error');
    }
  };

  // Open Edit Modal
  const openEditModal = (student: StudentRecord) => {
    setEditStudent(student);
    setEditForm({
      student_id: student.student_id,
      full_name: student.full_name,
      gender: student.gender,
      date_of_birth: student.date_of_birth ? student.date_of_birth.slice(0, 10) : '',
      phone: student.phone,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      email: student.email || '',
      address: student.address,
      grade_applying: student.grade_applying,
      previous_school: student.previous_school || '',
      admission_date: student.admission_date ? student.admission_date.slice(0, 10) : '',
      photo_url: student.photo_url || '',
      status: student.status,
      notes: student.notes || '',
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/students/${editStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (res.ok) {
        setStudents((prev) =>
          prev.map((s) => (s.id === editStudent.id ? data.data : s))
        );
        showToast('Student information updated successfully', 'success');
        setEditStudent(null);
      } else {
        showToast(data.error || 'Failed to update student', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating student', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Student
  const handleDeleteConfirm = async () => {
    if (!deleteStudent) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/students/${deleteStudent.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== deleteStudent.id));
        showToast(data.message || 'Student deleted successfully', 'success');
        setDeleteStudent(null);
      } else {
        showToast(data.error || 'Failed to delete student', 'error');
      }
    } catch {
      showToast('Network error while deleting student', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Calculate status counts
  const totalCount = students.length;
  const approvedCount = students.filter((s) => s.status === 'Approved').length;
  const pendingCount = students.filter((s) => s.status === 'Pending').length;
  const rejectedCount = students.filter((s) => s.status === 'Rejected').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#161938] tracking-tight">
            Registered Students
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage applications, review status, view candidate dossiers, and print slips
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/register"
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Register New Student</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-base p-4 bg-white space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search box */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, ID, phone, or parent name..."
              className="input-field pl-9 pr-8"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs p-0.5 rounded"
              >
                ✕
              </button>
            )}
          </div>

          {/* Grade filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="input-field text-xs font-medium"
            >
              <option value="All">All Classes / Grades</option>
              {gradesList.filter((g) => g !== 'All').map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field text-xs font-medium"
            >
              <option value="All">All Admission Statuses</option>
              <option value="Pending">Pending Only</option>
              <option value="Approved">Approved Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Quick status pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedStatus('All')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedStatus === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setSelectedStatus('Approved')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedStatus === 'Approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setSelectedStatus('Pending')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedStatus === 'Pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setSelectedStatus('Rejected')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedStatus === 'Rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          <span className="text-slate-400 font-normal">
            Showing {students.length} record{students.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Main Students Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Student</th>
                <th className="py-3 px-5">Class / Grade</th>
                <th className="py-3 px-5">Parent / Contact</th>
                <th className="py-3 px-5">Admission Date</th>
                <th className="py-3 px-5">Status (Click to Change)</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="spinner mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Loading students...</p>
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student Info */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        {student.photo_url ? (
                          <img
                            src={student.photo_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {student.full_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 leading-snug">
                            {student.full_name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs font-bold text-blue-600">
                              {student.student_id}
                            </span>
                            <span className="text-[11px] text-slate-400">• {student.gender}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-5 font-medium text-slate-800">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                        {student.grade_applying}
                      </span>
                    </td>

                    {/* Parent info */}
                    <td className="py-3.5 px-5">
                      <div className="text-xs font-semibold text-slate-800">{student.parent_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{student.phone}</div>
                    </td>

                    {/* Admission date */}
                    <td className="py-3.5 px-5 text-xs text-slate-600">
                      {student.admission_date
                        ? new Date(student.admission_date).toLocaleDateString()
                        : '—'}
                    </td>

                    {/* Admission Status with inline staff dropdown */}
                    <td className="py-3.5 px-5">
                      <select
                        value={student.status}
                        onChange={(e) => handleStatusChange(student, e.target.value)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                          student.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : student.status === 'Rejected'
                            ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                            : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                        }`}
                        title="Click to update application status"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setViewStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Student Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => openEditModal(student)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Student Information"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Print Slip */}
                        <button
                          type="button"
                          onClick={() => setPrintStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Print Official Admission Slip"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteStudent(student)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Student"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    No students found matching your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Student Details Modal */}
      <Modal
        isOpen={Boolean(viewStudent)}
        onClose={() => setViewStudent(null)}
        title={viewStudent ? `Student File: ${viewStudent.full_name}` : 'Student Details'}
        size="lg"
      >
        {viewStudent && (
          <div className="space-y-6 text-slate-800">
            {/* Top overview banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80 gap-4">
              <div className="flex items-center gap-4">
                {viewStudent.photo_url ? (
                  <img
                    src={viewStudent.photo_url}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center">
                    {viewStudent.full_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-[#161938]">{viewStudent.full_name}</h3>
                  <p className="font-mono text-xs text-blue-600 font-semibold">{viewStudent.student_id}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Applying for: <strong className="text-slate-800">{viewStudent.grade_applying}</strong>
                  </p>
                </div>
              </div>

              {/* Status Switcher inside modal */}
              <div className="flex flex-col items-start sm:items-end gap-1">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Application Status
                </span>
                <select
                  value={viewStudent.status}
                  onChange={(e) => handleStatusChange(viewStudent, e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                    viewStudent.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : viewStudent.status === 'Rejected'
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-amber-50 text-amber-700 border-amber-300'
                  }`}
                >
                  <option value="Pending">Pending Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Biographical Details */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Student Biographical Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Gender:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.gender}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Date of Birth:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {viewStudent.date_of_birth ? new Date(viewStudent.date_of_birth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Student Phone:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Email Address:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.email || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Parent & Contact */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Parent / Guardian & Residence
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Parent / Guardian:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.parent_name}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Parent Contact Phone:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.parent_phone}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Residential Address:</span>
                    <p className="text-slate-800 mt-0.5">{viewStudent.address}</p>
                  </div>
                </div>
              </div>

              {/* Academic History */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Academic & Enrollment
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Class / Grade Applying:</span>
                    <p className="font-semibold text-blue-600 mt-0.5">{viewStudent.grade_applying}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Admission Date:</span>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {viewStudent.admission_date ? new Date(viewStudent.admission_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Previous School:</span>
                    <p className="text-slate-800 mt-0.5">{viewStudent.previous_school || 'First enrollment'}</p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Admission Notes & Record Meta
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400">Remarks:</span>
                    <p className="text-slate-700 italic mt-0.5">{viewStudent.notes || 'None recorded.'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Record Created:</span>
                    <p className="text-slate-500 mt-0.5">
                      {viewStudent.created_at ? new Date(viewStudent.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const s = viewStudent;
                  setViewStudent(null);
                  setPrintStudent(s);
                }}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Official Slip</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const s = viewStudent;
                    setViewStudent(null);
                    openEditModal(s);
                  }}
                  className="btn-secondary text-xs"
                >
                  Edit Student
                </button>
                <button
                  type="button"
                  onClick={() => setViewStudent(null)}
                  className="btn-primary text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Student Modal */}
      <Modal
        isOpen={Boolean(editStudent)}
        onClose={() => setEditStudent(null)}
        title={editStudent ? `Edit Student: ${editStudent.full_name}` : 'Edit Student'}
        size="lg"
      >
        {editStudent && (
          <form onSubmit={handleSaveEdit} className="space-y-5 text-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Student ID
                </label>
                <input
                  type="text"
                  value={editForm.student_id || ''}
                  disabled
                  className="input-field bg-slate-100 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.full_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Gender *
                </label>
                <select
                  value={editForm.gender || 'Male'}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={editForm.date_of_birth || ''}
                  onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Student Phone *
                </label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Parent / Guardian Name *
                </label>
                <input
                  type="text"
                  value={editForm.parent_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, parent_name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Parent Phone *
                </label>
                <input
                  type="tel"
                  value={editForm.parent_phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, parent_phone: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Class / Grade *
                </label>
                <select
                  value={editForm.grade_applying || 'Grade 1'}
                  onChange={(e) => setEditForm({ ...editForm, grade_applying: e.target.value })}
                  className="input-field"
                  required
                >
                  {gradesList.filter((g) => g !== 'All').map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Admission Date *
                </label>
                <input
                  type="date"
                  value={editForm.admission_date || ''}
                  onChange={(e) => setEditForm({ ...editForm, admission_date: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Admission Status
                </label>
                <select
                  value={editForm.status || 'Pending'}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="input-field font-semibold text-blue-600"
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Residential Address *
                </label>
                <textarea
                  rows={2}
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Previous School (Optional)
                </label>
                <input
                  type="text"
                  value={editForm.previous_school || ''}
                  onChange={(e) => setEditForm({ ...editForm, previous_school: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditStudent(null)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="btn-primary text-sm"
              >
                {savingEdit ? 'Saving Changes...' : 'Save Updates'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteStudent)}
        onClose={() => setDeleteStudent(null)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Student Deletion"
        message={`Are you sure you want to permanently delete student ${deleteStudent?.student_id} (${deleteStudent?.full_name}) from the database? This action cannot be undone.`}
        confirmText="Delete Student"
        cancelText="Keep Student"
        isDestructive={true}
        loading={deleting}
      />

      {/* Printable Slip Modal */}
      <PrintModal
        isOpen={Boolean(printStudent)}
        onClose={() => setPrintStudent(null)}
        student={printStudent}
      />
    </div>
  );
}
