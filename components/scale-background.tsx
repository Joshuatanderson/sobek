"use client";

import { useEffect, useRef } from "react";

// Alligator-scale pattern: offset rows of irregular rounded-rectangular shapes
// Real croc scales are wider than tall, arranged in a brick-like offset pattern
// with organic edges and varied sizing

const TILE_W = 48;
const TILE_H = 40;

function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// Generate an irregular, roughly rectangular scale shape with organic edges
// Uses 8 vertices around a rect for natural waviness
function scaleShape(cx: number, cy: number, hw: number, hh: number, seed: number): string {
  const pts: [number, number][] = [];
  // Walk around a rectangle: top-left → top-right → bottom-right → bottom-left
  // with 2 points per edge for organic curvature
  const corners: [number, number][] = [
    [-hw, -hh], [0, -hh], [hw, -hh],  // top edge (3 pts)
    [hw, 0],                            // right mid
    [hw, hh], [0, hh], [-hw, hh],      // bottom edge (3 pts)
    [-hw, 0],                           // left mid
  ];

  for (let i = 0; i < corners.length; i++) {
    const jx = (rand(seed + i * 3.7) - 0.5) * 2.5;
    const jy = (rand(seed + i * 5.3) - 0.5) * 2.5;
    pts.push([cx + corners[i][0] + jx, cy + corners[i][1] + jy]);
  }

  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
}

export function ScaleBackground() {
  // Brick-pattern layout: 4 scales per tile
  // Row 0: two scales side by side
  // Row 1: two scales offset by half a cell width (brick pattern)
  const cellW = TILE_W / 2; // 24
  const cellH = TILE_H / 2; // 20
  const hw = 10; // half-width of scale shape
  const hh = 7;  // half-height — wider than tall, like real scales

  const scales = [
    // Row 0
    scaleShape(cellW * 0.5, cellH * 0.5, hw + rand(1) * 1.5, hh + rand(2) * 1, 1),
    scaleShape(cellW * 1.5, cellH * 0.5, hw + rand(3) * 1.5, hh + rand(4) * 1, 2),
    // Row 1 (offset half a cell)
    scaleShape(0, cellH * 1.5, hw + rand(5) * 1.5, hh + rand(6) * 1, 3),
    scaleShape(cellW, cellH * 1.5, hw + rand(7) * 1.5, hh + rand(8) * 1, 4),
    scaleShape(TILE_W, cellH * 1.5, hw + rand(9) * 1.5, hh + rand(10) * 1, 5),
  ];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="scales"
            width={TILE_W}
            height={TILE_H}
            patternUnits="userSpaceOnUse"
          >
            {scales.map((pts, i) => (
              <polygon
                key={i}
                points={pts}
                fill="none"
                stroke="rgba(52,211,153,0.07)"
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            ))}
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#scales)" />
      </svg>
      <PerlinBreath />
    </div>
  );
}

// --- 2D gradient noise (simplified Perlin) ---
// Permutation table for hashing grid coordinates
const PERM = new Uint8Array(512);
{
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  // Fisher-Yates shuffle with fixed seed
  let s = 42;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}

// 12 gradient directions for 2D
const GRAD = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }

function noise2d(x: number, y: number): number {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const u = fade(xf);
  const v = fade(yf);

  const aa = PERM[PERM[xi] + yi] % 12;
  const ab = PERM[PERM[xi] + yi + 1] % 12;
  const ba = PERM[PERM[xi + 1] + yi] % 12;
  const bb = PERM[PERM[xi + 1] + yi + 1] % 12;

  const dot = (g: number[], fx: number, fy: number) => g[0] * fx + g[1] * fy;

  return lerp(
    lerp(dot(GRAD[aa], xf, yf), dot(GRAD[ba], xf - 1, yf), u),
    lerp(dot(GRAD[ab], xf, yf - 1), dot(GRAD[bb], xf - 1, yf - 1), u),
    v
  );
}

// Fractal Brownian Motion — layers of noise at increasing frequency
function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amp * noise2d(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.0;
  }
  return value; // roughly -1..1
}

// Canvas-based organic light field using fractal noise
// Creates drifting patches of light — no repeating pattern
function PerlinBreath() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SCALE = 8;
    let w = Math.ceil(window.innerWidth / SCALE);
    let h = Math.ceil(window.innerHeight / SCALE);
    canvas.width = w;
    canvas.height = h;

    const resize = () => {
      w = Math.ceil(window.innerWidth / SCALE);
      h = Math.ceil(window.innerHeight / SCALE);
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", resize);

    let raf: number;
    const draw = (now: number) => {
      const t = now * 0.0001; // slow drift
      const img = ctx.createImageData(w, h);
      const d = img.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          // Sample noise in world space, offset by time for animation
          const nx = x * 0.03 + t * 0.8;
          const ny = y * 0.03 + t * 0.5;

          // 5 octaves of fractal noise
          const n = fbm(nx, ny, 5);

          // Map from [-1,1] to [0,1], then apply power curve for contrast
          const v = Math.max(0, (n + 1) * 0.5);
          const alpha = v * v * 0.06;

          const i = (y * w + x) * 4;
          d[i] = 52;
          d[i + 1] = 211;
          d[i + 2] = 153;
          d[i + 3] = alpha * 255;
        }
      }

      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ imageRendering: "auto" }}
    />
  );
}
