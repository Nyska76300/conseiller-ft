(function () {
  /* Menu : champ de filtre en haut, rubriques repliables (repliées par défaut, sauf celle de l'outil ouvert). */
  const $ = id => document.getElementById(id);
  const KEY = 'ft_menu_open';
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const getOpen = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const setOpen = a => { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} };
  const secId = s => s.dataset.hub || (s.querySelector('.menu-sec-h') || {}).textContent || '';
  let q = '';

  function ensureFilter() {
    const list = $('burger-tabs-list'); if (!list || $('ft-menu-q')) return;
    const w = document.createElement('div'); w.className = 'ft-menu-q';
    w.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg><input id="ft-menu-q" type="search" placeholder="Filtrer les outils…" aria-label="Filtrer les outils du menu" autocomplete="off">';
    list.parentNode.insertBefore(w, list);
    const inp = $('ft-menu-q');
    inp.addEventListener('input', () => { q = norm(inp.value.trim()); apply(); });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const b = [...list.querySelectorAll('button[onclick^="switchNavTab"]')].find(x => !x.classList.contains('ft-mq-hide') && x.offsetParent); if (b) { e.preventDefault(); b.click(); } }
      if (e.key === 'Escape' && inp.value) { e.stopPropagation(); inp.value = ''; q = ''; apply(); }
    });
  }
  function apply() {
    const list = $('burger-tabs-list'); if (!list) return;
    let cur = ''; try { cur = String(activeNavTab); } catch (e) {}
    const open = getOpen();
    let any = 0;
    list.querySelectorAll('button[onclick^="switchNavTab"]').forEach(b => {
      const ok = !q || norm(b.textContent).indexOf(q) >= 0;
      b.classList.toggle('ft-mq-hide', !ok); if (ok) any++;
    });
    list.querySelectorAll('.menu-sec').forEach(s => {
      const h = s.querySelector('.menu-sec-h'); if (!h) return;
      if (!h.dataset.fold) {
        h.dataset.fold = '1'; h.setAttribute('role', 'button'); h.tabIndex = 0;
        const tog = () => { const id = secId(s), o = getOpen(), i = o.indexOf(id); if (s.classList.contains('is-folded')) { if (i < 0) o.push(id); } else if (i >= 0) o.splice(i, 1); setOpen(o); apply(); };
        h.addEventListener('click', tog);
        h.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog(); } });
      }
      const hasCur = !!s.querySelector('button[onclick="switchNavTab(\'' + cur + '\')"]');
      const visible = [...s.querySelectorAll('button[onclick^="switchNavTab"]')].some(b => !b.classList.contains('ft-mq-hide'));
      s.classList.toggle('ft-mq-hide', !!q && !visible);
      const folded = q ? false : !(hasCur || open.indexOf(secId(s)) >= 0);
      s.classList.toggle('is-folded', folded);
      h.setAttribute('aria-expanded', String(!folded));
    });
    list.querySelectorAll(':scope > .menu-sec-h').forEach(h => h.classList.toggle('ft-mq-hide', !!q));
    let empty = $('ft-menu-empty');
    if (q && !any) { if (!empty) { empty = document.createElement('p'); empty.id = 'ft-menu-empty'; empty.className = 'ft-menu-empty'; list.appendChild(empty); } empty.textContent = 'Aucun outil ne correspond. Essayez la recherche (Ctrl+K).'; }
    else if (empty) empty.remove();
  }
  if (typeof renderBurgerTabs === 'function') {
    const _r = renderBurgerTabs;
    renderBurgerTabs = function () { const r = _r.apply(this, arguments); try { ensureFilter(); apply(); } catch (e) {} return r; };
  }
  if (typeof toggleBurgerMenu === 'function') {
    const _t = toggleBurgerMenu;
    toggleBurgerMenu = function () { const r = _t.apply(this, arguments); try { const i = $('ft-menu-q'); if (i && typeof isBurgerMenuOpen !== 'undefined' && isBurgerMenuOpen && window.innerWidth > 900) setTimeout(() => i.focus({ preventScroll: true }), 120); if (i && i.value && !(typeof isBurgerMenuOpen !== 'undefined' && isBurgerMenuOpen)) { i.value = ''; q = ''; apply(); } } catch (e) {} return r; };
    window.toggleBurgerMenu = toggleBurgerMenu;
  }
  try { renderBurgerTabs(); } catch (e) {}
  setTimeout(() => { ensureFilter(); apply(); }, 700);
})();
/* Intros des outils : une ligne, un clic pour lire la suite */
document.addEventListener('click', e => { const p = e.target.closest && e.target.closest('.reg-head p'); if (p && !e.target.closest('a,button')) p.classList.toggle('is-full'); });
document.addEventListener('mouseover', e => { const p = e.target.closest && e.target.closest('.reg-head p'); if (p && !p.title && p.scrollHeight > p.clientHeight + 2) p.title = p.textContent.trim(); });
