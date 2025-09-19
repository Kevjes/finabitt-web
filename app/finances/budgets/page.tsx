'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import BudgetManagement from '@/src/presentation/components/finance/BudgetManagement';
import BudgetAlerts from '@/src/presentation/components/finance/BudgetAlerts';

export default function BudgetsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <BudgetAlerts />
        <BudgetManagement />
      </div>
    </ProtectedRoute>
  );
}