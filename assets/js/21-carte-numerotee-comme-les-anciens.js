(function () {
  const $ = id => document.getElementById(id);
  const eur = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  const e0 = n => (+n || 0).toLocaleString('fr-FR') + ' €';
  const BB = () => BAREME;
  const num = id => { const e = $(id); return e ? parseFloat(String(e.value).replace(',', '.')) || 0 : 0; };
  const val = id => { const e = $(id); return e ? e.value : ''; };
  const fdate = d => d ? d.toLocaleDateString('fr-FR') : '';
  const pdate = s => { if (!s) return null; const d = new Date(s + 'T12:00:00'); return isNaN(d) ? null : d; };
  const src = (t, u) => '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + t + '</a>';
  const ICO = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    ko: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'
  };
  const PILL = { ok: 'bg-emerald-500/20 text-emerald-300', ko: 'bg-rose-500/20 text-rose-300', wa: 'bg-amber-500/20 text-amber-300' };
  /* Carte numérotée, comme les anciens simulateurs */
  const sec = (n, title, body, ref) => '<div class="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3"><div class="flex items-center justify-between pb-2 border-b border-slate-800"><span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><div class="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">' + n + '</div>' + title + '</span>' + (ref ? '<span class="text-[10px] font-mono text-cyan-400 text-right">' + ref + '</span>' : '') + '</div>' + body + '</div>';
  const field = (label, ctl) => '<div><label class="block text-[11px] font-medium text-slate-300 mb-1">' + label + '</label>' + ctl + '</div>';
  const IN = 'w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none font-medium';
  const inp = (id, type, ph, extra) => '<input id="' + id + '" type="' + type + '" class="' + IN + '"' + (ph ? ' placeholder="' + ph + '"' : '') + (extra || '') + '>';
  const sel = (id, opts) => '<select id="' + id + '" class="' + IN + '">' + opts.map(o => '<option value="' + o[0] + '"' + (o[2] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>';
  const grid = inner => '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">' + inner + '</div>';
  /* Ligne de condition avec pastille d’état */
  const chk = (st, txt, sub, badge) => '<div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-3"><div class="flex items-center gap-2">' + ICO[st] + '<div><span class="font-bold text-white block text-[11px]">' + txt + '</span>' + (sub ? '<span class="text-[10px] text-slate-400 block mt-0.5">' + sub + '</span>' : '') + '</div></div><span class="font-mono text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ' + PILL[st] + '">' + (badge || (st === 'ok' ? 'Rempli' : st === 'ko' ? 'Non rempli' : 'À vérifier')) + '</span></div>';
  const conds = rows => '<div class="space-y-2.5 text-xs">' + rows.join('') + '</div>';
  /* Bandeau de verdict */
  const VC = {
    ok: ['from-emerald-950/40 border-emerald-500/40', 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', 'text-emerald-300'],
    ko: ['from-rose-950/40 border-rose-500/40', 'bg-rose-500/20 text-rose-300 border border-rose-500/30', 'text-rose-300'],
    wa: ['from-amber-950/40 border-amber-500/40', 'bg-amber-500/20 text-amber-300 border border-amber-500/30', 'text-amber-300'],
    nd: ['from-slate-900 border-slate-800 fr-nd', 'bg-slate-800 text-slate-300 border border-slate-700', 'text-white']
  };
  const verdict = (st, pill, title, desc, ref) => '<div class="rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br via-slate-900 to-slate-950 ' + VC[st][0] + '"><div class="flex items-center justify-between"><span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ' + VC[st][1] + '">' + pill + '</span><span class="text-xs text-slate-400 font-mono">' + (ref || '') + '</span></div><h4 class="text-base font-extrabold leading-tight ' + VC[st][2] + '">' + title + '</h4>' + (desc ? '<p class="text-xs text-slate-300 leading-relaxed">' + desc + '</p>' : '') + '</div>';
  /* Tuiles chiffrées et lignes de détail */
  const tiles = arr => '<div class="grid grid-cols-2 gap-2 text-center">' + arr.map(t => '<div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800"><span class="block text-[10px] text-slate-400 uppercase font-semibold">' + t[0] + '</span><span class="text-lg font-black ' + (t[3] || 'text-white') + '">' + t[1] + '</span>' + (t[2] ? '<span class="block text-[9px] text-cyan-400 font-mono mt-0.5">' + t[2] + '</span>' : '') + '</div>').join('') + '</div>';
  const rows = arr => '<div class="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs">' + arr.map(r => '<div class="flex items-center justify-between gap-3 text-slate-300 text-[11px]"><span>' + r[0] + '</span><span class="font-mono font-bold text-right ' + (r[2] || 'text-white') + '">' + r[1] + '</span></div>').join('') + '</div>';
  const note = t => '<p class="text-[10px] text-slate-400 leading-relaxed">' + t + '</p>';
  const resCard = (title, ref, inner) => sec('✓', title, inner, ref).replace('bg-indigo-500/20 text-indigo-400', 'bg-cyan-500/20 text-cyan-400');
  const cols = (left, right) => '<div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5"><div class="lg:col-span-6 space-y-4">' + left + '</div><div class="lg:col-span-6 space-y-4">' + right + '</div></div>';
  const mailPanel = key => '<section class="ft-mail" data-mail="' + key + '"><div class="ft-mail-h"><h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>Mail à l’allocataire</h3><span class="ft-mail-tag">Généré automatiquement, modifiable avant copie</span><div class="ft-mail-btns"><button type="button" class="ft-mail-copy">Copier le mail</button></div></div><div class="ft-mail-body"><textarea aria-label="Mail à l’allocataire" spellcheck="true"></textarea></div></section>';
  const setMail = (key, txt) => { const ta = document.querySelector('.ft-mail[data-mail="' + key + '"] textarea'); if (ta && !ta.dataset.edited) { ta.value = txt; try { window.ftMailFit && window.ftMailFit(ta); } catch (e) {} } };
  document.addEventListener('input', e => { if (e.target.matches && e.target.matches('.fr-view .ft-mail textarea')) e.target.dataset.edited = '1'; });
  const U = {
    ati: 'https://www.unedic.org/indemnisation/fiches-thematiques/allocation-des-travailleurs-independants-ati',
    aref: 'https://www.unedic.org/la-reglementation/fiches-thematiques/allocation-daide-au-retour-lemploi-formation-are-f',
    rff: 'https://www.francetravail.fr/candidat/en-formation/les-dispositifs/la-remuneration-de-fin-de-format.html',
    indu: 'https://www.francetravail.fr/candidat/vos-droits-et-demarches/vos-demarches-aupres-de-pole-emp/les-allocations-ou-prestations-t.html',
    justice: 'https://www.justice.fr/fiche/france-travail-demander-remboursement-sommes-versees-tort-percu',
    ce: 'https://www.conseil-etat.fr/fr/arianeweb/CE/decision/2026-09-21/506563',
    inter: 'https://www.francetravail.fr/spectacle/spectacle--intermittents/devenir-intermittent.html',
    option: 'https://www.francetravail.fr/spectacle/spectacle--intermittents/spectacle-droit-d-option.html'
  };

  /* ---------- Calculs (testés dans « Sources et vérification ») ---------- */
  window.ftAtiCompute = function (p) {
    const n1 = +p.n1 || 0, n2 = +p.n2 || 0, sum = n1 + n2;
    const moisMoyen = sum / 24;
    const A = BAREME.ati;
    const jour = Math.min(A.forfait, Math.max(A.plancher, Math.round(moisMoyen * 12 / 365 * 100) / 100));
    return { sum: sum, moisMoyen: moisMoyen, unAn: Math.max(n1, n2) >= A.seuilRevenus, moyenne: sum >= 2 * A.seuilRevenus, jour: jour, mois30: Math.round(jour * 30 * 100) / 100, total: Math.round(jour * A.duree * 100) / 100 };
  };
  window.ftPrescription = function (p) {
    const v = pdate(p.versement), n = pdate(p.notif) || new Date(); if (!v) return null;
    const ans = p.fraude ? BAREME.indu.prescriptionFraude : BAREME.indu.prescription;
    const lim = new Date(v); lim.setFullYear(lim.getFullYear() + ans);
    const seuil = new Date(n); seuil.setFullYear(seuil.getFullYear() - ans);
    return { ans: ans, limite: lim, seuil: seuil, prescrit: n > lim, petit: (+p.montant || 0) > 0 && (+p.montant || 0) < BAREME.indu.seuilRecup };
  };
  window.ftRffCompute = function (p) {
    const fd = pdate(p.finDroits), ff = pdate(p.finForm); const aj = +p.aj || 0;
    const mens = Math.min(BAREME.rff.plafondMensuel, Math.round(aj * 30 * 100) / 100);
    if (!fd || !ff) return { mens: mens };
    const jours = Math.max(0, Math.round((ff - fd) / 864e5));
    return { mens: mens, jours: jours, besoin: ff > fd };
  };

  /* ---------- ATI ---------- */
  /* ---------- Allocation de solidarité spécifique (ASS) et ATA ---------- */
  window.ftAssCompute = function (p) {
    const S = BAREME.solidarite, j = p.mayotte ? S.assMayotte : S.ass;
    const plafond = Math.round((p.couple ? S.coefCouple : S.coefSeul) * j * 100) / 100;
    const max = Math.round(30 * j * 100) / 100, res = Math.max(0, +p.ressources || 0);
    let du = Math.round(Math.min(max, plafond - res) * 100) / 100;
    const sousJour = du > 0 && du < j;
    if (du <= 0 || sousJour) du = 0;
    return { j, plafond, max, du, jour: Math.round(du / 30 * 100) / 100, tauxPlein: res <= plafond - max, sousJour, seuilPlein: Math.round((plafond - max) * 100) / 100 };
  };
  function assSim() {
    return cols(
      sec('1', 'Fin de droits et activité antérieure', grid(
        field('Situation au regard de l’ARE', sel('ass-are', [['fin', 'Droits ARE épuisés (ou RFF terminée)'], ['50', '50 ans ou plus, encore indemnisé : option pour l’ASS'], ['non', 'Droits ARE encore ouverts (moins de 50 ans)']])) +
        field('Années d’activité salariée dans les 10 ans avant la fin du contrat', inp('ass-ans', 'number', 'Ex. 6', ' min="0" max="10" step="0.5" inputmode="decimal"')) +
        field('Enfants élevés (activité interrompue pour les élever)', sel('ass-enf', [['0', 'Aucun'], ['1', '1 enfant'], ['2', '2 enfants'], ['3', '3 enfants ou plus']])) +
        field('Recherche effective d’emploi, aptitude et résidence en France', sel('ass-rech', [['oui', 'Oui'], ['non', 'Non']]))), '5 ans sur 10') +
      sec('2', 'Ressources du foyer', grid(
        field('Situation familiale', sel('ass-fam', [['seul', 'Personne seule'], ['couple', 'En couple (marié, pacsé, concubin)']])) +
        field('Lieu de résidence', sel('ass-zone', [['metro', 'Métropole et DOM'], ['mayotte', 'Mayotte']])) +
        field('Ressources mensuelles moyennes du foyer sur 12 mois (€)', inp('ass-res', 'number', 'Ex. 900', ' min="0" step="1" inputmode="decimal"'))) +
        note('Moyenne des 12 mois avant la demande, pour tout le foyer. Exclus : prestations familiales, aides au logement, pension alimentaire versée, allocation chômage précédemment perçue. Inclus : autres revenus du foyer, pension alimentaire reçue.'), 'Plafond = ' + BB().solidarite.coefSeul + ' ou ' + BB().solidarite.coefCouple + ' × montant journalier'),
      '<div id="ass-res-out" class="space-y-4"></div>' + mailPanel('ass'));
  }
  function assRun() {
    const zone = val('ass-zone'), r = ftAssCompute({ couple: val('ass-fam') === 'couple', ressources: num('ass-res'), mayotte: zone === 'mayotte' });
    const req = Math.max(2, 5 - (+val('ass-enf') || 0)), ans = num('ass-ans'), has = $('ass-ans') && $('ass-ans').value !== '';
    const are = val('ass-are');
    const c = [
      [are === 'non' ? 'ko' : 'ok', '1. Fin des droits à l’ARE', are === 'fin' ? 'Droits épuisés' : are === '50' ? 'Option possible à partir de 50 ans' : 'Les droits ARE doivent d’abord être épuisés'],
      [!has ? 'wa' : ans >= req ? 'ok' : 'ko', '2. ' + req + ' ans d’activité salariée sur 10 ans', (req < 5 ? 'Réduit d’un an par enfant élevé (3 ans maximum). ' : '') + (has ? ans + ' an(s) déclaré(s)' : 'Durée à saisir')],
      [val('ass-rech') === 'oui' ? 'ok' : 'ko', '3. Recherche d’emploi, aptitude, résidence', ''],
      [r.du > 0 ? 'ok' : 'ko', '4. Ressources sous le plafond', 'Plafond ' + eur(r.plafond) + ' par mois' + (r.sousJour ? ' : montant calculé inférieur au montant journalier, non versé' : '')]
    ];
    const ko = c.some(x => x[0] === 'ko'), wa = c.some(x => x[0] === 'wa');
    $('ass-res-out').innerHTML = verdict(ko ? 'ko' : wa ? 'wa' : 'ok', ko ? 'ASS non attribuable' : wa ? 'À confirmer' : r.tauxPlein ? 'Taux plein' : 'Taux réduit', ko ? 'CONDITIONS DE L’ASS NON REMPLIES' : wa ? 'ÉLIGIBILITÉ À CONFIRMER' : 'ALLOCATION DE SOLIDARITÉ SPÉCIFIQUE', ko ? 'Au moins une condition manque : voir le détail ci-dessous.' : 'Attribuée par périodes de 6 mois renouvelables, à demander dans l’espace personnel.', 'Montants au ' + BB().solidarite.effet) +
      sec('✓', 'Conditions', conds(c.map(x => chk(x[0], x[1], x[2]))), 'France Travail') +
      sec('€', 'Montant de l’ASS', tiles([['ASS mensuelle (30 j)', eur(r.du), r.tauxPlein ? 'Taux plein' : r.du ? 'Plafond − ressources' : 'Non versée', 'text-cyan-300'], ['Montant journalier', eur(r.du ? r.jour : 0), 'Taux plein : ' + eur(r.j), 'text-white']]) +
        rows([['Plafond de ressources du foyer', eur(r.plafond)], ['Taux plein si ressources jusqu’à', eur(r.seuilPlein)], ['Ressources déclarées', eur(num('ass-res'))], ['Allocation versée', eur(r.du), 'text-emerald-400']]) +
        note('L’ASS est différentielle : plafond − ressources, sans dépasser 30 × ' + eur(r.j) + '. Non versée si le résultat est inférieur au montant journalier. Non imposable.'), zone === 'mayotte' ? 'Mayotte' : 'Métropole et DOM');
    setMail('ass', ko ? '' : 'Votre demande d’allocation de solidarité spécifique (ASS) a été étudiée.\n\nAu vu des ressources déclarées pour votre foyer (' + eur(num('ass-res')) + ' par mois en moyenne), votre allocation s’élèverait à ' + eur(r.du) + ' pour un mois de 30 jours' + (r.tauxPlein ? ', soit le taux plein' : '') + '.\n\nL’ASS est attribuée pour 6 mois, renouvelables. Pensez à faire votre demande de renouvellement depuis votre espace personnel, environ un mois avant la fin de la période.\n\nSi vous reprenez une activité, vous pouvez cumuler intégralement votre salaire et l’ASS pendant 3 mois (tout mois travaillé, même partiellement, compte). Au-delà, si l’activité se poursuit, le versement de l’ASS s’interrompt et vous pourrez vous orienter vers la prime d’activité auprès de la CAF ou de la MSA.\n\nPensez à déclarer tout changement de situation ou de ressources.');
  }
  function assRegles() {
    const S = BB().solidarite;
    return cols(
      sec('1', 'Conditions d’attribution', '<ul class="fr-ul"><li>Avoir <b>épuisé ses droits à l’ARE</b> (ou à la RFF). À partir de <b>50 ans</b>, un allocataire de l’ARE peut opter pour l’ASS avant la fin de ses droits.</li><li><b>5 ans d’activité salariée</b> (temps plein ou partiel) dans les <b>10 ans</b> précédant la fin du dernier contrat ; <b>réduits d’1 an par enfant</b> élevé, dans la limite de 3 ans. Service national et formation professionnelle comptent.</li><li>Être apte au travail, rechercher effectivement un emploi et résider en France.</li><li>Ressources du foyer sous le plafond.</li></ul>', 'service-public.fr') +
      sec('2', 'Montant et plafonds au ' + S.effet, '<ul class="fr-ul"><li>Montant journalier : <b>' + eur(S.ass) + '</b>, soit <b>' + eur(30 * S.ass) + '</b> pour 30 jours (' + eur(S.assMayotte) + ' par jour à Mayotte).</li><li>Plafond de ressources : <b>' + eur(S.coefSeul * S.ass) + '</b> par mois pour une personne seule (' + S.coefSeul + ' × montant journalier), <b>' + eur(S.coefCouple * S.ass) + '</b> pour un couple (' + S.coefCouple + ' ×).</li><li>Montant versé = plafond − ressources mensuelles, dans la limite du taux plein ; non versé si le résultat est inférieur au montant journalier.</li><li>Ressources : moyenne des 12 mois avant la demande, pour tout le foyer ; prestations familiales, aides au logement et pension alimentaire versée exclues.</li></ul>', 'Décret 2026-219'),
      sec('3', 'Durée, renouvellement et cumul', '<ul class="fr-ul"><li>Attribuée par <b>périodes de 6 mois</b>, renouvelables sans limite tant que les conditions sont remplies ; renouvellement dans l’espace personnel.</li><li>Reprise d’activité : <b>cumul intégral pendant 3 mois</b>, consécutifs ou non ; tout mois civil travaillé, même partiellement, est décompté. Si l’activité se poursuit ensuite, l’ASS est interrompue (relais possible par la prime d’activité). Nouvelle période de cumul après 3 mois civils consécutifs sans activité.</li><li>Cumul ASS et AAH : il prend fin le <b>1er janvier 2027</b> pour les derniers bénéficiaires concernés.</li></ul>', 'Décret 2017-826') +
      sec('4', 'Allocation temporaire d’attente (ATA)', '<ul class="fr-ul"><li><b>Plus aucune ouverture de droit depuis le 1er septembre 2017.</b> Seules les personnes qui la percevaient à cette date continuent à la recevoir, jusqu’à expiration de leurs droits.</li><li>Montant journalier au ' + S.effet + ' : <b>' + eur(S.ata) + '</b>, soit ' + eur(30 * S.ata) + ' pour 30 jours.</li><li>Pour les demandeurs d’asile, l’allocation applicable est l’ADA, versée par l’OFII.</li></ul>', 'France Travail') +
      '<div class="fr-src">Sources : ' + src('France Travail : ASS', 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/aides-financieres-et-autres-allo/autres-allocations/lallocation-de-solidarite-specif.html') + ' · ' + src('service-public.fr F12484', 'https://www.service-public.gouv.fr/particuliers/vosdroits/F12484') + ' · ' + src('France Travail : ATA', 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/aides-financieres-et-autres-allo/autres-allocations/lallocation-temporaire-dattente.html') + '</div>');
  }
  function atiSim() {
    return cols(
      sec('1', 'Revenus de l’activité perdue', grid(field('Revenus déclarés, année N-1 (€)', inp('ati-n1', 'number', 'Ex. 12000', ' min="0" step="1" inputmode="decimal"')) + field('Revenus déclarés, année N-2 (€)', inp('ati-n2', 'number', 'Ex. 9000', ' min="0" step="1" inputmode="decimal"'))), 'Seuil ' + e0(BB().ati.seuilRevenus) + '') +
      sec('2', 'Activité et cessation', '<div class="grid grid-cols-1 gap-3 text-xs">' +
        field('Activité non salariée sans interruption', sel('ati-2ans', [['oui', '2 ans ou plus, même entreprise'], ['non', 'Moins de 2 ans, ou mise en sommeil']])) +
        field('Motif de la cessation', sel('ati-motif', [['lj', 'Liquidation judiciaire'], ['rj', 'Redressement judiciaire, dirigeant remplacé'], ['nv', 'Activité non viable (baisse ≥ 30 % attestée)'], ['simple', 'Simple cessation d’activité']])) + '</div>', 'Cessation involontaire') +
      sec('3', 'Autres conditions', grid(
        field('Ressources des 12 derniers mois', sel('ati-rsa', [['oui', 'Inférieures au RSA'], ['non', 'Égales ou supérieures au RSA']])) +
        field('Inscription à France Travail', sel('ati-12m', [['oui', 'Dans les 12 mois'], ['non', 'Plus de 12 mois après']])) +
        field('ATI perçue dans les 5 dernières années', sel('ati-5a', [['non', 'Non'], ['oui', 'Oui']]))), 'Conditions cumulatives'),
      '<div id="ati-res" class="space-y-4"></div>' + mailPanel('ati'));
  }
  function atiRun() {
    const r = ftAtiCompute({ n1: num('ati-n1'), n2: num('ati-n2') });
    const has = num('ati-n1') || num('ati-n2');
    const m = val('ati-motif');
    const c = [
      [val('ati-2ans') === 'oui' ? 'ok' : 'ko', '1. Deux ans d’activité non salariée', 'Sans interruption, dans la même entreprise'],
      [m === 'simple' ? 'ko' : 'ok', '2. Cessation involontaire et définitive', m === 'simple' ? 'Une simple cessation n’ouvre pas droit à l’ATI' : $('ati-motif').selectedOptions[0].text],
      [!has ? 'wa' : r.unAn && r.moyenne ? 'ok' : r.unAn ? 'wa' : 'ko', '3. Revenus d’au moins ' + e0(BB().ati.seuilRevenus) + '', !has ? 'Revenus à saisir' : r.unAn && r.moyenne ? 'Seuil atteint' : r.unAn ? 'Atteint sur une année, moyenne inférieure : à faire vérifier' : 'Inférieurs sur chacune des deux années'],
      [val('ati-rsa') === 'oui' ? 'ok' : 'ko', '4. Ressources inférieures au RSA', 'Revenus du conjoint non pris en compte'],
      [val('ati-12m') === 'oui' ? 'ok' : 'ko', '5. Inscription dans les 12 mois', 'Suivant la cessation d’activité'],
      [val('ati-5a') === 'non' ? 'ok' : 'ko', '6. Une seule ATI tous les 5 ans', '']
    ];
    const ko = c.some(x => x[0] === 'ko'), wa = c.some(x => x[0] === 'wa');
    $('ati-res').innerHTML = verdict(ko ? 'ko' : wa ? 'wa' : 'ok', ko ? 'ATI refusée' : wa ? 'À confirmer' : 'ATI accordée', ko ? 'CONDITIONS DE L’ATI NON REMPLIES' : wa ? 'ÉLIGIBILITÉ À CONFIRMER' : 'ALLOCATION DES TRAVAILLEURS INDÉPENDANTS ACCORDÉE', ko ? 'Au moins une condition cumulative manque : voir le détail ci-dessous.' : 'Versée ' + BB().ati.duree + ' jours à compter de l’inscription, sans différé ni délai d’attente.', 'Code du travail, L. 5424-25') +
      sec('✓', 'Conditions cumulatives', conds(c.map(x => chk(x[0], x[1], x[2]))), 'Unédic') +
      (has ? sec('€', 'Montant de l’ATI', tiles([['ATI journalière', eur(r.jour), 'Plancher ' + eur(BB().ati.plancher) + ' · plafond ' + eur(BB().ati.forfait) + '', 'text-cyan-300'], ['Sur 30 jours', eur(r.mois30), 'Mensualisation', 'text-white']]) +
        rows([['Revenu mensuel moyen (N-1 + N-2) ÷ 24', eur(r.moisMoyen)], ['Durée maximale', '' + BB().ati.duree + ' jours'], ['Total sur la durée maximale', eur(r.total), 'text-emerald-400']]) +
        note('Forfait ramené au revenu mensuel moyen s’il est plus bas (montants hors Mayotte). Soumise à CSG, CRDS et impôt.'), 'Montants 2026') : '');
    setMail('ati', ko || !has ? '' : 'Votre demande d’allocation des travailleurs indépendants (ATI) a été étudiée.\n\nAu vu des éléments transmis, votre allocation s’élèverait à ' + eur(r.jour) + ' par jour, soit environ ' + eur(r.mois30) + ' pour un mois de 30 jours. Elle est versée pendant ' + BB().ati.duree + ' jours au maximum, à compter de votre inscription, sans différé ni délai d’attente.\n\nPendant cette période, vous pouvez reprendre une activité : l’ATI se cumule intégralement avec vos revenus pendant 3 mois au plus. Au-delà, elle est suspendue.' + (wa ? '\n\nUn justificatif complémentaire sur vos revenus des deux dernières années pourra vous être demandé.' : '') + '\n\nL’ATI est soumise à la CSG, à la CRDS et à l’impôt sur le revenu.');
  }
  function atiRegles() {
    return cols(
      sec('1', 'Conditions (cumulatives)', '<ul class="fr-ul"><li><b>2 ans</b> d’activité non salariée sans interruption dans la même entreprise (extrait Kbis).</li><li>Cessation <b>involontaire et définitive</b> : liquidation judiciaire, redressement judiciaire avec remplacement du dirigeant, ou activité non viable (déclaration de cessation et attestation d’un tiers de confiance montrant une baisse d’au moins 30 % des revenus). Une simple cessation ne suffit pas.</li><li>Revenus d’au moins <b>' + e0(BB().ati.seuilRevenus) + '</b> (7 500 € à Mayotte) sur l’une des deux années précédant la cessation, selon les déclarations fiscales.</li><li>Ressources personnelles <b>inférieures au RSA</b> sur les 12 mois précédant la demande, hors revenus de l’activité perdue ; ceux du conjoint ne comptent pas.</li><li>Inscription dans les <b>12 mois</b> suivant la cessation ; aptitude au travail, résidence en France, pas de retraite à taux plein ; une seule ATI tous les <b>5 ans</b>.</li></ul>', src('Unédic, fiche ATI', U.ati) + ' (mise à jour du 13/10/2026)'),
      sec('2', 'Montant et durée', '<ul class="fr-ul"><li>Forfait de <b>' + eur(BB().ati.forfait) + ' par jour</b> (environ 800 € par mois), ' + eur(BB().ati.forfaitMayotte) + ' à Mayotte.</li><li>Si le revenu mensuel moyen (revenus des 2 années fiscales ÷ 24) est plus bas, l’ATI est ramenée à cette moyenne, sans descendre sous <b>' + eur(BB().ati.plancher) + ' par jour</b> (environ 600 € par mois ; ' + eur(BB().ati.plancherMayotte) + ' à Mayotte).</li><li>Versée pendant <b>' + BB().ati.duree + ' jours</b> à compter de l’inscription, <b>sans différé ni délai d’attente</b>. Soumise à CSG, CRDS et impôt.</li></ul>', src('Unédic, fiche ATI', U.ati)) +
      sec('3', 'Cumuls', '<ul class="fr-ul"><li><b>Activité :</b> cumul intégral pendant 3 mois au plus, consécutifs ou non ; au-delà, l’ATI est suspendue et ne reprend qu’après au moins 3 mois d’arrêt de cette activité.</li><li><b>ARE :</b> pas de cumul. L’ARE est examinée d’abord ; si elle est plus faible ou plus courte, l’indépendant peut choisir l’ATI dans les 30 jours (choix définitif, ARE retenue sans réponse).</li><li><b>ASS :</b> pas de cumul ; l’ASS suspendue reprend à la fin de l’ATI si son terme n’est pas échu.</li></ul>', src('Unédic, fiche ATI', U.ati)) );
  }

  /* ---------- Formation : AREF et RFF ---------- */
  function arefSim() {
    return cols(
      sec('1', 'Allocation en formation', grid(field('Allocation journalière AREF brute (€)', inp('rff-aj', 'number', 'Ex. 38,50', ' min="0" step="0.01" inputmode="decimal"')) + field('Formation éligible à la RFF', sel('rff-elig', [['oui', 'Oui, inscrite au contrat d’engagement'], ['non', 'Non ou à vérifier']]))), 'Plancher ' + eur(BB().are.formation) + '') +
      sec('2', 'Calendrier', grid(field('Fin des droits AREF', inp('rff-fd', 'date')) + field('Fin de la formation', inp('rff-ff', 'date'))), 'Dates du dossier'),
      '<div id="rff-res" class="space-y-4"></div>' + mailPanel('aref'));
  }
  function arefRun() {
    const aj = num('rff-aj'), r = ftRffCompute({ aj: aj, finDroits: val('rff-fd'), finForm: val('rff-ff') });
    const fd = pdate(val('rff-fd')), ff = pdate(val('rff-ff')), ok = val('rff-elig') === 'oui';
    const aj22 = aj ? Math.max(aj, BAREME.are.formation) : 0;
    const rffM = aj ? Math.min(BAREME.rff.plafondMensuel, Math.round(aj22 * 30 * 100) / 100) : 0;
    let h = !(fd && ff) ? verdict('nd', 'En attente', 'SAISISSEZ LES DEUX DATES', 'Fin des droits AREF et fin de la formation.', 'ARE-F')
      : r.besoin ? verdict(ok ? 'wa' : 'ko', ok ? 'RFF à demander' : 'À vérifier', 'LES DROITS S’ARRÊTENT AVANT LA FIN DE LA FORMATION', ok ? 'La rémunération de fin de formation peut prendre le relais jusqu’au ' + fdate(ff) + '.' : 'La RFF suppose une formation éligible inscrite au contrat d’engagement : à vérifier avant d’informer l’allocataire.', 'RFF')
      : verdict('ok', 'Couverture complète', 'LES DROITS COUVRENT TOUTE LA FORMATION', 'L’ARE reprend ensuite dans la limite des droits restants.', 'ARE-F');
    h += sec('€', 'Montants et période', tiles([['AREF journalière', aj ? eur(aj22) : '—', 'Plancher ' + eur(BB().are.formation) + '', 'text-cyan-300'], ['RFF mensuelle', r.besoin && aj ? eur(rffM) : '—', 'Dernière AREF × 30, plafond ' + eur(BB().rff.plafondMensuel) + '', 'text-amber-300']]) +
      (r.besoin ? rows([['Période à couvrir après les droits', r.jours + ' jours'], ['RFF possible du', fdate(new Date(+fd + 864e5)) + ' au ' + fdate(ff), 'text-emerald-400']]) : '') +
      note('AREF + RFF : 3 ans au plus pour une même formation. Si rien ne couvre la fin du stage, l’ASS peut être étudiée.'), 'France Travail');
    $('rff-res').innerHTML = h;
    setMail('aref', !(fd && ff) ? '' : r.besoin ? 'Vous suivez actuellement une formation indemnisée au titre de l’AREF.\n\nVos droits arrivent à leur terme le ' + fdate(fd) + ', avant la fin de votre formation prévue le ' + fdate(ff) + '.' + (ok ? '\n\nVous pouvez demander la rémunération de fin de formation (RFF), qui prend le relais jusqu’à la fin de votre formation. Son montant correspond à votre dernière allocation journalière' + (aj ? ', soit environ ' + eur(Math.min(769.49, Math.round(aj22 * 30 * 100) / 100)) + ' par mois' : '') + ', dans la limite de ' + eur(BB().rff.plafondMensuel) + ' par mois, sous réserve de votre assiduité.' : '\n\nNous vérifions si votre formation ouvre droit à la rémunération de fin de formation (RFF) et revenons vers vous rapidement.') + '\n\nPensez à nous transmettre vos attestations de présence.' : 'Vous suivez actuellement une formation indemnisée au titre de l’AREF.\n\nVos droits couvrent toute la durée de votre formation, qui se termine le ' + fdate(ff) + '. Si vous êtes toujours en recherche d’emploi à son issue, l’ARE reprendra dans la limite de vos droits restants.');
  }
  function arefRegles() {
    return cols(
      sec('1', 'AREF (ARE-Formation)', '<ul class="fr-ul"><li>Formation inscrite au <b>contrat d’engagement</b>, ou financée en tout ou partie par le <b>CPF</b>. Hors contrat, l’ARE reste versée si la formation dure 40 heures au plus ou laisse le temps de chercher un emploi.</li><li>Montant égal à l’ARE, sans pouvoir être inférieur à <b>' + eur(BB().are.formation) + ' par jour</b>. Seule la cotisation de retraite complémentaire de 3 % est prélevée.</li><li>À l’issue de la formation, l’ARE reprend dans la limite des droits restants.</li></ul>', src('Unédic, fiche ARE-F', U.aref) + ' (mise à jour du 05/10/2026)'),
      sec('2', 'Allongement pour les 55 ans et plus', '<ul class="fr-ul"><li><b>55 ou 56 ans</b> à la fin du contrat : plus de 913 jours calendaires d’affiliation dans les 36 mois précédents.</li><li><b>57 ans et plus :</b> pas de durée minimale, mais le droit doit avoir subi le coefficient de 0,75.</li><li>Allongement de <b>137 jours</b> au plus (182 en outre-mer) : jusqu’à 822 jours (55-56 ans) ou 959 jours (57 ans et plus). Pas d’allongement pour une formation suivie dans le cadre du CSP.</li></ul>', src('Unédic, fiche ARE-F', U.aref)) +
      sec('3', 'RFF (rémunération de fin de formation)', '<ul class="fr-ul"><li>Prend le relais quand l’ARE-F, l’ASP-F ou l’ATI-F s’arrête avant la fin d’une formation inscrite au contrat d’engagement.</li><li>Égale au <b>dernier montant journalier</b> perçu, dans la limite de <b>' + eur(BB().rff.plafondMensuel) + ' par mois</b> selon France Travail, sous condition d’assiduité.</li><li>Prolongée pour les formations prescrites jusqu’au 31/12/2026, sur une liste de métiers fixée par arrêté.</li></ul>', src('France Travail, RFF', U.rff) + ' · vérifier le plafond en vigueur') );
  }

  /* ---------- Trop-perçus ---------- */
  /* Motifs de trop-perçu (causes recensées par France Travail et l’Unédic) : [code, libellé de la liste, phrase du mail] */
  const TP_MOTIFS = [
    ['', 'Choisir un motif…', ''],
    ['reprise', 'Reprise d’activité non déclarée ou déclarée tardivement', 'une reprise d’activité qui n’a pas été déclarée, ou l’a été tardivement, lors de votre actualisation'],
    ['ecart', 'Écart entre revenus déclarés et bulletin de salaire', 'un écart entre les revenus déclarés lors de votre actualisation et ceux qui figurent sur votre bulletin de salaire'],
    ['bulletin', 'Bulletin de salaire transmis tardivement', 'la transmission tardive de votre bulletin de salaire, qui n’a pas permis de calculer à temps le montant dû'],
    ['ans', 'Activité non salariée ou chiffre d’affaires non déclaré', 'des revenus d’activité non salariée (chiffre d’affaires) qui n’ont pas été déclarés'],
    ['maladie', 'Arrêt maladie, maternité ou accident du travail non signalé', 'un arrêt de travail (maladie, maternité ou accident) indemnisé par l’Assurance maladie et non signalé'],
    ['retraite', 'Retraite liquidée ou taux plein atteint', 'la liquidation de votre retraite, ou l’atteinte du nombre de trimestres pour une retraite à taux plein'],
    ['invalidite', 'Pension d’invalidité non signalée ou modifiée', 'une pension d’invalidité, ou un changement de catégorie ou de montant, qui n’avait pas été pris en compte'],
    ['attestation', 'Attestation employeur rectificative', 'une attestation employeur rectificative qui modifie votre salaire de référence ou vos dates de contrat'],
    ['differe', 'Indemnités de rupture ou congés payés pris en compte après coup', 'des indemnités de rupture ou de congés payés connues après l’ouverture de vos droits, qui reportent le début de votre indemnisation'],
    ['formation', 'Formation rémunérée par un autre organisme', 'une formation rémunérée par un autre organisme pendant une période où l’allocation vous a été versée'],
    ['etranger', 'Séjour à l’étranger ou changement de résidence non signalé', 'un séjour à l’étranger ou un changement de résidence qui n’a pas été signalé'],
    ['sanction', 'Radiation ou sanction appliquée après versement', 'une radiation ou une sanction prise en compte après le versement de votre allocation'],
    ['erreur', 'Erreur de calcul ou de traitement de France Travail', 'une erreur de calcul ou de traitement de nos services, dont nous vous prions de nous excuser'],
    ['autre', 'Autre motif (à préciser)', '']
  ];
  function tpMotif() {
    const k = val('tp-motif'), w = $('tp-autre-w'); if (w) w.hidden = k !== 'autre';
    if (k === 'autre') return val('tp-autre').trim();
    const m = TP_MOTIFS.find(x => x[0] === k); return m ? m[2] : '';
  }
  function induSim() {
    return cols(
      sec('1', 'Trop-perçu notifié', grid(field('Montant (€)', inp('tp-mt', 'number', 'Ex. 845,20', ' min="0" step="0.01" inputmode="decimal"')) + field('Période concernée', inp('tp-per', 'text', 'Ex. mars à mai 2026')) + '<div class="sm:col-span-2">' + field('Motif du trop-perçu', sel('tp-motif', TP_MOTIFS.map(m => [m[0], m[1]]))) + '</div><div class="sm:col-span-2" id="tp-autre-w" hidden>' + field('Préciser le motif', inp('tp-autre', 'text', 'Ex. versement en double à la suite d’une régularisation')) + '</div>'), 'Pour le mail') +
      sec('2', 'Prescription', grid(field('Versement le plus ancien', inp('tp-v', 'date')) + field('Date de la notification', inp('tp-n', 'date')) + field('Fraude ou fausse déclaration', sel('tp-fr', [['non', 'Non'], ['oui', 'Oui']]))), '3 ans · 10 ans si fraude'),
      '<div id="tp-res" class="space-y-4"></div>' + mailPanel('indu'));
  }
  function induRun() {
    const mt = num('tp-mt'), r = ftPrescription({ versement: val('tp-v'), notif: val('tp-n'), fraude: val('tp-fr') === 'oui', montant: mt });
    let h = !r ? verdict('nd', 'En attente', 'SAISISSEZ LA DATE DU VERSEMENT', 'Le contrôle de prescription se fait à partir du versement le plus ancien.', 'Prescription')
      : r.prescrit ? verdict('wa', 'Prescription partielle', 'SOMMES VERSÉES AVANT LE ' + fdate(r.seuil) + ' : PRESCRITES', 'Les mois les plus anciens ne peuvent plus être réclamés. Vérifier période par période.', r.ans + ' ans')
      : verdict('ok', 'Récupérable', 'TROP-PERÇU RÉCLAMABLE', 'Récupération possible jusqu’au ' + fdate(r.limite) + ' pour le versement le plus ancien.', r.ans + ' ans');
    h += sec('€', 'Délais et seuils', tiles([['Délai applicable', r ? r.ans + ' ans' : '—', r && r.ans === 10 ? 'Fraude ou fausse déclaration' : 'Cas général', 'text-cyan-300'], ['Montant', mt ? eur(mt) : '—', r && r.petit ? 'Inférieur à ' + e0(BB().indu.seuilRecup) + ' : non récupéré' : 'Seuil de récupération ' + e0(BB().indu.seuilRecup) + '', r && r.petit ? 'text-emerald-400' : 'text-amber-300']]) +
      (r ? rows([['Versement le plus ancien', fdate(pdate(val('tp-v')))], ['Notification', fdate(pdate(val('tp-n')) || new Date())], ['Sommes prescrites si versées avant le', fdate(r.seuil), 'text-amber-300']]) : ''), 'justice.fr');
    $('tp-res').innerHTML = h;
    setMail('indu', !mt ? '' : 'Un trop-perçu de ' + eur(mt) + ' a été constaté sur votre dossier' + (val('tp-per') ? ', pour la période de ' + val('tp-per') : '') + '.' + (tpMotif() ? '\n\nCe trop-perçu s’explique par ' + tpMotif().replace(/\.$/, '') + '.' : '') + '\n\nVous avez plusieurs possibilités :\n- rembourser cette somme en une fois ou demander un échéancier adapté à votre situation ;\n- accepter une retenue sur vos prochaines allocations : le questionnaire joint à la notification nous permet d’en calculer le montant ;\n- demander une remise totale ou partielle de la dette, en expliquant votre situation ;\n- contester ce trop-perçu par un courrier argumenté adressé à votre agence. Si notre réponse ne vous satisfait pas, vous pourrez saisir le médiateur de France Travail.\n\nSans réponse de votre part, une procédure de recouvrement pourra être engagée.');
  }
  function induRegles() {
    return cols(
      sec('1', 'Délais', '<ul class="fr-ul"><li>Remboursement réclamable <b>3 ans</b> après la date de versement.</li><li><b>10 ans</b> en cas de fraude ou de fausse déclaration.</li><li>Les indus de moins de <b>' + e0(BB().indu.seuilRecup) + '</b> ne sont pas récupérés.</li></ul>', src('justice.fr', U.justice)),
      sec('2', 'Notification et remboursement', '<ul class="fr-ul"><li>Courrier précisant le motif, le montant et la période, les modalités de remboursement, la possibilité de remise et les voies de recours.</li><li>Remboursement en une fois ou échelonné, ou <b>retenue sur les allocations</b> calculée à partir du questionnaire joint.</li><li>Sans remboursement, demande de remise ni contestation : <b>contrainte</b> (recouvrement contentieux).</li></ul>', src('France Travail, trop-perçu', U.indu)) +
      sec('3', 'Remise et contestation', '<ul class="fr-ul"><li><b>Remise de dette</b> totale ou partielle sur demande ; pour l’assurance chômage, les instances paritaires régionales examinent ces demandes.</li><li><b>Contestation</b> par courrier argumenté à l’agence, puis saisine du <b>médiateur</b> de France Travail si la réponse ne règle pas le litige.</li><li>Pour l’échéancier, utiliser l’outil <b>Indus</b>.</li></ul>', src('France Travail, trop-perçu', U.indu) + ' · Unédic, instances paritaires') );
  }

  /* ---------- Sanctions ---------- */
  function sancRegles() {
    return cols(
      sec('1', 'Suspension-remobilisation', '<ul class="fr-ul"><li>En cas de manquement aux obligations du <b>contrat d’engagement</b>, l’allocation peut être suspendue d’<b>au moins 30 %</b> pendant <b>1 à 2 mois</b>.</li><li>Si le manquement persiste ou se répète : suspension ou suppression, partielle ou totale, pendant <b>1 à 4 mois</b>.</li><li>Il est mis fin à la suspension dès que le demandeur d’emploi se conforme à ses obligations, dans les conditions définies avec son conseiller : les sommes suspendues peuvent alors être reversées.</li><li>Une suppression totale de <b>4 mois</b> entraîne la radiation pour la même durée.</li><li>La durée et la part retenue tiennent compte de la situation de la personne.</li></ul>', 'Décret n° 2025-478 du 30/05/2025 (JO du 31/05/2025) · ' + src('Conseil d’État, 21/09/2026 : recours rejetés, décret maintenu', U.ce)) +
      sec('2', 'Procédure', '<ul class="fr-ul"><li>Décision motivée, avec la durée et la part de l’allocation concernées, et les voies de recours.</li><li>La personne peut présenter ses observations avant la décision.</li><li>L’absence à un rendez-vous fait l’objet d’une appréciation individuelle.</li></ul>', 'Code du travail, R. 5426-1'),
      sec('3', 'Mail d’information', grid('<div class="sm:col-span-2">' + field('Manquement constaté', inp('sa-motif', 'text', 'Ex. absence aux deux derniers rendez-vous')) + '</div>' + field('Part suspendue', sel('sa-part', [['30 %', '30 %'], ['50 %', '50 %'], ['100 %', '100 %']])) + field('Durée', sel('sa-duree', [['1 mois', '1 mois'], ['2 mois', '2 mois'], ['3 mois', '3 mois'], ['4 mois', '4 mois']])) + '<div class="sm:col-span-2">' + field('Pour lever la suspension', inp('sa-action', 'text', 'Ex. reprendre contact avec votre conseiller avant le 30/11')) + '</div>') + note('Le mail ci-dessous se met à jour : il explique la sanction et, surtout, comment la lever.'), 'Remobilisation') + mailPanel('sanc'));
  }
  function sancRun() {
    if (!$('sa-motif')) return;
    setMail('sanc', !val('sa-motif') ? '' : 'Lors de l’examen de votre dossier, nous avons constaté le manquement suivant à vos engagements : ' + val('sa-motif') + '.\n\nEn conséquence, votre allocation est suspendue à hauteur de ' + val('sa-part') + ' pendant ' + val('sa-duree') + '.\n\nCette suspension peut être levée avant son terme : ' + (val('sa-action') || 'il vous suffit de reprendre vos démarches dans les conditions convenues avec votre conseiller') + '. Les sommes suspendues pourront alors vous être reversées.\n\nVous pouvez présenter vos observations ou contester cette décision en répondant à ce message ou auprès de votre agence.');
  }

  /* ---------- Cas particuliers ---------- */
  function casRegles() {
    return cols(
      sec('1', 'Travailleurs frontaliers', '<ul class="fr-ul"><li>Résident en France, travaillant dans un autre État (UE, EEE, Suisse) : en cas de <b>chômage complet</b>, c’est France Travail (État de résidence) qui indemnise, selon les règles françaises (règlement CE n° 883/2004).</li><li>Le salaire de référence est calculé sur les <b>salaires réellement perçus à l’étranger</b>, convertis en euros ; les périodes travaillées à l’étranger comptent pour l’affiliation. Justificatif : formulaire <b>U1</b> (PD U1 pour la Suisse).</li><li>Le coefficient réducteur prévu par la convention de 2024 n’a pas été agréé : il ne s’applique pas.</li><li>Réforme européenne adoptée en juillet 2026 (indemnisation par l’État d’emploi) : <b>pas encore applicable</b>, règles actuelles maintenues.</li></ul>', 'Avenant n° 3 du 25/02/2026 · sources spécialisées frontaliers (vérifiées 11/2026)'),
      sec('2', 'Intermittents du spectacle (annexes 8 et 10)', '<ul class="fr-ul"><li><b>Annexe 8</b> : ouvriers et techniciens · <b>annexe 10</b> : artistes.</li><li>Ouverture : <b>507 heures</b> de travail dans le spectacle sur les <b>12 mois</b> précédant la fin de contrat retenue.</li><li>Artistes : 1 cachet = 12 heures. Les contrats de droit commun, l’intérim et l’activité indépendante ne comptent pas.</li><li><b>Droit d’option :</b> un allocataire du régime général peut y renoncer pour ouvrir un droit annexes 8 et 10 dès qu’il réunit les 507 heures.</li></ul>', src('France Travail, devenir intermittent', U.inter) + ' · ' + src('droit d’option', U.option)) +
      sec('3', 'Condition de résidence', '<ul class="fr-ul"><li>L’ARE, comme l’ATI, suppose de <b>résider en France</b> (territoire couvert par l’assurance chômage). La convention de 2024 précise la définition de cette condition.</li><li>Un séjour à l’étranger doit être signalé : il peut suspendre le versement. L’exportation des droits vers un autre État de l’UE se fait avec le formulaire <b>U2</b>, pour une durée limitée.</li></ul>', 'Convention du 15/11/2024, art. 2 § 10 · Unédic') );
  }

  /* ---------- Vues ---------- */
  const VIEWS = [
    { id: 'ati', hue: 'orange', title: 'Travailleurs indépendants (ATI)', sub: 'Conditions, montant de ' + eur(BB().ati.plancher) + ' à ' + eur(BB().ati.forfait) + ' par jour, ' + BB().ati.duree + ' jours, cumuls.', desc: 'Allocation des travailleurs indépendants : éligibilité et montant', badge: 'ATI', icon: 'briefcase', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', kw: 'ati travailleur indépendant liquidation redressement auto-entrepreneur micro-entreprise non salarié', path: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>', tabs: [['sim', 'Éligibilité et montant', atiSim, atiRun, ['ati-n1', 'ati-n2', 'ati-2ans', 'ati-motif', 'ati-rsa', 'ati-12m', 'ati-5a']], ['regles', 'Règles et cumuls', atiRegles]] },
    { id: 'ass', hue: 'teal', title: 'Fin de droits : ASS et ATA', sub: 'Allocation de solidarité spécifique : conditions, plafonds, montant différentiel, renouvellement et cumul ; repères sur l’ATA.', desc: 'Allocation de solidarité spécifique et ATA : conditions et montant', badge: 'ASS', icon: 'life-buoy', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30', kw: 'ass allocation de solidarité spécifique fin de droits solidarité ata allocation temporaire d attente plafond ressources 5 ans 10 ans', path: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/>', tabs: [['sim', 'Éligibilité et montant', assSim, assRun, ['ass-are', 'ass-ans', 'ass-enf', 'ass-rech', 'ass-fam', 'ass-zone', 'ass-res']], ['regles', 'Règles, ATA et cumul', assRegles]] },
    { id: 'aref', hue: 'violet', title: 'Formation : AREF et RFF', sub: 'Indemnisation pendant la formation, allongement des 55 ans et plus, relais par la RFF.', desc: 'AREF, allongement seniors, rémunération de fin de formation', badge: 'AREF', icon: 'graduation-cap', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30', kw: 'aref are-f formation rff fin de formation cpf stage', path: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>', tabs: [['sim', 'Fin des droits pendant la formation', arefSim, arefRun, ['rff-aj', 'rff-fd', 'rff-ff', 'rff-elig']], ['regles', 'Règles', arefRegles]] },
    { id: 'sanctions', hue: 'rose', title: 'Sanctions et radiations', sub: 'Suspension-remobilisation depuis juin 2025, durées, procédure, mail d’information.', desc: 'Suspension-remobilisation, durées et mail d’information', badge: 'Décret 2025', icon: 'gavel', color: 'bg-red-500/15 text-red-400 border-red-500/30', kw: 'sanction radiation suspension remobilisation manquement contrat d engagement suppression', path: '<path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10"/><path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8"/>', tabs: [['regles', 'Règles et mail', sancRegles, sancRun, ['sa-motif', 'sa-part', 'sa-duree', 'sa-action']]] },
    { id: 'casparts', hue: 'sky', title: 'Frontaliers, intermittents, résidence', sub: 'Repères et textes pour les situations à règles spécifiques.', desc: 'Frontaliers, annexes 8 et 10, condition de résidence', badge: 'Repères', icon: 'globe', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', kw: 'frontalier suisse luxembourg u1 intermittent spectacle annexe 8 10 507 heures résidence étranger u2', path: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>', tabs: [['regles', 'Repères', casRegles]] }
  ];
  const anchor = $('view-delais');
  const isSit = el => /situation/i.test((el && (el.dataset.lbOrig || el.textContent)) || '');
  VIEWS.forEach(cfg => {
    const v = document.createElement('div');
    v.id = 'view-' + cfg.id; v.className = 'hidden flex-1 flex flex-col overflow-hidden bg-slate-950 fr-view';
    const hue = cfg.hue || 'indigo';
    v.innerHTML = '<div class="rg-panel" hidden></div><div class="h-12 border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 flex items-center justify-between shrink-0 z-10"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-' + hue + '-500/10 text-' + hue + '-400 flex items-center justify-center font-bold text-xs shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true">' + cfg.path + '</svg></div><div><h2 class="text-xs md:text-sm font-bold text-white tracking-tight flex items-center gap-2"><span>' + cfg.title + '</span><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-' + hue + '-500/10 text-' + hue + '-400 border border-' + hue + '-500/30 font-normal">' + cfg.badge + '</span></h2></div></div>' +
      (cfg.tabs.length > 1 ? '<div class="flex items-center gap-2"><div class="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 fr-seg" role="tablist"></div></div>' : '') + '</div>' +
      '<div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"><p class="max-w-7xl mx-auto text-xs text-slate-400">' + cfg.sub + '</p><div class="fr-body"></div></div>';
    if (anchor) anchor.parentElement.appendChild(v);
    cfg.v = v; cfg.cur = cfg.tabs[0][0];
    cfg.show = function (k) {
      cfg.cur = k || cfg.cur;
      const tl = v.querySelector('.fr-seg');
      const ON = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm';
      const OFF = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all';
      const TI = { sim: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h8"/>', regles: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>' };
      if (tl) tl.innerHTML = cfg.tabs.map(t => '<button type="button" role="tab" class="' + (t[0] === cfg.cur ? ON : OFF) + '" aria-selected="' + (t[0] === cfg.cur) + '" data-k="' + t[0] + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true">' + (TI[t[0]] || TI.regles) + '</svg><span>' + t[1] + '</span></button>').join('');
      const t = cfg.tabs.find(x => x[0] === cfg.cur);
      v.querySelector('.fr-body').innerHTML = t[2]();
      if (t[3]) { (t[4] || []).forEach(id => { const e = $(id); if (e) { e.addEventListener('input', t[3]); e.addEventListener('change', t[3]); } }); t[3](); }
    };
    v.addEventListener('click', e => { const b = e.target.closest('.fr-seg [data-k]'); if (b) cfg.show(b.dataset.k); });
    NAV_TABS_CONFIG.push({ id: cfg.id, name: cfg.title, desc: cfg.desc, icon: cfg.icon, color: cfg.color, badge: cfg.badge });
    try { FT_KW[cfg.id] = cfg.kw; } catch (e) {}
  });
  const byId = id => VIEWS.find(c => c.id === String(id));
  const _sw = switchNavTab;
  switchNavTab = function (t) {
    const r = _sw.apply(this, arguments);
    VIEWS.forEach(c => {
      const on = String(t) === c.id; c.v.classList.toggle('hidden', !on);
      if (on) { c.show(); const n = $('header-active-tab-name'); if (n) n.textContent = 'Situations particulières · ' + c.title; }
    });
    try { hub(); } catch (e) {}
    return r;
  };

  /* Menu : rubrique « Situations particulières » (copie du style d’un outil voisin) */
  if (typeof renderBurgerTabs === 'function') {
    const _rb = renderBurgerTabs;
    renderBurgerTabs = function () {
      const r = _rb.apply(this, arguments);
      const c = $('burger-tabs-list'); if (!c) return r;
      const s = [...c.querySelectorAll(':scope > .menu-sec')].find(x => isSit(x.querySelector('.menu-sec-h'))); if (!s) return r;
      const model = [...s.querySelectorAll('button[onclick^="switchNavTab"]')].find(b => !/from-blue-900/.test(b.className)); if (!model) return r;
      VIEWS.forEach(cfg => {
        if (s.querySelector('button[onclick="switchNavTab(\'' + cfg.id + '\')"]')) return;
        const b = model.cloneNode(true);
        b.setAttribute('onclick', "switchNavTab('" + cfg.id + "')");
        const lb = b.querySelector('.text-xs'), d = b.querySelector('p'), ic = b.querySelector('svg');
        if (lb) { lb.textContent = cfg.title; delete lb.dataset.lbOrig; }
        if (d) d.textContent = cfg.desc;
        if (ic) { const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); n.setAttribute('viewBox', '0 0 24 24'); n.setAttribute('fill', 'none'); n.setAttribute('stroke', 'currentColor'); n.setAttribute('stroke-width', '2'); n.setAttribute('stroke-linecap', 'round'); n.setAttribute('stroke-linejoin', 'round'); n.setAttribute('class', ic.getAttribute('class') || ''); n.innerHTML = cfg.path; ic.replaceWith(n); }
        b.querySelectorAll('.ft-pen-wrap,.ft-pen').forEach(x => x.remove());
        model.parentElement.appendChild(b.parentElement === model.parentElement ? b : b);
      });
      return r;
    };
    try { renderBurgerTabs(); } catch (e) {}
  }
  /* Barre d’onglets de la rubrique */
  function hub() {
    document.querySelectorAll('.hub-bar').forEach(bar => {
      if (!isSit(bar.querySelector('.hub-name'))) return;
      VIEWS.forEach(cfg => {
        if (bar.querySelector('.hub-tab[data-t="' + cfg.id + '"]')) return;
        const b = document.createElement('button'); b.type = 'button'; b.className = 'hub-tab'; b.dataset.t = cfg.id;
        b.setAttribute('onclick', "switchNavTab('" + cfg.id + "')"); b.textContent = cfg.title;
        bar.insertBefore(b, bar.querySelector(':scope > .hub-sub'));
      });
    });
    VIEWS.forEach(cfg => {
      if (!cfg.v.querySelector(':scope > .hub-bar')) {
        const srcBar = [...document.querySelectorAll('.hub-bar')].find(x => isSit(x.querySelector('.hub-name')) && !x.closest('.fr-view'));
        if (srcBar) { const cl = srcBar.cloneNode(true); const sub = cl.querySelector('.hub-sub'); if (sub) sub.remove(); cfg.v.insertBefore(cl, cfg.v.firstChild); }
      }
    });
    const t = String(activeNavTab);
    document.querySelectorAll('.hub-bar .hub-tab').forEach(b => {
      if (byId(b.dataset.t)) { const on = b.dataset.t === t; b.classList.toggle('is-on', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
      else if (byId(t) && b.closest('.fr-view')) { b.classList.remove('is-on'); b.removeAttribute('aria-current'); }
    });
  }
  try { hub(); } catch (e) {}

  /* Contenus des fiches pour la recherche (Ctrl+K) */
  window.FT_FICHES = VIEWS.flatMap(c => c.tabs.map(t => ({ tab: c.id, k: t[0], name: c.title, html: () => t[2]() }))).concat([{ tab: 6, k: 'del', name: 'Trop-perçu', html: () => induSim() + induRegles(), box: 'indus-delais' }]);
  window.ftFicheShow = (id, k) => { if (String(id) === '6') { if (window.ftInduMode) window.ftInduMode(k); return; } const c = byId(id); if (c) c.show(k); };
  /* ---------- Trop-perçu (outil Indus) : volet « Délais et recours » ---------- */
  (function induVolet() {
    const view = $('view-indus'); if (!view) return;
    const head = view.querySelector(':scope > .h-12'); if (!head) return;
    const ON = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm';
    const OFF = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all';
    const seg = document.createElement('div'); seg.className = 'flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 fr-seg'; seg.setAttribute('role', 'tablist');
    const right = head.querySelector(':scope > div:last-child');
    head.insertBefore(seg, right);
    const box = document.createElement('div'); box.id = 'indus-delais'; box.className = 'flex-1 overflow-y-auto p-4 md:p-6 space-y-4 fr-view'; box.hidden = true;
    view.appendChild(box);
    let mode = 'ech', built = false;
    const TI = { ech: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>', del: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 12v3M12 18h.01"/>' };
    function draw() {
      seg.innerHTML = [['ech', 'Échéancier'], ['del', 'Délais et recours']].map(t => '<button type="button" role="tab" data-m="' + t[0] + '" aria-selected="' + (t[0] === mode) + '" class="' + (t[0] === mode ? ON : OFF) + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true">' + TI[t[0]] + '</svg><span>' + t[1] + '</span></button>').join('');
      const del = mode === 'del';
      [...view.children].forEach(c => {
        if (c === box || c === head || c.classList.contains('hub-bar') || c.classList.contains('rg-panel')) return;
        if (del) { if (!c.dataset.frWas) { c.dataset.frWas = '1'; c.classList.add('fr-hide'); } }
        else if (c.dataset.frWas) { delete c.dataset.frWas; c.classList.remove('fr-hide'); }
      });
      right.style.display = del ? 'none' : '';
      box.hidden = !del;
      if (del && !built) {
        built = true;
        box.innerHTML = '<p class="max-w-7xl mx-auto text-xs text-slate-400">Prescription de 3 ou 10 ans, retenue sur allocations, remise de dette, contestation et médiateur, avec un mail type pour l’allocataire.</p>' + induSim() + '<div class="h-2"></div>' + induRegles();
        ['tp-mt', 'tp-per', 'tp-motif', 'tp-autre', 'tp-v', 'tp-n', 'tp-fr'].forEach(id => { const e = $(id); if (e) { e.addEventListener('input', induRun); e.addEventListener('change', induRun); } });
        induRun();
      }
    }
    seg.addEventListener('click', e => { const b = e.target.closest('[data-m]'); if (b) { mode = b.dataset.m; draw(); } });
    document.addEventListener('click', e => { if (mode === 'del' && e.target.closest && e.target.closest('#view-indus .hub-sub button')) { mode = 'ech'; draw(); } });
    window.ftInduMode = m => { mode = m; draw(); };
    draw();
  })();
  try { FT_KW['6'] = (FT_KW['6'] || '') + ' trop-perçu trop percu indu prescription délais recours remise dette contestation médiateur contrainte'; } catch (e) {}

  /* Sources et cas de contrôle */
  try {
    (window.FT_SOURCES || []).push(
      ['ASS', 'Conditions, plafonds, montant', '5 ans d’activité sur 10 (−1 an par enfant, 3 max) ; ' + eur(BB().solidarite.ass) + '/j ; plafonds ' + BB().solidarite.coefSeul + ' et ' + BB().solidarite.coefCouple + ' × montant journalier ; cumul intégral 3 mois ; ATA fermée depuis 2017 (' + eur(BB().solidarite.ata) + '/j)', 'Décret 2026-219 ; service-public F12484 (vérifié le 13/11/2026)', 'ok'],
      ['ATI', 'Conditions, montant, cumuls', '2 ans d’activité, cessation involontaire, ' + e0(BB().ati.seuilRevenus) + ' de revenus, ressources < RSA ; ' + eur(BB().ati.plancher) + ' à ' + eur(BB().ati.forfait) + ' par jour, ' + BB().ati.duree + ' jours, sans différé', 'Unédic, fiche ATI (13/10/2026)', 'ok'],
      ['Formation', 'AREF et RFF', 'Plancher ' + eur(BB().are.formation) + '/j ; allongement 55 ans et plus jusqu’à 137 jours ; RFF plafonnée à ' + eur(BB().rff.plafondMensuel) + '/mois', 'Unédic, fiche ARE-F (05/10/2026) ; France Travail, RFF', 'ok'],
      ['Trop-perçus', 'Prescription et recours', '3 ans, 10 ans en cas de fraude ; indus < ' + e0(BB().indu.seuilRecup) + ' non récupérés ; remise, contestation, médiateur, contrainte', 'justice.fr ; France Travail', 'ok'],
      ['Sanctions', 'Suspension-remobilisation', 'Au moins 30 % pendant 1 à 2 mois ; 1 à 4 mois si persistance ; radiation si suppression totale de 4 mois', 'Décret 2025-478 ; Conseil d’État 21/09/2026', 'ok'],
      ['Retraite', 'Âges et trimestres après suspension de la réforme', '1964 et janv.-mars 1965 : 62 ans 9 mois et 170 trimestres ; avr.-déc. 1965 : 63 ans et 171 ; 1966 à 1968 : +3 mois par génération, 172 ; 1969 : 64 ans', 'Unédic (1er septembre 2026) ; LFSS 2026', 'ok']
    );
  } catch (e) {}
  try {
    FT_CASES.push(
      { n: 'ASS : personne seule sans ressources → taux plein (30 j)', run: () => ftAssCompute({ ressources: 0 }).du, get exp() { return Math.round(30 * BAREME.solidarite.ass * 100) / 100; }, d: 2 },
      { n: 'ASS : personne seule, 1 000 € de ressources → plafond − ressources', run: () => ftAssCompute({ ressources: 1000 }).du, get exp() { return Math.round((BAREME.solidarite.coefSeul * BAREME.solidarite.ass - 1000) * 100) / 100; }, d: 2 },
      { n: 'ASS : couple, 1 600 € de ressources → plafond − ressources', run: () => ftAssCompute({ couple: true, ressources: 1600 }).du, get exp() { return Math.min(Math.round(30 * BAREME.solidarite.ass * 100) / 100, Math.round((BAREME.solidarite.coefCouple * BAREME.solidarite.ass - 1600) * 100) / 100); }, d: 2 },
      { n: 'ASS : reliquat inférieur au montant journalier → non versée', run: () => ftAssCompute({ ressources: BAREME.solidarite.coefSeul * BAREME.solidarite.ass - 5 }).du, exp: 0, d: 2 },
      { n: 'ATI : revenus élevés → forfait journalier', run: () => ftAtiCompute({ n1: 1e6, n2: 1e6 }).jour, get exp() { return BAREME.ati.forfait; }, d: 2 },
      { n: 'ATI : revenus 10 000 € + 6 000 € → moyenne 666,67 €/mois → 21,92 €/jour', run: () => ftAtiCompute({ n1: 10000, n2: 6000 }).jour, exp: 21.92, d: 2 },
      { n: 'ATI : plancher journalier', run: () => ftAtiCompute({ n1: 10000, n2: 0 }).jour, get exp() { return BAREME.ati.plancher; }, d: 2 },
      { n: 'Trop-perçu : versé le 15/01/2023, notifié le 20/01/2026 → prescrit (1 = oui)', run: () => ftPrescription({ versement: '2023-01-15', notif: '2026-01-20' }).prescrit ? 1 : 0, exp: 1, d: 0 },
      { n: 'Trop-perçu avec fraude : même dates → non prescrit (0)', run: () => ftPrescription({ versement: '2023-01-15', notif: '2026-01-20', fraude: true }).prescrit ? 1 : 0, exp: 0, d: 0 },
      { n: 'RFF : AREF 30 €/j → plafond mensuel', run: () => ftRffCompute({ aj: 30 }).mens, get exp() { return BAREME.rff.plafondMensuel; }, d: 2 }
    );
  } catch (e) {}
})();
