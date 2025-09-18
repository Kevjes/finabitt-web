'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import AccountRulesManagement from '@/src/presentation/components/finance/AccountRulesManagement';

export default function AccountRulesPage() {
  return (
    <ProtectedRoute>
      <AccountRulesManagement />
    </ProtectedRoute>
  );
}