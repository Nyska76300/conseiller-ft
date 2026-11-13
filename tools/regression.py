#!/usr/bin/env python3
"""Tests de non-régression de l'Espace Conseiller.

Usage : python3 tools/regression.py   (depuis la racine du dépôt ; nécessite playwright + chromium)
Vérifie, en thème sombre et clair, sur ordinateur et téléphone :
  - aucun plantage JavaScript en ouvrant chaque outil ;
  - tous les cas de contrôle des calculs (FT_CASES) ;
  - la barre du haut ne déborde pas et le titre ne se répète pas (même avec des rubriques renommées) ;
  - la page ne déborde pas horizontalement sur téléphone.
"""
import http.server, socketserver, threading, os, sys, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
H = functools.partial(Q, directory=ROOT)
srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), H); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{port}/index.html'
TABS = ['home', 'cvm', 1, 2, 3, 4, 5, 6, 7, 8, 9, 'cfd', 'dossier', 'delais', 'droits', 'cns', 'sjr', 'bareme', 'schemas', 'glossaire', 'sources', 'jour',
        'invalidite', 'ati', 'ass', 'aref', 'sanctions', 'casparts', 'echeances', 'faq', 'formation', 'admin']
LABELS = "{'r:Ouverture de droits':'Droits','t:9':'Rupture conventionnelle individuelle'}"
fails = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for theme in ('dark', 'light'):
        for vp in ({'width': 1366, 'height': 860}, {'width': 390, 'height': 760}):
            mob = vp['width'] < 500
            c = b.new_context(viewport=vp, is_mobile=mob, has_touch=mob)
            c.add_init_script("try{localStorage.setItem('ft_news_seen','9999-01-01.1');localStorage.setItem('ft_tour_done','1');sessionStorage.setItem('ft_sb_skip','1');"
                              + ("localStorage.setItem('ft_theme','light');" if theme == 'light' else '')
                              + f"localStorage.setItem('ft_labels',JSON.stringify({LABELS}))" + "}catch(e){}")
            pg = c.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.goto(URL); pg.wait_for_timeout(1500)
            for t in TABS:
                try: pg.evaluate(f"switchNavTab({t!r})")
                except Exception as e: errs.append(f'{t}: {e}')
                pg.wait_for_timeout(200)
                name = pg.evaluate("(document.getElementById('header-active-tab-name')||{}).textContent||''")
                if name.count('individuelle') > 1: fails.append(f'{theme} {vp["width"]} {t}: titre répété')
                if mob and pg.evaluate('document.documentElement.scrollWidth') > vp['width'] + 2: fails.append(f'{theme} {vp["width"]} {t}: débordement horizontal')
            if not mob:
                r = pg.evaluate("Math.round(document.querySelector('#ft-acct > button').getBoundingClientRect().right)")
                if r > vp['width']: fails.append(f'{theme}: bouton compte hors écran')
            ko = pg.evaluate("FT_CASES.filter(c=>{let g;try{g=c.run()}catch(e){return true}return !(Math.abs(g-c.exp)<Math.pow(10,-c.d)/2+1e-9)}).map(c=>c.n)")
            fails += [f'cas KO : {n}' for n in ko]
            fails += [f'{theme} {vp["width"]} erreur JS : {e}' for e in errs]
            c.close()
    b.close()
srv.shutdown()
print('\n'.join(sorted(set(fails))) if fails else 'OK : aucune régression détectée')
sys.exit(1 if fails else 0)
