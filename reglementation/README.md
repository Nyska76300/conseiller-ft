# Veille réglementaire

`maj.json` contient les mises à jour réglementaires publiées par la tâche planifiée de veille.

Cycle de vie d'une mise à jour :

1. La veille ajoute une entrée dans `updates` (identifiant unique, date, titre, sources, explications, valeurs du barème à modifier).
2. Le site l'applique **immédiatement pour l'administrateur** (bandeau « en attente de validation »).
3. L'administrateur la relit dans **Espace administrateur → Veille réglementaire** et clique sur **Diffuser aux conseillers** (ou **Écarter**).
4. La décision est enregistrée dans Supabase (`shared_templates`, ligne `__ft_regs`) : les conseillers reçoivent alors la mise à jour (barème appliqué + annonce).

Format d'une entrée :

```json
{
  "id": "2027-07-01-revalorisation-are",
  "date": "2027-06-25",
  "titre": "Revalorisation de l'ARE au 1er juillet 2027",
  "effet": "2027-07-01",
  "resume": ["Partie fixe : 13,18 € → 13,40 €", "Allocation minimale : 32,13 € → 32,66 €"],
  "sources": [{ "label": "Unédic : revalorisation au 1er juillet 2027", "url": "https://www.unedic.org/..." }],
  "bareme": { "are.partieFixe": 13.40, "are.min": 32.66, "verifie": "25/06/2027" },
  "code": ""
}
```

- `bareme` : chemins dans l'objet `BAREME` de `index.html` (notation pointée) et nouvelles valeurs.
- `code` : si la règle nouvelle demande une modification du code (nouveau calcul, nouvelle fiche), la veille la prépare dans une branche `veille/<id>` et indique ici son nom ; la fusion se fait après validation.
