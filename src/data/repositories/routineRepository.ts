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
  getDoc
} from 'firebase/firestore';
import { db } from '@/src/infrastructure/firebase/config';
import { Routine } from '@/src/shared/types';

export class RoutineRepository {
  private readonly collection = 'routines';

  private cleanRoutineData(data: Partial<Routine>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          cleaned[key] = value;
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            cleaned[key] = value;
          }
        } else if (typeof value === 'object' && value !== null) {
          const cleanedObject = this.cleanRoutineData(value);
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

  async createRoutine(routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const cleanedData = this.cleanRoutineData({
        ...routineData,
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
      console.error('Error creating routine:', error);
      throw error;
    }
  }

  async updateRoutine(id: string, updates: Partial<Routine>): Promise<void> {
    try {
      const cleanedUpdates = this.cleanRoutineData({
        ...updates,
        updatedAt: new Date()
      });

      const docRef = doc(db, this.collection, id);
      await updateDoc(docRef, {
        ...cleanedUpdates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating routine:', error);
      throw error;
    }
  }

  async deleteRoutine(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting routine:', error);
      throw error;
    }
  }

  async getRoutinesByUserId(userId: string): Promise<Routine[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        where('isActive', '==', true),
        orderBy('type', 'asc'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Routine[];
    } catch (error) {
      console.error('Error getting routines:', error);
      throw error;
    }
  }

  async getRoutinesByType(userId: string, type: 'morning' | 'evening' | 'custom'): Promise<Routine[]> {
    try {
      const q = query(
        collection(db, this.collection),
        where('userId', '==', userId),
        where('type', '==', type),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Routine[];
    } catch (error) {
      console.error('Error getting routines by type:', error);
      throw error;
    }
  }

  async getRoutine(id: string): Promise<Routine | null> {
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
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Routine;
    } catch (error) {
      console.error('Error getting routine:', error);
      throw error;
    }
  }

  async updateRoutineHabits(routineId: string, habitIds: string[]): Promise<void> {
    try {
      await this.updateRoutine(routineId, { habitIds });
    } catch (error) {
      console.error('Error updating routine habits:', error);
      throw error;
    }
  }

  async addHabitToRoutine(routineId: string, habitId: string): Promise<void> {
    try {
      const routine = await this.getRoutine(routineId);
      if (!routine) {
        throw new Error('Routine not found');
      }

      const updatedHabitIds = [...routine.habitIds];
      if (!updatedHabitIds.includes(habitId)) {
        updatedHabitIds.push(habitId);
        await this.updateRoutineHabits(routineId, updatedHabitIds);
      }
    } catch (error) {
      console.error('Error adding habit to routine:', error);
      throw error;
    }
  }

  async removeHabitFromRoutine(routineId: string, habitId: string): Promise<void> {
    try {
      const routine = await this.getRoutine(routineId);
      if (!routine) {
        throw new Error('Routine not found');
      }

      const updatedHabitIds = routine.habitIds.filter(id => id !== habitId);
      await this.updateRoutineHabits(routineId, updatedHabitIds);
    } catch (error) {
      console.error('Error removing habit from routine:', error);
      throw error;
    }
  }

  async reorderRoutineHabits(routineId: string, habitIds: string[]): Promise<void> {
    try {
      await this.updateRoutineHabits(routineId, habitIds);
    } catch (error) {
      console.error('Error reordering routine habits:', error);
      throw error;
    }
  }

  async toggleRoutineStatus(routineId: string): Promise<void> {
    try {
      const routine = await this.getRoutine(routineId);
      if (!routine) {
        throw new Error('Routine not found');
      }

      await this.updateRoutine(routineId, { isActive: !routine.isActive });
    } catch (error) {
      console.error('Error toggling routine status:', error);
      throw error;
    }
  }

  async updateEstimatedDuration(routineId: string, duration: number): Promise<void> {
    try {
      await this.updateRoutine(routineId, { estimatedDuration: duration });
    } catch (error) {
      console.error('Error updating routine duration:', error);
      throw error;
    }
  }
}

export const routineRepository = new RoutineRepository();