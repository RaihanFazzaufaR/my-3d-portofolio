import * as THREE from 'three';

// Soft circular glow sprite for rendering ethereal stars and nebula clouds without harsh square pixels
let cachedParticleTexture: THREE.CanvasTexture | null = null;

export function getParticleTexture(): THREE.CanvasTexture {
  if (cachedParticleTexture) return cachedParticleTexture;
  if (typeof document === 'undefined') return new THREE.CanvasTexture(null as unknown as HTMLCanvasElement);

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.7)');
  grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  cachedParticleTexture = new THREE.CanvasTexture(canvas);
  return cachedParticleTexture;
}

// Organic Gaussian cloud puff texture for volumetric deep-space nebula rendering
let cachedNebulaTexture: THREE.CanvasTexture | null = null;

export function getNebulaCloudTexture(): THREE.CanvasTexture {
  if (cachedNebulaTexture) return cachedNebulaTexture;
  if (typeof document === 'undefined') return new THREE.CanvasTexture(null as unknown as HTMLCanvasElement);

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.35)');
  grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.12)');
  grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.03)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  cachedNebulaTexture = new THREE.CanvasTexture(canvas);
  return cachedNebulaTexture;
}

// Mulberry32 deterministic PRNG
export function createPrng(seed: number) {
  let s = Math.floor(seed * 100000) + 12345;
  return function() {
    let t = s += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
