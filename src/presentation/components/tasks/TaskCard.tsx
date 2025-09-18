'use client';

import { useState } from 'react';
import { Task } from '@/src/shared/types';
import { useTasks } from '@/src/presentation/hooks/useTasks';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';

interface TaskCardProps {
  task: Task;
  showCategory?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, showCategory = true }) => {
  const { updateTaskStatus, deleteTask, startTimeTracking, stopTimeTracking } = useTasks();
  const [isLoading, setIsLoading] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTimeEntryId, setCurrentTimeEntryId] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: Task['status']) => {
    setIsLoading(true);
    try {
      await updateTaskStatus(task.id, newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      setIsLoading(true);
      try {
        await deleteTask(task.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleStartTimer = async () => {
    const entryId = await startTimeTracking(task.id);
    if (entryId) {
      setCurrentTimeEntryId(entryId);
      setIsTimerRunning(true);
    }
  };

  const handleStopTimer = async () => {
    if (currentTimeEntryId) {
      await stopTimeTracking(currentTimeEntryId, task.id);
      setCurrentTimeEntryId(null);
      setIsTimerRunning(false);
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Card className={`hover:shadow-lg transition-shadow ${task.status === 'completed' ? 'opacity-75' : ''}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${
              task.status === 'completed' ? 'line-through' : ''
            }`}>
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor()}`}>
              {task.priority === 'urgent' && '🔥'}
              {task.priority === 'high' && '⚡'}
              {task.priority === 'medium' && '📋'}
              {task.priority === 'low' && '📝'}
            </span>
          </div>
        </div>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Info Row */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            {showCategory && task.category && (
              <span className="flex items-center gap-1">
                📁 {task.category}
              </span>
            )}

            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                📅 {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                {isOverdue && ' (En retard)'}
              </span>
            )}

            {task.estimatedDuration && (
              <span className="flex items-center gap-1">
                ⏱️ {formatDuration(task.estimatedDuration)}
                {task.actualDuration && ` / ${formatDuration(task.actualDuration)}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className={`font-medium ${getStatusColor()}`}>
              {task.status === 'todo' && '📋 À faire'}
              {task.status === 'in_progress' && '🔄 En cours'}
              {task.status === 'completed' && '✅ Terminé'}
              {task.status === 'cancelled' && '❌ Annulé'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {/* Status buttons */}
            {task.status === 'todo' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleStatusChange('in_progress')}
                isLoading={isLoading}
              >
                Commencer
              </Button>
            )}

            {task.status === 'in_progress' && (
              <Button
                size="sm"
                variant="success"
                onClick={() => handleStatusChange('completed')}
                isLoading={isLoading}
              >
                Terminer
              </Button>
            )}

            {task.status === 'completed' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStatusChange('todo')}
                isLoading={isLoading}
              >
                Rouvrir
              </Button>
            )}

            {/* Timer button */}
            {task.status !== 'completed' && task.status !== 'cancelled' && (
              <>
                {!isTimerRunning ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleStartTimer}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    ▶️ Timer
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleStopTimer}
                    className="text-red-600 hover:text-red-700"
                  >
                    ⏹️ Stop
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {task.status !== 'completed' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleStatusChange('cancelled')}
                isLoading={isLoading}
                className="text-gray-500 hover:text-red-600"
              >
                ✕
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              isLoading={isLoading}
              className="text-gray-500 hover:text-red-600"
            >
              🗑️
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;