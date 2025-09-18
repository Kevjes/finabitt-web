'use client';

import { useState, useEffect, useCallback } from 'react';
import { Suggestion, Notification } from '@/src/shared/types';
import { suggestionRepository } from '@/src/data/repositories/suggestionRepository';
import { useAuth } from './useAuth';

export const useSuggestions = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const userSuggestions = await suggestionRepository.getSuggestionsByUserId(user.id);
      setSuggestions(userSuggestions);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setError('Erreur lors du chargement des suggestions');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const userNotifications = await suggestionRepository.getNotificationsByUserId(user.id);
      setNotifications(userNotifications);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadSuggestions();
      loadNotifications();
    }
  }, [user?.id, loadSuggestions, loadNotifications]);

  const createSuggestion = async (suggestionData: Omit<Suggestion, 'id' | 'createdAt'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);

      const newSuggestionData = {
        ...suggestionData,
        userId: user.id
      };

      const suggestionId = await suggestionRepository.createSuggestion(newSuggestionData);

      // Recharger les suggestions
      await loadSuggestions();

      return suggestionId;
    } catch (err) {
      console.error('Error creating suggestion:', err);
      setError('Erreur lors de la création de la suggestion');
      throw err;
    }
  };

  const acceptSuggestion = async (suggestionId: string) => {
    try {
      setError(null);
      await suggestionRepository.acceptSuggestion(suggestionId);

      // Mettre à jour localement
      setSuggestions(prevSuggestions =>
        prevSuggestions.map(suggestion =>
          suggestion.id === suggestionId ? { ...suggestion, status: 'accepted' } : suggestion
        )
      );
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      setError('Erreur lors de l\'acceptation de la suggestion');
      throw err;
    }
  };

  const rejectSuggestion = async (suggestionId: string) => {
    try {
      setError(null);
      await suggestionRepository.rejectSuggestion(suggestionId);

      // Mettre à jour localement
      setSuggestions(prevSuggestions =>
        prevSuggestions.map(suggestion =>
          suggestion.id === suggestionId ? { ...suggestion, status: 'rejected' } : suggestion
        )
      );
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
      setError('Erreur lors du rejet de la suggestion');
      throw err;
    }
  };

  const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);

      const newNotificationData = {
        ...notificationData,
        userId: user.id
      };

      const notificationId = await suggestionRepository.createNotification(newNotificationData);

      // Recharger les notifications
      await loadNotifications();

      return notificationId;
    } catch (err) {
      console.error('Error creating notification:', err);
      setError('Erreur lors de la création de la notification');
      throw err;
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      setError(null);
      await suggestionRepository.markNotificationAsRead(notificationId);

      // Mettre à jour localement
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Erreur lors du marquage de la notification');
      throw err;
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      await suggestionRepository.markAllNotificationsAsRead(user.id);

      // Mettre à jour localement
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Erreur lors du marquage des notifications');
      throw err;
    }
  };

  const getPendingSuggestions = () => {
    return suggestions.filter(s => s.status === 'pending');
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.isRead);
  };

  const getSuggestionsByType = (type: Suggestion['type']) => {
    return suggestions.filter(s => s.type === type);
  };

  const getSuggestionsCount = () => {
    return {
      total: suggestions.length,
      pending: suggestions.filter(s => s.status === 'pending').length,
      accepted: suggestions.filter(s => s.status === 'accepted').length,
      rejected: suggestions.filter(s => s.status === 'rejected').length,
      expired: suggestions.filter(s => s.status === 'expired').length
    };
  };

  const getNotificationsCount = () => {
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      byType: {
        suggestion: notifications.filter(n => n.type === 'suggestion').length,
        alert: notifications.filter(n => n.type === 'alert').length,
        reminder: notifications.filter(n => n.type === 'reminder').length,
        achievement: notifications.filter(n => n.type === 'achievement').length,
        budget_warning: notifications.filter(n => n.type === 'budget_warning').length
      }
    };
  };

  const cleanupExpiredSuggestions = async () => {
    try {
      setError(null);
      const count = await suggestionRepository.cleanupExpiredSuggestions();

      if (count > 0) {
        // Recharger les suggestions après le nettoyage
        await loadSuggestions();
      }

      return count;
    } catch (err) {
      console.error('Error cleaning up expired suggestions:', err);
      setError('Erreur lors du nettoyage des suggestions expirées');
      throw err;
    }
  };

  return {
    suggestions,
    notifications,
    loading,
    error,
    createSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    createNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getPendingSuggestions,
    getUnreadNotifications,
    getSuggestionsByType,
    getSuggestionsCount,
    getNotificationsCount,
    cleanupExpiredSuggestions,
    refreshSuggestions: loadSuggestions,
    refreshNotifications: loadNotifications
  };
};