'use client';

import { useState, useEffect } from 'react';
import { Account } from '@/src/shared/types';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { SUPPORTED_CURRENCIES, Currency } from '@/src/shared/utils/currency';
import Modal from '@/src/presentation/components/ui/Modal';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';

interface EditAccountModalProps {
  account: Account;
  isOpen: boolean;
  onClose: () => void;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  account,
  isOpen,
  onClose
}) => {
  const { updateAccount, deleteAccount, error } = useFinance();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    currency: 'EUR',
    bankName: '',
    accountNumber: '',
    color: '#3B82F6',
    icon: ''
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        currency: account.currency,
        bankName: account.bankName || '',
        accountNumber: account.accountNumber || '',
        color: account.color || '#3B82F6',
        icon: account.icon || ''
      });
    }
  }, [account]);

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
      const updates: Partial<Account> = {
        name: formData.name.trim(),
        currency: formData.currency,
        bankName: formData.bankName.trim() || undefined,
        accountNumber: formData.accountNumber.trim() || undefined,
        color: formData.color || undefined,
        icon: formData.icon.trim() || undefined
      };

      const success = await updateAccount(account.id, updates);
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
      const success = await deleteAccount(account.id);
      if (success) {
        onClose();
        setShowDeleteConfirm(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getAccountTypeInfo = (type: Account['type']) => {
    const types = {
      checking: { label: 'Compte courant', icon: '🏦' },
      savings: { label: 'Épargne', icon: '🐷' },
      cash: { label: 'Espèces', icon: '💵' },
      investment: { label: 'Investissement', icon: '📈' },
      credit: { label: 'Crédit', icon: '💳' }
    };
    return types[type];
  };

  const typeInfo = getAccountTypeInfo(account.type);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Modifier ${account.name}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Informations du compte */}
        <Card className="p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{account.icon || typeInfo.icon}</span>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {account.name}
              </h3>
              <p className="text-sm text-gray-500">
                {typeInfo.label} • {account.currency}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Solde actuel</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {account.currentBalance.toFixed(2)} {account.currency}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Créé le</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {new Date(account.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Formulaire de modification */}
        <div className="space-y-4">
          <Input
            label="Nom du compte"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="Ex: Compte principal, Épargne vacances..."
            required
          />

          <Select
            label="Devise"
            value={formData.currency}
            onChange={(value) => setFormData({ ...formData, currency: value as Currency })}
            options={currencies.map(c => ({ value: c.value, label: c.label }))}
          />

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
              disabled={!formData.name.trim()}
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
                  Cette action est irréversible
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
                Êtes-vous sûr de vouloir supprimer ce compte ? Cette action supprimera définitivement
                le compte et toutes ses données associées.
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

export default EditAccountModal;