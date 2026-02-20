"use client";

import { useEffect, useRef, useCallback } from "react";

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
  const brightLayerRef = useRef<HTMLDivElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

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

  const buildMask = useCallback((now: number) => {
    const el = brightLayerRef.current;
    if (!el) return;

    const ripples = ripplesRef.current;
    const mouse = mouseRef.current;

    // Expire old ripples
    while (ripples.length > 0 && now - ripples[0].time > RIPPLE_DURATION) {
      ripples.shift();
    }

    const gradients: string[] = [];

    // Hover glow: soft radial spot following cursor
    if (mouse.x > -9000) {
      gradients.push(
        `radial-gradient(circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,${HOVER_OPACITY}) 0px, rgba(255,255,255,${HOVER_OPACITY * 0.5}) ${HOVER_RADIUS * 0.5}px, transparent ${HOVER_RADIUS}px)`
      );
    }

    // Click ripples
    for (const rip of ripples) {
      const elapsed = now - rip.time;
      const progress = elapsed / RIPPLE_DURATION;
      const radius = elapsed * RIPPLE_SPEED;

      const fade = (1 - progress) * (1 - progress) * RIPPLE_PEAK_OPACITY;

      const innerStart = Math.max(0, radius - RIPPLE_RING_WIDTH / 2 - RIPPLE_FADE_WIDTH);
      const innerEdge = Math.max(0, radius - RIPPLE_RING_WIDTH / 2);
      const outerEdge = radius + RIPPLE_RING_WIDTH / 2;
      const outerEnd = radius + RIPPLE_RING_WIDTH / 2 + RIPPLE_FADE_WIDTH;

      gradients.push(
        `radial-gradient(circle at ${rip.x}px ${rip.y}px, transparent ${innerStart}px, rgba(255,255,255,${fade}) ${innerEdge}px, rgba(255,255,255,${fade}) ${outerEdge}px, transparent ${outerEnd}px)`
      );
    }

    if (gradients.length === 0) {
      el.style.maskImage = "linear-gradient(transparent,transparent)";
      el.style.webkitMaskImage = "linear-gradient(transparent,transparent)";
    } else {
      const mask = gradients.join(", ");
      el.style.maskImage = mask;
      el.style.webkitMaskImage = mask;
      el.style.maskComposite = "add";
      el.style.webkitMaskComposite = "source-over";
    }

    rafRef.current = requestAnimationFrame(buildMask);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMouseDown = (e: MouseEvent) => {
      const ripples = ripplesRef.current;
      ripples.push({ x: e.clientX, y: e.clientY, time: performance.now() });
      if (ripples.length > 10) ripples.splice(0, ripples.length - 10);
    };
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    rafRef.current = requestAnimationFrame(buildMask);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [buildMask]);

  const scalePolygons = (id: string, stroke: string, strokeWidth: string) => (
    <pattern
      id={id}
      width={TILE_W}
      height={TILE_H}
      patternUnits="userSpaceOnUse"
    >
      {scales.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      ))}
    </pattern>
  );

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Dim base scale pattern */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {scalePolygons("scales", "rgba(52,211,153,0.07)", "0.5")}
        </defs>
        <rect width="100%" height="100%" fill="url(#scales)" />
      </svg>

      {/* Bright scale pattern — revealed by ripple mask */}
      <div
        ref={brightLayerRef}
        className="absolute inset-0 w-full h-full"
        style={{ maskImage: "linear-gradient(transparent,transparent)", WebkitMaskImage: "linear-gradient(transparent,transparent)" }}
      >
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {scalePolygons("scales-bright", "rgba(52,211,153,0.35)", "0.8")}
          </defs>
          <rect width="100%" height="100%" fill="url(#scales-bright)" />
        </svg>
      </div>

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
const CANVAS_SCALE = 8;

// Hover + ripple constants for bright scale layer
const HOVER_RADIUS = 120; // px
const HOVER_OPACITY = 0.5;
const RIPPLE_SPEED = 0.3; // px/ms
const RIPPLE_RING_WIDTH = 50; // px
const RIPPLE_FADE_WIDTH = 30; // px soft edges
const RIPPLE_DURATION = 1200; // ms
const RIPPLE_PEAK_OPACITY = 0.9;

type Ripple = { x: number; y: number; time: number };

function PerlinBreath() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = Math.ceil(window.innerWidth / CANVAS_SCALE);
    let h = Math.ceil(window.innerHeight / CANVAS_SCALE);
    canvas.width = w;
    canvas.height = h;

    const resize = () => {
      w = Math.ceil(window.innerWidth / CANVAS_SCALE);
      h = Math.ceil(window.innerHeight / CANVAS_SCALE);
      canvas.width = w;
      canvas.height = h;
    };

    window.addEventListener("resize", resize);

    let raf: number;
    const draw = (now: number) => {
      const t = now * 0.0001;
      const img = ctx.createImageData(w, h);
      const d = img.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const nx = x * 0.03 + t * 0.8;
          const ny = y * 0.03 + t * 0.5;
          const n = fbm(nx, ny, 5);
          const v = Math.max(0, (n + 1) * 0.5);
          const alpha = v * v * 0.08;

          const i = (y * w + x) * 4;
          d[i] = 52;
          d[i + 1] = 211;
          d[i + 2] = 153;
          d[i + 3] = Math.min(alpha * 255, 255);
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
