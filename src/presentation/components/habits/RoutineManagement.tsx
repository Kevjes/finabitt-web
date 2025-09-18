'use client';

import { useState } from 'react';
import { useRoutines } from '@/src/presentation/hooks/useRoutines';
import { useHabits } from '@/src/presentation/hooks/useHabits';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';

const RoutineManagement: React.FC = () => {
  const { routines, loading, error } = useRoutines();
  const { habits } = useHabits();

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Chargement des routines...</div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Gestion des routines
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Organisez vos habitudes en routines pour créer des enchaînements efficaces
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          + Nouvelle routine
        </Button>
      </div>

      {routines.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Aucune routine configurée
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Créez votre première routine pour organiser vos habitudes
            </p>
            <Button variant="outline">
              Créer ma première routine
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {routines.map((routine) => (
            <Card key={routine.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {routine.name}
                  </h4>
                  {routine.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {routine.description}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  routine.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                }`}>
                  {routine.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoutineManagement;