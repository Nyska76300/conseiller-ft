/* ================= Extension 10 : suggestions CVM, historique, sauvegarde, droits & passages, journée, glossaire ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(String(s == null ? '' : s));
  const lsGet = (k, d) => { try { const v = safeLS.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { safeLS.setItem(k, v); } catch (e) {} };
  const jget = (k, d) => { try { const v = JSON.parse(lsGet(k, 'null')); return v == null ? d : v; } catch (e) { return d; } };
  const fnum = n => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 });

  /* ---------- 1. Cas de contrôle : CSP, indus, CIBTP, retraite (pilotent les vrais écrans) ---------- */
  function ftNum(t) { return parseFloat(String(t == null ? '' : t).replace(/[\s  ]/g, '').replace(',', '.').replace(/[^0-9.\-]/g, '')); }
  function ftDom(set, fn, rid, pre) {
    const saved = {};
    Object.keys(set).forEach(id => { const e = $(id); if (e) saved[id] = (e.type === 'checkbox' || e.type === 'radio') ? e.checked : e.value; });
    const modeBefore = (typeof indusCalculationMode !== 'undefined') ? indusCalculationMode : null;
    try {
      if (pre) pre();
      Object.keys(set).forEach(id => { const e = $(id); if (!e) return; if (e.type === 'checkbox' || e.type === 'radio') e.checked = !!set[id]; else e.value = set[id]; });
      fn();
      return ftNum(($(rid) || {}).textContent);
    } finally {
      Object.keys(saved).forEach(id => { const e = $(id); if (!e) return; if (e.type === 'checkbox' || e.type === 'radio') e.checked = saved[id]; else e.value = saved[id]; });
      if (modeBefore && typeof setIndusMode === 'function' && modeBefore !== indusCalculationMode) setIndusMode(modeBefore);
      try { fn(); } catch (e) {}
    }
  }
  const csp = (sal, anc, rid) => () => ftDom({ 'csp-sim-salaire': sal, 'csp-sim-anciennete': anc }, runCspCalculation, rid);
  const ind = (mode, id, v, rid) => () => ftDom({ 'indus-input-montant': 1000, [id]: v }, runIndusCalculation, rid, () => setIndusMode(mode));
  const cib = (d1, d2, rest, rid) => () => ftDom({ 'cibtp-date-debut': d1, 'cibtp-date-fct': d2, 'cibtp-jours-restants': rest, 'cibtp-jours-payes': 0, 'cibtp-timing-avant': true, 'cibtp-timing-apres': false }, runCibtpCalculation, rid);
  const ret = (coh, age, trim, rid) => () => ftDom({ 'retraite-input-cohorte': coh, 'retraite-input-age-actuel': age, 'retraite-input-trimestres-valides': trim }, runRetraiteCalculation, rid);
  [
    { n: 'CSP : ASP mensuelle pour 3 000 € brut (75 % du SJR), ancienneté ≥ 1 an', run: csp(3000, 'sup1an', 'csp-res-asp-mensuelle'), exp: 2218.94, d: 1 },
    { n: 'CSP : ARE de comparaison pour 3 000 € brut (57 % du SJR)', run: csp(3000, 'sup1an', 'csp-res-are-mensuelle'), exp: 1686.39, d: 1 },
    { n: 'CSP : écart ASP − ARE par mois', run: csp(3000, 'sup1an', 'csp-res-gain-total'), exp: 532.54, d: 1 },
    { n: 'Indus 1 000 € sur 3 mois : mensualité', run: ind('duree', 'indus-input-duree', 3, 'indus-res-mensualite'), exp: 333.33, d: 2 },
    { n: 'Indus 1 000 € à 300 € / mois : nombre de mensualités (solde compris)', run: ind('montant', 'indus-input-mensualite', 300, 'indus-res-duree'), exp: 4, d: 0 },
    { n: 'Indus 1 000 € : total remboursé', run: ind('duree', 'indus-input-duree', 3, 'indus-res-total-rembourse'), exp: 1000, d: 2 },
    { n: 'CIBTP : différé plafonné à 30 jours (01/04 au 15/10, 10 jours restants)', run: cib('2026-04-01', '2026-10-15', 10, 'cibtp-res-differe-final'), exp: 30, d: 0 },
    { n: 'CIBTP : différé non plafonné (01/09 au 15/10, 5 jours restants)', run: cib('2026-09-01', '2026-10-15', 5, 'cibtp-res-differe-final'), exp: 10, d: 0 },
    { n: 'Retraite : trimestres requis, génération 1963', run: ret('1963', 63, 158, 'retraite-res-trimestres-requis'), exp: 170, d: 0 },
    { n: 'Retraite : trimestres manquants (170 − 158)', run: ret('1963', 63, 158, 'retraite-res-trimestres-manquants'), exp: 12, d: 0 },
    { n: 'Retraite : trimestres requis, génération 1969 et suivantes', run: ret('1969_plus', 64, 150, 'retraite-res-trimestres-requis'), exp: 172, d: 0 }
  ].forEach(c => FT_CASES.push(c));

  /* ---------- 2. Rechargement, ASS, prestations : logique pure et testable ---------- */
  const RECH = { jours: 130, heures: 910, joursSais: 108, heuresSais: 758, repriseJours: 88, repriseHeures: 610, durMin: 182, durMinSais: 152, mois: 24, moisSenior: 36 };
  function ftRecharge(p) {
    const seuilJ = p.sais ? RECH.joursSais : RECH.jours, seuilH = p.sais ? RECH.heuresSais : RECH.heures;
    const ok = p.unite === 'hours' ? p.volume >= seuilH : p.volume >= seuilJ;
    const out = { seuil: p.unite === 'hours' ? seuilH : seuilJ, ok: false, motifs: [], dureeMin: p.sais ? RECH.durMinSais : RECH.durMin, fenetre: p.age55 ? RECH.moisSenior : RECH.mois };
    if (!ok) out.motifs.push('Volume de travail insuffisant : ' + out.seuil + (p.unite === 'hours' ? ' heures' : ' jours') + ' minimum depuis la dernière ouverture de droits.');
    if (p.fin === 'volontaire') {
      const rep = p.unite === 'hours' ? p.depuisDepart >= RECH.repriseHeures : p.depuisDepart >= RECH.repriseJours;
      if (!rep) out.motifs.push('Dernier départ volontaire : il faut ' + (p.unite === 'hours' ? RECH.repriseHeures + ' heures' : RECH.repriseJours + ' jours') + ' travaillés depuis ce départ (sauf démission légitime ou projet professionnel).');
    }
    if (p.apresEpuisement) out.motifs.push('Un emploi terminé après l’épuisement du droit initial ne permet pas le rechargement : il ouvre un nouveau droit.');
    out.ok = out.motifs.length === 0;
    return out;
  }
  function ftAssCheck(p) {
    const r = [];
    if (!(p.anneesActivite >= 5)) r.push('Activité salariée : 5 ans sur les 10 ans précédant la fin du contrat de travail requis.');
    if (!p.recherche) r.push('Recherche effective d’emploi requise.');
    const plafond = p.couple ? 2142.80 : 1363.60;
    if (p.ressources > plafond) r.push('Ressources mensuelles supérieures au plafond de ' + fnum(plafond) + ' € (au 1er avril 2026).');
    return { ok: r.length === 0, motifs: r, plafond: plafond, aj: 19.48 };
  }
  window.ftRecharge = ftRecharge; window.ftAssCheck = ftAssCheck;
  [
    { n: 'Rechargement : 130 jours atteints, fin involontaire', run: () => ftRecharge({ volume: 130, unite: 'days', fin: 'invol', age55: false }).ok ? 1 : 0, exp: 1, d: 0 },
    { n: 'Rechargement : 129 jours, seuil non atteint', run: () => ftRecharge({ volume: 129, unite: 'days', fin: 'invol', age55: false }).ok ? 1 : 0, exp: 0, d: 0 },
    { n: 'Rechargement : 910 heures atteintes', run: () => ftRecharge({ volume: 910, unite: 'hours', fin: 'invol', age55: false }).ok ? 1 : 0, exp: 1, d: 0 },
    { n: 'Rechargement saisonnier : 108 jours atteints', run: () => ftRecharge({ volume: 108, unite: 'days', sais: true, fin: 'invol', age55: false }).ok ? 1 : 0, exp: 1, d: 0 },
    { n: 'Rechargement : fenêtre de 36 mois à 55 ans et plus', run: () => ftRecharge({ volume: 200, unite: 'days', fin: 'invol', age55: true }).fenetre, exp: 36, d: 0 },
    { n: 'Rechargement : départ volontaire, 88 jours depuis le départ', run: () => ftRecharge({ volume: 200, unite: 'days', fin: 'volontaire', depuisDepart: 88, age55: false }).ok ? 1 : 0, exp: 1, d: 0 },
    { n: 'ASS : plafond de ressources, personne seule', run: () => ftAssCheck({ anneesActivite: 6, recherche: true, ressources: 0 }).plafond, exp: 1363.6, d: 2 },
    { n: 'ASS : 4 ans d’activité, refus', run: () => ftAssCheck({ anneesActivite: 4, recherche: true, ressources: 0 }).ok ? 1 : 0, exp: 0, d: 0 }
  ].forEach(c => FT_CASES.push(c));

  /* ---------- 3. Suggestions automatiques de modèles CVM ---------- */
  function ftDossierCtx(a) {
    const fct = ftParseDate(a.fct) || new Date();
    const ageBand = a.age === 'under55' ? 'u55' : (a.age === '55to56' ? 'a55' : 'a57');
    const sjrAtt = parseFloat(a.sjr) || 0, sal = parseFloat(a.salaire) || 0;
    const sjr = sjrAtt > 0 ? sjrAtt : (sal > 0 ? sal / 30.42 : 0);
    const d = ftComputeDates({ fct: fct, sjr: sjr, cp: parseFloat(a.cp) || 0, supra: parseFloat(a.supra) || 0, eco: a.motif === 'licenciement_eco', ageBand: ageBand, rci: a.motif === 'rupture_conv', joursPeriode: parseFloat(a.jours) || 0 });
    return { fct: fct, d: d, sjr: sjr, aj: sjr > 0 ? ftAreJour(sjr).aj : 0 };
  }
  function ftSuggestions(a, eligible) {
    const c = ftDossierCtx(a), d = c.d, out = [];
    const f = x => ftFmtDate(x);
    if (eligible) {
      out.push({ id: 'bm-m005', why: 'Notification d’admission avec date de prise en charge, taux et durée.',
        fill: Object.assign({}, c.aj ? { montant: c.aj.toFixed(2).replace('.', ',') } : {}, { date: f(d.debut), x: String(d.dureeReelle) }),
        note: 'Le modèle parle d’un taux « net » : le montant prérempli est brut, à adapter si besoin.' });
      if (d.total > 7) {
        const fl = { sjr: c.sjr ? c.sjr.toFixed(2).replace('.', ',') : '' };
        if (d.diffSpec) { fl.x = String(d.diffSpec); fl.x_2 = String(d.diffSpec); }
        if (d.diffCp) { fl.x_3 = String(d.diffCp); fl.x_4 = String(d.diffCp); }
        out.push({ id: 'bm-m041', why: 'Explication des différés (' + d.total + ' jours avant le premier versement).', fill: fl,
          note: 'Le montant et la date de notification, partagés entre deux lignes du modèle, sont à saisir.' });
      } else {
        out.push({ id: 'bm-m004', why: 'Admission standard, sans différé particulier.', fill: {} });
      }
      out.push({ id: 'bm-m058', why: 'Rappel de la règle du délai congés payés, utile si l’usager conteste la date.', fill: {} });
    } else if (/demission/.test(String(a.motif || ''))) {
      out.push({ id: 'bm-m009', why: 'Rejet : 65 jours ou 455 heures non effectués depuis la démission.', fill: { date_2: f(c.fct) }, note: 'La date de démission et l’employeur sont à saisir.' });
      out.push({ id: 'bm-m010', why: 'Rejet avec suspension des droits pendant 4 mois.', fill: {}, note: 'Le texte contient des dates fixes à vérifier.' });
      out.push({ id: 'bm-m011', why: 'Rappel de la réglementation démission (455 h / 3 mois d’activité).', fill: {} });
    } else {
      out.push({ id: 'bm-m001', why: 'Étude de droits en attente (nouvelle fin de mission, période de référence).', fill: { date_fc: f(c.fct) } });
      out.push({ id: 'bm-m049', why: 'Précisions sur le calcul de l’allocation si l’usager le conteste.', fill: {} });
    }
    return out.filter(s => templates.some(t => t.id === s.id)).slice(0, 3);
  }
  function ftSuggestHtml(a, eligible) {
    let list = [];
    try { list = ftSuggestions(a, eligible); } catch (e) { list = []; }
    if (!list.length) return '';
    const cards = list.map((s, i) => {
      const t = templates.find(x => x.id === s.id);
      const vals = Object.keys(s.fill).filter(k => s.fill[k] !== '').map(k => '<span class="sg2-chip">' + esc(k) + ' = ' + esc(s.fill[k]) + '</span>').join('');
      return '<div class="sg2-card"><div class="sg2-top"><strong>' + esc(t.title) + '</strong><span class="sg2-cat">' + esc(t.category) + '</span></div>' +
        '<p>' + esc(s.why) + '</p>' + (vals ? '<div class="sg2-chips">' + vals + '</div>' : '') + (s.note ? '<p class="sg2-note">' + esc(s.note) + '</p>' : '') +
        '<button type="button" class="wiz-btn wiz-btn-primary" onclick="ftOpenSuggestion(' + i + ')"><i data-lucide="mail" class="w-4 h-4"></i>Ouvrir ce modèle prérempli</button></div>';
    }).join('');
    window.__ftSugg = list;
    return '<h4 class="wiz-h">Modèles CVM suggérés</h4><div class="sg2-grid">' + cards + '</div>';
  }
  window.ftOpenSuggestion = function (i) {
    const s = (window.__ftSugg || [])[i];
    if (!s) return;
    userVariables[s.id] = Object.assign({}, userVariables[s.id] || {}, s.fill);
    saveState();
    switchNavTab('cvm');
    selectCategory('all');
    selectTemplate(s.id);
    showToast('Modèle ouvert avec les valeurs du dossier', 'success');
  };
  const _dr = dossierResult;
  dossierResult = function (a, id) {
    const html = _dr(a, id);
    let sn; try { sn = dossierSnapshot(); } catch (e) { return html; }
    const sug = ftSuggestHtml(a, !/^NON/i.test(sn.verdict));
    const marker = '<h4 class="wiz-h">Texte à intégrer au mail</h4>';
    return sug && html.indexOf(marker) > -1 ? html.replace(marker, sug + marker) : html + sug;
  };

  /* ---------- 4. « Pourquoi cette question ? » dans les assistants ---------- */
  const WHY = {
    motif: 'Le motif décide des règles applicables : démission (conditions spécifiques), rupture conventionnelle (durée maximale réduite à partir du 01/09/2026), licenciement économique (plafond du différé spécifique à 75 jours).',
    opt65: 'Après une démission, un nouvel examen est possible une fois 65 jours (455 heures) travaillés depuis le départ.',
    opt122: 'Après 121 jours de chômage, l’instance paritaire peut réexaminer une démission au vu des démarches de reclassement.',
    fct: 'La fin de contrat sert de point de départ : période de référence, différés, délai d’attente et forclusion se calculent à partir d’elle.',
    insc: 'La date d’inscription sert à vérifier le délai de dépôt de la demande et à situer le premier jour indemnisable.',
    age: 'L’âge à la fin du contrat fixe la période de référence (24 ou 36 mois) et la durée maximale de 548, 685 ou 822 jours.',
    sais: 'Les saisonniers ont des seuils d’affiliation réduits (108 jours ou 758 heures au lieu de 130 jours ou 910 heures).',
    unite: 'Le seuil d’affiliation s’apprécie en jours travaillés ou en heures, selon les contrats.',
    aff: 'Il faut atteindre le seuil d’affiliation sur la période de référence pour ouvrir un droit.',
    jours: 'La durée réelle se calcule sur les jours calendaires de la période d’emploi, multipliés par 0,75, avec un minimum de 182 jours.',
    forclusion: 'Au-delà du délai de dépôt, la demande peut être forclose.',
    residence: 'L’allocation suppose de résider en France et d’être apte au travail.',
    recherche: 'La recherche effective d’emploi est une condition d’attribution.',
    retraite: 'Un usager qui justifie d’une retraite à taux plein ne peut plus être indemnisé.',
    salaire: 'Le salaire permet d’estimer le SJR, donc l’allocation et les différés, si l’attestation n’est pas disponible.',
    sjr: 'Le SJR de l’attestation rend le calcul exact au lieu d’estimé.',
    cp: 'Les congés payés versés à la fin du contrat retardent le premier versement (différé plafonné à 30 jours).',
    supra: 'Les indemnités supra-légales créent un différé spécifique, calculé à partir de leur montant.',
    type: 'Seule l’activité salariée relève de la règle de cumul des 70 %.',
    aj: 'L’allocation journalière sert à calculer le nombre de jours indemnisables du mois.',
    mois: 'Le cumul se calcule mois par mois, sur 30 jours quel que soit le mois (mensualisation).',
    brut: 'Le salaire brut du mois entre dans la règle des 70 %.',
    reliquat: 'Les jours non consommés reportent la fin des droits.'
  };
  const _wr = wizRender;
  wizRender = function (id) {
    _wr(id);
    try {
      const w = FT_WIZ[id]; if (!w || w.done) return;
      const st = wizSteps(w)[w.step];
      const txt = st && WHY[st.key];
      const q = document.querySelector('#wiz-' + id + ' .wiz-q');
      if (txt && q && !document.querySelector('#wiz-' + id + ' .wiz-why')) {
        const hint = q.nextElementSibling && q.nextElementSibling.classList.contains('wiz-hint') ? q.nextElementSibling : q;
        hint.insertAdjacentHTML('afterend', '<details class="wiz-why"><summary>Pourquoi cette question ?</summary><p>' + esc(txt) + '</p></details>');
      }
    } catch (e) {}
  };

  /* ---------- 5. Historique et restauration des modèles ---------- */
  const _hut = handleUpdateTemplate;
  handleUpdateTemplate = function (ev) {
    const id = ($('edit-m-id') || {}).value;
    const t0 = templates.find(t => t.id === id);
    const before = t0 ? { at: new Date().toISOString(), title: t0.title, shortTitle: t0.shortTitle || '', category: t0.category, body: t0.body } : null;
    _hut(ev);
    const t1 = templates.find(t => t.id === id);
    if (before && t1 && (before.body !== t1.body || before.title !== t1.title || before.category !== t1.category)) {
      t1.history = [before].concat(t1.history || []).slice(0, 10);
      saveState();
    }
  };
  function histHtml(tpl) {
    const h = tpl.history || [];
    const off = (typeof OFFICIAL_TEMPLATES !== 'undefined') ? OFFICIAL_TEMPLATES.find(o => o.id === tpl.id) : null;
    if (!h.length && !off) return '';
    const rows = h.map((v, i) => '<div class="hist-row"><span>' + esc(new Date(v.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })) + ' · ' + esc(v.title) + '</span><button type="button" onclick="ftHistRestore(\'' + esc(tpl.id) + '\',' + i + ')">Recharger</button></div>').join('');
    return '<div class="hist-box"><div class="hist-title">Versions précédentes</div>' + (rows || '<div class="hist-empty">Aucune modification enregistrée.</div>') +
      (off ? '<div class="hist-row"><span>Texte d’origine de la bibliothèque</span><button type="button" onclick="ftHistRestore(\'' + esc(tpl.id) + '\',-1)">Recharger</button></div>' : '') +
      '<div class="hist-empty">« Recharger » remplit le formulaire ; enregistrez pour valider.</div></div>';
  }
  window.ftHistRestore = function (id, i) {
    const tpl = templates.find(t => t.id === id); if (!tpl) return;
    const v = i === -1 ? OFFICIAL_TEMPLATES.find(o => o.id === id) : (tpl.history || [])[i];
    if (!v) return;
    $('edit-m-title').value = v.title; $('edit-m-short').value = v.shortTitle || v.title;
    if ([...$('edit-m-category').options].some(o => o.value === v.category)) $('edit-m-category').value = v.category;
    $('edit-m-body').value = v.body;
    showToast('Version rechargée dans le formulaire : enregistrez pour la valider', 'info');
  };
  const _oem = openEditModelModal;
  openEditModelModal = function (tid, ev) {
    _oem(tid, ev);
    const tpl = templates.find(t => t.id === tid); const body = $('edit-m-body'); if (!tpl || !body) return;
    let box = $('edit-m-history');
    if (!box) { box = document.createElement('div'); box.id = 'edit-m-history'; const anchor = ($('edit-m-reviewed') || body).parentElement.parentElement; anchor.insertAdjacentElement('afterend', box); }
    box.innerHTML = histHtml(tpl);
  };

  /* ---------- 6. Rappel de sauvegarde ---------- */
  const _exp = ftExportData;
  ftExportData = function () { _exp(); lsSet('ft_last_export', new Date().toISOString()); const b = $('bk-banner'); if (b) b.remove(); };
  function backupCheck() {
    if (!lsGet('ft_first_seen', '')) lsSet('ft_first_seen', new Date().toISOString());
    const custom = templates.some(t => !t.isOfficial) || templates.some(t => (t.history || []).length) || Object.keys(userVariables || {}).length > 0;
    if (!custom) return;
    const ref = new Date(lsGet('ft_last_export', '') || lsGet('ft_first_seen', '')).getTime();
    const snooze = new Date(lsGet('ft_backup_snooze', '1970-01-01')).getTime();
    const now = Date.now();
    if (!(now - ref > 30 * 86400000) || now < snooze || $('bk-banner')) return;
    const days = Math.floor((now - ref) / 86400000);
    const b = document.createElement('div'); b.id = 'bk-banner'; b.setAttribute('role', 'status');
    b.innerHTML = '<strong>Pensez à sauvegarder vos modèles</strong><span>Dernière sauvegarde il y a ' + days + ' jours. Vos modèles et favoris ne sont enregistrés que dans ce navigateur.</span>' +
      '<div><button type="button" class="reg-btn reg-btn-primary" onclick="ftExportData()">Sauvegarder maintenant</button><button type="button" class="reg-btn" onclick="ftBackupSnooze()">Plus tard</button></div>';
    document.body.appendChild(b);
  }
  window.ftBackupSnooze = function () { lsSet('ft_backup_snooze', new Date(Date.now() + 7 * 86400000).toISOString()); const b = $('bk-banner'); if (b) b.remove(); };
  window.ftBackupCheck = backupCheck;
  setTimeout(backupCheck, 2500);

  /* ---------- 7. Nouvelles pages ---------- */
  function addView(id, inner) {
    const host = $('view-delais').parentElement, v = document.createElement('div');
    v.id = 'view-' + id; v.className = 'hidden flex-1 overflow-y-auto'; v.innerHTML = '<div class="reg-wrap">' + inner + '</div>';
    host.appendChild(v); return v;
  }
  const head = (t, p, extra) => '<div class="reg-head"><div><h2>' + t + '</h2><p>' + p + '</p></div>' + (extra ? '<div class="reg-actions">' + extra + '</div>' : '') + '</div>';
  const NEW_TABS = [
    { id: 'droits', name: 'Droits & passages', desc: 'Rechargement, passage ARE vers ASS, prestations cumulées', icon: 'repeat', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', badge: 'Rechargement · ASS' },
    { id: 'jour', name: 'Ma journée', desc: 'Dossiers récents, favoris, pense-bête et état des sauvegardes', icon: 'sun', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', badge: 'Local' },
    { id: 'glossaire', name: 'Glossaire', desc: 'SJR, PRA, ARE, ARCE, CFD, IPR et autres sigles', icon: 'book-a', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', badge: 'Sigles' }
  ];
  NEW_TABS.forEach(t => NAV_TABS_CONFIG.push(t));
  HOME_GROUPS[0].ids.push('jour', 'glossaire');
  HOME_GROUPS[2].ids.push('droits');
  Object.assign(FT_KW, {
    droits: 'rechargement droits rechargeables ass solidarité passage fin de droits pension invalidité retraite maladie indemnités journalières cumul',
    jour: 'journée pense-bête rappels dossiers récents favoris sauvegarde',
    glossaire: 'glossaire sigle définition sjr pra are arce cfd ipr asp idr ass iccp'
  });

  /* Droits & passages */
  addView('droits', head('Droits & passages', 'Rechargement des droits, passage de l’ARE à l’ASS et prestations cumulées. Règles vérifiées sur unedic.org et francetravail.fr le 27/10/2026.') +
    '<div class="dp-grid">' +
    '<section class="dl-form"><h3 class="dl-h">Rechargement des droits</h3>' +
    '<label>Travail depuis la dernière ouverture de droits<input id="rc-vol" type="number" min="0" placeholder="0" oninput="ftDroitsRun()"></label>' +
    '<label>Unité<select id="rc-unite" onchange="ftDroitsRun()"><option value="days">Jours travaillés</option><option value="hours">Heures travaillées</option></select></label>' +
    '<label>Fin du dernier contrat<select id="rc-fin" onchange="ftDroitsRun()"><option value="invol">Involontaire (fin de contrat, licenciement…)</option><option value="volontaire">Départ volontaire</option></select></label>' +
    '<label id="rc-dep-wrap" style="display:none">Travail depuis ce départ volontaire<input id="rc-dep" type="number" min="0" placeholder="0" oninput="ftDroitsRun()"></label>' +
    '<label class="dl-check"><input id="rc-sais" type="checkbox" onchange="ftDroitsRun()"> Contrats saisonniers uniquement</label>' +
    '<label class="dl-check"><input id="rc-55" type="checkbox" onchange="ftDroitsRun()"> 55 ans ou plus à la fin du contrat</label>' +
    '<label class="dl-check"><input id="rc-apres" type="checkbox" onchange="ftDroitsRun()"> Emploi terminé après l’épuisement du droit initial</label>' +
    '<div id="rc-out" class="dp-out"></div></section>' +
    '<section class="dl-form"><h3 class="dl-h">Passage de l’ARE à l’ASS</h3>' +
    '<label>Années d’activité salariée sur les 10 dernières années<input id="as-ans" type="number" min="0" step="0.5" placeholder="0" oninput="ftDroitsRun()"></label>' +
    '<label>Ressources mensuelles de l’usager (€)<input id="as-res" type="number" min="0" placeholder="0" oninput="ftDroitsRun()"></label>' +
    '<label class="dl-check"><input id="as-couple" type="checkbox" onchange="ftDroitsRun()"> Vit en couple</label>' +
    '<label class="dl-check"><input id="as-rech" type="checkbox" checked onchange="ftDroitsRun()"> En recherche effective d’emploi</label>' +
    '<div id="as-out" class="dp-out"></div></section>' +
    '<section class="dl-form dp-wide"><h3 class="dl-h">ARE et autres prestations : points de vigilance</h3>' +
    '<ul class="dp-list">' +
    '<li><strong>Pension d’invalidité de 1ʳᵉ catégorie</strong> : cumulable en totalité avec l’ARE.</li>' +
    '<li><strong>Pension d’invalidité de 2ᵉ ou 3ᵉ catégorie</strong> : cumul selon le code de la sécurité sociale, avec déduction du montant de la pension dans certains cas.</li>' +
    '<li><strong>Indemnités journalières de la sécurité sociale</strong> : l’indemnisation cesse si l’allocataire perçoit ou peut percevoir des prestations en espèces de la sécurité sociale. Tout arrêt maladie est à signaler à l’assurance maladie et à France Travail.</li>' +
    '<li><strong>Pension de retraite</strong> : cumul total ou partiel avec l’ARE selon l’âge ; impossible en cas de retraite anticipée pour carrière longue. L’ARE cesse à l’âge légal si le nombre de trimestres requis est atteint.</li>' +
    '</ul><p class="wiz-hint">Source : fiche Unédic « Allocation d’aide au retour à l’emploi (ARE) ». Les taux de réduction selon l’âge ne sont pas repris ici : la fiche présente une tranche d’âge incohérente, à confirmer dans le règlement général avant tout calcul.</p>' +
    '<div class="wiz-links"><a href="https://unedic.org/indemnisation/fiches-thematiques/allocation-daide-au-retour-lemploi-are" target="_blank" rel="noopener noreferrer">Unédic : fiche ARE</a>' +
    '<a href="https://unedic.org/indemnisation/fiches-thematiques/droits-rechargeables" target="_blank" rel="noopener noreferrer">Unédic : droits rechargeables</a>' +
    '<a href="https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/aides-financieres-et-autres-allo/autres-allocations/lallocation-de-solidarite-specif.html" target="_blank" rel="noopener noreferrer">France Travail : ASS</a></div></section>' +
    '</div>');
  window.ftDroitsRun = function () {
    const g = id => $(id), vol = parseFloat(g('rc-vol').value) || 0;
    g('rc-dep-wrap').style.display = g('rc-fin').value === 'volontaire' ? 'flex' : 'none';
    const r = ftRecharge({ volume: vol, unite: g('rc-unite').value, fin: g('rc-fin').value, depuisDepart: parseFloat(g('rc-dep').value) || 0, sais: g('rc-sais').checked, age55: g('rc-55').checked, apresEpuisement: g('rc-apres').checked });
    g('rc-out').innerHTML = (vol > 0 ? (r.ok ? wizAlert('ok', 'Conditions de rechargement réunies : le nouveau droit s’ouvre à la date d’épuisement du droit en cours, sans démarche de l’usager. Durée minimale : ' + r.dureeMin + ' jours calendaires. Un différé et un délai d’attente de 7 jours peuvent s’appliquer.') : r.motifs.map(m => wizAlert('warn', m)).join('') + '<p class="wiz-hint">Si le rechargement n’est pas possible, examiner l’ASS.</p>') : '<p class="wiz-hint">Saisissez le volume de travail pour vérifier le rechargement.</p>') +
      '<p class="wiz-hint">Seuil : ' + r.seuil + (g('rc-unite').value === 'hours' ? ' heures' : ' jours') + ' · fenêtre de ' + r.fenetre + ' mois · seules les périodes jamais utilisées comptent.</p>';
    const an = parseFloat(g('as-ans').value), has = g('as-ans').value !== '';
    const a = ftAssCheck({ anneesActivite: an || 0, recherche: g('as-rech').checked, ressources: parseFloat(g('as-res').value) || 0, couple: g('as-couple').checked });
    g('as-out').innerHTML = (has ? (a.ok ? wizAlert('ok', 'Conditions de l’ASS réunies sur ces éléments : allocation maximale de ' + fnum(a.aj) + ' € par jour (réduite selon les ressources), versée par périodes de 6 mois renouvelables.') : a.motifs.map(m => wizAlert('warn', m)).join('')) : '<p class="wiz-hint">Renseignez les années d’activité pour vérifier l’ASS.</p>') +
      '<p class="wiz-hint">Plafond mensuel : ' + fnum(a.plafond) + ' € (' + (g('as-couple').checked ? 'couple' : 'personne seule') + ', 1ᵉʳ avril 2026). Cumul avec une activité : 3 mois, puis arrêt de l’ASS si revenu.</p>';
  };

  /* Ma journée */
  addView('jour', head('Ma journée', 'Vos dossiers récents, vos favoris et un pense-bête, enregistrés uniquement sur cet ordinateur.', '<button type="button" class="reg-btn" onclick="ftOpenData()"><i data-lucide="database" class="w-4 h-4"></i>Mes données</button>') +
    '<div id="jr-body" class="dp-grid"></div>');
  window.ftOpenData = function () { if (typeof openDataModal === 'function') openDataModal(); };
  const todos = () => jget('ft_todos', []);
  window.ftTodoAdd = function () {
    const t = $('jr-todo-text').value.trim(); if (!t) return;
    const l = todos(); l.unshift({ id: Date.now(), t: t, d: $('jr-todo-date').value || '', done: false }); lsSet('ft_todos', JSON.stringify(l.slice(0, 60))); renderJour();
  };
  window.ftTodoToggle = function (id) { const l = todos(); const x = l.find(i => i.id === id); if (x) x.done = !x.done; lsSet('ft_todos', JSON.stringify(l)); renderJour(); };
  window.ftTodoDel = function (id) { lsSet('ft_todos', JSON.stringify(todos().filter(i => i.id !== id))); renderJour(); };
  function renderJour() {
    const body = $('jr-body'); if (!body) return;
    const today = new Date().toISOString().slice(0, 10);
    const l = todos().sort((a, b) => (a.done - b.done) || ((a.d || '9') < (b.d || '9') ? -1 : 1));
    const tl = l.map(i => '<li class="' + (i.done ? 'is-done' : '') + '"><label><input type="checkbox" ' + (i.done ? 'checked' : '') + ' onchange="ftTodoToggle(' + i.id + ')"> <span>' + esc(i.t) + '</span></label>' +
      (i.d ? '<em class="' + (!i.done && i.d < today ? 'is-late' : '') + '">' + esc(ftFmtDate(new Date(i.d + 'T12:00:00'))) + '</em>' : '') +
      '<button type="button" aria-label="Supprimer" onclick="ftTodoDel(' + i.id + ')">×</button></li>').join('');
    const dos = dossierHistory().slice(0, 6).map(d => '<li><strong>' + esc(d.ref) + '</strong><span>' + esc(d.verdict || '') + (d.are && d.are !== '—' ? ' · ' + esc(d.are) + ' / jour' : '') + '</span><em>' + esc(new Date(d.at).toLocaleDateString('fr-FR')) + '</em></li>').join('');
    const favs = templates.filter(t => favorites.includes(t.id)).slice(0, 8).map(t => '<li><button type="button" onclick="ftGoTpl(\'' + esc(t.id) + '\')">' + esc(t.shortTitle || t.title) + '</button></li>').join('');
    const rec = (typeof recentTemplates !== 'undefined' ? recentTemplates : []).map(id => templates.find(t => t.id === id)).filter(Boolean).slice(0, 6).map(t => '<li><button type="button" onclick="ftGoTpl(\'' + esc(t.id) + '\')">' + esc(t.shortTitle || t.title) + '</button></li>').join('');
    const last = lsGet('ft_last_export', '');
    const lastTxt = last ? 'il y a ' + Math.floor((Date.now() - new Date(last).getTime()) / 86400000) + ' jour(s)' : 'jamais effectuée';
    body.innerHTML =
      '<section class="dl-form"><h3 class="dl-h">Pense-bête</h3><div class="jr-add"><input id="jr-todo-text" type="text" placeholder="Rappeler l’usager, vérifier une pièce…" onkeydown="if(event.key===\'Enter\')ftTodoAdd()"><input id="jr-todo-date" type="date" aria-label="Échéance"><button type="button" class="reg-btn reg-btn-primary" onclick="ftTodoAdd()">Ajouter</button></div>' +
      (tl ? '<ul class="jr-list jr-todos">' + tl + '</ul>' : '<p class="wiz-hint">Rien de prévu. Ajoutez une tâche avec une échéance si besoin.</p>') + '</section>' +
      '<section class="dl-form"><h3 class="dl-h">Dossiers récents</h3>' + (dos ? '<ul class="jr-list">' + dos + '</ul>' : '<p class="wiz-hint">Les dossiers enregistrés depuis le Parcours dossier apparaissent ici.</p>') +
      '<button type="button" class="reg-btn" onclick="switchNavTab(\'dossier\')">Nouveau dossier</button></section>' +
      '<section class="dl-form"><h3 class="dl-h">Modèles favoris</h3>' + (favs ? '<ul class="jr-list jr-links">' + favs + '</ul>' : '<p class="wiz-hint">Aucun favori.</p>') +
      '<h3 class="dl-h">Derniers modèles utilisés</h3>' + (rec ? '<ul class="jr-list jr-links">' + rec + '</ul>' : '<p class="wiz-hint">Aucun modèle consulté.</p>') + '</section>' +
      '<section class="dl-form"><h3 class="dl-h">État de l’outil</h3><ul class="jr-list"><li><strong>Dernière sauvegarde</strong><span>' + lastTxt + '</span></li><li><strong>Barèmes vérifiés le</strong><span>' + esc(BAREME.verifie) + '</span></li></ul>' +
      '<button type="button" class="reg-btn" onclick="ftExportData()">Sauvegarder maintenant</button></section>';
    refreshIcons();
  }
  window.ftGoTpl = function (id) { switchNavTab('cvm'); selectCategory('all'); selectTemplate(id); };

  /* Glossaire */
  const GLOSS = window.FT_GLOSS = [
    ['ARE', 'Allocation d’aide au retour à l’emploi', 'Allocation versée par France Travail aux demandeurs d’emploi qui remplissent les conditions d’affiliation.'],
    ['SJR', 'Salaire journalier de référence', 'Base de calcul de l’allocation journalière, établie à partir des salaires de la période de référence.'],
    ['PRA', 'Période de référence d’affiliation', 'Période précédant la fin de contrat où l’on recherche l’activité : 24 mois, ou 36 mois à partir de 55 ans.'],
    ['AJ', 'Allocation journalière', 'Montant brut de l’ARE pour un jour, calculé à partir du SJR.'],
    ['ARCE', 'Aide à la reprise ou à la création d’entreprise', 'Aide versée en capital à un allocataire qui crée ou reprend une entreprise ; voir le simulateur ANS pour la comparaison avec le maintien des allocations.'],
    ['CFD', 'Complément de fin de droits', 'Complément visant à compenser le coefficient de 0,75 appliqué à la durée d’indemnisation ; voir la page CFD.'],
    ['IPR', 'Instance paritaire régionale', 'Instance qui examine la situation des demandeurs d’emploi ayant démissionné, au vu de leur projet de reclassement.'],
    ['ASP', 'Allocation de sécurisation professionnelle', 'Allocation versée pendant le contrat de sécurisation professionnelle (CSP).'],
    ['CSP', 'Contrat de sécurisation professionnelle', 'Dispositif proposé aux salariés licenciés pour motif économique.'],
    ['IDR', 'Indemnité différentielle de reclassement', 'Indemnité compensant une éventuelle perte de salaire en cas de reprise d’emploi pendant le CSP.'],
    ['ASS', 'Allocation de solidarité spécifique', 'Allocation de fin de droits sous conditions d’activité passée et de ressources ; voir « Droits & passages ».'],
    ['ICCP', 'Indemnité compensatrice de congés payés', 'Somme versée à la fin du contrat pour les congés non pris ; elle crée un différé avant le premier versement.'],
    ['CIBTP', 'Caisse des congés intempéries du BTP', 'Organisme dont l’attestation sert au calcul du différé pour les salariés du bâtiment ; voir la page ICCP.'],
    ['Différé spécifique', '', 'Délai avant le premier versement lié aux indemnités supra-légales de rupture.'],
    ['Délai d’attente', '', 'Délai de 7 jours appliqué avant le premier versement.'],
    ['FCT', 'Fin de contrat de travail', 'Date de rupture du dernier contrat, point de départ de nombreux calculs.'],
    ['Rechargement', '', 'Ouverture d’un nouveau droit à l’épuisement du droit en cours, si les conditions de travail sont remplies.'],
    ['Reliquat', '', 'Jours d’indemnisation non consommés d’un droit initial.'],
    ['RCI', 'Rupture conventionnelle individuelle', 'Mode de rupture d’un commun accord, avec durée maximale d’indemnisation réduite à partir du 01/09/2026.']
  ];
  addView('glossaire', head('Glossaire', 'Les sigles utilisés dans l’outil et dans les modèles de mails.') +
    '<div class="gl-search"><input id="gl-q" type="search" placeholder="Rechercher un sigle ou un mot" oninput="ftGlossRender()" aria-label="Rechercher dans le glossaire"></div><dl id="gl-list" class="gl-list"></dl>');
  window.ftGlossRender = function () {
    const q = (($('gl-q') || {}).value || '').toLowerCase();
    $('gl-list').innerHTML = GLOSS.filter(g => !q || (g.join(' ')).toLowerCase().indexOf(q) > -1).map(g =>
      '<div class="gl-item"><dt>' + esc(g[0]) + (g[1] ? '<span>' + esc(g[1]) + '</span>' : '') + '</dt><dd>' + esc(g[2]) + '</dd></div>').join('') || '<p class="wiz-hint">Aucun résultat.</p>';
  };

  /* Navigation : brancher les nouvelles vues sur switchNavTab */
  const _sw = switchNavTab;
  switchNavTab = function (t) {
    _sw(t);
    const ids = ['droits', 'jour', 'glossaire'];
    ids.forEach(i => { const v = $('view-' + i); if (v) v.classList.toggle('hidden', String(t) !== i); });
    if (ids.indexOf(String(t)) > -1) {
      const cfg = NAV_TABS_CONFIG.find(x => x.id === t), n = $('header-active-tab-name'); if (n && cfg) n.textContent = cfg.name;
      if (t === 'droits') ftDroitsRun(); else if (t === 'jour') renderJour(); else ftGlossRender();
      refreshIcons();
    }
  };
  /* Si la page ouverte au dernier lancement était une nouvelle vue */
  setTimeout(() => { if (['droits', 'jour', 'glossaire'].indexOf(String(activeNavTab)) > -1) switchNavTab(activeNavTab); }, 0);
})();


/* ================= Extension 11 : règles et calculs par thématique ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const fn = n => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  const pc = n => fn(n * 100) + ' %';
  const B = () => BAREME;

  // Chaque thème : règles (texte) et calculs ([libellé, formule, exemple chiffré optionnel])
  function themes() {
    const b = B(), ex = ftAreJour(78.89).aj, ex2 = ftComputeDates({ fct: new Date('2026-10-15T12:00:00'), sjr: 78.89, cp: 1500, supra: 5000, ageBand: 'u55' });
    const cm = cumulCompute({ aj: 57, brut: 2100, sjr: 100, mois: '2026-11' });
    return [
      { id: 'admission', tab: '1', title: 'Admission : conditions et calcul de l’ARE', icon: 'clipboard-check',
        rules: [
          'Affiliation : ' + b.affiliation.jours + ' jours ou ' + b.affiliation.heures + ' heures travaillés (saisonniers : ' + b.affiliation.joursSais + ' jours ou ' + b.affiliation.heuresSais + ' heures), sur 24 mois précédant la fin de contrat, 36 mois à partir de 55 ans.',
          'Privation involontaire d’emploi (la démission relève de la thématique Démission).',
          'Inscription comme demandeur d’emploi dans les 12 mois suivant la fin de contrat, recherche active d’emploi, résidence en France, aptitude physique.',
          'Pas de retraite à taux plein.'],
        calc: [
          ['SJR (salaire journalier de référence)', 'salaire de référence ÷ jours retenus au dénominateur', ''],
          ['Allocation journalière (AJ)', 'le plus élevé de : ' + pc(b.are.tauxA) + ' × SJR + ' + fn(b.are.partieFixe) + ' € ; ' + pc(b.are.tauxB) + ' × SJR ; ' + fn(b.are.min) + ' € (minimum)', 'SJR 78,89 € → AJ ' + fn(ex) + ' €'],
          ['Limites', 'AJ ≤ ' + pc(b.are.plafond) + ' du SJR et ≤ ' + fn(b.are.max) + ' € par jour', ''],
          ['Durée d’indemnisation', 'min(durée maximale ; max(' + b.duree.min + ' j ; jours de la période d’emploi × ' + fn(b.duree.coef) + '))', 'Maximum : ' + b.duree.max.u55 + ' j (< 55 ans), ' + b.duree.max.a55 + ' j (55-56 ans), ' + b.duree.max.a57 + ' j (57 ans et +)'],
          ['Dégressivité', 'AJ × ' + fn(b.degr.coef) + ' à partir du ' + b.degr.moisDebut + 'ᵉ mois, si âge < ' + b.degr.ageLimite + ' ans et AJ > ' + fn(b.degr.seuil) + ' €', ''],
          ['Différé congés payés', 'ICCP ÷ SJR, plafonné à ' + b.differe.cpMax + ' jours', '1 500 € ÷ 78,89 € = ' + ex2.diffCp + ' j'],
          ['Différé spécifique', 'indemnités supra-légales ÷ ' + fn(b.differe.diviseur) + ', plafonné à ' + b.differe.specMax + ' jours (' + b.differe.specMaxEco + ' jours si licenciement économique)', '5 000 € ÷ ' + fn(b.differe.diviseur) + ' = ' + ex2.diffSpec + ' j'],
          ['Délai d’attente', b.differe.attente + ' jours (non appliqué s’il l’a déjà été dans les 12 derniers mois)', ''],
          ['Premier jour indemnisable', 'fin de contrat + 1 jour + différés + délai d’attente', ex2.total + ' jours de différés, premier jour le ' + ftFmtDate(ex2.debut)],
          ['Fin de droits', 'premier jour indemnisable + durée − 1 jour', '']
        ] },
      { id: 'demission', tab: '2', title: 'Démission : examen des droits', icon: 'scale',
        rules: [
          'Une démission légitime (liste de motifs de l’outil) est assimilée à une perte involontaire d’emploi : les règles d’admission s’appliquent.',
          'Démission non légitime : pas d’ouverture de droit immédiate. Un nouvel examen est possible après 65 jours (ou 455 heures) travaillés depuis la démission.',
          'Autre voie : réexamen par l’instance paritaire régionale après 121 jours de chômage, au vu des démarches de reclassement.',
          'Les montants se calculent ensuite comme pour une admission (voir « Admission »).'],
        calc: [['Seuil de réexamen', '65 jours ou 455 heures travaillés depuis la démission', ''], ['Réexamen en instance paritaire', 'après 121 jours de chômage', '']] },
      { id: 'ans', tab: '3', title: 'Création d’entreprise : ARCE ou maintien de l’ARE', icon: 'calculator',
        rules: [
          'ARCE : capital versé en deux fois, égal à ' + pc(b.cumul.arce) + ' du capital d’ARE restant.',
          'Maintien : l’ARE continue d’être versée avec déduction d’une partie des revenus, et les jours non payés sont reportés.',
          'Pièces à fournir selon le cas : numéro SIRET, accord ACRE ; pour un dirigeant de société, procès-verbal fixant l’absence de rémunération.'],
        calc: [
          ['Capital ARE restant', 'AJ × nombre de jours restants au droit', ''],
          ['ARCE', pc(b.cumul.arce) + ' × capital restant, en 2 versements de 50 % (soit 30 % + 30 % du capital)', 'AJ 45 € × 500 j = 22 500 € → ARCE 13 500 € (2 × 6 750 €)'],
          ['Maintien (écran de l’outil)', 'recettes × 50 % (abattement unique) = revenu retenu ; jours payés = (AJ × 30 − 70 % × revenu retenu) ÷ AJ, arrondi ; ARE versée = jours payés × AJ (mensualisation : 30 jours quel que soit le mois). Cet écran n’applique pas les abattements par nature d’activité (71 % / 50 % / 34 %) ni le plafond de 60 % : utiliser la rubrique Cumul CNS.', ''],
          ['Jours payés / reportés', 'jours payés = ARE versée ÷ AJ (maximum 30) ; jours reportés = 30 − jours payés', '']] },
      { id: 'csp', tab: '4', title: 'CSP : allocation de sécurisation professionnelle', icon: 'shield',
        rules: [
          'Ancienneté d’au moins 1 an : ASP à ' + pc(b.csp.taux) + ' du salaire journalier de référence.',
          'Moins d’1 an d’ancienneté : allocation au niveau de l’ARE.',
          'Reclassement (reprise d’emploi pendant le CSP) : contrat de reprise en CDI, ou CDD / intérim d’au moins 6 mois ; ancienneté d’au moins 1 an.',
          'Prime de reclassement : reprise au plus tard au ' + b.csp.primeMois + 'ᵉ mois. Indemnité différentielle de reclassement (IDR) : reprise au plus tard au ' + b.csp.idrMois + 'ᵉ mois, avec perte de salaire.'],
        calc: [
          ['SJR du CSP', 'salaire brut mensuel ÷ 30 (reclassement) ou ÷ 30,42 (comparaison ASP / ARE)', ''],
          ['ASP journalière', 'max(' + pc(b.csp.taux) + ' × SJR ; AJ de l’ARE ; ' + fn(b.csp.aspMin) + ' €), plafonnée à ' + fn(b.are.max) + ' €', 'Salaire 3 000 € → ASP 2 218,94 € / mois'],
          ['ASP mensuelle', 'ASP journalière × 30', ''],
          ['Reliquat d’ASP', 'ASP mensuelle × (' + b.csp.idrMois + ' − mois de reprise)', ''],
          ['Prime de reclassement', '50 % du reliquat d’ASP, versée en 2 fois', ''],
          ['IDR', 'min(' + pc(b.csp.plafond) + ' × reliquat d’ASP ; perte mensuelle de salaire × ' + b.csp.idrMois + ')', 'Perte = salaire antérieur − nouveau salaire']] },
      { id: 'cumul', tab: '5', title: 'Cumul ARE et salaire', icon: 'trending-up',
        rules: [
          'Le salaire est cumulable avec l’ARE : ' + pc(b.cumul.remun) + ' du brut est déduit de l’allocation mensuelle.',
          'Le total (salaire + allocation) ne peut pas dépasser le salaire de référence mensuel (SJR × 30,42).',
          'Les jours non indemnisés sont reportés : ils prolongent la fin des droits.'],
        calc: [
          ['Allocation du mois', 'AJ × 30 jours (mensualisation)', 'AJ 57 € × 30 j = 1 710 €'],
          ['Part déduite', pc(b.cumul.remun) + ' × salaire brut', '70 % × 2 100 € = 1 470 €'],
          ['Jours indemnisés', '(allocation du mois − part déduite) ÷ AJ, arrondi, entre 0 et 30', '(1 710 − 1 470) ÷ 57 = ' + cm.j + ' j'],
          ['Complément versé', 'jours indemnisés × AJ', cm.j + ' × 57 = ' + fn(cm.complement) + ' €'],
          ['Contrôle du plafond', 'salaire brut + complément ≤ SJR × 30,42 ; sinon retrait de jours', ''],
          ['Jours reportés', '30 jours − jours indemnisés', cm.reportes + ' j']] },
      { id: 'indus', tab: '6', title: 'Indus : échéancier', icon: 'receipt',
        rules: ['L’échéancier se calcule soit sur une durée en mois, soit sur une mensualité cible.', 'Plusieurs créances peuvent être additionnées.'],
        calc: [
          ['Mode durée', 'mensualité = montant total ÷ nombre de mois, tronquée au centime ; dernière échéance = solde', '1 000 € sur 3 mois : 333,33 € × 2 + 333,34 €'],
          ['Mode mensualité', 'mensualités complètes = partie entière (total ÷ mensualité) ; solde = total − mensualités × complètes', '1 000 € à 300 € : 3 × 300 € + 100 €'],
          ['Total remboursé', 'somme des échéances = montant total', '']] },
      { id: 'iccp', tab: '7', title: 'ICCP et attestation CIBTP (BTP)', icon: 'calendar-clock',
        rules: ['Les congés payés versés à la fin du contrat retardent le premier versement (différé).', 'Salariés du BTP : calcul à partir de l’attestation de la caisse de congés.', 'Plafond du différé : ' + b.differe.cpMax + ' jours.'],
        calc: [
          ['Jours ouvrables acquis', 'nombre de jours du 01/04 à la fin de contrat (inclus) × 2,5 ÷ 30,42, arrondi à l’entier supérieur', '198 j × 2,5 ÷ 30,42 = 16,27 → 17'],
          ['Total jours ouvrables', 'jours restants + jours acquis (+ jours payés si paiement après la fin de contrat)', '10 + 17 = 27'],
          ['Jours calendaires', 'total × 7 ÷ 6, tronqué à l’entier', '27 × 7 ÷ 6 = 31,5 → 31'],
          ['Différé appliqué', 'min(' + b.differe.cpMax + ' ; jours calendaires)', 'min(30 ; 31) = 30']] },
      { id: 'retraite', tab: '8', title: 'Retraite : maintien de l’ARE (art. 9 § 3)', icon: 'landmark',
        rules: [
          'Cinq conditions cumulatives : âge légal de départ atteint ; indemnisé depuis au moins 365 jours ; 12 années d’affiliation ; au moins 100 trimestres validés ; 1 an continu ou 2 ans discontinus d’emploi dans les 5 ans avant la fin de contrat.',
          'Le maintien permet de continuer à percevoir l’ARE jusqu’au nombre de trimestres exigé pour le taux plein.'],
        calc: [['Trimestres manquants', 'trimestres requis (selon la génération) − trimestres validés', '170 − 158 = 12'], ['Années manquantes', 'trimestres manquants ÷ 4', '12 ÷ 4 = 3 ans'],
          ['Barème par génération', b.generations.map(g => g[0] + ' : ' + g[1] + ' trim. / ' + g[2]).join(' ; '), '']] },
      { id: 'rci', tab: '9', title: 'Rupture conventionnelle (réforme du 01/09/2026)', icon: 'handshake',
        rules: [
          'Seule la date effective de fin de contrat détermine l’application de la réforme ; la date de signature est sans effet.',
          'Fin de contrat à compter du 01/09/2026 : durée maximale de ' + b.duree.rci.u55 + ' jours (15 mois) avant 55 ans et ' + b.duree.rci.a55 + ' jours (20,5 mois) à 55 ans et plus.',
          'Fin de contrat avant le 01/09/2026 : durée maximale habituelle (' + b.duree.max.u55 + ' jours avant 55 ans).',
          'Rupture conventionnelle collective : hors réforme.'],
        calc: [['Durée maximale', 'selon la date de fin de contrat et l’âge (ci-dessus)', ''], ['Différés', 'mêmes formules que pour l’admission (supra-légal ÷ ' + fn(b.differe.diviseur) + ', plafond ' + b.differe.specMax + ' j)', '']] },
      { id: 'cfd', tab: 'cfd', title: 'CFD : complément de fin de droits', icon: 'hourglass',
        rules: ['Le coefficient ' + fn(b.duree.coef) + ' réduit la durée d’indemnisation de 25 % ; le CFD compense cette réduction lorsque la conjoncture est dégradée.', 'Conditions, conjoncture et cas particuliers : voir les onglets de la page CFD.'],
        calc: [['Durée notifiée', 'durée théorique × ' + fn(b.duree.coef), '730 × 0,75 = 548 j'], ['CFD', 'durée théorique − durée notifiée, plafonné à 182 jours', '730 − 548 = 182 j']] },
      { id: 'delais', tab: 'delais', title: 'Délais et échéances', icon: 'calendar-days',
        rules: ['Inscription au plus tard 12 mois après la fin de contrat (forclusion).', 'Le premier jour indemnisable tient compte des différés et du délai d’attente.'],
        calc: [
          ['Différé congés payés', 'ICCP ÷ SJR, plafonné à ' + b.differe.cpMax + ' jours', ''],
          ['Différé spécifique', 'supra-légal ÷ ' + fn(b.differe.diviseur) + ', plafonné à ' + b.differe.specMax + ' jours (' + b.differe.specMaxEco + ' en motif économique)', ''],
          ['Délai d’attente', b.differe.attente + ' jours', ''],
          ['Premier jour indemnisable', 'fin de contrat + 1 + total des différés', ''],
          ['Date limite d’inscription', 'fin de contrat + 365 jours', '']] },
      { id: 'droits', tab: 'droits', title: 'Rechargement, ASS et prestations', icon: 'repeat',
        rules: ['Rechargement : ' + b.affiliation.jours + ' jours ou ' + b.affiliation.heures + ' heures travaillés depuis la dernière ouverture de droits (saisonniers : ' + b.affiliation.joursSais + ' jours ou ' + b.affiliation.heuresSais + ' heures), emplois terminés avant l’épuisement du droit initial.',
          'ASS : 5 ans d’activité salariée sur les 10 ans précédant la fin de contrat, recherche d’emploi, ressources sous plafond (1 363,60 € seul, 2 142,80 € en couple, au 01/04/2026).'],
        calc: [['Nouveau droit après rechargement', 'au moins 182 jours calendaires (152 jours pour les saisonniers)', ''], ['ASS journalière maximale', fn(b.solidarite.ass) + ' € (au ' + b.solidarite.effet + ')', '']] }
    ];
  }

  function themeHtml(t) {
    const rules = '<ul class="rg-rules">' + t.rules.map(r => '<li>' + escapeHtml(r) + '</li>').join('') + '</ul>';
    const calc = '<div class="rg-calc">' + t.calc.map(c => '<div class="rg-row"><div class="rg-k">' + escapeHtml(c[0]) + '</div><div class="rg-f">' + escapeHtml(c[1]) + '</div>' + (c[2] ? '<div class="rg-e">Exemple : ' + escapeHtml(c[2]) + '</div>' : '') + '</div>').join('') + '</div>';
    return '<h4 class="wiz-h">Règles</h4>' + rules + '<h4 class="wiz-h">Règles de calcul</h4>' + calc;
  }
  const foot = () => '<p class="wiz-hint">Paramètres du barème vérifiés le ' + escapeHtml(BAREME.verifie) + '. Ces règles reprennent les formules de l’outil : à confirmer sur unedic.org avant toute décision.</p>';

  // Onglet « Règles et calculs » intégré à chaque thématique
  const MAP = [['od', 'admission'], ['dossier', 'admission'], ['demission', 'demission'], ['ans', 'ans'], ['csp', 'csp'], ['complement-are', 'cumul'], ['indus', 'indus'], ['iccp', 'iccp'], ['retraite', 'retraite'], ['rci', 'rci'], ['cfd', 'cfd'], ['delais', 'delais'], ['droits', 'droits']];
  MAP.forEach(m => {
    const view = $('view-' + m[0]); if (!view) return;
    const box = view.querySelector(':scope > .reg-wrap') || view;
    const bar = document.createElement('div');
    bar.className = 'rg-tabs'; bar.setAttribute('role', 'tablist');
    bar.innerHTML = '<button type="button" role="tab" class="rg-tab is-on" data-m="sim">Simulateur</button><button type="button" role="tab" class="rg-tab" data-m="rules">Règles et calculs</button>';
    const panel = document.createElement('div'); panel.className = 'rg-panel'; panel.hidden = true;
    box.insertBefore(panel, box.firstChild); box.insertBefore(bar, box.firstChild);
    const set = mode => {
      const on = mode === 'rules';
      bar.querySelectorAll('.rg-tab').forEach(b => { const a = b.dataset.m === mode; b.classList.toggle('is-on', a); b.setAttribute('aria-selected', a ? 'true' : 'false'); });
      [...box.children].forEach(c => { if (c !== bar && c !== panel) c.classList.toggle('rg-hide', on); });
      panel.hidden = !on;
      if (on) {
        const t = themes().find(x => x.id === m[1]);
        panel.innerHTML = '<h3 class="rg-title">' + escapeHtml(t.title) + '</h3>' + themeHtml(t) + foot() +
          '<div class="wiz-actions"><button type="button" class="reg-btn" data-copy="1">Copier ces règles</button></div>';
        panel.querySelector('[data-copy]').onclick = () => {
          const txt = t.title + '\n\nRègles\n' + t.rules.map(r => '- ' + r).join('\n') + '\n\nRègles de calcul\n' + t.calc.map(c => '- ' + c[0] + ' : ' + c[1] + (c[2] ? ' (exemple : ' + c[2] + ')' : '')).join('\n') + '\n\nBarème vérifié le ' + BAREME.verifie;
          copyToClipboard(txt); showToast('Règles copiées', 'success');
        };
      }
    };
    bar.querySelectorAll('.rg-tab').forEach(b => b.onclick = () => set(b.dataset.m));
  });

  const _sw2 = switchNavTab;
  switchNavTab = function (t) {
    _sw2(t);
    const mc = $('model-count-badge'); if (mc) mc.textContent = templates.length + ' modèles prêts';
  };
})();


/* ================= Extension 12 : rubrique Cumul CNS (cumul ARE et activité non salariée) ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(String(s == null ? '' : s));
  const fn = n => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
  const eur = n => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  /* Valeurs tenues dans BAREME.cns (lues à chaque calcul, donc à jour après une mise à jour validée) */
  const CNS = new Proxy({ debutPlafond: '2025-04-01' }, { get: (t, k) => (k in t ? t[k] : BAREME.cns[k]) });

  /* Calcul pur (testé par les cas de contrôle) */
  function cnsCompute(p) {
    const aj = +p.aj || 0, jm = +p.jm || 30, ca = +p.revenu || 0;
    let abat = 0;
    if (p.type === 'vente') abat = ca * CNS.abat.vente;
    else if (p.type === 'bic') abat = ca * CNS.abat.bic;
    else if (p.type === 'bnc') abat = Math.min(ca, Math.max(ca * CNS.abat.bnc, CNS.bncMin));
    const retenu = Math.max(0, ca - abat);
    const areM = aj * jm, deduit = CNS.deduc * retenu;
    const jRaw = aj > 0 ? (areM - deduit) / aj : 0;
    const J = Math.max(0, Math.min(jm, Math.round(jRaw)));
    const out = { aj: aj, jm: jm, abat: abat, retenu: retenu, areM: areM, deduit: deduit, jRaw: jRaw, J: J, jours: J, provisoireJ: Math.floor(J * CNS.avance), complement: 0, mode: p.mode || 'justifie', plafondJours: null, restantJours: null, plafonne: false };
    if (out.mode === 'avance') out.jours = out.provisoireJ;
    if (out.mode === 'inconnu') { out.jours = 0; out.provisoireMontant = CNS.provisoire * areM; }
    if (p.plafondActif && +p.reliquat > 0 && out.mode !== 'inconnu') {
      out.plafondJours = CNS.plafond * (+p.reliquat);
      out.restantJours = Math.max(0, out.plafondJours - (+p.conso || 0));
      const lim = Math.floor(out.restantJours + 1e-9);
      if (out.jours > lim) { out.jours = lim; out.plafonne = true; }
    }
    out.complement = out.mode === 'inconnu' ? out.provisoireMontant : out.jours * aj;
    out.total = retenu + out.complement;
    out.reportes = out.mode === 'inconnu' ? null : jm - out.jours;
    return out;
  }
  window.cnsCompute = cnsCompute;
  [
    { n: 'Cumul CNS : exemple Unédic (ARE 960 €, revenus 600 €), jours J', run: () => cnsCompute({ aj: 32, jm: 30, type: 'assurances', revenu: 600 }).J, exp: 17, d: 0 },
    { n: 'Cumul CNS : jours provisoires (J × 0,8)', run: () => cnsCompute({ aj: 32, jm: 30, type: 'assurances', revenu: 600, mode: 'avance' }).jours, exp: 13, d: 0 },
    { n: 'Cumul CNS : avance versée (13 jours × 32 €)', run: () => cnsCompute({ aj: 32, jm: 30, type: 'assurances', revenu: 600, mode: 'avance' }).complement, exp: 416, d: 2 },
    { n: 'Cumul CNS : revenus inconnus, 70 % de l’ARE mensuelle', run: () => cnsCompute({ aj: 32, jm: 30, type: 'assurances', revenu: 0, mode: 'inconnu' }).complement, exp: 672, d: 2 },
    { n: 'Cumul CNS : micro-entrepreneur vente, CA 1 000 € (abattement 71 %)', run: () => cnsCompute({ aj: 32, jm: 30, type: 'vente', revenu: 1000 }).retenu, exp: 290, d: 2 },
    { n: 'Cumul CNS : micro-entrepreneur BIC services, CA 1 000 € (abattement 50 %)', run: () => cnsCompute({ aj: 32, jm: 30, type: 'bic', revenu: 1000 }).retenu, exp: 500, d: 2 },
    { n: 'Cumul CNS : BNC, CA 500 € (abattement minimum 305 €)', run: () => cnsCompute({ aj: 32, jm: 30, type: 'bnc', revenu: 500 }).retenu, exp: 195, d: 2 },
    { n: 'Cumul CNS : plafond de 60 % du reliquat (100 j, 50 j consommés), jours restants', run: () => cnsCompute({ aj: 32, jm: 30, type: 'assurances', revenu: 0, plafondActif: true, reliquat: 100, conso: 50 }).restantJours, exp: 10, d: 0 }
  ].forEach(c => FT_CASES.push(c));

  /* Contenu */
  const SRC = [
    ['Unédic : cumul ARE-rémunération', 'https://www.unedic.org/la-reglementation/fiches-thematiques/cumul-allocation-salaire'],
    ['France Travail : je retrouve un emploi (activité non salariée)', 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/a-chaque-situation-son-allocatio/quelle-est-ma-situation-professi/je-reprends-une-activite-ou-une/je-retrouve-un-emploi.html'],
    ['France Travail : comment contester une décision', 'https://www.francetravail.fr/candidat/vos-droits-et-demarches/reclamations/comment-contester-une-decision-d.html'],
    ['France Travail : recours', 'https://www.francetravail.fr/faq/candidat/mes-echanges-avec-france-travail/reclamations-et-droit-a-lerreur/recours-france-travail.html'],
    ['Unédic : délai de contestation d’un indu (décret 2016-1592)', 'https://www.unedic.org/espace-presse/actualites/indus-un-decret-fixe-deux-mois-le-delai-de-contestation-devant-pole-emploi']
  ];
  const li = a => '<ul class="rg-rules">' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';
  const rows = a => '<div class="rg-calc">' + a.map(c => '<div class="rg-row"><div class="rg-k">' + esc(c[0]) + '</div><div class="rg-f">' + esc(c[1]) + '</div>' + (c[2] ? '<div class="rg-e">Exemple : ' + esc(c[2]) + '</div>' : '') + '</div>').join('') + '</div>';
  const h = t => '<h4 class="wiz-h">' + t + '</h4>';
  const note = t => '<p class="wiz-hint">' + t + '</p>';

  function tabRegles() {
    return h('Principe') + li([
      'Une personne qui crée ou reprend une entreprise en étant indemnisée peut cumuler une partie de l’ARE avec les revenus de cette activité, quel que soit son niveau de rémunération, y compris sans ACRE.',
      'Le cumul est plafonné à ' + fn(CNS.plafond * 100) + ' % des droits restants à la date de création ou de reprise (fin de contrat retenue au 01/04/2025 ou après, sauf procédure de licenciement engagée avant cette date). Les 40 % restants peuvent être demandés à l’instance paritaire régionale (IPR).',
      'Le cumul est incompatible avec l’ARCE : l’allocataire choisit l’une ou l’autre.',
      'L’activité non salariée ne donne pas lieu à une ouverture de droits.',
      'La date de fin de droits est repoussée en fonction du complément versé : les jours non payés sont reportés.',
      'Le cumul se poursuit tant qu’il reste des droits, que la personne reste inscrite et que le délai de déchéance n’est pas atteint.']) +
      h('Règles de calcul') + rows([
        ['Jours indemnisés (J)', 'J = [ARE mensuelle − (revenus déclarés aux assurances sociales × ' + fn(CNS.deduc) + ')] ÷ allocation journalière', 'Unédic : ARE 960 €, revenus 600 €, AJ 32 € → J = 16,87, soit 17 jours'],
        ['Micro-entrepreneur', 'J = [ARE mensuelle − ((CA − abattement pour frais) × ' + fn(CNS.deduc) + ')] ÷ allocation journalière', ''],
        ['Abattement : achat-revente, fourniture de logement', fn(CNS.abat.vente * 100) + ' % du CA', 'CA 1 000 € → revenu retenu 290 €'],
        ['Abattement : autres activités BIC', fn(CNS.abat.bic * 100) + ' % du CA', 'CA 1 000 € → revenu retenu 500 €'],
        ['Abattement : BNC', fn(CNS.abat.bnc * 100) + ' % du CA, minimum ' + fn(CNS.bncMin) + ' €', 'CA 500 € → abattement 305 € → revenu retenu 195 €'],
        ['Revenus déclarés, justificatifs non transmis', 'avance = J × ' + fn(CNS.avance) + ' jours, le complément est versé après justificatifs', 'J = 17 → 13 jours (416 €) ; 4 jours (128 €) après justificatifs'],
        ['Revenus inconnus', 'paiement provisoire = ' + fn(CNS.provisoire * 100) + ' % de l’ARE mensuelle, régularisé chaque année sur les justificatifs (ex. déclarations Urssaf)', '960 € × 0,70 = 672 €'],
        ['Plafond', 'jours payés en cumul ≤ ' + fn(CNS.plafond * 100) + ' % du reliquat à la création ou reprise', 'Reliquat 100 j → 60 j maximum'],
        ['Fin des droits', 'repoussée du nombre de jours non payés (reportés)', '']
      ]) +
      note('Les revenus sont pris en compte lors de l’actualisation mensuelle. Une fois le plafond de 60 % atteint, aucune régularisation n’est opérée et les paiements provisoires ne sont pas remis en cause (Unédic).') +
      h('Points non précisés par les sources consultées') + li([
        'Régime des dirigeants de société (gérant, président) : à vérifier dans le règlement d’assurance chômage.',
        'Définition du « salaire mensuel de référence » pour un non-salarié.',
        'Conditions détaillées de la reprise des 40 % après cessation ou mise en sommeil de l’activité.',
        'Nombre de jours retenu pour l’ARE mensuelle : 30 jours quel que soit le mois (mensualisation). Net : retraite complémentaire 3 % du SJR retenue ; CSG et CRDS selon un seuil mensuel de 61 € × 30 j à confirmer.']);
  }

  function tabDemarches() {
    return h('Pour l’usager') + li([
      'Déclarer chaque mois son activité non salariée lors de l’actualisation, entre le 28 et le 15 du mois suivant.',
      'Transmettre les justificatifs de revenus : lorsque les revenus sont connus, avant la fin du mois suivant. Sans justificatif, le versement peut être suspendu.',
      'Revenus inconnus lors de l’actualisation : un paiement provisoire est versé, puis régularisé une fois les revenus réels connus.',
      'Consulter le nombre de jours restants sur la page d’accueil de l’espace personnel.',
      'Plafond de 60 % atteint : demander à l’IPR une poursuite exceptionnelle (justifier la poursuite effective de l’activité et attester l’absence de revenus d’activité, dividendes compris, depuis la création ou la reprise).']) +
      h('Pour l’agent : vérifications dans le dossier') + li([
        'Date de fin de contrat retenue : le plafond de 60 % s’applique à partir du 01/04/2025 (sauf procédure de licenciement antérieure).',
        'Reliquat de droits à la date de création ou de reprise, puis suivi des jours consommés en cumul.',
        'Type d’activité (achat-revente, BIC, BNC) pour appliquer le bon abattement ; dirigeant de société : voir la réglementation.',
        'ARCE demandée ou déjà perçue : incompatible avec le cumul.',
        'Justificatifs reçus ou non : avance (J × 0,8), paiement provisoire (70 % de l’ARE) ou paiement complet.',
        'Cessation ou mise en sommeil : examiner la reprise des 40 % restants.']);
  }

  function tabRecours() {
    return h('Voies de recours') + rows([
      ['1. Réclamation', 'À déposer auprès de l’agence France Travail, de préférence depuis l’espace personnel (« Mes échanges et documents », « Mes réclamations »), ou par courrier à l’agence. Conserver un écrit de la réclamation.', ''],
      ['2. Médiation', 'Si la réponse ne satisfait pas : saisir le médiateur régional de France Travail. Médiation préalable obligatoire avant le juge administratif pour notamment les sanctions, cessations d’inscription, transferts de catégorie, certaines allocations (dont l’ASS) et les demandes de remboursement de prestations versées en trop.', ''],
      ['3. Tribunal', 'Tribunal judiciaire ou administratif selon le type de décision. Les délais sont ceux de la notification émise par France Travail (courrier dans l’espace personnel, « Mes courriers reçus »).', ''],
      ['Poursuite exceptionnelle (IPR)', 'Plafond de 60 % atteint : demande auprès de l’instance paritaire régionale pour obtenir les 40 % de droits restants, avec les justifications citées dans « Démarches ».', ''],
      ['Indu consécutif à une régularisation', 'Recours gracieux préalable dans un délai de 2 mois à compter de la notification de l’indu, adressé au directeur général (décret n° 2016-1592, publié au Journal officiel du 26/11/2016). Source ancienne : vérifier le texte en vigueur.', '']
    ]) + note('Aucune des pages consultées ne chiffre le délai de saisine du médiateur ou du tribunal : se reporter à la notification de la décision.');
  }
  const CATS = ['Créateurs d\'entreprise', 'Modification AE', 'Complément ARE', 'Trop-perçu', 'Recours IPR'];
  function cvmLinks() {
    return CATS.map(c => {
      const l = templates.filter(t => t.category === c);
      if (!l.length) return '';
      return '<div class="cns-cat"><strong>' + esc(c) + '</strong><div class="cns-links">' + l.map(t => '<button type="button" onclick="ftGoTpl(\'' + esc(t.id) + '\')">' + esc(t.shortTitle || t.title) + '</button>').join('') + '</div></div>';
    }).join('');
  }
  function tabSources() {
    return h('Sources consultées le 27/10/2026') + '<div class="wiz-links">' + SRC.map(s => '<a href="' + s[1] + '" target="_blank" rel="noopener noreferrer">' + esc(s[0]) + '</a>').join('') + '</div>' +
      note('Les règles ci-dessus reprennent ces pages. Elles doivent être confirmées dans le règlement général annexé avant toute décision individuelle.');
  }
  function tabSim() {
    const d = new Date(), ym = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    return '<div class="dl-layout"><section class="dl-form"><h3 class="dl-h">Situation</h3>' +
      '<label>Allocation journalière brute (€)<input id="cns-aj" type="number" min="0" step="any" placeholder="0" oninput="cnsRun()"></label>' +
      '<label>Mois civil concerné<input id="cns-mois" type="month" value="' + ym + '" oninput="cnsRun()"></label>' +
      '<label>Nature de l’activité<select id="cns-type" onchange="cnsRun()"><option value="vente">Micro-entrepreneur : achat-revente, hébergement (abattement 71 %)</option><option value="bic">Micro-entrepreneur : autres BIC (abattement 50 %)</option><option value="bnc">Micro-entrepreneur : BNC (abattement 34 %, minimum 305 €)</option><option value="assurances">Autre : revenus déclarés aux assurances sociales</option></select></label>' +
      '<label id="cns-l-rev">Chiffre d’affaires du mois (€)<input id="cns-rev" type="number" min="0" step="any" placeholder="0" oninput="cnsRun()"></label>' +
      '<label>Justificatifs<select id="cns-mode" onchange="cnsRun()"><option value="justifie">Revenus connus et justifiés</option><option value="avance">Revenus déclarés, justificatifs à venir (avance)</option><option value="inconnu">Revenus inconnus (paiement provisoire)</option></select></label>' +
      '<h3 class="dl-h">Plafond de 60 %</h3>' +
      '<label class="dl-check"><input id="cns-plaf" type="checkbox" checked onchange="cnsRun()"> Fin de contrat retenue au 01/04/2025 ou après</label>' +
      '<label>Reliquat de droits à la création ou reprise (jours)<input id="cns-rel" type="number" min="0" placeholder="0" oninput="cnsRun()"></label>' +
      '<label>Jours déjà consommés en cumul avant ce mois<input id="cns-conso" type="number" min="0" placeholder="0" oninput="cnsRun()"></label>' +
      '</section><section id="cns-out" class="dl-result"></section></div>';
  }
  window.cnsRun = function () {
    const out = $('cns-out'); if (!out) return;
    const aj = parseFloat($('cns-aj').value) || 0;
    const [y, m] = ($('cns-mois').value || '').split('-').map(Number);
    const jm = 30; /* mensualisation : 30 jours quel que soit le mois */
    const type = $('cns-type').value;
    $('cns-l-rev').firstChild.nodeValue = type === 'assurances' ? 'Revenus du mois déclarés aux assurances sociales (€)' : 'Chiffre d’affaires du mois (€)';
    if (!(aj > 0)) { out.innerHTML = note('Renseignez l’allocation journalière pour calculer le cumul.'); return; }
    const r = cnsCompute({ aj: aj, jm: jm, type: type, revenu: parseFloat($('cns-rev').value) || 0, mode: $('cns-mode').value, plafondActif: $('cns-plaf').checked, reliquat: parseFloat($('cns-rel').value) || 0, conso: parseFloat($('cns-conso').value) || 0 });
    const al = [];
    if (r.plafonne) al.push(wizAlert('warn', 'Plafond de 60 % atteint : ' + r.jours + ' jour(s) payable(s) sur ' + (r.mode === 'avance' ? r.provisoireJ : r.J) + '. Au-delà, poursuite exceptionnelle à demander à l’IPR.'));
    if (r.mode === 'inconnu') al.push(wizAlert('warn', 'Paiement provisoire de 70 % de l’ARE mensuelle, régularisé chaque année sur les justificatifs.'));
    if (r.mode === 'avance') al.push(wizAlert('warn', 'Avance de ' + r.provisoireJ + ' jour(s) (J × 0,8) : ' + (r.J - r.provisoireJ) + ' jour(s) à verser après justificatifs.'));
    if (r.J === 0 && r.mode !== 'inconnu') al.push(wizAlert('warn', 'Revenus retenus ≥ 70 % de l’ARE mensuelle : aucun jour indemnisé ce mois-ci, les jours sont reportés.'));
    const tiles = [['Revenu retenu', eur(r.retenu)], ['ARE mensuelle', eur(r.areM)], ['Part déduite (70 %)', eur(r.deduit)], ['Jours J calculés', fn(r.jRaw) + ' → ' + r.J]];
    out.innerHTML = '<div class="wiz-hero is-ok"><div class="wiz-hero-top"><span>Complément d’ARE ' + (r.mode === 'inconnu' ? 'provisoire' : 'du mois') + '</span></div><strong>' + eur(r.complement) + '</strong><em>' + (r.mode === 'inconnu' ? '70 % de l’ARE mensuelle' : r.jours + ' jour(s) indemnisé(s), ' + r.reportes + ' reporté(s)') + '</em></div>' +
      '<div class="wiz-tiles">' + tiles.map(t => '<div class="wiz-tile"><span>' + t[0] + '</span><strong>' + esc(t[1]) + '</strong></div>').join('') + '</div>' +
      '<div class="wiz-tiles"><div class="wiz-tile"><span>Revenu total du mois</span><strong>' + eur(r.total) + '</strong></div>' +
      (r.plafondJours != null ? '<div class="wiz-tile"><span>Plafond de 60 %</span><strong>' + fn(r.plafondJours) + ' j · reste ' + fn(r.restantJours) + ' j</strong></div>' : '') + '</div>' + al.join('') +
      note('Formule : J = [ARE mensuelle − 0,70 × (CA − abattement)] ÷ AJ, arrondi à l’entier. Simulation indicative à confirmer sur la notification.') +
      '<div class="wiz-actions"><button type="button" class="reg-btn" onclick="cnsCopy()">Copier la note</button></div>';
    window.__cnsNote = 'Cumul ARE et activité non salariée, ' + $('cns-mois').value + '\nAJ ' + eur(aj) + ' × ' + jm + ' j = ' + eur(r.areM) + '\nRevenu retenu ' + eur(r.retenu) + ' (déduction 70 % = ' + eur(r.deduit) + ')\n' +
      (r.mode === 'inconnu' ? 'Paiement provisoire : ' + eur(r.complement) : 'Jours indemnisés : ' + r.jours + ' (reportés : ' + r.reportes + ')\nComplément : ' + eur(r.complement)) + (r.plafondJours != null ? '\nPlafond 60 % : ' + fn(r.plafondJours) + ' j, restant ' + fn(r.restantJours) + ' j' : '') + '\nBarème vérifié le ' + BAREME.verifie;
  };
  window.cnsCopy = function () { copyToClipboard(window.__cnsNote || ''); showToast('Note copiée', 'success'); };

  /* Vue et onglets internes */
  const TABS = [['sim', 'Simulateur', tabSim], ['regles', 'Règles et calcul', tabRegles], ['dem', 'Démarches', tabDemarches], ['rec', 'Recours', tabRecours], ['src', 'Sources', tabSources]];
  let cur = 'sim';
  const v = document.createElement('div');
  v.id = 'view-cns'; v.className = 'hidden flex-1 overflow-y-auto';
  v.innerHTML = '<div class="reg-wrap"><div class="reg-head"><div><h2>Cumul CNS</h2><p>Cumul de l’ARE avec une activité non salariée : règles, simulateur, démarches et recours.</p></div></div><div class="rg-tabs" id="cns-tabs" role="tablist"></div><div id="cns-body"></div></div>';
  $('view-delais').parentElement.appendChild(v);
  window.cnsTab = function (id) {
    cur = id;
    $('cns-tabs').innerHTML = TABS.map(t => '<button type="button" role="tab" class="rg-tab' + (t[0] === cur ? ' is-on' : '') + '" aria-selected="' + (t[0] === cur) + '" onclick="cnsTab(\'' + t[0] + '\')">' + t[1] + '</button>').join('');
    const t = TABS.find(x => x[0] === id);
    $('cns-body').innerHTML = '<section class="' + (id === 'sim' ? '' : 'dl-form cns-panel') + '">' + t[2]() + '</section>';
    if (id === 'sim') cnsRun();
    refreshIcons();
  };

  NAV_TABS_CONFIG.push({ id: 'cns', name: 'Cumul CNS', desc: 'Cumul ARE et activité non salariée : règles, simulateur, démarches, recours', icon: 'briefcase', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30', badge: 'Non salarié' });
  HOME_GROUPS[1].ids.push('cns');
  FT_KW.cns = 'cumul cns non salarié non salariée micro-entrepreneur auto-entrepreneur indépendant activité création reprise entreprise abattement 60 pourcent recours démarches';
  const _sw4 = switchNavTab;
  switchNavTab = function (t) {
    _sw4(t);
    const vv = $('view-cns'); if (vv) vv.classList.toggle('hidden', String(t) !== 'cns');
    if (String(t) === 'cns') { const n = $('header-active-tab-name'); if (n) n.textContent = 'Cumul CNS'; cnsTab(cur); }
  };
})();



/* ================= Extension 13 : navigation par rubriques (onglets regroupés) ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(String(s == null ? '' : s));
  const VIEW = { '1': 'od', '2': 'demission', '3': 'ans', '4': 'csp', '5': 'complement-are', '6': 'indus', '7': 'iccp', '8': 'retraite', '9': 'rci', cfd: 'cfd', dossier: 'dossier', delais: 'delais', droits: 'droits', bareme: 'bareme', jour: 'jour', glossaire: 'glossaire', cns: 'cns', sources: 'sources', sjr: 'sjr', schemas: 'schemas' };

  const HUBS = [
    { id: 'hub:ouverture', name: 'Ouverture de droits', desc: 'Dossier, conditions, démission, rupture conventionnelle, délais, complément ARE', icon: 'clipboard-check', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      members: [['dossier', 'Parcours dossier'], ['1', 'Conditions et ARE'], ['2', 'Démission'], ['9', 'Rupture conventionnelle'], ['delais', 'Délais'], ['5', 'Complément ARE'], ['6', 'Trop-perçu']] },
    { id: 'hub:ans', name: 'ANS : création d’entreprise', desc: 'ARCE ou maintien de l’ARE, cumul CNS (activité non salariée)', icon: 'calculator', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
      members: [['3', 'ARCE et maintien'], ['cns', 'Cumul CNS']] },
    { id: 'hub:fin', name: 'Fin de droits et passages', desc: 'Rechargement, ASS, CFD, retraite', icon: 'hourglass', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      members: [['droits', 'Rechargement et ASS'], ['cfd', 'CFD'], ['8', 'Retraite']] },
    { id: 'hub:situations', name: 'Situations particulières', desc: 'CSP, ICCP et CIBTP, indépendants, formation, sanctions', icon: 'shield', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      members: [['4', 'CSP'], ['7', 'ICCP et CIBTP']] },
    { id: 'hub:calculs', name: 'Références et calculs', desc: 'SJR et net, schémas, barèmes, glossaire, sources', icon: 'book-open-check', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      members: [['sjr', 'SJR et net'], ['schemas', 'Schémas'], ['bareme', 'Barèmes'], ['glossaire', 'Glossaire'], ['sources', 'Sources']] }
  ];
  HUBS.forEach(h => { h.badge = h.members.length + ' onglets'; });
  const hubOf = tab => HUBS.find(h => h.members.some(m => m[0] === String(tab)));

  // Les rubriques deviennent des entrées de navigation (recherche : on garde les outils individuels)
  HUBS.forEach(h => NAV_TABS_CONFIG.push({ id: h.id, name: h.name, desc: h.desc, icon: h.icon, color: h.color, badge: h.badge }));
  const _hay = ftToolHay;
  ftToolHay = function (t) { return String(t.id).indexOf('hub:') === 0 ? '' : _hay(t); };

  // Accueil : rubriques au lieu d'une liste de vingt outils
  HOME_GROUPS.length = 0;
  HOME_GROUPS.push({ title: 'Outils agent', icon: 'mail', ids: ['cvm', 'jour', 'hub:calculs'] });
  HOME_GROUPS.push({ title: 'Dossiers et calculs', icon: 'calculator', ids: ['hub:ouverture', 'hub:ans', 'hub:situations', 'hub:fin'] });

  // Menu des outils : huit entrées
  const MENU = ['home', 'cvm', 'hub:ouverture', 'hub:ans', 'hub:fin', 'hub:situations', 'hub:calculs', 'jour'];
  renderBurgerTabs = function () {
    const c = $('burger-tabs-list'); if (!c) return;
    const act = String(activeNavTab);
    const item = (id, label, tab) => {
      const on = act === String(id);
      return '<button onclick="switchNavTab(\'' + id + '\')" class="w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all group ' + (on ? 'bg-gradient-to-r from-blue-900/60 to-cyan-950/60 border-cyan-500/50 shadow-md shadow-cyan-950/40' : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700/80') + '">' +
        '<div class="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ' + (on ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50' : tab.color) + '"><i data-lucide="' + tab.icon + '" class="w-4 h-4"></i></div>' +
        '<div class="min-w-0 flex-1"><div class="flex items-center gap-1.5"><span class="text-xs font-bold ' + (on ? 'text-white' : 'text-slate-200') + '">' + esc(label) + '</span>' + (on ? '<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>' : '') + '</div>' +
        '<p class="text-[10px] text-slate-400 mt-0.5 leading-tight">' + esc(tab.desc) + '</p></div></button>';
    };
    let n = 0;
    c.innerHTML = MENU.map(id => {
      const hub = HUBS.find(h => h.id === id);
      if (!hub) { const tab = NAV_TABS_CONFIG.find(t => String(t.id) === id); if (!tab) return ''; n++; const head = (id === 'jour') ? '<div class="menu-sec-h" style="margin-top:12px">Autres outils</div>' : ''; return head + item(id, tab.name, tab); }
      const rows = hub.members.map(m => { const tab = NAV_TABS_CONFIG.find(t => String(t.id) === String(m[0])); if (!tab) return ''; n++; return item(m[0], m[1], tab); }).join('');
      return '<div class="menu-sec" data-hub="' + esc(hub.id) + '"><div class="menu-sec-h">' + esc(hub.name) + '</div><div class="space-y-1.5">' + rows + '</div></div>';
    }).join('');
    const p = Array.from(document.querySelectorAll('p')).find(x => /modules\s*&\s*simulateurs/.test(x.textContent));
    if (p) p.textContent = n + ' outils en ' + HUBS.length + ' rubriques';
    refreshIcons();
  };

  // Barre d'onglets de la rubrique, en haut de chaque écran membre
  const bars = [];
  HUBS.forEach(h => h.members.forEach(m => {
    const v = $('view-' + VIEW[m[0]]); if (!v) return;
    const box = v.querySelector(':scope > .reg-wrap') || v;
    const bar = document.createElement('nav');
    bar.className = 'hub-bar'; bar.setAttribute('aria-label', h.name);
    bar.innerHTML = '<span class="hub-name">' + esc(h.name) + '</span>' + h.members.map(x => '<button type="button" class="hub-tab" data-t="' + x[0] + '" onclick="switchNavTab(\'' + x[0] + '\')">' + esc(x[1]) + '</button>').join('');
    box.insertBefore(bar, box.firstChild);
    bars.push([bar, m[0]]);
  }));
  function markBars(t) {
    bars.forEach(b => { b[0].querySelectorAll('.hub-tab').forEach(x => { const on = x.dataset.t === String(t); x.classList.toggle('is-on', on); if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); }); });
  }

  const _sw6 = switchNavTab;
  switchNavTab = function (t) {
    let target = String(t);
    if (target.indexOf('hub:') === 0) {
      const h = HUBS.find(x => x.id === target);
      let last = ''; try { last = safeLS.getItem('ft_hub_' + h.id) || ''; } catch (e) {}
      target = h.members.some(m => m[0] === last) ? last : h.members[0][0];
    }
    _sw6(/^\d+$/.test(target) ? parseInt(target, 10) : target);
    const h = hubOf(target);
    if (h) {
      try { safeLS.setItem('ft_hub_' + h.id, target); } catch (e) {}
      const m = h.members.find(x => x[0] === target), n = $('header-active-tab-name');
      if (n) n.textContent = h.name + ' · ' + m[1];
    }
    markBars(target);
  };
})();
