// /assets/header.js
(() => {
  // --- Mark the current page link in the pinned header
  const A = window.ANCHOR_IDS || {};
  const page = document.body.dataset.page || 'home';

  // Map page keys to their base paths
  const basePath = {
    home: '/', about: '/about/', contact: '/contact/', route: '/route/'
  };

  // Choose the primary anchor for each page from your registry
  const primary = (obj) => obj?.title || obj?.overview || (obj && Object.values(obj)[0]) || '';
  const anchorId = primary(A[page]) || '';
  const want = new URL(`${basePath[page] || '/'}#${anchorId}`, location.origin);

  // Set aria-current="page" on the matching <a> in the header
  for (const a of document.querySelectorAll('header nav a')) {
    const url = new URL(a.getAttribute('href'), location.origin);
    if (url.pathname === want.pathname && url.hash === want.hash) {
      a.setAttribute('aria-current', 'page');
    } else {
      a.removeAttribute('aria-current');
    }
  }

  // --- Keep the "Contents" button's aria-expanded in sync (TOC handled by toc.js)
  const tocBtn = document.getElementById('toc-open');
  if (tocBtn) {
    const sync = () => tocBtn.setAttribute(
      'aria-expanded',
      String(document.documentElement.classList.contains('toc-open'))
    );
    sync();
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  // --- Optional nicety: keep the theme toggle label in sync with current theme
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const label = () =>
      (document.documentElement.dataset.theme === 'light') ? '🌙 Dark' : '🌞 Light';
    // Set initial label and update on click (delegates actual theme switch to theme.js)
    themeBtn.textContent = label();
    themeBtn.addEventListener('click', () => {
      if (typeof window.toggleTheme === 'function') window.toggleTheme();
      themeBtn.textContent = label();
    });
  }
})();