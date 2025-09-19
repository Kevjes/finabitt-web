'use client';

import { useState } from 'react';
import { Account } from '@/src/shared/types';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, Currency } from '@/src/shared/utils/currency';
import Modal from '@/src/presentation/components/ui/Modal';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  isOpen,
  onClose
}) => {
  const { createAccount, error } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as Account['type'],
    initialBalance: 0,
    currency: DEFAULT_CURRENCY,
    bankName: '',
    accountNumber: '',
    color: '#3B82F6',
    icon: ''
  });

  const accountTypes = [
    { value: 'checking', label: 'Compte courant', icon: '🏦' },
    { value: 'savings', label: 'Compte épargne', icon: '🐷' },
    { value: 'cash', label: 'Espèces', icon: '💵' },
    { value: 'investment', label: 'Investissement', icon: '📈' },
    { value: 'credit', label: 'Carte de crédit', icon: '💳' }
  ];

  const currencies = SUPPORTED_CURRENCIES;

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
  ];

  const predefinedIcons = [
    '🏦', '🐷', '💵', '📈', '💳', '💰', '🏪', '🎯', '⭐', '🔒',
    '💎', '🏡', '🚗', '✈️', '🎓', '🏥', '🛍️', '🍕', '⚡', '🌟'
  ];

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const accountData: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        type: formData.type,
        initialBalance: formData.initialBalance,
        currentBalance: formData.initialBalance,
        probableBalance: formData.initialBalance,
        currency: formData.currency,
        bankName: formData.bankName.trim() || undefined,
        accountNumber: formData.accountNumber.trim() || undefined,
        color: formData.color || undefined,
        icon: formData.icon.trim() || undefined,
        isActive: true
      };

      const success = await createAccount(accountData);
      if (success) {
        setFormData({
          name: '',
          type: 'checking',
          initialBalance: 0,
          currency: DEFAULT_CURRENCY,
          bankName: '',
          accountNumber: '',
          color: '#3B82F6',
          icon: ''
        });
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedTypeInfo = () => {
    return accountTypes.find(t => t.value === formData.type);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer un nouveau compte"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Type de compte */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Type de compte
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accountTypes.map((type) => (
              <Card
                key={type.value}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  formData.type === type.value
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => setFormData({ ...formData, type: type.value as 'checking' | 'savings' | 'cash' | 'investment' | 'credit' })}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {type.label}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nom du compte"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="Ex: Compte principal, Épargne vacances..."
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Solde initial
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">
                {formData.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Devise */}
        <div className="md:w-1/2">
          <Select
            label="Devise"
            value={formData.currency}
            onChange={(value) => setFormData({ ...formData, currency: value as Currency })}
            options={currencies.map(c => ({ value: c.value, label: c.label }))}
          />
        </div>

        {/* Informations bancaires (optionnelles) */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
            Informations bancaires (optionnel)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom de la banque"
              value={formData.bankName}
              onChange={(value) => setFormData({ ...formData, bankName: value })}
              placeholder="Ex: BNP Paribas, Crédit Agricole..."
            />

            <Input
              label="Numéro de compte"
              value={formData.accountNumber}
              onChange={(value) => setFormData({ ...formData, accountNumber: value })}
              placeholder="Ex: ****1234"
              helperText="Les données seront automatiquement masquées"
            />
          </div>
        </div>

        {/* Personnalisation */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
            Personnalisation
          </h4>

          {/* Couleur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Couleur
            </label>
            <div className="flex gap-2 flex-wrap">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color
                      ? 'border-gray-800 dark:border-gray-200 scale-110'
                      : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Icône */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icône (optionnel)
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {predefinedIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-8 h-8 rounded border text-lg transition-all hover:scale-105 ${
                    formData.icon === icon
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <Input
              value={formData.icon}
              onChange={(value) => setFormData({ ...formData, icon: value })}
              placeholder="Ou tapez un emoji..."
              className="text-center"
            />
          </div>
        </div>

        {/* Aperçu */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Aperçu
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {formData.icon || getSelectedTypeInfo()?.icon}
            </span>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: formData.color }}
              />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formData.name || 'Nom du compte'}
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
            disabled={!formData.name.trim()}
            className="flex-1"
          >
            Créer le compte
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

export default CreateAccountModal;