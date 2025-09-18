'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { TaskRepository } from '@/src/data/repositories/taskRepository';
import { Task, TaskCategory, TaskTimeEntry } from '@/src/shared/types';

const taskRepository = new TaskRepository();

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
    const newTask: Omit<Task, 'id'> = {
      ...taskData,
      userId: user.id,
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

      setTimeout(async () => {
        await loadTasks();
      }, 1000);

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
    const updates: Partial<Task> = {
      status,
      ...(status === 'completed' && { completedAt: new Date() })
    };

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
    refetch: loadTasks
  };
};