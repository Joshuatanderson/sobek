"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// --- Voronoi-based crocodile scale pattern ---
// Viewport-sized generation (no tiling) for seamless coverage
// Random polygonal domains matching crocodilian head scale geometry
// (Milinkovitch et al., Science 2013 — Lewis's Law, Aboav-Weaire statistics)
// Size distribution from fragmentation mechanics (Qin, Pugno & Buehler, 2014)
// L(ε) = L∞ + 2γ / [E(1-ν²)(εᵅ - εfᵅ)]

const TARGET_CELL = 22; // average cell size in px
const JITTER = 0.45;
const PAD = 3; // extra rows/cols beyond viewport for correct edge cells

function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// --- Fragmentation size model (Qin et al., 2014, Scientific Reports) ---
const FRAG_ALPHA = 2.4;
const FRAG_EPS_F = 0.05;
const FRAG_EPS_F_A = Math.pow(FRAG_EPS_F, FRAG_ALPHA);
const FRAG_C = 0.4 * (Math.pow(0.15, FRAG_ALPHA) - FRAG_EPS_F_A);
const FRAG_L_INF = 0.6;

function fragmentSize(strain: number): number {
  const ea = Math.pow(Math.max(strain, FRAG_EPS_F + 0.001), FRAG_ALPHA);
  return FRAG_L_INF + FRAG_C / (ea - FRAG_EPS_F_A);
}

function variableSpacing(count: number, total: number, seedBase: number): number[] {
  const sizes = Array.from({ length: count }, (_, i) => {
    const strain = 0.06 + rand(seedBase + i * 7) * 0.24;
    return fragmentSize(strain);
  });
  const sum = sizes.reduce((a, b) => a + b, 0);
  return sizes.map(s => (s / sum) * total);
}

type Point = { x: number; y: number };

// Sutherland-Hodgman: keep side where dot(v - o, n) <= 0
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

const fmt = (n: number) => { const s = n.toFixed(1); return s === "-0.0" ? "0.0" : s; };

function generateViewportCells(vpW: number, vpH: number): string[] {
  const totalW = vpW + PAD * 2 * TARGET_CELL;
  const totalH = vpH + PAD * 2 * TARGET_CELL;
  const totalCols = Math.round(totalW / TARGET_CELL);
  const totalRows = Math.round(totalH / TARGET_CELL);

  const colW = variableSpacing(totalCols, totalW, 1000);
  const rowH = variableSpacing(totalRows, totalH, 2000);

  // Cumulative centers, offset so padding cols/rows are off-screen
  const padOffX = colW.slice(0, PAD).reduce((a, b) => a + b, 0);
  const padOffY = rowH.slice(0, PAD).reduce((a, b) => a + b, 0);

  const colCenters: number[] = [];
  { let x = -padOffX; for (let c = 0; c < totalCols; c++) { colCenters.push(x + colW[c] / 2); x += colW[c]; } }
  const rowCenters: number[] = [];
  { let y = -padOffY; for (let r = 0; r < totalRows; r++) { rowCenters.push(y + rowH[r] / 2); y += rowH[r]; } }

  // Generate jittered points
  const points: Point[] = [];
  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const seed = r * 137 + c * 311 + 42;
      const jx = (rand(seed) - 0.5) * colW[c] * JITTER * 2;
      const jy = (rand(seed + 1) - 0.5) * rowH[r] * JITTER * 2;
      points.push({ x: colCenters[c] + jx, y: rowCenters[r] + jy });
    }
  }

  const maxCell = Math.max(...colW, ...rowH);
  const reach = maxCell * 2;
  const cells: string[] = [];

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const p = points[r * totalCols + c];

      // Skip cells too far outside viewport
      if (p.x < -reach || p.x > vpW + reach) continue;
      if (p.y < -reach || p.y > vpH + reach) continue;

      let poly: [number, number][] = [
        [p.x - reach, p.y - reach],
        [p.x + reach, p.y - reach],
        [p.x + reach, p.y + reach],
        [p.x - reach, p.y + reach],
      ];

      // Clip against grid neighbors (±3 rows/cols)
      outer:
      for (let dr = -3; dr <= 3; dr++) {
        for (let dc = -3; dc <= 3; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= totalRows || nc < 0 || nc >= totalCols) continue;
          const q = points[nr * totalCols + nc];
          poly = clipPoly(poly, (p.x + q.x) / 2, (p.y + q.y) / 2, q.x - p.x, q.y - p.y);
          if (poly.length < 3) break outer;
        }
      }

      if (poly.length < 3) continue;
      cells.push(poly.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" "));
    }
  }

  return cells;
}

// Hover + ripple constants
const HOVER_RADIUS = 120;
const HOVER_OPACITY = 0.5;
const RIPPLE_SPEED = 0.3;
const RIPPLE_RING_WIDTH = 50;
const RIPPLE_FADE_WIDTH = 30;
const RIPPLE_DURATION = 1200;
const RIPPLE_PEAK_OPACITY = 0.9;

type Ripple = { x: number; y: number; time: number };

export function ScaleBackground() {
  const [cells, setCells] = useState<string[]>([]);
  const brightLayerRef = useRef<HTMLDivElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const rafRef = useRef<number>(0);

  // Generate cells for viewport on mount
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setCells(generateViewportCells(w, h));

    let genW = w;
    let genH = h;
    const onResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      // Only recompute if viewport grew significantly past what we generated
      if (nw > genW + 200 || nh > genH + 200) {
        genW = nw;
        genH = nh;
        setCells(generateViewportCells(nw, nh));
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const buildMask = useCallback((now: number) => {
    const el = brightLayerRef.current;
    if (!el) return;

    const ripples = ripplesRef.current;
    const mouse = mouseRef.current;

    while (ripples.length > 0 && now - ripples[0].time > RIPPLE_DURATION) {
      ripples.shift();
    }

    const gradients: string[] = [];

    if (mouse.x > -9000) {
      gradients.push(
        `radial-gradient(circle at ${mouse.x}px ${mouse.y}px, rgba(255,255,255,${HOVER_OPACITY}) 0px, rgba(255,255,255,${HOVER_OPACITY * 0.5}) ${HOVER_RADIUS * 0.5}px, transparent ${HOVER_RADIUS}px)`
      );
    }

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

  const polygons = (stroke: string, strokeWidth: string) =>
    cells.map((pts, i) => (
      <polygon
        key={i}
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    ));

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {polygons("rgba(52,211,153,0.07)", "0.5")}
      </svg>

      <div
        ref={brightLayerRef}
        className="absolute inset-0 w-full h-full"
        style={{ maskImage: "linear-gradient(transparent,transparent)", WebkitMaskImage: "linear-gradient(transparent,transparent)" }}
      >
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {polygons("rgba(52,211,153,0.35)", "0.8")}
        </svg>
      </div>

      <PerlinBreath />
    </div>
  );
}

// --- 2D gradient noise (simplified Perlin) ---
const PERM = new Uint8Array(512);
{
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  let s = 42;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}

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

function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amp * noise2d(x * freq, y * freq);
    amp *= 0.5;
    freq *= 2.0;
  }
  return value;
}

const CANVAS_SCALE = 8;

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
