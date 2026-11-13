(function () {
  /* Mode formation : quiz de 10 questions tirées des règles du barème en vigueur
     et des cas de contrôle des simulateurs (les réponses suivent donc les mises à jour). */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tab = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  const B = () => { try { return BAREME; } catch (e) { return null; } };
  const nf = (n, d) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  const eur = n => nf(n, 2) + ' €';
  const pct = x => nf(Math.round(x * 1000) / 10, (Math.round(x * 1000) % 10) ? 1 : 0) + ' %';
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const THEMES = [['all', 'Tout'], ['are', 'ARE et durée'], ['diff', 'Différés'], ['cumul', 'Cumul et reprise'], ['sol', 'ASS, ATI, formation'], ['indu', 'Trop-perçus'], ['autres', 'Autres']];

  /* ---------- Questions sur les règles (valeurs lues dans le barème) ---------- */
  function rules() {
    const b = B(); if (!b) return [];
    const a = b.are, du = b.duree, df = b.differe, dg = b.degr, cu = b.cumul, so = b.solidarite || {}, at = b.ati || {}, rf = b.rff || {}, ind = b.indu || {}, cn = b.cns || {}, inv = b.invalidite || {}, aff = b.affiliation;
    const L = [];
    const q = (th, text, ok, bad, expl, go) => L.push({ th, text, ok: String(ok), opts: shuffle([String(ok)].concat(bad.map(String).filter(x => x !== String(ok)).slice(0, 3))), expl, go: go || 'bareme' });
    if (aff) q('are', 'Durée minimale d’affiliation pour ouvrir un droit à l’ARE (cas général) ?', aff.jours + ' jours travaillés (' + nf(aff.heures) + ' heures)', ['88 jours travaillés (610 heures)', '182 jours travaillés (1 274 heures)', '65 jours travaillés (455 heures)'], 'Il faut ' + aff.jours + ' jours travaillés ou ' + nf(aff.heures) + ' heures, recherchés sur la période de référence.');
    if (du) {
      q('are', 'Durée maximale d’indemnisation pour un allocataire de moins de 55 ans ?', du.max.u55 + ' jours', [730, 456, 685].map(x => x + ' jours'), 'Moins de 55 ans : ' + du.max.u55 + ' jours ; 55 et 56 ans : ' + du.max.a55 + ' jours ; 57 ans et plus : ' + du.max.a57 + ' jours.');
      q('are', 'Durée maximale d’indemnisation à 55 ou 56 ans ?', du.max.a55 + ' jours', [548, 822, 913].map(x => x + ' jours'), '55 et 56 ans : ' + du.max.a55 + ' jours.');
      q('are', 'Durée maximale d’indemnisation à 57 ans et plus ?', du.max.a57 + ' jours', [913, 685, 1095].map(x => x + ' jours'), '57 ans et plus : ' + du.max.a57 + ' jours.');
      q('are', 'La durée d’indemnisation est égale aux jours calendaires de la période de référence multipliés par…', nf(du.coef, 2), ['0,70', '0,80', '1,00'], 'Coefficient de ' + nf(du.coef, 2) + ', avec un minimum de ' + du.min + ' jours.');
      q('are', 'Durée minimale d’indemnisation ?', du.min + ' jours', ['122 jours', '91 jours', '365 jours'], 'Le droit ne peut pas être inférieur à ' + du.min + ' jours.');
      if (du.rci) q('are', 'Rupture conventionnelle à compter du ' + du.rci.effet.split('-').reverse().join('/') + ', moins de 55 ans : durée maximale ?', du.rci.u55 + ' jours', [du.max.u55, 365, 274].map(x => x + ' jours'), 'Pour les ruptures conventionnelles concernées : ' + du.rci.u55 + ' jours (moins de 55 ans).');
    }
    if (a) {
      q('are', 'Partie fixe de l’ARE (par jour) ?', eur(a.partieFixe), [11.65, 14.5, 12.12].map(eur), 'ARE = ' + pct(a.tauxA) + ' du SJR + ' + eur(a.partieFixe) + ', ou ' + pct(a.tauxB) + ' du SJR si c’est plus favorable.');
      q('are', 'Allocation journalière minimale de l’ARE ?', eur(a.min), [29.38, 35.5, 22.99].map(eur), 'Allocation minimale : ' + eur(a.min) + ' par jour (dans la limite de ' + pct(a.plafond) + ' du SJR).');
      q('are', 'L’ARE ne peut pas dépasser quel pourcentage du SJR ?', pct(a.plafond), ['57 %', '70 %', '80 %'], 'Plafond : ' + pct(a.plafond) + ' du salaire journalier de référence.');
    }
    if (dg) {
      q('are', 'À partir de quel mois d’indemnisation s’applique la dégressivité ?', dg.moisDebut + 'e mois', ['4e mois', '9e mois', '13e mois'], 'Coefficient de ' + nf(dg.coef, 1) + ' à partir du ' + dg.moisDebut + 'e mois pour une allocation journalière supérieure à ' + eur(dg.seuil) + ' (sans descendre sous ce montant), si moins de ' + dg.ageLimite + ' ans.');
      q('are', 'Réduction appliquée par la dégressivité ?', pct(1 - dg.coef), ['20 %', '25 %', '40 %'], 'L’allocation est multipliée par ' + nf(dg.coef, 1) + ', soit une baisse de ' + pct(1 - dg.coef) + '.');
    }
    if (df) {
      q('diff', 'Délai d’attente avant le premier jour indemnisé ?', df.attente + ' jours', ['3 jours', '10 jours', '14 jours'], 'Délai d’attente : ' + df.attente + ' jours, après les différés éventuels.');
      q('diff', 'Plafond du différé lié aux congés payés (ICCP) ?', df.cpMax + ' jours', ['15 jours', '45 jours', '75 jours'], 'Différé congés payés plafonné à ' + df.cpMax + ' jours.');
      q('diff', 'Plafond du différé spécifique (indemnités supra-légales), cas général ?', df.specMax + ' jours', ['75 jours', '180 jours', '30 jours'], 'Plafond de ' + df.specMax + ' jours, ramené à ' + df.specMaxEco + ' jours en cas de licenciement pour motif économique.');
      q('diff', 'Plafond du différé spécifique en cas de licenciement pour motif économique ?', df.specMaxEco + ' jours', ['150 jours', '30 jours', '120 jours'], 'Motif économique : ' + df.specMaxEco + ' jours au maximum.');
    }
    if (cu) q('cumul', 'Reprise d’activité salariée : quelle part de la rémunération brute est déduite de l’ARE du mois ?', pct(cu.remun), ['50 %', '60 %', '100 %'], 'Le nombre de jours indemnisés est calculé en déduisant ' + pct(cu.remun) + ' de la rémunération brute.', 'cns');
    if (b.csp) q('cumul', 'CSP : l’allocation de sécurisation professionnelle (ancienneté d’un an et plus) est égale à…', pct(b.csp.taux) + ' du SJR', ['57 % du SJR', '70 % du SJR', '80 % du SJR'], 'ASP = ' + pct(b.csp.taux) + ' du SJR, sans pouvoir être inférieure à l’ARE.');
    if (cn.abat) q('cumul', 'Micro-entreprise : abattement forfaitaire pour une activité de vente de marchandises ?', pct(cn.abat.vente), ['50 %', '34 %', '60 %'], 'Abattements : vente ' + pct(cn.abat.vente) + ', prestations BIC ' + pct(cn.abat.bic) + ', BNC ' + pct(cn.abat.bnc) + '.', 'cns');
    if (cn.abat) q('cumul', 'Micro-entreprise : abattement pour une activité libérale (BNC) ?', pct(cn.abat.bnc), ['50 %', '71 %', '40 %'], 'BNC : ' + pct(cn.abat.bnc) + ' d’abattement.', 'cns');
    if (so.ass) q('sol', 'Montant journalier de l’ASS (taux plein) ?', eur(so.ass), [so.ata, 22.99, 17.5].map(eur), 'ASS : ' + eur(so.ass) + ' par jour depuis le ' + (so.effet || '1er avril') + '.', 'ass');
    if (so.ata) q('sol', 'Montant journalier de l’ATA ?', eur(so.ata), [so.ass, 10.5, 16.2].map(eur), 'ATA : ' + eur(so.ata) + ' par jour.', 'ass');
    if (at.forfait) q('sol', 'ATI (travailleurs indépendants) : montant forfaitaire maximal par jour ?', eur(at.forfait), [at.plancher, 32.13, 22.99].map(eur), 'ATI : de ' + eur(at.plancher) + ' à ' + eur(at.forfait) + ' par jour, pendant ' + at.duree + ' jours.', 'ati');
    if (at.duree) q('sol', 'ATI : durée de versement ?', at.duree + ' jours', ['122 jours', '365 jours', '548 jours'], 'L’ATI est versée ' + at.duree + ' jours.', 'ati');
    if (at.seuilRevenus) q('sol', 'ATI : revenus d’activité minimaux sur l’une des deux dernières années ?', nf(at.seuilRevenus) + ' €', ['8 000 €', '12 000 €', '15 000 €'], 'Il faut au moins ' + nf(at.seuilRevenus) + ' € de revenus d’activité sur une des deux années précédentes.', 'ati');
    if (rf.plafondMensuel) q('sol', 'RFF : plafond mensuel ?', eur(rf.plafondMensuel), [685.12, 900, 1000].map(eur), 'La rémunération de fin de formation est plafonnée à ' + eur(rf.plafondMensuel) + ' par mois.', 'aref');
    if (ind.seuilRecup) q('indu', 'En dessous de quel montant un trop-perçu n’est-il pas recouvré ?', ind.seuilRecup + ' €', ['50 €', '100 €', '150 €'], 'Seuil de ' + ind.seuilRecup + ' € en dessous duquel l’indu n’est pas réclamé.', 6);
    if (ind.prescription) q('indu', 'Délai de prescription d’un trop-perçu (hors fraude) ?', ind.prescription + ' ans', ['2 ans', '5 ans', '10 ans'], 'Prescription de ' + ind.prescription + ' ans, portée à ' + ind.prescriptionFraude + ' ans en cas de fraude ou de fausse déclaration.', 6);
    if (ind.prescriptionFraude) q('indu', 'Délai de prescription d’un trop-perçu en cas de fraude ?', ind.prescriptionFraude + ' ans', ['3 ans', '5 ans', '20 ans'], 'Fraude ou fausse déclaration : ' + ind.prescriptionFraude + ' ans.', 6);
    if (inv.heures) q('autres', 'Pension d’invalidité : nombre d’heures de travail requis (condition d’ouverture) ?', inv.heures + ' heures', ['400 heures', '800 heures', '910 heures'], inv.heures + ' heures de travail salarié (ou ' + nf(inv.smicFois) + ' fois le Smic horaire de cotisations).', 'invalidite');
    if (b.generations) { const g = b.generations[b.generations.length - 1]; q('autres', 'Retraite : nombre de trimestres requis pour le taux plein, générations ' + g[0].toLowerCase() + ' ?', g[1] + ' trimestres', ['168 trimestres', '170 trimestres', '176 trimestres'], 'Génération ' + g[0].toLowerCase() + ' : ' + g[1] + ' trimestres, âge légal ' + g[2] + '.'); }
    return L;
  }
  /* ---------- Questions de calcul, avec le détail pas à pas ----------
     Les résultats viennent des mêmes fonctions que les simulateurs (et donc du barème en vigueur). */
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const r2 = x => Math.round(x * 100) / 100;
  const AGES = { u55: 'moins de 55 ans', a55: '55 ou 56 ans', a57: '57 ans et plus' };
  function opts(ok, cands, fmt) {
    const out = [], seen = new Set([fmt(ok)]);
    cands.concat([ok * 0.9, ok * 1.1, ok * 0.8, ok * 1.2, ok + 1, ok - 1]).forEach(v => { if (v == null || !isFinite(v) || v < 0) return; const f = fmt(v); if (!seen.has(f) && out.length < 3) { seen.add(f); out.push(f); } });
    return shuffle([fmt(ok)].concat(out));
  }
  function calcs() {
    const b = B(); if (!b) return [];
    const L = [];
    const F = n => typeof window[n] === 'function' ? window[n] : null;
    const areJour = F('ftAreJour'), dates = F('ftComputeDates'), cumul = F('cumulCompute');
    const a = b.are, df = b.differe, du = b.duree, dg = b.degr;
    const add = (th, text, okVal, cands, fmt, steps, go) => L.push({ th, calc: true, text, ok: fmt(okVal), opts: opts(okVal, cands, fmt), expl: 'Détail du calcul :', steps, go });
    const day = v => nf(v) + ' jours';
    /* 1. ARE journalière */
    if (areJour) for (const sjr of shuffle([34, 45, 62, 78.89, 95, 120, 160]).slice(0, 3)) {
      const r = areJour(sjr), A = r2(r.opA), Bv = r2(r.opB), lim = r2(r.lim), aj = r2(r.aj);
      const st = ['Formule 1 : ' + pct(a.tauxA) + ' × ' + eur(sjr) + ' + ' + eur(a.partieFixe) + ' (partie fixe) = <b>' + eur(A) + '</b>',
        'Formule 2 : ' + pct(a.tauxB) + ' × ' + eur(sjr) + ' = <b>' + eur(Bv) + '</b>',
        'On retient la plus favorable : ' + eur(Math.max(A, Bv))];
      if (r.formule === 'min') st.push('Inférieure à l’allocation minimale : on applique <b>' + eur(a.min) + '</b>');
      if (r.formule === 'plafond') st.push('Mais l’ARE ne peut pas dépasser ' + pct(a.plafond) + ' du SJR : ' + pct(a.plafond) + ' × ' + eur(sjr) + ' = <b>' + eur(lim) + '</b>');
      st.push('ARE journalière brute : <b>' + eur(aj) + '</b>');
      add('are', 'SJR de ' + eur(sjr) + ' : quelle est l’ARE journalière brute ?', aj, [A, Bv, lim, a.min], eur, st, 3);
    }
    /* 2. Durée d’indemnisation */
    if (dates) for (const [jp, age] of shuffle([[250, 'u55'], [320, 'u55'], [480, 'u55'], [900, 'u55'], [800, 'a55'], [1000, 'a57'], [960, 'a55']]).slice(0, 3)) {
      const r = dates({ fct: new Date('2026-06-01T12:00:00'), sjr: 0, ageBand: age, joursPeriode: jp }), raw = jp * du.coef;
      const st = [nf(jp) + ' jours calendaires × ' + nf(du.coef, 2) + ' = ' + nf(raw, raw % 1 ? 2 : 0) + ' → arrondi à <b>' + day(Math.round(raw)) + '</b>',
        'Minimum : ' + day(du.min) + ' ; maximum ' + AGES[age] + ' : ' + day(du.max[age])];
      if (Math.round(raw) < du.min) st.push('Résultat sous le minimum : on applique ' + day(du.min));
      if (Math.round(raw) > du.max[age]) st.push('Résultat au-dessus du maximum : on applique ' + day(du.max[age]));
      st.push('Durée d’indemnisation : <b>' + day(r.dureeReelle) + '</b>');
      add('are', 'Allocataire de ' + AGES[age] + ', période de référence de ' + nf(jp) + ' jours calendaires : durée d’indemnisation ?', r.dureeReelle, [Math.round(raw), du.max[age], du.min, jp], day, st, 3);
    }
    /* 3. Différé congés payés */
    if (dates) for (const [cp, sjr] of shuffle([[800, 62], [1500, 78.89], [2600, 70], [4000, 95], [5000, 120]]).slice(0, 2)) {
      const r = dates({ fct: new Date('2026-10-15T12:00:00'), sjr, cp, ageBand: 'u55' }), raw = cp / sjr;
      const st = ['ICCP ÷ SJR : ' + eur(cp) + ' ÷ ' + eur(sjr) + ' = ' + nf(raw, 2) + ' → arrondi à l’entier inférieur : ' + day(Math.floor(raw)),
        'Plafond : ' + day(df.cpMax) + (Math.floor(raw) > df.cpMax ? ' → on retient ' + day(df.cpMax) : ''), 'Différé congés payés : <b>' + day(r.diffCp) + '</b>'];
      add('diff', 'Indemnité compensatrice de congés payés de ' + eur(cp) + ', SJR de ' + eur(sjr) + ' : différé congés payés ?', r.diffCp, [Math.ceil(raw), Math.round(raw * 30 / 26), df.cpMax], day, st, 3);
    }
    /* 4. Différé spécifique */
    if (dates) for (const [sup, eco] of shuffle([[3000, false], [8000, false], [12000, true], [20000, false], [30000, true]]).slice(0, 2)) {
      const r = dates({ fct: new Date('2026-10-15T12:00:00'), sjr: 80, supra: sup, eco, ageBand: 'u55' }), raw = sup / df.diviseur, cap = eco ? df.specMaxEco : df.specMax;
      const st = ['Indemnités supra-légales ÷ ' + nf(df.diviseur, 1) + ' : ' + eur(sup) + ' ÷ ' + nf(df.diviseur, 1) + ' = ' + nf(raw, 2) + ' → arrondi à l’entier inférieur : ' + day(Math.floor(raw)),
        'Plafond ' + (eco ? '(licenciement économique) ' : '') + ': ' + day(cap) + (Math.floor(raw) > cap ? ' → on retient ' + day(cap) : ''), 'Différé spécifique : <b>' + day(r.diffSpec) + '</b>'];
      add('diff', 'Indemnités supra-légales de ' + eur(sup) + (eco ? ' (licenciement économique)' : '') + ' : différé spécifique ?', r.diffSpec, [Math.ceil(raw), Math.round(sup / 100), cap, eco ? df.specMax : df.specMaxEco], day, st, 3);
    }
    /* 5. Total des différés + délai d’attente */
    if (dates) { const cp = pick([1200, 1800]), sjr = pick([60, 80]), sup = pick([4000, 6000]);
      const r = dates({ fct: new Date('2026-10-15T12:00:00'), sjr, cp, supra: sup, ageBand: 'u55' });
      add('diff', 'ICCP ' + eur(cp) + ', SJR ' + eur(sjr) + ', supra-légales ' + eur(sup) + ' : nombre total de jours avant le premier jour indemnisable ?', r.total, [r.diffCp + r.diffSpec, r.total - df.attente + 3, r.diffCp + df.attente], day,
        ['Différé congés payés : ' + eur(cp) + ' ÷ ' + eur(sjr) + ' → ' + day(r.diffCp), 'Différé spécifique : ' + eur(sup) + ' ÷ ' + nf(df.diviseur, 1) + ' → ' + day(r.diffSpec), 'Délai d’attente : ' + day(r.attente), 'Total : ' + r.diffCp + ' + ' + r.diffSpec + ' + ' + r.attente + ' = <b>' + day(r.total) + '</b>'], 3); }
    /* 6. Cumul ARE et reprise d’activité */
    if (cumul) for (const [aj, brut] of shuffle([[57, 2100], [45, 900], [66.3, 1500], [40, 600], [52, 1300]]).slice(0, 2)) {
      const sjr = r2(aj / 0.57 * 1.4), r = cumul({ aj, brut, sjr, mois: '2026-11' });
      const st = ['ARE mensuelle théorique : ' + eur(aj) + ' × 30 = ' + eur(r.areM), 'Rémunération déduite : ' + pct(b.cumul.remun) + ' × ' + eur(brut) + ' = ' + eur(r2(r.deduit)),
        '(' + eur(r.areM) + ' − ' + eur(r2(r.deduit)) + ') ÷ ' + eur(aj) + ' = ' + nf(r.jBrut, 2) + ' → arrondi à ' + day(Math.max(0, Math.min(30, Math.round(r.jBrut))))];
      if (r.plafondAtteint) st.push('Salaire + ARE ne peuvent pas dépasser le salaire de référence : jours réduits à ' + day(r.j));
      st.push('Jours indemnisés dans le mois : <b>' + day(r.j) + '</b> (complément de ' + eur(r.complement) + ' brut)');
      add('cumul', 'AJ de ' + eur(aj) + ', reprise d’emploi à ' + eur(brut) + ' brut dans le mois : combien de jours d’ARE versés ?', r.j, [Math.floor(r.jBrut) === r.j ? Math.ceil(r.jBrut) : Math.floor(r.jBrut), Math.round((r.areM - brut) / aj), 30 - r.j], day, st, 'cns');
    }
    /* 7. Dégressivité */
    for (const aj of shuffle([110, 130, 150, 180]).slice(0, 2)) {
      const red = r2(Math.max(dg.seuil, aj * dg.coef));
      add('are', 'Allocataire de moins de ' + dg.ageLimite + ' ans, AJ de ' + eur(aj) + ' : montant à partir du ' + dg.moisDebut + 'e mois ?', red, [aj, r2(aj * 0.75), r2(aj * 0.8), dg.seuil], eur,
        ['AJ supérieure à ' + eur(dg.seuil) + ' et moins de ' + dg.ageLimite + ' ans : dégressivité applicable', eur(aj) + ' × ' + nf(dg.coef, 1) + ' = ' + eur(r2(aj * dg.coef)), 'Sans pouvoir descendre sous ' + eur(dg.seuil) + ' → <b>' + eur(red) + '</b>'], 3);
    }
    /* 8. Micro-entreprise : revenu retenu */
    if (b.cns && b.cns.abat) for (const [k, lbl] of shuffle([['vente', 'vente de marchandises'], ['bic', 'prestations de services (BIC)'], ['bnc', 'activité libérale (BNC)']]).slice(0, 2)) {
      const ca = pick([6000, 9000, 12000, 15000]), ab = b.cns.abat[k], rev = r2(ca * (1 - ab));
      add('cumul', 'Micro-entrepreneur, ' + lbl + ', chiffre d’affaires annuel de ' + eur(ca) + ' : revenu retenu après abattement ?', rev, [r2(ca * (1 - b.cns.abat.bic)), r2(ca * (1 - b.cns.abat.bnc)), r2(ca * (1 - b.cns.abat.vente)), r2(ca * 0.5), ca], eur,
        ['Abattement forfaitaire ' + lbl + ' : ' + pct(ab), eur(ca) + ' × (1 − ' + pct(ab) + ') = <b>' + eur(rev) + '</b>'], 'cns');
    }
    return L.filter(q => q.opts.includes(q.ok) && new Set(q.opts).size === q.opts.length && q.opts.length >= 3);
  }

  /* ---------- Vue « Formation » ---------- */
  const V = document.createElement('div');
  V.id = 'view-formation'; V.className = 'hidden flex-1 flex flex-col overflow-hidden bg-slate-950 fr-view';
  V.innerHTML = '<div class="rg-panel" hidden></div><div class="h-12 border-b border-slate-800 bg-slate-900/90 px-4 md:px-6 flex items-center justify-between shrink-0 z-10"><div class="flex items-center gap-2"><div class="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold text-xs shrink-0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg></div><div><h2 class="text-xs md:text-sm font-bold text-white tracking-tight flex items-center gap-2"><span>Mode formation</span><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30 font-normal">Quiz</span></h2></div></div></div><div class="flex-1 overflow-y-auto p-4 md:p-6"><div class="max-w-3xl mx-auto" id="qz"></div></div>';
  const anc = $('view-delais'); if (anc) anc.parentElement.appendChild(V);
  NAV_TABS_CONFIG.push({ id: 'formation', name: 'Mode formation', desc: 'Quiz sur les règles et les calculs, pour s’entraîner', icon: 'graduation-cap', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30', badge: 'Quiz' });
  try { FT_KW.formation = 'formation quiz entraînement nouveau conseiller apprendre réviser test questions'; } catch (e) {}

  let S = null, theme = 'all';
  const best = () => { try { return JSON.parse(localStorage.getItem('ft_quiz_best') || '{}') || {}; } catch (e) { return {}; } };
  function start() {
    const pool = rules().concat(calcs()).filter(x => theme === 'all' || x.th === theme);
    const r = shuffle(pool.filter(x => !x.calc)), c = shuffle(pool.filter(x => x.calc));
    const qs = []; while (qs.length < 10 && (r.length || c.length)) { if (r.length && (qs.length % 3 !== 2 || !c.length)) qs.push(r.shift()); else qs.push(c.shift()); }
    S = { qs, i: 0, score: 0, wrong: [], picked: null };
    draw();
  }
  function home() {
    const h = $('qz'); if (!h) return;
    const all = rules().concat(calcs()), bs = best();
    h.innerHTML = '<div class="qz-intro"><h3>Entraînez-vous sur les règles et les calculs</h3><p>10 questions tirées du barème en vigueur et des cas de contrôle des simulateurs : les réponses suivent automatiquement les mises à jour réglementaires. Idéal pour les nouveaux conseillers ou pour réviser après une réforme.</p>' +
      '<div class="qz-th" role="group" aria-label="Thème">' + THEMES.map(t => { const n = t[0] === 'all' ? all.length : all.filter(x => x.th === t[0]).length; return n ? '<button type="button" data-th="' + t[0] + '" class="' + (t[0] === theme ? 'on' : '') + '">' + esc(t[1]) + ' <em>' + n + '</em></button>' : ''; }).join('') + '</div>' +
      '<div class="qz-row"><button type="button" class="ad-btn pri" data-qz="go">Commencer le quiz</button>' + (bs[theme] != null ? '<span class="qz-best">Meilleur score : <b>' + bs[theme] + '/10</b></span>' : '') + '</div></div>';
  }
  function draw() {
    const h = $('qz'); if (!h || !S) return;
    if (S.i >= S.qs.length) return end();
    const q = S.qs[S.i], done = S.picked != null;
    h.innerHTML = '<div class="qz-card"><div class="qz-top"><span>Question ' + (S.i + 1) + ' / ' + S.qs.length + '</span><span class="qz-tag">' + esc((THEMES.find(t => t[0] === q.th) || [0, ''])[1]) + '</span><span>Score : ' + S.score + '</span></div>' +
      '<div class="qz-bar"><i style="width:' + Math.round(S.i / S.qs.length * 100) + '%"></i></div>' +
      '<h3 class="qz-q">' + esc(q.text) + '</h3><div class="qz-opts">' + q.opts.map((o, k) => '<button type="button" data-o="' + k + '" class="' + (done ? (o === q.ok ? 'ok' : (k === S.picked ? 'ko' : 'dim')) : '') + '"' + (done ? ' disabled' : '') + '>' + esc(o) + '</button>').join('') + '</div>' +
      (done ? '<div class="qz-expl ' + (q.opts[S.picked] === q.ok ? 'ok' : 'ko') + '" role="status"><b>' + (q.opts[S.picked] === q.ok ? '✅ Bonne réponse' : '❌ La bonne réponse : ' + esc(q.ok)) + '</b><p>' + esc(q.expl) + '</p>' + (q.steps ? '<ol class="qz-steps">' + q.steps.map(x => '<li>' + x + '</li>').join('') + '</ol>' : '') + '</div>' +
        '<div class="qz-row">' + (q.go != null ? '<button type="button" class="ad-btn" data-qz="tool" data-go="' + esc(q.go) + '">Voir dans l’outil</button>' : '') + '<button type="button" class="ad-btn pri" data-qz="next">' + (S.i + 1 < S.qs.length ? 'Question suivante' : 'Voir mon score') + '</button></div>' : '') + '</div>';
    const f = h.querySelector(done ? '[data-qz="next"]' : '.qz-opts button'); if (f) f.focus();
  }
  function end() {
    const h = $('qz'), n = S.qs.length, sc = S.score, bs = best();
    if (bs[theme] == null || sc > bs[theme]) { bs[theme] = sc; try { localStorage.setItem('ft_quiz_best', JSON.stringify(bs)); } catch (e) {} }
    const msg = sc >= 9 ? 'Excellent, vous maîtrisez le sujet !' : sc >= 7 ? 'Très bien, quelques points à revoir.' : sc >= 5 ? 'Pas mal : revoyez les réponses ci-dessous.' : 'À retravailler : les fiches des outils vous aideront.';
    h.innerHTML = '<div class="qz-card qz-end"><div class="qz-score">' + sc + '<small>/' + n + '</small></div><p>' + msg + '</p>' +
      '<div class="qz-rev"><h4>Détail des réponses</h4>' + S.qs.map((q, i) => '<details' + (q.mine !== q.ok ? ' open' : '') + '><summary><span>' + (q.mine === q.ok ? '✅' : '❌') + '</span><b>' + (i + 1) + '. ' + esc(q.text) + '</b></summary>' +
        '<div class="qz-rev-b">' + (q.mine !== q.ok ? '<p>Votre réponse : <s>' + esc(q.mine) + '</s></p>' : '') + '<p>Bonne réponse : <b>' + esc(q.ok) + '</b></p><p>' + esc(q.expl) + '</p>' + (q.steps ? '<ol class="qz-steps">' + q.steps.map(x => '<li>' + x + '</li>').join('') + '</ol>' : '') + '</div></details>').join('') + '</div>' +
      '<div class="qz-row"><button type="button" class="ad-btn" data-qz="home">Changer de thème</button><button type="button" class="ad-btn pri" data-qz="go">Nouveau quiz</button></div></div>';
  }
  V.addEventListener('click', e => {
    const th = e.target.closest('[data-th]'); if (th) { theme = th.dataset.th; home(); return; }
    const o = e.target.closest('.qz-opts [data-o]');
    if (o && S && S.picked == null) { S.picked = +o.dataset.o; const q = S.qs[S.i]; q.mine = q.opts[S.picked]; if (q.mine === q.ok) S.score++; else S.wrong.push(q); draw(); return; }
    const b = e.target.closest('[data-qz]'); if (!b) return;
    const a = b.dataset.qz;
    if (a === 'go') start();
    else if (a === 'home') { S = null; home(); }
    else if (a === 'next') { S.i++; S.picked = null; draw(); }
    else if (a === 'tool') { const g = b.dataset.go; switchNavTab(/^\d+$/.test(g) ? +g : g); }
  });
  function render() {
    const on = tab() === 'formation'; V.classList.toggle('hidden', !on); if (!on) return;
    const n = $('header-active-tab-name'); if (n) n.textContent = 'Autres outils · Mode formation';
    if (!S && !$('qz').firstChild) home();
  }
  const _sw = switchNavTab;
  switchNavTab = function () { const r = _sw.apply(this, arguments); setTimeout(render, 30); return r; };

  /* Menu : sous « Questions fréquentes » */
  if (typeof renderBurgerTabs === 'function') {
    const _rb = renderBurgerTabs;
    renderBurgerTabs = function () {
      const r = _rb.apply(this, arguments);
      const c = $('burger-tabs-list'); if (!c || c.querySelector('button[onclick="switchNavTab(\'formation\')"]')) return r;
      const model = c.querySelector('button[onclick="switchNavTab(\'faq\')"]') || c.querySelector('button[onclick="switchNavTab(\'jour\')"]'); if (!model) return r;
      const b = model.cloneNode(true); b.setAttribute('onclick', "switchNavTab('formation')");
      if (tab() !== 'formation') b.className = model.className.replace(/bg-gradient[^ ]*|from-[^ ]*|to-[^ ]*|border-cyan[^ ]*|shadow[^ ]*/g, '');
      const lb = b.querySelector('.text-xs'), d = b.querySelector('p'), ic = b.querySelector('svg');
      if (lb) { lb.textContent = 'Mode formation'; delete lb.dataset.lbOrig; } if (d) d.textContent = 'Quiz sur les règles et les calculs, pour s’entraîner';
      if (ic) { const n = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ['viewBox', '0 0 24 24', 'fill', 'none', 'stroke', 'currentColor', 'stroke-width', '2', 'stroke-linecap', 'round', 'stroke-linejoin', 'round'].forEach((v, i, a) => { if (i % 2 === 0) n.setAttribute(v, a[i + 1]); }); n.setAttribute('class', ic.getAttribute('class') || ''); n.innerHTML = '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>'; ic.replaceWith(n); }
      b.querySelectorAll('.ft-pen-wrap,.ft-pen,.ft-star').forEach(x => x.remove());
      model.parentNode.insertBefore(b, model.nextSibling); return r;
    };
    try { renderBurgerTabs(); } catch (e) {}
  }
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Mode formation', s: 'Quiz de 10 questions sur les règles et les calculs', kw: 'formation quiz entraînement réviser apprendre nouveau conseiller', run: () => switchNavTab('formation') });
  try { if (typeof HOME_GROUPS !== 'undefined' && HOME_GROUPS[0] && !HOME_GROUPS[0].ids.includes('formation')) HOME_GROUPS[0].ids.push('formation'); } catch (e) {}
  window.ftQuiz = { rules, calcs };
})();
