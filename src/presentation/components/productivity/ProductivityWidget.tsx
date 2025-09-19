'use client';

import Link from 'next/link';
import { useProductivityAnalytics } from '@/src/presentation/hooks/useProductivityAnalytics';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';

const ProductivityWidget: React.FC = () => {
  const { insights, loading, getCriticalPatterns, getProductivityGrade } = useProductivityAnalytics();

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </Card>
    );
  }

  const productivityGrade = getProductivityGrade();
  const criticalPatterns = getCriticalPatterns();

  return (
    <Card className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              🧠 Productivité
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Analyse de vos patterns
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${productivityGrade.color}`}>
              {productivityGrade.grade}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Note
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalPatterns.length > 0 ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600 dark:text-red-400">🚨</span>
              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                {criticalPatterns.length} alerte{criticalPatterns.length > 1 ? 's' : ''} critique{criticalPatterns.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-red-600 dark:text-red-300">
              {criticalPatterns[0]?.title}
            </p>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">✅</span>
              <span className="text-sm text-green-800 dark:text-green-200">
                Aucun problème critique détecté
              </span>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-sm font-bold text-blue-600">
              {insights.taskCompletionRate.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Réussite
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-purple-600">
              {Math.round(insights.averageTaskTime)}min
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Moy/tâche
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-orange-600">
              {Math.round(100 - insights.procrastinationScore)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Action
            </div>
          </div>
        </div>

        {/* Recommendation */}
        {insights.recommendations.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">💡</span>
              <div>
                <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Conseil du moment
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  {insights.recommendations[0]}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Link href="/productivity/insights">
            <Button size="sm" variant="outline" className="w-full text-xs">
              Voir analyse complète
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default ProductivityWidget;