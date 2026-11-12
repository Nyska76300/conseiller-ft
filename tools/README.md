# Outils de maintenance

`tailwind-3.4.17-runtime.html` : le compilateur Tailwind qui était intégré à la page.
Il n'est plus chargé par le site : les styles sont précompilés dans `<style id="tw-static">` (index.html).
Pour utiliser une nouvelle classe Tailwind, régénérer ce bloc : remettre temporairement ce script à la place
de `<script>window.tailwind={config:{}};</script>`, ouvrir la page, copier la feuille générée.

`regression.py` : tests de non-régression (tous les outils, thèmes sombre et clair, ordinateur et téléphone,
cas de contrôle des calculs, barre du haut). À lancer avant chaque mise en ligne : `python3 tools/regression.py`.
