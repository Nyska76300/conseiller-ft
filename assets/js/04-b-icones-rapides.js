(function () {
  /* Icônes : la bibliothèque Lucide reconstruisait TOUTES les icônes de la page à chaque appel
     (ouverture du menu, changement d’onglet…), ce qui faisait saccader l’affichage.
     Ici on ne dessine que les icônes nouvelles ou dont le nom a changé. */
  const L = window.lucide;
  if (!L || !L.createIcons || !L.createElement || !L.icons || L.__ftFast) return;
  const first = L.icons[Object.keys(L.icons)[0]];
  if (typeof first === 'string') return; /* icônes de secours : rien à optimiser */
  const pascal = n => String(n).replace(/(^|-)([a-z0-9])/g, (m, a, b) => b.toUpperCase());
  L.createIcons = function (opts) {
    const icons = (opts && opts.icons) || L.icons;
    const els = document.querySelectorAll('[data-lucide]');
    for (let i = 0; i < els.length; i++) {
      const el = els[i], name = el.getAttribute('data-lucide');
      if (!name) continue;
      if (el.namespaceURI === 'http://www.w3.org/2000/svg' && el.classList.contains('lucide-' + name)) continue; /* déjà dessinée */
      const node = icons[pascal(name)] || icons[name]; if (!node) continue;
      let svg; try { svg = L.createElement(node); } catch (e) { continue; }
      if (!svg) continue;
      for (const a of [...el.attributes]) if (a.name !== 'class') svg.setAttribute(a.name, a.value);
      const cls = (el.getAttribute('class') || '').split(/\s+/).filter(c => c && !/^lucide(-|$)/.test(c));
      svg.setAttribute('class', ['lucide', 'lucide-' + name].concat(cls).join(' '));
      svg.setAttribute('data-lucide', name);
      if (el.parentNode) el.parentNode.replaceChild(svg, el);
    }
  };
  L.__ftFast = true;
})();
