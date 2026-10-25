'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F6FB]">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  const getPageInfo = () => {
    if (pathname.includes('/register')) {
      return {
        title: 'New Student Registration',
        subtitle: 'Fill in candidate details to process a new admission application',
      };
    }
    if (pathname.includes('/students')) {
      return {
        title: 'Student Directory & Records',
        subtitle: 'Search, filter, update admission status, and manage student files',
      };
    }
    return {
      title: 'Admissions Dashboard',
      subtitle: 'Overview of student enrollment, application statuses, and recent activity',
    };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Body */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        }`}
      >
        <Topbar
          title={title}
          subtitle={subtitle}
          onMobileToggle={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
