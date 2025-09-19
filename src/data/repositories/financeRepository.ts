import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/src/infrastructure/firebase/config';
import { Account, Transaction, TransactionCategory, Budget, Goal } from '@/src/shared/types';

export class FinanceRepository {
  private accountsCollection = 'accounts';
  private transactionsCollection = 'transactions';
  private categoriesCollection = 'transactionCategories';
  private budgetsCollection = 'budgets';
  private goalsCollection = 'goals';

  // ===== ACCOUNTS =====
  async createAccount(account: Omit<Account, 'id'>): Promise<string> {
    const cleanedAccount = this.cleanFinanceData({
      ...account,
      createdAt: Timestamp.fromDate(account.createdAt),
      updatedAt: Timestamp.fromDate(account.updatedAt)
    });

    const docRef = await addDoc(collection(db, this.accountsCollection), cleanedAccount);
    return docRef.id;
  }

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<void> {
    const accountRef = doc(db, this.accountsCollection, accountId);
    const cleanedUpdates = this.cleanFinanceData({
      ...updates,
      updatedAt: Timestamp.now()
    });
    await updateDoc(accountRef, cleanedUpdates);
  }

  async deleteAccount(accountId: string): Promise<void> {
    const accountRef = doc(db, this.accountsCollection, accountId);
    await updateDoc(accountRef, { isActive: false });
  }

  async getAccountsByUserId(userId: string): Promise<Account[]> {
    const q = query(
      collection(db, this.accountsCollection),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    } as Account));
  }

  async getAccountById(accountId: string): Promise<Account | null> {
    const accountRef = doc(db, this.accountsCollection, accountId);
    const docSnap = await getDoc(accountRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate()
      } as Account;
    }

    return null;
  }

  // ===== TRANSACTIONS =====
  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    const batch = writeBatch(db);

    // Ajouter la transaction
    const transactionRef = doc(collection(db, this.transactionsCollection));
    const cleanedTransaction = this.cleanFinanceData({
      ...transaction,
      date: Timestamp.fromDate(transaction.date),
      scheduledDate: transaction.scheduledDate ? Timestamp.fromDate(transaction.scheduledDate) : undefined,
      createdAt: Timestamp.fromDate(transaction.createdAt),
      updatedAt: Timestamp.fromDate(transaction.updatedAt)
    });

    batch.set(transactionRef, cleanedTransaction);

    // Mettre à jour les soldes des comptes si la transaction est completed
    if (transaction.status === 'completed') {
      const fullTransaction: Transaction = { ...transaction, id: transactionRef.id };
      await this.updateAccountBalances(batch, fullTransaction);
    }

    await batch.commit();
    return transactionRef.id;
  }

  async updateTransaction(transactionId: string, updates: Partial<Transaction>): Promise<void> {
    const batch = writeBatch(db);
    const transactionRef = doc(db, this.transactionsCollection, transactionId);

    // Récupérer l'ancienne transaction pour ajuster les soldes
    const oldTransactionSnap = await getDoc(transactionRef);
    const oldTransaction = oldTransactionSnap.data() as Transaction;

    const cleanedUpdates = this.cleanFinanceData({
      ...updates,
      updatedAt: Timestamp.now(),
      date: updates.date ? Timestamp.fromDate(updates.date) : undefined,
      scheduledDate: updates.scheduledDate ? Timestamp.fromDate(updates.scheduledDate) : undefined
    });

    batch.update(transactionRef, cleanedUpdates);

    // Ajuster les soldes si nécessaire
    if (updates.status || updates.amount) {
      const newTransaction = { ...oldTransaction, ...updates };
      await this.adjustAccountBalances(batch, oldTransaction, newTransaction);
    }

    await batch.commit();
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    const transactionRef = doc(db, this.transactionsCollection, transactionId);
    const transactionSnap = await getDoc(transactionRef);

    if (transactionSnap.exists()) {
      const transaction = transactionSnap.data() as Transaction;
      const batch = writeBatch(db);

      // Annuler l'impact sur les comptes
      if (transaction.status === 'completed') {
        await this.reverseAccountBalances(batch, transaction);
      }

      batch.delete(transactionRef);
      await batch.commit();
    }
  }

  async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    const q = query(
      collection(db, this.transactionsCollection),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      scheduledDate: doc.data().scheduledDate ? doc.data().scheduledDate.toDate() : undefined,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    } as Transaction));
  }

  async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    const q = query(
      collection(db, this.transactionsCollection),
      where('sourceAccountId', '==', accountId),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      scheduledDate: doc.data().scheduledDate ? doc.data().scheduledDate.toDate() : undefined,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    } as Transaction));
  }

  // ===== CATEGORIES =====
  async createCategory(category: Omit<TransactionCategory, 'id'>): Promise<string> {
    const cleanedCategory = this.cleanFinanceData({
      ...category,
      createdAt: Timestamp.fromDate(category.createdAt)
    });

    const docRef = await addDoc(collection(db, this.categoriesCollection), cleanedCategory);
    return docRef.id;
  }

  async getCategoriesByUserId(userId: string): Promise<TransactionCategory[]> {
    const q = query(
      collection(db, this.categoriesCollection),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    } as TransactionCategory));
  }

  // ===== BUDGETS =====
  async createBudget(budget: Omit<Budget, 'id'>): Promise<string> {
    const cleanedBudget = this.cleanFinanceData({
      ...budget,
      startDate: Timestamp.fromDate(budget.startDate),
      endDate: Timestamp.fromDate(budget.endDate),
      createdAt: Timestamp.fromDate(budget.createdAt),
      updatedAt: Timestamp.fromDate(budget.updatedAt)
    });

    const docRef = await addDoc(collection(db, this.budgetsCollection), cleanedBudget);
    return docRef.id;
  }

  async getBudgetsByUserId(userId: string): Promise<Budget[]> {
    const q = query(
      collection(db, this.budgetsCollection),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate.toDate(),
      endDate: doc.data().endDate.toDate(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    } as Budget));
  }

  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<void> {
    const budgetRef = doc(db, this.budgetsCollection, budgetId);
    const cleanedUpdates = this.cleanFinanceData({
      ...updates,
      ...(updates.startDate && { startDate: Timestamp.fromDate(updates.startDate) }),
      ...(updates.endDate && { endDate: Timestamp.fromDate(updates.endDate) }),
      updatedAt: Timestamp.now()
    });
    await updateDoc(budgetRef, cleanedUpdates);
  }

  async deleteBudget(budgetId: string): Promise<void> {
    const budgetRef = doc(db, this.budgetsCollection, budgetId);
    await updateDoc(budgetRef, { isActive: false });
  }

  // ===== GOALS =====
  async createGoal(goal: Omit<Goal, 'id'>): Promise<string> {
    const cleanedGoal = this.cleanFinanceData({
      ...goal,
      targetDate: goal.targetDate ? Timestamp.fromDate(goal.targetDate) : undefined,
      completedAt: goal.completedAt ? Timestamp.fromDate(goal.completedAt) : undefined,
      createdAt: Timestamp.fromDate(goal.createdAt),
      updatedAt: Timestamp.fromDate(goal.updatedAt)
    });

    const docRef = await addDoc(collection(db, this.goalsCollection), cleanedGoal);
    return docRef.id;
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
    const goalRef = doc(db, this.goalsCollection, goalId);
    const cleanedUpdates = this.cleanFinanceData({
      ...updates,
      updatedAt: Timestamp.now(),
      targetDate: updates.targetDate ? Timestamp.fromDate(updates.targetDate) : undefined,
      completedAt: updates.completedAt ? Timestamp.fromDate(updates.completedAt) : undefined
    });
    await updateDoc(goalRef, cleanedUpdates);
  }

  async getGoalsByUserId(userId: string): Promise<Goal[]> {
    const q = query(
      collection(db, this.goalsCollection),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      targetDate: doc.data().targetDate ? doc.data().targetDate.toDate() : undefined,
      completedAt: doc.data().completedAt ? doc.data().completedAt.toDate() : undefined,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    } as Goal));
  }

  // ===== HELPER METHODS =====
  private cleanFinanceData(data: any): any {
    const cleaned: any = {};

    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length === 0) {
          if (['tags', 'subcategories'].includes(key)) {
            return;
          }
        }
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  private async updateAccountBalances(batch: any, transaction: Transaction): Promise<void> {
    if (transaction.type === 'income' && transaction.destinationAccountId) {
      const accountRef = doc(db, this.accountsCollection, transaction.destinationAccountId);
      batch.update(accountRef, {
        currentBalance: increment(transaction.amount),
        probableBalance: increment(transaction.amount)
      });
    } else if (transaction.type === 'expense' && transaction.sourceAccountId) {
      const accountRef = doc(db, this.accountsCollection, transaction.sourceAccountId);
      batch.update(accountRef, {
        currentBalance: increment(-transaction.amount),
        probableBalance: increment(-transaction.amount)
      });
    } else if (transaction.type === 'transfer' && transaction.sourceAccountId && transaction.destinationAccountId) {
      const sourceRef = doc(db, this.accountsCollection, transaction.sourceAccountId);
      const destRef = doc(db, this.accountsCollection, transaction.destinationAccountId);

      batch.update(sourceRef, {
        currentBalance: increment(-transaction.amount),
        probableBalance: increment(-transaction.amount)
      });

      batch.update(destRef, {
        currentBalance: increment(transaction.amount),
        probableBalance: increment(transaction.amount)
      });
    }
  }

  private async adjustAccountBalances(batch: any, oldTransaction: Transaction, newTransaction: Transaction): Promise<void> {
    // Annuler l'ancienne transaction
    if (oldTransaction.status === 'completed') {
      await this.reverseAccountBalances(batch, oldTransaction);
    }

    // Appliquer la nouvelle transaction
    if (newTransaction.status === 'completed') {
      await this.updateAccountBalances(batch, newTransaction);
    }
  }

  private async reverseAccountBalances(batch: any, transaction: Transaction): Promise<void> {
    if (transaction.type === 'income' && transaction.destinationAccountId) {
      const accountRef = doc(db, this.accountsCollection, transaction.destinationAccountId);
      batch.update(accountRef, {
        currentBalance: increment(-transaction.amount),
        probableBalance: increment(-transaction.amount)
      });
    } else if (transaction.type === 'expense' && transaction.sourceAccountId) {
      const accountRef = doc(db, this.accountsCollection, transaction.sourceAccountId);
      batch.update(accountRef, {
        currentBalance: increment(transaction.amount),
        probableBalance: increment(transaction.amount)
      });
    } else if (transaction.type === 'transfer' && transaction.sourceAccountId && transaction.destinationAccountId) {
      const sourceRef = doc(db, this.accountsCollection, transaction.sourceAccountId);
      const destRef = doc(db, this.accountsCollection, transaction.destinationAccountId);

      batch.update(sourceRef, {
        currentBalance: increment(transaction.amount),
        probableBalance: increment(transaction.amount)
      });

      batch.update(destRef, {
        currentBalance: increment(-transaction.amount),
        probableBalance: increment(-transaction.amount)
      });
    }
  }
}