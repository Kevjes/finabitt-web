'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTasks } from './useTasks';
import { useHabits } from './useHabits';
import { useSuggestions } from './useSuggestions';
import { Task, Habit } from '@/src/shared/types';

interface ProductivityPattern {
  type: 'procrastination' | 'productive_time' | 'task_overload' | 'habit_neglect';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  evidence: string[];
  suggestions: string[];
  affectedItems: string[];
}

interface ProductivityInsight {
  patterns: ProductivityPattern[];
  weeklyProductivity: number; // 0-100 score
  taskCompletionRate: number;
  averageTaskTime: number;
  mostProductiveHour: number;
  procrastinationScore: number; // 0-100, higher = more procrastination
  recommendations: string[];
}

export const useProductivityAnalytics = () => {
  const { user } = useAuth();
  const { tasks, getPerformanceAnalytics } = useTasks();
  const { habits } = useHabits();
  const { createSuggestion } = useSuggestions();

  const [insights, setInsights] = useState<ProductivityInsight>({
    patterns: [],
    weeklyProductivity: 0,
    taskCompletionRate: 0,
    averageTaskTime: 0,
    mostProductiveHour: 9,
    procrastinationScore: 0,
    recommendations: []
  });
  const [loading, setLoading] = useState(true);

  // Analyze procrastination patterns
  const detectProcrastination = (userTasks: Task[]): ProductivityPattern[] => {
    const patterns: ProductivityPattern[] = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Pattern 1: Tasks stuck in "todo" for too long
    const staleTasks = userTasks.filter(task => {
      if (task.status !== 'todo') return false;
      const daysSinceCreated = (now.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated > 3;
    });

    if (staleTasks.length >= 3) {
      patterns.push({
        type: 'procrastination',
        severity: staleTasks.length >= 7 ? 'high' : staleTasks.length >= 5 ? 'medium' : 'low',
        title: 'Accumulation de tâches en attente',
        description: `Vous avez ${staleTasks.length} tâches qui traînent depuis plus de 3 jours`,
        evidence: [
          `${staleTasks.length} tâches en attente depuis 3+ jours`,
          'Risque de surcharge cognitive',
          'Possible évitement de tâches difficiles'
        ],
        suggestions: [
          'Définir 3 tâches prioritaires maximum par jour',
          'Découper les grosses tâches en sous-tâches',
          'Utiliser la technique Pomodoro (25 min focus)',
          'Commencer par la tâche la plus difficile le matin'
        ],
        affectedItems: staleTasks.map(t => t.title)
      });
    }

    // Pattern 2: High ratio of cancelled/abandoned tasks
    const recentTasks = userTasks.filter(task => task.createdAt >= oneWeekAgo);
    const cancelledTasks = recentTasks.filter(task => task.status === 'cancelled');
    const cancellationRate = recentTasks.length > 0 ? (cancelledTasks.length / recentTasks.length) * 100 : 0;

    if (cancellationRate > 30 && cancelledTasks.length >= 3) {
      patterns.push({
        type: 'procrastination',
        severity: cancellationRate > 50 ? 'high' : 'medium',
        title: 'Taux d\'abandon élevé',
        description: `${cancellationRate.toFixed(0)}% de vos tâches récentes ont été annulées`,
        evidence: [
          `${cancelledTasks.length} tâches annulées cette semaine`,
          `${cancellationRate.toFixed(0)}% de taux d'abandon`,
          'Possible surestimation de vos capacités'
        ],
        suggestions: [
          'Réduire le nombre de tâches planifiées',
          'Être plus réaliste sur les estimations de temps',
          'Analyser pourquoi vous annulez ces tâches',
          'Créer des tâches plus petites et atteignables'
        ],
        affectedItems: cancelledTasks.map(t => t.title)
      });
    }

    // Pattern 3: Tasks taking much longer than estimated
    const completedTasks = userTasks.filter(task =>
      task.status === 'completed' &&
      task.estimatedDuration &&
      task.timeToComplete &&
      task.completedAt && task.completedAt >= oneWeekAgo
    );

    const slowTasks = completedTasks.filter(task => {
      const estimatedMinutes = task.estimatedDuration!;
      const actualMinutes = task.timeToComplete!;
      return actualMinutes > estimatedMinutes * 1.5; // 50% longer than estimated
    });

    if (slowTasks.length >= 3) {
      patterns.push({
        type: 'procrastination',
        severity: slowTasks.length >= 6 ? 'high' : 'medium',
        title: 'Dépassements de temps fréquents',
        description: `${slowTasks.length} tâches ont pris 50%+ de temps en plus que prévu`,
        evidence: [
          `${slowTasks.length} tâches avec dépassement significatif`,
          'Sous-estimation chronique du temps nécessaire',
          'Possible procrastination pendant l\'exécution'
        ],
        suggestions: [
          'Multiplier vos estimations par 1.5',
          'Identifier les sources de distraction',
          'Bloquer du temps dédié sans interruption',
          'Utiliser un timer pour rester conscient du temps'
        ],
        affectedItems: slowTasks.map(t => t.title)
      });
    }

    return patterns;
  };

  // Detect productive patterns
  const detectProductivePatterns = (userTasks: Task[]): ProductivityPattern[] => {
    const patterns: ProductivityPattern[] = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Pattern 1: Consistent task completion
    const recentCompletedTasks = userTasks.filter(task =>
      task.status === 'completed' &&
      task.completedAt &&
      task.completedAt >= oneWeekAgo
    );

    if (recentCompletedTasks.length >= 10) {
      patterns.push({
        type: 'productive_time',
        severity: 'low', // Positive pattern
        title: 'Excellente productivité cette semaine',
        description: `Vous avez complété ${recentCompletedTasks.length} tâches cette semaine`,
        evidence: [
          `${recentCompletedTasks.length} tâches complétées`,
          'Rythme de travail soutenu',
          'Bonne gestion des priorités'
        ],
        suggestions: [
          'Maintenir ce rythme sans vous surmener',
          'Prévoir du temps de récupération',
          'Documenter ce qui fonctionne bien',
          'Récompenser vos efforts'
        ],
        affectedItems: recentCompletedTasks.slice(0, 5).map(t => t.title)
      });
    }

    // Pattern 2: Too many simultaneous tasks
    const inProgressTasks = userTasks.filter(task => task.status === 'in_progress');
    if (inProgressTasks.length >= 5) {
      patterns.push({
        type: 'task_overload',
        severity: inProgressTasks.length >= 8 ? 'high' : 'medium',
        title: 'Trop de tâches en parallèle',
        description: `${inProgressTasks.length} tâches sont actuellement en cours`,
        evidence: [
          `${inProgressTasks.length} tâches "en cours"`,
          'Risque de dispersion de l\'attention',
          'Efficacité potentiellement réduite'
        ],
        suggestions: [
          'Limiter à 3 tâches en cours maximum',
          'Terminer avant de commencer du nouveau',
          'Prioriser et mettre en pause certaines tâches',
          'Utiliser la méthode "Getting Things Done"'
        ],
        affectedItems: inProgressTasks.map(t => t.title)
      });
    }

    return patterns;
  };

  // Analyze habit consistency
  const analyzeHabitPatterns = (userHabits: Habit[]): ProductivityPattern[] => {
    const patterns: ProductivityPattern[] = [];

    // Simple analysis - in a real app, you'd analyze habit progress data
    const activeHabits = userHabits.filter(h => h.isActive);

    if (activeHabits.length === 0) {
      patterns.push({
        type: 'habit_neglect',
        severity: 'medium',
        title: 'Aucune habitude active',
        description: 'Vous n\'avez pas d\'habitudes en cours de développement',
        evidence: [
          'Aucune habitude trackée',
          'Manque de routines structurantes',
          'Potentiel d\'amélioration important'
        ],
        suggestions: [
          'Commencer par une habitude simple (5-10 min/jour)',
          'Choisir quelque chose que vous voulez vraiment',
          'Lier la nouvelle habitude à une existante',
          'Commencer petit pour garantir le succès'
        ],
        affectedItems: []
      });
    } else if (activeHabits.length > 5) {
      patterns.push({
        type: 'habit_neglect',
        severity: 'medium',
        title: 'Trop d\'habitudes simultanées',
        description: `${activeHabits.length} habitudes actives peuvent être difficiles à maintenir`,
        evidence: [
          `${activeHabits.length} habitudes en parallèle`,
          'Risque de dilution de l\'effort',
          'Taux de succès potentiellement réduit'
        ],
        suggestions: [
          'Se concentrer sur 2-3 habitudes maximum',
          'Solidifier les habitudes existantes avant d\'en ajouter',
          'Évaluer quelles habitudes apportent le plus de valeur',
          'Mettre en pause les moins importantes temporairement'
        ],
        affectedItems: activeHabits.map(h => h.name)
      });
    }

    return patterns;
  };

  // Calculate productivity scores
  const calculateProductivityMetrics = (userTasks: Task[]): Partial<ProductivityInsight> => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentTasks = userTasks.filter(task => task.createdAt >= oneWeekAgo);

    // Task completion rate
    const completedTasks = recentTasks.filter(task => task.status === 'completed');
    const taskCompletionRate = recentTasks.length > 0 ? (completedTasks.length / recentTasks.length) * 100 : 0;

    // Average task time
    const tasksWithTime = completedTasks.filter(task => task.timeToComplete);
    const averageTaskTime = tasksWithTime.length > 0
      ? tasksWithTime.reduce((sum, task) => sum + task.timeToComplete!, 0) / tasksWithTime.length
      : 0;

    // Procrastination score (simplified)
    const staleTasks = userTasks.filter(task => {
      if (task.status !== 'todo') return false;
      const daysSinceCreated = (now.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated > 2;
    });
    const procrastinationScore = Math.min(100, (staleTasks.length / Math.max(1, userTasks.length)) * 100);

    // Weekly productivity (composite score)
    const weeklyProductivity = Math.max(0, 100 - procrastinationScore + (taskCompletionRate * 0.5));

    return {
      weeklyProductivity: Math.min(100, weeklyProductivity),
      taskCompletionRate,
      averageTaskTime,
      procrastinationScore
    };
  };

  // Generate general recommendations
  const generateRecommendations = (patterns: ProductivityPattern[]): string[] => {
    const recommendations = [];

    if (patterns.some(p => p.type === 'procrastination')) {
      recommendations.push('Utilisez la règle des 2 minutes : si ça prend moins de 2 min, faites-le maintenant');
      recommendations.push('Planifiez vos tâches difficiles aux moments où vous êtes le plus énergique');
    }

    if (patterns.some(p => p.type === 'task_overload')) {
      recommendations.push('Adoptez la matrice d\'Eisenhower pour prioriser (urgent/important)');
      recommendations.push('Bloquez du temps dans votre agenda pour le travail en profondeur');
    }

    if (patterns.some(p => p.type === 'habit_neglect')) {
      recommendations.push('Créez un environnement qui favorise vos bonnes habitudes');
      recommendations.push('Utilisez le "habit stacking" : liez nouvelles habitudes aux existantes');
    }

    // Default recommendations
    if (recommendations.length === 0) {
      recommendations.push('Continuez sur cette voie, vos habitudes de productivité sont bonnes');
      recommendations.push('Expérimentez avec de nouvelles techniques pour rester motivé');
    }

    return recommendations;
  };

  // Create automatic suggestions for critical patterns
  const createProductivitySuggestions = async (patterns: ProductivityPattern[]) => {
    if (!user) return;

    const criticalPatterns = patterns.filter(p => p.severity === 'high');

    for (const pattern of criticalPatterns) {
      try {
        const suggestionData = {
          userId: user.id,
          type: 'task_organization' as const,
          title: `⚠️ ${pattern.title}`,
          description: pattern.description,
          data: {
            patternType: pattern.type,
            severity: pattern.severity,
            evidence: pattern.evidence,
            suggestions: pattern.suggestions,
            affectedItems: pattern.affectedItems
          },
          priority: 'high' as const,
          status: 'pending' as const,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
        };

        await createSuggestion(suggestionData);
        console.log(`💡 Suggestion de productivité créée: ${pattern.title}`);
      } catch (error) {
        console.error('Erreur lors de la création de la suggestion de productivité:', error);
      }
    }
  };

  // Main analysis function
  const analyzeProductivity = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Collect patterns
      const procrastinationPatterns = detectProcrastination(tasks);
      const productivePatterns = detectProductivePatterns(tasks);
      const habitPatterns = analyzeHabitPatterns(habits);

      const allPatterns = [...procrastinationPatterns, ...productivePatterns, ...habitPatterns];

      // Calculate metrics
      const metrics = calculateProductivityMetrics(tasks);

      // Generate recommendations
      const recommendations = generateRecommendations(allPatterns);

      const newInsights: ProductivityInsight = {
        patterns: allPatterns,
        recommendations,
        mostProductiveHour: 9, // Default, could be calculated from task completion times
        ...metrics
      } as ProductivityInsight;

      setInsights(newInsights);

      // Create suggestions for critical patterns
      await createProductivitySuggestions(allPatterns);

    } catch (error) {
      console.error('Error analyzing productivity:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (tasks.length > 0 || habits.length > 0)) {
      analyzeProductivity();
    } else {
      setLoading(false);
    }
  }, [user, tasks, habits]);

  const getPatternsByType = (type: ProductivityPattern['type']) => {
    return insights.patterns.filter(pattern => pattern.type === type);
  };

  const getCriticalPatterns = () => {
    return insights.patterns.filter(pattern => pattern.severity === 'high');
  };

  const getProductivityGrade = (): { grade: string; color: string; message: string } => {
    const score = insights.weeklyProductivity;

    if (score >= 80) {
      return { grade: 'A', color: 'text-green-600', message: 'Excellente productivité' };
    } else if (score >= 60) {
      return { grade: 'B', color: 'text-blue-600', message: 'Bonne productivité' };
    } else if (score >= 40) {
      return { grade: 'C', color: 'text-yellow-600', message: 'Productivité moyenne' };
    } else {
      return { grade: 'D', color: 'text-red-600', message: 'Productivité à améliorer' };
    }
  };

  return {
    insights,
    loading,
    getPatternsByType,
    getCriticalPatterns,
    getProductivityGrade,
    refresh: analyzeProductivity
  };
};