import * as THREE from 'three';

// Fast 2D Permutation Perlin Noise generator
class SimplexNoise2D {
  private p: number[] = [];

  constructor(seed = 12345) {
    const permutation: number[] = [];
    for (let i = 0; i < 256; i++) permutation[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const tmp = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = tmp;
    }
    this.p = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255];
    }
  }

  private fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number) {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));
    return this.lerp(v, x1, x2);
  }

  fbm(x: number, y: number, octaves = 3): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return total / maxValue;
  }
}

const noise = new SimplexNoise2D(42);

export interface PlanetTextureResult {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  color: string;
  atmosphereColor: string;
}

const textureCache = new Map<string, PlanetTextureResult>();

// Optimized resolution: 512x256 is 4x faster and provides high visual clarity on 1-unit spheres
const TEX_WIDTH = 512;
const TEX_HEIGHT = 256;

// 1. Tech Stack (Oceanic Earth / Ice Giant Hybrid)
function createTechStackTexture(): PlanetTextureResult {
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = TEX_WIDTH;
  colorCanvas.height = TEX_HEIGHT;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = TEX_WIDTH;
  bumpCanvas.height = TEX_HEIGHT;
  const bCtx = bumpCanvas.getContext('2d')!;

  const imgData = ctx.createImageData(TEX_WIDTH, TEX_HEIGHT);
  const bumpData = bCtx.createImageData(TEX_WIDTH, TEX_HEIGHT);

  for (let y = 0; y < TEX_HEIGHT; y++) {
    const lat = y / TEX_HEIGHT;
    const poleFactor = Math.abs(lat - 0.5) * 2;

    for (let x = 0; x < TEX_WIDTH; x++) {
      const lon = x / TEX_WIDTH;
      const idx = (y * TEX_WIDTH + x) * 4;

      const nx = Math.cos(lon * Math.PI * 2);
      const ny = Math.sin(lon * Math.PI * 2);
      const nz = (lat - 0.5) * 2;

      const n = noise.fbm(nx * 2.5 + 10, ny * 2.5 + nz * 2.5, 3);
      const clouds = noise.fbm(nx * 4.0 + ny * 2.0 + 50, nz * 4.0 + 30, 3);

      let r = 10, g = 35, b = 80;
      let bump = 30;

      if (poleFactor > 0.82) {
        r = 220; g = 240; b = 255;
        bump = 180;
      } else if (n > 0.04) {
        if (n > 0.22) {
          r = 180; g = 220; b = 240;
          bump = 240;
        } else if (n > 0.12) {
          r = 30; g = 160; b = 180;
          bump = 150;
        } else {
          r = 14; g = 116; b = 144;
          bump = 90;
        }
      }

      if (clouds > 0.25 && poleFactor <= 0.82) {
        const cloudAlpha = Math.min(1.0, (clouds - 0.25) * 2.2);
        r = Math.round(r * (1 - cloudAlpha) + 245 * cloudAlpha);
        g = Math.round(g * (1 - cloudAlpha) + 250 * cloudAlpha);
        b = Math.round(b * (1 - cloudAlpha) + 255 * cloudAlpha);
        bump = Math.min(255, bump + 40);
      }

      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;

      bumpData.data[idx] = bump;
      bumpData.data[idx + 1] = bump;
      bumpData.data[idx + 2] = bump;
      bumpData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  map.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapS = THREE.RepeatWrapping;

  return { map, bumpMap, color: '#38bdf8', atmosphereColor: '#7dd3fc' };
}

// 2. Journey (Jupiter Gas Giant with swirling bands & great storm)
function createJourneyTexture(): PlanetTextureResult {
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = TEX_WIDTH;
  colorCanvas.height = TEX_HEIGHT;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = TEX_WIDTH;
  bumpCanvas.height = TEX_HEIGHT;
  const bCtx = bumpCanvas.getContext('2d')!;

  const imgData = ctx.createImageData(TEX_WIDTH, TEX_HEIGHT);
  const bumpData = bCtx.createImageData(TEX_WIDTH, TEX_HEIGHT);

  const colors = [
    [254, 243, 199], // Cream
    [245, 158, 11],  // Amber gold
    [180, 83, 9],    // Burnt orange
    [120, 53, 15],   // Deep mocha
    [217, 119, 6],   // Rich bronze
  ];

  for (let y = 0; y < TEX_HEIGHT; y++) {
    const lat = y / TEX_HEIGHT;

    for (let x = 0; x < TEX_WIDTH; x++) {
      const lon = x / TEX_WIDTH;
      const idx = (y * TEX_WIDTH + x) * 4;

      const nx = Math.cos(lon * Math.PI * 2);
      const ny = Math.sin(lon * Math.PI * 2);

      const turbulence = noise.fbm(nx * 3.0, lat * 18.0 + ny * 0.5, 3);
      const bandCoord = lat * 14.0 + turbulence * 2.2;
      const bandIndex = Math.abs(Math.sin(bandCoord * Math.PI * 0.5)) * (colors.length - 1);

      const i0 = Math.floor(bandIndex);
      const i1 = Math.min(colors.length - 1, i0 + 1);
      const t = bandIndex - i0;

      let r = Math.round(colors[i0][0] * (1 - t) + colors[i1][0] * t);
      let g = Math.round(colors[i0][1] * (1 - t) + colors[i1][1] * t);
      let b = Math.round(colors[i0][2] * (1 - t) + colors[i1][2] * t);

      // Great Storm Oval (Red Spot)
      const stormX = 0.65;
      const stormY = 0.62;
      const dx = (lon - stormX) * 3.5;
      const dy = (lat - stormY) * 6.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.22) {
        const stormAlpha = Math.cos((dist / 0.22) * (Math.PI / 2));
        r = Math.round(r * (1 - stormAlpha) + 220 * stormAlpha);
        g = Math.round(g * (1 - stormAlpha) + 60 * stormAlpha);
        b = Math.round(b * (1 - stormAlpha) + 30 * stormAlpha);
      }

      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;

      const bump = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
      bumpData.data[idx] = bump;
      bumpData.data[idx + 1] = bump;
      bumpData.data[idx + 2] = bump;
      bumpData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  map.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapS = THREE.RepeatWrapping;

  return { map, bumpMap, color: '#fbbf24', atmosphereColor: '#fde68a' };
}

// 3. Lab & R&D (Emerald Saturnian Giant with jade micro-stripes)
function createBuildingTexture(): PlanetTextureResult {
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = TEX_WIDTH;
  colorCanvas.height = TEX_HEIGHT;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = TEX_WIDTH;
  bumpCanvas.height = TEX_HEIGHT;
  const bCtx = bumpCanvas.getContext('2d')!;

  const imgData = ctx.createImageData(TEX_WIDTH, TEX_HEIGHT);
  const bumpData = bCtx.createImageData(TEX_WIDTH, TEX_HEIGHT);

  const colors = [
    [110, 231, 183], // Mint
    [16, 185, 129],  // Emerald
    [4, 120, 87],    // Jade
    [4, 47, 46],     // Deep dark teal
    [52, 211, 153],  // Turquoise green
  ];

  for (let y = 0; y < TEX_HEIGHT; y++) {
    const lat = y / TEX_HEIGHT;

    for (let x = 0; x < TEX_WIDTH; x++) {
      const lon = x / TEX_WIDTH;
      const idx = (y * TEX_WIDTH + x) * 4;

      const nx = Math.cos(lon * Math.PI * 2);

      const turbulence = noise.fbm(nx * 4.0, lat * 24.0, 3);
      const bandCoord = lat * 26.0 + turbulence * 1.5;
      const bandIndex = Math.abs(Math.sin(bandCoord * Math.PI * 0.5)) * (colors.length - 1);

      const i0 = Math.floor(bandIndex);
      const i1 = Math.min(colors.length - 1, i0 + 1);
      const t = bandIndex - i0;

      const r = Math.round(colors[i0][0] * (1 - t) + colors[i1][0] * t);
      const g = Math.round(colors[i0][1] * (1 - t) + colors[i1][1] * t);
      const b = Math.round(colors[i0][2] * (1 - t) + colors[i1][2] * t);

      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;

      const bump = Math.round(r * 0.3 + g * 0.59 + b * 0.11);
      bumpData.data[idx] = bump;
      bumpData.data[idx + 1] = bump;
      bumpData.data[idx + 2] = bump;
      bumpData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  const map = new THREE.CanvasTexture(colorCanvas);
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  map.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapS = THREE.RepeatWrapping;

  return { map, bumpMap, color: '#34d399', atmosphereColor: '#6ee7b7' };
}

// 4. Comms (Mars Terrestrial with impact craters & canyons)
function createContactTexture(): PlanetTextureResult {
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = TEX_WIDTH;
  colorCanvas.height = TEX_HEIGHT;
  const ctx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = TEX_WIDTH;
  bumpCanvas.height = TEX_HEIGHT;
  const bCtx = bumpCanvas.getContext('2d')!;

  const imgData = ctx.createImageData(TEX_WIDTH, TEX_HEIGHT);
  const bumpData = bCtx.createImageData(TEX_WIDTH, TEX_HEIGHT);

  for (let y = 0; y < TEX_HEIGHT; y++) {
    const lat = y / TEX_HEIGHT;
    const poleFactor = Math.abs(lat - 0.5) * 2;

    for (let x = 0; x < TEX_WIDTH; x++) {
      const lon = x / TEX_WIDTH;
      const idx = (y * TEX_WIDTH + x) * 4;

      const nx = Math.cos(lon * Math.PI * 2);
      const ny = Math.sin(lon * Math.PI * 2);
      const nz = (lat - 0.5) * 2;

      const terrain = noise.fbm(nx * 4.0, ny * 4.0 + nz * 4.0, 3);
      const fineDust = noise.noise(nx * 16.0, ny * 16.0) * 0.15;

      let r: number;
      let g: number;
      let b: number;
      let bump: number;

      if (poleFactor > 0.88) {
        r = 240; g = 220; b = 230;
        bump = 220;
      } else if (terrain < -0.1) {
        r = 75; g = 18; b = 20;
        bump = 50;
      } else if (terrain > 0.18) {
        r = 230; g = 100; b = 80;
        bump = 210;
      } else {
        r = Math.min(255, Math.max(0, Math.round(185 + fineDust * 80)));
        g = Math.min(255, Math.max(0, Math.round(50 + fineDust * 40)));
        b = 40;
        bump = 130;
      }

      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;

      bumpData.data[idx] = bump;
      bumpData.data[idx + 1] = bump;
      bumpData.data[idx + 2] = bump;
      bumpData.data[idx + 3] = 255;
    }
  }

  // Draw distinct crater rings onto the canvas
  ctx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  ctx.lineWidth = 1.5;
  bCtx.lineWidth = 2;

  for (let i = 0; i < 22; i++) {
    const cx = (Math.sin(i * 12.34) * 0.5 + 0.5) * TEX_WIDTH;
    const cy = (Math.cos(i * 56.78) * 0.35 + 0.5) * TEX_HEIGHT;
    const r = 4 + (Math.sin(i * 9.87) * 0.5 + 0.5) * 16;

    ctx.strokeStyle = 'rgba(40, 10, 10, 0.7)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(250, 150, 130, 0.5)';
    ctx.beginPath();
    ctx.arc(cx - 1.5, cy - 1.5, r, Math.PI * 0.8, Math.PI * 1.8);
    ctx.stroke();

    bCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    bCtx.beginPath();
    bCtx.arc(cx, cy, r, 0, Math.PI * 2);
    bCtx.stroke();
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  map.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapS = THREE.RepeatWrapping;

  return { map, bumpMap, color: '#f43f5e', atmosphereColor: '#fda4af' };
}

// 5. Sun Procedural Texture (Convective solar flares & granulation)
function createSunTexture(): { map: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_WIDTH;
  canvas.height = TEX_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(TEX_WIDTH, TEX_HEIGHT);

  for (let y = 0; y < TEX_HEIGHT; y++) {
    const lat = y / TEX_HEIGHT;
    for (let x = 0; x < TEX_WIDTH; x++) {
      const lon = x / TEX_WIDTH;
      const idx = (y * TEX_WIDTH + x) * 4;

      const nx = Math.cos(lon * Math.PI * 2);
      const ny = Math.sin(lon * Math.PI * 2);
      const nz = (lat - 0.5) * 2;

      const gran1 = noise.fbm(nx * 8.0, ny * 8.0 + nz * 8.0, 3);
      const gran2 = noise.noise(nx * 20.0, nz * 20.0);
      const total = gran1 * 0.7 + gran2 * 0.3;

      let r: number;
      let g: number;
      let b: number;
      if (total > 0.15) {
        r = 255; g = 240; b = 180;
      } else if (total < -0.15) {
        r = 180; g = 50; b = 5;
      } else {
        r = 250; g = 180; b = 30;
      }

      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = THREE.RepeatWrapping;
  return { map };
}

export function getPlanetTextures(planetId: string): PlanetTextureResult {
  if (textureCache.has(planetId)) {
    return textureCache.get(planetId)!;
  }

  let result: PlanetTextureResult;
  switch (planetId) {
    case 'skills':
      result = createTechStackTexture();
      break;
    case 'experience':
      result = createJourneyTexture();
      break;
    case 'building':
      result = createBuildingTexture();
      break;
    case 'contact':
    default:
      result = createContactTexture();
      break;
  }

  textureCache.set(planetId, result);
  return result;
}

let cachedSunTexture: THREE.CanvasTexture | null = null;
export function getSunTexture(): THREE.CanvasTexture {
  if (!cachedSunTexture) {
    cachedSunTexture = createSunTexture().map;
  }
  return cachedSunTexture;
}
