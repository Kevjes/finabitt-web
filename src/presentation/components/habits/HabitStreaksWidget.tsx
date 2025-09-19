'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useHabits } from '@/src/presentation/hooks/useHabits';
import { Habit } from '@/src/shared/types';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';

interface StreakSummary {
  habit: Habit;
  currentStreak: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
}

const HabitStreaksWidget: React.FC = () => {
  const { habits } = useHabits();
  const [streaks, setStreaks] = useState<StreakSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Simplified streak calculation for widget
  const calculateStreaks = () => {
    if (!habits.length) {
      setLoading(false);
      return;
    }

    const streakSummaries: StreakSummary[] = habits
      .filter(h => h.isActive)
      .map(habit => {
        // Simplified calculation - in real app would use actual progress data
        const mockStreak = Math.floor(Math.random() * 30); // 0-30 days

        let status: 'excellent' | 'good' | 'warning' | 'danger' = 'danger';
        if (mockStreak >= 21) status = 'excellent';
        else if (mockStreak >= 14) status = 'good';
        else if (mockStreak >= 7) status = 'warning';

        return {
          habit,
          currentStreak: mockStreak,
          status
        };
      })
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .slice(0, 5); // Top 5 habits

    setStreaks(streakSummaries);
    setLoading(false);
  };

  useEffect(() => {
    calculateStreaks();
  }, [habits]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </Card>
    );
  }

  if (streaks.length === 0) {
    return (
      <Card>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🌱</div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            Aucune habitude active
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Créez votre première habitude pour commencer vos séries !
          </p>
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-purple-600 dark:text-purple-400';
      case 'good':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return '👑';
      case 'good':
        return '🔥';
      case 'warning':
        return '⚡';
      default:
        return '🌱';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'good':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    }
  };

  const topStreak = streaks[0];
  const averageStreak = streaks.reduce((sum, s) => sum + s.currentStreak, 0) / streaks.length;

  return (
    <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              🔥 Chaînes d'habitudes
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Vos séries de réussite
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-green-600">
              {topStreak ? topStreak.currentStreak : 0}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Meilleure série
            </div>
          </div>
        </div>

        {/* Top Habit */}
        {topStreak && (
          <div className={`p-3 rounded-lg border ${getStatusBg(topStreak.status)}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getStatusIcon(topStreak.status)}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {topStreak.habit.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {topStreak.currentStreak} jour{topStreak.currentStreak > 1 ? 's' : ''} consécutif{topStreak.currentStreak > 1 ? 's' : ''}
                </div>
              </div>
              <div className={`text-sm font-bold ${getStatusColor(topStreak.status)}`}>
                #{1}
              </div>
            </div>
          </div>
        )}

        {/* Other Habits Summary */}
        {streaks.length > 1 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Autres habitudes ({streaks.length - 1})
            </div>
            {streaks.slice(1, 4).map((streak, index) => (
              <div key={streak.habit.id} className="flex items-center gap-3 py-2">
                <span className="text-lg">{getStatusIcon(streak.status)}</span>
                <div className="flex-1">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {streak.habit.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {streak.currentStreak} jour{streak.currentStreak > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  #{index + 2}
                </div>
              </div>
            ))}
            {streaks.length > 4 && (
              <div className="text-center">
                <span className="text-xs text-gray-500">
                  +{streaks.length - 4} autre{streaks.length - 4 > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(averageStreak)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Moyenne
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {streaks.filter(s => s.status === 'excellent' || s.status === 'good').length}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                En forme
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link href="/habits/analytics">
            <Button size="sm" variant="outline" className="w-full text-xs">
              Voir analyse complète
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default HabitStreaksWidget;