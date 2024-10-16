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

  process(fileOrUrl: string | File | null, options: { size: number; colors: number }): Promise<void>;
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

  async process(fileOrUrl, options) {
    set({ isProcessing: true });

    const prev = get();

    let file: File | null;
    if (typeof fileOrUrl === 'string') {
      try {
        const res = await fetch(fileOrUrl);
        if (!res.ok) throw new Error('Failed to fetch image from URL');

        const blob = await res.blob();
        file = new File([blob], fileOrUrl);
      } catch (error) {
        console.error('Error fetching image:', error);
        return set({ isProcessing: false });
      }
    } else {
      file = fileOrUrl;
    }

    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        set({
          original: {
            file: file as File,
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
