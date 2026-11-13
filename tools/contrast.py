#!/usr/bin/env python3
"""Contrôle de lisibilité (contraste texte / fond) des thèmes de couleurs.

Usage : python3 tools/contrast.py [--strict]
Pour chaque thème (Océan + les 5 thèmes générés), en sombre et en clair, sur les pages principales :
mesure le contraste de chaque texte visible avec son fond réel (couleurs semi-transparentes empilées).
Seuils WCAG : 4,5 pour le texte courant, 3 pour le grand texte (≥ 24 px, ou ≥ 18,7 px en gras).

Un thème ne doit pas être MOINS lisible qu'Océan (le thème d'origine) : tout texte qui passe sous le seuil
dans un thème alors qu'il le respecte dans Océan est signalé. Avec --strict, ces écarts font échouer.
Le résumé est aussi écrit dans $GITHUB_STEP_SUMMARY quand il existe (GitHub Actions).
"""
import http.server, socketserver, threading, os, sys, functools, json

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PALS = ['', 'emeraude', 'sarcelle', 'amethyste', 'framboise', 'ardoise']
TABS = ['home', 'cvm', 1, 'droits', 'bareme', 'formation']

JS = r"""
(theme) => {
  const parse = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const over = (top, bot) => { const a = top[3] + bot[3] * (1 - top[3]); if (!a) return [0, 0, 0, 0]; return [0, 1, 2].map(i => (top[i] * top[3] + bot[i] * bot[3] * (1 - top[3])) / a).concat([a]); };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const base = theme === 'light' ? [244, 248, 254, 1] : [8, 12, 28, 1];
  const out = [], seen = new Set();
  const view = document.querySelector('[id^="view-"]:not(.hidden)') || document.body;
  const roots = [document.querySelector('header'), view].filter(Boolean);
  for (const root of roots) for (const el of root.querySelectorAll('*')) {
    if (!el.childNodes.length) continue;
    let txt = ''; for (const n of el.childNodes) if (n.nodeType === 3) txt += n.nodeValue;
    txt = txt.trim(); if (txt.length < 2) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (el.closest('[aria-hidden="true"],.sr-only,.ft-sr,input,textarea,select,option')) continue;
    let fg = parse(cs.color); if (!fg) continue;
    /* fond réel : on empile les fonds des parents jusqu'à un fond opaque */
    const stack = []; let op = 1; let x = el;
    let grad = false;
    while (x && x.nodeType === 1) { const s = getComputedStyle(x); op *= +s.opacity; if (s.backgroundImage.includes('gradient') && x !== document.documentElement) { grad = true; break; } const c = parse(s.backgroundColor); if (c && c[3] > 0) { stack.push(c); if (c[3] >= 0.99) break; } x = x.parentElement; }
    if (grad) continue; /* fond en dégradé : non mesurable de façon fiable */
    let bg = base; for (let i = stack.length - 1; i >= 0; i--) bg = over(stack[i], bg);
    fg = over([fg[0], fg[1], fg[2], fg[3] * op], bg);
    const px = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const need = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;
    const v = ratio(fg, bg);
    let path = []; let y = el; for (let i = 0; i < 4 && y && y !== document.body; i++, y = y.parentElement) path.unshift(y.tagName.toLowerCase() + (y.id ? '#' + y.id : '') + (y.classList[0] ? '.' + y.classList[0] : ''));
    const key = path.join('>') + '|' + txt.slice(0, 40);
    if (seen.has(key)) continue; seen.add(key);
    out.push({ key, txt: txt.slice(0, 50), v: Math.round(v * 100) / 100, need });
  }
  return out;
};
"""


def main():
    strict = '--strict' in sys.argv
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://127.0.0.1:{srv.server_address[1]}/index.html'
    res = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for theme in ('dark', 'light'):
            for pal in PALS:
                c = b.new_context(viewport={'width': 1366, 'height': 900})
                c.add_init_script("try{localStorage.setItem('ft_news_seen','9999-01-01.1');localStorage.setItem('ft_tour_done','1');sessionStorage.setItem('ft_sb_skip','1');"
                                  + ("localStorage.setItem('ft_theme','light');" if theme == 'light' else '')
                                  + "localStorage.setItem('ft_prefs',JSON.stringify({pal:%s}))}catch(e){}" % json.dumps(pal))
                pg = c.new_page(); pg.goto(url); pg.wait_for_timeout(1500)
                for t in TABS:
                    try: pg.evaluate(f"switchNavTab({t!r})")
                    except Exception: continue
                    pg.wait_for_timeout(250)
                    for it in pg.evaluate(JS, theme):
                        res[(theme, pal or 'ocean', str(t), it['key'])] = it
                c.close()
    lines, bad = [], []
    for theme in ('dark', 'light'):
        for pal in PALS[1:]:
            worse = []
            for (th, pl, t, k), it in res.items():
                if th != theme or pl != pal: continue
                ref = res.get((theme, 'ocean', t, k))
                if ref and it['v'] < it['need'] and ref['v'] >= ref['need'] and it['v'] < ref['v'] - 0.2:
                    worse.append((t, it['txt'], it['v'], ref['v'], it['need']))
            if worse:
                bad += [(theme, pal) + w for w in worse]
            lines.append(f"| {pal} | {'sombre' if theme == 'dark' else 'clair'} | {len(worse)} |")
    total = {th: sum(1 for (t_, pl, _, _), it in res.items() if t_ == th and pl == 'ocean' and it['v'] < it['need']) for th in ('dark', 'light')}
    rep = ['## Lisibilité des thèmes', '', '| Thème | Mode | Textes moins lisibles qu’Océan |', '|---|---|---|'] + lines
    rep += ['', f"Textes sous le seuil WCAG dans Océan (référence) : sombre {total['dark']}, clair {total['light']}."]
    if '--ocean' in sys.argv:
        rep += ['', '### Océan sous le seuil', ''] + [f"- {th} / {t} : « {it['txt']} » {it['v']} (seuil {it['need']}) {k.split('|')[0][-70:]}" for (th, pl, t, k), it in res.items() if pl == 'ocean' and it['v'] < it['need']]
    if bad:
        rep += ['', '### Détail', ''] + [f"- {th} / {pl} / onglet {t} : « {tx} » {v} (Océan {rv}, seuil {nd})" for th, pl, t, tx, v, rv, nd in bad[:80]]
    print('\n'.join(rep))
    sm = os.environ.get('GITHUB_STEP_SUMMARY')
    if sm:
        with open(sm, 'a') as f: f.write('\n'.join(rep) + '\n')
    if bad and strict:
        sys.exit(1)
    print('OK : thèmes contrôlés' if not bad else f'ATTENTION : {len(bad)} texte(s) moins lisible(s) que dans Océan')


if __name__ == '__main__':
    main()
