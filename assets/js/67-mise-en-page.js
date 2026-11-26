(function () {
  /* Mise en page inspirée de MEAD (sans toucher à l'en-tête) :
     1. menu latéral fixe sur grand écran (le bouton « Menu » le replie / déplie) ;
     2. accueil : tuiles de chiffres et bandeau des chiffres clés du barème ;
     3. cartes d'outils avec sous-titre et badge « Nouveau » ;
     4. raccourci « / » pour la recherche ;
     5. pied de page : sources et date de vérification de la réglementation. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const root = document.documentElement;
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const eur = (x, d) => Number(x).toLocaleString('fr-FR', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }) + ' €';

  /* ---------- 1. Menu latéral fixe ---------- */
  const DOCK_MIN = 1280;
  const curTab = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  /* CVM Direct a déjà sa propre colonne : sous 1600 px, le menu y redevient escamotable */
  const wide = () => window.innerWidth >= DOCK_MIN && !(curTab() === 'cvm' && window.innerWidth < 1600);
  function dockApply() {
    const on = wide();
    root.classList.toggle('ft-dock', on);
    root.classList.toggle('ft-dock-min', on && lsGet('ft_dock', '1') === '0');
    if (on) { const bd = $('burger-backdrop'); if (bd) bd.classList.add('hidden'); }
    sideExtras();
  }
  if (typeof toggleBurgerMenu === 'function') {
    const _tb = toggleBurgerMenu;
    toggleBurgerMenu = function (f) {
      if (wide()) {
        if (typeof f === 'boolean') return;           /* les fermetures automatiques ne replient pas le menu fixe */
        lsSet('ft_dock', root.classList.contains('ft-dock-min') ? '1' : '0');
        dockApply(); return;
      }
      return _tb.apply(this, arguments);
    };
    window.toggleBurgerMenu = toggleBurgerMenu;
  }
  function sideExtras() {
    const list = $('burger-tabs-list'); if (!list) return;
    /* nombre d'outils par rubrique */
    list.querySelectorAll('.menu-sec').forEach(s => {
      const h = s.querySelector('.menu-sec-h'); if (!h) return;
      const n = s.querySelectorAll('button[onclick^="switchNavTab"]').length;
      if (h.dataset.n !== String(n)) h.dataset.n = String(n);
    });
    /* bouton de thème en bas du menu */
    const dr = $('burger-nav-drawer');
    if (dr && !$('ms-theme') && typeof toggleTheme === 'function') {
      const b = document.createElement('button'); b.type = 'button'; b.id = 'ms-theme'; b.className = 'ms-theme';
      b.addEventListener('click', () => { toggleTheme(); setTimeout(themeLabel, 50); });
      dr.appendChild(b);
    }
    themeLabel();
  }
  function themeLabel() {
    const b = $('ms-theme'); if (!b) return;
    const light = root.classList.contains('theme-light');
    const t = light ? '🌙 Mode sombre' : '☀️ Mode clair';
    if (b.textContent !== t) b.textContent = t;
  }
  if (typeof renderBurgerTabs === 'function') {
    const _rb = renderBurgerTabs;
    renderBurgerTabs = function () { const r = _rb.apply(this, arguments); try { sideExtras(); } catch (e) {} return r; };
  }
  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(dockApply, 120); });

  /* ---------- 2. Accueil : tuiles et bandeau des chiffres clés ---------- */
  function homeExtras() {
    const hero = document.querySelector('#view-home .fh-C > .home-hero') || document.querySelector('#view-home .home-hero'); if (!hero) return;
    if ($('fh-kpis')) { kpiRefresh(); return; }
    let B = null; try { B = BAREME; } catch (e) {}
    let nTools = 0, nTpl = 0; try { nTools = NAV_TABS_CONFIG.filter(t => t.id !== 'home').length; } catch (e) {} try { nTpl = templates.length; } catch (e) {}
    const tiles = [[nTools, 'outils'], [nTpl, 'modèles de mails'], [B && B.verifie || '—', 'barème vérifié le'], [B && B.are && B.are.effet || '—', 'revalorisation ARE du']];
    const k = document.createElement('div'); k.id = 'fh-kpis'; k.className = 'fh-kpis';
    k.innerHTML = tiles.map((t, i) => '<div class="fh-kpi"><strong data-i="' + i + '">' + esc(t[0]) + '</strong><span>' + esc(t[1]) + '</span></div>').join('');
    hero.appendChild(k); kpiRefresh();
    if (!B) return;
    const a = B.are || {}, d = B.degr || {}, s = B.solidarite || {}, c = B.cumul || {};
    const items = [
      ['Allocation minimale', a.min != null ? eur(a.min) + ' / jour' : ''],
      ['Partie fixe', a.partieFixe != null ? eur(a.partieFixe) + ' / jour' : ''],
      ['Allocation maximale', a.max != null ? eur(a.max) + ' / jour' : ''],
      ['AREF minimale', a.formation != null ? eur(a.formation) + ' / jour' : ''],
      ['Dégressivité', d.coef != null ? '−' + Math.round((1 - d.coef) * 100) + ' % dès le ' + d.moisDebut + 'ᵉ mois (moins de ' + d.ageLimite + ' ans)' : ''],
      ['Plancher dégressivité', d.seuil != null ? eur(d.seuil) + ' / jour' : ''],
      ['Cumul emploi', c.remun != null ? Math.round(c.remun * 100) + ' % du brut déduit' : ''],
      ['Mensualisation', c.base ? c.base + ' jours par mois' : ''],
      ['ASS', s.ass != null ? eur(s.ass) + ' / jour' : ''],
      ['ATA', s.ata != null ? eur(s.ata) + ' / jour' : '']
    ].filter(x => x[1]);
    const one = items.map(x => '<span class="fh-tk-i"><b>' + esc(x[0]) + '</b> ' + esc(x[1]) + '</span>').join('<span class="fh-tk-s" aria-hidden="true">•</span>');
    const t = document.createElement('div'); t.id = 'fh-ticker'; t.className = 'fh-ticker'; t.setAttribute('role', 'region'); t.setAttribute('aria-label', 'Chiffres clés du barème');
    t.innerHTML = '<span class="fh-tk-l">Chiffres clés</span><div class="fh-tk-w"><div class="fh-tk-r">' + one + '<span class="fh-tk-s" aria-hidden="true">•</span><span aria-hidden="true">' + one + '</span></div></div>';
    hero.appendChild(t);
  }

  function kpiRefresh() {
    let nT = 0, nM = 0; try { nT = NAV_TABS_CONFIG.filter(t => t.id !== 'home').length; } catch (e) {} try { nM = (window.templates || templates || []).length; } catch (e) {}
    [[0, nT], [1, nM]].forEach(x => { const el = document.querySelector('#fh-kpis [data-i="' + x[0] + '"]'); if (el && x[1] && el.textContent !== String(x[1])) el.textContent = String(x[1]); });
  }

  /* ---------- 3. Cartes d'outils : sous-titre et badge ---------- */
  function chips() {
    const cfg = {}; try { NAV_TABS_CONFIG.forEach(t => { cfg[String(t.id)] = t; }); } catch (e) {}
    document.querySelectorAll('#view-home .fh-chip').forEach(b => {
      if (b.querySelector('.fh-cs')) return;
      const m = /switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || ''); const t = m && cfg[m[1]];
      const sub = b.getAttribute('title') || (t && t.desc) || ''; if (!sub) return;
      const lb = b.querySelector('.fh-cl'); if (!lb) return;
      const w = document.createElement('span'); w.className = 'fh-ct';
      lb.parentNode.insertBefore(w, lb); w.appendChild(lb);
      const s = document.createElement('span'); s.className = 'fh-cs'; s.textContent = sub; w.appendChild(s);
      if (t && t.badge && /nouveau/i.test(t.badge)) { const g = document.createElement('span'); g.className = 'fh-new'; g.textContent = t.badge; lb.appendChild(g); }
    });
  }

  /* ---------- 4. Raccourci « / » ---------- */
  document.addEventListener('keydown', e => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const a = document.activeElement; if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
    const hs = document.querySelector('#view-home:not(.hidden) .home-hero input') || $('ft-header-search');
    if (hs) { e.preventDefault(); hs.focus(); }
  });

  /* ---------- 5. Pied de page ---------- */
  function footer() {
    if ($('ft-foot')) return;
    const host = document.querySelector('body > .ft-split-host'); if (!host) return;
    let B = null; try { B = BAREME; } catch (e) {}
    let v = ''; try { v = (document.querySelector('script[src*="06-coeur"]').src.match(/v=([\d.-]+)/) || [])[1] || ''; } catch (e) {}
    const f = document.createElement('footer'); f.id = 'ft-foot'; f.className = 'ft-foot';
    f.innerHTML = '<span>Sources : <a href="https://www.unedic.org" target="_blank" rel="noopener noreferrer">Unédic</a> · <a href="https://www.francetravail.fr" target="_blank" rel="noopener noreferrer">France Travail</a> · <a href="https://www.service-public.gouv.fr" target="_blank" rel="noopener noreferrer">Service-public</a></span>' +
      '<span>Réglementation vérifiée le ' + esc(B && B.verifie || '—') + ' · <b>⚠️ Indicatif</b> : la décision notifiée fait foi</span>' + (v ? '<span class="ft-foot-v">Version ' + esc(v) + '</span>' : '');
    host.insertAdjacentElement('afterend', f);
  }

  function all() { try { dockApply(); } catch (e) {} try { homeExtras(); chips(); } catch (e) {} try { footer(); } catch (e) {} }
  const _sw = switchNavTab;
  switchNavTab = function () { const r = _sw.apply(this, arguments); try { dockApply(); } catch (e) {} setTimeout(() => { try { homeExtras(); chips(); themeLabel(); } catch (e) {} }, 80); return r; };
  /* l'accueil se redessine parfois (favoris, nouveautés) : on complète les cartes sans boucle */
  let mo = null, pend = false;
  function watch() {
    const h = $('view-home'); if (!h || mo) return;
    mo = new MutationObserver(rs => { if (pend || !rs.some(r => !(r.target.closest && r.target.closest('.home-hero, #fh-ticker, #fh-kpis')))) return; pend = true; requestAnimationFrame(() => { pend = false; try { homeExtras(); chips(); } catch (e) {} }); });
    mo.observe(h, { childList: true, subtree: true });
  }
  all(); setTimeout(() => { all(); watch(); }, 700); setTimeout(all, 2000);
})();
