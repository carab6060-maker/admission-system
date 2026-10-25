'use client';

import React from 'react';
import Modal from './Modal';

export interface StudentRecord {
  id: string;
  student_id: string;
  full_name: string;
  gender: string;
  date_of_birth: string;
  phone: string;
  parent_name: string;
  parent_phone: string;
  email?: string | null;
  address: string;
  grade_applying: string;
  previous_school?: string | null;
  admission_date: string;
  photo_url?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
}

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord | null;
}

export default function PrintModal({ isOpen, onClose, student }: PrintModalProps) {
  if (!student) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDob = student.date_of_birth
    ? new Date(student.date_of_birth).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const formattedAdmDate = student.admission_date
    ? new Date(student.admission_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admission Record & Printable Slip" size="lg">
      <div className="space-y-6">
        {/* Actions bar at top (hidden during print) */}
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 no-print">
          <p className="text-xs text-slate-600 font-medium">
            This official admission slip is formatted for high-resolution print or PDF export.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs py-1.5 px-3">
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        {/* Printable Slip Container */}
        <div
          id="printable-admission-slip"
          className="bg-white border-2 border-slate-300 rounded-2xl p-8 text-slate-800 shadow-sm print:border-black print:p-6"
        >
          {/* Header */}
          <div className="border-b-2 border-slate-200 pb-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#161938] text-white flex items-center justify-center font-bold text-2xl shadow-md">
                🎓
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#161938]">
                  HORIZON ACADEMY ADMISSION SYSTEM
                </h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                  Official Student Registration & Admission Slip
                </p>
                <p className="text-[11px] text-slate-400">
                  Affiliated Academic Institute • Ref: {student.student_id}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  student.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : student.status === 'Rejected'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {student.status}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Issued: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Student Photo and Top Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 pb-6 border-b border-slate-100">
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={student.full_name}
                  className="w-28 h-28 object-cover rounded-xl border-2 border-slate-300"
                />
              ) : (
                <div className="w-28 h-28 bg-blue-100 text-blue-700 flex flex-col items-center justify-center rounded-xl border-2 border-blue-200 font-bold text-2xl uppercase">
                  {student.full_name.slice(0, 2)}
                  <span className="text-[10px] text-blue-500 font-normal tracking-normal mt-1">Student</span>
                </div>
              )}
              <span className="mt-2 text-xs font-mono font-bold text-[#161938] bg-white px-2 py-0.5 rounded border border-slate-200">
                {student.student_id}
              </span>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-400">Student Full Name</span>
                <p className="text-base font-bold text-slate-900 mt-0.5">{student.full_name}</p>
              </div>

              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-400">Grade / Class Applying For</span>
                <p className="text-base font-bold text-blue-600 mt-0.5">{student.grade_applying}</p>
              </div>

              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-400">Gender</span>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{student.gender}</p>
              </div>

              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-400">Date of Birth</span>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{formattedDob}</p>
              </div>

              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-400">Student Phone</span>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{student.phone}</p>
              </div>

              <div>
                <span className="text-[11px] uppercase font-semibold text-slate-400">Email Address</span>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{student.email || 'None provided'}</p>
              </div>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 border-b border-slate-200 pb-1">
                Parent & Guardian Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-slate-500">Parent/Guardian Name:</span>
                  <p className="font-semibold text-slate-900">{student.parent_name}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Contact Number:</span>
                  <p className="font-semibold text-slate-900">{student.parent_phone}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Residential Address:</span>
                  <p className="text-slate-800">{student.address}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 border-b border-slate-200 pb-1">
                Academic & Admission Record
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-xs text-slate-500">Admission Date:</span>
                  <p className="font-semibold text-slate-900">{formattedAdmDate}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Previous School:</span>
                  <p className="text-slate-800">{student.previous_school || 'First Time Enrollment / None'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Remarks / Notes:</span>
                  <p className="text-slate-700 text-xs italic">{student.notes || 'No special remarks recorded.'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures & Seal Footer */}
          <div className="mt-8 pt-8 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="h-12 border-b border-dashed border-slate-400"></div>
              <p className="text-xs font-bold text-slate-700 mt-2">Parent / Guardian Signature</p>
              <p className="text-[10px] text-slate-400">Date: _______________</p>
            </div>

            <div>
              <div className="h-12 border-b border-dashed border-slate-400 flex items-end justify-center pb-1">
                <span className="text-[11px] font-mono text-slate-500">[ OFFICIAL ADMISSION STAMP ]</span>
              </div>
              <p className="text-xs font-bold text-slate-700 mt-2">Registrar Official Seal</p>
              <p className="text-[10px] text-slate-400">Institution Verification</p>
            </div>

            <div>
              <div className="h-12 border-b border-dashed border-slate-400"></div>
              <p className="text-xs font-bold text-slate-700 mt-2">Admissions Director</p>
              <p className="text-[10px] text-slate-400">Approved Authority</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
