import { useRef, useEffect, useState, useCallback } from 'react';

const MIN_SCALE = 0.1;
const MAX_SCALE = 2;
const DEFAULT_SCALE = 1;
const ZOOM_SENSITIVITY = 0.1;
const SCROLL_SENSITIVITY = 1;

interface CanvasProps {
  render(ctx: CanvasRenderingContext2D): void;
}

export default function Canvas({ render }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const scale = useRef(DEFAULT_SCALE);
  const offset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  const update = useCallback(() => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.save();

    const scaleFactor = scale.current <= 1 ? scale.current : Math.pow(scale.current, 2);
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(offset.current.x, offset.current.y);

    render(ctx);

    ctx.restore();
  }, [render]);

  const scheduleUpdate = useCallback(() => {
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      update();
      raf.current = null;
    });
  }, [update]);

  const init = useCallback(() => {
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
    scheduleUpdate();
  }, [scheduleUpdate]);

  useEffect(() => {
    init();
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [init]);

  const handleZoom = useCallback(
    (centerX: number, centerY: number, delta: number) => {
      const dir = delta > 0 ? 1 : -1;
      const newScale = Math.min(Math.max(scale.current + dir * ZOOM_SENSITIVITY, MIN_SCALE), MAX_SCALE);

      offset.current = {
        x: Math.round(offset.current.x - (centerX / scale.current - centerX / newScale)),
        y: Math.round(offset.current.y - (centerY / scale.current - centerY / newScale)),
      };

      scale.current = newScale;
      scheduleUpdate();
    },
    [scheduleUpdate],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey) {
        handleZoom(mouseX, mouseY, -e.deltaY);
      } else {
        offset.current = {
          x: Math.round(offset.current.x - (e.deltaX * SCROLL_SENSITIVITY) / scale.current),
          y: Math.round(offset.current.y - (e.deltaY * SCROLL_SENSITIVITY) / scale.current),
        };
        scheduleUpdate();
      }
    },
    [handleZoom, scheduleUpdate],
  );

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDragging.current) return;
      const dx = Math.round((e.clientX - lastPosition.current.x) / scale.current);
      const dy = Math.round((e.clientY - lastPosition.current.y) / scale.current);
      offset.current = { x: offset.current.x + dx, y: offset.current.y + dy };
      lastPosition.current = { x: e.clientX, y: e.clientY };
      scheduleUpdate();
    },
    [scheduleUpdate],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
      className="size-full touch-none"
    />
  );
}
