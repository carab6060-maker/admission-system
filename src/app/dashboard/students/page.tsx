'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import PrintModal, { StudentRecord } from '@/components/PrintModal';

export default function StudentsPage() {
  const searchParams = useSearchParams();
  const initialSearchParam = searchParams.get('search') || '';

  const { showToast } = useToast();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearchParam);
  const [selectedGender, setSelectedGender] = useState<'All' | 'Male' | 'Female'>('All');

  // Modals state
  const [viewStudent, setViewStudent] = useState<StudentRecord | null>(null);
  const [editStudent, setEditStudent] = useState<StudentRecord | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<StudentRecord | null>(null);
  const [printStudent, setPrintStudent] = useState<StudentRecord | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<Partial<StudentRecord>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch students with search
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/students?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setStudents(data.data || []);
    } catch {
      showToast('Error loading student records', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  // Open Edit Modal
  const openEditModal = (student: StudentRecord) => {
    setEditStudent(student);
    setEditForm({
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      gender: student.gender,
      date_of_birth: student.date_of_birth ? student.date_of_birth.slice(0, 10) : '',
      phone: student.phone,
      email: student.email || '',
      address: student.address,
      photo_url: student.photo_url || '',
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

  const totalCount = students.length;
  const maleCount = useMemo(
    () => students.filter((s) => (s.gender || '').toLowerCase() === 'male').length,
    [students]
  );
  const femaleCount = useMemo(
    () => students.filter((s) => (s.gender || '').toLowerCase() === 'female').length,
    [students]
  );

  const filteredStudents = useMemo(() => {
    if (selectedGender === 'All') return students;
    return students.filter(
      (s) => (s.gender || '').toLowerCase() === selectedGender.toLowerCase()
    );
  }, [students, selectedGender]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#161938] tracking-tight">
            Registered Students
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage student records, view profiles, and print official slips
          </p>
        </div>

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

      {/* Filter and Search Bar */}
      <div className="card-base p-4 bg-white space-y-3">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by first, middle, or last name, phone, email, or address..."
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

        {/* Quick Gender Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedGender('All')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedGender === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Students ({totalCount})
            </button>
            <button
              onClick={() => setSelectedGender('Male')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedGender === 'Male'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Male ({maleCount})
            </button>
            <button
              onClick={() => setSelectedGender('Female')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                selectedGender === 'Female'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              Female ({femaleCount})
            </button>
          </div>

          <span className="text-slate-400 font-normal">
            Showing {filteredStudents.length} record{filteredStudents.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Students Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Student Name</th>
                <th className="py-3 px-5">Gender</th>
                <th className="py-3 px-5">Contact (Phone & Email)</th>
                <th className="py-3 px-5">Address</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="spinner mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Loading students...</p>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const studentFullName = `${student.first_name} ${student.middle_name} ${student.last_name}`;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name */}
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
                              {student.first_name[0]}{student.last_name[0]}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-900 leading-snug">
                              {studentFullName}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              DOB: {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="py-3.5 px-5 font-medium text-slate-800">
                        {student.gender}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-5">
                        <div className="text-xs font-semibold text-slate-800">{student.phone}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{student.email || 'No email'}</div>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-5 text-xs text-slate-600 max-w-[220px] truncate" title={student.address}>
                        {student.address}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
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

                          {/* Print */}
                          <button
                            type="button"
                            onClick={() => setPrintStudent(student)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Print Official Slip"
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                    No students found matching your search.
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
        title={viewStudent ? `Student File: ${viewStudent.first_name} ${viewStudent.last_name}` : 'Student Details'}
        size="md"
      >
        {viewStudent && (
          <div className="space-y-6 text-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/80 gap-4">
              <div className="flex items-center gap-4">
                {viewStudent.photo_url ? (
                  <img
                    src={viewStudent.photo_url}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover border border-slate-300"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                    {viewStudent.first_name[0]}{viewStudent.last_name[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-[#161938]">
                    {viewStudent.first_name} {viewStudent.middle_name} {viewStudent.last_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Registered: {viewStudent.created_at ? new Date(viewStudent.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  {viewStudent.gender}
                </span>
              </div>
            </div>

            {/* Information Grid */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                Student Profile & Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">First Name:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.first_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Middle Name:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.middle_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Last Name:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.last_name}</p>
                </div>
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
                  <span className="text-slate-400">Phone Number:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.phone}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Email Address:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.email || 'None'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Residential Address:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewStudent.address}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
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
        title={editStudent ? `Edit Student: ${editStudent.first_name} ${editStudent.last_name}` : 'Edit Student'}
        size="md"
      >
        {editStudent && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  First Name *
                </label>
                <input
                  type="text"
                  value={editForm.first_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Middle Name *
                </label>
                <input
                  type="text"
                  value={editForm.middle_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={editForm.last_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
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
                  Phone *
                </label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              <div className="sm:col-span-3">
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
                  Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={editForm.photo_url || ''}
                  onChange={(e) => setEditForm({ ...editForm, photo_url: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
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
        message={`Are you sure you want to permanently delete student ${deleteStudent?.first_name} ${deleteStudent?.last_name} from the database? This action cannot be undone.`}
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
