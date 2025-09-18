'use client';

import { useState } from 'react';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Account } from '@/src/shared/types';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';
import CreateAccountModal from './CreateAccountModal';
import AccountCard from './AccountCard';

const AccountsOverview: React.FC = () => {
  const { accounts, loading, error, getTotalBalance } = useFinance();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<string>('all');

  const accountTypes = [
    { value: 'all', label: 'Tous les comptes', icon: '💼' },
    { value: 'checking', label: 'Comptes courants', icon: '🏦' },
    { value: 'savings', label: 'Épargne', icon: '🐷' },
    { value: 'cash', label: 'Espèces', icon: '💵' },
    { value: 'investment', label: 'Investissements', icon: '📈' },
    { value: 'credit', label: 'Crédit', icon: '💳' }
  ];

  const filteredAccounts = selectedAccountType === 'all'
    ? accounts
    : accounts.filter(account => account.type === selectedAccountType);

  const getAccountsByType = () => {
    const grouped = accounts.reduce((acc, account) => {
      if (!acc[account.type]) {
        acc[account.type] = [];
      }
      acc[account.type].push(account);
      return acc;
    }, {} as Record<string, Account[]>);

    return grouped;
  };

  const getAccountTypeStats = () => {
    const grouped = getAccountsByType();
    return accountTypes.slice(1).map(type => {
      const typeAccounts = grouped[type.value] || [];
      const total = typeAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
      return {
        ...type,
        count: typeAccounts.length,
        total
      };
    });
  };

  const totalBalance = getTotalBalance();
  const accountStats = getAccountTypeStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des comptes...</p>
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
            Mes comptes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez et suivez vos comptes financiers
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="whitespace-nowrap"
        >
          ➕ Nouveau compte
        </Button>
      </div>

      {/* Balance totale */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Solde total
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {totalBalance.toFixed(2)} €
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Réparti sur {accounts.length} compte{accounts.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-4xl">💰</div>
        </div>
      </Card>

      {/* Stats par type de compte */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountStats.map((stat) => (
          <Card key={stat.value} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {stat.label}
                  </p>
                  <p className="text-sm text-gray-500">
                    {stat.count} compte{stat.count > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {stat.total.toFixed(2)} €
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {accountTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setSelectedAccountType(type.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedAccountType === type.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <span>{type.icon}</span>
            {type.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Liste des comptes */}
      <div>
        {filteredAccounts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAccounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏦</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {selectedAccountType === 'all' ? 'Aucun compte' : 'Aucun compte de ce type'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedAccountType === 'all'
                ? 'Commencez par créer votre premier compte'
                : 'Aucun compte ne correspond à ce filtre'
              }
            </p>
            {selectedAccountType === 'all' && (
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Créer un compte
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default AccountsOverview;