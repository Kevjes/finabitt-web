'use client';

import { useAuth } from '@/src/presentation/hooks/useAuth';
import { useHabits } from '@/src/presentation/hooks/useHabits';
import { useTasks } from '@/src/presentation/hooks/useTasks';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';
import ThemeToggle from '@/src/presentation/components/ui/ThemeToggle';
import SuggestionPanel from '@/src/presentation/components/suggestions/SuggestionPanel';
import GamificationWidget from '@/src/presentation/components/gamification/GamificationWidget';
import BudgetAlertsWidget from '@/src/presentation/components/finance/BudgetAlertsWidget';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { habits, loading: habitsLoading } = useHabits();
  const { tasks, loading: tasksLoading } = useTasks();
  const { accounts, getTotalBalance, getMonthlyIncome, loading: financeLoading } = useFinance();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">Finabitt</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Bonjour, {user?.email}</span>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Tableau de bord</h2>
          <p className="text-gray-600 dark:text-gray-400">Vue d&apos;ensemble de vos habitudes, performances et finances</p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Habitudes Card */}
          <Card shadow="lg" className="cursor-pointer hover:shadow-xl transition-shadow" onClick={() => window.location.href = '/habits'}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Habitudes</h3>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-medium">{habitsLoading ? '...' : habits.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Bonnes</span>
                <span className="font-medium text-primary">{habitsLoading ? '...' : habits.filter(h => h.type === 'good').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Mauvaises</span>
                <span className="font-medium text-accent">{habitsLoading ? '...' : habits.filter(h => h.type === 'bad').length}</span>
              </div>
              {habits.length === 0 && !habitsLoading && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">Cliquez pour créer votre première habitude</p>
              )}
            </div>
          </Card>

          {/* Performances Card */}
          <Card shadow="lg" className="cursor-pointer hover:shadow-xl transition-shadow" onClick={() => window.location.href = '/tasks'}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Performances</h3>
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-medium">{tasksLoading ? '...' : tasks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Terminées</span>
                <span className="font-medium text-success">{tasksLoading ? '...' : tasks.filter(t => t.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">En cours</span>
                <span className="font-medium text-accent">{tasksLoading ? '...' : tasks.filter(t => t.status === 'in_progress').length}</span>
              </div>
              {tasks.length === 0 && !tasksLoading && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">Cliquez pour créer votre première tâche</p>
              )}
            </div>
          </Card>

          {/* Finances Card */}
          <Card shadow="lg" className="cursor-pointer hover:shadow-xl transition-shadow" onClick={() => window.location.href = '/finances/accounts'}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Finances</h3>
              <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Solde total</span>
                <span className="font-medium">{financeLoading ? '...' : `${getTotalBalance().toFixed(0)} FCFA`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Ce mois</span>
                <span className="font-medium text-success">{financeLoading ? '...' : `+${getMonthlyIncome().toFixed(0)} FCFA`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Comptes</span>
                <span className="font-medium">{financeLoading ? '...' : accounts.length}</span>
              </div>
              {accounts.length === 0 && !financeLoading && (
                <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">Cliquez pour créer votre premier compte</p>
              )}
            </div>
          </Card>
        </div>

        {/* Widgets avancés */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GamificationWidget />
          <BudgetAlertsWidget />
        </div>

        {/* Suggestions intelligentes */}
        <SuggestionPanel className="mb-8" maxSuggestions={3} />

        {/* Quick Actions */}
        <Card shadow="lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Actions rapides</h3>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col" onClick={() => window.location.href = '/habits'}>
              <div className="w-5 h-5 mb-1 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">+</span>
              </div>
              <span className="text-xs">Nouvelle habitude</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col" onClick={() => window.location.href = '/tasks'}>
              <div className="w-5 h-5 mb-1 bg-accent rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">□</span>
              </div>
              <span className="text-xs">Nouvelle tâche</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col" onClick={() => window.location.href = '/finances/accounts'}>
              <div className="w-5 h-5 mb-1 bg-success rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">FCFA</span>
              </div>
              <span className="text-xs">Nouveau compte</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col" onClick={() => window.location.href = '/finances/transactions'}>
              <div className="w-5 h-5 mb-1 bg-info rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">↕</span>
              </div>
              <span className="text-xs">Transaction</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col" onClick={() => window.location.href = '/profile/achievements'}>
              <div className="w-5 h-5 mb-1 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">🏆</span>
              </div>
              <span className="text-xs">Achievements</span>
            </Button>
            <Button variant="outline" size="sm" className="h-auto py-3 flex-col" onClick={() => window.location.href = '/productivity/insights'}>
              <div className="w-5 h-5 mb-1 bg-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">📊</span>
              </div>
              <span className="text-xs">Insights</span>
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;