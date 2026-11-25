/**
 * A café's menu in its tour (owner, 2026-11-24): what the café sells, at its prices, with how its barista makes each
 * drink. It rides in the café's model (a node `MENU`, its extras' `menu` and `photos`: one picture of the items'
 * photos, `cell` px a cell, `cols` a row; e.g. tours/koupup/menu.json, from KOUP's own online menu).
 */
import type * as THREE from 'three';

/** One thing the barista does for a drink, in order (see tours/koupup/menu.json). */
export type MakeStep =
  | { s: 'shot'; n?: number; c: string; to: number; mix?: string }
  | { s: 'water'; c: string; to: number }
  | { s: 'steam'; c: string; to: number; art?: Art; artC?: string }
  | { s: 'syrup'; b: string; c: string; to: number; into?: 'jug' }
  | { s: 'pour'; b: string; c: string; to: number; mix?: string; foam?: string }
  | { s: 'ice' }
  | { s: 'blend'; c: string; to: number }
  | { s: 'top'; g: Garnish; c?: string; b?: string };
export type Art = 'heart' | 'tulip' | 'rosetta' | 'swan';
export type Garnish = 'lime' | 'lemon' | 'mint' | 'crumbs' | 'drizzle' | 'dust' | 'seeds';
export type CupKind = 'espresso' | 'hot' | 'iced';

export type MenuItem = {
  id: number;
  cat: string;
  name: string;
  /** Its name in the café's own language, when the menu shows one. */
  local?: string;
  price: number;
  cup: CupKind | 'cookie';
  make: MakeStep[];
  look?: { crema?: string; ring?: string; speckle?: string };
  photo: number;
};
export type Menu = {
  currency: string;
  cell: number;
  cols: number;
  categories: { id: string; label: string }[];
  bottles: Record<string, { label: string; color: string; shape: string }>;
  items: MenuItem[];
};

/** The menu in a café's model, and its photos as a picture the page can show (null: the café has no menu). */
export function readMenu(scene: THREE.Object3D): { menu: Menu; photos: string | null } | null {
  const node = scene.getObjectByName('MENU');
  const data = node?.userData as { menu?: Menu; photos?: string } | undefined;
  if (!data?.menu || !Array.isArray(data.menu.items)) return null;
  let photos: string | null = null;
  const m = typeof data.photos === 'string' ? /^data:([^;]+);base64,(.*)$/.exec(data.photos) : null;
  if (m) {
    // a picture of the page's own (the tour pages allow blob: pictures)
    const bin = atob(m[2]!);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    photos = URL.createObjectURL(new Blob([bytes], { type: m[1] }));
  }
  return { menu: data.menu, photos };
}

/** Iraqi dinar notes, largest first. */
export const NOTES = [25000, 10000, 5000, 1000, 500, 250];
/** The notes paying `price` exactly, fewest first (a visitor pays the exact money). */
export function notesFor(price: number): number[] {
  const out: number[] = [];
  let left = Math.max(0, Math.round(price / 250) * 250);
  for (const n of NOTES)
    while (left >= n) {
      out.push(n);
      left -= n;
    }
  return out;
}
/** Which of the visitor's hands a menu item goes in: a drink, or something to eat. */
export const slotOf = (item: MenuItem) => (item.cup === 'cookie' ? 'cookie' : 'coffee') as 'coffee' | 'cookie';
