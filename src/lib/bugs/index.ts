import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import {
  Bug,
  BugIndex,
  CreateBugInput,
  UpdateBugInput,
  BugFilters,
  BugStats,
  TestFailure,
} from './types';

export class BugService {
  private bugsDir: string;
  private indexPath: string;

  constructor() {
    const home = os.homedir();
    this.bugsDir = path.join(home, '.openclaw/workspace/bugs');
    this.indexPath = path.join(this.bugsDir, 'index.json');
  }

  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(path.join(this.bugsDir, 'bugs'), { recursive: true });
    await fs.mkdir(path.join(this.bugsDir, 'evidence'), { recursive: true });
  }

  private async loadIndex(): Promise<BugIndex> {
    try {
      const data = await fs.readFile(this.indexPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      // Initialize if doesn't exist
      const index: BugIndex = { bugs: [], lastId: 0 };
      await this.saveIndex(index);
      return index;
    }
  }

  private async saveIndex(index: BugIndex): Promise<void> {
    await this.ensureDirectories();
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
  }

  private async loadBug(id: string): Promise<Bug | null> {
    try {
      const bugPath = path.join(this.bugsDir, 'bugs', `${id}.json`);
      const data = await fs.readFile(bugPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private async saveBug(bug: Bug): Promise<void> {
    await this.ensureDirectories();
    const bugPath = path.join(this.bugsDir, 'bugs', `${bug.id}.json`);
    await fs.writeFile(bugPath, JSON.stringify(bug, null, 2));
  }

  private generateId(lastId: number): string {
    const newId = lastId + 1;
    return `BUG-${newId.toString().padStart(3, '0')}`;
  }

  private applyFilters(bugs: Bug[], filters: BugFilters): Bug[] {
    let filtered = [...bugs];

    if (filters.project) {
      filtered = filtered.filter(b => b.project === filters.project);
    }
    if (filters.severity) {
      filtered = filtered.filter(b => b.severity === filters.severity);
    }
    if (filters.status) {
      filtered = filtered.filter(b => b.status === filters.status);
    }
    if (filters.assignedTo) {
      filtered = filtered.filter(b => b.assignedTo === filters.assignedTo);
    }

    return filtered;
  }

  async list(filters: BugFilters = {}): Promise<{ bugs: Bug[], total: number }> {
    const index = await this.loadIndex();
    let bugs = index.bugs;

    // Apply filters
    bugs = this.applyFilters(bugs, filters);

    // Sort by created date (newest first)
    bugs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginatedBugs = bugs.slice(offset, offset + limit);

    return {
      bugs: paginatedBugs,
      total: bugs.length
    };
  }

  async get(id: string): Promise<Bug | null> {
    return await this.loadBug(id);
  }

  async create(input: CreateBugInput): Promise<Bug> {
    const index = await this.loadIndex();
    const id = this.generateId(index.lastId);

    const bug: Bug = {
      id,
      ...input,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.saveBug(bug);

    // Update index
    index.bugs.push(bug);
    index.lastId++;
    await this.saveIndex(index);

    return bug;
  }

  async update(id: string, input: UpdateBugInput): Promise<Bug | null> {
    const bug = await this.loadBug(id);
    if (!bug) return null;

    const updatedBug: Bug = {
      ...bug,
      ...input,
      updatedAt: new Date().toISOString()
    };

    // If status changed to 'fixed', set fixedAt
    if (input.status === 'fixed' && bug.status !== 'fixed') {
      updatedBug.fixedAt = new Date().toISOString();
    }

    await this.saveBug(updatedBug);

    // Update in index
    const index = await this.loadIndex();
    const bugIndex = index.bugs.findIndex(b => b.id === id);
    if (bugIndex !== -1) {
      index.bugs[bugIndex] = updatedBug;
      await this.saveIndex(index);
    }

    return updatedBug;
  }

  async delete(id: string): Promise<boolean> {
    const bug = await this.loadBug(id);
    if (!bug) return false;

    // Remove bug file
    const bugPath = path.join(this.bugsDir, 'bugs', `${id}.json`);
    await fs.unlink(bugPath);

    // Update index
    const index = await this.loadIndex();
    index.bugs = index.bugs.filter(b => b.id !== id);
    await this.saveIndex(index);

    return true;
  }

  async getStats(): Promise<BugStats> {
    const { bugs } = await this.list({});
    
    const openBugs = bugs.filter(b => !['fixed', 'wont-fix'].includes(b.status));
    
    const stats: BugStats = {
      total: bugs.length,
      open: openBugs.length,
      critical: openBugs.filter(b => b.severity === 'critical').length,
      high: openBugs.filter(b => b.severity === 'high').length,
      medium: openBugs.filter(b => b.severity === 'medium').length,
      low: openBugs.filter(b => b.severity === 'low').length,
      byProject: {
        'cryptomon': openBugs.filter(b => b.project === 'cryptomon').length,
        'mission-control': openBugs.filter(b => b.project === 'mission-control').length,
        'content-pipeline': openBugs.filter(b => b.project === 'content-pipeline').length,
        'cohera': openBugs.filter(b => b.project === 'cohera').length,
        'q-system': openBugs.filter(b => b.project === 'q-system').length
      },
      byStatus: {
        'new': bugs.filter(b => b.status === 'new').length,
        'investigating': bugs.filter(b => b.status === 'investigating').length,
        'in-progress': bugs.filter(b => b.status === 'in-progress').length,
        'fixed': bugs.filter(b => b.status === 'fixed').length,
        'wont-fix': bugs.filter(b => b.status === 'wont-fix').length,
        'cannot-reproduce': bugs.filter(b => b.status === 'cannot-reproduce').length
      },
      fixedThisWeek: this.countFixedThisWeek(bugs)
    };

    return stats;
  }

  private countFixedThisWeek(bugs: Bug[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return bugs.filter(b => {
      if (!b.fixedAt) return false;
      const fixedDate = new Date(b.fixedAt);
      return fixedDate >= oneWeekAgo;
    }).length;
  }

  async createFromTestFailure(failure: TestFailure): Promise<Bug> {
    return this.create({
      title: `Test failure: ${failure.featureName}`,
      description: failure.errorMessage,
      project: failure.project,
      severity: 'high',
      source: 'testing',
      logs: failure.logs,
      screenshots: failure.screenshots,
      stepsToReproduce: failure.testSteps
    });
  }

  async createFromBuildFailure(project: string, error: string): Promise<Bug> {
    return this.create({
      title: `Build failure: ${project}`,
      description: error,
      project: project as 'cryptomon' | 'mission-control' | 'content-pipeline' | 'cohera' | 'q-system',
      severity: 'high',
      source: 'build',
      logs: error
    });
  }
}

// Export singleton instance
export const bugService = new BugService();

// Export types
export * from './types';
