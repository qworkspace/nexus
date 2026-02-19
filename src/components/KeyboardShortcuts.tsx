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
import { Keyboard, Search} from 'lucide-react';

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
            <kbd className="px-2 py-1 text-xs font-medium bg-zinc-100 dark:bg-secondary text-zinc-700 dark:text-foreground rounded border border-zinc-200 dark:border-border shadow-sm min-w-[1.5rem] text-center">
              {part}
            </kbd>
            {idx < keyParts.length - 1 && <span className="text-muted-foreground">then</span>}
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
            <Keyboard size={16} />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Press any keyboard key to see available shortcuts
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                    ? 'bg-card text-foreground dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 text-muted-foreground hover:bg-zinc-200 dark:bg-secondary dark:text-muted-foreground dark:hover:bg-muted'
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
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-foreground mb-2">
                      {categoryLabels[cat]}
                    </h3>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-3">
                      {categoryDescriptions[cat]}
                    </p>
                    <div className="space-y-2">
                      {catShortcuts.map((shortcut, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-card/80 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-zinc-700 dark:text-foreground">
                              {shortcut.description}
                            </p>
                            {shortcut.context && (
                              <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
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
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-foreground mb-2">
                  {categoryLabels[selectedCategory]}
                </h3>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground mb-3">
                  {categoryDescriptions[selectedCategory]}
                </p>
                <div className="space-y-2">
                  {getShortcutsByCategory(selectedCategory).map((shortcut, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-card/80 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-700 dark:text-foreground">
                          {shortcut.description}
                        </p>
                        {shortcut.context && (
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
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
          <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-border">
            <p className="text-xs text-center text-muted-foreground dark:text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-zinc-100 dark:bg-secondary rounded text-muted-foreground dark:text-foreground">ESC</kbd> or click outside to close
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
