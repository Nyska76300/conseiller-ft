(function () {
  /* Champs à choix dans les modèles CVM : un menu déroulant remplace la saisie libre,
     et le texte inséré dans le mail s'adapte au motif choisi.
     Pour ajouter une liste : CHOICES[clé de la variable] = [[code, libellé du menu, texte inséré], …]. */
  const CHOICES = {
    motif_trop_percu: [
      ['*', 'Pénalité administrative', 'une pénalité administrative prononcée à votre encontre'],
      ['A', 'Double paiement', 'un double paiement de vos allocations'],
      ['B', 'Taux erroné', 'l’application d’un montant journalier erroné à vos allocations'],
      ['C', 'Préavis payé', 'des allocations versées pendant une période de préavis qui vous a été payée par votre employeur'],
      ['D', 'Activité non salariée', 'la prise en compte des revenus de votre activité non salariée'],
      ['E', 'Pas de droit aux allocations', 'des allocations versées alors que vous ne remplissiez pas les conditions pour en bénéficier'],
      ['F', 'Double dossier', 'des allocations versées au titre de deux dossiers ouverts en même temps'],
      ['G', 'Activité salariée', 'la prise en compte de votre activité salariée'],
      ['H', 'Pension d’invalidité', 'la prise en compte de votre pension d’invalidité'],
      ['I', 'Acompte non récupéré', 'un acompte qui n’a pas été déduit de vos allocations'],
      ['J', 'Fiche alerte autre région', 'une régularisation signalée par une autre direction régionale de France Travail'],
      ['K', 'Formation', 'des allocations versées pendant votre période de formation'],
      ['L', 'Service national universel', 'des allocations versées pendant votre service national universel'],
      ['M', 'Liquidation de retraite', 'des allocations versées après la liquidation de votre pension de retraite'],
      ['N', 'Incarcération', 'des allocations versées pendant une période d’incarcération'],
      ['O', 'Cessation d’inscription', 'des allocations versées après la cessation de votre inscription comme demandeur d’emploi'],
      ['P', 'Révision de la situation', 'la révision de votre situation'],
      ['Q', 'Révision du droit', 'la révision de vos droits à l’allocation'],
      ['R', 'Paiement à tort', 'un paiement effectué à tort'],
      ['S', 'Avance non récupérée', 'une avance qui n’a pas été déduite de vos allocations'],
      ['T', 'Décès', 'des allocations versées après le décès de l’allocataire'],
      ['U', 'Mission intérim', 'la prise en compte de votre mission d’intérim'],
      ['V', 'Activité non déclarée', 'une activité professionnelle non déclarée lors de vos actualisations'],
      ['W', 'Cumul Sécurité sociale', 'le cumul de vos allocations avec des prestations de la Sécurité sociale'],
      ['X', 'IJSS transmises par la CPAM', 'des indemnités journalières de la Sécurité sociale qui nous ont été signalées par votre CPAM'],
      ['Y', 'Prestation CAF / MSA', 'la prise en compte d’une prestation versée par la CAF ou la MSA'],
      ['Z', 'Paiement à tort', 'un paiement effectué à tort'],
      ['1', 'Franchise non récupérée', 'un différé d’indemnisation (franchise) qui n’a pas été appliqué à vos allocations'],
      ['2', 'Cumul ASS et AAH', 'le cumul de l’allocation de solidarité spécifique avec l’allocation aux adultes handicapés'],
      ['6', 'Activité non salariée régularisée', 'la régularisation des revenus de votre activité non salariée'],
      ['7', 'Régularisation exceptionnelle', 'une régularisation exceptionnelle de votre dossier'],
      ['8', 'Modifications réglementaires', 'l’application de modifications réglementaires'],
      ['£', 'Trop-perçu de PAS', 'un trop-perçu de prélèvement à la source de l’impôt sur le revenu']
    ]
  };
  CHOICES.type_admission = [['def', 'Définitive', 'définitive'], ['prov', 'Provisoire', 'provisoire']];
  CHOICES.evenement_declare = [['travail', 'Travail', 'travail'], ['formation', 'Formation', 'formation'], ['stage', 'Stage', 'stage'], ['mission', 'Mission d’intérim', 'mission d’intérim']];
  Object.keys(CHOICES).filter(k => k === 'motif_trop_percu').forEach(k => CHOICES[k].sort((a, b) => a[1].localeCompare(b[1], 'fr', { sensitivity: 'base' })));
  /* Mois : menu des 24 derniers mois et des 3 suivants (« septembre 2026 ») */
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  function monthList() { const d = new Date(), out = []; for (let i = 3; i >= -24; i--) { const x = new Date(d.getFullYear(), d.getMonth() + i, 1); const t = MOIS[x.getMonth()] + ' ' + x.getFullYear(); out.push([t, t, t]); } return out; }
  const choicesFor = (key) => CHOICES[key] || (/^mois(_|$)/.test(key) && !/^mois_annee_attendu$/.test(key) ? monthList() : null);
  window.ftCvmChoicesFor = choicesFor;
  window.FT_CVM_CHOICES = CHOICES;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const OTHER = '__autre';

  function enhance(tpl) {
    if (!tpl || !tpl.variables) return;
    const grid = document.getElementById('dynamic-inputs-grid'); if (!grid) return;
    tpl.variables.forEach(v => {
      const list = choicesFor(v.key); if (!list) return;
      const inp = [...grid.querySelectorAll('input')].find(i => (i.getAttribute('oninput') || '').indexOf("'" + v.key + "'") >= 0);
      if (!inp || inp.dataset.choice) return;
      let store = {}; try { store = userVariables[tpl.id] || {}; } catch (e) {}
      const cur = store[v.key] || '';
      const hit = list.find(x => x[2] === cur);
      const sel = document.createElement('select');
      sel.className = inp.className + ' cvm-choice'; sel.setAttribute('aria-label', v.label);
      sel.innerHTML = '<option value="">' + (/^mois/.test(v.key) ? 'Choisir le mois…' : v.key === 'motif_trop_percu' ? 'Choisir le motif…' : 'Choisir…') + '</option>' + list.filter((x, i, a) => a.findIndex(y => y[1] === x[1]) === i).map(x => '<option value="' + esc(x[0]) + '"' + (hit && hit[0] === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>').join('') +
        '<option value="' + OTHER + '"' + (!hit && cur ? ' selected' : '') + '>' + (v.key === 'motif_trop_percu' ? 'Autre motif (texte libre)' : 'Autre (texte libre)') + '</option>';
      inp.dataset.choice = '1';
      if (v.key === 'motif_trop_percu') inp.placeholder = 'Rédigez le motif (ex. « une activité déclarée en retard »)';
      inp.classList.add('cvm-choice-free');
      inp.hidden = !(!hit && cur);
      inp.parentNode.insertBefore(sel, inp);
      const hint = document.createElement('div'); hint.className = 'cvm-choice-hint';
      inp.parentNode.appendChild(hint);
      const showHint = () => { const x = list.find(y => y[0] === sel.value); hint.textContent = x && v.key === 'motif_trop_percu' ? '« … correspondant à ' + x[2] + ' »' : ''; };
      sel.addEventListener('change', () => {
        if (sel.value === OTHER) { inp.hidden = false; inp.value = ''; handleVarChange(tpl.id, v.key, ''); inp.focus(); showHint(); return; }
        inp.hidden = true;
        const x = list.find(y => y[0] === sel.value);
        inp.value = x ? x[2] : '';
        handleVarChange(tpl.id, v.key, inp.value);
        showHint();
      });
      showHint();
    });
  }
  if (typeof renderVariablesForm === 'function') {
    const _r = renderVariablesForm;
    renderVariablesForm = function (tpl) { const r = _r.apply(this, arguments); try { enhance(tpl); } catch (e) { console.warn(e); } return r; };
    window.renderVariablesForm = renderVariablesForm;
  }
  setTimeout(() => { try { const t = templates.find(x => x.id === activeTemplateId); if (t) enhance(t); } catch (e) {} }, 700);
})();
