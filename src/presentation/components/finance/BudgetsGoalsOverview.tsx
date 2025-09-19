'use client';

import { useState } from 'react';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Budget, Goal } from '@/src/shared/types';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';
import BudgetCard from './BudgetCard';
import GoalCard from './GoalCard';
import CreateBudgetModal from './CreateBudgetModal';
import CreateGoalModal from './CreateGoalModal';

const BudgetsGoalsOverview: React.FC = () => {
  const { budgets, goals, loading, error, refetch } = useFinance();
  const [activeTab, setActiveTab] = useState<'budgets' | 'goals'>('budgets');
  const [isCreateBudgetModalOpen, setIsCreateBudgetModalOpen] = useState(false);
  const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);

  const getBudgetStats = () => {
    const totalBudgets = budgets.length;
    const activeBudgets = budgets.filter(b => b.isActive).length;
    const overBudget = budgets.filter(b => b.spent > b.amount).length;
    const nearLimit = budgets.filter(b => {
      const percentage = (b.spent / b.amount) * 100;
      return percentage >= b.alertThreshold && percentage < 100;
    }).length;

    const totalAllocated = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

    return {
      totalBudgets,
      activeBudgets,
      overBudget,
      nearLimit,
      totalAllocated,
      totalSpent,
      remainingBudget: totalAllocated - totalSpent
    };
  };

  const getGoalStats = () => {
    const totalGoals = goals.length;
    const activeGoals = goals.filter(g => g.isActive && !g.completedAt).length;
    const completedGoals = goals.filter(g => g.completedAt).length;
    const nearTarget = goals.filter(g => {
      if (g.completedAt) return false;
      const percentage = (g.currentAmount / g.targetAmount) * 100;
      return percentage >= 80;
    }).length;

    const totalTarget = goals.filter(g => g.isActive).reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.filter(g => g.isActive).reduce((sum, g) => sum + g.currentAmount, 0);

    return {
      totalGoals,
      activeGoals,
      completedGoals,
      nearTarget,
      totalTarget,
      totalSaved,
      remainingToSave: totalTarget - totalSaved
    };
  };

  const budgetStats = getBudgetStats();
  const goalStats = getGoalStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Budgets & Objectifs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Planifiez et suivez vos budgets et objectifs financiers
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="whitespace-nowrap"
          >
            🔄 Actualiser
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (activeTab === 'budgets') {
                setIsCreateBudgetModalOpen(true);
              } else {
                setIsCreateGoalModalOpen(true);
              }
            }}
            className="whitespace-nowrap"
          >
            ➕ Nouveau {activeTab === 'budgets' ? 'budget' : 'objectif'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('budgets')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'budgets'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          📊 Budgets ({budgets.length})
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'goals'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          🎯 Objectifs ({goals.length})
        </button>
      </div>

      {/* Stats */}
      {activeTab === 'budgets' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Budget total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {budgetStats.totalAllocated.toFixed(0)} FCFA
                </p>
                <p className="text-xs text-gray-500">
                  {budgetStats.activeBudgets} budgets actifs
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💸</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dépensé</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {budgetStats.totalSpent.toFixed(0)} FCFA
                </p>
                <p className="text-xs text-gray-500">
                  {((budgetStats.totalSpent / budgetStats.totalAllocated) * 100).toFixed(1)}% du budget
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💵</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Disponible</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {budgetStats.remainingBudget.toFixed(0)} FCFA
                </p>
                <p className="text-xs text-gray-500">
                  Reste à dépenser
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alertes</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {budgetStats.nearLimit + budgetStats.overBudget}
                </p>
                <p className="text-xs text-gray-500">
                  {budgetStats.overBudget} dépassés, {budgetStats.nearLimit} proches
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Objectif total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {goalStats.totalTarget.toFixed(0)} FCFA
                </p>
                <p className="text-xs text-gray-500">
                  {goalStats.activeGoals} objectifs actifs
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Économisé</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {goalStats.totalSaved.toFixed(0)} FCFA
                </p>
                <p className="text-xs text-gray-500">
                  {goalStats.totalTarget > 0 ? ((goalStats.totalSaved / goalStats.totalTarget) * 100).toFixed(1) : 0}% de l'objectif
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reste à épargner</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {goalStats.remainingToSave.toFixed(0)} FCFA
                </p>
                <p className="text-xs text-gray-500">
                  Pour atteindre vos objectifs
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Progression</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {goalStats.completedGoals}
                </p>
                <p className="text-xs text-gray-500">
                  Terminés, {goalStats.nearTarget} proche de l'objectif
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Content */}
      {activeTab === 'budgets' ? (
        <div>
          {budgets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {budgets.map((budget) => (
                <BudgetCard key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Aucun budget défini
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Créez votre premier budget pour mieux contrôler vos dépenses
              </p>
              <Button
                variant="primary"
                onClick={() => setIsCreateBudgetModalOpen(true)}
              >
                Créer un budget
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {goals.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Aucun objectif défini
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Définissez vos premiers objectifs financiers pour atteindre vos rêves
              </p>
              <Button
                variant="primary"
                onClick={() => setIsCreateGoalModalOpen(true)}
              >
                Créer un objectif
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateBudgetModal
        isOpen={isCreateBudgetModalOpen}
        onClose={() => setIsCreateBudgetModalOpen(false)}
      />

      <CreateGoalModal
        isOpen={isCreateGoalModalOpen}
        onClose={() => setIsCreateGoalModalOpen(false)}
      />
    </div>
  );
};

export default BudgetsGoalsOverview;