'use client';

import { useState } from 'react';
import { Goal } from '@/src/shared/types';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import Modal from '@/src/presentation/components/ui/Modal';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Textarea from '@/src/presentation/components/ui/Textarea';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  onClose
}) => {
  const { accounts, createGoal, error } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'savings' as Goal['type'],
    targetAmount: 0,
    accountId: '',
    targetDate: '',
    monthlyContribution: 0,
    priority: 'medium' as Goal['priority']
  });

  const goalTypes = [
    {
      value: 'savings',
      label: 'Épargne',
      icon: '🐷',
      description: 'Constituer une épargne pour un projet futur'
    },
    {
      value: 'debt_payment',
      label: 'Remboursement de dette',
      icon: '💳',
      description: 'Rembourser un prêt ou une dette'
    },
    {
      value: 'investment',
      label: 'Investissement',
      icon: '📈',
      description: 'Investir dans des placements financiers'
    },
    {
      value: 'purchase',
      label: 'Achat',
      icon: '🛍️',
      description: 'Économiser pour un achat spécifique'
    }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Faible' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'high', label: 'Haute' }
  ];

  const getAccountOptions = () => {
    return accounts.map(account => ({
      value: account.id,
      label: `${account.name} (${account.currentBalance.toFixed(0)} FCFA)`
    }));
  };

  const calculateMonthlyContribution = () => {
    if (!formData.targetDate || formData.targetAmount <= 0) return 0;

    const now = new Date();
    const targetDate = new Date(formData.targetDate);
    const monthsDiff = (targetDate.getFullYear() - now.getFullYear()) * 12 +
                      (targetDate.getMonth() - now.getMonth());

    if (monthsDiff <= 0) return formData.targetAmount;
    return formData.targetAmount / monthsDiff;
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.accountId || formData.targetAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        targetAmount: formData.targetAmount,
        currentAmount: 0,
        targetDate: formData.targetDate ? new Date(formData.targetDate) : undefined,
        accountId: formData.accountId,
        monthlyContribution: formData.monthlyContribution || undefined,
        priority: formData.priority,
        isActive: true
      };

      const success = await createGoal(goalData);
      if (success) {
        setFormData({
          name: '',
          description: '',
          type: 'savings',
          targetAmount: 0,
          accountId: '',
          targetDate: '',
          monthlyContribution: 0,
          priority: 'medium'
        });
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountOptions = [
    { value: '', label: 'Sélectionner un compte...' },
    ...getAccountOptions()
  ];

  const suggestedContribution = calculateMonthlyContribution();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un nouvel objectif"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Type d'objectif */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Type d'objectif
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goalTypes.map((type) => (
              <Card
                key={type.value}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  formData.type === type.value
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setFormData({ ...formData, type: type.value as Goal['type'] })}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Informations de base */}
        <div className="space-y-4">
          <Input
            label="Nom de l'objectif"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="Ex: Vacances d'été, Nouvelle voiture, Fonds d'urgence..."
            required
          />

          <Textarea
            label="Description (optionnel)"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Décrivez votre objectif en détail..."
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Montant cible
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetAmount || ''}
                  onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="0.00"
                  required
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">FCFA</span>
              </div>
            </div>

            <Select
              label="Compte associé"
              value={formData.accountId}
              onChange={(value) => setFormData({ ...formData, accountId: value })}
              options={accountOptions}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date cible (optionnel)"
              type="date"
              value={formData.targetDate}
              onChange={(value) => setFormData({ ...formData, targetDate: value })}
              min={new Date().toISOString().split('T')[0]}
            />

            <Select
              label="Priorité"
              value={formData.priority}
              onChange={(value) => setFormData({ ...formData, priority: value as Goal['priority'] })}
              options={priorityOptions}
            />
          </div>
        </div>

        {/* Contribution mensuelle */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contribution mensuelle (optionnel)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monthlyContribution || ''}
                onChange={(e) => setFormData({ ...formData, monthlyContribution: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">FCFA</span>
            </div>
          </div>

          {/* Suggestion de contribution */}
          {formData.targetDate && formData.targetAmount > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Contribution suggérée
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Pour atteindre votre objectif à la date cible
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {suggestedContribution.toFixed(0)} FCFA
                  </p>
                  <p className="text-xs text-blue-500">par mois</p>
                </div>
              </div>
              {suggestedContribution > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, monthlyContribution: suggestedContribution })}
                  className="mt-2 text-xs border-blue-300 text-blue-600 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/40"
                >
                  Utiliser cette suggestion
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Aperçu de l'objectif */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Aperçu de l'objectif
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Nom:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formData.name || 'Nom de l\'objectif'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {goalTypes.find(t => t.value === formData.type)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Montant cible:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formData.targetAmount.toFixed(0)} FCFA
              </span>
            </div>
            {formData.targetDate && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Date cible:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(formData.targetDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            {formData.monthlyContribution > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Contribution mensuelle:</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {formData.monthlyContribution.toFixed(0)} FCFA
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Priorité:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {priorityOptions.find(p => p.value === formData.priority)?.label}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!formData.name.trim() || !formData.accountId || formData.targetAmount <= 0}
            className="flex-1"
          >
            Créer l'objectif
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateGoalModal;