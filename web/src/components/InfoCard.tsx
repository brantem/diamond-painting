import { useRef } from 'react';

import Card from './Card';

import { useSettingsStore, useCanvasStore } from 'lib/stores';
import { formatNumber, formatBytes } from 'lib/helpers';

export default function InfoCard() {
  const canvas = useCanvasStore();
  if (!canvas.original || !canvas.pattern) return null;

  return (
    <Card>
      <ChangePictureButton />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Width</span>
          <span className="tabular-nums">{formatNumber(canvas.original.metadata.width)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Height</span>
          <span className="tabular-nums">{formatNumber(canvas.original.metadata.height)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Size</span>
          <span className="tabular-nums">{formatBytes(canvas.original.file.size)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex select-none items-center gap-2 text-neutral-500">
          <hr className="flex-1" />
          <span>Diamonds</span>
          <hr className="flex-1" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Count</span>
          <span className="tabular-nums">
            {(({ width, height }) => (
              <>
                {formatNumber(width * height)} ({formatNumber(width)} x {formatNumber(height)})
              </>
            ))(canvas.pattern.metadata)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex select-none items-center gap-2 text-neutral-500">
          <hr className="flex-1" />
          <span>Colors</span>
          <hr className="flex-1" />
        </div>

        <div className="flex flex-col gap-1">
          {Object.keys(canvas.pattern.metadata.colors).map((color) => (
            <div key={color} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <div className="size-4 rounded-sm border border-neutral-200" style={{ backgroundColor: color }} />
                <span className="font-mono text-sm text-neutral-500">{color}</span>
              </div>
              <span className="calt tabular-nums">{formatNumber(canvas.pattern!.metadata.colors[color])}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="reset"
        className="h-10 w-full rounded-md bg-red-50 px-2 font-medium text-red-500 hover:bg-red-100"
        onClick={() => canvas.reset()}
      >
        Reset
      </button>
    </Card>
  );
}

function ChangePictureButton() {
  const settings = useSettingsStore();
  const canvas = useCanvasStore();

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (!e.target.files || !e.target.files.length) return;
          canvas.process(e.target.files[0], {
            size: settings.size,
            colors: settings.colors,
          });
        }}
      />
      <button
        className="h-10 w-full rounded-md bg-neutral-900 px-2 font-medium text-white hover:bg-neutral-800"
        onClick={() => inputRef.current?.click()}
      >
        Change Picture
      </button>
    </div>
  );
}
