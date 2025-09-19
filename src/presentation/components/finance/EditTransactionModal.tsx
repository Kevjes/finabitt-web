'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/src/shared/types';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import Modal from '@/src/presentation/components/ui/Modal';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';
import TagInput from '@/src/presentation/components/ui/TagInput';

interface EditTransactionModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose
}) => {
  const { accounts, categories, budgets, updateTransaction, deleteTransaction, error } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    category: '',
    subcategory: '',
    tags: [] as string[],
    location: '',
    date: '',
    status: 'completed' as Transaction['status'],
    linkedBudgetId: ''
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        subcategory: transaction.subcategory || '',
        tags: transaction.tags || [],
        location: transaction.location || '',
        date: transaction.date.toISOString().split('T')[0],
        status: transaction.status,
        linkedBudgetId: transaction.linkedBudgetId || ''
      });
    }
  }, [transaction]);

  const statusOptions = [
    { value: 'pending', label: 'En attente' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' }
  ];

  const getFilteredCategories = () => {
    return categories.filter(cat =>
      transaction.type === 'transfer' || cat.type === transaction.type
    );
  };

  const getAccountName = (accountId?: string) => {
    if (!accountId) return 'Compte supprimé';
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Compte inconnu';
  };

  const getAvailableSubcategories = () => {
    const category = categories.find(cat => cat.name === formData.category);
    return category?.subcategories || [];
  };

  const getTransactionTypeInfo = (type: Transaction['type']) => {
    const types = {
      income: { label: 'Revenu', icon: '📈', color: 'text-green-600 dark:text-green-400' },
      expense: { label: 'Dépense', icon: '📉', color: 'text-red-600 dark:text-red-400' },
      transfer: { label: 'Virement', icon: '🔄', color: 'text-blue-600 dark:text-blue-400' }
    };
    return types[type];
  };

  const handleSubmit = async () => {
    if (!formData.description.trim() || !formData.category || formData.amount <= 0) return;

    setIsSubmitting(true);
    try {
      const updates: Partial<Transaction> = {
        amount: formData.amount,
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory.trim() || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        location: formData.location.trim() || undefined,
        date: new Date(formData.date),
        status: formData.status,
        linkedBudgetId: formData.linkedBudgetId || undefined
      };

      const success = await updateTransaction(transaction.id, updates);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteTransaction(transaction.id);
      if (success) {
        onClose();
        setShowDeleteConfirm(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Sélectionner une catégorie...' },
    ...getFilteredCategories().map(cat => ({
      value: cat.name,
      label: cat.name
    }))
  ];

  const subcategoryOptions = [
    { value: '', label: 'Aucune sous-catégorie' },
    ...getAvailableSubcategories().map(sub => ({
      value: sub,
      label: sub
    }))
  ];

  const typeInfo = getTransactionTypeInfo(transaction.type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifier la transaction`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Informations de la transaction */}
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{typeInfo.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {transaction.description}
                </h3>
                <p className="text-sm text-gray-500">
                  {typeInfo.label} • {transaction.category}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${typeInfo.color}`}>
                {transaction.type === 'expense' ? '-' : '+'}
                {transaction.amount.toFixed(0)} FCFA
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

          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
            <div>
              <p className="text-gray-500">Date originale</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {transaction.date.toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Statut actuel</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {statusOptions.find(s => s.value === transaction.status)?.label}
              </p>
            </div>
          </div>
        </Card>

        {/* Formulaire de modification */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Montant
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="0.00"
                  required
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">FCFA</span>
              </div>
            </div>

            <Input
              label="Date"
              type="date"
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              required
            />
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Description de la transaction..."
            required
          />

          <Select
            label="Catégorie"
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value, subcategory: '' })}
            options={categoryOptions}
            required
          />

          {getAvailableSubcategories().length > 0 && (
            <Select
              label="Sous-catégorie (optionnel)"
              value={formData.subcategory}
              onChange={(value) => setFormData({ ...formData, subcategory: value })}
              options={subcategoryOptions}
            />
          )}

          <Select
            label="Statut"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as Transaction['status'] })}
            options={statusOptions}
          />

          <TagInput
            label="Tags"
            value={formData.tags}
            onChange={(tags) => setFormData({ ...formData, tags })}
            placeholder="Ajouter des tags..."
          />

          {/* Budget lié - seulement pour les dépenses */}
          {transaction.type === 'expense' && (
            <Select
              label="Budget associé (optionnel)"
              value={formData.linkedBudgetId}
              onChange={(value) => setFormData({ ...formData, linkedBudgetId: value })}
              options={[
                { value: '', label: 'Aucun budget' },
                ...budgets
                  .filter(budget => budget.isActive)
                  .map(budget => ({
                    value: budget.id,
                    label: `${budget.name} - ${budget.category} (${(budget.amount - budget.spent).toFixed(0)} FCFA restant)`
                  }))
              ]}
              helperText="Associer cette dépense à un budget spécifique"
            />
          )}

          <Input
            label="Lieu"
            value={formData.location}
            onChange={(value) => setFormData({ ...formData, location: value })}
            placeholder="Ex: Supermarché, Restaurant..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!formData.description.trim() || !formData.category || formData.amount <= 0}
              className="flex-1"
            >
              Sauvegarder
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
          </div>

          {/* Zone de danger */}
          <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Zone de danger
                </h4>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Cette action est irréversible et ajustera les soldes des comptes
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-300 text-red-600 hover:bg-red-100 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/40"
              >
                🗑️ Supprimer
              </Button>
            </div>
          </Card>
        </div>

        {/* Confirmation de suppression */}
        {showDeleteConfirm && (
          <Card className="p-4 border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/30">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
                <span className="text-xl">⚠️</span>
                <h4 className="font-medium">Confirmer la suppression</h4>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400">
                Êtes-vous sûr de vouloir supprimer cette transaction ? Cette action supprimera définitivement
                la transaction et ajustera automatiquement les soldes des comptes concernés.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  className="border-red-400 text-red-700 bg-red-200 hover:bg-red-300 dark:border-red-600 dark:text-red-300 dark:bg-red-800 dark:hover:bg-red-700"
                >
                  Oui, supprimer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Modal>
  );
};

export default EditTransactionModal;