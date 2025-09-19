'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDoc,
  increment
} from 'firebase/firestore';
import { db } from '@/src/infrastructure/firebase/config';
import { AccountRule } from '@/src/shared/types';

export class AccountRuleRepository {
  private readonly collection = 'accountRules';

  private cleanAccountRuleData(data: Partial<AccountRule>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          cleaned[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          const cleanedObject = this.cleanAccountRuleData(value);
          if (Object.keys(cleanedObject).length > 0) {
            cleaned[key] = cleanedObject;
          }
        } else {
          cleaned[key] = value;
        }
      }
    });

    return cleaned;
  }

  async createAccountRule(ruleData: Omit<AccountRule, 'id' | 'createdAt' | 'updatedAt' | 'lastExecutedAt' | 'executionCount'>): Promise<string> {
    try {
      const cleanedData = this.cleanAccountRuleData({
        ...ruleData,
        executionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const docRef = await addDoc(collection(db, this.collection), {
        ...cleanedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating account rule:', error);
      throw error;
    }
  }

  async updateAccountRule(id: string, updates: Partial<AccountRule>): Promise<void> {
    try {
      const cleanedUpdates = this.cleanAccountRuleData({
        ...updates,
        updatedAt: new Date()
      });

      const docRef = doc(db, this.collection, id);
      await updateDoc(docRef, {
        ...cleanedUpdates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating account rule:', error);
      throw error;
    }
  }

  async deleteAccountRule(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting account rule:', error);
      throw error;
    }
  }

  async getAccountRulesByUserId(userId: string): Promise<AccountRule[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastExecutedAt: doc.data().lastExecutedAt?.toDate(),
        nextExecutionDate: doc.data().nextExecutionDate?.toDate()
      })) as AccountRule[];
    } catch (error) {
      console.error('Error getting account rules:', error);
      throw error;
    }
  }

  async getAccountRulesByAccountId(accountId: string): Promise<AccountRule[]> {
    try {
      const sourceQuery = query(
        collection(db, this.collection),
        where('sourceAccountId', '==', accountId),
        where('isActive', '==', true)
      );

      const destQuery = query(
        collection(db, this.collection),
        where('destinationAccountId', '==', accountId),
        where('isActive', '==', true)
      );

      const [sourceSnapshot, destSnapshot] = await Promise.all([
        getDocs(sourceQuery),
        getDocs(destQuery)
      ]);

      const sourceRules = sourceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastExecutedAt: doc.data().lastExecutedAt?.toDate(),
        nextExecutionDate: doc.data().nextExecutionDate?.toDate()
      })) as AccountRule[];

      const destRules = destSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastExecutedAt: doc.data().lastExecutedAt?.toDate(),
        nextExecutionDate: doc.data().nextExecutionDate?.toDate()
      })) as AccountRule[];

      return [...sourceRules, ...destRules];
    } catch (error) {
      console.error('Error getting account rules by account ID:', error);
      throw error;
    }
  }

  async getScheduledRules(): Promise<AccountRule[]> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.collection),
        where('triggerType', '==', 'scheduled'),
        where('isActive', '==', true),
        where('nextExecutionDate', '<=', now)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastExecutedAt: doc.data().lastExecutedAt?.toDate(),
        nextExecutionDate: doc.data().nextExecutionDate?.toDate()
      })) as AccountRule[];
    } catch (error) {
      console.error('Error getting scheduled rules:', error);
      throw error;
    }
  }

  async executeRule(
    ruleId: string,
    transactionAmount: number,
    sourceAccountId: string,
    destinationAccountId: string
  ): Promise<{ transferAmount: number; executed: boolean }> {
    try {
      const batch = writeBatch(db);

      // Récupérer la règle
      const ruleRef = doc(db, this.collection, ruleId);
      const ruleDoc = await getDoc(ruleRef);

      if (!ruleDoc.exists()) {
        throw new Error('Rule not found');
      }

      const rule = ruleDoc.data() as AccountRule;

      // Calculer le montant de transfert
      let transferAmount = 0;
      if (rule.type === 'percentage') {
        transferAmount = (transactionAmount * rule.value) / 100;
      } else {
        transferAmount = rule.value;
      }

      // Vérifier les limites
      if (rule.minAmount && transferAmount < rule.minAmount) {
        return { transferAmount: 0, executed: false };
      }

      if (rule.maxAmount && transferAmount > rule.maxAmount) {
        transferAmount = rule.maxAmount;
      }

      // Vérifier que le compte source a suffisamment de fonds
      const sourceAccountRef = doc(db, 'accounts', sourceAccountId);
      const sourceAccountDoc = await getDoc(sourceAccountRef);

      if (!sourceAccountDoc.exists()) {
        throw new Error('Source account not found');
      }

      const sourceAccount = sourceAccountDoc.data();
      if (sourceAccount.currentBalance < transferAmount) {
        return { transferAmount: 0, executed: false };
      }

      // Effectuer le transfert
      batch.update(sourceAccountRef, {
        currentBalance: increment(-transferAmount),
        probableBalance: increment(-transferAmount),
        updatedAt: serverTimestamp()
      });

      const destinationAccountRef = doc(db, 'accounts', destinationAccountId);
      batch.update(destinationAccountRef, {
        currentBalance: increment(transferAmount),
        probableBalance: increment(transferAmount),
        updatedAt: serverTimestamp()
      });

      // Mettre à jour la règle
      const nextExecution = this.calculateNextExecution(rule);
      batch.update(ruleRef, {
        lastExecutedAt: serverTimestamp(),
        executionCount: increment(1),
        nextExecutionDate: nextExecution,
        updatedAt: serverTimestamp()
      });

      // Créer une transaction pour tracer l'opération
      const transactionRef = doc(collection(db, 'transactions'));
      batch.set(transactionRef, {
        userId: rule.userId,
        type: 'transfer',
        amount: transferAmount,
        description: `Transfert automatique: ${rule.name}`,
        category: 'Transfert automatique',
        status: 'completed',
        sourceAccountId: sourceAccountId,
        destinationAccountId: destinationAccountId,
        isRecurring: false,
        tags: ['auto-transfer', 'rule'],
        date: new Date(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      return { transferAmount, executed: true };
    } catch (error) {
      console.error('Error executing rule:', error);
      throw error;
    }
  }

  private calculateNextExecution(rule: AccountRule): Date | null {
    if (rule.triggerType !== 'scheduled' || !rule.frequency) {
      return null;
    }

    const now = new Date();
    const nextDate = new Date(now);

    switch (rule.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    return nextDate;
  }

  async getAccountRule(id: string): Promise<AccountRule | null> {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return null;
      }

      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        lastExecutedAt: data.lastExecutedAt?.toDate(),
        nextExecutionDate: data.nextExecutionDate?.toDate()
      } as AccountRule;
    } catch (error) {
      console.error('Error getting account rule:', error);
      throw error;
    }
  }
}

export const accountRuleRepository = new AccountRuleRepository();