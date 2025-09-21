import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  increment,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/src/infrastructure/firebase/config';
import { Project, ProjectCategory, ProjectBudget, ProjectReport } from '@/src/shared/types';

export class ProjectRepository {
  private projectsCollection = 'projects';
  private projectCategoriesCollection = 'projectCategories';
  private projectBudgetsCollection = 'projectBudgets';

  // ===== PROJECTS =====
  async createProject(project: Omit<Project, 'id'>): Promise<string> {
    const cleanedProject = this.cleanProjectData({
      ...project,
      startDate: project.startDate ? Timestamp.fromDate(project.startDate) : undefined,
      endDate: project.endDate ? Timestamp.fromDate(project.endDate) : undefined,
      createdAt: Timestamp.fromDate(project.createdAt),
      updatedAt: Timestamp.fromDate(project.updatedAt)
    });

    const docRef = await addDoc(collection(db, this.projectsCollection), cleanedProject);
    return docRef.id;
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const projectRef = doc(db, this.projectsCollection, projectId);
    const cleanedUpdates = this.cleanProjectData({
      ...updates,
      updatedAt: Timestamp.now(),
      startDate: updates.startDate ? Timestamp.fromDate(updates.startDate) : undefined,
      endDate: updates.endDate ? Timestamp.fromDate(updates.endDate) : undefined
    });
    await updateDoc(projectRef, cleanedUpdates);
  }

  async deleteProject(projectId: string): Promise<void> {
    const projectRef = doc(db, this.projectsCollection, projectId);
    await updateDoc(projectRef, {
      isArchived: true,
      updatedAt: Timestamp.now()
    });
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    const q = query(
      collection(db, this.projectsCollection),
      where('userId', '==', userId),
      where('isArchived', '==', false),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate ? doc.data().startDate.toDate() : undefined,
      endDate: doc.data().endDate ? doc.data().endDate.toDate() : undefined,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    } as Project));
  }

  async getActiveProjectsByUserId(userId: string): Promise<Project[]> {
    const q = query(
      collection(db, this.projectsCollection),
      where('userId', '==', userId),
      where('isArchived', '==', false),
      where('status', '==', 'active'),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate ? doc.data().startDate.toDate() : undefined,
      endDate: doc.data().endDate ? doc.data().endDate.toDate() : undefined,
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    } as Project));
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    const projectRef = doc(db, this.projectsCollection, projectId);
    const docSnap = await getDoc(projectRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        startDate: docSnap.data().startDate ? docSnap.data().startDate.toDate() : undefined,
        endDate: docSnap.data().endDate ? docSnap.data().endDate.toDate() : undefined,
        createdAt: docSnap.data().createdAt.toDate(),
        updatedAt: docSnap.data().updatedAt.toDate()
      } as Project;
    }

    return null;
  }

  async updateProjectMetrics(projectId: string, metrics: {
    completionPercentage?: number;
    totalTasks?: number;
    completedTasks?: number;
    totalTransactions?: number;
    actualSpent?: number;
  }): Promise<void> {
    const projectRef = doc(db, this.projectsCollection, projectId);
    const cleanedMetrics = this.cleanProjectData({
      ...metrics,
      updatedAt: Timestamp.now()
    });
    await updateDoc(projectRef, cleanedMetrics);
  }

  // ===== PROJECT CATEGORIES =====
  async createProjectCategory(category: Omit<ProjectCategory, 'id'>): Promise<string> {
    const cleanedCategory = this.cleanProjectData({
      ...category,
      createdAt: Timestamp.fromDate(category.createdAt)
    });

    const docRef = await addDoc(collection(db, this.projectCategoriesCollection), cleanedCategory);
    return docRef.id;
  }

  async getProjectCategoriesByUserId(userId: string): Promise<ProjectCategory[]> {
    const q = query(
      collection(db, this.projectCategoriesCollection),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    } as ProjectCategory));
  }

  async updateProjectCategory(categoryId: string, updates: Partial<ProjectCategory>): Promise<void> {
    const categoryRef = doc(db, this.projectCategoriesCollection, categoryId);
    const cleanedUpdates = this.cleanProjectData(updates);
    await updateDoc(categoryRef, cleanedUpdates);
  }

  async deleteProjectCategory(categoryId: string): Promise<void> {
    const categoryRef = doc(db, this.projectCategoriesCollection, categoryId);
    await updateDoc(categoryRef, { isActive: false });
  }

  // ===== PROJECT BUDGETS =====
  async createProjectBudget(projectBudget: Omit<ProjectBudget, 'id'>): Promise<string> {
    const cleanedProjectBudget = this.cleanProjectData({
      ...projectBudget,
      createdAt: Timestamp.fromDate(projectBudget.createdAt)
    });

    const docRef = await addDoc(collection(db, this.projectBudgetsCollection), cleanedProjectBudget);
    return docRef.id;
  }

  async getProjectBudgetsByProjectId(projectId: string): Promise<ProjectBudget[]> {
    const q = query(
      collection(db, this.projectBudgetsCollection),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    } as ProjectBudget));
  }

  async updateProjectBudget(projectBudgetId: string, updates: Partial<ProjectBudget>): Promise<void> {
    const projectBudgetRef = doc(db, this.projectBudgetsCollection, projectBudgetId);
    const cleanedUpdates = this.cleanProjectData(updates);
    await updateDoc(projectBudgetRef, cleanedUpdates);
  }

  async deleteProjectBudget(projectBudgetId: string): Promise<void> {
    const projectBudgetRef = doc(db, this.projectBudgetsCollection, projectBudgetId);
    await deleteDoc(projectBudgetRef);
  }

  // ===== BATCH OPERATIONS =====
  async updateProjectWithBudgets(
    projectId: string,
    projectUpdates: Partial<Project>,
    budgetOperations: {
      toAdd: Omit<ProjectBudget, 'id'>[];
      toUpdate: { id: string; updates: Partial<ProjectBudget> }[];
      toDelete: string[];
    }
  ): Promise<void> {
    const batch = writeBatch(db);

    // Mettre à jour le projet
    const projectRef = doc(db, this.projectsCollection, projectId);
    const cleanedProjectUpdates = this.cleanProjectData({
      ...projectUpdates,
      updatedAt: Timestamp.now()
    });
    batch.update(projectRef, cleanedProjectUpdates);

    // Ajouter nouveaux budgets
    budgetOperations.toAdd.forEach(budget => {
      const budgetRef = doc(collection(db, this.projectBudgetsCollection));
      const cleanedBudget = this.cleanProjectData({
        ...budget,
        createdAt: Timestamp.now()
      });
      batch.set(budgetRef, cleanedBudget);
    });

    // Mettre à jour budgets existants
    budgetOperations.toUpdate.forEach(({ id, updates }) => {
      const budgetRef = doc(db, this.projectBudgetsCollection, id);
      const cleanedUpdates = this.cleanProjectData(updates);
      batch.update(budgetRef, cleanedUpdates);
    });

    // Supprimer budgets
    budgetOperations.toDelete.forEach(budgetId => {
      const budgetRef = doc(db, this.projectBudgetsCollection, budgetId);
      batch.delete(budgetRef);
    });

    await batch.commit();
  }

  // ===== HELPER METHODS =====
  private cleanProjectData(data: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};

    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length === 0) {
          if (['tags', 'budgetIds', 'goalIds'].includes(key)) {
            return;
          }
        }
        cleaned[key] = value;
      }
    });

    return cleaned;
  }

  // ===== STATISTICS AND REPORTS =====
  async getProjectStatistics(userId: string): Promise<{
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    totalBudget: number;
    totalSpent: number;
    averageCompletion: number;
  }> {
    const projects = await this.getProjectsByUserId(userId);

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0),
      totalSpent: projects.reduce((sum, p) => sum + p.actualSpent, 0),
      averageCompletion: projects.length > 0
        ? projects.reduce((sum, p) => sum + p.completionPercentage, 0) / projects.length
        : 0
    };

    return stats;
  }
}