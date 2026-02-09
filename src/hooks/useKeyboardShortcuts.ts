import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';
import { useCommandStore } from '@/stores/commandStore';
import { useCallback, useRef } from 'react';
import { navigationPaths } from '@/lib/shortcuts';

/**
 * Global Keyboard Shortcuts Hook
 *
 * Manages all keyboard shortcuts across Mission Control.
 * This is the central hook that should be called in the root layout.
 */
export function useGlobalShortcuts() {
  const router = useRouter();
  const {
    openPalette,
    openSpawn,
    openCron,
    openModel,
    toggleShortcuts,
    closeAll,
  } = useCommandStore();

  // Track last key pressed for multi-key shortcuts (g + key)
  const lastKeyPressed = useRef<string | null>(null);
  const lastKeyTimeout = useRef<NodeJS.Timeout | null>(null);

  // Reset the multi-key sequence after a delay
  const resetKeySequence = useCallback(() => {
    lastKeyPressed.current = null;
    if (lastKeyTimeout.current) {
      clearTimeout(lastKeyTimeout.current);
      lastKeyTimeout.current = null;
    }
  }, []);

  // Handle multi-key shortcuts (g + key)
  const handleMultiKey = useCallback((key: string) => {
    // If we already pressed 'g', check if this is a valid second key
    if (lastKeyPressed.current === 'g') {
      const path = navigationPaths[key];
      if (path) {
        router.push(path);
        resetKeySequence();
        return true;
      }
    }

    // Set the last key pressed
    lastKeyPressed.current = key;

    // Clear the sequence after 1 second
    if (lastKeyTimeout.current) {
      clearTimeout(lastKeyTimeout.current);
    }
    lastKeyTimeout.current = setTimeout(resetKeySequence, 1000);

    return false;
  }, [router, resetKeySequence]);

  // ====================
  // GLOBAL SHORTCUTS
  // ====================

  // Command palette - ⌘K
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    openPalette();
  });

  // Show shortcuts help - ⌘/
  useHotkeys('mod+/', (e) => {
    e.preventDefault();
    toggleShortcuts();
  });

  // Show shortcuts help - ? (if not typing in input)
  useHotkeys('?', (e) => {
    // Don't trigger if typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }
    e.preventDefault();
    toggleShortcuts();
  });

  // Refresh page - ⌘R (browser default, but we can customize)
  useHotkeys('mod+r', () => {
    // Let browser handle this naturally, or override if needed
    // e.preventDefault();
    // window.location.reload();
  });

  // Settings - ⌘,
  useHotkeys('mod+,', (e) => {
    e.preventDefault();
    // Navigate to a settings page (using calendar as placeholder for now)
    router.push('/calendar');
  });

  // Spawn agent - ⇧⌘D
  useHotkeys('mod+shift+d', (e) => {
    e.preventDefault();
    openSpawn();
  });

  // Run cron - ⇧⌘C
  useHotkeys('mod+shift+c', (e) => {
    e.preventDefault();
    openCron();
  });

  // Switch model - ⇧⌘M
  useHotkeys('mod+shift+m', (e) => {
    e.preventDefault();
    openModel();
  });

  // Close all dialogs - ESC
  useHotkeys('esc', () => {
    closeAll();
  });

  // ====================
  // NAVIGATION SHORTCUTS
  // ====================

  // Navigation - ⌘1-5
  useHotkeys('mod+1', (e) => {
    e.preventDefault();
    router.push('/');
  });

  useHotkeys('mod+2', (e) => {
    e.preventDefault();
    router.push('/builds');
  });

  useHotkeys('mod+3', (e) => {
    e.preventDefault();
    router.push('/crons');
  });

  useHotkeys('mod+4', (e) => {
    e.preventDefault();
    router.push('/agents');
  });

  useHotkeys('mod+5', (e) => {
    e.preventDefault();
    router.push('/costs');
  });

  // g + key navigation shortcuts
  useHotkeys('g', (e) => {
    // Don't trigger if typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }
    e.preventDefault();
    handleMultiKey('g');
  });

  useHotkeys('d,b,c,h,m,l,a', (e) => {
    // Only handle if we're in a g + key sequence
    if (lastKeyPressed.current !== 'g') {
      return;
    }

    // Don't trigger if typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    e.preventDefault();
    const key = e.key.toLowerCase();

    // Navigate based on the key pressed
    const path = navigationPaths[key];
    if (path) {
      router.push(path);
      resetKeySequence();
    }
  });

  // ====================
  // PANEL SHORTCUTS
  // ====================

  // Panel focus - 1-9 (only on dashboard)
  useHotkeys('1,2,3,4,5,6,7,8,9', (e) => {
    // Only on dashboard
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/')) {
      return;
    }

    // Don't trigger if typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // This would need to be connected to actual panels
    // For now, just prevent default
    // e.preventDefault();
    // TODO: Focus the panel at the given index
  });

  // ====================
  // ACTION SHORTCUTS
  // ====================

  // New item - n
  useHotkeys('n', (e) => {
    // Don't trigger if typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    // Context-aware: what we create depends on the current page
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    if (pathname === '/builds') {
      e.preventDefault();
      // TODO: Open new build dialog
      console.log('New build');
    } else if (pathname === '/crons') {
      e.preventDefault();
      // TODO: Open new cron dialog
      console.log('New cron');
    }
    // Can be extended for other pages
  });

  // Refresh current panel - r
  useHotkeys('r', (e) => {
    // Don't trigger if typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    e.preventDefault();
    // Trigger a refresh of the current view
    window.location.reload();
  });

  // Filter/search - f
  useHotkeys('f', (e) => {
    // Don't trigger if typing in an input field
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    e.preventDefault();
    // Focus the search/filter input in the current panel
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
    }
  });
}

/**
 * Hook for context-specific shortcuts (e.g., within a specific panel)
 * This can be used by individual components for their own shortcuts
 */
export function usePanelShortcuts(
  shortcuts: Record<string, (e: KeyboardEvent) => void>,
  deps: React.DependencyList = []
) {
  const shortcutEntries = Object.entries(shortcuts);

  shortcutEntries.forEach(([keys, handler]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHotkeys(keys, handler, [...deps], {
      enableOnFormTags: true,
    });
  });
}
