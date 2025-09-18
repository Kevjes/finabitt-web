'use client';

import { useState, useEffect, useCallback } from 'react';
import { Routine } from '@/src/shared/types';
import { routineRepository } from '@/src/data/repositories/routineRepository';
import { useAuth } from './useAuth';

export const useRoutines = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoutines = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const userRoutines = await routineRepository.getRoutinesByUserId(user.id);
      setRoutines(userRoutines);
    } catch (err) {
      console.error('Error loading routines:', err);
      setError('Erreur lors du chargement des routines');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  const createRoutine = async (routineData: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      setError(null);

      const newRoutineData = {
        ...routineData,
        userId: user.id
      };

      const routineId = await routineRepository.createRoutine(newRoutineData);

      // Recharger les routines
      await loadRoutines();

      return routineId;
    } catch (err) {
      console.error('Error creating routine:', err);
      setError('Erreur lors de la création de la routine');
      throw err;
    }
  };

  const updateRoutine = async (id: string, updates: Partial<Routine>) => {
    try {
      setError(null);
      await routineRepository.updateRoutine(id, updates);

      // Mettre à jour localement
      setRoutines(prevRoutines =>
        prevRoutines.map(routine =>
          routine.id === id ? { ...routine, ...updates, updatedAt: new Date() } : routine
        )
      );
    } catch (err) {
      console.error('Error updating routine:', err);
      setError('Erreur lors de la mise à jour de la routine');
      throw err;
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      setError(null);
      await routineRepository.deleteRoutine(id);

      // Supprimer localement
      setRoutines(prevRoutines => prevRoutines.filter(routine => routine.id !== id));
    } catch (err) {
      console.error('Error deleting routine:', err);
      setError('Erreur lors de la suppression de la routine');
      throw err;
    }
  };

  const toggleRoutineStatus = async (id: string) => {
    const routine = routines.find(r => r.id === id);
    if (!routine) return;

    await updateRoutine(id, { isActive: !routine.isActive });
  };

  const addHabitToRoutine = async (routineId: string, habitId: string) => {
    try {
      setError(null);
      await routineRepository.addHabitToRoutine(routineId, habitId);

      // Mettre à jour localement
      setRoutines(prevRoutines =>
        prevRoutines.map(routine =>
          routine.id === routineId
            ? {
                ...routine,
                habitIds: [...routine.habitIds, habitId],
                updatedAt: new Date()
              }
            : routine
        )
      );
    } catch (err) {
      console.error('Error adding habit to routine:', err);
      setError('Erreur lors de l\'ajout de l\'habitude à la routine');
      throw err;
    }
  };

  const removeHabitFromRoutine = async (routineId: string, habitId: string) => {
    try {
      setError(null);
      await routineRepository.removeHabitFromRoutine(routineId, habitId);

      // Mettre à jour localement
      setRoutines(prevRoutines =>
        prevRoutines.map(routine =>
          routine.id === routineId
            ? {
                ...routine,
                habitIds: routine.habitIds.filter(id => id !== habitId),
                updatedAt: new Date()
              }
            : routine
        )
      );
    } catch (err) {
      console.error('Error removing habit from routine:', err);
      setError('Erreur lors de la suppression de l\'habitude de la routine');
      throw err;
    }
  };

  const reorderRoutineHabits = async (routineId: string, habitIds: string[]) => {
    try {
      setError(null);
      await routineRepository.reorderRoutineHabits(routineId, habitIds);

      // Mettre à jour localement
      setRoutines(prevRoutines =>
        prevRoutines.map(routine =>
          routine.id === routineId
            ? {
                ...routine,
                habitIds: habitIds,
                updatedAt: new Date()
              }
            : routine
        )
      );
    } catch (err) {
      console.error('Error reordering routine habits:', err);
      setError('Erreur lors de la réorganisation des habitudes');
      throw err;
    }
  };

  const updateEstimatedDuration = async (routineId: string, duration: number) => {
    try {
      setError(null);
      await routineRepository.updateEstimatedDuration(routineId, duration);

      // Mettre à jour localement
      setRoutines(prevRoutines =>
        prevRoutines.map(routine =>
          routine.id === routineId
            ? {
                ...routine,
                estimatedDuration: duration,
                updatedAt: new Date()
              }
            : routine
        )
      );
    } catch (err) {
      console.error('Error updating routine duration:', err);
      setError('Erreur lors de la mise à jour de la durée');
      throw err;
    }
  };

  const getRoutinesByType = (type: 'morning' | 'evening' | 'custom') => {
    return routines.filter(routine => routine.type === type && routine.isActive);
  };

  const getActiveRoutines = () => {
    return routines.filter(routine => routine.isActive);
  };

  const getMorningRoutines = () => {
    return getRoutinesByType('morning');
  };

  const getEveningRoutines = () => {
    return getRoutinesByType('evening');
  };

  const getCustomRoutines = () => {
    return getRoutinesByType('custom');
  };

  const getRoutineProgress = (routineId: string, habitProgressData: any[]) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayProgress = habitProgressData.filter(p => {
      const progressDate = new Date(p.date);
      progressDate.setHours(0, 0, 0, 0);
      return progressDate.getTime() === today.getTime() &&
             routine.habitIds.includes(p.habitId);
    });

    const completedCount = todayProgress.filter(p => p.completed).length;
    const totalCount = routine.habitIds.length;

    return {
      completed: completedCount,
      total: totalCount,
      percentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      isComplete: completedCount === totalCount && totalCount > 0
    };
  };

  const calculateTotalEstimatedTime = () => {
    return routines
      .filter(routine => routine.isActive)
      .reduce((total, routine) => total + routine.estimatedDuration, 0);
  };

  return {
    routines,
    loading,
    error,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    toggleRoutineStatus,
    addHabitToRoutine,
    removeHabitFromRoutine,
    reorderRoutineHabits,
    updateEstimatedDuration,
    getRoutinesByType,
    getActiveRoutines,
    getMorningRoutines,
    getEveningRoutines,
    getCustomRoutines,
    getRoutineProgress,
    calculateTotalEstimatedTime,
    refreshRoutines: loadRoutines
  };
};