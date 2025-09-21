'use client';

import { useState } from 'react';
import { Transaction, TransactionCategory } from '@/src/shared/types';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { useTasks } from '@/src/presentation/hooks/useTasks';
import { useProjects } from '@/src/presentation/hooks/useProjects';
import Modal from '@/src/presentation/components/ui/Modal';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';
import TagInput from '@/src/presentation/components/ui/TagInput';

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({
  isOpen,
  onClose
}) => {
  const { accounts, categories, budgets, createTransaction, createCategory, error } = useFinance();
  const { tasks } = useTasks();
  const { getActiveProjects } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as Transaction['type'],
    amount: 0,
    description: '',
    category: '',
    subcategory: '',
    sourceAccountId: '',
    destinationAccountId: '',
    linkedTaskId: '',
    linkedBudgetId: '',
    projectId: '',
    tags: [] as string[],
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5), // HH:MM format
    status: 'completed' as Transaction['status'],
    isRecurring: false
  });

  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    type: 'expense' as TransactionCategory['type'],
    color: '#EF4444'
  });

  const transactionTypes = [
    { value: 'income', label: 'Revenu', icon: '📈', description: 'Argent reçu' },
    { value: 'expense', label: 'Dépense', icon: '📉', description: 'Argent dépensé' },
    { value: 'transfer', label: 'Virement', icon: '🔄', description: 'Entre comptes' }
  ];

  const statusOptions = [
    { value: 'completed', label: 'Terminé' },
    { value: 'pending', label: 'En attente' }
  ];

  const getFilteredCategories = () => {
    return categories.filter(cat =>
      formData.type === 'transfer' || cat.type === formData.type
    );
  };

  const getAccountOptions = () => {
    return accounts.map(account => ({
      value: account.id,
      label: `${account.name} (${account.currentBalance.toFixed(0)} FCFA)`,
      key: `create-account-${account.id}`
    }));
  };

  const getAvailableSubcategories = () => {
    const category = categories.find(cat => cat.name === formData.category);
    return category?.subcategories || [];
  };

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) return;

    try {
      const success = await createCategory({
        name: newCategoryData.name.trim(),
        type: newCategoryData.type,
        color: newCategoryData.color,
        isActive: true
      });

      if (success) {
        setFormData({ ...formData, category: newCategoryData.name.trim() });
        setNewCategoryData({ name: '', type: 'expense', color: '#EF4444' });
        setShowCreateCategory(false);
      }
    } catch (err) {
      console.error('Error creating category:', err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.description.trim() || !formData.category || formData.amount <= 0) return;

    // Validation des comptes selon le type
    if (formData.type === 'income' && !formData.destinationAccountId) {
      alert('Veuillez sélectionner un compte de destination pour un revenu');
      return;
    }
    if (formData.type === 'expense' && !formData.sourceAccountId) {
      alert('Veuillez sélectionner un compte source pour une dépense');
      return;
    }
    if (formData.type === 'transfer' && (!formData.sourceAccountId || !formData.destinationAccountId)) {
      alert('Veuillez sélectionner les comptes source et destination pour un virement');
      return;
    }
    if (formData.type === 'transfer' && formData.sourceAccountId === formData.destinationAccountId) {
      alert('Les comptes source et destination doivent être différents');
      return;
    }

    setIsSubmitting(true);
    try {
      const transactionData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        type: formData.type,
        amount: formData.amount,
        description: formData.description.trim(),
        category: formData.category,
        subcategory: formData.subcategory.trim() || undefined,
        status: formData.status,
        sourceAccountId: formData.sourceAccountId || undefined,
        destinationAccountId: formData.destinationAccountId || undefined,
        linkedTaskId: formData.linkedTaskId || undefined,
        linkedBudgetId: formData.linkedBudgetId || undefined,
        projectId: formData.projectId || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        location: formData.location.trim() || undefined,
        date: new Date(formData.date),
        time: formData.time || undefined,
        isRecurring: formData.isRecurring
      };

      const success = await createTransaction(transactionData);
      if (success) {
        setFormData({
          type: 'expense',
          amount: 0,
          description: '',
          category: '',
          subcategory: '',
          sourceAccountId: '',
          destinationAccountId: '',
          linkedTaskId: '',
          linkedBudgetId: '',
          projectId: '',
          tags: [],
          location: '',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          status: 'completed',
          isRecurring: false
        });
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Sélectionner une catégorie...', key: 'empty-cat' },
    ...getFilteredCategories().map((cat, index) => ({
      value: cat.name,
      label: cat.name,
      key: `create-cat-${cat.id || index}`
    })),
    { value: '__create_new__', label: '+ Créer une nouvelle catégorie', key: 'create-new-cat' }
  ];

  const subcategoryOptions = [
    { value: '', label: 'Aucune sous-catégorie', key: 'empty-subcat' },
    ...getAvailableSubcategories().map((sub, index) => ({
      value: sub,
      label: sub,
      key: `create-subcat-${formData.category}-${index}`
    }))
  ];

  const accountOptions = getAccountOptions();

  const taskOptions = [
    { value: '', label: 'Aucune tâche liée', key: 'empty-task' },
    ...tasks
      .filter(task => task.status !== 'completed' && task.status !== 'cancelled')
      .map(task => ({ value: task.id, label: task.title, key: `create-task-${task.id}` }))
  ];

  const activeProjects = getActiveProjects();
  const projectOptions = [
    { value: '', label: 'Aucun projet lié', key: 'empty-project' },
    ...activeProjects.map(project => ({ value: project.id, label: project.name, key: `create-project-${project.id}` }))
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouvelle transaction"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Type de transaction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Type de transaction
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {transactionTypes.map((type) => (
              <Card
                key={type.value}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  formData.type === type.value
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
                onClick={() => {
                  setFormData({
                    ...formData,
                    type: type.value as Transaction['type'],
                    sourceAccountId: '',
                    destinationAccountId: ''
                  });
                  // Ajuster le type de catégorie par défaut
                  if (type.value !== 'transfer') {
                    setNewCategoryData({ ...newCategoryData, type: type.value as TransactionCategory['type'] });
                  }
                }}
              >
                <div className="text-center">
                  <span className="text-2xl mb-2 block">{type.icon}</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {type.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {type.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Montant
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0.00"
                required
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">FCFA</span>
            </div>
          </div>

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(value) => setFormData({ ...formData, date: value })}
            required
          />

          <Input
            label="Heure"
            type="time"
            value={formData.time}
            onChange={(value) => setFormData({ ...formData, time: value })}
            helperText="Heure de la transaction"
          />
        </div>

        <Input
          label="Description"
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Description de la transaction..."
          required
        />

        {/* Catégorie */}
        <div>
          <Select
            label="Catégorie"
            value={formData.category}
            onChange={(value) => {
              if (value === '__create_new__') {
                setShowCreateCategory(true);
              } else {
                setFormData({ ...formData, category: value, subcategory: '' });
              }
            }}
            options={categoryOptions}
            required
          />

          {/* Création de nouvelle catégorie */}
          {showCreateCategory && (
            <Card className="mt-3 p-4 bg-gray-50 dark:bg-gray-800">
              <h4 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">
                Créer une nouvelle catégorie
              </h4>
              <div className="space-y-3">
                <Input
                  label="Nom de la catégorie"
                  value={newCategoryData.name}
                  onChange={(value) => setNewCategoryData({ ...newCategoryData, name: value })}
                  placeholder="Ex: Alimentation, Transport..."
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryData.name.trim()}
                  >
                    Créer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateCategory(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sous-catégorie */}
        {getAvailableSubcategories().length > 0 && (
          <Select
            label="Sous-catégorie (optionnel)"
            value={formData.subcategory}
            onChange={(value) => setFormData({ ...formData, subcategory: value })}
            options={subcategoryOptions}
          />
        )}

        {/* Comptes */}
        <div className="space-y-4">
          {(formData.type === 'expense' || formData.type === 'transfer') && (
            <Select
              label="Compte source"
              value={formData.sourceAccountId}
              onChange={(value) => setFormData({ ...formData, sourceAccountId: value })}
              options={[
                { value: '', label: 'Sélectionner un compte...' },
                ...accountOptions
              ]}
              required
            />
          )}

          {(formData.type === 'income' || formData.type === 'transfer') && (
            <Select
              label="Compte destination"
              value={formData.destinationAccountId}
              onChange={(value) => setFormData({ ...formData, destinationAccountId: value })}
              options={[
                { value: '', label: 'Sélectionner un compte...' },
                ...accountOptions.filter(acc => acc.value !== formData.sourceAccountId)
              ]}
              required
            />
          )}
        </div>

        {/* Liaison avec tâche */}
        <Select
          label="Tâche liée (optionnel)"
          value={formData.linkedTaskId}
          onChange={(value) => setFormData({ ...formData, linkedTaskId: value })}
          options={taskOptions}
          helperText="Associer cette transaction à une tâche en cours"
        />

        {/* Liaison avec projet */}
        <Select
          label="Projet associé (optionnel)"
          value={formData.projectId}
          onChange={(value) => setFormData({ ...formData, projectId: value })}
          options={projectOptions}
          helperText="Associer cette transaction à un projet pour un meilleur suivi"
        />

        {/* Liaison avec budget - seulement pour les dépenses */}
        {formData.type === 'expense' && (
          <Select
            label="Budget associé (optionnel)"
            value={formData.linkedBudgetId}
            onChange={(value) => setFormData({ ...formData, linkedBudgetId: value })}
            options={[
              { value: '', label: 'Aucun budget', key: 'empty-budget' },
              ...budgets
                .filter(budget => budget.isActive)
                .map(budget => ({
                  value: budget.id,
                  label: `${budget.name} - ${budget.category} (${(budget.amount - budget.spent).toFixed(0)} FCFA restant)`,
                  key: `create-budget-${budget.id}`
                }))
            ]}
            helperText={`Décompter cette dépense d'un budget spécifique (${budgets.filter(b => b.isActive).length} budgets disponibles)`}
          />
        )}

        {/* Statut */}
        <Select
          label="Statut"
          value={formData.status}
          onChange={(value) => setFormData({ ...formData, status: value as Transaction['status'] })}
          options={statusOptions}
        />

        {/* Informations optionnelles */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100">
            Informations optionnelles
          </h4>

          <TagInput
            label="Tags"
            value={formData.tags}
            onChange={(tags) => setFormData({ ...formData, tags })}
            placeholder="Ajouter des tags..."
          />

          <Input
            label="Lieu"
            value={formData.location}
            onChange={(value) => setFormData({ ...formData, location: value })}
            placeholder="Ex: Supermarché, Restaurant..."
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="isRecurring" className="text-sm text-gray-700 dark:text-gray-300">
              Transaction récurrente
            </label>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!formData.description.trim() || !formData.category || formData.amount <= 0}
            className="flex-1"
          >
            Créer la transaction
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateTransactionModal;