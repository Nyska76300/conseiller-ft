# Veille réglementaire

`maj.json` contient les mises à jour réglementaires publiées par la tâche planifiée de veille.

Cycle de vie d'une mise à jour :

1. La veille ajoute une entrée dans `updates` (identifiant unique, date, titre, sources, explications, valeurs du barème à modifier).
2. Le site l'applique **immédiatement pour l'administrateur** (bandeau « en attente de validation »).
3. L'administrateur la relit dans **Espace administrateur → Veille réglementaire** et clique sur **Diffuser aux conseillers** (ou **Écarter**).
4. La décision est enregistrée dans Supabase (`shared_templates`, ligne `__ft_regs`) : les conseillers reçoivent alors la mise à jour (barème appliqué + annonce).

`verifie_le` (AAAA-MM-JJ) : date de la dernière vérification par la veille, mise à jour à chaque passage même sans changement. Elle alimente la pastille « À jour » en haut du site (verte si la vérification date de moins de 15 jours).

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

## Paramètres contrôlés (objet `BAREME` de `index.html`)

Toute valeur réglementaire chiffrée utilisée par un simulateur est rangée dans `BAREME`. Une mise à jour publiée dans `maj.json` peut donc la modifier sans toucher au code, par son chemin pointé :

| Chemin | Contenu | Échéance habituelle |
|---|---|---|
| `are.*` | Partie fixe, minimum, plancher formation (`are.formation`, aussi plancher AREF), plafond, taux | 1er juillet |
| `degr.*` | Dégressivité : coefficient, seuil, âge, mois de début | Convention / décret |
| `duree.*` | Durées min./max. par âge, coefficient, rupture conventionnelle (`duree.rci`) | Convention / décret |
| `affiliation.*` | Jours / heures d'affiliation, saisonniers | Convention |
| `differe.*` | Délai d'attente, congés payés, supra-légal | Convention |
| `cumul.*` | Cumul salaire, ARCE, base de mensualisation | Convention |
| `csp.*` | ASP minimale, taux, IDR, prime | Convention CSP |
| `retenues.*` | CSG, CRDS, assiette, retraite complémentaire, seuils | 1er janvier / 1er juillet |
| `solidarite.*` | ASS, ATA | 1er avril |
| `ati.*` | Forfait, plancher (et Mayotte), seuil de revenus, durée | Décret / 1er avril |
| `rff.plafondMensuel` | Plafond mensuel de la RFF | France Travail |
| `indu.*` | Seuil de non-récupération, prescription (cas général / fraude) | Code du travail |
| `invalidite.*` | Montants min./max. par catégorie, conditions d'heures et de Smic | 1er avril |
| `cns.*` | Cumul activité non salariée : déduction, plafond, avance, abattements, minimum BNC | Convention |
| `generations` | Âges et trimestres de retraite par génération | LFSS / réforme |

Chaque section porte un champ `verifie` (JJ/MM/AAAA) à mettre à jour dans la même entrée de `maj.json` quand la section est modifiée (ex. `"ati.verifie": "02/04/2027"`).
