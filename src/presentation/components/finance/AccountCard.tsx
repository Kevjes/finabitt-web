'use client';

import { useState } from 'react';
import { Account } from '@/src/shared/types';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { useAccountRules } from '@/src/presentation/hooks/useAccountRules';
import { formatAmount, Currency } from '@/src/shared/utils/currency';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';
import EditAccountModal from './EditAccountModal';

interface AccountCardProps {
  account: Account;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const { getTransactionsByAccount } = useFinance();
  const { getRulesByAccount } = useAccountRules();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Récupérer les règles liées à ce compte
  const linkedRules = getRulesByAccount(account.id);
  const activeRules = linkedRules.filter(rule => rule.isActive);

  const getAccountTypeInfo = (type: Account['type']) => {
    const types = {
      checking: { label: 'Compte courant', icon: '🏦', color: 'blue' },
      savings: { label: 'Épargne', icon: '🐷', color: 'green' },
      cash: { label: 'Espèces', icon: '💵', color: 'yellow' },
      investment: { label: 'Investissement', icon: '📈', color: 'purple' },
      credit: { label: 'Crédit', icon: '💳', color: 'red' }
    };
    return types[type];
  };

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, (account.currency || 'FCFA') as Currency);
  };

  const formatAccountNumber = (accountNumber?: string) => {
    if (!accountNumber) return null;
    // Masquer tout sauf les 4 derniers chiffres
    return '****' + accountNumber.slice(-4);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600 dark:text-green-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const typeInfo = getAccountTypeInfo(account.type);
  const transactions = getTransactionsByAccount(account.id);
  const recentTransactions = transactions.slice(0, 3);

  const balanceDifference = account.currentBalance - account.initialBalance;
  const hasPositiveGrowth = balanceDifference > 0;

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {account.icon ? (
                <span className="text-2xl">{account.icon}</span>
              ) : (
                <span className="text-2xl">{typeInfo.icon}</span>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {account.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {typeInfo.label}
                </p>
                {account.bankName && (
                  <p className="text-xs text-gray-400">
                    {account.bankName}
                  </p>
                )}

                {/* Indicateurs de règles de liaison */}
                {activeRules.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full flex items-center gap-1 cursor-help"
                      title={`Règles actives:\n${activeRules.map(rule => `• ${rule.name} (${rule.type === 'percentage' ? rule.value + '%' : formatAmount(rule.value, 'FCFA')})`).join('\n')}`}
                    >
                      🔗 {activeRules.length} règle{activeRules.length > 1 ? 's' : ''}
                    </span>
                    {linkedRules.some(rule => !rule.isActive) && (
                      <span
                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full cursor-help"
                        title={`${linkedRules.filter(rule => !rule.isActive).length} règle(s) inactive(s)`}
                      >
                        ⏸️ {linkedRules.filter(rule => !rule.isActive).length}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {account.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: account.color }}
                />
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

          {/* Balance */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Solde actuel
              </span>
              <span className={`text-xl font-bold ${getBalanceColor(account.currentBalance)}`}>
                {formatCurrency(account.currentBalance)}
              </span>
            </div>

            {account.probableBalance !== account.currentBalance && (
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-gray-500">
                  Solde probable
                </span>
                <span className={`text-sm ${getBalanceColor(account.probableBalance)}`}>
                  {formatCurrency(account.probableBalance)}
                </span>
              </div>
            )}

            {/* Evolution du solde */}
            {balanceDifference !== 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Évolution</span>
                <span className={hasPositiveGrowth ? 'text-green-600' : 'text-red-600'}>
                  {hasPositiveGrowth ? '+' : ''}{formatCurrency(balanceDifference)}
                  <span className="ml-1">
                    {hasPositiveGrowth ? '📈' : '📉'}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Informations supplémentaires */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              {account.accountNumber && (
                <span>{formatAccountNumber(account.accountNumber)}</span>
              )}
            </div>
            <div>
              {transactions.length} transaction{transactions.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Transactions récentes */}
          {recentTransactions.length > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Transactions récentes</p>
              <div className="space-y-2">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span>
                        {transaction.type === 'income' ? '📈' :
                         transaction.type === 'expense' ? '📉' : '🔄'}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 truncate max-w-32">
                        {transaction.description}
                      </span>
                    </div>
                    <span className={`font-medium ${
                      transaction.type === 'income' ? 'text-green-600' :
                      transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </div>
                ))}
              </div>

              {transactions.length > 3 && (
                <button className="text-xs text-primary hover:underline mt-2">
                  Voir toutes les transactions
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              💰 Ajouter fonds
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              💸 Retirer
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Account Modal */}
      <EditAccountModal
        account={account}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
};

export default AccountCard;