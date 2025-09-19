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
  Timestamp
} from 'firebase/firestore';
import { db } from '@/src/infrastructure/firebase/config';
import { Habit, HabitProgress } from '@/src/shared/types';

export class HabitRepository {
  private habitsCollection = 'habits';
  private progressCollection = 'habitProgress';

  async createHabit(habit: Omit<Habit, 'id'>): Promise<string> {
    // Nettoyer les données pour Firebase (supprimer les undefined)
    const cleanedHabit = this.cleanHabitData({
      ...habit,
      createdAt: Timestamp.fromDate(habit.createdAt),
      updatedAt: Timestamp.fromDate(habit.updatedAt)
    });

    const docRef = await addDoc(collection(db, this.habitsCollection), cleanedHabit);
    return docRef.id;
  }

  private cleanHabitData(habit: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};

    Object.keys(habit).forEach(key => {
      const value = habit[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length === 0) {
          // Ne pas inclure les arrays vides pour certains champs optionnels
          if (['customDays', 'dailyTimes', 'schedules'].includes(key)) {
            return;
          }
        }
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<void> {
    const habitRef = doc(db, this.habitsCollection, habitId);
    const cleanedUpdates = this.cleanHabitData({
      ...updates,
      updatedAt: Timestamp.now()
    });
    await updateDoc(habitRef, cleanedUpdates);
  }

  async deleteHabit(habitId: string): Promise<void> {
    const habitRef = doc(db, this.habitsCollection, habitId);
    await deleteDoc(habitRef);
  }

  async getHabitsByUserId(userId: string): Promise<Habit[]> {
    const q = query(
      collection(db, this.habitsCollection),
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
    } as Habit));
  }

  async getHabitById(habitId: string): Promise<Habit | null> {
    const habitRef = doc(db, this.habitsCollection, habitId);
    const docSnap = await getDoc(habitRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate()
      } as Habit;
    }

    return null;
  }

  async recordHabitProgress(progress: Omit<HabitProgress, 'id'>): Promise<string> {
    const progressData = {
      ...progress,
      date: Timestamp.fromDate(progress.date)
    };

    const docRef = await addDoc(collection(db, this.progressCollection), progressData);
    return docRef.id;
  }

  async getHabitProgress(habitId: string, startDate: Date, endDate: Date): Promise<HabitProgress[]> {
    const q = query(
      collection(db, this.progressCollection),
      where('habitId', '==', habitId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    } as HabitProgress));
  }

  async getTodayProgress(habitId: string, date: Date): Promise<HabitProgress | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, this.progressCollection),
      where('habitId', '==', habitId),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      } as HabitProgress;
    }

    return null;
  }
}