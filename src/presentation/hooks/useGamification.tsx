'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTasks } from './useTasks';
import { useHabits } from './useHabits';
import { useFinance } from './useFinance';
import { Badge, UserBadge, UserLevel } from '@/src/shared/types';

interface GamificationStats {
  totalPoints: number;
  level: number;
  levelProgress: number; // percentage to next level
  pointsToNextLevel: number;
  badges: UserBadge[];
  recentAchievements: UserBadge[];
}

const BADGES_DEFINITIONS: Badge[] = [
  // Habit badges
  {
    id: 'habit_starter',
    name: 'Premiers pas',
    description: 'Créez votre première habitude',
    icon: '🌱',
    type: 'habit',
    criteria: { type: 'habits_created', value: 1 }
  },
  {
    id: 'habit_master',
    name: 'Maître des habitudes',
    description: 'Créez 10 habitudes',
    icon: '🏆',
    type: 'habit',
    criteria: { type: 'habits_created', value: 10 }
  },
  {
    id: 'streak_week',
    name: 'Une semaine forte',
    description: 'Maintenez une habitude pendant 7 jours consécutifs',
    icon: '🔥',
    type: 'streak',
    criteria: { type: 'max_streak', value: 7 }
  },
  {
    id: 'streak_month',
    name: 'Champion du mois',
    description: 'Maintenez une habitude pendant 30 jours consécutifs',
    icon: '💪',
    type: 'streak',
    criteria: { type: 'max_streak', value: 30 }
  },

  // Task badges
  {
    id: 'task_completer',
    name: 'Finisseur',
    description: 'Complétez votre première tâche',
    icon: '✅',
    type: 'task',
    criteria: { type: 'tasks_completed', value: 1 }
  },
  {
    id: 'productivity_hero',
    name: 'Héros de la productivité',
    description: 'Complétez 100 tâches',
    icon: '🚀',
    type: 'task',
    criteria: { type: 'tasks_completed', value: 100 }
  },
  {
    id: 'speed_demon',
    name: 'Démon de vitesse',
    description: 'Complétez une tâche en moins de 5 minutes',
    icon: '⚡',
    type: 'task',
    criteria: { type: 'fast_completion', value: 5 }
  },

  // Finance badges
  {
    id: 'budget_keeper',
    name: 'Gardien du budget',
    description: 'Respectez tous vos budgets pendant un mois',
    icon: '💰',
    type: 'finance',
    criteria: { type: 'budget_compliance', value: 100, period: 'month' }
  },
  {
    id: 'saver',
    name: 'Épargnant',
    description: 'Économisez 50 000 FCFA',
    icon: '🏦',
    type: 'finance',
    criteria: { type: 'total_savings', value: 50000 }
  },
  {
    id: 'goal_achiever',
    name: 'Objectifs atteints',
    description: 'Atteignez votre premier objectif financier',
    icon: '🎯',
    type: 'finance',
    criteria: { type: 'goals_achieved', value: 1 }
  }
];

export const useGamification = () => {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const { transactions, budgets, goals } = useFinance();

  const [stats, setStats] = useState<GamificationStats>({
    totalPoints: 0,
    level: 1,
    levelProgress: 0,
    pointsToNextLevel: 100,
    badges: [],
    recentAchievements: []
  });
  const [loading, setLoading] = useState(true);

  // Points system
  const POINTS_SYSTEM = {
    HABIT_CREATED: 10,
    HABIT_COMPLETED: 5,
    TASK_COMPLETED: 3,
    TASK_COMPLETED_EARLY: 5,
    BUDGET_RESPECTED: 20,
    GOAL_ACHIEVED: 50,
    STREAK_DAY: 2,
    BADGE_EARNED: 25
  };

  // Calculate level from points
  const calculateLevel = (points: number): { level: number; progress: number; pointsToNext: number } => {
    const basePoints = 100;
    const growthFactor = 1.5;

    let level = 1;
    let totalPointsForLevel = 0;

    while (totalPointsForLevel <= points) {
      const pointsForCurrentLevel = Math.floor(basePoints * Math.pow(growthFactor, level - 1));
      totalPointsForLevel += pointsForCurrentLevel;

      if (totalPointsForLevel > points) {
        break;
      }
      level++;
    }

    const pointsForCurrentLevel = Math.floor(basePoints * Math.pow(growthFactor, level - 1));
    const pointsAtLevelStart = totalPointsForLevel - pointsForCurrentLevel;
    const progressInLevel = points - pointsAtLevelStart;
    const progress = (progressInLevel / pointsForCurrentLevel) * 100;
    const pointsToNext = pointsForCurrentLevel - progressInLevel;

    return { level, progress, pointsToNext };
  };

  // Calculate user statistics
  const calculateStats = async (): Promise<GamificationStats> => {
    if (!user) {
      return {
        totalPoints: 0,
        level: 1,
        levelProgress: 0,
        pointsToNextLevel: 100,
        badges: [],
        recentAchievements: []
      };
    }

    let totalPoints = 0;
    const earnedBadges: UserBadge[] = [];

    // Count completed tasks
    const completedTasks = tasks.filter(task => task.status === 'completed');
    totalPoints += completedTasks.length * POINTS_SYSTEM.TASK_COMPLETED;

    // Count fast completions (bonus points)
    const fastTasks = completedTasks.filter(task =>
      task.timeToComplete && task.timeToComplete <= 5
    );
    totalPoints += fastTasks.length * POINTS_SYSTEM.TASK_COMPLETED_EARLY;

    // Count active habits
    const activeHabits = habits.filter(habit => habit.isActive);
    totalPoints += activeHabits.length * POINTS_SYSTEM.HABIT_CREATED;

    // Calculate habit streaks (simplified for demo)
    // TODO: Implement proper streak calculation
    totalPoints += activeHabits.length * 7 * POINTS_SYSTEM.STREAK_DAY; // Assume 7-day average streak

    // Count achieved goals
    const achievedGoals = goals.filter(goal => goal.currentAmount >= goal.targetAmount);
    totalPoints += achievedGoals.length * POINTS_SYSTEM.GOAL_ACHIEVED;

    // Check budget compliance (simplified)
    const currentMonth = new Date().getMonth();
    const budgetCompliance = budgets.length > 0 ? 1 : 0; // Simplified
    totalPoints += budgetCompliance * POINTS_SYSTEM.BUDGET_RESPECTED;

    // Check for earned badges
    for (const badgeDefinition of BADGES_DEFINITIONS) {
      let earned = false;

      switch (badgeDefinition.criteria.type) {
        case 'habits_created':
          earned = activeHabits.length >= badgeDefinition.criteria.value;
          break;
        case 'tasks_completed':
          earned = completedTasks.length >= badgeDefinition.criteria.value;
          break;
        case 'fast_completion':
          earned = fastTasks.length > 0;
          break;
        case 'goals_achieved':
          earned = achievedGoals.length >= badgeDefinition.criteria.value;
          break;
        case 'max_streak':
          // Simplified - assume some users have streaks
          earned = activeHabits.length > 0 && badgeDefinition.criteria.value <= 7;
          break;
        case 'budget_compliance':
          earned = budgetCompliance > 0;
          break;
        case 'total_savings':
          const totalSavings = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          earned = totalSavings >= badgeDefinition.criteria.value;
          break;
      }

      if (earned) {
        const userBadge: UserBadge = {
          id: `${user.id}_${badgeDefinition.id}`,
          userId: user.id,
          badgeId: badgeDefinition.id,
          badge: badgeDefinition,
          earnedAt: new Date(),
          notificationSent: false,
          isNew: false // Would be true for recently earned badges
        };
        earnedBadges.push(userBadge);
        totalPoints += POINTS_SYSTEM.BADGE_EARNED;
      }
    }

    const { level, progress, pointsToNext } = calculateLevel(totalPoints);

    return {
      totalPoints,
      level,
      levelProgress: progress,
      pointsToNextLevel: pointsToNext,
      badges: earnedBadges,
      recentAchievements: earnedBadges.filter(badge => badge.isNew)
    };
  };

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const newStats = await calculateStats();
        setStats(newStats);
      } catch (error) {
        console.error('Error calculating gamification stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadStats();
    }
  }, [user, tasks, habits, transactions, budgets, goals]);

  const getBadgesByType = (type: Badge['type']) => {
    return stats.badges.filter(userBadge => userBadge.badge.type === type);
  };

  const getNextBadgeToEarn = (): Badge | null => {
    const earnedBadgeIds = stats.badges.map(ub => ub.badgeId);
    const unearnedBadges = BADGES_DEFINITIONS.filter(badge =>
      !earnedBadgeIds.includes(badge.id)
    );

    // Return the first unearned badge (could be improved with better logic)
    return unearnedBadges[0] || null;
  };

  const getLevelInfo = (level: number) => {
    const levelNames = [
      'Débutant', 'Novice', 'Apprenti', 'Compétent', 'Expert',
      'Maître', 'Virtuose', 'Légende', 'Titan', 'Divin'
    ];

    return {
      name: levelNames[Math.min(level - 1, levelNames.length - 1)] || 'Suprême',
      color: level <= 2 ? 'text-gray-600' :
             level <= 4 ? 'text-green-600' :
             level <= 6 ? 'text-blue-600' :
             level <= 8 ? 'text-purple-600' :
             'text-yellow-600'
    };
  };

  return {
    stats,
    loading,
    getBadgesByType,
    getNextBadgeToEarn,
    getLevelInfo,
    badgeDefinitions: BADGES_DEFINITIONS,
    refresh: () => calculateStats().then(setStats)
  };
};