'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import PrintModal, { StudentRecord } from '@/components/PrintModal';

const initialFormData = {
  student_id: '',
  full_name: '',
  gender: 'Male',
  date_of_birth: '',
  phone: '',
  parent_name: '',
  parent_phone: '',
  email: '',
  address: '',
  grade_applying: 'Grade 1',
  previous_school: '',
  admission_date: new Date().toISOString().slice(0, 10),
  photo_url: '',
  status: 'Pending',
  notes: '',
};

export default function StudentRegistrationPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState(initialFormData);
  const [loadingId, setLoadingId] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [savedStudent, setSavedStudent] = useState<StudentRecord | null>(null);

  // Load next student ID
  const fetchNextId = async () => {
    try {
      setLoadingId(true);
      const res = await fetch('/api/students/next-id');
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, student_id: data.nextId }));
      }
    } catch (err) {
      console.error('Error getting next ID:', err);
    } finally {
      setLoadingId(false);
    }
  };

  useEffect(() => {
    fetchNextId();
  }, []);

  // Update calculated age when date_of_birth changes
  const handleDobChange = (dobStr: string) => {
    setForm((prev) => ({ ...prev, date_of_birth: dobStr }));
    if (!dobStr) {
      setCalculatedAge(null);
      return;
    }
    const dob = new Date(dobStr);
    if (!isNaN(dob.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      setCalculatedAge(age >= 0 ? age : null);
    } else {
      setCalculatedAge(null);
    }
  };

  // Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!form.student_id.trim()) errs.student_id = 'Student ID is required';
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.gender.trim()) errs.gender = 'Gender is required';
    if (!form.date_of_birth) errs.date_of_birth = 'Date of birth is required';
    if (!form.phone.trim()) errs.phone = 'Student phone number is required';
    if (!form.parent_name.trim()) errs.parent_name = 'Parent/Guardian name is required';
    if (!form.parent_phone.trim()) errs.parent_phone = 'Parent/Guardian phone is required';
    if (!form.grade_applying.trim()) errs.grade_applying = 'Grade applying for is required';
    if (!form.address.trim()) errs.address = 'Residential address is required';
    if (!form.admission_date) errs.admission_date = 'Admission date is required';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email address format';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the highlighted form errors before saving', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(`Student ${data.data.student_id} registered successfully!`, 'success');
        setSavedStudent(data.data);
      } else {
        showToast(data.error || 'Failed to save student admission', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error while registering student', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Clear Form
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all form fields?')) {
      setForm({
        ...initialFormData,
        admission_date: new Date().toISOString().slice(0, 10),
      });
      setErrors({});
      setCalculatedAge(null);
      fetchNextId();
      showToast('Form has been cleared', 'info');
    }
  };

  // Cancel
  const handleCancel = () => {
    router.push('/dashboard/students');
  };

  const gradesList = [
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#161938] tracking-tight">
            Student Admission Form
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Register a new student application with comprehensive biographical & contact details
          </p>
        </div>

        <button
          type="button"
          onClick={handleCancel}
          className="btn-secondary text-xs self-start sm:self-auto"
        >
          Back to Students
        </button>
      </div>

      {/* Main Registration Card */}
      <form onSubmit={handleSave} className="card-base p-6 sm:p-8 bg-white space-y-8">
        {/* Section 1: Core Student Identification */}
        <div>
          <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#161938]">1. Student Identification</h2>
              <p className="text-xs text-slate-500">Auto-generated Student ID, full legal name, gender, and date of birth</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-200">
              Step 1 of 3
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {/* Student ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Student ID <span className="text-blue-600">(Auto-Generated)</span> *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  placeholder={loadingId ? 'Generating ID...' : 'e.g. STU-2026-0001'}
                  className={`input-field font-mono font-bold bg-slate-50 text-blue-700 ${
                    errors.student_id ? 'border-red-500' : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={fetchNextId}
                  className="absolute right-2 top-2 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                  title="Generate new ID"
                >
                  Regenerate
                </button>
              </div>
              {errors.student_id && <p className="text-[11px] text-red-500 mt-1">{errors.student_id}</p>}
            </div>

            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Full Name *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Enter student's full name"
                className={`input-field ${errors.full_name ? 'border-red-500' : ''}`}
                required
              />
              {errors.full_name && <p className="text-[11px] text-red-500 mt-1">{errors.full_name}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Gender *
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="input-field"
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Date of Birth *
                </label>
                {calculatedAge !== null && (
                  <span className="text-[11px] font-medium text-slate-500">
                    Age: <strong className="text-blue-600">{calculatedAge} yrs</strong>
                  </span>
                )}
              </div>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => handleDobChange(e.target.value)}
                className={`input-field ${errors.date_of_birth ? 'border-red-500' : ''}`}
                required
              />
              {errors.date_of_birth && <p className="text-[11px] text-red-500 mt-1">{errors.date_of_birth}</p>}
            </div>

            {/* Student Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Student Phone Number *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +252 61 5123456"
                className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                required
              />
              {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Optional Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Student Email <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="student@example.com"
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Optional Student Photo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Student Photo URL <span className="text-slate-400 font-normal">(Optional image link)</span>
              </label>
              <input
                type="url"
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                placeholder="https://example.com/photo.jpg"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Parent / Guardian Details */}
        <div>
          <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#161938]">2. Parent / Guardian Information</h2>
              <p className="text-xs text-slate-500">Emergency contact and primary residential address</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-200">
              Step 2 of 3
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Parent Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Parent / Guardian Name *
              </label>
              <input
                type="text"
                value={form.parent_name}
                onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                placeholder="Enter father / mother / guardian full name"
                className={`input-field ${errors.parent_name ? 'border-red-500' : ''}`}
                required
              />
              {errors.parent_name && <p className="text-[11px] text-red-500 mt-1">{errors.parent_name}</p>}
            </div>

            {/* Parent Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Parent / Guardian Phone Number *
              </label>
              <input
                type="tel"
                value={form.parent_phone}
                onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                placeholder="e.g. +252 61 9876543"
                className={`input-field ${errors.parent_phone ? 'border-red-500' : ''}`}
                required
              />
              {errors.parent_phone && <p className="text-[11px] text-red-500 mt-1">{errors.parent_phone}</p>}
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Residential Address *
              </label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street address, district, city, landmark"
                className={`input-field ${errors.address ? 'border-red-500' : ''}`}
                required
              />
              {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Academic Admission Details */}
        <div>
          <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#161938]">3. Academic & Admission Record</h2>
              <p className="text-xs text-slate-500">Grade applying for, prior education, and admission status</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full border border-blue-200">
              Step 3 of 3
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {/* Class / Grade Applying For */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Class / Grade Applying For *
              </label>
              <select
                value={form.grade_applying}
                onChange={(e) => setForm({ ...form, grade_applying: e.target.value })}
                className="input-field font-semibold text-blue-700"
                required
              >
                {gradesList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Admission Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Admission Date *
              </label>
              <input
                type="date"
                value={form.admission_date}
                onChange={(e) => setForm({ ...form, admission_date: e.target.value })}
                className="input-field"
                required
              />
            </div>

            {/* Initial Admission Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Initial Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field font-medium"
              >
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Previous School */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Previous School <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={form.previous_school}
                onChange={(e) => setForm({ ...form, previous_school: e.target.value })}
                placeholder="Name of last school attended"
                className="input-field"
              />
            </div>

            {/* Additional Remarks / Notes */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Admission Remarks / Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Special medical considerations, transport requirements, or admission notes"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons: Save Student, Clear Form, Cancel */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-sm font-semibold transition-colors"
          >
            Clear Form
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto btn-primary text-sm shadow-md flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Student...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Student</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Post-Registration Success Dialog with Print Option */}
      {savedStudent && (
        <div className="card-base p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-emerald-950">
                  Student Successfully Enrolled: {savedStudent.full_name} ({savedStudent.student_id})
                </h3>
                <p className="text-xs text-emerald-800">
                  Record has been saved in the live database. You can print the official admission slip now.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSavedStudent(null)}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100/50"
              >
                Register Another
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/students')}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100/50"
              >
                View in Directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Slip Modal */}
      <PrintModal
        isOpen={Boolean(savedStudent)}
        onClose={() => setSavedStudent(null)}
        student={savedStudent}
      />
    </div>
  );
}
