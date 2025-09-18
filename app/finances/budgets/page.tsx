'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import BudgetManagement from '@/src/presentation/components/finance/BudgetManagement';

export default function BudgetsPage() {
  return (
    <ProtectedRoute>
      <BudgetManagement />
    </ProtectedRoute>
  );
}