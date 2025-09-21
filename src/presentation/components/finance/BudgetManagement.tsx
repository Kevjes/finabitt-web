'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Budget } from '@/src/shared/types';
import { formatAmount, DEFAULT_CURRENCY } from '@/src/shared/utils/currency';
import { calculateBudgetDates } from '@/src/shared/utils/budgetUtils';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';
import Input from '@/src/presentation/components/ui/Input';
import Select from '@/src/presentation/components/ui/Select';
import Textarea from '@/src/presentation/components/ui/Textarea';
import BudgetTransferModal from './BudgetTransferModal';
import BudgetTransactions from './BudgetTransactions';

const BudgetManagement: React.FC = () => {
  const { budgets, transactions, loading, createBudget, updateBudget, deleteBudget, refetch } = useFinance();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [transferBudget, setTransferBudget] = useState<Budget | null>(null);
  const [viewingBudget, setViewingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    amount: 0,
    period: 'monthly' as Budget['period'],
    alertThreshold: 80,
    isRecurring: false,
    startDate: '',
    endDate: '',
    isCustomDates: false
  });

  // Calculer automatiquement les dates quand la période change
  useEffect(() => {
    if (formData.period !== 'custom' && !formData.isCustomDates && !editingBudget) {
      const { startDate, endDate } = calculateBudgetDates(formData.period);
      setFormData(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.period, formData.isCustomDates, editingBudget]);

  // Calculer les métriques avancées d'un budget
  const calculateBudgetMetrics = (budget: Budget) => {
    const now = new Date();

    // S'assurer que les dates sont bien des objets Date
    const startDate = budget.startDate instanceof Date
      ? budget.startDate
      : new Date(budget.startDate);
    const endDate = budget.endDate instanceof Date
      ? budget.endDate
      : new Date(budget.endDate);

    // Durée totale et temps écoulé
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const timeProgress = totalDays > 0 ? Math.min((daysElapsed / totalDays) * 100, 100) : 0;

    // Dépenses actuelles et probables
    const currentSpent = budget.spent;
    const spentPercentage = (currentSpent / budget.amount) * 100;

    // Transactions en attente liées à ce budget
    const pendingTransactions = transactions.filter(t =>
      t.linkedBudgetId === budget.id &&
      t.type === 'expense' &&
      t.status === 'pending'
    );
    const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount, 0);
    const probableSpent = currentSpent + pendingAmount;
    const probablePercentage = (probableSpent / budget.amount) * 100;

    // Consommation théorique basée sur le temps
    const theoreticalSpent = totalDays > 0 ? (budget.amount * timeProgress) / 100 : 0;
    const theoreticalPercentage = (theoreticalSpent / budget.amount) * 100;

    // Rythme de consommation
    const averageDailySpending = daysElapsed > 0 ? currentSpent / daysElapsed : 0;
    const projectedFinalSpent = totalDays > 0 ? averageDailySpending * totalDays : currentSpent;
    const projectedPercentage = (projectedFinalSpent / budget.amount) * 100;

    // Recommandations
    let status: 'excellent' | 'good' | 'warning' | 'danger' = 'excellent';
    let recommendation = '';

    if (probablePercentage >= 100) {
      status = 'danger';
      recommendation = 'Budget dépassé avec les transactions en attente';
    } else if (spentPercentage >= budget.alertThreshold) {
      status = 'warning';
      recommendation = `Seuil d'alerte atteint (${budget.alertThreshold}%)`;
    } else if (spentPercentage > theoreticalPercentage + 20) {
      status = 'warning';
      recommendation = 'Consommation plus rapide que prévu';
    } else if (spentPercentage < theoreticalPercentage - 10) {
      status = 'excellent';
      recommendation = 'Excellent! Vous êtes en avance sur vos objectifs';
    } else {
      status = 'good';
      recommendation = 'Rythme de consommation normal';
    }

    return {
      // Temps
      totalDays,
      daysElapsed,
      daysRemaining,
      timeProgress,

      // Dépenses
      currentSpent,
      spentPercentage,
      pendingAmount,
      probableSpent,
      probablePercentage,
      theoreticalSpent,
      theoreticalPercentage,
      projectedFinalSpent,
      projectedPercentage,
      averageDailySpending,

      // Status
      status,
      recommendation,

      // Données pour la barre de progression
      progressLayers: {
        spent: Math.min(spentPercentage, 100),
        pending: Math.min(Math.max(probablePercentage - spentPercentage, 0), 100 - spentPercentage),
        theoretical: theoreticalPercentage
      }
    };
  };

  // 🔄 Fonction pour recalculer les métriques d'un budget
  const handleRecalculateBudget = async () => {
    if (!viewingBudget) return;

    try {
      console.log('🔄 Recalcul des métriques du budget:', viewingBudget.name);

      // Recalculer les dépenses du budget depuis les transactions
      const budgetTransactions = transactions.filter(t =>
        t.linkedBudgetId === viewingBudget.id &&
        t.type === 'expense' &&
        t.status === 'completed'
      );

      const recalculatedSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);

      console.log('💰 Ancien montant dépensé:', viewingBudget.spent);
      console.log('💰 Nouveau montant calculé:', recalculatedSpent);

      if (recalculatedSpent !== viewingBudget.spent) {
        // Mettre à jour le budget avec le bon montant
        await updateBudget(viewingBudget.id, { spent: recalculatedSpent });

        // Mettre à jour l'état local aussi
        setViewingBudget(prev => prev ? { ...prev, spent: recalculatedSpent } : null);

        console.log('✅ Budget recalculé avec succès!');
      } else {
        console.log('ℹ️ Aucune correction nécessaire, les montants sont déjà corrects');
      }

      // Forcer un refresh des données pour être sûr
      await refetch();

    } catch (error) {
      console.error('❌ Erreur lors du recalcul du budget:', error);
    }
  };

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
          {budgets.map((budget) => {
            const metrics = calculateBudgetMetrics(budget);
            return (
              <Card key={budget.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {budget.name}
                      </h3>
                      {budget.isRecurring && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                          🔄 Récurrent
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {budget.category}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {new Date(budget.startDate).toLocaleDateString('fr-FR')} - {new Date(budget.endDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingBudget(budget)}
                    >
                      Voir détails
                    </Button>
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
                          alertThreshold: budget.alertThreshold,
                          isRecurring: budget.isRecurring,
                          startDate: budget.startDate.toISOString().split('T')[0],
                          endDate: budget.endDate.toISOString().split('T')[0],
                          isCustomDates: true
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

                {/* Métriques principales */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatAmount(metrics.currentSpent, DEFAULT_CURRENCY)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Dépensé</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatAmount(budget.amount - metrics.currentSpent, DEFAULT_CURRENCY)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Restant</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {metrics.daysRemaining}j
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Restants</div>
                  </div>
                </div>

                {/* Transactions en attente */}
                {metrics.pendingAmount > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                      <span>⏳</span>
                      <span className="text-sm font-medium">
                        {formatAmount(metrics.pendingAmount, DEFAULT_CURRENCY)} en transactions en attente
                      </span>
                    </div>
                  </div>
                )}

                {/* Barre de progression avancée */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progression</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {Math.round(metrics.spentPercentage)}%
                    </span>
                  </div>

                  <div className="relative">
                    {/* Fond de la barre */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      {/* Progression théorique */}
                      <div
                        className="absolute top-0 h-4 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"
                        style={{
                          width: `${Math.min(metrics.theoreticalPercentage, 100)}%`,
                        }}
                        title="Progression théorique"
                      ></div>

                      {/* Dépensé réellement */}
                      <div
                        className={`absolute top-0 h-4 rounded-full transition-all ${
                          metrics.status === 'danger' ? 'bg-red-500' :
                          metrics.status === 'warning' ? 'bg-orange-500' :
                          metrics.status === 'excellent' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.min(metrics.spentPercentage, 100)}%`,
                        }}
                      ></div>

                      {/* Transactions en attente */}
                      {metrics.pendingAmount > 0 && (
                        <div
                          className="absolute top-0 h-4 bg-yellow-400 opacity-70 rounded-r-full"
                          style={{
                            left: `${Math.min(metrics.spentPercentage, 100)}%`,
                            width: `${Math.min(metrics.progressLayers.pending, 100 - metrics.spentPercentage)}%`,
                          }}
                          title="Transactions en attente"
                        ></div>
                      )}
                    </div>

                    {/* Indicateur de position théorique */}
                    {metrics.theoreticalPercentage > 0 && metrics.theoreticalPercentage <= 100 && (
                      <div
                        className="absolute top-0 w-0.5 h-4 bg-gray-800 dark:bg-gray-200"
                        style={{
                          left: `${metrics.theoreticalPercentage}%`,
                        }}
                        title="Position théorique"
                      ></div>
                    )}
                  </div>

                  {/* Légende */}
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>📊 Théorique: {Math.round(metrics.theoreticalPercentage)}%</span>
                    <span>⚡ Rythme: {formatAmount(metrics.averageDailySpending, DEFAULT_CURRENCY)}/jour</span>
                  </div>
                </div>

                {/* Recommandation */}
                <div className={`rounded-lg p-3 mb-3 ${
                  metrics.status === 'excellent' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                  metrics.status === 'good' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' :
                  metrics.status === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' :
                  'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className={`text-sm font-medium ${
                    metrics.status === 'excellent' ? 'text-green-700 dark:text-green-300' :
                    metrics.status === 'good' ? 'text-blue-700 dark:text-blue-300' :
                    metrics.status === 'warning' ? 'text-orange-700 dark:text-orange-300' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                    {metrics.recommendation}
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Période: {
                    budget.period === 'weekly' ? 'Hebdomadaire' :
                    budget.period === 'monthly' ? 'Mensuel' :
                    budget.period === 'quarterly' ? 'Trimestriel' :
                    budget.period === 'yearly' ? 'Annuel' :
                    'Personnalisé'
                  }</span>
                  <span>Alerte: {budget.alertThreshold}%</span>
                </div>

                {/* Actions pour budget dépassé ou transactions en attente */}
                {(budget.spent > budget.amount || metrics.pendingAmount > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                        💡 Actions suggérées
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTransferBudget(budget)}
                        className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                      >
                        Transférer des fonds
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
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
                    startDate: new Date(formData.startDate),
                    endDate: new Date(formData.endDate),
                    isActive: true,
                    isRecurring: formData.isRecurring,
                    currentPeriod: editingBudget?.currentPeriod || 1,
                    totalPeriodsCompleted: editingBudget?.totalPeriodsCompleted || 0,
                    periodHistory: editingBudget?.periodHistory || []
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
                    alertThreshold: 80,
                    isRecurring: false,
                    startDate: '',
                    endDate: '',
                    isCustomDates: false
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
                      { value: 'yearly', label: 'Annuel' },
                      { value: 'custom', label: 'Personnalisé' }
                    ]}
                    required
                  />
                </div>

                {/* Dates de période */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isCustomDates}
                        onChange={(e) => setFormData({ ...formData, isCustomDates: e.target.checked })}
                        disabled={formData.period === 'custom'}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Dates personnalisées
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Date de début *"
                      type="date"
                      value={formData.startDate}
                      onChange={(value) => setFormData({ ...formData, startDate: value })}
                      disabled={!formData.isCustomDates && formData.period !== 'custom' && !editingBudget}
                      required
                    />

                    <Input
                      label="Date de fin *"
                      type="date"
                      value={formData.endDate}
                      onChange={(value) => setFormData({ ...formData, endDate: value })}
                      disabled={!formData.isCustomDates && formData.period !== 'custom' && !editingBudget}
                      required
                    />
                  </div>

                  {!formData.isCustomDates && formData.period !== 'custom' && !editingBudget && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      💡 Les dates sont calculées automatiquement selon la période sélectionnée
                    </div>
                  )}
                </div>

                {/* Options de récurrence */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Budget récurrent
                    </span>
                  </label>

                  {formData.isRecurring && (
                    <div className="pl-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span>🔄</span>
                        <span>Le budget se renouvellera automatiquement à la fin de chaque période</span>
                      </div>
                    </div>
                  )}
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
                        alertThreshold: 80,
                        isRecurring: false,
                        startDate: '',
                        endDate: '',
                        isCustomDates: false
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

      {/* Modal de transfert entre budgets */}
      {transferBudget && (
        <BudgetTransferModal
          isOpen={!!transferBudget}
          onClose={() => setTransferBudget(null)}
          sourceBudget={transferBudget}
          onTransferComplete={() => {
            // Actualiser les données après le transfert
            window.location.reload(); // Solution simple, on pourrait optimiser avec refetch
          }}
        />
      )}

      {/* Modal de détails du budget */}
      {viewingBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {viewingBudget.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {viewingBudget.category} • {
                      viewingBudget.period === 'weekly' ? 'Hebdomadaire' :
                      viewingBudget.period === 'monthly' ? 'Mensuel' :
                      viewingBudget.period === 'quarterly' ? 'Trimestriel' :
                      'Annuel'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setViewingBudget(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Budget overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatAmount(viewingBudget.amount, DEFAULT_CURRENCY)}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      Budget total
                    </div>
                  </div>
                </Card>

                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {formatAmount(viewingBudget.spent, DEFAULT_CURRENCY)}
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Dépensé
                    </div>
                  </div>
                </Card>

                <Card className={`${
                  viewingBudget.amount - viewingBudget.spent >= 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      viewingBudget.amount - viewingBudget.spent >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {formatAmount(viewingBudget.amount - viewingBudget.spent, DEFAULT_CURRENCY)}
                    </div>
                    <div className={`text-sm ${
                      viewingBudget.amount - viewingBudget.spent >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {viewingBudget.amount - viewingBudget.spent >= 0 ? 'Restant' : 'Dépassement'}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Budget transactions */}
              <BudgetTransactions budget={viewingBudget} onRecalculate={handleRecalculateBudget} />

              <div className="flex justify-end mt-6">
                <Button onClick={() => setViewingBudget(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;