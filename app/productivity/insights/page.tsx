'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import ProductivityInsights from '@/src/presentation/components/productivity/ProductivityInsights';

export default function ProductivityInsightsPage() {
  return (
    <ProtectedRoute>
      <ProductivityInsights />
    </ProtectedRoute>
  );
}