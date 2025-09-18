'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import BudgetsGoalsOverview from '@/src/presentation/components/finance/BudgetsGoalsOverview';

export default function BudgetsPage() {
  return (
    <ProtectedRoute>
      <BudgetsGoalsOverview />
    </ProtectedRoute>
  );
}