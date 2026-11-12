import type { Page } from '@playwright/test';
import sharp from 'sharp';

/**
 * Finds texts that clash with the design (owner, 2026-11-08 and 2026-11-11): cut off by a box that hides what runs out
 * of it, wider than the screen, on top of another text, on a small picture or icon, or (looking at the pixels with the
 * texts hidden) on the lines or drawing of the artwork. Used by the text-length probe (`text-limits.spec.ts`) and by
 * the clash check every design must pass (`theme-clashes.spec.ts`).
 */

/** Where a text is and how it looks, so a broken layout can be compared with the design's normal one. */
export type Found = { issues: string[]; texts: { path: string; rects: { x: number; y: number; w: number; h: number }[] }[] };

async function domIssues(page: Page): Promise<Found> {
  return page.evaluate(() => {
    const path = (el: Element | null): string => {
      const parts: string[] = [];
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        let i = 1;
        for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
        parts.unshift(`${e.tagName.toLowerCase()}${i}`);
      }
      return parts.join('>');
    };
    const out = new Set<string>();
    if (document.documentElement.scrollWidth - document.documentElement.clientWidth > 1) out.add('page-wider-than-screen');
    const nodes: { node: Text; rects: DOMRect[]; path: string; turned: boolean }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n as Text;
      const el = t.parentElement;
      if (!el || !t.data.trim() || el.closest('[role="note"], script, style, [data-watermark]')) continue;
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const range = document.createRange();
      range.selectNodeContents(t);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
      // Kept out of sight inside a box that hides it (e.g. the card front's copy behind the back): not shown, not checked.
      let hidden = false;
      for (let a: HTMLElement | null = el; a && a !== document.documentElement; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const box = a.getBoundingClientRect();
        const meets = (r: DOMRect) => r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom;
        if (box.width < 1 || box.height < 1 || !rects.some(meets)) hidden = true;
        if (hidden) break;
      }
      // A turned text's boxes are upright rectangles larger than its letters: not compared with others.
      let turned = false;
      for (let a: Element | null = el; a && !turned; a = a.parentElement) {
        const tf = getComputedStyle(a).transform;
        const mx = /^matrix\(([^,]+), ([^,]+), ([^,]+)/.exec(tf);
        if (mx && (Math.abs(Number(mx[2])) > 0.01 || Math.abs(Number(mx[3])) > 0.01)) turned = true;
      }
      // Covered by something drawn on top (e.g. the opening cover over the page): not seen, not checked.
      const seen = rects.some((r) => {
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return true; // off screen: can't tell, keep it
        const top = document.elementFromPoint(x, y);
        return !top || top === el || el.contains(top) || top.contains(el);
      });
      if (rects.length && !hidden && seen) nodes.push({ node: t, rects, path: path(el), turned });
    }
    for (const { node, rects, path: p } of nodes) {
      // Cut off by a box that hides what runs out of it.
      for (let a = node.parentElement; a && a !== document.documentElement; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const box = a.getBoundingClientRect();
        if (box.height < 1 || box.width < 1) break; // hidden on purpose (e.g. a copy kept out of sight)
        if (rects.some((r) => r.left < box.left - 2 || r.right > box.right + 2 || r.top < box.top - 2 || r.bottom > box.bottom + 2)) out.add(`cut:${p}`);
        break;
      }
      // Wider than the phone.
      if (rects.some((r) => r.right > innerWidth + 2 || r.left < -2)) out.add(`offscreen:${p}`);
    }
    // Two texts on top of each other.
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const A = nodes[i]!;
        const B = nodes[j]!;
        if (A.node.parentElement === B.node.parentElement || A.turned || B.turned) continue;
        // A lone symbol (✧, ♡, a dot) is decoration, not words: a text touching it is not broken.
        if (!/[\p{L}\p{N}]/u.test(A.node.data) || !/[\p{L}\p{N}]/u.test(B.node.data)) continue;
        let hit = false;
        for (const a of A.rects) {
          for (const b of B.rects) {
            const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (w > 0 && h > 0 && w * h > 0.25 * Math.min(a.width * a.height, b.width * b.height)) hit = true;
          }
        }
        if (hit) out.add(`overlap:${[A.path, B.path].sort().join('|')}`);
      }
    // A text running into a picture or icon of the design (small pictures only: a whole-page background is meant to be under the text).
    let pageArea = innerWidth * innerHeight;
    for (const el of document.querySelectorAll('div')) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (cs.overflow === 'hidden' && r.width * r.height > 40_000 && r.width * r.height <= innerWidth * innerHeight) pageArea = Math.min(pageArea, r.width * r.height);
    }
    const graphics: { el: Element; r: DOMRect; path: string }[] = [];
    for (const el of document.body.querySelectorAll('*')) {
      const isPicture = el.matches('img, svg, canvas, video') && !el.parentElement?.closest('svg');
      if (!isPicture && getComputedStyle(el).backgroundImage === 'none') continue;
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
      const r = el.getBoundingClientRect();
      const area = r.width * r.height;
      if (area < 16 || area > 0.25 * pageArea) continue;
      // Kept out of sight (as for texts above): not shown.
      let hidden = false;
      for (let a: Element | null = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const box = a.getBoundingClientRect();
        if (box.width < 1 || box.height < 1 || r.right <= box.left || r.left >= box.right || r.bottom <= box.top || r.top >= box.bottom) hidden = true;
        if (hidden) break;
      }
      if (hidden) continue;
      graphics.push({ el, r, path: path(el) });
    }
    for (const { node, rects, path: p, turned } of nodes)
      for (const g of graphics) {
        if (turned) continue;
        if (g.el.contains(node)) continue;
        for (const a of rects) {
          const w = Math.min(a.right, g.r.right) - Math.max(a.left, g.r.left);
          const h = Math.min(a.bottom, g.r.bottom) - Math.max(a.top, g.r.top);
          if (w > 0 && h > 0 && w * h > 0.2 * Math.min(a.width * a.height, g.r.width * g.r.height)) out.add(`over-picture:${p}|${g.path}`);
        }
      }
    return {
      issues: [...out],
      texts: nodes.map((n) => ({ path: n.path, rects: n.rects.map((r) => ({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height })) })),
    };
  });
}

/**
 * DOM checks, plus the pixels under every text: with the texts hidden, a text whose box covers lines or icons of the
 * artwork (many sharp edges) is running into the design's drawing.
 */
export async function issues(page: Page): Promise<string[]> {
  const found = await domIssues(page);
  const hide = await page.addStyleTag({ content: '*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;-webkit-text-stroke:0!important;caret-color:transparent!important}svg text{fill:transparent!important;stroke:transparent!important}' });
  // Letters painted with a gradient (background-clip: text) are text too: their paint goes with them.
  const painted = await page.evaluate(() => {
    const els = [...document.querySelectorAll('*')].filter((e) => {
      const cs = getComputedStyle(e);
      return cs.backgroundClip === 'text' || cs.getPropertyValue('-webkit-background-clip') === 'text';
    }) as HTMLElement[];
    for (const e of els) {
      e.dataset.probeBg = e.style.background;
      e.style.setProperty('background', 'none', 'important');
    }
    return els.length;
  });
  const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
  await hide.evaluate((el) => (el as Element).remove());
  if (painted)
    await page.evaluate(() => {
      for (const e of document.querySelectorAll<HTMLElement>('[data-probe-bg]')) {
        e.style.removeProperty('background');
        if (e.dataset.probeBg) e.style.background = e.dataset.probeBg;
        delete e.dataset.probeBg;
      }
    });
  const { data, info } = await sharp(png).removeAlpha().greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const busy = (r: { x: number; y: number; w: number; h: number }) => {
    const x0 = Math.max(1, Math.round(r.x + 1));
    const x1 = Math.min(W - 1, Math.round(r.x + r.w - 1));
    const y0 = Math.max(1, Math.round(r.y + r.h * 0.15));
    const y1 = Math.min(H - 1, Math.round(r.y + r.h * 0.85));
    let edges = 0;
    let n = 0;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const i = y * W + x;
        const g = Math.abs(data[i + 1]! - data[i - 1]!) + Math.abs(data[i + W]! - data[i - W]!);
        if (g > 60) edges++;
        n++;
      }
    return n ? edges / n : 0;
  };
  const out = new Set(found.issues);
  for (const t of found.texts) if (t.rects.some((r) => busy(r) > 0.04)) out.add(`on-drawing:${t.path}`);
  return [...out].sort();
}
