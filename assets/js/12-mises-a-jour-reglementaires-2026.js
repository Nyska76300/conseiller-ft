/* ================= Extension 17 : mises à jour réglementaires 2026 (règles, motifs, sources) ================= */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  /* ---------- 1. Fiches de démission ---------- */
  try {
    const m = DEMISSION_MOTIFS.find(x => x.id === 'reconversion_transitions_pro');
    if (m) {
      m.vigilance = m.vigilance + ' Contrôle : France Travail vérifie la mise en œuvre du projet dans les 6 mois suivant l’ouverture des droits ; sans motif valable, suspension de 4 mois. Le CEP doit être assuré par un organisme agréé (Apec, Cap emploi…), pas par France Travail ni la mission locale.';
    }
    if (!DEMISSION_MOTIFS.some(x => x.id === 'abandon_poste')) {
      DEMISSION_MOTIFS.push({
        id: 'abandon_poste', title: 'Abandon de poste : présumé démission', category: 'Professionnel & Création',
        summary: 'Le salarié qui abandonne volontairement son poste est présumé avoir démissionné : la fin de contrat est traitée comme une démission.',
        tag: 'Dém. non légitime - présomption', badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/20', icon: 'user-x',
        conditions: 'Même régime que la démission : aucun droit à l’ARE sauf motif légitime. Les voies habituelles restent ouvertes : 65 jours ou 455 heures travaillés depuis la fin du contrat, ou réexamen par l’instance paritaire après 121 jours de chômage non indemnisé.',
        justificatifs: ['Attestation employeur mentionnant le motif de rupture', 'Éventuels justificatifs d’un motif légitime (plainte, jugement sur salaires impayés…)'],
        delais: 'Réexamen possible à partir du 121e jour de chômage non indemnisé ; l’ARE démarre au 122e jour si l’avis est favorable.',
        vigilance: 'Vérifier le motif exact porté sur l’attestation employeur. Source : fiche Unédic « Démission » (abandon de poste présumé démission).'
      });
    }
  } catch (e) {}

  /* ---------- 2. Blocs « Mises à jour 2026 » dans les onglets de règles ---------- */
  const EXTRA = {
    demission: ['Abandon de poste : présumé démission, traité comme une démission (aucun droit sauf motif légitime).', 'Un arrêt maladie de 21 jours ou plus prolonge le délai de 121 jours avant le réexamen.', 'Démission pour projet professionnel : CEP agréé avant la démission, attestation Transitions Pro, 1 300 jours travaillés sur 60 mois, inscription dans les 6 mois de l’attestation, contrôle à 6 mois (suspension de 4 mois sans motif valable).'],
    admission: ['Primo-entrants (aucune admission à l’ARE dans les 20 années précédentes), fins de contrat à compter du 01/04/2026 : la condition de droit commun est examinée d’abord, puis une durée réduite de 108 jours ou 758 heures sur 24 ou 36 mois. Indemnisation minimale de 5 mois (152 jours).', 'Congé supplémentaire de naissance (à compter du 01/07/2026) : assimilé au congé de paternité. Il est pris en compte pour le délai de forclusion, la durée d’indemnisation, le salaire de référence et le délai de déchéance.', 'Salaire de référence : les périodes d’activité partielle de longue durée « Rebond » s’ajoutent aux suspensions pour lesquelles France Travail reconstitue le salaire.'],
    rci: ['Fin de contrat à compter du 01/09/2026 : plafond de 15 mois (456 j) avant 55 ans et 20,5 mois (624 j) à 55 ans et plus. Outre-mer : 608 j et 913 j. Rupture conventionnelle collective non concernée.', 'Prolongation à 55 ans et plus (avenant n°2, art. 39 §4) : information 60 jours avant le plafond, demande possible jusqu’à 30 jours après l’atteinte du plafond, examen dans le mois suivant le 360e jour d’indemnisation, effet à la date de la demande. Refus : instance paritaire à saisir sous 30 jours.', 'Pas de complément de fin de droits pour ces allocataires, sous réserve des conditions de l’article 9 bis.'],
    delais: ['Congé supplémentaire de naissance (à compter du 01/07/2026) : il peut repousser le délai de forclusion de 12 mois et le délai de déchéance.'],
    ans: ['ARCE, créateurs ou repreneurs sous forme de Scop : pour le second versement, il n’est plus exigé de justifier qu’ils n’occupent pas un CDI à temps plein dans la même Scop (fins de contrat à compter du 01/09/2026).'],
    retraite: ['Maintien jusqu’à la retraite à taux plein : l’âge de référence n’est plus 64 ans mais l’âge d’ouverture du droit à pension de retraite. Les générations 1964 à 1969 sont concernées par la suspension de la réforme (voir la table de l’outil).']
  };
  const ZONES = { demission: 'demission', od: 'admission', dossier: 'admission', rci: 'rci', delais: 'delais', ans: 'ans', retraite: 'retraite' };
  Object.keys(ZONES).forEach(view => {
    const v = $('view-' + view); if (!v) return;
    const panel = v.querySelector('.rg-panel'); if (!panel) return;
    const items = EXTRA[ZONES[view]]; if (!items) return;
    const add = () => {
      if (panel.hidden || panel.querySelector('.rg-extra')) return;
      const d = document.createElement('div'); d.className = 'rg-extra';
      d.innerHTML = '<h4 class="wiz-h">Mises à jour 2026</h4><ul class="rg-rules">' + items.map(t => '<li>' + escapeHtml(t) + '</li>').join('') + '</ul>';
      const hint = panel.querySelector('.wiz-hint'); if (hint) panel.insertBefore(d, hint); else panel.appendChild(d);
    };
    new MutationObserver(add).observe(panel, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  });

  /* ---------- 3. Lignes de la page Sources ---------- */
  if (window.FT_SOURCES) {
    const U = 'Unédic (fiches et avenant n°2 du 10/04/2026)';
    const row = window.FT_SOURCES.find(r => r[0] === 'Territoires');
    if (row) { row[1] = 'Outre-mer'; row[2] = 'Rupture conventionnelle : 608 j et 913 j pris en compte dans le simulateur de rupture conventionnelle ; autres règles locales non intégrées'; row[3] = U; row[4] = 'À confirmer'; }
    const ar = window.FT_SOURCES.find(r => r[0] === 'ANS' && /Maintien/.test(r[1] + r[2]));
    if (ar) { ar[2] = 'L’écran Maintien propose maintenant les trois abattements du CNS (50 %, 71 %, 34 %) ; la comparaison ARCE et maintien reste à confirmer'; }
    [
      ['Démission', 'Voies après démission non légitime', '65 jours ou 455 h travaillés, ou réexamen après 121 jours de chômage non indemnisé (délai prolongé par un arrêt maladie de 21 jours ou plus)', 'Unédic, fiche « Démission »', 'Vérifié'],
      ['Démission', 'Projet professionnel', 'CEP agréé, commission Transitions Pro, 1 300 jours sur 60 mois, inscription sous 6 mois, contrôle à 6 mois et suspension de 4 mois', 'Unédic, fiche « Démission pour poursuivre un projet professionnel »', 'Vérifié'],
      ['Démission', 'Abandon de poste', 'Présumé démission', 'Unédic, fiche « Démission »', 'Vérifié'],
      ['Admission', 'Primo-entrants', '108 jours ou 758 heures, minimum de 152 jours indemnisés, fins de contrat à compter du 01/04/2026', 'Unédic, actualité primo-entrants', 'Vérifié'],
      ['Admission', 'Congé supplémentaire de naissance', 'Assimilé au congé de paternité : forclusion, durée, salaire de référence, déchéance (à compter du 01/07/2026) ; calculs détaillés non intégrés', U, 'À confirmer'],
      ['Durée', 'Prolongation après rupture conventionnelle (55 ans et plus)', 'Information à 60 jours du plafond, demande jusqu’à 30 jours après, examen le mois suivant le 360e jour ; l’outil mentionne aussi un bilan au 365e jour : à harmoniser', U, 'À confirmer'],
      ['SJR', 'Salaire journalier de référence', 'Salaires de la période (730 j, 1 095 j à 55 ans et plus) ÷ jours d’emploi + jours sans emploi limités à 70 % des jours d’emploi ; reconstitution des suspensions non automatisée', 'Unédic, fiche « Salaire de référence » (exemple de la fiche incohérent)', 'À confirmer'],
      ['Net', 'Retenues sociales (estimation du net)', 'Retraite complémentaire 3 % du SJR ; CSG 6,2 % et CRDS 0,5 % sur 98,25 % ; Alsace-Moselle 1,20 ou 1,50 % ; base exacte de la CSG et seuil de 61 € à confirmer (la fiche et son exemple divergent)', 'Unédic, fiche « Retenues sociales »', 'À confirmer'],
      ['ARCE', 'Scop', 'Second versement : plus de condition de non-CDI à temps plein dans la même Scop', U, 'Vérifié'],
      ['Retraite', 'Âge de référence', 'Âge d’ouverture du droit à pension (et non 64 ans) ; générations 1964 à 1969 selon la suspension de la réforme', U, 'Vérifié']
    ].forEach(r => window.FT_SOURCES.push(r));
  }

  /* ---------- 4. Cas de contrôle ---------- */
  [
    { n: 'SJR : emploi continu de 730 jours', run: () => ftSjrCompute({ sr: 36500, span: 730, emploi: 730 }).sjr, exp: 50, d: 2 },
    { n: 'SJR : jours sans emploi limités à 70 % des jours d’emploi', run: () => ftSjrCompute({ sr: 18250, span: 730, emploi: 365 }).sjr, exp: 18250 / 620.5, d: 2 },
    { n: 'Net : exemple de la fiche Unédic (SJR 120 €, ARE 70,40 €)', run: () => ftNetCompute({ aj: 70.4, sjr: 120, type: 'are' }).net, exp: 62.41, d: 1 },
    { n: 'Net : ASP ou ARE-F, seule la retraite complémentaire est retenue', run: () => ftNetCompute({ aj: 70.4, sjr: 120, type: 'aref' }).net, exp: 66.8, d: 2 },
    { n: 'Net : exonération de CSG et CRDS', run: () => ftNetCompute({ aj: 70.4, sjr: 120, type: 'are', exo: true }).net, exp: 66.8, d: 2 }
  ].forEach(c => FT_CASES.push(c));
})();
