// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

// Habit types
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
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  parentTaskId?: string; // for subtasks
  habitId?: string; // link to associated habit
  transactionId?: string; // link to associated transaction
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
  tags?: string[];
  receipt?: string; // URL du reçu/justificatif
  location?: string; // Lieu de la transaction
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  date: Date;
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
  category: string;
  amount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  alertThreshold: number; // Pourcentage pour alerte (ex: 80%)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
}