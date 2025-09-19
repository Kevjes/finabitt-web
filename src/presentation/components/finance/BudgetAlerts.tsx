'use client';

import { useState } from 'react';
import { useBudgetAlerts } from '@/src/presentation/hooks/useBudgetAlerts';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Budget } from '@/src/shared/types';
import { formatAmount, DEFAULT_CURRENCY } from '@/src/shared/utils/currency';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';
import BudgetTransferModal from './BudgetTransferModal';

const BudgetAlerts: React.FC = () => {
  const { alerts, loading, dismissAlert } = useBudgetAlerts();
  const { budgets } = useFinance();
  const [transferBudget, setTransferBudget] = useState<Budget | null>(null);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <h3 className="font-medium text-green-800 dark:text-green-200">
              Tous vos budgets sont sous contrôle
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              Aucun dépassement détecté ce mois-ci
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'danger':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'danger':
        return '⚠️';
      case 'warning':
        return '💡';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Alertes budgétaires ({alerts.length})
        </h3>
      </div>

      {alerts.map((alert) => (
        <Card
          key={alert.budgetId}
          className={`${getSeverityStyle(alert.severity)} border`}
        >
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                <div className="flex-1">
                  <h4 className="font-semibold">
                    {alert.budgetName} - {alert.category}
                  </h4>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismissAlert(alert.budgetId)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Dépensé : {formatAmount(alert.spentAmount, DEFAULT_CURRENCY)}</span>
                <span>Budget : {formatAmount(alert.budgetAmount, DEFAULT_CURRENCY)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    alert.percentage >= 120 ? 'bg-red-600' :
                    alert.percentage >= 100 ? 'bg-orange-500' :
                    alert.percentage >= 80 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs">
                <span>{alert.percentage.toFixed(1)}% utilisé</span>
                {alert.percentage > 100 && (
                  <span className="font-medium">
                    Dépassement : {formatAmount(alert.spentAmount - alert.budgetAmount, DEFAULT_CURRENCY)}
                  </span>
                )}
              </div>
            </div>

            {/* Suggestions */}
            {alert.suggestions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">
                  💡 Suggestions pour réduire les dépenses :
                </h5>
                <ul className="text-xs space-y-1">
                  {alert.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      <span className="text-gray-600 dark:text-gray-400">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  // TODO: Ouvrir le modal de modification du budget
                  console.log('Modifier le budget:', alert.budgetId);
                }}
              >
                Ajuster le budget
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  // TODO: Naviguer vers les transactions de cette catégorie
                  console.log('Voir les dépenses:', alert.category);
                }}
              >
                Voir les dépenses
              </Button>
              {alert.percentage > 100 && (
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    const budget = budgets.find(b => b.id === alert.budgetId);
                    if (budget) setTransferBudget(budget);
                  }}
                >
                  Transférer des fonds
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* Modal de transfert */}
      {transferBudget && (
        <BudgetTransferModal
          isOpen={!!transferBudget}
          onClose={() => setTransferBudget(null)}
          sourceBudget={transferBudget}
          onTransferComplete={() => {
            setTransferBudget(null);
            window.location.reload(); // Actualiser les données
          }}
        />
      )}
    </div>
  );
};

export default BudgetAlerts;