'use client';

import { useState, useEffect } from 'react';
import { Budget, BudgetPeriodHistory } from '@/src/shared/types';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import Modal from '@/src/presentation/components/ui/Modal';
import Button from '@/src/presentation/components/ui/Button';

interface BudgetHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget;
}

const BudgetHistoryModal: React.FC<BudgetHistoryModalProps> = ({
  isOpen,
  onClose,
  budget
}) => {
  const { getBudgetHistory, getBudgetStatistics } = useFinance();
  const [history, setHistory] = useState<BudgetPeriodHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const statistics = getBudgetStatistics(budget);

  useEffect(() => {
    if (isOpen && budget.id) {
      loadHistory();
    }
  }, [isOpen, budget.id]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const budgetHistory = await getBudgetHistory(budget.id);
      setHistory(budgetHistory);
    } catch (error) {
      console.error('Error loading budget history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: BudgetPeriodHistory['status']) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'exceeded':
        return 'Dépassé';
      case 'under_utilized':
        return 'Sous-utilisé';
      default:
        return status;
    }
  };

  const getStatusColor = (status: BudgetPeriodHistory['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'exceeded':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'under_utilized':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Historique du budget: ${budget.name}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Utilisation moyenne
            </h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {statistics.averageUtilization.toFixed(1)}%
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total dépensé
            </h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {statistics.totalSpent.toFixed(0)} FCFA
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Périodes complétées
            </h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {budget.totalPeriodsCompleted}
            </p>
          </div>
        </div>

        {/* Répartition des statuts */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Répartition des performances
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {statistics.periods.completed}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Terminés</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">
                {statistics.periods.exceeded}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Dépassés</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {statistics.periods.underUtilized}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Sous-utilisés</p>
            </div>
          </div>
        </div>

        {/* Meilleures et pires périodes */}
        {(statistics.bestPeriod || statistics.worstPeriod) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statistics.bestPeriod && (
              <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  🏆 Meilleure période
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Période {statistics.bestPeriod.periodNumber} - {statistics.bestPeriod.utilizationPercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(statistics.bestPeriod.startDate).toLocaleDateString('fr-FR')} au{' '}
                  {new Date(statistics.bestPeriod.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}

            {statistics.worstPeriod && (
              <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  📉 Période à améliorer
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Période {statistics.worstPeriod.periodNumber} - {statistics.worstPeriod.utilizationPercentage.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(statistics.worstPeriod.startDate).toLocaleDateString('fr-FR')} au{' '}
                  {new Date(statistics.worstPeriod.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Historique détaillé */}
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Historique des périodes
          </h4>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Chargement de l'historique...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun historique disponible pour ce budget.
              </p>
              {!budget.isRecurring && (
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  L'historique n'est disponible que pour les budgets récurrents.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((period) => (
                <div
                  key={period.periodNumber}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      Période {period.periodNumber}
                    </h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(period.status)}`}>
                      {getStatusLabel(period.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Période</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {new Date(period.startDate).toLocaleDateString('fr-FR')} au{' '}
                        {new Date(period.endDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Budget</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {period.budgetedAmount.toFixed(0)} FCFA
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Dépensé</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {period.spentAmount.toFixed(0)} FCFA
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Utilisation</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {period.utilizationPercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {period.transactionCount > 0 && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {period.transactionCount} transaction{period.transactionCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BudgetHistoryModal;