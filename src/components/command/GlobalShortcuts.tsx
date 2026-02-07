"use client";

import { useRouter } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { useCommandStore } from "@/stores/commandStore";

/**
 * GlobalShortcuts - Handles all keyboard shortcuts for Mission Control
 * 
 * Shortcuts:
 * - ⌘K: Open command palette
 * - ⌘⇧D: Spawn dev agent
 * - ⌘⇧C: Run cron job
 * - ⌘⇧M: Switch model
 * - ⌘⇧A: View analytics
 * - ⌘⇧T: View transcripts
 * - ⌘1-9: Navigate to pages
 * - ⌘,: Settings
 * - ESC: Close any dialog
 * - ⌘⇧R: Refresh all data
 */
export function GlobalShortcuts() {
  const router = useRouter();
  const {
    openPalette,
    openSpawn,
    openCron,
    openModel,
    closeAll,
  } = useCommandStore();

  // ⌘K - Open command palette
  useHotkeys("mod+k", (e) => {
    e.preventDefault();
    openPalette();
  }, { enableOnFormTags: true });

  // ⌘⇧D - Spawn dev agent
  useHotkeys("mod+shift+d", (e) => {
    e.preventDefault();
    openSpawn();
  });

  // ⌘⇧C - Run cron job
  useHotkeys("mod+shift+c", (e) => {
    e.preventDefault();
    openCron();
  });

  // ⌘⇧M - Switch model
  useHotkeys("mod+shift+m", (e) => {
    e.preventDefault();
    openModel();
  });

  // ⌘⇧A - View analytics
  useHotkeys("mod+shift+a", () => {
    router.push("/analytics");
  });

  // ⌘⇧T - View transcripts
  useHotkeys("mod+shift+t", () => {
    router.push("/transcripts");
  });

  // ⌘1-9 - Navigate to pages
  useHotkeys("mod+1", () => {
    router.push("/");
  });

  useHotkeys("mod+2", () => {
    router.push("/builds");
  });

  useHotkeys("mod+3", () => {
    router.push("/crons");
  });

  useHotkeys("mod+4", () => {
    router.push("/agents");
  });

  useHotkeys("mod+5", () => {
    router.push("/analytics");
  });

  useHotkeys("mod+6", () => {
    router.push("/costs");
  });

  useHotkeys("mod+7", () => {
    router.push("/activity");
  });

  useHotkeys("mod+8", () => {
    router.push("/search");
  });

  useHotkeys("mod+9", () => {
    router.push("/calendar");
  });

  // ⌘, - Settings
  useHotkeys("mod+comma", () => {
    router.push("/calendar");
  });

  // ESC - Close all dialogs
  useHotkeys("escape", () => {
    closeAll();
  }, { enableOnFormTags: true });

  // ⌘⇧R - Refresh all data
  useHotkeys("mod+shift+r", (e) => {
    e.preventDefault();
    window.location.reload();
  });

  return null; // This component doesn't render anything
}
