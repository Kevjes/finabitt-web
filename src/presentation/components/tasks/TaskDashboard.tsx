'use client';

import { useState, useEffect } from 'react';
import { useTasks } from '@/src/presentation/hooks/useTasks';
import { Task } from '@/src/shared/types';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import CategoryManagement from './CategoryManagement';
import Button from '@/src/presentation/components/ui/Button';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';

interface TaskColumn {
  id: Task['status'];
  title: string;
  color: string;
  icon: string;
}

const TaskDashboard: React.FC = () => {
  const { tasks, categories, loading, error, refetch } = useTasks();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const columns: TaskColumn[] = [
    { id: 'todo', title: 'À faire', color: 'border-gray-300', icon: '📋' },
    { id: 'in_progress', title: 'En cours', color: 'border-blue-300', icon: '🔄' },
    { id: 'completed', title: 'Terminé', color: 'border-green-300', icon: '✅' },
    { id: 'cancelled', title: 'Annulé', color: 'border-red-300', icon: '❌' }
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || task.category === selectedCategory;
    const matchesPriority = !selectedPriority || task.priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  const getTasksByStatus = (status: Task['status']) => {
    return filteredTasks.filter(task => task.status === status);
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      t.status !== 'completed'
    ).length;

    return { total, completed, inProgress, overdue };
  };

  const stats = getTaskStats();

  const priorityOptions = [
    { value: '', label: 'Toutes les priorités' },
    { value: 'low', label: 'Faible' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'high', label: 'Haute' },
    { value: 'urgent', label: 'Urgente' }
  ];

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    ...categories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des tâches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestion des tâches
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organisez et suivez vos tâches efficacement
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCategoryManagementOpen(true)}
            className="whitespace-nowrap"
          >
            📁 Catégories
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="whitespace-nowrap"
          >
            ➕ Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔄</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En cours</p>
              <p className="text-xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Terminé</p>
              <p className="text-xl font-bold text-green-600">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En retard</p>
              <p className="text-xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categoryOptions}
              className="min-w-48"
            />

            <Select
              value={selectedPriority}
              onChange={setSelectedPriority}
              options={priorityOptions}
              className="min-w-48"
            />

            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📋 Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm transition-colors border-l border-gray-300 dark:border-gray-600 ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                📝 Liste
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Tasks Display */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.id);

            return (
              <div key={column.id} className="space-y-4">
                <div className={`border-t-4 ${column.color} bg-white dark:bg-gray-800 p-4 rounded-lg`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span className="text-lg">{column.icon}</span>
                      {column.title}
                    </h3>
                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full text-sm font-medium">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {columnTasks.map(task => (
                      <TaskCard key={task.id} task={task} showCategory={false} />
                    ))}

                    {columnTasks.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p className="text-sm">Aucune tâche</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Aucune tâche trouvée
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Commencez par créer votre première tâche ou ajustez vos filtres
              </p>
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                Créer une tâche
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
      />

      {/* Category Management Modal */}
      <CategoryManagement
        isOpen={isCategoryManagementOpen}
        onClose={() => setIsCategoryManagementOpen(false)}
      />
    </div>
  );
};

export default TaskDashboard;