/* ================= Extension 20 : accueil, pont Maintien/CNS, doublons de modèles, fiche PDF, journal ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(String(s == null ? '' : s));
  const prof = () => (window.__ftProfile ? window.__ftProfile() : null);

  /* ---------- 1. Accueil : plus de doublon avec les bulles ---------- */
  function fixHome() {
    document.querySelectorAll('.home-quick-card').forEach(card => {
      const nm = (card.querySelector('.home-quick-name') || {}).textContent || '';
      const set = (name, desc, go, action, icon) => {
        card.querySelector('.home-quick-name').textContent = name;
        card.querySelector('.home-quick-desc').textContent = desc;
        const g = card.querySelector('.home-quick-go'); if (g) g.firstChild.textContent = go;
        card.setAttribute('onclick', action);
        const ic = card.querySelector('.home-quick-ico svg, .home-quick-ico i'); if (ic) { const i = document.createElement('i'); i.setAttribute('data-lucide', icon); i.className = 'w-6 h-6'; ic.replaceWith(i); }
      };
      if (/^Simulateur d.admission/.test(nm)) set('Nouveau dossier', 'Saisir la fin de contrat et obtenir l’ouverture de droits, l’ARE et les délais.', 'Démarrer ', "switchNavTab('dossier')", 'folder-kanban');
      if (/^Simulateur ICCP/.test(nm)) {
        if (prof()) set('Fiche du dossier', 'Imprimer ou enregistrer en PDF la fiche de synthèse du dossier en cours.', 'Créer le PDF ', 'ftFpPdf()', 'printer');
        else set('Références et calculs', 'SJR, net estimé, schémas, barème, glossaire et sources.', 'Ouvrir ', "switchNavTab('hub:calculs')", 'book-open-check');
      }
    });
    const b = document.querySelector('.hm-extra .hm-card .hm-btns');
    if (b && prof() && !b.querySelector('.hm-pdf')) { const x = document.createElement('button'); x.type = 'button'; x.className = 'hm-pdf'; x.textContent = 'Fiche PDF'; x.setAttribute('onclick', 'ftFpPdf()'); b.appendChild(x); }
    try { refreshIcons(); } catch (e) {}
  }
  const _rh = renderHome;
  renderHome = function (q) { const r = _rh(q); try { fixHome(); } catch (e) {} return r; };
  try { fixHome(); } catch (e) {}

  /* ---------- 2. Pont Maintien (ARCE et maintien) vers Cumul CNS ---------- */
  function bridge() {
    const res = $('maint-res-are-versee'); if (!res || $('maint-to-cns')) return;
    const host = res.closest('div[class*="rounded"]') || res.parentElement;
    const d = document.createElement('div'); d.id = 'maint-to-cns'; d.className = 'x12-bridge';
    d.innerHTML = '<p>Ce calcul est une estimation rapide sur un mois. Le détail mensuel (plafond de 70 %, reliquat, jours reportés) se trouve dans Cumul CNS.</p><button type="button" onclick="ftMaintToCns()">Poursuivre dans Cumul CNS avec ces valeurs</button>';
    (host.parentElement || host).insertBefore(d, host.nextSibling);
  }
  window.ftMaintToCns = () => {
    const v = id => ($(id) || {}).value || '';
    const t = v('maint-type'), map = { bic: 'bic', vente: 'vente', bnc: 'bnc' };
    switchNavTab('cns');
    setTimeout(() => {
      if ($('cns-aj')) $('cns-aj').value = v('maint-input-are-jour');
      if ($('cns-type')) $('cns-type').value = map[t] || 'bic';
      if ($('cns-rev')) $('cns-rev').value = v('maint-input-recette');
      try { cnsRun(); } catch (e) {}
      showToast('Valeurs reprises dans Cumul CNS', 'success');
    }, 60);
  };
  function cnsLink() {
    const v = $('view-cns'); if (!v || v.querySelector('.x12-cnslink')) return;
    const a = document.createElement('p'); a.className = 'x12-cnslink';
    a.innerHTML = 'Comparer avec l’ARCE ou le maintien simple : <button type="button" onclick="switchNavTab(\'3\')">ouvrir ARCE et maintien</button>';
    const w = v.querySelector('.reg-wrap') || v; w.insertBefore(a, w.children[1] || null);
  }
  const _sw = switchNavTab;
  switchNavTab = function (t) { const r = _sw(t); try { bridge(); cnsLink(); } catch (e) {} return r; };
  try { bridge(); cnsLink(); } catch (e) {}

  /* ---------- 3. Détecteur de doublons de modèles ---------- */
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\{\{[^}]*\}\}|\[[^\]]*\]/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  function shingles(s) { const w = s.split(' '), o = new Set(); for (let i = 0; i + 2 < w.length; i++) o.add(w[i] + ' ' + w[i + 1] + ' ' + w[i + 2]); if (!o.size && s) o.add(s); return o; }
  function jac(a, b) { if (!a.size || !b.size) return 0; let n = 0; a.forEach(x => { if (b.has(x)) n++; }); return n / (a.size + b.size - n); }
  window.ftDupFind = (thr) => {
    thr = thr || 0.9;
    const L = templates.map(t => ({ t, ti: norm(t.title), sh: shingles(norm(t.body)) }));
    const par = L.map((_, i) => i), fd = i => par[i] === i ? i : (par[i] = fd(par[i]));
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const sim = jac(L[i].sh, L[j].sh), same = L[i].ti && L[i].ti === L[j].ti && L[i].t.category === L[j].t.category && sim >= 0.5;
      if (sim >= thr || same) par[fd(i)] = fd(j);
    }
    const g = {}; L.forEach((x, i) => { (g[fd(i)] = g[fd(i)] || []).push(x.t); });
    return Object.values(g).filter(a => a.length > 1);
  };
  function dupRender() {
    const m = $('dup-modal'); if (!m) return;
    const gs = ftDupFind();
    m.querySelector('.x12-body').innerHTML = gs.length ? '<p class="x12-note">' + gs.length + ' groupe' + (gs.length > 1 ? 's' : '') + ' de modèles très proches (corps identique à 90 % ou plus, ou même titre et même catégorie avec un corps proche). Rien n’est supprimé sans votre confirmation : gardez le modèle à conserver et supprimez les autres si besoin.</p>' +
      gs.map(a => '<div class="x12-grp">' + a.map(t => '<div class="x12-row"><div><strong>' + esc(t.title) + '</strong><span>' + esc(t.category || '') + (t.isOfficial ? ' · officiel' : ' · personnel') + '</span></div><div class="x12-btns"><button type="button" onclick="ftDupOpen(\'' + t.id + '\')">Ouvrir</button><button type="button" class="is-danger" onclick="ftDupDel(\'' + t.id + '\')">Supprimer</button></div></div>').join('') + '</div>').join('')
      : '<p class="x12-note">Aucun doublon détecté parmi les ' + templates.length + ' modèles.</p>';
  }
  window.ftDupToggle = v => {
    let m = $('dup-modal');
    if (!m) { m = document.createElement('div'); m.id = 'dup-modal'; m.className = 'x12-modal hidden'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Doublons de modèles');
      m.innerHTML = '<div class="x12-card"><div class="x12-head"><h3>Doublons de modèles</h3><button type="button" onclick="ftDupToggle(false)">Fermer</button></div><div class="x12-body"></div></div>'; document.body.appendChild(m); }
    const open = v == null ? m.classList.contains('hidden') : v; if (open) dupRender(); m.classList.toggle('hidden', !open);
  };
  window.ftDupOpen = id => { ftDupToggle(false); switchNavTab('cvm'); setTimeout(() => { try { selectTemplate(id); } catch (e) {} }, 80); };
  window.ftDupDel = id => {
    const t = templates.find(x => x.id === id); if (!t) return;
    if (!confirm('Supprimer le modèle « ' + t.title + ' » ? Cette action est définitive.')) return;
    modelIdToDelete = id; confirmDeleteModel(); dupRender();
  };
  window.addEventListener('keydown', e => { if (e.key === 'Escape') ftDupToggle(false); });

  /* ---------- 4. Fiche de dossier en PDF (mise en page d'impression) ---------- */
  window.ftFpPdf = () => {
    const p = prof(); if (!p) { showToast('Aucun dossier en cours : lancez d’abord le simulateur', 'error'); return; }
    let el = $('fp-print'); if (!el) { el = document.createElement('div'); el.id = 'fp-print'; document.body.appendChild(el); }
    const lines = (window.__ftFicheText ? window.__ftFicheText() : '').split('\n');
    let h = '', ul = false;
    lines.forEach((ln, i) => {
      if (/^- /.test(ln)) { if (!ul) { h += '<ul>'; ul = true; } h += '<li>' + esc(ln.slice(2)) + '</li>'; return; }
      if (ul) { h += '</ul>'; ul = false; }
      if (!ln.trim()) return;
      if (i === 0) h += '<h1>' + esc(ln) + '</h1>';
      else if (i === 1) h += '<p class="sub">' + esc(ln) + '</p>';
      else { const k = ln.indexOf(' : '); h += k > 0 && k < 60 ? '<p><strong>' + esc(ln.slice(0, k)) + '</strong> : ' + esc(ln.slice(k + 3)) + '</p>' : '<p>' + esc(ln) + '</p>'; }
    });
    if (ul) h += '</ul>';
    el.innerHTML = h + '<p class="foot">Document indicatif généré localement, sans valeur de notification de droits.</p>';
    const root = document.documentElement; root.classList.add('printing-fiche');
    const done = () => { root.classList.remove('printing-fiche'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); setTimeout(() => window.print(), 50); setTimeout(done, 60000);
  };
  const pm = new MutationObserver(() => {
    const pn = $('fp-panel'); if (!pn || pn.querySelector('.x12-pdf') || !pn.querySelector('button')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'x12-pdf'; b.textContent = 'Fiche en PDF'; b.setAttribute('onclick', 'ftFpPdf()');
    const first = Array.from(pn.querySelectorAll('button')).find(x => /Imprimer/.test(x.textContent)); if (first) first.replaceWith(b); else pn.appendChild(b);
  });
  const hook = () => { const pn = $('fp-panel'); if (pn) { pm.observe(pn, { childList: true }); pn.dispatchEvent(new Event('x')); pm.takeRecords(); const b = document.createElement('i'); pn.appendChild(b); b.remove(); } };
  hook(); document.addEventListener('DOMContentLoaded', hook);

  /* ---------- 5. Journal des modifications (page Sources) ---------- */
  const LOG = [
    ['12/11/2026', 'Application', ['Mensualisation sur 30 jours dans le complément ARE, le cumul CNS et le maintien ANS ; cas de contrôle du complément ARE (565,29 €).', 'Accueil pleine largeur avec outils par rubrique, liens cliquables dans les mails, catégories triées A→Z, retrait de la référence et de la relecture.', 'Suppression définitive des mails (mémorisée et synchronisée), synchronisation automatique entre postes.', 'Comptes conseillers et synchronisation des modèles CVM entre les postes, modèles communs publiés par l’administrateur.', 'Barre de recherche dans la barre du haut, à la place du bandeau du barème et du nombre de modèles.', 'Fenêtre « Nouveautés » à l’ouverture de la page quand le site a changé.', 'Bandeau « Nouvelle version disponible » sur la version en ligne.']],
    ['27/10/2026', 'Application', ['Accueil : bouton « Nouveau dossier », fiche du dossier en PDF, plus de doublon avec les bulles des simulateurs.', 'Ouverture de droits : le complément ARE y est intégré.', 'Maintien : passage direct des valeurs vers Cumul CNS.', 'Détecteur de doublons parmi les modèles de mail (aucune suppression automatique).', 'Icônes de secours intégrées au fichier.','Barèmes historiques de l’ARE (juillet 2022 à juillet 2025) appliqués selon la date de fin de contrat.']],
    ['23/10/2026', 'Barème', ['Dernière vérification des valeurs du barème (voir le niveau de vérification ligne par ligne ci-dessus).']],
    ['2026', 'Règles prises en compte', ['À compter du 01/09/2026 : plafonds de durée après rupture conventionnelle (456 j et 624 j) et Scop pour l’ARCE.', 'À compter du 01/07/2026 : congé supplémentaire de naissance (traitement détaillé non intégré, à confirmer).', 'À compter du 01/04/2026 : primo-entrants (108 jours ou 758 heures, minimum 152 jours).', 'Démission : abandon de poste présumé démission, projet professionnel, réexamen après 121 jours.']]
  ];
  function journal() {
    const v = $('view-sources'); if (!v || v.querySelector('.x12-log')) return;
    const body = $('sv-body'); if (!body) return;
    const d = document.createElement('details'); d.className = 'x12-log'; d.open = true;
    d.innerHTML = '<summary>Journal des modifications</summary>' + LOG.map(e => '<div class="x12-ent"><h4>' + esc(e[0]) + ' · ' + esc(e[1]) + '</h4><ul>' + e[2].map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>').join('') +
      '<div class="x12-tools"><button type="button" onclick="ftDupToggle(true)">Contrôler les doublons de modèles</button></div>';
    body.parentNode.insertBefore(d, body.nextSibling);
  }
  const _sw2 = switchNavTab;
  switchNavTab = function (t) { const r = _sw2(t); try { journal(); } catch (e) {} return r; };
  try { journal(); } catch (e) {}

  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push(
    { t: 'Contrôler les doublons de modèles', s: 'Repérer les modèles de mail très proches', kw: 'doublons modèles cvm copies nettoyer', run: () => ftDupToggle(true) },
    { t: 'Fiche du dossier en PDF', s: 'Imprimer ou enregistrer la fiche de synthèse', kw: 'pdf fiche imprimer dossier synthèse', run: () => ftFpPdf() },
    { t: 'Journal des modifications', s: 'Historique des changements et règles intégrées', kw: 'journal changelog modifications historique', run: () => switchNavTab('sources') }
  );
})();
