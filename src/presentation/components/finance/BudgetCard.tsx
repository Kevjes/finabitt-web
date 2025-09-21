'use client';

import { useState } from 'react';
import { Budget } from '@/src/shared/types';
import { formatAmount } from '@/src/shared/utils/currency';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';
import BudgetHistoryModal from './BudgetHistoryModal';

interface BudgetCardProps {
  budget: Budget;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budget }) => {
  const { stopBudgetRecurrence, startBudgetRecurrence } = useFinance();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isTogglingRecurrence, setIsTogglingRecurrence] = useState(false);

  const getProgressPercentage = () => {
    return Math.min((budget.spent / budget.amount) * 100, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= budget.alertThreshold) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getProgressTextColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'text-red-600 dark:text-red-400';
    if (percentage >= budget.alertThreshold) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, 'FCFA');
  };

  const formatPeriod = (period: Budget['period']) => {
    const periods = {
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      quarterly: 'Trimestriel',
      yearly: 'Annuel',
      custom: 'Personnalisé'
    };
    return periods[period];
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const endDate = new Date(budget.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getBudgetStatus = () => {
    const percentage = getProgressPercentage();
    const daysRemaining = getDaysRemaining();

    if (percentage >= 100) {
      return { text: 'Budget dépassé', color: 'text-red-600 dark:text-red-400', icon: '🚨' };
    }
    if (percentage >= budget.alertThreshold) {
      return { text: 'Attention au budget', color: 'text-orange-600 dark:text-orange-400', icon: '⚠️' };
    }
    if (daysRemaining === 0) {
      return { text: 'Budget terminé', color: 'text-gray-600 dark:text-gray-400', icon: '🏁' };
    }
    return { text: 'Budget en cours', color: 'text-green-600 dark:text-green-400', icon: '✅' };
  };

  const handleToggleRecurrence = async () => {
    setIsTogglingRecurrence(true);
    try {
      if (budget.isRecurring) {
        await stopBudgetRecurrence(budget.id);
      } else {
        await startBudgetRecurrence(budget.id);
      }
    } catch (error) {
      console.error('Error toggling budget recurrence:', error);
    } finally {
      setIsTogglingRecurrence(false);
    }
  };

  const remainingAmount = budget.amount - budget.spent;
  const daysRemaining = getDaysRemaining();
  const status = getBudgetStatus();
  const progressPercentage = getProgressPercentage();

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {budget.name}
            </h3>
            <p className="text-sm text-gray-500">
              {budget.category} • {formatPeriod(budget.period)}
              {budget.isRecurring && (
                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                  🔄 Récurrent
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              budget.isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {budget.isActive ? 'Actif' : 'Inactif'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              ⚙️
            </Button>
          </div>
        </div>

        {/* Montants */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Dépensé</span>
            <span className={`font-semibold ${getProgressTextColor()}`}>
              {formatCurrency(budget.spent)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Budget</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(budget.amount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Restant</span>
            <span className={`font-semibold ${
              remainingAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(remainingAmount)}
            </span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progression</span>
            <span className={`font-medium ${getProgressTextColor()}`}>
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Statut et temps restant */}
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center gap-1 ${status.color}`}>
            <span>{status.icon}</span>
            <span className="font-medium">{status.text}</span>
          </div>
          <div className="text-gray-500">
            {daysRemaining > 0 ? (
              <span>{daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}</span>
            ) : (
              <span>Période terminée</span>
            )}
          </div>
        </div>

        {/* Période */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span>Du {new Date(budget.startDate).toLocaleDateString('fr-FR')}</span>
            <span>Au {new Date(budget.endDate).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        {/* Seuil d'alerte */}
        {progressPercentage >= budget.alertThreshold && progressPercentage < 100 && (
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <span>⚠️</span>
              <p className="text-sm font-medium">
                Vous avez atteint {budget.alertThreshold}% de votre budget
              </p>
            </div>
          </div>
        )}

        {/* Budget dépassé */}
        {progressPercentage >= 100 && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <span>🚨</span>
              <p className="text-sm font-medium">
                Budget dépassé de {formatCurrency(Math.abs(remainingAmount))}
              </p>
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              📊 Voir détails
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              📝 Ajouter dépense
            </Button>
          </div>

          <div className="flex gap-2">
            {budget.totalPeriodsCompleted > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryModalOpen(true)}
                className="flex-1 text-xs"
              >
                📈 Historique
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleRecurrence}
              disabled={isTogglingRecurrence}
              className="flex-1 text-xs"
            >
              {isTogglingRecurrence ? (
                <span className="animate-spin">⏳</span>
              ) : budget.isRecurring ? (
                '🔄 Arrêter récurrence'
              ) : (
                '🔄 Activer récurrence'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BudgetHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        budget={budget}
      />
    </Card>
  );
};

export default BudgetCard;