'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { TaskRepository } from '@/src/data/repositories/taskRepository';
import { FinanceRepository } from '@/src/data/repositories/financeRepository';
import { Task, TaskCategory, TaskTimeEntry, StatusHistoryEntry } from '@/src/shared/types';

const taskRepository = new TaskRepository();
const financeRepository = new FinanceRepository();

export const useTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userTasks = await taskRepository.getTasksByUserId(user.id);
      setTasks(userTasks);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des tâches');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!user) return;

    try {
      const userCategories = await taskRepository.getCategoriesByUserId(user.id);
      setCategories(userCategories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    loadTasks();
    loadCategories();
  }, [user]);

  const createTask = async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const now = new Date();

    // Initialiser le tracking des statuts
    const initialStatusHistory: StatusHistoryEntry[] = [{
      status: taskData.status || 'todo',
      timestamp: now,
      durationInPreviousStatus: 0
    }];

    const newTask: Omit<Task, 'id'> = {
      ...taskData,
      userId: user.id,
      statusHistory: initialStatusHistory,
      timeInTodo: 0,
      timeInProgress: 0,
      createdAt: now,
      updatedAt: now
    };

    try {
      const taskId = await taskRepository.createTask(newTask);
      console.log('Task created with ID:', taskId);

      const createdTask: Task = {
        id: taskId,
        ...newTask
      };

      setTasks(prevTasks => [createdTask, ...prevTasks]);

      return true;
    } catch (err) {
      setError('Erreur lors de la création de la tâche');
      console.error('Error creating task:', err);
      return false;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskRepository.updateTask(taskId, updates);

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        )
      );

      // Pour les changements de statut, on veut être sûr que l'UI se met à jour immédiatement
      if (updates.status || updates.completedAt) {
        // Force un re-render immédiat
        await loadTasks();
      }

      return true;
    } catch (err) {
      setError('Erreur lors de la mise à jour de la tâche');
      console.error('Error updating task:', err);
      await loadTasks();
      return false;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskRepository.deleteTask(taskId);

      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

      return true;
    } catch (err) {
      setError('Erreur lors de la suppression de la tâche');
      console.error('Error deleting task:', err);
      await loadTasks();
      return false;
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    // Trouver la tâche actuelle pour calculer les durées
    const currentTask = tasks.find(task => task.id === taskId);
    if (!currentTask) {
      throw new Error('Task not found');
    }

    const now = new Date();
    const currentStatus = currentTask.status;

    // Calculer la durée dans le statut actuel
    const lastStatusChange = currentTask.statusHistory?.length
      ? currentTask.statusHistory[currentTask.statusHistory.length - 1].timestamp
      : currentTask.createdAt;

    const durationInCurrentStatus = Math.floor((now.getTime() - lastStatusChange.getTime()) / (1000 * 60)); // en minutes

    // Créer la nouvelle entrée d'historique
    const newHistoryEntry: StatusHistoryEntry = {
      status,
      timestamp: now,
      durationInPreviousStatus: durationInCurrentStatus
    };

    // Mettre à jour l'historique des statuts
    const updatedStatusHistory = [...(currentTask.statusHistory || []), newHistoryEntry];

    // Calculer les temps cumulés dans chaque statut
    let timeInTodo = currentTask.timeInTodo || 0;
    let timeInProgress = currentTask.timeInProgress || 0;

    // Ajouter la durée du statut actuel aux compteurs appropriés
    switch (currentStatus) {
      case 'todo':
        timeInTodo += durationInCurrentStatus;
        break;
      case 'in_progress':
        timeInProgress += durationInCurrentStatus;
        break;
    }

    // Calculer le temps total de création à completion si la tâche est terminée
    const timeToComplete = status === 'completed'
      ? Math.floor((now.getTime() - currentTask.createdAt.getTime()) / (1000 * 60))
      : currentTask.timeToComplete;

    const updates: Partial<Task> = {
      status,
      statusHistory: updatedStatusHistory,
      timeInTodo,
      timeInProgress,
      timeToComplete,
      ...(status === 'completed' && { completedAt: now })
    };

    // 🔥 SYNCHRONISATION AUTOMATIQUE : Tâche terminée → Confirmer transaction liée
    if (status === 'completed' && currentTask.transactionId) {
      await confirmLinkedTransaction(currentTask.transactionId, currentTask);
    }

    return await updateTask(taskId, updates);
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const getTasksByCategory = (category: string) => {
    return tasks.filter(task => task.category === category);
  };

  const getSubtasks = (parentTaskId: string) => {
    return tasks.filter(task => task.parentTaskId === parentTaskId);
  };

  // Analytics de performance
  const getPerformanceAnalytics = () => {
    const completedTasks = tasks.filter(task => task.status === 'completed' && task.timeToComplete);

    if (completedTasks.length === 0) {
      return {
        averageCompletionTime: 0,
        averageTimeInTodo: 0,
        averageTimeInProgress: 0,
        totalTasksCompleted: 0,
        fastestTask: null,
        slowestTask: null,
        productivityTrend: []
      };
    }

    const avgCompletionTime = completedTasks.reduce((sum, task) => sum + (task.timeToComplete || 0), 0) / completedTasks.length;
    const avgTimeInTodo = completedTasks.reduce((sum, task) => sum + (task.timeInTodo || 0), 0) / completedTasks.length;
    const avgTimeInProgress = completedTasks.reduce((sum, task) => sum + (task.timeInProgress || 0), 0) / completedTasks.length;

    const sortedByTime = [...completedTasks].sort((a, b) => (a.timeToComplete || 0) - (b.timeToComplete || 0));
    const fastestTask = sortedByTime[0];
    const slowestTask = sortedByTime[sortedByTime.length - 1];

    return {
      averageCompletionTime: Math.round(avgCompletionTime),
      averageTimeInTodo: Math.round(avgTimeInTodo),
      averageTimeInProgress: Math.round(avgTimeInProgress),
      totalTasksCompleted: completedTasks.length,
      fastestTask,
      slowestTask,
      productivityTrend: getProductivityTrend()
    };
  };

  const getProductivityTrend = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    }).reverse();

    return last7Days.map(dateStr => {
      const tasksCompleted = tasks.filter(task =>
        task.status === 'completed' &&
        task.completedAt &&
        task.completedAt.toDateString() === dateStr
      );

      const avgTime = tasksCompleted.length > 0
        ? tasksCompleted.reduce((sum, task) => sum + (task.timeToComplete || 0), 0) / tasksCompleted.length
        : 0;

      return {
        date: dateStr,
        tasksCompleted: tasksCompleted.length,
        averageCompletionTime: Math.round(avgTime)
      };
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
  };

  const createCategory = async (categoryData: Omit<TaskCategory, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const newCategory: Omit<TaskCategory, 'id'> = {
      ...categoryData,
      userId: user.id,
      createdAt: new Date()
    };

    try {
      const categoryId = await taskRepository.createCategory(newCategory);

      const createdCategory: TaskCategory = {
        id: categoryId,
        ...newCategory
      };

      setCategories(prevCategories => [...prevCategories, createdCategory]);
      return true;
    } catch (err) {
      setError('Erreur lors de la création de la catégorie');
      console.error('Error creating category:', err);
      return false;
    }
  };

  // Time tracking functions
  const startTimeTracking = async (taskId: string, description?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const timeEntry = {
        taskId,
        userId: user.id,
        startTime: new Date(),
        description,
        createdAt: new Date()
      };

      const entryId = await taskRepository.startTimeEntry(timeEntry);

      // Update task status to in_progress if it's not already
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status === 'todo') {
        await updateTaskStatus(taskId, 'in_progress');
      }

      return entryId;
    } catch (err) {
      setError('Erreur lors du démarrage du suivi du temps');
      console.error('Error starting time tracking:', err);
      return null;
    }
  };

  const stopTimeTracking = async (entryId: string, taskId: string) => {
    try {
      const endTime = new Date();
      const timeEntries = await taskRepository.getTimeEntriesByTask(taskId);
      const currentEntry = timeEntries.find(entry => entry.id === entryId);

      if (currentEntry && currentEntry.startTime) {
        const duration = Math.floor((endTime.getTime() - currentEntry.startTime.getTime()) / (1000 * 60)); // in minutes

        await taskRepository.stopTimeEntry(entryId, endTime, duration);

        // Update task actual duration
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          const currentDuration = task.actualDuration || 0;
          await updateTask(taskId, { actualDuration: currentDuration + duration });
        }

        return duration;
      }

      return 0;
    } catch (err) {
      setError('Erreur lors de l\'arrêt du suivi du temps');
      console.error('Error stopping time tracking:', err);
      return 0;
    }
  };

  const getTimeEntries = async (taskId: string): Promise<TaskTimeEntry[]> => {
    try {
      return await taskRepository.getTimeEntriesByTask(taskId);
    } catch (err) {
      console.error('Error fetching time entries:', err);
      return [];
    }
  };

  const confirmLinkedTransaction = async (transactionId: string, task: Task) => {
    try {
      const updatedTransaction = {
        status: 'completed' as const,
        description: `Transaction confirmée automatiquement suite à la completion de la tâche: ${task.title}`,
        updatedAt: new Date()
      };

      await financeRepository.updateTransaction(transactionId, updatedTransaction);

      console.log(`✅ Transaction ${transactionId} confirmée automatiquement pour la tâche: ${task.title}`);

      // Si la tâche a un impact financier estimé, on peut mettre à jour le montant réel
      if (task.estimatedCost && task.estimatedCost > 0) {
        await financeRepository.updateTransaction(transactionId, {
          amount: task.estimatedCost,
          description: `Transaction confirmée automatiquement suite à la completion de la tâche: ${task.title} - Montant basé sur le coût estimé de la tâche.`
        });
      }

    } catch (error) {
      console.error('Erreur lors de la confirmation automatique de la transaction:', error);
      // Ne pas faire échouer la completion de la tâche si la transaction échoue
    }
  };

  return {
    tasks,
    categories,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    getTasksByStatus,
    getTasksByCategory,
    getSubtasks,
    createCategory,
    startTimeTracking,
    stopTimeTracking,
    getTimeEntries,
    // Performance analytics
    getPerformanceAnalytics,
    formatDuration,
    refetch: loadTasks
  };
};