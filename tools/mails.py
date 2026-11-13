#!/usr/bin/env python3
"""Relecture automatique des modèles de mails officiels (CVM Direct).

Usage : python3 tools/mails.py [--online]
ÉCHEC (bloquant) :
  - un champ {{…}} du texte sans définition, ou une définition jamais utilisée ;
  - deux modèles avec le même identifiant ou le même titre ;
  - une catégorie absente de la liste des catégories ;
  - une faute connue (liste ci-dessous) ou un mot répété (« de de »).
AVERTISSEMENT :
  - date, montant ou durée écrits en dur (probablement tirés d'un ancien dossier) ;
  - ponctuation douteuse (espace avant une virgule, « .. », parenthèse non fermée) ;
  - lien mal formé ; avec --online, lien qui ne répond pas.
Le résumé est écrit dans $GITHUB_STEP_SUMMARY quand il existe.
"""
import json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'js', '06-coeur-baremes-modeles.js')
FAUTES = {
    r'\bTro-perçu\b': 'Trop-perçu', r'\btravaillé dur ce mois\b': 'travaillé sur ce mois', r'\bd e ex\b': 'de votre ex-', r'\bje vous renvoi\b': 'je vous renvoie', r'\bles correction\b': 'les corrections', r'\bdémarches nécessaire\b': 'démarches nécessaires',
    r'\binvite a\b': 'invite à', r'\bdroit calculé ,': 'droit calculé,', r'\bprécédent la fin\b': 'précédant la fin', r'\bvos droit\b': 'vos droits',
    r'\bReprise des droit\b': 'Reprise des droits', r'\bderniers précédent\b': 'derniers mois précédant', r'\bnon suivi de\b': 'non suivie de',
}
REPEAT_OK = {'vous', 'nous', 'en', 'le', 'la'}  # « vous vous », « nous nous »… sont corrects
DATE_OK = {'01/10/2021'}  # dates réglementaires
MONTANT_OK = {'775,65 €'}  # plafonds réglementaires (RFF, depuis le 1er avril 2026)


def load():
    s = open(SRC, encoding='utf-8').read()
    line = next(l for l in s.split('\n') if 'const OFFICIAL_TEMPLATES = ' in l)
    T = json.loads(line.split('const OFFICIAL_TEMPLATES = ', 1)[1].rstrip().rstrip(';'))
    cats = {c['name'] for c in json.loads(re.search(r'const DEFAULT_CATEGORIES = (\[.*?\]);', s).group(1))}
    return T, cats


def main():
    online = '--online' in sys.argv
    T, cats = load()
    err, warn = [], []
    ids, titles = {}, {}
    for t in T:
        name = f"« {t['title']} »"
        if t['id'] in ids: err.append(f"{name} : identifiant en double ({t['id']})")
        ids[t['id']] = 1
        if t['title'].strip().lower() in titles: err.append(f"{name} : titre en double")
        titles[t['title'].strip().lower()] = 1
        if t.get('category') not in cats: err.append(f"{name} : catégorie inconnue « {t.get('category')} »")
        body = t.get('body', '')
        used = list(dict.fromkeys(re.findall(r'\{\{([^}]+)\}\}', body)))
        defs = [v['key'] for v in t.get('variables', [])]
        for k in used:
            if k not in defs: err.append(f"{name} : champ {{{{{k}}}}} sans définition")
        for k in defs:
            if k not in used: err.append(f"{name} : champ « {k} » défini mais absent du texte")
        if len(set(defs)) != len(defs): err.append(f"{name} : champ défini deux fois")
        for v in t.get('variables', []):
            if not v.get('label') or v['label'] == v['key'] or re.fullmatch(r'[\d/,.\s]+', v['label']):
                err.append(f"{name} : champ « {v['key']} » sans libellé clair")
        txt = t['title'] + '\n' + re.sub(r'\{\{[^}]+\}\}', 'X', body)
        for rx, good in FAUTES.items():
            for m in re.finditer(rx, txt):
                err.append(f"{name} : « {m.group(0)} »" + (f" → « {good} »" if good else ''))
        for m in re.finditer(r'\b(\w{2,})\s+\1\b', txt, re.I):
            if m.group(1).lower() not in REPEAT_OK: err.append(f"{name} : mot répété « {m.group(0)} »")
        for m in re.finditer(r'\b\d{1,2}/\d{1,2}/\d{4}\b', txt):
            if m.group(0) not in DATE_OK: warn.append(f"{name} : date écrite en dur {m.group(0)}")
        for m in re.finditer(r'\b\d{1,3}(?:[  ]\d{3})*,\d{2}\s?€', txt):
            if m.group(0).replace('\u202f', ' ') not in MONTANT_OK: warn.append(f"{name} : montant écrit en dur {m.group(0)}")
        for m in re.finditer(r'\s[,.](?!\d)|\.\.(?!\.)|,,', txt):
            ctx = txt[max(0, m.start() - 25):m.end() + 5].replace('\n', ' ')
            warn.append(f"{name} : ponctuation à vérifier « …{ctx}… »")
        nb = re.sub(r'(?m)^\s*\d+\)', '', txt)  # « 1) », « 2) » : numérotation
        if nb.count('(') != nb.count(')'): warn.append(f"{name} : parenthèse non fermée")
        for u in re.findall(r'https?://[^\s)»"]+', body):
            u = u.rstrip('.,;')
            if not re.match(r'https?://[\w.-]+\.[a-z]{2,}(/|$)', u): warn.append(f"{name} : lien mal formé {u}")
            elif online:
                try:
                    req = urllib.request.Request(u, method='GET', headers={'User-Agent': 'Mozilla/5.0 (verification liens)'})
                    with urllib.request.urlopen(req, timeout=12) as r:
                        if r.status >= 400: warn.append(f"{name} : lien en erreur {r.status} {u}")
                except Exception as e:
                    code = getattr(e, 'code', None)
                    if code not in (401, 403, 405, 429): warn.append(f"{name} : lien injoignable {u} ({code or type(e).__name__})")
    rep = ['## Relecture des modèles de mails', '', f'{len(T)} modèles, {len(cats)} catégories.']
    if err: rep += ['', '### ❌ À corriger'] + ['- ' + e for e in err]
    if warn: rep += ['', f'### ⚠️ À vérifier ({len(warn)})'] + ['- ' + w for w in warn[:120]]
    if not err: rep += ['', '✅ Aucune erreur bloquante.']
    print('\n'.join(rep))
    sm = os.environ.get('GITHUB_STEP_SUMMARY')
    if sm:
        with open(sm, 'a', encoding='utf-8') as f: f.write('\n'.join(rep) + '\n')
    sys.exit(1 if err else 0)


if __name__ == '__main__':
    main()
