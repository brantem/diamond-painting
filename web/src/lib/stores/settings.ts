import { DiamondType } from 'types';
import { create } from 'zustand';

interface SettingsState {
  type: DiamondType;
  setType(type: DiamondType): void;

  size: number;
  setSize(size: number): void;

  colors: number;
  setColors(colors: number): void;
}

const initialState = {
  type: DiamondType.Round,
  size: 150,
  colors: 25,
};

export const useSettingsStore = create<SettingsState>()((set) => ({
  ...initialState,

  setType(type) {
    set({ type });
  },
  setSize(size) {
    set({ size });
  },
  setColors(colors) {
    set({ colors });
  },
}));
