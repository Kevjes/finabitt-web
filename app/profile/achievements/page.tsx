'use client';

import { ProtectedRoute } from '@/src/presentation/components/auth/ProtectedRoute';
import GamificationProfile from '@/src/presentation/components/gamification/GamificationProfile';

export default function AchievementsPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-6">
        <GamificationProfile />
      </div>
    </ProtectedRoute>
  );
}