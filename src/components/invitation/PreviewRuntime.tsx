/**
 * The live preview's page helper (LivePreview, owner 2026-11-26): the design shows already open, with no opening to
 * wait for. It runs before the page hydrates: the device's «less motion» setting reads as on (designs skip their
 * entrance), music never plays, the «Open» button is pressed as soon as it works, and every animation that is still
 * running is finished at once. `data-preview-ready` on <html> tells the preview the design is ready to show.
 */
export function PreviewRuntime({ openText }: { openText: string }) {
  const code = `(() => {
  const open = ${JSON.stringify(openText)};
  const mm = window.matchMedia.bind(window);
  const still = (q) => ({ matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } });
  window.matchMedia = (q) => (/prefers-reduced-motion:\\s*reduce/.test(q) ? still(q) : mm(q));
  HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  const finish = () => { for (const a of document.getAnimations()) { try { const t = a.effect && a.effect.getComputedTiming(); if (t && t.iterations !== Infinity) a.finish(); } catch {} } };
  const hydrated = (el) => Object.keys(el).some((k) => k.startsWith('__reactProps'));
  const start = Date.now();
  let clicked = 0;
  const tick = () => {
    const b = [...document.querySelectorAll('button')].find((x) => ((x.getAttribute('aria-label') || x.textContent || '').trim() === open) && x.getClientRects().length);
    if (b && hydrated(b) && Date.now() - clicked > 600) { clicked = Date.now(); b.click(); }
    finish();
    const settled = !b && document.querySelector('[data-bahja-theme] *') && Date.now() - start > 400;
    if (settled || Date.now() - start > 5000) document.documentElement.dataset.previewReady = '1';
    if (Date.now() - start < 6000) setTimeout(tick, 120);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick); else tick();
})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
