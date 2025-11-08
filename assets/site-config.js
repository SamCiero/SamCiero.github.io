// /assets/site-config.js
// Single source of truth for header + TOC behavior.

window.SITE = {
  // Header: Home + tool pages (order preserved)
  nav: [
    { page: 'home',  label: 'Home',         anchorKey: ['home',  'getting_started'] },
    { page: 'route', label: 'Route Finder', anchorKey: ['route', 'title'], is_tool: true }
  ],

  // Global TOC: non-tool pages only (order preserved)
  tocOrder: ['home', 'about', 'contact'],

  // Page metadata (extend as you add pages/tools)
  pages: {
    home:    { is_tool: false },
    about:   { is_tool: false },
    contact: { is_tool: false },
    route:   { is_tool: true }
  }
};