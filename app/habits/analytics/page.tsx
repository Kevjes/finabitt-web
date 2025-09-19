'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import HabitStreakVisualization from '@/src/presentation/components/habits/HabitStreakVisualization';

export default function HabitAnalyticsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6">
        <HabitStreakVisualization />
      </div>
    </ProtectedRoute>
  );
}