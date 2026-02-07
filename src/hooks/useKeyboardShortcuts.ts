import { useHotkeys } from 'react-hotkeys-hook';
import { useRouter } from 'next/navigation';
import { useCommandStore } from '@/stores/commandStore';

export function useGlobalShortcuts() {
  const router = useRouter();
  const {
    openPalette,
    openSpawn,
    openCron,
    openModel,
    closeAll,
  } = useCommandStore();

  // Command palette - ⌘K
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    openPalette();
  });

  // Spawn agent - ⌘⇧D
  useHotkeys('mod+shift+d', (e) => {
    e.preventDefault();
    openSpawn();
  });

  // Run cron - ⌘⇧C
  useHotkeys('mod+shift+c', (e) => {
    e.preventDefault();
    openCron();
  });

  // Switch model - ⌘⇧M
  useHotkeys('mod+shift+m', (e) => {
    e.preventDefault();
    openModel();
  });

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

  // Settings - ⌘,
  useHotkeys('mod+,', (e) => {
    e.preventDefault();
    // For now, navigate to calendar as placeholder
    router.push('/calendar');
  });

  // Close all dialogs - ESC
  useHotkeys('esc', () => {
    closeAll();
  });

  // Refresh - ⌘⇧R
  useHotkeys('mod+shift+r', () => {
    window.location.reload();
  });
}
