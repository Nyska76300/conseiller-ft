/* 2026-11-27.1 : réglage administrateur des champs des mails.
   Pour chaque variable ({{cle}}), l'administrateur choisit : texte libre, ou menu déroulant avec ses propres choix
   (libellé affiché + texte inséré dans le mail, choix par défaut, option « Autre » ou non).
   Le réglage est commun : il s'applique à tous les modèles qui utilisent cette variable, pour tous les conseillers. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const isAdmin = () => { try { return !!(window.__ftIsAdmin && window.__ftIsAdmin()); } catch (e) { return false; } };
  const cfgAll = () => (window.ftVarCfg ? window.ftVarCfg() : {});
  const GEAR = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>';

  function rerender() {
    try { if (window.ftCvmComputeDefaults) window.ftCvmComputeDefaults(); } catch (e) {}
    try { const t = templates.find(x => x.id === activeTemplateId); if (t) renderVariablesForm(t); } catch (e) {}
  }
  document.addEventListener('ft-varcfg', rerender);
  document.addEventListener('ft-admin', rerender);

  window.ftVarAdminGear = function (tpl, grid) {
    if (!isAdmin() || !tpl || !tpl.variables) return;
    const C = cfgAll();
    tpl.variables.forEach(v => {
      const inp = grid.querySelector('[data-key="' + CSS.escape(v.key) + '"]'); if (!inp) return;
      const box = inp.closest('#dynamic-inputs-grid > *'); if (!box || box.querySelector('.ft-vg')) return;
      const lab = box.querySelector('label');
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ft-vg' + (C[v.key] ? ' is-set' : '');
      b.title = 'Administrateur : texte libre ou menu déroulant pour « ' + (v.label || v.key) + ' »';
      b.setAttribute('aria-label', b.title);
      b.innerHTML = GEAR + (C[v.key] ? (C[v.key].mode === 'text' ? 'Texte' : 'Menu') : '');
      b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); open(v); });
      box.classList.add('ft-vg-box');
      if (lab) lab.after(b); else box.prepend(b);
    });
  };

  let st = null;
  function usage(key) { try { return templates.filter(t => (t.variables || []).some(x => x.key === key)).length; } catch (e) { return 0; } }
  function open(v) {
    const C = cfgAll(), c = C[v.key];
    const builtin = window.ftCvmBuiltinFor ? window.ftCvmBuiltinFor(v.key) : null;
    const opts = c && c.options && c.options.length ? c.options.map(o => ({ label: o.label, text: o.text || '' }))
      : builtin ? builtin.slice(0, 60).map(x => ({ label: x[1], text: x[2] === x[1] ? '' : x[2] })) : [{ label: '', text: '' }, { label: '', text: '' }];
    st = { key: v.key, label: v.label || v.key, mode: c ? c.mode : (builtin ? 'select' : 'text'), opts: opts, def: c && c.def != null ? c.def : -1, other: !(c && c.other === false), had: !!c, builtin: !!builtin };
    draw();
  }
  function draw() {
    let w = $('ft-vc');
    if (!w) {
      w = document.createElement('div'); w.id = 'ft-vc'; w.className = 'ft-vc'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'ft-vc-t');
      document.body.appendChild(w);
      w.addEventListener('click', onClick);
      w.addEventListener('input', onInput);
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) w.hidden = true; });
    }
    const n = usage(st.key), sel = st.mode === 'select';
    w.innerHTML = '<div class="ft-vc-c">' +
      '<div class="ft-vc-h"><div><h2 id="ft-vc-t">Champ « ' + esc(st.label) + ' »</h2><p><code>{{' + esc(st.key) + '}}</code> · utilisé dans ' + n + ' modèle' + (n > 1 ? 's' : '') + ' · réglage commun à tous les conseillers</p></div><button type="button" data-vc="x" aria-label="Fermer">×</button></div>' +
      '<div class="ft-vc-mode" role="radiogroup" aria-label="Type de champ">' +
      '<button type="button" role="radio" data-mode="text" aria-checked="' + !sel + '" class="' + (sel ? '' : 'on') + '"><b>Texte libre</b><small>Le conseiller écrit ce qu’il veut</small></button>' +
      '<button type="button" role="radio" data-mode="select" aria-checked="' + sel + '" class="' + (sel ? 'on' : '') + '"><b>Menu déroulant</b><small>Le conseiller choisit dans une liste</small></button></div>' +
      (sel ? '<div class="ft-vc-l"><div class="ft-vc-lh"><span>Libellé dans le menu</span><span>Texte inséré dans le mail <small>(vide = le libellé)</small></span><span>Défaut</span><span></span></div>' +
        st.opts.map((o, i) => '<div class="ft-vc-r" data-i="' + i + '"><input data-f="label" value="' + esc(o.label) + '" placeholder="ex. Définitive" aria-label="Libellé ' + (i + 1) + '"><input data-f="text" value="' + esc(o.text) + '" placeholder="ex. définitive" aria-label="Texte inséré ' + (i + 1) + '"><input type="radio" name="ft-vc-def" data-def="' + i + '"' + (st.def === i ? ' checked' : '') + ' aria-label="Choix par défaut"><button type="button" data-del="' + i + '" aria-label="Supprimer ce choix">×</button></div>').join('') +
        '<button type="button" class="ft-vc-add" data-vc="add">+ Ajouter un choix</button>' +
        '<div class="ft-vc-opt"><label><input type="checkbox" data-vc="other"' + (st.other ? ' checked' : '') + '> Garder le choix « Autre (texte libre) » en bas du menu</label>' +
        '<label><input type="radio" name="ft-vc-def" data-def="-1"' + (st.def < 0 ? ' checked' : '') + '> Aucun choix par défaut</label></div></div>' : '<p class="ft-vc-txt">Le champ restera une simple zone de saisie' + (st.builtin ? ' (le menu prévu par le site pour ce champ sera retiré)' : '') + '.</p>') +
      '<div class="ft-vc-a">' + (st.had ? '<button type="button" data-vc="reset" class="ghost">Revenir au réglage du site</button>' : '<span></span>') +
      '<div><button type="button" data-vc="x">Annuler</button><button type="button" data-vc="ok" class="pri">Enregistrer pour tous</button></div></div></div>';
    w.hidden = false;
  }
  function onInput(e) {
    const r = e.target.closest('.ft-vc-r'); if (!r || !e.target.dataset.f) return;
    st.opts[+r.dataset.i][e.target.dataset.f] = e.target.value;
  }
  function onClick(e) {
    const w = $('ft-vc'), t = e.target;
    if (t === w || t.closest('[data-vc="x"]')) { w.hidden = true; return; }
    const m = t.closest('[data-mode]'); if (m) { st.mode = m.dataset.mode; if (st.mode === 'select' && !st.opts.length) st.opts = [{ label: '', text: '' }]; draw(); return; }
    if (t.closest('[data-vc="add"]')) { st.opts.push({ label: '', text: '' }); draw(); const last = w.querySelector('.ft-vc-r:last-of-type input'); if (last) last.focus(); return; }
    const d = t.closest('[data-del]'); if (d) { const i = +d.dataset.del; st.opts.splice(i, 1); if (st.def === i) st.def = -1; else if (st.def > i) st.def--; draw(); return; }
    if (t.dataset && t.dataset.def != null && t.type === 'radio') { st.def = +t.dataset.def; return; }
    if (t.dataset && t.dataset.vc === 'other') { st.other = t.checked; return; }
    if (t.closest('[data-vc="reset"]')) { save(null); return; }
    if (t.closest('[data-vc="ok"]')) {
      if (st.mode === 'select') {
        const opts = st.opts.map(o => ({ label: String(o.label || '').trim(), text: String(o.text || '').trim() })).filter(o => o.label);
        if (!opts.length) { toast('Ajoutez au moins un choix au menu', 'error'); return; }
        const def = st.def >= 0 && st.opts[st.def] && String(st.opts[st.def].label || '').trim() ? opts.findIndex(o => o.label === String(st.opts[st.def].label).trim()) : -1;
        const c = { mode: 'select', options: opts, other: st.other }; if (def >= 0) c.def = def;
        save(c);
      } else save({ mode: 'text' });
    }
  }
  function save(c) {
    const C = cfgAll();
    if (c) C[st.key] = Object.assign(c, { at: new Date().toISOString() }); else delete C[st.key];
    try { localStorage.setItem('ft_var_cfg', JSON.stringify(C)); } catch (e) {}
    $('ft-vc').hidden = true; rerender();
    const p = window.__ftSaveVarCfg ? window.__ftSaveVarCfg(C) : Promise.reject(new Error('Connexion au compte indisponible'));
    p.then(() => toast(c ? 'Champ « ' + st.label + ' » enregistré pour tous les conseillers' : 'Champ « ' + st.label + ' » revenu au réglage du site', 'success'))
      .catch(e => toast('Enregistré sur ce poste seulement : ' + ((e && e.message) || 'erreur'), 'error'));
  }
})();
