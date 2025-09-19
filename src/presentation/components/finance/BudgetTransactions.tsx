'use client';

import { useState } from 'react';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Budget } from '@/src/shared/types';
import { formatAmount, DEFAULT_CURRENCY } from '@/src/shared/utils/currency';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';

interface BudgetTransactionsProps {
  budget: Budget;
}

const BudgetTransactions: React.FC<BudgetTransactionsProps> = ({ budget }) => {
  const { transactions, accounts } = useFinance();
  const [showAll, setShowAll] = useState(false);

  // Filtrer les transactions liées à ce budget
  const budgetTransactions = transactions.filter(
    transaction =>
      transaction.linkedBudgetId === budget.id &&
      transaction.type === 'expense' &&
      transaction.status === 'completed'
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedTransactions = showAll ? budgetTransactions : budgetTransactions.slice(0, 5);

  const getAccountName = (accountId?: string) => {
    if (!accountId) return 'Compte inconnu';
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Compte inconnu';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (budgetTransactions.length === 0) {
    return (
      <Card className="bg-gray-50 dark:bg-gray-800">
        <div className="text-center py-6">
          <div className="text-4xl mb-2">💸</div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            Aucune dépense associée
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Les dépenses assignées à ce budget apparaîtront ici
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            Dépenses du budget ({budgetTransactions.length})
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total dépensé: {formatAmount(budget.spent, DEFAULT_CURRENCY)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progression</span>
            <span className="text-gray-600 dark:text-gray-400">
              {Math.round((budget.spent / budget.amount) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                budget.spent >= budget.amount ? 'bg-red-500' :
                budget.spent >= budget.amount * 0.8 ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">0</span>
            <span className="text-gray-500">{formatAmount(budget.amount, DEFAULT_CURRENCY)}</span>
          </div>
        </div>

        {/* Transactions list */}
        <div className="space-y-2">
          {displayedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💸</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {transaction.description}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(transaction.date)} • {getAccountName(transaction.sourceAccountId)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-red-600 dark:text-red-400">
                  -{formatAmount(transaction.amount, DEFAULT_CURRENCY)}
                </div>
                {transaction.category && (
                  <div className="text-xs text-gray-500">
                    {transaction.category}
                  </div>
                )}
              </div>
            </div>
          ))}

          {budgetTransactions.length > 5 && (
            <div className="text-center pt-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAll(!showAll)}
                className="text-xs"
              >
                {showAll
                  ? 'Voir moins'
                  : `Voir ${budgetTransactions.length - 5} transaction${budgetTransactions.length - 5 > 1 ? 's' : ''} de plus`
                }
              </Button>
            </div>
          )}
        </div>

        {/* Budget info */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Restant:</span>
            <span className={`font-medium ${
              budget.amount - budget.spent >= 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatAmount(budget.amount - budget.spent, DEFAULT_CURRENCY)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BudgetTransactions;