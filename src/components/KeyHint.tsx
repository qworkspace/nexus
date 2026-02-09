"use client";

import { cn } from '@/lib/utils';
import { formatKeyCombo } from '@/lib/shortcuts';

interface KeyHintProps {
  keys: string;
  className?: string;
  showOnHover?: boolean;
}

/**
 * Key Hint Component
 *
 * Displays a keyboard shortcut hint in a subtle badge format.
 * Can be shown on hover or always visible.
 *
 * @example
 * <KeyHint keys="mod+k" />
 * <KeyHint keys="g then d" showOnHover />
 */
export function KeyHint({ keys, className, showOnHover = false }: KeyHintProps) {
  const formattedKeys = formatKeyCombo(keys);

  return (
    <kbd
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded border',
        'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
        'border-zinc-200 dark:border-zinc-700',
        'shadow-sm transition-opacity',
        showOnHover && 'opacity-0 group-hover:opacity-100',
        className
      )}
    >
      {formattedKeys}
    </kbd>
  );
}
