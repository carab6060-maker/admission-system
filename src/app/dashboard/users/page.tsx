'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';

interface UserRecord {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'staff';
  is_active: boolean;
  company_id?: string | null;
  company_name?: string | null;
  company_code?: string | null;
  created_at: string;
  updated_at?: string;
}

interface Stats {
  totalUsers: number;
  superAdmins: number;
  admins: number;
  staffUsers: number;
  activeUsers: number;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { companies } = useCompany();
  const { showToast } = useToast();

  const isSuperAdmin = Boolean(
    currentUser && (
      currentUser.role?.toLowerCase()?.trim() === 'superadmin' || 
      currentUser.username?.toLowerCase()?.trim() === 'superadmin' || 
      currentUser.username?.toLowerCase()?.trim() === 'carab'
    )
  );

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    superAdmins: 0,
    admins: 0,
    staffUsers: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'staff',
    company_id: currentUser?.companyId || '',
    is_active: true,
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    role: 'staff',
    company_id: '',
    is_active: true,
  });

  const [savingAdd, setSavingAdd] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (selectedRole !== 'All') params.set('role', selectedRole);
      if (selectedStatus !== 'All') params.set('status', selectedStatus);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load user accounts');
      const data = await res.json();
      setUsers(data.data || []);
      if (data.stats) setStats(data.stats);
    } catch {
      showToast('Error loading users list', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedRole, selectedStatus, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name || !addForm.username || !addForm.email || !addForm.password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (addForm.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setSavingAdd(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`User ${addForm.full_name} created successfully!`, 'success');
        setShowAddModal(false);
        setAddForm({
          full_name: '',
          username: '',
          email: '',
          password: '',
          role: 'admin',
          company_id: currentUser?.companyId || '',
          is_active: true,
        });
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to create user', 'error');
      }
    } catch {
      showToast('Network error while creating user', 'error');
    } finally {
      setSavingAdd(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (u: UserRecord) => {
    setEditUser(u);
    setEditForm({
      full_name: u.full_name,
      username: u.username,
      email: u.email,
      password: '',
      role: u.role,
      company_id: u.company_id || '',
      is_active: u.is_active,
    });
  };

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    setSavingEdit(true);
    try {
      const payload: any = {
        full_name: editForm.full_name,
        username: editForm.username,
        email: editForm.email,
        role: editForm.role,
        is_active: editForm.is_active,
      };
      if (isSuperAdmin) {
        payload.company_id = editForm.company_id || null;
      }
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('User information updated successfully', 'success');
        setEditUser(null);
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to update user', 'error');
      }
    } catch {
      showToast('Error updating user record', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Quick Toggle Active Status
  const handleToggleStatus = async (u: UserRecord) => {
    try {
      const newStatus = !u.is_active;
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((item) => (item.id === u.id ? { ...item, is_active: newStatus } : item))
        );
        showToast(`User ${u.full_name} is now ${newStatus ? 'Active' : 'Inactive'}`, 'info');
      } else {
        const data = await res.json();
        showToast(data.error || 'Could not change status', 'error');
      }
    } catch {
      showToast('Failed to toggle status', 'error');
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'User deleted successfully', 'success');
        setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
        setDeleteUser(null);
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to delete user', 'error');
      }
    } catch {
      showToast('Error deleting user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shadow-xs">
            <svg className="w-3.5 h-3.5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 011.397 1.134l-1.2 6A1 1 0 0115.77 13H4.23a1 1 0 01-.98-.861l-1.2-6a1 1 0 011.397-1.134l1.599.8L9 4.323V3a1 1 0 011-1zm-5 13a1 1 0 000 2h10a1 1 0 100-2H5z" clipRule="evenodd" />
            </svg>
            <span>Super Admin</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Administrator</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span>Staff / Cashier</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#161938] tracking-tight">
              {isSuperAdmin ? 'User Management & Global Access' : 'School Users & Staff'}
            </h1>
            <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
              isSuperAdmin 
                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {isSuperAdmin ? 'Super Admin Control' : 'School Staff Portal'}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            {isSuperAdmin
              ? 'Manage all system administrators, school staff, and global access credentials'
              : 'Manage user accounts and staff access for your institution'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Create New User</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total */}
        <div className="card-base p-5 border-l-4 border-l-[#161938] card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isSuperAdmin ? 'TOTAL ACCOUNTS' : 'SCHOOL USERS'}
            </span>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-[#161938] tracking-tight">
            {stats.totalUsers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isSuperAdmin ? 'Total active users in system' : 'Users in your school'}
          </p>
        </div>

        {/* Card 2: Super Admin or Staff */}
        <div className={`card-base p-5 border-l-4 ${isSuperAdmin ? 'border-l-purple-600' : 'border-l-amber-500'} card-hover`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isSuperAdmin ? 'SUPER ADMINS' : 'STAFF / CASHIERS'}
            </span>
            <div className={`p-2 rounded-xl ${isSuperAdmin ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-amber-50 text-amber-700 border-amber-100'} border`}>
              {isSuperAdmin ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 011.397 1.134l-1.2 6A1 1 0 0115.77 13H4.23a1 1 0 01-.98-.861l-1.2-6a1 1 0 011.397-1.134l1.599.8L9 4.323V3a1 1 0 011-1zm-5 13a1 1 0 000 2h10a1 1 0 100-2H5z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              )}
            </div>
          </div>
          <div className={`text-3xl font-black ${isSuperAdmin ? 'text-purple-700' : 'text-amber-600'} tracking-tight`}>
            {isSuperAdmin ? stats.superAdmins : stats.staffUsers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isSuperAdmin ? 'Root access controllers' : 'Front desk & cashier staff'}
          </p>
        </div>

        {/* Card 3: Admins */}
        <div className="card-base p-5 border-l-4 border-l-blue-600 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {isSuperAdmin ? 'ADMINISTRATORS' : 'SCHOOL ADMINS'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600 tracking-tight">
            {stats.admins}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isSuperAdmin ? 'School & branch admins' : 'Administrators in your school'}
          </p>
        </div>

        {/* Card 4: Active */}
        <div className="card-base p-5 border-l-4 border-l-emerald-500 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ACTIVE STATUS
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {stats.activeUsers}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Allowed to sign in</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-base p-4 bg-white space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by full name, username, or email..."
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

          <div className="sm:col-span-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-field text-xs font-medium"
            >
              <option value="All">All Roles</option>
              {isSuperAdmin && <option value="superadmin">Super Admin</option>}
              <option value="admin">Administrator</option>
              <option value="staff">Staff / Cashier</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field text-xs font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">User Profile</th>
                {isSuperAdmin && <th className="py-3 px-5">School / Branch</th>}
                <th className="py-3 px-5">Email Address</th>
                <th className="py-3 px-5">Assigned Role</th>
                <th className="py-3 px-5">Account Status</th>
                <th className="py-3 px-5">Joined Date</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 7 : 6} className="py-12 text-center">
                    <div className="spinner mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Loading user accounts...</p>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const isCurrent = currentUser?.username === u.username || currentUser?.email === u.email;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Username */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs text-white ${
                            u.role === 'superadmin' ? 'bg-purple-600' : 'bg-blue-600'
                          }`}>
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* School / Branch (Super Admin only) */}
                      {isSuperAdmin && (
                        <td className="py-3.5 px-5 text-xs">
                          {u.company_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <span className="truncate max-w-[150px]">{u.company_name}</span>
                              {u.company_code && (
                                <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded uppercase font-mono">
                                  {u.company_code}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                              <span>Global / System</span>
                            </span>
                          )}
                        </td>
                      )}

                      {/* Email */}
                      <td className="py-3.5 px-5 text-xs text-slate-700 font-medium">
                        {u.email}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-5">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                          <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-5 text-xs text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User & Credentials"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteUser(u)}
                            disabled={u.username === 'superadmin' || u.username === 'carab'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              u.username === 'superadmin' || u.username === 'carab'
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title={
                              u.username === 'superadmin' || u.username === 'carab'
                                ? 'Primary superadmin account cannot be removed'
                                : 'Delete User Account'
                            }
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
                  <td colSpan={isSuperAdmin ? 7 : 6} className="py-12 text-center text-slate-400 text-sm">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create New User Account"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
              Full Legal Name *
            </label>
            <input
              type="text"
              value={addForm.full_name}
              onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
              placeholder="e.g. Fatima Mohamed"
              required
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Username (Login Handle) *
              </label>
              <input
                type="text"
                value={addForm.username}
                onChange={(e) => setAddForm({ ...addForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                placeholder="e.g. fatima"
                required
                className="input-field font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Email Address *
              </label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                placeholder="fatima@admissions.edu"
                required
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Role & Permissions *
              </label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="input-field font-semibold"
                required
              >
                <option value="admin">Administrator (School Admin)</option>
                {isSuperAdmin && <option value="superadmin">Super Admin (Root Access)</option>}
                <option value="staff">Staff / Cashier (Limited)</option>
              </select>
            </div>

            {isSuperAdmin ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Assign School / Institution
                </label>
                <select
                  value={addForm.company_id}
                  onChange={(e) => setAddForm({ ...addForm, company_id: e.target.value })}
                  className="input-field font-medium"
                >
                  <option value="">Global / System (No School)</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Initial Password * (min 6 chars)
                </label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="input-field"
                />
              </div>
            )}
          </div>

          {isSuperAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Initial Password * (min 6 chars)
              </label>
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="••••••••"
                required
                minLength={6}
                className="input-field"
              />
            </div>
          )}

          <div className="pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addForm.is_active}
                onChange={(e) => setAddForm({ ...addForm, is_active: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              <span className="text-xs font-medium text-slate-700">
                Account Active & Allowed to Sign In
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
              {savingAdd ? (
                <>
                  <div className="spinner !w-3.5 !h-3.5" />
                  <span>Creating User...</span>
                </>
              ) : (
                <span>Create User</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title={editUser ? `Edit User: ${editUser.full_name}` : 'Edit User'}
        size="md"
      >
        {editUser && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                Full Legal Name *
              </label>
              <input
                type="text"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                required
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Username *
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  required
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Role & Permissions *
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="input-field font-semibold"
                  required
                >
                  <option value="admin">Administrator (School Admin)</option>
                  {isSuperAdmin && <option value="superadmin">Super Admin (Root Access)</option>}
                  <option value="staff">Staff / Cashier</option>
                </select>
              </div>

              {isSuperAdmin ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                    Assigned School / Institution
                  </label>
                  <select
                    value={editForm.company_id}
                    onChange={(e) => setEditForm({ ...editForm, company_id: e.target.value })}
                    className="input-field font-medium"
                  >
                    <option value="">Global / System (No School)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                    Reset Password (Leave blank to keep)
                  </label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="New password (optional)"
                    minLength={6}
                    className="input-field"
                  />
                </div>
              )}
            </div>

            {isSuperAdmin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">
                  Reset Password (Leave blank to keep)
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="New password (optional)"
                  minLength={6}
                  className="input-field"
                />
              </div>
            )}

            <div className="pt-2">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  Account is Active & Allowed to Sign In
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {savingEdit ? (
                  <>
                    <div className="spinner !w-3.5 !h-3.5" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Update User</span>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteUser)}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDeleteUser}
        title="Confirm User Deletion"
        message={`Are you sure you want to permanently delete user "${deleteUser?.full_name}" (@${deleteUser?.username})? They will immediately lose system access.`}
        confirmText="Delete User"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleting}
      />
    </div>
  );
}
