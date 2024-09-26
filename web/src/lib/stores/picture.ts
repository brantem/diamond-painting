import { create } from "zustand";

interface FileWithPreview extends File {
  preview: string;
}

interface Dimensions {
  width: number;
  height: number;
}

interface PictureState {
  file: FileWithPreview | null;
  dimensions: Dimensions | null;
  setFile(file: File | null): void;
}

const initialState = {
  file: null,
  dimensions: null,
};

export const usePictureStore = create<PictureState>()((set, get) => ({
  ...initialState,

  setFile(file) {
    const prev = get().file;
    if (prev) URL.revokeObjectURL(prev.preview);

    if (!file) {
      set(initialState);
      return;
    }

    const preview = URL.createObjectURL(file);
    set({ file: Object.assign(file, { preview }) });

    const img = new Image();
    img.src = preview;
    img.onload = () => {
      set({ dimensions: { width: img.width, height: img.height } });
    };
  },
}));
