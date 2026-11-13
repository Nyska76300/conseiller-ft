(function () {
  /* Remontée automatique des bugs : quand un outil plante chez un conseiller, l’erreur technique
     (message, fichier, outil ouvert, version, type d’appareil) est envoyée à l’administrateur.
     Aucune donnée saisie dans les simulateurs n’est envoyée. */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const toast = (m, t) => { try { showToast(m, t || 'info'); } catch (e) {} };
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const ver = () => ((document.querySelector('meta[name="ft-version"]') || {}).content || '').slice(0, 30);
  const tab = () => { try { return String(activeNavTab).slice(0, 40); } catch (e) { return ''; } };
  const IGN = /ResizeObserver loop|^Script error\.?$|Failed to fetch|Load failed|NetworkError|AbortError|aborted|cancel|annul|non connecté|no-session|HTTP [45]\d\d|JWT|session|chrome-extension|moz-extension|safari-(web-)?extension|webkit-masked-url|NotAllowedError|play\(\) request|SecurityError/i;
  const strip = t => String(t || '').split(location.origin).join('').replace(/\?v=[\w.-]+/g, '');
  const seen = new Set(); let count = 0;
  const DAY = 'ft_bug_seen';

  function report(msg, src, stack) {
    msg = strip(msg).trim().slice(0, 300); src = strip(src).slice(0, 200); stack = strip(stack);
    if (!msg || IGN.test(msg) || IGN.test(src) || IGN.test(stack)) return;
    if (!/^https?:$/.test(location.protocol) || (/^(localhost|127\.)/.test(location.hostname) && !window.__FT_SB_URL) || !navigator.onLine) return;
    const key = msg + '|' + src;
    if (seen.has(key) || count >= 5) return;
    seen.add(key); count++;
    /* Même erreur sur le même appareil : une seule fois par jour */
    let mem = {}; try { mem = JSON.parse(localStorage.getItem(DAY) || '{}') || {}; } catch (e) {}
    const today = new Date().toISOString().slice(0, 10);
    if (mem[key] === today) return;
    mem[key] = today; Object.keys(mem).forEach(k => { if (mem[k] !== today) delete mem[k]; });
    try { localStorage.setItem(DAY, JSON.stringify(mem)); } catch (e) {}
    const row = { msg, src, stack: stack.split('\n').slice(0, 8).join('\n').slice(0, 1200), tool: tab(), ver: ver(), ua: navigator.userAgent.slice(0, 160) };
    setTimeout(() => {
      const logged = window.ftLoggedIn && window.ftLoggedIn();
      const p = logged && window.__ftRest ? window.__ftRest('/rest/v1/client_errors', { method: 'POST', prefer: 'return=minimal', body: row })
        : window.__ftAnon ? window.__ftAnon('/rest/v1/client_errors', { method: 'POST', prefer: 'return=minimal', body: row }) : null;
      if (p && p.catch) p.catch(() => {});
    }, 1200);
  }
  window.addEventListener('error', e => {
    if (e.target && e.target !== window) return; /* image ou fichier introuvable : ignoré */
    report(e.message, (e.filename || '') + (e.lineno ? ':' + e.lineno + ':' + e.colno : ''), e.error && e.error.stack);
  });
  window.addEventListener('unhandledrejection', e => { const r = e.reason; report(r && (r.message || (typeof r === 'string' ? r : '')), '', r && r.stack); });
  window.ftReportBug = report;

  /* ---------- Carte de l’Espace administrateur ---------- */
  let ROWS = [], recent = 0;
  const device = ua => /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Autre';
  const browser = ua => /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : '';
  function groups() {
    const g = {};
    ROWS.forEach(r => {
      const k = r.msg + '|' + (r.src || '');
      const x = g[k] || (g[k] = { k, msg: r.msg, src: r.src, stack: r.stack, n: 0, last: r.at, tools: new Set(), vers: new Set(), devs: new Set(), users: new Set(), ids: [] });
      x.n++; x.ids.push(r.id); if (r.at > x.last) x.last = r.at;
      if (r.tool) x.tools.add(r.tool); if (r.ver) x.vers.add(r.ver); if (r.ua) x.devs.add(device(r.ua) + (browser(r.ua) ? ' · ' + browser(r.ua) : '')); x.users.add(r.user_id || 'anonyme');
    });
    return Object.values(g).sort((a, b) => (b.last > a.last ? 1 : -1));
  }
  const toolName = id => { try { const c = NAV_TABS_CONFIG.find(x => String(x.id) === String(id)); return c ? c.name : id; } catch (e) { return id; } };
  function render() {
    const b = $('bug-body'); if (!b) return;
    const G = groups(), cur = ver();
    const head = $('ad-bugs') && $('ad-bugs').querySelector('.text-cyan-400');
    if (head) head.textContent = G.length ? G.length + ' erreur(s)' : 'Aucune';
    b.innerHTML = !G.length ? '<p class="ad-empty">✅ Aucune erreur détectée ces 30 derniers jours. Les plantages des outils chez les conseillers apparaîtront ici automatiquement.</p>' :
      '<p class="ad-empty">Erreurs techniques détectées chez les conseillers (30 derniers jours, sans donnée d’allocataire). Une fois corrigée, cliquez « Corrigé » pour l’effacer.</p>' +
      G.map((x, i) => '<div class="bug-it' + (x.vers.has(cur) ? ' cur' : '') + '"><div class="bug-h"><b>' + esc(x.msg) + '</b><span class="bug-n">' + x.n + '×</span></div>' +
        '<div class="bug-m">' + [x.tools.size ? 'Outil : ' + [...x.tools].map(toolName).map(esc).join(', ') : '', x.users.size + ' poste(s)', [...x.devs].slice(0, 3).map(esc).join(', '), 'Dernière : ' + new Date(x.last).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), x.vers.has(cur) ? '<span class="bug-cur">version actuelle</span>' : 'version ' + esc([...x.vers].sort().pop() || '?')].filter(Boolean).join(' · ') + '</div>' +
        '<details><summary>Détails techniques</summary><pre>' + esc((x.src ? x.src + '\n' : '') + (x.stack || '')) + '</pre></details>' +
        '<div class="ad-row" style="margin-top:6px;gap:8px;flex-wrap:wrap"><button type="button" class="ad-btn" data-bug="copy" data-i="' + i + '">Copier pour signaler</button><button type="button" class="ad-btn" data-bug="done" data-i="' + i + '">Corrigé</button></div></div>').join('') +
      '<div class="ad-row" style="margin-top:8px"><button type="button" class="ad-btn" data-bug="all">Tout effacer</button></div>';
    b.onclick = e => {
      const btn = e.target.closest('[data-bug]'); if (!btn) return;
      const a = btn.dataset.bug, x = G[+btn.dataset.i];
      if (a === 'copy') {
        const t = 'Erreur : ' + x.msg + '\nOutil : ' + [...x.tools].map(toolName).join(', ') + '\nVersions : ' + [...x.vers].join(', ') + '\nAppareils : ' + [...x.devs].join(', ') + '\nOccurrences : ' + x.n + '\n' + (x.src || '') + '\n' + (x.stack || '');
        navigator.clipboard.writeText(t).then(() => toast('Copié : collez-le dans votre message à Claude', 'success')); return;
      }
      if (a === 'all' && !confirm('Effacer toutes les erreurs de la liste ?')) return;
      const ids = a === 'all' ? ROWS.map(r => r.id) : x.ids;
      const chunks = []; for (let j = 0; j < ids.length; j += 100) chunks.push(ids.slice(j, j + 100));
      Promise.all(chunks.map(c => window.__ftRest('/rest/v1/client_errors?id=in.(' + c.join(',') + ')', { method: 'DELETE', prefer: 'return=minimal' })))
        .then(() => { const s = new Set(ids); ROWS = ROWS.filter(r => !s.has(r.id)); recent = count7(); render(); if (window.__ftTodo) window.__ftTodo(); toast(a === 'all' ? 'Liste effacée' : 'Erreur marquée comme corrigée', 'success'); })
        .catch(er => toast('Suppression impossible : ' + er.message, 'error'));
    };
  }
  const count7 = () => groups().filter(x => Date.now() - new Date(x.last) < 7 * 864e5).length;
  function load() {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    window.__ftRest('/rest/v1/client_errors?select=id,user_id,at,msg,src,stack,tool,ver,ua&at=gte.' + encodeURIComponent(since) + '&order=at.desc&limit=500').then(r => {
      ROWS = r || []; recent = count7(); render(); if (window.__ftTodo) window.__ftTodo();
    }).catch(e => {
      const b = $('bug-body'); if (!b) return;
      b.innerHTML = /PGRST20[25]|42P01|does not exist|HTTP 404/.test(String(e && (e.message || e.code))) ? '<p class="ad-empty">Non installé : exécutez le script <b>supabase/securite_rappels_bugs.sql</b> dans Supabase.</p>' : '<p class="ad-empty">Chargement impossible : ' + esc(e && e.message || e) + '</p>';
    });
  }
  (window.FT_TODO = window.FT_TODO || []).push(() => recent ? ['🐞', recent + ' bug(s) détecté(s) cette semaine chez les conseillers', 'ad-bugs'] : null);
  const _fill = window.ftAdminFill;
  window.ftAdminFill = function (c) {
    try { if (_fill) _fill.apply(this, arguments); } catch (e) { console.warn(e); }
    const A = $('ad-first-a');
    if (A && !$('ad-bugs')) { const h = document.createElement('div'); h.id = 'ad-bugs'; A.appendChild(h); h.innerHTML = c('🐞', 'Bugs détectés', '…', '<div id="bug-body"><p class="ad-empty">Chargement…</p></div>'); load(); }
  };
})();
