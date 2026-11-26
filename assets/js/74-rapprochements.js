/* 2026-11-26.14 bis : rapprochement des onglets qui se recoupent.
   - ARCE et maintien, Complément ARE : lien vers « Comparer deux scénarios ».
   - Schémas : retirés du menu, accessibles depuis le volet Repères (et la recherche). */
(function () {
  'use strict';
  const LINKS = { 'view-ans': 'ARCE ou maintien de l’ARE', 'view-complement-are': 'reprise d’emploi avec ou sans complément ARE' };
  function cmpLinks() {
    Object.keys(LINKS).forEach(id => {
      const v = document.getElementById(id); if (!v || v.querySelector('.ft-cmp-link')) return;
      const bar = document.createElement('div'); bar.className = 'ft-cmp-link';
      bar.innerHTML = '<span>Deux options à départager (' + LINKS[id] + ') ?</span><button type="button" onclick="switchNavTab(\'compare\')">Comparer deux scénarios →</button>';
      const hb = v.querySelector(':scope > .hub-bar');
      if (hb) hb.after(bar); else v.prepend(bar);
    });
  }
  if (typeof switchNavTab === 'function') {
    const _s = switchNavTab;
    switchNavTab = function () { const r = _s.apply(this, arguments); try { cmpLinks(); } catch (e) {} return r; };
    window.switchNavTab = switchNavTab;
  }
  setTimeout(cmpLinks, 800);

  const SCH = [['Démission', 'arbre de décision'], ['Projet professionnel', 'frise et étapes'], ['Rupture conventionnelle', 'frise des délais']];
  function rpSchemas() {
    const dr = document.getElementById('rp-drawer'); if (!dr || dr.classList.contains('hidden') || dr.querySelector('.rp-sch')) return;
    const s = document.createElement('section'); s.className = 'rp-sec rp-sch';
    s.innerHTML = '<h4>Schémas</h4><p class="rp-sch-p">Arbres de décision et frises à montrer ou imprimer.</p><div class="rp-sch-l">' +
      SCH.map(x => '<button type="button" onclick="ftRpToggle(false);switchNavTab(\'schemas\')"><b>' + x[0] + '</b><small>' + x[1] + '</small></button>').join('') + '</div>';
    const h = dr.querySelector('.rp-head'); if (h) h.after(s); else dr.prepend(s);
  }
  if (typeof window.ftRpToggle === 'function') {
    const _t = window.ftRpToggle;
    window.ftRpToggle = function () { const r = _t.apply(this, arguments); try { rpSchemas(); } catch (e) {} return r; };
  }
})();
