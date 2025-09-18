'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import AccountsOverview from '@/src/presentation/components/finance/AccountsOverview';

export default function AccountsPage() {
  return (
    <ProtectedRoute>
      <AccountsOverview />
    </ProtectedRoute>
  );
}