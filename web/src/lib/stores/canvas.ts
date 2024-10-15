import { create } from 'zustand';

interface CanvasState {
  original: {
    file: File;
    metadata: {
      width: number;
      height: number;
    };
  } | null;
  pattern: {
    data: Uint8ClampedArray;
    metadata: {
      width: number;
      height: number;
      colors: Record<string, number>;
    };
  } | null;

  process(file: File | null, options: { size: number; colors: number }): void;
  isProcessing: boolean;

  reset(): void;
}

const initialState = {
  original: null,
  pattern: null,
  isProcessing: false,
};

export const useCanvasStore = create<CanvasState>()((set, get) => ({
  ...initialState,

  process(file, options) {
    set({ isProcessing: true });

    const prev = get();

    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        URL.revokeObjectURL(url);
        set({
          original: {
            file,
            metadata: { width: img.width, height: img.height },
          },
        });
      };
    }

    const _file = file || prev.original?.file;
    if (!_file) return set({ isProcessing: false });

    const reader = new FileReader();
    reader.onload = async (e) => {
      const buf = e.target?.result;
      if (!buf) return set({ isProcessing: false });

      try {
        set({ pattern: window.generate(buf, options) });
      } catch (error) {
        console.error('Error processing image:', error);
      }

      set({ isProcessing: false });
    };
    reader.readAsArrayBuffer(_file);
  },
  reset() {
    set(initialState);
  },
}));
