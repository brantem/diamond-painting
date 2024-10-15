import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';

import Card from './Card';

import { formatNumber } from 'lib/helpers';

const MIN_SCALE = 0.5; // Minimum internal scale (50%)
const MAX_SCALE = 3; // Maximum internal scale (200%)
const DEFAULT_SCALE = 1; // Default internal scale (100%)
const ZOOM_SENSITIVITY = 0.1;
const SCROLL_SENSITIVITY = 1;

interface CanvasHandle {
  update(): void;
}

interface CanvasProps {
  render(ctx: CanvasRenderingContext2D): void;
}

export default forwardRef<CanvasHandle, CanvasProps>(function Canvas({ render }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const update = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offset.x, offset.y);

    render(ctx);

    ctx.restore();
  }, [scale, offset, render]);

  useImperativeHandle(ref, () => ({ update }));

  const init = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    contextRef.current = ctx;

    const dpr = window.devicePixelRatio;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(dpr, dpr);
  };

  useEffect(() => {
    init();
    update();
  }, []);

  useEffect(update, [update]);

  const handleZoom = useCallback((centerX: number, centerY: number, delta: number) => {
    setScale((prev) => {
      const dir = delta > 0 ? 1 : -1; // Determine the direction of zoom
      const v = Math.min(Math.max(prev + dir * ZOOM_SENSITIVITY, MIN_SCALE), MAX_SCALE);
      setOffset((prevOffset) => ({
        x: Math.round(prevOffset.x - (centerX / prev - centerX / v)),
        y: Math.round(prevOffset.y - (centerY / prev - centerY / v)),
      }));
      return v;
    });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey) {
        handleZoom(mouseX, mouseY, -e.deltaY);
      } else {
        setOffset((prev) => ({
          x: Math.round(prev.x - (e.deltaX * SCROLL_SENSITIVITY) / scale),
          y: Math.round(prev.y - (e.deltaY * SCROLL_SENSITIVITY) / scale),
        }));
      }
    },
    [handleZoom, scale],
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging.current) return;
      const dx = Math.round((e.clientX - lastPosition.current.x) / scale);
      const dy = Math.round((e.clientY - lastPosition.current.y) / scale);
      setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPosition.current = { x: e.clientX, y: e.clientY };
    },
    [scale],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
        className="size-full touch-none"
      />

      <Card className="fixed right-4 top-4 w-fit p-2 text-right">
        <span className="tabular-nums">{formatNumber(scale * 100)}%</span>
      </Card>
    </>
  );
});
