"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCommandStore } from '@/stores/commandStore';
import {
  shortcuts,
  categoryLabels,
  categoryDescriptions,
  searchShortcuts,
  type ShortcutCategory,
} from '@/lib/shortcuts';
import { Search } from 'lucide-react';

/**
 * Keyboard Shortcuts Help Overlay
 *
 * Displays all available keyboard shortcuts in a searchable,
 * categorized modal dialog.
 */
export function KeyboardShortcuts() {
  const { shortcutsOpen, toggleShortcuts } = useCommandStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all');

  const filteredShortcuts = searchQuery
    ? searchShortcuts(searchQuery)
    : shortcuts;

  const categories: (ShortcutCategory | 'all')[] = ['all', 'global', 'navigation', 'panel', 'action'];

  // Group shortcuts by category
  const getShortcutsByCategory = (category: ShortcutCategory | 'all') => {
    if (category === 'all') {
      return filteredShortcuts;
    }
    return filteredShortcuts.filter(s => s.category === category);
  };

  // Render a keyboard key badge
  const KeyBadge = ({ keys }: { keys: string }) => {
    const keyParts = keys.split(' then ');

    return (
      <div className="flex items-center gap-1">
        {keyParts.map((part, idx) => (
          <span key={idx} className="inline-flex items-center gap-1">
            <kbd className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded border border-zinc-200 dark:border-zinc-700 shadow-sm min-w-[1.5rem] text-center">
              {part}
            </kbd>
            {idx < keyParts.length - 1 && <span className="text-zinc-400">then</span>}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={shortcutsOpen} onOpenChange={toggleShortcuts}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">⌨️</span>
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Press any keyboard key to see available shortcuts
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
              >
                {cat === 'all' ? 'All' : categoryLabels[cat]}
              </button>
            ))}
          </div>
        )}

        {/* Shortcuts List */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-2">
            {selectedCategory === 'all' ? (
              // Show all categories
              (['global', 'navigation', 'panel', 'action'] as ShortcutCategory[]).map((cat) => {
                const catShortcuts = getShortcutsByCategory(cat);
                if (catShortcuts.length === 0) return null;

                return (
                  <div key={cat}>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                      {categoryLabels[cat]}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                      {categoryDescriptions[cat]}
                    </p>
                    <div className="space-y-2">
                      {catShortcuts.map((shortcut, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {shortcut.description}
                            </p>
                            {shortcut.context && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                                {shortcut.context}
                              </p>
                            )}
                          </div>
                          <KeyBadge keys={shortcut.key} />
                        </div>
                      ))}
                    </div>
                    {cat !== 'action' && <Separator className="my-4" />}
                  </div>
                );
              })
            ) : (
              // Show single category
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  {categoryLabels[selectedCategory]}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                  {categoryDescriptions[selectedCategory]}
                </p>
                <div className="space-y-2">
                  {getShortcutsByCategory(selectedCategory).map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          {shortcut.description}
                        </p>
                        {shortcut.context && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                            {shortcut.context}
                          </p>
                        )}
                      </div>
                      <KeyBadge keys={shortcut.key} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
              Press <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300">ESC</kbd> or click outside to close
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
