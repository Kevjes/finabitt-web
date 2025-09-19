'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import GamificationProfile from '@/src/presentation/components/gamification/GamificationProfile';

export default function AchievementsPage() {
  return (
    <ProtectedRoute>
      <GamificationProfile />
    </ProtectedRoute>
  );
}