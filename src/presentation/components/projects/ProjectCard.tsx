'use client';

import { useState } from 'react';
import { Project } from '@/src/shared/types';
import { useProjects } from '@/src/presentation/hooks/useProjects';
import { formatAmount, Currency } from '@/src/shared/utils/currency';
import Card from '@/src/presentation/components/ui/Card';
import Button from '@/src/presentation/components/ui/Button';
import EditProjectModal from './EditProjectModal';
import ProjectDetailsModal from './ProjectDetailsModal';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { getProjectTasks, getProjectTransactions, getProjectFinancialSummary, recalculateProjectMetrics } = useProjects();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const tasks = getProjectTasks(project.id);
  const transactions = getProjectTransactions(project.id);
  const financialSummary = getProjectFinancialSummary(project.id);

  const getStatusInfo = (status: Project['status']) => {
    const statuses = {
      active: { label: 'Actif', icon: '🟢', color: 'green' },
      on_hold: { label: 'En pause', icon: '🟡', color: 'yellow' },
      completed: { label: 'Terminé', icon: '✅', color: 'blue' },
      cancelled: { label: 'Annulé', icon: '❌', color: 'red' }
    };
    return statuses[status];
  };

  const getPriorityInfo = (priority: Project['priority']) => {
    const priorities = {
      low: { label: 'Faible', icon: '🔵', color: 'blue' },
      medium: { label: 'Moyen', icon: '🟡', color: 'yellow' },
      high: { label: 'Élevé', icon: '🟠', color: 'orange' }
    };
    return priorities[priority];
  };

  const formatCurrency = (amount: number) => {
    return formatAmount(amount, 'FCFA' as Currency);
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBudgetStatusColor = (utilization: number) => {
    if (utilization <= 80) return 'text-green-600 dark:text-green-400';
    if (utilization <= 100) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handleRecalculateMetrics = async () => {
    setIsRecalculating(true);
    try {
      const result = await recalculateProjectMetrics(project.id);
      if (result.success) {
        console.log('✅ Métriques recalculées avec succès!');
        // Optionnel: Afficher un toast de succès
      } else {
        console.error('❌ Erreur lors du recalcul des métriques');
        // Optionnel: Afficher un toast d'erreur
      }
    } finally {
      setIsRecalculating(false);
    }
  };

  const statusInfo = getStatusInfo(project.status);
  const priorityInfo = getPriorityInfo(project.priority);

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {project.icon ? (
                <span className="text-2xl">{project.icon}</span>
              ) : (
                <span className="text-2xl">📋</span>
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {project.category}
                </p>
                {project.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {project.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                ⚙️
              </Button>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>{statusInfo.icon}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {statusInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>{priorityInfo.icon}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {priorityInfo.label}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Progression
              </span>
              <span className={`text-sm font-medium ${getCompletionColor(project.completionPercentage)}`}>
                {project.completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${project.completionPercentage}%`,
                  backgroundColor: project.completionPercentage >= 80 ? '#10b981' :
                                   project.completionPercentage >= 50 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
          </div>

          {/* Tasks Summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tâches</span>
            <div className="flex items-center gap-2">
              <span className="text-green-600">{project.completedTasks}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{project.totalTasks}</span>
              <span className="text-xs text-gray-500">
                ({tasks.filter(t => t.status === 'in_progress').length} en cours)
              </span>
            </div>
          </div>

          {/* Financial Summary */}
          {(project.estimatedBudget || financialSummary.expenses > 0) && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Budget</span>
                <div className="text-right">
                  {project.estimatedBudget && (
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${getBudgetStatusColor(financialSummary.budgetUtilization)}`}>
                        {formatCurrency(financialSummary.expenses)}
                      </span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-600">
                        {formatCurrency(project.estimatedBudget)}
                      </span>
                    </div>
                  )}
                  {financialSummary.budgetUtilization > 0 && (
                    <div className="text-xs text-gray-500">
                      {financialSummary.budgetUtilization.toFixed(1)}% utilisé
                    </div>
                  )}
                </div>
              </div>

              {project.estimatedBudget && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(financialSummary.budgetUtilization, 100)}%`,
                      backgroundColor: financialSummary.budgetUtilization <= 80 ? '#10b981' :
                                       financialSummary.budgetUtilization <= 100 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          {(project.startDate || project.endDate) && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                {project.startDate && (
                  <span>Début: {project.startDate.toLocaleDateString()}</span>
                )}
              </div>
              <div>
                {project.endDate && (
                  <span>Fin: {project.endDate.toLocaleDateString()}</span>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{project.tags.length - 3} autres
                </span>
              )}
            </div>
          )}

          {/* Recent Activity */}
          {transactions.length > 0 && (
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Activité récente</p>
              <div className="space-y-1">
                {transactions.slice(0, 2).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span>
                        {transaction.type === 'income' ? '📈' :
                         transaction.type === 'expense' ? '📉' : '🔄'}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 truncate max-w-32">
                        {transaction.description}
                      </span>
                    </div>
                    <span className={`font-medium ${
                      transaction.type === 'income' ? 'text-green-600' :
                      transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </div>
                ))}
              </div>

              {transactions.length > 2 && (
                <button className="text-xs text-primary hover:underline mt-2">
                  Voir toutes les transactions
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              📋 Tâches
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Opening project details modal for project:', project.name);
                setIsDetailsModalOpen(true);
              }}
              className="flex-1 text-xs"
            >
              💰 Budget
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
            >
              📊 Rapport
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculateMetrics}
              disabled={isRecalculating}
              className="text-xs"
              title="Recalculer les métriques du projet"
            >
              {isRecalculating ? '⏳' : '🔄'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Project Modal */}
      <EditProjectModal
        project={project}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={project}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </>
  );
};

export default ProjectCard;