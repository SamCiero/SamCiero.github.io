(function () {
  const root  = document.documentElement;
  const mount = document.getElementById('TOC');
  if (!mount) return;

  const offsetPx = 72;
  const BREAKPOINT = 600;                // <-- iPad portrait/landscape are now "desktop"
  const LOCK_SCROLL_ON_OVERLAY = false;  // <-- turn off body scroll lock globally

  const btn = document.getElementById('toc-open');
  let backdrop = document.querySelector('.toc-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'toc-backdrop';
    document.body.appendChild(backdrop);
  }

  const mq = window.matchMedia(`(max-width: ${BREAKPOINT}px)`);

  const setOpen = (open) => {
    root.classList.toggle('toc-open', open);

    // ARIA
    if (btn) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close table of contents' : 'Open table of contents');
    }

    // Focus & (optional) scroll locking only in overlay mode
    if (mq.matches) {
      mount.toggleAttribute('inert', !open);
      if (LOCK_SCROLL_ON_OVERLAY) document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        const first = mount.querySelector('summary, a, button, [tabindex]:not([tabindex="-1"])');
        if (first) setTimeout(() => first.focus(), 0);
      } else if (btn) {
        setTimeout(() => btn.focus(), 0);
      }
    } else {
      mount.removeAttribute('inert');
      document.body.style.overflow = '';
    }
  };

  const applyViewportRules = () => {
    if (mq.matches) {
      const isOpen = root.classList.contains('toc-open');
      mount.toggleAttribute('inert', !isOpen);
      if (LOCK_SCROLL_ON_OVERLAY) document.body.style.overflow = isOpen ? 'hidden' : '';
    } else {
      mount.removeAttribute('inert');
      document.body.style.overflow = '';
    }
  };
  mq.addEventListener('change', applyViewportRules);

  // Start closed
  setOpen(false);

  // Toggle button
  if (btn) btn.addEventListener('click', () => setOpen(!root.classList.contains('toc-open')));

  // Backdrop (mobile overlay)
  backdrop.addEventListener('click', () => setOpen(false));

  // Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('toc-open')) setOpen(false);
  });

  // Close on TOC link click + smooth scroll with offset (unchanged)
  mount.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const id = decodeURIComponent(a.hash.slice(1));
    const el = document.getElementById(id);
    setOpen(false);
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - offsetPx;
      history.pushState(null, '', '#' + encodeURIComponent(id));
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      location.hash = a.hash;
    }
  });

  // Also close on any hash change (safety)
  window.addEventListener('hashchange', () => setOpen(false));

  // NEW: on desktop, clicking outside the TOC closes it (nice quality-of-life)
  document.addEventListener('click', (e) => {
    if (!root.classList.contains('toc-open')) return;
    if (mq.matches) return; // mobile uses backdrop
    const insideToc = e.target.closest('#TOC');
    const onButton  = e.target.closest('#toc-open');
    if (!insideToc && !onButton) setOpen(false);
  });
})();