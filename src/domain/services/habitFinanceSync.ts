'use client';

import { Habit, HabitProgress, Goal, Suggestion } from '@/src/shared/types';

export interface HabitFinancialImpact {
  habitId: string;
  habitName: string;
  type: 'good' | 'bad';
  estimatedSavings: number;
  actualSavings: number;
  goalId?: string;
  period: Date;
}

export interface SuggestedTransfer {
  id: string;
  habitId: string;
  habitName: string;
  amount: number;
  goalId?: string;
  goalName?: string;
  description: string;
  reason: string;
  suggestedAt: Date;
}

export class HabitFinanceSyncService {
  /**
   * Calcule les économies générées par le respect d'une mauvaise habitude
   */
  calculateSavingsFromHabit(habit: Habit, progress: HabitProgress[]): number {
    if (habit.type !== 'bad' || !habit.hasFinancialImpact || !habit.estimatedCostPerOccurrence) {
      return 0;
    }

    // Compter les jours où la mauvaise habitude n'a PAS été pratiquée (donc économies)
    const completedDays = progress.filter(p => p.completed === false && p.habitId === habit.id);

    return completedDays.length * habit.estimatedCostPerOccurrence;
  }

  /**
   * Calcule le coût des mauvaises habitudes pratiquées
   */
  calculateCostFromHabit(habit: Habit, progress: HabitProgress[]): number {
    if (habit.type !== 'bad' || !habit.hasFinancialImpact || !habit.estimatedCostPerOccurrence) {
      return 0;
    }

    // Compter les jours où la mauvaise habitude a été pratiquée
    const failedDays = progress.filter(p => p.completed === true && p.habitId === habit.id);

    return failedDays.length * habit.estimatedCostPerOccurrence;
  }

  /**
   * Génère une suggestion de transfert vers un objectif d'épargne
   */
  generateTransferSuggestion(
    habit: Habit,
    savingsAmount: number,
    goal?: Goal
  ): SuggestedTransfer | null {
    if (savingsAmount <= 0) return null;

    const goalName = goal ? goal.name : 'Épargne générale';
    const goalId = goal?.id;

    return {
      id: `suggestion_${habit.id}_${Date.now()}`,
      habitId: habit.id,
      habitName: habit.name,
      amount: savingsAmount,
      goalId,
      goalName,
      description: `Transférer ${savingsAmount.toFixed(0)} FCFA économisés grâce à l&apos;abandon de "${habit.name}"`,
      reason: habit.type === 'bad'
        ? `Vous avez évité cette mauvaise habitude et économisé de l&apos;argent !`
        : `Votre bonne habitude a un impact financier positif`,
      suggestedAt: new Date()
    };
  }

  /**
   * Calcule l'impact financier global des habitudes sur une période
   */
  calculatePeriodImpact(
    habits: Habit[],
    progressData: HabitProgress[],
    startDate: Date,
    endDate: Date
  ): HabitFinancialImpact[] {
    return habits
      .filter(habit => habit.hasFinancialImpact)
      .map(habit => {
        const habitProgress = progressData.filter(p =>
          p.habitId === habit.id &&
          p.date >= startDate &&
          p.date <= endDate
        );

        const estimatedSavings = habit.type === 'bad' && habit.estimatedCostPerOccurrence
          ? habitProgress.length * habit.estimatedCostPerOccurrence
          : 0;

        const actualSavings = this.calculateSavingsFromHabit(habit, habitProgress);

        return {
          habitId: habit.id,
          habitName: habit.name,
          type: habit.type,
          estimatedSavings,
          actualSavings,
          goalId: habit.savingsGoalId,
          period: endDate
        };
      });
  }

  /**
   * Suggère des actions financières basées sur les progrès des habitudes
   */
  generateFinancialSuggestions(
    habits: Habit[],
    progressData: HabitProgress[],
    goals: Goal[]
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    habits.forEach(habit => {
      if (!habit.hasFinancialImpact) return;

      const recentProgress = progressData.filter(p =>
        p.habitId === habit.id &&
        p.date >= weekStart &&
        p.date <= now
      );

      if (habit.type === 'bad' && habit.estimatedCostPerOccurrence) {
        const savings = this.calculateSavingsFromHabit(habit, recentProgress);

        if (savings > 0) {
          const linkedGoal = goals.find(g => g.id === habit.savingsGoalId);

          suggestions.push({
            id: `habit_savings_${habit.id}_${Date.now()}`,
            userId: '', // Sera rempli par le service appelant
            type: 'habit_reward',
            title: `Félicitations ! Économies de ${savings.toFixed(0)} FCFA`,
            description: `Grâce à vos efforts pour éviter "${habit.name}", vous avez économisé ${savings.toFixed(0)} FCFA cette semaine. Voulez-vous transférer cette somme vers ${linkedGoal ? linkedGoal.name : 'votre épargne'} ?`,
            data: {
              habitId: habit.id,
              amount: savings,
              goalId: habit.savingsGoalId,
              transferSuggestion: true
            },
            priority: 'medium',
            status: 'pending',
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 jours
            createdAt: now
          });
        }
      }

      // Suggestion pour créer un objectif d'épargne si la habitude a un impact financier mais pas d'objectif lié
      if (habit.hasFinancialImpact && !habit.savingsGoalId && habit.type === 'bad') {
        suggestions.push({
          id: `habit_goal_${habit.id}_${Date.now()}`,
          userId: '',
          type: 'goal_contribution',
          title: 'Créer un objectif d\'épargne',
          description: `l&apos;habitude "${habit.name}" a un impact financier. Voulez-vous créer un objectif d'épargne pour y transférer automatiquement les économies réalisées ?`,
          data: {
            habitId: habit.id,
            suggestedAmount: (habit.estimatedCostPerOccurrence || 0) * 30, // Estimation mensuelle
            createGoal: true
          },
          priority: 'low',
          status: 'pending',
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          createdAt: now
        });
      }
    });

    return suggestions;
  }

  /**
   * Analyse les corrélations entre habitudes et dépenses
   */
  analyzeHabitExpenseCorrelation(
    habits: Habit[],
    progressData: HabitProgress[],
    transactions: Transaction[], // Type Transaction importé depuis types
    categoryName: string
  ): {
    correlation: number;
    insights: string[];
    suggestedActions: string[];
  } {
    const insights: string[] = [];
    const suggestedActions: string[] = [];

    // Analyser les habitudes liées à cette catégorie de dépense
    const relatedHabits = habits.filter(h =>
      h.hasFinancialImpact &&
      // Ici on pourrait ajouter une logique pour lier les habitudes aux catégories
      h.description?.toLowerCase().includes(categoryName.toLowerCase())
    );

    if (relatedHabits.length === 0) {
      return { correlation: 0, insights: [], suggestedActions: [] };
    }

    // Calculer la corrélation (simplifiée)
    let correlation = 0;

    relatedHabits.forEach(habit => {
      const habitSuccess = progressData.filter(p =>
        p.habitId === habit.id &&
        p.completed === (habit.type === 'good')
      ).length;

      const totalDays = progressData.filter(p => p.habitId === habit.id).length;
      const successRate = totalDays > 0 ? habitSuccess / totalDays : 0;

      if (habit.type === 'bad') {
        // Plus la mauvaise habitude est évitée, moins il devrait y avoir de dépenses
        correlation += successRate;

        if (successRate > 0.7) {
          insights.push(`Excellent ! Vous évitez "${habit.name}" dans 70%+ des cas.`);
        } else if (successRate < 0.3) {
          insights.push(`Attention : "${habit.name}" est pratiquée trop souvent.`);
          suggestedActions.push(`Concentrez-vous sur l&apos;arrêt de "${habit.name}" pour réduire vos dépenses en ${categoryName}.`);
        }
      }
    });

    correlation = correlation / relatedHabits.length;

    return {
      correlation,
      insights,
      suggestedActions
    };
  }

  /**
   * Calcule le ROI (retour sur investissement) d'une habitude
   */
  calculateHabitROI(
    habit: Habit,
    progressData: HabitProgress[],
    timeInvestmentMinutes: number
  ): {
    timeInvested: number;
    moneySaved: number;
    roi: number;
    insights: string;
  } {
    const totalSavings = this.calculateSavingsFromHabit(habit, progressData);
    const totalTimeInvested = progressData.filter(p =>
      p.habitId === habit.id &&
      p.completed === (habit.type === 'good')
    ).length * timeInvestmentMinutes;

    const roi = totalTimeInvested > 0 ? totalSavings / (totalTimeInvested / 60) : 0; // FCFA/heure

    let insights = '';
    if (roi > 50) {
      insights = 'Excellent ROI ! Cette habitude est très rentable.';
    } else if (roi > 20) {
      insights = 'Bon ROI. Cette habitude vaut la peine d\'être maintenue.';
    } else if (roi > 0) {
      insights = 'ROI modeste mais positif.';
    } else {
      insights = 'Cette habitude pourrait nécessiter des ajustements.';
    }

    return {
      timeInvested: totalTimeInvested,
      moneySaved: totalSavings,
      roi,
      insights
    };
  }
}

export const habitFinanceSyncService = new HabitFinanceSyncService();