/* /assets/toc.js — TOC drawer plumbing (open/close, overlay, focus, smooth scroll)
   Content is rendered separately by /assets/toc.global.js from SITE.tocOrder + ANCHOR_IDS.
*/
(function () {
  const root  = document.documentElement;
  const mount = document.getElementById('TOC');
  if (!mount) return;

  const offsetPx   = 72;          // matches scroll-margin-top
  const BREAKPOINT = 600;         // phones only = overlay

  // Ensure overlay backdrop exists (phones)
  let backdrop = document.querySelector('.toc-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'toc-backdrop';
    document.body.appendChild(backdrop);
  }

  // Button (auto-inserted by /assets/header.js)
  const btn = document.getElementById('toc-open');

  // Media query for mobile overlay behavior
  const mq = window.matchMedia(`(max-width:${BREAKPOINT}px)`);

  // Open/close
  function setOpen(open) {
    root.classList.toggle('toc-open', open);

    // ARIA sync (header.js also observes .toc-open and updates aria-expanded)
    if (btn) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close table of contents' : 'Open table of contents');
    }

    // Focus & inert on phones
    if (mq.matches) {
      mount.toggleAttribute('inert', !open);
      if (open) {
        const first = mount.querySelector('a, button, summary, [tabindex]:not([tabindex="-1"])');
        if (first) setTimeout(() => first.focus(), 0);
      } else if (btn) {
        setTimeout(() => btn.focus(), 0);
      }
    } else {
      mount.removeAttribute('inert');
      document.body.style.overflow = '';
    }
  }

  // Start closed everywhere
  setOpen(false);

  // Keep inert consistent across viewport changes
  mq.addEventListener('change', () => {
    const isOpen = root.classList.contains('toc-open');
    mount.toggleAttribute('inert', mq.matches && !isOpen);
  });

  // Toggle via button
  if (btn) btn.addEventListener('click', () => setOpen(!root.classList.contains('toc-open')));

  // Backdrop click closes (phones)
  backdrop.addEventListener('click', () => setOpen(false));

  // Escape closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('toc-open')) setOpen(false);
  });

  // Close when clicking outside on desktop
  document.addEventListener('click', (e) => {
    if (!root.classList.contains('toc-open')) return;
    if (mq.matches) return; // phones use backdrop
    const insideToc = e.target.closest('#TOC');
    const onButton  = e.target.closest('#toc-open');
    if (!insideToc && !onButton) setOpen(false);
  });

  // Handle clicks inside TOC:
  // - Same-page anchors (#id): smooth scroll with offset
  // - Cross-page links (/about/#id): let browser navigate
  mount.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;

    const url = new URL(a.getAttribute('href'), location.origin);
    const samePage = (url.origin === location.origin && url.pathname === location.pathname && url.hash);

    setOpen(false);

    if (samePage) {
      e.preventDefault();
      const id = decodeURIComponent(url.hash.slice(1));
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - offsetPx;
        history.pushState(null, '', '#' + encodeURIComponent(id));
        window.scrollTo({ top, behavior: 'smooth' });
      } else {
        // fallback to default behavior
        location.hash = url.hash;
      }
    }
    // cross-page: default navigation
  });

  // Safety: close on hash changes initiated elsewhere
  window.addEventListener('hashchange', () => { setOpen(false); });
})();