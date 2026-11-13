/* ================= Extension 14 : Sources et vérification ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(String(s == null ? '' : s));
  const VERIF = '2026-10-23';
  const U = 'Unédic (règlement et barème)', F = 'francetravail.fr';
  const OK = 'Vérifié', CONF = 'À confirmer', NV = 'Non vérifié';
  // [thème, règle, valeur utilisée dans l’outil, source consultée, niveau]
  const ROWS = [
    ['ARE', 'Allocation journalière', 'Maximum de 40,4 % du SJR + 13,18 € et 57 % du SJR, minimum 32,13 €, plafond 75 % du SJR et 300,21 €', U, OK],
    ['ARE', 'Dégressivité', '−30 % à partir du 7e mois, moins de 55 ans, allocation supérieure à 92,57 €', U, OK],
    ['Durée', 'Durées maximales', '548 j, 685 j (55-56 ans), 822 j (57 ans et plus) ; minimum 182 j ; coefficient 0,75', U, OK],
    ['Durée', 'Rupture conventionnelle', 'Durées 456 j et 624 j pour une fin de contrat à compter du 01/09/2026', U, OK],
    ['Affiliation', 'Conditions d’ouverture', '130 jours ou 910 heures ; saisonniers 108 jours ou 758 heures', U, OK],
    ['Différés', 'Congés payés, supra-légal, attente', 'Congés payés plafonnés à 30 j ; supra-légal ÷ 111,8 plafonné à 150 j (75 j éco) ; attente 7 j', U, OK],
    ['Cumul', 'Cumul avec un salaire', '70 % du salaire brut, plafond égal au SJR × 30,42', U, OK],
    ['Cumul', 'Cumul activité non salariée (CNS)', 'Revenus retenus après abattement (71 %, 50 %, 34 %, minimum 305 €) ; jours indemnisables = (ARE mensuelle − 70 % des revenus) ÷ allocation journalière', F + ' et ' + U, OK],
    ['Cumul', 'Plafond de 60 % du reliquat', 'Fin de contrat à compter du 01/04/2025, 40 % restant via l’IPR (poursuite exceptionnelle)', F, OK],
    ['CSP', 'Allocation de sécurisation professionnelle', '75 % du salaire de référence, minimum 22,99 €', U, OK],
    ['ASS', 'Montant et plafonds', '19,48 € par jour ; plafond de ressources 1 363,60 € (seul) et 2 142,80 € (couple) au 01/04/2026', F, OK],
    ['Rechargement', 'Conditions', '130 j ou 910 h ; saisonniers 108 j ou 758 h ; fenêtres de 24 et 36 mois ; démission : 88 j ou 610 h', U, OK],
    ['Recours', 'Médiateur et tribunal', 'Réclamation en agence, médiateur régional, puis tribunal administratif ; délais selon la notification', F, CONF],
    ['Indu', 'Recours gracieux préalable', '2 mois (décret 2016-1592, source ancienne)', 'Texte réglementaire', CONF],
    ['Retraite', 'Cumul partiel selon l’âge', 'Non reproduit : le tableau consulté était incohérent', F, NV],
    ['Temps partiel', 'Coefficient et calcul', 'Non intégré aux simulateurs', '—', NV],
    ['Net', 'Estimation du montant net', 'Non calculée : seul le brut est affiché', '—', NV],
    ['Barèmes', 'Historique des barèmes', 'Seul le barème en vigueur est codé', '—', NV],
    ['ANS', 'ARCE ou maintien de l’ARE', 'Comparaison à confirmer ; l’écran « Maintien » applique un seul abattement de 50 %, voir Cumul CNS', '—', NV],
    ['Territoires', 'Outre-mer', 'Règles spécifiques non intégrées', '—', NV],
    ['Cumul', 'Dirigeants de société', 'Non intégré', '—', NV]
  ];
  const CLS = { 'Vérifié': 'ok', 'À confirmer': 'cf', 'Non vérifié': 'nv' };
  window.FT_SOURCES = ROWS;
  window.FT_VERIF_DATE = VERIF;

  function age() { return Math.floor((Date.now() - new Date(VERIF + 'T12:00:00').getTime()) / 86400000); }
  function fr(d) { return d.split('-').reverse().join('/'); }

  let flt = 'all', q = '';
  function render() {
    const a = age();
    const n = ROWS.filter(r => r[4] === OK).length;
    const rows = ROWS.filter(r => (flt === 'all' || r[4] === flt) && (!q || nrm(r.join(' ')).indexOf(nrm(q)) > -1));
    const alert = a > 270 ? '<div class="sv-alert is-warn">Barèmes vérifiés il y a ' + a + ' jours : contrôlez les montants (revalorisations) sur unedic.org avant de vous y fier.</div>'
      : '<div class="sv-alert">Barèmes vérifiés le ' + fr(VERIF) + ' (il y a ' + a + ' jour' + (a > 1 ? 's' : '') + '). Une alerte s’affiche au-delà de 9 mois.</div>';
    $('sv-body').innerHTML = alert +
      '<div class="sv-tools"><input id="sv-q" type="search" placeholder="Chercher une règle" value="' + esc(q) + '" oninput="ftSvSearch(this.value)">' +
      [['all', 'Tout (' + ROWS.length + ')'], [OK, OK + ' (' + n + ')'], [CONF, CONF], [NV, NV]].map(f => '<button type="button" class="sv-chip' + (flt === f[0] ? ' is-on' : '') + '" onclick="ftSvFilter(\'' + f[0] + '\')">' + f[1] + '</button>').join('') + '</div>' +
      '<div class="sv-list">' + (rows.length ? rows.map(r => '<article class="sv-row"><div class="sv-top"><span class="sv-theme">' + esc(r[0]) + '</span><span class="sv-lvl is-' + CLS[r[4]] + '">' + esc(r[4]) + '</span></div><h3>' + esc(r[1]) + '</h3><p>' + esc(r[2]) + '</p><small>Source : ' + esc(r[3]) + '</small></article>').join('') : '<p class="sv-empty">Aucune règle ne correspond.</p>') + '</div>' +
      '<p class="sv-foot">« Vérifié » signifie recoupé sur le site de l’organisme cité à la date indiquée, pas validé par un juriste. En cas de doute, le texte officiel prime.</p>';
    const inp = $('sv-q'); if (inp && document.activeElement && document.activeElement.id === 'sv-q') { const l = inp.value.length; inp.setSelectionRange(l, l); }
  }
  window.ftSvFilter = f => { flt = f; render(); };
  window.ftSvSearch = v => { q = v; render(); const i = $('sv-q'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length); } };

  const host = $('view-delais').parentElement, v = document.createElement('div');
  v.id = 'view-sources'; v.className = 'hidden flex-1 overflow-y-auto';
  v.innerHTML = '<div class="reg-wrap"><div class="reg-head"><div><h2>Sources et vérification</h2><p>Chaque règle utilisée par les simulateurs, sa source et son niveau de vérification.</p></div><div class="reg-actions"><button type="button" class="reg-btn" onclick="window.print()">Imprimer</button></div></div><div id="sv-body"></div></div>';
  host.appendChild(v);

  NAV_TABS_CONFIG.push({ id: 'sources', name: 'Sources et vérification', desc: 'Règles utilisées, sources, niveau de vérification', icon: 'shield-check', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', badge: 'Fiabilité' });
  FT_KW.sources = 'sources vérification fiabilité règles références barème date alerte confirmer';

  const _sw = switchNavTab;
  switchNavTab = function (t) {
    _sw(t);
    const vv = $('view-sources'); if (vv) vv.classList.toggle('hidden', String(t) !== 'sources');
    if (String(t) === 'sources') { flt = 'all'; q = ''; render(); const n = $('header-active-tab-name'); if (n) n.textContent = 'Sources et vérification'; refreshIcons(); }
  };
})();
