import { useCallback } from 'react';

import SettingsCard from 'components/SettingsCard';
import InfoCard from 'components/InfoCard';
import Dropzone from 'components/Dropzone';
import Canvas from 'components/Canvas';

import { useCanvasStore, useSettingsStore } from 'lib/stores';

export default function App() {
  const settings = useSettingsStore();
  const canvas = useCanvasStore();

  const render = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!canvas.pattern) return;

      const { width, height } = canvas.pattern.metadata;
      const numPixels = width * height;
      const pixelSize = settings.type * 96;

      const offsetX = ctx.canvas.width / window.devicePixelRatio / 2 - (width * pixelSize) / 2;
      const offsetY = ctx.canvas.height / window.devicePixelRatio / 2 - (height * pixelSize) / 2;

      // Pattern

      ctx.lineWidth = 0; // No outline for pixels
      for (let i = 0; i < numPixels; i++) {
        const r = canvas.pattern.data[i * 4];
        const g = canvas.pattern.data[i * 4 + 1];
        const b = canvas.pattern.data[i * 4 + 2];
        const a = canvas.pattern.data[i * 4 + 3];

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        const x = offsetX + (i % width) * pixelSize;
        const y = offsetY + Math.floor(i / width) * pixelSize;
        ctx.fillRect(x, y, pixelSize, pixelSize);
      }

      // Grid

      ctx.strokeStyle = '#c6b696';
      ctx.lineWidth = 0.5;

      // Vertical
      ctx.beginPath();
      for (let i = 0; i <= width; i++) {
        const x = offsetX + i * pixelSize;
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + height * pixelSize);
      }
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      for (let j = 0; j <= height; j++) {
        const y = offsetY + j * pixelSize;
        ctx.moveTo(offsetX, y);
        ctx.lineTo(offsetX + width * pixelSize, y);
      }
      ctx.stroke();
    },
    [settings.type, canvas.pattern],
  );

  return (
    <>
      {canvas.isProcessing && (
        <div
          className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 text-sm shadow-xl"
          role="status"
        >
          <svg
            aria-hidden="true"
            className="size-4 animate-spin fill-black text-gray-200"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span className="text-neutral-500">Processing...</span>
        </div>
      )}

      {!canvas.pattern ? (
        <Dropzone />
      ) : (
        <>
          <div className="fixed left-4 top-4 z-30 flex flex-col items-start gap-4 xl:w-[300px]">
            <SettingsCard />
            <InfoCard />
          </div>

          <Canvas render={render} />
        </>
      )}
    </>
  );
}
