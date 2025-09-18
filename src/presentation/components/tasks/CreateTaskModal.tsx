'use client';

import { useState, useEffect } from 'react';
import { Task, TaskCategory } from '@/src/shared/types';
import { useTasks } from '@/src/presentation/hooks/useTasks';
import { useHabits } from '@/src/presentation/hooks/useHabits';
import Modal from '@/src/presentation/components/ui/Modal';
import Input from '@/src/presentation/components/ui/Input';
import TextArea from '@/src/presentation/components/ui/Textarea';
import Select from '@/src/presentation/components/ui/Select';
import Button from '@/src/presentation/components/ui/Button';
import TagInput from '@/src/presentation/components/ui/TagInput';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated
}) => {
  const { createTask, categories, createCategory, error: taskError } = useTasks();
  const { habits } = useHabits();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    category: '',
    tags: [] as string[],
    dueDate: '',
    dueTime: '',
    estimatedDuration: '',
    isRecurring: false,
    habitId: ''
  });

  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    color: '#3B82F6',
    icon: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        tags: [],
        dueDate: '',
        dueTime: '',
        estimatedDuration: '',
        isRecurring: false,
        habitId: ''
      });
      setErrors({});
      setShowCreateCategory(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (formData.estimatedDuration && isNaN(Number(formData.estimatedDuration))) {
      newErrors.estimatedDuration = 'La durée doit être un nombre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        status: 'todo',
        priority: formData.priority,
        category: formData.category || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        dueTime: formData.dueTime || undefined,
        estimatedDuration: formData.estimatedDuration ? Number(formData.estimatedDuration) : undefined,
        isRecurring: formData.isRecurring,
        habitId: formData.habitId || undefined
      };

      const success = await createTask(taskData);

      if (success) {
        onTaskCreated?.();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) {
      console.log('Category name is empty');
      return;
    }

    console.log('Creating category:', newCategoryData);

    try {
      const success = await createCategory({
        name: newCategoryData.name.trim(),
        color: newCategoryData.color,
        icon: newCategoryData.icon || undefined
      });

      console.log('Category creation result:', success);

      if (success) {
        setFormData({ ...formData, category: newCategoryData.name.trim() });
        setNewCategoryData({ name: '', color: '#3B82F6', icon: '' });
        setShowCreateCategory(false);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Faible' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'high', label: 'Haute' },
    { value: 'urgent', label: 'Urgente' }
  ];

  const categoryOptions = [
    { value: '', label: 'Aucune catégorie' },
    ...categories.map(cat => ({ value: cat.name, label: cat.name })),
    { value: '__create__', label: '+ Créer une catégorie' }
  ];

  const habitOptions = [
    { value: '', label: 'Aucune habitude liée' },
    ...habits.map(habit => ({ value: habit.id, label: habit.name }))
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer une nouvelle tâche"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Titre"
          value={formData.title}
          onChange={(value) => setFormData({ ...formData, title: value })}
          error={errors.title}
          required
          placeholder="Titre de la tâche"
        />

        <TextArea
          label="Description"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Description détaillée de la tâche"
          rows={3}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Priorité"
            value={formData.priority}
            onChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
            options={priorityOptions}
          />

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
            />

            {showCreateCategory && (
              <div className="mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                <div className="flex gap-2">
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
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleCreateCategory}
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
        </div>

        <TagInput
          label="Tags"
          value={formData.tags}
          onChange={(tags) => setFormData({ ...formData, tags })}
          placeholder="Appuyez sur Entrée ou utilisez des virgules"
          helperText="Organisez vos tâches avec des mots-clés"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Date d'échéance"
            type="date"
            value={formData.dueDate}
            onChange={(value) => setFormData({ ...formData, dueDate: value })}
          />

          <Input
            label="Heure d'échéance"
            type="time"
            value={formData.dueTime}
            onChange={(value) => setFormData({ ...formData, dueTime: value })}
            helperText="Ex: 12:30 pour envoyer un mail"
          />

          <Input
            label="Durée estimée (minutes)"
            type="number"
            value={formData.estimatedDuration}
            onChange={(value) => setFormData({ ...formData, estimatedDuration: value })}
            error={errors.estimatedDuration}
            placeholder="5"
            helperText="Ex: 5 minutes"
          />
        </div>

        <Select
          label="Habitude liée"
          value={formData.habitId}
          onChange={(value) => setFormData({ ...formData, habitId: value })}
          options={habitOptions}
          helperText="Associer cette tâche à une habitude existante"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRecurring"
            checked={formData.isRecurring}
            onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="isRecurring" className="text-sm text-gray-700 dark:text-gray-300">
            Tâche récurrente
          </label>
        </div>

        {taskError && (
          <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-sm text-error">{taskError}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="flex-1"
          >
            Créer la tâche
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;