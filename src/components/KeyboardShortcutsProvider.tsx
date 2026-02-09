"use client";

import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';

/**
 * Keyboard Shortcuts Provider
 *
 * This component initializes the global keyboard shortcuts system.
 * It must be placed high in the component tree (in layout.tsx) to ensure
 * shortcuts work throughout the application.
 *
 * Note: This component doesn't render anything visible - it just hooks up
 * the keyboard listeners.
 */
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  // Initialize global keyboard shortcuts
  useGlobalShortcuts();

  return <>{children}</>;
}
