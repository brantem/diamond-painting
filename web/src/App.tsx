import { useCallback } from 'react';

import SettingsCard from 'components/SettingsCard';
import InfoCard from 'components/InfoCard';
import Dropzone from 'components/Dropzone';
import Canvas from 'components/Canvas';

import { useCanvasStore } from 'lib/stores';

const PIXEL_SIZE = 0.11 * 96; // TODO

export default function App() {
  const canvas = useCanvasStore();

  const render = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!canvas.pattern) return;

      const { width, height } = canvas.pattern.metadata;
      const numPixels = width * height;

      const offsetX = ctx.canvas.width / window.devicePixelRatio / 2 - (width * PIXEL_SIZE) / 2;
      const offsetY = ctx.canvas.height / window.devicePixelRatio / 2 - (height * PIXEL_SIZE) / 2;

      // Pattern

      ctx.lineWidth = 0; // No outline for pixels
      for (let i = 0; i < numPixels; i++) {
        const r = canvas.pattern.data[i * 4];
        const g = canvas.pattern.data[i * 4 + 1];
        const b = canvas.pattern.data[i * 4 + 2];
        const a = canvas.pattern.data[i * 4 + 3];

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
        const x = offsetX + (i % width) * PIXEL_SIZE;
        const y = offsetY + Math.floor(i / width) * PIXEL_SIZE;
        ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
      }

      // Grid

      ctx.strokeStyle = '#c6b696';
      ctx.lineWidth = 0.5;

      // Vertical
      ctx.beginPath();
      for (let i = 0; i <= width; i++) {
        const x = offsetX + i * PIXEL_SIZE;
        ctx.moveTo(x, offsetY);
        ctx.lineTo(x, offsetY + height * PIXEL_SIZE);
      }
      ctx.stroke();

      // Horizontal
      ctx.beginPath();
      for (let j = 0; j <= height; j++) {
        const y = offsetY + j * PIXEL_SIZE;
        ctx.moveTo(offsetX, y);
        ctx.lineTo(offsetX + width * PIXEL_SIZE, y);
      }
      ctx.stroke();
    },
    [canvas.pattern],
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
