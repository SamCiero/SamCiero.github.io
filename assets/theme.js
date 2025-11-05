// assets/theme.js — dark by default; user toggle persists
(function () {
  const key = 'theme';              // 'dark' or 'light'
  const root = document.documentElement;
  const btnId = 'theme-toggle';
  const labels = { dark: '🌙 Dark', light: '☀️ Light' };

  function apply(mode) {
    if (mode === 'light') {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem(key, 'light');
    } else {
      root.removeAttribute('data-theme');       // dark = default
      localStorage.setItem(key, 'dark');
    }
    const btn = document.getElementById(btnId);
    if (btn) {
      const isLight = root.getAttribute('data-theme') === 'light';
      btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      btn.textContent = isLight ? labels.light : labels.dark;
    }
  }

  // Initial load: default dark unless a stored preference exists
  apply(localStorage.getItem(key) === 'light' ? 'light' : 'dark');

  // Expose a global for the button's onclick (keeps HTML simple)
  window.toggleTheme = function () {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(next);
  };
})();