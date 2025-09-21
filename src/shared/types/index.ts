// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

// Habit types
export interface Routine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'morning' | 'evening' | 'custom';
  habitIds: string[]; // Habitudes dans l'ordre d'exécution
  estimatedDuration: number; // en minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitSchedule {
  day: string; // 'monday', 'tuesday', etc. or 'daily' for every day
  times: string[]; // Array of time strings like ['09:30', '22:00']
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'good' | 'bad';
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: string[];
  target?: string;
  isActive: boolean;
  // Nouveau système d'horaires
  hasTimeSchedule: boolean; // Si true, utilise les horaires spécifiques
  schedules?: HabitSchedule[]; // Horaires détaillés par jour
  // Ou horaires simples pour toute la semaine
  dailyTimes?: string[]; // Pour frequency='daily' avec horaires fixes
  // Intégration financière
  hasFinancialImpact: boolean;
  estimatedCostPerOccurrence?: number; // Pour mauvaises habitudes
  savingsGoalId?: string; // Objectif d'épargne lié
  routineIds?: string[]; // Routines auxquelles cette habitude appartient
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitProgress {
  id: string;
  habitId: string;
  date: Date;
  completed: boolean;
  notes?: string;
}

// Status tracking pour performance analytics
export interface StatusHistoryEntry {
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  timestamp: Date;
  durationInPreviousStatus?: number; // temps passé dans le statut précédent (en minutes)
}

// Performance types
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string[];
  dueDate?: Date;
  dueTime?: string; // format HH:MM pour l'heure d'échéance
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  completedAt?: Date;
  // Status tracking pour analytics de performance
  statusHistory?: StatusHistoryEntry[];
  timeInTodo?: number; // temps en minutes dans le statut "todo"
  timeInProgress?: number; // temps en minutes dans le statut "in_progress"
  timeToComplete?: number; // temps total en minutes de création à completion
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  parentTaskId?: string; // for subtasks
  habitId?: string; // link to associated habit
  transactionId?: string; // link to associated transaction
  projectId?: string; // link to associated project
  // Finance integration
  hasFinancialImpact?: boolean; // Si la tâche a un impact financier
  estimatedCost?: number; // Coût estimé de la tâche
  actualCost?: number; // Coût réel de la tâche
  budgetId?: string; // Budget associé
  goalId?: string; // Objectif financier associé
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number; // every X days/weeks/months
  daysOfWeek?: number[]; // 0-6, Sunday to Saturday
  dayOfMonth?: number; // 1-31
  endDate?: Date;
}

export interface TaskCategory {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface TaskTimeEntry {
  id: string;
  taskId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description?: string;
  createdAt: Date;
}

// Finance types
export interface AccountRule {
  id: string;
  userId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount';
  value: number; // Pourcentage (0-100) ou montant fixe
  triggerType: 'on_income' | 'on_expense' | 'scheduled';
  frequency?: 'daily' | 'weekly' | 'monthly'; // Pour scheduled
  nextExecutionDate?: Date; // Pour scheduled
  minAmount?: number; // Montant minimum pour déclencher la règle
  maxAmount?: number; // Montant maximum de transfert
  isActive: boolean;
  lastExecutedAt?: Date;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'investment' | 'credit';
  initialBalance: number;
  currentBalance: number;
  probableBalance: number; // Solde probable avec transactions en attente
  currency: string; // EUR, USD, etc.
  bankName?: string;
  accountNumber?: string; // Masqué pour la sécurité
  color?: string; // Pour l'interface utilisateur
  icon?: string;
  isActive: boolean;
  linkedRules?: string[]; // IDs des règles de liaison
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  status: 'pending' | 'completed' | 'cancelled';
  sourceAccountId?: string; // Pour les dépenses et virements
  destinationAccountId?: string; // Pour les revenus et virements
  linkedTaskId?: string; // Lien avec module tâches
  linkedBudgetId?: string; // Lien avec un budget spécifique
  projectId?: string; // Lien avec un projet
  tags?: string[];
  receipt?: string; // URL du reçu/justificatif
  location?: string; // Lieu de la transaction
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  date: Date;
  time?: string; // Heure de la transaction au format HH:MM
  scheduledDate?: Date; // Pour les transactions programmées
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCategory {
  id: string;
  userId: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon?: string;
  subcategories?: string[];
  budget?: number; // Budget mensuel pour cette catégorie
  isActive: boolean;
  createdAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  alertThreshold: number; // Pourcentage pour alerte (ex: 80%)
  isRecurring: boolean; // Si le budget se renouvelle automatiquement
  isActive: boolean;
  // Données pour l'historique et la récurrence
  parentBudgetId?: string; // ID du budget parent si c'est une récurrence
  currentPeriod: number; // Numéro de la période actuelle (1, 2, 3...)
  totalPeriodsCompleted: number; // Nombre de périodes terminées
  recurringHistory?: BudgetPeriodHistory[]; // Historique des périodes précédentes
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetPeriodHistory {
  periodNumber: number;
  startDate: Date;
  endDate: Date;
  budgetedAmount: number;
  spentAmount: number;
  utilizationPercentage: number;
  status: 'completed' | 'exceeded' | 'under_utilized';
  transactionCount: number;
  completedAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'savings' | 'debt_payment' | 'investment' | 'purchase';
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  accountId: string; // Compte associé
  monthlyContribution?: number;
  priority: 'low' | 'medium' | 'high';
  isActive: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Nouveau type pour les rapports financiers
export interface FinancialReport {
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  accountBalances: {
    accountId: string;
    balance: number;
  }[];
  savingsRate: number;
  budgetCompliance: {
    category: string;
    budgeted: number;
    spent: number;
    compliance: number;
  }[];
  goalsProgress: {
    goalId: string;
    progress: number;
    projected: Date;
  }[];
  habitImpact: {
    habitId: string;
    savingsGenerated: number;
  }[];
}

// Système de gamification
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'habit' | 'task' | 'finance' | 'streak' | 'achievement';
  criteria: {
    type: string;
    value: number;
    period?: string;
  };
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge; // Badge complet pour faciliter l'affichage
  earnedAt: Date;
  notificationSent: boolean;
  isNew?: boolean; // Pour marquer les nouveaux badges
}

export interface UserLevel {
  id: string;
  userId: string;
  level: number;
  totalPoints: number;
  achievedAt: Date;
}

export interface UserStats {
  id: string;
  userId: string;
  totalPoints: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  habitsCompleted: number;
  tasksCompleted: number;
  budgetsRespected: number;
  goalsAchieved: number;
  lastUpdated: Date;
}

// Système de suggestions
export interface Suggestion {
  id: string;
  userId: string;
  type: 'transfer' | 'budget_alert' | 'habit_reward' | 'task_organization' | 'goal_contribution';
  title: string;
  description: string;
  data: Record<string, unknown>; // Données spécifiques à la suggestion
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  expiresAt?: Date;
  createdAt: Date;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type: 'suggestion' | 'alert' | 'reminder' | 'achievement' | 'budget_warning';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

// Rapports avancés
export interface ImpactReport {
  habitId: string;
  habitName: string;
  period: 'week' | 'month' | 'quarter';
  startDate: Date;
  endDate: Date;
  completionRate: number;
  financialImpact: {
    savedAmount: number;
    transferredToGoals: number;
    budgetImpact: number;
  };
  correlatedExpenses: {
    category: string;
    changeAmount: number;
    changePercentage: number;
  }[];
}

export interface PerformanceReport {
  period: 'week' | 'month' | 'quarter';
  startDate: Date;
  endDate: Date;
  taskStats: {
    total: number;
    completed: number;
    postponed: number;
    cancelled: number;
    completionRate: number;
  };
  procrastinationPatterns: {
    mostPostponedCategories: string[];
    averageDelayDays: number;
    timeOfDayPatterns: { hour: number; tasks: number }[];
  };
  productivityTrends: {
    date: Date;
    tasksCompleted: number;
    timeSpent: number;
  }[];
}

// Project types
export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: string;
  color?: string;
  icon?: string;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  startDate?: Date;
  endDate?: Date;
  estimatedBudget?: number;
  actualSpent: number;
  budgetIds: string[]; // Budgets associés au projet
  goalIds: string[]; // Objectifs financiers liés au projet
  tags?: string[];
  // Métriques du projet
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;
  totalTransactions: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectCategory {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ProjectBudget {
  id: string;
  projectId: string;
  budgetId: string;
  allocatedAmount: number;
  spentAmount: number;
  createdAt: Date;
}

export interface ProjectReport {
  projectId: string;
  projectName: string;
  period: 'week' | 'month' | 'quarter' | 'year' | 'all_time';
  startDate: Date;
  endDate: Date;
  financialSummary: {
    budgetTotal: number;
    actualSpent: number;
    budgetVariance: number;
    budgetVariancePercentage: number;
    transactionCount: number;
    averageTransactionAmount: number;
  };
  taskSummary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completionRate: number;
    averageTaskDuration: number;
  };
  categoryBreakdown: {
    category: string;
    budgeted: number;
    spent: number;
    taskCount: number;
  }[];
  timelineEvents: {
    date: Date;
    type: 'task_completed' | 'transaction_added' | 'budget_allocated' | 'milestone_reached';
    description: string;
    amount?: number;
  }[];
}