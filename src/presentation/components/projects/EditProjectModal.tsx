'use client';

import { useState, useEffect } from 'react';
import { useProjects } from '@/src/presentation/hooks/useProjects';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Project } from '@/src/shared/types';
import Modal from '@/src/presentation/components/ui/Modal';
import Input from '@/src/presentation/components/ui/Input';
import Textarea from '@/src/presentation/components/ui/Textarea';
import Button from '@/src/presentation/components/ui/Button';
import Select from '@/src/presentation/components/ui/Select';
import TagInput from '@/src/presentation/components/ui/TagInput';

interface EditProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const { updateProject, deleteProject, projectCategories } = useProjects();
  const { budgets, goals } = useFinance();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    status: 'active' as Project['status'],
    priority: 'medium' as Project['priority'],
    color: '#3B82F6',
    icon: '',
    startDate: '',
    endDate: '',
    estimatedBudget: '',
    budgetIds: [] as string[],
    goalIds: [] as string[],
    tags: [] as string[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        category: project.category,
        status: project.status,
        priority: project.priority,
        color: project.color || '#3B82F6',
        icon: project.icon || '',
        startDate: project.startDate ? project.startDate.toISOString().split('T')[0] : '',
        endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : '',
        estimatedBudget: project.estimatedBudget?.toString() || '',
        budgetIds: project.budgetIds || [],
        goalIds: project.goalIds || [],
        tags: project.tags || []
      });
    }
  }, [project]);

  const statusOptions = [
    { value: 'active', label: 'Actif' },
    { value: 'on_hold', label: 'En pause' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Faible' },
    { value: 'medium', label: 'Moyen' },
    { value: 'high', label: 'Élevé' }
  ];

  const categoryOptions = projectCategories.map((cat, index) => ({
    value: cat.name,
    label: cat.name,
    key: `proj-cat-${cat.id || index}`
  }));

  const budgetOptions = budgets.map(budget => ({
    value: budget.id,
    label: `${budget.name} (${budget.amount} FCFA)`,
    key: `proj-budget-${budget.id}`
  }));

  const goalOptions = goals.map(goal => ({
    value: goal.id,
    label: `${goal.name} (${goal.targetAmount} FCFA)`,
    key: `proj-goal-${goal.id}`
  }));

  const iconOptions = [
    '📋', '🏗️', '🏢', '🏠', '🚗', '💼', '📱', '🎯', '🌟', '🔧',
    '🎨', '📚', '💡', '🚀', '⚡', '🌱', '🎵', '🏆', '🔮', '🎪'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const updates: Partial<Project> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        status: formData.status,
        priority: formData.priority,
        color: formData.color,
        icon: formData.icon || undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
        budgetIds: formData.budgetIds,
        goalIds: formData.goalIds,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
      };

      const success = await updateProject(project.id, updates);

      if (success) {
        onClose();
      } else {
        setError('Erreur lors de la mise à jour du projet');
      }
    } catch (err) {
      setError('Erreur lors de la mise à jour du projet');
      console.error('Error updating project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const success = await deleteProject(project.id);

      if (success) {
        onClose();
        setShowDeleteConfirm(false);
      } else {
        setError('Erreur lors de la suppression du projet');
      }
    } catch (err) {
      setError('Erreur lors de la suppression du projet');
      console.error('Error deleting project:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setShowDeleteConfirm(false);
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Modifier le projet">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Informations de base
          </h3>

          <Input
            label="Nom du projet *"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="Nom du projet"
            required
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            placeholder="Description du projet"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Catégorie"
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              options={categoryOptions}
              placeholder="Sélectionner une catégorie"
            />

            <Select
              label="Statut"
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as Project['status'] })}
              options={statusOptions}
            />
          </div>

          <Select
            label="Priorité"
            value={formData.priority}
            onChange={(value) => setFormData({ ...formData, priority: value as Project['priority'] })}
            options={priorityOptions}
          />
        </div>

        {/* Visual Customization */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Personnalisation
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icône
              </label>
              <div className="grid grid-cols-5 gap-2 max-h-20 overflow-y-auto">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`p-2 text-lg border rounded ${
                      formData.icon === icon
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dates and Budget */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Planning et budget
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date de début"
              type="date"
              value={formData.startDate}
              onChange={(value) => setFormData({ ...formData, startDate: value })}
            />

            <Input
              label="Date de fin"
              type="date"
              value={formData.endDate}
              onChange={(value) => setFormData({ ...formData, endDate: value })}
            />
          </div>

          <Input
            label="Budget estimé (FCFA)"
            type="number"
            value={formData.estimatedBudget}
            onChange={(value) => setFormData({ ...formData, estimatedBudget: value })}
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>

        {/* Budgets and Goals Linking */}
        {(budgetOptions.length > 0 || goalOptions.length > 0) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Liaison avec budgets et objectifs
            </h3>

            {budgetOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budgets associés
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {budgetOptions.map((budget) => (
                    <label key={budget.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.budgetIds.includes(budget.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              budgetIds: [...formData.budgetIds, budget.value]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              budgetIds: formData.budgetIds.filter(id => id !== budget.value)
                            });
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {budget.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {goalOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Objectifs associés
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {goalOptions.map((goal) => (
                    <label key={goal.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.goalIds.includes(goal.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              goalIds: [...formData.goalIds, goal.value]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              goalIds: formData.goalIds.filter(id => id !== goal.value)
                            });
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {goal.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        <TagInput
          label="Étiquettes"
          value={formData.tags}
          onChange={(tags) => setFormData({ ...formData, tags })}
          placeholder="Ajouter des étiquettes"
        />

        {/* Project Metrics (Read-only) */}
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Métriques du projet
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Progression:</span>
              <span className="ml-2 font-medium">{project.completionPercentage}%</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Tâches:</span>
              <span className="ml-2 font-medium">
                {project.completedTasks}/{project.totalTasks}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Transactions:</span>
              <span className="ml-2 font-medium">{project.totalTransactions}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Dépenses:</span>
              <span className="ml-2 font-medium">{project.actualSpent} FCFA</span>
            </div>
          </div>
        </div>

        {/* Delete Section */}
        {!showDeleteConfirm ? (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              🗑️ Supprimer le projet
            </Button>
          </div>
        ) : (
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                ⚠️ Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.
                Le projet sera archivé et ne pourra plus être modifié.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.name.trim()}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProjectModal;