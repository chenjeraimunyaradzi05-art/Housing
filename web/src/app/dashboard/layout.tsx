'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useRequireAuth } from '@/lib/auth';
import { Spinner } from '@/components/ui';

export default function Layout({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useRequireAuth
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
