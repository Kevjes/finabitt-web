'use client';

import { useState, useEffect, useCallback } from 'react';
import { AccountRule } from '@/src/shared/types';
import { accountRuleRepository } from '@/src/data/repositories/accountRuleRepository';
import { useAuth } from './useAuth';

export const useAccountRules = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AccountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccountRules = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const userRules = await accountRuleRepository.getAccountRulesByUserId(user.id);
      setRules(userRules);
    } catch (err) {
      console.error('Error loading account rules:', err);
      setError('Erreur lors du chargement des règles');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadAccountRules();
  }, [loadAccountRules]);

  const createAccountRule = async (ruleData: Omit<AccountRule, 'id' | 'userId' | 'isActive' | 'createdAt' | 'updatedAt' | 'lastExecutedAt' | 'executionCount'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);

      const newRuleData = {
        ...ruleData,
        userId: user.id,
        isActive: true,
        executionCount: 0
      };

      const ruleId = await accountRuleRepository.createAccountRule(newRuleData);

      // Recharger les règles
      await loadAccountRules();

      return ruleId;
    } catch (err) {
      console.error('Error creating account rule:', err);
      setError('Erreur lors de la création de la règle');
      throw err;
    }
  };

  const updateAccountRule = async (id: string, updates: Partial<AccountRule>) => {
    try {
      setError(null);
      await accountRuleRepository.updateAccountRule(id, updates);

      // Mettre à jour localement
      setRules(prevRules =>
        prevRules.map(rule =>
          rule.id === id ? { ...rule, ...updates, updatedAt: new Date() } : rule
        )
      );
    } catch (err) {
      console.error('Error updating account rule:', err);
      setError('Erreur lors de la mise à jour de la règle');
      throw err;
    }
  };

  const deleteAccountRule = async (id: string) => {
    try {
      setError(null);
      await accountRuleRepository.deleteAccountRule(id);

      // Supprimer localement
      setRules(prevRules => prevRules.filter(rule => rule.id !== id));
    } catch (err) {
      console.error('Error deleting account rule:', err);
      setError('Erreur lors de la suppression de la règle');
      throw err;
    }
  };

  const toggleRuleStatus = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;

    await updateAccountRule(id, { isActive: !rule.isActive });
  };

  const getRulesByAccount = (accountId: string) => {
    return rules.filter(rule =>
      rule.sourceAccountId === accountId || rule.destinationAccountId === accountId
    );
  };

  const getActiveRules = () => {
    return rules.filter(rule => rule.isActive);
  };

  const executeRule = async (ruleId: string, transactionAmount: number, sourceAccountId: string, destinationAccountId: string) => {
    try {
      setError(null);
      const result = await accountRuleRepository.executeRule(ruleId, transactionAmount, sourceAccountId, destinationAccountId);

      // Recharger les règles pour mettre à jour les statistiques
      await loadAccountRules();

      return result;
    } catch (err) {
      console.error('Error executing rule:', err);
      setError('Erreur lors de l\'exécution de la règle');
      throw err;
    }
  };

  const getScheduledRules = async () => {
    try {
      setError(null);
      return await accountRuleRepository.getScheduledRules();
    } catch (err) {
      console.error('Error getting scheduled rules:', err);
      setError('Erreur lors de la récupération des règles programmées');
      throw err;
    }
  };

  const calculatePotentialTransfer = (rule: AccountRule, transactionAmount: number): number => {
    if (rule.type === 'percentage') {
      const potentialAmount = (transactionAmount * rule.value) / 100;

      if (rule.minAmount && potentialAmount < rule.minAmount) {
        return 0;
      }

      if (rule.maxAmount && potentialAmount > rule.maxAmount) {
        return rule.maxAmount;
      }

      return potentialAmount;
    } else {
      if (rule.minAmount && rule.value < rule.minAmount) {
        return 0;
      }

      return rule.value;
    }
  };

  const getTriggerableRules = (accountId: string, triggerType: 'on_income' | 'on_expense', amount: number): AccountRule[] => {
    return rules.filter(rule =>
      rule.isActive &&
      rule.sourceAccountId === accountId &&
      rule.triggerType === triggerType &&
      calculatePotentialTransfer(rule, amount) > 0
    );
  };

  return {
    rules,
    loading,
    error,
    createAccountRule,
    updateAccountRule,
    deleteAccountRule,
    toggleRuleStatus,
    getRulesByAccount,
    getActiveRules,
    executeRule,
    getScheduledRules,
    calculatePotentialTransfer,
    getTriggerableRules,
    refreshRules: loadAccountRules
  };
};