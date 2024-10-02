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
    url: string;
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
    if (prev.pattern?.url) URL.revokeObjectURL(prev.pattern.url);

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
        const res = window.generate(buf, options);
        const blob = new Blob([res.data], { type: 'image/png' });
        set({
          pattern: {
            url: URL.createObjectURL(blob),
            metadata: res.metadata,
          },
        });
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
