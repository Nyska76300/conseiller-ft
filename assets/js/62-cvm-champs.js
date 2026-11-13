(function () {
  /* CVM Direct : champs « intelligents »
     - dates : saisie rapide (01082026 → 01/08/2026), petit calendrier, contrôle du format ;
     - montants : mis au format français (1 234,56) en quittant la case ;
     - calculs automatiques entre champs d’un même mail (fin du délai d’attente, 1er jour indemnisable,
       nombre de jours entre deux dates, capital ARCE, totaux…). Un champ calculé reste modifiable :
       dès que vous le changez à la main, il n’est plus recalculé. */
  const isDateKey = (k, l) => /(^|_)(date|debut|fin|premier_jour)(_|$)/.test(k) && !/^nb_|^libelle|mois/.test(k) || /^(Date|Début|Fin|1er jour)/.test(l || '');
  const isMoneyKey = (k, l) => /€/.test(l || '') || /(montant|capital|salaire|prime|indemnites|sjr|trop_percu|percu_|declare_|du_mois|total_du|versement)/.test(k) && !/^nb_|date|mois_|^mois$/.test(k);
  const pad = n => String(n).padStart(2, '0');
  function parseD(s) {
    const m = String(s || '').trim().match(/^(\d{1,2})[\/.\- ](\d{1,2})[\/.\- ](\d{2,4})$/); if (!m) return null;
    let y = +m[3]; if (y < 100) y += 2000;
    const d = new Date(y, +m[2] - 1, +m[1]);
    return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? d : null;
  }
  const fmtD = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const addM = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
  const days = (a, b) => Math.round((b - a) / 864e5) + 1;
  function parseN(s) { const t = String(s || '').replace(/[\s  €]/g, '').replace(',', '.'); return t !== '' && !isNaN(+t) ? +t : null; }
  const fmtN = (n, dec) => (dec === 0 ? Math.floor(n + 1e-9) : n).toLocaleString('fr-FR', { minimumFractionDigits: dec == null ? 2 : dec, maximumFractionDigits: dec == null ? 2 : dec });

  /* Règles de calcul : [champ calculé, champs nécessaires, fonction] — appliquées seulement si le mail contient ces champs */
  const D = k => v => parseD(v[k]), N = k => v => parseN(v[k]);
  const RULES = [
    ['fin_delai_attente', ['debut_delai_attente'], v => fmtD(addD(D('debut_delai_attente')(v), 6))],
    ['debut_delai_attente', ['fin_differe_iccp', 'fin_differe_islr'], v => { const a = D('fin_differe_iccp')(v), b = D('fin_differe_islr')(v); return fmtD(addD(a > b ? a : b, 1)); }],
    ['debut_delai_attente', ['fin_differe_iccp'], v => fmtD(addD(D('fin_differe_iccp')(v), 1))],
    ['debut_delai_attente', ['fin_differe_cp'], v => fmtD(addD(D('fin_differe_cp')(v), 1))],
    ['premier_jour_indemnisable', ['fin_delai_attente'], v => fmtD(addD(D('fin_delai_attente')(v), 1))],
    ['debut_differe_islr', ['date_fin_contrat'], v => fmtD(addD(D('date_fin_contrat')(v), 1))],
    ['debut_differe_iccp', ['date_fin_contrat'], v => fmtD(addD(D('date_fin_contrat')(v), 1))],
    ['fin_differe_iccp', ['debut_differe_iccp', 'nb_jours_differe_iccp'], v => fmtD(addD(D('debut_differe_iccp')(v), N('nb_jours_differe_iccp')(v) - 1))],
    ['fin_differe_islr', ['debut_differe_islr', 'nb_jours_differe_islr'], v => N('nb_jours_differe_islr')(v) > 0 ? fmtD(addD(D('debut_differe_islr')(v), N('nb_jours_differe_islr')(v) - 1)) : v.debut_differe_islr],
    ['fin_differe_cp', ['debut_differe_cp', 'nb_jours_differe_cp'], v => fmtD(addD(D('debut_differe_cp')(v), N('nb_jours_differe_cp')(v) - 1))],
    ['nb_jours_differe_cp', ['debut_differe_cp', 'fin_differe_cp'], v => String(days(D('debut_differe_cp')(v), D('fin_differe_cp')(v)))],
    ['montant_premier_versement', ['nb_jours_indemnises', 'montant_journalier'], v => fmtN(N('nb_jours_indemnises')(v) * N('montant_journalier')(v))],
    ['date_reexamen', ['date_demission'], v => fmtD(addM(D('date_demission')(v), 4))],
    ['date_debut_rff', ['date_fin_droits'], v => fmtD(addD(D('date_fin_droits')(v), 1))],
    ['date_fin_droits_reportee', ['date_fin_droits'], v => fmtD(addD(D('date_fin_droits')(v), 15))],
    ['maintien_jours', ['reliquat_jours'], v => fmtN(N('reliquat_jours')(v) * 0.6, 0)],
    ['capital_arce', ['reliquat_jours', 'allocation_journaliere'], v => fmtN(N('reliquat_jours')(v) * N('allocation_journaliere')(v) * 0.6)],
    ['versement_arce', ['capital_arce'], v => fmtN(N('capital_arce')(v) / 2)],
    ['salaire_brut_total', ['salaire_heures', 'prime', 'indemnites_cp'], v => fmtN(N('salaire_heures')(v) + N('prime')(v) + N('indemnites_cp')(v))],
    ['nb_jours_nouveau', ['debut_periode_nouvelle', 'fin_periode_nouvelle'], v => String(days(D('debut_periode_nouvelle')(v), D('fin_periode_nouvelle')(v)))],
    ['nb_jours_ancien', ['debut_periode_ancienne', 'fin_periode_ancienne'], v => String(days(D('debut_periode_ancienne')(v), D('fin_periode_ancienne')(v)))],
    ['sjr_brut_nouveau', ['salaires_bruts', 'nb_jours_nouveau'], v => fmtN(N('salaires_bruts')(v) / N('nb_jours_nouveau')(v))],
    ['nb_jours_calcul_islr', ['indemnites_rupture', 'sjr'], v => fmtN(N('indemnites_rupture')(v) / N('sjr')(v), 0)],
    ['nb_jours_calcul_iccp', ['indemnites_conges_payes', 'sjr'], v => fmtN(N('indemnites_conges_payes')(v) / N('sjr')(v), 0)],
    ['total_du', ['du_mois_1', 'du_mois_2'], v => fmtN(N('du_mois_1')(v) + N('du_mois_2')(v))],
    ['date_debut_prise_en_charge', ['premier_jour_indemnisable'], v => v.premier_jour_indemnisable],
  ];
  const ok = (keys, v) => keys.every(k => { const x = v[k]; if (x == null || String(x).trim() === '') return false; return isDateKey(k) ? !!parseD(x) : true; });

  const manual = {}; /* champs modifiés à la main : tplId → Set */
  const auto = {};   /* champs remplis par le calcul : tplId → Set */
  const tplOf = id => { try { return templates.find(t => t.id === id); } catch (e) { return null; } };

  function compute(tpl) {
    if (!tpl || !tpl.variables) return [];
    const keys = new Set(tpl.variables.map(v => v.key));
    const v = userVariables[tpl.id] || (userVariables[tpl.id] = {});
    const man = manual[tpl.id] || new Set(), au = auto[tpl.id] || (auto[tpl.id] = new Set());
    const changed = [];
    for (let pass = 0; pass < 4; pass++) {
      let any = false;
      RULES.forEach(([out, need, fn]) => {
        if (!keys.has(out) || man.has(out) || !need.every(k => keys.has(k)) || !ok(need, v)) return;
        if (String(v[out] || '').trim() && !au.has(out)) return; /* déjà saisi (ou pré-rempli) : on ne l’écrase pas */
        let r; try { r = fn(v); } catch (e) { return; }
        if (r == null || r === '' || /NaN|Infinity|Invalid/.test(String(r))) return;
        if (v[out] !== r) { v[out] = r; au.add(out); changed.push(out); any = true; }
      });
      if (!any) break;
    }
    return changed;
  }

  function decorate(tpl) {
    const grid = document.getElementById('dynamic-inputs-grid'); if (!grid || !tpl) return;
    const au = auto[tpl.id] || new Set();
    grid.querySelectorAll('input[oninput*="handleVarChange"]').forEach(inp => {
      const m = inp.getAttribute('oninput').match(/handleVarChange\('[^']*',\s*'([^']+)'/); if (!m) return;
      const key = m[1], def = (tpl.variables || []).find(x => x.key === key) || {}, wrap = inp.parentNode;
      inp.dataset.key = key;
      const outs = RULES.filter(r => r[0] === key && r[1].every(k => (tpl.variables || []).some(x => x.key === k)));
      wrap.classList.toggle('cv-calc', outs.length > 0);
      wrap.classList.toggle('cv-auto', au.has(key));
      if (outs.length && !wrap.querySelector('.cv-badge')) { const b = document.createElement('span'); b.className = 'cv-badge'; b.textContent = 'calculé'; b.title = 'Rempli automatiquement à partir des autres champs (modifiable)'; wrap.querySelector('label').appendChild(b); }
      if (isDateKey(key, def.label)) {
        inp.classList.add('cv-date'); inp.setAttribute('inputmode', 'numeric'); inp.setAttribute('autocomplete', 'off');
        if (!wrap.querySelector('.cv-cal')) {
          const box = document.createElement('div'); box.className = 'cv-row'; inp.parentNode.insertBefore(box, inp); box.appendChild(inp);
          const cal = document.createElement('input'); cal.type = 'date'; cal.className = 'cv-cal'; cal.tabIndex = -1; cal.title = 'Choisir dans le calendrier'; cal.setAttribute('aria-label', 'Calendrier : ' + (def.label || key));
          cal.addEventListener('change', () => { if (!cal.value) return; const [y, mo, d] = cal.value.split('-'); inp.value = d + '/' + mo + '/' + y; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('blur')); });
          box.appendChild(cal);
        }
        valid(inp);
      } else if (isMoneyKey(key, def.label)) inp.classList.add('cv-money');
    });
  }
  function valid(inp) {
    const v = inp.value.trim();
    inp.classList.toggle('cv-bad', !!v && !parseD(v));
    inp.title = inp.classList.contains('cv-bad') ? 'Date attendue au format JJ/MM/AAAA' : '';
  }

  /* Saisie rapide et mise en forme */
  document.addEventListener('input', e => {
    const inp = e.target; if (!inp.matches || !inp.matches('#dynamic-inputs-grid input.cv-date')) return;
    const d = inp.value.replace(/\D/g, '');
    if (/^\d{8}$/.test(d) && !/\//.test(inp.value)) { inp.value = d.slice(0, 2) + '/' + d.slice(2, 4) + '/' + d.slice(4); }
    valid(inp);
  }, true);
  document.addEventListener('focusout', e => {
    const inp = e.target; if (!inp.matches) return;
    if (inp.matches('#dynamic-inputs-grid input.cv-date')) {
      const m = inp.value.trim().match(/^(\d{1,2})[\/.\- ](\d{1,2})[\/.\- ](\d{2,4})$/);
      if (m) { const d = parseD(inp.value); if (d && inp.value !== fmtD(d)) { inp.value = fmtD(d); inp.dispatchEvent(new Event('input', { bubbles: true })); } }
      valid(inp);
    } else if (inp.matches('#dynamic-inputs-grid input.cv-money')) {
      const n = parseN(inp.value); if (n != null) { const f = fmtN(n, Number.isInteger(n) && !/[,.]/.test(inp.value) ? 0 : 2); if (f !== inp.value) { inp.value = f; inp.dispatchEvent(new Event('input', { bubbles: true })); } }
    }
  }, true);

  /* Branchement sur CVM Direct */
  if (typeof handleVarChange === 'function') {
    const _h = handleVarChange;
    handleVarChange = function (tplId, key, value) {
      (manual[tplId] || (manual[tplId] = new Set()));
      if (auto[tplId] && auto[tplId].has(key)) auto[tplId].delete(key);
      if (String(value).trim()) manual[tplId].add(key); else manual[tplId].delete(key);
      const r = _h.apply(this, arguments);
      const tpl = tplOf(tplId), ch = compute(tpl);
      if (ch.length) {
        ch.forEach(k => { const i = document.querySelector('#dynamic-inputs-grid input[data-key="' + k + '"]'); if (i && i !== document.activeElement) { i.value = userVariables[tplId][k]; i.parentNode.closest('.space-y-1') && i.closest('.space-y-1').classList.add('cv-auto'); valid(i); } });
        try { saveState(); updateCompiledPreview(); if (tpl) updateMailtoLink(tpl); } catch (e) {}
      }
      return r;
    };
  }
  if (typeof renderVariablesForm === 'function') {
    const _r = renderVariablesForm;
    renderVariablesForm = function (tpl) { try { compute(tpl); } catch (e) {} const r = _r.apply(this, arguments); try { decorate(tpl); } catch (e) { console.warn(e); } return r; };
  }
  if (typeof resetVariables === 'function') {
    const _z = resetVariables;
    resetVariables = function () { try { const id = activeTemplateId; delete manual[id]; delete auto[id]; } catch (e) {} return _z.apply(this, arguments); };
  }
  window.ftCvmCompute = compute;
})();
