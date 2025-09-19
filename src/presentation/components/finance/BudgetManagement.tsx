'use client';

import { useState } from 'react';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Budget } from '@/src/shared/types';
import { formatAmount } from '@/src/shared/utils/currency';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Textarea from '@/src/presentation/components/ui/Textarea';

const BudgetManagement: React.FC = () => {
  const { budgets, loading, error, createBudget, updateBudget, deleteBudget } = useFinance();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    amount: 0,
    period: 'monthly' as Budget['period'],
    alertThreshold: 80
  });

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Chargement des budgets...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestion des budgets
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Définissez et suivez vos budgets par catégorie avec des alertes automatiques
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          + Nouveau budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              Aucun budget configuré
            </div>
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(true)}
            >
              Créer votre premier budget
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => (
            <Card key={budget.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {budget.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {budget.category}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingBudget(budget);
                      setFormData({
                        name: budget.name,
                        description: budget.description || '',
                        category: budget.category,
                        amount: budget.amount,
                        period: budget.period,
                        alertThreshold: budget.alertThreshold
                      });
                      setShowCreateForm(true);
                    }}
                  >
                    Éditer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
                        deleteBudget(budget.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>

              <div className="text-right mb-3">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {formatAmount(budget.spent, 'FCFA')} / {formatAmount(budget.amount, 'FCFA')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round((budget.spent / budget.amount) * 100)}% utilisé
                </div>
              </div>

              {/* Barre de progression */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (budget.spent / budget.amount) * 100 >= 100
                      ? 'bg-red-500'
                      : (budget.spent / budget.amount) * 100 >= budget.alertThreshold
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%`,
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Période: {
                  budget.period === 'weekly' ? 'Hebdomadaire' :
                  budget.period === 'monthly' ? 'Mensuel' :
                  budget.period === 'quarterly' ? 'Trimestriel' :
                  'Annuel'
                }</span>
                <span>Alerte: {budget.alertThreshold}%</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de création/édition */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {editingBudget ? 'Modifier le budget' : 'Nouveau budget'}
              </h3>

              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const budgetData = {
                    ...formData,
                    amount: Number(formData.amount),
                    alertThreshold: Number(formData.alertThreshold),
                    spent: editingBudget?.spent || 0,
                    startDate: editingBudget?.startDate || new Date(),
                    endDate: editingBudget?.endDate || (() => {
                      const end = new Date();
                      if (formData.period === 'weekly') {
                        end.setDate(end.getDate() + 7);
                      } else if (formData.period === 'monthly') {
                        end.setMonth(end.getMonth() + 1);
                      } else if (formData.period === 'quarterly') {
                        end.setMonth(end.getMonth() + 3);
                      } else {
                        end.setFullYear(end.getFullYear() + 1);
                      }
                      return end;
                    })(),
                    isActive: true
                  };

                  if (editingBudget) {
                    await updateBudget(editingBudget.id, budgetData);
                  } else {
                    await createBudget(budgetData);
                  }

                  setShowCreateForm(false);
                  setEditingBudget(null);
                  setFormData({
                    name: '',
                    description: '',
                    category: '',
                    amount: 0,
                    period: 'monthly',
                    alertThreshold: 80
                  });
                } catch (err) {
                  console.error('Erreur lors de la sauvegarde:', err);
                }
              }} className="space-y-4">

                <Input
                  label="Nom du budget *"
                  value={formData.name}
                  onChange={(value) => setFormData({ ...formData, name: value })}
                  placeholder="ex: Courses alimentaires"
                  required
                />

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Description du budget (optionnel)"
                  rows={2}
                />

                <Input
                  label="Catégorie *"
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  placeholder="ex: Alimentation, Transport, Loisirs"
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Montant (FCFA) *"
                    type="number"
                    value={formData.amount.toString()}
                    onChange={(value) => setFormData({ ...formData, amount: Number(value) || 0 })}
                    placeholder="100000"
                    required
                  />

                  <Select
                    label="Période *"
                    value={formData.period}
                    onChange={(value) => setFormData({ ...formData, period: value as Budget['period'] })}
                    options={[
                      { value: 'weekly', label: 'Hebdomadaire' },
                      { value: 'monthly', label: 'Mensuel' },
                      { value: 'quarterly', label: 'Trimestriel' },
                      { value: 'yearly', label: 'Annuel' }
                    ]}
                    required
                  />
                </div>

                <Input
                  label="Seuil d'alerte (%)"
                  type="number"
                  value={formData.alertThreshold.toString()}
                  onChange={(value) => setFormData({ ...formData, alertThreshold: Number(value) || 80 })}
                  placeholder="80"
                  min="1"
                  max="100"
                />

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingBudget(null);
                      setFormData({
                        name: '',
                        description: '',
                        category: '',
                        amount: 0,
                        period: 'monthly',
                        alertThreshold: 80
                      });
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit">
                    {editingBudget ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;