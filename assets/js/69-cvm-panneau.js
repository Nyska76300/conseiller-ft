(function () {
  /* CVM Direct (ordinateur) : la colonne de droite devient un panneau qui s'ouvre par la droite.
     La liste des modèles prend toute la largeur, en cartes avec aperçu du mail. */
  const MIN_W = 1024;
  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tab = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  /* 2026-11-26.16 : retour au volet de lecture fixe à droite (demande du conseiller) ; le panneau coulissant est désactivé. */
  const DRAWER = false;
  const on = () => DRAWER && window.innerWidth >= MIN_W;
  const panel = () => $('tab-content-cvm');
  let scrim = null;

  const getView = () => { try { return localStorage.getItem('ft_cvm_view') || 'liste'; } catch (e) { return 'liste'; } };
  function viewToggle() {
    const badge = $('filtered-count-badge'); if (!badge || $('cvm-vt')) return;
    const w = document.createElement('div'); w.id = 'cvm-vt'; w.className = 'cvm-vt'; w.setAttribute('role', 'group'); w.setAttribute('aria-label', 'Affichage des modèles');
    const ex = document.createElement('div'); ex.id = 'cvm-xtra'; ex.className = 'cvm-xtra';
    ex.innerHTML = '<button type="button" id="cvm-drafts" title="N’afficher que les modèles avec une saisie en cours"><span>Brouillons</span><b id="cvm-drafts-n">0</b></button><button type="button" id="cvm-top" title="Vos modèles les plus copiés sur cet appareil">Plus utilisés</button>';
    ex.addEventListener('click', e => {
      if (e.target.closest('#cvm-drafts')) { root.classList.toggle('cvm-only-drafts'); e.target.closest('#cvm-drafts').classList.toggle('on', root.classList.contains('cvm-only-drafts')); }
      if (e.target.closest('#cvm-top')) { e.stopPropagation(); topPop(e.target.closest('#cvm-top')); }
    });
    badge.parentNode.insertBefore(ex, badge);
    w.innerHTML = '<button type="button" data-v="liste" title="Affichage en liste"><i data-lucide="list" class="w-3.5 h-3.5"></i>Liste</button><button type="button" data-v="tuiles" title="Affichage en tuiles"><i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>Tuiles</button>';
    w.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; try { localStorage.setItem('ft_cvm_view', b.dataset.v); } catch (err) {} syncView(); });
    badge.parentNode.insertBefore(w, badge);
    try { if (window.lucide) lucide.createIcons(); } catch (e) {}
  }
  function syncView() {
    const v = getView(); root.classList.toggle('cvm-list', v !== 'tuiles');
    document.querySelectorAll('#cvm-vt [data-v]').forEach(b => { const a = b.dataset.v === v; b.classList.toggle('on', a); b.setAttribute('aria-pressed', String(a)); });
  }
  function apply() {
    root.classList.toggle('cvm-dw', on());
    viewToggle(); syncView();
    if (!on()) close(true);
    if (!scrim) {
      scrim = document.createElement('div'); scrim.id = 'cvm-scrim'; scrim.setAttribute('aria-hidden', 'true');
      scrim.addEventListener('click', () => close());
      const v = $('view-cvm'); if (v) v.appendChild(scrim);
    }
    const p = panel();
    if (p && !$('cvm-dw-x')) {
      const head = p.firstElementChild;
      const b = document.createElement('button'); b.type = 'button'; b.id = 'cvm-dw-x'; b.className = 'cvm-dw-x';
      b.setAttribute('aria-label', 'Fermer le mail (Échap)'); b.title = 'Fermer (Échap)'; b.innerHTML = '<i data-lucide="x" class="w-5 h-5"></i>';
      b.addEventListener('click', () => close());
      if (head) head.insertBefore(b, head.firstChild);
      p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Mail sélectionné');
      try { if (window.lucide) lucide.createIcons(); } catch (e) {}
    }
  }
  function open() {
    if (!on()) return;
    root.classList.add('cvm-open');
    const p = panel(); if (p) { p.scrollTop = 0; setTimeout(() => { const f = p.querySelector('input:not([type=hidden]),textarea'); try { (f || p).focus({ preventScroll: true }); } catch (e) {} }, 260); }
  }
  function close(silent) {
    if (!root.classList.contains('cvm-open')) return;
    root.classList.remove('cvm-open');
    if (!silent) { const a = document.querySelector('#templates-list [data-tpl-id].is-active-card, #templates-list .bg-blue-600\\/15'); if (a) try { a.focus({ preventScroll: true }); } catch (e) {} }
  }
  if (typeof handleVarChange === 'function') {
    const _h = handleVarChange; let dt;
    handleVarChange = function () { const r = _h.apply(this, arguments); clearTimeout(dt); dt = setTimeout(() => { try { if (!on()) drafts(); } catch (e) {} }, 250); return r; };
    window.handleVarChange = handleVarChange;
  }
  window.ftCvmPanelOpen = open; window.ftCvmPanelClose = close;

  /* Aperçu du mail et bouton Copier sur chaque carte */
  function preview(tpl) {
    const vars = {}; (tpl.variables || []).forEach(v => { vars[v.key] = v.label || v.key; });
    const body = String(tpl.body || '').slice(0, 420);
    return esc(body).replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k) => '<span class="cvm-pv-var">' + esc(vars[k] || k) + '</span>').replace(/\n+/g, ' ');
  }
  function drafts() {
    const list = $('templates-list'); if (!list) return;
    list.querySelectorAll('[data-tpl-id]').forEach(c => {
      let ud = {}; try { ud = userVariables[c.dataset.tplId] || {}; } catch (e) {}
      const d = Object.keys(ud).some(k => String(ud[k] == null ? '' : ud[k]).trim());
      c.classList.toggle('is-draft', d);
      let m = c.querySelector(':scope .cvm-dmark');
      if (d && !m) { m = document.createElement('span'); m.className = 'cvm-dmark'; m.textContent = '✎ brouillon'; const t = c.querySelector('.min-w-0 > .min-w-0 > span'); if (t) { t.parentNode.insertBefore(m, t.nextSibling); } else c.appendChild(m); }
      if (!d && m) m.remove();
      const sp = c.querySelectorAll('.min-w-0 > .min-w-0 > span'); if (sp.length > 1 && sp[0].textContent.trim() === sp[1].textContent.trim()) sp[1].classList.add('cvm-dup');
      /* Aperçu de la première ligne et nombre de champs (disposition avec volet fixe) */
      if (!c.querySelector('.cvm-li')) {
        let t = null; try { t = templates.find(x => x.id === c.dataset.tplId); } catch (e) {}
        const box = c.querySelector('.min-w-0 > .min-w-0');
        if (t && box) {
          const nV = (t.variables || []).length;
          const li = document.createElement('div'); li.className = 'cvm-li';
          li.innerHTML = '<span class="cvm-li-pv">' + preview(t) + '</span><span class="cvm-li-n' + (nV ? '' : ' is-ok') + '">' + (nV ? nV + ' champ' + (nV > 1 ? 's' : '') + ' à remplir' : 'Prêt à copier') + '</span>';
          box.appendChild(li); c.classList.add('cvm-lc');
        }
      }
    });
    const nb = $('cvm-drafts-n'); if (nb) nb.textContent = list.querySelectorAll('[data-tpl-id].is-draft').length;
  }
  function cards() {
    const list = $('templates-list'); if (!list) return;
    if (!on()) { drafts(); return; }
    let tpls = []; try { tpls = templates; } catch (e) {}
    const byId = {}; tpls.forEach(t => { byId[t.id] = t; });
    list.querySelectorAll('[data-tpl-id]').forEach(c => {
      if (c.querySelector('.cvm-pv')) return;
      const t = byId[c.dataset.tplId]; if (!t) return;
      c.classList.add('cvm-card'); c.tabIndex = 0;
      const sp = c.querySelectorAll('.min-w-0 > .min-w-0 > span'); if (sp.length > 1 && sp[0].textContent.trim() === sp[1].textContent.trim()) sp[1].classList.add('cvm-dup');
      if (/bg-blue-600\/15/.test(c.className)) c.classList.add('is-active-card');
      const nV = (t.variables || []).length;
      const pv = document.createElement('div'); pv.className = 'cvm-pv'; pv.innerHTML = preview(t);
      const ft = document.createElement('div'); ft.className = 'cvm-ft';
      ft.innerHTML = '<span class="cvm-nv">' + (nV ? nV + ' champ' + (nV > 1 ? 's' : '') + ' à remplir' : 'Prêt à copier') + '</span>' +
        (nV ? '<span class="cvm-open-l">Ouvrir ›</span>' : '<button type="button" class="cvm-copy" data-copy="' + esc(t.id) + '"><i data-lucide="copy" class="w-3.5 h-3.5"></i>Copier</button>');
      const ch = document.createElement('div'); ch.className = 'cvm-chips';
      const tags = (t.tags || []).join(' ').split(/[,;]+/).map(x => x.trim()).filter(Boolean).slice(0, 3);
      let ud = {}; try { ud = userVariables[t.id] || {}; } catch (e) {}
      const draft = Object.keys(ud).some(k => String(ud[k] == null ? '' : ud[k]).trim()); c.classList.toggle('is-draft', draft);
      ch.innerHTML = (draft ? '<span class="cvm-chip is-draft">✎ brouillon</span>' : '') + '<span class="cvm-chip is-cat">' + esc(t.category || '') + '</span>' + (nV ? '<span class="cvm-chip is-nv">' + nV + ' champ' + (nV > 1 ? 's' : '') + '</span>' : '<span class="cvm-chip is-ok">prêt à copier</span>') + tags.map(x => '<span class="cvm-chip">' + esc(x.toLowerCase()) + '</span>').join('');
      c.appendChild(pv); c.appendChild(ch); c.appendChild(ft);
    });
    const nd = list.querySelectorAll('.cvm-card.is-draft').length, nb = document.getElementById('cvm-drafts-n'); if (nb) nb.textContent = nd;
    try { if (window.lucide) lucide.createIcons(); } catch (e) {}
  }

  /* Modèles les plus copiés (compteur local) */
  const UKEY = 'ft_tpl_usage';
  const usage = () => { try { return JSON.parse(localStorage.getItem(UKEY) || '{}') || {}; } catch (e) { return {}; } };
  if (typeof copyCurrentMail === 'function') {
    const _c = copyCurrentMail;
    copyCurrentMail = function () { const r = _c.apply(this, arguments); try { const u = usage(), id = activeTemplateId; if (id) { u[id] = (u[id] || 0) + 1; localStorage.setItem(UKEY, JSON.stringify(u)); } } catch (e) {} return r; };
    window.copyCurrentMail = copyCurrentMail;
  }
  function topPop(anchor) {
    let p = $('cvm-top-pop');
    if (p && p.classList.contains('on')) { p.classList.remove('on'); return; }
    if (!p) { p = document.createElement('div'); p.id = 'cvm-top-pop'; p.className = 'cvm-top-pop'; document.body.appendChild(p);
      document.addEventListener('click', e => { if (p.classList.contains('on') && e.target.isConnected && !p.contains(e.target)) p.classList.remove('on'); });
      p.addEventListener('click', e => {
        const f = e.target.closest('[data-fav]'); if (f) { e.stopPropagation(); try { toggleFavorite(f.dataset.fav, e); } catch (err) {} setTimeout(() => topPop.fill(), 30); return; }
        const o = e.target.closest('[data-open]'); if (o) { p.classList.remove('on'); try { selectTemplate(o.dataset.open); } catch (err) {} open(); }
      });
    }
    topPop.fill = () => {
      const u = usage(); let tpls = [], fav = []; try { tpls = templates; fav = favorites; } catch (e) {}
      const top = Object.keys(u).map(id => [tpls.find(t => t.id === id), u[id]]).filter(x => x[0]).sort((a, b) => b[1] - a[1]).slice(0, 10);
      p.innerHTML = '<div class="cvm-top-h"><b>Vos modèles les plus copiés</b><small>sur cet appareil</small></div>' + (top.length ? top.map(x => '<div class="cvm-top-r"><button type="button" class="cvm-top-o" data-open="' + esc(x[0].id) + '">' + esc(x[0].title) + '</button><span class="cvm-top-n">' + x[1] + '×</span><button type="button" class="cvm-top-f' + (fav.indexOf(x[0].id) >= 0 ? ' on' : '') + '" data-fav="' + esc(x[0].id) + '" title="Favori" aria-label="Favori">★</button></div>').join('') : '<p class="cvm-top-e">Copiez quelques mails : vos modèles les plus utilisés apparaîtront ici, prêts à être mis en favoris.</p>');
    };
    topPop.fill();
    const r = anchor.getBoundingClientRect(); p.style.top = (r.bottom + 8) + 'px'; p.style.left = Math.max(8, Math.min(window.innerWidth - 380, r.left - 120)) + 'px';
    p.classList.add('on');
  }

  /* Ouverture au clic sur une carte (pas sur les boutons) */
  document.addEventListener('click', e => {
    if (!on()) return;
    const cp = e.target.closest && e.target.closest('.cvm-copy');
    if (cp) {
      e.stopPropagation(); e.preventDefault();
      try { selectTemplate(cp.dataset.copy); copyCurrentMail(); } catch (err) {}
      return;
    }
    const c = e.target.closest && e.target.closest('#templates-list [data-tpl-id]');
    if (!c || e.target.closest('button')) return;
    setTimeout(open, 0);
  }, true);
  document.addEventListener('keydown', e => {
    if (!on() || tab() !== 'cvm') return;
    if (e.key === 'Escape' && root.classList.contains('cvm-open')) {
      const openModal = document.querySelector('[id$="-modal"]:not(.hidden)'); if (openModal) return;
      e.preventDefault(); close(); return;
    }
    if (e.key === 'Enter' && !root.classList.contains('cvm-open')) {
      const c = document.activeElement && document.activeElement.closest && document.activeElement.closest('#templates-list [data-tpl-id]');
      if (c) { e.preventDefault(); c.click(); }
    }
  });

  if (typeof renderTemplatesList === 'function') {
    const _r = renderTemplatesList;
    renderTemplatesList = function () { const r = _r.apply(this, arguments); try { cards(); } catch (e) {} return r; };
    window.renderTemplatesList = renderTemplatesList;
  }
  const _sw = switchNavTab;
  switchNavTab = function () { const r = _sw.apply(this, arguments); if (tab() !== 'cvm') close(true); else setTimeout(() => { apply(); cards(); }, 60); return r; };
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { apply(); try { renderTemplatesList(); } catch (e) {} }, 150); });
  /* ouvrir le panneau quand un autre outil envoie vers un modèle (Rédiger le mail CVM, liens vers un modèle) */
  ['ftSimToMail', 'ftGoTpl'].forEach(n => {
    const f = window[n]; if (typeof f !== 'function') return;
    window[n] = function () { const r = f.apply(this, arguments); setTimeout(open, 350); return r; };
  });
  apply(); setTimeout(() => { apply(); try { renderTemplatesList(); } catch (e) { cards(); } }, 600);
})();
