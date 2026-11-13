/* ================= Extension 14b : Schémas, SJR et net ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(String(s == null ? '' : s));
  const fmt = (n, d) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  const host = $('view-delais').parentElement;
  function mk(id, inner) { const v = document.createElement('div'); v.id = 'view-' + id; v.className = 'hidden flex-1 overflow-y-auto'; v.innerHTML = '<div class="reg-wrap">' + inner + '</div>'; host.appendChild(v); return v; }
  const head = (t, p, extra) => '<div class="reg-head"><div><h2>' + t + '</h2><p>' + p + '</p></div>' + (extra ? '<div class="reg-actions">' + extra + '</div>' : '') + '</div>';

  /* ====================== SCHÉMAS ====================== */
  const TREE = {
    q0: { q: 'La fin du contrat résulte-t-elle d’une démission (ou d’un abandon de poste, présumé démission) ?', y: 'q1', n: { t: 'info', h: 'Autre motif de fin de contrat', d: 'Ce n’est pas une démission : utilisez le parcours dossier (fin de CDD, licenciement, rupture conventionnelle…).' } },
    q1: { q: 'Le motif figure-t-il parmi les cas de démission légitime (suivi du conjoint, violences, salaires impayés, mariage ou PACS dans les 2 mois, etc.) ?', y: { t: 'ok', h: 'Démission légitime', d: 'Elle est assimilée à une perte involontaire d’emploi. Il reste à vérifier l’affiliation (130 jours ou 910 h) et à réunir les justificatifs de la fiche du motif.' }, n: 'q2' },
    q2: { q: 'S’agit-il d’un projet professionnel (reconversion avec formation, création ou reprise d’entreprise) ?', y: 'q3', n: 'q4' },
    q3: { q: 'Avant la démission : accompagnement CEP, projet reconnu réel et sérieux par la commission Transitions Pro, et 1 300 jours travaillés sur les 60 derniers mois ?', y: { t: 'ok', h: 'Démission pour projet professionnel', d: 'ARE possible si l’inscription intervient dans les 6 mois de l’attestation. France Travail contrôle la mise en œuvre du projet dans les 6 mois suivant l’ouverture des droits : sans motif valable, suspension de 4 mois.' }, n: 'q4' },
    q4: { q: 'Depuis la démission, l’usager a-t-il travaillé au moins 65 jours ou 455 heures (un ou plusieurs emplois, sans nouvelle démission) ?', y: { t: 'ok', h: 'Droits ouverts sous réserve des autres conditions', d: 'La condition de recherche après démission est remplie : étudier l’affiliation et calculer l’allocation.' }, n: 'q5' },
    q5: { q: 'Au moins 121 jours de chômage non indemnisé se sont-ils écoulés depuis la démission ?', y: { t: 'warn', h: 'Demande de réexamen possible', d: 'L’instance paritaire régionale examine le dossier, surtout les efforts de recherche d’emploi. Si l’avis est favorable, l’allocation démarre au 122e jour. Un arrêt maladie de 21 jours ou plus prolonge le délai de 121 jours.' }, n: { t: 'ko', h: 'Refus à ce stade', d: 'Rejet de la demande, non définitif : l’usager peut travailler 65 jours ou 455 h, ou demander un réexamen après 121 jours de chômage non indemnisé.' } }
  };
  let tPath = [], tNode = 'q0';
  function treeRender() {
    const box = $('sc-tree'); if (!box) return;
    const n = TREE[tNode];
    const crumbs = tPath.map((p, i) => '<li><span>' + esc(TREE[p[0]].q) + '</span><strong>' + (p[1] ? 'Oui' : 'Non') + '</strong></li>').join('');
    let body;
    if (typeof n === 'string') body = '';
    if (n && n.q) body = '<div class="sc-q"><p>' + esc(n.q) + '</p><div class="sc-btns"><button type="button" class="reg-btn reg-btn-primary" onclick="ftScAns(true)">Oui</button><button type="button" class="reg-btn" onclick="ftScAns(false)">Non</button></div></div>';
    else body = '<div class="sc-end is-' + n.t + '"><h4>' + esc(n.h) + '</h4><p>' + esc(n.d) + '</p></div>';
    box.innerHTML = (crumbs ? '<ol class="sc-trail">' + crumbs + '</ol>' : '') + body +
      '<div class="sc-actions"><button type="button" class="reg-btn" onclick="ftScBack()"' + (tPath.length ? '' : ' disabled') + '>Retour</button><button type="button" class="reg-btn" onclick="ftScReset()">Recommencer</button></div>';
  }
  function go(target) { if (typeof target === 'string') { tNode = target; } else { tNode = '__end'; TREE.__end = target; } }
  window.ftScAns = yes => { const n = TREE[tNode]; if (!n || !n.q) return; tPath.push([tNode, yes]); go(yes ? n.y : n.n); treeRender(); };
  window.ftScBack = () => { const l = tPath.pop(); if (l) { tNode = l[0]; treeRender(); } };
  window.ftScReset = () => { tPath = []; tNode = 'q0'; treeRender(); };

  const box = (x, y, w, h, t, cls) => '<g class="sc-n ' + (cls || '') + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10"/><text x="' + (x + w / 2) + '" y="' + (y + h / 2) + '" text-anchor="middle" dominant-baseline="middle">' + t.map((l, i) => '<tspan x="' + (x + w / 2) + '" dy="' + (i === 0 ? -(t.length - 1) * 0.55 + 'em' : '1.1em') + '">' + esc(l) + '</tspan>').join('') + '</text></g>';
  const arrow = (x1, y1, x2, y2, lab) => '<path class="sc-a" d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" marker-end="url(#sc-ah)"/>' + (lab ? '<text class="sc-l" x="' + ((x1 + x2) / 2 + 6) + '" y="' + ((y1 + y2) / 2 - 3) + '">' + lab + '</text>' : '');
  const defs = '<defs><marker id="sc-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>';

  function svgDemission() {
    return '<svg viewBox="0 0 760 640" role="img" aria-label="Arbre de décision démission">' + defs +
      box(230, 8, 300, 50, ['Fin de contrat par démission', 'ou abandon de poste'], 'is-start') +
      arrow(380, 58, 380, 84) +
      box(210, 84, 340, 56, ['Motif légitime ?', '(conjoint, violences, salaires…)'], 'is-q') +
      arrow(550, 112, 620, 112, 'Oui') + box(620, 84, 130, 56, ['Démission', 'légitime'], 'is-ok') +
      arrow(380, 140, 380, 176, 'Non') +
      box(210, 176, 340, 56, ['Projet professionnel ?', '(reconversion, création)'], 'is-q') +
      arrow(550, 204, 612, 204, 'Oui') + box(612, 176, 140, 56, ['CEP, Transitions Pro', '1 300 j / 60 mois ?'], 'is-q') +
      arrow(682, 232, 682, 262, 'Oui') + box(612, 262, 140, 50, ['ARE si inscrit', 'sous 6 mois'], 'is-ok') +
      arrow(380, 232, 380, 288, 'Non') +
      box(210, 288, 340, 56, ['65 jours ou 455 h travaillés', 'depuis la démission ?'], 'is-q') +
      arrow(550, 330, 620, 347) + box(620, 324, 130, 50, ['Droits ouverts', 'si conditions OK'], 'is-ok') +
      '<text class="sc-l" x="562" y="326">Oui</text>' +
      arrow(380, 344, 380, 380, 'Non') +
      box(210, 380, 340, 56, ['121 jours de chômage', 'non indemnisé écoulés ?'], 'is-q') +
      arrow(380, 436, 380, 474, 'Oui') + box(190, 474, 380, 56, ['Réexamen par l’instance paritaire', 'Avis favorable : ARE dès le 122e jour'], 'is-warn') +
      arrow(210, 408, 90, 408, 'Non') + box(10, 380, 140, 56, ['Refus à ce stade', '(non définitif)'], 'is-ko') +
      '<text class="sc-n2" x="380" y="570" text-anchor="middle">Un arrêt maladie de 21 jours ou plus prolonge les 121 jours.</text>' +
      '<text class="sc-n2" x="380" y="592" text-anchor="middle">Abandon de poste : présumé démission, même arbre de décision.</text>' +
      '</svg>';
  }
  function svgFrise() {
    return '<svg viewBox="0 0 760 270" role="img" aria-label="Frise démission non légitime">' + defs +
      '<line class="sc-axis" x1="60" y1="130" x2="720" y2="130"/>' +
      '<circle class="sc-dot" cx="60" cy="130" r="6"/><circle class="sc-dot" cx="470" cy="130" r="6"/><circle class="sc-dot" cx="690" cy="130" r="6"/>' +
      '<rect class="sc-band2" x="60" y="30" width="410" height="26" rx="8"/><text class="sc-s" x="265" y="47" text-anchor="middle">Voie 2 : 121 jours de chômage non indemnisé</text>' +
      '<rect class="sc-band" x="60" y="70" width="410" height="26" rx="8"/><text class="sc-s" x="265" y="87" text-anchor="middle">Voie 1 : 65 jours ou 455 h travaillés</text>' +
      '<text class="sc-t" x="60" y="160" text-anchor="middle">J0</text><text class="sc-s" x="60" y="178" text-anchor="middle">Démission</text>' +
      '<text class="sc-t" x="470" y="160" text-anchor="middle">J121</text><text class="sc-s" x="470" y="178" text-anchor="middle">Demande de réexamen</text>' +
      '<text class="sc-t" x="690" y="160" text-anchor="middle">J122</text><text class="sc-s" x="690" y="178" text-anchor="middle">Début de l’ARE</text><text class="sc-s" x="690" y="194" text-anchor="middle">si avis favorable</text>' +
      '<text class="sc-s" x="580" y="116" text-anchor="middle">Instance paritaire régionale</text>' +
      '<text class="sc-n2" x="580" y="215" text-anchor="middle">Examen surtout des efforts de recherche d’emploi</text>' +
      '<text class="sc-n2" x="380" y="248" text-anchor="middle">Un arrêt maladie de 21 jours ou plus prolonge le délai de 121 jours. Frise non à l’échelle.</text></svg>';
  }
  function svgProjet() {
    const steps = [['Accompagnement', 'Conseil en évolution professionnelle (CEP) agréé : Apec, Cap emploi, opérateur régional', 'Pas France Travail'], ['Dossier', 'Dépôt auprès de la commission Transitions Pro', 'Projet reconnu réel et sérieux'], ['Démission', 'Seulement après l’avis favorable de la commission', '1 300 jours travaillés sur 60 mois'], ['Inscription', 'Inscription et demande d’ARE', 'Dans les 6 mois suivant l’attestation'], ['Contrôle', 'Mise en œuvre du projet vérifiée par France Travail', 'Dans les 6 mois, sinon 4 mois de suspension']];
    return '<ol class="sc-steps" aria-label="Démission pour projet professionnel">' + steps.map((s, i) => '<li><span class="sc-num">' + (i + 1) + '</span><h4>' + esc(s[0]) + '</h4><p>' + esc(s[1]) + '</p><em>' + esc(s[2]) + '</em></li>').join('') + '</ol>';
  }
  function svgRcc() {
    return '<svg viewBox="0 0 760 270" role="img" aria-label="Rupture conventionnelle et prolongation">' + defs +
      box(10, 10, 230, 60, ['Fin de contrat à compter', 'du 01/09/2026'], 'is-start') + arrow(240, 40, 290, 40) +
      box(290, 10, 220, 60, ['Moins de 55 ans : 456 j (15 mois)', 'outre-mer : 608 j'], 'is-q') +
      box(290, 90, 220, 60, ['55 ans et plus : 624 j (20,5 mois)', 'outre-mer : 913 j'], 'is-q') +
      arrow(240, 50, 290, 118) + arrow(510, 120, 560, 120) +
      box(560, 90, 190, 60, ['Prolongation possible', '55 ans et plus'], 'is-warn') +
      '<text class="sc-t" x="380" y="190" text-anchor="middle">Calendrier de la prolongation (avenant n°2)</text>' +
      '<text class="sc-s" x="380" y="212" text-anchor="middle">60 jours avant le plafond : information de l’allocataire</text>' +
      '<text class="sc-s" x="380" y="230" text-anchor="middle">Demande possible dès l’information, jusqu’à 30 jours après le plafond</text>' +
      '<text class="sc-s" x="380" y="248" text-anchor="middle">Examen dans le mois suivant le 360e jour ; refus : instance paritaire sous 30 jours</text></svg>';
  }
  const SC = [
    ['arbre', 'Arbre de décision', () => '<p class="sc-intro">Parcours pas à pas, puis schéma complet à imprimer.</p><div id="sc-tree" class="sc-tree"></div><div class="sc-fig">' + svgDemission() + '</div>'],
    ['frise', 'Frise démission', () => '<p class="sc-intro">Démission non légitime : les deux voies pour obtenir l’ouverture de droits.</p><div class="sc-fig">' + svgFrise() + '</div>'],
    ['projet', 'Projet professionnel', () => '<p class="sc-intro">Ordre des étapes, à respecter avant de démissionner.</p><div class="sc-fig">' + svgProjet() + '</div>'],
    ['rcc', 'Rupture conventionnelle', () => '<p class="sc-intro">Plafonds de durée et prolongation pour les 55 ans et plus.</p><div class="sc-fig">' + svgRcc() + '</div>']
  ];
  let scCur = 'arbre';
  function scRender() {
    const el = $('sc-body'); if (!el) return;
    $('sc-tabs').innerHTML = SC.map(s => '<button type="button" class="rg-tab' + (s[0] === scCur ? ' is-on' : '') + '" onclick="ftScTab(\'' + s[0] + '\')">' + s[1] + '</button>').join('');
    el.innerHTML = SC.find(s => s[0] === scCur)[2]() +
      '<p class="wiz-hint">Source : fiches Unédic « Démission » et « Démission pour poursuivre un projet professionnel », avenant n°2 du 10/04/2026. Schéma d’aide à l’orientation : la réglementation fait foi.</p>';
    if (scCur === 'arbre') treeRender();
  }
  window.ftScTab = t => { scCur = t; scRender(); };
  mk('schemas', head('Schémas', 'Arbres de décision et frises pour démission, projet professionnel et rupture conventionnelle.', '<button type="button" class="reg-btn" onclick="window.print()">Imprimer</button>') +
    '<div id="sc-tabs" class="rg-tabs sc-tabs"></div><div id="sc-body"></div>');

  /* ====================== SJR ET NET ====================== */
  const SJ = { cap: { u55: 730, a55: 1095 }, interc: 0.7 };
  window.ftSjrCompute = function (p) {
    const sr = +p.sr || 0, span = +p.span || 0, emploi = Math.min(+p.emploi || 0, span);
    const inactifs = Math.max(0, span - emploi), retenus = Math.min(inactifs, SJ.interc * emploi);
    const den = emploi + retenus;
    return { sr: sr, span: span, emploi: emploi, inactifs: inactifs, retenus: retenus, den: den, sjr: den > 0 ? sr / den : 0 };
  };
  const RET = { retraite: 0.03, retraiteSeuil: 32.13, csg: 0.062, crds: 0.005, assiette: 0.9825, seuilCsg: 61, alsaceAgricole: 0.012, alsaceAutre: 0.015 };
  window.ftNetCompute = function (p) {
    const aj = +p.aj || 0, sjr = +p.sjr || 0, type = p.type || 'are';
    const retraite = Math.min(RET.retraite * sjr, Math.max(0, aj - RET.retraiteSeuil));
    let csg = 0, crds = 0, alsace = 0;
    if (type === 'are' && !p.exo) {
      const base = (aj - retraite) * RET.assiette;
      csg = base * RET.csg; crds = base * RET.crds;
      if (p.alsace === 'agricole') alsace = base * RET.alsaceAgricole; else if (p.alsace === 'autre') alsace = base * RET.alsaceAutre;
      const plafond = Math.max(0, aj - retraite - RET.seuilCsg), tot = csg + crds + alsace;
      if (tot > plafond) { const k = plafond / tot; csg *= k; crds *= k; alsace *= k; }
    }
    const cents = x => Math.round(x * 100) / 100;
    const out = { aj: aj, retraite: cents(retraite), csg: Math.floor(csg * 100) / 100, crds: cents(crds), alsace: cents(alsace) };
    out.net = cents(aj - out.retraite - out.csg - out.crds - out.alsace);
    return out;
  };
  const nIn = (id, lab, ph) => '<label>' + lab + '<input id="' + id + '" type="number" min="0" step="any" placeholder="' + (ph || '0') + '" oninput="ftSjRun()"></label>';
  mk('sjr', head('Salaire de référence et net estimé', 'Deux calculs d’appoint pour l’étude de droits : le SJR depuis l’attestation employeur, puis le net après retenues sociales.') +
    '<div class="rg-tabs sj-tabs"><button type="button" class="rg-tab is-on" data-t="sjr" onclick="ftSjTab(\'sjr\')">Salaire journalier de référence</button><button type="button" class="rg-tab" data-t="net" onclick="ftSjTab(\'net\')">Net estimé</button></div>' +
    '<div id="sj-pane-sjr" class="dl-layout"><section class="dl-form"><h3 class="dl-h">Période de référence de calcul</h3>' +
    nIn('sj-sr', 'Salaires bruts retenus sur la période (€)') +
    '<label>Âge à la fin de contrat<select id="sj-age" onchange="ftSjRun()"><option value="u55">Moins de 55 ans (730 jours maximum)</option><option value="a55">55 ans et plus (1 095 jours maximum)</option></select></label>' +
    '<label>Premier jour du plus ancien contrat<input id="sj-d1" type="date" oninput="ftSjRun()"></label>' +
    '<label>Dernier jour du dernier contrat<input id="sj-d2" type="date" oninput="ftSjRun()"></label>' +
    nIn('sj-emploi', 'Jours calendaires couverts par des contrats') +
    '<p class="wiz-hint">Hors indemnités de rupture, préavis non effectué et congés payés compensateurs. Les salaires des périodes de suspension indemnisées (maladie, maternité, activité partielle…) sont reconstitués par France Travail : à ajouter au total saisi.</p></section>' +
    '<section id="sj-out" class="dl-result"></section></div>' +
    '<div id="sj-pane-net" class="dl-layout" hidden><section class="dl-form"><h3 class="dl-h">Allocation</h3>' + nIn('sj-aj', 'Allocation journalière brute (€)') + nIn('sj-sjr', 'Salaire journalier de référence (€)') +
    '<label>Type d’allocation<select id="sj-type" onchange="ftSjRun()"><option value="are">ARE</option><option value="aref">ARE-F ou ASP (retraite complémentaire seule)</option></select></label>' +
    '<label>Régime local<select id="sj-alsace" onchange="ftSjRun()"><option value="">Aucun</option><option value="autre">Alsace-Moselle (1,50 %)</option><option value="agricole">Alsace-Moselle, salarié agricole (1,20 %)</option></select></label>' +
    '<label class="dl-check"><input id="sj-exo" type="checkbox" onchange="ftSjRun()"> Exonéré de CSG et CRDS (revenu fiscal sous le seuil)</label>' +
    '<p class="wiz-hint">Mayotte non géré. Le prélèvement à la source de l’impôt n’est pas calculé.</p></section><section id="sj-nout" class="dl-result"></section></div>');
  let sjTab = 'sjr';
  window.ftSjTab = t => { sjTab = t; $('sj-pane-sjr').hidden = t !== 'sjr'; $('sj-pane-net').hidden = t !== 'net'; document.querySelectorAll('.sj-tabs .rg-tab').forEach(b => b.classList.toggle('is-on', b.dataset.t === t)); ftSjRun(); };
  const days = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000) + 1;
  window.ftSjRun = function () {
    const v = id => parseFloat(($(id) || {}).value) || 0;
    if (sjTab === 'sjr') {
      const d1 = $('sj-d1').value, d2 = $('sj-d2').value, cap = SJ.cap[$('sj-age').value];
      const span = d1 && d2 && d2 >= d1 ? days(d1, d2) : 0;
      const r = ftSjrCompute({ sr: v('sj-sr'), span: span, emploi: v('sj-emploi') || span });
      let warn = '';
      if (span > cap) warn += wizAlert('warn', 'La période dépasse ' + cap + ' jours : la période de référence de calcul est limitée à ' + cap + ' jours calendaires. Ajustez la date de début.');
      if (v('sj-emploi') > span && span) warn += wizAlert('warn', 'Les jours de contrat dépassent la durée de la période.');
      $('sj-out').innerHTML = !r.sr || !span ? '<p class="wiz-hint">Renseignez les salaires et les dates.</p>' :
        '<div class="wiz-hero is-ok"><span>Salaire journalier de référence estimé</span><strong>' + fmt(r.sjr) + ' €</strong></div>' + warn +
        '<div class="rg-calc"><div class="rg-row"><div class="rg-k">Durée de la période</div><div class="rg-f">' + r.span + ' jours calendaires</div></div>' +
        '<div class="rg-row"><div class="rg-k">Jours d’emploi</div><div class="rg-f">' + r.emploi + ' jours</div></div>' +
        '<div class="rg-row"><div class="rg-k">Jours sans emploi</div><div class="rg-f">' + r.inactifs + ' jours, retenus dans la limite de 70 % des jours d’emploi : ' + fmt(r.retenus, 1) + '</div></div>' +
        '<div class="rg-row"><div class="rg-k">Dénominateur</div><div class="rg-f">' + fmt(r.den, 1) + ' jours</div><div class="rg-e">SJR = ' + fmt(r.sr) + ' ÷ ' + fmt(r.den, 1) + '</div></div></div>' +
        '<p class="wiz-hint">Calcul d’après la fiche Unédic « Salaire de référence ». L’attestation employeur et le règlement font foi.</p>' +
        '<div class="wiz-actions"><button type="button" class="reg-btn" onclick="ftSjUse()">Utiliser ce SJR dans le simulateur</button><button type="button" class="reg-btn" onclick="ftSjCopy()">Copier</button></div>';
      window.__sjr = r;
    } else {
      const aj = v('sj-aj'), sjr = v('sj-sjr');
      const r = ftNetCompute({ aj: aj, sjr: sjr, type: $('sj-type').value, alsace: $('sj-alsace').value, exo: $('sj-exo').checked });
      $('sj-nout').innerHTML = !aj ? '<p class="wiz-hint">Saisissez l’allocation journalière brute et le SJR.</p>' :
        '<div class="wiz-hero is-ok"><span>Allocation nette estimée</span><strong>' + fmt(r.net) + ' € / jour</strong></div>' +
        '<div class="rg-calc"><div class="rg-row"><div class="rg-k">Brute</div><div class="rg-f">' + fmt(r.aj) + ' €</div></div>' +
        '<div class="rg-row"><div class="rg-k">Retraite complémentaire</div><div class="rg-f">− ' + fmt(r.retraite) + ' € (3 % du SJR)</div></div>' +
        '<div class="rg-row"><div class="rg-k">CSG</div><div class="rg-f">− ' + fmt(r.csg) + ' € (6,2 %)</div></div>' +
        '<div class="rg-row"><div class="rg-k">CRDS</div><div class="rg-f">− ' + fmt(r.crds) + ' € (0,5 %)</div></div>' +
        (r.alsace ? '<div class="rg-row"><div class="rg-k">Alsace-Moselle</div><div class="rg-f">− ' + fmt(r.alsace) + ' €</div></div>' : '') +
        '<div class="rg-row"><div class="rg-k">Net mensuel (30 jours)</div><div class="rg-f">' + fmt(r.net * 30) + ' €</div></div></div>' +
        wizAlert('info', 'Estimation à ± 0,02 €/jour (arrondis). À confirmer : base exacte de la CSG et application du seuil de 61 € (voir la page Sources et vérification).');
    }
  };
  window.ftSjUse = () => { const r = window.__sjr; if (!r || !r.sjr) return; const e = $('sim-sjr-att'); if (e) { e.value = r.sjr.toFixed(2); e.dispatchEvent(new Event('input', { bubbles: true })); } switchNavTab('1'); showToast('SJR repris dans le simulateur', 'success'); };
  window.ftSjCopy = () => { const r = window.__sjr; if (!r) return; copyToClipboard('Salaire de référence ' + fmt(r.sr) + ' € ÷ ' + fmt(r.den, 1) + ' jours = SJR estimé ' + fmt(r.sjr) + ' €'); showToast('Calcul copié', 'success'); };

  /* ====================== Navigation ====================== */
  NAV_TABS_CONFIG.push({ id: 'schemas', name: 'Schémas', desc: 'Arbres de décision et frises : démission, projet professionnel, rupture conventionnelle', icon: 'git-branch', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', badge: 'Schémas' });
  NAV_TABS_CONFIG.push({ id: 'sjr', name: 'SJR et net', desc: 'Salaire journalier de référence et allocation nette estimée', icon: 'calculator', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', badge: 'Calcul' });
  FT_KW.schemas = 'schéma arbre décision démission frise projet professionnel rupture conventionnelle prolongation abandon de poste organigramme';
  FT_KW.sjr = 'salaire journalier référence sjr net retenues csg crds retraite complémentaire attestation employeur brut net';
  const _sw = switchNavTab;
  switchNavTab = function (t) {
    _sw(t);
    ['schemas', 'sjr'].forEach(id => { const vv = $('view-' + id); if (vv) vv.classList.toggle('hidden', String(t) !== id); });
    if (String(t) === 'schemas') { scRender(); const n = $('header-active-tab-name'); if (n) n.textContent = 'Schémas'; refreshIcons(); }
    if (String(t) === 'sjr') { ftSjRun(); const n = $('header-active-tab-name'); if (n) n.textContent = 'Salaire de référence et net'; }
  };
})();
