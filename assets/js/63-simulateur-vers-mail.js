(function () {
  /* Du simulateur au mail en un clic : dans chaque outil, un bouton « Rédiger le mail CVM » propose les mails
     qui correspondent à l’outil ; un clic ouvre CVM Direct sur ce mail, avec les champs remplis à partir des
     résultats affichés (montants, dates, durées). À vérifier avant d’envoyer. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  /* outil → mails (identifiants des modèles officiels), du plus utile au moins utile */
  const MAP = {
    '1': ['bm-m005', 'bm-m004', 'bm-umsy9qtzhsqt4', 'bm-m043', 'bm-m049'],
    '2': ['bm-m046', 'bm-m009', 'bm-m010', 'bm-umrvp66870kzh', 'bm-m060'],
    '3': ['bm-m022', 'bm-umuqxdaa9g0az', 'bm-umrt1ceeuz5f1', 'bm-umunszuo1wt5v', 'bm-m066'],
    '4': ['bm-m048'],
    '5': ['bm-m040', 'bm-umuv6umkmqle2', 'bm-umrejz1zh9mhf', 'bm-m056', 'bm-m039'],
    '6': ['bm-umtmwnft7igh8', 'bm-m029', 'bm-m030', 'bm-m031', 'bm-m051'],
    '7': ['bm-m058', 'bm-m041', 'bm-m002'],
    '9': ['bm-m041', 'bm-m002'],
    cfd: ['bm-m002', 'bm-m041', 'bm-umtckcmqzf8md'],
    delais: ['bm-m002', 'bm-m041', 'bm-m058', 'bm-umtckcmqzf8md'],
    sjr: ['bm-m049', 'bm-umtjso869oxbm', 'bm-m005'],
    droits: ['bm-m035', 'bm-m044', 'bm-umrepzjc83kvn', 'bm-m033', 'bm-m059'],
    dossier: ['bm-m005', 'bm-m041', 'bm-m001'],
    ass: ['bm-m059', 'bm-m036', 'bm-m065', 'bm-m052'],
    aref: ['bm-m045', 'bm-umuntlyxkc7lz'],
    sanctions: ['bm-umscu00kplkjg', 'bm-m008'],
    cns: ['bm-m056', 'bm-m039'],
    compare: ['bm-m033', 'bm-m034', 'bm-umrvvfbblich7']
  };
  const cur = () => { try { return String(activeNavTab); } catch (e) { return ''; } };
  const tpl = id => { try { return templates.find(t => t.id === id); } catch (e) { return null; } };

  function open(id) {
    const P = window.ftPrefill;
    let S = null;
    try { if (P) { const s = P.collect(); if (s) { localStorage.setItem('ft_calc_vals', JSON.stringify(s)); S = s; } else S = P.get(); } } catch (e) {}
    const t = tpl(id); if (!t) { toast('Mail introuvable', 'error'); return; }
    try { switchNavTab('cvm'); } catch (e) {}
    setTimeout(() => {
      try { selectTemplate(id); } catch (e) {}
      let n = 0;
      try { if (P && S) n = P.autofill(t, S); } catch (e) {}
      try { if (window.ftCvmCompute) { window.ftCvmCompute(t); renderVariablesForm(t); updateCompiledPreview(); } } catch (e) {}
      toast(n ? '« ' + t.title + ' » : ' + n + ' champ(s) rempli(s) depuis le calcul — vérifiez avant d’envoyer' : '« ' + t.title + ' » ouvert', n ? 'success' : 'info');
    }, 120);
  }
  window.ftSimToMail = open;

  function menu(btn) {
    const old = $('ft-s2m'); if (old) { old.remove(); return; }
    const ids = (MAP[cur()] || []).filter(tpl); if (!ids.length) return;
    const m = document.createElement('div'); m.id = 'ft-s2m'; m.setAttribute('role', 'menu');
    m.innerHTML = '<div class="s2m-h">Mail CVM pré-rempli avec ce calcul</div>' + ids.map(id => { const t = tpl(id); return '<button type="button" role="menuitem" data-id="' + esc(id) + '"><b>' + esc(t.title) + '</b><span>' + esc(t.category || '') + '</span></button>'; }).join('');
    document.body.appendChild(m);
    const r = btn.getBoundingClientRect();
    m.style.top = Math.min(innerHeight - m.offsetHeight - 10, r.bottom + 6) + 'px';
    m.style.left = Math.max(10, Math.min(innerWidth - m.offsetWidth - 10, r.right - m.offsetWidth)) + 'px';
    m.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) { m.remove(); open(b.dataset.id); } });
    setTimeout(() => document.addEventListener('click', function off(e) { if (!m.contains(e.target) && e.target !== btn) { m.remove(); document.removeEventListener('click', off, true); } }, true), 0);
  }

  /* Bouton flottant en bas à droite de l’outil (au-dessus de la barre du bas sur téléphone) */
  function place() {
    let b = $('ft-s2m-btn');
    const ok = !!(MAP[cur()] || []).filter(tpl).length;
    if (!ok) { if (b) b.hidden = true; const m = $('ft-s2m'); if (m) m.remove(); return; }
    if (!b) {
      b = document.createElement('button'); b.id = 'ft-s2m-btn'; b.type = 'button';
      b.innerHTML = '<span aria-hidden="true">✉️</span><span class="s2m-l">Rédiger le mail CVM</span>';
      b.title = 'Ouvrir un mail CVM pré-rempli avec les résultats de cet outil';
      b.onclick = () => menu(b);
      document.body.appendChild(b);
    }
    b.hidden = false;
  }
  if (typeof switchNavTab === 'function') {
    const _s = switchNavTab;
    switchNavTab = function () { const r = _s.apply(this, arguments); try { place(); } catch (e) {} return r; };
  }
  setTimeout(place, 1200);
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Rédiger le mail CVM de cet outil', s: 'Mail pré-rempli avec les résultats affichés', kw: 'mail cvm rediger prerempli simulateur resultat envoyer', run: () => { const b = $('ft-s2m-btn'); if (b && !b.hidden) menu(b); else toast('Ouvrez d’abord un simulateur', 'info'); } });
})();
