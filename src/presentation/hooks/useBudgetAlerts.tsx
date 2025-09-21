'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useFinance } from './useFinance';
import { useSuggestions } from './useSuggestions';
import { Budget, Transaction } from '@/src/shared/types';

interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  category: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  alertThreshold: number;
  severity: 'warning' | 'danger' | 'critical';
  message: string;
  suggestions: string[];
}

export const useBudgetAlerts = () => {
  const { user } = useAuth();
  const { budgets, transactions } = useFinance();
  const { createSuggestion } = useSuggestions();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculer les dépenses par catégorie pour le mois en cours
  const calculateCategorySpending = (category: string): number => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return transactions
      .filter(transaction =>
        transaction.type === 'expense' &&
        transaction.category === category &&
        transaction.date >= startOfMonth &&
        transaction.date <= endOfMonth &&
        transaction.status === 'completed'
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  // Générer des suggestions de compensation
  const generateCompensationSuggestions = (alert: BudgetAlert): string[] => {
    const overspent = alert.spentAmount - alert.budgetAmount;
    const suggestions = [];

    if (alert.percentage > 100) {
      suggestions.push(`Réduire les dépenses de ${overspent.toFixed(0)} FCFA pour respecter le budget`);
    }

    suggestions.push(`Transférer ${Math.min(overspent, alert.budgetAmount * 0.1).toFixed(0)} FCFA d'un autre budget`);
    suggestions.push('Reporter certains achats au mois prochain');
    suggestions.push('Chercher des alternatives moins coûteuses');

    if (alert.category.toLowerCase().includes('alimentation')) {
      suggestions.push('Cuisiner à la maison plutôt que de commander');
      suggestions.push('Faire une liste de courses pour éviter les achats impulsifs');
    } else if (alert.category.toLowerCase().includes('transport')) {
      suggestions.push('Utiliser les transports en commun ou covoiturer');
      suggestions.push('Regrouper vos déplacements');
    } else if (alert.category.toLowerCase().includes('loisir')) {
      suggestions.push('Choisir des activités gratuites ou moins chères');
      suggestions.push('Profiter des offres et promotions');
    }

    return suggestions.slice(0, 4); // Limiter à 4 suggestions
  };

  // Créer automatiquement des suggestions dans le système
  const createBudgetSuggestion = async (alert: BudgetAlert) => {
    if (!user) return;

    try {
      const suggestionData = {
        userId: user.id,
        type: 'budget_alert' as const,
        title: `⚠️ Budget ${alert.budgetName} dépassé à ${alert.percentage.toFixed(0)}%`,
        description: `Vous avez dépensé ${alert.spentAmount.toFixed(0)} FCFA sur un budget de ${alert.budgetAmount.toFixed(0)} FCFA`,
        data: {
          budgetId: alert.budgetId,
          category: alert.category,
          overspent: alert.spentAmount - alert.budgetAmount,
          suggestions: alert.suggestions,
          severity: alert.severity
        },
        priority: alert.severity === 'critical' ? 'high' as const :
                 alert.severity === 'danger' ? 'medium' as const : 'low' as const,
        status: 'pending' as const,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      };

      await createSuggestion(suggestionData);
      console.log(`💡 Suggestion d'alerte budgétaire créée pour ${alert.budgetName}`);
    } catch (error) {
      console.error('Erreur lors de la création de la suggestion budgétaire:', error);
    }
  };

  // Analyser les budgets et générer les alertes
  const analyzebudgets = async () => {
    if (!budgets.length) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const newAlerts: BudgetAlert[] = [];

    // Filtrer seulement les budgets actifs
    const activeBudgets = budgets.filter(budget => budget.isActive);

    for (const budget of activeBudgets) {
      // 🔥 FIX: Utiliser budget.spent au lieu de recalculer par catégorie
      const spentAmount = budget.spent;
      const percentage = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;

      console.log(`📊 Budget "${budget.name}": ${spentAmount}/${budget.amount} (${percentage.toFixed(1)}%) - Seuil: ${budget.alertThreshold}%`);

      // Générer une alerte si le seuil est dépassé
      if (percentage >= budget.alertThreshold) {
        let severity: 'warning' | 'danger' | 'critical' = 'warning';
        let message = '';

        if (percentage >= 120) {
          severity = 'critical';
          message = `Budget largement dépassé ! Vous avez dépensé ${(percentage - 100).toFixed(0)}% de plus que prévu.`;
        } else if (percentage >= 100) {
          severity = 'danger';
          message = `Budget dépassé de ${(percentage - 100).toFixed(0)}%. Action immédiate requise.`;
        } else {
          severity = 'warning';
          message = `Attention : vous approchez de la limite de votre budget (${percentage.toFixed(0)}%).`;
        }

        const alert: BudgetAlert = {
          budgetId: budget.id,
          budgetName: budget.name,
          category: budget.category,
          budgetAmount: budget.amount,
          spentAmount,
          percentage,
          alertThreshold: budget.alertThreshold,
          severity,
          message,
          suggestions: []
        };

        alert.suggestions = generateCompensationSuggestions(alert);
        newAlerts.push(alert);

        // Créer automatiquement une suggestion pour les alertes critiques et danger
        if (severity === 'critical' || severity === 'danger') {
          await createBudgetSuggestion(alert);
        }
      }
    }

    console.log(`🚨 ${newAlerts.length} alerte(s) générée(s) sur ${activeBudgets.length} budgets actifs`);
    setAlerts(newAlerts);
    setLoading(false);
  };

  useEffect(() => {
    if (budgets.length > 0 && transactions.length > 0) {
      analyzebudgets();
    } else {
      setLoading(false);
    }
  }, [budgets, transactions, user]);

  const dismissAlert = (budgetId: string) => {
    setAlerts(prev => prev.filter(alert => alert.budgetId !== budgetId));
  };

  const getAlertsByCategory = (category: string) => {
    return alerts.filter(alert => alert.category === category);
  };

  const getCriticalAlerts = () => {
    return alerts.filter(alert => alert.severity === 'critical');
  };

  const getTotalAlertsCount = () => {
    return alerts.length;
  };

  return {
    alerts,
    loading,
    dismissAlert,
    getAlertsByCategory,
    getCriticalAlerts,
    getTotalAlertsCount,
    calculateCategorySpending,
    refetch: analyzebudgets
  };
};