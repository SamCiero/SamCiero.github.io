// /assets/theme.js — dark by default; user toggle persists
(function () {
  const KEY = 'theme'; // 'dark' or 'light'
  const root = document.documentElement;

  function current() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function apply(mode) {
    if (mode === 'light') {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem(KEY, 'light');
    } else {
      root.removeAttribute('data-theme'); // dark = default
      localStorage.setItem(KEY, 'dark');
    }
    // Notify listeners (header.js, future components) if needed
    try { root.dispatchEvent(new CustomEvent('themechange', { detail: { mode: current() } })); } catch {}
  }

  // Initial load: dark by default unless a stored preference exists
  apply(localStorage.getItem(KEY) === 'light' ? 'light' : 'dark');

  // Public toggle API (used by /assets/header.js)
  window.toggleTheme = function () {
    apply(current() === 'light' ? 'dark' : 'light');
  };
})();