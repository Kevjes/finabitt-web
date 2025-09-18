'use client';

import { useState, useEffect } from 'react';
import { Habit, HabitProgress, Task } from '@/src/shared/types';
import { useHabits } from '@/src/presentation/hooks/useHabits';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';

interface HabitCardProps {
  habit: Habit;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
  const { toggleHabitCompletion, getTodayProgress, createTaskFromHabit, getHabitTasks } = useHabits();
  const [todayProgress, setTodayProgress] = useState<HabitProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [linkedTasks, setLinkedTasks] = useState<Task[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  useEffect(() => {
    loadTodayProgress();
    calculateStreak();
    loadLinkedTasks();
  }, [habit.id]);

  const loadTodayProgress = async () => {
    const progress = await getTodayProgress(habit.id);
    setTodayProgress(progress);
  };

  const calculateStreak = async () => {
    // Calculate streak for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    // This is a simplified streak calculation
    // In a real app, you'd want more sophisticated logic
    setStreak(Math.floor(Math.random() * 15)); // Placeholder
  };

  const loadLinkedTasks = async () => {
    try {
      const tasks = await getHabitTasks(habit.id);
      setLinkedTasks(tasks);
    } catch (err) {
      console.error('Error loading linked tasks:', err);
    }
  };

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const success = await toggleHabitCompletion(habit.id);
      if (success) {
        await loadTodayProgress();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;

    try {
      await createTaskFromHabit(habit.id, taskTitle.trim(), `Tâche générée depuis l'habitude: ${habit.name}`);
      setTaskTitle('');
      setShowCreateTask(false);
      await loadLinkedTasks();
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const getHabitTypeColor = () => {
    return habit.type === 'good' ? 'text-primary' : 'text-accent';
  };

  const getHabitTypeIcon = () => {
    return habit.type === 'good' ? '✓' : '✗';
  };

  const getFrequencyText = () => {
    let base = '';
    switch (habit.frequency) {
      case 'daily':
        base = 'Quotidienne';
        break;
      case 'weekly':
        base = 'Hebdomadaire';
        break;
      case 'custom':
        base = `${habit.customDays?.length || 0} jour(s)/semaine`;
        break;
    }

    // Ajouter les horaires si définis
    if (habit.hasTimeSchedule) {
      if (habit.frequency === 'daily' && habit.dailyTimes?.length) {
        base += ` à ${habit.dailyTimes.join(', ')}`;
      } else if (habit.frequency === 'custom' && habit.schedules?.length) {
        const timeCount = habit.schedules.reduce((acc, schedule) => acc + schedule.times.length, 0);
        base += ` (${timeCount} horaire${timeCount > 1 ? 's' : ''})`;
      }
    }

    return base;
  };

  const isCompleted = todayProgress?.completed || false;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-lg font-bold ${getHabitTypeColor()}`}>
              {getHabitTypeIcon()}
            </span>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {habit.name}
            </h3>
          </div>

          {habit.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {habit.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{getFrequencyText()}</span>
            {habit.target && (
              <span>Objectif: {habit.target}</span>
            )}
            <span className="flex items-center gap-1">
              🔥 {streak} jours
            </span>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
            isCompleted
              ? habit.type === 'good'
                ? 'bg-primary border-primary text-white'
                : 'bg-accent border-accent text-white'
              : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Aujourd'hui</span>
          <span>{isCompleted ? 'Terminé' : 'En cours'}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isCompleted
                ? habit.type === 'good'
                  ? 'bg-primary'
                  : 'bg-accent'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            style={{ width: isCompleted ? '100%' : '0%' }}
          />
        </div>
      </div>

      {todayProgress?.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">Note: </span>
            {todayProgress.notes}
          </p>
        </div>
      )}

      {/* Linked Tasks Section */}
      {(linkedTasks.length > 0 || showCreateTask) && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tâches liées ({linkedTasks.length})
            </h4>
            {!showCreateTask && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCreateTask(true)}
                className="text-xs px-2 py-1"
              >
                + Tâche
              </Button>
            )}
          </div>

          {/* Quick create task form */}
          {showCreateTask && (
            <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Titre de la tâche..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
                />
                <Button size="sm" variant="primary" onClick={handleCreateTask}>
                  ✓
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowCreateTask(false)}>
                  ✕
                </Button>
              </div>
            </div>
          )}

          {/* Linked tasks list */}
          {linkedTasks.length > 0 && (
            <div className="space-y-1">
              {linkedTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between text-xs">
                  <span className={`truncate flex-1 ${
                    task.status === 'completed'
                      ? 'line-through text-gray-500 dark:text-gray-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {task.status === 'completed' && '✓ '}
                    {task.status === 'in_progress' && '🔄 '}
                    {task.status === 'todo' && '📋 '}
                    {task.title}
                  </span>
                  <span className={`ml-2 px-1 py-0.5 rounded text-xs font-medium ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' :
                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
              {linkedTasks.length > 3 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                  +{linkedTasks.length - 3} autres tâches
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default HabitCard;