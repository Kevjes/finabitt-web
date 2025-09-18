'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import TransactionsOverview from '@/src/presentation/components/finance/TransactionsOverview';

export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <TransactionsOverview />
    </ProtectedRoute>
  );
}