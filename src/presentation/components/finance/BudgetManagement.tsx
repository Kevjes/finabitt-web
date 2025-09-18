'use client';

import { useState } from 'react';
import { useFinance } from '@/src/presentation/hooks/useFinance';
import { Budget } from '@/src/shared/types';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';

const BudgetManagement: React.FC = () => {
  const { budgets, loading, error } = useFinance();

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
        <Button className="bg-primary hover:bg-primary/90">
          + Nouveau budget
        </Button>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              Aucun budget configuré
            </div>
            <Button variant="outline">
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
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {budget.spent.toFixed(2)}€ / {budget.amount.toFixed(2)}€
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;