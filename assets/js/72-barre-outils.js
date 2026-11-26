(function () {
  /* Barre du haut allégée : Dates, Calculatrice, Thème et Recharger regroupés dans un bouton « Outils ». */
  const $ = id => document.getElementById(id);
  const ICO = {
    tools: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    cal: '<path d="M8 2v4M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    reload: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>'
  };
  const svg = p => '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const reloadBtn = () => [...document.querySelectorAll('header button')].find(b => /echarger la page/.test(b.getAttribute('title') || b.getAttribute('aria-label') || '') && !b.closest('#ft-tools-pop'));
  const ITEMS = [
    ['dates', 'Dates', 'Simulateur de date à date', ICO.cal, () => $('datecalc-toggle')],
    ['calc', 'Calculatrice', 'Ctrl+Maj+K', ICO.calc, () => $('header-calc-btn')],
    ['theme', '', '', null, () => $('theme-toggle-btn')],
    ['reload', 'Recharger la page', 'Récupérer la dernière version', ICO.reload, reloadBtn]
  ];
  function mount() {
    if ($('ft-tools-btn')) return true;
    const first = $('datecalc-toggle'); if (!first) return false;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'ft-tools-btn'; b.className = 'ft-tools-btn';
    b.setAttribute('aria-haspopup', 'menu'); b.setAttribute('aria-expanded', 'false'); b.title = 'Dates, calculatrice, thème, recharger';
    b.innerHTML = ICO.tools + '<span>Outils</span>' + ICO.chev;
    first.parentNode.insertBefore(b, first);
    const pop = document.createElement('div'); pop.id = 'ft-tools-pop'; pop.className = 'ft-tools-pop'; pop.setAttribute('role', 'menu');
    document.body.appendChild(pop);
    ITEMS.forEach(it => { const o = it[4](); if (o) o.classList.add('ft-tool-orig'); });
    b.addEventListener('click', e => { e.stopPropagation(); toggle(); });
    document.addEventListener('click', e => { if (pop.classList.contains('on') && !pop.contains(e.target)) toggle(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && pop.classList.contains('on')) { toggle(false); b.focus(); } });
    return true;
  }
  function draw() {
    const pop = $('ft-tools-pop'); if (!pop) return;
    const light = document.documentElement.classList.contains('theme-light');
    pop.innerHTML = ITEMS.map(it => {
      const lab = it[0] === 'theme' ? (light ? 'Mode sombre' : 'Mode clair') : it[1];
      const sub = it[0] === 'theme' ? 'Changer l’apparence' : it[2];
      const ic = it[0] === 'theme' ? (light ? ICO.moon : ICO.sun) : it[3];
      return '<button type="button" role="menuitem" data-k="' + it[0] + '">' + svg(ic) + '<span><b>' + lab + '</b><small>' + sub + '</small></span></button>';
    }).join('');
    pop.querySelectorAll('[data-k]').forEach(x => x.addEventListener('click', e => {
      e.stopPropagation();
      const it = ITEMS.find(i => i[0] === x.dataset.k); const o = it && it[4]();
      toggle(false);
      if (o) setTimeout(() => o.click(), 0);
    }));
  }
  function toggle(force) {
    const pop = $('ft-tools-pop'), b = $('ft-tools-btn'); if (!pop || !b) return;
    const on = typeof force === 'boolean' ? force : !pop.classList.contains('on');
    if (on) { draw(); const r = b.getBoundingClientRect(); pop.style.top = (r.bottom + 8) + 'px'; pop.style.left = Math.min(window.innerWidth - 270, Math.max(8, r.right - 260)) + 'px'; }
    if (on) document.querySelectorAll('.cvm-top-pop.on,.ft-tools-pop.on,.ft-pi.on').forEach(x => { if (x !== pop) x.classList.remove('on'); });
    pop.classList.toggle('on', on); b.setAttribute('aria-expanded', String(on)); b.classList.toggle('is-open', on);
    if (on) { const f = pop.querySelector('button'); if (f) f.focus(); }
  }
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  if (!mount()) { setTimeout(mount, 600); setTimeout(mount, 2000); }
})();
