/* ================= Extension 16 : Maintien aligné, reprise du dossier, mails associés, export complet, mode entretien ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(String(s == null ? '' : s));
  const prof = () => (window.__ftProfile ? window.__ftProfile() : null);

  /* ---------- 1. ANS Maintien : mêmes abattements que Cumul CNS ---------- */
  const ABAT = new Proxy({}, { get: (t, k) => { const c = BAREME.cns; return { vente: [c.abat.vente, 0], bic: [c.abat.bic, 0], bnc: [c.abat.bnc, c.bncMin] }[k]; } });
  (function () {
    const ca = $('maint-input-recette'); if (!ca) return;
    const cell = ca.parentElement, grid = cell.parentElement;
    const d = document.createElement('div');
    d.innerHTML = '<label class="block text-[11px] font-medium text-slate-300 mb-1">Nature de l’activité</label>' +
      '<select id="maint-type" onchange="runMaintienCalculation()" class="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none">' +
      '<option value="bic" selected>Prestations de services BIC (abattement 50 %)</option><option value="vente">Achat-revente, hébergement (abattement 71 %)</option><option value="bnc">Professions libérales BNC (abattement 34 %, minimum 305 €)</option></select>';
    grid.insertBefore(d, cell);
  })();
  runMaintienCalculation = function () {
    const val = id => parseFloat(($(id) || {}).value) || 0;
    const ca = val('maint-input-recette'), are = val('maint-input-are-jour'), salRef = val('maint-input-salaire-ref');
    const t = ($('maint-type') || {}).value || 'bic', ab = ABAT[t] || ABAT.bic;
    const arePleine = are * 30; /* mensualisation : 30 jours quel que soit le mois */
    const abattu = Math.max(ca * ab[0], ab[1] ? Math.min(ca, ab[1]) : 0);
    const retenu = Math.max(0, ca - abattu);
    const deduction = retenu * 0.70;
    let joursPayes = are > 0 ? Math.max(0, Math.min(30, Math.round((arePleine - deduction) / are))) : 0;
    if (salRef > 0) while (joursPayes > 0 && retenu + joursPayes * are > salRef + 1e-9) joursPayes--;
    const areVersee = joursPayes * are;
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    set('maint-res-are-versee', areVersee.toFixed(2) + ' €');
    set('maint-res-revenu-total', (retenu + areVersee).toFixed(2) + ' €');
    set('maint-res-jours-payes', joursPayes + ' jours payés');
    set('maint-res-jours-reportes', '+ ' + Math.max(0, 30 - joursPayes) + ' j reportés');
  };
  try { runMaintienCalculation(); } catch (e) {}

  /* ---------- 2. Reprise des valeurs du dossier dans les outils ---------- */
  const band = a => a === 'under55' ? 'u55' : (a === '55to56' ? 'a55' : 'a57');
  const MAPS = {
    delais: p => [['dl-fct', p.a.fct], ['dl-insc', p.a.insc], ['dl-age', band(p.a.age)], ['dl-salaire', p.a.salaire], ['dl-iccp', p.a.cp], ['dl-supra', p.a.supra]],
    '9': p => [['rci-input-date-fct', p.a.fct], ['rci-input-age', p.a.age === 'under55' ? 'under55' : '55plus'], ['rci-input-salaire-moyen', p.a.salaire], ['rci-input-indem-cp', p.a.cp]],
    '7': p => [['cibtp-date-fct', p.a.fct]]
  };
  function reprise(tab) {
    const p = prof(); const fn = MAPS[String(tab)]; if (!p || !fn) return;
    let n = 0, last = null;
    fn(p).forEach(([id, v]) => {
      const e = $(id); if (!e || v == null || v === '' || String(e.value || '').trim() !== '' && e.tagName !== 'SELECT') return;
      if (e.tagName === 'SELECT' && !Array.from(e.options).some(o => o.value === String(v))) return;
      if (String(e.value) === String(v)) return;
      e.value = v; e.classList.add('fp-filled'); last = e; n++;
      e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    });
    if (n) showToast(n + ' valeur' + (n > 1 ? 's' : '') + ' reprise' + (n > 1 ? 's' : '') + ' du dossier en cours (modifiables)', 'info');
  }

  /* ---------- 3. Modèles de mail associés à chaque outil ---------- */
  const KW = {
    '1': 'admission ARE notification', '2': 'démission légitime rejet', '3': 'création entreprise ARCE', '4': 'CSP contrat sécurisation professionnelle',
    '5': 'complément ARE reprise activité cumul', '6': 'trop-perçu indu remboursement', '7': 'ICCP congés payés CIBTP', '8': 'retraite', '9': 'rupture conventionnelle',
    cfd: 'CFD dégressivité', delais: 'différé délai congés payés', droits: 'rechargement fin de droit ASS', cns: 'création entreprise cumul activité', dossier: 'admission ARE notification'
  };
  function strip(tab) {
    document.querySelectorAll('.mt-strip').forEach(x => x.remove()); return; /* liens « Modèles CVM associés » retirés à la demande */
    const kw = KW[String(tab)]; if (!kw || !window.__ftScore) return;
    const v = document.querySelector('[id^="view-"]:not(.hidden)'); if (!v) return;
    const box = v.querySelector(':scope > .reg-wrap') || v;
    let s = box.querySelector(':scope > .mt-strip'); if (s) s.remove();
    const list = templates.map(t => ({ t: t, sc: kw.split(' ').reduce((n, w) => n + (window.__ftScore(w, t.title, t.title + ' ' + t.category + ' ' + (t.tags || []).join(' ')) > 0 ? 1 : 0), 0) })).filter(x => x.sc).sort((a, b) => b.sc - a.sc).slice(0, 4);
    if (!list.length) return;
    s = document.createElement('details'); s.className = 'mt-strip';
    s.innerHTML = '<summary>Modèles CVM associés (' + list.length + ')</summary><div>' + list.map(x => '<button type="button" onclick="ftMtOpen(\'' + x.t.id + '\')"><strong>' + esc(x.t.title) + '</strong><span>' + esc(x.t.category) + '</span></button>').join('') + '</div>';
    const vb = box.querySelector(':scope > .vbar'); if (vb) box.insertBefore(s, vb); else box.appendChild(s);
  }
  window.ftMtOpen = id => { switchNavTab('cvm'); selectCategory('all'); selectTemplate(id); };

  /* ---------- 4. Export et import complets ---------- */
  const KEEP = ['ft_dossiers', 'ft_todos', 'ft_profile', 'ft_tool_use', 'ft_settings', 'ft_theme', 'ft_calc_history', 'ft_recent_templates', 'ft_user_vars', 'ft_sort_mode', 'ft_cat_sort_mode'];
  ftExportData = function () {
    let me = null; try { me = ftCurrentUser(); } catch (e) {}
    const extra = {}; KEEP.forEach(k => { const v = safeLS.getItem(k); if (v != null) extra[k] = v; });
    const payload = { app: 'espace-conseiller-ft', version: 2, exportedAt: new Date().toISOString(), user: me ? me.name : '', templates: templates, favorites: favorites, categories: categoryList, extra: extra };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'sauvegarde-conseiller-ft-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    try { safeLS.setItem('ft_last_export', new Date().toISOString()); } catch (e) {}
    const b = $('bk-banner'); if (b) b.remove();
    showToast('Sauvegarde complète téléchargée (modèles, historique, pense-bête, réglages)', 'success');
  };
  const _imp = ftImportData;
  ftImportData = function (input, mode) {
    const file = input.files && input.files[0];
    let refused = false; const oc = window.confirm;
    window.confirm = m => { const r = oc.call(window, m); if (!r) refused = true; return r; };
    setTimeout(() => { window.confirm = oc; }, 800);
    if (file) {
      const rd = new FileReader();
      rd.onload = () => {
        setTimeout(() => {
          if (refused) return;
          try {
            const d = JSON.parse(rd.result), ex = d && d.extra; if (!ex) return;
            let n = 0;
            KEEP.forEach(k => { if (typeof ex[k] === 'string' && (mode === 'replace' || safeLS.getItem(k) == null)) { safeLS.setItem(k, ex[k]); n++; } });
            if (n) showToast('Historique et réglages restaurés (' + n + '), rechargez la page pour les voir partout', 'info');
          } catch (e) {}
        }, 300);
      };
      rd.readAsText(file);
    }
    return _imp(input, mode);
  };

  /* ---------- 5. Mode entretien et raccourcis ---------- */
  function entretien(on) {
    const h = document.documentElement; const v = on == null ? !h.classList.contains('entretien') : !!on;
    h.classList.toggle('entretien', v);
    try { safeLS.setItem('ft_entretien', v ? '1' : '0'); } catch (e) {}
    showToast(v ? 'Mode entretien activé : affichage resserré' : 'Mode entretien désactivé', 'info');
  }
  try { if (safeLS.getItem('ft_entretien') === '1') document.documentElement.classList.add('entretien'); } catch (e) {}
  window.ftEntretien = entretien;
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push(
    { t: 'Mode entretien', s: 'Affichage resserré pendant un appel (Ctrl+J)', kw: 'compact appel resserré', run: () => entretien() },
    { t: 'Sauvegarder mes données', s: 'Télécharger modèles, historique et réglages', kw: 'export sauvegarde backup', run: () => ftExportData() },
    { t: 'Copier la fiche de synthèse', s: 'Dernier dossier calculé', kw: 'dossier fiche copier', when: () => !!prof(), run: () => ftFpCopy() },
    { t: 'Imprimer cet écran', s: 'Impression ou PDF', kw: 'pdf imprimer', run: () => window.print() }
  );
  const HUBKEYS = { '1': 'hub:ouverture', '2': 'hub:ans', '3': 'hub:fin', '4': 'hub:situations', '5': 'hub:calculs', '6': 'jour', '0': 'home', c: 'cvm', j: 'jour' };
  window.addEventListener('keydown', e => {
    const inField = /INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); entretien(); return; }
    if (e.altKey && !e.ctrlKey && !e.metaKey && HUBKEYS[e.key.toLowerCase()] && !(inField && e.key.length === 1 && /[a-z]/i.test(e.key))) { e.preventDefault(); switchNavTab(HUBKEYS[e.key.toLowerCase()]); }
  }, true);

  /* ---------- Branchement sur la navigation ---------- */
  const _sw = switchNavTab;
  switchNavTab = function (t) {
    _sw(t);
    const cur = String(activeNavTab);
    try { reprise(cur); } catch (e) {}
    try { strip(cur); } catch (e) {}
  };
  /* ---------- 6. Cas de contrôle ---------- */
  function maint(type, ca, are) {
    const ids = { 'maint-type': type, 'maint-input-recette': ca, 'maint-input-are-jour': are, 'maint-input-salaire-ref': '' };
    Object.keys(ids).forEach(k => { const e = $(k); if (e) e.value = ids[k]; });
    runMaintienCalculation();
    const v = parseFloat(String(($('maint-res-are-versee') || {}).textContent).replace(',', '.'));
    ['maint-input-recette', 'maint-input-are-jour'].forEach(k => { const e = $(k); if (e) e.value = ''; });
    if ($('maint-type')) $('maint-type').value = 'bic';
    runMaintienCalculation();
    return v;
  }
  [
    { n: 'ANS Maintien : abattement 50 % (BIC), 1 000 € de CA et 40 €/j', run: () => maint('bic', 1000, 40), exp: 840, d: 1 },
    { n: 'ANS Maintien : abattement 71 % (vente), 1 000 € de CA et 40 €/j', run: () => maint('vente', 1000, 40), exp: 1000, d: 1 },
    { n: 'ANS Maintien : BNC, abattement 34 % (minimum 305 €)', run: () => maint('bnc', 1000, 40), exp: 720, d: 1 },
    { n: 'ANS Maintien : BNC, minimum de 305 € appliqué sur 500 € de CA', run: () => maint('bnc', 500, 40), exp: 1080, d: 1 }
  ].forEach(c => FT_CASES.push(c));
})();
