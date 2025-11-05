/* assets/toc.js
   Collapsible ToC (H2+H3). Numbers, active highlight, hash-aware, mobile/desktop overlay.
   Targets <aside id="TOC"> and a toggle button #toc-open.
   Uses registry (assets/ids.js) for stable anchors via data-key.
*/
(function () {
  const root  = document.documentElement;
  const mount = document.getElementById('TOC');
  if (!mount) return;

  const offsetPx = 72; // O1 scroll offset
  const main = document.querySelector('main');
  if (!main) { mount.hidden = true; return; }

  // Page key and registry
  const pageKey = document.body.dataset.page || 'home';
  const REG = (window.ANCHOR_IDS && window.ANCHOR_IDS[pageKey]) || {};

  // Collect headings (L23)
  const hs = [...main.querySelectorAll('h2, h3')];
  if (!hs.length) { mount.hidden = true; return; }

  // Ensure stable anchors in priority:
  // 1) data-key → REG[data-key]
  // 2) explicit id
  // 3) data-id
  // 4) slug(text) with de-dupe
  const seen = new Map();
  const slug = s => s.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  hs.forEach(h => {
    if (h.dataset.key && REG[h.dataset.key]) { h.id = REG[h.dataset.key]; return; }
    if (h.id) return;
    if (h.dataset.id) { h.id = h.dataset.id; return; }
    const base = slug(h.textContent || 'section');
    const n = (seen.get(base) || 0) + 1; seen.set(base, n);
    h.id = n > 1 ? `${base}-${n}` : base;
  });

  // Build ToC structure (N1 numbering, C0 collapsed)
  const nav = document.createElement('nav');
  nav.className = 'toc';
  const title = document.createElement('h2'); title.textContent = 'TOC';
  nav.appendChild(title);

  let secIdx = 0;
  for (let i = 0; i < hs.length; ) {
    if (hs[i].tagName !== 'H2') { i++; continue; }
    const h2 = hs[i++]; secIdx++;
    const d = document.createElement('details'); // collapsed by default
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
    }
    d.appendChild(ul);
    nav.appendChild(d);
  }

  // Mount ToC
  mount.textContent = '';
  mount.appendChild(nav);

  // Auto-open section matching current hash
  function openForHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const a = nav.querySelector(`a[href="#${CSS.escape(id)}"]`);
    if (a) { const det = a.closest('details'); if (det) det.open = true; }
  }
  openForHash();
  window.addEventListener('hashchange', openForHash);

  // Active highlight on scroll (A1)
  const linkById = new Map();
  nav.querySelectorAll('a').forEach(a => linkById.set(a.hash.slice(1), a));
  const io = new IntersectionObserver(entries => {
    let best = null;
    for (const e of entries) if (e.isIntersecting) {
      if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
    }
    if (!best) return;
    const id = best.target.id;
    nav.querySelectorAll('a.active').forEach(a => a.classList.remove('active'));
    const a = linkById.get(id);
    if (a) {
      a.classList.add('active');
      const det = a.closest('details'); if (det) det.open = true;
    }
  }, { rootMargin: `-${offsetPx}px 0px -60% 0px`, threshold: [0, .25, .5, .75, 1] });
  document.querySelectorAll('main h2, main h3').forEach(h => io.observe(h));

  // --- Toggle + overlay (mobile + desktop) ---
  const btn = document.getElementById('toc-open');

  // Backdrop once
  let backdrop = document.querySelector('.toc-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'toc-backdrop';
    document.body.appendChild(backdrop);
  }

  // Unified open/close for ALL viewports
  const setOpen = (open) => {
    root.classList.toggle('toc-open', open);
    mount.toggleAttribute('inert', !open);
    if (btn) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close table of contents' : 'Open table of contents');
    }
    // Focus niceties
    if (open) {
      const focusable = nav.querySelector('summary, a, button, [tabindex]:not([tabindex="-1"])');
      if (focusable) setTimeout(() => focusable.focus(), 0);
      document.body.style.overflow = 'hidden'; // prevent background scroll when panel is open
    } else {
      document.body.style.overflow = '';
      if (btn) setTimeout(() => btn.focus(), 0);
    }
  };

  // Initial state: CLOSED everywhere
  setOpen(false);

  // Button toggles open/closed
  if (btn) btn.addEventListener('click', () => {
    setOpen(!root.classList.contains('toc-open'));
  }, { passive: true });

  // Close on backdrop
  backdrop.addEventListener('click', () => setOpen(false), { passive: true });

  // Close on Esc
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('toc-open')) setOpen(false);
    if (e.key === 'Escape' && root.classList.contains('toc-open')) setOpen(false);
  });
})();