(function () {
  const $ = id => document.getElementById(id);
  /* 1. Titre */
  function title() {
    const t = $('home-title'); if (!t || t.querySelector('.ht-a')) return;
    const m = /^(Bonjour|Bonsoir|Bonne nuit|Bon après-midi)(,\s*)(.+)$/.exec(t.textContent.trim()); if (!m) return;
    t.innerHTML = '<span class="ht-a">' + m[1] + '</span><span class="ht-c">' + m[2] + '</span><span class="ht-b">' + m[3] + '</span>';
  }
  /* 2. Compte déconnecté */
  function acct() {
    const b = document.querySelector('#ft-acct > button'); if (!b) return;
    const out = !b.querySelector('.fa-av');
    b.classList.toggle('fa-out', out);
    const n = b.querySelector('.fa-name'); if (out && n && n.textContent !== 'Connexion' && window.matchMedia('(max-width:639px)').matches) n.textContent = 'Connexion';
  }
  /* 3. Onglets de rubrique */
  function hubs() {
    document.querySelectorAll('.hub-bar').forEach(bar => {
      if (!bar.offsetParent) return;
      const upd = () => { bar.classList.toggle('fr-more-r', bar.scrollWidth - bar.clientWidth - bar.scrollLeft > 4); bar.classList.toggle('fr-more-l', bar.scrollLeft > 4); };
      if (!bar.dataset.frs) { bar.dataset.frs = '1'; bar.addEventListener('scroll', upd, { passive: true }); }
      const on = bar.querySelector('.hub-tab.is-on');
      if (on && bar.scrollWidth > bar.clientWidth) { const l = on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2; bar.scrollLeft = Math.max(0, l); }
      upd();
    });
  }
  /* 8. Repères : premier bloc ouvert, clic sur tous les écrans */
  function reps() {
    const r = document.querySelector('#view-home .fh-rep'); if (!r || r.dataset.frOpen) return;
    r.dataset.frOpen = '1'; const g = r.querySelector('.fh-rg'); if (g) g.classList.add('open');
  }
  document.addEventListener('click', e => {
    const h = e.target.closest && e.target.closest('#view-home .fh-rep .fh-rg > h3');
    if (h && !window.matchMedia('(max-width:767px)').matches) h.parentElement.classList.toggle('open');
  });
  function all() { try { title(); acct(); hubs(); reps(); } catch (e) {} }
  let mt = null;
  window.ftOnDom(all);
  window.addEventListener('resize', () => { clearTimeout(mt); mt = setTimeout(all, 150); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(all, 400)); else setTimeout(all, 400);
})();
