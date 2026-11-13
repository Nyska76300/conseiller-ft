(function () {
  /* Icônes personnalisées des outils et des rubriques (choisies par l’administrateur pour tout le monde).
     Le crayon du menu ouvre maintenant une fenêtre « Nom et icône ». */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const icons = () => jget('ft_icons', {}) || {};
  const labels = () => jget('ft_labels', {}) || {};

  /* Liste proposée (mots-clés en français pour la recherche) ; les variantes de nom couvrent les versions de Lucide */
  const LIST = [
    ['clipboard-check', 'dossier ouverture droits'], ['briefcase', 'travail emploi ans'], ['file-text', 'document fiche'], ['calculator', 'calcul simulateur'],
    ['calendar', 'date'], ['calendar-clock', 'échéance délai'], ['clock', 'durée heure'], ['hourglass', 'fin de droits délai'], ['timer', 'délai attente'],
    ['shield', 'protection situation'], ['shield-check', 'droits validé'], ['scale', 'juridique droit balance'], ['gavel', 'sanction radiation'],
    ['book-open', 'fiche référence règle'], ['graduation-cap', 'formation quiz'], ['school', 'formation école'], ['users', 'équipe conseillers'],
    ['user', 'personne usager'], ['user-check', 'validation inscription'], ['user-x', 'radiation'], ['user-minus', 'démission départ'], ['user-plus', 'inscription nouveau'],
    ['heart-pulse', 'santé invalidité maladie'], ['accessibility', 'handicap invalidité'], ['baby', 'naissance parent'], ['house', 'logement maison home'],
    ['building-2', 'entreprise employeur'], ['store', 'commerce boutique'], ['hammer', 'artisan travaux'], ['tractor', 'agricole saisonnier'],
    ['plane', 'étranger frontalier voyage'], ['globe', 'international europe'], ['map-pin', 'lieu agence'], ['euro', 'argent montant euro'],
    ['wallet', 'paiement allocation'], ['piggy-bank', 'épargne'], ['banknote', 'salaire billet'], ['coins', 'cumul pièces'], ['receipt', 'trop-perçu facture indu'],
    ['trending-up', 'reprise hausse'], ['trending-down', 'baisse dégressivité'], ['percent', 'taux pourcentage'], ['chart-bar|bar-chart-3', 'statistiques'],
    ['chart-pie|pie-chart', 'répartition'], ['handshake', 'rupture conventionnelle accord'], ['door-open', 'départ sortie'], ['log-out', 'sortie fin'],
    ['refresh-cw', 'reprise recharge'], ['repeat', 'renouvellement'], ['rotate-ccw', 'retour'], ['triangle-alert|alert-triangle', 'alerte attention'],
    ['info', 'information'], ['circle-help|help-circle', 'question faq aide'], ['lightbulb', 'idée astuce'], ['star', 'favori'], ['flag', 'repère'],
    ['bookmark', 'marque'], ['mail', 'mail courrier'], ['send', 'envoi'], ['message-square', 'message'], ['phone', 'appel téléphone'], ['bell', 'notification alerte'],
    ['search', 'recherche'], ['folder', 'dossier'], ['archive', 'archive'], ['list-checks', 'liste contrôle'], ['clipboard-list', 'checklist'],
    ['file-search', 'vérification contrôle'], ['badge-check', 'conforme validé'], ['target', 'objectif'], ['compass', 'orientation projet'], ['rocket', 'création entreprise'],
    ['sprout', 'projet démarrage'], ['palette', 'artiste'], ['drama|theater', 'spectacle intermittent'], ['music', 'musique intermittent'], ['hard-hat|construction', 'chantier btp'],
    ['truck', 'transport'], ['stethoscope', 'médical'], ['landmark', 'administration état'], ['infinity', 'sans limite'], ['sun', 'été saison'], ['umbrella', 'assurance'],
    ['life-buoy', 'aide secours'], ['signpost', 'parcours orientation'], ['route', 'parcours étapes'], ['key-round|key', 'accès'], ['lock', 'sécurité'], ['zap', 'rapide']
  ];
  const pascal = n => n.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  const L = () => window.lucide && window.lucide.icons ? window.lucide : null;
  const get = n => { const l = L(); return l ? (l.icons[pascal(n)] || l.icons[n] || null) : null; };
  const resolve = spec => { for (const n of String(spec).split('|')) if (get(n)) return n; return null; };
  function svg(name, cls) {
    const l = L(); if (!l || !name) return null;
    const node = get(name); if (!node) return null;
    let el = null;
    if (typeof node === 'string') { el = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ['viewBox', '0 0 24 24', 'fill', 'none', 'stroke', 'currentColor', 'stroke-width', '2', 'stroke-linecap', 'round', 'stroke-linejoin', 'round'].forEach((v, i, a) => { if (i % 2 === 0) el.setAttribute(v, a[i + 1]); }); el.innerHTML = node; }
    else { try { el = l.createElement ? l.createElement(node) : null; } catch (e) { el = null; } }
    if (!el && typeof node !== 'string') {
      const kids = Array.isArray(node[2]) ? node[2] : node;
      el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      ['viewBox', '0 0 24 24', 'fill', 'none', 'stroke', 'currentColor', 'stroke-width', '2', 'stroke-linecap', 'round', 'stroke-linejoin', 'round'].forEach((v, i, a) => { if (i % 2 === 0) el.setAttribute(v, a[i + 1]); });
      kids.forEach(k => { if (!Array.isArray(k)) return; const c = document.createElementNS('http://www.w3.org/2000/svg', k[0]); Object.entries(k[1] || {}).forEach(([a, v]) => c.setAttribute(a, v)); el.appendChild(c); });
    }
    el.setAttribute('aria-hidden', 'true'); if (cls) el.setAttribute('class', cls); el.dataset.ftic = name;
    return el;
  }
  function swap(old, name) {
    if (!old || old.dataset.ftic === name) return;
    const n = svg(name, old.getAttribute('class') || ''); if (n) old.replaceWith(n);
  }
  /* Clé d’une rubrique : son nom d’origine (même si elle a été renommée) */
  function rubKey(shown) {
    const t = String(shown || '').trim(), Lb = labels();
    const k = Object.keys(Lb).find(x => x.indexOf('r:') === 0 && Lb[x] === t);
    return 'r:' + (k ? k.slice(2) : t);
  }

  function apply() {
    if (!L()) return;
    const I = icons();
    Object.entries(I).forEach(([k, name]) => {
      if (k.indexOf('t:') !== 0) return;
      const id = k.slice(2);
      document.querySelectorAll('button[onclick="switchNavTab(\'' + id + '\')"]').forEach(b => {
        const s = b.querySelector('.fh-ci svg') || [...b.querySelectorAll('svg')].find(x => !x.matches('.fh-ca, .ft-star svg, .ft-pen svg'));
        swap(s, name);
      });
      document.querySelectorAll('#view-home .fh-pins .fh-pin[data-id="' + CSS.escape(id) + '"] .fh-ci svg').forEach(s => swap(s, name));
    });
    document.querySelectorAll('#view-home .fh-grp .fh-gh').forEach(h => {
      const t = h.querySelector('h3'), n = t && I[rubKey(t.textContent)]; if (n) swap(h.querySelector('.fh-gi svg'), n);
    });
    document.querySelectorAll('#burger-tabs-list .menu-sec-h').forEach(h => {
      const lb = h.querySelector('.ft-sec-lbl') || h, key = 'r:' + (h.dataset.lbOrig || lb.textContent.trim()), n = I[key] || I[rubKey(lb.textContent)];
      let ic = h.querySelector('.ft-sec-ic');
      if (!n) { if (ic) ic.remove(); return; }
      if (!ic) { ic = document.createElement('span'); ic.className = 'ft-sec-ic'; h.insertBefore(ic, h.firstChild); }
      if (!ic.firstChild || ic.firstChild.dataset.ftic !== n) { ic.textContent = ''; const s = svg(n); if (s) ic.appendChild(s); }
    });
  }
  if (window.ftOnDom) window.ftOnDom(apply);
  document.addEventListener('ft-icons', apply);
  setTimeout(apply, 800);

  /* ---------- Fenêtre « Nom et icône » (administrateur) ---------- */
  let ctx = null;
  function open(key, orig, cur, curIcon) {
    ctx = { key, orig, icon: icons()[key] || '' };
    let w = $('ft-icp');
    if (!w) {
      w = document.createElement('div'); w.id = 'ft-icp'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'icp-t');
      document.body.appendChild(w);
      w.addEventListener('click', onClick); w.addEventListener('input', e => { if (e.target.id === 'icp-q') grid(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !w.hidden) w.hidden = true; });
    }
    const rub = key.charAt(0) === 'r';
    w.innerHTML = '<div class="icp-card"><div class="icp-h"><h2 id="icp-t">' + (rub ? 'Rubrique' : 'Outil') + ' : nom et icône</h2><button type="button" class="pm-x" data-ic="x" aria-label="Fermer">×</button></div>' +
      '<label for="icp-n">Nom affiché <small>(vide = « ' + esc(orig) + ' »)</small></label><input id="icp-n" class="ad-in" maxlength="60" value="' + esc(cur === orig ? '' : cur) + '" placeholder="' + esc(orig) + '">' +
      '<label for="icp-q">Icône</label><div class="icp-row"><span class="icp-cur" id="icp-cur"></span><input id="icp-q" class="ad-in" placeholder="Rechercher : formation, euro, alerte… (ou nom anglais)"></div>' +
      (L() ? '<div class="icp-grid" id="icp-g" role="listbox" aria-label="Icônes"></div>' : '<p class="ad-empty">Les icônes ne sont pas disponibles hors connexion : réessayez une fois en ligne.</p>') +
      '<p class="ad-empty">S’applique pour tous les conseillers, dans le menu, l’accueil et les favoris.</p>' +
      '<div class="icp-foot"><button type="button" class="ad-btn" data-ic="reset">Icône d’origine</button><button type="button" class="ad-btn pri" data-ic="save">Enregistrer</button></div></div>';
    w.hidden = false; grid(); cur_();
    setTimeout(() => { const n = $('icp-n'); if (n) n.focus(); }, 30);
  }
  function cur_() { const c = $('icp-cur'); if (!c) return; c.textContent = ''; const s = ctx.icon && svg(ctx.icon); if (s) c.appendChild(s); else c.textContent = 'origine'; }
  function grid() {
    const g = $('icp-g'); if (!g) return;
    const q = (($('icp-q') || {}).value || '').trim().toLowerCase();
    let names = LIST.filter(([n, kw]) => !q || kw.includes(q) || n.includes(q)).map(([n]) => resolve(n)).filter(Boolean);
    if (q.length >= 3 && L()) {
      const extra = Object.keys(L().icons).map(p => /[A-Z]/.test(p) ? p.replace(/[A-Z]/g, (m, i) => (i ? '-' : '') + m.toLowerCase()).replace(/(\d+)/g, '-$1').replace(/--/g, '-') : p).filter(n => n.includes(q) && !names.includes(n)).slice(0, 60);
      names = names.concat(extra.filter(n => get(n)));
    }
    g.innerHTML = names.length ? '' : '<p class="ad-empty">Aucune icône trouvée.</p>';
    names.slice(0, 120).forEach(n => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.ic = 'pick'; b.dataset.n = n; b.title = n; b.setAttribute('role', 'option'); b.setAttribute('aria-selected', String(ctx.icon === n));
      if (ctx.icon === n) b.className = 'on';
      const s = svg(n); if (s) b.appendChild(s); g.appendChild(b);
    });
  }
  function onClick(e) {
    const w = $('ft-icp');
    if (e.target === w) { w.hidden = true; return; }
    const b = e.target.closest('[data-ic]'); if (!b) return;
    const a = b.dataset.ic;
    if (a === 'x') { w.hidden = true; return; }
    if (a === 'pick') { ctx.icon = b.dataset.n; w.querySelectorAll('#icp-g button').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', String(on)); }); cur_(); return; }
    if (a === 'reset') { ctx.icon = ''; cur_(); grid(); return; }
    if (a === 'save') save();
  }
  function save() {
    const w = $('ft-icp'); const name = (($('icp-n') || {}).value || '').trim();
    const Lb = labels(); const oldLabel = Lb[ctx.key] || '';
    if (!name || name === ctx.orig) delete Lb[ctx.key]; else Lb[ctx.key] = name;
    const I = icons(); const oldIcon = I[ctx.key] || '';
    /* L’icône d’une rubrique est rangée sous son nom d’origine */
    if (ctx.icon) I[ctx.key] = ctx.icon; else delete I[ctx.key];
    const jobs = [];
    if ((Lb[ctx.key] || '') !== oldLabel) {
      localStorage.setItem('ft_labels', JSON.stringify(Lb)); if (window.ftApplyLabels) window.ftApplyLabels();
      if (window.__ftSaveLabels) jobs.push(window.__ftSaveLabels(Lb));
    }
    if ((I[ctx.key] || '') !== oldIcon) {
      localStorage.setItem('ft_icons', JSON.stringify(I));
      document.querySelectorAll('svg[data-ftic]').forEach(s => { delete s.dataset.ftic; });
      if (window.__ftSaveShared) jobs.push(window.__ftSaveShared('__ft_icons', { icons: I }));
      if (!ctx.icon) setTimeout(() => { try { renderBurgerTabs(); if (window.ftApplyLabels) window.ftApplyLabels(); } catch (e) {} }, 0);
    }
    w.hidden = true;
    setTimeout(apply, 50);
    if (!jobs.length) return;
    Promise.all(jobs).then(() => toast('Enregistré pour tous les conseillers', 'success')).catch(er => toast('Enregistrement en ligne impossible : ' + (er && er.message || er), 'error'));
  }
  /* Le crayon du menu (administrateur) ouvre cette fenêtre au lieu de la simple saisie du nom */
  document.addEventListener('click', e => {
    const p = e.target.closest && e.target.closest('#burger-tabs-list .ft-pen'); if (!p || !isAdmin()) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const key = p.dataset.pen;
    if (key.charAt(0) === 'r') { const orig = key.slice(2), h = p.closest('.menu-sec-h'); const cur = h ? (h.querySelector('.ft-sec-lbl') || h).textContent.trim() : orig; open(key, orig, cur); }
    else { const b = p.parentNode.querySelector('button[onclick]'), sp = b && b.querySelector('.text-xs'); const orig = (sp && sp.dataset.lbOrig) || (sp ? sp.textContent.trim() : ''); open(key, orig, sp ? sp.textContent.trim() : orig); }
  }, true);
  window.ftIconPicker = open;
})();
