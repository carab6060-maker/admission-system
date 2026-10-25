'use client';

import React from 'react';
import Modal from './Modal';

export interface PaymentRecord {
  id: string;
  receipt_no: string;
  student_id: string;
  amount: number;
  fee_type: string;
  payment_method: string;
  payment_date: string;
  reference_no?: string | null;
  notes?: string | null;
  created_at: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  student_phone?: string;
  student_email?: string | null;
  student_address?: string;
  student_photo?: string | null;
  company_id?: string | null;
  company_name?: string | null;
  company_code?: string | null;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
}

export default function ReceiptModal({ isOpen, onClose, payment }: ReceiptModalProps) {
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const fullName = `${payment.first_name} ${payment.middle_name} ${payment.last_name}`.trim();

  const formattedDate = payment.payment_date
    ? new Date(payment.payment_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Payment Receipt" size="md">
      <div className="space-y-6">
        {/* Top Action Bar (hidden when printing) */}
        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 no-print">
          <p className="text-xs text-slate-600 font-medium">
            Formatted for official printing and high-resolution receipt export.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 text-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                {payment.company_code ? payment.company_code.slice(0, 3) : 'EA'}
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#161938]">
                  {payment.company_name || 'EduAdmit Academy'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Finance & Accounts Department {payment.company_code ? `(${payment.company_code})` : ''}
                </p>
                <p className="text-[11px] text-slate-400">
                  Official Payment Voucher & Acknowledgement
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 uppercase tracking-wider">
                Paid in Full
              </span>
              <p className="text-xs font-mono font-bold text-slate-900 mt-2">
                {payment.receipt_no}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Date: {formattedDate}
              </p>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Received From (Student Details)
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Student Name:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{fullName}</p>
              </div>
              <div>
                <span className="text-slate-400">Phone Number:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{payment.student_phone || 'N/A'}</p>
              </div>
              {payment.student_email && (
                <div>
                  <span className="text-slate-400">Email:</span>
                  <p className="font-medium text-slate-700 mt-0.5">{payment.student_email}</p>
                </div>
              )}
              {payment.student_address && (
                <div>
                  <span className="text-slate-400">Address:</span>
                  <p className="font-medium text-slate-700 mt-0.5 truncate">{payment.student_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Fee Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Fee Item / Purpose</th>
                  <th className="py-2.5 px-4">Payment Method</th>
                  <th className="py-2.5 px-4">Reference / TXN</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {payment.fee_type}
                    {payment.notes && (
                      <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                        {payment.notes}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                      {payment.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {payment.reference_no || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ${Number(payment.amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase text-slate-600 text-[11px]">
                    Total Amount Paid:
                  </td>
                  <td className="py-3 px-4 text-right text-base text-blue-700 font-extrabold">
                    ${Number(payment.amount).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signature / Validation Footer */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs">
            <div>
              <p className="text-slate-400 mb-6">Student / Depositor Signature:</p>
              <div className="border-b border-slate-300 w-44" />
            </div>
            <div className="text-right">
              <p className="text-slate-400 mb-6">Authorized Finance Officer & Stamp:</p>
              <div className="border-b border-slate-300 w-44 ml-auto" />
            </div>
          </div>

          <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-slate-100">
            Thank you for your payment. Please retain this official receipt for your academic records.
          </div>
        </div>
      </div>
    </Modal>
  );
}
