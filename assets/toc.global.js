// /assets/toc.global.js
// Renders the global TOC into #TOC on every page.
// Includes only non-tool pages per SITE.pages; order from SITE.tocOrder.
// Uses stable anchors from ANCHOR_IDS.

(() => {
  const S = window.SITE || {};
  const A = window.ANCHOR_IDS || {};
  const mount = document.getElementById('TOC');
  if (!mount) return;

  const isTool = (k) => !!(S.pages && S.pages[k] && S.pages[k].is_tool);
  const order = Array.isArray(S.tocOrder) ? S.tocOrder.slice() : Object.keys(A || {});
  const titleize = (k) => k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  function basePath(pageKey) {
    return pageKey === 'home' ? '/' : `/${pageKey}/`;
  }

  function firstAnchorId(pageKey) {
    const anchors = A[pageKey] || {};
    const keys = Object.keys(anchors);
    return keys.length ? anchors[keys[0]] : '';
  }

  function render() {
    // Clear previous content
    mount.textContent = '';

    // Title
    const h = document.createElement('h3');
    h.textContent = 'Contents';
    mount.appendChild(h);

    const ul = document.createElement('ul');
    ul.className = 'toc-global';

    for (const pageKey of order) {
      if (isTool(pageKey)) continue;

      const anchors = A[pageKey] || {};
      const li = document.createElement('li');

      // Page link (to first anchor if present)
      const aPage = document.createElement('a');
      const firstId = firstAnchorId(pageKey);
      aPage.href = basePath(pageKey) + (firstId ? `#${firstId}` : '');
      aPage.textContent = titleize(pageKey);
      li.appendChild(aPage);

      // Section list (anchors)
      const entries = Object.entries(anchors);
      if (entries.length) {
        const sub = document.createElement('ul');
        for (const [key, id] of entries) {
          const li2 = document.createElement('li');
          const a2 = document.createElement('a');
          a2.href = `${basePath(pageKey)}#${id}`;
          a2.textContent = titleize(key);
          li2.appendChild(a2);
          sub.appendChild(li2);
        }
        li.appendChild(sub);
      }

      ul.appendChild(li);
    }

    mount.appendChild(ul);
  }

  render();
})();