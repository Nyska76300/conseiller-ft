/* ================= Extension 19 : bulles de simulateurs sur l'accueil ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(String(s == null ? '' : s));
  const BUB_OLD = [
    ['dossier', 'Parcours dossier', 'clipboard-check', 205], ['1', 'Admission et ARE', 'calculator', 160], ['2', 'Démission', 'door-open', 28], ['9', 'Rupture conventionnelle', 'handshake', 262],
    ['delais', 'Délais', 'calendar-clock', 190], ['sjr', 'SJR et net', 'percent', 140], ['5', 'Complément ARE', 'layers', 175], ['3', 'ARCE et maintien', 'briefcase', 170],
    ['cns', 'Cumul CNS', 'store', 15], ['droits', 'Rechargement et ASS', 'repeat', 120], ['cfd', 'CFD', 'trending-down', 330], ['8', 'Retraite', 'hourglass', 300],
    ['4', 'CSP', 'shield', 45], ['6', 'Indus', 'undo-2', 350], ['7', 'ICCP et CIBTP', 'hard-hat', 230], ['schemas', 'Schémas', 'git-branch', 215],
    ['@dates', 'Dates', 'calendar-days', 55], ['@calc', 'Calculatrice', 'calculator', 250]
  ];
  window.ftBubGo = id => {
    if (id === '@dates') return toggleDateCalc(true);
    if (id === '@calc') return toggleCalculator(true);
    switchNavTab(id);
  };
  const GRP = [
    ['Ouverture de droits', 205, [['dossier', 'Parcours dossier', 'Du motif de fin de contrat à la décision', 'clipboard-check'], ['1', 'Admission et ARE', 'Conditions, montant et durée', 'calculator'], ['delais', 'Délais', 'Attente, différés, forclusion', 'calendar-clock'], ['9', 'Rupture conventionnelle', 'Plafonds 456 j et 624 j', 'handshake'], ['2', 'Démission', 'Motifs légitimes et réexamen', 'door-open'], ['sjr', 'SJR et net', 'Salaire de référence, net estimé', 'percent'], ['5', 'Complément ARE', 'Reprise d’activité et cumul', 'layers']]],
    ['Activité non salariée', 160, [['3', 'ARCE et maintien', 'Création ou reprise d’entreprise', 'briefcase'], ['cns', 'Cumul CNS', 'Abattements et jours reportés', 'store']]],
    ['Fin de droits et situations', 28, [['droits', 'Rechargement et ASS', 'Nouveaux droits, passage ASS', 'repeat'], ['cfd', 'CFD', 'Complément de fin de droits', 'trending-down'], ['8', 'Retraite', 'Maintien jusqu’à la retraite', 'hourglass'], ['4', 'CSP', 'Contrat de sécurisation pro', 'shield'], ['6', 'Indus', 'Trop-perçus et remboursements', 'undo-2'], ['7', 'ICCP et CIBTP', 'Congés payés, BTP', 'hard-hat']]],
    ['Outils de poche', 262, [['schemas', 'Schémas', 'Arbre, frise, projet pro', 'git-branch'], ['@dates', 'Dates', 'Calcul de jours', 'calendar-days'], ['@calc', 'Calculatrice', 'Avec historique', 'calculator']]]
  ];
  window.ftBubGo = id => {
    if (id === '@dates') return toggleDateCalc(true);
    if (id === '@calc') return toggleCalculator(true);
    switchNavTab(id);
  };
  function bubbles() {
    const main = $('home-main'); if (!main || main.querySelector('.hm-fl')) return;
    if ((($('home-search') || {}).value || '').trim()) return;
    let use = {}; try { use = JSON.parse(safeLS.getItem('ft_tool_use') || '{}') || {}; } catch (e) {}
    const all = []; GRP.forEach(g => g[2].forEach(t => all.push({ id: t[0], n: t[1], d: t[2], ic: t[3], h: g[1], u: use[t[0]] || 0 })));
    all.forEach((x, i) => { x.o = i; }); all.sort((a, b) => (b.u - a.u) || (a.o - b.o));
    const s = document.createElement('section'); s.className = 'hm-fl';
    s.innerHTML = '<div class="hm-tiles-h"><h3>Simulateurs et outils</h3><span>Du plus utilisé au moins utilisé</span></div><div class="fl-field">' +
      all.map((x, i) => '<button type="button" class="fl ' + (i < 3 ? 'fl-l' : i < 8 ? 'fl-m' : 'fl-s') + '" style="--h:' + x.h + ';--d:' + (5 + (i % 5) * 0.8).toFixed(1) + 's;--w:' + ((i * 0.37) % 3).toFixed(2) + 's" title="' + esc(x.d) + '" onclick="ftBubGo(\'' + x.id + '\')"><i data-lucide="' + x.ic + '" class="w-5 h-5"></i><span>' + esc(x.n) + '</span></button>').join('') + '</div>';
    const q = main.querySelector('.home-quick');
    if (q) q.insertAdjacentElement('afterend', s); else main.insertBefore(s, main.firstChild);
    refreshIcons();
  }
  const _rh = renderHome;
  renderHome = function (q) { const r = _rh(q); try { bubbles(); } catch (e) {} return r; };
  try { bubbles(); } catch (e) {}
})();
