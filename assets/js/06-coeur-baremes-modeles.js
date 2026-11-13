    let currentTheme = safeLS.getItem('ft_theme') || 'dark';

    function applyTheme(theme) {
      currentTheme = theme;
      try {
        safeLS.setItem('ft_theme', theme);
      } catch (err) {
        console.warn("Erreur sauvegarde thème:", err);
      }
      const isLight = theme === 'light';
      document.documentElement.classList.toggle('theme-light', isLight);
      
      const icon = document.getElementById('theme-icon');
      const btn = document.getElementById('theme-toggle-btn');
      if (icon) {
        icon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
        icon.className = `w-4 h-4 transition-transform group-hover:rotate-12 ${isLight ? 'text-indigo-400' : 'text-amber-400'}`;
      }
      if (btn) {
        btn.title = isLight ? "Passer en mode sombre" : "Passer en mode clair";
      }
      refreshIcons();
    }

    function toggleTheme() {
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      showToast(newTheme === 'light' ? "Thème clair activé" : "Thème sombre activé", "info");
    }

    // --- MOTEUR DE LA CALCULATRICE FLOTTANTE ---
    let isCalculatorOpen = false;
    let calcExpression = '';
    let calcLastResult = null;

    let calcHistory = [];
    try {
      calcHistory = JSON.parse(safeLS.getItem('ft_calc_history') || '[]');
      if (!Array.isArray(calcHistory)) calcHistory = [];
    } catch (e) { calcHistory = []; }

    function calcSaveHistory() {
      calcHistory = calcHistory.slice(0, 30);
      safeLS.setItem('ft_calc_history', JSON.stringify(calcHistory));
      renderCalcHistory();
    }

    function renderCalcHistory() {
      const list = document.getElementById('calc-history-list');
      if (!list) return;
      list.innerHTML = calcHistory.length
        ? calcHistory.map((h, i) => `<button onclick="calcUseHistory(${i})" title="Réutiliser ce résultat" class="w-full flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left font-mono text-[11px] transition-colors">
            <span class="text-slate-400 truncate">${escapeHtml(String(h.expr).replace(/\*/g, '×').replace(/\//g, '÷'))}</span>
            <span class="text-cyan-300 font-bold shrink-0">= ${escapeHtml(String(h.res))}</span></button>`).join('')
        : '<div class="text-[11px] text-slate-400 text-center py-2">Aucun calcul pour le moment.</div>';
    }

    function toggleCalcHistory(force) {
      const panel = document.getElementById('calc-history-panel');
      if (!panel) return;
      const open = typeof force === 'boolean' ? force : panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !open);
      const btn = document.getElementById('calc-hist-btn');
      if (btn) ['text-cyan-300', 'bg-slate-800'].forEach(c => btn.classList.toggle(c, open));
      renderCalcHistory();
      refreshIcons();
    }

    function calcUseHistory(i) {
      const h = calcHistory[i];
      if (!h) return;
      const ops = ['+', '-', '*', '/', '%'];
      calcExpression = (calcExpression && ops.includes(calcExpression.slice(-1))) ? calcExpression + h.res : String(h.res);
      updateCalcScreen();
    }

    function calcClearHistory() {
      calcHistory = [];
      calcSaveHistory();
    }

    function toggleCalculator(forceState) {
      const widget = document.getElementById('floating-calculator');
      const btn = document.getElementById('header-calc-btn');
      if (!widget) return;

      isCalculatorOpen = typeof forceState === 'boolean' ? forceState : !isCalculatorOpen;
      widget.classList.toggle('hidden', !isCalculatorOpen);

      if (btn) {
        if (isCalculatorOpen) {
          btn.classList.add('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        } else {
          btn.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'border-cyan-500/40');
        }
      }

      refreshIcons();
    }

    function updateCalcScreen() {
      const display = document.getElementById('calc-display');
      const history = document.getElementById('calc-history');
      if (!display) return;

      display.textContent = calcExpression || '0';
      if (history && calcLastResult !== null) {
        history.textContent = `Dernier résultat : ${calcLastResult}`;
      }
    }

    function calcInput(char) {
      if (char === '.' && (calcExpression.endsWith('.') || calcExpression.split(/[\+\-\*\/]/).pop().includes('.'))) {
        return;
      }
      const operators = ['+', '-', '*', '/', '%'];
      if (operators.includes(char) && operators.includes(calcExpression.slice(-1))) {
        calcExpression = calcExpression.slice(0, -1) + char;
      } else {
        calcExpression += char;
      }
      updateCalcScreen();
    }

    function calcClear() {
      calcExpression = '';
      updateCalcScreen();
    }

    function calcBackspace() {
      calcExpression = calcExpression.slice(0, -1);
      updateCalcScreen();
    }

    function calcQuickOp(opStr) {
      if (!calcExpression && calcLastResult !== null) {
        calcExpression = calcLastResult.toString();
      }
      if (!calcExpression) {
        calcExpression = '0';
      }
      calcExpression += ' ' + opStr;
      calcEquals();
    }

    function calcEquals() {
      if (!calcExpression) return;
      try {
        let sanitized = calcExpression
          .replace(/%/g, '/100')
          .replace(/×/g, '*')
          .replace(/÷/g, '/');

        // Safe evaluation
        const res = Function(`"use strict"; return (${sanitized})`)();
        if (typeof res === 'number' && !isNaN(res)) {
          const rounded = Math.round(res * 10000) / 10000;
          const history = document.getElementById('calc-history');
          if (history) history.textContent = calcExpression + ' =';
          if (calcExpression.trim() !== String(rounded)) {
            calcHistory.unshift({ expr: calcExpression, res: rounded });
            calcSaveHistory();
          }
          calcLastResult = rounded;
          calcExpression = rounded.toString();
          updateCalcScreen();
        }
      } catch (err) {
        const display = document.getElementById('calc-display');
        if (display) display.textContent = 'Erreur';
        setTimeout(() => updateCalcScreen(), 1200);
      }
    }

    function copyCalcResult() {
      const display = document.getElementById('calc-display');
      const val = display ? display.textContent.trim() : '';
      if (val && val !== '0' && val !== 'Erreur') {
        copyToClipboard(val);
        showToast(`Résultat ${val} copié !`, "success");
      } else {
        showToast("Aucun résultat à copier", "info");
      }
    }

    const OFFICIAL_TEMPLATES = [{"id":"bm-umuxuejsx7y7v","title":"Poursuite indemnisation - DV","shortTitle":"Poursuite indemnisation - DV","category":"Poursuite indemnisation (DC)","tags":["Démission légitime affiliation ok"],"body":"Après examen de votre dossier, je vous informe que votre démission du 30/09/2026 ne fait pas obstacle à la poursuite de votre indemnisation.\n\nEn effet, dans le cadre de la réglementation de l'Assurance chômage, lorsqu'un allocataire reprend une activité au cours de son indemnisation, le départ volontaire de cette activité n'est pas opposable au maintien des droits dès lors que la durée de l'emploi quitté est inférieure à 88 jours travaillés ou 610 heures travaillées.\n\nOr, l'emploi que vous avez quitté représentait une durée de 30 jours. Cette activité demeure donc inférieure aux seuils prévus par la réglementation.\n\nPar conséquent, votre démission du 30/09/2026 est sans incidence sur la poursuite de votre indemnisation et le versement de vos allocations peut être maintenu, sous réserve de satisfaire à l'ensemble des autres conditions d'indemnisation.","variables":[],"isOfficial":true},{"id":"bm-umuxuc7jo70mc","title":"Poursuite indemnisation suite DV","shortTitle":"Poursuite indemnisation suite DV","category":"Divers","tags":["Démission légitime"],"body":"Après examen de votre dossier, je vous informe que votre démission du 30/09/2026 ne fait pas obstacle à la poursuite de votre indemnisation.\n\nEn effet, dans le cadre de la réglementation de l'Assurance chômage, lorsqu'un allocataire reprend une activité au cours de son indemnisation, le départ volontaire de cette activité n'est pas opposable au maintien des droits dès lors que la durée de l'emploi quitté est inférieure à 88 jours travaillés ou 610 heures travaillées.\n\nOr, l'emploi que vous avez quitté représentait une durée de 30 jours. Cette activité demeure donc inférieure aux seuils prévus par la réglementation.\n\nPar conséquent, votre démission du 30/09/2026 est sans incidence sur la poursuite de votre indemnisation et le versement de vos allocations peut être maintenu, sous réserve de satisfaire à l'ensemble des autres conditions d'indemnisation.","variables":[],"isOfficial":true},{"id":"bm-umuxtweu7zjz9","title":"Démission","shortTitle":"Démission","category":"Rejet démission","tags":["DV - démission - affiliation insuffisante"],"body":"Votre étude de demande d'allocation chômage a été traitée\n\nVous avez quitté votre emploi chez PALMA ILE-DE-FRANCE par une démission le 09/06/2026.\n\nLa démission est un départ volontaire, ce qui ne permet pas d’ouvrir un droit à l’allocation chômage (article Unédic : la démission n’ouvre pas droit à l’ARE, sauf cas de démission légitime ou après avoir retravaillé 65 jours ou 455 heures).\n\nVous avez ensuite repris une activité pour la même entreprise intérimaire au 31/08/2026, avec une fin de mission.\nVous avez travaillé 18.47 heures, ce qui est insuffisant pour annuler les effets de la démission du 09/06/2026.\n\nLa réglementation prévoit qu’après une démission, vous devez retravailler au moins 65 jours ou 455 heures sans démissionner de nouveau, et perdre ce nouvel emploi de manière involontaire (article Unédic : condition des 65 jours / 455 heures pour neutraliser une démission).\n\nÀ ce jour, vous n’avez pas atteint ce seuil.\n➡️ France Travail ne peut donc pas ouvrir un droit ARE sur votre dossier.\n\nhttps://www.unedic.org/la-reglementation/fiches-thematiques/demission","variables":[],"isOfficial":true},{"id":"bm-umuv6umkmqle2","title":"Complément ARE","shortTitle":"Complément ARE","category":"Complément ARE","tags":["calcul du complément"],"body":"Effectivement, si vous bénéficiez de droits à l'ARE et restez inscrit(e) comme demandeur d'emploi, un complément d'allocation peut être versé les mois où votre rémunération est réduite, y compris en cas de périodes non travaillées non programmées. Ce complément est calculé à partir du salaire brut déclaré lors de l'actualisation et non sur la base d'un montant forfaitaire par jour non travaillé.\n\nToutefois, après examen de votre dossier, je constate que vous ne disposez pas, à ce jour, d'une ouverture de droit à l'allocation d'aide au retour à l'emploi (ARE).\nJe vous invite donc à effectuer une demande d'allocation depuis votre espace personnel France Travail. Si vous rencontrez des difficultés dans cette démarche, vous pouvez vous rapprocher de votre agence afin de bénéficier d'un accompagnement personnalisé.\n\n\n\nComment le complément est calculé\n\nChaque mois, France Travail applique la règle suivante :\n\nComplément mensuel ARE = Allocation mensuelle brute−70% × salaire brut déclaré\n\nLe résultat est ensuite converti en nombre de jours d’allocation à verser, en le divisant par votre allocation journalière.\nConcrètement :\n\nSi vous travaillez beaucoup et percevez un salaire élevé, le complément ARE sera faible ou nul.\nSi vous travaillez peu, par exemple pendant les vacances d'octobre, avril ou juillet, votre salaire brut déclaré sera plus bas, donc le complément ARE sera plus élevé en fonction de votre salaire brut d'octobre.\nCe n’est donc pas le nombre de jours non travaillés qui détermine directement le versement : c’est le montant brut total que vous déclarez pour le mois. \n\nhttps://plmpl.fr/c/Kyzji\n\nSi vous avez d'autres questions ou besoin de plus de détails, je vous invite à contacter France Travail au 3949 (choix 4) ; des conseillers indemnisation de votre agence sont à votre disposition.","variables":[],"isOfficial":true},{"id":"bm-umuqxdaa9g0az","title":"ARE vs ARCE","shortTitle":"ARE vs ARCE","category":"Créateurs d'entreprise","tags":["ARCE vs ARE choix"],"body":"Vous m’indiquez souhaiter créer une entreprise en tant que chauffeur VTC.\nAprès examen de votre dossier, je vous confirme qu'il vous reste actuellement 100 jours de reliquat de droits.\n\nDans le cadre d'une reprise ou d'une création d'entreprise, vous pouvez choisir entre les deux dispositifs suivants :\n\n1. Le maintien partiel de l'Allocation d'aide au retour à l'emploi (ARE)\n\nCe dispositif vous permet de percevoir chaque mois une partie de votre allocation ARE en complément des revenus issus de votre activité non salariée.\nConformément à la réglementation en vigueur, le maintien de l'ARE est limité à 60 % des droits restant à la date de création de l'entreprise. Le montant versé varie chaque mois en fonction des revenus générés par votre activité.\n\nDans votre situation, vous pourriez bénéficier d'un maintien de l'ARE dans la limite de : 60 jours de droits (60 % de 100 jours de reliquat).\n\nÀ l'issue de cette période, le versement de l'ARE cesse. Toutefois, il est possible de solliciter, à titre exceptionnel, la poursuite du versement auprès de l'Instance Paritaire Régionale (IPR). Cette demande doit être accompagnée de justificatifs démontrant la poursuite effective de l'activité ainsi que l'absence de revenus professionnels, y compris de dividendes, depuis la création ou la reprise de l'entreprise.\n\n\n2. L'Aide à la reprise ou à la création d'entreprise (ARCE)\n\nL'ARCE consiste au versement d'un capital correspondant à 60 % des droits ARE restant à percevoir, versé en deux échéances.\nDans votre situation :\nReliquat : 100 jours\nAllocation journalière : 24,92 €\nCapital ARCE : 100 × 24,92 € × 60 % = 1 495,20 €\nCe montant serait versé de la manière suivante :\n1er versement : 747,60 €\n2ème versement : 747,60 €, six mois après le premier versement, sous réserve du respect des conditions d'attribution.\n\nPour plus d'informations sur ces dispositifs, vous pouvez consulter le lien suivant : https://plmpl.fr/c/SxoPj\n\nConcernant votre demande de droit d'option\n\nAprès vérification de votre dossier, vous ne remplissez pas actuellement les conditions permettant de bénéficier du droit d'option.\n\nEn effet, pour pouvoir y prétendre, vous devez justifier d'au moins :\n182 jours travaillés, ou\n910 heures travaillées,\nau cours des 24 mois précédant votre dernière fin de contrat.\n\nOr, d'après les attestations employeur enregistrées dans votre dossier, vous totalisez au 25/09/2026 :\n891,35 heures travaillées, soit\n178 jours travaillés.\n\nVous ne remplissez donc pas à ce jour les conditions requises pour l'examen d'un droit d'option.\n\nSi vous souhaitez obtenir des informations complémentaires ou être accompagné dans le choix entre le maintien de l'ARE et l'ARCE, vous pouvez contacter France Travail au 3949 (choix 4). Les conseillers indemnisation de votre agence restent à votre disposition.","variables":[],"isOfficial":true},{"id":"bm-umuqrp2v1bq72","title":"ARE complément","shortTitle":"ARE complément","category":"Complément ARE","tags":["complément ARE"],"body":"En effet, le salaire brut que vous avez perçu pour cette période s'élève à 2 454,55 €. Compte tenu de son montant, le calcul du cumul entre votre activité reprise et votre allocation chômage ne permet pas le versement d'une allocation complémentaire.\n\nJe vous rappelle que, en cas de reprise d'activité, le montant de l'allocation est calculé selon les règles suivantes :\n\nLe montant de l'allocation brute mensuelle est diminué de 70 % du salaire brut issu de l'activité reprise ; francetravail.fr\nLe cumul entre votre salaire et votre allocation chômage ne peut pas être supérieur à votre ancien salaire brut de référence, correspondant à 30 jours × votre salaire journalier de référence (SJR) figurant sur votre notification d'admission. francetravail.fr, unedic.org\n\nAu regard de votre rémunération brute de 2 454,55 €, aucun complément d'ARE n'est donc dû pour le mois de septembre.\n\nVous pouvez effectuer une simulation personnalisée de votre situation : https://candidat.pole-emploi.fr/candidat/simucalcul/repriseemploi\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-umuqn8xuqs0c9","title":"CAF RSA","shortTitle":"CAF RSA","category":"CAF / RSA","tags":["RSA CAF"],"body":"Vous pouvez tout à fait déposer une demande de RSA même si vous percevez l’Allocation de Solidarité Spécifique (ASS).\n\nIl n’existe pas, en principe, de démarche particulière pour les bénéficiaires de l’ASS. La CAF étudie votre droit au RSA en prenant en compte l'ensemble des ressources de votre foyer, notamment l’ASS, les allocations familiales, les pensions alimentaires ainsi que les aides liées au logement.\nLe RSA n’est versé que si le montant calculé à l’issue de cette étude est positif.\n\nEn revanche, il vous appartient de vérifier le résultat de l’instruction de votre demande et de vous rapprocher directement de la CAF afin d'obtenir des explications sur les motifs pour lesquels vous ne pouvez pas bénéficier du RSA.\n\nEn effet, France Travail n'intervient à aucun moment dans l'étude des droits au RSA ni dans les décisions prises par la CAF concernant son attribution ou son refus.\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-umuqmmcjvkbgz","title":"Demande de dpc droit d'option","shortTitle":"Demande de dpc droit d'option","category":"Droit d'option","tags":["DPC bulletin de salaire"],"body":"Effectivement, une erreur s'était glissée dans votre attestation employeur pour le mois de septembre. J'ai procédé à sa rectification sur la base de votre bulletin de salaire de septembre.\n\nAprès correction, le salaire brut total retenu pour cette période s'élève à 2 852,96 €, décomposé comme suit :\n\n1 637,23 € de salaire correspondant aux heures travaillées ;\n440,30 € de prime ;\n775,43 € d'indemnités compensatrices de congés payés.\n\nConcernant votre demande de droit d'option, afin que je puisse effectuer son étude, j'ai besoin de vos bulletins de salaire de juillet 2025 et juillet 2026. Ces documents me permettront de vérifier les montants figurant sur vos attestations employeur, soit respectivement 2 267,43 € et 2 517,23 € de salaire brut.\nLa transmission de ces bulletins de salaire est indispensable à l'instruction et au calcul de votre droit d'option. Je vous invite à les déposer depuis votre espace personnel dans les meilleurs délais.","variables":[],"isOfficial":true},{"id":"bm-umunv5zctg1au","title":"Reprise des droit / droit d'option","shortTitle":"Reprise des droit / droit d'option","category":"Reprise","tags":["droit d'option et reprise auto"],"body":"Lorsque vous vous réinscrivez à la suite d'une fin de contrat, la réglementation de l'assurance chômage prévoit la reprise automatique de vos droits ARE dès lors qu'il vous reste un reliquat de droits non utilisé.\n\nDans votre situation, ce reliquat provient de votre précédente ouverture de droits, établie à la suite de votre fin de contrat du 31/08/2023. Il ne s'agit donc pas d'une erreur de traitement.\n\nConcernant l'affichage de votre salaire brut du mois de septembre, celui-ci comprend l'ensemble des éléments de rémunération soumis à déclaration, à savoir :\nSalaire correspondant aux heures travaillées : 2 412,66 €\nIndemnités de congés payés : 775,43 €\nPrimes afférentes à la période : 440,30 €\nLe salaire brut total retenu est donc de :\n2 412,66 € + 775,43 € + 440,30 € = 3 628,39 €\n\nDroit d'option (recalcul des droits)\nVous avez la possibilité de demander un droit d'option, c'est-à-dire un recalcul de vos droits sur la base de votre dernière fin de contrat du 25/09/2026.\nSi vous avez repris une activité professionnelle et que vous remplissez les conditions d'ouverture de nouveaux droits avant l'épuisement de votre reliquat actuel, vous pouvez solliciter une étude de votre situation afin d'évaluer l'intérêt d'un nouveau calcul.\n\nConformément à la réglementation, vous pourrez opter pour le nouveau droit uniquement si celui-ci est supérieur d'au moins 30 % au montant de votre allocation actuelle ou si le montant de votre allocation est inférieur ou égal à 20 € par jour.\n\nPour obtenir davantage d'informations sur ce dispositif, vous pouvez consulter le lien suivant : https://www.unedic.org/la-reglementation/fiches-thematiques/droit-doption\n\nSi vous souhaitez étudier l'opportunité d'un droit d'option, je vous invite à nous en faire la demande afin qu'une simulation de vos nouveaux droits puisse être réalisée.","variables":[],"isOfficial":true},{"id":"bm-umuntlyxkc7lz","title":"Fin de droit - formation","shortTitle":"Fin de droit - formation","category":"Formation","tags":["fin de droit","formation","RFF"],"body":"Oui, à ce jour, la fin prévisionnelle de vos droits est fixée au 28/03/2027. À compter du 29/03/2027, et sous réserve que votre formation soit toujours en cours et que les conditions d'attribution soient remplies, vous pourrez être pris en charge au titre de la Rémunération de Fin de Formation (RFF) pour un montant mensuel de 775,65 €.\n\nConcernant le report de votre date de fin de droits, les jours pour lesquels vous n'êtes pas indemnisé en raison d'une activité professionnelle sont conservés et reportés dans le temps. Concrètement, lorsque vous travaillez au cours d'un mois et que certains jours ne sont pas indemnisés, ces jours viennent prolonger d'autant votre durée d'indemnisation.\n\nPar exemple, si au cours du mois d'août vous n'êtes pas indemnisé pendant 15 jours en raison d'une activité salariée, votre date de fin de droits sera repoussée de 15 jours. Ainsi, si votre fin de droits était initialement prévue le 28/03/2027, elle serait alors reportée au 13/04/2027.\n\nSi vous souhaitez obtenir des informations complémentaires ou une étude plus détaillée de votre situation, je vous invite à contacter France Travail au 3949 (choix 4). Les conseillers indemnisation de votre agence restent à votre disposition pour vous accompagner.","variables":[],"isOfficial":true},{"id":"bm-umunszuo1wt5v","title":"Actualisation - ANS","shortTitle":"Actualisation - ANS","category":"Actualisation","tags":["ANS","URSSAF"],"body":"Effectivement, vos déclarations d'activité non salariée devront être justifiées après chaque actualisation par la transmission de vos relevés URSSAF.\n\nConcernant le mois de septembre, vous avez déjà fourni un justificatif au moyen de la déclaration sur l'honneur que vous m'avez transmise. Toutefois, si vous disposez désormais du relevé URSSAF correspondant à cette période, je vous invite à le transmettre depuis votre espace personnel.\n\nCette démarche devra également être effectuée pour les mois suivants afin de permettre la mise à jour et le suivi régulier de votre dossier.","variables":[],"isOfficial":true},{"id":"bm-umuh0hbi5tgs8","title":"ARCE-Maintien ARE","shortTitle":"ARCE-Maintien ARE","category":"Créateurs d'entreprise","tags":["ARCE - ARE"],"body":"Vous me faites part d'un changement de situation en m'informant que vous avez créé votre entreprise.\n\nAfin de gérer la prise en compte de votre nouvelle activité non salariée et votre indemnisation chômage, je vous invite à compléter le formulaire ci-joint et le retourner, par téléchargement depuis votre espace personnel, accompagné des justificatifs demandés selon l'option choisie.\n\nAu regard de l'assurance chômage, le demandeur d'emploi qui reprend une activité non salariée peut bénéficier :\n\n  • de l'Aide à la Reprise ou la Création d'Entreprise (ARCE). Cette aide est versée en deux fois et correspond à 60 % des allocations qui vous restent à la date où vous débutez votre activité ;\n\n  • ou des dispositions relatives au cumul de l'Allocation d'Aide au Retour à l'Emploi (ARE) avec les rémunérations procurées par l'activité professionnelle non salariée à hauteur de 60% de votre reliquat de droit. Cette aide correspond à un maintien partiel des allocations d'assurance chômage. À l'atteinte de ce plafond, les versements de l'ARE cessent. Le créateur ou repreneur peut alors formuler une demande exceptionnelle de poursuite du versement auprès de l'instance paritaire régionale (IPR). Il doit justifier de la poursuite effective de son activité non salariée et attester de l'absence de revenus d'activité — y compris de dividendes — depuis la création ou la reprise d'entreprise.\n\nPour plus d'informations, connectez vous sur le site www.francetravail.fr en suivant le chemin :\n« Accueil France Travail > Candidat > Mon projet, ma recherche > Je crée mon entreprise > Mes aides financières > Les aides délivrées par France Travail »\n\nhttps://plmpl.fr/c/SxoPj\n\nPour plus d'informations, vous pouvez prendre contact au 3949.","variables":[],"isOfficial":true},{"id":"bm-umtmwnft7igh8","title":"Trop-perçu","shortTitle":"Trop-perçu","category":"Trop-perçu","tags":["trop perçu"],"body":"Nous avons détecté un trop‑perçu d’un montant de {{montant}} €, correspondant à {{origine}} sur {{periode}}.\n\nConformément à la notification de trop‑perçu, vous disposez d’un délai d’un mois pour procéder au remboursement en utilisant l’un des modes de règlement proposés dans votre espace personnel.\nJe vous invite a effectuer les démarches nécessaire pour régulariser votre trop-perçu. Si vous n'avez pas travaillé dur ce mois vous devez vous rapprocher d e ex employeur pour réaliser les correction nécessaire.\n\nVous avez la possibilité de régler votre dette directement en ligne depuis votre espace personnel, en une fois ou de manière échelonnée (jusqu’à 24 mensualités), via la procédure sécurisée de prélèvement bancaire.\n\nJe reste disponible pour toute question relative à votre indemnisation ou à ce dossier de trop‑perçu.","variables":[{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"origine","label":"Origine","placeholder":"Origine","default":"Origine"},{"key":"periode","label":"Période","placeholder":"Période","default":"Période"}],"isOfficial":true},{"id":"bm-umtjso869oxbm","title":"Explication différence entre taux","shortTitle":"Explication différence entre taux","category":"Divers","tags":[],"body":"Depuis le 1er octobre 2021, la réglementation relative au calcul de l’allocation a évolué. Avant cette date, la période de référence utilisée pour déterminer le salaire journalier de référence (SJR) était limitée à 12 mois.\n\n🔹 Ancienne réglementation (avant le 01/10/2021)\nDans votre cas, l’ancien calcul se basait sur les salaires bruts perçus du 01/03/2020 au 28/02/2021, soit 365 jours.\nSur cette période, il avait été déterminé :\n\nun SJR brut de {{54_09}} €,\n\ncorrespondant à un SJR net de 34,57 €.\n\n🔹 Nouvelle réglementation (depuis le 01/10/2021)\nLe calcul actuel repose sur une période de référence plus longue, intégrant davantage de jours non travaillés.\nDans votre situation, la période retenue va du 07/10/2024 au 31/07/2026, soit 663 jours.\n\nSur cette période :\n\nvos salaires bruts, primes comprises, totalisent 34 879,57 €,\n\nle diviseur réglementaire est de 663 jours,\n\nvotre SJR brut ressort à 52,61 €,\n\nsoit un SJR net de 32,85 €.\n\nL’augmentation du nombre de jours dans la période de référence explique mécaniquement la baisse du SJR, même lorsque le total des salaires reste élevé : le diviseur est plus important, ce qui réduit le montant journalier retenu.","variables":[{"key":"54_09","label":"54,09","placeholder":"54,09","default":"54,09"}],"isOfficial":true},{"id":"bm-umtio0kqpw573","title":"Paiement","shortTitle":"Paiement","category":"Divers","tags":[],"body":"Après consultation de votre dossier, je vous confirme qu’un paiement provisoire de {{565_11}} € a bien été émis le {{01_09_2026}}.\n\nSelon les établissements bancaires, un délai de traitement de J+1 à J+2 peut s’appliquer avant l’affichage du virement sur votre compte.\n\nJe vous invite à vérifier auprès de votre banque si nécessaire.","variables":[{"key":"565_11","label":"565,11","placeholder":"565,11","default":"565,11"},{"key":"01_09_2026","label":"01/09/2026","placeholder":"01/09/2026","default":"01/09/2026"}],"isOfficial":true},{"id":"bm-umtcyddwj0otg","title":"Reprise et Droit d'option","shortTitle":"Reprise et Droit d'option","category":"Reprise & droit d'option","tags":[],"body":"Vous êtes actuellement indemnisé sur des droits qui ont été calculés à partir de votre fin de contrat du 12/03/2021. \n\nC’est la raison pour laquelle votre allocation est toujours versée sur la base de cet ancien calcul.\n\nSi vous estimez avoir été mieux rémunéré sur vos derniers contrats, vous pouvez demander l’étude du droit d’option. Cette étude se fera à partir de votre dernière fin de contrat de juillet 2026.\nSi vous êtes éligible au droit d’option, vous recevrez un formulaire comparatif présentant :\nvotre ancien droit (celui de 2021),\nle nouveau droit recalculé sur vos contrats les plus récents.\nVous devrez alors choisir le droit que vous souhaitez conserver.\nPour plus d’informations sur le droit d’option, vous pouvez consulter le lien suivant : https://www.unedic.org/la-reglementation/fiches-thematiques/droit-doption\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-umtckcmqzf8md","title":"Reprise des droits avec différés","shortTitle":"Reprise des droits avec différés","category":"Reprise","tags":["reprise automatique","reliquat"],"body":"Lorsque vous vous réinscrivez après une fin de contrat, la reprise de vos droits ARE est automatique, dès lors qu’il vous reste un reliquat de droits non utilisés.\nDans votre situation, ce reliquat provient de votre précédente ouverture de droits, calculée sur la fin de contrat du {{10_10_2025}}.\n\nLorsqu’une perte d’emploi intervient, la date de début de votre indemnisation est déterminée après application des différés d’indemnisation :\n\n🔹 1. Différé spécifique (indemnités de rupture)\nCe différé est calculé à partir des indemnités de rupture versées au‑delà du minimum légal (licenciement, transaction, etc.).\nIl débute le lendemain de la fin de contrat.\nIl est plafonné à 75 jours en cas de licenciement économique et 150 jours dans les autres cas.\n➡️ Dans votre cas : 0 jour de différé spécifique.\n\n🔹 2. Différé congés payés\nCe différé correspond aux jours de congés payés non pris ou à l’indemnité compensatrice versée par l’employeur.\nIl débute également le lendemain de la fin de contrat.\n➡️ Dans votre cas : {{19}} jours, du {{01_08_2026}} au {{19_08_2026}}.\n\nPour ces calculs, nous prenons en compte toutes les indemnités versées lors des fins de contrat survenues dans les 6 mois précédant votre dernière fin de contrat, à condition qu’elles n’aient pas déjà servi à un précédent calcul de différé.\n\n🔹 3. Délai d’attente de 7 jours\nUn délai d’attente de 7 jours est appliqué, sauf s’il a déjà été respecté dans les 12 mois précédant la reprise de droits.\n➡️ Dans votre cas : du {{20_08_2026}} au {{26_08_2026}}.\n\n🔹 Détermination de votre premier jour indemnisable\nAprès application de l’ensemble des différés, votre 1er jour indemnisable est fixé au {{27_08_2026}}.\n\n🟦 Droit d’option (recalcul des droits)\nVous avez la possibilité de demander le droit d’option, c’est‑à‑dire un recalcul de vos droits sur la base de vos contrats effectués entre le {{11_10_2025}} et le {{31_07_2026}}.\n\nPour plus d’informations sur ce dispositif, vous pouvez consulter le lien suivant :\nhttps://www.unedic.org/la-reglementation/fiches-thematiques/droit-doption","variables":[{"key":"10_10_2025","label":"10/10/2025","placeholder":"10/10/2025","default":"10/10/2025"},{"key":"19","label":"19","placeholder":"19","default":"19"},{"key":"01_08_2026","label":"01/08/2026","placeholder":"01/08/2026","default":"01/08/2026"},{"key":"19_08_2026","label":"19/08/2026","placeholder":"19/08/2026","default":"19/08/2026"},{"key":"20_08_2026","label":"20/08/2026","placeholder":"20/08/2026","default":"20/08/2026"},{"key":"26_08_2026","label":"26/08/2026","placeholder":"26/08/2026","default":"26/08/2026"},{"key":"27_08_2026","label":"27/08/2026","placeholder":"27/08/2026","default":"27/08/2026"},{"key":"11_10_2025","label":"11/10/2025","placeholder":"11/10/2025","default":"11/10/2025"},{"key":"31_07_2026","label":"31/07/2026","placeholder":"31/07/2026","default":"31/07/2026"}],"isOfficial":true},{"id":"bm-umtbki0i06ndc","title":"SAE admission def ou prov","shortTitle":"SAE admission def ou prov","category":"Admission","tags":["SAE"],"body":"Je vous informe que votre dossier d'Allocation d'Aide au Retour à l'Emploi a été traité. \n \n Une notification d'admission {{provisoire}} est disponible dans votre espace personnel. Je vous invite à la consulter pour comprendre les détails de vos droits. \n \n Voici les informations concernant votre allocation : \n * Date de début de prise en charge : {{09_08_2026}}\n * Montant net par jour : {{32_13}} € \n * Durée totale : {{548}} jours \n \n Pour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[{"key":"provisoire","label":"provisoire","placeholder":"provisoire","default":"provisoire"},{"key":"09_08_2026","label":"09/08/2026","placeholder":"09/08/2026","default":"09/08/2026"},{"key":"32_13","label":"32.13","placeholder":"32.13","default":"32.13"},{"key":"548","label":"548","placeholder":"548","default":"548"}],"isOfficial":true},{"id":"bm-umtb8lzactya5","title":"ANS-Régularisation 2042/2042-C PRO","shortTitle":"ANS-Régularisation 2042/2042-C PRO","category":"ANS","tags":["ANS 2042C PRO"],"body":"Le document transmis (avis d’imposition 2026 – revenus 2025) ne correspond pas à la pièce attendue pour l’étude de votre dossier.\nPour justifier vos revenus non salariés de l’année 2025, la déclaration 2042 / 2042‑C PRO est obligatoire.\nJe vous remercie de procéder au dépôt immédiat de ce document dans votre espace francetravail.fr, rubrique « transmettre et suivre un document ».\nSans réception, votre dossier ne pourra pas être régularisé.","variables":[],"isOfficial":true},{"id":"bm-umt9qi1knu8k1","title":"Droit d'option validé","shortTitle":"Droit d'option validé","category":"Droit d'option","tags":[],"body":"Merci de votre retour.\nVotre demande de droit d’option a été validée. Votre indemnisation bascule désormais sur le nouveau droit, conformément à votre choix.\nVous recevrez une notification d'admission dans votre espace personnel sous 24h.","variables":[],"isOfficial":true},{"id":"bm-umt9ot8qcbans","title":"Actualisation","shortTitle":"Actualisation","category":"Actualisation","tags":["Congé de naissance","CPAM CAF"],"body":"Le congé de naissance est à déclarer lors de votre actualisation, en tant qu’arrêt maladie, et vous devrez transmettre l’attestation de congé délivrée par la Sécurité sociale ou la CAF.\n\nIl vous appartient d’effectuer les démarches nécessaires auprès de la CPAM de votre lieu d’habitation ainsi qu’auprès de la CAF, afin de déterminer les modalités de prise en charge de votre congé.\nFrance Travail n’intervient pas dans ces procédures, qui relèvent de votre responsabilité.","variables":[],"isOfficial":true},{"id":"bm-umt8f0eznu4lj","title":"Attestation employeur","shortTitle":"Attestation employeur","category":"Modification AE","tags":[],"body":"Si vous estimez qu’une erreur figure sur votre attestation employeur concernant les dates de contrat, France Travail ne peut pas procéder à la correction.\nVous devez vous rapprocher de votre employeur, qui est le seul habilité à modifier et retransmettre l’attestation si nécessaire.","variables":[],"isOfficial":true},{"id":"bm-umt1lnbc7w6ig","title":"Tro-perçu","shortTitle":"Tro-perçu","category":"Trop-perçu","tags":["trop-perçu démarche agence"],"body":"Pour le remboursement de votre trop‑perçu, aucun rendez‑vous n’est requis.\nVous pouvez vous présenter directement à votre agence du lundi au vendredi, entre 8h30 et 12h30.\nLes conseillers France Travail sont à votre disposition pour vous guider pas à pas dans vos démarches.\n\nVous avez également les informations sur le remboursement en ligne en cliquant sur le lien suivant : https://plmpl.fr/c/UeHNT\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-umsyaewpc5zwz","title":"DPAE","shortTitle":"DPAE","category":"DPAE","tags":["reprise activité - actualisation"],"body":"Nous avons eu l'information, par l’URSSAF, que vous avez repris un contrat en {{date}}.\nIl conviendra de télécharger votre contrat de travail, directement depuis votre espace sur https://www.francetravail.fr/accueil/ ou depuis l'application mobile depuis la rubrique \"mes échanges avec France Travail\", puis \"transmettre et suivre un document\".\nPensez à bien déclarer cette activité lors de votre actualisation mensuelle et à télécharger, le cas échéant, votre bulletin de salaire, toujours depuis votre espace sur\nhttps://www.francetravail.fr/accueil/.\nNe pas déclarer une activité engendre 2 risques :\n-\t1 risque de trop-perçu\n-\t1 risque que les périodes d’activités salariées non déclarées (PND) ne soient pas prises en compte dans un futur calcul de droit.\nPlus d’informations sur la déclaration mensuelle en cliquant sur ce https://plmpl.fr/c/2jBde.\nSi vous reprenez un CDI, il convient de rester inscrit jusqu’à la fin de votre période d’essai.\nVous pouvez éventuellement bénéficier d'un complément d'indemnisation.\nPlus d'informations en cliquant sur ce https://plmpl.fr/c/oUQWx.\nVous y trouverez également \"un simulateur activité reprise\" qui vous permettra d'anticiper vos échéances.\nAttention, une démission ou une fin de période d’essai à votre initiative sur une activité reprise peut avoir des conséquences sur vos droits en cours.\nPlus d’informations en cliquant sur ce https://plmpl.fr/c/qykfj.","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""}],"isOfficial":true},{"id":"bm-umsy9qtzhsqt4","title":"Rejet affiliation et PND","shortTitle":"Rejet affiliation et PND","category":"Rejet démission","tags":["affiliation et pnd"],"body":"Votre demande d’allocation chômage a été examinée.\nAprès étude de votre dossier, je vous informe que l’ouverture de droits ne peut pas être accordée, en raison d’une affiliation insuffisante.\n\nPour bénéficier d’une indemnisation au titre de l’assurance chômage, deux conditions doivent être remplies :\n-La condition d’affiliation : justifier d’au moins 182 jours travaillés ou 910 heures d’activité salariée sur la période de référence.\nPour que ces périodes soient prises en compte, il est indispensable d’avoir déclaré chaque mois votre activité pendant votre inscription.\n\n-Le motif de rupture du contrat de travail : l’indemnisation n’est possible qu’en cas de perte involontaire d’emploi (fin de CDD, licenciement, rupture conventionnelle, fin de mission…).\nUne démission, sauf cas reconnus comme légitimes, n’ouvre pas droit à indemnisation.\n\nÀ ce jour, les éléments transmis ne permettent pas de valider ces conditions.\nLa notification de rejet est disponible dans votre espace personnel ; je vous invite à en prendre connaissance.\n\nPour toute précision complémentaire, vous pouvez contacter le 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-umsy9ak8mmn23","title":"Démission et poursuite des droits","shortTitle":"Démission et poursuite des droits","category":"Démission","tags":[],"body":"Votre démission du {{08_08_2026}} de chez {{restaurant_le_best}}, a été analysée. Les éléments transmis de votre employeur démontrent qu’elle comporte des circonstances particulières permettant de la considérer comme non opposable à vos droits.\nAinsi, votre démission n’interrompt pas votre indemnisation, qui se poursuit selon les dispositions réglementaires.","variables":[{"key":"08_08_2026","label":"08/08/2026","placeholder":"08/08/2026","default":"08/08/2026"},{"key":"restaurant_le_best","label":"Restaurant Le Best","placeholder":"Restaurant Le Best","default":"Restaurant Le Best"}],"isOfficial":true},{"id":"bm-umswzkgild5o9","title":"Actualisation intérimaire","shortTitle":"Actualisation intérimaire","category":"Actualisation","tags":["intérimaire"],"body":"Afin de vérifier si vous pouvez bénéficier d’un complément d’allocation chômage, votre agence d’intérim doit nous transmettre, par voie dématérialisée, le justificatif de votre activité pour le mois de {{juillet}}.\nEn effet, lorsque vous travaillez en intérim, c’est votre agence d’intérim qui envoie automatiquement ces documents à France Travail via le flux dématérialisé.","variables":[{"key":"juillet","label":"juillet","placeholder":"juillet","default":"juillet"}],"isOfficial":true},{"id":"bm-umsootuhi51yf","title":"Contact 3949","shortTitle":"Contact 3949","category":"Contact","tags":["contact"],"body":"Je vous invite fortement à appeler le 3949 ; des conseillers indemnisation de votre agence sont à votre disposition pour faire le point sur votre situation :\n\n  • du lundi au mercredi de 8 h 30 à 16 h 30\n\n  • le jeudi de 8 h 30 à 12 h 30\n\n  • le vendredi de 8 h 30 à 15 h 30","variables":[],"isOfficial":true},{"id":"bm-umsftiytkqdw4","title":"Droit d'option non recevable","shortTitle":"Droit d'option non recevable","category":"Droit d'option","tags":["Droit d'option non recevable"],"body":"Après étude de votre situation, je vous informe que vous ne pouvez pas bénéficier du droit d'option.\n\nEn effet, ce dispositif suppose que le capital de votre nouveau droit soit supérieur à celui de votre droit en cours majoré de 30 %. Or, dans votre cas, les montants sont les suivants :\n\n- Capital du nouveau droit, calculé sur votre fin de contrat du {{25_06_2026}} : {{43_236_05}} €\n- Capital du droit en cours, majoré de 30 % : {{56_373_65}} €\n\nLe capital de votre nouveau droit étant inférieur à ce seuil, la condition d'ouverture du droit d'option n'est pas remplie.\n\nPour vous permettre de mieux comprendre ce dispositif, vous trouverez ci-dessous le lien vers la réglementation détaillée du droit d'option :\nhttps://www.unedic.org/la-reglementation/fiches-thematiques/droit-doption?hc_location=ufi","variables":[{"key":"25_06_2026","label":"25/06/2026","placeholder":"25/06/2026","default":"25/06/2026"},{"key":"43_236_05","label":"43 236,05","placeholder":"43 236,05","default":"43 236,05"},{"key":"56_373_65","label":"56 373,65","placeholder":"56 373,65","default":"56 373,65"}],"isOfficial":true},{"id":"bm-umsfri8le47pq","title":"CVM courrier démission, démarche ipr","shortTitle":"CVM courrier démission, démarche ipr","category":"IPR DV 121 jours","tags":[],"body":"Après examen de votre dossier, je vous confirme que vous ne pourrez pas être indemnisé au titre du mois de juillet.\n\nToutefois, à la suite de votre démission, vous avez reçu un courrier vous informant que vous avez la possibilité de demander une nouvelle étude de vos droits à compter du 31/07/2026. Vous trouverez ce courrier en pièce jointe : il précise les modalités et les conditions de cette démarche.\n\nPour vous accompagner, vous pouvez vous rendre dans votre agence tous les matins, du lundi au vendredi, sans rendez-vous. Des conseillers France Travail se tiennent à votre disposition pour vous aider dans vos démarches.\n\nEnfin, si vous avez d'autres questions ou souhaitez davantage de précisions, vous pouvez joindre France Travail au 3949 (choix 4) : des conseillers indemnisation de votre agence sont là pour vous répondre.","variables":[],"isOfficial":true},{"id":"bm-umscu00kplkjg","title":"Sanction Rechercher emploi CRE","shortTitle":"Sanction Rechercher emploi CRE","category":"CRE","tags":["Sanction CRE"],"body":"J’accuse réception de votre mail concernant vos démarches de recherche d’emploi, en lien avec le premier courrier relatif à la procédure de sanction.\n\nAprès examen, le service Contrôle de la Recherche d’Emploi de Normandie (CRE) a estimé que les actions menées n’étaient pas suffisantes au regard des obligations attendues.\n\nAfin de prendre connaissance de la décision rendue ainsi que des voies de recours possibles, je vous invite à consulter le courrier que vous avez reçu le 02/07/2026.\n\nVotre agence n’est pas habilitée à réviser ou modifier une décision prise par le service CRE. C’est pourquoi il est nécessaire de vous référer exclusivement au courrier transmis.","variables":[],"isOfficial":true},{"id":"bm-umsct6b5995mj","title":"Explication nouveaux droits","shortTitle":"Explication nouveaux droits","category":"Admission","tags":["ARE modalités de calculs"],"body":"Après avoir examiné votre dossier, je vous confirme que vos nouveaux droits ont été calculés selon la réglementation applicable depuis le 1er octobre 2021. À cette date, les règles de calcul de l'allocation ont en effet changé, ce qui explique la différence avec vos droits précédents.\n\nVoici le détail de votre situation :\n\nVos droits initiaux avaient été calculés à partir d'une fin de contrat au 24 décembre 2020. Ces droits sont arrivés à leur terme le 16 juillet 2026, ce qui a déclenché un rechargement, c'est-à-dire l'ouverture de nouveaux droits.\n\nCe rechargement s'appuie sur votre dernière fin de contrat connue, en date du 22 août 2025. Pour le calcul, nous avons retenu une période de référence allant du 23 août 2023 au 22 août 2025, correspondant à votre activité auprès de l'employeur SAMSIC II.\n\nPendant cette période, vous exerciez à temps partiel. Ce point a une incidence directe sur le montant de votre allocation, puisque celui-ci est déterminé à partir des salaires perçus sur la période de référence.\n\n\n\nPour toute démarche liée à vos documents ou à votre dossier, vous pouvez vous rendre  dans votre agence France Travail sans rendez‑vous de 8h30à 12h30. Les conseillers sont à votre disposition pour vous accompagner.\n\nSi vous avez d'autres questions ou besoin de plus de détails, je vous invite à contacter France Travail au 3949 (choix 4) ; des conseillers indemnisation de votre agence sont à votre disposition.","variables":[],"isOfficial":true},{"id":"bm-umryw3o0j6aeq","title":"Démission non suivi de 455H","shortTitle":"Démission non suivi de 455H","category":"Rejet démission","tags":["Démission contestation"],"body":"Suite à votre appel je vous renvoi les explications sur la démission.\n\nVous avez quitté votre emploi chez {{saint_honore_ser}} par démission le {{28_05_2026}}.\nLa démission est un départ volontaire, ce qui ne permet pas d’ouvrir un droit à l’allocation chômage (article Unédic : la démission n’ouvre pas droit à l’ARE, sauf cas de démission légitime ou après avoir retravaillé 65 jours ou 455 heures).\n\nVous avez ensuite repris une activité chez {{jgld}} du {{10_06_2026}} au {{11_07_2026}}, avec une fin de période d’essai à l’initiative de l’employeur.\nVous avez travaillé {{178_67}} heures, ce qui est insuffisant pour annuler les effets de la démission.\n\nLa réglementation prévoit qu’après une démission, vous devez retravailler au moins 65 jours ou 455 heures sans démissionner de nouveau, et perdre ce nouvel emploi de manière involontaire (article Unédic : condition des 65 jours / 455 heures pour neutraliser une démission).\n\nÀ ce jour, vous n’avez pas atteint ce seuil.\n➡️ France Travail ne peut donc pas ouvrir un droit ARE sur votre dossier.\n\nhttps://www.unedic.org/la-reglementation/fiches-thematiques/demission","variables":[{"key":"saint_honore_ser","label":"Saint‑honoré ser","placeholder":"Saint‑honoré ser","default":""},{"key":"28_05_2026","label":"28/05/2026","placeholder":"28/05/2026","default":"28/05/2026"},{"key":"jgld","label":"JGLD","placeholder":"JGLD","default":""},{"key":"10_06_2026","label":"10/06/2026","placeholder":"10/06/2026","default":"10/06/2026"},{"key":"11_07_2026","label":"11/07/2026","placeholder":"11/07/2026","default":"11/07/2026"},{"key":"178_67","label":"178,67","placeholder":"178,67","default":"178,67"}],"isOfficial":true},{"id":"bm-umrvvfbblich7","title":"Droit d'option OK","shortTitle":"Droit d'option OK","category":"Droit d'option","tags":["Formulaire ok"],"body":"Vous êtes éligible au droit d'option.\n\nSi vous souhaitez bénéficier du nouveau droit calculé , je vous invite à compléter la page 3 du formulaire de droit d'option ci-joint. \nVous pourrez ensuite nous la transmettre via votre espace personnel, dans la rubrique « Mes échanges avec France Travail ».\n\nVotre demande sera traitée dès que nous recevrons votre formulaire.\n\nJe vous rappelle que le choix du droit d'option est irrévocable : une fois que vous l'avez accepté, il n'est plus possible de revenir aux droits initiaux.","variables":[],"isOfficial":true},{"id":"bm-umrvp66870kzh","title":"Démission","shortTitle":"Démission","category":"Démission","tags":["démission","légitimité"],"body":"Si la rupture de la période d’essai est autorisée par le Code du travail, pour la réglementation assurance chômage, en revanche, elle produit les effets d'une démission. Le salarié à l'initiative de la rupture de la période d’essai n'aura donc, en principe, pas le droit à l’allocation chômage.\nDes exceptions sont toutefois possibles, notamment si vous êtes dans un des 17 cas de démissions dites \"légitimes\" admises par la réglementation (ex : suivi de conjoint suite à un déménagement, rupture de la période d’essai au cours des 65 jours premiers jours après un licenciement, une rupture conventionnelle ou une fin de CDD, etc.).\nA noter que si vous étiez en cours d'indemnisation par France Travail au moment de votre démission, le versement de votre allocation ne sera pas suspendu dans trois cas :\n\nSi vous justifiez de moins de 88 jours travaillés ou 610 heures travaillées depuis l'ouverture de droit à l’assurance chômage, c'est à dire moins de 4 mois de travail au total  (cette condition était de moins de 65 jours ou moins de 455 heures avant le 1er avril 2025) ;\nSi le contrat duquel vous avez démissionné a duré moins de 6 jours travaillés ou 8 jours calendaires ;\nSi le contrat duquel vous avez démissionné a représenté moins de 17 heures par semaine.","variables":[],"isOfficial":true},{"id":"bm-umrt1ceeuz5f1","title":"ANS Création entreprise","shortTitle":"ANS Création entreprise","category":"Créateurs d'entreprise","tags":["ANS Formulaire à remplir"],"body":"Suite à la réception des justificatifs relatifs à votre création d’entreprise, nous devons procéder à la mise à jour de cet événement dans votre dossier.\n\nLa création d’entreprise fait l’objet d’un processus spécifique. Afin de finaliser votre déclaration, je vous invite à compléter, signer et déposer dans votre espace personnel :\n– le formulaire joint,\n– les justificatifs liés au statut juridique de votre entreprise,\n– ainsi que l’attestation sur l’honneur permettant de déclarer vos chiffres d’affaires en attendant les relevés officiels de l’URSSAF.\nVous trouverez également ci‑dessous un lien d’information sur le cadre réglementaire applicable :\nhttps://plmpl.fr/c/D3G6D\n\nVotre dossier sera mis à jour dès réception de l’ensemble des documents.\nJe reste à votre disposition pour tout renseignement complémentaire.\n\nPour toute information générale, vous pouvez également contacter France Travail au 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-umrsxw8hl3d81","title":"Trop-perçu contentieux","shortTitle":"Trop-perçu contentieux","category":"Trop-perçu","tags":["trop-perçu contentieux remboursement"],"body":"Nous avons détecté un trop‑perçu d’un montant de {{238_84}} €, correspondant à une {{avance_non_recuperee}} pour la période du {{25_12_2025}} au {{31_12_2025}}.\n\nConformément à la notification de trop‑perçu, vous disposiez d’un délai d’un mois pour procéder au remboursement en utilisant l’un des modes de règlement proposés dans votre espace personnel.\n\nÀ ce jour, aucune démarche de votre part n’a été enregistrée.\n\nEn conséquence, votre dossier de trop‑perçu est désormais transmis au service contentieux.\n\nVous conservez toutefois la possibilité de régler votre dette directement en ligne depuis votre espace personnel, en une fois ou de manière échelonnée (jusqu’à 24 mensualités), via la procédure sécurisée de prélèvement bancaire.\n\nJe reste disponible pour toute question relative à votre indemnisation ou à ce dossier de trop‑perçu.","variables":[{"key":"238_84","label":"238,84","placeholder":"238,84","default":"238,84"},{"key":"avance_non_recuperee","label":"avance non récupérée","placeholder":"avance non récupérée","default":"avance non récupérée"},{"key":"25_12_2025","label":"25/12/2025","placeholder":"25/12/2025","default":"25/12/2025"},{"key":"31_12_2025","label":"31/12/2025","placeholder":"31/12/2025","default":"31/12/2025"}],"isOfficial":true},{"id":"bm-umrnc12hmkdmy","title":"Fin de droit Rechargement KO","shortTitle":"Fin de droit Rechargement KO","category":"Fin de droit SAE","tags":["SAE fin de droit ko"],"body":"Vous arrivez en fin de droit aux allocations de retour à l’emploi (ARE) dans {{54}} jours, pour les droits calculés sur la fin de contrat du {{31_01_2025}}.\n\nVous ne pourrez pas bénéficier du rechargement du droit ARE puisqu’il faut avoir retravaillé au moins 182 jours depuis la dernière étude de droit, et il faut que cette activité se soit terminée sans que la fin de contrat ne soit à votre initiative: conditions que vous ne remplissez pas pour le moment.\n\nVous pourrez éventuellement prétendre à l’Allocation de Solidarité Spécifique (ASS).\n\nJe vous invite à remplir votre demande depuis votre espace personnel dans la rubrique « mes allocations » en fournissant les justificatifs demandés dont la copie de votre dernier avis d’imposition.\n\nPlus d’information sur cette allocation en cliquant sur ce lien.\nEn cas de rejet de cette allocation, il conviendra de faire une demande d’aide de fin de droit.\nPlus d’information sur cette aide en cliquant sur ce lien .\nIl conviendra également de faire une demande de RSA auprès de la CAF sur caf.fr.\n\nPlus d’information sur cette allocation en cliquant sur ce lien .\n\nDès lors que vous aurez retravaillé 182 jours calendaires (6 mois ou 610 heures) et que cette activité sera terminée avec un motif permettant une ouverture de droit, vous pourrez à nouveau prétendre à des droits ARE.\n\nToutes les informations en cliquant sur ce lien.\n\nSi vous rencontrez des difficultés dans votre recherche d’emploi, n’hésitez pas à en parler à votre conseiller emploi/formation directement depuis votre espace sur francetravail.fr rubrique « mes échanges avec France Travail».\n\nJe reste disponible pour des informations complémentaires sur cette situation de fin de droits. Vous pouvez également me joindre depuis votre espace sur francetravail.fr, rubrique «mes échanges avec France Travail».","variables":[{"key":"54","label":"54","placeholder":"54","default":"54"},{"key":"31_01_2025","label":"31/01/2025","placeholder":"31/01/2025","default":"31/01/2025"}],"isOfficial":true},{"id":"bm-umrlv9ugkn8gg","title":"Contact - ASS","shortTitle":"Contact - ASS","category":"ASS","tags":["dossier ASS"],"body":"Concernant votre dossier ASS, je vous invite à contacter le 3949 ; des conseillers indemnisation sont à votre disposition. En fonction de votre situation, le conseiller pourra vous mettre directement en relation avec le service ASS.\n\nLes horaires d’accueil téléphonique sont les suivants :\n• du lundi au mercredi : 8 h 30 – 16 h 30  \n• le jeudi : 8 h 30 – 12 h 30  \n• le vendredi : 8 h 30 – 15 h 30\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-umrlrcmogz3rj","title":"Actualisation et Rechargement","shortTitle":"Actualisation et Rechargement","category":"Rechargement","tags":["Décalage -1er jour indemnisable - activité reprise"],"body":"Un rechargement a été effectué le 19/06/2026, ce qui positionnait initialement votre nouvelle prise en charge au {{27_06_2026}}.\n\nComme vous avez repris une activité avec {{gojob_logistics}} sur cette période du {{24_06_2026_au_27_06_2026}}, la date de début de prise en charge a été automatiquement ajustée au {{01_07_2026}}.","variables":[{"key":"27_06_2026","label":"27/06/2026","placeholder":"27/06/2026","default":"27/06/2026"},{"key":"gojob_logistics","label":"GoJob Logistics","placeholder":"GoJob Logistics","default":"GoJob Logistics"},{"key":"24_06_2026_au_27_06_2026","label":"24/06/2026 au 27/06/2026","placeholder":"24/06/2026 au 27/06/2026","default":"24/06/2026 au 27/06/2026"},{"key":"01_07_2026","label":"01/07/2026","placeholder":"01/07/2026","default":"01/07/2026"}],"isOfficial":true},{"id":"bm-umrepzjc83kvn","title":"Rechargement - Echec","shortTitle":"Rechargement - Echec","category":"Rechargement","tags":["Rechargement OK Fin de droit"],"body":"Vous arrivez en fin de droit aux allocations de retour à l’emploi (ARE) dans {{63}} jours, pour les droits calculés sur la fin de contrat du {{28_10_2022}}.\n\nVous ne pourrez pas bénéficier du rechargement du droit ARE puisqu’il faut avoir retravaillé au moins 182 jours depuis la dernière étude de droit, et il faut que cette activité se soit terminée sans que la fin de contrat ne soit à votre initiative: conditions que vous ne remplissez pas pour le moment.\n\nVous pourrez éventuellement prétendre à l’Allocation de Solidarité Spécifique (ASS). \nJe vous invite à remplir votre demande depuis votre espace personnel dans la rubrique « mes allocations » en fournissant les justificatifs demandés dont la copie de votre dernier avis d’imposition.\nPlus d’information sur cette allocation en cliquant sur ce lien : https://plmpl.fr/c/61vmU.\n\nEn cas de rejet de cette allocation, il conviendra de faire une demande d’aide de fin de droit.\nPlus d’information sur cette aide en cliquant sur ce lien : https://plmpl.fr/c/sEj8F .\nIl conviendra également de faire une demande de RSA auprès de la CAF sur caf.fr.\nPlus d’information sur cette allocation en cliquant sur ce lien : https://plmpl.fr/c/2zwv9 .\n\nDès lors que vous aurez retravaillé 182 jours calendaires (6 mois ou 610 heures) et que cette activité sera terminée avec un motif permettant une ouverture de droit, vous pourrez à nouveau prétendre à des droits ARE.\nToutes les informations en cliquant sur ce lien :  https://plmpl.fr/c/ZJd5p.\n\nSi vous rencontrez des difficultés dans votre recherche d’emploi, n’hésitez pas à en parler à votre conseiller emploi/formation directement depuis votre espace sur https://www.francetravail.fr/accueil/ rubrique « mes échanges avec France Travail».\n\nJe reste disponible pour des informations complémentaires sur cette situation de fin de droits. Vous pouvez également me joindre depuis votre espace sur https://www.francetravail.fr/accueil/, rubrique «mes échanges avec France Travail».","variables":[{"key":"63","label":"63","placeholder":"63","default":"63"},{"key":"28_10_2022","label":"28/10/2022","placeholder":"28/10/2022","default":"28/10/2022"}],"isOfficial":true},{"id":"bm-umrenwnantn5z","title":"Trop-perçu","shortTitle":"Trop-perçu","category":"Trop-perçu","tags":["TP","modalité de remboursement SAE"],"body":"Nous avons détecté un trop perçu d’un montant de {{96_23}}€ pour de {{l_activite_non_declaree}} pour la période du {{01_03_2026}} au {{15_03_2026}} .\nA compter de la notification du trop-perçu, vous avez un mois pour le rembourser en utilisant l’un des modes de règlements suivants :\n\n-\tPar prélèvement bancaire, en ligne directement depuis votre espace personnel. Retrouvez la vidéo Pas à Pas sur francetravail.fr \"Je dois rembourser France Travail à la suite d'un trop-perçu\" ou en cliquant https://plmpl.fr/c/UeHNT. \nCette procédure simple, rapide et sécurisée permet de rembourser soit en une fois soit de manière échelonnée (jusqu’à 24 mensualités), sans avoir à fournir de justificatif. Vous pouvez également choisir la date de premier prélèvement.\n\nATTENTION : Les prélèvements doivent être effectués sur un compte ouvert à votre nom. Le prélèvement bancaire n’est pas autorisé sur le livret A ainsi que sur les autres comptes d’épargne (Livret de Développement Durable, compte épargne logement et comptes assimilés)\n\nA noter que vous pouvez demander à votre conseiller par mail de récupérer le trop-perçu en totalité sur le versement de votre prochaine  allocation chômage.\n\nSi vous avez d'autres questions ou besoin de plus de détails, je vous invite à contacter France Travail au 3949 (choix 4) ; des conseillers indemnisation de votre agence sont à votre disposition.","variables":[{"key":"96_23","label":"96.23","placeholder":"96.23","default":"96.23"},{"key":"l_activite_non_declaree","label":"l’activité non déclarée","placeholder":"l’activité non déclarée","default":"l’activité non déclarée"},{"key":"01_03_2026","label":"01/03/2026","placeholder":"01/03/2026","default":"01/03/2026"},{"key":"15_03_2026","label":"15/03/2026","placeholder":"15/03/2026","default":"15/03/2026"}],"isOfficial":true},{"id":"bm-umrejz1zh9mhf","title":"Reprise emploi complément ARE","shortTitle":"Reprise emploi complément ARE","category":"Complément ARE","tags":["Reprise emploi complément ARE"],"body":"Concernant l’impact de la reprise d’une activité professionnelle sur vos allocations chômage (ARE), celle-ci peut effectivement entraîner une modification de votre indemnisation.\n\nVous pouvez bénéficier d’un complément d’ARE, calculé en fonction du salaire brut perçu dans le cadre de votre activité reprise.\n\nLe cumul est possible jusqu’à épuisement de vos droits, mais les jours non indemnisés sont reportés, ce qui prolonge la durée totale de vos droits.\n\nPour connaître en détail les modalités de calcul applicables lors d’une reprise d’emploi, je vous invite à consulter le lien suivant : https://plmpl.fr/c/oUQWx\n\nUn simulateur dédié vous permet également d’estimer votre complément d’ARE : Guide simulateur","variables":[],"isOfficial":true},{"id":"bm-m001","title":"Étude de droits — mise en attente sur nouvelle fin de mission","shortTitle":"Étude de droits — mise en attente sur nouvelle fin de mission","category":"Admission","tags":["ARE","mise en attente","intérim","attestation employeur"],"body":"Objet : Traitement de votre demande d'indemnisation\n\nJe tiens à vous rappeler que l'étude de vos droits a été effectuée sur la base de votre fin de contrat du {{date_fc}}, et non celle du {{date_fc_alternative}}.\n\nSuite à votre demande d'étude de droits concernant votre fin de mission du {{date_fin_mission}}, votre dossier sera mis en attente.\n\nUn réexamen selon votre demande sera effectué sur votre fin de mission du {{date_fin_mission}}, après validation de ma hiérarchie, dès réception de l'attestation employeur de votre agence d'intérim {{agence}}. Ce document nous sera transmis par voie dématérialisée {{periode}}, conformément à leur procédure interne.\n\nJe tiens à vous informer que la nouvelle étude déterminera indubitablement une nouvelle admission avec un nouveau taux d'allocation et une nouvelle date de prise en charge, conformément à la législation de l'assurance chômage en vigueur.\n\nIl est inutile de nous contacter concernant l'avancement de votre dossier tant que nous n'aurons pas reçu l'attestation employeur destinée à France Travail par voie dématérialisée, protocole indispensable à l'étude de vos droits.\n\nPour toute autre question, veuillez contacter France Travail au 3949 (choix 4) où les conseillers indemnisation de votre agence restent à votre disposition.","variables":[{"key":"date_fc","label":"Date fc","placeholder":"Date fc","default":""},{"key":"date_fc_alternative","label":"Date fc alternative","placeholder":"Date fc alternative","default":""},{"key":"date_fin_mission","label":"Date fin mission","placeholder":"Date fin mission","default":""},{"key":"agence","label":"Agence","placeholder":"Agence","default":""},{"key":"periode","label":"Période","placeholder":"Période","default":""}],"isOfficial":true},{"id":"bm-m002","title":"Précisions sur les délais d'indemnisation (ISLR / ICCP / carence)","shortTitle":"Précisions sur les délais d'indemnisation (ISLR / ICCP / carence)","category":"Différé","tags":["différé","ICCP","ISLR","délai attente","premier versement"],"body":"Suite à l'étude de votre dossier d'allocation chômage, je vous apporte des précisions concernant le point de départ de votre indemnisation.\n\nConformément à la réglementation de l'assurance chômage, le versement de vos allocations est soumis à l'application de différents délais réglementaires :\n\n  • Un différé de {{0}} jours au titre des indemnités de rupture (ISLR)\n  • Un différé de {{24}} jours au titre des indemnités compensatrices de congés payés (ICCP) non pris à la fin de votre contrat\n  • Un délai d'attente obligatoire de 7 jours\n\n\nDans votre situation, ces délais s'appliquent comme suit :\n  • {{fin_de_contrat_de_travail}} : {{30_06_2026}}\n  • Différé ISLR : du {{01_07_2026}} au {{01_07_2026}} => ({{0}} jours)\n  • Différé ICCP : du {{01_07_2026}} au {{24_07_2026}} => ({{24}} jours) déterminé en fonction de vos congés payés versés sur les 182 jours (6 derniers mois) précédent la fin de contrat du {{30_06_2026}}.\n  • Délai d'attente : du {{25_07_2026}} au {{31_08_2026}} => (7 jours)\n\n\nPar conséquent, votre premier jour d'indemnisation est fixé au {{01_08_2026}}.\nVotre premier versement s'élèvera à {{891}}€, correspondant à {{30}} jours d'indemnisation (à raison de {{29_70}}€ par jour) qui vous sera versé début septembre après votre actualisation.\n\n\nPour plus d'informations sur la réglementation, je vous invite à consulter les liens suivants :\n\n  • Dans quel délai vais-je être indemnisé(e) ? — https://www.unedic.org/l-assurance-chomage-et-vous/demandeur-d-emploi-ou-salarie/mon-indemnisation/dans-quel-delai-vais-je-etre-indemnise-e\n\n  • Différé congés payés — https://www.unedic.org/la-reglementation/fiches-thematiques/differe-conges-payes\n\n\n\nSi vous avez d'autres questions ou besoin de plus de détails, je vous invite à contacter France Travail au 3949 (choix 4) ; des conseillers indemnisation de votre agence sont à votre disposition.","variables":[{"key":"0","label":"0","placeholder":"0","default":"0"},{"key":"24","label":"24","placeholder":"24","default":"24"},{"key":"fin_de_contrat_de_travail","label":"Fin de contrat de travail","placeholder":"Fin de contrat de travail","default":"Fin de contrat de travail"},{"key":"30_06_2026","label":"30/06/2026","placeholder":"30/06/2026","default":"30/06/2026"},{"key":"01_07_2026","label":"01/07/2026","placeholder":"01/07/2026","default":"01/07/2026"},{"key":"24_07_2026","label":"24/07/2026","placeholder":"24/07/2026","default":"24/07/2026"},{"key":"25_07_2026","label":"25/07/2026","placeholder":"25/07/2026","default":"25/07/2026"},{"key":"31_08_2026","label":"31/08/2026","placeholder":"31/08/2026","default":"31/08/2026"},{"key":"01_08_2026","label":"01/08/2026","placeholder":"01/08/2026","default":"01/08/2026"},{"key":"891","label":"891","placeholder":"891","default":"891"},{"key":"30","label":"30","placeholder":"30","default":"30"},{"key":"29_70","label":"29.70","placeholder":"29.70","default":"29.70"}],"isOfficial":true},{"id":"bm-m003","title":"Activités non déclarées — impact sur l'affiliation","shortTitle":"Activités non déclarées — impact sur l'affiliation","category":"Affiliation","tags":["actualisation","activités non déclarées","130 jours","910 heures"],"body":"Après vérification, je ne vois aucune trace de contact téléphonique.\n\nAprès examen de votre dossier, je m'aperçois que vous n'avez pas déclaré vos activités du {{date}} au {{date_2}} durant lesquelles vous avez travaillé pour {{employeur_1}} et {{employeur_2}}, ni du {{date_3}} au {{date_4}} durant lesquelles vous avez travaillé pour {{employeur_3}}.\n\nJe vous rappelle ici la réglementation de l'assurance chômage : vous devez avoir travaillé au moins 130 jours ou 910 heures (environ 6 mois) dans les 24 derniers mois, ou 36 mois si vous avez 53 ans ou plus, et ne pas avoir quitté votre emploi de manière volontaire.\n\nPar ailleurs, selon la réglementation de l'assurance chômage en France, les périodes de travail non déclarées lors de l'actualisation ne sont pas prises en compte pour le calcul de la durée d'affiliation. Il est donc crucial de déclarer toutes les périodes de travail pour garantir que votre durée d'affiliation soit correctement calculée et que vous puissiez bénéficier de vos droits à l'assurance chômage.\n\nVous pouvez consulter le texte complet sur le site de l'UNEDIC (Chapitre 1 — Art. 28 §1er) :\nhttps://www.unedic.org/la-reglementation/conventions-d-assurance-chomage/reglement-general-annexe-a-la-convention-du-14-avril-2017-relative-a-l-assurance-chomage-2\n\nSi vous avez d'autres questions ou besoin de plus de détails, je vous invite à contacter France Travail au 3949 (choix 4) ; des conseillers indemnisation de votre agence sont à votre disposition.","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"date_2","label":"DATE (2)","placeholder":"DATE (2)","default":""},{"key":"employeur_1","label":"Employeur 1","placeholder":"Employeur 1","default":""},{"key":"employeur_2","label":"Employeur 2","placeholder":"Employeur 2","default":""},{"key":"date_3","label":"DATE (3)","placeholder":"DATE (3)","default":""},{"key":"date_4","label":"DATE (4)","placeholder":"DATE (4)","default":""},{"key":"employeur_3","label":"Employeur 3","placeholder":"Employeur 3","default":""}],"isOfficial":true},{"id":"bm-m004","title":"Admission ARE — notification standard","shortTitle":"Admission ARE — notification standard","category":"Admission","tags":["ARE","admission","notification"],"body":"Je vous informe que votre dossier d'allocation chômage a été traité.\n\nUne notification d'admission à l'Allocation d'aide au Retour à l'Emploi vous sera disponible dans votre espace personnel sous 24 h.\n\nJe vous invite à en prendre connaissance.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-m005","title":"Admission ARE — avec taux, date et durée","shortTitle":"Admission ARE — avec taux, date et durée","category":"Admission","tags":["ARE","admission","taux","durée","prise en charge"],"body":"Je vous informe que votre dossier d'allocation chômage a été traité.\nUne notification d'admission à l'Allocation d'aide au Retour à l'Emploi vous sera disponible dans votre espace personnel sous 24 h.\nJe vous invite à en prendre connaissance, vous retrouverez tous les éléments explicatifs de votre droit.\nÀ ce titre, vous êtes pris(e) en charge à partir du {{date}} au taux net de {{montant}}€ par jour pour une durée de {{x}} jours.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4) les conseillers indemnisation de votre agence sont à votre disposition.","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"x","label":"X","placeholder":"X","default":""}],"isOfficial":true},{"id":"bm-m006","title":"Rechargement des droits — notification avec taux","shortTitle":"Rechargement des droits — notification avec taux","category":"Rechargement","tags":["rechargement","ARE","taux","nouveau contrat"],"body":"Je vous informe que le rechargement de votre allocation chômage a été traité suite à votre fin de contrat du {{date_fc}}.\n\nPour information, vous êtes pris(e) en charge au taux de {{montant}}€ par jour à compter du {{date}}.\n\nUne notification d'admission à l'Allocation d'aide au Retour à l'Emploi est disponible dans votre espace personnel.\n\nJe vous invite à en prendre connaissance.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[{"key":"date_fc","label":"Date fc","placeholder":"Date fc","default":""},{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"date","label":"DATE","placeholder":"DATE","default":""}],"isOfficial":true},{"id":"bm-m007","title":"Reprise des droits — notification standard","shortTitle":"Reprise des droits — notification standard","category":"Reprise","tags":["reprise","ARE","notification"],"body":"Je vous informe que votre dossier d'allocation chômage a été traité.\n\nUne notification de reprise des droits aux allocations d'aide au Retour à l'Emploi vous sera disponible dans votre espace personnel sous 24 h.\nVous avez un reliquat de droits de 565 jours pour une prise en charge au 06/09/2026 au taux de 25.73€ par jour.\n\nJe vous invite à en prendre connaissance.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-m008","title":"Dossier transféré au Service Prévention des Fraudes","shortTitle":"Dossier transféré au Service Prévention des Fraudes","category":"Recours IPR","tags":["audit","fraude","réclamation"],"body":"Après vérification, je vous informe que votre dossier dépend de l'audit et que vous avez reçu un courrier circonstancié lié à la remise en cause de vos paiements.\n\nDorénavant, toute réclamation s'exerce auprès du Service Prévention des Fraudes :\npreventionfraudes.normandie@francetravail.fr\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-m009","title":"Rejet pour démission — 65 jours / 455 h non effectués","shortTitle":"Rejet pour démission — 65 jours / 455 h non effectués","category":"Rejet démission","tags":["démission","rejet","65 jours","455 heures"],"body":"Je vous informe que votre dossier d'allocation chômage a été traité.\n\nVous ne pouvez pas prétendre à une ouverture de droit suite à votre démission du {{date}} (employeur {{employeur}}) : vous ne justifiez pas d'au moins 65 jours (ou 455 heures) travaillés depuis votre démission.\n\nUne notification de rejet pour démission, suite à votre fin de contrat du {{date_2}}, vous sera disponible dans votre espace personnel sous 24 h.\n\nJe vous invite à en prendre connaissance.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"employeur","label":"Employeur","placeholder":"Employeur","default":""},{"key":"date_2","label":"DATE (2)","placeholder":"DATE (2)","default":""}],"isOfficial":true},{"id":"bm-m010","title":"Démission — suspension des droits pendant 4 mois","shortTitle":"Démission — suspension des droits pendant 4 mois","category":"Rejet démission","tags":["démission","suspension","4 mois"],"body":"Vous ne pouvez pas prétendre à la poursuite de vos allocations chômage suite à la démission du {{date}} (employeur {{employeur}}).\n\nUne notification de rejet pour démission avec suspension de vos droits aux allocations chômage pendant 4 mois est disponible dans votre espace personnel.\nSi vous êtes toujours à la recherche active d'un emploi le 11 décembre 2026 , vous pouvez demander une nouvelle étude de votre situation au vu des démarches réalisées du 12 août 2026 au 10 décembre 2026.\n\nJe vous invite à en prendre connaissance.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"employeur","label":"Employeur","placeholder":"Employeur","default":""}],"isOfficial":true},{"id":"bm-m011","title":"Réglementation démission — 455 h / 3 mois d'activité","shortTitle":"Réglementation démission — 455 h / 3 mois d'activité","category":"Rejet démission","tags":["démission","règlementation","départ volontaire","unedic"],"body":"Conformément à la réglementation de l'assurance chômage, vous ne pouvez pas bénéficier d'une ouverture de droit aux allocations chômage après une démission qui n'est pas suivie d'une activité d'au moins 455 h, soit 3 mois d'activité.\n\nJe vous invite à consulter les informations réglementaires en matière de départ volontaire sur le lien suivant :\nLa démission — https://www.unedic.org/indemnisation/fiches-thematiques/demission\n\nPour plus d'informations, vous pouvez prendre contact au 3949.","variables":[],"isOfficial":true},{"id":"bm-m012","title":"Démission — décision défavorable et demande de contrat","shortTitle":"Démission — décision défavorable et demande de contrat","category":"Rejet démission","tags":["démission","décision défavorable","contrat de travail"],"body":"Suite à votre appel téléphonique de ce jour, je vous confirme malheureusement qu'une décision défavorable vous sera opposée sur la démission chez {{employeur}}.\n\nNéanmoins, merci de me télécharger le contrat de travail chez {{employeur}} précisant l'intensité horaire réelle, afin de confirmer réglementairement la non poursuite de vos droits.\n\nVous devrez reprendre une activité de 65 jours travaillés ou 455 heures pour annuler les effets de la démission. Dans le cas contraire, vous pourrez solliciter un réexamen auprès de notre commission paritaire concernant vos reprises et démarches d'emploi.\n\nVous aurez toutes les informations nécessaires au moment de la décision.","variables":[{"key":"employeur","label":"Employeur","placeholder":"Employeur","default":""}],"isOfficial":true},{"id":"bm-m013","title":"Chômage étudiant — incompatibilité de principe","shortTitle":"Chômage étudiant — incompatibilité de principe","category":"Divers","tags":["étudiant","chômage","disponibilité"],"body":"Vous nous interrogez sur l'éventualité de percevoir une allocation chômage dans le cadre du statut étudiant.\n\nEn principe, la réponse est non. En effet, il semble difficile de rendre compatibles les notions de recherche active d'emploi et de disponibilité immédiate avec celle de poursuivre des études jusqu'à l'obtention d'un diplôme.\n\nCependant, chaque situation s'apprécie séparément et seul un conseiller France Travail pourra déterminer avec l'étudiant s'il peut obtenir ou non des allocations chômage.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-m014","title":"Pas besoin de RDV — horaires 3949","shortTitle":"Pas besoin de RDV — horaires 3949","category":"Contact","tags":["3949","RDV","horaires"],"body":"Il n'est pas nécessaire de prendre rendez-vous. Je vous invite fortement à appeler le 3949 ; des conseillers indemnisation sont à votre disposition :\n  • du lundi au mercredi de 8 h 30 à 16 h 30\n  • le jeudi de 8 h 30 à 12 h 30\n  • le vendredi de 8 h 30 à 15 h 30\n\nOu bien, vous pouvez préciser le sujet de votre requête afin d'évaluer la nécessité d'un rendez-vous.\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-m015","title":"N'ayant pas pu vous joindre — relance 3949","shortTitle":"N'ayant pas pu vous joindre — relance 3949","category":"Contact","tags":["3949","relance","téléphone"],"body":"N'ayant pas pu vous joindre ce jour par téléphone, je vous invite fortement à appeler le 3949 ; des conseillers indemnisation sont à votre disposition :\n  • du lundi au mercredi de 8 h 30 à 16 h 30\n  • le jeudi de 8 h 30 à 12 h 30\n  • le vendredi de 8 h 30 à 15 h 30\n\nOu bien, vous pouvez préciser le sujet de votre requête afin d'évaluer la nécessité d'être rappelé(e).\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-m016","title":"Demande de renouvellement ASS transmise","shortTitle":"Demande de renouvellement ASS transmise","category":"ASS","tags":["ASS","renouvellement","solidarité"],"body":"Votre demande de renouvellement a bien été transmise au service Allocation de Solidarité Spécifique (ASS), qui se chargera du traitement de votre dossier.","variables":[],"isOfficial":true},{"id":"bm-m017","title":"Documents — à déposer sur l'espace personnel","shortTitle":"Documents — à déposer sur l'espace personnel","category":"Documents","tags":["justificatifs","espace personnel","canal mail"],"body":"J'accuse réception de vos documents.\n\nPour une meilleure prise en charge de vos documents, je vous invite impérativement à télécharger vos pièces depuis votre espace personnel.\n\nLe mail n'est pas un canal pour déposer vos justificatifs.\n\nSi vous rencontrez des difficultés pour transmettre vos documents, je vous invite à vous rapprocher de votre agence pour les scanner ; des conseillers France Travail sont à votre disposition pour vous accompagner.\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-m018","title":"Attestation employeur non exploitable — à rescanner","shortTitle":"Attestation employeur non exploitable — à rescanner","category":"Documents","tags":["attestation employeur","non exploitable","rescanner"],"body":"J'accuse réception de votre attestation de travail chez {{employeur}} du {{date_debut}} au {{date_fin}}.\n\nJe vous informe que votre document n'est pas exploitable. Vous devez scanner, depuis votre espace personnel, l'attestation employeur destinée à France Travail.\n\nPour plus d'informations, vous pouvez prendre contact avec un conseiller France Travail au 3949.","variables":[{"key":"employeur","label":"Employeur","placeholder":"Employeur","default":""},{"key":"date_debut","label":"Date début","placeholder":"Date début","default":""},{"key":"date_fin","label":"Date fin","placeholder":"Date fin","default":""}],"isOfficial":true},{"id":"bm-m019","title":"Attestation employeur — signature manquante page 5","shortTitle":"Attestation employeur — signature manquante page 5","category":"Documents","tags":["attestation employeur","signature","non recevable"],"body":"Je vous informe que suite à la réception de votre attestation employeur {{employeur}} pour la période du {{date_debut}} au {{date_fin}}, celle-ci n'est pas recevable au motif suivant : signature de l'employeur manquante en page 5.\n\nPour une meilleure prise en charge de vos documents, je vous invite impérativement à télécharger vos pièces depuis votre espace personnel. Le mail n'est pas un canal pour déposer vos justificatifs.\n\nSi vous rencontrez des difficultés pour transmettre vos documents, je vous invite à vous rapprocher de votre agence ; des conseillers France Travail sont à votre disposition pour vous accompagner.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[{"key":"employeur","label":"Employeur","placeholder":"Employeur","default":""},{"key":"date_debut","label":"Date début","placeholder":"Date début","default":""},{"key":"date_fin","label":"Date fin","placeholder":"Date fin","default":""}],"isOfficial":true},{"id":"bm-m020","title":"Correction d'actualisation — régularisation dossier","shortTitle":"Correction d'actualisation — régularisation dossier","category":"Actualisation","tags":["actualisation","correction","régularisation"],"body":"J'accuse réception de votre message concernant l'erreur de votre actualisation sur {{mois_annee}}.\n\nVous m'informez que vous n'avez pas effectué de {{evenement}} sur {{mois_annee}}.\n\nJe vous informe que votre dossier d'actualisation a été corrigé et votre dossier est régularisé.\n\nMerci de votre compréhension.","variables":[{"key":"mois_annee","label":"Mois/année","placeholder":"Mois/année","default":""},{"key":"evenement","label":"Événement","placeholder":"Événement","default":""}],"isOfficial":true},{"id":"bm-m021","title":"Création d'entreprise — envoi formulaire et justificatifs","shortTitle":"Création d'entreprise — envoi formulaire et justificatifs","category":"Créateurs d'entreprise","tags":["création entreprise","formulaire","justificatifs"],"body":"Suite à la réception des justificatifs de création d'entreprise, nous devons mettre à jour cet événement dans votre dossier.\n\nEn effet, la création d'entreprise fait l'objet d'un processus.\n\nJe vous invite à compléter, signer et télécharger le formulaire en pièce jointe, ainsi que les justificatifs inhérents au statut juridique de votre entreprise, directement dans votre espace personnel.\n\nVous trouverez également un lien ci-dessous vous informant sur l'aspect réglementaire :\nhttps://plmpl.fr/c/D3G6D\n\nJe mettrai à jour votre dossier dès réception des documents.\n\nJe me tiens à votre disposition pour tout renseignement complémentaire.\n\nPour plus d'informations, vous pouvez contacter France Travail au 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-m022","title":"Création d'entreprise — ARCE ou cumul ARE","shortTitle":"Création d'entreprise — ARCE ou cumul ARE","category":"Créateurs d'entreprise","tags":["ARCE","cumul ARE","micro-entreprise","activité non salariée"],"body":"Vous me faites part d'un changement de situation en m'informant que vous avez créé votre entreprise.\n\nAfin de gérer la prise en compte de votre nouvelle activité non salariée et votre indemnisation chômage, je vous invite à compléter le formulaire ci-joint et le retourner, par téléchargement depuis votre espace personnel, accompagné des justificatifs demandés selon l'option choisie.\n\nAu regard de l'assurance chômage, le demandeur d'emploi qui reprend une activité non salariée peut bénéficier :\n\n  • de l'Aide à la Reprise ou la Création d'Entreprise (ARCE). Cette aide est versée en deux fois et correspond à 60 % des allocations qui vous restent à la date où vous débutez votre activité ;\n  • ou des dispositions relatives au cumul de l'Allocation d'Aide au Retour à l'Emploi (ARE) avec les rémunérations procurées par l'activité professionnelle non salariée. Cette aide correspond à un maintien partiel des allocations d'assurance chômage.\n\nPour plus d'informations, connectez vous sur le site www.francetravail.fr en suivant le chemin :\n« Accueil France Travail > Candidat > Mon projet, ma recherche > Je crée mon entreprise > Mes aides financières > Les aides délivrées par France Travail »\nhttps://plmpl.fr/c/SxoPj\nPour plus d'informations, vous pouvez prendre contact au 3949.","variables":[],"isOfficial":true},{"id":"bm-m023","title":"Identification impossible — sécurisation des échanges","shortTitle":"Identification impossible — sécurisation des échanges","category":"Documents","tags":["identification","sécurisation","adresse mail"],"body":"Nous avons bien reçu votre mail. Les éléments communiqués ne nous ont pas permis de vous identifier complètement.\n\nAfin de sécuriser les échanges par mail, merci d'utiliser l'adresse courriel en référence dans votre espace personnel, ou de la modifier le cas échéant.\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-m024","title":"Confirmation de versement d'allocation","shortTitle":"Confirmation de versement d'allocation","category":"Divers","tags":["versement","paiement","allocation"],"body":"Après consultation de votre dossier, je vous confirme le versement de votre allocation de {{mois_annee}} d'un montant de {{montant}}€, émis le {{date}}.\n\nJe vous invite à vous rapprocher de votre banque si le crédit n'apparaît pas.\n\nMerci de votre compréhension.","variables":[{"key":"mois_annee","label":"Mois/année","placeholder":"Mois/année","default":""},{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"date","label":"DATE","placeholder":"DATE","default":""}],"isOfficial":true},{"id":"bm-m025","title":"RIB — prise en compte exceptionnelle","shortTitle":"RIB — prise en compte exceptionnelle","category":"Documents","tags":["RIB","exceptionnel","espace personnel"],"body":"Exceptionnellement, je prends en compte votre RIB pour traitement.\n\nEn revanche, je vous invite impérativement à télécharger vos documents depuis votre espace personnel pour une meilleure gestion de votre dossier.\n\nLe mail n'est pas un canal pour déposer vos justificatifs.\n\nSi vous rencontrez des difficultés pour transmettre vos documents, je vous invite à vous rapprocher de votre agence ; des conseillers France Travail sont à votre disposition pour vous accompagner.\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-m026","title":"Effacement de dette — remplir pages 5 et 6","shortTitle":"Effacement de dette — remplir pages 5 et 6","category":"Trop-perçu","tags":["effacement dette","trop-perçu","formulaire"],"body":"Vous souhaitez faire une demande d'effacement de dette sur votre trop-perçu.\n\nAfin de gérer votre demande, je vous invite impérativement à remplir les pages 5 et 6 de la notification de trop-perçu que vous avez reçue le {{date}} dans la rubrique « Mes courriers » depuis votre espace personnel.\n\nMerci de retourner le formulaire par téléchargement depuis votre espace personnel, accompagné des justificatifs de ressources et de charges mensuelles.\n\nMerci de votre compréhension.","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""}],"isOfficial":true},{"id":"bm-m027","title":"Effacement de dette — transmission à l'IPR","shortTitle":"Effacement de dette — transmission à l'IPR","category":"Recours IPR","tags":["effacement dette","IPR","commission paritaire"],"body":"Votre demande d'effacement de dette a été prise en compte.\n\nUn rapport a été transmis à l'Instance Paritaire Régionale (IPR).\n\nDès traitement, une réponse vous sera apportée.","variables":[],"isOfficial":true},{"id":"bm-m028","title":"IPR — décision défavorable effacement de dette","shortTitle":"IPR — décision défavorable effacement de dette","category":"Recours IPR","tags":["IPR","refus","effacement dette","appel"],"body":"Votre dossier a été soumis à l'Instance Paritaire Régionale (IPR), qui a décidé de ne pas donner un avis favorable à votre demande d'effacement de dette avec les éléments fournis.\n\nJe vous informe que la commission est composée de 5 membres d'instance salariale et 5 membres d'instance patronale. Ces derniers statuent en fonction de votre argumentaire et des justificatifs fournis, sans jamais motiver leurs décisions.\n\nPar conséquent, la commission ne nous informe pas et nous n'avons pas connaissance des raisons pour lesquelles l'IPR a refusé votre demande.\n\nVous avez toujours la possibilité de faire appel si des éléments n'avaient pas été fournis lors de votre première demande.\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-m029","title":"Trop-perçu — activité non déclarée","shortTitle":"Trop-perçu — activité non déclarée","category":"Trop-perçu","tags":["trop-perçu","activité non déclarée","régularisation"],"body":"En ce qui concerne le trop-perçu de {{montant}}€, celui-ci correspond à votre activité du {{date_debut}} au {{date_fin}} que vous n'avez pas déclarée. Vous avez perçu un salaire brut de {{montant}}€ auprès de votre employeur {{employeur}}.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"date_debut","label":"Date début","placeholder":"Date début","default":""},{"key":"date_fin","label":"Date fin","placeholder":"Date fin","default":""},{"key":"employeur","label":"Employeur","placeholder":"Employeur","default":""}],"isOfficial":true},{"id":"bm-m030","title":"Trop-perçu — mise en place d'un échéancier","shortTitle":"Trop-perçu — mise en place d'un échéancier","category":"Trop-perçu","tags":["échéancier","remboursement","prélèvement"],"body":"Vous souhaitez établir un échéancier sur votre trop-perçu.\n\nVous pouvez établir votre échéancier par prélèvement directement via votre espace personnel :\nrubrique « Mes allocations » → « Mes trop-perçus » → « Trop-perçus à rembourser »\npuis choisir « Remboursement par mensualité » et suivre les étapes.\n\nUn tutoriel vidéo pour vous accompagner :\nhttps://www.youtube.com/watch?v=cqHGjCAeWFE","variables":[],"isOfficial":true},{"id":"bm-m031","title":"Trop-perçu — modalités complètes de remboursement","shortTitle":"Trop-perçu — modalités complètes de remboursement","category":"Trop-perçu","tags":["trop-perçu","remboursement","prélèvement","virement","saisie"],"body":"Je vous rappelle ici les modalités de remboursement d'un trop-perçu.\n\nÀ compter de la notification du trop-perçu, vous avez un mois pour le rembourser en utilisant l'un des modes de règlement suivants :\n\n1) Par prélèvement bancaire, en ligne directement depuis votre espace personnel. Cette procédure simple, rapide et sécurisée permet de rembourser soit en une fois, soit de manière échelonnée (jusqu'à 24 mensualités), sans avoir à fournir de justificatif. Vous pouvez également choisir la date du premier prélèvement.\n\nATTENTION : les prélèvements doivent être effectués sur un compte ouvert à votre nom. Le prélèvement bancaire n'est pas autorisé sur le Livret A ni sur les autres comptes d'épargne (LDD, CEL et comptes assimilés).\n\n2) Par virement sur le compte de France Travail ou par chèque à l'ordre de France Travail. Dans ce cas, vous pouvez rembourser en plusieurs fois en demandant un échelonnement du remboursement par écrit (courrier ou mail) auprès de votre agence France Travail.\n\nSi vous souhaitez rembourser en plus de 24 fois, vous devez joindre à votre demande le questionnaire relatif à vos ressources et charges reçu avec le courrier de notification du trop-perçu.\n\nVotre agence France Travail vous transmettra par courrier une proposition d'échéancier, à laquelle vous devrez donner votre accord. Si vous êtes indemnisé(e), votre agence vous proposera une retenue forfaitaire sur vos allocations à laquelle vous devrez donner votre accord. Si votre indemnisation cesse, vous devrez prévenir votre agence pour rembourser votre dette par un autre moyen.\n\n⚠ En cas de non-respect de l'échelonnement, France Travail est autorisé à demander le remboursement du solde en une seule fois.\n\nRETENUES SUR ALLOCATIONS\nSi vous êtes indemnisé(e), à défaut de remboursement (immédiat ou échelonné) et en l'absence de contestation de votre part, France Travail peut procéder à des retenues sur vos allocations à venir jusqu'au remboursement intégral du trop-perçu. Le montant de la retenue (« partie saisissable ») est déterminé en fonction de vos ressources et des personnes à charge, selon un barème fixé par l'article R3252-2 et suivants du code du travail.\n\nPour permettre à France Travail de calculer cette retenue, complétez et renvoyez le questionnaire reçu avec le courrier de notification du trop-perçu.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-m032","title":"Droit d'option — accusé réception et date à préciser","shortTitle":"Droit d'option — accusé réception et date à préciser","category":"Droit d'option","tags":["droit d'option","recalcul","fin de contrat"],"body":"J'accuse réception de votre demande de droit d'option.\n\nAfin d'étudier votre demande de recalcul, merci de m'indiquer sur quelle date de fin de contrat vous souhaitez réexaminer vos nouveaux droits.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-m033","title":"Droit d'option — explication complète","shortTitle":"Droit d'option — explication complète","category":"Droit d'option","tags":["droit d'option","130 jours","21 jours","réflexion"],"body":"Concernant le droit d'option :\n\nToutefois, la reprise systématique des droits non épuisés avant le rechargement des nouveaux droits peut placer certaines personnes dans des situations difficiles. C'est le cas lorsque vous avez exercé durablement une activité beaucoup mieux rémunérée que la précédente. En effet, l'indemnisation initiale qui est reprise jusqu'à son épuisement est, de fait, d'un montant moins élevé que celle liée à la période d'activité plus récente.\n\nLes demandeurs d'emploi peuvent exercer un droit d'option dès lors :\n  • qu'ils ont repris 6 mois d'activité ;\n  • qu'il y a un écart de 30 % entre le reliquat de vos droits restants au jour de la demande et le capital auquel vous pourriez prétendre en cas de recalcul de vos droits ;\n  • ou qu'ils ont une allocation inférieure ou égale à 20 € par jour.\n\nCe droit d'option, exercé sur demande expresse à la suite d'une fin de contrat de travail, concerne l'ensemble des demandeurs d'emploi indemnisés en ARE.\n\nVous disposez d'un délai de réflexion de 21 jours pour informer France Travail de votre décision. Si vous utilisez l'option, vous percevrez l'allocation issue de vos dernières périodes d'emploi à compter du jour de la demande. En exerçant l'option, vous renoncez définitivement aux droits précédemment acquis non épuisés.\n\nVous trouverez tous les détails sur le site :\nhttps://www.unedic.org/indemnisation/fiches-thematiques/droit-doption\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-m034","title":"Droit d'option — refus car capital insuffisant","shortTitle":"Droit d'option — refus car capital insuffisant","category":"Droit d'option","tags":["droit d'option","refus","capital","30%"],"body":"J'accuse réception de vos bulletins de salaire pour l'étude de votre droit d'option.\n\nAprès étude de votre demande de recalcul, je vous confirme que vous ne pouvez pas prétendre au droit d'option.\n\nEn effet, le capital de votre nouveau droit ({{montant}}€) est inférieur au capital du droit en cours majoré de 30 % ({{montant}}€).\n\nCi-joint le courrier de droit d'option irrecevable.\n\nMerci de votre compréhension.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[{"key":"montant","label":"Montant","placeholder":"Montant","default":""}],"isOfficial":true},{"id":"bm-m035","title":"Rechargement des droits — condition 130 j / 910 h","shortTitle":"Rechargement des droits — condition 130 j / 910 h","category":"Rechargement","tags":["rechargement","130 jours","910 heures","épuisement"],"body":"Concernant le rechargement de vos droits, effectivement une fois vos droits en cours utilisés et entièrement épuisés, à ce moment-là un rechargement s'effectuera automatiquement.\n\nIl s'agit d'une allocation d'un nouveau montant pour une nouvelle durée, calculée sur la base des activités reprises et des périodes antérieures non utilisées, à condition d'avoir retravaillé au moins 130 jours (182 jours calendaires ou 6 mois) ou 910 heures au titre d'une ou plusieurs activités.\n\nPour plus d'informations, vous pouvez prendre contact au 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-m036","title":"Renouvellement ASS — modalités tous les 6 mois","shortTitle":"Renouvellement ASS — modalités tous les 6 mois","category":"ASS","tags":["ASS","renouvellement","6 mois","questionnaire"],"body":"J'accuse réception de votre demande concernant le renouvellement de 6 mois de votre Allocation de Solidarité Spécifique (ASS).\n\nJe vous informe qu'effectivement le renouvellement ASS est réexaminé tous les 6 mois, sur la base du questionnaire de renouvellement ASS qui vous sera transmis dans votre espace personnel. Si votre situation n'a pas changé financièrement, le renouvellement de l'ASS sera validé.\n\nPour plus d'informations, vous pouvez contacter le 3949.","variables":[],"isOfficial":true},{"id":"bm-m037","title":"Contestation IPR — saisine du tribunal judiciaire de Rouen","shortTitle":"Contestation IPR — saisine du tribunal judiciaire de Rouen","category":"Recours IPR","tags":["tribunal judiciaire","Rouen","contestation","IPR"],"body":"Vous me faites part de votre contestation concernant le refus d'ouverture de droit suite à l'examen de l'Instance Paritaire Régionale.\n\nÀ ce titre, je vous invite à saisir le tribunal judiciaire de Rouen, dont voici les coordonnées :\n\n    Tribunal judiciaire de Rouen\n    34 rue aux Juifs\n    76000 Rouen\n    02 35 52 87 52\n    tj-rouen@justice.fr\n\nConcernant la partie sur le suivi et l'accompagnement de votre projet, vous serez ultérieurement contacté(e) par mes collaborateurs du placement.\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-m038","title":"Commission IPR — appréciation démission","shortTitle":"Commission IPR — appréciation démission","category":"Recours IPR","tags":["IPR","commission","démission","121 jours","médiateur"],"body":"La commission étudie vos actions et démarches effectuées sur les 121 jours qui suivent votre démission.\n\nElle évalue le degré de recherche d'emploi (candidatures, entretiens…) ainsi que l'éventuelle reprise d'activité.\n\nLe fait d'avoir suivi une prestation (en l'occurrence dans votre cas {{prestation}}) ne signifie pas au regard de la commission que cela soit un élément déclencheur de l'obtention des droits aux allocations chômage.\n\nCertes, le suivi d'une prestation fait partie du faisceau d'éléments qui peut concourir à une décision positive. À priori, dans votre cas, la commission n'a pas jugé votre recherche d'emploi suffisante sur les 121 jours pour l'obtention des droits aux allocations, malgré la réalisation de la prestation.\n\nSi vous entendez contester la décision, vous pouvez saisir le médiateur de France Travail :\nhttps://www.francetravail.fr/candidat/vos-droits-et-demarches/reclamations/le-mediateur-de-pole-emploi.html\n\nMerci de votre compréhension.","variables":[{"key":"prestation","label":"Prestation","placeholder":"Prestation","default":""}],"isOfficial":true},{"id":"bm-m039","title":"Reprise d'activité — paiement provisoire","shortTitle":"Reprise d'activité — paiement provisoire","category":"Complément ARE","tags":["paiement provisoire","reprise activité","complément","salaire brut"],"body":"J'accuse réception de votre mail concernant le paiement de {{montant}}€.\n\nAprès consultation de votre dossier, je vous informe que ce versement est un paiement provisoire qui fait suite à votre déclaration de {{mois_annee}}.\n\nIl sera définitif à réception du justificatif (bulletin de salaire). S'il n'y a pas d'écart substantiel entre votre déclaration et le justificatif, vous recevrez un complément. Dans le cas contraire, un trop-perçu sera potentiellement déclenché.\n\nJe vous rappelle ici la règle du complément, calculé sur la base de votre salaire brut de l'activité reprise :\n\nEn cas de reprise d'activité, le calcul du montant mensuel de votre allocation est le suivant :\n  • Montant de votre allocation brute mensuelle − 70 % de votre salaire brut de l'activité reprise.\n  • Le cumul du salaire issu de l'activité reprise avec votre allocation ne peut pas être supérieur à votre salaire antérieur brut (soit 30 fois le salaire journalier de référence mentionné sur votre notification de droits).\n\nVous pouvez effectuer une simulation :\nhttps://candidat.pole-emploi.fr/candidat/simucalcul/repriseemploi\n\nPour plus d'informations, vous pouvez joindre le 3949 (choix 4).","variables":[{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"mois_annee","label":"Mois/année","placeholder":"Mois/année","default":""}],"isOfficial":true},{"id":"bm-m040","title":"Complément ARE — règle du 70 % du salaire brut","shortTitle":"Complément ARE — règle du 70 % du salaire brut","category":"Complément ARE","tags":["complément ARE","70%","salaire antérieur","cumul"],"body":"Vous souhaitez savoir pourquoi vous n'avez pas été indemnisé sur le mois de {{mois}} après votre actualisation.\n\nAprès consultation de votre dossier, je vous informe que vous avez déclaré du travail effectivement au {{21}} {{septembre}}. \n\nJe vous rappelle ici les règles du complément de l'allocation chômage :\n\nEn cas de reprise d'activité, le calcul du montant mensuel de votre allocation est le suivant :\n  • Montant de votre allocation brute mensuelle − 70 % de votre salaire brut de l'activité reprise.\n  • Le cumul du salaire issu de l'activité reprise avec votre allocation ne peut pas être supérieur à votre salaire antérieur brut (soit 30 fois le salaire journalier de référence mentionné sur votre notification de droits).\n\nVous pouvez effectuer une simulation :\nhttps://candidat.pole-emploi.fr/candidat/simucalcul/repriseemploi\n\nVous devez transmettre votre bulletin de salaire afin d'étudier le complément potentiel pour le mois de septembre.\n\nMerci de votre compréhension.","variables":[{"key":"mois","label":"MOIS","placeholder":"MOIS","default":""},{"key":"21","label":"21","placeholder":"21","default":"21"},{"key":"septembre","label":"septembre","placeholder":"septembre","default":"septembre"}],"isOfficial":true},{"id":"bm-m041","title":"Différé — explication complète (ISLR + ICCP + attente)","shortTitle":"Différé — explication complète (ISLR + ICCP + attente)","category":"Différé","tags":["différé","ISLR","ICCP","délai attente","notification admission"],"body":"Vous souhaitez avoir les explications sur la date de prise en charge de votre indemnisation.\n\nJe vous rappelle : le 1ᵉʳ jour indemnisable découle de la prise en compte de vos indemnités supra-légales et de vos congés payés, déterminés sur les 182 jours précédant votre fin de contrat ayant servi à l'examen de vos droits, ainsi que du délai de carence de 7 jours obligatoires.\n\nVous retrouvez les éléments en page 4 point 5 de votre notification d'admission reçue le {{date}} :\n\n  « Le début du versement de votre allocation tient compte de différents délais (différés) :\n\n    • {{x}} jours de différé d'indemnités de rupture, suite aux sommes reçues lors de la fin de votre contrat de travail ({{montant}} / {{sjr}} = {{x_2}} jours)\n    • {{x_3}} jours de différé d'indemnités compensatrices de congés payés non pris à la fin du contrat de travail ({{montant}} / {{sjr}} = {{x_4}} jours)\n    • 7 jours de délai d'attente. »\n\nPour plus d'informations, vous pouvez contacter le 3949.\n\nMerci de votre compréhension.","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"x","label":"X","placeholder":"X","default":""},{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"sjr","label":"SJR","placeholder":"SJR","default":""},{"key":"x_2","label":"X (2)","placeholder":"X (2)","default":""},{"key":"x_3","label":"X (3)","placeholder":"X (3)","default":""},{"key":"x_4","label":"X (4)","placeholder":"X (4)","default":""}],"isOfficial":true},{"id":"bm-m042","title":"Affiliation — périodes non déclarées impactantes","shortTitle":"Affiliation — périodes non déclarées impactantes","category":"Affiliation","tags":["affiliation","non déclaré","actualisation","jours"],"body":"Vous souhaitez savoir le nombre d'heures exigé pour prétendre à une ouverture, et combien vous avez acquis d'heures.\n\nAprès consultation, je vous informe que vous avez travaillé {{x}} jours ; vous pouviez prétendre à une ouverture de droits. Or, comme vous n'avez pas déclaré une ou plusieurs périodes d'activité à France Travail lors de votre actualisation, ces activités n'ont pas pu être prises en charge pour prendre en compte l'affiliation nécessaire à l'ouverture d'un droit.\n\nEn effet, vous n'avez pas déclaré votre activité de {{periode}}, ce qui correspond à {{x_2}} jours qui n'entrent pas dans le calcul de l'affiliation.\n\nPour plus d'informations, vous pouvez prendre contact au 3949 (choix 4).\n\nMerci de votre compréhension.","variables":[{"key":"x","label":"X","placeholder":"X","default":""},{"key":"periode","label":"Période","placeholder":"Période","default":""},{"key":"x_2","label":"X (2)","placeholder":"X (2)","default":""}],"isOfficial":true},{"id":"bm-m043","title":"Affiliation — période de recherche (24/36 mois)","shortTitle":"Affiliation — période de recherche (24/36 mois)","category":"Affiliation","tags":["affiliation","24 mois","36 mois","droits antérieurs"],"body":"Effectivement, pour l'affiliation, les jours travaillés sont recherchés dans une période déterminée :\n  • dans les 24 derniers mois (2 ans) si vous avez moins de 53 ans ;\n  • dans les 36 derniers mois (3 ans) si vous avez 53 ans et plus.\n\nCependant, la recherche de l'affiliation ne peut remonter au-delà de la dernière fin de contrat qui a déjà servi à ouvrir des droits (dans votre cas, le {{date}}).\n\nEn d'autres termes, les activités qui ont déjà servi pour le calcul d'un droit épuisé ne peuvent être réutilisées pour le calcul d'un nouveau droit. Je ne peux donc pas prendre en compte vos activités antérieures au {{date_2}}.\n\nEn espérant que cela vous aide.","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"date_2","label":"DATE (2)","placeholder":"DATE (2)","default":""}],"isOfficial":true},{"id":"bm-m044","title":"Fin de droits — rechargement automatique à venir","shortTitle":"Fin de droits — rechargement automatique à venir","category":"Rechargement","tags":["fin de droits","rechargement","automatique","182 jours"],"body":"Vous arrivez en fin de droits aux allocations de retour à l'emploi (ARE) dans {{29}} jours, pour les droits calculés sur la fin de contrat du {{08_09_2023}}.\n\nVous allez pouvoir bénéficier du rechargement du droit ARE, puisqu'il faut avoir retravaillé au moins 182 jours depuis la dernière étude de droit et avoir une fin de contrat qui ne soit pas à votre initiative — conditions que vous remplissez.\n\nCe rechargement de droit ARE interviendra de manière automatique et prendra en compte toutes les activités salariées effectuées sur les {{24}} derniers précédent votre dernière fin de mission qui servira à l’étude de vos droits sans remonter au-delà de votre fin de contrat ayant servi au calcul de vos droit en cours. Ce rechargement interviendra à épuisement total de vos droits en cours.\n\nVous trouverez toutes les informations nécessaires sur le rechargement de droits :\nhttps://plmpl.fr/c/YRR7i\n\nJe reste également disponible pour des informations complémentaires sur cette situation de fin de droits. Vous pouvez me joindre depuis votre espace sur francetravail.fr, rubrique « Mes échanges avec France Travail ».","variables":[{"key":"29","label":"29","placeholder":"29","default":"29"},{"key":"08_09_2023","label":"08/09/2023","placeholder":"08/09/2023","default":"08/09/2023"},{"key":"24","label":"24","placeholder":"24","default":"24"}],"isOfficial":true},{"id":"bm-m045","title":"Rémunération de Fin de Formation (RFF) — résumé complet","shortTitle":"Rémunération de Fin de Formation (RFF) — résumé complet","category":"Formation","tags":["RFF","formation","fin de droits","ARE-F"],"body":"Voici un résumé de la Rémunération de Fin de Formation (RFF) :\n\n  • La RFF est une rémunération qui peut être accordée aux demandeurs d'emploi qui n'ont plus droit à leur allocation pour terminer une formation validée et prescrite par France Travail.\n\n  • Elle prend le relais lorsque les droits à l'ARE-F, l'ASP-F ou l'ATI-F s'épuisent avant la fin de la formation.\n\n  • Tous les demandeurs d'emploi inscrits à France Travail dont les droits à l'ARE-F, l'ASP-F ou l'ATI-F s'épuisent avant la fin de la formation peuvent bénéficier de la RFF.\n\n  • Les formations validées par France Travail doivent permettre aux demandeurs d'emploi d'acquérir une qualification correspondant aux besoins de recrutement des entreprises.\n\n  • L'éligibilité à la RFF est détectée automatiquement lors de l'inscription en formation.\n\n  • La RFF est versée à partir de la fin des droits à l'ARE-F, l'ASP-F ou l'ATI-F jusqu'à la fin de la formation.\n\n  • Le montant de la RFF est égal au dernier montant journalier de l'ARE-F, l'ASP-F ou l'ATI-F reçu à la fin des droits.\n\n  • Ce montant ne peut excéder 723,36 € par mois et est conditionné à une obligation d'assiduité à la formation.\n\n  • La durée cumulée de versement de l'ARE-F, l'ASP-F, l'ATI-F et de la RFF est limitée à 3 ans pour une même formation.\n\n  • La RFF n'est soumise ni à la CSG ni à la CRDS.\n\n  • Les stagiaires recevant la RFF bénéficient de la même protection sociale que ceux recevant l'ARE-F au titre des risques maladie, maternité, invalidité, décès, retraite de la Sécurité sociale. France Travail prend en charge les cotisations correspondantes ; il n'y a donc pas de cotisation sociale à déduire du montant brut de la RFF.\n\n  • En revanche, les périodes de versement de la RFF ne sont pas validées au titre de la retraite complémentaire.","variables":[],"isOfficial":true},{"id":"bm-m046","title":"Démission en cours d'indemnisation — 3 cas d'exception","shortTitle":"Démission en cours d'indemnisation — 3 cas d'exception","category":"Rejet démission","tags":["démission","cours indemnisation","exceptions"],"body":"Vous souhaitez savoir si, en cas de démission, vous pouvez prétendre à la continuité de votre allocation chômage.\n\nSelon la réglementation de l'assurance chômage, une personne qui reprend une activité salariée alors qu'elle est en cours de droits à l'assurance chômage, puis qui démissionne, peut bénéficier à nouveau de ses allocations, à condition d'avoir travaillé moins de 65 jours ou 455 heures lors de sa reprise.\n\nSi vous étiez en cours d'indemnisation par France Travail au moment de votre démission, le versement de votre allocation n'est pas suspendu dans 3 cas :\n  • si vous justifiez de moins de 65 jours (ou 455 heures) travaillés depuis votre ouverture de droit ;\n  • si le contrat duquel vous avez démissionné a duré moins de 8 jours calendaires ;\n  • si le contrat duquel vous avez démissionné est de moins de 17 heures par semaine.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-m047","title":"Marins pêcheurs — affiliation spécifique","shortTitle":"Marins pêcheurs — affiliation spécifique","category":"Affiliation","tags":["marins pêcheurs","182 jours","1260 heures","annexe II"],"body":"Après vérification, je vous informe que pour la catégorie des marins pêcheurs, il faut justifier d'au moins 182 jours d'embarquement administratif ou 1 260 heures travaillées, en référence au chapitre §1ᵉʳ article 28 de l'annexe II :\nhttps://www.legifrance.gouv.fr/loda/id/JORFTEXT000038829574#LEGISCTA000038868591\n\nOr, dans votre cas, vous justifiez de {{x}} jours d'embarquement administratif, correspondant à {{x_2}} heures.\n\nEn effet, l'article auquel vous faites référence concerne le droit commun, où effectivement il faut au moins 182 jours ou 910 heures de travail.\n\nPlus d'informations sur « Comment déposer une réclamation » sur le site France Travail.\n\nMerci de votre compréhension.","variables":[{"key":"x","label":"X","placeholder":"X","default":""},{"key":"x_2","label":"X (2)","placeholder":"X (2)","default":""}],"isOfficial":true},{"id":"bm-m048","title":"Congé de reclassement — documents à transmettre (CSP)","shortTitle":"Congé de reclassement — documents à transmettre (CSP)","category":"Admission","tags":["congé reclassement","CSP","licenciement","Vallourec"],"body":"J'accuse réception de votre attestation employeur {{employeur}}.\n\nJe vous confirme également la réception de votre RIB et de vos bulletins de salaire.\n\nVous me signalez que vous avez pris un congé de reclassement du {{date_debut}} au {{date_fin}}. Afin de saisir cette information dans votre attestation employeur, je vous invite à me transmettre :\n  • l'attestation de congé de reclassement ;\n  • votre lettre de licenciement afin de vérifier que votre employeur vous a proposé le contrat de sécurisation professionnelle (CSP).\n\nPar ailleurs, suite à la réception de votre justificatif de création d'entreprise, nous devons mettre à jour cet événement dans votre dossier (la création d'entreprise fait l'objet d'un processus).\n\nJe vous invite à compléter, signer et télécharger le formulaire en pièce jointe, ainsi que les justificatifs inhérents au statut juridique de votre entreprise, directement dans votre espace personnel.\n\nLien vers l'information réglementaire :\nhttps://plmpl.fr/c/D3G6D\n\nJe mettrai à jour votre dossier dès réception des documents.\n\nMerci de votre compréhension.","variables":[{"key":"employeur","label":"Employeur","placeholder":"Employeur","default":""},{"key":"date_debut","label":"Date début","placeholder":"Date début","default":""},{"key":"date_fin","label":"Date fin","placeholder":"Date fin","default":""}],"isOfficial":true},{"id":"bm-m049","title":"Calcul ARE — précisions réglementaires et demande de vérification","shortTitle":"Calcul ARE — précisions réglementaires et demande de vérification","category":"Calcul ARE","tags":["calcul ARE","contestation","SJR","Unedic"],"body":"Objet : Précisions sur le calcul de votre allocation d'aide au retour à l'emploi (ARE)\n\nEn réponse à votre contestation concernant le calcul de votre allocation chômage, je me permets de vous apporter les précisions suivantes.\n\nBASE RÉGLEMENTAIRE\nLe calcul de votre allocation est strictement établi conformément à la réglementation de l'assurance chômage en vigueur, modifiée au 1ᵉʳ octobre 2021. Pour une compréhension approfondie des principes applicables, je vous invite à consulter la documentation officielle disponible sur le site de l'Unédic :\nhttps://www.unedic.org/la-reglementation/fiches-thematiques/salaire-de-reference\n\nPÉRIODE DE RÉFÉRENCE\nConformément aux dispositions réglementaires applicables, la période de référence retenue pour le calcul de vos droits s'étend du {{date_debut}} au {{date_fin}}, cette dernière date correspondant à la fin de mission détectée lors de votre inscription.\n\nBASE DE CALCUL\nSur cette période de référence, et sur la base des informations transmises par vos agences d'intérim, un montant total de {{montant}}€ brut a été pris en compte pour le calcul de votre Allocation d'aide au Retour à l'Emploi (ARE).\n\nVÉRIFICATION DEMANDÉE\nAfin de procéder à une vérification rigoureuse de votre dossier et d'identifier toute éventuelle discordance, je vous saurais gré de bien vouloir me communiquer le montant que vous avez personnellement calculé, ainsi que les éléments sur lesquels vous vous êtes basé(e) pour établir ce calcul. Ces informations me permettront de confronter vos données avec les salaires bruts effectivement pris en compte sur la période de référence.\n\nJe vous rappelle que des explications figurent en page 4 de votre notification d'admission pour vous aider dans la compréhension du calcul :\n\n  • Salaire journalier de référence : {{sjr}}€\n  • Nombre de jours travaillés retenu : {{x}} jours\n  • Montant net de l'allocation journalière : {{montant}}€ (avant application éventuelle du prélèvement à la source)\n  • Le montant brut de l'allocation journalière représente 73 % du salaire de référence.\n  • Différés : {{x_2}} jours de différé d'ICCP + 7 jours de délai d'attente.\n\nPour comprendre le calcul de votre allocation (durée, montant, point de départ) :\nhttps://monallocation.francetravail.fr/\n\nPar ailleurs, je vous informe que votre actualisation de {{mois}} n'a pas encore été effectuée.\n\nSi vous avez d'autres questions ou besoin de plus de détails, je vous invite à contacter France Travail au 3949 (choix 4) ; des conseillers indemnisation de votre agence sont à votre disposition.","variables":[{"key":"date_debut","label":"Date début","placeholder":"Date début","default":""},{"key":"date_fin","label":"Date fin","placeholder":"Date fin","default":""},{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"sjr","label":"SJR","placeholder":"SJR","default":""},{"key":"x","label":"X","placeholder":"X","default":""},{"key":"x_2","label":"X (2)","placeholder":"X (2)","default":""},{"key":"mois","label":"MOIS","placeholder":"MOIS","default":""}],"isOfficial":true},{"id":"bm-m050","title":"Attestation ASS — avis de situation","shortTitle":"Attestation ASS — avis de situation","category":"ASS","tags":["ASS","attestation","avis situation"],"body":"Vous me demandez une attestation de durée de droit ASS.\n\nVeuillez trouver ci-joint l'avis de situation concernant vos droits à l'ASS.\n\nSi vous avez besoin d'un justificatif concernant votre inscription actuelle, vous avez la possibilité, en vous connectant sur votre espace personnel, à la rubrique « Mes allocations » puis « Mes attestations », d'éditer un « avis de situation ».\n\nCe document restitue votre situation vis-à-vis de votre inscription et renseigne sur l'état d'avancement de votre dossier ou la décision prise suite à votre inscription.","variables":[],"isOfficial":true},{"id":"bm-m051","title":"Trop-perçu — régularisation mars/avril avec recalcul","shortTitle":"Trop-perçu — régularisation mars/avril avec recalcul","category":"Trop-perçu","tags":["trop-perçu","régularisation","bulletin salaire"],"body":"Après consultation de votre compte, je vous informe que sur {{mois_1}} vous avez perçu {{montant}}€, et sur {{mois_2}} {{montant}}€, en fonction de vos déclarations mensuelles sur {{mois_1}} : {{montant}}€ et {{mois_2}} : {{montant}}€.\n\nOr, lors de la réception des justificatifs, le salaire brut de {{mois_1}} a été de {{montant}}€ et de {{mois_2}} {{montant}}€. Vous auriez donc dû percevoir sur {{mois_1}} {{montant}}€ au lieu de {{montant}}€ et sur {{mois_2}} {{montant}}€, soit un total sur les 2 mois de {{montant}}€.\n\nVotre trop-perçu passe donc de {{montant}}€ à {{montant}}€ suite à la régularisation de {{mois_1}}. Un versement de {{montant}}€ vous est reversé.\n\nVous pouvez régulariser votre trop-perçu depuis votre espace personnel, par virement ou en établissant un échéancier.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[{"key":"mois_1","label":"Mois 1","placeholder":"Mois 1","default":""},{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"mois_2","label":"Mois 2","placeholder":"Mois 2","default":""}],"isOfficial":true},{"id":"bm-m052","title":"Cumul ASS + activité non salariée (ACRE)","shortTitle":"Cumul ASS + activité non salariée (ACRE)","category":"ASS","tags":["ASS","ACRE","cumul","activité non salariée","URSSAF"],"body":"Concernant le cumul de l'ASS avec une activité non salariée, je vous informe que votre demande de versement ASS a été transmise au service prenant en charge la gestion de ce cumul.\n\nJe vous confirme que votre document d'attestation URSSAF a bien été réceptionné.\n\nPar ailleurs, je vous rappelle que le cumul ASS est limité à 12 mois, défalqué du cumul ARE + activité non salariée dont vous avez déjà bénéficié.\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-m053","title":"Droit d'option — reprise des droits et renvoi à la notification","shortTitle":"Droit d'option — reprise des droits et renvoi à la notification","category":"Droit d'option","tags":["droit d'option","reprise","apprentissage","professionnalisation"],"body":"Concernant vos droits aux allocations chômage, je vous informe que suite à une inscription, dès lors que vous disposez d'un reliquat de droits, celui-ci fait automatiquement l'objet d'une reprise de droits conformément à la réglementation de l'assurance chômage.\n\nNéanmoins, comme indiqué en page 9 de votre notification de reprise des droits, vous pouvez bénéficier du droit d'option sous conditions, pour vous permettre d'ouvrir de nouveaux droits sur vos activités reprises et terminées.\n\nExtrait de la notification (page 9) :\n\n  « Si votre droit actuel a été ouvert à la suite d'un contrat d'apprentissage ou de professionnalisation, vous bénéficiez d'un droit d'option. À chaque nouvelle fin de contrat de travail, si les conditions sont remplies, vous pouvez choisir entre continuer à percevoir vos allocations restantes ou bénéficier d'une nouvelle ouverture de droit tenant compte des périodes de travail effectuées postérieurement à votre contrat.\n\n  De même, si votre droit actuel satisfait aux conditions d'exercice du droit d'option, vous pouvez sur demande écrite choisir entre continuer à percevoir vos allocations restantes ou bénéficier d'une nouvelle ouverture de droit tenant compte de vos reprises d'activités.\n\n  Dans les deux cas, si vous choisissez le nouveau droit, l'option est irrévocable et entraîne la perte de votre ancien droit, y compris l'allongement acquis au titre des périodes de formation indemnisées dont peuvent bénéficier les demandeurs d'emploi âgés de 53 à 54 ans à la date de la fin du contrat de travail. »\n\nPour plus d'informations, vous pouvez prendre contact au 3949 (choix 4).\n\nMerci de votre compréhension.","variables":[],"isOfficial":true},{"id":"bm-m054","title":"Phrase de clôture standard (3949 choix 4)","shortTitle":"Phrase de clôture standard (3949 choix 4)","category":"Contact","tags":["clôture","signature","3949"],"body":"Si vous avez d'autres questions ou besoin de plus de détails, je vous invite à contacter France Travail au 3949 (choix 4) ; des conseillers indemnisation de votre agence sont à votre disposition.","variables":[],"isOfficial":true},{"id":"bm-m055","title":"Signature — Agence Rouen Saint Sever","shortTitle":"Signature — Agence Rouen Saint Sever","category":"Contact","tags":["signature","agence","Rouen"],"body":"Votre conseiller(ère) France Travail.\n\nAgence ROUEN SAINT SEVER\n26, place Gadeau de Kerville\nCS 81125\n76175 ROUEN CEDEX","variables":[],"isOfficial":true},{"id":"bm-m056","title":"Reprise d'activité — règle du cumul et simulation","shortTitle":"Reprise d'activité — règle du cumul et simulation","category":"Complément ARE","tags":["reprise activité","cumul","simulation","activité réduite"],"body":"Après consultation de votre dossier, je vous informe que votre allocation chômage est déclenchée en fonction de votre déclaration. Si vous travaillez, votre complément dépendra de votre salaire brut.\n\nComme indiqué sur votre notification d'admission, votre 1ᵉʳ versement vous sera versé si aucun événement n'est déclaré lors de l'actualisation ; le montant de votre 1ᵉʳ versement sera de {{montant}}€ pour le mois de {{mois}} et vous sera payé en {{mois}} après votre actualisation mensuelle, si aucun événement (formation, reprise d'emploi, maladie, retenues diverses…) ne vient modifier ce montant.\n\nSi vous reprenez une activité, les règles de l'activité réduite s'appliquent : cumul de l'ARE avec les rémunérations de l'activité professionnelle reprise.\n\nDans ce cas, 70 % de votre rémunération mensuelle d'activité reprise sont déduits du montant mensuel brut de votre allocation. Les conditions pour bénéficier de ce cumul sont les suivantes :\n  • vous devez rester inscrit(e) sur la liste des demandeurs d'emploi et déclarer mensuellement votre situation et les activités exercées dans la période ;\n  • le cumul du salaire issu de l'activité reprise et de l'allocation ne peut pas dépasser le salaire antérieur brut ayant servi au calcul de l'allocation.\n\nUn outil de simulation du complément de l'ARE est disponible sur votre espace personnel :\nhttps://candidat.pole-emploi.fr/simucalculreprise/\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).\n\nMerci de votre compréhension.","variables":[{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"mois","label":"MOIS","placeholder":"MOIS","default":""}],"isOfficial":true},{"id":"bm-m057","title":"Trop-perçu — appel manqué, deux dossiers distincts","shortTitle":"Trop-perçu — appel manqué, deux dossiers distincts","category":"Trop-perçu","tags":["trop-perçu","régularisation","intérim"],"body":"N'ayant pas pu vous joindre par téléphone ce jour, je reviens vers vous concernant les trop-perçus de {{montant}}€ et de {{montant}}€.\n\nJe vous confirme que le trop-perçu de {{montant}}€ est bien justifié : il a été déclenché suite à votre activité du mois de {{mois_annee}}, soit du {{date}} au {{date_2}} et du {{date_3}} au {{date_4}} avec {{employeur}}.\n\nEn revanche, le trop-perçu de {{montant}}€ a été régularisé : vous n'êtes plus redevable de cette somme, il a bien été annulé.\n\nPar ailleurs, un versement suite à la régularisation de votre dossier vous sera émis le {{date_5}} pour un montant de {{montant}}€.\n\nIl n'est pas nécessaire de prendre rendez-vous. Je vous invite fortement à appeler le 3949 ; des conseillers indemnisation sont à votre disposition du lundi au mercredi de 8 h 30 à 16 h 30, le jeudi de 8 h 30 à 12 h 30 et le vendredi de 8 h 30 à 15 h 30.\n\nMerci de votre compréhension.","variables":[{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"mois_annee","label":"Mois/année","placeholder":"Mois/année","default":""},{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"date_2","label":"DATE (2)","placeholder":"DATE (2)","default":""},{"key":"date_3","label":"DATE (3)","placeholder":"DATE (3)","default":""},{"key":"date_4","label":"DATE (4)","placeholder":"DATE (4)","default":""},{"key":"employeur","label":"Employeur","placeholder":"Employeur","default":""},{"key":"date_5","label":"DATE (5)","placeholder":"DATE (5)","default":""}],"isOfficial":true},{"id":"bm-m058","title":"Délai CP — règle du différé congés payés","shortTitle":"Délai CP — règle du différé congés payés","category":"Différé","tags":["congés payés","différé","30 jours max","ICCP"],"body":"Concernant le décalage sur les congés payés, je vous rappelle ici la règle sur le différé « congés payés » :\n\nSi vous avez des congés payés non pris à la fin de votre contrat de travail, vous recevrez une indemnité correspondante. Ce différé est calculé à partir du montant des indemnités compensatrices de congés payés versées à l'occasion de la fin de votre ou vos contrats de travail au cours des 6 mois précédant la date de la dernière fin de contrat de travail. Pour calculer le nombre de jours de décalage, on divise l'indemnité compensatrice de congés payés reçue dans les 6 derniers mois par le montant de votre salaire journalier.\n\nCe différé ne pourra pas dépasser 30 jours.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[],"isOfficial":true},{"id":"bm-m059","title":"Fin de droits ARE — ASS sous conditions","shortTitle":"Fin de droits ARE — ASS sous conditions","category":"ASS","tags":["fin droits","ASS","5 ans activité","1825 jours"],"body":"Vous souhaitez connaître la suite de votre dossier d'indemnisation après épuisement de vos droits.\n\nAprès consultation de votre dossier, votre reliquat de {{x}} sera épuisé au {{date}}. Par conséquent, votre dernière allocation vous sera versée début {{mois_annee}} après votre actualisation de {{mois_annee}}, si aucun événement ne vient interrompre le cours de votre reliquat.\n\nToute période travaillée avant l'épuisement de vos allocations allonge la durée de vos droits à l'assurance chômage, si la perte de cet emploi n'est pas volontaire. Pour cela, il faut avoir travaillé au moins 130 jours (182 jours calendaires ou 6 mois) ou 910 heures au titre d'une ou plusieurs activités après votre dernière fin de contrat qui a servi à ouvrir vos droits en cours. Si cela n'est pas le cas, vous serez notifié(e) d'un rejet pour absence de fin de contrat.\n\nRECHARGEMENT DES DROITS\nUne fois tous vos droits initiaux utilisés, et seulement à ce moment-là, un « rechargement » des droits acquis sera effectué. Ce rechargement vous ouvre de nouveaux droits, c'est-à-dire une allocation d'un nouveau montant pour une nouvelle durée, calculée sur la base des activités reprises et des périodes antérieures non utilisées.\n\nEn parallèle, vous recevrez une demande d'Allocation de Solidarité Spécifique (ASS) qui sera étudiée.\n\nAu terme de vos droits à l'ARE, une ASS peut être versée sous certaines conditions, notamment :\n  1. Justifier de 5 ans d'activité salariée (1 825 jours) dans les 10 ans qui précèdent la fin du contrat de travail ayant servi à l'ouverture de vos droits.\n  2. Ne pas disposer de ressources supérieures à 70 fois le montant de l'ASS pour une personne seule et 110 fois le même montant pour un couple.\n  3. La loi de finances 2017 stipule également que l'ASS ne peut pas être cumulée avec l'Allocation aux Adultes Handicapés (article L821-1 du Code de la sécurité sociale).\n\n⚠ Depuis le 1ᵉʳ octobre 2014, l'étude de votre dossier ASS est soumise à 2 conditions préalables :\n  • avoir épuisé intégralement le droit ARE en cours ;\n  • ne pas pouvoir bénéficier d'un rechargement de droits.\n\nPour plus d'informations, consultez www.francetravail.fr.","variables":[{"key":"x","label":"X","placeholder":"X","default":""},{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"mois_annee","label":"Mois/année","placeholder":"Mois/année","default":""}],"isOfficial":true},{"id":"bm-m060","title":"Reprise activité 91 jours — pas de fin de contrat","shortTitle":"Reprise activité 91 jours — pas de fin de contrat","category":"Rejet démission","tags":["démission","91 jours","65 jours","455 heures","fin contrat"],"body":"Concernant la reprise d'activité de 91 jours minimum après votre démission du {{date}}, je vous confirme effectivement qu'il faut justifier ensuite d'une période d'emploi d'au moins 65 jours travaillés ou 455 heures (soit 3 mois) ayant involontairement pris fin, ce qui correspond à 91 jours. Or, dans votre cas, vous n'avez pas de fin de contrat.\n\nSi vous avez terminé votre contrat commencé le {{date_2}}, vous devez transmettre par scan votre attestation employeur depuis votre espace personnel, afin que je puisse étudier vos droits.\n\nMerci de votre compréhension.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"date_2","label":"DATE (2)","placeholder":"DATE (2)","default":""}],"isOfficial":true},{"id":"bm-m061","title":"Reprise des droits — confirmation par téléphone","shortTitle":"Reprise des droits — confirmation par téléphone","category":"Reprise","tags":["reprise","téléphone","rejet","convenance financière"],"body":"Par téléphone au 3949 le {{date}}, vous avez été informé(e) de la confirmation de votre reprise des droits.\n\nLa réglementation de l'assurance chômage ne permet pas de qualifier une reprise des droits en rejet en fonction d'un faible taux d'allocation chômage, ni pour adapter la convenance financière d'un ménage.\n\nSelon l'historique de vos études de droits et vos courriers, il ne vous a jamais été remis de notification requalifiant une reprise en rejet pour les motifs décrits ci-dessus.\n\nMerci de votre compréhension.","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""}],"isOfficial":true},{"id":"bm-m062","title":"Bulletins intérim — transmission automatique Adecco","shortTitle":"Bulletins intérim — transmission automatique Adecco","category":"Documents","tags":["intérim","Adecco","bulletins","DSN"],"body":"Vous m'informez que vous avez téléchargé vos bulletins de salaire pour le complément de vos allocations chômage.\n\nAprès consultation du dossier, vous travaillez pour l'agence d'intérim {{employeur}}. Je vous informe que {{employeur}}, comme toutes les agences d'intérim, nous transmet vos missions d'intérim. Je vous confirme que j'ai vos missions jusqu'au {{date}}. Je suis en attente de votre mission de {{mois_annee}}, qui devrait remonter après le {{date_2}}.","variables":[{"key":"employeur","label":"Employeur","placeholder":"Employeur","default":""},{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"mois_annee","label":"Mois/année","placeholder":"Mois/année","default":""},{"key":"date_2","label":"DATE (2)","placeholder":"DATE (2)","default":""}],"isOfficial":true},{"id":"bm-m063","title":"Démission — orientation vers assistante sociale","shortTitle":"Démission — orientation vers assistante sociale","category":"Rejet démission","tags":["démission","aide sociale","4 mois","questionnaire"],"body":"J'accuse réception de votre mail concernant l'aide.\n\nAprès consultation de votre dossier, vous avez démissionné le {{date}}. Vous ne pouvez donc pas prétendre à une ouverture de droit selon la réglementation de l'assurance chômage pendant 4 mois.\n\nÀ défaut, si vous êtes toujours demandeur d'emploi le {{date_4_mois}}, vous pouvez à cette date demander un nouvel examen de votre dossier en retournant le questionnaire ci-joint (annexe 2), complété et signé.\n\nConcernant les aides, France Travail ne peut intervenir. Je vous conseille de prendre contact avec l'assistante sociale de votre secteur.\n\nMerci de votre compréhension.","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"date_4_mois","label":"Date + 4 mois","placeholder":"Date + 4 mois","default":""}],"isOfficial":true},{"id":"bm-m064","title":"Droit d'option — précisions sur la date de recalcul","shortTitle":"Droit d'option — précisions sur la date de recalcul","category":"Droit d'option","tags":["droit d'option","date fin contrat","attestation employeur"],"body":"Concernant votre demande de droit d'option, vous devez me préciser sur quelle date de fin de contrat vous souhaitez recalculer vos droits.\n\nÀ noter que si vous venez de terminer votre contrat de travail avec l'employeur {{employeur}}, vous devez télécharger depuis votre espace personnel votre attestation employeur.\n\nMerci de votre compréhension.\n\nPour plus d'informations, vous pouvez contacter le 3949 (choix 4).","variables":[{"key":"employeur","label":"Employeur","placeholder":"Employeur","default":""}],"isOfficial":true},{"id":"bm-m065","title":"Renouvellement ASS — courrier et versement","shortTitle":"Renouvellement ASS — courrier et versement","category":"ASS","tags":["ASS","renouvellement","versement","courrier"],"body":"Après consultation de votre dossier, je m'aperçois qu'un renvoi de renouvellement de l'Allocation de Solidarité Spécifique (ASS) a bien été effectué le {{date}}.\n\nJe vous invite à vous rendre dans votre espace personnel pour vérifier le courrier.\n\nJe vous suggère également de prendre contact au 3949 (choix 4) : un conseiller France Travail répondra à vos questions sur le renouvellement ASS.\n\nConcernant votre versement de {{x}} jours, je viens de débloquer la situation ; un versement de {{montant}}€ sera émis le {{date_2}}.\n\nMerci de votre compréhension.","variables":[{"key":"date","label":"DATE","placeholder":"DATE","default":""},{"key":"x","label":"X","placeholder":"X","default":""},{"key":"montant","label":"Montant","placeholder":"Montant","default":""},{"key":"date_2","label":"DATE (2)","placeholder":"DATE (2)","default":""}],"isOfficial":true},{"id":"bm-m066","title":"Création d'entreprise — PV rémunération Président","shortTitle":"Création d'entreprise — PV rémunération Président","category":"Créateurs d'entreprise","tags":["création entreprise","procès-verbal","président","ARCE 45%"],"body":"Suite au courrier du procès-verbal de votre activité non salariée statuant sur votre rémunération en tant que Président, téléchargé sur votre espace personnel, je constate que vous avez créé votre entreprise.\n\nÀ cet effet, afin de gérer la prise en compte de votre nouvelle activité non salariée et votre indemnisation chômage, je vous invite à compléter le formulaire ci-joint et à le retourner, par téléchargement depuis votre espace personnel, accompagné des justificatifs demandés selon l'option choisie.\n\nJe vous invite à prendre connaissance des informations suivantes concernant la gestion de votre activité non salariée.\n\nAu regard de l'assurance chômage, le demandeur d'emploi qui reprend une activité non salariée peut bénéficier :\n\n  • de l'Aide à la Reprise ou la Création d'Entreprise (ARCE). Cette aide est versée en deux fois et correspond à 45 % des allocations qui vous restent à la date où vous débutez votre activité ;\n  • ou des dispositions relatives au cumul de l'ARE avec les rémunérations procurées par l'activité non salariée (maintien partiel des allocations).\n\nPour plus d'informations, connectez-vous sur www.francetravail.fr :\n« Accueil France Travail > Candidat > Mon projet, ma recherche > Je crée mon entreprise > Mes aides financières > Les aides délivrées par France Travail »","variables":[],"isOfficial":true}];

    const DEMISSION_MOTIFS = [
      // --- FAMILIAL & PERSONNEL ---
      {
        id: "suivi_conjoint",
        title: "Démission : Suivi de conjoint (Mutation ou Emploi)",
        category: "Familial & Personnel",
        summary: "Démission pour suivre le conjoint qui change de lieu de résidence pour un motif professionnel (salarié ou non-salarié).",
        tag: "Dém. Légitime - Art. 1 § 1",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "heart-handshake",
        conditions: "Le conjoint (marié, pacsé ou concubin) doit être muté, embauché, reprendre une activité ou créer son entreprise, entraînant un déménagement incompatible avec l'emploi actuel (> 50 km ou > 1h30 de trajet simple).",
        justificatifs: [
          "Attestation de mutation ou contrat de travail du conjoint / Kbis",
          "Justificatifs de domicile de l'ancien et du nouveau lieu de résidence",
          "Copie du livret de famille, extrait d'acte de mariage, convention de PACS ou preuve de vie commune antérieure"
        ],
        delais: "Dans les 2 mois précédant ou suivant la prise de fonction du conjoint.",
        vigilance: "L'usager doit impérativement s'inscrire auprès de l'agence France Travail de son NOUVEAU domicile."
      },
      {
        id: "mariage_pacs",
        title: "Démission : Mariage ou PACS avec déménagement",
        category: "Familial & Personnel",
        summary: "Démission motivée par la célébration d'un mariage ou conclusion d'un PACS imposant un changement de résidence.",
        tag: "Dém. Légitime - Art. 1 § 2",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "award",
        conditions: "Le mariage ou le PACS entraîne une installation commune dans un nouveau lieu de résidence incompatible avec la poursuite de l'emploi.",
        justificatifs: [
          "Extrait d'acte de mariage ou attestation d'inscription de PACS au greffe",
          "Justificatifs des domiciles avant et après l'événement prouvant l'éloignement"
        ],
        delais: "Délai strict : moins de 2 mois entre la date de fin de contrat et la date de célébration du mariage ou signature du PACS.",
        vigilance: "La démission peut intervenir au maximum 2 mois avant ou 2 mois après l'union."
      },
      {
        id: "violences_conjugales",
        title: "Démission : Victime de violences conjugales",
        category: "Familial & Personnel",
        summary: "Démission contrainte par des violences exercées par le conjoint, partenaire ou concubin.",
        tag: "Dém. Légitime - Chap. 2 § 3",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        icon: "shield-alert",
        conditions: "Changement de lieu de résidence impératif pour échapper aux violences, rendant impossible la poursuite de l'activité.",
        justificatifs: [
          "Récépissé de dépôt de plainte auprès de la police/gendarmerie ou ordonnance de protection du JAF",
          "Justificatif du nouveau domicile"
        ],
        delais: "Aucun délai de forclusion opposable vu l'urgence et la gravité de la situation.",
        vigilance: "Dossier prioritaire. Confidentialité absolue des données et de la nouvelle adresse."
      },
      {
        id: "mineur_parents",
        title: "Démission : Salarié mineur suivant ses parents",
        category: "Familial & Personnel",
        summary: "Démission d'un jeune de moins de 18 ans pour suivre ses ascendants ou tuteurs légaux.",
        tag: "Dém. Légitime - Art. 1 § 3",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "users",
        conditions: "Le salarié âgé de moins de 18 ans rompt son contrat de travail pour suivre ses parents ou la personne exerçant l'autorité parentale qui déménagent.",
        justificatifs: [
          "Pièce d'identité du mineur",
          "Justificatif d'autorité parentale (livret de famille)",
          "Justificatif du déménagement des parents"
        ],
        delais: "Concomitant au déménagement de la famille.",
        vigilance: "Le motif du déménagement des parents importe peu (professionnel ou personnel)."
      },
      {
        id: "majeur_protege",
        title: "Démission : Majeur protégé suivant son tuteur",
        category: "Familial & Personnel",
        summary: "Salarié sous tutelle ou curatelle qui démissionne pour suivre son tuteur ou curateur.",
        tag: "Dém. Légitime - Art. 1 § 4",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "shield-check",
        conditions: "Le salarié placé sous tutelle, curatelle ou sauvegarde de justice suit son mandataire légal qui déménage.",
        justificatifs: [
          "Jugement du tribunal désignant le tuteur ou curateur",
          "Justificatif du nouveau domicile du mandataire et du majeur protégé"
        ],
        delais: "Concomitant au changement de domicile du tuteur.",
        vigilance: "Vérifier que le tuteur ou curateur a qualité légale reconnue par décision de justice."
      },
      {
        id: "enfant_handicape",
        title: "Démission : Enfant handicapé placé en structure éloignée",
        category: "Familial & Personnel",
        summary: "Démission du parent pour suivre son enfant handicapé admis dans une structure d'accueil éloignée.",
        tag: "Dém. Légitime - Art. 1 § 5",
        badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
        icon: "heart",
        conditions: "L'enfant est admis dans un établissement spécialisé dont l'éloignement impose un changement de résidence des parents incompatible avec l'emploi.",
        justificatifs: [
          "Attestation d'admission et de prise en charge par l'établissement d'accueil spécialisé",
          "Livret de famille et justificatif du nouveau domicile à proximité"
        ],
        delais: "Déménagement effectif lors de l'admission en structure.",
        vigilance: "L'incompatibilité géographique entre l'ancien travail et le nouveau lieu doit être caractérisée."
      },

      // --- LITIGES & DROIT DU TRAVAIL ---
      {
        id: "non_paiement_salaires",
        title: "Démission : Non-paiement des salaires par l'employeur",
        category: "Droit du travail & Litiges",
        summary: "Démission consécutive au défaut de paiement des salaires par l'employeur.",
        tag: "Dém. Légitime - Chap. 2 § 1",
        badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        icon: "alert-octagon",
        conditions: "L'employeur ne verse pas les salaires dus pour des périodes de travail accomplies.",
        justificatifs: [
          "Ordonnance de référé prud'homale condamnant l'employeur à verser les arriérés de salaire",
          "À défaut : mise en demeure d'avocat restée infructueuse + relevés de compte attestant l'absence de virement"
        ],
        delais: "Au moins 2 échéances impayées constatées.",
        vigilance: "Une simple contestation verbale ne suffit pas : exiger un titre exécutoire prud'homal ou une preuve juridique solide."
      },
      {
        id: "actes_delictueux",
        title: "Démission : Actes délictueux au travail (Harcèlement, Violences)",
        category: "Droit du travail & Litiges",
        summary: "Démission consécutive à des faits délictueux subis dans l'entreprise (violences, agression, harcèlement sexuel/moral).",
        tag: "Dém. Légitime - Chap. 2 § 2",
        badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        icon: "flame",
        conditions: "Le salarié a été victime sur son lieu de travail d'actes délictueux commis par son employeur ou des collègues.",
        justificatifs: [
          "Récépissé de dépôt de plainte auprès du Procureur de la République ou des services de police/gendarmerie",
          "Signalements à la médecine du travail ou inspection du travail le cas échéant"
        ],
        delais: "Plainte déposée concomitamment ou antérieurement à la démission.",
        vigilance: "La seule saisine des prud'hommes ne suffit pas : le dépôt de plainte pénale formel est la pièce opposable requise."
      },
      {
        id: "clause_conscience_journaliste",
        title: "Démission : Clause de conscience du journaliste",
        category: "Droit du travail & Litiges",
        summary: "Démission d'un journaliste professionnel en application de sa clause de cession ou de conscience (Art. L. 7112-5).",
        tag: "Dém. Légitime - Chap. 2 § 7",
        badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        icon: "newspaper",
        conditions: "Changement notable dans le caractère ou l'orientation du journal ou cession de l'entreprise créant une situation de nature à porter atteinte à son honneur ou réputation.",
        justificatifs: [
          "Reçu pour solde de tout compte et attestation employeur mentionnant le versement de l'indemnité de licenciement légale (Art. L. 7112-3)",
          "Carte de presse professionnelle"
        ],
        delais: "Dans le cadre des dispositions statutaires des journalistes.",
        vigilance: "L'indemnité légale de congédiement doit impérativement avoir été versée par l'employeur de presse."
      },
      {
        id: "contrat_couple_indivisible",
        title: "Démission : Contrat de travail de couple ou indivisible",
        category: "Droit du travail & Litiges",
        summary: "Démission consécutive au licenciement ou départ en retraite du conjoint titulaire du contrat indivisible.",
        tag: "Dém. Légitime - Chap. 2 § 6",
        badgeColor: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        icon: "link",
        conditions: "Le contrat de travail (ex: gardiens d'immeuble, concierges, gérants) comporte une clause de résiliation automatique ou indivisibilité, et le conjoint a été licencié, mis à la retraite ou a signé une rupture conventionnelle.",
        justificatifs: [
          "Contrat de travail initial prévoyant la clause de couple/indivisibilité",
          "Attestation employeur de l'autre conjoint justifiant de la perte involontaire d'emploi"
        ],
        delais: "Rupture simultanée des deux membres du couple.",
        vigilance: "Vérifier que l'autre conjoint n'a pas lui-même démissionné volontairement."
      },

      // --- PROFESSIONNEL, FORMATION & CRÉATION ---
      {
        id: "reconversion_transitions_pro",
        title: "Démission : Reconversion professionnelle (Transitions Pro)",
        category: "Professionnel & Création",
        summary: "Projet de reconversion réel et sérieux validé par la commission Transitions Pro en amont de la démission.",
        tag: "Dém. Légitime - Art. L. 5422-1-2",
        badgeColor: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
        icon: "compass",
        conditions: "Justifier d'au moins 5 ans d'activité salariée continue (1 300 jours travaillés) dans les 60 mois précédents ET avoir obtenu l'attestation de caractère réel et sérieux de la commission Transitions Pro AVANT la date de démission.",
        justificatifs: [
          "Attestation d'éligibilité délivrée par Transitions Pro (valable 6 mois)",
          "Plan d'action du Conseil en Évolution Professionnelle (CEP) élaboré avant la démission"
        ],
        delais: "Inscription à France Travail obligatoire dans les 6 mois suivant la délivrance de l'attestation Transitions Pro.",
        vigilance: "Toute démission notifiée AVANT la délivrance de l'attestation entraîne le refus irréversible d'ouverture de droit."
      },
      {
        id: "contrat_insertion_cui",
        title: "Démission : Contrat d'insertion (CUI-CIE, CAE) pour un CDI ou formation",
        category: "Professionnel & Création",
        summary: "Rupture d'un contrat d'insertion pour exercer un emploi d'au moins 6 mois ou suivre une formation certifiante.",
        tag: "Dém. Légitime - Chap. 1 § 2",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "briefcase",
        conditions: "Rupture d'un CUI-CIE, CUI-CAE ou contrat d'insertion par l'activité pour reprendre un CDI, un CDD d'au moins 6 mois ou suivre une formation qualifiante.",
        justificatifs: [
          "Contrat de travail initial d'insertion (CUI-CAE, etc.)",
          "Nouveau contrat de travail $\ge 6$ mois ou convention de formation validée"
        ],
        delais: "Rupture directe en vue de la prise de poste ou début de formation.",
        vigilance: "Le nouvel emploi doit présenter une durée minimale de 6 mois ou être en CDI."
      },
      {
        id: "service_civique_volontariat",
        title: "Démission : Mission d'intérêt général (Service Civique, Volontariat)",
        category: "Professionnel & Création",
        summary: "Démission pour accomplir une mission de service civique, volontariat de solidarité internationale ou associatif d'au moins 1 an.",
        tag: "Dém. Légitime - Chap. 1 § 3",
        badgeColor: "bg-teal-500/10 text-teal-300 border-teal-500/20",
        icon: "globe",
        conditions: "Le salarié quitte son poste pour conclure un contrat de service civique, de volontariat de solidarité internationale ou de volontariat associatif pour une durée minimale d'un an.",
        justificatifs: [
          "Contrat de service civique ou d'engagement de volontariat",
          "Attestation de fin de mission ou rupture anticipée involontaire"
        ],
        delais: "Prise d'effet à l'issue de la mission de volontariat.",
        vigilance: "L'ouverture de droit s'opère au terme de la mission de volontariat (ou en cas d'interruption non fautive de celle-ci)."
      },
      {
        id: "echec_creation_entreprise",
        title: "Démission : Reprise/Création d'entreprise suivie d'un arrêt involontaire",
        category: "Professionnel & Création",
        summary: "Démission pour créer une entreprise dont l'activité cesse ultérieurement pour des raisons indépendantes de la volonté.",
        tag: "Dém. Légitime - Chap. 1 § 4",
        badgeColor: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
        icon: "building-2",
        conditions: "Le salarié a démissionné pour créer ou reprendre une entreprise immatriculée, qui a ensuite cessé son activité pour raisons économiques ou liquidation judiciaire dans un délai de 36 mois.",
        justificatifs: [
          "Extrait Kbis d'immatriculation et extrait de radiation ou jugement de liquidation judiciaire",
          "Justificatifs des démarches de création engagées immédiatement après la démission"
        ],
        delais: "Cessation intervenue dans les 36 mois de la fin de contrat salarié.",
        vigilance: "La cessation ne doit pas être volontaire ou de simple convenance personnelle."
      },
      {
        id: "assistant_maternel_vaccin",
        title: "Démission : Assistant(e) maternel(le) refus de vaccination",
        category: "Professionnel & Création",
        summary: "Démission consécutive au refus des parents employeurs de faire vacciner l'enfant selon les obligations légales.",
        tag: "Dém. Légitime - Circulaire Unédic",
        badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        icon: "shield-alert",
        conditions: "L'assistant maternel rompt le contrat car les parents refusent de faire procéder aux vaccinations obligatoires (Art. L. 3111-2 du Code de la santé publique).",
        justificatifs: [
          "Copie du carnet de vaccination non à jour",
          "Courrier recommandé des parents confirmant leur refus ou mise en demeure restée vaine"
        ],
        delais: "Dès constatation du refus caractérisé de vaccination obligatoire.",
        vigilance: "Ne s'applique qu'aux vaccinations rendues légalement obligatoires par la loi."
      },

      // --- VOIES DE RATTRAPAGE APRÈS DÉMISSION STANDARD ---
      {
        id: "rattrapage_65j",
        title: "Voie de rattrapage : 65 jours (ou 455 h) retravaillés",
        category: "Voies de Rattrapage",
        summary: "Avoir retravaillé au moins 65 jours ouvrés ou 455 heures depuis la démission sans nouvelle rupture volontaire.",
        tag: "Rattrapage Légal - Art. 26",
        badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        icon: "check-circle-2",
        conditions: "Après une démission ordinaire, le salarié cumule au moins 65 jours ouvrés (ou 455 heures) d'activité salariée continue ou discontinue, s'achevant par une perte involontaire d'emploi (fin de CDD, mission intérim, rupture conventionnelle, licenciement, ou rupture d'essai par l'employeur).",
        justificatifs: [
          "Attestations employeurs des contrats postérieurs cumulant les 65 jours ou 455 heures",
          "Reçu pour solde de tout compte du dernier contrat confirmant la fin involontaire"
        ],
        delais: "Période accomplie dans le cadre des 24 ou 36 mois de la PRA.",
        vigilance: "ATTENTION : La moindre démission ultérieure, même sur une seule journée de travail, annule immédiatement tout le compteur des 65 jours !"
      },
      {
        id: "reexamen_ipr_122j",
        title: "Voie de recours : Réexamen IPR au 122e jour calendaire",
        category: "Voies de Rattrapage",
        summary: "Demande d'attribution de l'ARE auprès de l'Instance Paritaire Régionale après 121 jours de chômage sans allocation.",
        tag: "Recours IPR - Art. 27",
        badgeColor: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        icon: "scale",
        conditions: "Délai de carence de 121 jours calendaires écoulé depuis la démission initiale + justification d'une recherche active, réelle et soutenue d'emploi pendant cette période (candidatures, entretiens, formations suivies, immersions PMSMP).",
        justificatifs: [
          "Dossier officiel de saisine de l'IPR complété",
          "Relevé détaillé des candidatures, lettres de refus d'employeurs, conventions de stages ou attestations de formation"
        ],
        delais: "Dépôt recevable à compter du 122e jour suivant la fin du contrat démissionné.",
        vigilance: "L'ouverture éventuelle de l'ARE prend effet au 122e jour : il n'y a AUCUN rappel d'allocation rétroactif sur les 4 premiers mois."
      },
      {
        id: "clause_sauvegarde_65j",
        title: "Clause de sauvegarde : Démission dans les 65 jours d'un emploi repris",
        category: "Voies de Rattrapage",
        summary: "Démission d'un emploi n'ayant pas duré plus de 65 jours après un licenciement, fin de CDD ou rupture conventionnelle.",
        tag: "Sauvegarde - Chap. 2 § 4",
        badgeColor: "bg-blue-500/10 text-cyan-300 border-cyan-500/20",
        icon: "shield",
        conditions: "Postérieurement à une perte involontaire d'emploi (licenciement, rupture conventionnelle, fin de CDD) n'ayant pas donné lieu à une inscription préalable comme demandeur d'emploi, le salarié entreprend un emploi auquel il met fin volontairement dans un délai n'excédant pas 65 jours travaillés (ou 455 heures).",
        justificatifs: [
          "Attestation employeur de l'avant-dernier emploi (justifiant du licenciement ou rupture involontaire)",
          "Attestation employeur du dernier emploi démissionné (durée $\le 65$ jours)",
          "Absence d'inscription entre les deux contrats"
        ],
        delais: "Rupture intervenue avant le 66e jour travaillé.",
        vigilance: "La démission est neutralisée et le droit s'ouvre sur la base de la rupture involontaire précédente."
      },
      {
        id: "clause_sauvegarde_3ans",
        title: "Clause de sauvegarde : Démission après 3 ans d'affiliation continue",
        category: "Voies de Rattrapage",
        summary: "Démission d'un emploi après 3 ans d'activité continue pour un CDI rompu par le nouvel employeur avant 65 jours.",
        tag: "Sauvegarde - Chap. 2 § 5",
        badgeColor: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        icon: "history",
        conditions: "Le salarié justifie de 3 années d'affiliation continue au régime chômage, quitte volontairement son emploi pour un nouveau CDI, et ce nouvel employeur met fin à la période d'essai avant l'expiration d'un délai de 65 jours travaillés.",
        justificatifs: [
          "Bulletins de paie ou attestations justifiant de 3 années sans interruption d'emploi",
          "Lettre de rupture de la période d'essai émanant impérativement de l'employeur"
        ],
        delais: "Rupture de la période d'essai avant le 65e jour travaillé.",
        vigilance: "La rupture de l'essai doit impérativement être à l'initiative de l'employeur, et non du salarié."
      },

      // --- TOUS LES TYPES DE LICENCIEMENTS ---
      {
        id: "licenciement_eco",
        title: "Licenciement : Motif Économique (Individuel ou Collectif)",
        category: "Licenciements & Ruptures",
        summary: "Suppression ou transformation d'emploi résultant de difficultés économiques ou mutations technologiques.",
        tag: "Perte Involontaire - Art. 2",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "trending-down",
        conditions: "Rupture du contrat non inhérente à la personne du salarié. L'employeur doit proposer le CSP (< 1 000 salariés) ou le congé de reclassement ($\ge 1 000$ salariés).",
        justificatifs: [
          "Attestation employeur mentionnant le licenciement économique",
          "Notification de licenciement économique ou bulletin d'adhésion au CSP"
        ],
        delais: "Inscription immédiate au terme du préavis (ou dès le lendemain de rupture si CSP).",
        vigilance: "Si CSP accepté : versement de l'ASP à 75% du brut sans délai d'attente ni différé CP si $\ge 1$ an d'ancienneté."
      },
      {
        id: "licenciement_personnel_simple",
        title: "Licenciement : Motif Personnel (Hors faute)",
        category: "Licenciements & Ruptures",
        summary: "Licenciement pour insuffisance professionnelle, résultats insuffisants ou mésentente.",
        tag: "Perte Involontaire - Art. 2",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "user-x",
        conditions: "Rupture à l'initiative de l'employeur reposant sur une cause réelle et sérieuse liée à la personne du salarié, sans qualification de faute.",
        justificatifs: [
          "Attestation employeur France Travail",
          "Lettre de notification de licenciement",
          "Certificat de travail et reçu pour solde de tout compte"
        ],
        delais: "Inscription possible dès la notification ou au terme du préavis effectué.",
        vigilance: "Ouvre droit à l'indemnité légale de licenciement, au préavis payé et à l'indemnisation chômage de droit commun (ARE)."
      },
      {
        id: "licenciement_inaptitude",
        title: "Licenciement : Inaptitude Médicale (Pro ou non-professionnelle)",
        category: "Licenciements & Ruptures",
        summary: "Licenciement consécutif à l'inaptitude physique constatée par le médecin du travail et impossibilité de reclassement.",
        tag: "Perte Involontaire - Art. 2",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "activity",
        conditions: "Constat d'inaptitude médicale par le médecin du travail et absence de possibilité de reclassement dans l'entreprise.",
        justificatifs: [
          "Avis d'inaptitude établi par la médecine du travail",
          "Attestation employeur mentionnant le licenciement pour inaptitude",
          "Notification de licenciement"
        ],
        delais: "Inscription dès la fin du contrat.",
        vigilance: "Le demandeur d'emploi doit se déclarer apte au travail lors de son inscription France Travail pour percevoir l'ARE (apte à exercer un autre métier compatible avec ses restrictions)."
      },
      {
        id: "licenciement_faute_simple_grave_lourde",
        title: "Licenciement : Faute Simple, Grave ou Lourde",
        category: "Licenciements & Ruptures",
        summary: "Licenciement disciplinaire pour manquement aux obligations professionnelles (quel que soit le degré de faute).",
        tag: "Droit ARE Intact - Unédic",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "shield-alert",
        conditions: "Rupture disciplinaire à l'initiative exclusive de l'employeur. RÈGLE MAJEURE : En droit de l'assurance chômage, la qualification de faute (même grave ou lourde) NE PRIVE EN AUCUN CAS le salarié de ses droits à l'ARE.",
        justificatifs: [
          "Attestation employeur mentionnant le licenciement disciplinaire (faute)",
          "Lettre de notification de licenciement",
          "Bulletins de paie des 24 ou 36 derniers mois"
        ],
        delais: "Prise en charge au terme des différés légaux habituels (7 jours d'attente + différé congés payés).",
        vigilance: "Rassurer fermement le demandeur d'emploi : aucune pénalité, déchéance ou réduction de droits ARE n'est appliquée en cas de faute grave ou lourde."
      },
      {
        id: "licenciement_refus_modification",
        title: "Licenciement : Refus d'une modification du contrat de travail",
        category: "Licenciements & Ruptures",
        summary: "Licenciement suite au refus par le salarié d'une modification substantielle de son contrat proposée par l'employeur.",
        tag: "Perte Involontaire - Art. 2",
        badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: "file-minus",
        conditions: "L'employeur propose une modification d'un élément essentiel du contrat (rémunération, temps de travail, mobilité géographique non contractuelle) refusée légitimement par le salarié.",
        justificatifs: [
          "Courrier de notification de licenciement",
          "Attestation employeur France Travail"
        ],
        delais: "Inscription dès le terme du contrat.",
        vigilance: "Le refus d'une modification contractuelle n'est pas une démission : c'est un licenciement ouvrant intégralement droit à l'ARE."
      }
    ];

    const DEFAULT_CATEGORIES = [{"name":"Poursuite indemnisation (DC)","icon":"shield-check","color":"bg-emerald-500/10 text-emerald-400"},{"name":"Divers","icon":"folder-open","color":"bg-blue-500/10 text-blue-400"},{"name":"Rejet démission","icon":"ban","color":"bg-rose-500/10 text-rose-400"},{"name":"Complément ARE","icon":"coins","color":"bg-amber-500/10 text-amber-400"},{"name":"Créateurs d'entreprise","icon":"building-2","color":"bg-indigo-500/10 text-indigo-400"},{"name":"CAF / RSA","icon":"landmark","color":"bg-teal-500/10 text-teal-400"},{"name":"Droit d'option","icon":"shuffle","color":"bg-blue-500/10 text-blue-400"},{"name":"Reprise","icon":"briefcase","color":"bg-emerald-500/10 text-emerald-400"},{"name":"Formation","icon":"graduation-cap","color":"bg-indigo-500/10 text-indigo-400"},{"name":"Actualisation","icon":"calendar-check","color":"bg-cyan-500/10 text-cyan-400"},{"name":"Trop-perçu","icon":"alert-triangle","color":"bg-amber-500/10 text-amber-400"},{"name":"Reprise & droit d'option","icon":"repeat","color":"bg-blue-500/10 text-blue-400"},{"name":"Admission","icon":"badge-check","color":"bg-emerald-500/10 text-emerald-400"},{"name":"ANS","icon":"rocket","color":"bg-indigo-500/10 text-indigo-400"},{"name":"Modification AE","icon":"user-cog","color":"bg-indigo-500/10 text-indigo-400"},{"name":"DPAE","icon":"file-signature","color":"bg-emerald-500/10 text-emerald-400"},{"name":"Démission","icon":"door-open","color":"bg-purple-500/10 text-purple-400"},{"name":"Contact","icon":"phone","color":"bg-cyan-500/10 text-cyan-400"},{"name":"IPR DV 121 jours","icon":"scale","color":"bg-purple-500/10 text-purple-400"},{"name":"CRE","icon":"building","color":"bg-indigo-500/10 text-indigo-400"},{"name":"Fin de droit SAE","icon":"hourglass","color":"bg-rose-500/10 text-rose-400"},{"name":"ASS","icon":"handshake","color":"bg-teal-500/10 text-teal-400"},{"name":"Rechargement","icon":"battery-charging","color":"bg-emerald-500/10 text-emerald-400"},{"name":"Différé","icon":"timer","color":"bg-amber-500/10 text-amber-400"},{"name":"Affiliation","icon":"link","color":"bg-blue-500/10 text-blue-400"},{"name":"Recours IPR","icon":"gavel","color":"bg-purple-500/10 text-purple-400"},{"name":"Documents","icon":"file-text","color":"bg-cyan-500/10 text-cyan-400"},{"name":"Calcul ARE","icon":"calculator","color":"bg-amber-500/10 text-amber-400"}];
    const DEFAULT_FAVORITES = ["bm-umtmwnft7igh8","bm-umsyaewpc5zwz","bm-umrvvfbblich7","bm-umrnc12hmkdmy","bm-m004"];

    let templates = [];
    let activeTemplateId = null;
    let currentCategory = 'all';
    let searchQuery = '';
    let userVariables = {};
    let favorites = [];
    let sortMode = 'default';
    let catSortMode = 'default';
    let isSidebarCollapsed = false;
    let sidebarWidth = 200;
    let categoryList = [];
    let activeNavTab = 'home';
    let isBurgerMenuOpen = false;
    let demissionCategoryFilter = 'all';
    let activeDemissionId = 'suivi_conjoint';
    let simUnit = 'days';

    const NAV_TABS_CONFIG = [
      { id: 'home', name: 'Accueil', desc: 'Vue d\'ensemble des outils', icon: 'home', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', badge: 'Portail' },
      { id: 'cvm', name: 'CVM Direct', desc: 'Messagerie, modèles et variables dynamiques', icon: 'mail', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', get badge() { return templates.length + ' modèles'; } },
      { id: 1, name: 'Conditions OD', desc: "Simulateur 6 conditions & calcul d'ARE", icon: 'clipboard-check', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', badge: '6 conditions' },
      { id: 2, name: 'Démission', desc: '18 motifs légitimes & 3 voies post-démission', icon: 'scale', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', badge: '18 motifs' },
      { id: 3, name: 'ANS', desc: 'Création : ARCE 60% vs maintien mensuel', icon: 'calculator', color: 'bg-teal-500/15 text-teal-400 border-teal-500/30', badge: 'ARCE / Maintien' },
      { id: 4, name: 'CSP', desc: 'ASP à 75%, 21 jours & reclassement (IDR/Prime)', icon: 'shield', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', badge: 'ASP & IDR' },
      { id: 5, name: 'Complément ARE', desc: 'Règle des 70% et report de jours de droit', icon: 'trending-up', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', badge: 'Règle 70%' },
      { id: 6, name: 'Trop-perçu', desc: 'Échéancier, prescription, délais et recours, mail type', icon: 'receipt', color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', badge: 'Échéancier' },
      { id: 7, name: 'ICCP', desc: 'Différé congés payés & attestation CIBTP BTP', icon: 'calendar-clock', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', badge: 'Formule BTP' },
      { id: 8, name: 'Retraite', desc: 'Maintien de droit Art. 9 § 3 & taux plein', icon: 'landmark', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', badge: 'Art. 9 § 3' },
      { id: 9, name: 'RCI', desc: 'Rupture conventionnelle 2026 : plafond 15/20,5m', icon: 'handshake', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', badge: 'Réforme 2026' }
      ,{ id: 'cfd', name: 'CFD', desc: 'Complément de fin de droits · coefficient 0,75', icon: 'hourglass', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', badge: 'Coef. 0,75' }
      ,{ id: 'dossier', name: 'Parcours dossier', desc: 'Questions guidées : droits, durée, différés, premier jour et texte du mail', icon: 'list-checks', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', badge: 'Guidé' }
      ,{ id: 'delais', name: 'Délais', desc: 'Différés, premier jour indemnisable, forclusion', icon: 'calendar-days', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30', badge: 'Échéances' }
      ,{ id: 'bareme', name: 'Barèmes', desc: 'Montants, taux et durées en vigueur, avec sources', icon: 'book-open-check', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', badge: 'Unédic 2026' }
    ];

    let modelIdToDelete = null;
    let categoryNameToDelete = null;

    function saveState() {
      try {
        safeLS.setItem('ft_templates', JSON.stringify(templates));
        safeLS.setItem('ft_favorites', JSON.stringify(favorites));
        safeLS.setItem('ft_user_vars', JSON.stringify(userVariables));
        safeLS.setItem('ft_categories_list', JSON.stringify(categoryList));
        safeLS.setItem('ft_sidebar_collapsed', JSON.stringify(isSidebarCollapsed));
        safeLS.setItem('ft_sidebar_width', sidebarWidth.toString());
        safeLS.setItem('ft_active_nav_tab', activeNavTab.toString());
        safeLS.setItem('ft_sort_mode', sortMode);
        safeLS.setItem('ft_cat_sort_mode', catSortMode);
      } catch (err) {
        console.warn("Erreur sauvegarde locale:", err);
      }
    }

    function loadState() {
      try {
        const savedTemplates = safeLS.getItem('ft_templates');
        if (savedTemplates) {
          templates = JSON.parse(savedTemplates);
        } else {
          const savedCustom = safeLS.getItem('ft_custom_templates');
          const customTemplates = savedCustom ? JSON.parse(savedCustom) : [];
          templates = [...OFFICIAL_TEMPLATES, ...customTemplates];
        }

        const savedFavs = safeLS.getItem('ft_favorites');
        favorites = savedFavs ? JSON.parse(savedFavs) : [...DEFAULT_FAVORITES];

        const savedVars = safeLS.getItem('ft_user_vars');
        userVariables = savedVars ? JSON.parse(savedVars) : {};

        const savedCats = safeLS.getItem('ft_categories_list');
        categoryList = savedCats ? JSON.parse(savedCats) : [...DEFAULT_CATEGORIES];

        const savedSort = safeLS.getItem('ft_sort_mode');
        if (['default', 'az', 'za'].includes(savedSort)) sortMode = savedSort;

        const savedCatSort = safeLS.getItem('ft_cat_sort_mode');
        if (['default', 'az', 'za', 'count'].includes(savedCatSort)) catSortMode = savedCatSort;

        const savedTab = safeLS.getItem('ft_active_nav_tab');
        if (savedTab) {
          activeNavTab = (/^(cvm|home|cfd|dossier|delais|bareme|droits|jour|glossaire|cns|sources|sjr|schemas)$/.test(savedTab)) ? savedTab : parseInt(savedTab, 10);
        }

        const savedCollapsed = safeLS.getItem('ft_sidebar_collapsed');
        if (savedCollapsed !== null) isSidebarCollapsed = JSON.parse(savedCollapsed);

        const savedWidth = safeLS.getItem('ft_sidebar_width');
        if (savedWidth) sidebarWidth = Math.max(160, Math.min(360, parseInt(savedWidth, 10)));
      } catch (err) {
        templates = [...OFFICIAL_TEMPLATES];
        categoryList = [...DEFAULT_CATEGORIES];
      }
    }

    function renderCategoryPills() {
      const container = document.getElementById('vertical-filters-container');
      if (!container) return;

      const totalCount = templates.length;
      const favCount = templates.filter(t => favorites.includes(t.id)).length;

      // Update badge in top header
      const modelCountBadge = document.getElementById('model-count-badge');
      if (modelCountBadge) {
        modelCountBadge.textContent = `${totalCount} modèles prêts`;
      }

      // Count templates per category
      const counts = {};
      templates.forEach(t => {
        counts[t.category] = (counts[t.category] || 0) + 1;
      });

      const isAllActive = currentCategory === 'all';
      const sm = CAT_SORT_MODES[catSortMode] || CAT_SORT_MODES.default;
      const isFavActive = currentCategory === 'favorites';

      let html = `
        <!-- Tous les modèles -->
        <button onclick="selectCategory('all')" class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group ${
          isAllActive 
            ? 'bg-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
        }">
          <div class="flex items-center gap-2 min-w-0">
            <i data-lucide="layers" class="w-3.5 h-3.5 ${isAllActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'} shrink-0"></i>
            <span class="sidebar-label truncate ${isSidebarCollapsed ? 'hidden' : ''}">Tous les modèles</span>
          </div>
          <span class="sidebar-label font-mono text-[10px] px-1.5 py-0.2 rounded ${
            isAllActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
          } ${isSidebarCollapsed ? 'hidden' : ''}">${totalCount}</span>
        </button>

        <!-- Favoris -->
        <button onclick="selectCategory('favorites')" class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all group ${
          isFavActive 
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
        }">
          <div class="flex items-center gap-2 min-w-0">
            <i data-lucide="star" class="w-3.5 h-3.5 ${isFavActive ? 'text-amber-400 fill-amber-400' : 'text-amber-400/80 group-hover:text-amber-300'} shrink-0"></i>
            <span class="sidebar-label truncate ${isSidebarCollapsed ? 'hidden' : ''}">Favoris</span>
          </div>
          <span class="sidebar-label font-mono text-[10px] px-1.5 py-0.2 rounded ${
            isFavActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
          } ${isSidebarCollapsed ? 'hidden' : ''}">${favCount}</span>
        </button>

        <!-- Séparateur Dossiers + tri -->
        <div class="pt-2 pb-1 px-1 flex items-center justify-between gap-1 ${isSidebarCollapsed ? 'hidden' : ''}">
          <span class="sidebar-label text-[10px] font-bold text-slate-400 uppercase tracking-wider">Catégories</span>
          <div class="flex items-center gap-1 shrink-0">
            <button type="button" onclick="cycleCatSort()" data-active="${catSortMode !== 'default'}" class="cat-sort-btn" title="Trier les catégories (tri actuel : ${sm.label}). Cliquer pour changer" aria-label="Trier les catégories, tri actuel : ${sm.label}">
              <i data-lucide="${sm.icon}" class="w-3 h-3"></i><span>${sm.short}</span>
            </button>
            <button onclick="openModal('new-category-modal')" class="p-0.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors" title="Ajouter une catégorie">
              <i data-lucide="plus" class="w-3 h-3"></i>
            </button>
          </div>
        </div>
      `;

      sortedCategories(counts).forEach(cat => {
        const isActive = currentCategory === cat.name;
        const count = counts[cat.name] || 0;
        const st = catStyle(cat.name);
        const iconName = st.icon;
        const hue = st.hue;
        const escapedCatName = escapeHtml(cat.name);
        const jsCatName = attrJs(cat.name);

        html += `
          <div class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all group ${
            isActive 
              ? `bg-${hue}-500/15 text-${hue}-300 border border-${hue}-500/30 shadow-sm` 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }">
            <button onclick="selectCategory('${jsCatName}')" class="flex-1 flex items-center gap-2 min-w-0 text-left">
              <span class="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-${hue}-500/15 text-${hue}-400 ${isActive ? `ring-1 ring-${hue}-500/40` : ''}"><i data-lucide="${iconName}" class="w-3.5 h-3.5"></i></span>
              <span class="sidebar-label truncate ${isSidebarCollapsed ? 'hidden' : ''}">${escapedCatName}</span>
            </button>
            <div class="flex items-center gap-1 shrink-0 ${isSidebarCollapsed ? 'hidden' : ''}">
              <button onclick="openEditCategoryModal('${jsCatName}', event)" class="p-0.5 text-slate-400 hover:text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity" title="Modifier la catégorie">
                <i data-lucide="pencil" class="w-2.5 h-2.5"></i>
              </button>
              <button onclick="promptDeleteCategory('${jsCatName}', event)" class="p-0.5 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer la catégorie">
                <i data-lucide="trash-2" class="w-2.5 h-2.5"></i>
              </button>
              <span class="sidebar-label font-mono text-[10px] px-1.5 py-0.2 rounded ${
                isActive ? `bg-${hue}-500/20 text-${hue}-300` : `bg-${hue}-500/10 text-${hue}-400`
              }">${count}</span>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
      populateCategorySelect();
      refreshIcons();
    }

    function toggleBurgerMenu(forceState) {
      const drawer = document.getElementById('burger-nav-drawer');
      const backdrop = document.getElementById('burger-backdrop');
      const burgerIcon = document.getElementById('burger-icon');

      isBurgerMenuOpen = typeof forceState === 'boolean' ? forceState : !isBurgerMenuOpen;

      if (drawer && backdrop) {
        if (isBurgerMenuOpen) {
          drawer.classList.remove('-translate-x-full');
          drawer.classList.add('translate-x-0');
          backdrop.classList.remove('hidden');
          if (burgerIcon) burgerIcon.setAttribute('data-lucide', 'x');
        } else {
          drawer.classList.add('-translate-x-full');
          drawer.classList.remove('translate-x-0');
          backdrop.classList.add('hidden');
          if (burgerIcon) burgerIcon.setAttribute('data-lucide', 'menu');
        }
      }
      refreshIcons();
    }

    function renderBurgerTabs() {
      const container = document.getElementById('burger-tabs-list');
      if (!container) return;

      container.innerHTML = NAV_TABS_CONFIG.map(tab => {
        const isActive = activeNavTab.toString() === tab.id.toString();
        const activeContainerClass = "bg-gradient-to-r from-blue-900/60 to-cyan-950/60 border-cyan-500/50 shadow-md shadow-cyan-950/40";
        const inactiveContainerClass = "bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700/80";

        return `
          <button onclick="switchNavTab('${tab.id}')" class="w-full p-2.5 rounded-xl border text-left flex items-center justify-between gap-3 transition-all group ${
            isActive ? activeContainerClass : inactiveContainerClass
          }">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                isActive ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50' : tab.color
              }">
                <i data-lucide="${tab.icon}" class="w-4 h-4"></i>
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}">${tab.name}</span>
                  ${isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>' : ''}
                </div>
                <p class="text-[10px] text-slate-400 truncate mt-0.5 leading-tight">${tab.desc}</p>
              </div>
            </div>
            <div class="shrink-0 text-right">
              <span class="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700/60'
              }">
                ${tab.badge}
              </span>
            </div>
          </button>
        `;
      }).join('');

      refreshIcons();
    }

    function switchNavTab(tabId) {
      activeNavTab = tabId;
      saveState();

      // Close the burger drawer when a tab is selected
      toggleBurgerMenu(false);

      const views = {
        home: document.getElementById('view-home'),
        cfd: document.getElementById('view-cfd'),
        cvm: document.getElementById('view-cvm'),
        1: document.getElementById('view-od'),
        2: document.getElementById('view-demission'),
        3: document.getElementById('view-ans'),
        4: document.getElementById('view-csp'),
        5: document.getElementById('view-complement-are'),
        6: document.getElementById('view-indus'),
        7: document.getElementById('view-iccp'),
        8: document.getElementById('view-retraite'),
        9: document.getElementById('view-rci'),
        dossier: document.getElementById('view-dossier'),
        bareme: document.getElementById('view-bareme'),
        delais: document.getElementById('view-delais')
      };

      Object.keys(views).forEach(key => {
        if (views[key]) {
          views[key].classList.toggle('hidden', key !== tabId.toString());
        }
      });

      // Show/hide CVM sidebar toggle button depending on active tab
      const toggleBtn = document.getElementById('toggle-sidebar-btn');
      if (toggleBtn) toggleBtn.classList.toggle('invisible', tabId !== 'cvm');

      closeSuggest();
      const homeBtn = document.getElementById('home-btn');
      if (homeBtn) {
        const onHome = String(tabId) === 'home';
        homeBtn.classList.toggle('is-current', onHome);
        if (onHome) homeBtn.setAttribute('aria-current', 'page'); else homeBtn.removeAttribute('aria-current');
      }

      // Update Header Indicator
      const currentTab = NAV_TABS_CONFIG.find(t => t.id.toString() === tabId.toString()) || NAV_TABS_CONFIG[0];
      const headerName = document.getElementById('header-active-tab-name');
      if (headerName) headerName.textContent = currentTab.name;

      // Initialize requested view
      if (tabId === 'cvm') { renderCategoryPills(); renderTemplatesList(); renderActiveTemplate(); }
      else if (tabId === 'home') renderHome();
      else if (tabId === 'cfd') initCfdView();
      else if (tabId === 'bareme') renderBareme();
      else if (tabId === 'dossier') dossierInit();
      else if (String(tabId) === '5') cumulInit();
      else if (tabId === 'delais') initDelais();
      else if (tabId.toString() === '1') runSimulatorCalculation();
      else if (tabId.toString() === '2') initDemissionView();
      else if (tabId.toString() === '3') initAnsView();
      else if (tabId.toString() === '4') initCspView();
      else if (tabId.toString() === '5') initComplementAreView();
      else if (tabId.toString() === '6') initIndusView();
      else if (tabId.toString() === '7') initIccpView();
      else if (tabId.toString() === '8') initRetraiteView();
      else if (tabId.toString() === '9') initRciView();

      renderBurgerTabs();
      refreshIcons();
    }

    function selectCategory(catKey) {
      currentCategory = catKey;
      const currentFilterBadge = document.getElementById('current-filter-badge');
      if (currentFilterBadge) {
        if (catKey === 'all') currentFilterBadge.textContent = 'Tous les modèles';
        else if (catKey === 'favorites') currentFilterBadge.textContent = 'Favoris';
        else currentFilterBadge.textContent = catKey;
      }
      renderCategoryPills();
      renderTemplatesList();
    }

    function populateCategorySelect() {
      const select = document.getElementById('m-category');
      const editSelect = document.getElementById('edit-m-category');
      const optionsHtml = categoryList.map(c => `
        <option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>
      `).join('');

      if (select) select.innerHTML = optionsHtml;
      if (editSelect) editSelect.innerHTML = optionsHtml;
    }

    function applySidebarLayout() {
      const sidebar = document.getElementById('left-nav-menu');
      const chevron = document.getElementById('sidebar-collapse-chevron');
      const toggleIcon = document.getElementById('toggle-sidebar-icon');
      const labels = document.querySelectorAll('.sidebar-label');
      const title = document.getElementById('sidebar-header-title');
      const resetBtn = document.getElementById('sidebar-reset-btn');

      if (!sidebar) return;

      if (isSidebarCollapsed) {
        sidebar.style.width = '56px';
        labels.forEach(el => el.classList.add('hidden'));
        if (title) title.classList.add('hidden');
        if (resetBtn) resetBtn.classList.add('hidden');
        if (chevron) chevron.setAttribute('data-lucide', 'chevrons-right');
        if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'panel-left-open');
      } else {
        sidebar.style.width = `${sidebarWidth}px`;
        labels.forEach(el => el.classList.remove('hidden'));
        if (title) title.classList.remove('hidden');
        if (resetBtn) resetBtn.classList.remove('hidden');
        if (chevron) chevron.setAttribute('data-lucide', 'chevrons-left');
        if (toggleIcon) toggleIcon.setAttribute('data-lucide', 'panel-left-close');
      }

      renderCategoryPills();
      refreshIcons();
    }

    function toggleSidebar(forceState) {
      isSidebarCollapsed = typeof forceState === 'boolean' ? !forceState : !isSidebarCollapsed;
      saveState();
      applySidebarLayout();
    }

    function resetSidebarWidth() {
      sidebarWidth = 200;
      isSidebarCollapsed = false;
      saveState();
      applySidebarLayout();
      showToast("Largeur réinitialisée (200px)", "info");
    }

    function initSidebarResizer() {
      const resizer = document.getElementById('sidebar-resizer');
      const sidebar = document.getElementById('left-nav-menu');
      if (!resizer || !sidebar) return;
      let isResizing = false;

      resizer.addEventListener('mousedown', (e) => {
        if (!isSidebarCollapsed) {
          isResizing = true;
          document.body.style.cursor = 'col-resize';
          e.preventDefault();
        }
      });

      resizer.addEventListener('dblclick', () => {
        resetSidebarWidth();
      });

      window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        sidebarWidth = Math.max(160, Math.min(360, e.clientX));
        sidebar.style.width = `${sidebarWidth}px`;
      });

      window.addEventListener('mouseup', () => {
        if (isResizing) {
          isResizing = false;
          document.body.style.cursor = '';
          saveState();
        }
      });
    }

    function handleSearch(val, fromUser) {
      searchQuery = (val || '').toLowerCase().trim();
      const clearBtn = document.getElementById('clear-search-btn');
      if (clearBtn) clearBtn.classList.toggle('hidden', searchQuery.length === 0);
      renderTemplatesList();
      if (fromUser) sgOpen = true;
      if (sgOpen) renderSuggest();
    }

    function clearSearch(keepOpen) {
      const input = document.getElementById('search-input');
      if (input) input.value = '';
      handleSearch('');
      if (keepOpen === false) { closeSuggest(); return; }
      if (input) { input.focus(); openSuggest(); }
    }

    function renderTemplatesList() {
      const listContainer = document.getElementById('templates-list');
      if (!listContainer) return;

      const terms = qTerms(searchQuery);
      const scores = new Map();
      const isCommon = t => !!(t && (t.isOfficial || t.shared));
      let tplScope = 'all'; try { tplScope = localStorage.getItem('ft_tpl_scope') || 'all'; } catch (e) {}
      const scopeBar = document.getElementById('tpl-scope');
      if (scopeBar) {
        const nC = templates.filter(isCommon).length, nP = templates.length - nC;
        scopeBar.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b.dataset.s === tplScope); b.setAttribute('aria-selected', String(b.dataset.s === tplScope)); const c = b.querySelector('b'); if (c) c.textContent = b.dataset.s === 'common' ? nC : nP; });
      }
      const filtered = templates.filter(tpl => {
        if (tplScope === 'common' && !isCommon(tpl)) return false;
        if (tplScope === 'perso' && isCommon(tpl)) return false;
        if (currentCategory === 'favorites' && !favorites.includes(tpl.id)) return false;
        if (currentCategory !== 'all' && currentCategory !== 'favorites' && tpl.category !== currentCategory) return false;
        const sc = scoreTpl(tpl, terms);
        if (!sc) return false;
        scores.set(tpl.id, sc);
        return true;
      });

      if (sortMode !== 'default') {
        const dir = sortMode === 'za' ? -1 : 1;
        filtered.sort((a, b) => dir * (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base', numeric: true, ignorePunctuation: true }));
      } else if (terms.length) {
        filtered.sort((a, b) => scores.get(b.id) - scores.get(a.id));
      }
      const grouped = tplScope === 'all' && filtered.some(isCommon) && filtered.some(t => !isCommon(t));
      if (grouped) { const c = filtered.filter(isCommon), p = filtered.filter(t => !isCommon(t)); filtered.length = 0; filtered.push(...p, ...c); }

      const countBadge = document.getElementById('filtered-count-badge');
      if (countBadge) countBadge.textContent = `${filtered.length} résultat(s)`;

      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div class="py-8 text-center text-slate-500 text-xs space-y-1">
            <i data-lucide="search-x" class="w-6 h-6 mx-auto text-slate-600"></i>
            <p>${searchQuery ? 'Aucun modèle ne correspond à « ' + escapeHtml(searchQuery) + ' »' : (tplScope === 'perso' ? 'Vous n’avez pas encore de modèle personnel : créez-en un avec « Nouveau », ou utilisez « En faire un modèle » depuis un outil.' : 'Aucun modèle trouvé')}</p>${searchQuery ? '<button type="button" onclick="clearSearch()" class="text-cyan-400 hover:underline font-semibold">Effacer la recherche</button>' : ''}
          </div>
        `;
        refreshIcons();
        return;
      }

      if (!activeTemplateId || !filtered.some(t => t.id === activeTemplateId)) {
        activeTemplateId = filtered[0].id;
      }

      let lastGrp = null;
      listContainer.innerHTML = filtered.map(tpl => {
        const grp = isCommon(tpl) ? 'c' : 'p';
        const head = grouped && grp !== lastGrp ? '<div class="tpl-grp">' + (grp === 'c' ? 'Modèles communs' : 'Mes modèles') + '<span>' + filtered.filter(t => (isCommon(t) ? 'c' : 'p') === grp).length + '</span></div>' : '';
        lastGrp = grp;
        const isActive = tpl.id === activeTemplateId;
        const isFav = favorites.includes(tpl.id);
        const st = catStyle(tpl.category);
        const escapedId = escapeHtml(tpl.id);
        return head + `
          <div data-tpl-id="${escapedId}" onclick="selectTemplate('${escapedId}')" class="p-2.5 rounded-xl cursor-pointer transition-all border group ${
            isActive ? 'bg-blue-600/15 border-cyan-500/40 shadow-md' : 'bg-slate-900/60 hover:bg-slate-800/70 border-slate-800/80'
          }">
            <div class="flex items-start justify-between gap-1">
              <div class="min-w-0 flex-1 flex items-center gap-2.5">
                <span class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-${st.hue}-500/15 text-${st.hue}-400" title="${escapeHtml(tpl.category)}"><i data-lucide="${st.icon}" class="w-3.5 h-3.5"></i></span>
                <div class="min-w-0">
                <span class="block text-xs font-bold ${isActive ? 'text-cyan-300' : 'text-slate-100'} truncate">${hl(tpl.title, terms, 'tpl-mark')}</span>
                <span class="block text-[10px] text-slate-400 truncate mt-0.5">${escapeHtml(tpl.shortTitle || tpl.category)}</span>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button onclick="openEditModelModal('${escapedId}', event)" class="p-1 text-slate-400 hover:text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity" title="Modifier ce modèle">
                  <i data-lucide="edit-3" class="w-3 h-3"></i>
                </button>
                <button onclick="promptDeleteModel('${escapedId}', event)" class="p-1 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Supprimer ce modèle">
                  <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
                <button onclick="toggleFavorite('${escapedId}', event)" class="p-1 text-slate-400 hover:text-amber-400" title="Favori">
                  <i data-lucide="star" class="w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : ''}"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      refreshIcons();
    }

    function setTplScope(sc) { try { localStorage.setItem('ft_tpl_scope', sc); } catch (e) {} renderTemplatesList(); try { renderActiveTemplate(); } catch (e) {} }
    window.setTplScope = setTplScope;

    function selectTemplate(id) {
      activeTemplateId = id;
      pushRecent(id);
      renderTemplatesList();
      renderActiveTemplate();
    }

    function renderActiveTemplate() {
      setTimeout(ftRenderTplMeta, 0);
      const tpl = templates.find(t => t.id === activeTemplateId) || templates[0];
      if (!tpl) return;

      const titleEl = document.getElementById('active-title');
      if (titleEl) titleEl.textContent = tpl.title;
      const catBadge = document.getElementById('active-cat-badge');
      if (catBadge) {
        const st = catStyle(tpl.category);
        catBadge.className = `inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 border-${st.hue}-500/30 bg-${st.hue}-500/10 text-${st.hue}-400`;
        catBadge.innerHTML = `<i data-lucide="${st.icon}" class="w-3 h-3"></i>${escapeHtml(tpl.category)}`;
        refreshIcons();
      }

      const customBadge = document.getElementById('custom-badge');
      if (customBadge) customBadge.classList.toggle('hidden', !!tpl.isOfficial);

      const dateStamp = document.getElementById('current-date-stamp');
      if (dateStamp) {
        const now = new Date();
        dateStamp.textContent = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      updateFavoriteStarIcon();
      renderVariablesForm(tpl);
      updateCompiledPreview();
      updateMailtoLink(tpl);
    }

    function updateFavoriteStarIcon() {
      const btn = document.getElementById('btn-star-active');
      if (!btn) return;
      const isFav = favorites.includes(activeTemplateId);
      btn.className = `p-1.5 rounded-lg border transition-all ${
        isFav 
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 hover:text-amber-400'
      }`;
      btn.innerHTML = `<i data-lucide="star" class="w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}"></i>`;
      refreshIcons();
    }

    function toggleFavorite(id, event) {
      if (event) event.stopPropagation();
      const idx = favorites.indexOf(id);
      if (idx > -1) {
        favorites.splice(idx, 1);
        showToast("Retiré des favoris", "info");
      } else {
        favorites.push(id);
        showToast("Ajouté aux favoris", "success");
      }
      saveState();
      renderCategoryPills();
      renderTemplatesList();
      updateFavoriteStarIcon();
    }

    function toggleActiveFavorite() {
      if (activeTemplateId) {
        toggleFavorite(activeTemplateId);
      }
    }

    function renderVariablesForm(tpl) {
      const grid = document.getElementById('dynamic-inputs-grid');
      const tag = document.getElementById('vars-count-tag');
      const vars = tpl.variables || [];
      if (tag) tag.textContent = `${vars.length} champ(s)`;

      if (!grid) return;
      if (vars.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-2 text-center text-xs text-slate-500 italic">Aucune variable requise pour ce modèle. Le message est directement diffusable.</div>`;
        return;
      }

      if (!userVariables[tpl.id]) userVariables[tpl.id] = {};

      grid.innerHTML = vars.map(v => {
        const val = userVariables[tpl.id][v.key] !== undefined ? userVariables[tpl.id][v.key] : '';
        return `
          <div class="space-y-1">
            <label class="block text-[11px] font-medium text-slate-300 truncate">${escapeHtml(v.label)}</label>
            <input 
              type="text" 
              value="${escapeHtml(val)}" 
              placeholder="${escapeHtml((v.placeholder && v.placeholder !== v.label) ? v.placeholder : 'À compléter')}"
              oninput="handleVarChange('${tpl.id}', '${v.key}', this.value)" 
              class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700/80 focus:border-cyan-400 text-xs text-white outline-none"
            >
          </div>
        `;
      }).join('');
    }

    function handleVarChange(templateId, key, value) {
      if (!userVariables[templateId]) userVariables[templateId] = {};
      userVariables[templateId][key] = value;
      saveState();
      updateCompiledPreview();
      const tpl = templates.find(t => t.id === templateId);
      if (tpl) updateMailtoLink(tpl);
    }

    function fillDemoData() {
      const tpl = templates.find(t => t.id === activeTemplateId);
      if (!tpl || !tpl.variables) return;
      if (!userVariables[tpl.id]) userVariables[tpl.id] = {};
      tpl.variables.forEach(v => {
        userVariables[tpl.id][v.key] = v.default || v.placeholder || 'Exemple';
      });
      saveState();
      renderVariablesForm(tpl);
      updateCompiledPreview();
      updateMailtoLink(tpl);
      showToast("Données d'exemple appliquées", "info");
    }

    function resetVariables() {
      if (activeTemplateId) {
        userVariables[activeTemplateId] = {};
        saveState();
        const tpl = templates.find(t => t.id === activeTemplateId);
        if (tpl) {
          renderVariablesForm(tpl);
          updateCompiledPreview();
          updateMailtoLink(tpl);
        }
        showToast("Champs réinitialisés", "info");
      }
    }

    function openEditActiveModel() {
      if (activeTemplateId) {
        openEditModelModal(activeTemplateId);
      }
    }

    function openEditModelModal(templateId, event) {
      if (event) event.stopPropagation();
      const tpl = templates.find(t => t.id === templateId);
      if (!tpl) return;

      populateCategorySelect();
      document.getElementById('edit-m-id').value = tpl.id;
      document.getElementById('edit-m-title').value = tpl.title;
      document.getElementById('edit-m-short').value = tpl.shortTitle || '';
      document.getElementById('edit-m-category').value = tpl.category;
      document.getElementById('edit-m-body').value = tpl.body;
      const eRef = document.getElementById('edit-m-ref'); if (eRef) eRef.value = tpl.reference || '';
      const eRev = document.getElementById('edit-m-reviewed'); if (eRev) eRev.value = tpl.reviewedAt || '';

      openModal('edit-model-modal');
    }

    function handleUpdateTemplate(event) {
      event.preventDefault();
      const id = document.getElementById('edit-m-id').value;
      const title = document.getElementById('edit-m-title').value.trim();
      const shortTitle = document.getElementById('edit-m-short').value.trim() || title;
      const category = document.getElementById('edit-m-category').value;
      const body = document.getElementById('edit-m-body').value.trim();

      if (!title || !body) return;

      const tplIndex = templates.findIndex(t => t.id === id);
      if (tplIndex === -1) return;

      // Detect variables in new body
      const matches = body.match(/\{\{([^}]+)\}\}/g) || [];
      const vars = [];
      const seen = new Set();
      matches.forEach(m => {
        const key = m.replace(/[{}]/g, '').trim();
        if (!seen.has(key)) {
          seen.add(key);
          const existingVar = (templates[tplIndex].variables || []).find(v => v.key === key);
          vars.push(existingVar || {
            key: key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            placeholder: key,
            default: ''
          });
        }
      });

      templates[tplIndex].title = title;
      templates[tplIndex].shortTitle = shortTitle;
      templates[tplIndex].category = category;
      templates[tplIndex].body = body;
      templates[tplIndex].variables = vars;
      templates[tplIndex].reference = (document.getElementById('edit-m-ref')?.value || '').trim();
      templates[tplIndex].reviewedAt = document.getElementById('edit-m-reviewed')?.value || '';

      saveState();
      closeModal('edit-model-modal');
      renderCategoryPills();
      renderTemplatesList();
      renderActiveTemplate();
      showToast(`Modèle « ${title} » mis à jour`, "success");
    }

    function promptDeleteActiveModel() {
      if (activeTemplateId) {
        promptDeleteModel(activeTemplateId);
      }
    }

    function promptDeleteModel(id, event) {
      if (event) event.stopPropagation();
      const tpl = templates.find(t => t.id === id);
      if (!tpl) return;

      modelIdToDelete = id;
      const nameEl = document.getElementById('delete-model-name');
      if (nameEl) nameEl.textContent = tpl.title;

      openModal('delete-model-modal');
    }

    function confirmDeleteModel() {
      if (!modelIdToDelete) return;

      const deletedTitle = templates.find(t => t.id === modelIdToDelete)?.title || "Modèle";
      templates = templates.filter(t => t.id !== modelIdToDelete);
      favorites = favorites.filter(id => id !== modelIdToDelete);

      if (activeTemplateId === modelIdToDelete) {
        activeTemplateId = templates.length > 0 ? templates[0].id : null;
      }

      modelIdToDelete = null;
      saveState();
      closeModal('delete-model-modal');
      renderCategoryPills();
      renderTemplatesList();
      renderActiveTemplate();
      showToast(`Modèle « ${deletedTitle} » supprimé`, "info");
    }

    function openEditCategoryModal(catName, event) {
      if (event) event.stopPropagation();
      const cat = categoryList.find(c => c.name === catName);
      if (!cat) return;

      document.getElementById('edit-cat-old-name').value = cat.name;
      document.getElementById('edit-cat-name').value = cat.name;
      document.getElementById('edit-cat-icon').value = cat.icon || 'folder';

      openModal('edit-category-modal');
    }

    function handleUpdateCategory(event) {
      event.preventDefault();
      const oldName = document.getElementById('edit-cat-old-name').value;
      const newName = document.getElementById('edit-cat-name').value.trim();
      const newIcon = document.getElementById('edit-cat-icon').value || 'folder';

      if (!newName) return;

      if (newName !== oldName && categoryList.some(c => c.name.toLowerCase() === newName.toLowerCase())) {
        showToast("Une catégorie portant ce nom existe déjà", "info");
        return;
      }

      // Update in category list
      const catIdx = categoryList.findIndex(c => c.name === oldName);
      if (catIdx !== -1) {
        categoryList[catIdx].name = newName;
        categoryList[catIdx].icon = newIcon;
      }

      // Reassign templates from old category name to new name
      templates.forEach(t => {
        if (t.category === oldName) {
          t.category = newName;
        }
      });

      // Update current active filter if pointing to this category
      if (currentCategory === oldName) {
        currentCategory = newName;
      }

      saveState();
      closeModal('edit-category-modal');
      renderCategoryPills();
      populateCategorySelect();
      renderTemplatesList();
      renderActiveTemplate();
      showToast(`Catégorie « ${newName} » mise à jour`, "success");
    }

    function promptDeleteCategory(catName, event) {
      if (event) event.stopPropagation();
      if (categoryList.length <= 1) {
        showToast("Impossible de supprimer la dernière catégorie restante", "error");
        return;
      }

      categoryNameToDelete = catName;
      const nameEl = document.getElementById('delete-cat-name');
      if (nameEl) nameEl.textContent = catName;

      openModal('delete-category-modal');
    }

    function confirmDeleteCategory() {
      if (!categoryNameToDelete) return;

      const fallbackCat = categoryList.find(c => c.name !== categoryNameToDelete)?.name || "Divers";

      // Reassign templates to fallback
      templates.forEach(t => {
        if (t.category === categoryNameToDelete) {
          t.category = fallbackCat;
        }
      });

      categoryList = categoryList.filter(c => c.name !== categoryNameToDelete);

      if (currentCategory === categoryNameToDelete) {
        currentCategory = 'all';
      }

      const deletedName = categoryNameToDelete;
      categoryNameToDelete = null;

      saveState();
      closeModal('delete-category-modal');
      renderCategoryPills();
      populateCategorySelect();
      renderTemplatesList();
      renderActiveTemplate();
      showToast(`Catégorie « ${deletedName} » supprimée (modèles transférés dans « ${fallbackCat} »)`, "info");
    }

    function compileText(templateStr, templateId, asHtml = false) {
      const vars = userVariables[templateId] || {};
      return templateStr.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
        const key = varName.trim();
        const val = vars[key];
        if (val && val.trim() !== '') {
          return asHtml ? `<span class="var-highlight">${escapeHtml(val)}</span>` : val;
        }
        return asHtml ? `<span class="var-empty">[${escapeHtml(key)}]</span>` : `[${key}]`;
      });
    }

    function updateCompiledPreview() {
      const tpl = templates.find(t => t.id === activeTemplateId) || templates[0];
      if (!tpl) return;
      const preview = document.getElementById('preview-body');
      if (preview) preview.innerHTML = compileText(tpl.body, tpl.id, true);
    }

    function updateMailtoLink(tpl) {
      const mailtoBtn = document.getElementById('btn-mailto');
      if (!mailtoBtn || !tpl) return;
      const subject = encodeURIComponent(`France Travail - ${tpl.title}`);
      const rawBody = compileText(tpl.body, tpl.id, false);
      mailtoBtn.href = `mailto:?subject=${subject}&body=${encodeURIComponent(rawBody)}`;
    }

    function handleCreateTemplate(event) {
      event.preventDefault();
      const title = document.getElementById('m-title').value.trim();
      const category = document.getElementById('m-category').value;
      const body = document.getElementById('m-body').value.trim();
      if (!title || !body) return;

      const matches = body.match(/\{\{([^}]+)\}\}/g) || [];
      const vars = [];
      const seen = new Set();
      matches.forEach(m => {
        const key = m.replace(/[{}]/g, '').trim();
        if (!seen.has(key)) {
          seen.add(key);
          vars.push({
            key: key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            placeholder: key,
            default: ''
          });
        }
      });

      const newTpl = {
        id: 'custom-' + Date.now(),
        reference: (document.getElementById('m-ref')?.value || '').trim(),
        reviewedAt: document.getElementById('m-reviewed')?.value || '',
        title: title,
        shortTitle: title,
        category: category,
        body: body,
        variables: vars,
        isOfficial: false
      };

      templates.push(newTpl);
      saveState();
      closeModal('new-model-modal');
      document.getElementById('m-title').value = '';
      document.getElementById('m-body').value = '';
      selectCategory(category);
      selectTemplate(newTpl.id);
      showToast("Nouveau modèle enregistré", "success");
    }

    function handleCreateCategory(event) {
      if (event) event.preventDefault();
      const input = document.getElementById('cat-name-input');
      const name = input ? input.value.trim() : '';
      if (!name) return;
      if (categoryList.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showToast("Cette catégorie existe déjà", "info");
        return;
      }

      categoryList.push({
        name: name,
        icon: 'folder',
        color: 'bg-cyan-500/10 text-cyan-400'
      });

      saveState();
      if (input) input.value = '';
      closeModal('new-category-modal');
      renderCategoryPills();
      selectCategory(name);
      showToast(`Catégorie "${name}" créée`, "success");
    }

    function resetDefaults() {
      safeLS.removeItem('ft_custom_templates');
      safeLS.removeItem('ft_templates');
      safeLS.removeItem('ft_favorites');
      safeLS.removeItem('ft_user_vars');
      safeLS.removeItem('ft_categories_list');
      loadState();
      renderCategoryPills();
      renderTemplatesList();
      selectTemplate(templates[0].id);
      showToast("Modèles réinitialisés aux valeurs d'origine", "success");
    }

    function switchOdSubMode(mode) {
      const sim = document.getElementById('od-subview-sim');
      const ref = document.getElementById('od-subview-ref');
      const btnSim = document.getElementById('od-btn-mode-sim');
      const btnRef = document.getElementById('od-btn-mode-ref');

      const activeClass = "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-md shadow-blue-950/50";
      const inactiveClass = "text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium";

      if (sim) sim.classList.toggle('hidden', mode !== 'sim');
      if (ref) ref.classList.toggle('hidden', mode === 'sim');

      if (btnSim) btnSim.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${mode === 'sim' ? activeClass : inactiveClass}`;
      if (btnRef) btnRef.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${mode === 'ref' ? activeClass : inactiveClass}`;

      refreshIcons();
    }

    function toggleAffiliationUnit(unit) {
      simUnit = unit;
      const valInput = document.getElementById('sim-affiliation-val');
      const label = document.getElementById('sim-affiliation-unit-label');
      if (unit === 'hours') {
        if (valInput && valInput.value == 130) valInput.value = 910;
        if (label) label.textContent = 'heures travaillées';
      } else {
        if (valInput && valInput.value == 910) valInput.value = 130;
        if (label) label.textContent = 'jours travaillés';
      }
      runSimulatorCalculation();
    }

    function runSimulatorCalculation() {
      const motif = document.getElementById('sim-motif')?.value || 'rupture_conv';
      const affVal = parseFloat(document.getElementById('sim-affiliation-val')?.value) || 0;
      const age = document.getElementById('sim-age')?.value || 'under55';
      const isSaisonnier = document.getElementById('sim-saisonnier')?.checked || false;
      const forclusion = document.getElementById('sim-forclusion')?.value || 'ok';
      const residenceApt = document.getElementById('sim-residence-apt')?.value || 'ok';
      const rechercheActive = document.getElementById('sim-recherche-active')?.checked || false;
      const sansRetraite = document.getElementById('sim-sans-retraite')?.checked || false;

      const optDemContainer = document.getElementById('sim-demission-options');
      const isDemission = motif.includes('demission_ordinaire') || motif.includes('rupture_essai_sal');
      if (optDemContainer) optDemContainer.classList.toggle('hidden', !isDemission);

      const opt65j = document.getElementById('sim-opt-65j')?.checked || false;
      const opt122j = document.getElementById('sim-opt-122j')?.checked || false;

      const reqAff = isSaisonnier 
        ? (simUnit === 'hours' ? 758 : 108) 
        : (simUnit === 'hours' ? 910 : 130);

      const condAff = affVal >= reqAff;
      const condRupture = !isDemission || opt65j || opt122j;
      const condForclusion = forclusion !== 'forclos';
      const condAptitude = residenceApt === 'ok';
      const condEngagement = rechercheActive && sansRetraite;

      const isEligible = condAff && condRupture && condForclusion && condAptitude && condEngagement;

      // Update checks
      const updateCheck = (id, valid, text) => {
        const row = document.getElementById(id);
        const tag = document.getElementById(`${id}-tag`);
        if (tag) {
          tag.textContent = text;
          tag.className = `font-mono text-[10px] ${valid ? 'text-emerald-400' : 'text-rose-400'}`;
        }
        if (row) {
          const icon = row.querySelector('i');
          if (icon) {
            icon.setAttribute('data-lucide', valid ? 'check-circle' : 'x-circle');
            icon.className = `w-3.5 h-3.5 ${valid ? 'text-emerald-400' : 'text-rose-400'}`;
          }
        }
      };

      updateCheck('chk-cond-affiliation', condAff, `${affVal} / ${reqAff} ${simUnit === 'hours' ? 'h' : 'j'}`);
      updateCheck('chk-cond-rupture', condRupture, condRupture ? 'Admis' : 'Non admis (démission)');
      updateCheck('chk-cond-forclusion', condForclusion, condForclusion ? 'Délai tenu' : 'Forclos (> 12m)');
      updateCheck('chk-cond-aptitude', condAptitude, condAptitude ? 'Conforme' : 'Non conforme');
      updateCheck('chk-cond-engagement', condEngagement, condEngagement ? 'Validé' : 'Critère manquant');

      // Verdict card
      const verdictTitle = document.getElementById('sim-verdict-title');
      const verdictDesc = document.getElementById('sim-verdict-desc');
      const verdictCard = document.getElementById('sim-verdict-card');

      if (verdictTitle && verdictDesc && verdictCard) {
        if (isEligible) {
          verdictTitle.textContent = "ÉLIGIBLE À L'ARE";
          verdictTitle.className = "text-lg font-extrabold text-emerald-300 leading-tight";
          verdictDesc.textContent = "Toutes les conditions légales Unédic sont satisfaites pour une ouverture de droit.";
          verdictCard.className = "rounded-xl border p-5 shadow-2xl transition-all space-y-3 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40";
        } else {
          verdictTitle.textContent = "NON ÉLIGIBLE EN L'ÉTAT";
          verdictTitle.className = "text-lg font-extrabold text-rose-400 leading-tight";
          verdictDesc.textContent = !condRupture 
            ? "Départ volontaire non légitime : justifier de 65 jours retravaillés ou saisir l'IPR au 122e jour."
            : (!condAff ? "Affiliation insuffisante sur la période de référence." : "Une ou plusieurs conditions d'accès ne sont pas remplies.");
          verdictCard.className = "rounded-xl border p-5 shadow-2xl transition-all space-y-3 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40";
        }
      }

      // Estimations financières : barème Unédic centralisé (voir BAREME)
      const B = BAREME;
      const nval = id => parseFloat(document.getElementById(id)?.value) || 0;
      const setTxt = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };
      const salaireMoyen = nval('sim-salaire-moyen');
      const indemCp = nval('sim-indem-cp');
      const indemSupra = nval('sim-indem-supra');
      const isRciMotif = motif === 'rupture_conv';
      const fctWrap = document.getElementById('sim-fct-wrap');
      if (fctWrap) fctWrap.classList.toggle('hidden', !isRciMotif);
      const fctSaisie = ftParseDate(document.getElementById('sim-date-fct')?.value);
      const dFct = fctSaisie || new Date();
      const rciReduit = isRciMotif && dFct >= ftParseDate(B.duree.rci.effet);
      const ageBand = age === 'under55' ? 'u55' : (age === '55to56' ? 'a55' : 'a57');
      const eco = motif === 'licenciement_eco';

      const sjrAtt = nval('sim-sjr-att');
      const sjr = sjrAtt > 0 ? sjrAtt : salaireMoyen / 30.42;
      const are = ftAreJour(sjr);
      const areJour = are.aj;
      let maxDays = B.duree.max[ageBand];
      if (rciReduit) maxDays = ageBand === 'u55' ? B.duree.rci.u55 : B.duree.rci.a55;

      const diffCp = sjr > 0 ? Math.min(B.differe.cpMax, Math.floor(indemCp / sjr)) : 0;
      const diffSupra = Math.min(eco ? B.differe.specMaxEco : B.differe.specMax, Math.floor(indemSupra / B.differe.diviseur));
      const totalDiff = B.differe.attente + diffCp + diffSupra;
      const premier = ftAddDays(dFct, 1 + totalDiff);

      setTxt('calc-are-jour', sjr > 0 ? fmtEur(areJour) : '—');
      setTxt('calc-formule-tag', sjr > 0 ? ARE_FORMULES[are.formule] : 'Renseignez le salaire moyen');
      setTxt('calc-duree-max', maxDays + ' jours');
      setTxt('calc-duree-mois', (Math.round(maxDays / 30.42 * 2) / 2).toString().replace('.', ',') + ' mois');
      setTxt('calc-diff-cp', diffCp + ' jours');
      setTxt('calc-diff-supra', diffSupra + ' jours');
      setTxt('calc-total-differe', totalDiff + ' jours');

      const det = document.getElementById('sim-calc-detail');
      if (det) {
        const row = (k, v, f, cls) => '<div class="sim-d-row ' + (cls || '') + '"><span class="sim-d-k">' + k + '</span><span class="sim-d-v">' + v + '</span>' + (f ? '<span class="sim-d-f">' + f + '</span>' : '') + '</div>';
        let h = '';
        if (sjr > 0) {
          h += row('Salaire journalier de référence', fmtEur(sjr), sjrAtt > 0 ? 'SJR relevé sur l\u2019attestation employeur : valeur exacte.' : fmtEur(salaireMoyen) + ' ÷ 30,42. Valeur estimée sur une période continue : le SJR exact figure sur l\u2019attestation employeur.');
          h += row('Allocation journalière', fmtEur(areJour), '40,4 % du SJR + ' + fmtEur(B.are.partieFixe) + ' = ' + fmtEur(are.opA) + ' · 57 % du SJR = ' + fmtEur(are.opB) + ' · minimum ' + fmtEur(B.are.min) + ' · limite 75 % du SJR = ' + fmtEur(are.lim) + '. Retenue : ' + ARE_FORMULES[are.formule] + '.');
          if (ageBand === 'u55' && areJour > B.degr.seuil) h += row('Dégressivité dès le 7e mois', fmtEur(Math.max(B.degr.seuil, areJour * B.degr.coef)), 'Moins de 55 ans à la fin du contrat et allocation > ' + fmtEur(B.degr.seuil) + ' : coefficient 0,7, sans descendre sous ce seuil.', 'is-warn');
          h += row('Allocation mensuelle', fmtEur(areJour * B.cumul.base), 'Mensualisation sur 30 jours.');
        } else {
          h += row('Salaire moyen', '—', 'Renseignez le salaire brut mensuel moyen pour estimer l\u2019allocation.');
        }
        h += row('Durée maximale', maxDays + ' j', (rciReduit ? 'Rupture conventionnelle avec fin de contrat à compter du 01/09/2026 : plafond de 15 mois (moins de 55 ans) ou 20,5 mois. ' : 'Moins de 55 ans : 548 j · 55 et 56 ans : 685 j · 57 ans et plus : 822 j. ') + 'Durée réelle : jours calendaires de la période de référence × 0,75, minimum 182 j.', rciReduit ? 'is-info' : '');
        h += row('Différé congés payés', diffCp + ' j', sjr > 0 ? fmtEur(indemCp) + ' ÷ SJR ' + fmtEur(sjr) + ', plafonné à ' + B.differe.cpMax + ' j.' : 'Calculé à partir du SJR.');
        h += row('Différé spécifique', diffSupra + ' j', fmtEur(indemSupra) + ' ÷ ' + String(B.differe.diviseur).replace('.', ',') + ', plafonné à ' + (eco ? B.differe.specMaxEco + ' j (motif économique)' : B.differe.specMax + ' j') + '.');
        h += row('Premier jour indemnisable', ftFmtDate(premier), 'Fin de contrat (' + ftFmtDate(dFct) + (fctSaisie ? '' : ', date du jour par défaut') + ') + ' + (1 + totalDiff) + ' j : délai d\u2019attente ' + B.differe.attente + ' j + différés.');
        det.innerHTML = h;
      }
      const bTag = document.getElementById('sim-bareme-tag');
      if (bTag) bTag.textContent = 'Barème vérifié le ' + B.verifie;

      // Adviser note
      const adviserNote = document.getElementById('sim-adviser-note');
      if (adviserNote) {
        adviserNote.textContent = isEligible
          ? (sjr > 0
            ? 'Dossier complet et conforme. ARE journalière estimée à ' + fmtEur(areJour) + ' (' + ARE_FORMULES[are.formule] + ') pour ' + maxDays + ' jours maximum. Différés avant 1er versement : ' + totalDiff + ' jours calendaires (délai d\u2019attente ' + B.differe.attente + ' j + ' + diffCp + ' j congés payés + ' + diffSupra + ' j supra-légal). Premier jour indemnisable estimé : ' + ftFmtDate(premier) + '. Barème Unédic vérifié le ' + B.verifie + '.'
            : 'Dossier complet et conforme. Renseignez le salaire brut mensuel moyen pour estimer l\u2019allocation et les différés.')
          : 'Ouverture de droit bloquée en l\u2019état : ' + (!condRupture ? 'motif de départ volontaire non légitime' : 'critère d\u2019affiliation ou légal manquant') + '.';
      }
      refreshIcons();
    }

    function resetSimulator() {
      const motif = document.getElementById('sim-motif');
      if (motif) motif.value = 'rupture_conv';
      ftClearFields(['sim-affiliation-val', 'sim-salaire-moyen', 'sim-sjr-att', 'sim-indem-cp', 'sim-indem-supra']);
      runSimulatorCalculation();
      showToast("Simulateur réinitialisé", "info");
    }

    function copySimulatorAnalysis() {
      const title = document.getElementById('sim-verdict-title')?.textContent || '';
      const note = document.getElementById('sim-adviser-note')?.textContent || '';
      copyToClipboard(`[DIAGNOSTIC OUVERTURE DE DROIT ARE]\nRésultat : ${title}\n${note}`);
      showToast("Synthèse copiée dans le presse-papier !", "success");
    }

    function copyAdviserNote() {
      const note = document.getElementById('sim-adviser-note')?.textContent || '';
      copyToClipboard(note);
      showToast("Note conseiller copiée !", "success");
    }

    function filterOdReference(query) {
      const q = (query || '').toLowerCase().trim();
      const items = document.querySelectorAll('#od-ref-cards-container .ref-item');
      items.forEach(el => {
        const keywords = (el.getAttribute('data-keywords') || '').toLowerCase();
        const text = el.textContent.toLowerCase();
        el.classList.toggle('hidden', q.length > 0 && !keywords.includes(q) && !text.includes(q));
      });
    }

    function initDemissionView() {
      renderDemissionCategories();
      renderDemissionBubbles();
      renderDemissionDetail();
      refreshIcons();
    }

    function renderDemissionCategories() {
      const container = document.getElementById('demission-category-chips');
      if (!container) return;

      const categories = [
        'all', 
        'Familial & Personnel', 
        'Droit du travail & Litiges', 
        'Professionnel & Création', 
        'Voies de Rattrapage',
        'Licenciements & Ruptures'
      ];
      container.innerHTML = categories.map(cat => {
        const isActive = demissionCategoryFilter === cat;
        const label = cat === 'all' ? 'Tous les motifs' : cat;
        return `
          <button onclick="selectDemissionCategory('${cat}')" class="px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
            isActive 
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800 border-transparent'
          }">
            ${label}
          </button>
        `;
      }).join('');
    }

    function selectDemissionCategory(cat) {
      demissionCategoryFilter = cat;
      renderDemissionCategories();
      renderDemissionBubbles(document.getElementById('demission-search-input')?.value || '');
    }

    function handleDemissionSearch(val) {
      const clearBtn = document.getElementById('demission-clear-search-btn');
      if (clearBtn) clearBtn.classList.toggle('hidden', (val || '').trim().length === 0);
      renderDemissionBubbles(val);
    }

    function clearDemissionSearch() {
      const input = document.getElementById('demission-search-input');
      if (input) input.value = '';
      handleDemissionSearch('');
    }

    function renderDemissionBubbles(searchQuery = '') {
      const container = document.getElementById('demission-bubbles-container');
      const countEl = document.getElementById('demission-bubbles-count');
      if (!container) return;

      const q = (searchQuery || '').toLowerCase().trim();
      const filtered = DEMISSION_MOTIFS.filter(m => {
        if (demissionCategoryFilter !== 'all' && m.category !== demissionCategoryFilter) return false;
        if (q) {
          return m.title.toLowerCase().includes(q) || 
                 m.summary.toLowerCase().includes(q) || 
                 m.conditions.toLowerCase().includes(q) ||
                 m.tag.toLowerCase().includes(q) ||
                 m.category.toLowerCase().includes(q);
        }
        return true;
      });

      if (countEl) countEl.textContent = `${filtered.length} motif(s) affiché(s)`;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-10 text-center text-slate-500 text-xs space-y-2">
            <i data-lucide="search-x" class="w-7 h-7 mx-auto text-slate-600"></i>
            <p>Aucun motif ou licenciement ne correspond à votre recherche « ${escapeHtml(q)} ».</p>
            <button onclick="clearDemissionSearch(); selectDemissionCategory('all');" class="text-xs text-cyan-400 hover:underline">Réinitialiser les filtres</button>
          </div>
        `;
        refreshIcons();
        return;
      }

      if (!filtered.some(m => m.id === activeDemissionId)) {
        activeDemissionId = filtered[0].id;
      }

      container.innerHTML = filtered.map(m => {
        const isSel = m.id === activeDemissionId;
        const iconName = m.icon || 'file-text';
        return `
          <div onclick="selectDemissionMotif('${m.id}')" class="p-3.5 rounded-xl border cursor-pointer transition-all ${
            isSel ? 'bg-blue-600/20 border-cyan-400 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/40' : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
          }">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${m.badgeColor}">${m.tag}</span>
              <span class="text-[10px] text-slate-400 truncate">${m.category}</span>
            </div>
            <div class="flex items-start gap-2">
              <i data-lucide="${iconName}" class="w-4 h-4 ${isSel ? 'text-cyan-300' : 'text-slate-400'} shrink-0 mt-0.5"></i>
              <h4 class="text-xs font-bold ${isSel ? 'text-cyan-300' : 'text-white'} leading-snug">${escapeHtml(m.title)}</h4>
            </div>
            <p class="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed pl-6">${escapeHtml(m.summary)}</p>
          </div>
        `;
      }).join('');

      refreshIcons();
    }

    function selectDemissionMotif(id) {
      activeDemissionId = id;
      renderDemissionBubbles(document.getElementById('demission-search-input')?.value || '');
      renderDemissionDetail();
    }

    function renderDemissionDetail() {
      const pane = document.getElementById('demission-detail-pane');
      const m = DEMISSION_MOTIFS.find(x => x.id === activeDemissionId) || DEMISSION_MOTIFS[0];
      if (!pane || !m) return;

      const iconName = m.icon || 'file-text';

      pane.innerHTML = `
        <div class="space-y-4 text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <span class="text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${m.badgeColor}">${m.tag}</span>
            <span class="text-[11px] font-semibold text-slate-400">${m.category}</span>
          </div>

          <div>
            <div class="flex items-start gap-2.5">
              <div class="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <i data-lucide="${iconName}" class="w-4 h-4"></i>
              </div>
              <h3 class="font-extrabold text-white text-sm leading-snug">${escapeHtml(m.title)}</h3>
            </div>
            <p class="text-xs text-slate-300 mt-2.5 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800/80">${escapeHtml(m.conditions)}</p>
          </div>

          <div class="space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span class="font-bold text-cyan-400 text-[11px] flex items-center gap-1.5">
              <i data-lucide="folder-check" class="w-3.5 h-3.5"></i> Pièces justificatives requises (GED)
            </span>
            <div class="space-y-1 pt-1">
              ${m.justificatifs.map(j => `<div class="p-2 rounded bg-slate-900 border border-slate-800/80 text-slate-200 text-[11px] leading-snug">• ${escapeHtml(j)}</div>`).join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span class="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider">Délais réglementaires</span>
              <span class="text-slate-200 font-medium mt-0.5 block leading-tight">${escapeHtml(m.delais)}</span>
            </div>
            <div class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span class="block text-amber-400 text-[10px] font-semibold uppercase tracking-wider">Point de vigilance</span>
              <span class="text-amber-200 font-medium mt-0.5 block leading-tight">${escapeHtml(m.vigilance)}</span>
            </div>
          </div>

          <div class="pt-2 border-t border-slate-800 flex gap-2">
            <button onclick="copyDemissionCvmNote('${m.id}')" class="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              <span>Copier pour message CVM</span>
            </button>
          </div>
        </div>
      `;
      refreshIcons();
    }

    function copyDemissionCvmNote(id) {
      const m = DEMISSION_MOTIFS.find(x => x.id === id);
      if (!m) return;
      const note = `Bonjour,\n\nConcernant votre situation de fin de contrat [${m.title}] :\n\n• Réglementation applicable : ${m.conditions}\n• Pièces justificatives à transmettre sur votre espace personnel :\n${m.justificatifs.map(j => '  - ' + j).join('\n')}\n• Délai d'application : ${m.delais}\n• Remarque importante : ${m.vigilance}\n\nNous restons joignables au 3949 pour toute précision.\nVotre conseiller France Travail`;
      copyToClipboard(note);
      showToast("Fiche motif copiée pour message CVM !", "success");
    }

    function selectDemissionCategory(cat) {
      demissionCategoryFilter = cat;
      renderDemissionCategories();
      renderDemissionBubbles();
    }

    function handleDemissionSearch(val) {
      const clearBtn = document.getElementById('demission-clear-search-btn');
      if (clearBtn) clearBtn.classList.toggle('hidden', (val || '').trim().length === 0);
      renderDemissionBubbles(val);
    }

    function clearDemissionSearch() {
      const input = document.getElementById('demission-search-input');
      if (input) input.value = '';
      handleDemissionSearch('');
    }

    function renderDemissionBubbles(searchQuery = '') {
      const container = document.getElementById('demission-bubbles-container');
      const countEl = document.getElementById('demission-bubbles-count');
      if (!container) return;

      const q = (searchQuery || '').toLowerCase().trim();
      const filtered = DEMISSION_MOTIFS.filter(m => {
        if (demissionCategoryFilter !== 'all' && m.category !== demissionCategoryFilter) return false;
        if (q) {
          return m.title.toLowerCase().includes(q) || m.summary.toLowerCase().includes(q) || m.conditions.toLowerCase().includes(q);
        }
        return true;
      });

      if (countEl) countEl.textContent = `${filtered.length} motif(s)`;

      if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full py-8 text-center text-slate-500 text-xs">Aucun motif correspondant trouvé.</div>`;
        return;
      }

      if (!filtered.some(m => m.id === activeDemissionId)) {
        activeDemissionId = filtered[0].id;
      }

      container.innerHTML = filtered.map(m => {
        const isSel = m.id === activeDemissionId;
        return `
          <div onclick="selectDemissionMotif('${m.id}')" class="p-3.5 rounded-xl border cursor-pointer transition-all ${
            isSel ? 'bg-blue-600/20 border-cyan-400 shadow-lg shadow-cyan-950/20' : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
          }">
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-[10px] font-mono px-2 py-0.5 rounded border ${m.badgeColor}">${m.tag}</span>
              <span class="text-[10px] text-slate-400 truncate">${m.category}</span>
            </div>
            <h4 class="text-xs font-bold ${isSel ? 'text-cyan-300' : 'text-white'} leading-snug">${escapeHtml(m.title)}</h4>
            <p class="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">${escapeHtml(m.summary)}</p>
          </div>
        `;
      }).join('');

      refreshIcons();
    }

    function selectDemissionMotif(id) {
      activeDemissionId = id;
      renderDemissionBubbles(document.getElementById('demission-search-input')?.value || '');
      renderDemissionDetail();
    }

    function renderDemissionDetail() {
      const pane = document.getElementById('demission-detail-pane');
      const m = DEMISSION_MOTIFS.find(x => x.id === activeDemissionId) || DEMISSION_MOTIFS[0];
      if (!pane || !m) return;

      pane.innerHTML = `
        <div class="space-y-4 text-xs">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <span class="text-[10px] font-mono px-2 py-0.5 rounded border ${m.badgeColor}">${m.tag}</span>
            <span class="text-[11px] text-slate-400">${m.category}</span>
          </div>

          <div>
            <h3 class="font-extrabold text-white text-sm leading-snug">${escapeHtml(m.title)}</h3>
            <p class="text-xs text-slate-300 mt-2 leading-relaxed">${escapeHtml(m.conditions)}</p>
          </div>

          <div class="space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <span class="font-bold text-cyan-400 text-[11px] flex items-center gap-1.5">
              <i data-lucide="folder-check" class="w-3.5 h-3.5"></i> Pièces justificatives obligatoires (GED)
            </span>
            <div class="space-y-1 pt-1">
              ${m.justificatifs.map(j => `<div class="p-1.5 rounded bg-slate-900 border border-slate-800/80 text-slate-200 text-[11px] leading-tight">• ${escapeHtml(j)}</div>`).join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 gap-2 text-[11px]">
            <div class="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span class="block text-slate-400 text-[10px] font-semibold uppercase">Délais légaux</span>
              <span class="text-slate-200 font-medium mt-0.5 block">${escapeHtml(m.delais)}</span>
            </div>
            <div class="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span class="block text-amber-400 text-[10px] font-semibold uppercase">Point de vigilance</span>
              <span class="text-amber-200 font-medium mt-0.5 block">${escapeHtml(m.vigilance)}</span>
            </div>
          </div>

          <button onclick="copyToClipboard('${escapeHtml(m.title)} : ${escapeHtml(m.conditions)} Pièces requises : ${m.justificatifs.join(', ')}'); showToast('Fiche motif démission copiée !', 'success');" class="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            <span>Copier la fiche pour CVM</span>
          </button>
        </div>
      `;
      refreshIcons();
    }

    function initAnsView() {
      runArceCalculation();
      runMaintienCalculation();
    }

    function switchAnsSubMode(mode) {
      const sim = document.getElementById('ans-subview-sim');
      const ref = document.getElementById('ans-subview-ref');
      const btnSim = document.getElementById('ans-btn-mode-sim');
      const btnRef = document.getElementById('ans-btn-mode-ref');

      const activeClass = "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-md shadow-blue-950/50";
      const inactiveClass = "text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium";

      if (sim) sim.classList.toggle('hidden', mode !== 'sim');
      if (ref) ref.classList.toggle('hidden', mode === 'sim');

      if (btnSim) btnSim.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${mode === 'sim' ? activeClass : inactiveClass}`;
      if (btnRef) btnRef.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${mode === 'ref' ? activeClass : inactiveClass}`;

      refreshIcons();
    }

    function runArceCalculation() {
      const are = parseFloat(document.getElementById('arce-input-are-jour')?.value) || 0;
      const jours = parseFloat(document.getElementById('arce-input-jours')?.value) || 0;
      const capitalTotal = are * jours;
      const arceTotal = capitalTotal * 0.60;
      const v1 = arceTotal * 0.50;
      const v2 = arceTotal * 0.50;

      const capEl = document.getElementById('arce-res-capital-total');
      if (capEl) capEl.textContent = `${capitalTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      const totEl = document.getElementById('arce-res-total');
      if (totEl) totEl.textContent = `${arceTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      const v1El = document.getElementById('arce-res-v1');
      if (v1El) v1El.textContent = `${v1.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      const v2El = document.getElementById('arce-res-v2');
      if (v2El) v2El.textContent = `${v2.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;
    }

    function runMaintienCalculation() {
      const ca = parseFloat(document.getElementById('maint-input-recette')?.value) || 0;
      const are = parseFloat(document.getElementById('maint-input-are-jour')?.value) || 0;
      const salRef = parseFloat(document.getElementById('maint-input-salaire-ref')?.value) || 0;

      const arePleine = are * 30;
      const retenu = ca * 0.50; // abattement micro-entreprise
      const deduction = retenu * 0.70;
      let areVersee = Math.max(0, arePleine - deduction);

      if (retenu + areVersee > salRef) {
        areVersee = Math.max(0, salRef - retenu);
      }

      const joursPayes = Math.min(30, Math.round(areVersee / (are || 1)));
      const joursReportes = Math.max(0, 30 - joursPayes);

      const areEl = document.getElementById('maint-res-are-versee');
      if (areEl) areEl.textContent = `${areVersee.toFixed(2)} €`;

      const revEl = document.getElementById('maint-res-revenu-total');
      if (revEl) revEl.textContent = `${(retenu + areVersee).toFixed(2)} €`;

      const jpEl = document.getElementById('maint-res-jours-payes');
      if (jpEl) jpEl.textContent = `${joursPayes} jours payés`;

      const jrEl = document.getElementById('maint-res-jours-reportes');
      if (jrEl) jrEl.textContent = `+ ${joursReportes} j reportés`;
    }

    function resetAnsSimulators() {
      ftClearFields(['arce-input-are-jour', 'arce-input-jours', 'maint-input-recette', 'maint-input-are-jour', 'maint-input-salaire-ref']);
      runArceCalculation();
      runMaintienCalculation();
      showToast("Simulateurs ANS réinitialisés", "info");
    }

    function copyAnsAnalysis() {
      const arceTot = document.getElementById('arce-res-total')?.textContent || '0 €';
      const maintienAre = document.getElementById('maint-res-are-versee')?.textContent || '0 €';
      const text = `[COMPARATIF CRÉATION D'ENTREPRISE ANS]\n- Option 1 (ARCE en capital 60%) : ${arceTot} versé en 2 fractions.\n- Option 2 (Maintien mensuel ARE) : estimation complément de ${maintienAre} / mois avec report des jours non consommés.`;
      copyToClipboard(text);
      showToast("Comparatif ANS copié !", "success");
    }

    const CSP_BUBBLES = [
      { id: "asp_75", title: "Allocation ASP à 75%", category: "Indemnisation", summary: "ASP égale à 75% du salaire brut antérieur (~100% du net) pour ancienneté ≥ 1 an." },
      { id: "delai_21j", title: "Délai d'adhésion strict de 21 jours", category: "Adhésion", summary: "21 jours calendaires dès remise du document pour adhérer par écrit." },
      { id: "zero_carence", title: "Zéro délai d'attente ni différé", category: "Indemnisation", summary: "Prise en charge au lendemain de la rupture sans les 7 jours de carence ni différé CP." },
      { id: "reprise_activite", title: "Cumul activité reprise en CSP", category: "Accompagnement", summary: "Possibilité de cumuler avec des périodes de travail de 3 jours à 6 mois." },
      { id: "psp_obligatoire", title: "Plan de Sécurisation Professionnelle", category: "Accompagnement", summary: "Accompagnement renforcé avec rendez-vous sous 8 jours et formations prioritaires." },
      { id: "prime_reclassement", title: "Prime de reclassement rapide", category: "Financier", summary: "Versement de 50% des droits ASP restants si reprise en CDI/CDD ≥ 6 mois avant le 10e mois." }
    ];

    let activeCspBubbleId = 'asp_75';

    function initCspView() {
      renderCspBubbles();
      renderCspDetail();
      runCspCalculation();
      runCspReclassementCalculation();
    }

    function switchCspSubMode(mode) {
      const cond = document.getElementById('csp-subview-cond');
      const bubbles = document.getElementById('csp-subview-bubbles');
      const sim = document.getElementById('csp-subview-sim');
      const reclass = document.getElementById('csp-subview-reclass');

      const btnCond = document.getElementById('csp-btn-mode-cond');
      const btnBubbles = document.getElementById('csp-btn-mode-bubbles');
      const btnSim = document.getElementById('csp-btn-mode-sim');
      const btnReclass = document.getElementById('csp-btn-mode-reclass');

      const activeClass = "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-sm";
      const inactiveClass = "text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium";

      if (cond) cond.classList.toggle('hidden', mode !== 'cond');
      if (bubbles) bubbles.classList.toggle('hidden', mode !== 'bubbles');
      if (sim) sim.classList.toggle('hidden', mode !== 'sim');
      if (reclass) reclass.classList.toggle('hidden', mode !== 'reclass');

      if (btnCond) btnCond.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${mode === 'cond' ? activeClass : inactiveClass}`;
      if (btnBubbles) btnBubbles.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${mode === 'bubbles' ? activeClass : inactiveClass}`;
      if (btnSim) btnSim.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${mode === 'sim' ? activeClass : inactiveClass}`;
      if (btnReclass) btnReclass.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${mode === 'reclass' ? activeClass : inactiveClass}`;

      if (mode === 'reclass') {
        runCspReclassementCalculation();
      }

      refreshIcons();
    }

    function renderCspBubbles() {
      const container = document.getElementById('csp-bubbles-container');
      if (!container) return;

      container.innerHTML = CSP_BUBBLES.map(b => {
        const isSel = b.id === activeCspBubbleId;
        return `
          <div onclick="selectCspBubble('${b.id}')" class="p-3.5 rounded-xl border cursor-pointer transition-all ${
            isSel ? 'bg-blue-600/20 border-cyan-400 shadow-lg' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="text-[10px] text-cyan-400 font-mono">${b.category}</span>
            </div>
            <h4 class="text-xs font-bold ${isSel ? 'text-cyan-300' : 'text-white'}">${escapeHtml(b.title)}</h4>
            <p class="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">${escapeHtml(b.summary)}</p>
          </div>
        `;
      }).join('');
      refreshIcons();
    }

    function selectCspBubble(id) {
      activeCspBubbleId = id;
      renderCspBubbles();
      renderCspDetail();
    }

    function renderCspDetail() {
      const pane = document.getElementById('csp-detail-pane');
      const b = CSP_BUBBLES.find(x => x.id === activeCspBubbleId) || CSP_BUBBLES[0];
      if (!pane || !b) return;

      pane.innerHTML = `
        <div class="space-y-3 text-xs">
          <span class="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">${b.category}</span>
          <h3 class="font-bold text-white text-sm leading-snug">${escapeHtml(b.title)}</h3>
          <p class="text-slate-300 leading-relaxed">${escapeHtml(b.summary)}</p>
          <div class="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-400">
            <span class="text-white font-semibold">Conséquence sur le dossier :</span>
            <p>Ce volet s'applique automatiquement dès réception du bulletin d'adhésion CSP signé sous réserve de l'attestation employeur économique.</p>
          </div>
        </div>
      `;
    }

    function runCspCalculation() {
      const salaire = parseFloat(document.getElementById('csp-sim-salaire')?.value) || 0;
      const anc = document.getElementById('csp-sim-anciennete')?.value || 'sup1an';
      const isSup1an = anc === 'sup1an';
      const sjrCsp = salaire / 30.42;
      const areCsp = ftAreJour(sjrCsp).aj;
      const aspJour = salaire > 0 ? Math.min(BAREME.are.max, Math.max(isSup1an ? BAREME.csp.taux * sjrCsp : areCsp, BAREME.csp.aspMin, areCsp)) : 0;
      const aspMois = aspJour * 30;
      const areMois = areCsp * 30;

      const aspEl = document.getElementById('csp-res-asp-mensuelle');
      if (aspEl) aspEl.textContent = `${aspMois.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      const areEl = document.getElementById('csp-res-are-mensuelle');
      if (areEl) areEl.textContent = `${areMois.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      const gainEl = document.getElementById('csp-res-gain-total');
      if (gainEl) gainEl.textContent = `+ ${(aspMois - areMois).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € / mois`;
    }

    function setCspReclassScenario(type) {
      const salAnt = document.getElementById('csp-rec-salaire-ant');
      const anc = document.getElementById('csp-rec-anciennete');
      const mois = document.getElementById('csp-rec-mois');
      const contrat = document.getElementById('csp-rec-contrat');
      const nouvSal = document.getElementById('csp-rec-nouveau-salaire');

      if (type === 'reprise_m4') {
        if (salAnt) salAnt.value = '2800';
        if (anc) anc.value = 'sup1an';
        if (mois) mois.value = '4';
        if (contrat) contrat.value = 'cdi';
        if (nouvSal) nouvSal.value = '2800';
      } else if (type === 'perte_salaire') {
        if (salAnt) salAnt.value = '2800';
        if (anc) anc.value = 'sup1an';
        if (mois) mois.value = '6';
        if (contrat) contrat.value = 'cdi';
        if (nouvSal) nouvSal.value = '2200';
      } else if (type === 'tardive_m11') {
        if (salAnt) salAnt.value = '2800';
        if (anc) anc.value = 'sup1an';
        if (mois) mois.value = '11';
        if (contrat) contrat.value = 'cdi';
        if (nouvSal) nouvSal.value = '2200';
      } else if (type === 'cdd_court') {
        if (salAnt) salAnt.value = '2800';
        if (anc) anc.value = 'sup1an';
        if (mois) mois.value = '3';
        if (contrat) contrat.value = 'cdd_inf6m';
        if (nouvSal) nouvSal.value = '2400';
      }

      runCspReclassementCalculation();
      showToast("Scénario appliqué au simulateur", "info");
    }

    function resetCspReclassement() {
      ftClearFields(['csp-rec-salaire-ant', 'csp-rec-mois', 'csp-rec-nouveau-salaire']);
      runCspReclassementCalculation();
      showToast("Paramètres reclassement réinitialisés", "info");
    }

    function runCspReclassementCalculation() {
      const salAnt = parseFloat(document.getElementById('csp-rec-salaire-ant')?.value) || 0;
      const anc = document.getElementById('csp-rec-anciennete')?.value || 'sup1an';
      const moisReprise = parseInt(document.getElementById('csp-rec-mois')?.value, 10) || 0;
      const contrat = document.getElementById('csp-rec-contrat')?.value || 'cdi';
      const nouvSal = parseFloat(document.getElementById('csp-rec-nouveau-salaire')?.value) || 0;

      const moisBadge = document.getElementById('csp-rec-mois-badge');
      const moisRestants = Math.max(0, 12 - moisReprise);
      if (moisBadge) {
        moisBadge.textContent = `${moisReprise}e mois (${moisRestants} mois restants)`;
        moisBadge.className = `font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
          moisReprise <= 10 ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'
        }`;
      }

      const diff = salAnt - nouvSal;
      const diffLabel = document.getElementById('csp-rec-diff-label');
      if (diffLabel) {
        if (diff > 0) {
          const pct = salAnt > 0 ? ((diff / salAnt) * 100).toFixed(1) : 0;
          diffLabel.textContent = `Baisse de rémunération de ${diff.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € / mois (-${pct}%)`;
          diffLabel.className = "block text-[10px] text-amber-300 mt-1 font-medium";
        } else if (diff < 0) {
          diffLabel.textContent = `Gain de rémunération de ${Math.abs(diff).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € / mois (+ supérieur au salaire antérieur)`;
          diffLabel.className = "block text-[10px] text-emerald-400 mt-1 font-medium";
        } else {
          diffLabel.textContent = "Salaire identique au précédent (aucune perte de rémunération)";
          diffLabel.className = "block text-[10px] text-slate-400 mt-1 font-medium";
        }
      }

      // Criterion checks
      const isContratValide = contrat !== 'cdd_inf6m';
      const isAncienneteValide = anc === 'sup1an';
      const isDelaiPrimeValide = moisReprise <= 10;
      const isDelaiIdrValide = moisReprise <= 12;

      const updateTag = (id, valid, text) => {
        const el = document.getElementById(id);
        const tag = document.getElementById(`${id}-tag`);
        if (tag) {
          tag.textContent = text;
          tag.className = `font-mono text-[10px] font-semibold ${valid ? 'text-emerald-400' : 'text-rose-400'}`;
        }
        if (el) {
          const icon = el.querySelector('i');
          if (icon) {
            icon.setAttribute('data-lucide', valid ? 'check-circle' : 'x-circle');
            icon.className = `w-3.5 h-3.5 ${valid ? 'text-emerald-400' : 'text-rose-400'}`;
          }
        }
      };

      updateTag('rec-chk-contrat', isContratValide, isContratValide ? 'Validé (≥ 6m)' : 'Inéligible (< 6m)');
      updateTag('rec-chk-anciennete', isAncienneteValide, isAncienneteValide ? 'ASP 75%' : 'Inéligible (ARE-CSP)');
      updateTag('rec-chk-delai-prime', isDelaiPrimeValide, isDelaiPrimeValide ? `Mois ${moisReprise} / 10` : 'Forclos (> M10)');
      updateTag('rec-chk-delai-idr', isDelaiIdrValide, isDelaiIdrValide ? `Mois ${moisReprise} / 12` : 'Forclos (> M12)');

      // Calculations
      const sjrRec = salAnt / 30;
      const aspMensuelle = salAnt > 0 ? Math.min(BAREME.are.max, Math.max(BAREME.csp.taux * sjrRec, ftAreJour(sjrRec).aj, BAREME.csp.aspMin)) * 30 : 0;
      const reliquatAspTotal = moisRestants * aspMensuelle;

      // 1. Prime de Reclassement
      const isPrimeEligible = isContratValide && isAncienneteValide && isDelaiPrimeValide && moisRestants > 0;
      const primeTotale = isPrimeEligible ? (reliquatAspTotal * 0.50) : 0;
      const primeV1 = primeTotale * 0.50;
      const primeV2 = primeTotale * 0.50;

      const elPrimeStatus = document.getElementById('csp-rec-prime-status');
      if (elPrimeStatus) {
        elPrimeStatus.textContent = isPrimeEligible ? 'Éligible' : (!isDelaiPrimeValide ? 'Forclos (> 10e mois)' : 'Non éligible');
        elPrimeStatus.className = `text-[10px] font-mono px-2 py-0.5 rounded border ${
          isPrimeEligible ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
        }`;
      }

      const elReliquat = document.getElementById('csp-rec-reliquat-total');
      if (elReliquat) elReliquat.textContent = `${reliquatAspTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      const elPrimeTot = document.getElementById('csp-rec-prime-totale');
      if (elPrimeTot) elPrimeTot.textContent = `${primeTotale.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      const elPrimeV1 = document.getElementById('csp-rec-prime-v1');
      if (elPrimeV1) elPrimeV1.textContent = `${primeV1.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      const elPrimeV2 = document.getElementById('csp-rec-prime-v2');
      if (elPrimeV2) elPrimeV2.textContent = `${primeV2.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      // 2. Indemnité Différentielle de Reclassement (IDR)
      const isIdrEligible = isContratValide && isAncienneteValide && isDelaiIdrValide && diff > 0 && moisRestants > 0;
      const plafondIdrMensuel = aspMensuelle * 0.50;
      const idrMensuelle = isIdrEligible ? diff : 0;
      const idrTotal = isIdrEligible ? Math.min(reliquatAspTotal * BAREME.csp.plafond, idrMensuelle * BAREME.csp.idrMois) : 0;

      const elIdrStatus = document.getElementById('csp-rec-idr-status');
      if (elIdrStatus) {
        elIdrStatus.textContent = isIdrEligible ? 'Éligible' : (diff <= 0 ? 'Sans perte de salaire' : 'Non éligible');
        elIdrStatus.className = `text-[10px] font-mono px-2 py-0.5 rounded border ${
          isIdrEligible ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
        }`;
      }

      const elIdrPerte = document.getElementById('csp-rec-idr-perte');
      if (elIdrPerte) elIdrPerte.textContent = `${Math.max(0, diff).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € / mois`;

      const elIdrPlafond = document.getElementById('csp-rec-idr-plafond');
      if (elIdrPlafond) elIdrPlafond.textContent = `${(reliquatAspTotal * BAREME.csp.plafond).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € au total`;

      const elIdrMens = document.getElementById('csp-rec-idr-mensuelle');
      if (elIdrMens) elIdrMens.textContent = `${idrMensuelle.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € / mois`;

      const elIdrTot = document.getElementById('csp-rec-idr-total');
      if (elIdrTot) elIdrTot.textContent = `${idrTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      // 3. Banner Arbitrage & Recommendation
      const banner = document.getElementById('csp-rec-banner');
      const bTitle = document.getElementById('csp-rec-banner-title');
      const bDesc = document.getElementById('csp-rec-banner-desc');
      const bPill = document.getElementById('csp-rec-verdict-pill');

      if (banner && bTitle && bDesc && bPill) {
        if (!isContratValide || !isAncienneteValide) {
          bTitle.textContent = "INÉLIGIBLE AUX DISPOSITIFS DE RECLASSEMENT";
          bTitle.className = "text-base font-extrabold text-rose-400 leading-tight";
          bDesc.textContent = !isAncienneteValide 
            ? "L'adhérent a moins d'un an d'ancienneté (bénéficiaire de l'ARE-CSP) : les articles 17 et 18 sont réservés aux allocataires de l'ASP."
            : "Le contrat de reprise doit être un CDI, un CDD d'au moins 6 mois ou un contrat d'intérim d'au moins 6 mois.";
          bPill.textContent = "Non Éligible";
          bPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30";
          banner.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40";
        } else if (isPrimeEligible && isIdrEligible) {
          if (primeTotale >= idrTotal) {
            const gain = primeTotale - idrTotal;
            bTitle.textContent = "PRIME DE RECLASSEMENT PLUS AVANTAGEUSE";
            bTitle.className = "text-base font-extrabold text-cyan-300 leading-tight";
            bDesc.textContent = `La Prime de Reclassement (${primeTotale.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € en 2 fois) procure un gain net supérieur de ${gain.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € par rapport à l'IDR, et reste acquise sans aléa.`;
            bPill.textContent = "Prime Recommandée";
            bPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
            banner.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-500/40";
          } else {
            const gain = idrTotal - primeTotale;
            bTitle.textContent = "IDR MENSUELLE PLUS AVANTAGEUSE SUR LA DURÉE";
            bTitle.className = "text-base font-extrabold text-amber-300 leading-tight";
            bDesc.textContent = `L'Indemnité Différentielle de Reclassement (${idrMensuelle.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €/mois, total ${idrTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €) procure un cumul supérieur de ${gain.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € par rapport à la Prime.`;
            bPill.textContent = "IDR Recommandée";
            bPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30";
            banner.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40";
          }
        } else if (isPrimeEligible && !isIdrEligible) {
          bTitle.textContent = "PRIME DE RECLASSEMENT DE PLEIN DROIT";
          bTitle.className = "text-base font-extrabold text-emerald-300 leading-tight";
          bDesc.textContent = `Aucune baisse de salaire constatée : l'adhérent a droit à la prime forfaitaire de 50% du reliquat ASP, soit ${primeTotale.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € en 2 versements de ${primeV1.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €.`;
          bPill.textContent = "Prime Validée";
          bPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
          banner.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40";
        } else if (!isPrimeEligible && isIdrEligible) {
          bTitle.textContent = "INDEMNITÉ DIFFÉRENTIELLE (IDR) ACCORDÉE";
          bTitle.className = "text-base font-extrabold text-purple-300 leading-tight";
          bDesc.textContent = `Reprise d'emploi au-delà du 10e mois : la Prime de reclassement est forclose, mais l'IDR compense la baisse à hauteur de ${idrMensuelle.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € par mois jusqu'au terme du CSP.`;
          bPill.textContent = "IDR Seule";
          bPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30";
          banner.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border-purple-500/40";
        } else {
          bTitle.textContent = "AUCUNE INDEMNITÉ DE RECLASSEMENT APPLICABLE";
          bTitle.className = "text-base font-extrabold text-slate-300 leading-tight";
          bDesc.textContent = "Les conditions temporelles ou financières d'attribution de la prime et de l'IDR ne sont pas réunies.";
          bPill.textContent = "Information";
          bPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700";
          banner.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-slate-900 border-slate-800";
        }
      }

      // Adviser Note
      const noteEl = document.getElementById('csp-rec-adviser-note');
      if (noteEl) {
        if (isPrimeEligible && (!isIdrEligible || primeTotale >= idrTotal)) {
          noteEl.textContent = `Félicitations pour votre reprise d'emploi. En qualité de bénéficiaire du CSP ayant retrouvé un emploi en contrat de 6 mois ou plus avant la fin du 10e mois, vous bénéficiez de la Prime de Reclassement (Art. 17 Convention CSP) d'un montant total brut de ${primeTotale.toFixed(2)} € (soit 50% de vos droits ASP restants).\n\nModalités de versement :\n- 1er versement de ${primeV1.toFixed(2)} € dès transmission de votre contrat de travail et du formulaire de demande.\n- 2nd versement de ${primeV2.toFixed(2)} € après 3 mois d'activité sur présentation d'une attestation de présence employeur.`;
        } else if (isIdrEligible) {
          noteEl.textContent = `Dans le cadre de votre reprise d'emploi moins rémunérée durant votre CSP, vous bénéficiez de l'Indemnité Différentielle de Reclassement (IDR - Art. 18 Convention CSP).\n\nCette allocation mensuelle d'un montant de ${idrMensuelle.toFixed(2)} € vient compenser la perte de salaire constatée chaque mois lors de votre actualisation, dans la limite de ${idrTotal.toFixed(2)} € au total.\n\nMerci de nous faire parvenir votre contrat de travail et vos bulletins de paie mensuels dès leur réception.`;
        } else {
          noteEl.textContent = `Information CSP : la reprise d'emploi déclarée ne permet pas l'ouverture de la Prime au reclassement rapide ni de l'IDR (critères de durée de contrat ≥ 6 mois, d'ancienneté ou de délai non remplis).`;
        }
      }

      refreshIcons();
    }

    function copyCspReclassNote() {
      const text = document.getElementById('csp-rec-adviser-note')?.textContent || '';
      copyToClipboard(text);
      showToast("Note CVM Reclassement copiée !", "success");
    }

    function initComplementAreView() {
      runComplementAreCalculation();
    }

    function runComplementAreCalculation() {
      const brut = parseFloat(document.getElementById('care-input-salaire-brut')?.value) || 0;
      const areJour = parseFloat(document.getElementById('care-input-are-jour')?.value) || 0;
      const salRef = parseFloat(document.getElementById('care-input-salaire-ref')?.value) || 0;

      const arePleine = areJour * 30;
      const deduction = brut * 0.70;
      let areVersee = Math.max(0, arePleine - deduction);

      if (brut + areVersee > salRef) {
        areVersee = Math.max(0, salRef - brut);
      }

      const joursPayes = Math.min(30, Math.round(areVersee / (areJour || 1)));
      const joursReportes = Math.max(0, 30 - joursPayes);

      const resAre = document.getElementById('care-res-are-versee');
      if (resAre) resAre.textContent = `${areVersee.toFixed(2)} €`;

      const resRev = document.getElementById('care-res-revenu-global');
      if (resRev) resRev.textContent = `${(brut + areVersee).toFixed(2)} €`;

      const resReport = document.getElementById('care-res-report');
      if (resReport) resReport.textContent = `${joursPayes} j payés (+ ${joursReportes} j reportés)`;

      const note = document.getElementById('care-adviser-note');
      if (note) {
        note.textContent = `Pour un salaire brut de ${brut} €, votre complément ARE s'élève à ${areVersee.toFixed(2)} €. Vos ${joursReportes} jours non payés ce mois sont reportés et reculent le terme de votre droit.`;
      }
    }

    function resetComplementAreSimulator() {
      ftClearFields(['care-input-salaire-brut', 'care-input-heures', 'care-input-are-jour', 'care-input-salaire-ref']);
      runComplementAreCalculation();
      showToast("Simulateur Complément ARE réinitialisé", "info");
    }

    function copyComplementAreNote() {
      const note = document.getElementById('care-adviser-note')?.textContent || '';
      copyToClipboard(note);
      showToast("Note Complément ARE copiée !", "success");
    }

    let indusCalculationMode = 'duree'; // 'duree' or 'montant'
    let indusTypeMode = 'unique'; // 'unique' or 'multi'
    let indusList = [];

    function initIndusView() {
      renderIndusItemsList();
      runIndusCalculation();
    }

    function setIndusTypeMode(type) {
      indusTypeMode = type;
      const btnUnique = document.getElementById('indus-type-btn-unique');
      const btnMulti = document.getElementById('indus-type-btn-multi');
      const containerUnique = document.getElementById('indus-container-unique-amount');
      const containerMulti = document.getElementById('indus-container-multi-items');

      if (type === 'unique') {
        if (btnUnique) btnUnique.className = "flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border font-semibold transition-all bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px]";
        if (btnMulti) btnMulti.className = "flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border font-semibold transition-all bg-slate-950 text-slate-400 hover:text-white border-slate-800 text-[11px]";
        if (containerUnique) containerUnique.classList.remove('hidden');
        if (containerMulti) containerMulti.classList.add('hidden');
      } else {
        if (btnUnique) btnUnique.className = "flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border font-semibold transition-all bg-slate-950 text-slate-400 hover:text-white border-slate-800 text-[11px]";
        if (btnMulti) btnMulti.className = "flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border font-semibold transition-all bg-amber-500/20 text-amber-300 border-amber-500/40 text-[11px]";
        if (containerUnique) containerUnique.classList.add('hidden');
        if (containerMulti) containerMulti.classList.remove('hidden');
      }

      runIndusCalculation();
      refreshIcons();
    }

    function renderIndusItemsList() {
      const container = document.getElementById('indus-items-list');
      if (!container) return;

      if (indusList.length === 0) {
        container.innerHTML = `<div class="p-3 text-center text-xs text-slate-500 italic bg-slate-900/40 rounded-lg">Aucun trop-perçu dans la liste. Cliquez sur « Ajouter un trop-perçu ».</div>`;
        updateIndusMultiBadges(0, 0);
        return;
      }

      let total = 0;
      container.innerHTML = indusList.map((item, index) => {
        total += Number(item.montant) || 0;
        return `
          <div class="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-slate-300 text-[11px] flex items-center gap-1">
                <span class="w-4 h-4 rounded bg-amber-500/20 text-amber-400 text-[9px] flex items-center justify-center font-mono">${index + 1}</span>
                <span>Créance #${index + 1}</span>
              </span>
              <button type="button" onclick="removeIndusItem(${item.id})" class="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors" title="Supprimer ce trop-perçu">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <div class="sm:col-span-4">
                <label class="block text-[9px] text-slate-400 mb-0.5">Allocation / Nature</label>
                <select onchange="updateIndusItem(${item.id}, 'nature', this.value)" class="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-white outline-none">
                  <option value="ARE" ${item.nature === 'ARE' ? 'selected' : ''}>Trop-perçu ARE</option>
                  <option value="ASS" ${item.nature === 'ASS' ? 'selected' : ''}>Trop-perçu ASS</option>
                  <option value="CSP" ${item.nature === 'CSP' ? 'selected' : ''}>Trop-perçu CSP / ASP</option>
                  <option value="ARCE" ${item.nature === 'ARCE' ? 'selected' : ''}>Trop-perçu ARCE</option>
                  <option value="Formation" ${item.nature === 'Formation' ? 'selected' : ''}>RFF / Formation</option>
                  <option value="Autre" ${item.nature === 'Autre' ? 'selected' : ''}>Autre créance FT</option>
                </select>
              </div>

              <div class="sm:col-span-5">
                <label class="block text-[9px] text-slate-400 mb-0.5">Période / Motif / Réf.</label>
                <input type="text" value="${escapeHtml(item.ref || '')}" placeholder="Ex: Janvier 2026" oninput="updateIndusItem(${item.id}, 'ref', this.value)" class="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-white outline-none">
              </div>

              <div class="sm:col-span-3">
                <label class="block text-[9px] text-slate-400 mb-0.5">Montant (€)</label>
                <input type="number" min="1" step="5" value="${item.montant || 0}" oninput="updateIndusItem(${item.id}, 'montant', parseFloat(this.value) || 0)" class="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 focus:border-amber-400 font-bold text-xs text-amber-300 outline-none">
              </div>
            </div>
          </div>
        `;
      }).join('');

      updateIndusMultiBadges(indusList.length, total);
      refreshIcons();
    }

    function updateIndusMultiBadges(count, total) {
      const countBadge = document.getElementById('indus-multi-count-badge');
      const totalBadge = document.getElementById('indus-multi-total-badge');
      if (countBadge) countBadge.textContent = `${count} trop-perçu${count > 1 ? 's' : ''} regroupé${count > 1 ? 's' : ''}`;
      if (totalBadge) totalBadge.textContent = `${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;
    }

    function addIndusItem() {
      const newId = Date.now();
      indusList.push({
        id: newId,
        nature: 'ARE',
        ref: 'Nouvelle période',
        montant: 300
      });
      renderIndusItemsList();
      runIndusCalculation();
      showToast("Nouveau trop-perçu ajouté au cumul", "info");
    }

    function removeIndusItem(id) {
      indusList = indusList.filter(item => item.id !== id);
      renderIndusItemsList();
      runIndusCalculation();
      showToast("Trop-perçu retiré du cumul", "info");
    }

    function updateIndusItem(id, field, value) {
      const item = indusList.find(x => x.id === id);
      if (item) {
        item[field] = value;
        if (field === 'montant') {
          const total = indusList.reduce((acc, curr) => acc + (Number(curr.montant) || 0), 0);
          updateIndusMultiBadges(indusList.length, total);
        }
        runIndusCalculation();
      }
    }

    function getIndusTotalAmount() {
      if (indusTypeMode === 'multi') {
        return indusList.reduce((acc, curr) => acc + (Number(curr.montant) || 0), 0);
      }
      return parseFloat(document.getElementById('indus-input-montant')?.value) || 0;
    }

    function setIndusMode(mode) {
      indusCalculationMode = mode;
      const btnDuree = document.getElementById('indus-btn-mode-duree');
      const btnMontant = document.getElementById('indus-btn-mode-montant');
      const containerDuree = document.getElementById('indus-container-duree');
      const containerMontant = document.getElementById('indus-container-montant');

      if (mode === 'duree') {
        if (btnDuree) btnDuree.className = "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md";
        if (btnMontant) btnMontant.className = "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all";
        if (containerDuree) containerDuree.classList.remove('hidden');
        if (containerMontant) containerMontant.classList.add('hidden');
      } else {
        if (btnDuree) btnDuree.className = "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all";
        if (btnMontant) btnMontant.className = "flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md";
        if (containerDuree) containerDuree.classList.add('hidden');
        if (containerMontant) containerMontant.classList.remove('hidden');
      }
      runIndusCalculation();
    }

    function setIndusDureePreset(mois) {
      const input = document.getElementById('indus-input-duree');
      const range = document.getElementById('indus-range-duree');
      if (input) input.value = mois;
      if (range) range.value = Math.min(36, mois);
      setIndusMode('duree');
      showToast(`Durée fixée à ${mois} mois`, "info");
    }

    function setIndusMontantPreset(montant) {
      const input = document.getElementById('indus-input-mensualite');
      if (input) input.value = montant;
      setIndusMode('montant');
      showToast(`Mensualité fixée à ${montant} €/mois`, "info");
    }

    function syncIndusDureeFromRange(val) {
      const input = document.getElementById('indus-input-duree');
      if (input) input.value = val;
      runIndusCalculation();
    }

    function syncIndusDureeFromInput(val) {
      const range = document.getElementById('indus-range-duree');
      const numericVal = parseInt(val, 10) || 1;
      if (range) range.value = Math.min(36, Math.max(1, numericVal));
      runIndusCalculation();
    }

    function runIndusCalculation() {
      const totalDette = getIndusTotalAmount();
      let nbMois = 12;
      let mensualite = 0;
      let derniereMensualite = 0;
      let aAjustement = false;

      if (indusCalculationMode === 'duree') {
        nbMois = parseInt(document.getElementById('indus-input-duree')?.value, 10) || 1;
        if (nbMois < 1) nbMois = 1;
        
        const badgeDuree = document.getElementById('indus-duree-display-badge');
        if (badgeDuree) badgeDuree.textContent = `${nbMois} mois`;

        // Calcul avec centimes tronqués puis solde
        mensualite = Math.floor((totalDette / nbMois) * 100) / 100;
        derniereMensualite = Math.round((totalDette - (mensualite * (nbMois - 1))) * 100) / 100;
        if (Math.abs(derniereMensualite - mensualite) > 0.01) {
          aAjustement = true;
        }
      } else {
        // Mode par montant mensuel cible
        mensualite = parseFloat(document.getElementById('indus-input-mensualite')?.value) || 0;
        if (mensualite <= 0) mensualite = 10;

        const badgeMontant = document.getElementById('indus-montant-display-badge');
        if (badgeMontant) badgeMontant.textContent = `${mensualite.toFixed(2)} € / mois`;

        if (totalDette <= mensualite) {
          nbMois = 1;
          mensualite = totalDette;
          derniereMensualite = totalDette;
          aAjustement = false;
        } else {
          const nbComplets = Math.floor(totalDette / mensualite);
          const reliquat = Math.round((totalDette - (nbComplets * mensualite)) * 100) / 100;
          if (reliquat > 0.01) {
            nbMois = nbComplets + 1;
            derniereMensualite = reliquat;
            aAjustement = true;
          } else {
            nbMois = nbComplets;
            derniereMensualite = mensualite;
            aAjustement = false;
          }
        }
      }

      // Faisabilité légale
      const isDirect = nbMois <= 24;
      const isDerog = nbMois > 24 && nbMois <= 36;

      // Verdict UI
      const card = document.getElementById('indus-verdict-card');
      const pill = document.getElementById('indus-verdict-pill');
      const title = document.getElementById('indus-verdict-title');
      const desc = document.getElementById('indus-verdict-desc');

      if (card && pill && title && desc) {
        if (isDirect) {
          card.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40";
          pill.textContent = indusTypeMode === 'multi' ? "Accord Global de Plein Droit" : "Accord de plein droit";
          pill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
          title.textContent = indusTypeMode === 'multi' ? "ÉCHÉANCIER GLOBAL VALIDÉ SANS JUSTIFICATIF" : "ÉCHÉANCIER ACCORDÉ SANS JUSTIFICATIF";
          title.className = "text-sm font-extrabold text-emerald-300 leading-tight";
          desc.textContent = `La durée est ≤ 24 mois : ce plan amiable ${indusTypeMode === 'multi' ? 'regroupant l\'ensemble de vos créances' : ''} peut être validé immédiatement sans dossier de ressources.`;
        } else if (isDerog) {
          card.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40";
          pill.textContent = "Dérogation requise";
          pill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30";
          title.textContent = "DURÉE ENTRE 25 ET 36 MOIS";
          title.className = "text-sm font-extrabold text-amber-300 leading-tight";
          desc.textContent = "Examen de la situation financière requis (formulaire ressources et charges) avec accord du responsable d'agence.";
        } else {
          card.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40";
          pill.textContent = "Dépassement amiable";
          pill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30";
          title.textContent = "DURÉE > 36 MOIS (HORS CADRE DIRECT)";
          title.className = "text-sm font-extrabold text-rose-300 leading-tight";
          desc.textContent = "Au-delà de 3 ans, l'agence ne peut valider ce plan sans saisine de l'IPR pour remise de dette ou hausse de la mensualité.";
        }
      }

      // Display metrics
      const elMens = document.getElementById('indus-res-mensualite');
      const elDuree = document.getElementById('indus-res-duree');
      const elDetail = document.getElementById('indus-res-detail-echeances');
      const elTotal = document.getElementById('indus-res-total-rembourse');

      if (elMens) elMens.textContent = `${mensualite.toFixed(2)} € / mois`;
      if (elDuree) elDuree.textContent = `${nbMois} mois`;
      if (elTotal) {
        elTotal.textContent = `${totalDette.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;
      }

      if (elDetail) {
        if (nbMois === 1) {
          elDetail.textContent = "1 versement unique de régularisation intégrale.";
        } else if (aAjustement) {
          elDetail.textContent = `${nbMois - 1} mensualité(s) de ${mensualite.toFixed(2)} € + 1 solde de ${derniereMensualite.toFixed(2)} €`;
        } else {
          elDetail.textContent = `${nbMois} mensualités constantes de ${mensualite.toFixed(2)} €`;
        }
      }

      // Generate CVM Note
      const noteEl = document.getElementById('indus-adviser-note');
      if (noteEl) {
        let note = `Madame, Monsieur,\n\n`;

        if (indusTypeMode === 'multi') {
          note += `Suite à l'analyse globale de votre dossier, plusieurs trop-perçus ont été constatés sur votre compte :\n`;
          indusList.forEach((item, idx) => {
            note += `• Créance n°${idx + 1} (${item.nature} - ${item.ref || 'Période déclarée'}) : ${(Number(item.montant) || 0).toFixed(2)} €\n`;
          });
          note += `Soit une dette globale consolidée de ${totalDette.toFixed(2)} €.\n\n`;
          note += `Afin de vous éviter des retenues multiples et de faciliter votre budget, nous mettons en place un échéancier unique et global pour l'ensemble de ces créances.\n\n`;
        } else {
          note += `Suite à l'analyse de votre dossier, un indu d'un montant total de ${totalDette.toFixed(2)} € a été constaté.\n\n`;
        }
        
        if (indusCalculationMode === 'montant') {
          note += `Selon votre proposition de versement mensuel de ${mensualite.toFixed(2)} €, nous vous proposons un plan d'échelonnement sur ${nbMois} mois :\n`;
        } else {
          note += `Dans le cadre des modalités d'apurement amiable France Travail, nous vous proposons un plan d'échelonnement sur ${nbMois} mois :\n`;
        }

        if (aAjustement && nbMois > 1) {
          note += `• ${nbMois - 1} mensualités de ${mensualite.toFixed(2)} € par mois\n`;
          note += `• 1 dernière mensualité de solde de ${derniereMensualite.toFixed(2)} €\n\n`;
        } else if (nbMois === 1) {
          note += `• 1 versement unique de régularisation de ${totalDette.toFixed(2)} €\n\n`;
        } else {
          note += `• ${nbMois} mensualités de ${mensualite.toFixed(2)} € par mois\n\n`;
        }

        if (isDirect) {
          note += `Ce plan d'apurement est validable immédiatement. Merci de nous confirmer votre accord en réponse à ce message ou directement depuis votre espace personnel sous 15 jours.\n\n`;
        } else if (isDerog) {
          note += `La durée retenue dépassant 24 mois, la validation définitive de cet échéancier est subordonnée au retour du questionnaire de ressources et charges mis à votre disposition.\n\n`;
        } else {
          note += `Cet étalement excédant le cadre usuel de 36 mois, nous vous invitons à réévaluer votre proposition ou à formuler une demande de remise gracieuse auprès de l'Instance Paritaire Régionale (IPR).\n\n`;
        }

        note += `Nous restons à votre disposition au 3949 pour toute précision.\nVotre conseiller France Travail`;
        noteEl.textContent = note;
      }

      refreshIcons();
    }

    function resetIndusSimulator() {
      ftClearFields(['indus-input-montant', 'indus-input-duree', 'indus-input-mensualite']);
      indusList = [];
      setIndusTypeMode('unique');
      setIndusMode('duree');
      renderIndusItemsList();
      showToast("Simulateur Indus réinitialisé", "info");
    }

    function copyIndusNote() {
      const note = document.getElementById('indus-adviser-note')?.textContent || '';
      copyToClipboard(note);
      showToast("Proposition Indus copiée !", "success");
    }

    function initIccpView() {
      runCibtpCalculation();
    }

    function setCibtpPreset(presetKey) {
      const timingAvant = document.getElementById('cibtp-timing-avant');
      const timingApres = document.getElementById('cibtp-timing-apres');
      const dateDebut = document.getElementById('cibtp-date-debut');
      const dateFct = document.getElementById('cibtp-date-fct');
      const joursRestants = document.getElementById('cibtp-jours-restants');
      const joursPayes = document.getElementById('cibtp-jours-payes');

      if (presetKey === 'page1') {
        // Page 1: FCT 31/08/2025 -> Payé avant la FCT (153j -> 13j ouvrables -> (4+13)*7/6 = 19.83 -> 19 jours)
        if (timingAvant) timingAvant.checked = true;
        if (timingApres) timingApres.checked = false;
        if (dateDebut) dateDebut.value = '2025-04-01';
        if (dateFct) dateFct.value = '2025-08-31';
        if (joursRestants) joursRestants.value = '4';
        if (joursPayes) joursPayes.value = '24';
        showToast("Exemple Page 1 appliqué : FCT 31/08/2025 (Payé AVANT)", "info");
      } else if (presetKey === 'page2') {
        // Page 2: FCT 30/06/2025 -> Payé après la FCT (91j -> 8j ouvrables -> (4+24+8)*7/6 = 42 jours)
        if (timingAvant) timingAvant.checked = false;
        if (timingApres) timingApres.checked = true;
        if (dateDebut) dateDebut.value = '2025-04-01';
        if (dateFct) dateFct.value = '2025-06-30';
        if (joursRestants) joursRestants.value = '4';
        if (joursPayes) joursPayes.value = '24';
        showToast("Exemple Page 2 appliqué : FCT 30/06/2025 (Payé APRÈS)", "info");
      }

      runCibtpCalculation();
    }

    function resetCibtpSimulator() {
      const avant = document.getElementById('cibtp-timing-avant');
      const apres = document.getElementById('cibtp-timing-apres');
      if (avant) avant.checked = true;
      if (apres) apres.checked = false;
      ftClearFields(['cibtp-date-debut', 'cibtp-date-fct', 'cibtp-jours-restants', 'cibtp-jours-payes']);
      runCibtpCalculation();
      showToast("Simulateur CIBTP réinitialisé", "info");
    }

    function runCibtpCalculation() {
      const isPayeApres = document.getElementById('cibtp-timing-apres')?.checked || false;
      const dateDebutStr = document.getElementById('cibtp-date-debut')?.value || '';
      const dateFctStr = document.getElementById('cibtp-date-fct')?.value || '';
      const joursRestants = parseFloat(document.getElementById('cibtp-jours-restants')?.value) || 0;
      const joursPayes = parseFloat(document.getElementById('cibtp-jours-payes')?.value) || 0;

      // Update timing radio styles
      const labelAvant = document.getElementById('cibtp-mode-label-avant');
      const labelApres = document.getElementById('cibtp-mode-label-apres');
      const badgePayes = document.getElementById('cibtp-badge-payes');

      if (labelAvant && labelApres) {
        if (!isPayeApres) {
          labelAvant.className = "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all bg-cyan-950/30 border-cyan-500/40 text-cyan-200";
          labelApres.className = "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all bg-slate-950/60 border-slate-800 text-slate-400";
          if (badgePayes) badgePayes.textContent = "Ignoré (Payé avant)";
        } else {
          labelAvant.className = "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all bg-slate-950/60 border-slate-800 text-slate-400";
          labelApres.className = "flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all bg-amber-950/30 border-amber-500/40 text-amber-200";
          if (badgePayes) badgePayes.textContent = "Comptabilisé (+24 j)";
        }
      }

      // Step 1: Calculate exact inclusive days between 01/04 and FCT
      const d1 = new Date(dateDebutStr);
      const d2 = new Date(dateFctStr);
      let diffDays = 0;

      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const timeDiff = d2.getTime() - d1.getTime();
        diffDays = Math.round(timeDiff / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays < 0) diffDays = 0;
      }

      const badgeNbJours = document.getElementById('cibtp-nb-jours-badge');
      const txtIntervalle = document.getElementById('cibtp-calc-intervalle-txt');
      if (badgeNbJours) badgeNbJours.textContent = `${diffDays} jours`;
      if (txtIntervalle) txtIntervalle.textContent = `${diffDays} jours`;

      // Acquisition formula from document: (nb_jours * 2.5) / 30.42 (arrondi à l'entier supérieur)
      const rawAcquis = (diffDays * 2.5) / 30.42;
      const joursOuvrablesAcquis = Math.ceil(rawAcquis);

      // Step 2: Total jours ouvrables
      // If payé avant FCT: Jours restants + Jours acquis
      // If payé après FCT: Jours restants + Jours payés après + Jours acquis
      let totalJoursOuvrables = joursRestants + joursOuvrablesAcquis;
      let formulaStep2Text = `(${joursRestants} restants + ${joursOuvrablesAcquis} acquis)`;
      
      if (isPayeApres) {
        totalJoursOuvrables += joursPayes;
        formulaStep2Text = `(${joursRestants} restants + ${joursPayes} payés + ${joursOuvrablesAcquis} acquis)`;
      }

      // Step 3: Conversion en jours calendaires: Total jours ouvrables * 7 / 6 (tronqué à l'entier)
      const rawDiffereCalendaire = (totalJoursOuvrables * 7) / 6;
      const differeCalendaireTronque = Math.floor(rawDiffereCalendaire);

      // Plafond légal Unédic = 30 jours
      const differeApplique = Math.min(30, differeCalendaireTronque);
      const isPlafonne = differeCalendaireTronque > 30;

      // Update Formula display steps
      const elFormula1 = document.getElementById('cibtp-formula-step1');
      const elFormula1Res = document.getElementById('cibtp-formula-step1-res');
      if (elFormula1) elFormula1.textContent = `${diffDays} × 2.5 / 30.42 = ${rawAcquis.toFixed(2)}`;
      if (elFormula1Res) elFormula1Res.textContent = `= ${joursOuvrablesAcquis} jours ouvrables`;

      const elFormula2 = document.getElementById('cibtp-formula-step2');
      const elFormula2Res = document.getElementById('cibtp-formula-step2-res');
      if (elFormula2) elFormula2.textContent = formulaStep2Text;
      if (elFormula2Res) elFormula2Res.textContent = `= ${totalJoursOuvrables} jours ouvrables`;

      const elFormula3 = document.getElementById('cibtp-formula-step3');
      const elFormula3Res = document.getElementById('cibtp-formula-step3-res');
      if (elFormula3) elFormula3.textContent = `${totalJoursOuvrables} × 7 / 6 = ${rawDiffereCalendaire.toFixed(2)}`;
      if (elFormula3Res) elFormula3Res.textContent = `= ${differeCalendaireTronque} jours calendaires`;

      // Update Verdict display
      const elResFinal = document.getElementById('cibtp-res-differe-final');
      if (elResFinal) {
        elResFinal.textContent = `${differeApplique} jour${differeApplique > 1 ? 's' : ''}`;
      }

      const elPlafondNotice = document.getElementById('cibtp-res-plafond-notice');
      const resultCard = document.getElementById('cibtp-result-card');
      if (elPlafondNotice && resultCard) {
        if (isPlafonne) {
          elPlafondNotice.innerHTML = `<i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-400"></i> <span class="text-amber-300 font-semibold">Calcul brut de ${differeCalendaireTronque} jours écrêté au plafond légal Unédic de 30 jours (-${differeCalendaireTronque - 30} j non décomptés)</span>`;
          resultCard.className = "rounded-xl border p-5 shadow-2xl transition-all space-y-3 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40";
        } else {
          elPlafondNotice.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i> <span class="text-emerald-300 font-semibold">Inférieur au plafond légal de 30 jours (application intégrale de ${differeCalendaireTronque} jours)</span>`;
          resultCard.className = "rounded-xl border p-5 shadow-2xl transition-all space-y-3 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-500/40";
        }
      }

      // Generate CVM Note
      const noteEl = document.getElementById('cibtp-adviser-note');
      if (noteEl) {
        const dateFctFormatted = dateFctStr.split('-').reverse().join('/');
        const situationTxt = !isPayeApres 
          ? `congés payés avant la rupture du contrat (${joursRestants} jours ouvrables restant à payer)` 
          : `congés payés après la fin de contrat (${joursPayes} jours payés + ${joursRestants} jours restant à payer)`;

        let note = `Madame, Monsieur,\n\n`;
        note += `Dans le cadre de l'instruction de votre dossier chômage suite à votre fin de contrat du ${dateFctFormatted} dans le secteur du BTP, le différé d'indemnisation congés payés a été déterminé conformément à votre attestation de paiement CIBTP :\n\n`;
        note += `• Modalité CIBTP : ${situationTxt}.\n`;
        note += `• Période d'acquisition en cours (du 01/04 au ${dateFctFormatted} = ${diffDays} jours) : ${diffDays} × 2,5 / 30,42 = ${rawAcquis.toFixed(2)}, soit ${joursOuvrablesAcquis} jours ouvrables acquis.\n`;
        note += `• Cumul des jours ouvrables retenus : ${totalJoursOuvrables} jours ouvrables.\n`;
        note += `• Conversion calendaire : ${totalJoursOuvrables} × 7 / 6 = ${rawDiffereCalendaire.toFixed(2)}, soit ${differeCalendaireTronque} jours calendaires.\n\n`;
        if (isPlafonne) {
          note += `Conformément à l'article 21 du Règlement d'assurance chômage, ce différé est plafonné à 30 jours calendaires maximum. Votre différé de congés payés retenu est donc fixé à 30 jours (les ${differeCalendaireTronque - 30} jours excédentaires ne décalent pas vos versements).\n\n`;
        } else {
          note += `Votre différé de congés payés est donc fixé à ${differeApplique} jours calendaires à compter du lendemain de votre fin de contrat.\n\n`;
        }
        note += `Ce délai s'ajoute au délai d'attente légal de 7 jours. Nous restons à votre disposition pour toute précision.`;

        noteEl.textContent = note;
      }

      refreshIcons();
    }

    function copyCibtpNote() {
      const note = document.getElementById('cibtp-adviser-note')?.textContent || '';
      copyToClipboard(note);
      showToast("Note CVM BTP copiée !", "success");
    }

    let retraiteSubMode = 'sim';

    function initRetraiteView() {
      runRetraiteCalculation();
    }

    function switchRetraiteSubMode(mode) {
      retraiteSubMode = mode;
      const sim = document.getElementById('retraite-subview-sim');
      const regles = document.getElementById('retraite-subview-regles');
      const pieces = document.getElementById('retraite-subview-pieces');

      const btnSim = document.getElementById('retraite-btn-mode-sim');
      const btnRegles = document.getElementById('retraite-btn-mode-regles');
      const btnPieces = document.getElementById('retraite-btn-mode-pieces');

      const activeClass = "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-sm";
      const inactiveClass = "text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium";

      if (sim) sim.classList.toggle('hidden', mode !== 'sim');
      if (regles) regles.classList.toggle('hidden', mode !== 'regles');
      if (pieces) pieces.classList.toggle('hidden', mode !== 'pieces');

      if (btnSim) btnSim.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${mode === 'sim' ? activeClass : inactiveClass}`;
      if (btnRegles) btnRegles.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${mode === 'regles' ? activeClass : inactiveClass}`;
      if (btnPieces) btnPieces.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${mode === 'pieces' ? activeClass : inactiveClass}`;

      refreshIcons();
    }

    function setRetraiteScenario(type) {
      const cohorteEl = document.getElementById('retraite-input-cohorte');
      const ageEl = document.getElementById('retraite-input-age-actuel');
      const trimEl = document.getElementById('retraite-input-trimestres-valides');
      const statutPensionEl = document.getElementById('retraite-input-statut-pension');
      const chkIndem = document.getElementById('ret-chk-cond-indemnise');
      const chkAffil = document.getElementById('ret-chk-cond-affiliation12');
      const chkEmploi = document.getElementById('ret-chk-cond-emploi5ans');

      if (type === 'valide') {
        if (cohorteEl) cohorteEl.value = '1963';
        if (ageEl) ageEl.value = '63';
        if (trimEl) trimEl.value = '158';
        if (statutPensionEl) statutPensionEl.value = 'aucune';
        if (chkIndem) chkIndem.checked = true;
        if (chkAffil) chkAffil.checked = true;
        if (chkEmploi) chkEmploi.checked = true;
        showToast("Scénario Maintien Validé appliqué (63 ans, 158t)", "info");
      } else if (type === 'taux_plein') {
        if (cohorteEl) cohorteEl.value = '1963';
        if (ageEl) ageEl.value = '63';
        if (trimEl) trimEl.value = '170';
        if (statutPensionEl) statutPensionEl.value = 'aucune';
        if (chkIndem) chkIndem.checked = true;
        if (chkAffil) chkAffil.checked = true;
        if (chkEmploi) chkEmploi.checked = true;
        showToast("Scénario Taux Plein Atteint appliqué (170t)", "info");
      } else if (type === 'trim_insuffisants') {
        if (cohorteEl) cohorteEl.value = '1963';
        if (ageEl) ageEl.value = '63';
        if (trimEl) trimEl.value = '92'; // Moins de 100 trimestres
        if (statutPensionEl) statutPensionEl.value = 'aucune';
        if (chkIndem) chkIndem.checked = true;
        if (chkAffil) chkAffil.checked = true;
        if (chkEmploi) chkEmploi.checked = true;
        showToast("Scénario Moins de 100 trimestres (Refus)", "info");
      } else if (type === 'duree_courte') {
        if (cohorteEl) cohorteEl.value = '1963';
        if (ageEl) ageEl.value = '63';
        if (trimEl) trimEl.value = '158';
        if (statutPensionEl) statutPensionEl.value = 'aucune';
        if (chkIndem) chkIndem.checked = false; // Moins de 365j indemnisés
        if (chkAffil) chkAffil.checked = true;
        if (chkEmploi) chkEmploi.checked = true;
        showToast("Scénario Moins de 365j indemnisés (Refus)", "info");
      } else if (type === 'age_67') {
        if (cohorteEl) cohorteEl.value = '1961_1';
        if (ageEl) ageEl.value = '67';
        if (trimEl) trimEl.value = '145';
        if (statutPensionEl) statutPensionEl.value = 'aucune';
        if (chkIndem) chkIndem.checked = true;
        if (chkAffil) chkAffil.checked = true;
        if (chkEmploi) chkEmploi.checked = true;
        showToast("Scénario Âge limite 67 ans (Extinction)", "info");
      }

      switchRetraiteSubMode('sim');
      runRetraiteCalculation();
    }

    function runRetraiteCalculation() {
      const cohorte = document.getElementById('retraite-input-cohorte')?.value || '1963';
      const ageActuel = parseFloat(document.getElementById('retraite-input-age-actuel')?.value) || 0;
      const trimValides = parseInt(document.getElementById('retraite-input-trimestres-valides')?.value, 10) || 0;
      const statutPension = document.getElementById('retraite-input-statut-pension')?.value || 'aucune';

      const condIndem365 = document.getElementById('ret-chk-cond-indemnise')?.checked || false;
      const condAffil12 = document.getElementById('ret-chk-cond-affiliation12')?.checked || false;
      const condEmploi5ans = document.getElementById('ret-chk-cond-emploi5ans')?.checked || false;

      // Official thresholds per cohort
      const cohortData = {
        '1961_1': { ageLegalYears: 62, ageLabel: '62 ans', reqTrim: 168 },
        '1961_2': { ageLegalYears: 62.25, ageLabel: '62 ans et 3 mois', reqTrim: 169 },
        '1962': { ageLegalYears: 62.5, ageLabel: '62 ans et 6 mois', reqTrim: 169 },
        '1963': { ageLegalYears: 62.75, ageLabel: '62 ans et 9 mois', reqTrim: 170 },
        '1964': { ageLegalYears: 62.75, ageLabel: '62 ans et 9 mois', reqTrim: 170 },
        '1965_1': { ageLegalYears: 62.75, ageLabel: '62 ans et 9 mois', reqTrim: 170 },
        '1965_2': { ageLegalYears: 63, ageLabel: '63 ans', reqTrim: 171 },
        '1966': { ageLegalYears: 63.25, ageLabel: '63 ans et 3 mois', reqTrim: 172 },
        '1967': { ageLegalYears: 63.5, ageLabel: '63 ans et 6 mois', reqTrim: 172 },
        '1968': { ageLegalYears: 63.75, ageLabel: '63 ans et 9 mois', reqTrim: 172 },
        '1969_plus': { ageLegalYears: 64, ageLabel: '64 ans', reqTrim: 172 }
      };

      const curData = cohortData[cohorte] || cohortData['1963'];
      const ageLegalYears = curData.ageLegalYears;
      const ageLabel = curData.ageLabel;
      const trimRequis = curData.reqTrim;

      // Condition 1: Legal age reached
      const condAgeLegal = ageActuel >= ageLegalYears;

      // Condition 4: At least 100 trimestres validated
      const condTrim100 = trimValides >= 100;

      // Update UI badges for conditions
      const updateRetCheck = (badgeId, iconId, txtId, valid, textBadge, textDesc) => {
        const badge = document.getElementById(badgeId);
        const icon = document.getElementById(iconId);
        const txt = document.getElementById(txtId);
        if (badge) {
          badge.textContent = textBadge;
          badge.className = `font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
            valid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
          }`;
        }
        if (icon) {
          icon.setAttribute('data-lucide', valid ? 'check-circle' : 'x-circle');
          icon.className = `w-4 h-4 ${valid ? 'text-emerald-400' : 'text-rose-400'} shrink-0`;
        }
        if (txt && textDesc) {
          txt.textContent = textDesc;
        }
      };

      updateRetCheck(
        'ret-badge-cond-age', 
        'ret-icon-cond-age', 
        'ret-txt-cond-age', 
        condAgeLegal, 
        condAgeLegal ? 'Rempli' : 'Non atteint', 
        `Âge actuel ${ageActuel} ans vs Âge légal requis : ${ageLabel}`
      );

      const badgeIndem = document.getElementById('ret-badge-cond-indemnise');
      if (badgeIndem) {
        badgeIndem.textContent = condIndem365 ? '≥ 365 j' : '< 365 j';
        badgeIndem.className = `font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
          condIndem365 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
        }`;
      }

      const badgeAffil = document.getElementById('ret-badge-cond-affiliation12');
      if (badgeAffil) {
        badgeAffil.textContent = condAffil12 ? '12 ans validés' : 'Insuffisant';
        badgeAffil.className = `font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
          condAffil12 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
        }`;
      }

      updateRetCheck(
        'ret-badge-cond-trim100', 
        'ret-icon-cond-trim100', 
        'ret-txt-cond-trim100', 
        condTrim100, 
        condTrim100 ? `${trimValides} trimestres` : `${trimValides} (< 100)`, 
        `Trimestres validés Sécurité Sociale au RIS : ${trimValides} (Seuil requis ≥ 100)`
      );

      const badgeEmploi = document.getElementById('ret-badge-cond-emploi5ans');
      if (badgeEmploi) {
        badgeEmploi.textContent = condEmploi5ans ? 'Conforme' : 'Non justifié';
        badgeEmploi.className = `font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
          condEmploi5ans ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
        }`;
      }

      // Check Extinction (Article 4 c)
      const hasPensionLiquidee = statutPension === 'liquidee' || statutPension === 'carriere_longue';
      const isAge67 = ageActuel >= 67;
      const hasTauxPlein = condAgeLegal && (trimValides >= trimRequis);
      const isExtinction = hasPensionLiquidee || isAge67 || hasTauxPlein;

      // Check the 5 cumulative conditions
      const all5ConditionsOk = condAgeLegal && condIndem365 && condAffil12 && condTrim100 && condEmploi5ans;

      // Missing trimestres calculation
      const trimManquants = Math.max(0, trimRequis - trimValides);
      const anneesManquantes = (trimManquants / 4).toFixed(1);

      // Display metrics in right panel
      const elTrimReq = document.getElementById('retraite-res-trimestres-requis');
      if (elTrimReq) elTrimReq.textContent = `${trimRequis} trimestres`;

      const elAgeLegalTag = document.getElementById('retraite-res-age-legal-tag');
      if (elAgeLegalTag) elAgeLegalTag.textContent = `Âge légal : ${ageLabel}`;

      const elTrimManquants = document.getElementById('retraite-res-trimestres-manquants');
      if (elTrimManquants) elTrimManquants.textContent = `${trimManquants} trimestre${trimManquants > 1 ? 's' : ''}`;

      const elAnneesManquantes = document.getElementById('retraite-res-annees-manquantes');
      if (elAnneesManquantes) {
        elAnneesManquantes.textContent = trimManquants > 0 ? `Soit environ ${anneesManquantes} an(s)` : 'Taux plein atteint';
      }

      const elInfoAgeLegal = document.getElementById('retraite-info-age-legal');
      if (elInfoAgeLegal) elInfoAgeLegal.textContent = ageLabel;

      const elInfoDuree = document.getElementById('retraite-info-duree-maintien');
      if (elInfoDuree) {
        elInfoDuree.textContent = trimManquants > 0 ? `${trimManquants} trimestres (ou max 67 ans)` : 'Droit éteint (taux plein)';
      }

      // Verdict Banner & Diagnosis
      const vCard = document.getElementById('retraite-verdict-card');
      const vPill = document.getElementById('retraite-verdict-pill');
      const vTitle = document.getElementById('retraite-verdict-title');
      const vDesc = document.getElementById('retraite-verdict-desc');
      const noteEl = document.getElementById('retraite-adviser-note');

      if (vCard && vPill && vTitle && vDesc) {
        if (hasPensionLiquidee) {
          vCard.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40";
          vPill.textContent = "Extinction de Droit (Art. 4 c)";
          vPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30";
          vTitle.textContent = "PENSION DE RETRAITE DÉJÀ LIQUIDÉE";
          vTitle.className = "text-base font-extrabold text-amber-300 leading-tight";
          vDesc.textContent = "Conformément à l'article 4 c du Règlement d'assurance chômage, la liquidation d'une pension de retraite personnelle éteint immédiatement le droit à l'ARE.";
          if (noteEl) {
            noteEl.textContent = `Madame, Monsieur,\n\nVous nous avez informé de la liquidation de votre pension de retraite personnelle. Conformément à l'article 4 c du règlement d'assurance chômage, le versement de vos allocations d'aide au retour à l'emploi (ARE) prend fin à compter de la date de prise d'effet de votre pension.\n\nNous restons à votre disposition au 3949 pour toute précision.`;
          }
        } else if (isAge67) {
          vCard.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-amber-500/40";
          vPill.textContent = "Extinction 67 ans (Art. 4 c)";
          vPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30";
          vTitle.textContent = "ÂGE LIMITE DE 67 ANS ATTEINT";
          vTitle.className = "text-base font-extrabold text-amber-300 leading-tight";
          vDesc.textContent = "À 67 ans, l'usager bénéficie automatiquement du taux plein sans décote. Le versement de l'ARE s'éteint définitivement le dernier jour du mois des 67 ans.";
          if (noteEl) {
            noteEl.textContent = `Madame, Monsieur,\n\nVous atteignez l'âge de 67 ans, âge auquel la retraite à taux plein vous est attribuée de plein droit sans aucune décote. En application de l'article 4 c du règlement d'assurance chômage, le versement de vos allocations chômage prend fin de manière définitive. Merci de procéder à la liquidation de vos droits auprès de votre caisse de retraite (Carsat).`;
          }
        } else if (hasTauxPlein) {
          vCard.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-500/40";
          vPill.textContent = "Taux Plein Atteint (Art. 4 c)";
          vPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
          vTitle.textContent = "TAUX PLEIN ATTEINT : BASCULE VERS LA CARSAT";
          vTitle.className = "text-base font-extrabold text-cyan-300 leading-tight";
          vDesc.textContent = `L'usager réunit ${trimValides} trimestres (sur ${trimRequis} requis) et a atteint l'âge légal (${ageLabel}). Le maintien ne s'applique pas : il doit faire liquider sa retraite à taux plein.`;
          if (noteEl) {
            noteEl.textContent = `Madame, Monsieur,\n\nL'examen de votre relevé de carrière (RIS) indique que vous totalisez ${trimValides} trimestres validés pour un seuil requis de ${trimRequis} trimestres et que vous avez atteint l'âge légal de départ (${ageLabel}).\n\nVous remplissez ainsi toutes les conditions pour bénéficier d'une retraite à taux plein. Conformément à l'article 4 c du règlement d'assurance chômage, vos droits à l'ARE s'éteignent. Nous vous invitons à déposer immédiatement votre demande de retraite définitive auprès de l'Assurance Retraite (Carsat).`;
          }
        } else if (all5ConditionsOk) {
          vCard.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40";
          vPill.textContent = "Maintien Accordé (Art. 9 § 3)";
          vPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
          vTitle.textContent = "MAINTIEN DU DROIT ARE JUSQU'AU TAUX PLEIN ACCORDÉ";
          vTitle.className = "text-base font-extrabold text-emerald-300 leading-tight";
          vDesc.textContent = `Toutes les 5 conditions cumulatives de l'Article 9 § 3 sont satisfaites. L'ARE est prolongée jusqu'à l'obtention des ${trimManquants} trimestres manquants (au plus tard jusqu'à 67 ans).`;
          if (noteEl) {
            noteEl.textContent = `Madame, Monsieur,\n\nVous arrivez au terme prévisionnel de vos allocations chômage à l'âge de ${ageActuel} ans. Conformément à l'article 9 § 3 du règlement d'assurance chômage, vous remplissez l'ensemble des 5 conditions cumulatives pour bénéficier du maintien du versement de l'ARE jusqu'à la liquidation de votre pension de retraite à taux plein (${trimManquants} trimestres manquants constatés au RIS).\n\nVotre indemnisation se poursuivra au même montant jusqu'à la date d'effet de votre taux plein, au plus tard jusqu'à vos 67 ans. Nous vous inviterons à déposer votre demande de retraite définitive auprès de la Carsat 4 mois avant l'échéance.`;
          }
        } else {
          vCard.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40";
          vPill.textContent = "Maintien Refusé";
          vPill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30";
          vTitle.textContent = "CONDITIONS CUMULATIVES DU MAINTIEN NON REMPLIES";
          vTitle.className = "text-base font-extrabold text-rose-300 leading-tight";

          const missingList = [];
          if (!condAgeLegal) missingList.push(`âge légal non atteint (${ageActuel} ans vs ${ageLabel})`);
          if (!condIndem365) missingList.push("moins de 365 jours indemnisés au droit ARE");
          if (!condAffil12) missingList.push("moins de 12 ans d'affiliation chômage");
          if (!condTrim100) missingList.push(`moins de 100 trimestres validés au RIS (${trimValides}/100)`);
          if (!condEmploi5ans) missingList.push("défaut d'un an continu ou 2 ans discontinus dans les 5 ans");

          vDesc.textContent = `Le maintien au titre de l'Article 9 § 3 ne peut pas être accordé en raison de critère(s) manquant(s) : ${missingList.join(', ')}.`;
          if (noteEl) {
            noteEl.textContent = `Madame, Monsieur,\n\nNous avons examiné votre situation au regard du maintien de versement de l'ARE jusqu'à la retraite à taux plein (Article 9 § 3 du règlement d'assurance chômage).\n\nAprès vérification des pièces de votre dossier, vous ne remplissez pas les conditions légales cumulatives requises, notamment : ${missingList.join(', ')}.\n\nPar conséquent, le versement de vos allocations prendra fin à la date d'épuisement de votre droit actuel. Vous pouvez formuler une demande de solidarité (ASS) si vos ressources le permettent.`;
          }
        }
      }

      refreshIcons();
    }

    function resetRetraiteSimulator() {
      ftClearFields(['retraite-input-age-actuel', 'retraite-input-trimestres-valides']);
      runRetraiteCalculation();
      showToast("Simulateur Retraite réinitialisé", "info");
    }

    function copyRetraiteNote() {
      const note = document.getElementById('retraite-adviser-note')?.textContent || '';
      copyToClipboard(note);
      showToast("Note Retraite copiée !", "success");
    }

    function copyRetraitePiecesLetter() {
      const text = document.getElementById('retraite-pieces-letter-sample')?.textContent || '';
      copyToClipboard(text);
      showToast("Modèle de relance pièces retraite copié !", "success");
    }

    let rciSubMode = 'sim';

    function initRciView() {
      runRciCalculation();
    }

    function switchRciSubMode(mode) {
      rciSubMode = mode;
      const sim = document.getElementById('rci-subview-sim');
      const regles = document.getElementById('rci-subview-regles');
      const procedure = document.getElementById('rci-subview-procedure');

      const btnSim = document.getElementById('rci-btn-mode-sim');
      const btnRegles = document.getElementById('rci-btn-mode-regles');
      const btnProcedure = document.getElementById('rci-btn-mode-procedure');

      const activeClass = "bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-sm";
      const inactiveClass = "text-slate-400 hover:text-white hover:bg-slate-800/80 font-medium";

      if (sim) sim.classList.toggle('hidden', mode !== 'sim');
      if (regles) regles.classList.toggle('hidden', mode !== 'regles');
      if (procedure) procedure.classList.toggle('hidden', mode !== 'procedure');

      if (btnSim) btnSim.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${mode === 'sim' ? activeClass : inactiveClass}`;
      if (btnRegles) btnRegles.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${mode === 'regles' ? activeClass : inactiveClass}`;
      if (btnProcedure) btnProcedure.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${mode === 'procedure' ? activeClass : inactiveClass}`;

      refreshIcons();
    }

    function setRciScenario(type) {
      const dateFct = document.getElementById('rci-input-date-fct');
      const typeRupture = document.getElementById('rci-input-type-rupture');
      const age = document.getElementById('rci-input-age');
      const zone = document.getElementById('rci-input-zone');
      const ancAn = document.getElementById('rci-input-anc-annees');
      const ancMois = document.getElementById('rci-input-anc-mois');
      const salMoyen = document.getElementById('rci-input-salaire-moyen');
      const indemRupture = document.getElementById('rci-input-indem-rupture');
      const indemCp = document.getElementById('rci-input-indem-cp');

      if (type === 'standard_post_sept') {
        if (dateFct) dateFct.value = '2026-09-15';
        if (typeRupture) typeRupture.value = 'rci';
        if (age) age.value = 'under55';
        if (zone) zone.value = 'metro';
        if (ancAn) ancAn.value = '5';
        if (ancMois) ancMois.value = '6';
        if (salMoyen) salMoyen.value = '2800';
        if (indemRupture) indemRupture.value = '7000';
        if (indemCp) indemCp.value = '1400';
        showToast("Scénario RCI < 55 ans appliqué (Plafond 15 mois)", "info");
      } else if (type === 'senior_post_sept') {
        if (dateFct) dateFct.value = '2026-09-30';
        if (typeRupture) typeRupture.value = 'rci';
        if (age) age.value = '55plus';
        if (zone) zone.value = 'metro';
        if (ancAn) ancAn.value = '12';
        if (ancMois) ancMois.value = '0';
        if (salMoyen) salMoyen.value = '3400';
        if (indemRupture) indemRupture.value = '18000';
        if (indemCp) indemCp.value = '2200';
        showToast("Scénario RCI Senior 55 ans+ appliqué (Plafond 20,5 mois)", "info");
      } else if (type === 'ante_septembre') {
        if (dateFct) dateFct.value = '2026-08-20';
        if (typeRupture) typeRupture.value = 'rci';
        if (age) age.value = 'under55';
        if (zone) zone.value = 'metro';
        if (ancAn) ancAn.value = '4';
        if (ancMois) ancMois.value = '0';
        if (salMoyen) salMoyen.value = '2500';
        if (indemRupture) indemRupture.value = '4000';
        if (indemCp) indemCp.value = '1000';
        showToast("Scénario FCT avant le 01/09/2026 (18 mois maintenus)", "info");
      } else if (type === 'rcc_collective') {
        if (dateFct) dateFct.value = '2026-10-01';
        if (typeRupture) typeRupture.value = 'rcc';
        if (age) age.value = 'under55';
        if (zone) zone.value = 'metro';
        if (ancAn) ancAn.value = '6';
        if (ancMois) ancMois.value = '0';
        if (salMoyen) salMoyen.value = '3000';
        if (indemRupture) indemRupture.value = '9000';
        if (indemCp) indemCp.value = '1500';
        showToast("Scénario Rupture Collective (RCC - Hors réforme)", "info");
      } else if (type === 'forte_supralegale') {
        if (dateFct) dateFct.value = '2026-09-10';
        if (typeRupture) typeRupture.value = 'rci';
        if (age) age.value = 'under55';
        if (zone) zone.value = 'metro';
        if (ancAn) ancAn.value = '8';
        if (ancMois) ancMois.value = '0';
        if (salMoyen) salMoyen.value = '3200';
        if (indemRupture) indemRupture.value = '25000';
        if (indemCp) indemCp.value = '2000';
        showToast("Scénario Forte indemnité supra-légale appliqué", "info");
      }

      switchRciSubMode('sim');
      runRciCalculation();
    }

    function runRciCalculation() {
      const dateFctStr = document.getElementById('rci-input-date-fct')?.value || new Date().toISOString().slice(0, 10);
      const typeRupture = document.getElementById('rci-input-type-rupture')?.value || 'rci';
      const age = document.getElementById('rci-input-age')?.value || 'under55';
      const zone = document.getElementById('rci-input-zone')?.value || 'metro';

      const ancAn = parseInt(document.getElementById('rci-input-anc-annees')?.value, 10) || 0;
      const ancMois = parseInt(document.getElementById('rci-input-anc-mois')?.value, 10) || 0;
      const totalAncYears = ancAn + (ancMois / 12);

      const salMoyen = parseFloat(document.getElementById('rci-input-salaire-moyen')?.value) || 0;
      const indemRupture = parseFloat(document.getElementById('rci-input-indem-rupture')?.value) || 0;
      const indemCp = parseFloat(document.getElementById('rci-input-indem-cp')?.value) || 0;

      // Check if Reform applies (FCT on or after September 1st, 2026 AND type is RCI)
      const dFct = new Date(dateFctStr);
      const dPivot = new Date('2026-09-01');
      const isPostSept2026 = dFct >= dPivot;
      const isReformeActive = isPostSept2026 && typeRupture === 'rci';

      // Update Top Status Badge
      const regimeBadge = document.getElementById('rci-regime-badge');
      if (regimeBadge) {
        if (isReformeActive) {
          regimeBadge.textContent = "Réforme RCI 2026 Applicable";
          regimeBadge.className = "font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30";
        } else if (!isPostSept2026) {
          regimeBadge.textContent = "FCT Antérieure au 01/09/2026 (Droit Antérieur)";
          regimeBadge.className = "font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
        } else {
          regimeBadge.textContent = "Rupture Collective RCC (Exclue de la Réforme)";
          regimeBadge.className = "font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
        }
      }

      // Legal minimum severance calculation (Art. R. 1234-2 C. Travail)
      // 1/4 month per year up to 10 years, 1/3 month per year beyond 10 years
      let minLegal = 0;
      if (totalAncYears <= 10) {
        minLegal = salMoyen * 0.25 * totalAncYears;
      } else {
        minLegal = (salMoyen * 0.25 * 10) + (salMoyen * (1/3) * (totalAncYears - 10));
      }
      minLegal = Math.round(minLegal * 100) / 100;

      const minLegalBadge = document.getElementById('rci-min-legal-badge');
      if (minLegalBadge) minLegalBadge.textContent = `Min légal : ${minLegal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      const elIndemLegale = document.getElementById('rci-calc-indem-legale');
      if (elIndemLegale) elIndemLegale.textContent = `${minLegal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      // Supra-legal portion
      const supralegale = Math.max(0, indemRupture - minLegal);
      const elIndemSupra = document.getElementById('rci-calc-indem-supralegale');
      if (elIndemSupra) {
        elIndemSupra.textContent = supralegale > 0 ? `+ ${supralegale.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : "0,00 € (Aucune part supra-légale)";
        elIndemSupra.className = `font-mono font-bold ${supralegale > 0 ? 'text-amber-300' : 'text-slate-400'}`;
      }

      // Employer contribution (40% on exempt portion since January 2026)
      const contribPatronale = Math.round(indemRupture * 0.40 * 100) / 100;
      const elContrib = document.getElementById('rci-calc-contrib-patronale');
      if (elContrib) elContrib.textContent = `${contribPatronale.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`;

      // Delays / Differes calculations
      const sjr = salMoyen / 30.42;
      const diffCp = sjr > 0 ? Math.min(30, Math.floor(indemCp / sjr)) : 0;
      
      // Diviseur spécifique Unédic 2026 = 111,8 € (plafond 150 jours)
      const diffSupralegal = Math.min(150, Math.floor(supralegale / 111.8));
      const totalDifferes = 7 + diffCp + diffSupralegal;

      // First compensated day calculation
      const dEffet = new Date(dFct);
      dEffet.setDate(dEffet.getDate() + totalDifferes + 1);
      const dEffetStr = dEffet.toLocaleDateString('fr-FR');

      // Max indemnisation duration
      let dureeMaxMois = 18;
      let dureeMaxJours = 548;
      let perteMoisStr = "- 3 mois";

      if (isReformeActive) {
        if (zone === 'metro') {
          if (age === 'under55') {
            dureeMaxMois = 15;
            dureeMaxJours = 456;
            perteMoisStr = "- 3 mois (-92 j)";
          } else {
            dureeMaxMois = 20.5;
            dureeMaxJours = 624;
            perteMoisStr = "- 2 à - 6,5 mois";
          }
        } else {
          // Outre-mer
          if (age === 'under55') {
            dureeMaxMois = 20;
            dureeMaxJours = 608;
            perteMoisStr = "- 4 mois";
          } else {
            dureeMaxMois = 30;
            dureeMaxJours = 913;
            perteMoisStr = "Plafonné à 30 mois";
          }
        }
      } else {
        // Droit commun antérieur ou RCC
        if (zone === 'metro') {
          if (age === 'under55') {
            dureeMaxMois = 18;
            dureeMaxJours = 548;
            perteMoisStr = "Droit plein (18 mois)";
          } else {
            dureeMaxMois = 22.5;
            dureeMaxJours = 685;
            perteMoisStr = "Droit senior plein";
          }
        } else {
          dureeMaxMois = 24;
          dureeMaxJours = 730;
          perteMoisStr = "Droit outre-mer";
        }
      }

      // Update Result Elements
      const elDureeMax = document.getElementById('rci-res-duree-max');
      const elDureeJours = document.getElementById('rci-res-duree-jours');
      const elDiffImpact = document.getElementById('rci-diff-impact-badge');

      if (elDureeMax) elDureeMax.textContent = `${dureeMaxMois} mois`;
      if (elDureeJours) elDureeJours.textContent = `${dureeMaxJours} jours indemnisables`;
      if (elDiffImpact) {
        elDiffImpact.textContent = isReformeActive ? perteMoisStr : "Aucune réduction";
        elDiffImpact.className = `text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
          isReformeActive ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
        }`;
      }

      const elTotalDifferes = document.getElementById('rci-res-total-differes');
      const elDatePremierVst = document.getElementById('rci-res-date-premier-vst');
      const elResDiffCp = document.getElementById('rci-res-diff-cp');
      const elResDiffSupra = document.getElementById('rci-res-diff-supralegal');
      const elResDateEffet = document.getElementById('rci-res-date-effet');

      if (elTotalDifferes) elTotalDifferes.textContent = `${totalDifferes} jours`;
      if (elDatePremierVst) elDatePremierVst.textContent = `1er vst : ${dEffetStr}`;
      if (elResDiffCp) elResDiffCp.textContent = `${diffCp} jours`;
      if (elResDiffSupra) elResDiffSupra.textContent = `${diffSupralegal} jours`;
      if (elResDateEffet) elResDateEffet.textContent = dEffetStr;

      // Verdict Banner
      const card = document.getElementById('rci-verdict-card');
      const pill = document.getElementById('rci-verdict-pill');
      const title = document.getElementById('rci-verdict-title');
      const desc = document.getElementById('rci-verdict-desc');

      if (card && pill && title && desc) {
        if (isReformeActive) {
          card.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/40";
          pill.textContent = "Réforme RCI 2026";
          pill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30";
          title.textContent = `DURÉE MAXIMALE RÉDUITE À ${dureeMaxMois} MOIS (${dureeMaxJours} JOURS)`;
          title.className = "text-base font-extrabold text-rose-300 leading-tight";
          desc.textContent = `Fin de contrat effective au ${dFct.toLocaleDateString('fr-FR')} (post-01/09/2026) : la durée d'indemnisation est plafonnée à ${dureeMaxMois} mois (${dureeMaxJours} jours), conformément à la loi n° 2026-470 (${perteMoisStr}).`;
        } else if (!isPostSept2026) {
          card.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/40";
          pill.textContent = "Régime Antérieur Préservé";
          pill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
          title.textContent = `DROIT COMMUN MAINTENU : ${dureeMaxMois} MOIS (${dureeMaxJours} JOURS)`;
          title.className = "text-base font-extrabold text-emerald-300 leading-tight";
          desc.textContent = `Fin de contrat effective au ${dFct.toLocaleDateString('fr-FR')} (antérieure au 01/09/2026) : le salarié échappe au plafonnement de la réforme et bénéficie de la durée d'indemnisation de droit commun.`;
        } else {
          card.className = "rounded-xl border p-4 shadow-xl space-y-2 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-cyan-500/40";
          pill.textContent = "Rupture Collective RCC";
          pill.className = "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30";
          title.textContent = `RCC EXCLUE DU PLAFONNEMENT (${dureeMaxMois} MOIS)`;
          title.className = "text-base font-extrabold text-cyan-300 leading-tight";
          desc.textContent = "Les ruptures conventionnelles collectives (RCC) ne sont pas visées par la réforme du 1er septembre 2026. L'indemnisation suit le régime légal de droit commun.";
        }
      }

      // Generate Adviser Note
      const noteEl = document.getElementById('rci-adviser-note');
      if (noteEl) {
        let note = `Madame, Monsieur,\n\n`;
        note += `Dans le cadre de l'instruction de votre dossier suite à votre Rupture Conventionnelle prenant fin le ${dFct.toLocaleDateString('fr-FR')}, voici le bilan de vos droits à l'assurance chômage :\n\n`;

        if (isReformeActive) {
          note += `1. Durée maximale d'indemnisation (Réforme du 1er septembre 2026 - Loi n° 2026-470) :\n`;
          note += `Votre contrat prenant fin après le 1er septembre 2026, la durée maximale de votre allocation d'aide au retour à l'emploi (ARE) est fixée à ${dureeMaxMois} mois, soit ${dureeMaxJours} jours indemnisables.\n\n`;
        } else {
          note += `1. Durée maximale d'indemnisation :\n`;
          note += `Votre rupture relève du régime de droit commun non plafonné : votre durée d'indemnisation maximale est de ${dureeMaxMois} mois, soit ${dureeMaxJours} jours.\n\n`;
        }

        note += `2. Indemnité de rupture & Délais de versement :\n`;
        note += `• Indemnité légale minimale : ${minLegal.toFixed(2)} €\n`;
        if (supralegale > 0) {
          note += `• Part supra-légale perçue : ${supralegale.toFixed(2)} € entraînant un différé spécifique de ${diffSupralegal} jours (plafonné à 150j)\n`;
        }
        note += `• Différé congés payés : ${diffCp} jours\n`;
        note += `• Délai d'attente légal : 7 jours\n`;
        note += `Soit un total de ${totalDifferes} jours calendaires de différés avant la prise en charge.\n\n`;
        note += `Le point de départ de votre indemnisation est fixé au ${dEffetStr}.\n\n`;
        note += `Nous restons à votre entière disposition au 3949 pour toute précision.\nVotre conseiller France Travail`;

        noteEl.textContent = note;
      }

      refreshIcons();
    }

    function resetRciSimulator() {
      ftClearFields(['rci-input-date-fct', 'rci-input-anc-annees', 'rci-input-anc-mois', 'rci-input-salaire-moyen', 'rci-input-indem-rupture', 'rci-input-indem-cp']);
      runRciCalculation();
      showToast("Simulateur RCI réinitialisé", "info");
    }

    function copyRciNote() {
      const note = document.getElementById('rci-adviser-note')?.textContent || '';
      copyToClipboard(note);
      showToast("Note CVM RCI copiée !", "success");
    }

    function copyRciSummary() {
      const title = document.getElementById('rci-verdict-title')?.textContent || '';
      const desc = document.getElementById('rci-verdict-desc')?.textContent || '';
      const totalDiff = document.getElementById('rci-res-total-differes')?.textContent || '';
      const dateVst = document.getElementById('rci-res-date-effet')?.textContent || '';

      const summary = `[DIAGNOSTIC RUPTURE CONVENTIONNELLE INDIVIDUELLE]\n${title}\n${desc}\nDifférés cumulés : ${totalDiff}\nDate 1er versement : ${dateVst}`;
      copyToClipboard(summary);
      showToast("Synthèse RCI copiée !", "success");
    }

    function copyToClipboard(text) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error("Erreur de copie:", err);
      }
      document.body.removeChild(textArea);
    }

    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs shadow-2xl flex items-center gap-2 pointer-events-auto transition-all animate-bounce-short';
      const iconName = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-triangle' : 'info');
      toast.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4 text-cyan-400 shrink-0"></i><span>${escapeHtml(message)}</span>`;
      container.appendChild(toast);
      refreshIcons();
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 250);
      }, 2600);
    }

    function openModal(id) {
      if (id === 'new-model-modal') {
        populateCategorySelect();
        const sel = document.getElementById('m-category');
        if (sel && categoryList.some(c => c.name === currentCategory)) sel.value = currentCategory;
      }
      document.getElementById(id)?.classList.remove('hidden');
      refreshIcons();
    }

    function closeModal(id) {
      document.getElementById(id)?.classList.add('hidden');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function refreshIcons() {
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          switchNavTab('cvm');
          searchInput.focus();
          searchInput.select();
        }
      }
      if (e.key === 'Escape') {
        toggleBurgerMenu(false);
        closeModal('new-model-modal');
        closeModal('new-category-modal');
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleBurgerMenu();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCalculator();
      }
      if (isCalculatorOpen && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        if (e.key >= '0' && e.key <= '9') {
          calcInput(e.key);
        } else if (['+', '-', '*', '/'].includes(e.key)) {
          calcInput(e.key);
        } else if (e.key === '.' || e.key === ',') {
          calcInput('.');
        } else if (e.key === 'Enter') {
          e.preventDefault();
          calcEquals();
        } else if (e.key === 'Backspace') {
          calcBackspace();
        } else if (e.key === 'Escape') {
          toggleCalculator(false);
        }
      }
    });

    // ===== Simulateur de date à date =====
    const DC_DAY = 86400000;

    function dcParse(v) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return null;
      const [y, m, d] = v.split('-').map(Number);
      const t = Date.UTC(y, m - 1, d);
      const dt = new Date(t);
      if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
      return t;
    }

    function dcFmtDate(t) {
      return new Date(t).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    }

    function dcPl(n, word) {
      return n.toLocaleString('fr-FR') + ' ' + word + (n >= 2 ? 's' : '');
    }

    function dcEaster(y) {
      const a = y % 19, b = Math.floor(y / 100), c = y % 100;
      const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const mo = Math.floor((h + l - 7 * m + 114) / 31);
      const da = ((h + l - 7 * m + 114) % 31) + 1;
      return Date.UTC(y, mo - 1, da);
    }

    function dcHolidays(y) {
      const e = dcEaster(y);
      return [
        Date.UTC(y, 0, 1), e + DC_DAY, Date.UTC(y, 4, 1), Date.UTC(y, 4, 8),
        e + 39 * DC_DAY, e + 50 * DC_DAY, Date.UTC(y, 6, 14), Date.UTC(y, 7, 15),
        Date.UTC(y, 10, 1), Date.UTC(y, 10, 11), Date.UTC(y, 11, 25)
      ];
    }

    function dcYMD(lo, hi) {
      const a = new Date(lo), b = new Date(hi);
      let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
      if (b.getUTCDate() < a.getUTCDate()) months--;
      const ay = a.getUTCFullYear(), am = a.getUTCMonth() + months;
      const last = new Date(Date.UTC(ay, am + 1, 0)).getUTCDate();
      const anchor = Date.UTC(ay, am, Math.min(a.getUTCDate(), last));
      return { years: Math.floor(months / 12), months: months % 12, days: Math.round((hi - anchor) / DC_DAY) };
    }

    function dcWorkdays(lo, hi, excludeHolidays) {
      const span = Math.round((hi - lo) / DC_DAY) + 1;
      if (span > 80000) return null;
      const hol = new Set();
      if (excludeHolidays) {
        for (let y = new Date(lo).getUTCFullYear(); y <= new Date(hi).getUTCFullYear(); y++) dcHolidays(y).forEach(t => hol.add(t));
      }
      let count = 0, excluded = 0;
      for (let t = lo; t <= hi; t += DC_DAY) {
        const dow = new Date(t).getUTCDay();
        if (dow === 0 || dow === 6) continue;
        if (hol.has(t)) { excluded++; continue; }
        count++;
      }
      return { count, excluded };
    }

    function dcYMDText(r) {
      const parts = [];
      if (r.years) parts.push(dcPl(r.years, 'an'));
      if (r.months) parts.push(r.months + ' mois');
      if (r.days || !parts.length) parts.push(dcPl(r.days, 'jour'));
      return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' et ' + parts[parts.length - 1] : parts[0];
    }

    function dcSetToday(id) {
      const n = new Date();
      const iso = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
      const el = document.getElementById(id);
      if (el) { el.value = iso; calcDates(); }
    }

    function dcSwap() {
      const a = document.getElementById('datecalc-start'), b = document.getElementById('datecalc-end');
      if (!a || !b) return;
      const tmp = a.value; a.value = b.value; b.value = tmp;
      calcDates();
    }

    let dcLastText = '';

    function dcCopy() {
      if (!dcLastText) return;
      copyToClipboard(dcLastText);
      showToast('Résultat copié', 'success');
    }

    function toggleDateCalc(force) {
      const pop = document.getElementById('datecalc-popover');
      if (!pop) return;
      const wasOpen = !pop.classList.contains('hidden') && !pop.classList.contains('opacity-0');
      const open = typeof force === 'boolean' ? force : !wasOpen;
      if (!open && pop.classList.contains('hidden')) return;
      const btn = document.getElementById('datecalc-toggle');
      if (btn) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        ['bg-cyan-500/20', 'border-cyan-500/40'].forEach(c => btn.classList.toggle(c, open));
      }
      clearTimeout(pop._t);
      if (open) {
        pop.classList.remove('hidden');
        requestAnimationFrame(() => pop.classList.remove('opacity-0', '-translate-y-1'));
        refreshIcons();
      } else {
        pop.classList.add('opacity-0', '-translate-y-1');
        pop._t = setTimeout(() => pop.classList.add('hidden'), 150);
      }
    }

    document.addEventListener('mousedown', (e) => {
      const pop = document.getElementById('datecalc-popover');
      if (!pop || pop.classList.contains('hidden')) return;
      if (pop.contains(e.target) || e.target.closest('#datecalc-toggle')) return;
      toggleDateCalc(false);
    });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleDateCalc(false); });

    function calcDates() {
      const out = document.getElementById('datecalc-result');
      const sum = document.getElementById('datecalc-summary');
      if (!out) return;
      const t1 = dcParse(document.getElementById('datecalc-start').value);
      const t2 = dcParse(document.getElementById('datecalc-end').value);
      dcLastText = '';

      if (t1 === null || t2 === null) {
        if (sum) { sum.textContent = ''; sum.classList.add('hidden'); }
        out.innerHTML = '<div class="rounded-lg border border-dashed border-slate-700 bg-slate-950/60 px-3 py-3 text-[11px] text-slate-400 flex items-center gap-2"><i data-lucide="info" class="w-3.5 h-3.5 text-cyan-400 shrink-0"></i><span>Saisissez une date de début et une date de fin pour calculer le nombre de jours.</span></div>';
        refreshIcons();
        return;
      }

      const reversed = t2 < t1;
      const lo = Math.min(t1, t2), hi = Math.max(t1, t2);
      const diff = Math.round((hi - lo) / DC_DAY);
      const weeks = Math.floor(diff / 7), restDays = diff % 7;
      const ymd = dcYMD(lo, hi);
      const excl = document.getElementById('datecalc-holidays').checked;
      const wd = dcWorkdays(lo, hi, excl);

      const weeksText = weeks ? dcPl(weeks, 'semaine') + (restDays ? ' et ' + dcPl(restDays, 'jour') : '') : dcPl(restDays, 'jour');
      const wdText = wd ? dcPl(wd.count, 'jour ouvré') : 'Période trop longue';
      const wdSub = wd ? (excl ? 'lun.–ven., hors fériés' + (wd.excluded ? ' (' + wd.excluded + ' exclu' + (wd.excluded > 1 ? 's' : '') + ')' : '') : 'lun.–ven., fériés inclus') + ', dates incluses' : '';

      if (sum) { sum.textContent = (diff + 1).toLocaleString('fr-FR') + ' j'; sum.classList.remove('hidden'); }

      dcLastText = 'Du ' + dcFmtDate(lo) + ' au ' + dcFmtDate(hi) + ' inclus : ' + dcPl(diff + 1, 'jour') +
        ' (' + dcPl(diff, 'jour') + ' sans compter la date de début) – ' + weeksText + ' – ' + dcYMDText(ymd) +
        (wd ? ' – ' + wdText + ' (' + wdSub + ')' : '');

      const card = (label, value, sub) =>
        '<div class="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2.5 min-w-0">' +
        '<div class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">' + label + '</div>' +
        '<div class="text-xs font-bold text-white mt-1 leading-snug">' + value + '</div>' +
        (sub ? '<div class="text-[10px] text-slate-400 mt-0.5 leading-snug">' + sub + '</div>' : '') + '</div>';

      out.innerHTML =
        (reversed ? '<div class="mb-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-300 flex items-center gap-2"><i data-lucide="alert-triangle" class="w-3.5 h-3.5 shrink-0"></i><span>La date de fin est antérieure à la date de début : l\u2019écart est calculé dans l\u2019ordre chronologique.</span></div>' : '') +
        '<div class="dc-hero"><div class="min-w-0">' +
          '<div class="dc-hero-k">Dates incluses (début et fin comptés)</div>' +
          '<div class="dc-hero-v">' + dcPl(diff + 1, 'jour') + '</div>' +
          '<div class="dc-hero-s">du ' + dcFmtDate(lo) + ' au ' + dcFmtDate(hi) + ' inclus</div></div>' +
          '<button type="button" onclick="dcCopy()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all shrink-0" title="Copier le résultat"><i data-lucide="copy" class="w-3.5 h-3.5"></i>Copier</button></div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5">' +
          card('Jours ouvrés (dates incluses)', wdText, wdSub) +
          card('En semaines', weeksText, '') +
          card('Années · mois · jours', dcYMDText(ymd), 'calendaire') +
        '</div>' +
        '<div class="dc-minor">Écart sans compter la date de début : ' + dcPl(diff, 'jour') + '.</div>';
      refreshIcons();
    }

    function initDateCalc() {
      calcDates();
    }

    // ===== Accueil portail =====
    const HOME_GROUPS = [
      { title: 'Outils agent', icon: 'mail', ids: ['cvm'] },
      { title: 'Simulateurs & calculateurs', icon: 'calculator', ids: ['dossier', 3, 5, 6, 7, 9, 'delais'] },
      { title: 'Droits & réglementation', icon: 'scale', ids: [1, 2, 4, 8, 'cfd', 'bareme'] }
    ];

    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && String(activeNavTab) === 'home' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
        e.preventDefault();
        document.getElementById('home-search')?.focus();
      }
    });

    // ===== Page CFD =====
    const CFD_TABS = [['sim', 'Simulateur CFD', 'calculator'], ['cond', 'Conditions', 'list-checks'], ['conj', 'Conjoncture', 'trending-down'], ['cff', 'CFF & seniors', 'users'], ['faq', 'FAQ', 'help-circle']];
    let cfdTab = 'sim', cfdDays = '';

    function cfdList(items) {
      return '<ol class="space-y-3">' + items.map((it, i) => `<li class="flex gap-3"><span class="w-6 h-6 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0">${i + 1}</span><div><div class="text-sm font-bold text-white">${it[0]}</div><div class="text-xs text-slate-300 mt-0.5">${it[1]}</div></div></li>`).join('') + '</ol>';
    }

    function cfdSetTab(t) { cfdTab = t; initCfdView(); }

    function cfdCalc() {
      cfdDays = document.getElementById('cfd-days').value;
      const T = parseInt(cfdDays, 10), out = document.getElementById('cfd-result');
      if (!(T > 0)) { out.innerHTML = '<div class="text-xs text-slate-400">Renseignez la durée théorique pour calculer le CFD.</div>'; return; }
      const notif = Math.round(T * 0.75), cfd = Math.min(182, T - notif);
      out.innerHTML = `<div class="text-[10px] uppercase tracking-wider font-semibold text-slate-400">CFD estimé</div>
        <div class="text-2xl font-extrabold text-cyan-300">${cfd} jour${cfd > 1 ? 's' : ''}</div>
        <div class="text-xs text-slate-300 mt-1">Durée notifiée : ${notif} j (${T} × 0,75) · écart compensé : ${T - notif} j${T - notif > 182 ? ' (plafonné à 182 j)' : ''}</div>`;
    }

    function initCfdView() {
      const tabs = document.getElementById('cfd-tabs'), panel = document.getElementById('cfd-panel');
      if (!tabs || !panel) return;
      tabs.innerHTML = CFD_TABS.map(t => `<button onclick="cfdSetTab('${t[0]}')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${cfdTab === t[0] ? 'font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm' : 'font-medium text-slate-400 hover:text-white hover:bg-slate-800/80'}"><i data-lucide="${t[2]}" class="w-3.5 h-3.5"></i>${t[1]}</button>`).join('');
      const P = {
        sim: `<h3 class="text-sm font-bold text-white mb-1">Calculateur de jours de CFD</h3>
          <p class="text-xs text-slate-400 mb-3">Durée théorique de l'ARE (avant coefficient 0,75), visible sur la notification d'ouverture de droits.</p>
          <div class="flex items-end gap-3 flex-wrap"><div><label class="text-[11px] font-semibold text-slate-300">Durée théorique (jours)</label>
          <input id="cfd-days" type="number" min="0" value="${cfdDays}" oninput="cfdCalc()" class="mt-1 w-44 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none font-medium"></div>
          <button onclick="document.getElementById('cfd-days').value='';cfdCalc()" class="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs">Réinitialiser</button></div>
          <div id="cfd-result" class="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3"></div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">${[[730, 548, 182], [548, 411, 137], [365, 274, 91], [182, 137, 45]].map(x => `<button onclick="document.getElementById('cfd-days').value=${x[0]};cfdCalc()" class="text-left rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 px-3 py-2"><div class="text-xs font-bold text-white">${x[0]} j théoriques</div><div class="text-[10px] text-slate-400">notifiés ${x[1]} j · CFD ${x[2]} j</div></button>`).join('')}</div>
          <p class="text-[11px] text-slate-400 mt-3">Formule : CFD = durée théorique − (durée théorique × 0,75), plafonné à 182 jours.</p>`,
        cond: '<h3 class="text-sm font-bold text-white mb-3">Conditions pour bénéficier du CFD</h3>' + cfdList([
          ['ARE en France métropolitaine', 'Le coefficient 0,75 ne s\u2019applique pas dans les DOM, TOM et collectivités d\u2019outre-mer (Mayotte incluse).'],
          ['Durée de droits réduite par le coefficient 0,75', 'La durée théorique doit être supérieure à la durée notifiée.'],
          ['Affiliation supérieure à 6 mois', '130 jours ou 910 heures : avec exactement 6 mois, les droits sont déjà au minimum.'],
          ['Conjoncture dégradée à la fin des droits', 'Taux de chômage BIT ≥ 9 % ou hausse d\u2019au moins 0,8 point sur un trimestre, actée par circulaire Unédic.']
        ]) + '<div class="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">Exclus : marins-pêcheurs, dockers, intermittents du spectacle et résidents des DOM/TOM. Un droit ouvert en métropole puis transféré outre-mer peut rester éligible.</div>',
        conj: '<h3 class="text-sm font-bold text-white mb-3">Déclenchement et arrêt</h3>' + cfdList([
          ['Condition A — hausse brutale', 'Taux de chômage BIT en hausse d\u2019au moins 0,8 point sur un trimestre (France hors Mayotte).'],
          ['Condition B — seuil absolu', 'Taux de chômage BIT supérieur ou égal à 9 %.'],
          ['Déclenchement', 'Circulaire Unédic publiée dans les 10 jours suivant la publication INSEE.'],
          ['Arrêt', 'Après 3 trimestres consécutifs de baisse ou de hausse inférieure à 0,8 point, avec un taux sous 9 % : un arrêté met fin au CFD le 1er du mois suivant.']
        ]) + '<p class="text-xs text-slate-400 mt-3">Un CFD déjà notifié n\u2019est pas perdu en cas de retour à une conjoncture favorable.</p>',
        cff: '<h3 class="text-sm font-bold text-white mb-3">CFF et allongement senior</h3>' + cfdList([
          ['Complément de fin de formation (CFF)', 'Droits ouverts selon les règles du 1er février 2023, formation qualifiante inscrite au contrat d\u2019engagement, d\u2019au moins 6 mois.'],
          ['Allongement senior (55 ans et plus)', 'Pour les formations en ARE-F ou CPF : jusqu\u2019à 137 jours en métropole, 182 dans les DOM/TOM.'],
          ['Plafonds totaux', '55-56 ans : jusqu\u2019à 822 jours · 57 ans et plus : jusqu\u2019à 959 jours.'],
          ['Ordre d\u2019application', 'Allongement senior, puis CFD, puis CFF : chaque dispositif s\u2019ajoute au précédent.']
        ]),
        faq: '<div class="space-y-2">' + [
          ['Dois-je faire une demande de CFD ?', 'Non. France Travail notifie le CFD dans les 30 jours précédant la fin des droits.'],
          ['Quel est le maximum de jours ?', '182 jours, soit environ 6 mois, pour une durée théorique de 730 jours.'],
          ['Le CFD concerne-t-il les DOM ?', 'Non, le coefficient 0,75 ne s\u2019y applique pas.'],
          ['Que se passe-t-il si la conjoncture s\u2019améliore ?', 'Le CFD cesse pour les nouveaux bénéficiaires, mais celui déjà notifié est conservé.'],
          ['Et avec exactement 6 mois d\u2019affiliation ?', 'Pas de CFD : les droits sont déjà au minimum.']
        ].map(q => `<details class="rounded-lg bg-slate-950 border border-slate-800 px-3 py-2"><summary class="text-xs font-semibold text-white cursor-pointer">${q[0]}</summary><p class="text-xs text-slate-300 mt-2">${q[1]}</p></details>`).join('') + '</div>'
      };
      panel.innerHTML = P[cfdTab];
      if (cfdTab === 'sim') cfdCalc();
      refreshIcons();
    }

    // ===== Remplacement de la bibliothèque (export BiblioMails du 20/10/2026) =====
    function replaceLibraryOnce() {
      const FLAG = 'ft_library_replaced_20261020';
      if (safeLS.getItem(FLAG) === '1') return;
      const hadSaved = safeLS.getItem('ft_templates') !== null;
      templates = OFFICIAL_TEMPLATES.map(t => ({ ...t }));
      categoryList = DEFAULT_CATEGORIES.map(c => ({ ...c }));
      favorites = [...DEFAULT_FAVORITES];
      const ids = new Set(templates.map(t => t.id));
      Object.keys(userVariables).forEach(k => { if (!ids.has(k)) delete userVariables[k]; });
      currentCategory = 'all';
      activeTemplateId = null;
      safeLS.removeItem('ft_custom_templates');
      saveState();
      safeLS.setItem(FLAG, '1');
      if (hadSaved) setTimeout(() => showToast(templates.length + ' modèles et ' + categoryList.length + ' catégories chargés', 'success'), 500);
    }

    // ===== Icônes & couleurs des catégories (rubrique CVM) =====
    const CAT_STYLES = {
      'Rejet démission': ['ban', 'rose'], 'Démission': ['door-open', 'purple'],
      'Poursuite indemnisation (DC)': ['shield-check', 'emerald'], "Droit d'option": ['shuffle', 'blue'],
      'ASS': ['handshake', 'teal'], 'Complément ARE': ['coins', 'amber'], 'Admission': ['badge-check', 'emerald'],
      'Documents': ['file-text', 'cyan'], 'Divers': ['folder-open', 'blue'], 'Contact': ['phone', 'cyan'],
      'Rechargement': ['battery-charging', 'emerald'], 'Recours IPR': ['gavel', 'purple'],
      'Reprise': ['briefcase', 'emerald'], 'Actualisation': ['calendar-check', 'cyan'], 'Affiliation': ['link', 'blue'],
      'Différé': ['timer', 'amber'], 'Formation': ['graduation-cap', 'indigo'], 'CAF / RSA': ['landmark', 'teal'],
      "Reprise & droit d'option": ['repeat', 'blue'], 'ANS': ['rocket', 'indigo'], 'Modification AE': ['user-cog', 'indigo'],
      'DPAE': ['file-signature', 'emerald'], 'IPR DV 121 jours': ['scale', 'purple'], 'CRE': ['building', 'indigo'],
      'Fin de droit SAE': ['hourglass', 'rose'], 'Calcul ARE': ['calculator', 'amber']
    };

    function catStyle(name) {
      const c = categoryList.find(x => x.name === name) || {};
      const m = /text-(\w+)-400/.exec(c.color || '');
      return { icon: c.icon || 'folder', hue: m ? m[1] : 'cyan' };
    }

    function applyCategoryStyles() {
      let changed = false;
      categoryList.forEach(c => {
        const def = CAT_STYLES[c.name];
        if (def && (!c.icon || c.icon === 'folder')) {
          c.icon = def[0];
          c.color = 'bg-' + def[1] + '-500/10 text-' + def[1] + '-400';
          changed = true;
        }
      });
      if (changed) saveState();
    }

    function updateSortButton() {
      const b = document.getElementById('sort-btn');
      if (!b) return;
      const L = { default: ['list', "Ordre d'origine"], az: ['arrow-down-a-z', 'A → Z'], za: ['arrow-up-z-a', 'Z → A'] }[sortMode];
      b.innerHTML = `<span class="flex items-center gap-1.5"><i data-lucide="${L[0]}" class="w-3 h-3 text-cyan-400"></i><span>Tri :</span><span class="text-slate-100 font-bold">${L[1]}</span></span><i data-lucide="chevrons-up-down" class="w-3 h-3 text-slate-400"></i>`;
      refreshIcons();
    }

    function cycleSort() {
      sortMode = { default: 'az', az: 'za', za: 'default' }[sortMode];
      saveState();
      updateSortButton();
      renderTemplatesList();
    }

    // ===== Échappement pour un argument JS placé dans un attribut onclick =====
    function attrJs(s) {
      return escapeHtml(String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
    }

    // ===== Recherche : normalisation, score, surlignage =====
    // Chaque caractère est normalisé en un seul caractère : les positions restent alignées sur le texte d'origine.
    function nrm(s) {
      s = String(s == null ? '' : s);
      let o = '';
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === '\u00a0' || c === '\u202f') { o += ' '; continue; }
        if (c === '\u2019' || c === '\u2018') { o += "'"; continue; }
        let d = c.normalize('NFD')[0] || c;
        d = d.toLowerCase();
        o += d.length === 1 ? d : c;
      }
      return o;
    }

    function qTerms(q) {
      return nrm(q).split(/\s+/).filter(Boolean);
    }

    const _tplIdx = new Map();
    function tplIndex(tpl) {
      const tags = (tpl.tags || []).join(' ');
      let e = _tplIdx.get(tpl.id);
      if (!e || e.title !== tpl.title || e.short !== tpl.shortTitle || e.cat !== tpl.category || e.tags !== tags || e.body !== tpl.body) {
        e = {
          title: tpl.title, short: tpl.shortTitle, cat: tpl.category, tags: tags, body: tpl.body,
          t: nrm(tpl.title), s: nrm(tpl.shortTitle), c: nrm(tpl.category), g: nrm(tags), b: nrm(tpl.body)
        };
        _tplIdx.set(tpl.id, e);
      }
      return e;
    }

    // 0 = ne correspond pas. Tous les mots saisis doivent être trouvés (ET), le titre compte le plus.
    function scoreTpl(tpl, terms) {
      if (!terms.length) return 1;
      const ix = tplIndex(tpl);
      let total = 0;
      for (const t of terms) {
        let s = 0;
        if (ix.t.startsWith(t)) s = 100;
        else if (ix.t.includes(' ' + t)) s = 80;
        else if (ix.t.includes(t)) s = 60;
        else if (ix.s.includes(t)) s = 45;
        else if (ix.g.includes(t)) s = 35;
        else if (ix.c.includes(t)) s = 30;
        else if (ix.b.includes(t)) s = 10;
        if (!s) return 0;
        total += s;
      }
      return total;
    }

    function hl(text, terms, cls) {
      text = String(text == null ? '' : text);
      cls = cls || 'sg-mark';
      if (!terms || !terms.length) return escapeHtml(text);
      const n = nrm(text), r = [];
      terms.forEach(t => {
        let i = 0;
        while ((i = n.indexOf(t, i)) !== -1) { r.push([i, i + t.length]); i += t.length; }
      });
      if (!r.length) return escapeHtml(text);
      r.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
      const m = [r[0].slice()];
      for (let k = 1; k < r.length; k++) {
        const last = m[m.length - 1];
        if (r[k][0] <= last[1]) last[1] = Math.max(last[1], r[k][1]);
        else m.push(r[k].slice());
      }
      let out = '', pos = 0;
      m.forEach(([a, b]) => {
        out += escapeHtml(text.slice(pos, a)) + '<mark class="' + cls + '">' + escapeHtml(text.slice(a, b)) + '</mark>';
        pos = b;
      });
      return out + escapeHtml(text.slice(pos));
    }

    // Court extrait du corps du mail autour du premier mot trouvé ('' si la correspondance est ailleurs).
    function snippetFor(tpl, terms, len) {
      len = len || 90;
      const body = String(tpl.body || '').replace(/\s+/g, ' ').trim();
      if (!body || !terms.length) return '';
      const n = nrm(body);
      let at = -1;
      for (const t of terms) {
        const i = n.indexOf(t);
        if (i !== -1 && (at === -1 || i < at)) at = i;
      }
      if (at === -1) return '';
      const start = Math.max(0, at - 28);
      let s = body.slice(start, start + len);
      if (start > 0) s = '…' + s.replace(/^\S*\s/, '');
      if (start + len < body.length) s = s.replace(/\s\S*$/, '') + '…';
      return s;
    }

    // ===== Mails ouverts récemment =====
    let recentTemplates = [];
    try {
      recentTemplates = JSON.parse(safeLS.getItem('ft_recent_templates') || '[]');
      if (!Array.isArray(recentTemplates)) recentTemplates = [];
    } catch (e) { recentTemplates = []; }

    function pushRecent(id) {
      if (!id) return;
      recentTemplates = [id].concat(recentTemplates.filter(x => x !== id)).slice(0, 8);
      try { safeLS.setItem('ft_recent_templates', JSON.stringify(recentTemplates)); } catch (e) {}
    }

    // ===== Tri des catégories (volet de gauche) =====
    const CAT_SORT_MODES = {
      default: { next: 'az', icon: 'list', short: 'Origine', label: "ordre d'origine" },
      az: { next: 'za', icon: 'arrow-down-a-z', short: 'A → Z', label: 'alphabétique A → Z' },
      za: { next: 'count', icon: 'arrow-up-z-a', short: 'Z → A', label: 'alphabétique Z → A' },
      count: { next: 'default', icon: 'arrow-down-wide-narrow', short: 'Nb mails', label: 'plus de mails en premier' }
    };

    function cycleCatSort() {
      catSortMode = (CAT_SORT_MODES[catSortMode] || CAT_SORT_MODES.default).next;
      try { safeLS.setItem('ft_cat_sort_mode', catSortMode); } catch (e) {}
      renderCategoryPills();
    }

    function sortedCategories(counts) {
      const list = categoryList.slice();
      const cmp = (a, b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base', numeric: true, ignorePunctuation: true });
      if (catSortMode === 'az') list.sort(cmp);
      else if (catSortMode === 'za') list.sort((a, b) => cmp(b, a));
      else if (catSortMode === 'count') list.sort((a, b) => ((counts[b.name] || 0) - (counts[a.name] || 0)) || cmp(a, b));
      return list;
    }

    // ===== Menu déroulant de suggestions (barre de recherche des mails) =====
    let sgOpen = false, sgIndex = -1, sgItems = [];

    function openSuggest() {
      sgOpen = true;
      renderSuggest();
    }

    function closeSuggest() {
      sgOpen = false; sgIndex = -1; sgItems = [];
      const el = document.getElementById('search-suggest');
      if (el) el.classList.remove('open');
      const inp = document.getElementById('search-input');
      if (inp) { inp.setAttribute('aria-expanded', 'false'); inp.removeAttribute('aria-activedescendant'); }
    }

    function positionSuggest() {
      const el = document.getElementById('search-suggest');
      const inp = document.getElementById('search-input');
      if (!el || !inp || !el.classList.contains('open')) return;
      const r = inp.getBoundingClientRect();
      if (!r.width) { closeSuggest(); return; }
      const vw = window.innerWidth, vh = window.innerHeight;
      const small = vw < 640;
      const width = small ? vw - 16 : Math.min(Math.max(r.width, 460), vw - r.left - 12);
      const top = r.bottom + 8;
      el.style.left = (small ? 8 : r.left) + 'px';
      el.style.top = top + 'px';
      el.style.width = width + 'px';
      el.style.maxHeight = Math.max(220, vh - top - 12) + 'px';
    }

    function sgRowTpl(tpl, i, terms) {
      const st = catStyle(tpl.category);
      const snip = snippetFor(tpl, terms, 80);
      const star = favorites.includes(tpl.id) ? '<i data-lucide="star" class="w-3.5 h-3.5 sg-star fill-amber-400"></i>' : '';
      return '<div id="sg-opt-' + i + '" role="option" class="sg-item" data-i="' + i + '" aria-selected="false" onmousedown="event.preventDefault()" onclick="sgActivate(' + i + ')" onmousemove="sgSelect(' + i + ', false)">' +
        '<span class="sg-ico bg-' + st.hue + '-500/15 text-' + st.hue + '-400"><i data-lucide="' + st.icon + '" class="w-3.5 h-3.5"></i></span>' +
        '<span class="sg-body"><span class="sg-title">' + hl(tpl.title, terms) + '</span>' +
        '<span class="sg-sub"><span class="sg-cat">' + escapeHtml(tpl.category) + '</span>' + (snip ? '<span class="sg-snip">' + hl(snip, terms) + '</span>' : '') + '</span></span>' +
        star + '</div>';
    }

    function sgRowCat(cat, i, count) {
      const st = catStyle(cat.name);
      return '<div id="sg-opt-' + i + '" role="option" class="sg-item" data-i="' + i + '" aria-selected="false" onmousedown="event.preventDefault()" onclick="sgActivate(' + i + ')" onmousemove="sgSelect(' + i + ', false)">' +
        '<span class="sg-ico bg-' + st.hue + '-500/15 text-' + st.hue + '-400"><i data-lucide="' + st.icon + '" class="w-3.5 h-3.5"></i></span>' +
        '<span class="sg-body"><span class="sg-title">' + escapeHtml(cat.name) + '</span><span class="sg-sub"><span class="sg-cat">Ouvrir la catégorie</span></span></span>' +
        '<span class="font-mono text-[10px] opacity-70">' + count + '</span></div>';
    }

    function renderSuggest() {
      const el = document.getElementById('search-suggest');
      const inp = document.getElementById('search-input');
      if (!sgOpen || !el || !inp) return;
      const raw = inp.value.trim();
      const terms = qTerms(raw);
      const byId = id => templates.find(t => t.id === id);
      sgItems = [];
      let html = '';

      if (!terms.length) {
        const rec = recentTemplates.map(byId).filter(Boolean).slice(0, 4);
        const seen = new Set(rec.map(t => t.id));
        const fav = favorites.map(byId).filter(t => t && !seen.has(t.id)).slice(0, 4);
        if (rec.length) {
          html += '<div class="sg-head">Ouverts récemment</div>';
          rec.forEach(t => { html += sgRowTpl(t, sgItems.length, terms); sgItems.push({ type: 'tpl', id: t.id }); });
        }
        if (fav.length) {
          html += '<div class="sg-head">Vos favoris</div>';
          fav.forEach(t => { html += sgRowTpl(t, sgItems.length, terms); sgItems.push({ type: 'tpl', id: t.id }); });
        }
        if (!sgItems.length) {
          html = '<div class="sg-empty">Tapez pour chercher parmi ' + templates.length + ' modèles : titre, catégorie ou texte du mail.</div>';
        }
        sgIndex = -1;
      } else {
        const counts = {};
        templates.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1; });
        const scored = templates.map(t => ({ t: t, s: scoreTpl(t, terms) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
        const top = scored.slice(0, 8);
        const cats = categoryList.filter(c => { const n = nrm(c.name); return terms.every(w => n.includes(w)); }).slice(0, 3);
        if (top.length) {
          const n = scored.length;
          html += '<div class="sg-head">' + n + ' réponse' + (n > 1 ? 's' : '') + ' suggérée' + (n > 1 ? 's' : '') + '</div>';
          top.forEach(x => { html += sgRowTpl(x.t, sgItems.length, terms); sgItems.push({ type: 'tpl', id: x.t.id }); });
          if (n > top.length) html += '<div class="sg-head">' + (n - top.length) + ' autre' + (n - top.length > 1 ? 's' : '') + ' dans la liste de gauche</div>';
        }
        if (cats.length) {
          html += '<div class="sg-head">Catégories</div>';
          cats.forEach(c => { html += sgRowCat(c, sgItems.length, counts[c.name] || 0); sgItems.push({ type: 'cat', name: c.name }); });
        }
        if (!sgItems.length) {
          html = '<div class="sg-empty">Aucune réponse ne correspond à « ' + escapeHtml(raw) + ' ».<br>Essayez un mot plus court.</div>';
        }
        sgIndex = sgItems.length ? 0 : -1;
      }

      el.innerHTML = '<div class="sg-scroll" role="presentation">' + html + '</div>' +
        (sgItems.length ? '<div class="sg-foot"><span><kbd>↑</kbd><kbd>↓</kbd>naviguer</span><span><kbd>Entrée</kbd>choisir</span><span><kbd>Échap</kbd>fermer</span></div>' : '');
      el.classList.add('open');
      inp.setAttribute('aria-expanded', 'true');
      positionSuggest();
      refreshIcons();
      sgSelect(sgIndex, false);
    }

    function sgSelect(i, scroll) {
      sgIndex = i;
      document.querySelectorAll('#search-suggest .sg-item').forEach(n => {
        n.setAttribute('aria-selected', String(Number(n.dataset.i) === i));
      });
      const inp = document.getElementById('search-input');
      if (!inp) return;
      if (i >= 0) {
        inp.setAttribute('aria-activedescendant', 'sg-opt-' + i);
        if (scroll) { const o = document.getElementById('sg-opt-' + i); if (o) o.scrollIntoView({ block: 'nearest' }); }
      } else {
        inp.removeAttribute('aria-activedescendant');
      }
    }

    function sgActivate(i) {
      const it = sgItems[i];
      if (!it) return;
      if (it.type === 'tpl') {
        pickSuggestion(it.id);
      } else {
        const inp = document.getElementById('search-input');
        if (inp) inp.value = '';
        handleSearch('');
        closeSuggest();
        selectCategory(it.name);
      }
    }

    // Ouvre le mail choisi : change de catégorie si besoin, l'affiche dans la liste et l'aperçu.
    function pickSuggestion(id) {
      const tpl = templates.find(t => t.id === id);
      if (!tpl) return;
      closeSuggest();
      if (searchQuery && !scoreTpl(tpl, qTerms(searchQuery))) {
        const inp = document.getElementById('search-input');
        if (inp) inp.value = '';
        handleSearch('');
      }
      const inScope = currentCategory === 'all' ||
        (currentCategory === 'favorites' ? favorites.includes(id) : currentCategory === tpl.category);
      activeTemplateId = id;
      if (!inScope) selectCategory(tpl.category);
      selectTemplate(id);
      const row = document.querySelector('#templates-list [data-tpl-id="' + id.replace(/["\\]/g, '\\$&') + '"]');
      if (row) row.scrollIntoView({ block: 'nearest' });
    }

    function suggestKey(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!sgOpen) { openSuggest(); return; }
        const n = sgItems.length;
        if (!n) return;
        const down = e.key === 'ArrowDown';
        sgSelect(down ? (sgIndex + 1) % n : (sgIndex <= 0 ? n - 1 : sgIndex - 1), true);
      } else if (e.key === 'Enter') {
        if (sgOpen && sgItems.length) { e.preventDefault(); sgActivate(sgIndex >= 0 ? sgIndex : 0); }
      } else if (e.key === 'Escape') {
        if (sgOpen) { e.preventDefault(); closeSuggest(); }
        else if (e.target.value) { e.preventDefault(); clearSearch(false); }
      } else if (e.key === 'Tab') {
        closeSuggest();
      }
    }

    document.addEventListener('mousedown', (e) => {
      if (!sgOpen) return;
      const el = document.getElementById('search-suggest');
      const inp = document.getElementById('search-input');
      const clr = document.getElementById('clear-search-btn');
      if ((el && el.contains(e.target)) || e.target === inp || (clr && clr.contains(e.target))) return;
      closeSuggest();
    });
    window.addEventListener('resize', positionSuggest);

    // ===== Page d'accueil =====
    function homeTile(t, terms) {
      return '<button type="button" onclick="switchNavTab(\'' + t.id + '\')" class="home-tile">' +
        '<span class="home-tile-ico border ' + t.color + '"><i data-lucide="' + t.icon + '" class="w-5 h-5"></i></span>' +
        '<span class="home-tile-txt"><span class="home-tile-name">' + hl(t.name, terms, 'home-mark') + '</span>' +
        '<span class="home-tile-desc">' + hl(t.desc, terms, 'home-mark') + '</span>' +
        '<span class="home-tile-badge">' + escapeHtml(t.badge) + '</span></span>' +
        '<i data-lucide="arrow-right" class="w-4 h-4 home-tile-go"></i></button>';
    }

    function homeMailRow(tpl, terms) {
      const st = catStyle(tpl.category);
      const snip = snippetFor(tpl, terms, 100);
      return '<button type="button" class="home-row" onclick="openTemplateFromHome(\'' + attrJs(tpl.id) + '\')">' +
        '<span class="home-row-ico bg-' + st.hue + '-500/15 text-' + st.hue + '-400"><i data-lucide="' + st.icon + '" class="w-4 h-4"></i></span>' +
        '<span class="home-row-txt"><span class="home-row-title">' + hl(tpl.title, terms, 'home-mark') + '</span>' +
        '<span class="home-row-sub"><b>' + escapeHtml(tpl.category) + '</b>' + (snip ? '  ' + hl(snip, terms, 'home-mark') : '') + '</span></span></button>';
    }

    function homeQuickCard(o) {
      return '<button type="button" class="home-quick-card" style="--c:' + o.rgb + ';--ci:' + o.ink + '" onclick="' + o.action + '">' +
        '<span class="home-quick-ico"><i data-lucide="' + o.icon + '" class="w-6 h-6"></i></span>' +
        '<span class="home-quick-txt"><span class="home-quick-name">' + o.name + '</span><span class="home-quick-desc">' + o.desc + '</span></span>' +
        '<span class="home-quick-go">' + o.go + '<i data-lucide="arrow-right" class="w-4 h-4"></i></span></button>';
    }

    function homeDefaultHtml() {
      const byId = id => templates.find(t => t.id === id);
      const favs = favorites.map(byId).filter(Boolean);
      const recent = recentTemplates.map(byId).filter(Boolean).slice(0, 5);

      const quick = '<section class="home-quick" aria-label="Accès rapide">' +
        homeQuickCard({ rgb: '52,211,153', ink: '#2f8f6c', icon: 'clipboard-check', name: "Simulateur d'admission",
          desc: "Vérifier les 6 conditions d'ouverture de droits et estimer l'ARE.", go: 'Ouvrir le simulateur', action: "switchNavTab('1')" }) +
        homeQuickCard({ rgb: '251,191,36', ink: '#a8741f', icon: 'star', name: 'CVM favoris',
          desc: favs.length ? favs.length + ' modèle' + (favs.length > 1 ? 's' : '') + ' de mail épinglé' + (favs.length > 1 ? 's' : '') + ' pour un accès direct.' : "Épinglez vos modèles les plus utilisés avec l'étoile.",
          go: 'Voir mes favoris', action: "openCvmCategory('favorites')" }) +
        homeQuickCard({ rgb: '129,140,248', ink: '#4f5bb0', icon: 'calendar-clock', name: 'Simulateur ICCP',
          desc: 'Différé congés payés et attestation CIBTP pour le BTP.', go: 'Ouvrir le simulateur', action: "switchNavTab('7')" }) +
        '</section>';

      const favPanel =
        '<section class="home-panel" aria-label="CVM favoris">' +
          '<div class="home-panel-head"><h2><i data-lucide="star" class="w-4 h-4" style="color:var(--h-accent)"></i>CVM favoris<span class="home-count">' + favs.length + '</span></h2>' +
          '<button type="button" class="home-link" onclick="switchNavTab(\'cvm\')">Ouvrir CVM Direct</button></div>' +
          (favs.length ? favs.slice(0, 6).map(t => homeMailRow(t, [])).join('') +
            (favs.length > 6 ? '<button type="button" class="home-more" onclick="openCvmCategory(\'favorites\')">Afficher les ' + favs.length + ' favoris</button>' : '')
            : '<div class="home-empty">Aucun favori pour le moment. Dans CVM Direct, cliquez sur l\u2019étoile d\u2019un modèle pour le retrouver ici.</div>') +
        '</section>';

      const recentPanel =
        '<section class="home-panel" aria-label="Reprendre">' +
          '<div class="home-panel-head"><h2><i data-lucide="history" class="w-4 h-4" style="color:var(--h-accent)"></i>Reprendre</h2></div>' +
          (recent.length ? recent.map(t => homeMailRow(t, [])).join('')
            : '<div class="home-empty">Les modèles que vous ouvrez dans CVM Direct apparaissent ici.</div>') +
        '</section>';

      const sections = HOME_GROUPS.map(g => {
        const tabs = g.ids.filter(id => id !== 'cvm').map(id => NAV_TABS_CONFIG.find(t => String(t.id) === String(id))).filter(Boolean);
        if (!tabs.length) return '';
        return '<section class="home-section"><h2><i data-lucide="' + g.icon + '" class="w-4 h-4" style="color:var(--h-accent)"></i>' + g.title + '<span class="home-count">' + tabs.length + '</span></h2>' +
          '<div class="home-tiles">' + tabs.map(t => homeTile(t, [])).join('') + '</div></section>';
      }).join('');

      return quick + '<div class="home-top">' + favPanel + '</div>' + sections;
    }

    function homeResultsHtml(q, terms) {
      const tools = NAV_TABS_CONFIG.filter(t => t.id !== 'home' && terms.every(w => ftToolHay(t).includes(w)));
      const scored = templates.map(t => ({ t: t, s: scoreTpl(t, terms) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s);
      const top = scored.slice(0, 8);
      let html = '';
      if (tools.length) {
        html += '<section class="home-section"><h2><i data-lucide="layout-grid" class="w-4 h-4" style="color:var(--h-accent)"></i>Outils<span class="home-count">' + tools.length + '</span></h2>' +
          '<div class="home-tiles">' + tools.map(t => homeTile(t, terms)).join('') + '</div></section>';
      }
      if (top.length) {
        html += '<section class="home-section"><h2><i data-lucide="mail" class="w-4 h-4" style="color:var(--h-accent)"></i>Modèles de mail<span class="home-count">' + scored.length + '</span></h2>' +
          '<div class="home-mail-list">' + top.map(x => homeMailRow(x.t, terms)).join('') +
          (scored.length > top.length ? '<button type="button" class="home-more" onclick="openCvmSearch(\'' + attrJs(q) + '\')">Afficher les ' + scored.length + ' modèles dans CVM Direct</button>' : '') +
          '</div></section>';
      }
      if (!html) {
        html = '<div class="home-panel"><div class="home-empty">Aucun résultat pour « ' + escapeHtml(q) + ' ». Essayez un mot plus court, ou ouvrez CVM Direct pour parcourir les catégories.</div></div>';
      }
      return html;
    }

    function renderHome(q) {
      const main = document.getElementById('home-main');
      if (!main) return;
      const input = document.getElementById('home-search');
      q = (typeof q === 'string' ? q : (input ? input.value : '')).trim();
      const h = new Date().getHours();
      const title = document.getElementById('home-title');
      const me = ftCurrentUser();
      if (title) title.textContent = ((h >= 18 || h < 4) ? 'Bonsoir' : 'Bonjour') + (me ? ' ' + me.name : '') + ', que cherchez-vous ?';
      startHomeClock();
      const terms = qTerms(q);
      main.innerHTML = terms.length ? homeResultsHtml(q, terms) : homeDefaultHtml();
      refreshIcons();
    }

    function homeKey(e) {
      if (e.key === 'Escape') {
        e.target.value = '';
        renderHome('');
      } else if (e.key === 'Enter') {
        const terms = qTerms(e.target.value);
        if (!terms.length) return;
        const tool = NAV_TABS_CONFIG.find(t => t.id !== 'home' && terms.every(w => ftToolHay(t).includes(w)));
        if (tool) { switchNavTab(String(tool.id)); return; }
        const best = templates.map(t => ({ t: t, s: scoreTpl(t, terms) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s)[0];
        if (best) openTemplateFromHome(best.t.id);
      }
    }

    function openTemplateFromHome(id) {
      switchNavTab('cvm');
      pickSuggestion(id);
    }

    function openCvmCategory(name) {
      switchNavTab('cvm');
      const inp = document.getElementById('search-input');
      if (inp && inp.value) { inp.value = ''; handleSearch(''); }
      selectCategory(name);
    }

    function openCvmSearch(q) {
      switchNavTab('cvm');
      const inp = document.getElementById('search-input');
      if (inp) inp.value = q;
      handleSearch(q);
    }


    // Usage local sans compte
    function ftCurrentUser() { return null; }
    function renderUserChip() {}

    // ===== Horloge de l'accueil =====
    function homeTick() {
      const el = document.getElementById('home-time');
      if (!el) return;
      const d = new Date();
      const p = n => String(n).padStart(2, '0');
      /* on ne change que le texte (pas de reconstruction de l’horloge chaque seconde) */
      const hm = p(d.getHours()) + ':' + p(d.getMinutes()), sec = ':' + p(d.getSeconds());
      let sm = el.querySelector('small');
      if (!sm || el.firstChild.nodeType !== 3) { el.innerHTML = hm + '<small>' + sec + '</small>'; }
      else { if (el.firstChild.nodeValue !== hm) el.firstChild.nodeValue = hm; sm.firstChild ? (sm.firstChild.nodeValue = sec) : (sm.textContent = sec); }
      const dt = document.getElementById('home-date');
      if (dt) {
        const t = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const c = t.charAt(0).toUpperCase() + t.slice(1);
        if (dt.textContent !== c) dt.textContent = c;
      }
    }

    let _homeClock = null;
    function startHomeClock() {
      homeTick();
      if (_homeClock) return;
      _homeClock = setInterval(() => {
        const v = document.getElementById('view-home');
        if (v && !v.classList.contains('hidden')) homeTick();
      }, 1000);
    }

    // ===== Champs vides =====
    function ftClearFields(ids) {
      ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    }

    // =====================================================================
    //  BARÈME RÉGLEMENTAIRE : une seule source de valeurs pour tous les simulateurs
    //  Source principale : Unédic, « Paramètres utiles » (avril 2026), barème ARE en vigueur depuis le 01/07/2025
    //  (pas de revalorisation au 1er juillet 2026). À mettre à jour ici uniquement.
    // =====================================================================
    const BAREME = {
      verifie: '23/10/2026',
      sources: [
        { label: 'Unédic : Paramètres utiles, avril 2026 (PDF)', url: 'https://www.unedic.org/storage/uploads/2026/05/27/unedic_parametres_utiles_avril2026_uid_6a17039e9f727.pdf' },
        { label: 'Unédic : pas de revalorisation au 1er juillet 2026', url: 'https://www.unedic.org/actualites/allocations-dassurance-chomage-pas-de-revalorisation-au-1er-juillet-2026' },
        { label: 'Unédic : ce qui change le 1er septembre 2026', url: 'https://www.unedic.org/actualites/assurance-chomage-ce-qui-change-le-1er-septembre-2026' },
        { label: 'Unédic : différé spécifique (indemnités supra-légales)', url: 'https://www.unedic.org/indemnisation/fiches-thematiques/differe-dindemnisation-specifique-en-cas-dindemnites-supra-legales' }
      ],
      are: { partieFixe: 13.18, min: 32.13, formation: 22.99, max: 300.21, tauxA: 0.404, tauxB: 0.57, plafond: 0.75, effet: '01/07/2025' },
      degr: { coef: 0.7, seuil: 92.57, ageLimite: 55, moisDebut: 7 },
      duree: { coef: 0.75, min: 182, max: { u55: 548, a55: 685, a57: 822 }, cfd: { u55: 182, a55: 228, a57: 273 }, rci: { u55: 456, a55: 624, effet: '2026-09-01' } },
      affiliation: { jours: 130, heures: 910, joursSais: 108, heuresSais: 758 },
      differe: { attente: 7, cpMax: 30, diviseur: 111.8, specMax: 150, specMaxEco: 75 },
      cumul: { remun: 0.70, arce: 0.60, arretNonSalarie: 0.60, base: 30 },
      csp: { aspMin: 22.99, taux: 0.75, idrMois: 12, plafond: 0.5, primeMois: 10 },
      retenues: { csg: 0.062, crds: 0.005, assiette: 0.9825, retraiteCompl: 0.03, seuilCsgCrds: 61, seuilRc: 32.13 },
      solidarite: { ass: 19.48, ata: 13.73, assMayotte: 9.75, coefSeul: 70, coefCouple: 110, effet: '01/04/2026', verifie: '13/11/2026' },
      /* Paramètres des autres simulateurs (contrôlés par la veille hebdomadaire, comme le reste du barème) */
      ati: { forfait: 26.30, plancher: 19.73, forfaitMayotte: 19.73, plancherMayotte: 13.15, seuilRevenus: 10000, duree: 182, verifie: '13/10/2026' },
      rff: { plafondMensuel: 769.49, verifie: '05/10/2026' },
      indu: { seuilRecup: 77, prescription: 3, prescriptionFraude: 10, verifie: '01/10/2026' },
      invalidite: { min: 338.31, max1: 1201.50, max2: 2002.50, min3: 1636.76, max3: 3300.95, heures: 600, smicFois: 2030, effet: '01/04/2026', verifie: '01/04/2026' },
      cns: { deduc: 0.70, plafond: 0.60, avance: 0.80, provisoire: 0.70, abat: { vente: 0.71, bic: 0.50, bnc: 0.34 }, bncMin: 305, verifie: '23/10/2026' },
      generations: [
        ['Janvier à août 1961', '168', '62 ans'], ['Septembre à décembre 1961', '166', '62 ans et 3 mois'], ['1962', '167', '62 ans et 6 mois'],
        ['1963', '170', '62 ans et 9 mois'], ['1964', '170', '62 ans et 9 mois'], ['1er janvier au 31 mars 1965', '170', '62 ans et 9 mois'],
        ['1er avril au 31 décembre 1965', '171', '63 ans'], ['1966', '172', '63 ans et 3 mois'], ['1967', '172', '63 ans et 6 mois'],
        ['1968', '172', '63 ans et 9 mois'], ['À partir de 1969', '172', '64 ans']
      ]
    };

    const fmtEur = (n, d) => (Number.isFinite(n) ? n : 0).toLocaleString('fr-FR', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }) + ' €';

    // Allocation journalière : montant le plus favorable entre 40,4 % SJR + partie fixe, 57 % SJR et l'allocation minimale,
    // dans la limite de 75 % du SJR (et du maximum théorique).
    function ftAreJour(sjr) {
      const a = BAREME.are;
      const opA = a.tauxA * sjr + a.partieFixe;
      const opB = a.tauxB * sjr;
      let v = Math.max(opA, opB, a.min);
      let f = (a.min > Math.max(opA, opB)) ? 'min' : (opB >= opA ? '57' : '404');
      const lim = a.plafond * sjr;
      if (sjr > 0 && v > lim) { v = lim; f = 'plafond'; }
      if (v > a.max) { v = a.max; f = 'max'; }
      return { aj: sjr > 0 ? v : 0, formule: f, opA: opA, opB: opB, lim: lim };
    }

    const ARE_FORMULES = {
      '404': '40,4 % du SJR + partie fixe (13,18 €)', '57': '57 % du SJR', 'min': 'Allocation minimale (32,13 €)',
      'plafond': 'Plafonnée à 75 % du SJR', 'max': 'Maximum théorique (300,21 €)'
    };

    function ftParseDate(v) {
      if (!v) return null;
      const d = new Date(v + 'T12:00:00');
      return isNaN(d.getTime()) ? null : d;
    }
    function ftAddDays(d, n) { const r = new Date(d.getTime()); r.setDate(r.getDate() + n); return r; }
    function ftFmtDate(d) { return d ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'; }

    // ---------- Bandeau de barème dans la barre du haut ----------
    function renderRegBanner() {
      const el = document.getElementById('reg-banner-text');
      if (el) el.textContent = 'Barème Unédic vérifié le ' + BAREME.verifie;
    }

    // ---------- Vue « Barèmes » ----------
    function renderBareme() {
      const host = document.getElementById('bareme-body');
      if (!host) return;
      const B = BAREME;
      const row = (k, v, note) => '<div class="bar-row"><span class="bar-k">' + k + '</span><span class="bar-v">' + v + '</span>' + (note ? '<span class="bar-n">' + note + '</span>' : '') + '</div>';
      const card = (icon, title, tag, rows) => '<section class="bar-card"><div class="bar-head"><i data-lucide="' + icon + '" class="w-4 h-4"></i><h3>' + title + '</h3>' + (tag ? '<span class="bar-tag">' + tag + '</span>' : '') + '</div>' + rows + '</section>';
      const html =
        '<div class="bar-banner"><i data-lucide="badge-check" class="w-5 h-5"></i><div><strong>Barème Unédic vérifié le ' + B.verifie + '.</strong> Allocations en vigueur depuis le ' + B.are.effet + ' : pas de revalorisation au 1er juillet 2026. À confirmer sur unedic.org avant toute décision.</div></div>' +
        '<div class="bar-grid">' +
        card('coins', 'Allocation d\u2019aide au retour à l\u2019emploi (ARE)', 'depuis le ' + B.are.effet,
          row('Partie fixe', fmtEur(B.are.partieFixe)) + row('Allocation minimale', fmtEur(B.are.min)) + row('ARE formation', fmtEur(B.are.formation)) +
          row('Maximum théorique', fmtEur(B.are.max), 'par jour') +
          row('Calcul', 'Le plus favorable de : 40,4 % du SJR + partie fixe, 57 % du SJR, ou allocation minimale', 'dans la limite de 75 % du SJR') +
          row('Dégressivité', 'AJ × ' + B.degr.coef.toString().replace('.', ',') + ' dès le 7e mois', 'si moins de 55 ans à la fin du contrat et AJ > ' + fmtEur(B.degr.seuil) + ', sans descendre sous ce seuil') +
          row('Mensualisation', '30 jours', 'quel que soit le mois')) +
        card('hourglass', 'Durée d\u2019indemnisation', '',
          row('Calcul', 'Jours calendaires de la période de référence × 0,75', 'durée minimale ' + B.duree.min + ' jours') +
          row('Moins de 55 ans', B.duree.max.u55 + ' jours', '18 mois') + row('55 et 56 ans', B.duree.max.a55 + ' jours', '22,5 mois') + row('57 ans et plus', B.duree.max.a57 + ' jours', '27 mois') +
          row('Complément de fin de droits', B.duree.cfd.u55 + ' / ' + B.duree.cfd.a55 + ' / ' + B.duree.cfd.a57 + ' jours', 'si conjoncture défavorable (arrêté)') +
          row('Rupture conventionnelle', '15 mois (moins de 55 ans) · 20,5 mois (55 ans et +)', 'fins de contrat à compter du 01/09/2026')) +
        card('clipboard-check', 'Conditions d\u2019ouverture de droits', '',
          row('Affiliation', B.affiliation.jours + ' jours ou ' + B.affiliation.heures + ' h', '24 derniers mois (36 mois si 55 ans et +)') +
          row('Saisonniers et primo-entrants', B.affiliation.joursSais + ' jours ou ' + B.affiliation.heuresSais + ' h', 'primo : aucune ouverture de droit dans les 20 ans') +
          row('Démission pour projet professionnel', '1 300 jours travaillés', 'sur 60 mois, attestation Transitions Pro')) +
        card('calendar-clock', 'Différés et délai d\u2019attente', '',
          row('Délai d\u2019attente', B.differe.attente + ' jours') + row('Différé congés payés', 'ICCP ÷ SJR', 'plafonné à ' + B.differe.cpMax + ' jours') +
          row('Différé spécifique', 'Indemnités supra-légales ÷ ' + B.differe.diviseur.toString().replace('.', ','), 'plafond ' + B.differe.specMax + ' jours (' + B.differe.specMaxEco + ' jours si motif économique)')) +
        card('trending-up', 'Reprise d\u2019activité et création', '',
          row('Cumul ARE et salaire', '(ARE mensuelle − 70 % du brut) ÷ AJ', 'plafonné au salaire de référence mensuel') +
          row('ARCE', '60 % des allocations restantes', 'versée en 2 fois (50 % puis solde 6 mois après)') +
          row('Cumul ARE et revenus non salariés', 'Arrêt à 60 % du reliquat de droits')) +
        card('shield', 'Contrat de sécurisation professionnelle (CSP)', '',
          row('ASP', '75 % du SJR (1 an d\u2019ancienneté et +)', 'jamais inférieure à ' + fmtEur(B.csp.aspMin) + ' ni à l\u2019ARE') +
          row('Moins d\u2019un an d\u2019ancienneté', 'Montant de l\u2019ARE calculé sur le SJR CSP') +
          row('Durée', '12 mois', 'jusqu\u2019à 15 mois en cas de reprise d\u2019emploi dès le 7e mois') +
          row('IDR', '30 × SJR − salaire brut du nouvel emploi', '12 mois maximum, plafond 50 % des droits ASP restants') +
          row('Prime de reclassement', '50 % des droits ASP restants', 'reprise avant la fin du 10e mois, contrat de 6 mois et +')) +
        card('landmark', 'Limites d\u2019âge (maintien jusqu\u2019à la retraite)', '',
          '<div class="bar-table"><div class="bar-th"><span>Génération</span><span>Trimestres</span><span>Âge minimum</span></div>' +
          B.generations.map(g => '<div class="bar-tr"><span>' + g[0] + '</span><span>' + g[1] + '</span><span>' + g[2] + '</span></div>').join('') + '</div>' +
          row('Taux plein d\u2019office', '67 ans')) +
        card('receipt', 'Retenues sociales et solidarité', '',
          row('CSG', '6,2 % × 0,9825', 'seuil d\u2019exonération 61 €') + row('CRDS', '0,5 % × 0,9825', 'seuil 61 €') + row('Retraite complémentaire', '3 % du SJR', 'seuil ' + fmtEur(B.retenues.seuilRc)) +
          row('ASS', fmtEur(B.solidarite.ass) + ' / jour', 'depuis le ' + B.solidarite.effet) + row('ATA', fmtEur(B.solidarite.ata) + ' / jour')) +
        '</div>' +
        '<div class="bar-grid">' + renderRegJournal() + '</div>' +
        '<div class="bar-sources"><h3>Sources</h3>' + B.sources.map(s => '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer">' + s.label + '</a>').join('') +
        '<p>Ces valeurs sont des références de travail. En cas de doute, la réglementation en vigueur (règlement général annexé et circulaires) fait foi.</p></div>';
      host.innerHTML = html;
      refreshIcons();
    }

    // ---------- Vue « Délais et échéances » ----------
    function initDelais() { runDelais(); }

    function runDelais() {
      const g = id => document.getElementById(id);
      const val = id => parseFloat(g(id)?.value) || 0;
      const B = BAREME;
      const fct = ftParseDate(g('dl-fct')?.value);
      const out = g('dl-result');
      if (!out) return;
      if (!fct) {
        out.innerHTML = '<div class="dl-empty"><i data-lucide="calendar-days" class="w-8 h-8"></i><p>Saisissez la date de fin de contrat pour obtenir les échéances.</p></div>';
        refreshIcons();
        return;
      }
      const sal = val('dl-salaire');
      const sjr = sal > 0 ? sal / 30.42 : 0;
      const eco = g('dl-eco')?.checked;
      const diffCp = sjr > 0 ? Math.min(B.differe.cpMax, Math.floor(val('dl-iccp') / sjr)) : 0;
      const diffSpec = Math.min(eco ? B.differe.specMaxEco : B.differe.specMax, Math.floor(val('dl-supra') / B.differe.diviseur));
      const attente = g('dl-attente-deja')?.checked ? 0 : B.differe.attente;
      const total = diffCp + diffSpec + attente;
      const debut = ftAddDays(fct, 1 + total);
      const insc = ftParseDate(g('dl-insc')?.value);
      const age55 = g('dl-age')?.value !== 'u55';
      const ageBand = g('dl-age')?.value || 'u55';
      const motifRci = g('dl-rci')?.checked && fct >= ftParseDate(B.duree.rci.effet);
      let dureeMax = B.duree.max[ageBand];
      if (motifRci) dureeMax = ageBand === 'u55' ? B.duree.rci.u55 : B.duree.rci.a55;
      const fin = ftAddDays(debut, dureeMax - 1);
      const forclos = ftAddDays(fct, 365);
      const rows = [
        ['Fin de contrat de travail', ftFmtDate(fct), 'Point de départ'],
        ['Différé congés payés', diffCp + ' j', sjr > 0 ? 'ICCP ÷ SJR, plafonné à ' + B.differe.cpMax + ' j' : 'Renseignez le salaire mensuel moyen'],
        ['Différé spécifique', diffSpec + ' j', 'Supra-légales ÷ ' + String(B.differe.diviseur).replace('.', ',') + (eco ? ' (plafond 75 j)' : ' (plafond 150 j)')],
        ['Délai d\u2019attente', attente + ' j', attente ? '7 jours' : 'Déjà appliqué dans les 12 derniers mois'],
        ['Total des différés', total + ' j', 'Du lendemain de la fin de contrat'],
        ['Premier jour indemnisable', ftFmtDate(debut), 'Fin de contrat + ' + (1 + total) + ' j']
      ];
      const dates = [
        ['Inscription au plus tard', ftFmtDate(forclos), 'Demande d\u2019allocation dans les 12 mois suivant la fin de contrat'],
        ['Fin de droits maximale', ftFmtDate(fin), 'Si durée maximale (' + dureeMax + ' j' + (motifRci ? ', rupture conventionnelle ≥ 01/09/2026' : '') + ')']
      ];
      if (!age55 && sjr > 0) {
        const ar = ftAreJour(sjr).aj;
        if (ar > B.degr.seuil) dates.push(['Dégressivité', ftFmtDate(ftAddDays(debut, 182)), 'AJ × 0,7 à partir du 7e mois (AJ estimée ' + fmtEur(ar) + ')']);
      }
      if (insc) dates.push(['Inscription déclarée', ftFmtDate(insc), insc > forclos ? 'Hors délai : forclusion possible' : 'Dans le délai']);
      const tbl = list => '<div class="dl-list">' + list.map(r => '<div class="dl-row"><span class="dl-k">' + r[0] + '</span><span class="dl-v">' + r[1] + '</span><span class="dl-n">' + r[2] + '</span></div>').join('') + '</div>';
      out.innerHTML =
        '<div class="dl-hero"><span>Premier jour indemnisable</span><strong>' + ftFmtDate(debut) + '</strong></div>' +
        '<h3 class="dl-h">Différés</h3>' + tbl(rows) + '<h3 class="dl-h">Échéances</h3>' + tbl(dates);
      refreshIcons();
    }

    function copyDelaisNote() {
      const out = document.getElementById('dl-result');
      if (!out) return;
      const lines = [...out.querySelectorAll('.dl-row')].map(r => r.querySelector('.dl-k').textContent + ' : ' + r.querySelector('.dl-v').textContent);
      const hero = out.querySelector('.dl-hero strong');
      copyToClipboard('Échéances (barème Unédic vérifié le ' + BAREME.verifie + ')\n' + lines.join('\n') + (hero ? '\nPremier jour indemnisable : ' + hero.textContent : ''));
      showToast('Note d\u2019échéances copiée', 'success');
    }

    function resetDelais() {
      ftClearFields(['dl-fct', 'dl-insc', 'dl-salaire', 'dl-iccp', 'dl-supra', 'dl-sr', 'dl-jours-den', 'dl-jours-per']);
      ['dl-eco', 'dl-attente-deja', 'dl-rci'].forEach(id => { const e = document.getElementById(id); if (e) e.checked = false; });
      runDelais();
    }

    // ---------- Mes données : sauvegarde, restauration, confidentialité ----------
    window.addEventListener('pagehide', function () {
      try { if (ftSettings().clearOnLogout) { safeLS.removeItem('ft_user_vars'); safeLS.removeItem('ft_dossiers'); } } catch (e) {}
    });

    function ftSettings() {
      let s = {};
      try { s = JSON.parse(safeLS.getItem('ft_settings') || '{}') || {}; } catch (e) { s = {}; }
      if (s.clearOnLogout === undefined) s.clearOnLogout = false;
      if (s.clearAfterCopy === undefined) s.clearAfterCopy = false;
      return s;
    }
    function ftSaveSettings() {
      const s = { clearOnLogout: !!document.getElementById('set-clear-logout')?.checked, clearAfterCopy: !!document.getElementById('set-clear-copy')?.checked };
      safeLS.setItem('ft_settings', JSON.stringify(s));
    }
    function openDataModal() {
      const s = ftSettings();
      const a = document.getElementById('set-clear-logout'); if (a) a.checked = s.clearOnLogout;
      const b = document.getElementById('set-clear-copy'); if (b) b.checked = s.clearAfterCopy;
      const me = ftCurrentUser();
      const t = document.getElementById('data-user'); if (t) t.textContent = me ? me.name : '';
      const c = document.getElementById('data-count'); if (c) c.textContent = templates.length + ' modèles, ' + favorites.length + ' favoris, ' + categoryList.length + ' catégories';
      openModal('data-modal');
    }
    function ftExportData() {
      const me = ftCurrentUser();
      const payload = { app: 'espace-conseiller-ft', version: 1, exportedAt: new Date().toISOString(), user: me ? me.name : '', templates: templates, favorites: favorites, categories: categoryList };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'modeles-conseiller-ft-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      showToast('Sauvegarde téléchargée', 'success');
    }
    function ftImportData(input, mode) {
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const d = JSON.parse(reader.result);
          if (!d || d.app !== 'espace-conseiller-ft' || !Array.isArray(d.templates)) throw new Error('format');
          const valid = d.templates.filter(t => t && t.id && t.title && typeof t.body === 'string' && t.category);
          if (mode === 'replace') {
            if (!confirm('Remplacer tous vos modèles actuels par ceux de la sauvegarde (' + valid.length + ' modèles) ?')) return;
            templates = valid;
            favorites = Array.isArray(d.favorites) ? d.favorites.filter(id => valid.some(t => t.id === id)) : [];
            if (Array.isArray(d.categories)) categoryList = d.categories;
          } else {
            const have = new Set(templates.map(t => t.id));
            let added = 0;
            valid.forEach(t => { if (!have.has(t.id)) { templates.push(t); added++; } });
            if (Array.isArray(d.categories)) d.categories.forEach(c => { if (c && c.name && !categoryList.some(x => x.name === c.name)) categoryList.push(c); });
            valid.forEach(t => { if (!categoryList.some(c => c.name === t.category)) categoryList.push({ name: t.category }); });
            showToast(added + ' modèle(s) ajouté(s)', 'success');
          }
          valid.forEach(t => { if (!categoryList.some(c => c.name === t.category)) categoryList.push({ name: t.category }); });
          saveState();
          if (typeof applyCategoryStyles === 'function') applyCategoryStyles();
          renderCategoryPills(); renderTemplatesList(); renderActiveTemplate();
          closeModal('data-modal');
          if (mode === 'replace') showToast('Sauvegarde restaurée', 'success');
        } catch (e) {
          showToast('Fichier de sauvegarde non reconnu', 'error');
        }
      };
      reader.readAsText(file);
    }

    // ---------- Copie sécurisée : alerte si des champs restent vides ----------
    function copyCurrentMail(format = 'raw') {
      const tpl = templates.find(t => t.id === activeTemplateId) || templates[0];
      if (!tpl) return;
      const vars = userVariables[tpl.id] || {};
      const missing = [];
      (tpl.body.match(/\{\{([^}]+)\}\}/g) || []).forEach(m => {
        const k = m.replace(/[{}]/g, '').trim();
        const filled = vars[k] && String(vars[k]).trim() !== '';
        if (!filled && !missing.includes(k)) missing.push(k);
      });
      if (missing.length) {
        const labels = missing.slice(0, 6).map(k => { const v = (tpl.variables || []).find(x => x.key === k); return (v && v.label) || k; });
        if (!confirm(missing.length + ' champ' + (missing.length > 1 ? 's' : '') + ' non rempli' + (missing.length > 1 ? 's' : '') + ' : ' + labels.join(', ') + (missing.length > 6 ? '…' : '') + '.\n\nCopier quand même le message avec ces [champs] visibles ?')) return;
      }
      copyToClipboard(compileText(tpl.body, tpl.id, false));
      showToast('Message CVM copié dans le presse-papier', 'success');
      if (ftSettings().clearAfterCopy) {
        delete userVariables[tpl.id];
        saveState();
        if (typeof renderVariablesForm === 'function') renderVariablesForm(tpl);
        updateCompiledPreview();
        updateMailtoLink(tpl);
      }
    }

    // ---------- Référence réglementaire et date de relecture des modèles ----------
    function ftRenderTplMeta() {
      const tpl = templates.find(t => t.id === activeTemplateId) || templates[0];
      const el = document.getElementById('preview-ref');
      if (!tpl || !el) return;
      const ref = tpl.reference ? escapeHtml(tpl.reference) : '<span class="tpl-warn">Référence non renseignée</span>';
      let rev = '<span class="tpl-warn">Jamais relu</span>';
      if (tpl.reviewedAt) {
        const d = ftParseDate(tpl.reviewedAt);
        const old = d && (Date.now() - d.getTime()) > 365 * 86400000;
        rev = old ? '<span class="tpl-warn">À relire (relu le ' + ftFmtDate(d) + ')</span>' : 'Relu le ' + ftFmtDate(d);
      }
      el.innerHTML = ref + ' · ' + rev;
    }

    // ---------- Recherche transversale : mots-clés de situations ----------
    const FT_KW = {
      home: '', cvm: 'mail message courrier modèle réponse cvm usager',
      '1': 'admission ouverture droits conditions affiliation eligibilite are différé délai attente durée montant allocation',
      '2': 'démission légitime motif conjoint mariage violences non paiement salaires ipr 65 jours',
      '3': 'création entreprise arce maintien micro auto-entrepreneur activité non salariée ans',
      '4': 'licenciement économique csp contrat sécurisation professionnelle asp idr prime reclassement',
      '5': 'reprise emploi activité réduite complément cumul salaire 70 pourcent jours indemnisables plafond',
      dossier: 'parcours dossier nouveau questions guidées admission droits premier jour mail historique',
      '6': 'trop perçu trop-perçu indu remboursement échéancier dette recouvrement',
      '7': 'congés payés bâtiment btp cibtp iccp différé attestation',
      '8': 'retraite taux plein maintien droits trimestres âge limite',
      '9': 'rupture conventionnelle indemnité différé spécifique supra légale 2026',
      cfd: 'fin de droits complément conjoncture coefficient 0,75 reliquat',
      bareme: 'barème taux montant plafond plancher partie fixe sjr smic ass ata csg crds paramètres',
      delais: 'délai échéance date premier jour indemnisable forclusion carence différé calendrier'
    };
    function ftToolHay(t) { return nrm(t.name + ' ' + t.desc + ' ' + t.badge + ' ' + (FT_KW[String(t.id)] || '')); }

    // =====================================================================
    //  QUESTIONS GUIDÉES : moteur commun (cumul ARE, parcours dossier)
    // =====================================================================
    const FT_WIZ = {};

    function wizMount(id, cfg) {
      FT_WIZ[id] = { cfg: cfg, step: 0, answers: {}, done: false };
      wizRender(id);
    }

    function wizSteps(w) { return w.cfg.steps.filter(s => !s.when || s.when(w.answers)); }
    function wizOptions(st, a) { return typeof st.options === 'function' ? st.options(a) : st.options; }

    function wizAnswerLabel(st, a) {
      const v = a[st.key];
      if (v === undefined || v === '') return 'Non renseigné';
      if (st.type === 'choice') { const o = (wizOptions(st, a) || []).find(x => x.value === v); return o ? o.label : v; }
      if (st.type === 'month') { const [y, m] = String(v).split('-'); return ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][Number(m) - 1] + ' ' + y; }
      if (st.type === 'date') return ftFmtDate(ftParseDate(v));
      return String(v).replace('.', ',') + (st.unit ? ' ' + st.unit : '');
    }

    function wizRender(id) {
      const w = FT_WIZ[id];
      const host = document.getElementById('wiz-' + id);
      if (!w || !host) return;
      const steps = wizSteps(w);
      if (w.done) {
        const chips = steps.map((st, i) => '<button type="button" class="wiz-chip" onclick="wizGo(\'' + id + '\',' + i + ')" title="Modifier cette réponse"><span>' + st.short + '</span>' + escapeHtml(wizAnswerLabel(st, w.answers)) + '</button>').join('');
        host.innerHTML = '<div class="wiz-chips">' + chips + '</div>' + w.cfg.result(w.answers, id);
        refreshIcons();
        return;
      }
      w.step = Math.max(0, Math.min(w.step, steps.length - 1));
      const st = steps[w.step];
      const val = w.answers[st.key];
      const pct = Math.round((w.step / steps.length) * 100);
      let input = '';
      if (st.type === 'choice') {
        input = '<div class="wiz-choices">' + wizOptions(st, w.answers).map(o =>
          '<button type="button" class="wiz-choice' + (val === o.value ? ' is-on' : '') + '" onclick="wizChoose(\'' + id + '\',\'' + attrJs(o.value) + '\')"><strong>' + o.label + '</strong>' + (o.hint ? '<span>' + o.hint + '</span>' : '') + '</button>').join('') + '</div>';
      } else {
        const type = st.type === 'number' ? 'number' : st.type;
        input = '<div class="wiz-field"><input id="wiz-input" type="' + type + '" ' + (st.type === 'number' ? 'inputmode="decimal" step="any" min="0" placeholder="' + (st.placeholder || '0') + '"' : '') +
          ' value="' + (val !== undefined ? escapeHtml(String(val)) : '') + '" onkeydown="if(event.key===\'Enter\'){event.preventDefault();wizNext(\'' + id + '\')}" aria-label="' + escapeHtml(st.title) + '">' + (st.unit ? '<span class="wiz-unit">' + st.unit + '</span>' : '') + '</div>';
      }
      const prev = steps.slice(0, w.step).map((p, i) => '<button type="button" class="wiz-chip" onclick="wizGo(\'' + id + '\',' + i + ')"><span>' + p.short + '</span>' + escapeHtml(wizAnswerLabel(p, w.answers)) + '</button>').join('');
      const last = w.step === steps.length - 1;
      host.innerHTML =
        '<div class="wiz-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>' +
        (prev ? '<div class="wiz-chips">' + prev + '</div>' : '') +
        '<div class="wiz-card"><div class="wiz-step">Question ' + (w.step + 1) + ' sur ' + steps.length + (st.optional ? ' · facultative' : '') + '</div>' +
        '<h3 class="wiz-q">' + st.title + '</h3>' + (st.hint ? '<p class="wiz-hint">' + st.hint + '</p>' : '') + input +
        '<p id="wiz-err" class="wiz-err" role="alert"></p>' +
        '<div class="wiz-actions"><button type="button" class="wiz-btn" onclick="wizBack(\'' + id + '\')"' + (w.step === 0 ? ' disabled' : '') + '>Précédent</button>' +
        (st.type === 'choice' ? '' : '<button type="button" class="wiz-btn wiz-btn-primary" onclick="wizNext(\'' + id + '\')">' + (last ? 'Voir le résultat' : (st.optional ? 'Suivant (ou passer)' : 'Suivant')) + '</button>') +
        '</div></div>';
      const inp = document.getElementById('wiz-input');
      if (inp) setTimeout(() => inp.focus(), 30);
      refreshIcons();
    }

    function wizAdvance(id) {
      const w = FT_WIZ[id];
      const steps = wizSteps(w);
      if (w.step >= steps.length - 1) w.done = true; else w.step++;
      wizRender(id);
    }

    function wizChoose(id, value) {
      const w = FT_WIZ[id];
      const st = wizSteps(w)[w.step];
      w.answers[st.key] = value;
      wizAdvance(id);
    }

    function wizNext(id) {
      const w = FT_WIZ[id];
      const st = wizSteps(w)[w.step];
      const el = document.getElementById('wiz-input');
      const err = msg => { const e = document.getElementById('wiz-err'); if (e) e.textContent = msg; };
      let v = el ? el.value.trim() : '';
      if (v === '') {
        if (!st.optional) return err('Cette réponse est nécessaire pour continuer.');
        delete w.answers[st.key];
      } else {
        if (st.type === 'number') {
          const n = parseFloat(v.replace(',', '.'));
          if (!isFinite(n) || n < 0) return err('Saisissez un nombre positif.');
          if (n === 0 && !st.allowZero) return err('Saisissez une valeur supérieure à zéro.');
          v = String(n);
        }
        if (st.validate) { const msg = st.validate(v, w.answers); if (msg) return err(msg); }
        w.answers[st.key] = v;
      }
      wizAdvance(id);
    }

    function wizBack(id) { const w = FT_WIZ[id]; if (w.step > 0) { w.step--; w.done = false; wizRender(id); } }
    function wizGo(id, i) { const w = FT_WIZ[id]; w.step = i; w.done = false; wizRender(id); }
    function wizRestart(id) { const w = FT_WIZ[id]; w.step = 0; w.answers = {}; w.done = false; wizRender(id); }
    function wizCopyNote(id) {
      const w = FT_WIZ[id];
      if (!w) return;
      copyToClipboard(w.cfg.note(w.answers));
      showToast('Note copiée', 'success');
    }

    const wizAlert = (kind, text) => '<div class="wiz-alert is-' + kind + '"><i data-lucide="' + (kind === 'danger' ? 'octagon-alert' : (kind === 'warn' ? 'triangle-alert' : 'info')) + '" class="w-4 h-4"></i><span>' + text + '</span></div>';
    const wizRow = (k, v, f, cls) => '<div class="sim-d-row ' + (cls || '') + '"><span class="sim-d-k">' + k + '</span><span class="sim-d-v">' + v + '</span>' + (f ? '<span class="sim-d-f">' + f + '</span>' : '') + '</div>';

    // =====================================================================
    //  CUMUL ARE ET SALAIRE : questions guidées
    //  Règle : jours indemnisables J = [ARE mensuelle − 70 % du brut] ÷ AJ (arrondi à l'entier le plus proche),
    //  cumul plafonné au salaire de référence mensuel (SJR × 30,42). Quel que soit le nombre d'heures travaillées.
    //  Sources : Unédic, fiche « Cumul ARE-Rémunération » et Paramètres utiles.
    // =====================================================================
    function cumulCompute(a) {
      const B = BAREME;
      const aj = parseFloat(a.aj) || 0, brut = parseFloat(a.brut) || 0, sjr = parseFloat(a.sjr) || 0;
      const reliquat = a.reliquat !== undefined ? parseFloat(a.reliquat) : null;
      const [y, m] = String(a.mois).split('-').map(Number);
      const jm = 30; /* mensualisation : 30 jours quel que soit le mois */
      const areM = aj * jm;
      const deduit = B.cumul.remun * brut;
      const jBrut = (areM - deduit) / aj;
      let j = Math.max(0, Math.min(jm, Math.round(jBrut)));
      const plafond = sjr > 0 ? sjr * 30.42 : null;
      let plafondAtteint = false;
      if (plafond !== null) {
        while (j > 0 && brut + j * aj > plafond + 1e-9) { j--; plafondAtteint = true; }
      }
      const complement = j * aj;
      const retrJ = sjr > 0 ? ftNetCompute({ aj: aj, sjr: sjr, type: 'are', exo: true }).retraite : 0;
      const retrM = Math.round(retrJ * j * 100) / 100;
      const brutNet = Math.round((complement - retrM) * 100) / 100;
      /* CSG et CRDS : retenues seulement si le complément mensuel net de retraite dépasse le seuil mensuel (61 € x 30 j, à confirmer) */
      const seuilM = 61 * 30;
      let csgM = 0;
      if (brutNet > seuilM) { csgM = Math.min(Math.floor(brutNet * 0.9825 * 0.067 * 100) / 100, Math.round((brutNet - seuilM) * 100) / 100); }
      const net = Math.round((brutNet - csgM) * 100) / 100;
      return { aj: aj, brut: brut, sjr: sjr, jm: jm, areM: areM, deduit: deduit, jBrut: jBrut, j: j, plafond: plafond, plafondAtteint: plafondAtteint,
        complement: complement, retrJ: retrJ, retrM: retrM, csgM: csgM, seuilM: seuilM, net: net, total: brut + complement, reportes: jm - j, reliquat: reliquat, reliquatApres: reliquat !== null ? Math.max(0, reliquat - j) : null,
        aucun: areM - deduit <= 0 };
    }

    function cumulNote(a) {
      const r = cumulCompute(a);
      return 'Cumul ARE et salaire, ' + wizAnswerLabel({ type: 'month', key: 'mois' }, a) + '\n' +
        'AJ ' + fmtEur(r.aj) + ' × ' + r.jm + ' jours = ' + fmtEur(r.areM) + '\n' +
        'Salaire brut ' + fmtEur(r.brut) + ' (70 % = ' + fmtEur(r.deduit) + ')\n' +
        'Jours indemnisés : ' + r.j + ' (reportés : ' + r.reportes + ')\n' +
        'Complément ARE brut : ' + fmtEur(r.complement) + ' · retraite complémentaire : ' + fmtEur(r.retrM) + (r.csgM ? ' · CSG et CRDS : ' + fmtEur(r.csgM) : ' · CSG et CRDS non retenues') + ' · net : ' + fmtEur(r.net) + ' · Total du mois (brut) : ' + fmtEur(r.total) +
        (r.plafond !== null ? '\nPlafond (SJR × 30,42) : ' + fmtEur(r.plafond) + (r.plafondAtteint ? ' (atteint)' : '') : '\nPlafond non contrôlé (SJR non renseigné)') +
        (r.reliquatApres !== null ? '\nReliquat après le mois : ' + r.reliquatApres + ' jours' : '') +
        '\nBarème Unédic vérifié le ' + BAREME.verifie;
    }

    function cumulResult(a, id) {
      const r = cumulCompute(a);
      const alerts = [];
      if (r.aucun) alerts.push(wizAlert('warn', 'Le salaire du mois couvre au moins 70 % de l\u2019allocation mensuelle : aucun jour n\u2019est indemnisé ce mois-ci. Les ' + r.jm + ' jours sont reportés.'));
      if (r.plafondAtteint) alerts.push(wizAlert('info', 'Le plafond de cumul est atteint : salaire + complément ne peuvent pas dépasser le salaire de référence mensuel (' + fmtEur(r.plafond) + '). Le nombre de jours a été réduit.'));
      if (r.plafond === null) alerts.push(wizAlert('warn', 'SJR non renseigné : le plafond de cumul n\u2019a pas été contrôlé. Relevez-le sur la notification de droits.'));
      if (r.reliquat !== null && r.j > r.reliquat) alerts.push(wizAlert('danger', 'Les jours à indemniser (' + r.j + ') dépassent le reliquat de droits (' + r.reliquat + ' jours).'));
      if (r.aj < BAREME.are.min) alerts.push(wizAlert('info', 'L\u2019allocation journalière est inférieure à l\u2019allocation minimale actuelle (' + fmtEur(BAREME.are.min) + ') : cohérent seulement si elle est limitée à 75 % du SJR ou si les droits ont été ouverts avant le 01/07/2025.'));
      alerts.push(wizAlert('info', 'Les jours non indemnisés ne sont pas perdus : ils sont reportés en fin de droits. Le nombre d\u2019heures travaillées n\u2019intervient pas dans le calcul.'));
      return '<div class="wiz-result">' +
        '<div class="wiz-hero"><span>Complément d\u2019ARE net du mois</span><strong>' + fmtEur(r.net) + '</strong><em>' + r.j + ' jour' + (r.j > 1 ? 's' : '') + ' indemnisé' + (r.j > 1 ? 's' : '') + ' sur ' + r.jm + '</em></div>' +
        '<div class="wiz-tiles">' +
          '<div class="wiz-tile"><span>Salaire brut</span><strong>' + fmtEur(r.brut) + '</strong></div>' +
          '<div class="wiz-tile"><span>Total salaire + complément</span><strong>' + fmtEur(r.total) + '</strong></div>' +
          '<div class="wiz-tile"><span>Jours reportés</span><strong>' + r.reportes + '</strong></div>' +
          '<div class="wiz-tile"><span>Reliquat après le mois</span><strong>' + (r.reliquatApres !== null ? r.reliquatApres + ' j' : '—') + '</strong></div>' +
        '</div>' + (r.reliquat !== null ? cumulBar(r) : '') + alerts.join('') +
        '<h4 class="wiz-h">Détail du calcul</h4><div class="sim-detail">' +
          wizRow('Allocation mensuelle de référence', fmtEur(r.areM), 'AJ ' + fmtEur(r.aj) + ' × ' + r.jm + ' jours (mensualisation)') +
          wizRow('70 % du salaire brut', fmtEur(r.deduit), fmtEur(r.brut) + ' × 0,70') +
          wizRow('Jours indemnisables', String(Math.round(r.jBrut * 100) / 100).replace('.', ',') + ' → ' + (r.plafondAtteint ? r.j + ' (plafond)' : r.j), '(' + fmtEur(r.areM) + ' − ' + fmtEur(r.deduit) + ') ÷ ' + fmtEur(r.aj) + ', arrondi à l\u2019entier le plus proche') +
          wizRow('Plafond du cumul', r.plafond !== null ? fmtEur(r.plafond) : '—', r.plafond !== null ? 'SJR ' + fmtEur(r.sjr) + ' × 30,42' : 'SJR non renseigné') +
          wizRow('Complément brut', fmtEur(r.complement), r.j + ' jours × ' + fmtEur(r.aj)) +
          wizRow('Retraite complémentaire', '− ' + fmtEur(r.retrM), r.sjr > 0 ? r.j + ' jours × ' + fmtEur(r.retrJ) + ' (3 % du SJR)' : 'SJR non renseigné : non calculée') +
          wizRow('CSG et CRDS', '− ' + fmtEur(r.csgM), r.csgM ? '6,2 % et 0,5 % sur 98,25 %, sans descendre sous ' + fmtEur(r.seuilM) + ' par mois' : 'Non retenues : complément mensuel net sous le seuil de ' + fmtEur(r.seuilM) + ' (61 € × 30 j), à confirmer') +
          wizRow('Complément net versé', fmtEur(r.net), 'Après retenues sociales') +
        '</div>' +
        '<div class="wiz-actions"><button type="button" class="wiz-btn" onclick="wizRestart(\'' + id + '\')">Nouveau calcul</button>' +
        '<button type="button" class="wiz-btn" onclick="cumulPrint()"><i data-lucide="printer" class="w-4 h-4"></i>Imprimer</button>' + '<button type="button" class="wiz-btn wiz-btn-primary" onclick="wizCopyNote(\'' + id + '\')"><i data-lucide="copy" class="w-4 h-4"></i>Copier la note</button></div></div>';
    }

    function cumulInit() {
      if (FT_WIZ.cumul) { wizRender('cumul'); return; }
      wizMount('cumul', {
        steps: [
          { key: 'type', short: 'Activité', type: 'choice', title: 'Quelle activité l\u2019allocataire reprend-il ?', hint: 'Le calcul du cumul diffère selon le type d\u2019activité.',
            options: [{ value: 'salarie', label: 'Une activité salariée', hint: 'CDI, CDD ou contrat de mission' }, { value: 'non_salarie', label: 'Une activité non salariée', hint: 'Création ou reprise d\u2019entreprise, micro-entreprise' }] },
          { key: 'aj', short: 'AJ', type: 'number', unit: '€ / jour', title: 'Quelle est l\u2019allocation journalière brute (AJ) en cours ?', hint: 'À lire sur la notification de droits. Si la dégressivité s\u2019applique, prendre le montant après dégressivité.', when: a => a.type === 'salarie' },
          { key: 'sjr', short: 'SJR', type: 'number', unit: '€ / jour', optional: true, title: 'Quel est le salaire journalier de référence (SJR) ?', hint: 'Il fixe le plafond du cumul (SJR × 30,42). Vous pouvez passer cette question, mais le plafond ne sera alors pas contrôlé.', when: a => a.type === 'salarie' },
          { key: 'mois', short: 'Mois', type: 'month', title: 'Pour quel mois civil calcule-t-on le cumul ?', hint: 'Depuis la mensualisation, l\u2019allocation est calculée sur 30 jours, quel que soit le mois.', when: a => a.type === 'salarie' },
          { key: 'brut', short: 'Brut', type: 'number', unit: '€ brut', allowZero: true, title: 'Quel est le salaire brut perçu sur ce mois ?', hint: 'Montant brut déclaré à l\u2019actualisation. Le nombre d\u2019heures travaillées n\u2019a pas d\u2019incidence.', when: a => a.type === 'salarie' },
          { key: 'reliquat', short: 'Reliquat', type: 'number', unit: 'jours', optional: true, title: 'Combien de jours de droits restent-ils avant ce mois ?', hint: 'Facultatif : permet d\u2019afficher le reliquat après le cumul.', when: a => a.type === 'salarie' }
        ],
        result: (a, id) => a.type === 'non_salarie'
          ? '<div class="wiz-result"><div class="wiz-card"><h3 class="wiz-q">Le cumul avec une activité non salariée suit d\u2019autres règles</h3><p class="wiz-hint">Les allocations sont calculées sur les revenus de l\u2019activité, avec un arrêt du cumul à 60 % du reliquat de droits. Utilisez le simulateur dédié.</p><div class="wiz-actions"><button type="button" class="wiz-btn" onclick="wizRestart(\'' + id + '\')">Revenir aux questions</button><button type="button" class="wiz-btn wiz-btn-primary" onclick="switchNavTab(\'3\')">Ouvrir le simulateur création d\u2019entreprise</button></div></div></div>'
          : cumulResult(a, id),
        note: a => a.type === 'salarie' ? cumulNote(a) : 'Activité non salariée : voir le simulateur Création d\u2019entreprise.'
      });
    }

    // Anciennes fonctions de la vue : redirigées vers les questions guidées
    function runComplementAreCalculation() { cumulInit(); }
    function copyComplementAreNote() { cumulInit(); wizCopyNote('cumul'); }
    function resetComplementAreSimulator() { cumulInit(); wizRestart('cumul'); }

    // =====================================================================
    //  PARCOURS DOSSIER : questions guidées, pilotent le simulateur d'admission
    // =====================================================================
    const DOSSIER_OPTS = {
      motif: () => [...document.querySelectorAll('#sim-motif option')].map(o => ({ value: o.value, label: o.textContent.trim() })),
      forclusion: () => [...document.querySelectorAll('#sim-forclusion option')].map(o => ({ value: o.value, label: o.textContent.trim() })),
      residence: () => [...document.querySelectorAll('#sim-residence-apt option')].map(o => ({ value: o.value, label: o.textContent.trim() }))
    };
    const yesNo = [{ value: 'oui', label: 'Oui' }, { value: 'non', label: 'Non' }];

    function dossierApply(a) {
      const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
      const chk = (id, v) => { const e = document.getElementById(id); if (e) e.checked = !!v; };
      set('sim-motif', a.motif || 'rupture_conv');
      set('sim-date-fct', a.fct || '');
      set('sim-age', a.age || 'under55');
      toggleAffiliationUnit(a.unite === 'hours' ? 'hours' : 'days');
      set('sim-affiliation-val', a.aff || '');
      chk('sim-saisonnier', a.sais === 'oui');
      set('sim-forclusion', a.forclusion || 'ok');
      set('sim-residence-apt', a.residence || 'ok');
      chk('sim-recherche-active', a.recherche !== 'non');
      chk('sim-sans-retraite', a.retraite !== 'non');
      chk('sim-opt-65j', a.opt65 === 'oui');
      chk('sim-opt-122j', a.opt122 === 'oui');
      set('sim-salaire-moyen', a.salaire || '');
      set('sim-sjr-att', a.sjr || '');
      set('sim-indem-cp', a.cp || '');
      set('sim-indem-supra', a.supra || '');
      runSimulatorCalculation();
    }

    function dossierAlerts(a) {
      const out = [];
      const fct = ftParseDate(a.fct), insc = ftParseDate(a.insc);
      const isDem = a.motif === 'demission_ordinaire' || a.motif === 'rupture_essai_sal';
      if (fct && insc && insc < fct) out.push(wizAlert('warn', 'La date d\u2019inscription précède la fin de contrat : vérifiez les dates.'));
      if (fct && insc && insc > ftAddDays(fct, 365) && a.forclusion === 'ok') out.push(wizAlert('danger', 'Inscription plus de 12 mois après la fin de contrat alors que le délai est indiqué comme respecté : risque de forclusion.'));
      if (a.forclusion === 'forclos') out.push(wizAlert('danger', 'Demande hors délai de 12 mois sans motif de report : l\u2019ouverture de droits est bloquée.'));
      if (a.motif === 'rupture_conv' && fct) out.push(wizAlert('info', fct >= ftParseDate(BAREME.duree.rci.effet) ? 'Rupture conventionnelle avec fin de contrat à compter du 01/09/2026 : durée maximale réduite (15 mois, 20,5 mois à 55 ans et plus).' : 'Rupture conventionnelle avec fin de contrat avant le 01/09/2026 : durée maximale de droit commun.'));
      if (parseFloat(a.supra) > 0 && (isDem || a.motif === 'fin_cdd')) out.push(wizAlert('warn', 'Des indemnités supra-légales sont saisies pour un motif qui n\u2019en comporte normalement pas : vérifiez le dossier.'));
      if (a.age !== 'under55' && a.aff) out.push(wizAlert('info', 'À 55 ans et plus, la période de référence est de 36 mois ; la durée maximale dépend de l\u2019âge (685 j à 55-56 ans, 822 j à partir de 57 ans).'));
      if (!a.sjr && a.salaire) out.push(wizAlert('info', 'SJR estimé à partir du salaire moyen. Pour un montant exact, saisissez le SJR de l\u2019attestation employeur.'));
      if (!a.fct) out.push(wizAlert('info', 'Date de fin de contrat non saisie : la date du jour sert de repère pour le premier jour indemnisable.'));
      return out;
    }

    function dossierSnapshot() {
      const t = id => (document.getElementById(id)?.textContent || '').trim();
      return { verdict: t('sim-verdict-title'), desc: t('sim-verdict-desc'), are: t('calc-are-jour'), formule: t('calc-formule-tag'), duree: t('calc-duree-max'), mois: t('calc-duree-mois'),
        cp: t('calc-diff-cp'), supra: t('calc-diff-supra'), total: t('calc-total-differe'), note: t('sim-adviser-note') };
    }

    function dossierMail(a, sn) {
      const eligible = !/^NON/i.test(sn.verdict);
      const premier = (document.querySelector('#sim-calc-detail .sim-d-row:last-child .sim-d-v') || {}).textContent || '';
      const motif = (DOSSIER_OPTS.motif().find(o => o.value === a.motif) || {}).label || '';
      let t = 'Objet : étude de vos droits à l\u2019allocation d\u2019aide au retour à l\u2019emploi\n\nMotif de fin de contrat : ' + motif + '\n';
      if (eligible) {
        t += 'Après étude de votre dossier, les conditions d\u2019ouverture de droits sont remplies.\n';
        if (sn.are && sn.are !== '—') t += 'Allocation journalière brute estimée : ' + sn.are + '\nDurée maximale d\u2019indemnisation : ' + sn.duree + ' (' + sn.mois + ')\n';
        t += 'Différés avant le premier versement : ' + sn.total + ' (congés payés : ' + sn.cp + ', indemnités supra-légales : ' + sn.supra + ', délai d\u2019attente de 7 jours)\n';
        if (premier) t += 'Premier jour indemnisable estimé : ' + premier + '\n';
        t += '\nCes éléments sont donnés à titre indicatif et seront confirmés par la notification de droits.';
      } else {
        t += 'Après étude de votre dossier, l\u2019ouverture de droits n\u2019est pas possible en l\u2019état : ' + sn.desc + '\n\nVous pouvez nous transmettre tout élément nouveau afin de réexaminer votre situation.';
      }
      return t;
    }

    function dossierResult(a, id) {
      dossierApply(a);
      const sn = dossierSnapshot();
      const eligible = !/^NON/i.test(sn.verdict);
      const detail = (document.getElementById('sim-calc-detail') || {}).innerHTML || '';
      const mail = dossierMail(a, sn);
      window.__dossierMail = mail;
      return '<div class="wiz-result">' +
        '<div class="wiz-hero ' + (eligible ? 'is-ok' : 'is-ko') + '"><span>' + escapeHtml(sn.verdict) + '</span><strong>' + (eligible && sn.are !== '—' ? escapeHtml(sn.are) + ' / jour' : (eligible ? 'Droits ouverts' : 'Droits non ouverts')) + '</strong><em>' + escapeHtml(sn.desc) + '</em></div>' +
        (eligible ? '<div class="wiz-tiles">' +
          '<div class="wiz-tile"><span>Durée maximale</span><strong>' + escapeHtml(sn.duree) + '</strong></div>' +
          '<div class="wiz-tile"><span>Différés avant versement</span><strong>' + escapeHtml(sn.total) + '</strong></div>' +
          '<div class="wiz-tile"><span>Congés payés / supra-légal</span><strong>' + escapeHtml(sn.cp) + ' · ' + escapeHtml(sn.supra) + '</strong></div>' +
          '<div class="wiz-tile"><span>Formule ARE</span><strong class="is-small">' + escapeHtml(sn.formule) + '</strong></div></div>' : '') +
        dossierAlerts(a).join('') +
        '<h4 class="wiz-h">Détail du calcul</h4><div class="sim-detail">' + detail + '</div>' +
        '<h4 class="wiz-h">Texte à intégrer au mail</h4><textarea id="dossier-mail" class="wiz-mail" rows="9" readonly>' + escapeHtml(mail) + '</textarea>' +
        '<div class="wiz-actions"><button type="button" class="wiz-btn" onclick="wizRestart(\'' + id + '\')">Nouveau dossier</button>' +
        '<button type="button" class="wiz-btn" onclick="switchNavTab(\'1\')">Ouvrir le simulateur détaillé</button>' +
        '<button type="button" class="wiz-btn" onclick="dossierSave()"><i data-lucide="save" class="w-4 h-4"></i>Enregistrer</button>' +
        '<button type="button" class="wiz-btn wiz-btn-primary" onclick="dossierCopyMail()"><i data-lucide="copy" class="w-4 h-4"></i>Copier le texte du mail</button></div></div>';
    }

    function dossierCopyMail() {
      copyToClipboard(window.__dossierMail || '');
      showToast('Texte copié : collez-le dans le modèle CVM', 'success');
    }

    // Historique : références internes uniquement, jamais de nom (à saisir sans donnée nominative)
    function dossierHistory() {
      try { const h = JSON.parse(safeLS.getItem('ft_dossiers') || '[]'); return Array.isArray(h) ? h : []; } catch (e) { return []; }
    }
    function dossierSave() {
      const w = FT_WIZ.dossier;
      if (!w) return;
      const sn = dossierSnapshot();
      const ref = (w.answers.ref || '').trim() || 'Sans référence';
      const h = dossierHistory();
      h.unshift({ ref: ref, at: new Date().toISOString(), verdict: sn.verdict, are: sn.are, duree: sn.duree, total: sn.total });
      safeLS.setItem('ft_dossiers', JSON.stringify(h.slice(0, 12)));
      renderDossierHistory();
      showToast('Dossier enregistré dans l\u2019historique', 'success');
    }
    function dossierClearHistory() {
      safeLS.removeItem('ft_dossiers');
      renderDossierHistory();
    }
    function renderDossierHistory() {
      const host = document.getElementById('dossier-history');
      if (!host) return;
      const h = dossierHistory();
      host.innerHTML = '<div class="wiz-hist-head"><h4>Derniers dossiers étudiés</h4>' + (h.length ? '<button type="button" class="wiz-link" onclick="dossierClearHistory()">Effacer l\u2019historique</button>' : '') + '</div>' +
        (h.length ? h.map(x => '<div class="wiz-hist-row"><strong>' + escapeHtml(x.ref) + '</strong><span>' + ftFmtDate(new Date(x.at)) + '</span><span>' + escapeHtml(x.verdict) + '</span><span>' + escapeHtml(x.are) + '</span><span>' + escapeHtml(x.duree) + '</span></div>').join('')
          : '<p class="wiz-hint">Aucun dossier enregistré. Utilisez une référence interne : ne saisissez jamais de nom ni de numéro d\u2019identification.</p>');
    }

    function dossierInit() {
      if (!FT_WIZ.dossier) {
        wizMount('dossier', {
          steps: [
            { key: 'motif', short: 'Motif', type: 'choice', title: 'Quel est le motif de fin du contrat de travail ?', hint: 'Tel qu\u2019il figure sur l\u2019attestation employeur.', options: () => DOSSIER_OPTS.motif() },
            { key: 'opt65', short: '65 jours', type: 'choice', title: 'Depuis la démission, l\u2019usager a-t-il travaillé au moins 65 jours (ou 455 heures) ?', hint: 'Cette condition permet un examen de droits après un départ volontaire.', options: yesNo, when: a => a.motif === 'demission_ordinaire' || a.motif === 'rupture_essai_sal' },
            { key: 'opt122', short: '121 jours', type: 'choice', title: 'La situation relève-t-elle d\u2019un réexamen après 121 jours de chômage (instance paritaire) ?', hint: 'Réponse positive si le réexamen a été accordé ou demandé dans les conditions prévues.', options: yesNo, when: a => a.motif === 'demission_ordinaire' || a.motif === 'rupture_essai_sal' },
            { key: 'fct', short: 'Fin de contrat', type: 'date', title: 'Quelle est la date de fin de contrat de travail ?', hint: 'Elle sert à appliquer les règles en vigueur à cette date et à calculer le premier jour indemnisable.', optional: true },
            { key: 'insc', short: 'Inscription', type: 'date', title: 'Quelle est la date d\u2019inscription comme demandeur d\u2019emploi ?', hint: 'Facultatif : permet de contrôler le délai de 12 mois.', optional: true },
            { key: 'age', short: 'Âge', type: 'choice', title: 'Quel était l\u2019âge de l\u2019usager à la fin du contrat ?', hint: 'Il détermine la période de référence et la durée maximale.',
              options: [{ value: 'under55', label: 'Moins de 55 ans', hint: 'Période de référence de 24 mois' }, { value: '55to56', label: '55 ou 56 ans', hint: 'Période de référence de 36 mois' }, { value: '57plus', label: '57 ans et plus', hint: 'Période de référence de 36 mois' }] },
            { key: 'sais', short: 'Saisonnier', type: 'choice', title: 'S\u2019agit-il d\u2019un travailleur saisonnier ou d\u2019un primo-entrant ?', hint: 'Seuil d\u2019affiliation de 108 jours ou 758 heures au lieu de 130 jours ou 910 heures.', options: yesNo },
            { key: 'unite', short: 'Unité', type: 'choice', title: 'L\u2019activité est-elle comptée en jours ou en heures ?', options: [{ value: 'days', label: 'En jours travaillés' }, { value: 'hours', label: 'En heures travaillées' }] },
            { key: 'aff', short: 'Activité', type: 'number', unit: 'sur la période', title: 'Quel volume d\u2019activité sur la période de référence ?', hint: 'Jours ou heures selon la réponse précédente.' },
            { key: 'jours', short: 'Période', type: 'number', unit: 'jours', optional: true, title: 'Combien de jours calendaires compte la période d\u2019emploi retenue ?', hint: 'Du premier jour du premier contrat à la fin de la période de référence. Facultatif : donne la durée d\u2019indemnisation réelle (jours × 0,75, minimum 182) au lieu du maximum.' },
            { key: 'forclusion', short: 'Délai', type: 'choice', title: 'La demande d\u2019allocation est-elle déposée dans les 12 mois ?', options: () => DOSSIER_OPTS.forclusion() },
            { key: 'residence', short: 'Résidence', type: 'choice', title: 'Quelle est la situation de résidence et d\u2019aptitude ?', options: () => DOSSIER_OPTS.residence() },
            { key: 'recherche', short: 'Recherche', type: 'choice', title: 'L\u2019usager est-il en recherche active d\u2019emploi et engagé dans son projet personnalisé ?', options: yesNo },
            { key: 'retraite', short: 'Retraite', type: 'choice', title: 'L\u2019usager est-il sans retraite à taux plein ?', options: yesNo },
            { key: 'salaire', short: 'Salaire', type: 'number', unit: '€ brut / mois', optional: true, title: 'Quel est le salaire brut mensuel moyen ?', hint: 'Facultatif : sert à estimer l\u2019allocation et les différés.' },
            { key: 'sjr', short: 'SJR', type: 'number', unit: '€ / jour', optional: true, title: 'Connaissez-vous le salaire journalier de référence (SJR) de l\u2019attestation ?', hint: 'Facultatif : rend le montant exact au lieu d\u2019une estimation.', when: a => !!a.salaire || true },
            { key: 'cp', short: 'Congés payés', type: 'number', unit: '€', optional: true, title: 'Quel est le montant de l\u2019indemnité compensatrice de congés payés ?', hint: 'Facultatif : sert au différé congés payés.' },
            { key: 'supra', short: 'Supra-légal', type: 'number', unit: '€', optional: true, title: 'Quel est le montant des indemnités supra-légales ?', hint: 'Facultatif : sert au différé spécifique.' },
            { key: 'ref', short: 'Référence', type: 'text', optional: true, title: 'Référence interne du dossier', hint: 'Facultatif, pour l\u2019historique. Sans nom ni numéro d\u2019identification.' }
          ],
          result: (a, id) => dossierResult(a, id),
          note: a => window.__dossierMail || ''
        });
      } else { wizRender('dossier'); }
      renderDossierHistory();
    }

    // ---------- Journal des évolutions réglementaires (affiché dans la vue Barèmes) ----------
    const REG_JOURNAL = [
      ['01/09/2026', 'Rupture conventionnelle : durée maximale de 15 mois (20,5 mois à 55 ans et plus)', 'Admission, RCI, Délais'],
      ['01/07/2026', 'Allocations d\u2019assurance chômage non revalorisées', 'Barèmes, Admission, CSP'],
      ['01/04/2026', 'ASS à 19,48 € par jour', 'Barèmes'],
      ['Avril 2026', 'Limites d\u2019âge selon la génération (tableau Unédic)', 'Retraite'],
      ['01/07/2025', 'Partie fixe 13,18 €, allocation minimale 32,13 €, maximum 300,21 €', 'Admission, CSP, Cumul ARE'],
      ['23/10/2026', 'Revue des simulateurs sur les Paramètres utiles Unédic (avril 2026)', 'Tous les simulateurs']
    ];
    function renderRegJournal() {
      const jr = '<section class="bar-card"><div class="bar-head"><i data-lucide="history" class="w-4 h-4"></i><h3>Journal des évolutions</h3></div>' +
        REG_JOURNAL.map(r => '<div class="bar-row"><span class="bar-k"><strong>' + r[0] + '</strong> · ' + r[1] + '</span><span class="bar-v"></span><span class="bar-n">Outils concernés : ' + r[2] + '</span></div>').join('') + '</section>';
      const now = Date.now();
      const never = templates.filter(t => !t.reviewedAt).length;
      const old = templates.filter(t => t.reviewedAt && now - new Date(t.reviewedAt + 'T12:00:00').getTime() > 365 * 86400000).length;
      const rv = '<section class="bar-card"><div class="bar-head"><i data-lucide="file-check" class="w-4 h-4"></i><h3>Modèles de mails à relire</h3></div>' +
        '<div class="bar-row"><span class="bar-k">Jamais relus</span><span class="bar-v">' + never + ' / ' + templates.length + '</span><span class="bar-n">Renseignez la date de relecture et la référence réglementaire dans la fiche du modèle.</span></div>' +
        '<div class="bar-row"><span class="bar-k">Relus il y a plus d\u2019un an</span><span class="bar-v">' + old + '</span></div></section>';
      return jr + renderCasesCard();
    }

    // =====================================================================
    //  EXTENSIONS : frise chronologique, dates d'effet, cas de contrôle, SJR et durée, pièces, impression
    // =====================================================================

    // ---------- Calcul commun des dates d'un dossier ----------
    // o : { fct: Date, sjr, cp, supra, eco, ageBand ('u55'|'a55'|'a57'), rci, attenteDeja, joursPeriode }
    function ftComputeDates(o) {
      const B = BAREME;
      const sjr = o.sjr > 0 ? o.sjr : 0;
      const diffCp = sjr > 0 ? Math.min(B.differe.cpMax, Math.floor((o.cp || 0) / sjr)) : 0;
      const diffSpec = Math.min(o.eco ? B.differe.specMaxEco : B.differe.specMax, Math.floor((o.supra || 0) / B.differe.diviseur));
      const attente = o.attenteDeja ? 0 : B.differe.attente;
      const total = diffCp + diffSpec + attente;
      const rciReduit = !!o.rci && o.fct >= ftParseDate(B.duree.rci.effet);
      let dureeMax = B.duree.max[o.ageBand] || B.duree.max.u55;
      if (rciReduit) dureeMax = o.ageBand === 'u55' ? B.duree.rci.u55 : B.duree.rci.a55;
      let dureeReelle = dureeMax;
      if (o.joursPeriode > 0) dureeReelle = Math.min(dureeMax, Math.max(B.duree.min, Math.round(o.joursPeriode * B.duree.coef)));
      const debut = ftAddDays(o.fct, 1 + total);
      const fin = ftAddDays(debut, dureeReelle - 1);
      const aj = sjr > 0 ? ftAreJour(sjr).aj : 0;
      const degr = (o.ageBand === 'u55' && aj > B.degr.seuil && dureeReelle > 182) ? ftAddDays(debut, 182) : null;
      return { diffCp: diffCp, diffSpec: diffSpec, attente: attente, total: total, debut: debut, dureeMax: dureeMax, dureeReelle: dureeReelle, fin: fin,
        forclos: ftAddDays(o.fct, 365), degr: degr, rciReduit: rciReduit, aj: aj };
    }

    // ---------- Frise chronologique ----------
    function ftTimelineHtml(d, fct) {
      const segs = [
        { n: d.diffCp, cls: 'tl-cp', label: 'Congés payés' },
        { n: d.diffSpec, cls: 'tl-spec', label: 'Supra-légal' },
        { n: d.attente, cls: 'tl-att', label: 'Délai d\u2019attente' },
        { n: d.dureeReelle, cls: 'tl-ind', label: 'Indemnisation' }
      ].filter(x => x.n > 0);
      const tot = segs.reduce((a, x) => a + x.n, 0) || 1;
      const bar = segs.map(x => '<div class="tl-seg ' + x.cls + '" style="flex:' + Math.max(x.n / tot, 0.06) + '" title="' + x.label + ' : ' + x.n + ' j"><span>' + x.n + ' j</span></div>').join('');
      const legend = segs.map(x => '<span class="tl-leg"><i class="' + x.cls + '"></i>' + x.label + '</span>').join('');
      const ev = [
        ['tl-dot-fct', 'Fin de contrat', ftFmtDate(fct), ''],
        d.total > 0 ? ['tl-dot-att', 'Fin des différés et du délai d\u2019attente', ftFmtDate(ftAddDays(fct, d.total)), d.total + ' jours'] : null,
        ['tl-dot-ind', 'Premier jour indemnisable', ftFmtDate(d.debut), ''],
        d.degr ? ['tl-dot-warn', 'Dégressivité : AJ × 0,7', ftFmtDate(d.degr), '7e mois'] : null,
        ['tl-dot-fin', 'Fin de droits maximale', ftFmtDate(d.fin), d.dureeReelle + ' jours'],
        ['tl-dot-forc', 'Inscription au plus tard', ftFmtDate(d.forclos), '12 mois après la fin de contrat']
      ].filter(Boolean);
      return '<div class="tl"><div class="tl-bar">' + bar + '</div><div class="tl-legend">' + legend + '</div>' +
        '<div class="tl-events">' + ev.map(e => '<div class="tl-ev"><i class="' + e[0] + '"></i><span class="tl-ev-k">' + e[1] + '</span><span class="tl-ev-d">' + e[2] + '</span>' + (e[3] ? '<span class="tl-ev-n">' + e[3] + '</span>' : '') + '</div>').join('') + '</div></div>';
    }

    // ---------- Barre simple (progression, consommation de droits) ----------
    function ftBar(label, parts, caption) {
      return '<div class="ft-bar"><div class="ft-bar-head"><span>' + label + '</span><span>' + (caption || '') + '</span></div><div class="ft-bar-track">' +
        parts.map(p => '<i class="' + p.cls + '" style="width:' + Math.max(0, Math.min(100, p.pct)).toFixed(1) + '%" title="' + p.label + '"></i>').join('') + '</div>' +
        '<div class="ft-bar-legend">' + parts.map(p => '<span><i class="' + p.cls + '"></i>' + p.label + '</span>').join('') + '</div></div>';
    }
    function cumulBar(r) {
      const tot = Math.max(r.reliquat, 1);
      const used = Math.min(r.j, tot);
      return ftBar('Consommation des droits ce mois', [
        { cls: 'fb-used', pct: used / tot * 100, label: used + ' j consommés' },
        { cls: 'fb-left', pct: (tot - used) / tot * 100, label: (tot - used) + ' j restants' }
      ], 'Reliquat avant : ' + r.reliquat + ' j. ' + r.reportes + ' jours du mois reportés en fin de droits');
    }

    // ---------- Barème : date d'effet et fraîcheur ----------
    function ftBaremeWarnings(fct) {
      const out = [];
      if (fct && fct < ftParseDate('2025-07-01')) out.push('Fin de contrat avant le 01/07/2025 : le barème intégré (en vigueur depuis le 01/07/2025) peut différer des montants applicables à cette date. Contrôlez la notification de droits.');
      return out;
    }
    function ftBaremeAge() {
      const [d, m, y] = BAREME.verifie.split('/').map(Number);
      return Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86400000);
    }
    function renderRegBanner() {
      const el = document.getElementById('reg-banner-text');
      if (!el) return;
      const age = ftBaremeAge();
      const btn = el.closest('button');
      const stale = age > 90;
      const now = new Date();
      const proche = now.getMonth() === 5 || (now.getMonth() === 4 && now.getDate() >= 15);
      el.textContent = stale ? 'Barème à revérifier (vérifié le ' + BAREME.verifie + ')' : (proche ? 'Barème vérifié le ' + BAREME.verifie + ' · revalorisation possible au 01/07' : 'Barème Unédic vérifié le ' + BAREME.verifie);
      if (btn) btn.classList.toggle('is-stale', stale || proche);
    }

    // ---------- SJR et durée réelle ----------
    function ftSjrFromInputs(g) {
      const sr = parseFloat(g('dl-sr')?.value) || 0, den = parseFloat(g('dl-jours-den')?.value) || 0;
      return (sr > 0 && den > 0) ? sr / den : 0;
    }

    // ---------- Délais et échéances (version complète) ----------
    function runDelais() {
      const g = id => document.getElementById(id);
      const val = id => parseFloat(g(id)?.value) || 0;
      const B = BAREME;
      const fct = ftParseDate(g('dl-fct')?.value);
      const out = g('dl-result');
      if (!out) return;
      if (!fct) {
        out.innerHTML = '<div class="dl-empty"><i data-lucide="calendar-days" class="w-8 h-8"></i><p>Saisissez la date de fin de contrat pour obtenir les échéances.</p></div>';
        refreshIcons();
        return;
      }
      const sal = val('dl-salaire');
      const sjrCalc = ftSjrFromInputs(g);
      const sjr = sjrCalc > 0 ? sjrCalc : (sal > 0 ? sal / 30.42 : 0);
      const ageBand = g('dl-age')?.value || 'u55';
      const base = { fct: fct, sjr: sjr, cp: val('dl-iccp'), supra: val('dl-supra'), eco: g('dl-eco')?.checked, ageBand: ageBand, rci: g('dl-rci')?.checked, attenteDeja: g('dl-attente-deja')?.checked, joursPeriode: val('dl-jours-per') };
      const d = ftComputeDates(base);
      const insc = ftParseDate(g('dl-insc')?.value);
      const rows = [
        ['Fin de contrat de travail', ftFmtDate(fct), 'Point de départ'],
        ['Différé congés payés', d.diffCp + ' j', sjr > 0 ? 'ICCP ÷ SJR, plafonné à ' + B.differe.cpMax + ' j' : 'Renseignez le salaire moyen ou le SJR'],
        ['Différé spécifique', d.diffSpec + ' j', 'Supra-légales ÷ ' + String(B.differe.diviseur).replace('.', ',') + (base.eco ? ' (plafond 75 j)' : ' (plafond 150 j)')],
        ['Délai d\u2019attente', d.attente + ' j', d.attente ? '7 jours' : 'Déjà appliqué dans les 12 derniers mois'],
        ['Total des différés', d.total + ' j', 'Du lendemain de la fin de contrat'],
        ['Premier jour indemnisable', ftFmtDate(d.debut), 'Fin de contrat + ' + (1 + d.total) + ' j']
      ];
      const dates = [
        ['Inscription au plus tard', ftFmtDate(d.forclos), 'Demande d\u2019allocation dans les 12 mois suivant la fin de contrat'],
        ['Durée d\u2019indemnisation', d.dureeReelle + ' j', base.joursPeriode > 0 ? 'Jours de la période × 0,75 (minimum 182 j, plafond ' + d.dureeMax + ' j)' : 'Durée maximale (renseignez les jours de la période pour la durée réelle)'],
        ['Fin de droits', ftFmtDate(d.fin), d.rciReduit ? 'Rupture conventionnelle à compter du 01/09/2026' : 'Selon la durée retenue']
      ];
      if (d.degr) dates.push(['Dégressivité', ftFmtDate(d.degr), 'AJ × 0,7 à partir du 7e mois (AJ estimée ' + fmtEur(d.aj) + ')']);
      if (insc) dates.push(['Inscription déclarée', ftFmtDate(insc), insc > d.forclos ? 'Hors délai : forclusion possible' : 'Dans le délai']);
      const tbl = list => '<div class="dl-list">' + list.map(r => '<div class="dl-row"><span class="dl-k">' + r[0] + '</span><span class="dl-v">' + r[1] + '</span><span class="dl-n">' + r[2] + '</span></div>').join('') + '</div>';
      const warns = ftBaremeWarnings(fct).map(t => wizAlert('warn', t)).join('');
      // Comparaison rupture conventionnelle : règle avant / à compter du 01/09/2026
      let cmp = '';
      if (base.rci) {
        const av = ftComputeDates(Object.assign({}, base, { fct: ftParseDate('2026-08-31') }));
        const ap = ftComputeDates(Object.assign({}, base, { fct: ftParseDate('2026-09-01') }));
        cmp = '<h3 class="dl-h">Rupture conventionnelle : comparaison des règles</h3><div class="cmp"><div class="cmp-col"><strong>Avant le 01/09/2026</strong><span>Durée maximale</span><b>' + av.dureeMax + ' j</b></div><div class="cmp-col is-new"><strong>À compter du 01/09/2026</strong><span>Durée maximale</span><b>' + ap.dureeMax + ' j</b></div><div class="cmp-col"><strong>Écart</strong><span>Jours d\u2019indemnisation en moins</span><b>' + (av.dureeMax - ap.dureeMax) + ' j</b></div></div>';
      }
      out.innerHTML = '<div class="dl-hero"><span>Premier jour indemnisable</span><strong>' + ftFmtDate(d.debut) + '</strong>' +
        (sjrCalc > 0 ? '<em>SJR calculé : ' + fmtEur(sjrCalc) + (d.aj ? ' · AJ ' + fmtEur(d.aj) : '') + '</em>' : '') + '</div>' + warns +
        '<h3 class="dl-h">Frise chronologique</h3>' + ftTimelineHtml(d, fct) +
        '<h3 class="dl-h">Différés</h3>' + tbl(rows) + '<h3 class="dl-h">Échéances</h3>' + tbl(dates) + cmp;
      refreshIcons();
    }

    // ---------- Pièces à demander et sources, selon le motif ----------
    function ftPieces(motif) {
      const m = String(motif || '');
      const base = ['Attestation employeur destinée à France Travail', 'Pièce d\u2019identité', 'Derniers bulletins de paie'];
      if (/demission|essai_sal/.test(m)) return ['Lettre de démission', 'Justificatifs du motif de démission invoqué (selon le cas)'].concat(base);
      if (/rupture_conv/.test(m)) return ['Copie de la convention de rupture homologuée'].concat(base, ['Solde de tout compte']);
      if (/licenci/.test(m)) return ['Lettre de licenciement'].concat(base, ['Solde de tout compte']);
      if (/cdd|mission|fin_/.test(m)) return ['Contrats de travail et avenants'].concat(base);
      return base;
    }
    function ftSourcesFor(motif) {
      const S = BAREME.sources, m = String(motif || '');
      const out = [S[0]];
      if (/rupture_conv/.test(m)) out.push(S[2]);
      out.push(S[3]);
      return out;
    }

    // ---------- Cas de contrôle des calculs ----------
    const FT_CASES = [
      { n: 'ARE : SJR 100 € (57 % du SJR)', run: () => ftAreJour(100).aj, exp: 57, d: 2 },
      { n: 'ARE : SJR 78,89 € (40,4 % + partie fixe)', run: () => ftAreJour(78.89).aj, exp: 45.05, d: 2 },
      { n: 'ARE : SJR 45 € (allocation minimale)', run: () => ftAreJour(45).aj, exp: 32.13, d: 2 },
      { n: 'ARE : SJR 32,87 € (limite 75 % du SJR)', run: () => ftAreJour(32.87).aj, exp: 24.65, d: 2 },
      { n: 'ARE : maximum théorique', run: () => ftAreJour(900).aj, exp: 300.21, d: 2 },
      { n: 'Cumul : AJ 57 €, brut 2 100 €, 30 jours (exemple Unédic) : jours', run: () => cumulCompute({ aj: 57, brut: 2100, sjr: 100, mois: '2026-11' }).j, exp: 4, d: 0 },
      { n: 'Cumul : complément versé', run: () => cumulCompute({ aj: 57, brut: 2100, sjr: 100, mois: '2026-11' }).complement, exp: 228, d: 2 },
      { n: 'Cumul : mensualisation, 30 jours même en décembre', run: () => cumulCompute({ aj: 57, brut: 0, sjr: 100, mois: '2026-12' }).areM, exp: 1710, d: 2 },
      { n: 'Cumul : cas réel (AJ 66,30, SJR 116,31, brut 2 000) : net', run: () => cumulCompute({ aj: 66.3, brut: 2000, sjr: 116.31, mois: '2026-11' }).net, exp: 565.29, d: 2 },
      { n: 'Cumul : même cas en février, identique', run: () => cumulCompute({ aj: 66.3, brut: 2000, sjr: 116.31, mois: '2027-02' }).net, exp: 565.29, d: 2 },
      { n: 'Cumul : plafond SJR 70 € atteint, jours', run: () => cumulCompute({ aj: 57, brut: 2100, sjr: 70, mois: '2026-12' }).j, exp: 0, d: 0 },
      { n: 'Durée maximale, moins de 55 ans', run: () => ftComputeDates({ fct: new Date('2026-06-01T12:00:00'), sjr: 0, ageBand: 'u55' }).dureeMax, exp: 548, d: 0 },
      { n: 'Durée maximale, 55 et 56 ans', run: () => ftComputeDates({ fct: new Date('2026-06-01T12:00:00'), sjr: 0, ageBand: 'a55' }).dureeMax, exp: 685, d: 0 },
      { n: 'Durée maximale, 57 ans et plus', run: () => ftComputeDates({ fct: new Date('2026-06-01T12:00:00'), sjr: 0, ageBand: 'a57' }).dureeMax, exp: 822, d: 0 },
      { n: 'Rupture conventionnelle à compter du 01/09/2026, moins de 55 ans', run: () => ftComputeDates({ fct: new Date('2026-09-01T12:00:00'), sjr: 0, ageBand: 'u55', rci: true }).dureeMax, exp: 456, d: 0 },
      { n: 'Rupture conventionnelle avant le 01/09/2026, moins de 55 ans', run: () => ftComputeDates({ fct: new Date('2026-08-31T12:00:00'), sjr: 0, ageBand: 'u55', rci: true }).dureeMax, exp: 548, d: 0 },
      { n: 'Différé : total pour ICCP 1 500 €, supra 5 000 €, SJR 78,89 €', run: () => ftComputeDates({ fct: new Date('2026-10-15T12:00:00'), sjr: 78.89, cp: 1500, supra: 5000, ageBand: 'u55' }).total, exp: 70, d: 0 },
      { n: 'Différé spécifique plafonné à 75 j (motif économique)', run: () => ftComputeDates({ fct: new Date('2026-10-15T12:00:00'), sjr: 78.89, supra: 50000, eco: true, ageBand: 'u55' }).diffSpec, exp: 75, d: 0 },
      { n: 'Différé congés payés plafonné à 30 j', run: () => ftComputeDates({ fct: new Date('2026-10-15T12:00:00'), sjr: 40, cp: 9000, ageBand: 'u55' }).diffCp, exp: 30, d: 0 },
      { n: 'Durée réelle : 400 jours de période × 0,75', run: () => ftComputeDates({ fct: new Date('2026-06-01T12:00:00'), sjr: 0, ageBand: 'u55', joursPeriode: 400 }).dureeReelle, exp: 300, d: 0 },
      { n: 'Durée réelle : minimum de 182 jours', run: () => ftComputeDates({ fct: new Date('2026-06-01T12:00:00'), sjr: 0, ageBand: 'u55', joursPeriode: 200 }).dureeReelle, exp: 182, d: 0 }
    ];
    function renderCasesCard() {
      return '<section class="bar-card" id="bar-check"><div class="bar-head"><i data-lucide="shield-check" class="w-4 h-4"></i><h3>Contrôle des calculs</h3></div>' +
        '<div class="bar-row"><span class="bar-k">' + FT_CASES.length + ' cas de référence (exemples Unédic et règles du barème)</span><span class="bar-v"><button type="button" class="reg-btn reg-btn-primary" onclick="runCasesCheck()">Contrôler</button></span></div>' +
        '<div id="bar-check-out"></div></section>';
    }
    function runCasesCheck() {
      const out = document.getElementById('bar-check-out');
      if (!out) return;
      let ko = 0;
      const rows = FT_CASES.map(c => {
        let got, ok;
        try { got = c.run(); ok = Math.abs(got - c.exp) < Math.pow(10, -c.d) / 2 + 1e-9; } catch (e) { got = 'erreur'; ok = false; }
        if (!ok) ko++;
        return '<div class="case-row ' + (ok ? 'is-ok' : 'is-ko') + '"><span>' + c.n + '</span><span>' + (typeof got === 'number' ? got.toLocaleString('fr-FR', { maximumFractionDigits: c.d }) : got) + '</span><span>attendu ' + c.exp.toLocaleString('fr-FR') + '</span><b>' + (ok ? 'OK' : 'ÉCART') + '</b></div>';
      });
      out.innerHTML = '<div class="case-sum ' + (ko ? 'is-ko' : 'is-ok') + '">' + (ko ? ko + ' écart(s) détecté(s) : vérifier le barème ou les calculs.' : 'Tous les cas sont conformes (' + FT_CASES.length + '/' + FT_CASES.length + ').') + '</div>' + rows.join('');
    }

    // ---------- Note imprimable ----------
    function ftPrintNote(title, text) {
      const w = window.open('', '_blank', 'width=820,height=900');
      if (!w) { showToast('Autorisez les fenêtres pop-up pour imprimer', 'error'); return; }
      const esc = escapeHtml(text).replace(/\n/g, '<br>');
      w.document.write('<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#14264d;margin:36px;line-height:1.5}h1{font-size:20px;color:#0b2a6b;border-bottom:3px solid #0b5cd5;padding-bottom:8px}p{font-size:13px}small{color:#566b86}</style></head><body><h1>' + escapeHtml(title) + '</h1><p>' + esc + '</p><p><small>Note générée le ' + new Date().toLocaleDateString('fr-FR') + ' · barème Unédic vérifié le ' + BAREME.verifie + ' · valeurs indicatives, à confirmer par la notification de droits.</small></p></body></html>');
      w.document.close();
      setTimeout(() => { w.focus(); w.print(); }, 250);
    }
    function dossierPrint() { ftPrintNote('Étude de droits à l\u2019ARE', window.__dossierNote || ''); }
    function cumulPrint() { const w = FT_WIZ.cumul; if (w) ftPrintNote('Cumul ARE et salaire', cumulNote(w.answers)); }

    // ---------- Parcours dossier : résultat complet ----------
    function dossierResult(a, id) {
      dossierApply(a);
      const sn = dossierSnapshot();
      const eligible = !/^NON/i.test(sn.verdict);
      const detail = (document.getElementById('sim-calc-detail') || {}).innerHTML || '';
      const mail = dossierMail(a, sn);
      window.__dossierMail = mail;
      const fct = ftParseDate(a.fct) || new Date();
      const ageBand = a.age === 'under55' ? 'u55' : (a.age === '55to56' ? 'a55' : 'a57');
      const sjrAtt = parseFloat(a.sjr) || 0, sal = parseFloat(a.salaire) || 0;
      const sjr = sjrAtt > 0 ? sjrAtt : (sal > 0 ? sal / 30.42 : 0);
      const d = ftComputeDates({ fct: fct, sjr: sjr, cp: parseFloat(a.cp) || 0, supra: parseFloat(a.supra) || 0, eco: a.motif === 'licenciement_eco', ageBand: ageBand, rci: a.motif === 'rupture_conv', joursPeriode: parseFloat(a.jours) || 0 });
      // Alertes et état
      const alerts = dossierAlerts(a);
      ftBaremeWarnings(a.fct ? fct : null).forEach(t => alerts.push(wizAlert('warn', t)));
      const nWarn = alerts.filter(x => x.indexOf('is-warn') > -1).length, nDanger = alerts.filter(x => x.indexOf('is-danger') > -1).length;
      const state = (!eligible || nDanger) ? 'ko' : (nWarn ? 'warn' : 'ok');
      const stateLabel = state === 'ko' ? 'Bloquant' : (state === 'warn' ? 'À vérifier' : 'Conforme');
      const badge = sjrAtt > 0 ? '<span class="ft-badge is-exact">Montant exact</span>' : (sal > 0 ? '<span class="ft-badge is-est">Estimé</span>' : '');
      // Affiliation
      const heures = a.unite === 'hours';
      const seuil = a.sais === 'oui' ? (heures ? BAREME.affiliation.heuresSais : BAREME.affiliation.joursSais) : (heures ? BAREME.affiliation.heures : BAREME.affiliation.jours);
      const aff = parseFloat(a.aff) || 0;
      const affBar = ftBar('Affiliation : ' + aff + ' / ' + seuil + (heures ? ' h' : ' j'), [{ cls: aff >= seuil ? 'fb-ok' : 'fb-ko', pct: Math.min(100, aff / seuil * 100), label: aff >= seuil ? 'Seuil atteint' : 'Seuil non atteint' }], aff >= seuil ? 'Condition remplie' : 'Il manque ' + Math.max(0, seuil - aff) + (heures ? ' h' : ' j'));
      const pieces = ftPieces(a.motif).map(p => '<li>' + escapeHtml(p) + '</li>').join('');
      const sources = ftSourcesFor(a.motif).map(s => '<a href="' + s.url + '" target="_blank" rel="noopener noreferrer">' + s.label + '</a>').join('');
      const note = 'Étude de droits à l\u2019ARE' + (a.ref ? ' (réf. ' + a.ref + ')' : '') + '\n\n' + mail + '\n\nDates : fin de contrat ' + ftFmtDate(fct) + ', premier jour indemnisable ' + ftFmtDate(d.debut) + ', fin de droits ' + ftFmtDate(d.fin) + '.';
      window.__dossierNote = note;
      return '<div class="wiz-result">' +
        '<div class="wiz-hero ' + (state === 'ko' ? 'is-ko' : (state === 'ok' ? 'is-ok' : 'is-warn')) + '"><div class="wiz-hero-top"><span>' + escapeHtml(sn.verdict) + '</span><span class="ft-state is-' + state + '">' + stateLabel + '</span></div>' +
          '<strong>' + (eligible && sn.are !== '—' ? escapeHtml(sn.are) + ' / jour' : (eligible ? 'Droits ouverts' : 'Droits non ouverts')) + ' ' + badge + '</strong><em>' + escapeHtml(sn.desc) + '</em></div>' +
        affBar +
        (eligible ? '<div class="wiz-tiles">' +
          '<div class="wiz-tile"><span>Durée ' + (a.jours ? 'estimée' : 'maximale') + '</span><strong>' + d.dureeReelle + ' jours</strong></div>' +
          '<div class="wiz-tile"><span>Différés avant versement</span><strong>' + d.total + ' jours</strong></div>' +
          '<div class="wiz-tile"><span>Premier jour indemnisable</span><strong>' + ftFmtDate(d.debut) + '</strong></div>' +
          '<div class="wiz-tile"><span>Fin de droits</span><strong>' + ftFmtDate(d.fin) + '</strong></div></div>' +
          '<h4 class="wiz-h">Frise chronologique</h4>' + ftTimelineHtml(d, fct) : '') +
        alerts.join('') +
        '<h4 class="wiz-h">Détail du calcul</h4><div class="sim-detail">' + detail + '</div>' +
        '<div class="wiz-two"><div class="wiz-box"><h4 class="wiz-h">Pièces à demander</h4><ul class="wiz-list">' + pieces + '</ul><p class="wiz-hint">Liste générale à adapter à la situation du dossier.</p></div>' +
        '<div class="wiz-box"><h4 class="wiz-h">Sources</h4><div class="wiz-links">' + sources + '</div></div></div>' +
        '<h4 class="wiz-h">Texte à intégrer au mail</h4><textarea id="dossier-mail" class="wiz-mail" rows="9" readonly>' + escapeHtml(mail) + '</textarea>' +
        '<div class="wiz-actions"><button type="button" class="wiz-btn" onclick="wizRestart(\'' + id + '\')">Nouveau dossier</button>' +
        '<button type="button" class="wiz-btn" onclick="switchNavTab(\'1\')">Simulateur détaillé</button>' +
        '<button type="button" class="wiz-btn" onclick="dossierSave()"><i data-lucide="save" class="w-4 h-4"></i>Enregistrer</button>' +
        '<button type="button" class="wiz-btn" onclick="dossierPrint()"><i data-lucide="printer" class="w-4 h-4"></i>Imprimer</button>' +
        '<button type="button" class="wiz-btn wiz-btn-primary" onclick="dossierCopyMail()"><i data-lucide="copy" class="w-4 h-4"></i>Copier le texte du mail</button></div></div>';
    }

    function initApp() {
      applyTheme(currentTheme);
      bootApp();
    }

    function bootApp() {
      loadState();
      replaceLibraryOnce();
      applyCategoryStyles();
      updateSortButton();
      applySidebarLayout();
      initSidebarResizer();
      renderBurgerTabs();
      populateCategorySelect();
      renderUserChip();
      renderRegBanner();
      switchNavTab(activeNavTab);
      initDateCalc();
      renderCalcHistory();
      refreshIcons();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  
