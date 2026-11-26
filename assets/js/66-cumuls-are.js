(function () {
  /* Complément ARE : ce qui se cumule avec l'ARE, sous conditions, ou pas. Contenu sourcé (Unédic, France Travail, Service-public). */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = {
    cumul: ['Unédic : cumul ARE-rémunération', 'https://www.unedic.org/indemnisation/fiches-thematiques/cumul-allocation-salaire'],
    are: ['Unédic : fiche ARE', 'https://www.unedic.org/indemnisation/fiches-thematiques/allocation-daide-au-retour-lemploi-are'],
    inval: ['France Travail : pension d’invalidité', 'https://www.francetravail.fr/faq/candidat/mes-allocations---mes-aides/lallocation-chomage-en-fonction/cumul-pension-invalidite-et-allo.html'],
    vieil: ['France Travail : 55 ans ou plus', 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/a-chaque-situation-son-allocatio/quelle-est-ma-situation-personne/jai-53-ans-ou-plus.html'],
    emploi: ['France Travail : je retrouve un emploi', 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/a-chaque-situation-son-allocatio/quelle-est-ma-situation-professi/je-reprends-une-activite-ou-une/je-retrouve-un-emploi.html'],
    crea: ['Les-aides.fr (France Travail) : cumul et création', 'https://les-aides.fr/aide/Z3E_3w/pole-emploi/cumul-des-revenus-avec-l-allocation-d-aide-au-retour-a-l-emploi-are.html'],
    rupt: ['Service-public : ARE du secteur privé', 'https://www.service-public.gouv.fr/particuliers/vosdroits/F14860'],
    rsa: ['Service-public : RSA et chômage', 'https://www.service-public.gouv.fr/particuliers/vosdroits/F20218'],
    minima: ['Unédic : chômage, prime d’activité et RSA', 'https://www.unedic.org/publications/comment-s-articulent-chomage-prime-d-activite-et-rsa'],
    minima2: ['Unédic : allocataires et minima sociaux', 'https://www.unedic.org/publications/les-allocataires-de-l-assurance-chomage-percoivent-ils-des-minima-sociaux'],
    maladie: ['France Travail : arrêt maladie', 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/a-chaque-situation-son-allocatio/quelle-est-ma-situation-professi/je-suis-en-cours-dindemnisation/je-suis-en-arret-maladie.html'],
    maladie2: ['Unédic : arrêt maladie', 'https://www.unedic.org/l-assurance-chomage-et-vous/demandeur-d-emploi-ou-salarie/mes-droits-en-fonction-de-mon-parcours/je-suis-en-arret-maladie-que-deviennent-mes-allocations-chomage'],
    mater: ['France Travail : congé maternité ou adoption', 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/allocations-et-aides--les-repons/allocations--attention-aux-idees/est-ce-que-je-perds-mes-droits-1.html'],
    pater: ['Unédic : congé maternité ou paternité', 'https://www.unedic.org/l-assurance-chomage-et-vous/demandeur-d-emploi-ou-salarie/mes-droits-en-fonction-de-mon-parcours/je-suis-en-conge-maternite-ou-en-conge-paternite-que-deviennent-mes-allocations-chomage'],
    civ: ['France Travail : service civique et volontariat', 'https://www.francetravail.fr/candidat/mes-droits-aux-aides-et-allocati/a-chaque-situation-son-allocatio/quelle-est-ma-situation-personne/je-suis-en-service-civique-volon.html'],
    aref: ['Service-public : formation et AREF', 'https://www.service-public.gouv.fr/particuliers/vosdroits/F1605']
  };
  const DATA = [
    ['ok', 'Cumulable', 'L’ARE est versée en totalité.', [
      ['Pension d’invalidité de 1ʳᵉ catégorie', 'Cumulable à 100 % avec l’ARE.', ['are']],
      ['Activité conservée', 'Activité déjà exercée avant la fin du contrat (ou avant l’inscription) et poursuivie : ses revenus se cumulent intégralement avec l’ARE. Elle reste à déclarer chaque mois.', ['crea']],
      ['Pension d’invalidité de 2ᵉ ou 3ᵉ catégorie déjà cumulée', 'Cumul intégral si la pension était déjà perçue en même temps que les salaires de l’activité qui a ouvert le droit.', ['inval']],
      ['Indemnité légale de licenciement ou de rupture', 'La part légale ne retarde pas le versement de l’ARE. Seule la part au-delà du légal déclenche le différé spécifique (voir « Sous conditions »).', ['rupt']]
    ]],
    ['mid', 'Sous conditions', 'L’ARE est réduite, retardée ou complétée.', [
      ['Reprise d’un emploi salarié', 'Allocation du mois = ARE mensuelle − 70 % du salaire brut repris. Le total salaire + ARE ne peut pas dépasser le salaire de référence. Rester inscrit et déclarer l’activité à chaque actualisation. Les jours non payés prolongent les droits.', ['cumul', 'emploi']],
      ['Création ou reprise d’entreprise pendant l’indemnisation', 'Même principe : 70 % du revenu professionnel est déduit de l’ARE. En micro-entreprise, le revenu retenu est le chiffre d’affaires moins l’abattement forfaitaire (71 % achat-revente, 50 % services, 34 % libéral). Si le revenu n’est pas encore connu, 70 % de l’ARE est versé à titre provisoire.', ['crea']],
      ['Pension d’invalidité de 2ᵉ ou 3ᵉ catégorie', 'Déduite en totalité de l’ARE si elle n’a jamais été cumulée avec les revenus de l’activité prise en compte pour ouvrir le droit (sinon : cumul intégral).', ['inval']],
      ['Pension de retraite ou avantage vieillesse', 'Une partie du montant net de la pension est déduite de l’ARE : 25 % entre 50 et 55 ans, 50 % entre 55 et 60 ans, 75 % à partir de 60 ans.', ['vieil']],
      ['Indemnités supra-légales de rupture', 'La part qui dépasse l’indemnité légale (indemnité conventionnelle, supra-légale, clause de non-concurrence…) entraîne un différé spécifique avant le premier versement.', ['rupt']],
      ['Indemnité compensatrice de congés payés', 'Cumulable, mais elle retarde le premier versement : différé congés payés = indemnité ÷ salaire journalier de référence.', ['rupt']],
      ['RSA', 'Peut être versé en même temps que l’ARE, en complément : son montant forfaitaire est diminué du montant de l’ARE.', ['rsa', 'minima2']],
      ['Prime d’activité', 'Peut s’ajouter à l’ARE en cas de reprise d’emploi, selon le salaire repris et les ressources du foyer (la CAF calcule).', ['minima', 'minima2']]
    ]],
    ['no', 'Non cumulable', 'Le versement de l’ARE s’arrête ou est remplacé.', [
      ['Arrêt maladie, accident du travail', 'Le versement de l’ARE est interrompu (les IJ de l’Assurance maladie prennent le relais). Les droits ne sont pas perdus : la période non payée prolonge l’indemnisation. Arrêt de plus de 15 jours : la personne n’est plus considérée comme demandeur d’emploi et doit se réinscrire dans les 5 jours suivant la fin de l’arrêt.', ['maladie', 'maladie2']],
      ['Congé maternité, paternité ou d’adoption', 'ARE suspendue pendant le congé, remplacée par les IJ. Les droits restants reprennent ensuite, dans les mêmes conditions.', ['mater', 'pater']],
      ['Service civique ou volontariat (VIE, VIA)', 'L’ARE d’un allocataire déjà indemnisé est suspendue pendant la mission. Ces périodes allongent le délai de déchéance des droits.', ['civ']],
      ['Allocation de solidarité spécifique (ASS)', 'Ne peut être versée qu’après épuisement de l’ARE : jamais en même temps.', ['minima2']],
      ['Formation prescrite par France Travail', 'L’ARE est remplacée par l’AREF pendant la formation.', ['aref']]
    ]]
  ];
  function html() {
    let n = 0;
    return '<section class="cu-wrap" id="cu-cumuls" aria-labelledby="cu-t"><div class="cu-head"><div><h3 id="cu-t">Ce qui se cumule avec l’ARE</h3><p>Revenus et situations : cumulables, sous conditions, ou non cumulables. Touchez une ligne pour la règle et la source.</p></div>' +
      '<label class="cu-search"><i data-lucide="search" class="w-4 h-4" aria-hidden="true"></i><input id="cu-q" type="search" placeholder="Filtrer : retraite, maladie, RSA…" aria-label="Filtrer les motifs"></label></div><div class="cu-cols">' +
      DATA.map(c => '<div class="cu-col cu-' + c[0] + '"><div class="cu-col-h"><span class="cu-dot" aria-hidden="true"></span><strong>' + esc(c[1]) + '</strong><span class="cu-n">' + c[3].length + '</span></div><p class="cu-col-s">' + esc(c[2]) + '</p>' +
        c[3].map(it => '<details class="cu-it" data-k="' + esc((it[0] + ' ' + it[1]).toLowerCase()) + '"><summary>' + esc(it[0]) + '</summary><p>' + esc(it[1]) + '</p><div class="cu-src">' +
          it[2].map(k => '<a href="' + S[k][1] + '" target="_blank" rel="noopener noreferrer">' + esc(S[k][0]) + ' ↗</a>').join('') + '</div></details>').join('') + '</div>').join('') +
      '</div><p class="cu-note">Synthèse indicative (novembre 2026) : la décision notifiée et le règlement d’assurance chômage font foi. Toute activité ou tout revenu se déclare à l’actualisation.</p></section>';
  }
  function mount() {
    const w = $('wiz-cumul'); if (!w) return;
    const ex = $('cu-cumuls');
    if (ex) { if (ex.parentElement.lastElementChild !== ex) ex.parentElement.appendChild(ex); return; }
    w.parentElement.insertAdjacentHTML('beforeend', html());
    try { if (window.lucide) lucide.createIcons(); } catch (e) {}
    const q = $('cu-q');
    q.addEventListener('input', () => {
      const t = q.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      document.querySelectorAll('#cu-cumuls .cu-it').forEach(d => {
        const ok = !t || d.dataset.k.normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(t) >= 0;
        d.hidden = !ok; if (t && ok) d.open = true; if (!t) d.open = false;
      });
      document.querySelectorAll('#cu-cumuls .cu-col').forEach(c => { c.querySelector('.cu-n').textContent = c.querySelectorAll('.cu-it:not([hidden])').length; });
    });
  }
  try { FT_KW[5] = (FT_KW[5] || '') + ' cumul cumulable non cumulable pension invalidite retraite maladie maternite rsa prime activite service civique ass aref'; } catch (e) {}
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  setTimeout(mount, 800);
  try { const _sw = switchNavTab; switchNavTab = function () { const r = _sw.apply(this, arguments); setTimeout(mount, 120); return r; }; } catch (e) {}
})();
