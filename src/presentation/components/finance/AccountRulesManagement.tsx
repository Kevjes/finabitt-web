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
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default AccountRulesManagement;