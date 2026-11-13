(function () {
  /* Espace administrateur → Contenu : contrôle qualité des modèles de mails et nettoyage guidé
     (outils et modèles peu ou jamais utilisés). */
  const $ = id => document.getElementById(id);
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const isAdmin = () => !!(window.__ftIsAdmin && window.__ftIsAdmin());
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const tpls = () => { try { return templates.slice(); } catch (e) { return []; } };
  const SAFE_REPEAT = /^(nous|vous|de|que|le|la|les)$/i;

  /* ---------- Contrôle qualité ---------- */
  function audit() {
    const T = tpls(), out = [], byTitle = {}, byBody = {};
    T.forEach(t => {
      const body = String(t.body || ''), title = String(t.title || ''), pb = [];
      if (!title.trim()) pb.push(['err', 'Titre vide']);
      if (!body.trim()) pb.push(['err', 'Texte vide']);
      const used = [...body.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)].map(m => m[1]);
      const decl = (t.variables || []).map(v => v.key);
      used.filter((k, i) => !decl.includes(k) && used.indexOf(k) === i).forEach(k => pb.push(['err', 'Champ {{' + k + '}} utilisé mais non déclaré : il restera vide']));
      decl.filter(k => !used.includes(k)).forEach(k => pb.push(['warn', 'Champ « ' + k + ' » déclaré mais absent du texte']));
      if ((body.match(/\{\{/g) || []).length !== (body.match(/\}\}/g) || []).length || /\{[^{}]*\}(?!\})/.test(body.replace(/\{\{[^}]*\}\}/g, ''))) pb.push(['err', 'Accolades mal fermées']);
      if (/\[(?:nom|prénom|date|montant|xx+|à compléter)[^\]]*\]/i.test(body)) pb.push(['warn', 'Texte à compléter entre crochets ([…]) resté dans le modèle']);
      if (/ {2,}\S/.test(body.replace(/\n/g, ' '))) pb.push(['info', 'Doubles espaces']);
      if (/\S ,|\S \.(?!\.)/.test(body)) pb.push(['info', 'Espace avant une virgule ou un point']);
      const rep = [...body.matchAll(/\b([A-Za-zÀ-ÿ]{2,})\s+\1\b/gi)].map(m => m[1]).filter(w => !SAFE_REPEAT.test(w));
      if (rep.length) pb.push(['warn', 'Mot répété : « ' + rep[0] + ' ' + rep[0] + ' »']);
      if (/[a-zà-ÿ]\.[A-ZÀ-Ý][a-zà-ÿ]/.test(body.replace(/https?:\/\/\S+/g, ''))) pb.push(['info', 'Espace manquant après un point']);
      const links = [...body.matchAll(/https?:\/\/[^\s)>\]]+/g)].map(m => m[0]);
      links.filter(l => /^http:\/\//.test(l)).forEach(l => pb.push(['warn', 'Lien non sécurisé (http) : ' + l]));
      if (/(tro-perçu|tro-percu|\bdemmande|\binteressé|\bassedic|pôle emploi|pole emploi)/i.test(title + ' ' + body)) pb.push(['warn', 'Orthographe ou ancien nom à vérifier (ex. « Pôle emploi » → « France Travail »)']);
      const kt = norm(title), kb = norm(body).slice(0, 400);
      if (kt) (byTitle[kt] = byTitle[kt] || []).push(t);
      if (kb.length > 40) (byBody[kb] = byBody[kb] || []).push(t);
      if (pb.length) out.push({ t, pb, links });
    });
    const dups = Object.values(byTitle).filter(g => g.length > 1).map(g => ['Même titre', g]).concat(Object.values(byBody).filter(g => g.length > 1).map(g => ['Même texte', g]));
    return { out, dups, n: T.length };
  }
  const W = { err: 0, warn: 1, info: 2 }, ICO = { err: '⛔', warn: '⚠️', info: 'ℹ️' };
  function qRender() {
    const h = $('qc-body'); if (!h) return;
    const { out, dups, n } = audit();
    const errs = out.reduce((s, x) => s + x.pb.filter(p => p[0] === 'err').length, 0), warns = out.reduce((s, x) => s + x.pb.filter(p => p[0] === 'warn').length, 0);
    const sub = $('ad-qc') && $('ad-qc').querySelector('.text-cyan-400'); if (sub) sub.textContent = errs + ' erreur(s) · ' + warns + ' alerte(s)';
    out.sort((a, b) => Math.min(...a.pb.map(p => W[p[0]])) - Math.min(...b.pb.map(p => W[p[0]])));
    const it = (t, list) => '<div class="hs-it qc-it"><div><b>' + esc(t.title || '(sans titre)') + (t.isOfficial ? ' <em class="qc-tag">officiel</em>' : t.shared ? ' <em class="qc-tag">commun</em>' : ' <em class="qc-tag">perso</em>') + '</b>' + list + '</div><button type="button" class="ad-btn" data-qc="open" data-id="' + esc(t.id) + '">Ouvrir</button></div>';
    h.innerHTML = '<p class="ad-empty">' + n + ' modèles analysés : champs {{…}} oubliés, accolades, mots répétés, espaces, liens, anciens noms et doublons. Les modèles officiels sont signalés pour information.</p>' +
      (out.length ? '<div class="hs-list">' + out.slice(0, 80).map(x => it(x.t, '<ul class="qc-l">' + x.pb.map(p => '<li class="qc-' + p[0] + '">' + ICO[p[0]] + ' ' + esc(p[1]) + '</li>').join('') + '</ul>')).join('') + '</div>' : '<p class="ad-empty">✅ Aucun problème détecté.</p>') +
      (dups.length ? '<h4 class="hs-h">Doublons possibles</h4><div class="hs-list">' + dups.slice(0, 30).map(([k, g]) => '<div class="hs-it"><div><b>' + esc(k) + ' (' + g.length + ')</b><span>' + g.map(t => esc(t.title)).join(' · ') + '</span></div><button type="button" class="ad-btn" data-qc="open" data-id="' + esc(g[0].id) + '">Ouvrir</button></div>').join('') + '</div>' : '');
  }

  /* ---------- Nettoyage guidé ---------- */
  function cRender() {
    const h = $('cl-body'); if (!h || !window.__ftRpc) return;
    window.__ftRpc('admin_usage', { days: 90 }).then(rows => {
      rows = rows || [];
      const tools = {}, mails = {};
      rows.forEach(r => { const t = String(r.tool); if (/^(mail|copie):/.test(t)) { const k = norm(t.replace(/^(mail|copie):/, '')); mails[k] = (mails[k] || 0) + r.uses; } else tools[t] = (tools[t] || 0) + r.uses; });
      let cfg = []; try { cfg = NAV_TABS_CONFIG.filter(t => !/^(home|cvm|admin)$/.test(String(t.id)) && String(t.id).indexOf('hub:') !== 0); } catch (e) {}
      const low = cfg.map(t => ({ t, n: tools[String(t.id)] || 0 })).filter(x => x.n <= 2).sort((a, b) => a.n - b.n);
      const common = tpls().filter(t => t.isOfficial || t.shared), never = common.filter(t => !mails[norm(t.title)]);
      const sub = $('ad-cl') && $('ad-cl').querySelector('.text-cyan-400'); if (sub) sub.textContent = '90 derniers jours';
      h.innerHTML = '<p class="ad-empty">Ce qui n’a presque pas servi depuis 3 mois chez les conseillers connectés : à faire connaître, renommer, déplacer ou retirer.</p>' +
        '<h4 class="hs-h">Outils peu ouverts (' + low.length + ')</h4>' + (low.length ? '<div class="cl-chips">' + low.map(x => '<button type="button" class="cl-chip" data-qc="tool" data-id="' + esc(x.t.id) + '">' + esc(x.t.name) + ' <b>' + x.n + '</b></button>').join('') + '</div>' : '<p class="ad-empty">Tous les outils ont servi.</p>') +
        '<h4 class="hs-h">Modèles communs jamais ouverts (' + never.length + ' sur ' + common.length + ')</h4>' + (never.length ? '<details class="cl-more"><summary>Voir la liste</summary><div class="hs-list">' + never.map(t => '<div class="hs-it"><div><b>' + esc(t.title) + '</b><span>' + esc(t.category || '') + '</span></div><button type="button" class="ad-btn" data-qc="open" data-id="' + esc(t.id) + '">Ouvrir</button></div>').join('') + '</div></details>' : '<p class="ad-empty">Tous les modèles communs ont servi.</p>');
    }).catch(e => { h.innerHTML = '<p class="ad-empty">Chargement impossible : ' + esc(e && e.message || e) + '</p>'; });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-qc]'); if (!b || !isAdmin()) return;
    if (b.dataset.qc === 'open') { switchNavTab('cvm'); try { selectCategory('all'); } catch (er) {} try { selectTemplate(b.dataset.id); } catch (er) {} }
    if (b.dataset.qc === 'tool') { const id = b.dataset.id; switchNavTab(/^\d+$/.test(id) ? +id : id); }
  });
  function cards() {
    const grid = document.querySelector('#adp-content .adp-grid'); if (!grid || !isAdmin()) return;
    const mk = (id, ico, title, body) => { const w = document.createElement('div'); w.id = id; w.dataset.pane = 'content';
      w.innerHTML = '<div class="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-3"><div class="flex items-center justify-between pb-2 border-b border-slate-800"><span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><span class="w-5 h-5 rounded bg-slate-800 text-[10px] flex items-center justify-center">' + ico + '</span>' + title + '</span><span class="text-[10px] font-mono text-cyan-400">…</span></div><div id="' + body + '"><p class="ad-empty">Chargement…</p></div></div>';
      grid.appendChild(w); };
    if (!$('ad-qc')) { mk('ad-qc', '🔍', 'Contrôle qualité des modèles', 'qc-body'); qRender(); }
    if (!$('ad-cl')) { mk('ad-cl', '🧹', 'Nettoyage guidé', 'cl-body'); cRender(); }
  }
  if (window.ftOnDom) window.ftOnDom(() => { if ($('adp') && !$('view-admin').classList.contains('hidden')) cards(); });
  window.ftAudit = audit;
})();
