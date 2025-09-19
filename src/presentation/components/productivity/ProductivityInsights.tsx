'use client';

import { useProductivityAnalytics } from '@/src/presentation/hooks/useProductivityAnalytics';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';

const ProductivityInsights: React.FC = () => {
  const {
    insights,
    loading,
    getPatternsByType,
    getCriticalPatterns,
    getProductivityGrade,
    refresh
  } = useProductivityAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  const productivityGrade = getProductivityGrade();
  const criticalPatterns = getCriticalPatterns();
  const procrastinationPatterns = getPatternsByType('procrastination');
  const productivePatterns = getPatternsByType('productive_time');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🚨';
      case 'medium':
        return '⚠️';
      default:
        return '✅';
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'procrastination':
        return '⏰';
      case 'productive_time':
        return '🚀';
      case 'task_overload':
        return '📊';
      case 'habit_neglect':
        return '🎯';
      default:
        return '💡';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Insights de productivité
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analysez vos patterns et recevez des recommandations personnalisées
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          🔄 Actualiser
        </Button>
      </div>

      {/* Productivity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="text-center">
            <div className={`text-3xl font-bold ${productivityGrade.color}`}>
              {productivityGrade.grade}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Note globale
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {productivityGrade.message}
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {insights.taskCompletionRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Taux de réussite
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(insights.averageTaskTime)}min
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Temps moyen/tâche
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(100 - insights.procrastinationScore)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Score d'action
            </div>
          </div>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalPatterns.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
              🚨 Alertes critiques ({criticalPatterns.length})
            </h3>
            <div className="space-y-3">
              {criticalPatterns.map((pattern, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    {getPatternIcon(pattern.type)} {pattern.title}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {pattern.description}
                  </p>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Actions recommandées :</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {pattern.suggestions.slice(0, 2).map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Patterns Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Challenges */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            ⚠️ Défis détectés
          </h3>
          {insights.patterns.filter(p => p.severity !== 'low' && p.type !== 'productive_time').length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-gray-600 dark:text-gray-400">
                Aucun problème majeur détecté !
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Vos habitudes de productivité sont excellentes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.patterns
                .filter(p => p.severity !== 'low' && p.type !== 'productive_time')
                .map((pattern, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getSeverityColor(pattern.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{getSeverityIcon(pattern.severity)}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {pattern.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {pattern.description}
                        </p>
                        {pattern.affectedItems.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Éléments concernés : {pattern.affectedItems.slice(0, 3).join(', ')}
                              {pattern.affectedItems.length > 3 && ` +${pattern.affectedItems.length - 3} autres`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Strengths */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            ✨ Points forts
          </h3>
          {productivePatterns.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💪</div>
              <p className="text-gray-600 dark:text-gray-400">
                Continuez vos efforts !
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Les patterns positifs apparaîtront avec plus de données
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {productivePatterns.map((pattern, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🚀</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800 dark:text-green-200">
                        {pattern.title}
                      </h4>
                      <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                        {pattern.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          💡 Recommandations personnalisées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.recommendations.map((recommendation, index) => (
            <div
              key={index}
              className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {recommendation}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Productivity Tips */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          🧠 Astuce du jour
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            <strong>Technique Pomodoro :</strong> Travaillez par blocs de 25 minutes avec des pauses de 5 minutes.
            Cette méthode améliore la concentration et réduit la fatigue mentale. Après 4 blocs, prenez une pause plus longue de 15-30 minutes.
          </p>
        </div>
      </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductivityInsights;