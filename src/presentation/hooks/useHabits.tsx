'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { HabitRepository } from '@/src/data/repositories/habitRepository';
import { TaskRepository } from '@/src/data/repositories/taskRepository';
import { Habit, HabitProgress, Task, RecurringPattern } from '@/src/shared/types';

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

  // 🔥 FONCTION DE SYNCHRONISATION INTER-MODULES
  const createRecurringTaskForHabit = async (habitId: string, habit: Omit<Habit, 'id'>) => {
    try {
      // Convertir la fréquence de l'habitude en pattern de récurrence pour la tâche
      const getRecurringPattern = (): RecurringPattern => {
        switch (habit.frequency) {
          case 'daily':
            return { type: 'daily' as const, interval: 1 };
          case 'weekly':
            return { type: 'weekly' as const, interval: 1, daysOfWeek: [new Date().getDay()] };
          case 'custom':
            if (habit.customDays) {
              const daysOfWeek = habit.customDays.map(day => {
                const dayMap: { [key: string]: number } = {
                  'lundi': 1, 'mardi': 2, 'mercredi': 3, 'jeudi': 4, 'vendredi': 5, 'samedi': 6, 'dimanche': 0
                };
                return dayMap[day.toLowerCase()] || 0;
              });
              return { type: 'weekly' as const, interval: 1, daysOfWeek };
            }
            return { type: 'daily' as const, interval: 1 };
          default:
            return { type: 'daily' as const, interval: 1 };
        }
      };

      const taskData = {
        title: `${habit.type === 'good' ? '✅' : '❌'} ${habit.name}`,
        description: `Tâche automatique pour l'habitude: ${habit.description || habit.name}`,
        status: 'todo' as const,
        priority: 'medium' as const,
        category: 'Habitudes',
        habitId: habitId, // 🔗 LIAISON CRITIQUE
        isRecurring: true,
        recurringPattern: getRecurringPattern(),
        hasFinancialImpact: habit.hasFinancialImpact,
        estimatedCost: habit.estimatedCostPerOccurrence,
        userId: habit.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const taskId = await taskRepository.createTask(taskData);
      console.log(`✅ Tâche récurrente créée pour l'habitude ${habit.name}: ${taskId}`);

      return taskId;
    } catch (error) {
      console.error('Erreur lors de la création de la tâche récurrente:', error);
      // Ne pas faire échouer la création de l'habitude si la tâche échoue
    }
  };

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

      // 🔥 SYNCHRONISATION AUTOMATIQUE : Créer une tâche récurrente pour cette habitude
      await createRecurringTaskForHabit(habitId, newHabit);

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
      const habit = habits.find(h => h.id === habitId);

      if (existingProgress) {
        // Update existing progress
        const newCompletedStatus = !existingProgress.completed;

        await habitRepository.recordHabitProgress({
          habitId,
          date,
          completed: newCompletedStatus,
          notes: existingProgress.notes
        });

        // 🔥 SYNCHRONISATION AUTOMATIQUE : Mauvaise habitude évitée → Suggestion d'épargne
        if (habit && habit.type === 'bad' && !newCompletedStatus) {
          // L'utilisateur a évité la mauvaise habitude (pas complétée)
          await createSavingsSuggestionFromAvoidedHabit(habitId, 1);
        }

      } else {
        // Create new progress entry
        await habitRepository.recordHabitProgress({
          habitId,
          date,
          completed: true
        });

        // 🔥 SYNCHRONISATION AUTOMATIQUE : Mauvaise habitude évitée → Suggestion d'épargne
        if (habit && habit.type === 'bad') {
          // Pour une nouvelle entrée d'une mauvaise habitude marquée comme "évitée"
          await createSavingsSuggestionFromAvoidedHabit(habitId, 1);
        }
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

  // 🔥 SYNCHRONISATION AUTOMATIQUE : Mauvaise habitude évitée → Suggestion d'épargne
  const createSavingsSuggestionFromAvoidedHabit = async (habitId: string, daysAvoided: number = 1) => {
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit || habit.type !== 'bad' || !habit.hasFinancialImpact || !habit.estimatedCostPerOccurrence) {
        return null;
      }

      const potentialSavings = habit.estimatedCostPerOccurrence * daysAvoided;

      // Créer une suggestion de transaction d'épargne
      const savingsSuggestion = {
        userId: user!.id,
        type: 'habit_reward' as const,
        title: `Épargne recommandée: ${daysAvoided} jour${daysAvoided > 1 ? 's' : ''} sans "${habit.name}"`,
        description: `Économies générées en évitant cette mauvaise habitude. Montant basé sur ${habit.estimatedCostPerOccurrence} FCFA par occurrence évitée.`,
        data: {
          habitId: habitId,
          habitName: habit.name,
          daysAvoided: daysAvoided,
          costPerOccurrence: habit.estimatedCostPerOccurrence,
          suggestedAction: 'transfer_to_savings',
          amount: potentialSavings
        },
        priority: potentialSavings > 5000 ? 'high' as const : potentialSavings > 1000 ? 'medium' as const : 'low' as const,
        status: 'pending' as const,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire dans 7 jours
      };

      // Créer la suggestion via le repository des suggestions
      const { suggestionRepository } = await import('@/src/data/repositories/suggestionRepository');
      const suggestionId = await suggestionRepository.createSuggestion(savingsSuggestion);

      console.log(`💡 Suggestion d'épargne créée: ${potentialSavings} FCFA pour l'habitude évitée "${habit.name}"`);

      return {
        suggestionId,
        amount: potentialSavings,
        habit: habit.name,
        daysAvoided
      };

    } catch (error) {
      console.error('Erreur lors de la création de la suggestion d\'épargne:', error);
      return null;
    }
  };

  const calculateMonthlySavingsFromBadHabits = () => {
    const badHabits = habits.filter(h => h.type === 'bad' && h.hasFinancialImpact);

    return badHabits.reduce((total, habit) => {
      if (!habit.estimatedCostPerOccurrence) return total;

      let monthlyOccurrences = 0;
      switch (habit.frequency) {
        case 'daily':
          monthlyOccurrences = 30;
          break;
        case 'weekly':
          monthlyOccurrences = 4;
          break;
        case 'custom':
          monthlyOccurrences = habit.customDays ? habit.customDays.length * 4 : 0;
          break;
      }

      return total + (habit.estimatedCostPerOccurrence * monthlyOccurrences);
    }, 0);
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
    createSavingsSuggestionFromAvoidedHabit,
    calculateMonthlySavingsFromBadHabits,
    refetch: loadHabits
  };
};