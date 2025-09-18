'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { HabitRepository } from '@/src/data/repositories/habitRepository';
import { TaskRepository } from '@/src/data/repositories/taskRepository';
import { Habit, HabitProgress, Task } from '@/src/shared/types';

const habitRepository = new HabitRepository();
const taskRepository = new TaskRepository();

export const useHabits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHabits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userHabits = await habitRepository.getHabitsByUserId(user.id);
      setHabits(userHabits);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des habitudes');
      console.error('Error loading habits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, [user]);

  const createHabit = async (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const newHabit: Omit<Habit, 'id'> = {
      ...habitData,
      userId: user.id,
      createdAt: now,
      updatedAt: now
    };

    try {
      const habitId = await habitRepository.createHabit(newHabit);
      console.log('Habit created with ID:', habitId);

      // Mise à jour optimiste de l'état local
      const createdHabit: Habit = {
        id: habitId,
        ...newHabit
      };

      setHabits(prevHabits => [createdHabit, ...prevHabits]);

      // Recharger depuis Firebase pour s'assurer de la cohérence
      setTimeout(async () => {
        await loadHabits();
      }, 1000);

      return true;
    } catch (err) {
      setError('Erreur lors de la création de l\'habitude');
      console.error('Error creating habit:', err);
      return false;
    }
  };

  const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
    try {
      await habitRepository.updateHabit(habitId, updates);

      // Mise à jour optimiste de l'état local
      setHabits(prevHabits =>
        prevHabits.map(habit =>
          habit.id === habitId
            ? { ...habit, ...updates, updatedAt: new Date() }
            : habit
        )
      );

      return true;
    } catch (err) {
      setError('Erreur lors de la mise à jour de l\'habitude');
      console.error('Error updating habit:', err);
      // Recharger en cas d'erreur pour revenir à l'état cohérent
      await loadHabits();
      return false;
    }
  };

  const deleteHabit = async (habitId: string) => {
    try {
      await habitRepository.deleteHabit(habitId);

      // Mise à jour optimiste de l'état local
      setHabits(prevHabits => prevHabits.filter(habit => habit.id !== habitId));

      return true;
    } catch (err) {
      setError('Erreur lors de la suppression de l\'habitude');
      console.error('Error deleting habit:', err);
      // Recharger en cas d'erreur pour revenir à l'état cohérent
      await loadHabits();
      return false;
    }
  };

  const toggleHabitCompletion = async (habitId: string, date: Date = new Date()) => {
    try {
      const existingProgress = await habitRepository.getTodayProgress(habitId, date);

      if (existingProgress) {
        // Update existing progress
        await habitRepository.recordHabitProgress({
          habitId,
          date,
          completed: !existingProgress.completed,
          notes: existingProgress.notes
        });
      } else {
        // Create new progress entry
        await habitRepository.recordHabitProgress({
          habitId,
          date,
          completed: true
        });
      }

      return true;
    } catch (err) {
      setError('Erreur lors de l\'enregistrement du progrès');
      console.error('Error toggling habit completion:', err);
      return false;
    }
  };

  const getHabitProgress = async (habitId: string, startDate: Date, endDate: Date): Promise<HabitProgress[]> => {
    try {
      return await habitRepository.getHabitProgress(habitId, startDate, endDate);
    } catch (err) {
      console.error('Error fetching habit progress:', err);
      return [];
    }
  };

  const getTodayProgress = async (habitId: string, date: Date = new Date()): Promise<HabitProgress | null> => {
    try {
      return await habitRepository.getTodayProgress(habitId, date);
    } catch (err) {
      console.error('Error fetching today progress:', err);
      return null;
    }
  };

  const createTaskFromHabit = async (habitId: string, title: string, description?: string) => {
    if (!user) throw new Error('User not authenticated');

    const habit = habits.find(h => h.id === habitId);
    if (!habit) throw new Error('Habit not found');

    const now = new Date();
    const newTask: Omit<Task, 'id'> = {
      userId: user.id,
      title,
      description,
      status: 'todo',
      priority: 'medium',
      habitId,
      isRecurring: habit.frequency !== 'custom',
      createdAt: now,
      updatedAt: now
    };

    try {
      const taskId = await taskRepository.createTask(newTask);
      console.log('Task created from habit with ID:', taskId);
      return taskId;
    } catch (err) {
      console.error('Error creating task from habit:', err);
      throw err;
    }
  };

  const getHabitTasks = async (habitId: string): Promise<Task[]> => {
    try {
      if (!user) return [];

      const allTasks = await taskRepository.getTasksByUserId(user.id);
      return allTasks.filter(task => task.habitId === habitId);
    } catch (err) {
      console.error('Error fetching habit tasks:', err);
      return [];
    }
  };

  return {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    getHabitProgress,
    getTodayProgress,
    createTaskFromHabit,
    getHabitTasks,
    refetch: loadHabits
  };
};