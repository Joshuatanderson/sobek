"use client";

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
      <div className="absolute inset-0 scale-breath" />
    </div>
  );
}
