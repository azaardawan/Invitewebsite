/**
 * Drawing helpers shared by the 3D designs' engines (`<Gallery3D>`, `<World3D>`): pictures from this site, framed the way
 * `<Photo>` frames them, and text on canvases. three.js only (loaded with the engines, never on its own).
 */
import * as THREE from 'three';
import type { EnginePhoto } from './engine';

/** A photo's address on this site: pictures drawn in WebGL must come from the page's own site (see `/media/`). */
export function sameSite(src: string): string {
  if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) return src;
  try {
    const url = new URL(src);
    return url.origin === window.location.origin ? src : `/media${url.pathname}`;
  } catch {
    return src;
  }
}

/** Loads a picture from this site, or null when it can't (a removed photo): the spot then stays empty. */
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = sameSite(src);
  });
}

/** Draws a photo into a frame of `aspect` the way `<Photo>` shows it (cover, the customer's point kept, zoomed). */
export function framed(img: HTMLImageElement, aspect: number, width: number, focus: EnginePhoto['focus']): HTMLCanvasElement {
  const W = width;
  const H = Math.round(width / aspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const fx = Math.min(100, Math.max(0, focus.x)) / 100;
  const fy = Math.min(100, Math.max(0, focus.y)) / 100;
  const zoom = Math.max(1, focus.zoom || 1);
  const ox = W * fx;
  const oy = H * fy;
  const dx = (W - dw) * fx;
  const dy = (H - dh) * fy;
  g.drawImage(img, ox + (dx - ox) * zoom, oy + (dy - oy) * zoom, dw * zoom, dh * zoom);
  return c;
}

export function canvasTexture(c: HTMLCanvasElement, renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false; // the model's pictures are mapped with the image's top at v = 0
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

/** Writes `text` centred on a canvas, shrinking it until it fits. */
export function fitText(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, size: number, font: string, weight = 400) {
  let s = size;
  do {
    g.font = `${weight} ${s}px ${font}`;
    if (g.measureText(text).width <= maxWidth) break;
    s -= 2;
  } while (s > 12);
  g.fillText(text, x, y);
}

/** Splits a text into lines no wider than `maxWidth` (at most `max` lines; the last ends with "…" when cut). */
export function wrap(g: CanvasRenderingContext2D, text: string, maxWidth: number, max: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\n+/)) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (g.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
  }
  if (lines.length > max) {
    const cut = lines.slice(0, max);
    cut[max - 1] = `${cut[max - 1]!.replace(/\s*\S*$/, '')} …`;
    return cut;
  }
  return lines;
}

export function wrapYaw(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}
