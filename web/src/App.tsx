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

  return !canvas.pattern ? (
    <Dropzone />
  ) : (
    <>
      <div className="fixed left-4 top-4 z-30 flex flex-col items-start gap-4 xl:w-[300px]">
        <SettingsCard />
        <InfoCard />
      </div>
      <Canvas render={render} />
    </>
  );
}
