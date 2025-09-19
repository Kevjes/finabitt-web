'use client';

import { useState } from 'react';
import { useHabits } from '@/src/presentation/hooks/useHabits';
import Button from '@/src/presentation/components/ui/Button';
import Card from '@/src/presentation/components/ui/Card';
import HabitCard from './HabitCard';
import CreateHabitModal from './CreateHabitModal';
import HabitStreaksWidget from './HabitStreaksWidget';
import Link from 'next/link';

const HabitsPage: React.FC = () => {
  const { habits, loading, error } = useHabits();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'good' | 'bad'>('all');

  const filteredHabits = habits.filter(habit => {
    if (filter === 'all') return true;
    return habit.type === filter;
  });

  const goodHabitsCount = habits.filter(h => h.type === 'good').length;
  const badHabitsCount = habits.filter(h => h.type === 'bad').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Chargement de vos habitudes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Mes Habitudes
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Suivez et développez vos habitudes quotidiennes
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/habits/analytics">
                <Button variant="outline" size="sm">
                  📊 Analytics
                </Button>
              </Link>
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                + Nouvelle habitude
              </Button>
            </div>
          </div>
        </div>

        {/* Habit Streaks Widget */}
        <div className="mb-6">
          <HabitStreaksWidget />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{habits.length}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                📊
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Bonnes habitudes</p>
                <p className="text-2xl font-bold text-primary">{goodHabitsCount}</p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                ✓
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mauvaises habitudes</p>
                <p className="text-2xl font-bold text-accent">{badHabitsCount}</p>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                ✗
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Toutes ({habits.length})
            </Button>
            <Button
              variant={filter === 'good' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('good')}
            >
              Bonnes ({goodHabitsCount})
            </Button>
            <Button
              variant={filter === 'bad' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('bad')}
            >
              Mauvaises ({badHabitsCount})
            </Button>
          </div>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvelle habitude
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </Card>
        )}

        {/* Habits List */}
        {filteredHabits.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">
              {habits.length === 0 ? '🌱' : '🔍'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {habits.length === 0
                ? 'Aucune habitude pour le moment'
                : 'Aucune habitude trouvée'
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {habits.length === 0
                ? 'Créez votre première habitude pour commencer votre parcours d\'amélioration personnelle.'
                : `Aucune habitude ${filter === 'good' ? 'bonne' : 'mauvaise'} trouvée.`
              }
            </p>
            {habits.length === 0 && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                Créer ma première habitude
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        )}

        {/* Create Habit Modal */}
        <CreateHabitModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default HabitsPage;