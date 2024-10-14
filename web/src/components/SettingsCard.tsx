import { useEffect } from 'react';

import Card from './Card';

import { useSettingsStore, useCanvasStore } from 'lib/stores';
import { useDebounce } from 'lib/hooks';

export default function SettingsCard() {
  const settings = useSettingsStore();
  const canvas = useCanvasStore();

  const debouncedSize = useDebounce(settings.size, 250);
  const debouncedColors = useDebounce(settings.colors, 250);

  useEffect(() => {
    if (isNaN(debouncedSize) || debouncedSize < 50 || debouncedSize > 300) return;
    if (isNaN(debouncedColors) || debouncedColors < 10 || debouncedColors > 50) return;
    canvas.process(null, { size: debouncedSize, colors: debouncedColors });
  }, [debouncedSize, debouncedColors]);

  return (
    <Card>
      <h1 className="text-base font-medium">Diamond Painting</h1>

      <div className="flex flex-col gap-2">
        <label className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Size</span>
          <input
            type="number"
            value={settings.size}
            onChange={(e) => settings.setSize(parseInt(e.target.value))}
            className="w-16 rounded-md border-neutral-200 px-2 py-1 text-right text-sm tabular-nums"
          />
        </label>

        <label className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Colors</span>
          <input
            type="number"
            value={settings.colors}
            onChange={(e) => settings.setColors(parseInt(e.target.value))}
            className="w-16 rounded-md border-neutral-200 px-2 py-1 text-right text-sm tabular-nums"
          />
        </label>
      </div>
    </Card>
  );
}
