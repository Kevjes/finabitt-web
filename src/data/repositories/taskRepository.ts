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
import { Task, TaskCategory, TaskTimeEntry } from '@/src/shared/types';

export class TaskRepository {
  private tasksCollection = 'tasks';
  private categoriesCollection = 'taskCategories';
  private commentsCollection = 'taskComments';
  private timeEntriesCollection = 'taskTimeEntries';

  async createTask(task: Omit<Task, 'id'>): Promise<string> {
    const cleanedTask = this.cleanTaskData({
      ...task,
      createdAt: Timestamp.fromDate(task.createdAt),
      updatedAt: Timestamp.fromDate(task.updatedAt),
      dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : undefined,
      completedAt: task.completedAt ? Timestamp.fromDate(task.completedAt) : undefined
    });

    const docRef = await addDoc(collection(db, this.tasksCollection), cleanedTask);
    return docRef.id;
  }

  private cleanTaskData(task: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};

    Object.keys(task).forEach(key => {
      const value = task[key];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && value.length === 0) {
          if (['tags'].includes(key)) {
            return;
          }
        }
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    const taskRef = doc(db, this.tasksCollection, taskId);
    const cleanedUpdates = this.cleanTaskData({
      ...updates,
      updatedAt: Timestamp.now(),
      dueDate: updates.dueDate ? Timestamp.fromDate(updates.dueDate) : undefined,
      completedAt: updates.completedAt ? Timestamp.fromDate(updates.completedAt) : undefined
    });
    await updateDoc(taskRef, cleanedUpdates);
  }

  async deleteTask(taskId: string): Promise<void> {
    const taskRef = doc(db, this.tasksCollection, taskId);
    await deleteDoc(taskRef);
  }

  async getTasksByUserId(userId: string): Promise<Task[]> {
    const q = query(
      collection(db, this.tasksCollection),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate ? doc.data().dueDate.toDate() : undefined,
      completedAt: doc.data().completedAt ? doc.data().completedAt.toDate() : undefined
    } as Task));
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    const taskRef = doc(db, this.tasksCollection, taskId);
    const docSnap = await getDoc(taskRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate(),
        dueDate: docSnap.data().dueDate ? docSnap.data().dueDate.toDate() : undefined,
        completedAt: docSnap.data().completedAt ? docSnap.data().completedAt.toDate() : undefined
      } as Task;
    }

    return null;
  }

  async getTasksByStatus(userId: string, status: Task['status']): Promise<Task[]> {
    const q = query(
      collection(db, this.tasksCollection),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate ? doc.data().dueDate.toDate() : undefined,
      completedAt: doc.data().completedAt ? doc.data().completedAt.toDate() : undefined
    } as Task));
  }

  async getTasksByCategory(userId: string, category: string): Promise<Task[]> {
    const q = query(
      collection(db, this.tasksCollection),
      where('userId', '==', userId),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate ? doc.data().dueDate.toDate() : undefined,
      completedAt: doc.data().completedAt ? doc.data().completedAt.toDate() : undefined
    } as Task));
  }

  async getSubtasks(parentTaskId: string): Promise<Task[]> {
    const q = query(
      collection(db, this.tasksCollection),
      where('parentTaskId', '==', parentTaskId),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      dueDate: doc.data().dueDate ? doc.data().dueDate.toDate() : undefined,
      completedAt: doc.data().completedAt ? doc.data().completedAt.toDate() : undefined
    } as Task));
  }

  // Category management
  async createCategory(category: Omit<TaskCategory, 'id'>): Promise<string> {
    const categoryData = this.cleanCategoryData({
      ...category,
      createdAt: Timestamp.fromDate(category.createdAt)
    });

    const docRef = await addDoc(collection(db, this.categoriesCollection), categoryData);
    return docRef.id;
  }

  private cleanCategoryData(category: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};

    Object.keys(category).forEach(key => {
      const value = category[key];
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  async getCategoriesByUserId(userId: string): Promise<TaskCategory[]> {
    const q = query(
      collection(db, this.categoriesCollection),
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    } as TaskCategory));
  }

  // Time tracking
  async startTimeEntry(timeEntry: Omit<TaskTimeEntry, 'id' | 'endTime' | 'duration'>): Promise<string> {
    const entryData = {
      ...timeEntry,
      startTime: Timestamp.fromDate(timeEntry.startTime),
      createdAt: Timestamp.fromDate(timeEntry.createdAt),
      duration: 0
    };

    const docRef = await addDoc(collection(db, this.timeEntriesCollection), entryData);
    return docRef.id;
  }

  async stopTimeEntry(entryId: string, endTime: Date, duration: number): Promise<void> {
    const entryRef = doc(db, this.timeEntriesCollection, entryId);
    await updateDoc(entryRef, {
      endTime: Timestamp.fromDate(endTime),
      duration
    });
  }

  async getTimeEntriesByTask(taskId: string): Promise<TaskTimeEntry[]> {
    const q = query(
      collection(db, this.timeEntriesCollection),
      where('taskId', '==', taskId),
      orderBy('startTime', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime.toDate(),
      endTime: doc.data().endTime ? doc.data().endTime.toDate() : undefined,
      createdAt: doc.data().createdAt.toDate()
    } as TaskTimeEntry));
  }
}