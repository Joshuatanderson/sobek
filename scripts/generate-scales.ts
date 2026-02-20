/**
 * Build-time scale pattern generator.
 * Produces static SVG polygon strings for the dim + bright layers
 * so the background renders immediately without a flash.
 *
 * Run: npx tsx scripts/generate-scales.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";

// --- Constants (duplicated from scale-background.tsx) ---

const TARGET_CELL = 22;
const JITTER = 0.45;
const PAD = 3;

const VP_W = 2560;
const VP_H = 1600;

function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// --- Fragmentation size model ---
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
  return sizes.map((s) => (s / sum) * total);
}

type Point = { x: number; y: number };

function clipPoly(
  poly: [number, number][],
  ox: number,
  oy: number,
  nx: number,
  ny: number
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

const fmt = (n: number) => {
  const s = n.toFixed(1);
  return s === "-0.0" ? "0.0" : s;
};

// --- Perlin noise ---
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

const GRAD = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [-1, 1], [1, -1], [-1, -1],
];

function fade(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}

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

// --- Nakamasu RD ---
const RD_AREA = 4096;
const RD_STEPS = 1500;
const RD_DT = 0.015;

const RD_C = [
  [-0.04, -0.056, 0.382],
  [-0.05, 0.0, 0.25],
  [0.016, -0.03, 0.24],
];
const RD_DECAY = [0.02, 0.025, 0.06];
const RD_DIFF = [1.125, 1.125, 13.5];
const RD_FMAX = 0.5;

function rdSigmoid(x: number): number {
  return 1 / (1 + Math.exp(-10 * x));
}

function runNakamasuRD(cols: number, rows: number): Float32Array {
  const N = cols * rows;
  const u = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
  const tmp = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];

  const noiseScale = 0.045;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const n = noise2d(x * noiseScale + 100, y * noiseScale + 100);
      for (let k = 0; k < 3; k++) {
        u[k][i] = 0.5 + n * 0.15 + (rand(i * 3 + k + 8888) - 0.5) * 0.05;
      }
    }
  }

  for (let step = 0; step < RD_STEPS; step++) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const xm = x > 0 ? i - 1 : i;
        const xp = x < cols - 1 ? i + 1 : i;
        const ym = y > 0 ? i - cols : i;
        const yp = y < rows - 1 ? i + cols : i;

        const uv = [u[0][i], u[1][i], u[2][i]];
        for (let k = 0; k < 3; k++) {
          const lap = u[k][xm] + u[k][xp] + u[k][ym] + u[k][yp] - 4 * u[k][i];
          const react =
            RD_FMAX *
            rdSigmoid(
              RD_C[k][0] * uv[0] + RD_C[k][1] * uv[1] + RD_C[k][2] * uv[2]
            );
          tmp[k][i] = uv[k] + RD_DT * (RD_DIFF[k] * lap + react - RD_DECAY[k] * uv[k]);
        }
      }
    }
    for (let k = 0; k < 3; k++) u[k].set(tmp[k]);
  }

  let lo = Infinity,
    hi = -Infinity;
  for (let i = 0; i < N; i++) {
    if (u[0][i] < lo) lo = u[0][i];
    if (u[0][i] > hi) hi = u[0][i];
  }
  const range = hi - lo || 1;
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) out[i] = (u[0][i] - lo) / range;
  return out;
}

function sampleRD(
  field: Float32Array,
  cols: number,
  rows: number,
  fx: number,
  fy: number
): number {
  const x = Math.max(0, Math.min(cols - 1.001, fx));
  const y = Math.max(0, Math.min(rows - 1.001, fy));
  const x0 = Math.floor(x),
    y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, cols - 1),
    y1 = Math.min(y0 + 1, rows - 1);
  const dx = x - x0,
    dy = y - y0;
  return (
    field[y0 * cols + x0] * (1 - dx) * (1 - dy) +
    field[y0 * cols + x1] * dx * (1 - dy) +
    field[y1 * cols + x0] * (1 - dx) * dy +
    field[y1 * cols + x1] * dx * dy
  );
}

// --- Cell data ---
type CellData = { pts: string; fill: number; rd: number };

function generateViewportCells(vpW: number, vpH: number): CellData[] {
  const aspect = Math.max(vpW, 1) / Math.max(vpH, 1);
  const rdCols = Math.round(Math.sqrt(RD_AREA * aspect));
  const rdRows = Math.max(1, Math.round(rdCols / aspect));
  const rdField = runNakamasuRD(rdCols, rdRows);

  const totalW = vpW + PAD * 2 * TARGET_CELL;
  const totalH = vpH + PAD * 2 * TARGET_CELL;
  const totalCols = Math.round(totalW / TARGET_CELL);
  const totalRows = Math.round(totalH / TARGET_CELL);

  const colW = variableSpacing(totalCols, totalW, 1000);
  const rowH = variableSpacing(totalRows, totalH, 2000);

  const padOffX = colW.slice(0, PAD).reduce((a, b) => a + b, 0);
  const padOffY = rowH.slice(0, PAD).reduce((a, b) => a + b, 0);

  const colCenters: number[] = [];
  {
    let x = -padOffX;
    for (let c = 0; c < totalCols; c++) {
      colCenters.push(x + colW[c] / 2);
      x += colW[c];
    }
  }
  const rowCenters: number[] = [];
  {
    let y = -padOffY;
    for (let r = 0; r < totalRows; r++) {
      rowCenters.push(y + rowH[r] / 2);
      y += rowH[r];
    }
  }

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
  const cells: CellData[] = [];

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const p = points[r * totalCols + c];

      if (p.x < -reach || p.x > vpW + reach) continue;
      if (p.y < -reach || p.y > vpH + reach) continue;

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
          if (nr < 0 || nr >= totalRows || nc < 0 || nc >= totalCols) continue;
          const q = points[nr * totalCols + nc];
          poly = clipPoly(poly, (p.x + q.x) / 2, (p.y + q.y) / 2, q.x - p.x, q.y - p.y);
          if (poly.length < 3) break outer;
        }
      }

      if (poly.length < 3) continue;

      const cellSeed = r * 137 + c * 311 + 42;
      const fill = 0.008 + rand(cellSeed + 500) * 0.017;

      const rdX = Math.max(0, (p.x / vpW) * (rdCols - 1));
      const rdY = Math.max(0, (p.y / vpH) * (rdRows - 1));
      const rd = sampleRD(rdField, rdCols, rdRows, rdX, rdY);

      cells.push({
        pts: poly.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" "),
        fill,
        rd,
      });
    }
  }

  return cells;
}

// --- SVG polygon generation (matches scale-background.tsx rendering) ---

function buildPolygonsSvg(
  cells: CellData[],
  strokeAlpha: number,
  strokeWidth: string,
  fillScale: number
): string {
  return cells
    .map((cell) => {
      const rdMod = 0.5 + cell.rd;
      const fa = (cell.fill * fillScale * rdMod).toFixed(4);
      const sa = (strokeAlpha * (0.8 + cell.rd * 0.4)).toFixed(4);
      const r = Math.round(42 + cell.rd * 20);
      const g = Math.round(220 - cell.rd * 18);
      const b = Math.round(160 - cell.rd * 14);
      return `<polygon points="${cell.pts}" fill="rgba(${r},${g},${b},${fa})" stroke="rgba(52,211,153,${sa})" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`;
    })
    .join("\n");
}

// --- Main ---

console.log("Generating scale cells for %dx%d viewport...", VP_W, VP_H);
const t0 = performance.now();

const cells = generateViewportCells(VP_W, VP_H);

const dimSvg = buildPolygonsSvg(cells, 0.07, "0.5", 1);
const brightSvg = buildPolygonsSvg(cells, 0.35, "0.8", 5);

const elapsed = ((performance.now() - t0) / 1000).toFixed(1);
console.log("Generated %d cells in %ss", cells.length, elapsed);

const output = `// AUTO-GENERATED by scripts/generate-scales.ts — do not edit
// Viewport: ${VP_W}x${VP_H} | ${cells.length} cells

export const dimPolygons = \`
${dimSvg}
\`;

export const brightPolygons = \`
${brightSvg}
\`;
`;

const outPath = join(__dirname, "..", "components", "scale-cells.ts");
writeFileSync(outPath, output, "utf-8");
console.log("Wrote %s (%d KB)", outPath, Math.round(output.length / 1024));
