(function () {
  /* Deux outils côte à côte sur grand écran (≥ 1280 px) : l’outil en cours à gauche, un second outil à droite.
     Le second outil reste ouvert quand on change d’outil à gauche (sauf sur l’accueil). */
  const MIN = 1280;
  const host = () => { const v = document.getElementById('view-home'); const h = v && v.parentElement; if (h) h.classList.add('ft-split-host'); return h; };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const cur = () => { try { return String(activeNavTab); } catch (e) { return 'home'; } };
  const tabs = () => { try { return NAV_TABS_CONFIG.filter(t => !/^hub:/.test(String(t.id)) && String(t.id) !== 'home'); } catch (e) { return []; } };
  const nameOf = id => { const t = tabs().find(x => String(x.id) === String(id)); return t ? t.name : String(id); };
  const visible = () => { const h = host(); return h ? [...h.querySelectorAll(':scope > [id^="view-"]:not(.hidden):not(.ft-split-b)')] : []; };
  let partner = null; /* { tab, el } */
  let busy = false;

  function show() {
    const h = host(); if (!h) return;
    const ok = partner && innerWidth >= MIN && cur() !== 'home' && partner.tab !== cur() && document.body.contains(partner.el) && !visible().includes(partner.el);
    h.querySelectorAll(':scope > .ft-split-b').forEach(v => { if (!partner || v !== partner.el || !ok) { v.classList.remove('ft-split-b'); if (!ok || v !== (partner && partner.el)) v.classList.add('hidden'); } });
    /* la vue active ne doit jamais rester cachée par erreur */
    h.classList.toggle('ft-dual', !!ok);
    if (ok) { partner.el.classList.remove('hidden'); partner.el.classList.add('ft-split-b'); watch(partner.el); }
    bar(ok); btnState(); setTimeout(fit, 60);
  }
  /* Mises en page à colonnes trop étroites dans une moitié d’écran : on les passe en une colonne */
  function fit() {
    const h = host(); if (!h) return;
    const on = h.classList.contains('ft-dual');
    document.querySelectorAll('.ft-sp1,.ft-spcol').forEach(e => { if (!on || !e.closest('.ft-split-host.ft-dual')) e.classList.remove('ft-sp1', 'ft-spcol'); });
    if (!on) return;
    h.querySelectorAll(':scope > [id^="view-"]:not(.hidden)').forEach(v => {
      v.querySelectorAll('div,section,form,main,aside').forEach(e => {
        if (e.classList.contains('ft-sp1') || e.classList.contains('ft-spcol')) return;
        const r = e.getBoundingClientRect(); if (r.width < 120) return;
        const s = getComputedStyle(e);
        if (s.display === 'grid') {
          const t = s.gridTemplateColumns.split(' ').map(parseFloat).filter(x => !isNaN(x));
          if (t.length > 1 && Math.min(...t) < 250) e.classList.add('ft-sp1');
        } else if (s.display === 'flex' && s.flexDirection === 'row' && s.flexWrap === 'nowrap' && !e.closest('#view-cvm')) {
          const k = [...e.children].filter(x => x.getBoundingClientRect().width > 0);
          if (k.length > 1 && k.some(x => x.getBoundingClientRect().width < 170 && x.textContent.trim().length > 120)) e.classList.add('ft-spcol');
        }
      });
    });
  }
  if (window.ftOnDom) window.ftOnDom(() => { if (partner) fit(); });
  /* certains outils se cachent eux-mêmes un instant après un changement d’onglet : on garde le second outil visible */
  let mo = null, watched = null;
  function watch(el) {
    if (watched === el) return;
    if (mo) mo.disconnect();
    watched = el;
    mo = new MutationObserver(() => { if (partner && partner.el === el && el.classList.contains('hidden') && host().classList.contains('ft-dual')) el.classList.remove('hidden'); });
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
  }
  function bar(on) {
    let b = document.getElementById('ft-split-bar');
    if (!on) { if (b) b.hidden = true; return; }
    if (!b) {
      b = document.createElement('div'); b.id = 'ft-split-bar'; b.setAttribute('role', 'toolbar'); b.setAttribute('aria-label', 'Second outil');
      host().appendChild(b);
      b.addEventListener('click', e => {
        const x = e.target.closest('[data-sp]'); if (!x) return;
        if (x.dataset.sp === 'close') close();
        else if (x.dataset.sp === 'swap') swap();
        else if (x.dataset.sp === 'pick') pick();
      });
    }
    b.hidden = false;
    b.innerHTML = '<span>À droite : <b>' + esc(nameOf(partner.tab)) + '</b></span>' +
      '<button type="button" data-sp="pick" title="Choisir un autre outil">Changer</button>' +
      '<button type="button" data-sp="swap" title="Passer cet outil à gauche">⇄ Échanger</button>' +
      '<button type="button" data-sp="close" aria-label="Fermer le second outil">✕</button>';
  }

  /* Ouvre `tab` à droite : on l’affiche un instant comme outil principal pour qu’il se prépare, puis on revient. */
  function open(tab) {
    tab = String(tab);
    if (innerWidth < MIN) { toast('L’affichage côte à côte demande un écran plus large (1280 px minimum).', 'info'); return; }
    const back = cur();
    if (back === 'home') { toast('Ouvrez d’abord un outil : le second s’affichera à côté.', 'info'); return; }
    if (tab === back) { toast('Cet outil est déjà ouvert à gauche.', 'info'); return; }
    busy = true; partner = null; show();
    const before = visible();
    try { switchNavTab(isNaN(+tab) ? tab : +tab); } catch (e) {}
    /* certains outils s’affichent un instant après : on attend qu’ils soient là (au plus ~250 ms) */
    let tries = 0;
    (function wait() {
      const el = visible().find(v => !before.includes(v));
      if (!el && tries++ < 8) return setTimeout(wait, 30);
      try { switchNavTab(isNaN(+back) ? back : +back); } catch (e) {}
      busy = false;
      if (!el) { toast('Impossible d’ouvrir cet outil à côté.', 'error'); show(); return; }
      partner = { tab, el };
      try { sessionStorage.setItem('ft_split', tab); } catch (e) {}
      show(); setTimeout(show, 120);
    })();
  }
  function close() { partner = null; try { sessionStorage.removeItem('ft_split'); } catch (e) {} show(); }
  function swap() {
    if (!partner) return;
    const left = cur(), right = partner.tab;
    close();
    try { switchNavTab(isNaN(+right) ? right : +right); } catch (e) {}
    open(left);
  }

  /* Choix du second outil */
  function pick() {
    let m = document.getElementById('ft-split-pick');
    if (m) m.remove();
    m = document.createElement('div'); m.id = 'ft-split-pick'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Ouvrir un second outil à côté');
    const list = tabs().filter(t => String(t.id) !== cur());
    m.innerHTML = '<div class="sp-box"><div class="sp-h"><b>Ouvrir un second outil à droite</b><button type="button" data-x aria-label="Fermer">✕</button></div>' +
      '<input type="search" placeholder="Rechercher un outil…" aria-label="Rechercher un outil">' +
      '<div class="sp-list">' + list.map(t => '<button type="button" data-t="' + esc(t.id) + '">' + esc(t.name) + '</button>').join('') + '</div></div>';
    document.body.appendChild(m);
    const inp = m.querySelector('input'); inp.focus();
    inp.addEventListener('input', () => { const q = inp.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); m.querySelectorAll('[data-t]').forEach(b => { b.hidden = q && !b.textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q); }); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { const b = m.querySelector('[data-t]:not([hidden])'); if (b) b.click(); } });
    m.addEventListener('click', e => {
      if (e.target === m || e.target.closest('[data-x]')) { m.remove(); return; }
      const b = e.target.closest('[data-t]'); if (b) { m.remove(); open(b.dataset.t); }
    });
    m.addEventListener('keydown', e => { if (e.key === 'Escape') m.remove(); });
  }
  window.ftSplitOpen = t => (t ? open(t) : pick());
  window.ftSplitClose = close;

  /* Après chaque changement d’outil à gauche : on remet le second outil à droite */
  if (typeof switchNavTab === 'function') {
    const _s = switchNavTab;
    switchNavTab = function () {
      const r = _s.apply(this, arguments);
      if (!busy) {
        if (partner && String(arguments[0]) === partner.tab) close(); /* l’outil de droite passe à gauche */
        else show();
      }
      return r;
    };
  }
  addEventListener('resize', () => { clearTimeout(window.__ftSpT); window.__ftSpT = setTimeout(show, 150); });

  /* Lien discret à côté de « Changer d’outil » (sous le titre), sans prendre de place dans la barre du haut */
  function headerBtn() {
    if (document.getElementById('ft-split-btn')) return;
    const nm = document.getElementById('header-active-tab-name'), sw = nm && nm.closest('button'); if (!sw) return;
    const row = document.createElement('div'); row.className = 'ft-split-row';
    sw.parentNode.insertBefore(row, sw); row.appendChild(sw);
    const b = document.createElement('button');
    b.id = 'ft-split-btn'; b.type = 'button'; b.title = 'Ouvrir un second outil à côté (grand écran)';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></svg><span>À côté</span>';
    b.onclick = () => (partner ? close() : pick());
    row.appendChild(b);
  }
  function btnState() { const b = document.getElementById('ft-split-btn'); if (!b) return; b.hidden = cur() === 'home'; const s = b.querySelector('span'); if (s) s.textContent = partner ? 'Fermer à côté' : 'À côté'; }
  headerBtn(); setTimeout(headerBtn, 1500);
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Deux outils côte à côte', s: 'Ouvrir un second outil à droite (grand écran)', kw: 'côte à côte deux outils écran partagé split second outil comparer', run: () => pick() });

  /* Réouverture après rechargement de la page */
  setTimeout(() => { try { const t = sessionStorage.getItem('ft_split'); if (t && cur() !== 'home') open(t); } catch (e) {} }, 1800);
})();
