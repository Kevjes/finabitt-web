'use client';

import { useGamification } from '@/src/presentation/hooks/useGamification';
import Card from '@/src/presentation/components/ui/Card';
import { Badge } from '@/src/shared/types';

const GamificationProfile: React.FC = () => {
  const { stats, loading, getBadgesByType, getNextBadgeToEarn, getLevelInfo } = useGamification();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const levelInfo = getLevelInfo(stats.level);
  const nextBadge = getNextBadgeToEarn();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Profil de progression
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Suivez vos accomplissements et débloquez de nouveaux badges
        </p>
      </div>

      {/* Level and Points */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Niveau {stats.level}
              </h3>
              <p className={`text-lg font-medium ${levelInfo.color}`}>
                {levelInfo.name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {stats.totalPoints.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                points au total
              </div>
            </div>
          </div>

          {/* Progress to next level */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Progression vers le niveau {stats.level + 1}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.pointsToNextLevel} points restants
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.levelProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
              {stats.levelProgress.toFixed(1)}% vers le prochain niveau
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Achievements */}
      {stats.recentAchievements.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🎉 Nouveaux accomplissements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
              >
                <span className="text-2xl">{achievement.badge.icon}</span>
                <div>
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">
                    {achievement.badge.name}
                  </div>
                  <div className="text-xs text-yellow-600 dark:text-yellow-300">
                    {achievement.badge.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Badges by Category */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Habit Badges */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            🌱 Habitudes
            <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
              {getBadgesByType('habit').length}
            </span>
          </h3>
          <div className="space-y-3">
            {getBadgesByType('habit').map((userBadge) => (
              <BadgeDisplay key={userBadge.id} badge={userBadge.badge} earned={true} />
            ))}
          </div>
        </Card>

        {/* Task Badges */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            📋 Tâches
            <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              {getBadgesByType('task').length}
            </span>
          </h3>
          <div className="space-y-3">
            {getBadgesByType('task').map((userBadge) => (
              <BadgeDisplay key={userBadge.id} badge={userBadge.badge} earned={true} />
            ))}
          </div>
        </Card>

        {/* Finance Badges */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            💰 Finance
            <span className="text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
              {getBadgesByType('finance').length}
            </span>
          </h3>
          <div className="space-y-3">
            {getBadgesByType('finance').map((userBadge) => (
              <BadgeDisplay key={userBadge.id} badge={userBadge.badge} earned={true} />
            ))}
          </div>
        </Card>
      </div>

      {/* Next Badge to Earn */}
      {nextBadge && (
        <Card className="bg-gray-50 dark:bg-gray-800 border-dashed border-2 border-gray-300 dark:border-gray-600">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              🎯 Prochain objectif
            </h3>
            <BadgeDisplay badge={nextBadge} earned={false} />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Continuez vos efforts pour débloquer ce badge !
            </p>
          </div>
        </Card>
      )}

      {/* Statistics Summary */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📊 Résumé des accomplissements
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalPoints}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Points totaux
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.badges.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Badges obtenus
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.level}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Niveau actuel
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {Math.round(stats.levelProgress)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Vers niveau suivant
            </div>
          </div>
        </div>
      </Card>
        </div>
      </div>
    </div>
  );
};

interface BadgeDisplayProps {
  badge: Badge;
  earned: boolean;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badge, earned }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      earned
        ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60'
    }`}>
      <span className={`text-2xl ${earned ? '' : 'grayscale'}`}>
        {badge.icon}
      </span>
      <div className="flex-1">
        <div className={`font-medium ${
          earned
            ? 'text-gray-900 dark:text-gray-100'
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {badge.name}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {badge.description}
        </div>
      </div>
      {earned && (
        <div className="text-green-600 dark:text-green-400">
          ✓
        </div>
      )}
    </div>
  );
};

export default GamificationProfile;