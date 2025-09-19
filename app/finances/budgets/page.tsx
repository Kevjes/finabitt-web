'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import BudgetManagement from '@/src/presentation/components/finance/BudgetManagement';
import BudgetAlerts from '@/src/presentation/components/finance/BudgetAlerts';

export default function BudgetsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <BudgetAlerts />
          <BudgetManagement />
        </div>
      </div>
    </ProtectedRoute>
  );
}