/* 2026-11-27.2 : style d'interface « Institutionnel » (direction A), en test.
   html.ui-pro : fond gris très clair, cartes blanches, un seul bleu, rubriques en onglets sous l'en-tête.
   Retour à l'ancien style : Paramètres › Style d'interface › Thème classique (clé ft_ui). */
(function () {
  'use strict';
  const H = document.documentElement;
  window.ftSetUi = function (v) { try { localStorage.setItem('ft_ui', v); } catch (e) {} location.reload(); };
  (window.FT_ACTIONS = window.FT_ACTIONS || []).push(
    { t: 'Style institutionnel', s: 'Interface claire et sobre (test)', kw: 'style interface institutionnel professionnel sobre clair', run: () => window.ftSetUi('pro') },
    { t: 'Thème classique', s: 'Revenir à l’apparence d’avant', kw: 'theme classique ancien style apparence sombre retour', run: () => window.ftSetUi('classic') }
  );
  if (!H.classList.contains('ui-pro')) return;

  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TABS = () => {
    const hubs = window.FT_HUBS || [];
    return [['home', 'Accueil'], ['cvm', 'Mails']].concat(hubs.map(h => [h.id, h.name.replace(/\s*:.*$/, '')])).concat([['jour', 'Ma journée']]);
  };
  const cur = () => { try { return String(activeNavTab); } catch (e) { return 'home'; } };
  function activeKey() {
    const t = cur(); if (t.indexOf('hub:') === 0) return t;
    const h = window.ftHubOf ? window.ftHubOf(t) : null;
    return h ? h.id : t;
  }
  function build() {
    if (document.getElementById('ft-ptabs')) return;
    const hd = document.querySelector('header'); if (!hd) return;
    const n = document.createElement('nav'); n.id = 'ft-ptabs'; n.className = 'ft-ptabs'; n.setAttribute('aria-label', 'Rubriques');
    let jourName = 'Ma journée';
    try { const j = NAV_TABS_CONFIG.find(x => x.id === 'jour'); if (j && j.name) jourName = j.name; } catch (e) {}
    n.innerHTML = '<div class="ft-ptabs-in">' + TABS().map(([id, name]) => '<button type="button" data-pt="' + esc(id) + '">' + esc(id === 'jour' ? jourName : name) + '</button>').join('') + '</div>';
    n.addEventListener('click', e => { const b = e.target.closest('[data-pt]'); if (b) { try { switchNavTab(b.dataset.pt); } catch (er) {} } });
    hd.after(n);
    mark();
  }
  function mark() {
    const k = activeKey();
    document.querySelectorAll('#ft-ptabs [data-pt]').forEach(b => { const on = b.dataset.pt === k; b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }
  if (typeof switchNavTab === 'function') {
    const _s = switchNavTab;
    switchNavTab = function () { const r = _s.apply(this, arguments); try { mark(); } catch (e) {} return r; };
    window.switchNavTab = switchNavTab;
  }
  const pal = document.getElementById('ft-pal'); if (pal) pal.remove();
  H.removeAttribute('data-pal');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
  setTimeout(build, 600); setTimeout(mark, 1200);
})();
