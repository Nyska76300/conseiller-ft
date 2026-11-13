(function () {
  /* Comparateur de scénarios : deux situations côte à côte (reprise d’emploi, ARE ou ARCE, deux salaires de référence),
     avec l’écart. Calculs : mêmes fonctions que les simulateurs. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tab = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  const B = () => { try { return BAREME; } catch (e) { return null; } };
  const F = n => typeof window[n] === 'function' ? window[n] : null;
  const e2 = n => (isFinite(n) ? Number(n) : 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const nf = n => Number(n || 0).toLocaleString('fr-FR');
  const num = id => { const v = parseFloat(String(($(id) || {}).value || '').replace(/\s/g, '').replace(',', '.')); return isFinite(v) ? v : 0; };
  const MODES = [['reprise', 'Reprise d’emploi : deux salaires'], ['arce', 'Création d’entreprise : ARE ou ARCE'], ['sjr', 'Deux salaires de référence (SJR)']];
  let mode = 'reprise', last = null;

  function form() {
    const f = (id, l, v, h) => '<label class="cp-f"><span>' + l + '</span><input id="' + id + '" type="number" inputmode="decimal" step="0.01" min="0" value="' + v + '"' + (h ? ' aria-describedby="' + id + '-h"' : '') + '>' + (h ? '<small id="' + id + '-h">' + h + '</small>' : '') + '</label>';
    if (mode === 'reprise') return '<div class="cp-com">' + f('cp-aj', 'Allocation journalière (AJ)', 57, 'Montant brut par jour') + f('cp-sjr', 'Salaire journalier de référence (SJR)', 100, 'Sert au plafond du cumul') + '</div>' +
      '<div class="cp-ab"><div><h4>Scénario A</h4>' + f('cp-a', 'Salaire brut du mois', 900) + '</div><div><h4>Scénario B</h4>' + f('cp-b', 'Salaire brut du mois', 1500) + '</div></div>';
    if (mode === 'arce') return '<div class="cp-com">' + f('cp-aj', 'Allocation journalière (AJ)', 57) + f('cp-rel', 'Jours de droits restants', 400, 'Reliquat à la date de création') + '</div>';
    return '<div class="cp-ab"><div><h4>Scénario A</h4>' + f('cp-a', 'SJR', 80) + '</div><div><h4>Scénario B</h4>' + f('cp-b', 'SJR', 120) + '</div></div>';
  }
  function compute() {
    const b = B(), cumul = F('cumulCompute'), are = F('ftAreJour'), out = $('cp-out'); if (!out || !b) return;
    const mois = new Date().toISOString().slice(0, 7);
    let A, Bs, rows, note, title;
    if (mode === 'reprise' && cumul) {
      const aj = num('cp-aj'), sjr = num('cp-sjr');
      const r = x => { const c = cumul({ aj, brut: x, sjr, mois }); return { brut: x, j: c.j, comp: c.complement, tot: x + c.complement, plaf: c.plafondAtteint }; };
      A = r(num('cp-a')); Bs = r(num('cp-b')); title = 'Reprise d’emploi';
      rows = [['Salaire brut du mois', e2(A.brut), e2(Bs.brut), Bs.brut - A.brut, 'e'], ['Jours d’ARE versés', A.j + ' j', Bs.j + ' j', Bs.j - A.j, 'j'], ['Complément ARE (brut)', e2(A.comp), e2(Bs.comp), Bs.comp - A.comp, 'e'], ['Total salaire + ARE', e2(A.tot), e2(Bs.tot), Bs.tot - A.tot, 'e', 1], ['Droits gardés pour plus tard', (30 - A.j) + ' j', (30 - Bs.j) + ' j', A.j - Bs.j, 'j']];
      note = Math.round(b.cumul.remun * 100) + ' % du salaire brut est déduit de l’ARE du mois ; les jours non versés restent sur le droit et reportent la fin de droits.' + (A.plaf || Bs.plaf ? ' Plafond atteint : salaire + ARE ne peuvent pas dépasser l’ancien salaire mensuel.' : '');
    } else if (mode === 'arce') {
      const aj = num('cp-aj'), rel = Math.round(num('cp-rel')), cap = b.cumul.arce * rel * aj, tot = rel * aj;
      A = { tot }; Bs = { tot: cap }; title = 'ARE ou ARCE';
      rows = [['Montant total brut', e2(tot), e2(cap), cap - tot, 'e', 1], ['Versement', 'Chaque mois (environ ' + e2(aj * 30) + ')', '2 versements de ' + e2(cap / 2), null], ['Durée', nf(rel) + ' jours (environ ' + Math.round(rel / 30.42) + ' mois)', 'Immédiat, puis 2ᵉ versement 6 mois plus tard', null], ['Si l’activité rapporte', 'L’ARE baisse selon les revenus', 'Aucun effet sur le capital', null]];
      note = 'ARCE = ' + Math.round(b.cumul.arce * 100) + ' % des droits restants. ARE maintenue : montant maximal si l’activité ne génère aucun revenu ; avec des revenus, voir le simulateur ANS.';
    } else if (are) {
      const r = x => { const o = are(x); const red = (o.aj > b.degr.seuil) ? Math.max(b.degr.seuil, o.aj * b.degr.coef) : o.aj; return { sjr: x, aj: o.aj, m: o.aj * 30, red }; };
      A = r(num('cp-a')); Bs = r(num('cp-b')); title = 'Deux salaires de référence';
      rows = [['SJR', e2(A.sjr), e2(Bs.sjr), Bs.sjr - A.sjr, 'e'], ['ARE par jour (brut)', e2(A.aj), e2(Bs.aj), Bs.aj - A.aj, 'e', 1], ['ARE sur 30 jours', e2(A.m), e2(Bs.m), Bs.m - A.m, 'e'], ['À partir du ' + b.degr.moisDebut + 'ᵉ mois (moins de ' + b.degr.ageLimite + ' ans)', e2(A.red), e2(Bs.red), Bs.red - A.red, 'e']];
      note = 'ARE = ' + Math.round(b.are.tauxA * 1000) / 10 + ' % du SJR + ' + e2(b.are.partieFixe) + ' ou 57 % du SJR, entre ' + e2(b.are.min) + ' et 75 % du SJR ; dégressivité si l’allocation dépasse ' + e2(b.degr.seuil) + '.';
    }
    const hA = mode === 'arce' ? 'ARE maintenue' : 'Scénario A', hB = mode === 'arce' ? 'ARCE (capital)' : 'Scénario B';
    const diff = (d, u) => d == null ? '' : (Math.abs(d) < 0.005 ? '=' : (d > 0 ? '+' : '−') + (u === 'j' ? Math.abs(d) + ' j' : e2(Math.abs(d))));
    out.innerHTML = '<div class="cp-tab" role="table" aria-label="Comparaison"><div class="cp-r cp-hd" role="row"><span role="columnheader"></span><span role="columnheader">' + hA + '</span><span role="columnheader">' + hB + '</span><span role="columnheader">Écart (B − A)</span></div>' +
      rows.map(r => '<div class="cp-r' + (r[5] ? ' cp-key' : '') + '" role="row"><span role="rowheader">' + esc(r[0]) + '</span><span role="cell">' + esc(r[1]) + '</span><span role="cell">' + esc(r[2]) + '</span><span role="cell" class="cp-d ' + (r[3] == null ? '' : r[3] > 0.005 ? 'up' : r[3] < -0.005 ? 'down' : '') + '">' + esc(diff(r[3], r[4])) + '</span></div>').join('') + '</div>' +
      '<p class="cp-note">' + esc(note) + ' Estimation indicative : seule la notification fait foi.</p>';
    last = { title, rows, hA, hB, note };
  }
  /* ---------- Vue ---------- */
  const V = document.createElement('div');
  V.id = 'view-compare'; V.className = 'hidden flex-1 flex flex-col overflow-hidden bg-slate-950 fr-view';
  V.innerHTML = '<div class="h-12 border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 flex items-center justify-between shrink-0 z-10"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true"><path d="M16 3h5v5M8 3H3v5M21 3l-7 7M3 3l7 7M16 21h5v-5M8 21H3v-5M21 21l-7-7M3 21l7-7"/></svg></div><h2 class="text-xs md:text-sm font-bold text-white tracking-tight">Comparer deux scénarios</h2></div></div>' +
    '<div class="flex-1 overflow-y-auto p-4 md:p-6"><div class="max-w-4xl mx-auto"><div class="cp-modes" role="tablist" aria-label="Type de comparaison">' + MODES.map(m => '<button type="button" role="tab" data-m="' + m[0] + '">' + m[1] + '</button>').join('') + '</div><div class="cp-card"><div id="cp-form"></div><div id="cp-out" aria-live="polite"></div><div class="cp-acts"></div></div></div></div>';
  const anc = $('view-delais'); if (anc) anc.parentElement.appendChild(V);
  try { NAV_TABS_CONFIG.push({ id: 'compare', name: 'Comparer deux scénarios', desc: 'Reprise d’emploi, ARE ou ARCE, deux SJR côte à côte', icon: 'git-compare', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', badge: 'Nouveau' }); } catch (e) {}
  try { FT_KW.compare = 'comparer comparaison scenario deux options reprise emploi arce are sjr salaire choix meilleur'; } catch (e) {}
  function draw() { $('cp-form').innerHTML = form(); V.querySelectorAll('.cp-modes [data-m]').forEach(b => { const on = b.dataset.m === mode; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }); compute(); }
  V.addEventListener('click', e => { const m = e.target.closest('[data-m]'); if (m) { mode = m.dataset.m; draw(); return; } });
  V.addEventListener('input', e => { if (e.target.closest('#cp-form')) compute(); });
  function render() { const on = tab() === 'compare'; V.classList.toggle('hidden', !on); if (!on) return; const n = $('header-active-tab-name'); if (n) n.textContent = 'Références et calculs · Comparer deux scénarios'; if (!$('cp-form').firstChild) draw(); }
  const _sw = switchNavTab;
  switchNavTab = function () { const r = _sw.apply(this, arguments); setTimeout(render, 30); return r; };
  if (typeof renderBurgerTabs === 'function') {
    const _rb = renderBurgerTabs;
    renderBurgerTabs = function () {
      const r = _rb.apply(this, arguments);
      const c = $('burger-tabs-list'); if (!c || c.querySelector('button[onclick="switchNavTab(\'compare\')"]')) return r;
      const model = c.querySelector('button[onclick="switchNavTab(\'sjr\')"]') || c.querySelector('button[onclick="switchNavTab(\'formation\')"]'); if (!model) return r;
      const b = model.cloneNode(true); b.setAttribute('onclick', "switchNavTab('compare')");
      if (tab() !== 'compare') b.className = model.className.replace(/bg-gradient[^ ]*|from-[^ ]*|to-[^ ]*|border-cyan[^ ]*|shadow[^ ]*/g, '');
      const lb = b.querySelector('.text-xs'), d = b.querySelector('p'), ic = b.querySelector('svg');
      if (lb) { lb.textContent = 'Comparer deux scénarios'; delete lb.dataset.lbOrig; } if (d) d.textContent = 'Reprise d’emploi, ARE ou ARCE, deux SJR côte à côte';
      if (ic) { const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ['viewBox', '0 0 24 24', 'fill', 'none', 'stroke', 'currentColor', 'stroke-width', '2', 'stroke-linecap', 'round', 'stroke-linejoin', 'round'].forEach((v, i, a) => { if (i % 2 === 0) n.setAttribute(v, a[i + 1]); }); n.setAttribute('class', ic.getAttribute('class') || ''); n.innerHTML = '<path d="M16 3h5v5M8 3H3v5M21 3l-7 7M3 3l7 7M16 21h5v-5M8 21H3v-5M21 21l-7-7M3 21l7-7"/>'; ic.replaceWith(n); }
      b.querySelectorAll('.ft-pen-wrap,.ft-pen,.ft-star').forEach(x => x.remove());
      model.parentNode.insertBefore(b, model.nextSibling); return r;
    };
    try { renderBurgerTabs(); } catch (e) {}
  }
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Comparer deux scénarios', s: 'Reprise d’emploi, ARE ou ARCE, deux SJR', kw: 'comparer comparaison scenario arce are reprise salaire', run: () => switchNavTab('compare') });
})();
