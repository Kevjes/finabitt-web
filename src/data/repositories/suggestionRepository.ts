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
  limit
} from 'firebase/firestore';
import { db } from '@/src/infrastructure/firebase/config';
import { Suggestion, Notification } from '@/src/shared/types';

export class SuggestionRepository {
  private readonly suggestionsCollection = 'suggestions';
  private readonly notificationsCollection = 'notifications';

  private cleanSuggestionData(data: Partial<Suggestion>): any {
    const cleaned: any = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          cleaned[key] = value;
        } else if (typeof value === 'object' && value !== null) {
          cleaned[key] = value;
        } else {
          cleaned[key] = value;
        }
      }
    });

    return cleaned;
  }

  async createSuggestion(suggestionData: Omit<Suggestion, 'id' | 'createdAt'>): Promise<string> {
    try {
      const cleanedData = this.cleanSuggestionData({
        ...suggestionData,
        createdAt: new Date()
      });

      const docRef = await addDoc(collection(db, this.suggestionsCollection), {
        ...cleanedData,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating suggestion:', error);
      throw error;
    }
  }

  async updateSuggestion(id: string, updates: Partial<Suggestion>): Promise<void> {
    try {
      const cleanedUpdates = this.cleanSuggestionData(updates);

      const docRef = doc(db, this.suggestionsCollection, id);
      await updateDoc(docRef, cleanedUpdates);
    } catch (error) {
      console.error('Error updating suggestion:', error);
      throw error;
    }
  }

  async deleteSuggestion(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.suggestionsCollection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      throw error;
    }
  }

  async getSuggestionsByUserId(userId: string, status?: 'pending' | 'accepted' | 'rejected' | 'expired'): Promise<Suggestion[]> {
    try {
      let q = query(
        collection(db, this.suggestionsCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(
          collection(db, this.suggestionsCollection),
          where('userId', '==', userId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate()
      })) as Suggestion[];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }

  async getPendingSuggestions(userId: string): Promise<Suggestion[]> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.suggestionsCollection),
        where('userId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const suggestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate()
      })) as Suggestion[];

      // Filtrer les suggestions expirées et les marquer comme expirées
      const validSuggestions: Suggestion[] = [];
      const batch = writeBatch(db);

      for (const suggestion of suggestions) {
        if (suggestion.expiresAt && suggestion.expiresAt < now) {
          // Marquer comme expirée
          const docRef = doc(db, this.suggestionsCollection, suggestion.id);
          batch.update(docRef, { status: 'expired' });
        } else {
          validSuggestions.push(suggestion);
        }
      }

      // Commit le batch seulement s'il y a des mutations
      try {
        await batch.commit();
      } catch (error: any) {
        // Ignorer l'erreur si le batch est vide
        if (!error?.message?.includes('cannot be empty')) {
          throw error;
        }
      }

      return validSuggestions;
    } catch (error) {
      console.error('Error getting pending suggestions:', error);
      throw error;
    }
  }

  async acceptSuggestion(suggestionId: string): Promise<void> {
    try {
      await this.updateSuggestion(suggestionId, { status: 'accepted' });
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      throw error;
    }
  }

  async rejectSuggestion(suggestionId: string): Promise<void> {
    try {
      await this.updateSuggestion(suggestionId, { status: 'rejected' });
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      throw error;
    }
  }

  async createNotification(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const cleanedData = {
        ...notificationData,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, this.notificationsCollection), {
        ...cleanedData,
        createdAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotificationsByUserId(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      let q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (unreadOnly) {
        q = query(
          collection(db, this.notificationsCollection),
          where('userId', '==', userId),
          where('isRead', '==', false),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Notification[];
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, this.notificationsCollection, notificationId);
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
      });

      if (querySnapshot.docs.length > 0) {
        await batch.commit();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async getSuggestionsByType(userId: string, type: Suggestion['type']): Promise<Suggestion[]> {
    try {
      const q = query(
        collection(db, this.suggestionsCollection),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        expiresAt: doc.data().expiresAt?.toDate()
      })) as Suggestion[];
    } catch (error) {
      console.error('Error getting suggestions by type:', error);
      throw error;
    }
  }

  async cleanupExpiredSuggestions(): Promise<number> {
    try {
      const now = new Date();
      const q = query(
        collection(db, this.suggestionsCollection),
        where('expiresAt', '<=', now),
        where('status', '==', 'pending')
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'expired' });
      });

      if (querySnapshot.docs.length > 0) {
        await batch.commit();
      }

      return querySnapshot.docs.length;
    } catch (error) {
      console.error('Error cleaning up expired suggestions:', error);
      throw error;
    }
  }
}

export const suggestionRepository = new SuggestionRepository();