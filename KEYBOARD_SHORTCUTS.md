# Keyboard Shortcuts System

Mission Control is keyboard-first. Use these shortcuts to navigate quickly.

## Global Shortcuts
Available everywhere in Mission Control.

| Shortcut | Action |
|----------|--------|
| `⌘K` | Open command palette (global search) |
| `⌘/` | Show keyboard shortcuts help |
| `?` | Show keyboard shortcuts help |
| `⌘B` | Toggle sidebar |
| `⌘,` | Settings |
| `⌘R` | Refresh all panels |
| `⇧⌘D` | Spawn new agent |
| `⇧⌘C` | Run cron job |
| `⇧⌘M` | Switch model |
| `ESC` | Close all dialogs |

## Navigation Shortcuts
Quick navigation between pages.

| Shortcut | Action |
|----------|--------|
| `g then d` | Go to dashboard |
| `g then b` | Go to builds |
| `g then c` | Go to crons |
| `g then h` | Go to health/memory |
| `g then m` | Go to memory |
| `g then l` | Go to lessons |
| `g then a` | Go to agents |
| `⌘1` | Go to dashboard |
| `⌘2` | Go to builds |
| `⌘3` | Go to crons |
| `⌘4` | Go to agents |
| `⌘5` | Go to costs |

## Panel Shortcuts
Focus specific panels on the dashboard.

| Shortcut | Action |
|----------|--------|
| `1-9` | Focus panel (dashboard only) |

## Action Shortcuts
Context-aware actions in panels.

| Shortcut | Action |
|----------|--------|
| `n` | New item (context-aware) |
| `r` | Refresh current panel |
| `f` | Filter/search in panel |
| `?` | Help for current page |

## Implementation

The keyboard shortcuts system consists of:

- **`lib/shortcuts.ts`** - Central shortcut definitions and utilities
- **`hooks/useKeyboardShortcuts.ts`** - Global keyboard listener hook
- **`components/KeyboardShortcuts.tsx`** - Help modal component
- **`components/KeyboardShortcutsProvider.tsx`** - Provider component
- **`components/KeyHint.tsx`** - Reusable keyboard hint badge
- **`stores/commandStore.ts`** - State management for shortcuts modal

The system uses [react-hotkeys-hook](https://github.com/JohannesKlauss/react-hotkeys-hook) for keyboard event handling.

## Adding New Shortcuts

1. **Define the shortcut** in `lib/shortcuts.ts`:
   ```ts
   {
     key: '⌘N',
     description: 'Create new item',
     category: 'action',
   }
   ```

2. **Register the handler** in `hooks/useKeyboardShortcuts.ts`:
   ```ts
   useHotkeys('mod+n', (e) => {
     e.preventDefault();
     // Your action here
   });
   ```

3. **That's it!** The shortcut will automatically appear in the help modal.

## Tips

- Shortcuts don't trigger when typing in input fields
- Multi-key shortcuts (like `g then d`) have a 1-second timeout
- Hover over navigation items to see keyboard hints
- Press `⌘/` or `?` anytime to see all available shortcuts
