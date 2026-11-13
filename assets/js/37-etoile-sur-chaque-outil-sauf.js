(function () {
  const $ = id => document.getElementById(id);
  const STAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>';
  const get = () => { try { const v = JSON.parse(localStorage.getItem('ft_menu_favs') || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const set = a => { const v = JSON.stringify(a); if (window.safeLS && safeLS.setItem) safeLS.setItem('ft_menu_favs', v); else try { localStorage.setItem('ft_menu_favs', v); } catch (e) {} };
  const idOf = b => { if (b.closest('#ft-adm-sec')) return 'admin'; const m = /switchNavTab\('([^']+)'\)/.exec(b.getAttribute('onclick') || ''); return m ? m[1] : null; };
  function sync() {
    const list = $('burger-tabs-list'); if (!list) return;
    const pins = get(), isAdm = !!(window.__ftIsAdmin && window.__ftIsAdmin());
    /* étoile sur chaque outil (sauf Accueil et CVM, déjà en tête) */
    const btns = [...list.querySelectorAll('button[onclick^="switchNavTab"], #ft-adm-sec button')].filter(b => !b.closest('#mh-favs'));
    btns.forEach(b => {
      const id = idOf(b); if (!id || id === 'home' || id === 'cvm') return;
      let st = b.querySelector(':scope > .mh-st');
      if (!st) { st = document.createElement('span'); st.className = 'mh-st'; st.setAttribute('role', 'button'); st.innerHTML = STAR; b.appendChild(st); }
      const on = pins.includes(id);
      if (st.classList.contains('on') !== on) st.classList.toggle('on', on);
      const t = on ? 'Retirer des favoris du menu (il reprend sa place)' : 'Ajouter aux favoris du menu (il passe en haut, sous CVM Direct)';
      if (st.title !== t) { st.title = t; st.setAttribute('aria-label', t); }
      if (st.dataset.id !== id) st.dataset.id = id;
      /* un favori quitte sa place d’origine */
      const el = b.parentNode && b.parentNode.classList && b.parentNode.classList.contains('ft-pen-wrap') ? b.parentNode : b;
      const hide = on && (id !== 'admin' || isAdm);
      if (el.classList.contains('mh-moved') !== hide) el.classList.toggle('mh-moved', hide);
    });
    list.querySelectorAll('.menu-sec, #ft-adm-sec').forEach(sec => {
      const items = [...sec.querySelectorAll('button[onclick^="switchNavTab"], #ft-adm-sec button')];
      const empty = items.length > 0 && items.every(b => (b.closest('.mh-moved')));
      if (sec.classList.contains('mh-empty') !== empty) sec.classList.toggle('mh-empty', empty);
    });
    /* bloc « Mes favoris » juste sous CVM Direct */
    let act = ''; try { act = String(activeNavTab); } catch (e) {}
    const favs = pins.filter(id => id !== 'admin' || isAdm).map(id => ({ id, src: btns.find(b => idOf(b) === id) })).filter(x => x.src);
    let box = $('mh-favs');
    const sig = favs.map(x => x.id).join(',') + '|' + act + '|' + favs.map(x => (x.src.querySelector('.text-xs') || {}).textContent).join(',');
    if (!favs.length) { if (box) box.remove(); return; }
    if (!box || box.dataset.sig !== sig) {
      if (!box) { box = document.createElement('div'); box.id = 'mh-favs'; }
      box.dataset.sig = sig;
      box.innerHTML = '<div class="mh-fh">' + STAR + 'Favoris du menu</div><div class="space-y-1.5"></div>';
      const inner = box.lastChild;
      favs.forEach(x => {
        const c = x.src.cloneNode(true); c.removeAttribute('id');
        if (x.id === 'admin') c.setAttribute('onclick', "switchNavTab('admin')");
        c.querySelectorAll('.ft-pen').forEach(p => p.remove()); c.classList.remove('mh-moved'); c.style.display = '';
        inner.appendChild(c);
      });
    }
    /* position : après CVM Direct */
    const cvm = [...list.children].find(el => el !== box && (el.matches('button[onclick="switchNavTab(\'cvm\')"]') || (el.querySelector && el.querySelector(':scope > button[onclick="switchNavTab(\'cvm\')"]'))));
    const ref = cvm ? cvm.nextSibling : list.firstChild;
    if (box.parentNode !== list || (cvm && box.previousSibling !== cvm)) list.insertBefore(box, ref);
  }
  document.addEventListener('click', e => {
    const st = e.target.closest && e.target.closest('#burger-tabs-list .mh-st'); if (!st) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    const id = st.dataset.id, p = get(), i = p.indexOf(id);
    if (i < 0) p.push(id); else p.splice(i, 1);
    set(p); sync();
    try { showToast(i < 0 ? 'Ajouté aux favoris du menu' : 'Retiré des favoris du menu', 'success'); } catch (er) {}
  }, true);
  window.addEventListener('storage', e => { if (e.key === 'ft_menu_favs') sync(); });
  document.addEventListener('ft-admin', () => setTimeout(sync, 60));
  if (window.ftOnDom) window.ftOnDom(sync);
  setTimeout(sync, 400);
})();
