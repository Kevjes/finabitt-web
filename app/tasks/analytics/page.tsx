'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import TaskPerformanceAnalytics from '@/src/presentation/components/tasks/TaskPerformanceAnalytics';

export default function TaskAnalyticsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6">
        <TaskPerformanceAnalytics />
      </div>
    </ProtectedRoute>
  );
}