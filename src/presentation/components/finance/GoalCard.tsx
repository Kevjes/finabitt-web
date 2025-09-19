'use client';

import { useState } from 'react';
import { Goal } from '@/src/shared/types';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { formatAmount, Currency } from '@/src/shared/utils/currency';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';

interface GoalCardProps {
  goal: Goal;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  const { accounts, updateGoal } = useFinance();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [addAmount, setAddAmount] = useState(0);

  const getProgressPercentage = () => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getProgressColor = () => {
    const percentage = getProgressPercentage();
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const formatCurrency = (amount: number) => {
    const account = accounts.find(a => a.id === goal.accountId);
    const currency = (account?.currency || 'FCFA') as Currency;
    return formatAmount(amount, currency);
  };

  const getGoalTypeInfo = (type: Goal['type']) => {
    const types = {
      savings: { label: 'Épargne', icon: '🐷', color: 'text-green-600' },
      debt_payment: { label: 'Remboursement', icon: '💳', color: 'text-red-600' },
      investment: { label: 'Investissement', icon: '📈', color: 'text-blue-600' },
      purchase: { label: 'Achat', icon: '🛍️', color: 'text-purple-600' }
    };
    return types[type];
  };

  const getPriorityInfo = (priority: Goal['priority']) => {
    const priorities = {
      low: { label: 'Faible', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      medium: { label: 'Moyenne', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      high: { label: 'Haute', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' }
    };
    return priorities[priority];
  };

  const getDaysToTarget = () => {
    if (!goal.targetDate) return null;
    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMonthlyContributionNeeded = () => {
    if (!goal.targetDate || goal.completedAt) return 0;
    const remaining = goal.targetAmount - goal.currentAmount;
    const daysToTarget = getDaysToTarget();
    if (!daysToTarget || daysToTarget <= 0) return remaining;
    const monthsToTarget = daysToTarget / 30;
    return remaining / monthsToTarget;
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Compte inconnu';
  };

  const handleAddFunds = async () => {
    if (addAmount <= 0) return;

    const newAmount = goal.currentAmount + addAmount;
    const isCompleted = newAmount >= goal.targetAmount;

    await updateGoal(goal.id, {
      currentAmount: Math.min(newAmount, goal.targetAmount),
      completedAt: isCompleted ? new Date() : undefined
    });

    setAddAmount(0);
    setIsAddingFunds(false);
  };

  const typeInfo = getGoalTypeInfo(goal.type);
  const priorityInfo = getPriorityInfo(goal.priority);
  const progressPercentage = getProgressPercentage();
  const daysToTarget = getDaysToTarget();
  const monthlyNeeded = getMonthlyContributionNeeded();
  const remainingAmount = goal.targetAmount - goal.currentAmount;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{typeInfo.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {goal.name}
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className={typeInfo.color}>{typeInfo.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {goal.completedAt && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                ✅ Terminé
              </span>
            )}
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

        {/* Description */}
        {goal.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {goal.description}
          </p>
        )}

        {/* Montants */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Économisé</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(goal.currentAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Objectif</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(goal.targetAmount)}
            </span>
          </div>
          {!goal.completedAt && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Restant</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progression</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Informations sur la date cible */}
        {goal.targetDate && !goal.completedAt && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Date cible</span>
              <span className="text-gray-900 dark:text-gray-100">
                {new Date(goal.targetDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
            {daysToTarget !== null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Temps restant</span>
                <span className={`${
                  daysToTarget > 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-600 dark:text-red-400'
                }`}>
                  {daysToTarget > 0 ? (
                    `${daysToTarget} jour${daysToTarget > 1 ? 's' : ''}`
                  ) : (
                    'Objectif en retard'
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Contribution mensuelle recommandée */}
        {!goal.completedAt && monthlyNeeded > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Contribution mensuelle recommandée
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Pour atteindre l'objectif à temps
                </p>
              </div>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(monthlyNeeded)}
              </span>
            </div>
          </div>
        )}

        {/* Contribution mensuelle actuelle */}
        {goal.monthlyContribution && goal.monthlyContribution > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Contribution mensuelle</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(goal.monthlyContribution)}
            </span>
          </div>
        )}

        {/* Compte associé */}
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span>Compte: {getAccountName(goal.accountId)}</span>
        </div>

        {/* Date de completion */}
        {goal.completedAt && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
              <span>🎉</span>
              <p className="text-sm font-medium">
                Objectif atteint le {new Date(goal.completedAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {!goal.completedAt && (
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {!isAddingFunds ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingFunds(true)}
                  className="flex-1 text-xs"
                >
                  💰 Ajouter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  📊 Voir détails
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={remainingAmount}
                    value={addAmount || ''}
                    onChange={(e) => setAddAmount(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Montant"
                  />
                  <span className="text-xs text-gray-500 py-1">FCFA</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddFunds}
                    disabled={addAmount <= 0 || addAmount > remainingAmount}
                    className="flex-1 text-xs"
                  >
                    Confirmer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingFunds(false);
                      setAddAmount(0);
                    }}
                    className="flex-1 text-xs"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default GoalCard;