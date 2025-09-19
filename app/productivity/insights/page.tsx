'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import ProductivityInsights from '@/src/presentation/components/productivity/ProductivityInsights';

export default function ProductivityInsightsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6">
        <ProductivityInsights />
      </div>
    </ProtectedRoute>
  );
}