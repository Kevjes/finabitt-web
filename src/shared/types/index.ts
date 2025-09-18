// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

// Habit types
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
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  dueDate?: Date;
  linkedHabitId?: string;
  linkedTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
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