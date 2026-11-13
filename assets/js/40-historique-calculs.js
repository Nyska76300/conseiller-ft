(function () {
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const KEY = 'ft_calc_hist', MAX = 10;
  const SKIP = ['home', 'cvm', 'admin', 'faq', 'glossaire', 'sources', 'jour', 'schemas', 'bareme', 'echeances'];
  const get = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  const set = a => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, MAX))); } catch (e) {} };
  const OK_TYPES = /^(number|date|month|range|checkbox|radio)$/;
  function fieldsOf(view) {
    const out = {}, labels = []; let changed = false;
    view.querySelectorAll('input[id], select[id]').forEach(el => {
      if (el.closest('.ft-mail, .hub-bar, #ft-ip, .lk-form')) return;
      if (el.tagName === 'INPUT' && !OK_TYPES.test(el.type)) return;
      if (el.type === 'checkbox' || el.type === 'radio') { out[el.id] = el.checked; if (el.checked !== el.defaultChecked) changed = true; return; }
      if (el.tagName === 'SELECT') { out[el.id] = el.value; const d = [...el.options].findIndex(o => o.defaultSelected); if (el.selectedIndex !== (d < 0 ? 0 : d)) changed = true; return; }
      out[el.id] = el.value;
      if (el.value !== '' && el.value !== el.defaultValue) {
        changed = true;
        if (labels.length < 3) {
          let lb = el.labels && el.labels[0];
          for (let p = el.parentElement, n = 0; !lb && p && n < 4; p = p.parentElement, n++) lb = p.querySelector('label');
          let t = (lb ? lb.textContent : (/^[\d\s.,]*$/.test(el.placeholder || '') ? '' : el.placeholder || '')).replace(/\s*\(.*?\)\s*/g, ' ').replace(/[*:]/g, '').replace(/\s+/g, ' ').trim();
          if (t.length > 28) t = t.slice(0, 27) + '…';
          const v = el.type === 'date' ? new Date(el.value + 'T12:00').toLocaleDateString('fr-FR') : (+el.value).toLocaleString('fr-FR');
          labels.push((t ? t + ' ' : '') + v);
        }
      }
    });
    return changed ? { fields: out, summary: labels.join(' · ') } : null;
  }
  function snapshot() {
    let tab = ''; try { tab = String(activeNavTab); } catch (e) { return; }
    if (!tab || SKIP.includes(tab)) return;
    const view = document.querySelector('[id^="view-"]:not(.hidden):not(.ft-split-b)'); if (!view) return;
    const f = fieldsOf(view); if (!f) return;
    const name = (($('header-active-tab-name') || {}).textContent || tab).split('·').pop().trim();
    const L = get(), sig = tab + '|' + JSON.stringify(f.fields);
    const i = L.findIndex(x => x.sig === sig);
    if (i > -1) L.splice(i, 1);
    const prevSame = L.length && L[0].tab === tab && Date.now() - L[0].at < 10 * 60 * 1000;
    if (prevSame) L.shift(); /* même outil il y a peu : on garde la version la plus récente */
    L.unshift({ tab, name, at: Date.now(), fields: f.fields, summary: f.summary, sig });
    set(L); render();
  }
  function restore(i) {
    const e = get()[i]; if (!e) return;
    switchNavTab(/^\d+$/.test(e.tab) ? +e.tab : e.tab);
    const apply = pass => {
      Object.keys(e.fields).forEach(id => {
        const el = $(id); if (!el) return;
        const v = e.fields[id];
        if (pass === 0 && el.tagName !== 'SELECT' && el.type !== 'checkbox' && el.type !== 'radio') return;
        if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked !== v) { el.checked = v; el.dispatchEvent(new Event('change', { bubbles: true })); } }
        else if (el.value !== v) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    };
    setTimeout(() => { apply(0); setTimeout(() => { apply(1); try { showToast('Calcul repris : ' + e.name, 'success'); } catch (er) {} }, 150); }, 250);
  }
  const ago = t => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return 'à l’instant'; if (m < 60) return 'il y a ' + m + ' min'; const h = Math.round(m / 60); if (h < 24) return 'il y a ' + h + ' h'; const d = new Date(t); return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };
  const ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>';
  function html() {
    const L = get();
    return '<section class="fh-card fh-hist" aria-label="Derniers calculs"><div class="fh-dh"><span class="fh-dico">' + ICO + '</span><h2>Derniers calculs</h2></div>' +
      (L.length ? '<div class="hc-list">' + L.slice(0, 6).map((e, i) => '<div class="hc-row"><div class="hc-t"><span class="hc-n">' + esc(e.name) + '</span><span class="hc-s">' + esc(ago(e.at)) + (e.summary ? ' · ' + esc(e.summary) : '') + '</span></div><button type="button" data-hc="go" data-i="' + i + '">Reprendre</button><button type="button" class="hc-x" data-hc="del" data-i="' + i + '" aria-label="Retirer ce calcul" title="Retirer">×</button></div>').join('') + '</div>' +
        '<div class="hc-foot"><span>Sur ce poste uniquement, sans nom d’allocataire.</span><button type="button" data-hc="clear">Tout effacer</button></div>'
        : '<p class="hc-empty">Les simulations que vous faites apparaîtront ici pour être reprises en un clic (sur ce poste uniquement).</p>') + '</section>';
  }
  function render() {
    /* « Derniers calculs » n’est plus affiché sur l’accueil (l’historique reste accessible par la recherche) */
    document.querySelectorAll('#view-home .fh-hist').forEach(x => x.remove()); return;
    /* Juste sous « Mes favoris » (sinon dans la colonne de droite) */
    const pins = document.querySelector('#view-home .fh-pins'), L = document.querySelector('#view-home .fh-L');
    if (!pins && !L) return;
    let cur = document.querySelector('#view-home .fh-hist');
    const h = html();
    /* on compare au dernier contenu dessiné (pas à outerHTML, que d’autres scripts enrichissent : sinon boucle sans fin) */
    if (cur && cur._h !== h) { const t = document.createElement('div'); t.innerHTML = h; cur.replaceWith(t.firstChild); cur = document.querySelector('#view-home .fh-hist'); cur._h = h; }
    if (!cur) { const t = document.createElement('div'); t.innerHTML = h; cur = t.firstChild; cur._h = h; }
    if (pins) { const rem = document.getElementById('ft-rem-home'); const after = rem && rem.previousElementSibling === pins ? rem : pins; if (after.nextElementSibling !== cur) after.after(cur); }
    else if (cur.parentNode !== L) L.appendChild(cur);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-hc]'); if (!b) return;
    const a = b.dataset.hc, i = +b.dataset.i;
    if (a === 'go') restore(i);
    else if (a === 'del') { const L = get(); L.splice(i, 1); set(L); render(); }
    else if (a === 'clear') { if (confirm('Effacer l’historique des calculs de ce poste ?')) { set([]); render(); } }
  });
  const _sw = switchNavTab;
  switchNavTab = function () { try { snapshot(); } catch (e) {} return _sw.apply(this, arguments); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) try { snapshot(); } catch (e) {} });
  window.addEventListener('pagehide', () => { try { snapshot(); } catch (e) {} });
  window.ftCalcHistory = { get, snapshot, restore };
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  if (window.ftOnDom) window.ftOnDom(render);
  setTimeout(render, 600);
})();
