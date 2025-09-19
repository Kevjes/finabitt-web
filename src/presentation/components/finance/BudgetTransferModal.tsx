'use client';

import { useState } from 'react';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Budget } from '@/src/shared/types';
import { formatAmount, DEFAULT_CURRENCY } from '@/src/shared/utils/currency';
import Button from '@/src/presentation/components/ui/Button';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';

interface BudgetTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceBudget: Budget;
  onTransferComplete: () => void;
}

const BudgetTransferModal: React.FC<BudgetTransferModalProps> = ({
  isOpen,
  onClose,
  sourceBudget,
  onTransferComplete
}) => {
  const { budgets, updateBudget } = useFinance();
  const [targetBudgetId, setTargetBudgetId] = useState('');
  const [transferAmount, setTransferAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Calculer le montant manquant pour le budget source
  const missingAmount = sourceBudget.spent - sourceBudget.amount;

  // Budgets disponibles pour le transfert (avec solde disponible)
  const availableBudgets = budgets.filter(budget =>
    budget.id !== sourceBudget.id &&
    budget.isActive &&
    (budget.amount - budget.spent) > 0
  );

  const targetBudget = budgets.find(b => b.id === targetBudgetId);
  const maxTransferable = targetBudget ? (targetBudget.amount - targetBudget.spent) : 0;

  const handleTransfer = async () => {
    if (!targetBudget || transferAmount <= 0) return;

    setLoading(true);
    try {
      // Réduire le budget source
      await updateBudget(sourceBudget.id, {
        ...sourceBudget,
        amount: sourceBudget.amount + transferAmount
      });

      // Réduire le budget cible
      await updateBudget(targetBudget.id, {
        ...targetBudget,
        amount: targetBudget.amount - transferAmount
      });

      onTransferComplete();
      onClose();
    } catch (error) {
      console.error('Erreur lors du transfert:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Transfert entre budgets
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Budget source info */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
              Budget dépassé
            </h4>
            <div className="text-sm text-red-600 dark:text-red-300">
              <div className="flex justify-between">
                <span>{sourceBudget.name}</span>
                <span>{formatAmount(sourceBudget.spent, DEFAULT_CURRENCY)}</span>
              </div>
              <div className="flex justify-between">
                <span>Budget initial:</span>
                <span>{formatAmount(sourceBudget.amount, DEFAULT_CURRENCY)}</span>
              </div>
              <div className="flex justify-between font-medium border-t border-red-200 dark:border-red-700 pt-1 mt-1">
                <span>Dépassement:</span>
                <span>+{formatAmount(missingAmount, DEFAULT_CURRENCY)}</span>
              </div>
            </div>
          </div>

          {availableBudgets.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-gray-500 dark:text-gray-400 mb-2">
                Aucun budget disponible pour le transfert
              </div>
              <p className="text-sm text-gray-400">
                Tous vos autres budgets sont épuisés ou inexistants
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleTransfer(); }} className="space-y-4">
              <Select
                label="Budget source pour le transfert"
                value={targetBudgetId}
                onChange={setTargetBudgetId}
                options={[
                  { value: '', label: 'Sélectionner un budget...' },
                  ...availableBudgets.map(budget => ({
                    value: budget.id,
                    label: `${budget.name} (${formatAmount(budget.amount - budget.spent, DEFAULT_CURRENCY)} disponible)`
                  }))
                ]}
                required
              />

              {targetBudget && (
                <>
                  <Input
                    label={`Montant à transférer (max: ${formatAmount(maxTransferable, DEFAULT_CURRENCY)})`}
                    type="number"
                    value={transferAmount.toString()}
                    onChange={(value) => setTransferAmount(Number(value) || 0)}
                    max={maxTransferable}
                    min={1}
                    placeholder="Montant en FCFA"
                    required
                  />

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Aperçu du transfert
                    </h5>
                    <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
                      <div className="flex justify-between">
                        <span>{sourceBudget.name}:</span>
                        <span>
                          {formatAmount(sourceBudget.amount, DEFAULT_CURRENCY)} → {formatAmount(sourceBudget.amount + transferAmount, DEFAULT_CURRENCY)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{targetBudget.name}:</span>
                        <span>
                          {formatAmount(targetBudget.amount, DEFAULT_CURRENCY)} → {formatAmount(targetBudget.amount - transferAmount, DEFAULT_CURRENCY)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || transferAmount <= 0 || transferAmount > maxTransferable}
                      className="flex-1"
                    >
                      {loading ? 'Transfert...' : 'Confirmer le transfert'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetTransferModal;