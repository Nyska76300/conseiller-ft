(function () {
  const ic = p => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const ITEMS = [
    ['search', 'Rechercher', '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', () => window.ftHeaderSearch && window.ftHeaderSearch()],
    ['date', 'Simulateur de date à date', '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', () => document.getElementById('datecalc-toggle').click()],
    ['calc', 'Calculatrice', '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>', () => document.getElementById('header-calc-btn').click()],
    ['rp', 'Repères et affichage', '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>', () => document.getElementById('rp-btn').click()],
    ['data', 'Mes données : sauvegarde', '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>', () => document.getElementById('data-btn').click()],
    ['theme', 'Mode clair / sombre', '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', () => document.getElementById('theme-toggle-btn').click()],
    ['reload', 'Forcer la mise à jour', '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>', () => window.ftHardReload()]
  ];
  const H = document.documentElement;
  const close = () => H.classList.remove('ft-more-on');
  function build() {
    const datecalc = document.getElementById('datecalc-toggle'); if (!datecalc || document.getElementById('ft-more-btn')) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'ft-more-btn'; b.title = 'Plus d’options'; b.setAttribute('aria-label', 'Plus d’options'); b.setAttribute('aria-haspopup', 'menu');
    b.innerHTML = ic('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>');
    b.onclick = e => { e.stopPropagation(); refresh(); H.classList.toggle('ft-more-on'); };
    datecalc.parentNode.appendChild(b);
    const m = document.createElement('div'); m.id = 'ft-more'; m.setAttribute('role', 'menu');
    m.innerHTML = ITEMS.map(([k, l, p], i) => (k === 'theme' ? '<hr>' : '') + '<button type="button" role="menuitem" data-k="' + k + '">' + ic(p) + '<span>' + l + '</span></button>').join('');
    m.onclick = e => { const it = e.target.closest('button[data-k]'); if (!it) return; const f = ITEMS.find(x => x[0] === it.dataset.k); close(); setTimeout(f[3], 30); };
    document.body.appendChild(m);
    document.addEventListener('click', e => { if (!e.target.closest('#ft-more')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', close);
  }
  function refresh() {
    const d = document.querySelector('#ft-more [data-k="data"]'); let cvm = false; try { cvm = String(activeNavTab) === 'cvm'; } catch (e) {}
    if (d) d.style.display = cvm ? '' : 'none';
    const t = document.querySelector('#ft-more [data-k="theme"] span'); if (t) t.textContent = H.classList.contains('theme-light') ? 'Passer en mode sombre' : 'Passer en mode clair';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
