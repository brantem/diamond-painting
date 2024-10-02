/// <reference types="vite/client" />

declare global {
  interface Window {
    generate(
      data: string | ArrayBuffer,
      options: { size: number; colors: number },
    ): {
      data: Uint8Array;
      metadata: {
        width: number;
        height: number;
        colors: Record<string, number>;
      };
    };
  }
}

export type {};
