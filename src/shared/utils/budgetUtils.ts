import { Budget } from '../types';

export const calculateBudgetDates = (
  period: Budget['period'],
  customStartDate?: Date
): { startDate: Date; endDate: Date } => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'weekly':
      if (customStartDate) {
        startDate = new Date(customStartDate);
      } else {
        // Début de la semaine (lundi)
        const monday = new Date(now);
        monday.setDate(now.getDate() - now.getDay() + 1);
        monday.setHours(0, 0, 0, 0);
        startDate = monday;
      }
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'monthly':
      if (customStartDate) {
        startDate = new Date(customStartDate);
      } else {
        // Premier jour du mois actuel
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'quarterly':
      if (customStartDate) {
        startDate = new Date(customStartDate);
      } else {
        // Premier jour du trimestre actuel
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
      }
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'yearly':
      if (customStartDate) {
        startDate = new Date(customStartDate);
      } else {
        // Premier jour de l'année actuelle
        startDate = new Date(now.getFullYear(), 0, 1);
      }
      endDate = new Date(startDate.getFullYear() + 1, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;

    case 'custom':
      // Pour les budgets personnalisés, on utilise la date fournie ou la date actuelle
      startDate = customStartDate || new Date(now);
      startDate.setHours(0, 0, 0, 0);
      // Par défaut, 30 jours pour un budget personnalisé
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30);
      endDate.setHours(23, 59, 59, 999);
      break;

    default:
      throw new Error(`Period type "${period}" not supported`);
  }

  return { startDate, endDate };
};

export const getNextPeriodDates = (
  period: Budget['period'],
  currentEndDate: Date
): { startDate: Date; endDate: Date } => {
  const startDate = new Date(currentEndDate);
  startDate.setDate(currentEndDate.getDate() + 1);
  startDate.setHours(0, 0, 0, 0);

  let endDate: Date;

  switch (period) {
    case 'weekly':
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;

    case 'monthly':
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      break;

    case 'quarterly':
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
      break;

    case 'yearly':
      endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), 0);
      break;

    case 'custom':
      // Pour les budgets personnalisés, on garde la même durée
      const duration = currentEndDate.getTime() - currentEndDate.getTime() + (24 * 60 * 60 * 1000);
      endDate = new Date(startDate.getTime() + duration);
      break;

    default:
      throw new Error(`Period type "${period}" not supported`);
  }

  endDate.setHours(23, 59, 59, 999);
  return { startDate, endDate };
};

export const isBudgetPeriodExpired = (budget: Budget): boolean => {
  const now = new Date();
  return now > budget.endDate;
};

export const shouldRenewBudget = (budget: Budget): boolean => {
  return budget.isRecurring && isBudgetPeriodExpired(budget) && budget.isActive;
};

export const calculateBudgetUtilization = (spent: number, amount: number): number => {
  if (amount === 0) return 0;
  return Math.round((spent / amount) * 100);
};

export const getBudgetStatus = (
  spent: number,
  amount: number,
  alertThreshold: number
): 'healthy' | 'warning' | 'exceeded' => {
  const utilization = calculateBudgetUtilization(spent, amount);

  if (utilization > 100) return 'exceeded';
  if (utilization >= alertThreshold) return 'warning';
  return 'healthy';
};

export const formatPeriodLabel = (period: Budget['period']): string => {
  const labels = {
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    yearly: 'Annuel',
    custom: 'Personnalisé'
  };
  return labels[period];
};

export const getPeriodDuration = (startDate: Date, endDate: Date): number => {
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
};