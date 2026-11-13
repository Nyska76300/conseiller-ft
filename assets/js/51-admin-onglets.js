(function () {
  /* Espace administrateur allégé : les cartes sont rangées dans 4 onglets
     (À traiter, Statistiques, Équipe, Contenu) ; les statistiques ont leurs propres
     sous-onglets et les longues listes sont repliées (« Voir tout »). */
  const $ = id => document.getElementById(id);
  const KEY = 'ft_adm_pane', SKEY = 'ft_adm_sub';
  const PANES = [['todo', 'À traiter'], ['stats', 'Statistiques'], ['team', 'Équipe'], ['content', 'Contenu']];
  const SUBS = [['over', 'Activité'], ['mails', 'Mails'], ['tools', 'Outils'], ['users', 'Conseillers']];
  const BY_ID = { 'ad-regs': 'todo', 'ad-ideas': 'todo', 'ad-bugs': 'todo', 'ad-annonce': 'team', 'ad-push': 'team', 'ad-invites': 'team', 'ad-mfa': 'team', 'ad-users': 'stats', 'ad-faq': 'content' };
  const BY_TITLE = [[/propositions/i, 'todo'], [/statistiques cumul/i, 'stats'], [/bar[eè]me/i, 'content'], [/mod[eè]les communs/i, 'content'], [/noms renomm/i, 'content'], [/^site$/i, 'content']];
  const SUB_CARD = { 'ad-users': 'users' };
  const get = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  function titleOf(card) { const t = card.querySelector('.uppercase'); return t ? t.textContent.replace(/^[^A-Za-zÀ-ÿ]+/, '').trim() : ''; }
  function paneOf(unit, card) {
    const id = BY_ID[unit.id] ? unit.id : card.id; if (BY_ID[id]) return BY_ID[id];
    if (card.querySelector('#ad-ack')) return 'todo';
    const t = titleOf(card);
    for (const [rx, p] of BY_TITLE) if (rx.test(t)) return p;
    return 'content';
  }
  function build() {
    const body = $('ad-body'), first = $('ad-first'), usage = $('ad-usage');
    if (!body || !first || !usage) return;
    let box = $('adp');
    if (!box) {
      box = document.createElement('div'); box.id = 'adp';
      box.innerHTML = '<div class="adp-tabs" role="tablist" aria-label="Sections de l’Espace administrateur">' + PANES.map(p => '<button type="button" role="tab" data-p="' + p[0] + '" id="adp-t-' + p[0] + '" aria-controls="adp-' + p[0] + '">' + p[1] + '<b class="adp-n" hidden></b></button>').join('') + '</div>' +
        PANES.map(p => '<section class="adp-pane" role="tabpanel" id="adp-' + p[0] + '" aria-labelledby="adp-t-' + p[0] + '" data-pane-box="' + p[0] + '">' + (p[0] === 'stats' ? '<div id="adp-stats-top"></div>' : '') + '<div class="adp-grid"></div></section>').join('');
      first.parentNode.insertBefore(box, first.nextSibling);
      box.querySelector('.adp-tabs').addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (b) show(b.dataset.p, true); });
      box.querySelector('.adp-tabs').addEventListener('keydown', e => {
        if (!/^Arrow(Left|Right)$/.test(e.key)) return;
        const i = PANES.findIndex(p => p[0] === box.dataset.pane), n = PANES[(i + (e.key === 'ArrowRight' ? 1 : PANES.length - 1)) % PANES.length][0];
        show(n, true); $('adp-t-' + n).focus();
      });
      box.addEventListener('click', e => { const b = e.target.closest('.adp-more'); if (!b) return; const g = b.previousElementSibling; const open = g.classList.toggle('adp-open'); b.textContent = open ? 'Réduire' : 'Voir tout (' + g.children.length + ')'; });
    }
    /* Statistiques d’utilisation : en tête de l’onglet Statistiques */
    const top = $('adp-stats-top'); if (usage.parentNode !== top) top.appendChild(usage);
    let chips = box.querySelector('.adp-subs'); const aub = $('au-body');
    if (!chips) {
      chips = document.createElement('div'); chips.className = 'adp-subs'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', 'Statistiques');
      chips.innerHTML = SUBS.map(x => '<button type="button" data-s="' + x[0] + '">' + x[1] + '</button>').join('');
      chips.addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (b) sub(b.dataset.s); });
      if (box.dataset.sub) setTimeout(() => sub(box.dataset.sub), 0);
    }
    if (chips && aub && chips.nextElementSibling !== aub) aub.parentNode.insertBefore(chips, aub);
    /* Ranger chaque carte dans son onglet */
    body.querySelectorAll('.rounded-xl').forEach(card => {
      if (card.parentElement.closest('.rounded-xl') || card.closest('#ad-usage, #ad-todo, .adp-grid, #ft-mfa, #ft-rem')) return;
      let unit = card;
      while (unit.parentElement && unit.parentElement !== body && !/^(ad-first-a|ad-first-b)$/.test(unit.parentElement.id) && !unit.parentElement.classList.contains('space-y-4') && unit.parentElement.children.length === 1) unit = unit.parentElement;
      const p = paneOf(unit, card), grid = box.querySelector('#adp-' + p + ' .adp-grid');
      if (!grid) return;
      unit.dataset.pane = p;
      const cid = unit.id || card.id; if (SUB_CARD[cid]) unit.dataset.sub = SUB_CARD[cid];
      else if (/statistiques cumul/i.test(titleOf(card))) unit.dataset.sub = 'tools';
      grid.appendChild(unit);
    });
    /* Anciens emplacements devenus vides */
    body.querySelectorAll('.ad-first-grid, #ad-body > .max-w-7xl.grid').forEach(el => { el.classList.toggle('adp-empty', !el.querySelector('.rounded-xl')); });
    const faq = $('ad-faq') && $('ad-faq').querySelector('.rounded-xl');
    if (faq && !faq.querySelector('.adp-unfold')) {
      faq.classList.add('adp-fold');
      const b = document.createElement('button'); b.type = 'button'; b.className = 'adp-unfold ad-btn'; b.textContent = 'Modifier la FAQ';
      b.onclick = () => { const o = faq.classList.toggle('adp-fold'); b.textContent = o ? 'Modifier la FAQ' : 'Replier la FAQ'; };
      faq.firstElementChild.after(b);
    }
    tagStats(); counts();
    if (!box.dataset.pane) show(get(KEY, '') || ($('ad-todo') && $('ad-todo').querySelector('[data-go]') ? 'todo' : 'stats'));
    if (!box.dataset.sub) sub(get(SKEY, 'over'));
  }
  function tagStats() {
    const b = $('au-body'); if (!b) return;
    let cur = 'over';
    [...b.children].forEach(el => {
      if (el.classList.contains('st-kpis')) { el.dataset.sub = 'all'; return; }
      if (el.classList.contains('st-sec')) { const t = el.textContent; cur = /mails/i.test(t) ? 'mails' : /outils/i.test(t) ? 'tools' : /conseiller/i.test(t) ? 'users' : 'over'; }
      if (el.matches('p.ad-empty') && /copi/i.test(el.textContent)) { el.dataset.sub = 'mails'; return; }
      el.dataset.sub = cur;
      /* Longues grilles de tuiles : 6 visibles, le reste sur demande */
      if (el.classList.contains('st-grid') && el.id !== 'au-evo' && el.children.length > 6 && !(el.nextElementSibling && el.nextElementSibling.classList.contains('adp-more'))) {
        el.classList.add('adp-cut');
        const m = document.createElement('button'); m.type = 'button'; m.className = 'adp-more'; m.dataset.sub = cur; m.textContent = 'Voir tout (' + el.children.length + ')';
        el.after(m);
      }
    });
  }
  function counts() {
    const box = $('adp'); if (!box) return;
    const n = $('ad-todo') ? $('ad-todo').querySelectorAll('[data-go]').length : 0;
    const t = box.querySelector('#adp-t-todo .adp-n'); if (t) { t.hidden = !n; t.textContent = n; }
  }
  function show(p, user) {
    const box = $('adp'); if (!box || !PANES.some(x => x[0] === p)) return;
    box.dataset.pane = p; if (user) set(KEY, p);
    box.querySelectorAll('.adp-tabs [data-p]').forEach(b => { const on = b.dataset.p === p; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    box.querySelectorAll('.adp-pane').forEach(s => { s.hidden = s.dataset.paneBox !== p; });
  }
  function sub(s) {
    const box = $('adp'); if (!box) return;
    box.dataset.sub = s; set(SKEY, s);
    box.querySelectorAll('.adp-subs [data-s]').forEach(b => { b.classList.toggle('on', b.dataset.s === s); b.setAttribute('aria-pressed', String(b.dataset.s === s)); });
  }
  /* « À traiter » en haut : aller à la carte, en ouvrant le bon onglet */
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#ad-todo [data-go]'); if (!b) return;
    const t = $(b.dataset.go); const pane = t && t.closest('[data-pane-box]');
    if (pane) show(pane.dataset.paneBox, true);
  }, true);
  window.ftAdminPane = show;

  const _fill = window.ftAdminFill;
  window.ftAdminFill = function () { try { if (_fill) _fill.apply(this, arguments); } catch (e) { console.warn(e); } setTimeout(build, 0); };
  let t = null;
  const later = () => { clearTimeout(t); t = setTimeout(() => { if ($('ad-body') && !$('view-admin').classList.contains('hidden')) build(); }, 120); };
  if (window.ftOnDom) window.ftOnDom(later);
})();
