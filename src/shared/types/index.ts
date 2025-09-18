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
  type: 'checking' | 'savings' | 'cash';
  initialBalance: number;
  currentBalance: number;
  probableBalance: number;
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
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  sourceAccountId?: string;
  destinationAccountId?: string;
  linkedTaskId?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'weekly' | 'yearly';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  accountId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}