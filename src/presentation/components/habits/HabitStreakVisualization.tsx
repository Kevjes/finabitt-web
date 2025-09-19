'use client';

import { useState, useEffect } from 'react';
import { useHabits } from '@/src/presentation/hooks/useHabits';
import { Habit, HabitProgress } from '@/src/shared/types';
import Card from '@/src/presentation/components/ui/Card';

interface StreakData {
  habit: Habit;
  currentStreak: number;
  longestStreak: number;
  weeklyData: (boolean | null)[]; // null = no data, true = completed, false = missed
  monthlyCompletion: number; // percentage
  recentProgress: HabitProgress[];
}

const HabitStreakVisualization: React.FC = () => {
  const { habits, getHabitProgress } = useHabits();
  const [streakData, setStreakData] = useState<StreakData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // Calculate streak data for each habit
  const calculateStreakData = async () => {
    if (!habits.length) {
      setLoading(false);
      return;
    }

    const data: StreakData[] = [];
    const today = new Date();

    for (const habit of habits.filter(h => h.isActive)) {
      // Get progress for the last 30 days
      const startDate = new Date();
      startDate.setDate(today.getDate() - 30);

      const progress = await getHabitProgress(habit.id, startDate, today);

      // Calculate current streak
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Sort progress by date (most recent first)
      const sortedProgress = progress.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Calculate current streak (from today backwards)
      for (let i = 0; i < sortedProgress.length; i++) {
        const progressDate = new Date(sortedProgress[i].date);
        const expectedDate = new Date();
        expectedDate.setDate(today.getDate() - i);

        // Check if this is the expected date and completed
        if (
          progressDate.toDateString() === expectedDate.toDateString() &&
          sortedProgress[i].completed
        ) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate longest streak
      for (const progressItem of sortedProgress.reverse()) {
        if (progressItem.completed) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }

      // Generate weekly data (last 7 days)
      const weeklyData: (boolean | null)[] = [];
      for (let i = 6; i >= 0; i--) {
        const checkDate = new Date();
        checkDate.setDate(today.getDate() - i);

        const dayProgress = progress.find(p =>
          p.date.toDateString() === checkDate.toDateString()
        );

        weeklyData.push(dayProgress ? dayProgress.completed : null);
      }

      // Calculate monthly completion percentage
      const completedDays = progress.filter(p => p.completed).length;
      const monthlyCompletion = progress.length > 0 ? (completedDays / progress.length) * 100 : 0;

      data.push({
        habit,
        currentStreak,
        longestStreak,
        weeklyData,
        monthlyCompletion,
        recentProgress: progress.slice(0, 7) // Last 7 entries
      });
    }

    setStreakData(data.sort((a, b) => b.currentStreak - a.currentStreak));
    setLoading(false);
  };

  useEffect(() => {
    calculateStreakData();
  }, [habits]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map(j => (
                <div key={j} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (streakData.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            Aucune habitude active trouvée
          </div>
          <p className="text-sm text-gray-400">
            Créez des habitudes pour voir vos chaînes de progression
          </p>
        </div>
      </Card>
    );
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600 dark:text-purple-400';
    if (streak >= 14) return 'text-blue-600 dark:text-blue-400';
    if (streak >= 7) return 'text-green-600 dark:text-green-400';
    if (streak >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '👑';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⚡';
    if (streak >= 3) return '✨';
    return '🌱';
  };

  const getDayInitial = (dayIndex: number) => {
    const days = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    return days[dayIndex];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chaînes d'habitudes
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Visualisez vos séries de réussite et votre constance
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedPeriod === 'week'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectedPeriod === 'month'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Mois
          </button>
        </div>
      </div>

      {/* Top Streaks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
          <div className="text-center">
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-orange-600">
              {Math.max(...streakData.map(d => d.longestStreak), 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Plus longue série
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
          <div className="text-center">
            <div className="text-2xl mb-2">🔥</div>
            <div className="text-2xl font-bold text-green-600">
              {streakData.filter(d => d.currentStreak >= 7).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Séries actives 7+ jours
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="text-center">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(streakData.reduce((sum, d) => sum + d.monthlyCompletion, 0) / streakData.length || 0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Taux de réussite moyen
            </div>
          </div>
        </Card>
      </div>

      {/* Habit Streaks */}
      <div className="space-y-4">
        {streakData.map((data) => (
          <Card key={data.habit.id} className="hover:shadow-md transition-shadow">
            <div className="space-y-4">
              {/* Habit Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {data.habit.type === 'good' ? '✅' : '❌'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {data.habit.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {data.habit.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getStreakColor(data.currentStreak)}`}>
                      {getStreakEmoji(data.currentStreak)} {data.currentStreak}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Série actuelle
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {data.longestStreak}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Record
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly View */}
              {selectedPeriod === 'week' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      7 derniers jours
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {data.weeklyData.filter(d => d === true).length}/7 complétés
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {data.weeklyData.map((completed, index) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - index));

                      return (
                        <div
                          key={index}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                            completed === true
                              ? 'bg-green-500 border-green-500 text-white'
                              : completed === false
                              ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400'
                              : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400'
                          }`}
                          title={`${date.toLocaleDateString('fr-FR')} - ${
                            completed === true ? 'Complété' : completed === false ? 'Manqué' : 'Pas de données'
                          }`}
                        >
                          {getDayInitial(date.getDay())}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Monthly View */}
              {selectedPeriod === 'month' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progression mensuelle
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {data.monthlyCompletion.toFixed(1)}% de réussite
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        data.monthlyCompletion >= 80 ? 'bg-green-500' :
                        data.monthlyCompletion >= 60 ? 'bg-yellow-500' :
                        data.monthlyCompletion >= 40 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${data.monthlyCompletion}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Fréquence : {data.habit.frequency === 'daily' ? 'Quotidienne' :
                             data.habit.frequency === 'weekly' ? 'Hebdomadaire' : 'Personnalisée'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {data.recentProgress.length} entrées récentes
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HabitStreakVisualization;