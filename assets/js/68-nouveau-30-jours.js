(function () {
  /* Repère « Nouveau » / « Mis à jour » dans le menu pendant 30 jours après une nouveauté.
     Pour signaler une nouveauté : ajouter une ligne dans FT_NEW (id de l'onglet, date, type). */
  const FT_NEW = {
    compare: ['2026-11-13', 'Nouveau'],
    pieces: ['2026-11-16', 'Nouveau'],
    calendrier: ['2026-11-16', 'Nouveau'],
    journal: ['2026-11-16', 'Nouveau'],
    pensebete: ['2026-11-16', 'Nouveau'],
    '5': ['2026-11-26', 'Mis à jour'],
    cns: ['2026-11-26', 'Mis à jour']
  };
  const DAYS = 30;
  const until = d => { const x = new Date(d + 'T00:00:00'); x.setDate(x.getDate() + DAYS); return x; };
  window.ftIsNew = function (id) {
    const e = FT_NEW[String(id)]; if (!e) return null;
    return new Date() < until(e[0]) ? { kind: e[1], until: until(e[0]) } : null;
  };
  /* les badges « Nouveau » permanents laissent la place au repère daté */
  try { NAV_TABS_CONFIG.forEach(t => { if (t.badge === 'Nouveau') delete t.badge; }); } catch (e) {}

  const fd = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  function mark() {
    const list = document.getElementById('burger-tabs-list'); if (!list) return;
    list.querySelectorAll('button[onclick^="switchNavTab"]').forEach(b => {
      const m = /switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || ''); const n = m && window.ftIsNew(m[1]);
      const had = b.querySelector('.ft-nw');
      if (!n) { if (had) had.remove(); b.classList.remove('ft-new-item'); return; }
      b.classList.add('ft-new-item');
      if (had) return;
      const lb = b.querySelector('.text-xs') || b.querySelector('span'); if (!lb) return;
      const s = document.createElement('span'); s.className = 'ft-nw' + (n.kind === 'Nouveau' ? '' : ' is-upd');
      s.textContent = n.kind; s.title = 'Repère affiché jusqu’au ' + fd(n.until);
      lb.insertAdjacentElement('afterend', s);
    });
    list.querySelectorAll('.menu-sec').forEach(sec => {
      const h = sec.querySelector('.menu-sec-h'); if (!h) return;
      h.classList.toggle('ft-new-sec', !!sec.querySelector('.ft-new-item'));
    });
  }
  function hub() {
    document.querySelectorAll('.hub-tab[data-t]').forEach(b => { b.classList.toggle('ft-new-hub', !!window.ftIsNew(b.dataset.t)); });
  }
  if (typeof renderBurgerTabs === 'function') {
    const _rb = renderBurgerTabs;
    renderBurgerTabs = function () { const r = _rb.apply(this, arguments); try { mark(); } catch (e) {} return r; };
  }
  const _sw = switchNavTab;
  switchNavTab = function () { const r = _sw.apply(this, arguments); setTimeout(() => { try { mark(); hub(); } catch (e) {} }, 60); return r; };
  try { renderBurgerTabs(); } catch (e) {}
  setTimeout(() => { try { mark(); hub(); } catch (e) {} }, 700);
})();
