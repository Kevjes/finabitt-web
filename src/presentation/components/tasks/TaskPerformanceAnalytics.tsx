'use client';

import { useTasks } from '@/src/presentation/hooks/useTasks';
import Card from '@/src/presentation/components/ui/Card';

const TaskPerformanceAnalytics: React.FC = () => {
  const { getPerformanceAnalytics, formatDuration } = useTasks();
  const analytics = getPerformanceAnalytics();

  if (analytics.totalTasksCompleted === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            Aucune tâche terminée pour l'instant
          </div>
          <p className="text-sm text-gray-400">
            Complétez quelques tâches pour voir vos analytics de performance
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Analytics de Performance
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Analysez votre productivité et vos temps de livraison
        </p>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {analytics.totalTasksCompleted}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Tâches complétées
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatDuration(analytics.averageCompletionTime)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Temps moyen de livraison
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatDuration(analytics.averageTimeInTodo)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Temps moyen en "À faire"
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatDuration(analytics.averageTimeInProgress)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Temps moyen en cours
            </div>
          </div>
        </Card>
      </div>

      {/* Records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics.fastestTask && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🚀 Tâche la plus rapide
            </h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {analytics.fastestTask.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complétée en {formatDuration(analytics.fastestTask.timeToComplete || 0)}
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>Todo: {formatDuration(analytics.fastestTask.timeInTodo || 0)}</span>
                <span>En cours: {formatDuration(analytics.fastestTask.timeInProgress || 0)}</span>
              </div>
            </div>
          </Card>
        )}

        {analytics.slowestTask && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🐌 Tâche la plus lente
            </h3>
            <div className="space-y-2">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {analytics.slowestTask.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complétée en {formatDuration(analytics.slowestTask.timeToComplete || 0)}
              </p>
              <div className="flex gap-4 text-xs text-gray-500">
                <span>Todo: {formatDuration(analytics.slowestTask.timeInTodo || 0)}</span>
                <span>En cours: {formatDuration(analytics.slowestTask.timeInProgress || 0)}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Tendance de productivité */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          📈 Tendance des 7 derniers jours
        </h3>
        <div className="space-y-3">
          {analytics.productivityTrend.map((day, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0 border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-20">
                  {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {day.tasksCompleted} tâche{day.tasksCompleted > 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {day.averageCompletionTime > 0
                  ? `Moy: ${formatDuration(day.averageCompletionTime)}`
                  : '-'
                }
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TaskPerformanceAnalytics;