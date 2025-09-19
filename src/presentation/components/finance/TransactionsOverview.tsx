'use client';

import { useState } from 'react';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Transaction } from '@/src/shared/types';
import Button from '@/src/presentation/components/ui/Button';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Card from '@/src/presentation/components/ui/Card';
import TransactionCard from './TransactionCard';
import CreateTransactionModal from './CreateTransactionModal';

const TransactionsOverview: React.FC = () => {
  const {
    transactions,
    accounts,
    categories,
    loading,
    error,
    getMonthlyIncome,
    getMonthlyExpenses,
    refetch
  } = useFinance();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');

  const typeOptions = [
    { value: 'all', label: 'Tous les types', icon: '💼' },
    { value: 'income', label: 'Revenus', icon: '📈' },
    { value: 'expense', label: 'Dépenses', icon: '📉' },
    { value: 'transfer', label: 'Virements', icon: '🔄' }
  ];

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' }
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'Toutes les dates' },
    { value: 'today', label: "Aujourd'hui" },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'year', label: 'Cette année' }
  ];

  const getDateRangeFilter = (range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'today':
        return (date: Date) => date >= today;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return (date: Date) => date >= weekStart;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return (date: Date) => date >= monthStart;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return (date: Date) => date >= yearStart;
      default:
        return () => true;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    const matchesCategory = !selectedCategory || transaction.category === selectedCategory;
    const matchesAccount = !selectedAccount ||
                          transaction.sourceAccountId === selectedAccount ||
                          transaction.destinationAccountId === selectedAccount;
    const matchesStatus = !selectedStatus || transaction.status === selectedStatus;
    const matchesDate = getDateRangeFilter(dateRange)(transaction.date);

    return matchesSearch && matchesType && matchesCategory && matchesAccount && matchesStatus && matchesDate;
  });

  const getTransactionStats = () => {
    const monthlyIncome = getMonthlyIncome();
    const monthlyExpenses = getMonthlyExpenses();
    const totalTransactions = transactions.length;
    const pendingCount = transactions.filter(t => t.status === 'pending').length;

    return {
      monthlyIncome,
      monthlyExpenses,
      netIncome: monthlyIncome - monthlyExpenses,
      totalTransactions,
      pendingCount
    };
  };

  const stats = getTransactionStats();

  const accountOptions = [
    { value: '', label: 'Tous les comptes' },
    ...accounts.map(account => ({
      value: account.id,
      label: account.name
    }))
  ];

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    ...Array.from(new Set(transactions.map(t => t.category))).map(cat => ({
      value: cat,
      label: cat
    }))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des transactions...</p>
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
            Transactions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Suivez et gérez toutes vos transactions financières
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
            onClick={() => setIsCreateModalOpen(true)}
            className="whitespace-nowrap"
          >
            ➕ Nouvelle transaction
          </Button>
        </div>
      </div>

      {/* Stats mensuelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📈</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenus ce mois</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                +{stats.monthlyIncome.toFixed(0)} FCFA
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📉</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dépenses ce mois</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                -{stats.monthlyExpenses.toFixed(0)} FCFA
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Bilan mensuel</p>
              <p className={`text-xl font-bold ${
                stats.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {stats.netIncome >= 0 ? '+' : ''}{stats.netIncome.toFixed(0)} FCFA
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total / En attente</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalTransactions}
                {stats.pendingCount > 0 && (
                  <span className="text-sm font-normal text-orange-600 dark:text-orange-400 ml-1">
                    ({stats.pendingCount} en attente)
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Ligne 1: Recherche et vue */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une transaction..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📝 Liste
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-2 text-sm transition-colors border-l border-gray-300 dark:border-gray-600 ${
                  viewMode === 'chart'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📊 Graphique
              </button>
            </div>
          </div>

          {/* Ligne 2: Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select
              value={selectedType}
              onChange={setSelectedType}
              options={typeOptions}
              placeholder="Type"
            />
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categoryOptions}
              placeholder="Catégorie"
            />
            <Select
              value={selectedAccount}
              onChange={setSelectedAccount}
              options={accountOptions}
              placeholder="Compte"
            />
            <Select
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusOptions}
              placeholder="Statut"
            />
            <Select
              value={dateRange}
              onChange={(value) => setDateRange(value as any)}
              options={dateRangeOptions}
              placeholder="Période"
            />
          </div>

          {/* Filtres actifs */}
          {(searchTerm || selectedType !== 'all' || selectedCategory || selectedAccount || selectedStatus || dateRange !== 'all') && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Filtres actifs:</span>
              {searchTerm && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                  Recherche: "{searchTerm}"
                </span>
              )}
              {selectedType !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                  Type: {typeOptions.find(t => t.value === selectedType)?.label}
                </span>
              )}
              {selectedCategory && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                  Catégorie: {selectedCategory}
                </span>
              )}
              {selectedAccount && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                  Compte: {accounts.find(a => a.id === selectedAccount)?.name}
                </span>
              )}
              {selectedStatus && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                  Statut: {statusOptions.find(s => s.value === selectedStatus)?.label}
                </span>
              )}
              {dateRange !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                  Période: {dateRangeOptions.find(d => d.value === dateRange)?.label}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setSelectedCategory('');
                  setSelectedAccount('');
                  setSelectedStatus('');
                  setDateRange('all');
                }}
                className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                ✕ Effacer tout
              </button>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Liste des transactions */}
      <div>
        {filteredTransactions.length > 0 ? (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}

            {filteredTransactions.length < transactions.length && (
              <Card className="p-4 text-center text-sm text-gray-500">
                Affichage de {filteredTransactions.length} sur {transactions.length} transactions
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Aucune transaction trouvée
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {transactions.length === 0
                ? 'Commencez par créer votre première transaction'
                : 'Aucune transaction ne correspond à vos filtres'
              }
            </p>
            {transactions.length === 0 && (
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Créer une transaction
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default TransactionsOverview;