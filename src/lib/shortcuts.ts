/**
 * Keyboard Shortcuts System
 *
 * Central definitions for all keyboard shortcuts in Mission Control.
 */

export type ShortcutCategory = 'global' | 'navigation' | 'panel' | 'action';

export interface Shortcut {
  key: string;
  description: string;
  category: ShortcutCategory;
  context?: string; // When this shortcut is active
  hidden?: boolean; // Don't show in help overlay
}

/**
 * All keyboard shortcuts defined in one place
 */
export const shortcuts: Shortcut[] = [
  // Global Shortcuts
  {
    key: '⌘K',
    description: 'Global search',
    category: 'global',
  },
  {
    key: '⌘/',
    description: 'Show shortcuts help',
    category: 'global',
  },
  {
    key: '⌘B',
    description: 'Toggle sidebar',
    category: 'global',
  },
  {
    key: '⌘,',
    description: 'Settings',
    category: 'global',
  },
  {
    key: '⌘R',
    description: 'Refresh all panels',
    category: 'global',
  },
  {
    key: '⇧⌘D',
    description: 'Spawn new agent',
    category: 'global',
  },
  {
    key: '⇧⌘C',
    description: 'Run cron job',
    category: 'global',
  },
  {
    key: '⇧⌘M',
    description: 'Switch model',
    category: 'global',
  },
  {
    key: 'ESC',
    description: 'Close dialogs',
    category: 'global',
  },

  // Navigation Shortcuts
  {
    key: 'g then d',
    description: 'Go to dashboard',
    category: 'navigation',
  },
  {
    key: 'g then b',
    description: 'Go to builds',
    category: 'navigation',
  },
  {
    key: 'g then c',
    description: 'Go to crons',
    category: 'navigation',
  },
  {
    key: 'g then h',
    description: 'Go to health',
    category: 'navigation',
  },
  {
    key: 'g then m',
    description: 'Go to memory',
    category: 'navigation',
  },
  {
    key: 'g then l',
    description: 'Go to lessons',
    category: 'navigation',
  },
  {
    key: 'g then a',
    description: 'Go to agents',
    category: 'navigation',
  },
  {
    key: '⌘1',
    description: 'Go to dashboard',
    category: 'navigation',
  },
  {
    key: '⌘2',
    description: 'Go to builds',
    category: 'navigation',
  },
  {
    key: '⌘3',
    description: 'Go to crons',
    category: 'navigation',
  },
  {
    key: '⌘4',
    description: 'Go to agents',
    category: 'navigation',
  },
  {
    key: '⌘5',
    description: 'Go to costs',
    category: 'navigation',
  },

  // Panel Shortcuts (Dashboard only)
  {
    key: '1-9',
    description: 'Focus panel (dashboard)',
    category: 'panel',
    context: 'Dashboard',
  },

  // Action Shortcuts
  {
    key: 'n',
    description: 'New item (context-aware)',
    category: 'action',
    context: 'Any panel',
  },
  {
    key: 'r',
    description: 'Refresh current panel',
    category: 'action',
    context: 'Any panel',
  },
  {
    key: 'f',
    description: 'Filter/search in panel',
    category: 'action',
    context: 'Any panel',
  },
  {
    key: '?',
    description: 'Help for current page',
    category: 'action',
    context: 'Any page',
  },
];

/**
 * Category labels for display
 */
export const categoryLabels: Record<ShortcutCategory, string> = {
  global: 'Global Shortcuts',
  navigation: 'Navigation',
  panel: 'Panel Focus',
  action: 'Quick Actions',
};

/**
 * Category descriptions
 */
export const categoryDescriptions: Record<ShortcutCategory, string> = {
  global: 'Available everywhere in Mission Control',
  navigation: 'Quick navigation between pages',
  panel: 'Focus specific panels on the dashboard',
  action: 'Context-aware actions in panels',
};

/**
 * Convert keyboard event key to display format
 * Handles modifiers and special keys
 */
export function formatKeyCombo(keys: string): string {
  return keys
    .replace('mod+', '⌘')
    .replace('shift+', '⇧')
    .replace('alt+', '⌥')
    .replace('ctrl+', '⌃')
    .replace('space', '␣')
    .replace('enter', '↵')
    .replace('escape', 'esc')
    .replace('tab', '⇥')
    .replace('up', '↑')
    .replace('down', '↓')
    .replace('left', '←')
    .replace('right', '→')
    .replace('backspace', '⌫')
    .replace('delete', '⌦');
}

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(category: ShortcutCategory): Shortcut[] {
  return shortcuts.filter(s => s.category === category);
}

/**
 * Search shortcuts by key or description
 */
export function searchShortcuts(query: string): Shortcut[] {
  const q = query.toLowerCase();
  return shortcuts.filter(s =>
    s.key.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.context?.toLowerCase().includes(q)
  );
}

/**
 * Navigation paths for g + key shortcuts
 */
export const navigationPaths: Record<string, string> = {
  d: '/',
  b: '/builds',
  c: '/crons',
  h: '/memory',
  m: '/memory',
  l: '/lessons',
  a: '/agents',
};

/**
 * Get shortcut key for navigation to a path
 */
export function getShortcutForPath(path: string): string | null {
  for (const [key, value] of Object.entries(navigationPaths)) {
    if (value === path) {
      return `g then ${key}`;
    }
  }
  return null;
}
