(function () {
  /* Post-it virtuel dans la barre du haut : une note libre, gardée sur cet appareil uniquement. */
  const KEY = 'ft_postit';
  const $ = id => document.getElementById(id);
  const get = () => { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } };
  const set = v => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} };
  const ICO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/><path d="M7 13h6M7 17h4"/></svg>';

  function mount() {
    if ($('ft-pi-btn')) return;
    const anchor = $('rp-btn'); if (!anchor) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'ft-pi-btn'; b.className = 'ft-pi-btn';
    b.title = 'Post-it : une note rapide, gardée sur cet appareil'; b.setAttribute('aria-label', 'Post-it'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = ICO + '<span class="ft-pi-dot" aria-hidden="true"></span>';
    anchor.parentNode.insertBefore(b, anchor);
    const pop = document.createElement('div'); pop.id = 'ft-pi'; pop.className = 'ft-pi'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Post-it');
    pop.innerHTML = '<div class="ft-pi-tape" aria-hidden="true"></div><div class="ft-pi-h"><b>Post-it</b><span id="ft-pi-st"></span><button type="button" class="ft-pi-x" aria-label="Fermer">×</button></div>' +
      '<textarea id="ft-pi-ta" rows="8" placeholder="Une idée, un rappel, un numéro de poste…" spellcheck="true"></textarea>' +
      '<div class="ft-pi-f"><span>Gardé sur cet appareil. Évitez les données personnelles d’allocataires.</span><button type="button" id="ft-pi-clr">Effacer</button></div>';
    document.body.appendChild(pop);
    const ta = $('ft-pi-ta'); ta.value = get(); sync();
    let t; ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { set(ta.value.trim() ? ta.value : ''); sync(); $('ft-pi-st').textContent = 'Enregistré'; setTimeout(() => { $('ft-pi-st').textContent = ''; }, 1200); }, 250); });
    b.addEventListener('click', e => { e.stopPropagation(); toggle(); });
    pop.querySelector('.ft-pi-x').addEventListener('click', () => toggle(false));
    $('ft-pi-clr').addEventListener('click', () => { if (!ta.value || confirm('Effacer le post-it ?')) { ta.value = ''; set(''); sync(); ta.focus(); } });
    document.addEventListener('click', e => { if (pop.classList.contains('on') && !pop.contains(e.target) && e.target !== b) toggle(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && pop.classList.contains('on')) toggle(false); });
    window.addEventListener('storage', e => { if (e.key === KEY) { ta.value = get(); sync(); } });
  }
  function sync() { const b = $('ft-pi-btn'); if (b) b.classList.toggle('has-note', !!get().trim()); }
  function toggle(force) {
    const pop = $('ft-pi'), b = $('ft-pi-btn'); if (!pop || !b) return;
    const on = typeof force === 'boolean' ? force : !pop.classList.contains('on');
    if (on) { const r = b.getBoundingClientRect(); pop.style.top = (r.bottom + 10) + 'px'; pop.style.left = Math.max(10, Math.min(window.innerWidth - 330, r.left + r.width / 2 - 160)) + 'px'; }
    pop.classList.toggle('on', on); b.setAttribute('aria-expanded', String(on)); b.classList.toggle('is-open', on);
    if (on) setTimeout(() => { const ta = $('ft-pi-ta'); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 60);
  }
  window.ftPostIt = toggle;
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Post-it', s: 'Note rapide gardée sur cet appareil', kw: 'post it postit note memo rappel pense bete', run: () => toggle(true) });
  mount(); setTimeout(mount, 800); setTimeout(mount, 2500);
})();
