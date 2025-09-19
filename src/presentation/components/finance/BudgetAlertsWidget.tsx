'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useBudgetAlerts } from '@/src/presentation/hooks/useBudgetAlerts';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { formatAmount, DEFAULT_CURRENCY } from '@/src/shared/utils/currency';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';
import BudgetTransferModal from './BudgetTransferModal';

const BudgetAlertsWidget: React.FC = () => {
  const { alerts, loading, getCriticalAlerts, getTotalAlertsCount } = useBudgetAlerts();
  const { budgets } = useFinance();
  const [transferBudget, setTransferBudget] = useState<any>(null);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </Card>
    );
  }

  const criticalAlerts = getCriticalAlerts();
  const totalAlerts = getTotalAlertsCount();

  if (totalAlerts === 0) {
    return (
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-200">
                Budgets sous contrôle
              </h3>
              <p className="text-xs text-green-600 dark:text-green-300">
                Aucun dépassement ce mois-ci
              </p>
            </div>
          </div>
          <Link href="/finances/budgets">
            <Button size="sm" variant="outline" className="text-xs">
              Gérer les budgets
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {criticalAlerts.length > 0 ? '🚨' : totalAlerts > 0 ? '⚠️' : '💡'}
            </span>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Alertes budgétaires
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {totalAlerts} budget{totalAlerts > 1 ? 's' : ''} nécessite{totalAlerts > 1 ? 'nt' : ''} votre attention
              </p>
            </div>
          </div>
          <Link href="/finances/budgets">
            <Button size="sm" variant="outline" className="text-xs">
              Voir tout
            </Button>
          </Link>
        </div>

        {/* Alerts Summary */}
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <div
              key={alert.budgetId}
              className={`p-3 rounded-lg border ${
                alert.severity === 'critical'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : alert.severity === 'danger'
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {alert.budgetName}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {alert.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    alert.percentage >= 120 ? 'bg-red-600' :
                    alert.percentage >= 100 ? 'bg-orange-500' :
                    'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-600 dark:text-gray-400">
                  {formatAmount(alert.spentAmount, DEFAULT_CURRENCY)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {formatAmount(alert.budgetAmount, DEFAULT_CURRENCY)}
                </span>
              </div>
              {alert.percentage > 100 && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const budget = budgets.find(b => b.id === alert.budgetId);
                      if (budget) setTransferBudget(budget);
                    }}
                    className="w-full text-xs text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                  >
                    Transférer des fonds
                  </Button>
                </div>
              )}
            </div>
          ))}

          {alerts.length > 3 && (
            <div className="text-center">
              <Link href="/finances/budgets">
                <Button size="sm" variant="ghost" className="text-xs">
                  +{alerts.length - 3} autre{alerts.length - 3 > 1 ? 's' : ''} alerte{alerts.length - 3 > 1 ? 's' : ''}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              Budgets critiques : {criticalAlerts.length}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Total dépassements : {alerts.filter(a => a.percentage > 100).length}
            </span>
          </div>
        </div>
      </div>

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
    </Card>
  );
};

export default BudgetAlertsWidget;