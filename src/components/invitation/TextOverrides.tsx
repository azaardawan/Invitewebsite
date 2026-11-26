'use client';

import { useEffect } from 'react';

/**
 * The owner's own changes to any text on one invitation (Admin → «Change any text», owner 2026-11-26): every text on
 * the page that holds `from` shows `to` instead (empty `to` hides it), on the online invitation and its printed files.
 * The design keeps rendering its own words; this swaps them on the page, and again whenever the design redraws.
 */
export function TextOverrides({ overrides }: { overrides: { from: string; to: string }[] }) {
  useEffect(() => {
    const pairs = overrides.filter((o) => o.from);
    if (!pairs.length) return;
    const fix = (node: Node) => {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      for (let t = walker.nextNode(); t; t = walker.nextNode()) {
        const before = t.nodeValue ?? '';
        let after = before;
        for (const { from, to } of pairs) if (after.includes(from)) after = after.split(from).join(to);
        if (after !== before) t.nodeValue = after;
      }
    };
    fix(document.body);
    // Designs draw parts later (openings, scrolling, guest replies): swap those too.
    const watch = new MutationObserver((changes) => {
      watch.disconnect();
      for (const c of changes) {
        if (c.type === 'characterData') fix(c.target.parentNode ?? c.target);
        else c.addedNodes.forEach((n) => fix(n));
      }
      watch.observe(document.body, { subtree: true, childList: true, characterData: true });
    });
    watch.observe(document.body, { subtree: true, childList: true, characterData: true });
    return () => watch.disconnect();
  }, [overrides]);
  return null;
}
