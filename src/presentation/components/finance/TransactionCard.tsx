'use client';

import { useState } from 'react';
import { Transaction } from '@/src/shared/types';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { formatAmount, Currency } from '@/src/shared/utils/currency';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';
import EditTransactionModal from './EditTransactionModal';

interface TransactionCardProps {
  transaction: Transaction;
  compact?: boolean;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  compact = false
}) => {
  const { accounts, budgets } = useFinance();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getTransactionTypeInfo = (type: Transaction['type']) => {
    const types = {
      income: { label: 'Revenu', icon: '📈', color: 'text-green-600 dark:text-green-400' },
      expense: { label: 'Dépense', icon: '📉', color: 'text-red-600 dark:text-red-400' },
      transfer: { label: 'Virement', icon: '🔄', color: 'text-blue-600 dark:text-blue-400' }
    };
    return types[type];
  };

  const getStatusInfo = (status: Transaction['status']) => {
    const statuses = {
      pending: { label: 'En attente', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400', icon: '⏳' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: '✅' },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: '❌' }
    };
    return statuses[status];
  };

  const formatCurrency = (amount: number) => {
    // For transaction cards, we need to get the currency from the account
    const sourceAccount = accounts.find(a => a.id === transaction.sourceAccountId);
    const destinationAccount = accounts.find(a => a.id === transaction.destinationAccountId);
    const currency = (sourceAccount?.currency || destinationAccount?.currency || 'FCFA') as Currency;
    return formatAmount(amount, currency);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getAccountName = (accountId?: string) => {
    if (!accountId) return 'Compte supprimé';
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Compte inconnu';
  };

  const getBudgetName = (budgetId?: string) => {
    if (!budgetId) return null;
    const budget = budgets.find(b => b.id === budgetId);
    return budget?.name;
  };

  const typeInfo = getTransactionTypeInfo(transaction.type);
  const statusInfo = getStatusInfo(transaction.status);

  const getAmountDisplay = () => {
    const sign = transaction.type === 'expense' ? '-' : '+';
    return `${sign}${formatCurrency(Math.abs(transaction.amount))}`;
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-lg">{typeInfo.icon}</span>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-32">
              {transaction.description}
            </p>
            <p className="text-xs text-gray-500">
              {transaction.category}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-semibold ${typeInfo.color}`}>
            {getAmountDisplay()}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(transaction.date)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">{typeInfo.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {transaction.description}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{transaction.category}</span>
                  {transaction.subcategory && (
                    <>
                      <span>•</span>
                      <span>{transaction.subcategory}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.icon} {statusInfo.label}
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

          {/* Montant */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(transaction.date)}
              {transaction.scheduledDate && transaction.scheduledDate.getTime() !== transaction.date.getTime() && (
                <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                  (Programmé: {transaction.scheduledDate.toLocaleDateString('fr-FR')})
                </span>
              )}
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${typeInfo.color}`}>
                {getAmountDisplay()}
              </p>
            </div>
          </div>

          {/* Comptes impliqués */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {transaction.type === 'income' && transaction.destinationAccountId && (
              <p>Vers: {getAccountName(transaction.destinationAccountId)}</p>
            )}
            {transaction.type === 'expense' && transaction.sourceAccountId && (
              <p>Depuis: {getAccountName(transaction.sourceAccountId)}</p>
            )}
            {transaction.type === 'transfer' && transaction.sourceAccountId && transaction.destinationAccountId && (
              <p>
                {getAccountName(transaction.sourceAccountId)} → {getAccountName(transaction.destinationAccountId)}
              </p>
            )}
          </div>

          {/* Budget lié */}
          {transaction.linkedBudgetId && getBudgetName(transaction.linkedBudgetId) && (
            <div className="text-sm">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                💰 Budget: {getBudgetName(transaction.linkedBudgetId)}
              </span>
            </div>
          )}

          {/* Informations supplémentaires */}
          {(transaction.tags?.length || transaction.location) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {transaction.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                >
                  #{tag}
                </span>
              ))}
              {transaction.location && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                  📍 {transaction.location}
                </span>
              )}
            </div>
          )}

          {/* Actions rapides (seulement pour les transactions en attente) */}
          {transaction.status === 'pending' && (
            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
              >
                ✅ Confirmer
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs text-red-600 hover:text-red-700 hover:border-red-300"
              >
                ❌ Annuler
              </Button>
            </div>
          )}

          {/* Récurrence */}
          {transaction.isRecurring && (
            <div className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <span>🔄</span>
              <span>Transaction récurrente</span>
            </div>
          )}

          {/* Reçu/Justificatif */}
          {transaction.receipt && (
            <div className="text-xs">
              <a
                href={transaction.receipt}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                📎 Voir le justificatif
              </a>
            </div>
          )}
        </div>
      </Card>

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={transaction}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
};

export default TransactionCard;