import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

// Bug types
export type BugPriority = 'critical' | 'high' | 'medium' | 'low';
export type BugStatus = 'open' | 'in-progress' | 'testing' | 'resolved' | 'closed';
export type BugCategory = 'feature' | 'bug' | 'improvement' | 'security' | 'performance';

export interface Bug {
  id: string;
  title: string;
  description: string;
  status: BugStatus;
  priority: BugPriority;
  category: BugCategory;
  assignee?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  comments: BugComment[];
  history: BugHistoryEntry[];
}

export interface BugComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

export interface BugHistoryEntry {
  id: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string;
  timestamp: string;
}

export interface BugStats {
  total: number;
  byStatus: Record<BugStatus, number>;
  byPriority: Record<BugPriority, number>;
  byCategory: Record<BugCategory, number>;
  open: number;
  resolved: number;
  closed: number;
  averageResolutionTime: number; // in hours
}

const BUGS_DIR = join(homedir(), 'projects', 'mission-control', 'bugs');
const BUGS_FILE = join(BUGS_DIR, 'bugs.json');

// Initialize storage
async function ensureStorage(): Promise<void> {
  try {
    await mkdir(BUGS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }

  try {
    await readFile(BUGS_FILE, 'utf-8');
  } catch {
    // File doesn't exist, create with empty array
    await writeFile(BUGS_FILE, JSON.stringify({ bugs: [], lastUpdated: new Date().toISOString() }, null, 2));
  }
}

// Load all bugs
export async function loadBugs(): Promise<Bug[]> {
  await ensureStorage();

  const content = await readFile(BUGS_FILE, 'utf-8');
  const data = JSON.parse(content);

  return data.bugs || [];
}

// Save all bugs
async function saveBugs(bugs: Bug[]): Promise<void> {
  await ensureStorage();

  const data = {
    bugs,
    lastUpdated: new Date().toISOString(),
  };

  await writeFile(BUGS_FILE, JSON.stringify(data, null, 2));
}

// Generate unique ID
function generateId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `BUG-${timestamp}-${random}`;
}

// Create a new bug
export async function createBug(
  title: string,
  description: string,
  priority: BugPriority,
  category: BugCategory,
  author: string,
  assignee?: string
): Promise<Bug> {
  const bugs = await loadBugs();

  const now = new Date().toISOString();
  const bug: Bug = {
    id: generateId(),
    title,
    description,
    status: 'open',
    priority,
    category,
    assignee,
    labels: [],
    createdAt: now,
    updatedAt: now,
    comments: [],
    history: [
      {
        id: generateId(),
        field: 'created',
        oldValue: null,
        newValue: title,
        changedBy: author,
        timestamp: now,
      },
    ],
  };

  bugs.push(bug);
  await saveBugs(bugs);

  return bug;
}

// Get all bugs with optional filters
export async function getBugs(filters?: {
  status?: BugStatus;
  priority?: BugPriority;
  category?: BugCategory;
  assignee?: string;
  label?: string;
  search?: string;
}): Promise<Bug[]> {
  const bugs = await loadBugs();

  // Sort by updated date (most recent first)
  bugs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (!filters) {
    return bugs;
  }

  return bugs.filter((bug) => {
    if (filters.status && bug.status !== filters.status) return false;
    if (filters.priority && bug.priority !== filters.priority) return false;
    if (filters.category && bug.category !== filters.category) return false;
    if (filters.assignee && bug.assignee !== filters.assignee) return false;
    if (filters.label && !bug.labels.includes(filters.label)) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        bug.title.toLowerCase().includes(searchLower) ||
        bug.description.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
}

// Get a single bug by ID
export async function getBugById(id: string): Promise<Bug | null> {
  const bugs = await loadBugs();
  return bugs.find((bug) => bug.id === id) || null;
}

// Update a bug
export async function updateBug(
  id: string,
  updates: Partial<Omit<Bug, 'id' | 'createdAt' | 'comments' | 'history'>>,
  changedBy: string
): Promise<Bug | null> {
  const bugs = await loadBugs();
  const index = bugs.findIndex((bug) => bug.id === id);

  if (index === -1) {
    return null;
  }

  const bug = bugs[index];
  const historyEntries: BugHistoryEntry[] = [];

  // Track changes in history
  for (const [key, newValue] of Object.entries(updates)) {
    const oldValue = bug[key as keyof Bug];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      historyEntries.push({
        id: generateId(),
        field: key,
        oldValue,
        newValue,
        changedBy,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Update bug
  bugs[index] = {
    ...bug,
    ...updates,
    updatedAt: new Date().toISOString(),
    history: [...bug.history, ...historyEntries],
  };

  // Set resolvedAt if status changed to resolved or closed
  if (updates.status && (updates.status === 'resolved' || updates.status === 'closed')) {
    if (!bug.resolvedAt) {
      bugs[index].resolvedAt = new Date().toISOString();
    }
  }

  await saveBugs(bugs);

  return bugs[index];
}

// Delete a bug
export async function deleteBug(id: string): Promise<boolean> {
  const bugs = await loadBugs();
  const index = bugs.findIndex((bug) => bug.id === id);

  if (index === -1) {
    return false;
  }

  bugs.splice(index, 1);
  await saveBugs(bugs);

  return true;
}

// Add a comment to a bug
export async function addComment(
  bugId: string,
  author: string,
  content: string
): Promise<Bug | null> {
  const bugs = await loadBugs();
  const index = bugs.findIndex((bug) => bug.id === bugId);

  if (index === -1) {
    return null;
  }

  const comment: BugComment = {
    id: generateId(),
    author,
    content,
    timestamp: new Date().toISOString(),
  };

  bugs[index].comments.push(comment);
  bugs[index].updatedAt = new Date().toISOString();

  await saveBugs(bugs);

  return bugs[index];
}

// Calculate bug statistics
export async function getBugStats(): Promise<BugStats> {
  const bugs = await loadBugs();

  const byStatus: Record<BugStatus, number> = {
    open: 0,
    'in-progress': 0,
    testing: 0,
    resolved: 0,
    closed: 0,
  };

  const byPriority: Record<BugPriority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  const byCategory: Record<BugCategory, number> = {
    feature: 0,
    bug: 0,
    improvement: 0,
    security: 0,
    performance: 0,
  };

  let totalResolutionTime = 0;
  let resolvedCount = 0;

  for (const bug of bugs) {
    byStatus[bug.status]++;
    byPriority[bug.priority]++;
    byCategory[bug.category]++;

    // Calculate resolution time for resolved/closed bugs
    if ((bug.status === 'resolved' || bug.status === 'closed') && bug.resolvedAt) {
      const created = new Date(bug.createdAt).getTime();
      const resolved = new Date(bug.resolvedAt).getTime();
      const hours = (resolved - created) / (1000 * 60 * 60);

      totalResolutionTime += hours;
      resolvedCount++;
    }
  }

  const averageResolutionTime = resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

  return {
    total: bugs.length,
    byStatus,
    byPriority,
    byCategory,
    open: byStatus.open + byStatus['in-progress'] + byStatus.testing,
    resolved: byStatus.resolved,
    closed: byStatus.closed,
    averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
  };
}

// Seed sample bugs if no bugs exist
export async function seedSampleBugs(): Promise<void> {
  const bugs = await loadBugs();

  if (bugs.length > 0) {
    return; // Already has bugs
  }

  const sampleBugs = [
    {
      title: 'Dashboard performance degradation',
      description: 'The dashboard is loading slowly when there are many active sessions. Need to optimize the data fetching and rendering logic.',
      priority: 'high' as BugPriority,
      category: 'performance' as BugCategory,
    },
    {
      title: 'Add dark mode support for bug tracker',
      description: 'Implement dark mode toggle and styling for the new bug tracker panel.',
      priority: 'medium' as BugPriority,
      category: 'feature' as BugCategory,
    },
    {
      title: 'Fix session history filter bug',
      description: 'The date filter in the session history component is not correctly filtering sessions before the selected date.',
      priority: 'critical' as BugPriority,
      category: 'bug' as BugCategory,
    },
    {
      title: 'Add keyboard shortcuts',
      description: 'Implement keyboard shortcuts for common actions like creating a new bug, searching, and navigating between bugs.',
      priority: 'low' as BugPriority,
      category: 'improvement' as BugCategory,
    },
    {
      title: 'Secure API endpoints',
      description: 'Review and implement authentication for all API endpoints that handle sensitive data.',
      priority: 'high' as BugPriority,
      category: 'security' as BugCategory,
    },
  ];

  for (const sample of sampleBugs) {
    await createBug(
      sample.title,
      sample.description,
      sample.priority,
      sample.category,
      'System'
    );
  }
}
