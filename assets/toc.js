/* Collapsible ToC (H2+H3). Numbers, active highlight, hash-aware.
   Overlay at <=600px, sidebar toggle above. Stable IDs via assets/ids.js (optional).
   Add ?tocdiag=1 to the URL to display a small diagnostics line inside the TOC.
*/
(function () {
  const root  = document.documentElement;
  const mount = document.getElementById('TOC');
  if (!mount) return;

  const offsetPx   = 72;
  const BREAKPOINT = 600; // phones only = overlay
  const DIAG       = /\btocdiag=1\b/.test(location.search);

  const main = document.querySelector('main');
  if (!main) { mount.hidden = true; return; }

  // Registry (optional)
  const pageKey = document.body.dataset.page || 'home';
  const REG = (window.ANCHOR_IDS && window.ANCHOR_IDS[pageKey]) || {};

  // Slug helper
  const seen = new Map();
  const slug = s => s.toLowerCase().trim()
    .replace(/[^\w\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');

  // Build (or rebuild) the TOC; returns stats
  function buildTOC() {
    const hs = [...main.querySelectorAll('h2, h3')];
    // Assign stable IDs
    hs.forEach(h => {
      if (h.dataset.key && REG[h.dataset.key]) { h.id = REG[h.dataset.key]; return; }
      if (h.id) return;
      if (h.dataset.id) { h.id = h.dataset.id; return; }
      const base = slug(h.textContent || 'section');
      const n = (seen.get(base) || 0) + 1; seen.set(base, n);
      h.id = n > 1 ? `${base}-${n}` : base;
    });

    // Build nav
    const nav = document.createElement('nav');
    nav.className = 'toc';
    const title = document.createElement('h2'); title.textContent = 'TOC';
    nav.appendChild(title);

    let linksBuilt = 0;
    let secIdx = 0;
    for (let i = 0; i < hs.length; ) {
      if (hs[i].tagName !== 'H2') { i++; continue; }
      const h2 = hs[i++]; secIdx++;
      const d = document.createElement('details');
      const s = document.createElement('summary');
      s.innerHTML = `<span class="toc-num">${secIdx}.</span>${h2.textContent}`;
      d.appendChild(s);

      const ul = document.createElement('ul');
      let subIdx = 0;
      while (i < hs.length && hs[i].tagName === 'H3') {
        const h3 = hs[i++]; subIdx++;
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${h3.id}`;
        a.textContent = `${secIdx}.${subIdx} ${h3.textContent}`;
        li.appendChild(a);
        ul.appendChild(li);
        linksBuilt++;
      }
      d.appendChild(ul);
      nav.appendChild(d);
    }

    // Mount
    mount.textContent = '';
    mount.appendChild(nav);

    // Optional small diagnostics
    if (DIAG) {
      const diag = document.createElement('div');
      diag.style.cssText = 'font:12px/1.2 system-ui, -apple-system, Segoe UI;opacity:.7;margin:.5rem 0;';
      diag.textContent = `diag: pageKey=${pageKey}, headings=${hs.length}, links=${linksBuilt}, REG=${Object.keys(REG).length}`;
      mount.appendChild(diag);
    }

    return { headings: hs.length, links: linksBuilt, nav };
  }

  // Initial build
  let stats = buildTOC();

  // Auto-open matching section in TOC on hash
  function openForHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const a = mount.querySelector(`a[href="#${CSS.escape(id)}"]`);
    if (a) { const det = a.closest('details'); if (det) det.open = true; }
  }
  openForHash();

  // Highlight active section while scrolling
  const linkById = new Map();
  const primeLinkMap = () => {
    linkById.clear();
    mount.querySelectorAll('a').forEach(a => linkById.set(a.hash.slice(1), a));
  };
  primeLinkMap();

  const io = new IntersectionObserver(entries => {
    let best = null;
    for (const e of entries) if (e.isIntersecting) {
      if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
    }
    if (!best) return;
    const id = best.target.id;
    mount.querySelectorAll('a.active').forEach(a => a.classList.remove('active'));
    const a = linkById.get(id);
    if (a) {
      a.classList.add('active');
      const det = a.closest('details'); if (det) det.open = true;
    }
  }, { rootMargin: `-${offsetPx}px 0px -60% 0px`, threshold: [0, .25, .5, .75, 1] });

  document.querySelectorAll('main h2, main h3').forEach(h => io.observe(h));

  // Overlay + toggle plumbing
  const btn = document.getElementById('toc-open');
  let backdrop = document.querySelector('.toc-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'toc-backdrop';
    document.body.appendChild(backdrop);
  }

  const mq = window.matchMedia(`(max-width:${BREAKPOINT}px)`);

  const setOpen = (open) => {
    // If opening and we somehow built zero links, rebuild now
    if (open) {
      const currentLinks = mount.querySelectorAll('a').length;
      if (currentLinks === 0) {
        stats = buildTOC();
        primeLinkMap();
      }
    }

    root.classList.toggle('toc-open', open);

    // ARIA
    if (btn) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close table of contents' : 'Open table of contents');
    }

    // Focus & scroll behavior: no scroll lock above breakpoint
    if (mq.matches) {
      mount.toggleAttribute('inert', !open);
      // no global scroll lock by default; if you ever want it, set body.style.overflow here
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

  // Start closed everywhere
  setOpen(false);

  // Keep state sane across viewport changes
  mq.addEventListener('change', () => {
    const isOpen = root.classList.contains('toc-open');
    mount.toggleAttribute('inert', mq.matches && !isOpen);
  });

  // Toggle button
  if (btn) btn.addEventListener('click', () => setOpen(!root.classList.contains('toc-open')));

  // Backdrop (phones)
  backdrop.addEventListener('click', () => setOpen(false));

  // Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('toc-open')) setOpen(false);
  });

  // Close on TOC link click + smooth scroll with offset
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

  // Safety: close on any hash change and open relevant details
  window.addEventListener('hashchange', () => { openForHash(); setOpen(false); });

  // Desktop: clicking outside TOC closes it
  document.addEventListener('click', (e) => {
    if (!root.classList.contains('toc-open')) return;
    if (mq.matches) return; // phones use the backdrop
    const insideToc = e.target.closest('#TOC');
    const onButton  = e.target.closest('#toc-open');
    if (!insideToc && !onButton) setOpen(false);
  });
})();