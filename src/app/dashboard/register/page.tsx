'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import PrintModal, { StudentRecord } from '@/components/PrintModal';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

const initialFormData = {
  first_name: '',
  middle_name: '',
  last_name: '',
  gender: 'Male',
  date_of_birth: '',
  phone: '',
  email: '',
  address: '',
  photo_url: '',
  company_id: '',
};

export default function StudentRegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { companies, activeCompany } = useCompany();

  const [form, setForm] = useState({
    ...initialFormData,
    company_id: user?.companyId || activeCompany?.id || (companies.length > 0 ? companies[0].id : ''),
  });

  // Keep company_id updated if activeCompany changes initially
  useEffect(() => {
    if (user && user.role !== 'superadmin' && user.companyId) {
      setForm((prev) => ({ ...prev, company_id: user.companyId! }));
    } else if (activeCompany && (!form.company_id || form.company_id === 'All')) {
      setForm((prev) => ({ ...prev, company_id: activeCompany.id }));
    } else if (companies.length > 0 && !form.company_id) {
      setForm((prev) => ({ ...prev, company_id: companies[0].id }));
    }
  }, [user, activeCompany, companies, form.company_id]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [savedStudent, setSavedStudent] = useState<StudentRecord | null>(null);

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

  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.middle_name.trim()) errs.middle_name = 'Middle name is required';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required';
    if (!form.gender.trim()) errs.gender = 'Gender is required';
    if (!form.date_of_birth) errs.date_of_birth = 'Date of birth is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.address.trim()) errs.address = 'Residential address is required';

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email address format';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please fix the highlighted errors before saving', 'error');
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
        const studentName = `${data.data.first_name} ${data.data.last_name}`;
        showToast(`Student ${studentName} registered successfully!`, 'success');
        setSavedStudent(data.data);
      } else {
        showToast(data.error || 'Failed to register student', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Network error while registering student', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear the form?')) {
      setForm(initialFormData);
      setErrors({});
      setCalculatedAge(null);
      showToast('Form has been cleared', 'info');
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/students');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#161938] tracking-tight">
            Student Admission Form
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Fill in student biographical details and contact information
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
      <form onSubmit={handleSave} className="card-base p-6 sm:p-8 bg-white space-y-6">
        <div>
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h2 className="text-base font-bold text-[#161938]">Student Information</h2>
            <p className="text-xs text-slate-500">Provide legal name, contact details, and residence</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Institution / Company */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Enrolling Institution / School *
              </label>
              {user?.role === 'superadmin' ? (
                <select
                  value={form.company_id}
                  onChange={(e) => setForm({ ...form, company_id: e.target.value })}
                  className="input-field font-semibold text-blue-700"
                  required
                >
                  {companies.length === 0 && <option value="">Loading institutions...</option>}
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - {c.address || 'Main Campus'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 font-semibold text-sm">
                  <span className="text-base">🏢</span>
                  <span>{activeCompany?.name || companies[0]?.name || 'Assigned Institution'} ({activeCompany?.code || companies[0]?.code || 'CODE'})</span>
                  <span className="text-xs font-normal text-blue-700 ml-auto">Locked to your school</span>
                </div>
              )}
            </div>

            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                First Name *
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="e.g. Amina"
                className={`input-field ${errors.first_name ? 'border-red-500' : ''}`}
                required
              />
              {errors.first_name && <p className="text-[11px] text-red-500 mt-1">{errors.first_name}</p>}
            </div>

            {/* Middle Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Middle Name *
              </label>
              <input
                type="text"
                value={form.middle_name}
                onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                placeholder="e.g. Ali"
                className={`input-field ${errors.middle_name ? 'border-red-500' : ''}`}
                required
              />
              {errors.middle_name && <p className="text-[11px] text-red-500 mt-1">{errors.middle_name}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Last Name *
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="e.g. Hassan"
                className={`input-field ${errors.last_name ? 'border-red-500' : ''}`}
                required
              />
              {errors.last_name && <p className="text-[11px] text-red-500 mt-1">{errors.last_name}</p>}
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

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Phone Number *
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

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
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

            {/* Photo URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Photo URL <span className="text-slate-400 font-normal">(Optional image link)</span>
              </label>
              <input
                type="url"
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                placeholder="https://example.com/photo.jpg"
                className="input-field"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                Residential Address *
              </label>
              <textarea
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="District, street, house number, or city"
                className={`input-field ${errors.address ? 'border-red-500' : ''}`}
                required
              />
              {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
            </div>
          </div>
        </div>

        {/* Buttons */}
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

      {/* Post Registration Confirmation */}
      {savedStudent && (
        <div className="card-base p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h3 className="font-bold text-emerald-950">
                  Student Enrolled: {savedStudent.first_name} {savedStudent.last_name}
                </h3>
                <p className="text-xs text-emerald-800">
                  Record has been saved in the database.
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
