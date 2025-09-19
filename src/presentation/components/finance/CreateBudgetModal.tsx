'use client';

import { useState } from 'react';
import { Budget } from '@/src/shared/types';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import Modal from '@/src/presentation/components/ui/Modal';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Button from '@/src/presentation/components/ui/Button';

interface CreateBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({
  isOpen,
  onClose
}) => {
  const { categories, createBudget, error } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: 0,
    period: 'monthly' as Budget['period'],
    alertThreshold: 80,
    customPeriod: {
      startDate: '',
      endDate: ''
    }
  });

  const periodOptions = [
    { value: 'weekly', label: 'Hebdomadaire' },
    { value: 'monthly', label: 'Mensuel' },
    { value: 'quarterly', label: 'Trimestriel' },
    { value: 'yearly', label: 'Annuel' }
  ];

  const thresholdOptions = [
    { value: 50, label: '50% - Alerte précoce' },
    { value: 70, label: '70% - Alerte modérée' },
    { value: 80, label: '80% - Alerte standard' },
    { value: 90, label: '90% - Alerte tardive' }
  ];

  const getExpenseCategories = () => {
    return categories.filter(cat => cat.type === 'expense');
  };

  const calculateDates = (period: Budget['period']) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay()); // Début de semaine (dimanche)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Fin de semaine (samedi)
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1);
        endDate = new Date(now.getFullYear(), quarterStart + 3, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = now;
        endDate = now;
    }

    return { startDate, endDate };
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.category || formData.amount <= 0) return;

    setIsSubmitting(true);
    try {
      const dates = calculateDates(formData.period);

      const budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        category: formData.category,
        amount: formData.amount,
        spent: 0,
        period: formData.period,
        startDate: dates.startDate,
        endDate: dates.endDate,
        alertThreshold: formData.alertThreshold,
        isActive: true
      };

      const success = await createBudget(budgetData);
      if (success) {
        setFormData({
          name: '',
          category: '',
          amount: 0,
          period: 'monthly',
          alertThreshold: 80,
          customPeriod: {
            startDate: '',
            endDate: ''
          }
        });
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Sélectionner une catégorie...' },
    ...getExpenseCategories().map(cat => ({
      value: cat.name,
      label: cat.name
    }))
  ];

  const getPreviewDates = () => {
    const dates = calculateDates(formData.period);
    return {
      start: dates.startDate.toLocaleDateString('fr-FR'),
      end: dates.endDate.toLocaleDateString('fr-FR')
    };
  };

  const previewDates = getPreviewDates();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un nouveau budget"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Informations de base */}
        <div className="space-y-4">
          <Input
            label="Nom du budget"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="Ex: Alimentation, Transport, Loisirs..."
            required
          />

          <Select
            label="Catégorie"
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={categoryOptions}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Montant du budget
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
        </div>

        {/* Période */}
        <div className="space-y-4">
          <Select
            label="Période du budget"
            value={formData.period}
            onChange={(value) => setFormData({ ...formData, period: value as Budget['period'] })}
            options={periodOptions}
          />

          {/* Aperçu des dates */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Période calculée
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Du {previewDates.start} au {previewDates.end}
            </p>
          </div>
        </div>

        {/* Seuil d'alerte */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Seuil d'alerte
          </label>
          <div className="space-y-2">
            {thresholdOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="alertThreshold"
                  value={option.value}
                  checked={formData.alertThreshold === option.value}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })}
                  className="mr-3 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Vous recevrez une alerte lorsque vous atteindrez ce pourcentage de votre budget
          </p>
        </div>

        {/* Aperçu du budget */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Aperçu du budget
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Nom:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formData.name || 'Nom du budget'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Catégorie:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formData.category || 'Aucune catégorie'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Montant:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formData.amount.toFixed(0)} FCFA
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Période:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {periodOptions.find(p => p.value === formData.period)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Alerte à:</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {formData.alertThreshold}% ({(formData.amount * formData.alertThreshold / 100).toFixed(0)} FCFA)
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
            disabled={!formData.name.trim() || !formData.category || formData.amount <= 0}
            className="flex-1"
          >
            Créer le budget
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

export default CreateBudgetModal;