'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import RoutineManagement from '@/src/presentation/components/habits/RoutineManagement';

export default function RoutinesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RoutineManagement />
        </main>
      </div>
    </ProtectedRoute>
  );
}