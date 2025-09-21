'use client';

import { useState, useEffect } from 'react';
import { useProjects } from '@/src/presentation/hooks/useProjects';
import { Project } from '@/src/shared/types';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';
import Select from '@/src/presentation/components/ui/Select';
import Input from '@/src/presentation/components/ui/Input';
import ProjectCard from './ProjectCard';
import CreateProjectModal from './CreateProjectModal';

const ProjectsPage: React.FC = () => {
  const {
    projects,
    loading,
    error,
    refetch,
    getProjectsByStatus,
    getProjectsStatistics
  } = useProjects();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'on_hold'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'priority' | 'completion' | 'created'>('created');
  const [filterStatus, setFilterStatus] = useState<'all' | Project['status']>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statistics, setStatistics] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
    averageCompletion: 0
  });

  // Charger les statistiques
  useEffect(() => {
    const loadStatistics = async () => {
      const stats = await getProjectsStatistics();
      setStatistics(stats);
    };

    if (projects.length > 0) {
      loadStatistics();
    }
  }, [projects, getProjectsStatistics]);

  // Filtrer et trier les projets
  const filteredAndSortedProjects = (() => {
    let filtered = projects.filter(project => !project.isArchived);

    // Filtrage par statut
    if (activeTab !== 'all') {
      filtered = getProjectsByStatus(activeTab as Project['status']);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => project.status === filterStatus);
    }

    // Filtrage par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.category.toLowerCase().includes(query) ||
        project.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'completion':
          return b.completionPercentage - a.completionPercentage;
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  })();

  const getProjectStats = () => {
    const activeProjects = projects.filter(p => p.status === 'active' && !p.isArchived).length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const onHoldProjects = projects.filter(p => p.status === 'on_hold').length;
    const totalBudget = projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.actualSpent, 0);
    const averageCompletion = projects.length > 0
      ? projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length
      : 0;

    return {
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalBudget,
      totalSpent,
      averageCompletion,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  };

  const stats = getProjectStats();

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'on_hold', label: 'En pause' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' }
  ];

  const sortOptions = [
    { value: 'created', label: 'Plus récents' },
    { value: 'name', label: 'Nom' },
    { value: 'priority', label: 'Priorité' },
    { value: 'completion', label: 'Progression' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des projets...</p>
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
            Gestion des projets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organisez et suivez vos projets avec leurs budgets et tâches associées
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="whitespace-nowrap"
          >
            🔄 Actualiser
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            className="whitespace-nowrap"
          >
            ➕ Nouveau projet
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Projets actifs</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.activeProjects}
              </p>
              <p className="text-xs text-gray-500">
                {stats.completedProjects} terminés, {stats.onHoldProjects} en pause
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Progression moyenne</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {stats.averageCompletion.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                Across all projects
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Budget total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.totalBudget.toFixed(0)} FCFA
              </p>
              <p className="text-xs text-gray-500">
                Alloué aux projets
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💸</span>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dépensé</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {stats.totalSpent.toFixed(0)} FCFA
              </p>
              <p className="text-xs text-gray-500">
                {stats.budgetUtilization.toFixed(1)}% du budget
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher des projets..."
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as typeof filterStatus)}
              options={statusOptions}
              placeholder="Statut"
            />
            <Select
              value={sortBy}
              onChange={(value) => setSortBy(value as typeof sortBy)}
              options={sortOptions}
              placeholder="Trier par"
            />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { key: 'all', label: 'Tous', count: projects.filter(p => !p.isArchived).length },
          { key: 'active', label: 'Actifs', count: stats.activeProjects },
          { key: 'completed', label: 'Terminés', count: stats.completedProjects },
          { key: 'on_hold', label: 'En pause', count: stats.onHoldProjects }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Projects Grid */}
      {filteredAndSortedProjects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAndSortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchQuery || filterStatus !== 'all'
              ? 'Aucun projet trouvé'
              : 'Aucun projet créé'
            }
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || filterStatus !== 'all'
              ? 'Essayez de modifier vos critères de recherche'
              : 'Créez votre premier projet pour commencer à organiser vos tâches et budgets'
            }
          </p>
          {!searchQuery && filterStatus === 'all' && (
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Créer un projet
            </Button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default ProjectsPage;