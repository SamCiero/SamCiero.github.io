// /assets/boot.js
// Central loader: enforces global script order on every page.
// Order: theme → site-config → ids → header → toc → toc.global

const ORDER = [
  '/assets/theme.js',
  '/assets/site-config.js',
  '/assets/ids.js',
  '/assets/header.js',
  '/assets/toc.js',
  '/assets/toc.global.js'
];

function normalize(src) {
  return new URL(src, location.origin).href;
}

function alreadyLoaded(srcAbs) {
  for (const s of document.scripts) {
    if (!s.src) continue;
    try {
      if (new URL(s.src, location.origin).href === srcAbs) return true;
    } catch {}
  }
  return false;
}

function loadScript(src) {
  const abs = normalize(src);
  return new Promise((resolve, reject) => {
    if (alreadyLoaded(abs)) return resolve();
    const el = document.createElement('script');
    el.src = abs;
    // Defer attribute on dynamically added scripts is ignored, but we await onload for order.
    el.onload = resolve;
    el.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(el);
  });
}

(async () => {
  if (window.__SITE_BOOT_RAN__) return;
  window.__SITE_BOOT_RAN__ = true;

  // Modules execute after HTML parsing; header/TOC DOM is present now.
  for (const src of ORDER) {
    // eslint-disable-next-line no-await-in-loop
    await loadScript(src);
  }
})();