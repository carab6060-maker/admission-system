'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useCompany } from '@/contexts/CompanyContext';

interface FinancialReportData {
  period: string;
  summary: {
    totalRevenue: number;
    transactionCount: number;
    uniqueStudents: number;
    averagePayment: number;
  };
  byFeeType: {
    fee_type: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  byPaymentMethod: {
    payment_method: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  dailyTrend: {
    date_label: string;
    total: number;
    count: number;
  }[];
  transactions: {
    id: string;
    receipt_no: string;
    amount: number;
    fee_type: string;
    payment_method: string;
    payment_date: string;
    reference_no?: string | null;
    notes?: string | null;
    first_name: string;
    middle_name: string;
    last_name: string;
    student_phone?: string;
    company_name?: string;
    company_code?: string;
  }[];
}

export default function ReportsPage() {
  const { activeCompany } = useCompany();
  const { showToast } = useToast();

  const [period, setPeriod] = useState<'today' | '7days' | 'month' | 'year' | 'all' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<FinancialReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('period', period);
      if (activeCompany) params.set('company_id', activeCompany.id);
      if (period === 'custom') {
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
      }

      const res = await fetch(`/api/reports/financial?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load financial report');
      const json = await res.json();
      setData(json);
    } catch {
      showToast('Error loading financial reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, activeCompany, showToast]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!data || !data.transactions.length) {
      showToast('No transaction data to export for this period', 'warning');
      return;
    }

    const headers = [
      'Receipt No',
      'Date',
      'Student Name',
      'Student Phone',
      'Fee Category',
      'Payment Method',
      'Reference No',
      'Amount (USD)',
    ];

    const rows = data.transactions.map((t) => [
      `"${t.receipt_no}"`,
      `"${new Date(t.payment_date).toLocaleDateString()}"`,
      `"${t.first_name} ${t.middle_name} ${t.last_name}"`,
      `"${t.student_phone || ''}"`,
      `"${t.fee_type}"`,
      `"${t.payment_method}"`,
      `"${t.reference_no || ''}"`,
      Number(t.amount).toFixed(2),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `financial_report_${period}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Financial CSV report downloaded successfully', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = data?.summary || {
    totalRevenue: 0,
    transactionCount: 0,
    uniqueStudents: 0,
    averagePayment: 0,
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#161938] tracking-tight">
            Financial & Accounting Reports
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Audit fee collections, analyze revenue streams, and download financial statements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/accounting"
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <span>Back to Payments</span>
          </Link>

          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 shadow-xs"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Period Filter Bar */}
      <div className="card-base p-4 bg-white space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold mr-1 uppercase tracking-wider text-[11px]">
              Period:
            </span>
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === 'today'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === '7days'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === 'year'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                period === 'custom'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Custom Range
            </button>
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field py-1 text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field py-1 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-base p-5 border-l-4 border-l-emerald-600 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL PERIOD REVENUE
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Aggregated collections in selected period</p>
        </div>

        <div className="card-base p-5 border-l-4 border-l-blue-600 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL TRANSACTIONS
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-[#161938] tracking-tight">
            {summary.transactionCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Verified receipts recorded</p>
        </div>

        <div className="card-base p-5 border-l-4 border-l-purple-600 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              STUDENTS PAID
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-purple-700 tracking-tight">
            {summary.uniqueStudents}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Unique student accounts</p>
        </div>

        <div className="card-base p-5 border-l-4 border-l-amber-500 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              AVG PAYMENT
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-[#161938] tracking-tight">
            ${summary.averagePayment.toFixed(2)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Average per receipt</p>
        </div>
      </div>

      {/* Revenue Breakdown Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Fee Type */}
        <div className="card-base p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#161938]">Revenue by Fee Category</h2>
              <p className="text-xs text-slate-500">Distribution across admission & tuition types</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {data?.byFeeType.length || 0} categories
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center"><div className="spinner mx-auto" /></div>
          ) : data?.byFeeType && data.byFeeType.length > 0 ? (
            <div className="space-y-3.5">
              {data.byFeeType.map((f, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{f.fee_type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{f.count} payment{f.count !== 1 ? 's' : ''}</span>
                      <strong className="text-slate-900">${f.total.toFixed(2)} ({f.percentage}%)</strong>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(f.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No fee breakdown available for this period.</p>
          )}
        </div>

        {/* Breakdown by Payment Method */}
        <div className="card-base p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#161938]">Revenue by Payment Channel</h2>
              <p className="text-xs text-slate-500">Mobile money, cash, and bank transfers</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {data?.byPaymentMethod.length || 0} channels
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center"><div className="spinner mx-auto" /></div>
          ) : data?.byPaymentMethod && data.byPaymentMethod.length > 0 ? (
            <div className="space-y-3.5">
              {data.byPaymentMethod.map((m, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{m.payment_method}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{m.count} txns</span>
                      <strong className="text-slate-900">${m.total.toFixed(2)} ({m.percentage}%)</strong>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(m.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No payment method data for this period.</p>
          )}
        </div>
      </div>

      {/* Period Statement Ledger Table */}
      <div className="card-base overflow-hidden bg-white">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[#161938]">Financial Ledger & Statement</h2>
            <p className="text-xs text-slate-500">Itemized audit list of all collections in the selected timeframe</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Total {data?.transactions.length || 0} Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">Receipt No</th>
                <th className="py-3 px-5">Date</th>
                <th className="py-3 px-5">Student Name</th>
                <th className="py-3 px-5">Fee Category</th>
                <th className="py-3 px-5">Method</th>
                <th className="py-3 px-5">TXN Ref</th>
                <th className="py-3 px-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="spinner mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Loading ledger statement...</p>
                  </td>
                </tr>
              ) : data?.transactions && data.transactions.length > 0 ? (
                data.transactions.map((t) => {
                  const studentName = `${t.first_name} ${t.middle_name} ${t.last_name}`;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-5 font-mono text-xs font-bold text-blue-600">
                        {t.receipt_no}
                      </td>
                      <td className="py-3 px-5 text-xs text-slate-600 whitespace-nowrap">
                        {new Date(t.payment_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-5 text-xs font-semibold text-slate-900">
                        {studentName}
                      </td>
                      <td className="py-3 px-5 text-xs font-medium text-slate-700">
                        {t.fee_type}
                      </td>
                      <td className="py-3 px-5 text-xs font-semibold text-slate-600">
                        {t.payment_method}
                      </td>
                      <td className="py-3 px-5 text-xs font-mono text-slate-400">
                        {t.reference_no || '-'}
                      </td>
                      <td className="py-3 px-5 text-right text-xs font-extrabold text-emerald-600">
                        ${Number(t.amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                    No transactions found for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
            {data?.transactions && data.transactions.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                <tr>
                  <td colSpan={6} className="py-3.5 px-5 text-right uppercase text-slate-600 tracking-wider">
                    Total Revenue for Period:
                  </td>
                  <td className="py-3.5 px-5 text-right text-sm text-emerald-700 font-black">
                    ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
