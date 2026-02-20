"use client";

import { useEffect, useRef } from "react";

// Irregular hexagon vertices (alligator scute groove pattern)
function makeScale(cx: number, cy: number, r: number, seed: number): [number, number][] {
  const pts: [number, number][] = [];
  const sides = 6;
  const baseAngle = seed * 0.5;
  for (let i = 0; i < sides; i++) {
    const angle = baseAngle + (Math.PI * 2 * i) / sides;
    const jitter = 0.8 + 0.4 * pseudoRandom(seed + i * 7);
    const sx = r * jitter * 0.9;
    const sy = r * jitter * 1.1;
    pts.push([cx + Math.cos(angle) * sx, cy + Math.sin(angle) * sy]);
  }
  return pts;
}

function pseudoRandom(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function hexGrid(cx: number, cy: number, rings: number, size: number) {
  const cells: { x: number; y: number; ring: number; seed: number }[] = [];
  const w = size * 1.8;
  const h = size * 1.6;
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      const s = -q - r;
      if (Math.abs(s) > rings) continue;
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      const px = cx + w * (q + r * 0.5);
      const py = cy + h * r * 0.866;
      cells.push({ x: px, y: py, ring, seed: q * 100 + r });
    }
  }
  return cells;
}

type ClickRipple = {
  startTime: number;
  cells: { ring: number; pts: [number, number][] }[];
};

const SCALE_SIZE = 12;
const MAX_RINGS = 2;
const FADE_DURATION = 200; // ms — quick fade out
const EFFECT_DURATION = FADE_DURATION + 50;

export function ClickEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<ClickRipple[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onClick = (e: MouseEvent) => {
      const cells = hexGrid(e.clientX, e.clientY, MAX_RINGS, SCALE_SIZE);
      const withPts = cells.map((c) => ({
        ring: c.ring,
        pts: makeScale(c.x, c.y, SCALE_SIZE * 0.55, c.seed),
      }));
      ripples.current.push({ startTime: performance.now(), cells: withPts });
    };

    document.addEventListener("mousedown", onClick);

    const draw = (now: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ripples.current = ripples.current.filter((r) => now - r.startTime < EFFECT_DURATION);

      for (const ripple of ripples.current) {
        const elapsed = now - ripple.startTime;
        // All grooves appear instantly, then fade together
        const fade = 1 - Math.min(elapsed / FADE_DURATION, 1);
        if (fade <= 0) continue;

        // Ease out for smoother disappearance
        const alpha = fade * fade * 0.2;

        for (const cell of ripple.cells) {
          ctx.beginPath();
          ctx.moveTo(cell.pts[0][0], cell.pts[0][1]);
          for (let i = 1; i < cell.pts.length; i++) {
            ctx.lineTo(cell.pts[i][0], cell.pts[i][1]);
          }
          ctx.closePath();

          // Groove lines only — no fill
          ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9997] pointer-events-none"
    />
  );
}
