'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import TaskPerformanceAnalytics from '@/src/presentation/components/tasks/TaskPerformanceAnalytics';

export default function TaskAnalyticsPage() {
  return (
    <ProtectedRoute>
      <TaskPerformanceAnalytics />
    </ProtectedRoute>
  );
}