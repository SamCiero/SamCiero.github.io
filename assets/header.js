// /assets/header.js
// Builds header nav from SITE.nav; auto-inserts "Contents" and "Theme" buttons on every page.
// Marks current page, syncs TOC aria-expanded, and updates theme label via window.toggleTheme().

(() => {
  const S = window.SITE || {};
  const A = window.ANCHOR_IDS || {};
  const page = document.body?.dataset?.page || 'home';

  const header = document.querySelector('header');
  if (!header) return;

  // Ensure <nav> exists
  let nav = header.querySelector('nav');
  if (!nav) {
    nav = document.createElement('nav');
    header.insertBefore(nav, header.firstChild);
  }

  // Resolve stable anchor ID
  const idFor = (pg, key) => (A?.[pg]?.[key]) || '';
  const firstKey = (pg) => {
    const obj = A?.[pg] || {};
    const k = Object.keys(obj)[0];
    return k || '';
  };

  // Build header links from SITE.nav (Home + tools)
  if (Array.isArray(S.nav)) {
    const links = S.nav.map(({ page: p, label, anchorKey }) => {
      const [pg, k] = anchorKey || [p, firstKey(p)];
      const id = idFor(pg, k);
      const base = p === 'home' ? '/' : `/${p}/`;
      const href = id ? `${base}#${id}` : base;
      const current = (p === page) ? ' aria-current="page"' : '';
      return `<a href="${href}"${current}>${label}</a>`;
    });
    nav.innerHTML = links.join('');
  }

  // Ensure "Contents" button exists (left of Theme)
  let tocBtn = document.getElementById('toc-open');
  if (!tocBtn) {
    tocBtn = document.createElement('button');
    tocBtn.id = 'toc-open';
    tocBtn.type = 'button';
    tocBtn.textContent = 'Contents';
    tocBtn.setAttribute('aria-controls', 'TOC');
    tocBtn.setAttribute('aria-expanded', 'false');
    header.appendChild(tocBtn);
  }

  // Ensure Theme button exists (always present, pinned right via CSS)
  let themeBtn = document.getElementById('theme-toggle');
  if (!themeBtn) {
    themeBtn = document.createElement('button');
    themeBtn.id = 'theme-toggle';
    themeBtn.type = 'button';
    header.appendChild(themeBtn);
  }

  // Maintain deterministic order: <nav> • #toc-open • #theme-toggle
  // (Re-append to enforce order without duplicating elements)
  header.appendChild(tocBtn);
  header.appendChild(themeBtn);

  // Sync "Contents" aria-expanded with .toc-open (TOC open/close handled by /assets/toc.js)
  const syncToc = () => {
    const open = document.documentElement.classList.contains('toc-open');
    tocBtn.setAttribute('aria-expanded', String(open));
    tocBtn.setAttribute('aria-label', open ? 'Close table of contents' : 'Open table of contents');
  };
  syncToc();
  new MutationObserver(syncToc).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // Theme button label + click (actual theme switching is in /assets/theme.js via window.toggleTheme)
  const themeLabel = () => (document.documentElement.dataset.theme === 'light') ? '🌙 Dark' : '🌞 Light';
  themeBtn.textContent = themeLabel();
  themeBtn.addEventListener('click', () => {
    if (typeof window.toggleTheme === 'function') window.toggleTheme();
    themeBtn.textContent = themeLabel();
  });

  // Also react to a custom 'themechange' event (if emitted by theme.js)
  document.documentElement.addEventListener?.('themechange', () => {
    themeBtn.textContent = themeLabel();
  });
})();