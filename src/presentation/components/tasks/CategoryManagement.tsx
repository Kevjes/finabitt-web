'use client';

import { useState, useEffect } from 'react';
import { TaskCategory } from '@/src/shared/types';
import { useTasks } from '@/src/presentation/hooks/useTasks';
import Modal from '@/src/presentation/components/ui/Modal';
import Input from '@/src/presentation/components/ui/Input';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';

interface CategoryManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  isOpen,
  onClose
}) => {
  const { categories, createCategory, error: taskError } = useTasks();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    color: '#3B82F6',
    icon: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setNewCategoryData({ name: '', color: '#3B82F6', icon: '' });
    }
  }, [isOpen]);

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await createCategory({
        name: newCategoryData.name.trim(),
        color: newCategoryData.color,
        icon: newCategoryData.icon || undefined
      });

      if (success) {
        setNewCategoryData({ name: '', color: '#3B82F6', icon: '' });
        setShowCreateForm(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const predefinedColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#06B6D4', // cyan
    '#F97316', // orange
    '#84CC16', // lime
    '#EC4899', // pink
    '#6B7280'  // gray
  ];

  const predefinedIcons = [
    '📝', '💼', '🏠', '🎯', '⚡', '🌟', '🔥', '💡', '🚀', '⏰',
    '📚', '💪', '🎨', '🎵', '🍕', '🛍️', '💰', '🏃', '📞', '✈️'
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestion des catégories"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Bouton créer nouvelle catégorie */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Mes catégories ({categories.length})
          </h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Annuler' : '+ Nouvelle catégorie'}
          </Button>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <Card className="p-4 bg-gray-50 dark:bg-gray-800">
            <h4 className="text-md font-medium mb-4 text-gray-900 dark:text-gray-100">
              Créer une nouvelle catégorie
            </h4>

            <div className="space-y-4">
              <Input
                label="Nom de la catégorie"
                value={newCategoryData.name}
                onChange={(value) => setNewCategoryData({ ...newCategoryData, name: value })}
                placeholder="Ex: Travail, Personnel, Urgent..."
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Couleur
                </label>
                <div className="flex gap-2 flex-wrap">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryData({ ...newCategoryData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newCategoryData.color === color
                          ? 'border-gray-800 dark:border-gray-200 scale-110'
                          : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="color"
                    value={newCategoryData.color}
                    onChange={(e) => setNewCategoryData({ ...newCategoryData, color: e.target.value })}
                    className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icône (optionnel)
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {predefinedIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewCategoryData({ ...newCategoryData, icon })}
                      className={`w-8 h-8 rounded border text-lg transition-all hover:scale-105 ${
                        newCategoryData.icon === icon
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <Input
                  value={newCategoryData.icon}
                  onChange={(value) => setNewCategoryData({ ...newCategoryData, icon: value })}
                  placeholder="Ou tapez un emoji..."
                  className="text-center"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleCreateCategory}
                  isLoading={isSubmitting}
                  disabled={!newCategoryData.name.trim()}
                >
                  Créer la catégorie
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Liste des catégories existantes */}
        <div>
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((category) => (
                <Card key={category.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.icon && (
                        <span className="text-lg">{category.icon}</span>
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {category.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Créée le {new Date(category.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Aucune catégorie
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Créez votre première catégorie pour organiser vos tâches
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateForm(true)}
              >
                Créer une catégorie
              </Button>
            </div>
          )}
        </div>

        {taskError && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-sm text-error">{taskError}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CategoryManagement;