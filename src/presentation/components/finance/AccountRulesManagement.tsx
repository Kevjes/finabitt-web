'use client';

import { useState, useEffect } from 'react';
import { useAccountRules } from '@/src/presentation/hooks/useAccountRules';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { AccountRule } from '@/src/shared/types';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Textarea from '@/src/presentation/components/ui/Textarea';

interface AccountRulesManagementProps {
  accountId?: string;
}

const AccountRulesManagement: React.FC<AccountRulesManagementProps> = ({ accountId }) => {
  const {
    rules,
    loading,
    error,
    createAccountRule,
    updateAccountRule,
    deleteAccountRule,
    toggleRuleStatus,
    getRulesByAccount
  } = useAccountRules();

  const { accounts } = useFinance();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AccountRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceAccountId: '',
    destinationAccountId: '',
    type: 'percentage' as 'percentage' | 'fixed_amount',
    value: 0,
    triggerType: 'on_income' as 'on_income' | 'on_expense' | 'scheduled',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    minAmount: '',
    maxAmount: ''
  });

  const displayRules = accountId ? getRulesByAccount(accountId) : rules;

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Chargement des règles...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {accountId ? 'Règles de liaison' : 'Gestion des règles de comptes'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configurez des transferts automatiques entre vos comptes
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          + Nouvelle règle
        </Button>
      </div>

      {displayRules.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              Aucune règle de liaison configurée
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="outline"
            >
              Créer votre première règle
            </Button>
          </div>
        </Card>
      ) : (
        displayRules.map((rule) => (
          <Card key={rule.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {rule.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rule.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {rule.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {rule.description}
                  </p>
                )}

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>
                    <span className="font-medium">Type:</span> {rule.type === 'percentage' ? `${rule.value}%` : `${rule.value} FCFA`}
                  </p>
                  <p>
                    <span className="font-medium">Déclencheur:</span> {
                      rule.triggerType === 'on_income' ? 'Sur revenus' :
                      rule.triggerType === 'on_expense' ? 'Sur dépenses' :
                      'Programmé'
                    }
                  </p>
                  {rule.triggerType === 'scheduled' && (
                    <p>
                      <span className="font-medium">Fréquence:</span> {
                        rule.frequency === 'daily' ? 'Quotidien' :
                        rule.frequency === 'weekly' ? 'Hebdomadaire' :
                        'Mensuel'
                      }
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingRule(rule);
                    setFormData({
                      name: rule.name,
                      description: rule.description || '',
                      sourceAccountId: rule.sourceAccountId,
                      destinationAccountId: rule.destinationAccountId,
                      type: rule.type,
                      value: rule.value,
                      triggerType: rule.triggerType,
                      frequency: rule.frequency || 'monthly',
                      minAmount: rule.minAmount?.toString() || '',
                      maxAmount: rule.maxAmount?.toString() || ''
                    });
                    setShowCreateForm(true);
                  }}
                >
                  Éditer
                </Button>

                <Button
                  size="sm"
                  variant={rule.isActive ? "secondary" : "primary"}
                  onClick={() => toggleRuleStatus(rule.id)}
                >
                  {rule.isActive ? 'Désactiver' : 'Activer'}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
                      deleteAccountRule(rule.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}

      {/* Modal de création/édition */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {editingRule ? 'Modifier la règle' : 'Nouvelle règle de liaison'}
              </h3>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const ruleData = {
                    ...formData,
                    value: Number(formData.value),
                    minAmount: formData.minAmount ? Number(formData.minAmount) : undefined,
                    maxAmount: formData.maxAmount ? Number(formData.maxAmount) : undefined
                  };

                  if (editingRule) {
                    await updateAccountRule(editingRule.id, ruleData);
                  } else {
                    await createAccountRule(ruleData);
                  }

                  setShowCreateForm(false);
                  setEditingRule(null);
                  setFormData({
                    name: '',
                    description: '',
                    sourceAccountId: '',
                    destinationAccountId: '',
                    type: 'percentage',
                    value: 0,
                    triggerType: 'on_income',
                    frequency: 'monthly',
                    minAmount: '',
                    maxAmount: ''
                  });
                } catch (err) {
                  console.error('Erreur lors de la sauvegarde:', err);
                }
              }} className="space-y-4">

                <Input
                  label="Nom de la règle *"
                  value={formData.name}
                  onChange={(value) => setFormData({ ...formData, name: value })}
                  placeholder="ex: Épargne automatique"
                  required
                />

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Description de la règle (optionnel)"
                  rows={2}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Compte source *"
                    value={formData.sourceAccountId}
                    onChange={(value) => setFormData({ ...formData, sourceAccountId: value })}
                    options={accounts.map(account => ({
                      value: account.id,
                      label: account.name
                    }))}
                    placeholder="Sélectionnez le compte source"
                    required
                  />

                  <Select
                    label="Compte destination *"
                    value={formData.destinationAccountId}
                    onChange={(value) => setFormData({ ...formData, destinationAccountId: value })}
                    options={accounts.filter(a => a.id !== formData.sourceAccountId).map(account => ({
                      value: account.id,
                      label: account.name
                    }))}
                    placeholder="Sélectionnez le compte destination"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Type de règle *"
                    value={formData.type}
                    onChange={(value) => setFormData({ ...formData, type: value as 'percentage' | 'fixed_amount' })}
                    options={[
                      { value: 'percentage', label: 'Pourcentage' },
                      { value: 'fixed_amount', label: 'Montant fixe' }
                    ]}
                    required
                  />

                  <Input
                    label={formData.type === 'percentage' ? 'Pourcentage (%)' : 'Montant (FCFA)'}
                    type="number"
                    value={formData.value.toString()}
                    onChange={(value) => setFormData({ ...formData, value: Number(value) || 0 })}
                    placeholder={formData.type === 'percentage' ? '10' : '50000'}
                    required
                  />
                </div>

                <Select
                  label="Déclencheur *"
                  value={formData.triggerType}
                  onChange={(value) => setFormData({ ...formData, triggerType: value as 'on_income' | 'on_expense' | 'scheduled' })}
                  options={[
                    { value: 'on_income', label: 'À chaque revenu' },
                    { value: 'on_expense', label: 'À chaque dépense' },
                    { value: 'scheduled', label: 'Programmé' }
                  ]}
                  required
                />

                {formData.triggerType === 'scheduled' && (
                  <Select
                    label="Fréquence"
                    value={formData.frequency}
                    onChange={(value) => setFormData({ ...formData, frequency: value as 'daily' | 'weekly' | 'monthly' | 'yearly' })}
                    options={[
                      { value: 'daily', label: 'Quotidien' },
                      { value: 'weekly', label: 'Hebdomadaire' },
                      { value: 'monthly', label: 'Mensuel' }
                    ]}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Montant minimum (FCFA)"
                    type="number"
                    value={formData.minAmount}
                    onChange={(value) => setFormData({ ...formData, minAmount: value })}
                    placeholder="10000"
                  />

                  <Input
                    label="Montant maximum (FCFA)"
                    type="number"
                    value={formData.maxAmount}
                    onChange={(value) => setFormData({ ...formData, maxAmount: value })}
                    placeholder="500000"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingRule(null);
                      setFormData({
                        name: '',
                        description: '',
                        sourceAccountId: '',
                        destinationAccountId: '',
                        type: 'percentage',
                        value: 0,
                        triggerType: 'on_income',
                        frequency: 'monthly',
                        minAmount: '',
                        maxAmount: ''
                      });
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingRule ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountRulesManagement;