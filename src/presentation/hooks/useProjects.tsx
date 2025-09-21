'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useFinance } from './useFinance';
import { useTasks } from './useTasks';
import { ProjectRepository } from '@/src/data/repositories/projectRepository';
import { Project, ProjectCategory, ProjectBudget, Budget, Transaction, Task } from '@/src/shared/types';

const projectRepository = new ProjectRepository();

export const useProjects = () => {
  const { user } = useAuth();
  const { budgets, transactions, updateTransaction } = useFinance();

  // Créer une fonction wrapper pour mettre à jour les transactions
  const handleTransactionUpdate = (transactionId: string, updates: any) => {
    updateTransaction(transactionId, updates);
  };

  const { tasks, updateTask } = useTasks(handleTransactionUpdate);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectCategories, setProjectCategories] = useState<ProjectCategory[]>([]);
  const [projectBudgets, setProjectBudgets] = useState<ProjectBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les données des projets
  const loadProjectData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [
        userProjects,
        userProjectCategories
      ] = await Promise.all([
        projectRepository.getProjectsByUserId(user.id),
        projectRepository.getProjectCategoriesByUserId(user.id)
      ]);

      setProjects(userProjects);
      setProjectCategories(userProjectCategories);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des données des projets');
      console.error('Error loading project data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectData();
  }, [user]);

  // Calculer les métriques d'un projet en temps réel
  const calculateProjectMetrics = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    const projectTransactions = transactions.filter(transaction => transaction.projectId === projectId);

    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const actualSpent = projectTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalTasks,
      completedTasks,
      totalTransactions: projectTransactions.length,
      completionPercentage,
      actualSpent
    };
  };

  // ===== PROJETS =====
  const createProject = async (projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'actualSpent' | 'completionPercentage' | 'totalTasks' | 'completedTasks' | 'totalTransactions'>) => {
    if (!user) throw new Error('User not authenticated');

    const now = new Date();
    const newProject: Omit<Project, 'id'> = {
      ...projectData,
      userId: user.id,
      actualSpent: 0,
      completionPercentage: 0,
      totalTasks: 0,
      completedTasks: 0,
      totalTransactions: 0,
      budgetIds: projectData.budgetIds || [],
      goalIds: projectData.goalIds || [],
      createdAt: now,
      updatedAt: now
    };

    try {
      const projectId = await projectRepository.createProject(newProject);
      console.log('Project created with ID:', projectId);

      const createdProject: Project = {
        id: projectId,
        ...newProject
      };

      setProjects(prevProjects => [createdProject, ...prevProjects]);
      return true;
    } catch (err) {
      setError('Erreur lors de la création du projet');
      console.error('Error creating project:', err);
      return false;
    }
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      await projectRepository.updateProject(projectId, updates);

      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId
            ? { ...project, ...updates, updatedAt: new Date() }
            : project
        )
      );

      return true;
    } catch (err) {
      setError('Erreur lors de la mise à jour du projet');
      console.error('Error updating project:', err);
      await loadProjectData();
      return false;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await projectRepository.deleteProject(projectId);
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId
            ? { ...project, isArchived: true, updatedAt: new Date() }
            : project
        )
      );
      return true;
    } catch (err) {
      setError('Erreur lors de la suppression du projet');
      console.error('Error deleting project:', err);
      await loadProjectData();
      return false;
    }
  };

  const updateProjectMetrics = async (projectId: string) => {
    const metrics = calculateProjectMetrics(projectId);
    try {
      await projectRepository.updateProjectMetrics(projectId, metrics);

      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId
            ? { ...project, ...metrics, updatedAt: new Date() }
            : project
        )
      );

      return true;
    } catch (err) {
      console.error('Error updating project metrics:', err);
      return false;
    }
  };

  // 🔧 FONCTION DE RECALCUL FORCÉ : Pour corriger les transactions non comptabilisées
  const recalculateProjectMetrics = async (projectId: string) => {
    try {
      console.log(`🔄 Recalcul forcé des métriques pour le projet ${projectId}`);

      // Recalculer les métriques avec les données actuelles
      const metrics = calculateProjectMetrics(projectId);

      // Forcer la mise à jour en base de données
      await projectRepository.updateProjectMetrics(projectId, metrics);

      // Mettre à jour l'état local immédiatement
      setProjects(prevProjects =>
        prevProjects.map(project =>
          project.id === projectId
            ? {
                ...project,
                ...metrics,
                updatedAt: new Date(),
                // Force les nouvelles valeurs même si elles existaient
                actualSpent: metrics.actualSpent,
                completionPercentage: metrics.completionPercentage,
                totalTasks: metrics.totalTasks,
                completedTasks: metrics.completedTasks,
                totalTransactions: metrics.totalTransactions
              }
            : project
        )
      );

      console.log(`✅ Métriques recalculées avec succès:`, metrics);
      return { success: true, metrics };
    } catch (err) {
      console.error('Erreur lors du recalcul des métriques:', err);
      return { success: false, error: err };
    }
  };

  // ===== CATÉGORIES DE PROJETS =====
  const createProjectCategory = async (categoryData: Omit<ProjectCategory, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const newCategory: Omit<ProjectCategory, 'id'> = {
      ...categoryData,
      userId: user.id,
      createdAt: new Date()
    };

    try {
      const categoryId = await projectRepository.createProjectCategory(newCategory);

      const createdCategory: ProjectCategory = {
        id: categoryId,
        ...newCategory
      };

      setProjectCategories(prevCategories => [...prevCategories, createdCategory]);
      return true;
    } catch (err) {
      setError('Erreur lors de la création de la catégorie de projet');
      console.error('Error creating project category:', err);
      return false;
    }
  };

  const updateProjectCategory = async (categoryId: string, updates: Partial<ProjectCategory>) => {
    try {
      await projectRepository.updateProjectCategory(categoryId, updates);

      setProjectCategories(prevCategories =>
        prevCategories.map(category =>
          category.id === categoryId
            ? { ...category, ...updates }
            : category
        )
      );

      return true;
    } catch (err) {
      setError('Erreur lors de la mise à jour de la catégorie');
      console.error('Error updating project category:', err);
      await loadProjectData();
      return false;
    }
  };

  const deleteProjectCategory = async (categoryId: string) => {
    try {
      await projectRepository.deleteProjectCategory(categoryId);
      setProjectCategories(prevCategories =>
        prevCategories.filter(category => category.id !== categoryId)
      );

      return true;
    } catch (err) {
      setError('Erreur lors de la suppression de la catégorie');
      console.error('Error deleting project category:', err);
      await loadProjectData();
      return false;
    }
  };

  // ===== LIAISON AVEC BUDGETS =====
  const linkBudgetToProject = async (projectId: string, budgetId: string, allocatedAmount: number) => {
    try {
      const projectBudget: Omit<ProjectBudget, 'id'> = {
        projectId,
        budgetId,
        allocatedAmount,
        spentAmount: 0,
        createdAt: new Date()
      };

      const projectBudgetId = await projectRepository.createProjectBudget(projectBudget);

      // Mettre à jour le projet pour inclure le budget
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const updatedBudgetIds = [...(project.budgetIds || []), budgetId];
        await updateProject(projectId, { budgetIds: updatedBudgetIds });
      }

      setProjectBudgets(prev => [...prev, { id: projectBudgetId, ...projectBudget }]);
      return true;
    } catch (err) {
      setError('Erreur lors de la liaison du budget au projet');
      console.error('Error linking budget to project:', err);
      return false;
    }
  };

  const unlinkBudgetFromProject = async (projectId: string, budgetId: string) => {
    try {
      const projectBudget = projectBudgets.find(pb => pb.projectId === projectId && pb.budgetId === budgetId);
      if (projectBudget) {
        await projectRepository.deleteProjectBudget(projectBudget.id);
        setProjectBudgets(prev => prev.filter(pb => pb.id !== projectBudget.id));
      }

      // Mettre à jour le projet pour retirer le budget
      const project = projects.find(p => p.id === projectId);
      if (project && project.budgetIds) {
        const updatedBudgetIds = project.budgetIds.filter(id => id !== budgetId);
        await updateProject(projectId, { budgetIds: updatedBudgetIds });
      }

      return true;
    } catch (err) {
      setError('Erreur lors de la suppression de la liaison budget-projet');
      console.error('Error unlinking budget from project:', err);
      return false;
    }
  };

  // ===== SYNCHRONISATION AVEC TRANSACTIONS ET TÂCHES =====
  const linkTransactionToProject = async (transactionId: string, projectId: string) => {
    try {
      await updateTransaction(transactionId, { projectId });

      // Si la transaction a une tâche liée, lier aussi la tâche au projet
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction?.linkedTaskId) {
        await linkTaskToProject(transaction.linkedTaskId, projectId);
      }

      // Mettre à jour les métriques du projet
      await updateProjectMetrics(projectId);

      return true;
    } catch (err) {
      setError('Erreur lors de la liaison de la transaction au projet');
      console.error('Error linking transaction to project:', err);
      return false;
    }
  };

  const linkTaskToProject = async (taskId: string, projectId: string) => {
    try {
      await updateTask(taskId, { projectId });

      // Si la tâche a une transaction liée, lier aussi la transaction au projet
      const task = tasks.find(t => t.id === taskId);
      if (task?.transactionId) {
        await linkTransactionToProject(task.transactionId, projectId);
      }

      // Mettre à jour les métriques du projet
      await updateProjectMetrics(projectId);

      return true;
    } catch (err) {
      setError('Erreur lors de la liaison de la tâche au projet');
      console.error('Error linking task to project:', err);
      return false;
    }
  };

  // ===== UTILITAIRES =====
  const getProjectsByStatus = (status: Project['status']) => {
    return projects.filter(project => project.status === status && !project.isArchived);
  };

  const getActiveProjects = () => {
    return projects.filter(project => project.status === 'active' && !project.isArchived);
  };

  const getProjectById = (projectId: string): Project | undefined => {
    return projects.find(project => project.id === projectId);
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getProjectTransactions = (projectId: string) => {
    return transactions.filter(transaction => transaction.projectId === projectId);
  };

  const getProjectBudgets = (projectId: string): Budget[] => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.budgetIds) return [];

    return budgets.filter(budget => project.budgetIds.includes(budget.id));
  };

  const getProjectFinancialSummary = (projectId: string) => {
    const projectTransactions = getProjectTransactions(projectId);
    const projectBudgets = getProjectBudgets(projectId);

    const income = projectTransactions
      .filter(t => t.type === 'income' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = projectTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const budgetTotal = projectBudgets.reduce((sum, budget) => sum + budget.amount, 0);
    const budgetSpent = projectBudgets.reduce((sum, budget) => sum + budget.spent, 0);

    return {
      income,
      expenses,
      netAmount: income - expenses,
      budgetTotal,
      budgetSpent,
      budgetRemaining: budgetTotal - budgetSpent,
      budgetUtilization: budgetTotal > 0 ? (budgetSpent / budgetTotal) * 100 : 0
    };
  };

  const getProjectsStatistics = async () => {
    try {
      return await projectRepository.getProjectStatistics(user!.id);
    } catch (err) {
      console.error('Error getting project statistics:', err);
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalBudget: 0,
        totalSpent: 0,
        averageCompletion: 0
      };
    }
  };

  return {
    // Data
    projects,
    projectCategories,
    projectBudgets,
    loading,
    error,

    // Project methods
    createProject,
    updateProject,
    deleteProject,
    updateProjectMetrics,
    recalculateProjectMetrics,

    // Category methods
    createProjectCategory,
    updateProjectCategory,
    deleteProjectCategory,

    // Budget linking methods
    linkBudgetToProject,
    unlinkBudgetFromProject,

    // Task/Transaction linking methods
    linkTransactionToProject,
    linkTaskToProject,

    // Utility methods
    getProjectsByStatus,
    getActiveProjects,
    getProjectById,
    getProjectTasks,
    getProjectTransactions,
    getProjectBudgets,
    getProjectFinancialSummary,
    getProjectsStatistics,
    calculateProjectMetrics,

    // General
    refetch: loadProjectData
  };
};