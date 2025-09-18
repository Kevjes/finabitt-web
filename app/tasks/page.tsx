'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import TaskDashboard from '@/src/presentation/components/tasks/TaskDashboard';

export default function TasksPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <TaskDashboard />
        </div>
      </div>
    </ProtectedRoute>
  );
}