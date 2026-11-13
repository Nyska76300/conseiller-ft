(function () {
  const $ = id => document.getElementById(id), H = document.documentElement;
  const MQ = window.matchMedia('(max-width:767px)');
  const ic = p => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  const tab = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  const SHARE = ic('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>');

  /* ---------- Barre d'onglets ---------- */
  const TABS = [
    ['home', 'Accueil', '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>', () => switchNavTab('home')],
    ['cvm', 'Mails', '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>', () => switchNavTab('cvm')],
    ['tools', 'Simulateurs', '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h8"/>', () => toggleBurgerMenu()],
    ['search', 'Rechercher', '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', () => window.ftHeaderSearch && window.ftHeaderSearch()]
  ];
  function buildBar() {
    if ($('ft-tabbar')) return;
    const n = document.createElement('nav'); n.id = 'ft-tabbar'; n.setAttribute('aria-label', 'Navigation principale');
    n.innerHTML = TABS.map(t => '<button type="button" data-t="' + t[0] + '" aria-label="' + t[1] + '">' + ic(t[2]) + '<span>' + t[1] + '</span></button>').join('');
    n.onclick = e => { const b = e.target.closest('button'); if (!b) return; const t = TABS.find(x => x[0] === b.dataset.t); try { if (t[0] !== 'tools' && typeof isBurgerMenuOpen !== 'undefined' && isBurgerMenuOpen) toggleBurgerMenu(false); H.classList.remove('cvm-cats', 'ft-more-on'); } catch (er) {} t[3](); setTimeout(mark, 60); };
    document.body.appendChild(n); mark();
  }
  function mark() {
    const t = tab(), bar = $('ft-tabbar'); if (!bar) return;
    bar.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === 'home' ? t === 'home' : b.dataset.t === 'cvm' ? t === 'cvm' : b.dataset.t === 'tools' ? (t !== 'home' && t !== 'cvm') : false));
  }

  /* ---------- Partager ---------- */
  const canShare = !!navigator.share;
  function shareText(title, text) {
    if (!text) return;
    if (canShare) { navigator.share({ title: title || 'Mail', text: text }).catch(() => {}); return; }
    location.href = 'mailto:?subject=' + encodeURIComponent(title || '') + '&body=' + encodeURIComponent(text);
  }
  window.ftShareCurrentMail = function () {
    try {
      const t = templates.find(x => x.id === activeTemplateId); if (!t) return;
      shareText(t.title, compileText(t.body, t.id, false));
    } catch (e) {}
  };
  function shareButtons() {
    const copy = $('btn-copy-raw');
    if (copy && canShare && !$('btn-share-mail')) {
      const b = document.createElement('button'); b.type = 'button'; b.id = 'btn-share-mail'; b.className = 'ft-share-btn'; b.title = 'Partager (Mail, Teams, Messages…)';
      b.innerHTML = SHARE + '<span>Partager</span>'; b.onclick = window.ftShareCurrentMail;
      copy.parentNode.insertBefore(b, copy);
    }
    const anchor = $('btn-mailto');
    if (anchor && !$('btn-team')) {
      const b = document.createElement('button'); b.type = 'button'; b.id = 'btn-team'; b.className = 'ft-team-btn';
      b.innerHTML = ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>');
      b.onclick = () => { if (window.__ftIsAdmin && window.__ftIsAdmin()) window.ftSharePublish(); else if (window.ftPropose) window.ftPropose(); };
      anchor.parentNode.insertBefore(b, anchor.nextSibling);
    }
    const tb = $('btn-team');
    if (tb) { const adm = window.__ftIsAdmin && window.__ftIsAdmin(); tb.title = adm ? 'Publier ce modèle pour tous les conseillers' : 'Proposer ce modèle à l’équipe'; tb.setAttribute('aria-label', tb.title); }
    if (canShare) document.querySelectorAll('.ft-mail .ft-mail-btns').forEach(g => {
      if (g.querySelector('.ft-mail-share')) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ft-mail-share'; b.textContent = 'Partager';
      g.insertBefore(b, g.querySelector('.ft-mail-copy'));
    });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.ft-mail-share'); if (!b) return;
    const p = b.closest('.ft-mail'), ta = p && p.querySelector('textarea');
    if (ta && ta.value.trim()) shareText('Mail à l’allocataire', ta.value);
  });

  /* ---------- Clavier numérique ---------- */
  function numKeys(root) {
    (root || document).querySelectorAll('input[type="number"]:not([inputmode])').forEach(i => i.setAttribute('inputmode', 'decimal'));
  }

  /* ---------- Repères repliables (téléphone) ---------- */
  document.addEventListener('click', e => {
    const h = e.target.closest && e.target.closest('#view-home .fh-rep .fh-rg > h3');
    if (h && MQ.matches) h.parentElement.classList.toggle('open');
  });

  /* ---------- Barème : date de vérification et rappel ---------- */
  const parseFr = d => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d || ''); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  function lastCheckpoint(now) { const y = now.getFullYear(); const jul = new Date(y, 6, 1), jan = new Date(y, 0, 1); return now >= jul ? jul : jan; }
  function bareme() {
    let B = null; try { B = BAREME; } catch (e) {}
    const rep = document.querySelector('#view-home .fh-rep'); if (!B || !rep) return;
    const v = parseFr(B.verifie);
    if (!rep.querySelector('.fh-bv') && v) { const p = document.createElement('div'); p.className = 'fh-bv'; p.textContent = 'Montants vérifiés le ' + B.verifie + ' (sources Unédic).'; const btns = rep.querySelector('.fh-btns'); rep.insertBefore(p, btns || null); }
    const old = document.querySelector('#view-home .fh-alert');
    const adm = window.__ftIsAdmin && window.__ftIsAdmin();
    const cp = lastCheckpoint(new Date());
    let ack = null; try { ack = localStorage.getItem('ft_bareme_ack'); } catch (e) {}
    const due = adm && v && v < cp && !(ack && new Date(ack) >= cp);
    if (!due) { if (old) old.remove(); return; }
    if (old) return;
    const label = cp.getMonth() === 6 ? '1er juillet ' + cp.getFullYear() : '1er janvier ' + cp.getFullYear();
    const src = (B.sources || [])[0];
    const a = document.createElement('section'); a.className = 'fh-alert'; a.setAttribute('role', 'status');
    a.innerHTML = '<b>Barème à vérifier</b><p>Les montants ont été vérifiés le ' + B.verifie + ', avant le ' + label + ' (date habituelle de revalorisation). Contrôlez les paramètres Unédic, puis demandez-moi la mise à jour s’ils ont changé.</p><div class="fa-row"><button type="button">C’est vérifié</button>' + (src ? '<a href="https://www.unedic.org/publications" target="_blank" rel="noopener">Paramètres Unédic</a>' : '') + '</div>';
    a.querySelector('button').onclick = () => { try { localStorage.setItem('ft_bareme_ack', new Date().toISOString()); } catch (e) {} a.remove(); try { showToast('Rappel masqué jusqu’à la prochaine échéance', 'success'); } catch (e) {} };
    const col = document.querySelector('#view-home .fh-L') || rep.parentElement;
    col.insertBefore(a, col.firstChild);
  }

  /* ---------- Démarrage ---------- */
  function all() { try { buildBar(); mark(); shareButtons(); numKeys(); bareme(); } catch (e) { console.warn(e); } }
  if (typeof switchNavTab === 'function') { const _s = switchNavTab; switchNavTab = function () { const r = _s.apply(this, arguments); setTimeout(all, 30); return r; }; }
  document.addEventListener('ft-admin', () => setTimeout(all, 50));
  let mt = null;
  /* Un seul observateur partagé pour les ajouts récents (performances) */
  window.ftOnDom = window.ftOnDom || (function () { const fns = []; let t = null; const run = () => { t = null; fns.forEach(f => { try { f(); } catch (e) {} }); }; new MutationObserver(() => { if (!t) t = setTimeout(run, 180); }).observe(document.body, { childList: true, subtree: true }); return f => fns.push(f); })();
  window.ftOnDom(() => { numKeys(); shareButtons(); bareme(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(all, 300)); else setTimeout(all, 300);
})();
