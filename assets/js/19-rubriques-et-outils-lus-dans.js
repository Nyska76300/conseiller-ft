(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SVG = p => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const IC = {
    clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    brief: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/>',
    hour: '<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22"/><path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/>',
    acc: '<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>'
  };
  const LOOK = [[/invalidit/i, 'acc', 'fh-c6'], [/ouverture/i, 'clip', 'fh-c1'], [/ans|création|cumul/i, 'brief', 'fh-c2'], [/fin de droits|passage/i, 'hour', 'fh-c3'], [/situation/i, 'shield', 'fh-c4'], [/référence|calcul/i, 'book', 'fh-c5']];
  const look = t => LOOK.find(l => l[0].test(t)) || [0, 'folder', 'fh-c1'];

  /* ---------- Rubriques et outils (lus dans le menu) ---------- */
  function groups() {
    const list = $('burger-tabs-list'); if (!list) return [];
    return [...list.querySelectorAll('.menu-sec')].map(sec => {
      const h = sec.querySelector('.menu-sec-h');
      const items = [...sec.querySelectorAll('button[onclick]')].map(b => {
        const m = /switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || ''); if (!m) return null;
        const svg = b.querySelector('svg'), lb = b.querySelector('.text-xs'), d = b.querySelector('p');
        return { act: "switchNavTab('" + m[1] + "')", label: lb ? lb.textContent.trim() : b.textContent.trim(), desc: d ? d.textContent.trim() : '', icon: svg ? svg.outerHTML.replace(/\sclass="[^"]*"/, '') : SVG(IC.folder) };
      }).filter(Boolean);
      return { title: h ? h.textContent.trim() : '', items };
    }).filter(g => g.items.length);
  }
  function toolsHtml() {
    const gs = groups(); if (!gs.length) return '';
    const ref = gs.find(g => /référence|calcul/i.test(g.title));
    if (ref) ref.items.push(
      { act: "document.getElementById('datecalc-toggle').click()", label: 'Dates', desc: 'Nombre de jours entre deux dates', icon: SVG(IC.cal) },
      { act: "document.getElementById('header-calc-btn').click()", label: 'Calculatrice', desc: 'Calcul rapide', icon: SVG(IC.calc) });
    gs.forEach(g => g.items.sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' })));
    const card = g => {
      const L = look(g.title);
      return '<section class="fh-card fh-grp ' + L[2] + '"><div class="fh-gh"><span class="fh-gi">' + SVG(IC[L[1]]) + '</span><h3>' + esc(g.title) + '</h3><small>' + g.items.length + '</small></div><div class="fh-chips">' +
        g.items.map(i => '<button type="button" class="fh-chip" onclick="' + esc(i.act) + '" title="' + esc(i.desc) + '"><span class="fh-ci">' + i.icon + '</span><span class="fh-cl">' + esc(i.label) + '</span><svg class="fh-ca" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>').join('') + '</div></section>';
    };
    return '<div class="fh-th"><h2>Simulateurs et outils</h2></div><div class="fh-sum">' + gs.map(card).join('') + '</div>';
  }

  /* ---------- Carte dossier ---------- */
  window.ftHomeNewDossier = window.ftHomeNewDossier || function () { switchNavTab('dossier'); try { wizRestart('dossier'); } catch (e) {} };
  function dossierHtml() {
    let p = null; try { p = window.__ftProfile && window.__ftProfile(); } catch (e) {}
    const head = '<div class="fh-dh"><span class="fh-dico">' + SVG(IC.folder) + '</span><h2>' + (p && p.sn ? 'Dossier en cours' + (p.a && p.a.ref ? ' · ' + esc(p.a.ref) : '') : 'Dossier en cours') + '</h2></div>';
    if (p && p.sn) {
      const sn = p.sn, rows = [];
      if (p.a && p.a.fct) rows.push(['Fin de contrat', p.a.fct.split('-').reverse().join('/')]);
      if (sn.verdict) rows.push(['Résultat', sn.verdict]);
      if (sn.are && !/^NON/i.test(sn.verdict || '')) rows.push(['ARE journalière', sn.are]);
      if (p.premier) rows.push(['1er jour indemnisable', p.premier]);
      return '<section class="fh-card fh-dos" aria-label="Dossier en cours">' + head + '<dl>' + rows.map(r => '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>').join('') + '</dl>' +
        '<div class="fh-btns"><button type="button" class="fh-btn" onclick="switchNavTab(\'dossier\')">Reprendre</button><button type="button" class="fh-btn2" onclick="ftHomeNewDossier()">Nouveau</button></div></section>';
    }
    return '<section class="fh-card fh-dos" aria-label="Dossier en cours">' + head + '<p>Aucun dossier ouvert. Démarrez un parcours guidé : droits, ARE, durée et texte du mail.</p><div class="fh-btns"><button type="button" class="fh-btn" onclick="ftHomeNewDossier()">' + SVG(IC.plus) + 'Nouveau dossier</button></div></section>';
  }

  /* ---------- Carte « Quoi de neuf ? » ---------- */
  function newsHtml() {
    const N = window.FT_NEWS; if (!N || !N.length) return '';
    const last = N[0], short = t => { t = String(t); const i = t.indexOf(' : '); if (i > 0 && i < 40) t = t.slice(i + 3); t = t.charAt(0).toUpperCase() + t.slice(1); const c = t.search(/[.(]/); if (c > 30) t = t.slice(0, c); return t.length > 80 ? t.slice(0, 78).replace(/\s\S*$/, '') + '…' : t; };
    const sameDay = N.filter(e => e.date === last.date).reduce((a, e) => a.concat(e.items), []);
    const items = sameDay.slice(0, 4).map(short);
    return '<section class="fh-card fh-news fh-dos" aria-label="Quoi de neuf ?"><div class="fh-dh"><span class="fh-dico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3-1.9 5.8L4 10l5 3.6L7.6 20 12 16.4 16.4 20 15 13.6l5-3.6-6.1-1.2z"/></svg></span><h2>Quoi de neuf ?</h2><span class="fh-ndate">' + esc(last.date) + '</span></div>' +
      '<ul>' + items.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      '<div class="fh-btns"><button type="button" class="fh-btn2" onclick="ftShowNews()">Voir toutes les nouveautés</button></div></section>';
  }


  /* ---------- Liens utiles (à la place de « Derniers outils ») ---------- */
  const LINKS_DEF = [{ t: 'Unédic', u: 'https://www.unedic.org/' }];
  function getLinks() { try { const v = JSON.parse(localStorage.getItem('ft_links')); return Array.isArray(v) ? v : LINKS_DEF.slice(); } catch (e) { return LINKS_DEF.slice(); } }
  function setLinks(v) { safeLS.setItem('ft_links', JSON.stringify(v)); }
  let lkEdit = false, lkForm = null; // lkForm: null | {i: index or -1}
  const host = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };
  const normUrl = u => { u = String(u || '').trim(); if (!u) return ''; if (!/^[a-z]+:\/\//i.test(u) && !/^mailto:/i.test(u)) u = 'https://' + u; return u; };
  const LK_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>';
  function linksHtml() {
    const L = getLinks();
    let rows = L.map((l, i) => lkForm && lkForm.i === i ? formHtml(l) :
      '<div class="lk-row" data-i="' + i + '"><a class="lk-a" draggable="false" href="' + esc(normUrl(l.u)) + '" target="_blank" rel="noopener noreferrer"><span class="lk-ico">' + LK_ICO + '</span><span class="lk-t"><b>' + esc(l.t || host(l.u)) + '</b><small>' + esc(host(normUrl(l.u))) + '</small></span></a>' +
      (lkEdit ? '<button type="button" class="lk-btn" data-lk="edit" data-i="' + i + '" aria-label="Modifier ' + esc(l.t) + '" title="Modifier"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button><button type="button" class="lk-btn lk-del" data-lk="del" data-i="' + i + '" aria-label="Supprimer ' + esc(l.t) + '" title="Supprimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>' : '') + '</div>').join('');
    if (!L.length && !lkForm) rows = '<p class="lk-empty">Aucun lien. Cliquez sur la roue crantée pour en ajouter.</p>';
    if (lkForm && lkForm.i === -1) rows += formHtml({ t: '', u: '' });
    return '<section class="fh-card fh-links' + (lkEdit && !lkForm ? ' lk-jiggle' : '') + '" aria-label="Liens utiles"><div class="fh-dh"><span class="fh-dico">' + LK_ICO + '</span><h2>Liens utiles</h2><button type="button" class="lk-manage' + (lkEdit ? ' on' : ' lk-gear') + '" data-lk="toggle" title="' + (lkEdit ? 'Terminer' : 'Gérer les liens (ajouter, modifier, supprimer, réordonner)') + '" aria-label="' + (lkEdit ? 'Terminer' : 'Gérer les liens') + '">' + (lkEdit ? 'Terminer' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>') + '</button></div>' +
      (lkEdit && !lkForm && L.length > 1 ? '<p class="lk-hint">Faites glisser un lien pour changer l’ordre.</p>' : (!lkEdit && L.length > 1 ? '<p class="lk-hint lk-hint2">Astuce : maintenez un lien appuyé pour le déplacer.</p>' : '')) +
      '<div class="lk-list">' + rows + '</div>' + (lkEdit && !lkForm ? '<button type="button" class="fh-btn2 lk-add" data-lk="add">+ Ajouter un lien</button>' : '') + '</section>';
  }
  function formHtml(l) {
    return '<form class="lk-form" data-lkform="1"><label>Nom<input name="t" type="text" maxlength="60" required value="' + esc(l.t) + '" placeholder="Ex. Légifrance"></label><label>Adresse<input name="u" type="text" required value="' + esc(l.u) + '" placeholder="https://…"></label><div class="lk-fbtn"><button type="button" class="fh-btn2" data-lk="cancel">Annuler</button><button type="submit" class="fh-btn">Enregistrer</button></div></form>';
  }
  function renderLinks() { const el = document.querySelector('#view-home .fh-links'); if (el) { el.outerHTML = linksHtml(); const f = document.querySelector('.lk-form input'); if (f) f.focus(); } }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.fh-links [data-lk]'); if (!b) return;
    const a = b.dataset.lk, i = +b.dataset.i;
    if (a === 'toggle') { lkEdit = !lkEdit; lkForm = null; }
    else if (a === 'add') lkForm = { i: -1 };
    else if (a === 'edit') lkForm = { i: i };
    else if (a === 'cancel') lkForm = null;
    else if (a === 'del') { const L = getLinks(); if (confirm('Supprimer le lien « ' + (L[i] && L[i].t) + ' » ?')) { L.splice(i, 1); setLinks(L); } }
    renderLinks();
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest && e.target.closest('.fh-links form[data-lkform]'); if (!f) return;
    e.preventDefault();
    const t = f.t.value.trim(), u = normUrl(f.u.value);
    if (!t || !u) return;
    const L = getLinks();
    if (lkForm && lkForm.i >= 0) L[lkForm.i] = { t: t, u: u }; else L.push({ t: t, u: u });
    setLinks(L); lkForm = null; renderLinks();
    try { showToast('Lien enregistré', 'success'); } catch (er) {}
  });

  /* ---------- Déplacement des liens « façon Apple » : appui long → mode édition qui tremble, puis glisser-déposer ---------- */
  let lp = null, drag = null, eatClick = false;
  const rowsNow = () => [...document.querySelectorAll('#view-home .fh-links .lk-row')];
  function startDrag(row, y) {
    const rows = rowsNow(); if (rows.length < 2) return;
    const i = rows.indexOf(row); if (i < 0) return;
    const rects = rows.map(r => r.getBoundingClientRect());
    const step = rects.length > 1 ? rects[1].top - rects[0].top : rects[0].height + 6;
    drag = { rows, i, to: i, y0: y, rects, step };
    row.classList.add('lk-drag');
    document.querySelector('#view-home .fh-links').classList.add('lk-dragging');
    try { navigator.vibrate && navigator.vibrate(8); } catch (e) {}
  }
  function moveDrag(y) {
    if (!drag) return;
    const d = drag, dy = y - d.y0, n = d.rows.length;
    const minDy = -d.i * d.step, maxDy = (n - 1 - d.i) * d.step;
    const cy = Math.max(minDy - d.step * .4, Math.min(maxDy + d.step * .4, dy));
    d.rows[d.i].style.transform = 'translateY(' + cy + 'px) scale(1.03)';
    const to = Math.max(0, Math.min(n - 1, d.i + Math.round(cy / d.step)));
    if (to !== d.to) { d.to = to; try { navigator.vibrate && navigator.vibrate(4); } catch (e) {} }
    d.rows.forEach((r, k) => { if (k === d.i) return; let sh = 0; if (d.i < to && k > d.i && k <= to) sh = -d.step; if (d.i > to && k < d.i && k >= to) sh = d.step; r.style.transform = sh ? 'translateY(' + sh + 'px)' : ''; });
  }
  function endDrag() {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.to !== d.i) { const L = getLinks(); const [m] = L.splice(d.i, 1); L.splice(d.to, 0, m); setLinks(L); }
    renderLinks();
  }
  document.addEventListener('pointerdown', e => {
    const row = e.target.closest && e.target.closest('#view-home .fh-links .lk-row');
    if (!row || e.button > 0 || e.target.closest('.lk-btn')) return;
    const sec = row.closest('.fh-links');
    if (sec.classList.contains('lk-jiggle')) { e.preventDefault(); eatClick = true; startDrag(row, e.clientY); return; }
    /* hors mode édition : appui long de 0,5 s */
    const i = +row.dataset.i, x0 = e.clientX, y0 = e.clientY;
    lp = { x0, y0, t: setTimeout(() => {
      lp = null; eatClick = true; lkEdit = true; lkForm = null; renderLinks();
      const r = document.querySelector('#view-home .fh-links .lk-row[data-i="' + i + '"]'); if (r) startDrag(r, y0);
    }, 480) };
  }, true);
  document.addEventListener('pointermove', e => {
    if (lp && (Math.abs(e.clientX - lp.x0) > 8 || Math.abs(e.clientY - lp.y0) > 8)) { clearTimeout(lp.t); lp = null; }
    if (drag) { e.preventDefault(); moveDrag(e.clientY); }
  }, { passive: false, capture: true });
  const up = () => { if (lp) { clearTimeout(lp.t); lp = null; } if (drag) endDrag(); };
  document.addEventListener('pointerup', up, true);
  document.addEventListener('pointercancel', up, true);
  document.addEventListener('touchmove', e => { if (drag) e.preventDefault(); }, { passive: false });
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('#view-home .fh-links .lk-a'); if (!a) return;
    if (eatClick || a.closest('.lk-jiggle')) { e.preventDefault(); e.stopPropagation(); }
    eatClick = false;
  }, true);
  document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('#view-home .fh-links .lk-row')) e.preventDefault(); });

  /* Repères de l’accueil en 4 blocs : ouverture, allocation, différés, cumul et autres */
  function repHtml() {
    let B = null; try { B = BAREME; } catch (e) {}
    const n = v => String(v).replace('.', ',');
    const e2 = v => Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    const G = B ? [
      ['Ouverture de droits', 'fh-c1', [['Affiliation', B.affiliation.jours + ' j / ' + B.affiliation.heures + ' h'], ['Saisonniers, primo-entrants', B.affiliation.joursSais + ' j / ' + B.affiliation.heuresSais + ' h'], ['Après une démission (avant ouverture de droits)', '65 j / 455 h'], ['Démission d’un emploi repris en cours de droits', '88 j / 610 h max.'], ['Réexamen démission', '121 jours'], ['Délai d’inscription', '12 mois']]],
      ['Allocation', 'fh-c2', [['ARE par jour', e2(B.are.min) + ' à ' + e2(B.are.max)], ['Partie fixe', e2(B.are.partieFixe)], ['Durée max. (< 55 / 55-56 / 57 ans et +)', B.duree.max.u55 + ' / ' + B.duree.max.a55 + ' / ' + B.duree.max.a57 + ' j'], ['Rupture conventionnelle', B.duree.rci.u55 + ' / ' + B.duree.rci.a55 + ' j'], ['Dégressivité', '−' + Math.round((1 - B.degr.coef) * 100) + ' % dès le ' + B.degr.moisDebut + 'e mois']]],
      ['Différés', 'fh-c4', [['Délai d’attente', B.differe.attente + ' jours'], ['Congés payés', B.differe.cpMax + ' j maximum'], ['Supra-légal', 'max. ' + B.differe.specMax + ' j (' + B.differe.specMaxEco + ' j éco)'], ['Diviseur supra-légal', n(B.differe.diviseur)]]],
      ['Cumul et autres', 'fh-c6', [['Cumul avec un salaire', Math.round(B.cumul.remun * 100) + ' % du brut déduit'], ['Mois indemnisé', B.cumul.base + ' jours'], ['Plafond du cumul', 'SJR × 30,42'], ['Retraite complémentaire', n(Math.round(B.retenues.retraiteCompl * 1000) / 10) + ' % du SJR'], ['ARCE', Math.round(B.cumul.arce * 100) + ' % du reliquat']]]
    ] : [];
    if (!G.length) return '';
    return '<section class="fh-card fh-rep" aria-label="Repères"><div class="fh-dh"><span class="fh-dico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg></span><h2>Repères</h2></div>' +
      G.map(g => '<div class="fh-rg ' + g[1] + '"><h3>' + g[0] + '</h3>' + g[2].map(r => '<div class="fh-rr"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') + '</div>').join('') +
      '<div class="fh-btns"><button type="button" class="fh-btn2" onclick="try{ftRpToggle(true)}catch(e){}">Tous les repères</button></div></section>';
  }

  /* ---------- Mise en page ---------- */
  let busy = false;
  function layout() {
    const wrap = document.querySelector('#view-home > .home-wrap'), main = $('home-main');
    if (!wrap || !main || busy) return;
    busy = true;
    try {
      wrap.classList.add('fh-on');
      let L = wrap.querySelector(':scope > .fh-L'), C = wrap.querySelector(':scope > .fh-C'), R = wrap.querySelector(':scope > .fh-R');
      if (!C) {
        L = document.createElement('div'); L.className = 'fh-col fh-L';
        C = document.createElement('div'); C.className = 'fh-col fh-C';
        R = document.createElement('div'); R.className = 'fh-col fh-R';
        wrap.insertBefore(R, wrap.firstChild); wrap.insertBefore(C, R); wrap.insertBefore(L, C);
      }
      const hero = wrap.querySelector(':scope > .home-hero'); if (hero) C.insertBefore(hero, C.firstChild);
      const foot = wrap.querySelector(':scope > .home-foot');
      // Éléments rendus dans #home-main : on remplace les anciens par les nouveaux
      const take = (sel, col) => {
        const fresh = main.querySelector(':scope > ' + sel);
        if (!fresh) return;
        col.querySelectorAll(':scope > ' + sel).forEach(x => x.remove());
        col.appendChild(fresh);
      };
      // Colonne gauche : dossier puis repères
      let dos = L.querySelector(':scope > .fh-dos'); const dh = dossierHtml();
      if (!dos) { L.insertAdjacentHTML('afterbegin', dh); } else { dos.outerHTML = dh; }
      take('.hm-extra', L);
      L.querySelectorAll(':scope > .hm-extra .hm-card').forEach(c => { const h = c.querySelector('h3'); if (h && /^(Derniers outils|Dossier en cours|Repères)/.test(h.textContent.trim())) c.remove(); });
      if (!L.querySelector(':scope > .fh-rep')) { const rh = repHtml(); if (rh) L.insertAdjacentHTML('beforeend', rh); } else L.appendChild(L.querySelector(':scope > .fh-rep'));
      if (!L.querySelector(':scope > .fh-links')) { const ex = L.querySelector(':scope > .hm-extra'); const tmp = document.createElement('div'); tmp.innerHTML = linksHtml(); if (ex) L.insertBefore(tmp.firstChild, ex); else L.appendChild(tmp.firstChild); }
      else { const ex = L.querySelector(':scope > .hm-extra'), lk = L.querySelector(':scope > .fh-links'); if (ex && lk.nextElementSibling !== ex) L.insertBefore(lk, ex); }
      // Centre : outils groupés puis sections secondaires
      let tw = C.querySelector(':scope > .fh-tools'); if (!tw) { tw = document.createElement('div'); tw.className = 'fh-col fh-tools'; C.appendChild(tw); }
      const th = toolsHtml(); if (th && tw._h !== th) { tw.innerHTML = th; tw._h = th; }
      [...main.querySelectorAll(':scope > .home-section')].forEach((sec, i, arr) => { if (i === 0) C.querySelectorAll(':scope > .home-section').forEach(x => x.remove()); C.appendChild(sec); });
      if (foot) C.appendChild(foot); else { const f = C.querySelector(':scope > .home-foot'); if (f) C.appendChild(f); }
      // Droite : favoris et reprendre
      take('.home-top', R);
      // Droite : carte « Quoi de neuf ? »
      let nw = R.querySelector(':scope > .fh-news'); const nh = newsHtml();
      if (nh) { if (nw) nw.remove(); R.insertAdjacentHTML('beforeend', nh); }
    } catch (e) { console.warn('Accueil :', e); }
    busy = false;
  }
  const mo = new MutationObserver(() => { if (!busy) setTimeout(layout, 0); });
  function watch() { const m = $('home-main'); if (m) mo.observe(m, { childList: true }); }
  const _sw = switchNavTab;
  const markTab = () => { try { document.documentElement.dataset.tab = String(activeNavTab); } catch (e) {} };
  switchNavTab = function () { const r = _sw.apply(this, arguments); markTab(); try { if (String(activeNavTab) !== 'cvm') { H.classList.remove('cvm-cats'); H.classList.remove('cvm-reading'); } cvmBarLabel(); } catch (e) {} try { navRecord(); } catch (e) {} try { applyLabels(); } catch (e) {} try { if (String(activeNavTab) === 'home') layout(); } catch (e) {} return r; };

  /* ---------- Liens cliquables dans les mails ---------- */
  const URL_RE = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|\b(?:[a-z0-9-]+\.)+(?:gouv\.fr|fr|com|org|net|eu)\b(?:\/[^\s<>"']*)?)/gi;
  const URL_TEST = new RegExp(URL_RE.source, 'i');
  function linkify(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentNode && n.parentNode.closest && n.parentNode.closest('a,textarea,input,script,style')) ? NodeFilter.FILTER_REJECT : (URL_TEST.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      const txt = n.nodeValue, frag = document.createDocumentFragment(); let last = 0; URL_RE.lastIndex = 0; let m;
      while ((m = URL_RE.exec(txt))) {
        let u = m[0], trail = '';
        while (/[.,;:!?)\]»]$/.test(u)) { trail = u.slice(-1) + trail; u = u.slice(0, -1); }
        if (!u) continue;
        frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
        const a = document.createElement('a'); a.className = 'ft-link'; a.textContent = u;
        a.href = /@/.test(u) && !/^https?:/i.test(u) ? 'mailto:' + u : (/^https?:/i.test(u) ? u : 'https://' + u);
        a.target = '_blank'; a.rel = 'noopener noreferrer';
        frag.appendChild(a);
        if (trail) frag.appendChild(document.createTextNode(trail));
        last = m.index + m[0].length;
      }
      frag.appendChild(document.createTextNode(txt.slice(last)));
      n.parentNode.replaceChild(frag, n);
    });
    URL_RE.lastIndex = 0;
  }
  window.ftLinkify = linkify;
  if (typeof updateCompiledPreview === 'function') {
    const _up = updateCompiledPreview;
    updateCompiledPreview = function () { const r = _up.apply(this, arguments); try { linkify($('preview-body')); } catch (e) {} return r; };
  }
  // Le clic sur un lien ouvre la page, sans déclencher les autres actions de l'aperçu
  document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('#preview-body a.ft-link'); if (a) e.stopPropagation(); }, true);

  /* ---------- Catégories par ordre alphabétique dans les formulaires ---------- */
  if (typeof populateCategorySelect === 'function') {
    populateCategorySelect = function () {
      const opts = categoryList.map(c => c.name).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
        .map(n => '<option value="' + escapeHtml(n) + '">' + escapeHtml(n) + '</option>').join('');
      ['m-category', 'edit-m-category'].forEach(id => { const s = $(id); if (!s) return; const v = s.value; s.innerHTML = opts; if (v && [...s.options].some(o => o.value === v)) s.value = v; });
    };
  }


  /* ---------- Menu : rubriques dans l'ordre voulu, outils par ordre alphabétique ---------- */
  const SEC_ORDER = [/ouverture/i, /ans|création/i, /situation/i, /fin de droits/i, /invalidit/i, /référence|calcul/i];
  const secRank = t => { const i = SEC_ORDER.findIndex(r => r.test(t)); return i < 0 ? 99 : i; };
  const lbl = b => ((b.querySelector('.text-xs') || b).textContent || '').trim();
  function sortMenu() {
    const list = $('burger-tabs-list'); if (!list) return;
    const secs = [...list.querySelectorAll(':scope > .menu-sec')];
    if (!secs.length) return;
    let changed = false;
    secs.forEach(sec => {
      const box = sec.querySelector('.menu-sec-h') ? sec.querySelector('.menu-sec-h').nextElementSibling : null;
      const host = box && box.querySelector('button[onclick]') ? box : sec;
      const btns = [...host.children].filter(x => x.matches('button[onclick], .ft-pen-wrap'));
      const lab = x => lbl(x.matches('.ft-pen-wrap') ? x.querySelector('button[onclick]') : x);
      const sorted = btns.slice().sort((a, b) => lab(a).localeCompare(lab(b), 'fr', { sensitivity: 'base' }));
      if (sorted.some((b, i) => b !== btns[i])) { sorted.forEach(b => host.appendChild(b)); changed = true; }
    });
    const ttl = x => { const h = x.querySelector('.menu-sec-h') || x; return h.dataset.lbOrig || h.textContent; };
    const ordered = secs.slice().sort((a, b) => secRank(ttl(a)) - secRank(ttl(b)));
    if (ordered.some((x, i) => x !== secs[i])) {
      const anchor = secs[secs.length - 1].nextSibling;
      ordered.forEach(x => list.insertBefore(x, anchor));
      changed = true;
    }
    return changed;
  }
  const mmo = new MutationObserver(() => { mmo.disconnect(); try { applyLabels(); adminBar(); } catch (e) {} try { if (sortMenu()) { const tw = document.querySelector('.fh-tools'); if (tw) tw._h = ''; if (String(activeNavTab) === 'home') layout(); } } catch (e) {} watchMenu(); });
  function watchMenu() { const l = $('burger-tabs-list'); if (l) mmo.observe(l, { childList: true, subtree: true }); }

  /* ---------- Noms des outils et rubriques (modifiables par l'administrateur) ---------- */
  function labels() { try { return JSON.parse(localStorage.getItem('ft_labels') || '{}') || {}; } catch (e) { return {}; } }
  const ORIG = {};
  function applyLabels() {
    const L = labels();
    // Outils : configuration (recherche Ctrl+K, en-tête)
    try { NAV_TABS_CONFIG.forEach(t => { const id = 't:' + t.id; if (!(id in ORIG)) ORIG[id] = t.name; t.name = L[id] || ORIG[id]; }); } catch (e) {}
    const setTxt = (el, key, base) => { if (!el) return; if (el.dataset.lbOrig == null) el.dataset.lbOrig = base != null ? base : el.textContent.trim(); const v = L[key] || el.dataset.lbOrig; if (el.textContent.trim() !== v) el.textContent = v; };
    // Menu
    document.querySelectorAll('#burger-tabs-list button[onclick]').forEach(b => {
      const m = /switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || ''); if (!m) return;
      setTxt(b.querySelector('.text-xs'), 't:' + m[1]);
    });
    document.querySelectorAll('#burger-tabs-list .menu-sec-h').forEach(h => { const o = h.dataset.lbOrig || h.textContent.trim(); const tgt = h.querySelector('.ft-sec-lbl'); if (tgt) { const v = L['r:' + o] || o; if (tgt.textContent !== v) tgt.textContent = v; h.dataset.lbOrig = o; } else setTxt(h, 'r:' + o, o); });
    // Barres de rubrique au-dessus des outils
    document.querySelectorAll('.hub-bar .hub-tab[data-t]').forEach(b => setTxt(b, 't:' + b.dataset.t));
    document.querySelectorAll('.hub-bar .hub-name').forEach(h => { const o = h.dataset.lbOrig || h.textContent.trim(); setTxt(h, 'r:' + o, o); });
    // Nom affiché dans l'en-tête
    const n = $('header-active-tab-name');
    if (n) {
      /* Remplacement par segments exacts (« Rubrique · Outil ») : jamais de remplacement dans un libellé déjà renommé */
      const map = {};
      Object.keys(L).forEach(k => { const o = k.charAt(0) === 'r' ? k.slice(2) : (ORIG[k] || ''); if (o && L[k]) map[o] = L[k]; });
      document.querySelectorAll('.hub-bar .hub-tab[data-lb-orig]').forEach(b => { const k = 't:' + b.dataset.t; if (L[k]) map[b.dataset.lbOrig] = L[k]; });
      const t = n.textContent.split(' · ').map(p => map[p.trim()] || p).join(' · ');
      if (n.textContent !== t) n.textContent = t; }
  }
  function sortHubTabs() {
    document.querySelectorAll('.hub-bar').forEach(bar => {
      const tabs = [...bar.querySelectorAll(':scope > .hub-tab')]; if (tabs.length < 2) return;
      const sorted = tabs.slice().sort((a, b) => a.textContent.trim().localeCompare(b.textContent.trim(), 'fr', { sensitivity: 'base' }));
      if (sorted.every((t, i) => t === tabs[i])) return;
      const anchor = bar.querySelector(':scope > .hub-sub');
      sorted.forEach(t => bar.insertBefore(t, anchor));
    });
  }
  const _al = applyLabels;
  applyLabels = function () { _al(); try { sortHubTabs(); } catch (e) {} };
  window.ftApplyLabels = function () { applyLabels(); try { const tw = document.querySelector('.fh-tools'); if (tw) tw._h = ''; if (String(activeNavTab) === 'home') layout(); } catch (e) {} };
  // Crayon de renommage à côté de chaque outil et rubrique (administrateur uniquement)
  const PEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  function adminBar() {
    const list = $('burger-tabs-list'); if (!list) return;
    const old = $('ft-rename-bar'); if (old) old.remove();
    const ok = window.__ftIsAdmin && window.__ftIsAdmin();
    list.classList.toggle('ft-admin', !!ok);
    if (!ok) { list.querySelectorAll('.ft-pen').forEach(x => x.remove()); list.querySelectorAll('.ft-pen-wrap').forEach(w => { while (w.firstChild) w.parentNode.insertBefore(w.firstChild, w); w.remove(); }); return; }
    list.querySelectorAll('button[onclick]').forEach(b => {
      const m = /switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || ''); if (!m) return;
      if (b.parentNode.classList.contains('ft-pen-wrap')) return;
      const w = document.createElement('div'); w.className = 'ft-pen-wrap';
      b.parentNode.insertBefore(w, b); w.appendChild(b);
      const p = document.createElement('button'); p.type = 'button'; p.className = 'ft-pen'; p.dataset.pen = 't:' + m[1];
      const sp = b.querySelector('.text-xs'); const nm = sp ? sp.textContent.trim() : '';
      p.title = 'Renommer « ' + nm + ' »'; p.setAttribute('aria-label', p.title); p.innerHTML = PEN;
      w.appendChild(p);
    });
    list.querySelectorAll('.menu-sec-h').forEach(h => {
      if (h.querySelector('.ft-pen')) return;
      const o = h.dataset.lbOrig || h.textContent.trim(); h.dataset.lbOrig = o;
      const lbl = document.createElement('span'); lbl.className = 'ft-sec-lbl'; lbl.textContent = h.textContent.trim();
      h.textContent = ''; h.appendChild(lbl);
      const p = document.createElement('button'); p.type = 'button'; p.className = 'ft-pen ft-pen-h'; p.dataset.pen = 'r:' + o;
      p.title = 'Renommer la rubrique « ' + lbl.textContent + ' »'; p.setAttribute('aria-label', p.title); p.innerHTML = PEN;
      h.appendChild(p);
    });
  }
  function saveLabels(L) {
    localStorage.setItem('ft_labels', JSON.stringify(L));
    window.ftApplyLabels();
    window.__ftSaveLabels(L).then(() => { try { showToast('Nom enregistré pour tous les conseillers', 'success'); } catch (e) {} })
      .catch(e => { try { showToast('Enregistrement en ligne impossible : ' + (e && e.message || e), 'error'); } catch (er) {} });
  }
  document.addEventListener('click', e => {
    const p = e.target.closest && e.target.closest('#burger-tabs-list .ft-pen'); if (!p) return;
    e.preventDefault(); e.stopPropagation();
    const key = p.dataset.pen; let orig = '', cur = '';
    if (key.charAt(0) === 'r') { orig = key.slice(2); const h = p.closest('.menu-sec-h'); cur = h ? (h.querySelector('.ft-sec-lbl') || h).textContent.trim() : orig; }
    else { const b = p.parentNode.querySelector('button[onclick]'), sp = b && b.querySelector('.text-xs'); orig = (sp && sp.dataset.lbOrig) || ORIG[key] || ''; cur = sp ? sp.textContent.trim() : orig; }
    const v = prompt('Nouveau nom (vide = nom d’origine « ' + orig + ' ») :', cur);
    if (v === null) return;
    const L = labels(); const t = v.trim();
    if (!t || t === orig) delete L[key]; else L[key] = t.slice(0, 60);
    saveLabels(L);
  }, true);
  document.addEventListener('ft-admin', adminBar);

  /* Sources : cartes focusables, source intégrée au détail affiché au survol */
  function svPrep() {
    document.querySelectorAll('#view-sources .sv-row').forEach(r => {
      if (r.dataset.svp) return; r.dataset.svp = '1'; r.tabIndex = 0;
      const p = r.querySelector('p'), sm = r.querySelector('small');
      if (p && sm) { const d = document.createElement('span'); d.className = 'sv-src'; d.textContent = sm.textContent; p.appendChild(d); }
    });
  }
  { let svT = null; new MutationObserver(() => { if (!svT) svT = setTimeout(() => { svT = null; svPrep(); }, 150); }).observe(document.body, { childList: true, subtree: true }); }
  /* « Copier le texte » et l’étoile des favoris à droite de « Contenu du message » */
  function moveMsgActions() {
    const stamp = $('current-date-stamp'), copy = $('btn-copy-raw'), star = $('btn-star-active');
    if (!stamp || !copy) return;
    const right = stamp.parentElement; if (!right || right.parentElement.querySelector('.ft-msg-actions')) return;
    const box = document.createElement('div'); box.className = 'ft-msg-actions';
    right.parentElement.insertBefore(box, right); box.appendChild(right);
    if (star) box.appendChild(star);
    box.appendChild(copy);
  }

  /* Barre de rubrique toujours en haut de l’écran, sur toute la largeur */
  function hoistBars() {
    document.querySelectorAll('[id^="view-"] .reg-wrap > nav.hub-bar').forEach(bar => {
      const view = bar.closest('[id^="view-"]'); if (!view) return;
      const panel = bar.nextElementSibling && bar.nextElementSibling.classList.contains('rg-panel') ? bar.nextElementSibling : null;
      view.insertBefore(bar, view.firstChild);
      if (panel) view.insertBefore(panel, bar.nextSibling);
    });
  }

  /* ---------- Précédent / Suivant : historique des écrans visités ---------- */
  const NAVH = { list: [], i: -1, moving: false };
  function navRecord() {
    if (NAVH.moving) return;
    let t; try { t = String(activeNavTab); } catch (e) { return; }
    if (NAVH.list[NAVH.i] === t) return;
    NAVH.list = NAVH.list.slice(0, NAVH.i + 1); NAVH.list.push(t);
    if (NAVH.list.length > 50) NAVH.list.shift();
    NAVH.i = NAVH.list.length - 1; navUi();
  }
  function navGo(d) {
    const j = NAVH.i + d; if (j < 0 || j >= NAVH.list.length) return;
    NAVH.i = j; NAVH.moving = true;
    try { switchNavTab(NAVH.list[j]); } finally { NAVH.moving = false; }
    navUi();
  }
  window.ftNavBack = () => navGo(-1); window.ftNavFwd = () => navGo(1);
  const nameOf = t => { try { const c = NAV_TABS_CONFIG.find(x => String(x.id) === t); return c ? c.name : (t === 'home' ? 'Accueil' : t); } catch (e) { return t; } };
  function navUi() {
    const b = $('ft-nav-back'), f = $('ft-nav-fwd'); if (!b || !f) return;
    b.disabled = NAVH.i <= 0; f.disabled = NAVH.i >= NAVH.list.length - 1;
    b.title = b.disabled ? 'Page précédente' : 'Revenir à : ' + nameOf(NAVH.list[NAVH.i - 1]) + ' (Alt + ←)';
    f.title = f.disabled ? 'Page suivante' : 'Aller à : ' + nameOf(NAVH.list[NAVH.i + 1]) + ' (Alt + →)';
    b.setAttribute('aria-label', b.title); f.setAttribute('aria-label', f.title);
  }
  function navBuild() {
    const home = $('home-btn'); if (!home || $('ft-nav-back')) return;
    const w = document.createElement('div'); w.className = 'ft-nav';
    w.innerHTML = '<button type="button" id="ft-nav-back" onclick="ftNavBack()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><button type="button" id="ft-nav-fwd" onclick="ftNavFwd()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button>';
    home.parentNode.insertBefore(w, home);
    navRecord(); navUi();
  }
  document.addEventListener('keydown', e => {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    const tg = e.target; if (tg && (tg.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(tg.tagName))) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); navGo(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); navGo(1); }
  });

  /* ---------- Mails sur téléphone ---------- */
  const MQM = window.matchMedia('(max-width:767px)');
  const H = document.documentElement;
  const catsOpen = on => H.classList.toggle('cvm-cats', !!on);
  function cvmMobile() {
    const col = document.querySelector('#view-cvm aside.tpl-col'), hdr = document.querySelector('#tab-content-cvm > div:first-child');
    if (col && !$('cvm-m-bar')) {
      const bar = document.createElement('div'); bar.id = 'cvm-m-bar';
      bar.innerHTML = '<button type="button" onclick="ftCvmCats(true)" aria-label="Choisir une catégorie"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg><span class="cm-l"></span><span class="cm-n"></span></button>';
      col.insertBefore(bar, col.firstChild);
    }
    if (hdr && !$('cvm-back')) {
      const b = document.createElement('button'); b.type = 'button'; b.id = 'cvm-back'; b.setAttribute('aria-label', 'Revenir à la liste des mails');
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>Mails';
      b.onclick = () => H.classList.remove('cvm-reading');
      hdr.insertBefore(b, hdr.firstChild);
    }
    if (!$('cvm-cats-backdrop')) { const d = document.createElement('div'); d.id = 'cvm-cats-backdrop'; d.onclick = () => catsOpen(false); document.body.appendChild(d); }
    cvmBarLabel();
  }
  function cvmBarLabel() {
    const l = document.querySelector('#cvm-m-bar .cm-l'), n = document.querySelector('#cvm-m-bar .cm-n'); if (!l) return;
    let cur = 'all', cnt = 0;
    try { cur = currentCategory; cnt = cur === 'all' ? templates.length : cur === 'favorites' ? templates.filter(t => favorites.includes(t.id)).length : templates.filter(t => t.category === cur).length; } catch (e) {}
    l.textContent = cur === 'all' ? 'Toutes les catégories' : cur === 'favorites' ? 'Favoris' : cur;
    n.textContent = cnt;
  }
  window.ftCvmCats = catsOpen;
  if (typeof selectCategory === 'function') {
    const _sc = selectCategory;
    selectCategory = function () { const r = _sc.apply(this, arguments); try { cvmBarLabel(); if (MQM.matches) catsOpen(false); } catch (e) {} return r; };
  }
  if (typeof selectTemplate === 'function') {
    const _st = selectTemplate;
    selectTemplate = function () {
      const r = _st.apply(this, arguments);
      if (MQM.matches) { H.classList.add('cvm-reading'); const sc = document.querySelector('#tab-content-cvm > .overflow-y-auto'); if (sc) sc.scrollTop = 0; }
      return r;
    };
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && H.classList.contains('cvm-cats')) catsOpen(false); });
  // Geste : glisser depuis le bord gauche pour ouvrir, vers la gauche pour fermer
  let tx = null, ty = null;
  document.addEventListener('touchstart', e => { const t = e.touches[0]; tx = t.clientX; ty = t.clientY; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (tx == null || !MQM.matches) return; const t = e.changedTouches[0], dx = t.clientX - tx, dy = Math.abs(t.clientY - ty);
    let onCvm = false; try { onCvm = String(activeNavTab) === 'cvm'; } catch (er) {}
    if (onCvm && dy < 60) {
      if (!H.classList.contains('cvm-cats') && tx < 28 && dx > 60 && !H.classList.contains('cvm-reading')) catsOpen(true);
      else if (H.classList.contains('cvm-cats') && dx < -60) catsOpen(false);
      else if (H.classList.contains('cvm-reading') && tx < 28 && dx > 80) H.classList.remove('cvm-reading');
    }
    tx = ty = null;
  }, { passive: true });
  function start() {
    markTab();
    try { cvmMobile(); } catch (e) {}
    try { navBuild(); } catch (e) {}
    try { hoistBars(); } catch (e) {}
    try { moveMsgActions(); } catch (e) {}
    try { applyLabels(); sortMenu(); watchMenu(); adminBar(); } catch (e) {}
    try { populateCategorySelect(); } catch (e) {}
    try { linkify($('preview-body')); } catch (e) {}
    watch(); layout();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 60)); else setTimeout(start, 60);
})();
