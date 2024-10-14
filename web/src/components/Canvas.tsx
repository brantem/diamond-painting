import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import { cn } from 'lib/helpers';
import { useSettingsStore, useCanvasStore } from 'lib/stores';

export default function Canvas() {
  const settings = useSettingsStore();
  const canvas = useCanvasStore();

  const [count, isResizing] = useResize();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted(files: File[]) {
      const file = files[0];
      if (!file) return;
      canvas.process(file, {
        size: settings.size,
        colors: settings.colors,
      });
    },
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="relative flex h-full flex-1 items-start justify-center xl:items-center">
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

      {canvas.original && canvas.pattern ? (
        <>
          <img
            id="canvas-pattern"
            src={canvas.pattern.url}
            className="pointer-events-none max-h-full max-w-full flex-1 select-none rounded-md border-[12px] border-white shadow-lg [image-rendering:pixelated]"
            style={{ aspectRatio: `${canvas.pattern.metadata.width}/${canvas.pattern.metadata.height}` }}
          />
          {!isResizing && <Grid key={count} />}
        </>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex size-full items-center justify-center rounded-lg border-4 border-dashed',
            isDragActive ? 'border-sky-200 bg-sky-50' : 'border-neutral-200',
          )}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="text-sky-500">Drop the image here...</p>
          ) : (
            <p>Drag and drop an image here, or click to select a file</p>
          )}
        </div>
      )}
    </div>
  );
}

function useResize(timeout = 300) {
  const [count, setCount] = useState(0);
  const [isResizing, setIsResizing] = useState(false);

  const cb = useCallback(() => {
    setCount((prevCount) => prevCount + 1);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    let timer: Timer;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(cb, timeout);
    };

    window.addEventListener('resize', () => {
      setIsResizing(true);
      handleResize();
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [cb, timeout]);

  return [count, isResizing] as const;
}

function Grid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas = useCanvasStore();

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>();

  useEffect(() => {
    const el = document.getElementById('canvas-pattern');
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const width = rect.width - 24;
    const height = rect.height - 24;
    setDimensions({ width, height });
  }, [canvas.pattern]);

  const drawLine = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
    ctx.lineTo(Math.floor(x2) + 0.5, Math.floor(y2) + 0.5);
    ctx.stroke();
  };

  useEffect(() => {
    if (!dimensions) return;

    const { width, height } = dimensions;
    const { width: columns, height: rows } = canvas.pattern!.metadata;

    const ctx = canvasRef.current?.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#C6B696';
    ctx.lineWidth = 1;

    // Draw vertical lines
    const cellWidth = width / columns;
    for (let i = 1; i < columns; i++) {
      const x = i * cellWidth;
      drawLine(ctx, x, 0, x, height);
    }

    // Draw horizontal lines
    const cellHeight = height / rows;
    for (let i = 1; i < rows; i++) {
      const y = i * cellHeight;
      drawLine(ctx, 0, y, width, y);
    }

    // Draw border
    drawLine(ctx, 0, 0, width, 0); // top
    drawLine(ctx, width, 0, width, height); // right
    drawLine(ctx, width, height, 0, height); // bottom
    drawLine(ctx, 0, height, 0, 0); // left
  }, [dimensions]);

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      {dimensions && <canvas ref={canvasRef} width={dimensions.width + 1} height={dimensions.height + 1} />}
    </div>
  );
}
