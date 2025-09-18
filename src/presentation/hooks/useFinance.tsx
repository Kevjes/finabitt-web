'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { FinanceRepository } from '@/src/data/repositories/financeRepository';
import { Account, Transaction, TransactionCategory, Budget, Goal } from '@/src/shared/types';

const financeRepository = new FinanceRepository();

export const useFinance = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les données financières
  const loadFinanceData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [
        userAccounts,
        userTransactions,
        userCategories,
        userBudgets,
        userGoals
      ] = await Promise.all([
        financeRepository.getAccountsByUserId(user.id),
        financeRepository.getTransactionsByUserId(user.id),
        financeRepository.getCategoriesByUserId(user.id),
        financeRepository.getBudgetsByUserId(user.id),
        financeRepository.getGoalsByUserId(user.id)
      ]);

      setAccounts(userAccounts);
      setTransactions(userTransactions);
      setCategories(userCategories);
      setBudgets(userBudgets);
      setGoals(userGoals);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données financières');
      console.error('Error loading finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [user]);

  // ===== COMPTES =====
  const createAccount = async (accountData: Omit<Account, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const newAccount: Omit<Account, 'id'> = {
      ...accountData,
      userId: user.id,
      probableBalance: accountData.currentBalance, // Initialement égal au solde actuel
      createdAt: now,
      updatedAt: now
    };

    try {
      const accountId = await financeRepository.createAccount(newAccount);
      console.log('Account created with ID:', accountId);

      const createdAccount: Account = {
        id: accountId,
        ...newAccount
      };

      setAccounts(prevAccounts => [createdAccount, ...prevAccounts]);

      setTimeout(async () => {
        await loadFinanceData();
      }, 1000);

      return true;
    } catch (err) {
      setError('Erreur lors de la création du compte');
      console.error('Error creating account:', err);
      return false;
    }
  };

  const updateAccount = async (accountId: string, updates: Partial<Account>) => {
    try {
      await financeRepository.updateAccount(accountId, updates);

      setAccounts(prevAccounts =>
        prevAccounts.map(account =>
          account.id === accountId
            ? { ...account, ...updates, updatedAt: new Date() }
            : account
        )
      );

      return true;
    } catch (err) {
      setError('Erreur lors de la mise à jour du compte');
      console.error('Error updating account:', err);
      await loadFinanceData();
      return false;
    }
  };

  const deleteAccount = async (accountId: string) => {
    try {
      await financeRepository.deleteAccount(accountId);
      setAccounts(prevAccounts => prevAccounts.filter(account => account.id !== accountId));
      return true;
    } catch (err) {
      setError('Erreur lors de la suppression du compte');
      console.error('Error deleting account:', err);
      await loadFinanceData();
      return false;
    }
  };

  // ===== TRANSACTIONS =====
  const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const newTransaction: Omit<Transaction, 'id'> = {
      ...transactionData,
      userId: user.id,
      createdAt: now,
      updatedAt: now
    };

    try {
      const transactionId = await financeRepository.createTransaction(newTransaction);
      console.log('Transaction created with ID:', transactionId);

      const createdTransaction: Transaction = {
        id: transactionId,
        ...newTransaction
      };

      setTransactions(prevTransactions => [createdTransaction, ...prevTransactions]);

      // Recharger pour mettre à jour les soldes
      setTimeout(async () => {
        await loadFinanceData();
      }, 1000);

      return true;
    } catch (err) {
      setError('Erreur lors de la création de la transaction');
      console.error('Error creating transaction:', err);
      return false;
    }
  };

  const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
    try {
      await financeRepository.updateTransaction(transactionId, updates);

      setTransactions(prevTransactions =>
        prevTransactions.map(transaction =>
          transaction.id === transactionId
            ? { ...transaction, ...updates, updatedAt: new Date() }
            : transaction
        )
      );

      // Recharger pour mettre à jour les soldes si nécessaire
      if (updates.status || updates.amount) {
        setTimeout(async () => {
          await loadFinanceData();
        }, 500);
      }

      return true;
    } catch (err) {
      setError('Erreur lors de la mise à jour de la transaction');
      console.error('Error updating transaction:', err);
      await loadFinanceData();
      return false;
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      await financeRepository.deleteTransaction(transactionId);
      setTransactions(prevTransactions =>
        prevTransactions.filter(transaction => transaction.id !== transactionId)
      );

      // Recharger pour mettre à jour les soldes
      setTimeout(async () => {
        await loadFinanceData();
      }, 500);

      return true;
    } catch (err) {
      setError('Erreur lors de la suppression de la transaction');
      console.error('Error deleting transaction:', err);
      await loadFinanceData();
      return false;
    }
  };

  // ===== CATÉGORIES =====
  const createCategory = async (categoryData: Omit<TransactionCategory, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const newCategory: Omit<TransactionCategory, 'id'> = {
      ...categoryData,
      userId: user.id,
      createdAt: new Date()
    };

    try {
      const categoryId = await financeRepository.createCategory(newCategory);

      const createdCategory: TransactionCategory = {
        id: categoryId,
        ...newCategory
      };

      setCategories(prevCategories => [...prevCategories, createdCategory]);
      return true;
    } catch (err) {
      setError('Erreur lors de la création de la catégorie');
      console.error('Error creating category:', err);
      return false;
    }
  };

  // ===== BUDGETS =====
  const createBudget = async (budgetData: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const newBudget: Omit<Budget, 'id'> = {
      ...budgetData,
      userId: user.id,
      spent: 0, // Initialiser à 0
      createdAt: now,
      updatedAt: now
    };

    try {
      const budgetId = await financeRepository.createBudget(newBudget);

      const createdBudget: Budget = {
        id: budgetId,
        ...newBudget
      };

      setBudgets(prevBudgets => [createdBudget, ...prevBudgets]);
      return true;
    } catch (err) {
      setError('Erreur lors de la création du budget');
      console.error('Error creating budget:', err);
      return false;
    }
  };

  // ===== OBJECTIFS =====
  const createGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const newGoal: Omit<Goal, 'id'> = {
      ...goalData,
      userId: user.id,
      currentAmount: 0, // Initialiser à 0
      createdAt: now,
      updatedAt: now
    };

    try {
      const goalId = await financeRepository.createGoal(newGoal);

      const createdGoal: Goal = {
        id: goalId,
        ...newGoal
      };

      setGoals(prevGoals => [createdGoal, ...prevGoals]);
      return true;
    } catch (err) {
      setError('Erreur lors de la création de l\'objectif');
      console.error('Error creating goal:', err);
      return false;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      await financeRepository.updateGoal(goalId, updates);

      setGoals(prevGoals =>
        prevGoals.map(goal =>
          goal.id === goalId
            ? { ...goal, ...updates, updatedAt: new Date() }
            : goal
        )
      );

      return true;
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'objectif');
      console.error('Error updating goal:', err);
      await loadFinanceData();
      return false;
    }
  };

  // ===== UTILITAIRES =====
  const getTotalBalance = () => {
    return accounts.reduce((total, account) => total + account.currentBalance, 0);
  };

  const getMonthlyIncome = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return transactions
      .filter(t =>
        t.type === 'income' &&
        t.status === 'completed' &&
        t.date.getMonth() === currentMonth &&
        t.date.getFullYear() === currentYear
      )
      .reduce((total, t) => total + t.amount, 0);
  };

  const getMonthlyExpenses = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return transactions
      .filter(t =>
        t.type === 'expense' &&
        t.status === 'completed' &&
        t.date.getMonth() === currentMonth &&
        t.date.getFullYear() === currentYear
      )
      .reduce((total, t) => total + t.amount, 0);
  };

  const getTransactionsByAccount = (accountId: string) => {
    return transactions.filter(t =>
      t.sourceAccountId === accountId || t.destinationAccountId === accountId
    );
  };

  const getCategoryBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    transactions
      .filter(t =>
        t.type === 'expense' &&
        t.status === 'completed' &&
        t.date.getMonth() === currentMonth &&
        t.date.getFullYear() === currentYear
      )
      .forEach(t => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
      });

    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / getMonthlyExpenses()) * 100
    }));
  };

  return {
    // Data
    accounts,
    transactions,
    categories,
    budgets,
    goals,
    loading,
    error,

    // Account methods
    createAccount,
    updateAccount,
    deleteAccount,

    // Transaction methods
    createTransaction,
    updateTransaction,
    deleteTransaction,

    // Category methods
    createCategory,

    // Budget methods
    createBudget,

    // Goal methods
    createGoal,
    updateGoal,

    // Utility methods
    getTotalBalance,
    getMonthlyIncome,
    getMonthlyExpenses,
    getTransactionsByAccount,
    getCategoryBreakdown,

    // General
    refetch: loadFinanceData
  };
};