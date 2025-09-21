import { Budget, BudgetPeriodHistory, Transaction } from '@/src/shared/types';
import { FinanceRepository } from '@/src/data/repositories/financeRepository';
import { getNextPeriodDates, calculateBudgetUtilization } from '@/src/shared/utils/budgetUtils';

export class BudgetRecurrenceService {
  private financeRepository: FinanceRepository;

  constructor() {
    this.financeRepository = new FinanceRepository();
  }

  /**
   * Vérifie et renouvelle tous les budgets récurrents expirés
   */
  async checkAndRenewExpiredBudgets(userId: string): Promise<{
    renewed: Budget[];
    errors: { budgetId: string; error: string }[];
  }> {
    const renewed: Budget[] = [];
    const errors: { budgetId: string; error: string }[] = [];

    try {
      // Récupérer tous les budgets actifs et récurrents de l'utilisateur
      const budgets = await this.financeRepository.getBudgetsByUserId(userId);
      const expiredRecurringBudgets = budgets.filter(budget =>
        budget.isActive &&
        budget.isRecurring &&
        this.isBudgetExpired(budget)
      );

      for (const budget of expiredRecurringBudgets) {
        try {
          const renewedBudget = await this.renewBudget(budget);
          renewed.push(renewedBudget);
        } catch (error) {
          errors.push({
            budgetId: budget.id,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }
      }

      return { renewed, errors };
    } catch (error) {
      throw new Error(`Erreur lors de la vérification des budgets récurrents: ${error}`);
    }
  }

  /**
   * Renouvelle un budget récurrent
   */
  private async renewBudget(budget: Budget): Promise<Budget> {
    try {
      // Créer l'historique de la période actuelle
      const periodHistory = await this.createPeriodHistory(budget);

      // Calculer les nouvelles dates
      const { startDate, endDate } = getNextPeriodDates(budget.period, budget.endDate);

      // Mettre à jour le budget avec la nouvelle période
      const updatedBudget: Partial<Budget> = {
        startDate,
        endDate,
        spent: 0, // Remettre à zéro les dépenses
        currentPeriod: budget.currentPeriod + 1,
        totalPeriodsCompleted: budget.totalPeriodsCompleted + 1,
        recurringHistory: [
          ...(budget.recurringHistory || []),
          periodHistory
        ]
      };

      await this.financeRepository.updateBudget(budget.id, updatedBudget);

      return {
        ...budget,
        ...updatedBudget
      } as Budget;
    } catch (error) {
      throw new Error(`Erreur lors du renouvellement du budget ${budget.name}: ${error}`);
    }
  }

  /**
   * Crée l'historique pour la période qui se termine
   */
  private async createPeriodHistory(budget: Budget): Promise<BudgetPeriodHistory> {
    // Récupérer toutes les transactions liées à ce budget pendant la période
    const transactions = await this.getBudgetTransactionsInPeriod(budget);

    const utilizationPercentage = calculateBudgetUtilization(budget.spent, budget.amount);

    let status: BudgetPeriodHistory['status'];
    if (utilizationPercentage > 100) {
      status = 'exceeded';
    } else if (utilizationPercentage < 70) {
      status = 'under_utilized';
    } else {
      status = 'completed';
    }

    return {
      periodNumber: budget.currentPeriod,
      startDate: budget.startDate,
      endDate: budget.endDate,
      budgetedAmount: budget.amount,
      spentAmount: budget.spent,
      utilizationPercentage,
      status,
      transactionCount: transactions.length,
      completedAt: new Date()
    };
  }

  /**
   * Récupère les transactions liées à un budget pendant sa période active
   */
  private async getBudgetTransactionsInPeriod(budget: Budget): Promise<Transaction[]> {
    try {
      // Récupérer toutes les transactions de l'utilisateur
      const allTransactions = await this.financeRepository.getTransactionsByUserId(budget.userId);

      // Filtrer les transactions pour cette période de budget
      return allTransactions.filter(transaction =>
        transaction.linkedBudgetId === budget.id &&
        transaction.date >= budget.startDate &&
        transaction.date <= budget.endDate &&
        transaction.status === 'completed'
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions du budget:', error);
      return [];
    }
  }

  /**
   * Vérifie si un budget est expiré
   */
  private isBudgetExpired(budget: Budget): boolean {
    const now = new Date();
    return now > budget.endDate;
  }

  /**
   * Obtient l'historique complet d'un budget récurrent
   */
  async getBudgetHistory(budgetId: string): Promise<BudgetPeriodHistory[]> {
    try {
      const budget = await this.financeRepository.getBudgetById(budgetId);
      return budget?.recurringHistory || [];
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'historique du budget: ${error}`);
    }
  }

  /**
   * Calcule les statistiques globales d'un budget récurrent
   */
  calculateBudgetStatistics(budget: Budget): {
    averageUtilization: number;
    totalSpent: number;
    totalBudgeted: number;
    bestPeriod: BudgetPeriodHistory | null;
    worstPeriod: BudgetPeriodHistory | null;
    periods: {
      completed: number;
      exceeded: number;
      underUtilized: number;
    };
  } {
    const history = budget.recurringHistory || [];

    if (history.length === 0) {
      return {
        averageUtilization: 0,
        totalSpent: budget.spent,
        totalBudgeted: budget.amount,
        bestPeriod: null,
        worstPeriod: null,
        periods: { completed: 0, exceeded: 0, underUtilized: 0 }
      };
    }

    const totalSpent = history.reduce((sum, period) => sum + period.spentAmount, 0) + budget.spent;
    const totalBudgeted = history.reduce((sum, period) => sum + period.budgetedAmount, 0) + budget.amount;
    const averageUtilization = history.reduce((sum, period) => sum + period.utilizationPercentage, 0) / history.length;

    // Trouver la meilleure et la pire période (basé sur l'utilisation optimale ~80-90%)
    const bestPeriod = history.reduce((best: BudgetPeriodHistory | null, current) => {
      const bestOptimal = Math.abs(85 - (best?.utilizationPercentage || 0));
      const currentOptimal = Math.abs(85 - current.utilizationPercentage);
      return currentOptimal < bestOptimal ? current : best;
    }, null as BudgetPeriodHistory | null);

    const worstPeriod = history.reduce((worst: BudgetPeriodHistory | null, current) => {
      if (!worst) return current;

      // La pire période est celle qui dépasse le plus ou qui est la moins utilisée
      const worstScore = worst.utilizationPercentage > 100
        ? worst.utilizationPercentage
        : 100 - worst.utilizationPercentage;

      const currentScore = current.utilizationPercentage > 100
        ? current.utilizationPercentage
        : 100 - current.utilizationPercentage;

      return currentScore > worstScore ? current : worst;
    }, null as BudgetPeriodHistory | null);

    const periods = history.reduce((acc, period) => {
      acc[period.status]++;
      return acc;
    }, { completed: 0, exceeded: 0, under_utilized: 0 });

    return {
      averageUtilization,
      totalSpent,
      totalBudgeted,
      bestPeriod,
      worstPeriod,
      periods: {
        completed: periods.completed,
        exceeded: periods.exceeded,
        underUtilized: periods.under_utilized
      }
    };
  }

  /**
   * Désactive la récurrence d'un budget
   */
  async stopBudgetRecurrence(budgetId: string): Promise<void> {
    try {
      await this.financeRepository.updateBudget(budgetId, {
        isRecurring: false
      });
    } catch (error) {
      throw new Error(`Erreur lors de l'arrêt de la récurrence du budget: ${error}`);
    }
  }

  /**
   * Active la récurrence d'un budget
   */
  async startBudgetRecurrence(budgetId: string): Promise<void> {
    try {
      await this.financeRepository.updateBudget(budgetId, {
        isRecurring: true
      });
    } catch (error) {
      throw new Error(`Erreur lors de l'activation de la récurrence du budget: ${error}`);
    }
  }
}