/**
 * Source artwork for the olive-ring-box theme, as parametric SVG.
 *
 * Every independently animated element is its own layer (see ../brief.md §6).
 * Raster layers (velvet, satin, metal, background) are rendered to transparent
 * WebP at 2× by `render-layers.ts`; simple ornaments stay SVG.
 *
 * All box faces are drawn flat and "front-on": the theme assembles them into a
 * 3D box with CSS transforms, so perspective, shadows and the lid rotation
 * stay physically consistent. Face sizes are in CSS px (display size).
 */

export const BOX = { width: 200, depth: 140, baseHeight: 70, lidHeight: 56 } as const;

export const PALETTE = {
  beige: '#F3EBDD',
  olive: '#626B45',
  deepOlive: '#39412D',
  champagne: '#C8AF79',
} as const;

type Layer = { name: string; width: number; height: number; svg: string; format: 'webp' | 'svg' };

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;

/**
 * Opaque grey noise centred on 50 % grey, with the given contrast. (Raw
 * feTurbulence output also has noisy alpha, which would darken the blend.)
 */
const noise = (result: string, freq: string, octaves: number, seed: number, contrast: number) => {
  const c = contrast / 3;
  const i = (1 - contrast) / 2;
  return `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" seed="${seed}" stitchTiles="stitch"/>` +
    `<feColorMatrix type="matrix" values="${c} ${c} ${c} 0 ${i}  ${c} ${c} ${c} 0 ${i}  ${c} ${c} ${c} 0 ${i}  0 0 0 0 1" result="${result}"/>`;
};

/**
 * Velvet pile: fine fibre noise plus broad crush variation, soft-light blended
 * over the base colour (noise is the source, the artwork the backdrop).
 */
const velvetFilter = (id: string, seed: number, strength = 0.9) => `
  <filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
    ${noise('fineS', '0.95', 2, seed, strength)}
    ${noise('broadS', '0.018 0.03', 3, seed + 17, 0.35)}
    <feBlend in="broadS" in2="SourceGraphic" mode="soft-light" result="a"/>
    <feBlend in="fineS" in2="a" mode="soft-light" result="b"/>
    <feComposite in="b" in2="SourceAlpha" operator="in"/>
  </filter>`;

/**
 * A velvet face: vertical light falloff, a soft sheen at the edges (velvet
 * catches light at grazing angles) and pile texture.
 */
function velvetFace(opts: {
  name: string;
  w: number;
  h: number;
  top: string;
  bottom: string;
  sheen?: number;
  seed: number;
  radius?: number;
  extra?: string;
}): Layer {
  const { name, w, h, top, bottom, sheen = 0.35, seed, radius = 3, extra = '' } = opts;
  const body = `
  <defs>
    ${velvetFilter('v', seed)}
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
    <radialGradient id="shade" cx="0.5" cy="0.35" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></radialGradient>
    <filter id="blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${Math.max(2, Math.min(w, h) * 0.05)}"/></filter>
    <clipPath id="c"><rect width="${w}" height="${h}" rx="${radius}"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <g filter="url(#v)">
      <rect width="${w}" height="${h}" fill="url(#g)"/>
      <rect width="${w}" height="${h}" fill="url(#shade)"/>
      <rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="${radius}" fill="none" stroke="#B9C08E" stroke-opacity="${sheen}" stroke-width="${Math.max(3, Math.min(w, h) * 0.07)}" filter="url(#blur)"/>
    </g>
    ${extra}
  </g>`;
  return { name, width: w, height: h, svg: svg(w, h, body), format: 'webp' };
}

const { width: W, depth: D, baseHeight: HB, lidHeight: HL } = BOX;

/** The ring insert: velvet rim around two padded cushions meeting at a slit. */
function ringInsert(): Layer {
  const inset = 11;
  const cw = W - inset * 2;
  const ch = D - inset * 2;
  const pillow = (y: number, h: number, id: string) => `
    <radialGradient id="${id}" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="#6F7850"/><stop offset="0.7" stop-color="#555D3A"/><stop offset="1" stop-color="#3C4228"/></radialGradient>
    <rect x="${inset}" y="${y}" width="${cw}" height="${h}" rx="${h / 2.4}" fill="url(#${id})"/>`;
  const slitY = inset + ch / 2;
  const body = `
  <defs>
    ${velvetFilter('v', 23)}
    <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E6742"/><stop offset="1" stop-color="#6E774D"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>
  <g filter="url(#v)">
    <rect width="${W}" height="${D}" rx="4" fill="url(#rim)"/>
    <rect x="${inset - 2}" y="${inset - 2}" width="${cw + 4}" height="${ch + 4}" rx="9" fill="#2F3420" opacity="0.8" filter="url(#soft)"/>
    ${pillow(inset, ch / 2, 'p1')}
    ${pillow(slitY, ch / 2, 'p2')}
    <rect x="${inset + 6}" y="${slitY - 1.2}" width="${cw - 12}" height="2.4" rx="1.2" fill="#1F2315"/>
    <rect x="${inset + 6}" y="${slitY - 3}" width="${cw - 12}" height="6" rx="3" fill="#20241A" opacity="0.45" filter="url(#soft)"/>
  </g>`;
  return { name: 'ring-insert', width: W, height: D, svg: svg(W, D, body), format: 'webp' };
}

/** The lid lining: champagne satin with soft folds and a thin velvet piping. */
function lidLining(): Layer {
  const body = `
  <defs>
    <linearGradient id="satin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F4EAD2"/><stop offset="0.22" stop-color="#E2D1A8"/><stop offset="0.38" stop-color="#F7EFDC"/>
      <stop offset="0.55" stop-color="#DCC89C"/><stop offset="0.72" stop-color="#F0E4C8"/><stop offset="1" stop-color="#CDB684"/>
    </linearGradient>
    <radialGradient id="vig" cx="0.5" cy="0.55" r="0.7"><stop offset="0.6" stop-color="#6B5A2E" stop-opacity="0"/><stop offset="1" stop-color="#6B5A2E" stop-opacity="0.28"/></radialGradient>
    <filter id="silk" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      ${noise('s', '0.004 0.06', 2, 5, 0.3)}
      <feBlend in="s" in2="SourceGraphic" mode="soft-light" result="b"/>
      <feComposite in="b" in2="SourceAlpha" operator="in"/>
    </filter>
    ${velvetFilter('v', 31)}
  </defs>
  <rect width="${W}" height="${D}" rx="4" fill="#58603D" filter="url(#v)"/>
  <g filter="url(#silk)">
    <rect x="7" y="7" width="${W - 14}" height="${D - 14}" rx="6" fill="url(#satin)"/>
    <rect x="7" y="7" width="${W - 14}" height="${D - 14}" rx="6" fill="url(#vig)"/>
  </g>
  <rect x="16" y="16" width="${W - 32}" height="${D - 32}" rx="4" fill="none" stroke="${PALETTE.champagne}" stroke-opacity="0.55" stroke-width="0.8"/>`;
  return { name: 'lid-lining', width: W, height: D, svg: svg(W, D, body), format: 'webp' };
}

/** Polished champagne-gold metal gradient stops. */
const goldStops = `
  <stop offset="0" stop-color="#7C6331"/><stop offset="0.18" stop-color="#C9AF74"/><stop offset="0.34" stop-color="#F7E7BE"/>
  <stop offset="0.46" stop-color="#C8AF79"/><stop offset="0.62" stop-color="#9C7F45"/><stop offset="0.8" stop-color="#E8D3A0"/><stop offset="1" stop-color="#7A6030"/>`;

/**
 * Two wedding bands standing in the cushion slit. The layer's bottom edge is
 * the slit line: everything below it is hidden inside the cushion.
 */
function rings(): Layer {
  const w = W;
  // Tall enough for the rings, short enough to stay inside the closed lid.
  const h = 54;
  const ring = (cx: number, r: number, band: number, id: string, tilt: number) => {
    const cy = h - r * 0.36;
    const inner = r - band;
    return `
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${tilt} 0.5 0.5)">${goldStops}</linearGradient>
    <linearGradient id="${id}i" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#F2E0B0"/><stop offset="1" stop-color="#8F7440"/></linearGradient>
    <g>
      <ellipse cx="${cx}" cy="${cy}" rx="${inner + 0.6}" ry="${(inner + 0.6) * 0.96}" fill="none" stroke="url(#${id}i)" stroke-width="2.2" opacity="0.9"/>
      <path fill-rule="evenodd" fill="url(#${id})" d="M ${cx - r} ${cy} a ${r} ${r * 0.97} 0 1 0 ${2 * r} 0 a ${r} ${r * 0.97} 0 1 0 ${-2 * r} 0 Z M ${cx - inner} ${cy} a ${inner} ${inner * 0.96} 0 1 1 ${2 * inner} 0 a ${inner} ${inner * 0.96} 0 1 1 ${-2 * inner} 0 Z"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${r - 0.4}" ry="${(r - 0.4) * 0.97}" fill="none" stroke="#5E4A22" stroke-opacity="0.55" stroke-width="0.8"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${inner}" ry="${inner * 0.96}" fill="none" stroke="#5E4A22" stroke-opacity="0.5" stroke-width="0.7"/>
      <path d="M ${cx - r * 0.72} ${cy - r * 0.62} A ${r * 0.94} ${r * 0.92} 0 0 1 ${cx + r * 0.1} ${cy - r * 0.93}" fill="none" stroke="#FFF8E4" stroke-width="${band * 0.32}" stroke-linecap="round" opacity="0.85" filter="url(#spec)"/>
      <path d="M ${cx + r * 0.78} ${cy - r * 0.2} A ${r * 0.94} ${r * 0.92} 0 0 1 ${cx + r * 0.9} ${cy + r * 0.2}" fill="none" stroke="#FFF3D6" stroke-width="${band * 0.25}" stroke-linecap="round" opacity="0.6" filter="url(#spec)"/>
    </g>`;
  };
  const body = `
  <defs>
    <filter id="spec" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.7"/></filter>
    <filter id="drop" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
    <clipPath id="above"><rect width="${w}" height="${h}"/></clipPath>
  </defs>
  <g clip-path="url(#above)">
    <ellipse cx="${w / 2 - 40}" cy="${h}" rx="36" ry="5" fill="#1B1E12" opacity="0.5" filter="url(#drop)"/>
    <ellipse cx="${w / 2 + 40}" cy="${h}" rx="32" ry="5" fill="#1B1E12" opacity="0.5" filter="url(#drop)"/>
    ${ring(w / 2 - 40, 38, 8.5, 'r1', 10)}
    ${ring(w / 2 + 40, 34, 6.5, 'r2', -15)}
  </g>`;
  return { name: 'rings', width: w, height: h, svg: svg(w, h, body), format: 'webp' };
}

/** Soft contact shadow under the box. */
function boxShadow(): Layer {
  const w = 340;
  const h = 90;
  const body = `
  <defs><filter id="b" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="12"/></filter>
  <filter id="b2" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="4"/></filter></defs>
  <ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.38}" ry="${h * 0.2}" fill="#3A331F" opacity="0.38" filter="url(#b)"/>
  <ellipse cx="${w / 2}" cy="${h / 2 - 4}" rx="${W * 0.5}" ry="6" fill="#2A2616" opacity="0.45" filter="url(#b2)"/>`;
  return { name: 'box-shadow', width: w, height: h, svg: svg(w, h, body), format: 'webp' };
}

/** Full-screen warm beige background with a soft pool of light and faint paper grain. */
function background(): Layer {
  const w = 390;
  const h = 844;
  const body = `
  <defs>
    <radialGradient id="light" cx="0.5" cy="0.42" r="0.75"><stop offset="0" stop-color="#FBF6EC"/><stop offset="0.55" stop-color="${PALETTE.beige}"/><stop offset="1" stop-color="#E6D9C1"/></radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      ${noise('s', '0.8', 1, 2, 0.1)}
      <feBlend in="s" in2="SourceGraphic" mode="soft-light"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#light)" filter="url(#grain)"/>`;
  return { name: 'background', width: w, height: h, svg: svg(w, h, body), format: 'webp' };
}

/** Champagne glow that rises from inside the box. */
function glow(): Layer {
  const body = `
  <defs><radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#FFF6DE" stop-opacity="0.95"/><stop offset="0.3" stop-color="#F1DDAA" stop-opacity="0.55"/>
    <stop offset="0.65" stop-color="${PALETTE.champagne}" stop-opacity="0.18"/><stop offset="1" stop-color="${PALETTE.champagne}" stop-opacity="0"/>
  </radialGradient></defs>
  <rect width="200" height="200" fill="url(#g)"/>`;
  return { name: 'glow', width: 200, height: 200, svg: svg(200, 200, body), format: 'svg' };
}

function particle(): Layer {
  const body = `
  <defs><radialGradient id="p" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFFBEF"/><stop offset="0.35" stop-color="#F5E3B4" stop-opacity="0.8"/><stop offset="1" stop-color="${PALETTE.champagne}" stop-opacity="0"/></radialGradient></defs>
  <circle cx="8" cy="8" r="8" fill="url(#p)"/>`;
  return { name: 'particle', width: 16, height: 16, svg: svg(16, 16, body), format: 'svg' };
}

/** Diagonal light sweep, masked to the rings at runtime. */
function shimmer(): Layer {
  const body = `
  <defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#FFF8E6" stop-opacity="0"/><stop offset="0.45" stop-color="#FFF8E6" stop-opacity="0.15"/>
    <stop offset="0.5" stop-color="#FFFDF5" stop-opacity="0.9"/><stop offset="0.55" stop-color="#FFF8E6" stop-opacity="0.15"/><stop offset="1" stop-color="#FFF8E6" stop-opacity="0"/>
  </linearGradient></defs>
  <rect width="120" height="100" fill="url(#s)"/>`;
  return { name: 'shimmer', width: 120, height: 100, svg: svg(120, 100, body), format: 'svg' };
}

// ---------------------------------------------------------------------------
// Olive branches: a slender curved stem with paired lanceolate leaves (dark
// top side / silvery underside) and a few olives. Deterministic, so re-running
// the generator gives identical files.
// ---------------------------------------------------------------------------

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Pt = { x: number; y: number };
const bez = (p0: Pt, p1: Pt, p2: Pt, t: number): Pt => ({
  x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x,
  y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y,
});
const tangent = (p0: Pt, p1: Pt, p2: Pt, t: number) => {
  const dx = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};
const f = (n: number) => Number(n.toFixed(2));

function oliveBranch(opts: {
  name: string;
  w: number;
  h: number;
  stem: [Pt, Pt, Pt];
  leaves: number;
  olives: number[];
  seed: number;
  leafLength?: number;
}): Layer {
  const { name, w, h, stem, leaves, olives, seed, leafLength = 24 } = opts;
  const r = rand(seed);
  const [p0, p1, p2] = stem;
  const parts: string[] = [];
  parts.push(
    `<path d="M${f(p0.x)} ${f(p0.y)} Q${f(p1.x)} ${f(p1.y)} ${f(p2.x)} ${f(p2.y)}" fill="none" stroke="#5B5A3C" stroke-width="1.6" stroke-linecap="round"/>`,
  );
  for (let i = 0; i < leaves; i++) {
    const t = 0.1 + (0.86 * i) / Math.max(1, leaves - 1);
    const at = bez(p0, p1, p2, t);
    const dir = tangent(p0, p1, p2, t);
    const side = i % 2 === 0 ? 1 : -1;
    const angle = dir + side * (32 + r() * 18);
    const len = leafLength * (0.72 + 0.35 * r()) * (i === leaves - 1 ? 0.8 : 1);
    const wid = len * (0.17 + 0.04 * r());
    const under = r() < 0.3;
    const fill = under ? '#9A9E78' : r() < 0.5 ? '#626B45' : '#56603C';
    const vein = under ? '#C3C4A2' : '#8A9266';
    parts.push(
      `<g transform="translate(${f(at.x)} ${f(at.y)}) rotate(${f(angle)})">` +
        `<path d="M0 0 C${f(len * 0.3)} ${f(-wid)} ${f(len * 0.75)} ${f(-wid * 0.9)} ${f(len)} 0 C${f(len * 0.75)} ${f(wid * 0.9)} ${f(len * 0.3)} ${f(wid)} 0 0Z" fill="${fill}"/>` +
        `<path d="M1 0 L${f(len * 0.92)} 0" stroke="${vein}" stroke-width="0.55" stroke-linecap="round" opacity="0.8"/>` +
        `</g>`,
    );
  }
  for (const t of olives) {
    const at = bez(p0, p1, p2, t);
    const dir = tangent(p0, p1, p2, t) + 90;
    const off = 7;
    const cx = at.x + Math.cos((dir * Math.PI) / 180) * off;
    const cy = at.y + Math.sin((dir * Math.PI) / 180) * off;
    parts.push(
      `<path d="M${f(at.x)} ${f(at.y)} L${f(cx)} ${f(cy)}" stroke="#5B5A3C" stroke-width="0.9"/>` +
        `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="4.2" ry="5.6" transform="rotate(${f(dir - 90)} ${f(cx)} ${f(cy)})" fill="#4A5234"/>` +
        `<ellipse cx="${f(cx - 1.2)}" cy="${f(cy - 1.6)}" rx="1.2" ry="1.6" fill="#C8CBA6" opacity="0.55"/>`,
    );
  }
  return { name, width: w, height: h, svg: svg(w, h, parts.join('')), format: 'svg' };
}

export const LAYERS: Layer[] = [
  background(),
  boxShadow(),
  velvetFace({ name: 'box-base-front', w: W, h: HB, top: '#6C7550', bottom: '#454C30', seed: 3 }),
  velvetFace({ name: 'box-base-side', w: D, h: HB, top: '#555D3C', bottom: '#373D26', seed: 5, sheen: 0.2 }),
  ringInsert(),
  rings(),
  velvetFace({
    name: 'lid-top',
    w: W,
    h: D,
    top: '#6B744C',
    bottom: '#7E875B',
    seed: 9,
    sheen: 0.45,
    radius: 6,
    extra: `<filter id="hl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter><ellipse cx="${W / 2}" cy="${D * 0.6}" rx="${W * 0.36}" ry="${D * 0.26}" fill="#D3D8A8" opacity="0.2" filter="url(#hl)"/>`,
  }),
  velvetFace({
    name: 'lid-front',
    w: W,
    h: HL,
    top: '#7A8356',
    bottom: '#59623F',
    seed: 13,
    extra: `<rect x="${W / 2 - 9}" y="${HL - 7}" width="18" height="5" rx="1.5" fill="${PALETTE.champagne}"/><rect x="${W / 2 - 9}" y="${HL - 7}" width="18" height="1.6" rx="0.8" fill="#F3E3B8" opacity="0.8"/>`,
  }),
  velvetFace({ name: 'lid-side', w: D, h: HL, top: '#606942', bottom: '#454C30', seed: 15, sheen: 0.25 }),
  velvetFace({ name: 'lid-inner-wall', w: W, h: HL, top: '#3F4629', bottom: '#4E5634', seed: 19, sheen: 0.1 }),
  lidLining(),
  glow(),
  particle(),
  shimmer(),
  oliveBranch({
    name: 'olive-branch-top',
    w: 150,
    h: 110,
    stem: [{ x: 146, y: 6 }, { x: 96, y: 18 }, { x: 18, y: 96 }],
    leaves: 11,
    olives: [0.42, 0.7],
    seed: 42,
  }),
  oliveBranch({
    name: 'olive-branch-side',
    w: 120,
    h: 150,
    stem: [{ x: 116, y: 146 }, { x: 70, y: 110 }, { x: 40, y: 10 }],
    leaves: 9,
    olives: [0.55],
    seed: 7,
    leafLength: 22,
  }),
  oliveBranch({
    name: 'olive-sprig',
    w: 150,
    h: 44,
    stem: [{ x: 6, y: 34 }, { x: 70, y: 6 }, { x: 144, y: 30 }],
    leaves: 10,
    olives: [0.5],
    seed: 19,
    leafLength: 18,
  }),
];
