# Outils de maintenance

`tailwind-3.4.17-runtime.html` : le compilateur Tailwind qui était intégré à la page.
Il n'est plus chargé par le site : les styles sont précompilés dans `assets/css/tailwind.css`.
Pour utiliser une nouvelle classe Tailwind, régénérer ce bloc : remettre temporairement ce script à la place
de `<script>window.tailwind={config:{}};</script>`, ouvrir la page, copier la feuille générée.

`regression.py` : tests de non-régression (tous les outils, thèmes sombre et clair, ordinateur et téléphone,
cas de contrôle des calculs, barre du haut). À lancer avant chaque mise en ligne : `python3 tools/regression.py`.

## Organisation du site

- `index.html` : la structure des pages (HTML) ;
- `assets/css/` : `base.css`, `tailwind.css` (précompilé), `app.css` — chargés dans cet ordre ;
- `assets/js/NN-nom.js` : les scripts, chargés dans l'ordre de leur numéro (chacun complète les précédents) ;
  le barème (`BAREME`) et les modèles officiels sont dans `06-coeur-baremes-modeles.js`, les nouveautés dans `43-nouveautes.js`.
- À chaque mise à jour : `python3 tools/version.py AAAA-MM-JJ.N` (change la version et force le rechargement des fichiers).

## contrast.py — lisibilité des thèmes
`python3 tools/contrast.py [--strict]` : mesure le contraste texte/fond sur les pages principales pour les 6 thèmes,
en sombre et en clair. Un thème ne doit jamais être moins lisible qu'Océan (sinon échec en `--strict`, utilisé par la CI).

## visual.py — vérifications visuelles
`python3 tools/visual.py [sortie] [référence]` : captures des pages clés (ordinateur sombre, téléphone clair, horloge figée).
Échoue sur erreur JavaScript, image cassée ou élément essentiel manquant ; signale les icônes non dessinées ;
compare aux captures du passage précédent (cache GitHub) et joint les images de différences à l'exécution.

## mails.py — relecture des modèles de mails
`python3 tools/mails.py [--online]` : vérifie chaque modèle officiel de CVM Direct (champs {{…}} tous définis et utilisés,
libellés clairs, titres et identifiants uniques, catégories existantes, fautes connues, mots répétés). Signale aussi les dates
ou montants écrits en dur, la ponctuation douteuse et, avec `--online`, les liens qui ne répondent pas.
