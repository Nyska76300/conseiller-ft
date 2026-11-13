(function () {
  /* Mails CVM pré-remplis : les montants, dates et durées du dernier simulateur utilisé
     sont proposés dans les champs des modèles de mail (bouton « Remplir » + suggestions par champ).
     Seuls des chiffres et des dates sont gardés, sur ce poste, pendant 12 heures. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const KEY = 'ft_calc_vals', TTL = 12 * 3600e3;
  const SKIP = ['home', 'cvm', 'admin', 'faq', 'glossaire', 'sources', 'jour', 'schemas', 'bareme', 'echeances', 'formation'];
  const RX = {
    montant: /^-?\d[\d\s  .]*(,\d{1,2})?\s?€(\s*(\/|par)\s*(jour|mois|j))?$/i,
    date: /^(\d{2}\/\d{2}\/\d{4})$/,
    jours: /^\d[\d\s  ]*\s?(jours?|j)(\s+calendaires)?$/i,
    mois: /^\d{1,3}\s?mois$/i
  };
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const clean = t => String(t || '').replace(/\s+/g, ' ').trim();

  /* ---------- Relevé des résultats du simulateur affiché ---------- */
  function labelOf(el, val) {
    for (let p = el, n = 0; p && n < 4; p = p.parentElement, n++) {
      let t = '';
      for (let s = p.previousElementSibling, k = 0; s && k < 2 && !t; s = s.previousElementSibling, k++) t = clean(s.textContent);
      if (!t && p.parentElement) t = clean(p.parentElement.textContent.replace(val, ''));
      t = t.replace(/[:*]/g, '').trim();
      if (t && t.length <= 70 && !RX.montant.test(t) && !RX.date.test(t)) return t;
      if (t && t.length > 70 && n > 0) break;
    }
    return '';
  }
  function collect() {
    let tab = ''; try { tab = String(activeNavTab); } catch (e) { return null; }
    if (!tab || SKIP.includes(tab)) return null;
    const view = document.querySelector('[id^="view-"]:not(.hidden)'); if (!view) return null;
    const vals = [], seen = new Set();
    view.querySelectorAll('span, b, strong, div, p, td, dd, em').forEach(el => {
      if (vals.length >= 16 || el.children.length || !el.offsetParent) return;
      if (el.closest('.ft-mail, input, textarea, select, button, .hub-bar, .rg-panel, #ft-ip, .fh-hist, label, h1, h2, h3')) return;
      const v = clean(el.textContent); if (!v || v.length > 40) return;
      const kind = Object.keys(RX).find(k => RX[k].test(v)); if (!kind) return;
      if (!parseFloat(v.replace(/[^\d,.]/g, '').replace(',', '.'))) return;
      const l = labelOf(el, v), sig = l + '|' + v; if (seen.has(sig)) return; seen.add(sig);
      vals.push({ k: kind, v: v.replace(/\s+/g, ' '), l });
    });
    if (!vals.length) return null;
    const name = (($('header-active-tab-name') || {}).textContent || tab).split('·').pop().trim();
    return { tab, name, at: Date.now(), vals };
  }
  const get = () => { try { const x = JSON.parse(localStorage.getItem(KEY) || 'null'); return x && Date.now() - x.at < TTL ? x : null; } catch (e) { return null; } };
  function snap() { const s = collect(); if (s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} } }
  let tmr = null;
  document.addEventListener('input', e => { if (e.target && e.target.closest && !e.target.closest('#view-cvm, .ft-mail')) { clearTimeout(tmr); tmr = setTimeout(snap, 1200); } }, true);
  document.addEventListener('change', e => { if (e.target && e.target.closest && !e.target.closest('#view-cvm, .ft-mail')) { clearTimeout(tmr); tmr = setTimeout(snap, 800); } }, true);
  if (typeof switchNavTab === 'function') {
    const _sw = switchNavTab;
    switchNavTab = function () { try { snap(); } catch (e) {} return _sw.apply(this, arguments); };
  }

  /* ---------- Correspondance champ du modèle ↔ valeur du calcul ---------- */
  function kindFor(v) {
    const t = norm(v.key + ' ' + (v.label || ''));
    if (/mois_annee|mois annee|^mois|\bmois\b/.test(t) && !/nombre|duree/.test(t)) return 'moisLbl';
    if (/date|\bdu\b|\bau\b|echeance|debut|fin|fct|naissance/.test(t)) return 'date';
    if (/montant|somme|sjr|allocation|indu|trop|brut|net|euros?|salaire|aj\b|are\b|ass\b|mensualite|remboursement|prix|cout/.test(t)) return 'montant';
    if (/jours?|duree|differe|delai|nombre|\bx\b|^x/.test(t)) return 'jours';
    return '';
  }
  const words = t => norm(t).split(/[^a-z0-9]+/).filter(w => w.length > 2 && !/^(les|des|une|par|pour|avec|date|montant)$/.test(w));
  function moisLbl(d) { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d); return m ? MOIS[+m[2] - 1] + ' ' + m[3] : ''; }
  /* Texte du modèle autour du champ : aide à choisir la bonne valeur et évite « 33,38 € € » */
  function ctx(tpl, key) {
    const b = String((tpl && (tpl.body || tpl.content)) || ''), i = b.indexOf('{{' + key + '}}');
    return i < 0 ? { before: '', after: '' } : { before: b.slice(Math.max(0, i - 60), i), after: b.slice(i + key.length + 4, i + key.length + 16) };
  }
  function bare(val, after) {
    const a = norm(after).trim();
    if (/^€/.test(a) || /^euros?\b/.test(a)) val = val.replace(/\s*€.*$/, '');
    if (/^(jours?|j)\b/.test(a)) val = val.replace(/\s*(jours?|j)(\s+calendaires)?$/i, '');
    if (/^mois\b/.test(a)) val = val.replace(/\s*mois$/i, '');
    return val.trim();
  }
  function candidates(v, S, tpl) {
    const k = kindFor(v); if (!k || !S) return [];
    const c = ctx(tpl, v.key);
    if (k === 'moisLbl') return S.vals.filter(x => x.k === 'date').map(x => ({ v: moisLbl(x.v), l: x.l })).filter((x, i, a) => x.v && a.findIndex(y => y.v === x.v) === i);
    const W = words(v.key + ' ' + (v.label || '') + ' ' + c.before.split(/[.\n]/).pop());
    const unitOk = x => k !== 'jours' || !/^mois/.test(norm(c.after).trim()) || x.k === 'mois';
    return S.vals.filter(x => (x.k === k || (k === 'jours' && x.k === 'mois')) && unitOk(x))
      .map((x, i) => ({ v: bare(k === 'montant' ? x.v.replace(/\s*(\/|par)\s*(jour|mois|j)$/i, '') : x.v, c.after), l: x.l, s: words(x.l).filter(w => W.includes(w)).length * 10 - i }))
      .sort((a, b) => b.s - a.s);
  }
  function autofill(tpl, S) {
    if (!tpl || !tpl.variables || !S) return 0;
    if (!userVariables[tpl.id]) userVariables[tpl.id] = {};
    const used = new Set(); let n = 0;
    tpl.variables.forEach(v => {
      if (clean(userVariables[tpl.id][v.key])) return;
      const c = candidates(v, S, tpl).find(x => !used.has(x.v)); if (!c) return;
      used.add(c.v); userVariables[tpl.id][v.key] = c.v; n++;
    });
    if (n) { try { saveState(); } catch (e) {} renderVariablesForm(tpl); try { updateCompiledPreview(); } catch (e) {} try { updateMailtoLink(tpl); } catch (e) {} }
    return n;
  }

  /* ---------- Dans la page Mails ---------- */
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'à l’instant' : m < 60 ? 'il y a ' + m + ' min' : 'il y a ' + Math.round(m / 60) + ' h'; };
  function enhance(tpl) {
    const grid = $('dynamic-inputs-grid'); if (!grid || !tpl) return;
    const old = $('ft-prefill'); if (old) old.remove();
    const S = get(), vars = tpl.variables || [];
    if (!S || !vars.length) return;
    const lists = vars.map(v => candidates(v, S, tpl));
    if (!lists.some(l => l.length)) return;
    const bar = document.createElement('div'); bar.id = 'ft-prefill'; bar.className = 'pf-bar';
    bar.innerHTML = '<span>⚡ Dernier calcul : <b>' + esc(S.name) + '</b> <em>' + ago(S.at) + '</em></span><button type="button" class="pf-go">Remplir les champs vides</button><button type="button" class="pf-x" aria-label="Ne plus proposer ce calcul">×</button>';
    grid.parentNode.insertBefore(bar, grid);
    bar.querySelector('.pf-go').onclick = () => { const n = autofill(tpl, S); toast(n ? n + ' champ(s) rempli(s) avec « ' + S.name + ' » : vérifiez avant d’envoyer' : 'Aucun champ vide à remplir', n ? 'success' : 'info'); };
    bar.querySelector('.pf-x').onclick = () => { try { localStorage.removeItem(KEY); } catch (e) {} bar.remove(); grid.querySelectorAll('datalist.pf-dl').forEach(d => d.remove()); };
    /* Suggestions dans chaque champ (liste au toucher) */
    const inputs = grid.querySelectorAll('input[type="text"]');
    vars.forEach((v, i) => {
      const inp = inputs[i], l = lists[i]; if (!inp || !l.length) return;
      const id = 'pf-dl-' + i; let dl = $(id);
      if (!dl) { dl = document.createElement('datalist'); dl.id = id; dl.className = 'pf-dl'; grid.appendChild(dl); }
      dl.innerHTML = l.slice(0, 8).map(x => '<option value="' + esc(x.v) + '">' + esc(x.l || '') + '</option>').join('');
      inp.setAttribute('list', id);
    });
  }
  if (typeof renderVariablesForm === 'function') {
    const _rv = renderVariablesForm;
    renderVariablesForm = function (tpl) { const r = _rv.apply(this, arguments); try { enhance(tpl); } catch (e) { console.warn(e); } return r; };
  }
  window.ftPrefill = { collect, get, candidates, autofill };
})();
