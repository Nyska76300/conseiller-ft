(function () {
  /* « Que faire si… » : une situation décrite avec ses mots → le bon outil, le bon modèle de mail et le point clé.
     Les situations apparaissent dans la recherche (Ctrl+K, loupe) et dans une liste complète. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const B = () => { try { return BAREME; } catch (e) { return null; } };
  const e2 = n => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  /* [situation, mots-clés, outil, modèle de mail, point clé (texte ou fonction lisant le barème)] */
  const S = [
    ['Reprise d’un emploi pendant l’indemnisation', 'reprise emploi cdd cdi interim mission travaille salaire cumul activite reduite complement', 5, 'bm-m040', b => 'Déclarer heures et salaire brut à l’actualisation : ' + Math.round(b.cumul.remun * 100) + ' % du brut est déduit de l’ARE du mois.'],
    ['Trop-perçu notifié', 'trop percu indu dette remboursement rembourser echeancier notification', 6, 'bm-m030', b => 'Pas de recouvrement sous ' + b.indu.seuilRecup + ' € ; prescription ' + b.indu.prescription + ' ans (' + b.indu.prescriptionFraude + ' ans en cas de fraude). Échéancier possible.'],
    ['Trop-perçu contesté ou recours', 'contestation trop percu recours contentieux conteste desaccord', 6, 'bm-umrsxw8hl3d81', 'Vérifier l’origine (activité non déclarée, erreur de calcul) avant de répondre ; orienter vers le recours si désaccord.'],
    ['Demande d’effacement de dette', 'effacement remise dette annulation precarite difficultes', 6, 'bm-m026', 'Demande à motiver (pages 5 et 6 du formulaire) ; décision de l’IPR.'],
    ['Démission', 'demission quitte emploi depart volontaire legitime', 2, 'bm-m009', b => 'Démission non légitime : pas d’ARE, sauf 65 jours ou 455 h travaillés ensuite, ou réexamen après 121 jours.'],
    ['Démission pour projet de reconversion', 'demission reconversion projet professionnel ipr transition', 2, 'bm-umsfri8le47pq', 'Projet à faire valider par la commission paritaire (IPR) avant la démission, avec le conseil en évolution professionnelle.'],
    ['Rupture conventionnelle', 'rupture conventionnelle rci accord employeur indemnite', 9, 'bm-m005', b => 'Fin de contrat à compter du ' + b.duree.rci.effet.split('-').reverse().join('/') + ' : durée maximale réduite (' + b.duree.rci.u55 + ' jours avant 55 ans).'],
    ['Licenciement économique : CSP', 'licenciement economique csp securisation professionnelle asp', 4, null, b => 'ASP à ' + Math.round(b.csp.taux * 100) + ' % du SJR (ancienneté d’un an et plus), au moins égale à l’ARE.'],
    ['Congés payés et indemnités supra-légales', 'iccp conges payes supra legale indemnite differe carence attente', 7, 'bm-m041', b => 'Différés : congés payés plafonnés à ' + b.differe.cpMax + ' j, supra-légal ÷ ' + String(b.differe.diviseur).replace('.', ',') + ' (max ' + b.differe.specMax + ' j), puis ' + b.differe.attente + ' j d’attente.'],
    ['Quand sera versé le premier paiement ?', 'premier paiement date versement quand delai indemnisation commence', 'delais', 'bm-m002', b => 'Fin de contrat + différés + ' + b.differe.attente + ' jours d’attente = premier jour indemnisé.'],
    ['Expliquer l’admission (taux, durée)', 'admission ouverture droit notification taux duree explication montant', 1, 'bm-m005', b => 'ARE = ' + Math.round(b.are.tauxA * 1000) / 10 + ' % du SJR + ' + e2(b.are.partieFixe) + ' ou 57 % du SJR ; durée = jours calendaires × ' + String(b.duree.coef).replace('.', ',') + '.'],
    ['Calcul du SJR ou du montant net', 'sjr salaire journalier reference net brut csg crds retenues montant', 'sjr', 'bm-umtjso869oxbm', 'Le net tient compte de la retraite complémentaire, puis de la CSG et de la CRDS au-delà des seuils.'],
    ['Création d’entreprise : ARE ou ARCE ?', 'creation entreprise arce maintien are capital auto entrepreneur ans', 3, 'bm-m022', b => 'ARCE = ' + Math.round(b.cumul.arce * 100) + ' % des droits restants, versés en 2 fois ; sinon maintien de l’ARE avec cumul des revenus.'],
    ['Micro-entrepreneur qui cumule avec l’ARE', 'micro entrepreneur auto entrepreneur chiffre affaires cumul non salarie cns urssaf', 'cns', 'bm-m022', b => 'Revenu retenu = CA moins l’abattement (' + Math.round(b.cns.abat.vente * 100) + ' % vente, ' + Math.round(b.cns.abat.bic * 100) + ' % BIC, ' + Math.round(b.cns.abat.bnc * 100) + ' % BNC).'],
    ['Fin de droits ARE', 'fin de droits epuisement plus de droits ass ata rechargement', 'ass', 'bm-umrepzjc83kvn', 'Vérifier d’abord le rechargement (130 j / 910 h), puis l’ASS si les conditions d’activité et de ressources sont remplies.'],
    ['Rechargement des droits', 'rechargement recharger nouveaux droits 130 jours 910 heures', 'droits', 'bm-m035', b => 'Il faut ' + b.affiliation.jours + ' jours ou ' + b.affiliation.heures + ' heures travaillés depuis l’ouverture du droit précédent.'],
    ['Droit d’option', 'droit d option choisir nouveau droit plus favorable', 'droits', 'bm-m033', 'Possible si le nouveau droit est plus favorable (conditions de montant) ; la demande est définitive.'],
    ['Renouvellement de l’ASS', 'ass renouvellement solidarite ressources 6 mois', 'ass', 'bm-m036', b => 'Renouvellement tous les 6 mois ; ASS ' + e2(b.solidarite.ass) + ' par jour.'],
    ['Ancien travailleur indépendant (ATI)', 'ati independant liquidation redressement entreprise ferme', 'ati', null, b => 'ATI de ' + e2(b.ati.plancher) + ' à ' + e2(b.ati.forfait) + ' par jour pendant ' + b.ati.duree + ' jours ; revenus d’au moins ' + b.ati.seuilRevenus.toLocaleString('fr-FR') + ' € sur une année.'],
    ['Formation pendant le chômage', 'formation aref rff stage cpf apprentissage', 'aref', 'bm-umuntlyxkc7lz', b => 'AREF pendant la formation ; RFF possible en fin de droits (plafond ' + e2(b.rff.plafondMensuel) + ' par mois).'],
    ['Départ à la retraite', 'retraite trimestres taux plein age legal fin indemnisation', 8, null, 'Vérifier l’âge et les trimestres : l’ARE s’arrête quand la retraite à taux plein est possible.'],
    ['Pension d’invalidité', 'invalidite pension categorie cumul are maladie', 'invalidite', null, 'Cumul possible selon la catégorie d’invalidité et l’activité antérieure.'],
    ['Sanction ou radiation', 'sanction radiation absence rendez vous recherche emploi cre suppression', 'sanctions', 'bm-umscu00kplkjg', 'Rappeler le motif, la durée et les voies de recours.'],
    ['Frontalier ou travail à l’étranger', 'frontalier etranger suisse luxembourg belgique allemagne europe u1', 'casparts', null, 'Vérifier le pays d’activité et le formulaire U1 (périodes à l’étranger).'],
    ['Intermittent du spectacle', 'intermittent spectacle annexe 8 10 artiste technicien cachet', 'casparts', null, 'Règles spécifiques des annexes 8 et 10 (heures et cachets).'],
    ['Attestation employeur manquante ou erronée', 'attestation employeur manquante erreur illisible signature aem', 'dossier', 'bm-m018', 'Demander une attestation corrigée ou complète à l’employeur ; vérifier la signature (page 5).'],
    ['Actualisation oubliée ou erronée', 'actualisation oubli erreur declaration mensuelle regularisation', 'dossier', 'bm-m020', 'Régulariser la déclaration ; un trop-perçu ou un rappel peut en découler.'],
    ['Allocataire injoignable', 'injoignable relance appel rappel joindre telephone', null, 'bm-m015', 'Laisser une trace écrite et proposer un créneau ou le 3949.'],
    ['Question RSA ou CAF', 'rsa caf prime activite apl', null, 'bm-umuqn8xuqs0c9', 'Orienter vers la CAF pour le RSA ; l’ARE est déclarée comme ressource.'],
    ['Étudiant qui demande l’ARE', 'etudiant etudes inscription universite', null, 'bm-m013', 'Incompatibilité de principe avec des études à temps plein.'],
    ['Suspicion de fraude', 'fraude prevention faux document usurpation', null, 'bm-m008', 'Transmettre au service de prévention des fraudes sans en dire plus à l’usager.']
  ];
  const toolName = id => { try { const c = NAV_TABS_CONFIG.find(x => String(x.id) === String(id)); return c ? c.name : String(id); } catch (e) { return String(id); } };
  const tplOf = id => { try { return templates.find(t => t.id === id) || null; } catch (e) { return null; } };
  const tip = x => { const b = B(); try { return typeof x === 'function' ? (b ? x(b) : '') : x; } catch (e) { return ''; } };
  window.FT_SITUATIONS = S.map(([t, kw, tool, mail, c]) => ({ t, kw, tool, mail, get c() { return tip(c); } }));

  function box() {
    let w = $('ft-sit');
    if (!w) {
      w = document.createElement('div'); w.id = 'ft-sit'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'sit-t');
      document.body.appendChild(w);
      w.addEventListener('click', e => {
        if (e.target === w || e.target.closest('[data-st="x"]')) { w.hidden = true; return; }
        const b = e.target.closest('[data-st]'); if (!b) return;
        const a = b.dataset.st;
        if (a === 'tool') { w.hidden = true; const id = b.dataset.v; switchNavTab(/^\d+$/.test(id) ? +id : id); }
        else if (a === 'mail') { w.hidden = true; switchNavTab('cvm'); try { selectCategory('all'); } catch (er) {} try { selectTemplate(b.dataset.v); } catch (er) {} }
        else if (a === 'open') { const x = window.FT_SITUATIONS[+b.dataset.i]; window.ftSituation(x); }
      });
      w.addEventListener('input', e => { if (e.target.id === 'sit-q') list(e.target.value); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) w.hidden = true; });
    }
    w.hidden = false; return w;
  }
  const head = t => '<div class="pm-h"><h2 id="sit-t">' + t + '</h2><button type="button" class="pm-x" data-st="x" aria-label="Fermer">×</button></div>';
  window.ftSituation = function (x) {
    const w = box(), tp = x.mail && tplOf(x.mail);
    w.innerHTML = '<div class="pm-card sit-card">' + head('💡 Que faire si…') + '<h3 class="sit-q">' + esc(x.t) + '</h3>' +
      (x.c ? '<p class="sit-c">' + esc(x.c) + '</p>' : '') +
      '<div class="sit-acts">' + (x.tool != null ? '<button type="button" class="sit-a" data-st="tool" data-v="' + esc(x.tool) + '"><span>🧮</span><div><b>Ouvrir l’outil</b><em>' + esc(toolName(x.tool)) + '</em></div></button>' : '') +
      (tp ? '<button type="button" class="sit-a" data-st="mail" data-v="' + esc(tp.id) + '"><span>✉️</span><div><b>Mail à envoyer</b><em>' + esc(tp.title) + '</em></div></button>' : '') + '</div>' +
      '<p class="sit-n">Repère indicatif, à vérifier dans le dossier. <button type="button" class="pm-btn" data-st="all">Toutes les situations</button></p></div>';
    w.querySelector('[data-st="all"]').onclick = () => window.ftSituations();
  };
  function list(q) {
    const h = $('sit-l'); if (!h) return;
    const n = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const toks = n(q).split(/\s+/).filter(Boolean);
    const L = window.FT_SITUATIONS.map((x, i) => ({ x, i })).filter(o => !toks.length || toks.every(t => n(o.x.t + ' ' + o.x.kw).includes(t)));
    h.innerHTML = L.length ? L.map(o => '<button type="button" class="sit-li" data-st="open" data-i="' + o.i + '">' + esc(o.x.t) + '<span>›</span></button>').join('') : '<p class="rm-p">Aucune situation ne correspond : essayez la recherche générale (Ctrl+K).</p>';
  }
  window.ftSituations = function () {
    const w = box();
    w.innerHTML = '<div class="pm-card sit-card">' + head('💡 Que faire si…') + '<input id="sit-q" class="ad-in" placeholder="Décrivez la situation : reprise d’emploi, trop-perçu, démission…" aria-label="Rechercher une situation" style="width:100%;box-sizing:border-box"><div id="sit-l" class="sit-l"></div></div>';
    list(''); setTimeout(() => { const q = $('sit-q'); if (q) q.focus(); }, 30);
  };
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Que faire si… (situations)', s: 'Trouver l’outil et le mail pour une situation', kw: 'que faire si situation cas comment aide orientation', run: () => window.ftSituations() });
  /* Accès sur l’accueil, sous la recherche */
  function homeLink() {
    const hero = document.querySelector('#view-home .home-hero'); if (!hero || hero.querySelector('.sit-home')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sit-home'; b.innerHTML = '💡 <b>Que faire si…</b> <span>une situation, le bon outil et le bon mail</span>';
    b.onclick = () => window.ftSituations();
    hero.appendChild(b);
  }
  if (window.ftOnDom) window.ftOnDom(homeLink);
})();
