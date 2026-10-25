'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Company {
  id: string;
  name: string;
  code: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logo_url?: string | null;
  currency: string;
  is_active: boolean;
  total_students?: number;
  total_users?: number;
  total_revenue?: number;
  created_at: string;
}

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompanyId: (id: string | null) => void;
  loadingCompanies: boolean;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  companies: [],
  activeCompany: null,
  setActiveCompanyId: () => {},
  loadingCompanies: true,
  refreshCompanies: async () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const res = await fetch('/api/companies');
      if (res.ok) {
        const json = await res.json();
        const list: Company[] = json.data || [];
        setCompanies(list);

        // Retrieve stored active company or set first company
        const stored = localStorage.getItem('admission-active-company-id');
        if (stored && stored !== 'All' && list.some((c) => c.id === stored)) {
          setActiveCompanyIdState(stored);
        } else if (stored === 'All') {
          setActiveCompanyIdState(null);
        } else if (list.length > 0) {
          // Default to first active company
          setActiveCompanyIdState(list[0].id);
          localStorage.setItem('admission-active-company-id', list[0].id);
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const setActiveCompanyId = (id: string | null) => {
    setActiveCompanyIdState(id);
    if (id) {
      localStorage.setItem('admission-active-company-id', id);
    } else {
      localStorage.setItem('admission-active-company-id', 'All');
    }
  };

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || null;

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        setActiveCompanyId,
        loadingCompanies,
        refreshCompanies: fetchCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}
