/* 2026-11-26.19 : CVM Direct, confort d'usage.
   - Filtres rapides : Tous, Prêts à copier, À remplir, Brouillons.
   - Flèches ↑ ↓ pour passer d'un modèle à l'autre (hors champ de saisie).
   - Bouton Sauvegarde (export / import des modèles).
   - Catégories vides signalées, avec suppression en un clic.
   - Contrôle avant publication d'un modèle commun (titre en double, catégorie non officielle).
   - Formule de fin ajoutée automatiquement aux mails copiés (réglable). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const inCvm = () => { try { return String(activeNavTab) === 'cvm'; } catch (e) { return false; } };
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  /* ---------- Filtres rapides ---------- */
  const FILTERS = [['all', 'Tous'], ['ready', 'Prêts à copier'], ['fill', 'À remplir'], ['drafts', 'Brouillons']];
  let cur = 'all';
  function setFilter(f) {
    cur = f;
    root.classList.toggle('cvm-f-ready', f === 'ready');
    root.classList.toggle('cvm-f-fill', f === 'fill');
    root.classList.toggle('cvm-only-drafts', f === 'drafts');
    const d = $('cvm-drafts'); if (d) d.classList.toggle('on', f === 'drafts');
    document.querySelectorAll('#cvm-qf [data-f]').forEach(b => { const on = b.dataset.f === f; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
    counts();
  }
  function counts() {
    const L = $('templates-list'); if (!L) return;
    const wx = root.classList.contains('cvm-weak-on') ? '' : ':not(.is-weak)', Q = x => L.querySelectorAll('[data-tpl-id]' + x + wx).length;
    const n = { all: Q(''), ready: Q('.is-ready'), fill: Q('.is-fill'), drafts: Q('.is-draft') };
    document.querySelectorAll('#cvm-qf [data-f]').forEach(b => { const s = b.querySelector('b'); if (s) s.textContent = n[b.dataset.f]; });
    let e = $('cvm-qf-empty');
    const vis = [...L.querySelectorAll('[data-tpl-id]')].some(c => c.offsetParent);
    if (cur !== 'all' && n.all && !vis) {
      if (!e) { e = document.createElement('p'); e.id = 'cvm-qf-empty'; e.className = 'cvm-qf-empty'; L.appendChild(e); }
      e.textContent = cur === 'drafts' ? 'Aucun brouillon : aucun mail n’a de saisie en cours.' : 'Aucun modèle dans ce filtre.';
    } else if (e) e.remove();
  }
  function quickBar() {
    const xt = $('cvm-xtra'); if (!xt) return;
    if (!$('cvm-bk')) {
      const b = document.createElement('button'); b.type = 'button'; b.id = 'cvm-bk'; b.title = 'Sauvegarder ou restaurer vos modèles (fichier)';
      b.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Sauvegarde';
      b.addEventListener('click', () => { const d = $('data-btn'); if (d) d.click(); else if (typeof ftExportData === 'function') ftExportData(); });
      xt.appendChild(b);
    }
    if ($('cvm-qf')) return;
    const row = xt.parentNode; if (!row) return;
    const q = document.createElement('div'); q.id = 'cvm-qf'; q.className = 'cvm-qf'; q.setAttribute('role', 'group'); q.setAttribute('aria-label', 'Filtrer les modèles');
    q.innerHTML = FILTERS.map(f => '<button type="button" data-f="' + f[0] + '" aria-pressed="false">' + f[1] + ' <b>0</b></button>').join('');
    q.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) setFilter(b.dataset.f === cur && b.dataset.f !== 'all' ? 'all' : b.dataset.f); });
    row.after(q);
    setFilter(cur);
  }
  /* le bouton Brouillons de la barre devient un raccourci du filtre */
  document.addEventListener('click', e => {
    const d = e.target.closest && e.target.closest('#cvm-drafts'); if (!d) return;
    e.stopImmediatePropagation(); e.preventDefault(); setFilter(cur === 'drafts' ? 'all' : 'drafts');
  }, true);

  /* ---------- Catégories vides ---------- */
  const IGN = 'ft_cat_empty_ignore';
  const ignored = () => { try { return JSON.parse(localStorage.getItem(IGN) || '[]') || []; } catch (e) { return []; } };
  function emptyCats() {
    const nav = $('left-nav-menu'); if (!nav) return;
    let list = []; try { list = categoryList.map(c => c && (c.name || c)).filter(Boolean); } catch (e) { return; }
    const used = new Set(); try { templates.forEach(t => used.add(t.category)); } catch (e) {}
    const ig = ignored(), empty = list.filter(n => !used.has(n) && ig.indexOf(n) < 0);
    let b = $('cvm-emptycat');
    if (!empty.length) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'cvm-emptycat'; b.className = 'cvm-emptycat'; const scroller = nav.querySelector('.overflow-y-auto') || nav; scroller.insertBefore(b, scroller.firstChild); }
    b.innerHTML = '<b>' + (empty.length > 1 ? empty.length + ' catégories vides' : 'Catégorie vide') + '</b>' +
      empty.slice(0, 4).map(n => '<div class="cvm-ec-r"><span title="' + esc(n) + '">' + esc(n) + '</span><button type="button" data-del="' + esc(n) + '">Supprimer</button><button type="button" data-ign="' + esc(n) + '" title="Garder cette catégorie">Garder</button></div>').join('');
  }
  document.addEventListener('click', e => {
    const d = e.target.closest && e.target.closest('#cvm-emptycat [data-del]');
    if (d) { try { promptDeleteCategory(d.dataset.del, e); } catch (er) {} return; }
    const g = e.target.closest && e.target.closest('#cvm-emptycat [data-ign]');
    if (g) { const ig = ignored(); ig.push(g.dataset.ign); try { localStorage.setItem(IGN, JSON.stringify(ig)); } catch (er) {} emptyCats(); }
  });

  /* ---------- Flèches ↑ ↓ ---------- */
  document.addEventListener('keydown', e => {
    if (!inCvm() || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const a = document.activeElement || {};
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName || '') || a.isContentEditable) return;
    if (document.querySelector('[id$="-modal"]:not(.hidden), #ft-prefs:not([hidden]), #burger-nav-drawer.open, .cvm-top-pop.on, .ft-pi.on, .ft-tools-pop.on')) return;
    const cards = [...document.querySelectorAll('#templates-list [data-tpl-id]')].filter(c => c.offsetParent);
    if (!cards.length) return;
    e.preventDefault();
    let i = cards.findIndex(c => c.dataset.tplId === activeTemplateId);
    i = i < 0 ? 0 : Math.max(0, Math.min(cards.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
    const id = cards[i].dataset.tplId;
    try { selectTemplate(id); } catch (er) {}
    const el = document.querySelector('#templates-list [data-tpl-id="' + CSS.escape(id) + '"]'); if (el) el.scrollIntoView({ block: 'nearest' });
  });

  /* ---------- Contrôle avant publication ---------- */
  if (typeof window.ftSharePublish === 'function') {
    const _p = window.ftSharePublish;
    window.ftSharePublish = function () {
      let t = null; try { t = templates.find(x => x.id === activeTemplateId); } catch (e) {}
      if (t) {
        const pb = [];
        const dup = templates.filter(x => x.id !== t.id && (x.shared || x.isOfficial) && norm(x.title) === norm(t.title));
        if (dup.length) pb.push('• Un modèle commun ou officiel porte déjà ce titre : « ' + dup[0].title + ' ».');
        let off = true; try { off = DEFAULT_CATEGORIES.some(c => c.name === t.category); } catch (e) {}
        if (!off) pb.push('• La catégorie « ' + (t.category || 'sans catégorie') + ' » n’est pas une catégorie officielle : les autres conseillers la verront apparaître.');
        if (/\{\{\s*\}\}|\{\{[^}]*$|\}\}\s*\}/.test(t.body || '')) pb.push('• Le texte contient une accolade mal fermée.');
        if (pb.length && !confirm('Avant de publier pour tous les conseillers :\n\n' + pb.join('\n') + '\n\nPublier quand même ?')) return;
      }
      return _p.apply(this, arguments);
    };
  }

  /* ---------- Formule de fin ---------- */
  const SK = 'ft_signoff';
  const SDEF = { on: false, text: 'Je reste à votre disposition pour tout complément d’information.\n\nCordialement,' };
  const sget = () => { try { return Object.assign({}, SDEF, JSON.parse((window.safeLS || localStorage).getItem(SK) || '{}')); } catch (e) { return Object.assign({}, SDEF); } };
  const sset = v => { try { (typeof safeLS !== 'undefined' ? safeLS : localStorage).setItem(SK, JSON.stringify(v)); } catch (e) {} };
  window.ftSignoffGet = sget;
  function addSignoff(txt) {
    const so = sget(), f = String(so.text || '').trim();
    if (!so.on || !f) return txt;
    if (norm(txt).indexOf(norm(f)) >= 0) return txt;
    return String(txt).replace(/\s+$/, '') + '\n\n' + f;
  }
  window.ftAddSignoff = addSignoff;
  if (typeof copyCurrentMail === 'function') {
    const _c = copyCurrentMail;
    copyCurrentMail = function () {
      const orig = copyToClipboard;
      copyToClipboard = function (t) { return orig.call(this, addSignoff(t)); };
      try { return _c.apply(this, arguments); } finally { copyToClipboard = orig; setTimeout(() => { try { renderCategoryPills(); } catch (e) {} }, 50); }
    };
    window.copyCurrentMail = copyCurrentMail;
  }
  function soNote() {
    const pb = $('preview-body'); if (!pb) return;
    let n = $('cvm-so-note'); const so = sget();
    if (!so.on || !String(so.text || '').trim()) { if (n) n.remove(); return; }
    if (!n) { n = document.createElement('button'); n.type = 'button'; n.id = 'cvm-so-note'; n.className = 'cvm-so-note'; n.addEventListener('click', () => window.ftSignoff()); pb.after(n); }
    n.textContent = '+ Formule de fin ajoutée à la copie : « ' + String(so.text).trim().split('\n')[0].slice(0, 60) + (String(so.text).trim().length > 60 ? '…' : '') + ' » (modifier)';
  }
  window.ftSignoff = function () {
    let w = $('cvm-so');
    if (!w) {
      w = document.createElement('div'); w.id = 'cvm-so'; w.className = 'cvm-so'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'cvm-so-t');
      document.body.appendChild(w);
      w.addEventListener('click', e => {
        if (e.target === w || e.target.closest('[data-so="x"]')) { w.hidden = true; return; }
        if (e.target.closest('[data-so="ok"]')) {
          sset({ on: $('cvm-so-on').checked, text: $('cvm-so-ta').value });
          w.hidden = true; soNote(); toast($('cvm-so-on').checked ? 'Formule de fin ajoutée aux mails copiés' : 'Formule de fin désactivée', 'success');
        }
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) w.hidden = true; });
    }
    const so = sget();
    w.innerHTML = '<div class="cvm-so-c"><div class="cvm-so-h"><h2 id="cvm-so-t">Formule de fin des mails</h2><button type="button" data-so="x" aria-label="Fermer">×</button></div>' +
      '<p>Ajoutée automatiquement à la fin de chaque mail copié depuis CVM Direct, sauf si le mail la contient déjà.</p>' +
      '<label class="cvm-so-sw"><input type="checkbox" id="cvm-so-on"' + (so.on ? ' checked' : '') + '> Ajouter la formule aux mails copiés</label>' +
      '<textarea id="cvm-so-ta" rows="4">' + esc(so.text) + '</textarea>' +
      '<div class="cvm-so-a"><button type="button" data-so="x">Annuler</button><button type="button" data-so="ok" class="pri">Enregistrer</button></div></div>';
    w.hidden = false; setTimeout(() => { const t = $('cvm-so-ta'); if (t) t.focus(); }, 30);
  };
  (window.FT_ACTIONS = window.FT_ACTIONS || []).push({ t: 'Formule de fin des mails', s: 'Ajoutée à chaque mail copié', kw: 'formule politesse fin mail signature cordialement', run: () => window.ftSignoff() });

  /* ---------- Recherche : résultats faibles repliés ---------- */
  let lastQ = '';
  function weak() {
    const L = $('templates-list'); if (!L) return;
    const old = $('cvm-weak-t'); if (old) old.remove();
    L.querySelectorAll('.is-weak').forEach(c => c.classList.remove('is-weak'));
    let q = ''; try { q = String(searchQuery || '').trim(); } catch (e) {}
    if (q !== lastQ) { lastQ = q; root.classList.remove('cvm-weak-on'); }
    const W = window.__ftWeak; if (!q || !W || !W.size) return;
    const cards = [...L.querySelectorAll('[data-tpl-id]')];
    const strong = cards.filter(c => !W.has(c.dataset.tplId)), wk = cards.filter(c => W.has(c.dataset.tplId));
    if (!strong.length || !wk.length) return;
    wk.forEach(c => c.classList.add('is-weak'));
    const b = document.createElement('button'); b.type = 'button'; b.id = 'cvm-weak-t'; b.className = 'cvm-weak-t';
    const on = root.classList.contains('cvm-weak-on');
    b.innerHTML = (on ? 'Masquer' : 'Afficher') + ' ' + wk.length + ' autre' + (wk.length > 1 ? 's' : '') + ' résultat' + (wk.length > 1 ? 's' : '') + ' <small>mot trouvé seulement dans le texte, les mots-clés ou en début de mot</small>';
    b.addEventListener('click', () => { root.classList.toggle('cvm-weak-on'); weak(); counts(); });
    wk[0].before(b);
    const cb = $('filtered-count-badge'); if (cb) cb.textContent = strong.length + ' résultat' + (strong.length > 1 ? 's' : '') + (on ? ' + ' + wk.length : '');
  }

  /* ---------- Branchements ---------- */
  function after() { try { weak(); quickBar(); counts(); emptyCats(); soNote(); } catch (e) { console.warn(e); } }
  if (typeof renderTemplatesList === 'function') {
    const _r = renderTemplatesList;
    renderTemplatesList = function () { const r = _r.apply(this, arguments); setTimeout(after, 0); return r; };
    window.renderTemplatesList = renderTemplatesList;
  }
  if (typeof updateCompiledPreview === 'function') {
    const _u = updateCompiledPreview;
    updateCompiledPreview = function () { const r = _u.apply(this, arguments); try { soNote(); } catch (e) {} return r; };
    window.updateCompiledPreview = updateCompiledPreview;
  }
  if (typeof handleVarChange === 'function') {
    const _h = handleVarChange; let t;
    handleVarChange = function () { const r = _h.apply(this, arguments); clearTimeout(t); t = setTimeout(counts, 300); return r; };
    window.handleVarChange = handleVarChange;
  }
  if (typeof switchNavTab === 'function') {
    const _s = switchNavTab;
    switchNavTab = function () { const r = _s.apply(this, arguments); if (inCvm()) setTimeout(after, 120); return r; };
    window.switchNavTab = switchNavTab;
  }
  setTimeout(after, 900);
})();
