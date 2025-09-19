'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import HabitStreakVisualization from '@/src/presentation/components/habits/HabitStreakVisualization';

export default function HabitAnalyticsPage() {
  return (
    <ProtectedRoute>
      <HabitStreakVisualization />
    </ProtectedRoute>
  );
}