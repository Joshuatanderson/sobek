"use client";

import { useMemo } from "react";

// Same constants / math as generate-scales.ts
const CELL = 20;
const JITTER = 0.45;

function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function clipPoly(
  poly: [number, number][],
  ox: number, oy: number,
  nx: number, ny: number
): [number, number][] {
  if (poly.length < 3) return [];
  const out: [number, number][] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = (a[0] - ox) * nx + (a[1] - oy) * ny;
    const db = (b[0] - ox) * nx + (b[1] - oy) * ny;
    if (da <= 0) {
      out.push(a);
      if (db > 0) {
        const t = da / (da - db);
        out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
      }
    } else if (db <= 0) {
      const t = da / (da - db);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

type OrbCell = { points: string; dist: number };

function generateCells(size: number): OrbCell[] {
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2;
  const pad = 2;
  const cols = Math.ceil(size / CELL) + pad * 2;
  const rows = Math.ceil(size / CELL) + pad * 2;
  const offX = -pad * CELL;
  const offY = -pad * CELL;

  const pts: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = r * 137 + c * 311 + 42;
      const jx = (rand(seed) - 0.5) * CELL * JITTER * 2;
      const jy = (rand(seed + 1) - 0.5) * CELL * JITTER * 2;
      pts.push({ x: offX + c * CELL + CELL / 2 + jx, y: offY + r * CELL + CELL / 2 + jy });
    }
  }

  const reach = CELL * 2;
  const cells: OrbCell[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = pts[r * cols + c];
      const dx = p.x - cx;
      const dy = p.y - cy;
      if (Math.sqrt(dx * dx + dy * dy) > R + reach) continue;

      let poly: [number, number][] = [
        [p.x - reach, p.y - reach],
        [p.x + reach, p.y - reach],
        [p.x + reach, p.y + reach],
        [p.x - reach, p.y + reach],
      ];

      outer: for (let dr = -3; dr <= 3; dr++) {
        for (let dc = -3; dc <= 3; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          const q = pts[nr * cols + nc];
          poly = clipPoly(poly, (p.x + q.x) / 2, (p.y + q.y) / 2, q.x - p.x, q.y - p.y);
          if (poly.length < 3) break outer;
        }
      }

      if (poly.length < 3) continue;

      const centX = poly.reduce((s, v) => s + v[0], 0) / poly.length;
      const centY = poly.reduce((s, v) => s + v[1], 0) / poly.length;
      const dist = Math.sqrt((centX - cx) ** 2 + (centY - cy) ** 2) / R;
      if (dist > 1.3) continue;

      cells.push({
        points: poly.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" "),
        dist,
      });
    }
  }

  return cells;
}

export function OrbScales({ size = 140 }: { size?: number }) {
  const cells = useMemo(() => generateCells(size), [size]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 ${size} ${size}`}
      style={{ zIndex: 1 }}
    >
      {cells.map((cell, i) => {
        // Spherical falloff: cos(θ) = sqrt(1 - r²)
        const sphere = Math.sqrt(Math.max(0, 1 - cell.dist * cell.dist));
        const strokeA = (0.09 * sphere).toFixed(4);
        const fillA = (0.015 * sphere).toFixed(4);
        return (
          <polygon
            key={i}
            points={cell.points}
            fill={`rgba(205,223,197,${fillA})`}
            stroke={`rgba(205,223,197,${strokeA})`}
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        );
      })}
    </svg>
  );
}
