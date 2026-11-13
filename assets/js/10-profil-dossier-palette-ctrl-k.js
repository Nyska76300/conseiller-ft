/* ================= Extension 15 : profil dossier, palette Ctrl+K, usage ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(String(s == null ? '' : s));
  const LS = k => { try { return safeLS.getItem(k); } catch (e) { return null; } };
  const LSset = (k, v) => { try { safeLS.setItem(k, v); } catch (e) {} };

  /* ---------- 1. Profil du dossier en cours ---------- */
  let profile = null;
  try { profile = JSON.parse(LS('ft_profile') || 'null'); } catch (e) { profile = null; }

  function stripHtml(h) { const d = document.createElement('div'); d.innerHTML = h; return (d.textContent || '').replace(/\s+/g, ' ').trim(); }
  const _dr = dossierResult;
  dossierResult = function (a, id) {
    const html = _dr(a, id);
    try {
      const sn = dossierSnapshot();
      const aj = parseFloat(String(sn.are).replace(',', '.'));
      let alerts = []; try { alerts = dossierAlerts(a).map(stripHtml); } catch (e) {}
      const mails = (window.__ftSugg || []).map(s => { const t = templates.find(x => x.id === s.id); return t ? t.title : ''; }).filter(Boolean);
      const pj = ((document.querySelector('#sim-calc-detail .sim-d-row:last-child .sim-d-v') || {}).textContent || '').trim();
      let finMax = ''; const dm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(pj), nj = parseInt(String(sn.duree).replace(/\D+/g, ''), 10);
      if (dm && nj > 0) { const d0 = new Date(+dm[3], +dm[2] - 1, +dm[1], 12); d0.setDate(d0.getDate() + nj - 1); finMax = d0.toLocaleDateString('fr-FR'); }
      profile = { a: a, sn: sn, aj: isNaN(aj) ? 0 : aj, alerts: alerts, mails: mails, premier: pj, finMax: finMax, at: new Date().toISOString() };
      LSset('ft_profile', JSON.stringify(profile));
      renderPill();
    } catch (e) {}
    return html;
  };

  function ficheText() {
    if (!profile) return '';
    const a = profile.a, sn = profile.sn;
    const motif = (DOSSIER_OPTS.motif().find(o => o.value === a.motif) || {}).label || a.motif || '';
    const eligible = !/^NON/i.test(sn.verdict);
    const L = ['FICHE DE SYNTHÈSE DOSSIER' + (a.ref ? ' (' + a.ref + ')' : ''), 'Établie le ' + new Date(profile.at).toLocaleDateString('fr-FR') + ' à titre indicatif', '',
      'Motif de fin de contrat : ' + motif, 'Fin de contrat : ' + (a.fct ? a.fct.split('-').reverse().join('/') : 'non renseignée'), 'Résultat : ' + sn.verdict];
    if (eligible) {
L.push('Allocation journalière brute estimée : ' + sn.are, 'Formule retenue : ' + sn.formule, 'Durée maximale : ' + sn.duree + ' (' + sn.mois + ')',
        'Différés : ' + sn.total + ' (congés payés ' + sn.cp + ', supra-légal ' + sn.supra + ')');
      if (profile.premier) L.push('Premier jour indemnisable estimé : ' + profile.premier);
      if (profile.finMax) L.push('Fin de droits au plus tard, durée maximale sans interruption : ' + profile.finMax);
    } else if (sn.desc) L.push('Motif : ' + sn.desc);
    if (profile.alerts.length) { L.push('', 'Points de vigilance :'); profile.alerts.forEach(x => L.push('- ' + x)); }
    if (profile.mails.length) { L.push('', 'Modèles CVM suggérés : ' + profile.mails.join(' ; ')); }
    const pieces = ['Pièce d’identité et justificatif de domicile', 'RIB'];
    if (/cdd|mission|fin_/.test(a.motif || '')) pieces.unshift('Attestation employeur destinée à France Travail');
    else if (/rupture_conv/.test(a.motif || '')) pieces.unshift('Attestation employeur et convention de rupture homologuée');
    else if (/demission/.test(a.motif || '')) pieces.unshift('Attestation employeur et justificatifs du motif de démission');
    else pieces.unshift('Attestation employeur destinée à France Travail');
    L.push('', 'Pièces habituelles à vérifier (à adapter au dossier) : ' + pieces.join(' ; '));
    L.push('', 'Estimation sous réserve de la notification de droits.');
    return L.join('\n');
  }
  window.__ftFicheText = ficheText;
  window.ftFpCopy = () => { copyToClipboard(ficheText()); showToast('Fiche de synthèse copiée', 'success'); };
  window.ftFpToCns = () => {
    if (!profile || !profile.aj) { showToast('Aucune allocation calculée dans le dernier dossier', 'info'); return; }
    switchNavTab('cns');
  };
  window.ftFpSim = () => { if (!profile) return; try { dossierApply(profile.a); } catch (e) {} switchNavTab('1'); closeFp(); };
  window.ftFpClear = () => { profile = null; LSset('ft_profile', 'null'); renderPill(); closeFp(); showToast('Dossier en cours effacé', 'success'); };
  function closeFp() { const p = $('fp-panel'); if (p) p.classList.add('hidden'); }
  window.ftFpToggle = () => { const p = $('fp-panel'); if (p) p.classList.toggle('hidden'); };

  function renderPill() {
    let pill = $('fp-pill'), panel = $('fp-panel');
    if (!pill) {
      pill = document.createElement('button'); pill.id = 'fp-pill'; pill.type = 'button'; pill.setAttribute('onclick', 'ftFpToggle()');
      panel = document.createElement('div'); panel.id = 'fp-panel'; panel.className = 'hidden';
      document.body.appendChild(panel); document.body.appendChild(pill);
    }
    if (!profile) { pill.classList.add('hidden'); panel.classList.add('hidden'); return; }
    const sn = profile.sn, ok = !/^NON/i.test(sn.verdict);
    pill.classList.remove('hidden'); pill.className = ok ? 'is-ok' : 'is-ko';
    pill.innerHTML = '<span>Dossier en cours</span><strong>' + esc(ok && profile.aj ? profile.aj.toFixed(2).replace('.', ',') + ' €/j' : sn.verdict) + '</strong>';
    panel.innerHTML = '<h4>Dossier en cours' + (profile.a.ref ? ' · ' + esc(profile.a.ref) : '') + '</h4><p>' + esc(sn.verdict) + (ok ? ' · ' + esc(sn.are) + ' / jour · ' + esc(sn.duree) : '') + '</p>' +
      '<button type="button" onclick="ftFpCopy()">Copier la fiche de synthèse</button>' +
      '<button type="button" onclick="ftFpSim()">Rouvrir dans le simulateur détaillé</button>' +
      (ok && profile.aj ? '<button type="button" onclick="ftFpToCns()">Reprendre l’ARE dans Cumul CNS</button>' : '') +
      '<button type="button" onclick="window.print()">Imprimer</button>' +
      '<button type="button" class="is-quiet" onclick="ftFpClear()">Effacer ce dossier</button>';
  }
  document.addEventListener('DOMContentLoaded', renderPill);
  if (document.readyState !== 'loading') renderPill();

  /* ---------- 2. Compteur d'usage et reprise de l'ARE dans le CNS ---------- */
  function usage() { try { return JSON.parse(LS('ft_tool_use') || '{}') || {}; } catch (e) { return {}; } }
  const _sw = switchNavTab;
  switchNavTab = function (t) {
    _sw(t);
    const cur = String(activeNavTab);
    if (cur && cur !== 'home' && cur.indexOf('hub:') !== 0) { const u = usage(); u[cur] = (u[cur] || 0) + 1; LSset('ft_tool_use', JSON.stringify(u)); }
    if (cur === 'cns' && profile && profile.aj) {
      const inp = $('cns-aj');
      if (inp && !inp.value) { inp.value = profile.aj.toFixed(2); try { cnsRun(); } catch (e) {} showToast('Allocation du dossier en cours reprise : ' + profile.aj.toFixed(2).replace('.', ',') + ' €/j', 'info'); }
    }
  };
  const hs = $('home-search'); if (hs) hs.placeholder = window.matchMedia('(max-width:767px)').matches ? 'Un outil ou un modèle de mail' : 'Un outil ou un modèle de mail (Ctrl+K partout)';

  /* ---------- 3. Palette de recherche globale Ctrl+K ---------- */
  function lev1(a, b) { // distance d'édition <= 1
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, d = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++d > 1) return false;
      if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; }
    }
    return d + (a.length - i) + (b.length - j) <= 1;
  }
  function tokMatch(tok, hay, words) {
    if (hay.indexOf(tok) > -1) return 2;
    if (tok.length >= 4 && words.some(w => w.length >= 3 && (lev1(tok, w) || lev1(tok, w.slice(0, tok.length))))) return 1;
    return 0;
  }
  function score(q, name, hay) {
    const toks = nrm(q).split(/\s+/).filter(Boolean); if (!toks.length) return 0;
    const n = nrm(name), h = nrm(hay), words = h.split(/[^a-z0-9]+/).filter(Boolean);
    let s = 0;
    for (const t of toks) { const m = tokMatch(t, h, words); if (!m) return 0; s += m + (n.indexOf(t) > -1 ? 3 : 0); }
    return s;
  }
  let pItems = [], pSel = 0;
  function pItemsFor(q) {
    const out = [];
    const tools = NAV_TABS_CONFIG.filter(t => String(t.id).indexOf('hub:') !== 0 && t.id !== 'home');
    const acts = (window.FT_ACTIONS || []).filter(x => !x.when || x.when());
    if (!q.trim()) {
      const u = usage();
      acts.forEach(x => out.push({ g: 'Actions', t: x.t, s: x.s, run: x.run }));
      const freq = tools.filter(t => u[String(t.id)]).sort((a, b) => u[String(b.id)] - u[String(a.id)]).slice(0, 4);
      (freq.length ? freq : tools.slice(0, 4)).forEach(t => out.push({ g: freq.length ? 'Outils fréquents' : 'Outils', t: t.name, s: t.desc, run: () => switchNavTab(t.id) }));
      (recentTemplates || []).slice(0, 5).forEach(id => { const tp = templates.find(x => x.id === id); if (tp) out.push({ g: 'Modèles récents', t: tp.title, s: tp.category, run: () => openTpl(tp.id) }); });
      return out;
    }
    acts.filter(x => score(q, x.t, x.t + ' ' + x.s + ' ' + (x.kw || '')) > 0).forEach(x => out.push({ g: 'Actions', t: x.t, s: x.s, run: x.run }));
        tools.map(t => ({ t: t, sc: score(q, t.name, ftToolHay(t)) })).filter(x => x.sc).sort((a, b) => b.sc - a.sc).slice(0, 6)
      .forEach(x => out.push({ g: 'Outils', t: x.t.name, s: x.t.desc, run: () => switchNavTab(x.t.id) }));
    (window.FT_SOURCES || []).map(r => ({ r: r, sc: score(q, r[0] + ' ' + r[1], r.join(' ')) })).filter(x => x.sc).sort((a, b) => b.sc - a.sc).slice(0, 4)
      .forEach(x => out.push({ g: 'Règles', t: x.r[0] + ' : ' + x.r[1], s: x.r[2], run: () => { switchNavTab('sources'); ftSvSearch(x.r[1]); } }));
    templates.map(tp => ({ tp: tp, sc: score(q, tp.title, tp.title + ' ' + tp.category + ' ' + (tp.tags || []).join(' ') + ' ' + String(tp.body || '').slice(0, 600)) })).filter(x => x.sc).sort((a, b) => b.sc - a.sc).slice(0, 7)
      .forEach(x => out.push({ g: 'Modèles de mail', t: x.tp.title, s: x.tp.category, run: () => openTpl(x.tp.id) }));
    return out;
  }
  function openTpl(id) { switchNavTab('cvm'); selectCategory('all'); selectTemplate(id); }
  function pRender() {
    const q = $('pal-q').value; pItems = pItemsFor(q); if (pSel >= pItems.length) pSel = 0;
    let g = '';
    $('pal-list').innerHTML = pItems.length ? pItems.map((it, i) => (it.g !== g ? (g = it.g, '<div class="pal-g">' + esc(g) + '</div>') : '') +
      '<button type="button" class="pal-it' + (i === pSel ? ' is-sel' : '') + '" data-i="' + i + '" onclick="ftPalGo(' + i + ')"><strong>' + esc(it.t) + '</strong><span>' + esc(it.s || '') + '</span></button>').join('')
      : '<p class="pal-empty">Aucun résultat pour « ' + esc(q) + ' ».</p>';
    const sel = $('pal-list').querySelector('.is-sel'); if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
  }
  window.ftPalGo = i => { const it = pItems[i]; if (!it) return; ftPalClose(); it.run(); };
  window.ftPalClose = () => { const m = $('pal'); if (m) m.classList.add('hidden'); };
  function palOpen() {
    let m = $('pal');
    if (!m) {
      m = document.createElement('div'); m.id = 'pal'; m.className = 'hidden';
      m.innerHTML = '<div class="pal-back" onclick="ftPalClose()"></div><div class="pal-box" role="dialog" aria-label="Recherche"><input id="pal-q" type="search" autocomplete="off" spellcheck="false" placeholder="Outil, règle ou modèle de mail"><div id="pal-list"></div><div class="pal-hint">↑ ↓ pour choisir, Entrée pour ouvrir, Échap pour fermer</div></div>';
      document.body.appendChild(m);
      $('pal-q').addEventListener('input', () => { pSel = 0; pRender(); });
      $('pal-q').addEventListener('keydown', e => {
        if (e.key === 'ArrowDown') { e.preventDefault(); pSel = Math.min(pItems.length - 1, pSel + 1); pRender(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); pSel = Math.max(0, pSel - 1); pRender(); }
        else if (e.key === 'Enter') { e.preventDefault(); ftPalGo(pSel); }
        else if (e.key === 'Escape') { e.preventDefault(); ftPalClose(); }
      });
    }
    m.classList.remove('hidden'); $('pal-q').value = ''; pSel = 0; pRender(); $('pal-q').focus();
  }
  window.ftPalOpen = palOpen;
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); e.stopImmediatePropagation(); const m = $('pal'); if (m && !m.classList.contains('hidden')) ftPalClose(); else palOpen(); }
  }, true);
  window.__ftScore = score;
  window.__ftProfile = () => profile;
  window.FT_ACTIONS = window.FT_ACTIONS || [];

  /* ---------- 4. Cas de contrôle supplémentaires ---------- */
  [
    { n: 'Palette : une faute de frappe retrouve « rechargement »', run: () => score('rechargment', 'Droits', 'Droits passages Rechargement des droits') > 0 ? 1 : 0, exp: 1, d: 0 },
    { n: 'Palette : un terme absent ne renvoie rien', run: () => score('zzzzqx', 'Droits', 'Droits passages Rechargement des droits') > 0 ? 1 : 0, exp: 0, d: 0 },
    { n: 'Sources : aucune règle « Vérifié » sans source', run: () => (window.FT_SOURCES || []).filter(r => r[4] === 'Vérifié' && (!r[3] || r[3] === '—')).length, exp: 0, d: 0 },
    { n: 'Barème : vérifié depuis moins de 9 mois', run: () => (Date.now() - new Date(window.FT_VERIF_DATE + 'T12:00:00').getTime()) / 86400000 <= 270 ? 1 : 0, exp: 1, d: 0 },
    { n: 'ARE : l’allocation reste dans les bornes pour 300 SJR testés', run: () => { let bad = 0; for (let sjr = 1; sjr <= 300; sjr++) { const aj = ftAreJour(sjr).aj; if (aj > 0.75 * sjr + 1e-9 || aj > 300.21 + 1e-9 || aj < Math.min(32.13, 0.75 * sjr) - 1e-9) bad++; } return bad; }, exp: 0, d: 0 },
    { n: 'ARE : l’allocation ne diminue jamais quand le SJR augmente', run: () => { let bad = 0, prev = 0; for (let sjr = 1; sjr <= 400; sjr += 0.5) { const aj = ftAreJour(sjr).aj; if (aj < prev - 1e-9) bad++; prev = aj; } return bad; }, exp: 0, d: 0 }
  ].forEach(c => FT_CASES.push(c));
})();
