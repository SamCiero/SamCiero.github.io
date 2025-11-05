/* assets/toc.js
   Collapsible ToC (H2+H3). Numbers, active highlight, hash-aware, mobile/desktop toggle.
   Targets <aside id="TOC"> and #toc-open. Uses assets/ids.js for stable anchors via data-key.
*/
(function () {
  const root  = document.documentElement;
  const mount = document.getElementById('TOC');
  if (!mount) return;

  const offsetPx = 72; // sticky header offset
  const main = document.querySelector('main');
  if (!main) { mount.hidden = true; return; }

  // Page key and registry
  const pageKey = document.body.dataset.page || 'home';
  const REG = (window.ANCHOR_IDS && window.ANCHOR_IDS[pageKey]) || {};

  // Collect headings
  const hs = [...main.querySelectorAll('h2, h3')];
  if (!hs.length) { mount.hidden = true; return; }

  // Ensure stable anchors
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

  // Build ToC
  const nav = document.createElement('nav');
  nav.className = 'toc';
  const title = document.createElement('h2'); title.textContent = 'TOC';
  nav.appendChild(title);

  let secIdx = 0;
  for (let i = 0; i < hs.length;) {
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
    }
    d.appendChild(ul);
    nav.appendChild(d);
  }

  // Mount
  mount.textContent = '';
  mount.appendChild(nav);

  // Auto-open matching section on hash
  function openForHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const a = nav.querySelector(`a[href="#${CSS.escape(id)}"]`);
    if (a) { const det = a.closest('details'); if (det) det.open = true; }
  }
  openForHash();
  window.addEventListener('hashchange', () => {
    openForHash();
    // Safety: always close the TOC when the URL hash changes
    setOpen(false);
  });

  // Active highlight on scroll
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

  // Overlay & toggle
  const btn = document.getElementById('toc-open');
  let backdrop = document.querySelector('.toc-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'toc-backdrop';
    document.body.appendChild(backdrop);
  }

  const mq = window.matchMedia('(max-width: 900px)');

  const setOpen = (open) => {
    root.classList.toggle('toc-open', open);

    // ARIA
    if (btn) {
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close table of contents' : 'Open table of contents');
    }

    // Focus & scroll locking only on small screens (overlay mode)
    if (mq.matches) {
      mount.toggleAttribute('inert', !open);
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        const first = nav.querySelector('summary, a, button, [tabindex]:not([tabindex="-1"])');
        if (first) setTimeout(() => first.focus(), 0);
      } else if (btn) {
        setTimeout(() => btn.focus(), 0);
      }
    } else {
      // Desktop: never lock scroll; TOC remains focusable
      mount.removeAttribute('inert');
      document.body.style.overflow = '';
    }
  };

  // Keep inert/scroll lock in sync across breakpoint changes
  const applyViewportRules = () => {
    if (mq.matches) {
      const isOpen = root.classList.contains('toc-open');
      mount.toggleAttribute('inert', !isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    } else {
      mount.removeAttribute('inert');
      document.body.style.overflow = '';
    }
  };
  mq.addEventListener('change', applyViewportRules);

  // Start closed
  setOpen(false);

  // Button toggles
  if (btn) btn.addEventListener('click', () => {
    setOpen(!root.classList.contains('toc-open'));
  });

  // Backdrop closes (mobile)
  backdrop.addEventListener('click', () => setOpen(false));

  // Esc closes
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && root.classList.contains('toc-open')) setOpen(false);
  });

  // Close on TOC link click + smooth-scroll with offset
  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();

    const id = decodeURIComponent(a.hash.slice(1));
    const el = document.getElementById(id);

    // Close panel first (so header/button can reappear), then scroll
    setOpen(false);

    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - offsetPx;
      // update the URL without immediate jump, then smooth scroll
      history.pushState(null, '', '#' + encodeURIComponent(id));
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      // Fallback: let browser handle it
      location.hash = a.hash;
    }
  });
})();