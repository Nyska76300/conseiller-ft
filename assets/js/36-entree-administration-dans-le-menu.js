(function () {
  const $ = id => document.getElementById(id);
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>';
  function sync() {
    const list = $('burger-tabs-list'); if (!list) return;
    let sec = $('ft-adm-sec');
    if (!isAdmin()) { if (sec) sec.remove(); return; }
    let act = ''; try { act = String(activeNavTab); } catch (e) {}
    const on = act === 'admin';
    const key = on ? 'on' : 'off';
    if (sec && sec.dataset.k === key && sec.parentNode === list && list.lastElementChild === sec) return;
    if (sec) sec.remove();
    let pend = '';
    sec = document.createElement('div'); sec.id = 'ft-adm-sec'; sec.dataset.k = key; sec.style.marginTop = '12px';
    sec.innerHTML = '<div class="menu-sec-h">Administration</div><button type="button" class="w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-all group ' + (on ? 'bg-gradient-to-r from-blue-900/60 to-cyan-950/60 border-cyan-500/50 shadow-md shadow-cyan-950/40' : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700/80') + '">' +
      '<div class="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ' + (on ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50' : 'bg-rose-500/10 text-rose-400 border-rose-500/30') + '">' + SHIELD + '</div>' +
      '<div class="min-w-0 flex-1"><div class="flex items-center gap-1.5"><span class="text-xs font-bold ' + (on ? 'text-white' : 'text-slate-200') + '">Espace administrateur</span>' + (on ? '<span class="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>' : '') + '</div>' +
      '<p class="text-[10px] text-slate-400 mt-0.5 leading-tight">Statistiques, veille réglementaire, propositions, FAQ (visible par vous seul)</p></div></button>';
    list.appendChild(sec);
  }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('#ft-adm-sec button'); if (b) switchNavTab('admin'); }, true);
  document.addEventListener('ft-admin', sync);
  if (window.ftOnDom) window.ftOnDom(sync);
  setTimeout(sync, 500);
})();
