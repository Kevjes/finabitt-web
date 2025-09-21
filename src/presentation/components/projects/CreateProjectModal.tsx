'use client';

import { useState } from 'react';
import { useProjects } from '@/src/presentation/hooks/useProjects';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Project, Budget, Goal } from '@/src/shared/types';
import Modal from '@/src/presentation/components/ui/Modal';
import Input from '@/src/presentation/components/ui/Input';
import Textarea from '@/src/presentation/components/ui/Textarea';
import Button from '@/src/presentation/components/ui/Button';
import Select from '@/src/presentation/components/ui/Select';
import TagInput from '@/src/presentation/components/ui/TagInput';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createProject, projectCategories, createProjectCategory } = useProjects();
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
  const [error, setError] = useState<string | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    color: '#3B82F6',
    icon: ''
  });

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

  const categoryOptions = [
    ...projectCategories.map(cat => ({
      value: cat.name,
      label: cat.name
    })),
    { value: '__create__', label: '+ Créer une catégorie' }
  ];

  const budgetOptions = budgets.map(budget => ({
    value: budget.id,
    label: `${budget.name} (${budget.amount} FCFA)`
  }));

  const goalOptions = goals.map(goal => ({
    value: goal.id,
    label: `${goal.name} (${goal.targetAmount} FCFA)`
  }));

  const iconOptions = [
    '📋', '🏗️', '🏢', '🏠', '🚗', '💼', '📱', '🎯', '🌟', '🔧',
    '🎨', '📚', '💡', '🚀', '⚡', '🌱', '🎵', '🏆', '🔮', '🎪'
  ];

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) return;

    try {
      const success = await createProjectCategory({
        name: newCategoryData.name.trim(),
        color: newCategoryData.color,
        icon: newCategoryData.icon || undefined,
        isActive: true
      });

      if (success) {
        setFormData({ ...formData, category: newCategoryData.name.trim() });
        setNewCategoryData({ name: '', color: '#3B82F6', icon: '' });
        setShowCreateCategory(false);
      }
    } catch (err) {
      console.error('Error creating project category:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const projectData = {
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
        isArchived: false
      };

      const success = await createProject(projectData);

      if (success) {
        onClose();
        resetForm();
      } else {
        setError('Erreur lors de la création du projet');
      }
    } catch (err) {
      setError('Erreur lors de la création du projet');
      console.error('Error creating project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      status: 'active',
      priority: 'medium',
      color: '#3B82F6',
      icon: '',
      startDate: '',
      endDate: '',
      estimatedBudget: '',
      budgetIds: [],
      goalIds: [],
      tags: []
    });
    setError(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Créer un nouveau projet">
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
            <div>
              <Select
                label="Catégorie"
                value={showCreateCategory ? '__create__' : formData.category}
                onChange={(value) => {
                  if (value === '__create__') {
                    setShowCreateCategory(true);
                  } else {
                    setFormData({ ...formData, category: value });
                    setShowCreateCategory(false);
                  }
                }}
                options={categoryOptions}
                placeholder="Sélectionner une catégorie"
              />

              {showCreateCategory && (
                <div className="mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newCategoryData.name}
                      onChange={(value) => setNewCategoryData({ ...newCategoryData, name: value })}
                      placeholder="Nom de la catégorie"
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={newCategoryData.color}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, color: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryData.name.trim()}
                    >
                      Créer
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateCategory(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </div>

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
            {isSubmitting ? 'Création...' : 'Créer le projet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;