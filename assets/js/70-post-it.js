(function () {
  /* Post-it virtuels dans la barre du haut : plusieurs notes, gardées sur cet appareil uniquement.
     Copier ou envoyer une note par mail. */
  const KEY = 'ft_postits', OLD = 'ft_postit', MAX = 6;
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function load() {
    let a = null; try { a = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    if (!Array.isArray(a) || !a.length) { let o = ''; try { o = localStorage.getItem(OLD) || ''; } catch (e) {} a = [{ t: o }]; }
    return a.slice(0, MAX);
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(notes)); localStorage.removeItem(OLD); } catch (e) {} };
  let notes = load(), cur = 0;
  const ICO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/><path d="M7 13h6M7 17h4"/></svg>';
  const title = n => { const l = (n.t || '').trim().split('\n')[0]; return l ? l.slice(0, 40) : 'Note vide'; };

  function mount() {
    if ($('ft-pi-btn')) return;
    const anchor = $('rp-btn'); if (!anchor) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'ft-pi-btn'; b.className = 'ft-pi-btn';
    b.title = 'Post-it : notes rapides, gardées sur cet appareil'; b.setAttribute('aria-label', 'Post-it'); b.setAttribute('aria-expanded', 'false');
    b.innerHTML = ICO + '<span class="ft-pi-dot" aria-hidden="true"></span>';
    anchor.parentNode.insertBefore(b, anchor);
    const pop = document.createElement('div'); pop.id = 'ft-pi'; pop.className = 'ft-pi'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Post-it');
    pop.innerHTML = '<div class="ft-pi-tape" aria-hidden="true"></div><div class="ft-pi-h"><b>Post-it</b><span id="ft-pi-st"></span><button type="button" class="ft-pi-x" aria-label="Fermer">×</button></div>' +
      '<div class="ft-pi-tabs" id="ft-pi-tabs" role="tablist" aria-label="Notes"></div>' +
      '<textarea id="ft-pi-ta" rows="8" placeholder="Une idée, un rappel, un numéro de poste…" spellcheck="true"></textarea>' +
      '<div class="ft-pi-act"><button type="button" data-a="copy">Copier</button><button type="button" data-a="mail">Envoyer par mail</button><button type="button" data-a="del">Effacer</button></div>' +
      '<div class="ft-pi-f">Gardé sur cet appareil. Évitez les données personnelles d’allocataires.</div>';
    document.body.appendChild(pop);
    const ta = $('ft-pi-ta');
    let t; ta.addEventListener('input', () => { notes[cur].t = ta.value; clearTimeout(t); t = setTimeout(() => { save(); sync(); tabs(); $('ft-pi-st').textContent = 'Enregistré'; setTimeout(() => { $('ft-pi-st').textContent = ''; }, 1200); }, 250); });
    b.addEventListener('click', e => { e.stopPropagation(); toggle(); });
    pop.querySelector('.ft-pi-x').addEventListener('click', () => toggle(false));
    $('ft-pi-tabs').addEventListener('click', e => {
      const x = e.target.closest('[data-i]'); if (x) { cur = +x.dataset.i; show(); return; }
      if (e.target.closest('[data-new]') && notes.length < MAX) { notes.push({ t: '' }); cur = notes.length - 1; save(); show(); }
    });
    pop.querySelector('.ft-pi-act').addEventListener('click', e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      const txt = notes[cur].t || '';
      if (a.dataset.a === 'copy') { if (!txt.trim()) return; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => { try { showToast('Note copiée', 'success'); } catch (er) {} }).catch(() => { ta.select(); try { document.execCommand('copy'); } catch (er) {} }); }
      if (a.dataset.a === 'mail') { if (!txt.trim()) return; location.href = 'mailto:?subject=' + encodeURIComponent('Note : ' + title(notes[cur])) + '&body=' + encodeURIComponent(txt); }
      if (a.dataset.a === 'del') {
        if (txt.trim() && !confirm('Effacer cette note ?')) return;
        if (notes.length > 1) { notes.splice(cur, 1); cur = Math.max(0, cur - 1); } else notes[0].t = '';
        save(); sync(); show();
      }
    });
    document.addEventListener('click', e => { if (pop.classList.contains('on') && e.target.isConnected && !pop.contains(e.target) && !b.contains(e.target)) toggle(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && pop.classList.contains('on')) toggle(false); });
    window.addEventListener('storage', e => { if (e.key === KEY) { notes = load(); cur = Math.min(cur, notes.length - 1); show(); sync(); } });
    sync();
  }
  function tabs() {
    const box = $('ft-pi-tabs'); if (!box) return;
    box.innerHTML = notes.map((n, i) => '<button type="button" role="tab" data-i="' + i + '" aria-selected="' + (i === cur) + '" class="' + (i === cur ? 'on' : '') + (n.t && n.t.trim() ? ' has' : '') + '" title="' + esc(title(n)) + '">' + (i + 1) + '</button>').join('') +
      (notes.length < MAX ? '<button type="button" data-new="1" title="Nouvelle note" aria-label="Nouvelle note">+</button>' : '');
  }
  function show() { const ta = $('ft-pi-ta'); if (!ta) return; ta.value = notes[cur].t || ''; tabs(); ta.focus(); }
  function sync() { const b = $('ft-pi-btn'); if (b) b.classList.toggle('has-note', notes.some(n => (n.t || '').trim())); }
  function toggle(force) {
    const pop = $('ft-pi'), b = $('ft-pi-btn'); if (!pop || !b) return;
    const on = typeof force === 'boolean' ? force : !pop.classList.contains('on');
    if (on) { const r = b.getBoundingClientRect(); pop.style.top = (r.bottom + 10) + 'px'; pop.style.left = Math.max(10, Math.min(window.innerWidth - 340, r.left + r.width / 2 - 165)) + 'px'; }
    if (on) document.querySelectorAll('.cvm-top-pop.on,.ft-tools-pop.on,.ft-pi.on').forEach(x => { if (x !== pop) x.classList.remove('on'); });
    pop.classList.toggle('on', on); b.setAttribute('aria-expanded', String(on)); b.classList.toggle('is-open', on);
    if (on) setTimeout(() => { show(); const ta = $('ft-pi-ta'); ta.setSelectionRange(ta.value.length, ta.value.length); }, 60);
  }
  window.ftPostIt = toggle;
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Post-it', s: 'Notes rapides gardées sur cet appareil', kw: 'post it postit note memo rappel pense bete', run: () => toggle(true) });
  mount(); setTimeout(mount, 800); setTimeout(mount, 2500);
})();
