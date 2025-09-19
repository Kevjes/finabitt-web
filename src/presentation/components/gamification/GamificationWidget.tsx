'use client';

import Link from 'next/link';
import { useGamification } from '@/src/presentation/hooks/useGamification';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';

const GamificationWidget: React.FC = () => {
  const { stats, loading, getNextBadgeToEarn, getLevelInfo } = useGamification();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </Card>
    );
  }

  const levelInfo = getLevelInfo(stats.level);
  const nextBadge = getNextBadgeToEarn();

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              🏆 Progression
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Niveau {stats.level} • {levelInfo.name}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-primary">
              {stats.totalPoints.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              points
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              Vers niveau {stats.level + 1}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {stats.pointsToNextLevel} pts
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${stats.levelProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Recent Achievement or Next Badge */}
        {stats.recentAchievements.length > 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎉</span>
              <div>
                <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Nouveau badge débloqué !
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-300">
                  {stats.recentAchievements[0].badge.name}
                </div>
              </div>
            </div>
          </div>
        ) : nextBadge ? (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg opacity-50">{nextBadge.icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Prochain objectif
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {nextBadge.name}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {stats.badges.filter(b => b.badge.type === 'habit').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Habitudes
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {stats.badges.filter(b => b.badge.type === 'task').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Tâches
            </div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-600">
              {stats.badges.filter(b => b.badge.type === 'finance').length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Finance
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link href="/profile/achievements">
            <Button size="sm" variant="outline" className="w-full text-xs">
              Voir tous les accomplissements
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default GamificationWidget;