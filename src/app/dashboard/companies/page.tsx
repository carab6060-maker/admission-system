'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useCompany, Company } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';

export default function CompaniesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { companies, activeCompany, setActiveCompanyId, refreshCompanies, loadingCompanies } = useCompany();

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleteCompany, setDeleteCompany] = useState<Company | null>(null);

  const [savingAdd, setSavingAdd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    address: '',
    logo_url: '',
    currency: 'USD',
    is_active: true,
  });

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      showToast('Name and short code are required', 'error');
      return;
    }

    setSavingAdd(true);
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Company "${form.name}" registered successfully!`, 'success');
        setShowAddModal(false);
        setForm({
          name: '',
          code: '',
          phone: '',
          email: '',
          address: '',
          logo_url: '',
          currency: 'USD',
          is_active: true,
        });
        await refreshCompanies();
      } else {
        showToast(data.error || 'Failed to create company', 'error');
      }
    } catch {
      showToast('Network error while creating company', 'error');
    } finally {
      setSavingAdd(false);
    }
  };

  const openEditModal = (c: Company) => {
    setEditCompany(c);
    setForm({
      name: c.name,
      code: c.code,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      logo_url: c.logo_url || '',
      currency: c.currency || 'USD',
      is_active: c.is_active,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompany) return;

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/companies/${editCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Company information updated successfully', 'success');
        setEditCompany(null);
        await refreshCompanies();
      } else {
        showToast(data.error || 'Failed to update company', 'error');
      }
    } catch {
      showToast('Error updating company', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!deleteCompany) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/companies/${deleteCompany.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Company deleted successfully', 'success');
        setDeleteCompany(null);
        await refreshCompanies();
      } else {
        showToast(data.error || 'Failed to delete company', 'error');
      }
    } catch {
      showToast('Error deleting company', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCompanies = companies.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const totalStudents = companies.reduce((acc, c) => acc + (c.total_students || 0), 0);
  const totalRevenue = companies.reduce((acc, c) => acc + (c.total_revenue || 0), 0);
  const activeCount = companies.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#161938] tracking-tight">
              Companies & Institutions
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Multi-Company System
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage multiple schools, academies, branches, and tenant organizations
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm({
              name: '',
              code: '',
              phone: '',
              email: '',
              address: '',
              logo_url: '',
              currency: 'USD',
              is_active: true,
            });
            setShowAddModal(true);
          }}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Register New Company</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-base p-5 border-l-4 border-l-[#161938] card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              COMPANIES / SCHOOLS
            </span>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-[#161938] tracking-tight">
            {companies.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Registered tenant institutions</p>
        </div>

        <div className="card-base p-5 border-l-4 border-l-blue-600 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL ENROLLED
            </span>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 tracking-tight">
            {totalStudents}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all organizations</p>
        </div>

        <div className="card-base p-5 border-l-4 border-l-emerald-600 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TOTAL COLLECTED
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Combined multi-tenant revenue</p>
        </div>

        <div className="card-base p-5 border-l-4 border-l-purple-600 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ACTIVE STATUS
            </span>
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-purple-700 tracking-tight">
            {activeCount} / {companies.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Fully operational institutions</p>
        </div>
      </div>

      {/* Search box */}
      <div className="card-base p-4 bg-white flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company by name, code, phone, or email..."
            className="input-field pl-9 pr-8"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Current Active Company Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Active Context:</span>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200">
            {activeCompany ? `${activeCompany.name} (${activeCompany.code})` : 'All Companies (Global View)'}
          </span>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loadingCompanies ? (
          <div className="col-span-full py-12 text-center">
            <div className="spinner mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading companies...</p>
          </div>
        ) : filteredCompanies.length > 0 ? (
          filteredCompanies.map((c) => {
            const isSelected = activeCompany?.id === c.id;
            return (
              <div
                key={c.id}
                className={`card-base p-5 bg-white relative transition-all flex flex-col justify-between ${
                  isSelected ? 'ring-2 ring-blue-600 shadow-md' : 'hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#161938] text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {c.code.slice(0, 3)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {c.name}
                        </h3>
                        <span className="inline-block mt-0.5 font-mono text-[11px] font-bold text-blue-600 px-1.5 py-0.2 rounded bg-blue-50 border border-blue-100">
                          {c.code}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        c.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 my-4 border-t border-b border-slate-100 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Enrolled Students:</span>
                      <strong className="text-slate-800">{c.total_students || 0} students</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Collections:</span>
                      <strong className="text-emerald-600 font-bold">
                        ${Number(c.total_revenue || 0).toFixed(2)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Staff & Users:</span>
                      <strong className="text-slate-800">{c.total_users || 0} users</strong>
                    </div>
                    {c.phone && (
                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <span className="text-slate-400">Phone:</span>
                        <span className="text-slate-700 font-medium">{c.phone}</span>
                      </div>
                    )}
                    {c.address && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Campus:</span>
                        <span className="text-slate-700 truncate max-w-[170px]">{c.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCompanyId(isSelected ? null : c.id);
                      showToast(
                        isSelected
                          ? 'Switched to Global / All Companies view'
                          : `Switched active workspace to ${c.name}`,
                        'info'
                      );
                    }}
                    className={`text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ Current Workspace' : 'Switch Workspace'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(c)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Company Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteCompany(c)}
                      disabled={companies.length <= 1}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                      title="Delete Company"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            No companies matching your search.
          </div>
        )}
      </div>

      {/* Add Company Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Institution / Company"
        size="md"
      >
        <form onSubmit={handleCreateCompany} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Institution / School Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Al-Nour Academy"
              required
              className="input-field font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Short Identifier Code *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                placeholder="e.g. ALN-01"
                required
                className="input-field font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Billing Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="input-field"
              >
                <option value="USD">USD ($) - US Dollars</option>
                <option value="SOS">SOS (Sh.) - Somali Shilling</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+252 61 5551122"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Official Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@school.edu"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Campus Address / Location
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. Hodan District, Mogadishu"
              className="input-field"
            />
          </div>

          <div className="pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs font-medium text-slate-700">
                Company is Active & Enabled for Admission Operations
              </span>
            </label>
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
              disabled={savingAdd}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {savingAdd ? 'Creating...' : 'Register Company'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Company Modal */}
      <Modal
        isOpen={Boolean(editCompany)}
        onClose={() => setEditCompany(null)}
        title={editCompany ? `Edit Company: ${editCompany.name}` : 'Edit Company'}
        size="md"
      >
        {editCompany && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Company Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input-field font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Short Code *
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  required
                  className="input-field font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="input-field"
                >
                  <option value="USD">USD ($)</option>
                  <option value="SOS">SOS (Sh.)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  Company is Active
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditCompany(null)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="btn-primary text-sm"
              >
                {savingEdit ? 'Updating...' : 'Save Updates'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteCompany)}
        onClose={() => setDeleteCompany(null)}
        onConfirm={handleDeleteCompany}
        title="Confirm Company Deletion"
        message={`Are you sure you want to permanently delete company "${deleteCompany?.name}"? All associated students, payments, and staff records will be removed.`}
        confirmText="Delete Company"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleting}
      />
    </div>
  );
}
