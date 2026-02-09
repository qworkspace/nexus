import { create } from 'zustand';

interface CommandState {
  // Dialog states
  paletteOpen: boolean;
  spawnOpen: boolean;
  cronOpen: boolean;
  modelOpen: boolean;
  shortcutsOpen: boolean;

  // Actions
  openPalette: () => void;
  closePalette: () => void;
  openSpawn: () => void;
  closeSpawn: () => void;
  openCron: () => void;
  closeCron: () => void;
  openModel: () => void;
  closeModel: () => void;
  toggleShortcuts: () => void;
  closeAll: () => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  paletteOpen: false,
  spawnOpen: false,
  cronOpen: false,
  modelOpen: false,
  shortcutsOpen: false,

  openPalette: () => set({ paletteOpen: true }),
  closePalette: () => set({ paletteOpen: false }),
  openSpawn: () => set({ spawnOpen: true, paletteOpen: false }),
  closeSpawn: () => set({ spawnOpen: false }),
  openCron: () => set({ cronOpen: true, paletteOpen: false }),
  closeCron: () => set({ cronOpen: false }),
  openModel: () => set({ modelOpen: true, paletteOpen: false }),
  closeModel: () => set({ modelOpen: false }),
  toggleShortcuts: () => set((state) => ({ shortcutsOpen: !state.shortcutsOpen })),
  closeAll: () => set({
    paletteOpen: false,
    spawnOpen: false,
    cronOpen: false,
    modelOpen: false,
    shortcutsOpen: false,
  }),
}));
