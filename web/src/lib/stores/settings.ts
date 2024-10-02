import { create } from 'zustand';

interface SettingsState {
  size: number;
  setSize(size: number): void;

  colors: number;
  setColors(colors: number): void;
}

const initialState = {
  size: 150,
  colors: 20,
};

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...initialState,

  setSize(size) {
    set({ size });
  },
  setColors(colors) {
    set({ colors });
  },
}));
