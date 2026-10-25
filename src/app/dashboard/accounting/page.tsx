'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import ReceiptModal, { PaymentRecord } from '@/components/ReceiptModal';
import { StudentRecord } from '@/components/PrintModal';
import { useCompany } from '@/contexts/CompanyContext';

interface Metrics {
  totalAmount: number;
  totalCount: number;
  todayAmount: number;
  monthAmount: number;
}

export default function AccountingPage() {
  const { activeCompany } = useCompany();
  const { showToast } = useToast();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalAmount: 0,
    totalCount: 0,
    todayAmount: 0,
    monthAmount: 0,
  });
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedFeeType, setSelectedFeeType] = useState('All');
  const [selectedMethod, setSelectedMethod] = useState('All');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [printPayment, setPrintPayment] = useState<PaymentRecord | null>(null);
  const [viewPayment, setViewPayment] = useState<PaymentRecord | null>(null);
  const [deletePayment, setDeletePayment] = useState<PaymentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  // Add Form state
  const [paymentForm, setPaymentForm] = useState({
    student_id: '',
    amount: '',
    fee_type: 'Admission Fee',
    payment_method: 'Zaad Service',
    payment_date: new Date().toISOString().slice(0, 10),
    reference_no: '',
    notes: '',
  });

  // Fetch payments
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedFeeType !== 'All') params.set('fee_type', selectedFeeType);
      if (selectedMethod !== 'All') params.set('payment_method', selectedMethod);
      if (activeCompany) params.set('company_id', activeCompany.id);

      const res = await fetch(`/api/payments?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load payment records');
      const data = await res.json();
      setPayments(data.data || []);
      if (data.metrics) setMetrics(data.metrics);
    } catch {
      showToast('Error loading financial payments', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedFeeType, selectedMethod, activeCompany, showToast]);

  // Fetch student list for dropdown
  const fetchStudents = useCallback(async () => {
    try {
      const q = activeCompany ? `?company_id=${activeCompany.id}` : '';
      const res = await fetch(`/api/students${q}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.data || []);
      }
    } catch {
      // silent
    }
  }, [activeCompany]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchPayments]);

  // Handle Save Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.student_id) {
      showToast('Please select a student', 'error');
      return;
    }
    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    setSavingPayment(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Payment recorded successfully!', 'success');
        setShowAddModal(false);
        setPaymentForm({
          student_id: '',
          amount: '',
          fee_type: 'Admission Fee',
          payment_method: 'Zaad Service',
          payment_date: new Date().toISOString().slice(0, 10),
          reference_no: '',
          notes: '',
        });
        fetchPayments();
        // Automatically offer to print receipt
        setPrintPayment(data.data);
      } else {
        showToast(data.error || 'Failed to record payment', 'error');
      }
    } catch {
      showToast('Network error while recording payment', 'error');
    } finally {
      setSavingPayment(false);
    }
  };

  // Handle Delete Payment
  const handleDeletePayment = async () => {
    if (!deletePayment) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/payments/${deletePayment.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Payment deleted successfully', 'success');
        setPayments((prev) => prev.filter((p) => p.id !== deletePayment.id));
        setDeletePayment(null);
        fetchPayments();
      } else {
        showToast(data.error || 'Failed to delete payment', 'error');
      }
    } catch {
      showToast('Error deleting payment record', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method.toLowerCase()) {
      case 'zaad service':
      case 'zaad':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'evc plus':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'edahab':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'bank transfer':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#161938] tracking-tight">
            Fee Payments & Accounting
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Collect student admission and tuition fees, issue receipts, and track revenue
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/reports"
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>View Financial Reports</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-base p-5 border-l-4 border-l-[#161938] card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL REVENUE
            </span>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#161938] tracking-tight">
            ${metrics.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">All-time collected fees</p>
        </div>

        <div className="card-base p-5 border-l-4 border-l-emerald-500 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              THIS MONTH
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
            ${metrics.monthAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Current calendar month</p>
        </div>

        <div className="card-base p-5 border-l-4 border-l-blue-600 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TODAY'S COLLECTIONS
            </span>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-blue-600 tracking-tight">
            ${metrics.todayAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Payments collected today</p>
        </div>

        <div className="card-base p-5 border-l-4 border-l-purple-500 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TRANSACTIONS
            </span>
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#161938] tracking-tight">
            {metrics.totalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Receipts recorded</p>
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
              placeholder="Search by student name, receipt #, TXN reference, or phone..."
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

          {/* Fee Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedFeeType}
              onChange={(e) => setSelectedFeeType(e.target.value)}
              className="input-field text-xs font-medium"
            >
              <option value="All">All Fee Types</option>
              <option value="Admission Fee">Admission Fee</option>
              <option value="Tuition Fee">Tuition Fee</option>
              <option value="Registration Fee">Registration Fee</option>
              <option value="Exam Fee">Exam Fee</option>
              <option value="ID & Books Fee">ID & Books Fee</option>
              <option value="Other">Other Fees</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="input-field text-xs font-medium"
            >
              <option value="All">All Payment Methods</option>
              <option value="Zaad Service">Zaad Service</option>
              <option value="EVC Plus">EVC Plus</option>
              <option value="Edahab">Edahab</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{payments.length}</strong> payment record{payments.length !== 1 ? 's' : ''}
          </span>
          {(search || selectedFeeType !== 'All' || selectedMethod !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedFeeType('All');
                setSelectedMethod('All');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Receipt No</th>
                <th className="py-3 px-5">Student Name</th>
                <th className="py-3 px-5">Fee Category</th>
                <th className="py-3 px-5">Amount</th>
                <th className="py-3 px-5">Payment Method</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">TXN / Reference</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="spinner mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Loading transactions...</p>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => {
                  const studentName = `${p.first_name} ${p.middle_name} ${p.last_name}`;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Receipt No */}
                      <td className="py-3.5 px-5 font-mono text-xs font-bold text-blue-600">
                        {p.receipt_no}
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {studentName}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {p.student_phone || 'No phone'}
                        </span>
                      </td>

                      {/* Fee Category */}
                      <td className="py-3.5 px-5 text-xs font-medium text-slate-800">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {p.fee_type}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-5 text-xs font-extrabold text-emerald-600">
                        ${Number(p.amount).toFixed(2)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${getMethodBadgeClass(p.payment_method)}`}>
                          {p.payment_method}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-5 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </td>

                      {/* Reference */}
                      <td className="py-3.5 px-5 text-xs font-mono text-slate-500">
                        {p.reference_no || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print Slip */}
                          <button
                            type="button"
                            onClick={() => setPrintPayment(p)}
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Print Official Receipt"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                          </button>

                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setViewPayment(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Payment Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeletePayment(p)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Payment Record"
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
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">
                    No payment records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Student Fee Payment"
        size="md"
      >
        <form onSubmit={handleSavePayment} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Select Student *
            </label>
            <select
              value={paymentForm.student_id}
              onChange={(e) => setPaymentForm({ ...paymentForm, student_id: e.target.value })}
              className="input-field font-medium"
              required
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.middle_name} {s.last_name} ({s.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Fee Category *
              </label>
              <select
                value={paymentForm.fee_type}
                onChange={(e) => setPaymentForm({ ...paymentForm, fee_type: e.target.value })}
                className="input-field"
                required
              >
                <option value="Admission Fee">Admission Fee</option>
                <option value="Tuition Fee">Tuition Fee</option>
                <option value="Registration Fee">Registration Fee</option>
                <option value="Exam Fee">Exam Fee</option>
                <option value="ID & Books Fee">ID & Books Fee</option>
                <option value="Other">Other Fee</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Amount (USD $) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="e.g. 150.00"
                className="input-field font-bold text-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Payment Method *
              </label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                className="input-field"
                required
              >
                <option value="Zaad Service">Zaad Service</option>
                <option value="EVC Plus">EVC Plus</option>
                <option value="Edahab">Edahab</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Payment Date *
              </label>
              <input
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Transaction / Reference Number (Optional)
            </label>
            <input
              type="text"
              value={paymentForm.reference_no}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference_no: e.target.value })}
              placeholder="e.g. Zaad TXN ID, Bank Slip #, or Receipt Ref"
              className="input-field font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Notes / Description (Optional)
            </label>
            <textarea
              rows={2}
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="Additional comments or remarks regarding this fee payment..."
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPayment}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {savingPayment ? (
                <>
                  <div className="spinner !w-3.5 !h-3.5" />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Save Payment & Issue Receipt</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Payment Details Modal */}
      <Modal
        isOpen={Boolean(viewPayment)}
        onClose={() => setViewPayment(null)}
        title={viewPayment ? `Payment Details: ${viewPayment.receipt_no}` : 'Payment Details'}
        size="md"
      >
        {viewPayment && (
          <div className="space-y-5 text-slate-800">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Receipt Number
                </span>
                <p className="text-lg font-mono font-bold text-blue-600">{viewPayment.receipt_no}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Amount Paid
                </span>
                <p className="text-xl font-extrabold text-emerald-600">
                  ${Number(viewPayment.amount).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400">Student Name:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {viewPayment.first_name} {viewPayment.middle_name} {viewPayment.last_name}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Student Phone:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{viewPayment.student_phone || '-'}</p>
              </div>
              <div>
                <span className="text-slate-400">Fee Category:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{viewPayment.fee_type}</p>
              </div>
              <div>
                <span className="text-slate-400">Payment Method:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{viewPayment.payment_method}</p>
              </div>
              <div>
                <span className="text-slate-400">Payment Date:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {new Date(viewPayment.payment_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Reference / TXN:</span>
                <p className="font-mono font-semibold text-slate-800 mt-0.5">
                  {viewPayment.reference_no || 'None'}
                </p>
              </div>
              {viewPayment.notes && (
                <div className="col-span-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Notes:</span>
                  <p className="text-slate-700 mt-0.5">{viewPayment.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const p = viewPayment;
                  setViewPayment(null);
                  setPrintPayment(p);
                }}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Official Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setViewPayment(null)}
                className="btn-primary text-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletePayment)}
        onClose={() => setDeletePayment(null)}
        onConfirm={handleDeletePayment}
        title="Confirm Payment Deletion"
        message={`Are you sure you want to delete payment receipt ${deletePayment?.receipt_no} for student ${deletePayment?.first_name} ${deletePayment?.last_name}? This will remove the transaction record from accounting.`}
        confirmText="Delete Payment"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleting}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(printPayment)}
        onClose={() => setPrintPayment(null)}
        payment={printPayment}
      />
    </div>
  );
}
