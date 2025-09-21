'use client';

import { useState } from 'react';
import { Project } from '@/src/shared/types';
import { useProjects } from '@/src/presentation/hooks/useProjects';
import { formatAmount, DEFAULT_CURRENCY } from '@/src/shared/utils/currency';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';

interface ProjectDetailsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const { getProjectTransactions, recalculateProjectMetrics } = useProjects();
  const [isRecalculating, setIsRecalculating] = useState(false);

  const transactions = getProjectTransactions(project.id);

  // Filtrer seulement les transactions de dépenses
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const completedExpenses = expenseTransactions.filter(t => t.status === 'completed');

  const handleRecalculateMetrics = async () => {
    setIsRecalculating(true);
    try {
      const result = await recalculateProjectMetrics(project.id);
      if (result.success) {
        console.log('✅ Métriques recalculées avec succès!', result.metrics);
      } else {
        console.error('❌ Erreur lors du recalcul des métriques');
      }
    } finally {
      setIsRecalculating(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { label: string; color: string } } = {
      'pending': { label: 'Argent en liquide', color: 'text-orange-600 dark:text-orange-400' },
      'completed': { label: 'Projets personnel', color: 'text-blue-600 dark:text-blue-400' },
      'cancelled': { label: 'Annulé', color: 'text-red-600 dark:text-red-400' }
    };
    return statusMap[status] || { label: status, color: 'text-gray-600' };
  };

  if (!isOpen) {
    console.log('Modal is closed, not rendering');
    return null;
  }

  console.log('Rendering ProjectDetailsModal for project:', project.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {project.name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span>{project.category}</span>
                <span>&bull;</span>
                <span>Hebdomadaire</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatAmount(project.estimatedBudget || 0, DEFAULT_CURRENCY)}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Budget total
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatAmount(project.actualSpent || 0, DEFAULT_CURRENCY)}
              </div>
              <div className="text-sm text-red-600 dark:text-red-400">
                Dépensé
              </div>
            </div>
          </Card>

          <Card className={`p-4 ${
            (project.estimatedBudget || 0) - (project.actualSpent || 0) >= 0
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                (project.estimatedBudget || 0) - (project.actualSpent || 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {formatAmount((project.estimatedBudget || 0) - (project.actualSpent || 0), DEFAULT_CURRENCY)}
              </div>
              <div className={`text-sm ${
                (project.estimatedBudget || 0) - (project.actualSpent || 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {(project.estimatedBudget || 0) - (project.actualSpent || 0) >= 0 ? 'Restant' : 'Dépassement'}
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progression</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {project.estimatedBudget ? Math.round(((project.actualSpent || 0) / project.estimatedBudget) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all bg-green-500"
              style={{
                width: `${project.estimatedBudget ? Math.min(((project.actualSpent || 0) / project.estimatedBudget) * 100, 100) : 0}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0</span>
            <span>{formatAmount(project.estimatedBudget || 0, DEFAULT_CURRENCY)}</span>
          </div>
        </div>

        {/* Transactions */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Dépenses du budget ({completedExpenses.length})
              </h4>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total dépensé: {formatAmount(project.actualSpent || 0, DEFAULT_CURRENCY)}
                </div>
                <Button
                  size="sm"
                  onClick={handleRecalculateMetrics}
                  disabled={isRecalculating}
                  className="bg-primary hover:bg-primary/90 text-white"
                  title="Recalculer les métriques pour corriger les transactions non comptabilisées"
                >
                  {isRecalculating ? '⏳ Recalcul en cours...' : '🔄 Actualiser les calculs'}
                </Button>
              </div>
            </div>

            {completedExpenses.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">💸</div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Aucune dépense
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Les dépenses liées à ce projet apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedExpenses.map((transaction) => {
                  const statusInfo = getStatusInfo(transaction.status);
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💸</span>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {transaction.description}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {formatDate(transaction.date)} &bull; {statusInfo.label}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600 dark:text-red-400">
                          -{formatAmount(transaction.amount, DEFAULT_CURRENCY)}
                        </div>
                        {transaction.category && (
                          <div className="text-xs text-gray-500">
                            {transaction.category}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Restant:</span>
                <span className={`font-medium ${
                  (project.estimatedBudget || 0) - (project.actualSpent || 0) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatAmount((project.estimatedBudget || 0) - (project.actualSpent || 0), DEFAULT_CURRENCY)}
                </span>
              </div>
            </div>
          </div>
        </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button
                onClick={handleRecalculateMetrics}
                disabled={isRecalculating}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isRecalculating ? '⏳ Recalcul en cours...' : '🔄 Actualiser les calculs'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;