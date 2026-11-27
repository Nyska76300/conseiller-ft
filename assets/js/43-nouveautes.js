(function () {
  /* Nouveautés : ajouter une entrée en haut de la liste à chaque mise à jour
     (v = même valeur que la balise ft-version). */
  var NEWS = [
    { v: '2026-11-27.21', date: '27/11/2026', items: [
      'Fond pastel doux aux tons bleutés (bleu, lavande, bleu ciel) sur tout le site en mode clair, avec un en-tête légèrement transparent et des cartes plus arrondies.'
    ] },
    { v: '2026-11-27.20', date: '27/11/2026', items: [
      'Accueil : l’heure s’affiche en grand, sans cadre, avec les secondes.'
    ] },
    { v: '2026-11-27.19', date: '27/11/2026', items: [
      'Style harmonisé dans tous les outils : boutons secondaires, petites étiquettes et champs de saisie identiques partout (coins arrondis, contour bleu quand on écrit, rouge en cas d’erreur).',
      '« Simulateur / Règles et calculs » rejoint la ligne des sous-onglets, à droite, sous forme de sélecteur : une ligne de moins en haut de chaque outil.',
      'Résultats : chiffres clés en grand et cadres identiques d’un simulateur à l’autre.',
      'Téléphone : les sous-onglets d’une rubrique deviennent un menu déroulant compact.',
      'Pied de page réduit à la version et un bouton « i » qui affiche les sources et la date de vérification.',
      'Mode sombre : plus de bloc blanc isolé dans les outils.'
    ] },
    { v: '2026-11-27.18', date: '27/11/2026', items: [
      'Barre du haut : le bouton du compte est tout à droite. Nouveau réglage « Organiser la barre du haut » (menu du compte ou recherche) : changez l’ordre des boutons avec les flèches et masquez ceux qui ne servent pas ; le choix suit votre compte.'
    ] },
    { v: '2026-11-27.17', date: '27/11/2026', items: [
      'Accueil : sous la barre de recherche, seul « Que faire si… » reste (Nouveau dossier est dans la carte « Dossier en cours », les mails favoris et plus utilisés dans l’onglet Mails).'
    ] },
    { v: '2026-11-27.16', date: '27/11/2026', items: [
      'CVM Direct, menus déroulants : les mois sont regroupés par année (année la plus récente en haut, mois de janvier à décembre) ; toutes les autres listes (motifs, type d’admission, événement, choix définis par l’administrateur…) sont par ordre alphabétique.'
    ] },
    { v: '2026-11-27.15', date: '27/11/2026', items: [
      'Accueil : les icônes des outils ont la même couleur que dans les onglets (rouge pour Démission et Trop-perçu, vert pour Complément ARE…).',
      'En-tête : le lien « Changer d’outil » sous le titre est retiré (les onglets le remplacent).',
      'CVM Direct : une seule base de mails, sans le filtre Tous / Communs / Mes modèles ni la séparation « Mes modèles » / « Modèles communs » ; le bouton « Copier le texte » passe à gauche de la barre du message.'
    ] },
    { v: '2026-11-27.14', date: '27/11/2026', items: [
      'Chaque outil a sa couleur selon son sens, dans les menus au survol et la ligne des sous-onglets : rouge pour Démission, Trop-perçu, Sanctions et Calendrier ; vert pour Complément ARE, ARCE et SJR ; orange pour Rupture conventionnelle, CFD, ICCP et Échéances ; violet pour Pension d’invalidité et Comparer… Le survol et l’onglet ouvert prennent la couleur de l’outil.'
    ] },
    { v: '2026-11-27.13', date: '27/11/2026', items: [
      'Accueil : une seule barre de recherche (celle de l’en-tête s’efface sur l’accueil), plus grande et ombrée ; « Bonjour » en grand avec « Que cherchez-vous ? » en dessous ; heure sans les secondes et date dans un cadre discret.',
      'Onglets : thèmes rangés par ordre alphabétique, dans le menu au survol comme dans la ligne des sous-onglets.',
      'Repères : la rubrique « Ouverture de droits » s’appelle « Droits », comme l’onglet.'
    ] },
    { v: '2026-11-27.12', date: '27/11/2026', items: [
      'Onglets « Autres » et « Favoris » : ils s’ouvrent au clic sur tous les écrans (sur un écran tactile ou un ordinateur avec écran tactile, le menu se refermait tout de suite).',
      'Chaque rubrique reprend exactement les outils du menu latéral, dans la ligne des sous-onglets comme dans le menu au survol (Références : Calendrier des versements, Comparer deux scénarios, Échéances, Journal ; Situations : ASS et ATA, AREF et RFF, frontaliers, sanctions, ATI…). Tous les titres restent visibles, sur deux lignes si besoin.'
    ] },
    { v: '2026-11-27.11', date: '27/11/2026', items: [
      'Onglet « Autres » complet : il reprend tous les outils qui ne sont rangés dans aucune rubrique (Ma journée, Questions fréquentes, Pièces justificatives, Pense-bête d’entretien, Mode formation…), même si le titre « Autres outils » du menu a été renommé.',
      'Sous-onglets d’une rubrique : une icône colorée devant chaque titre, sur une seule ligne.'
    ] },
    { v: '2026-11-27.10', date: '27/11/2026', items: [
      'En-tête : la roue des paramètres et « Mes données » passent dans le menu du compte (bouton « Se connecter » ou vos initiales), même sans être connecté.',
      'Onglet « Autres » : un clic l’ouvre bien (il se refermait si le menu était déjà ouvert au survol). Les onglets tiennent sur une ligne même sur un écran plus étroit (noms courts : Fin de droits, Situations, Références).',
      'Icônes plus proches de l’iPhone : dégradé vertical, reflet et ombre douce ; boutons de l’en-tête en couleur fondue.'
    ] },
    { v: '2026-11-27.9', date: '27/11/2026', items: [
      'Onglet « Autres » ajouté au bout de la ligne d’onglets : Ma journée, Questions fréquentes, Pièces justificatives, Pense-bête d’entretien, Mode formation.',
      'Les menus des rubriques reprennent exactement les outils du menu latéral (par exemple Situations particulières : ASS et ATA, AREF et RFF, frontaliers, sanctions, ATI ; Références : calendrier, comparer, échéances, journal).'
    ] },
    { v: '2026-11-27.8', date: '27/11/2026', items: [
      'Menus des onglets : chaque thème et chaque catégorie de mails a son icône colorée.',
      'Sous-onglets d’une rubrique (Parcours dossier, Conditions et ARE…) plus gros, plus lisibles et plus espacés.',
      'Icônes de l’en-tête en couleur : post-it en jaune, Repères en orange, lecture vocale en violet, dates en bleu, calculatrice en vert, thème en indigo (en jaune la nuit) ; elles se remplissent de leur couleur au survol.'
    ] },
    { v: '2026-11-27.7', date: '27/11/2026', items: [
      'Style institutionnel plus vivant, en clair comme en sombre : fond en dégradé doux avec halo bleu, cartes légèrement dégradées et ombrées qui se soulèvent au survol, boutons principaux en dégradé bleu, icônes avec reflet façon iPhone, en-tête et onglets ombrés.'
    ] },
    { v: '2026-11-27.6', date: '27/11/2026', items: [
      'Icônes façon iOS harmonisées dans tout le site : accueil (cartes, simulateurs, mails favoris, liens), titres des outils et volet Repères ; étoile sur « Mes favoris ».',
      'Menus des onglets de rubriques complets : « Pension d’invalidité » revient dans Droits (elle avait disparu de la barre après le changement de nom).',
      'Correction : en revenant de « Règles et calculs » vers « Simulateur », le simulateur s’affiche de nouveau.',
      'Correction : une catégorie de mails sans nom peut être supprimée ; les catégories vides sans nom sont retirées automatiquement.'
    ] },
    { v: '2026-11-27.5', date: '27/11/2026', items: [
      'La rubrique « Ouverture de droits » s’appelle désormais « Droits ».',
      'En-tête : clair / sombre, calculatrice et dates reviennent en icônes, toutes de la même taille ; « Recharger la page » passe dans Paramètres ; le bouton Menu disparaît sur ordinateur (les onglets le remplacent).',
      'Icônes façon iOS (carré arrondi coloré, dessin blanc) sur les onglets de rubriques et sur les catégories et modèles de mails.',
      'Accueil : quatre actions rapides (Nouveau dossier, Mails favoris, Plus utilisés, Que faire si…), chiffres clés sur une ligne discrète, simulateurs en liste simple par rubrique.',
      'Simulateurs : le bloc de résultats reste visible à droite en faisant défiler, avec un trait bleu ; couleurs d’état identiques partout (vert éligible, rouge non éligible, orange à vérifier) ; chiffres alignés.',
      'Règles et calculs : même plan partout (Conditions et règles, Calcul, Sources) avec un sommaire collant à gauche.',
      'Impression : en-tête sobre « France Travail · Espace Conseiller » avec la date, sans les menus.',
      'Correction : la touche « / » ne lance plus la recherche quand la calculatrice est ouverte (elle sert à diviser).',
      'Correction : une catégorie de mails supprimée ne revient plus à la synchronisation suivante.'
    ] },
    { v: '2026-11-27.4', date: '27/11/2026', items: [
      'Style institutionnel : le mode sombre revient (bouton clair / sombre, Outils ou Paramètres), en version sobre : fond bleu nuit uni, cartes plates, sans dégradés ni lueurs.',
      'Les onglets de rubriques reprennent les mêmes noms que le menu, y compris les noms modifiés par l’administrateur.'
    ] },
    { v: '2026-11-27.3', date: '27/11/2026', items: [
      'Style institutionnel : l’onglet « Accueil » est remplacé par « Favoris », qui déroule vos outils et mails favoris (avec « Choisir mes favoris » et un accès à la page d’accueil). L’accueil reste aussi sur le bouton maison de l’en-tête.',
      'Au survol d’une rubrique, un menu déroule ses thèmes : les catégories de mails pour « Mails » (avec Favoris, SAE et Plus utilisés), les onglets pour Ouverture de droits, ANS, Fin de droits, Situations particulières et Références. Clavier : flèche ↓ sur un onglet pour ouvrir le menu.'
    ] },
    { v: '2026-11-27.2', date: '27/11/2026', items: [
      'Nouveau style d’interface « Institutionnel », en test : fond gris très clair, cartes blanches, un seul bleu, sans dégradés ni effets de verre.',
      'Les rubriques (Accueil, Mails, Ouverture de droits, ANS, Fin de droits, Situations particulières, Références, Ma journée) sont en onglets sous l’en-tête ; l’onglet ouvert est souligné en bleu. Les sous-onglets d’une rubrique sont soulignés de la même façon.',
      'Pour revenir à l’apparence d’avant : Paramètres › Style d’interface › « Thème classique », ou Outils › Thème classique.'
    ] },
    { v: '2026-11-27.1', date: '27/11/2026', items: [
      'CVM Direct : liste des modèles plus compacte (deux fois plus de mails visibles sans faire défiler). Le titre, le début du mail et le nombre de champs tiennent sur deux lignes.',
      'Administrateurs : un bouton de réglage apparaît à côté de chaque champ d’un mail. Il permet de choisir « Texte libre » ou « Menu déroulant », de rédiger les choix (libellé affiché et texte inséré dans le mail), de fixer le choix par défaut et de garder ou non « Autre (texte libre) ». Le réglage vaut pour tous les modèles qui utilisent ce champ et pour tous les conseillers ; « Revenir au réglage du site » l’annule.'
    ] },
    { v: '2026-11-26.21', date: '26/11/2026', items: [
      'Recherche des mails plus précise : un sigle court (SAE, ASS, ARE, RIB…) ne trouve plus les mots qui le contiennent (« ass » ne trouve plus « assurance »).',
      'Les mails où le mot cherché n’apparaît que dans le texte ou les mots-clés sont repliés sous « Afficher N autres résultats », après les mails dont le titre correspond.'
    ] },
    { v: '2026-11-26.20', date: '26/11/2026', items: [
      'CVM Direct : deux nouvelles rubriques sous Favoris. « SAE » regroupe tous les mails dont le titre contient SAE (modèles officiels et les vôtres). « Plus utilisés » affiche vos 10 mails les plus copiés sur ce poste, du plus copié au moins copié.',
      'Le modèle « Admission définitive ou provisoire » s’appelle désormais « SAE : admission définitive ou provisoire ».'
    ] },
    { v: '2026-11-26.19', date: '26/11/2026', items: [
      'CVM Direct : filtres rapides au-dessus de la liste : Tous, Prêts à copier, À remplir, Brouillons (avec le nombre de modèles).',
      'Flèches ↑ et ↓ du clavier : passent au modèle précédent ou suivant (quand vous n’êtes pas dans un champ).',
      'Menus déroulants préremplis avec la réponse la plus courante (3949 : pas besoin de rendez-vous ; admission : définitive ; événement : travail). Vous pouvez toujours changer.',
      'Bouton « Sauvegarde » au-dessus de la liste : exporter ou restaurer vos modèles, catégories et réglages dans un fichier.',
      'Catégories vides signalées dans la colonne de gauche, avec « Supprimer » ou « Garder ».',
      'Publication d’un modèle commun : le site prévient si le titre existe déjà, si la catégorie n’est pas officielle ou si une accolade est mal fermée.',
      'Formule de fin : à régler dans Paramètres (ou via la recherche). Elle est ajoutée automatiquement à chaque mail copié, sauf s’il la contient déjà ; un rappel s’affiche sous l’aperçu.'
    ] },
    { v: '2026-11-26.18', date: '26/11/2026', items: [
      'CVM Direct : chaque modèle de la liste affiche de nouveau le début du mail (2 lignes, champs surlignés) et le nombre de champs à remplir (ou « Prêt à copier »). Les cartes sont plus aérées.'
    ] },
    { v: '2026-11-26.17', date: '26/11/2026', items: [
      'Correction : la catégorie que vous donnez à un modèle (en le modifiant, en renommant ou en supprimant une catégorie) est désormais conservée. Avant, la mise à jour des modèles communs ou officiels la remettait à l’ancienne valeur à chaque chargement. Vos modifications d’un modèle commun faites après sa publication sont aussi gardées.'
    ] },
    { v: '2026-11-26.16', date: '26/11/2026', items: [
      'CVM Direct : retour à la disposition d’avant, avec la liste des modèles au centre et le mail ouvert en permanence à droite (fin du panneau coulissant et des tuiles). Les boutons « Brouillons » et « Plus utilisés » restent au-dessus de la liste.'
    ] },
    { v: '2026-11-26.15', date: '26/11/2026', items: [
      'Modèles renommés pour des titres plus clairs (ex. « Choix entre ARE mensuelle et ARCE », « Complément ARE : principe » / « Complément ARE : calcul du montant », « Admission définitive ou provisoire », « Embauche : déclaration préalable (DPAE) »). Les modèles que vous avez modifiés gardent leur titre.',
      '« Pas besoin de RDV » et « N’ayant pas pu vous joindre » ne font plus qu’un : « Appeler le 3949 : pas de RDV ou injoignable », avec un menu pour choisir la situation.',
      'ARCE et maintien, Complément ARE : bouton « Comparer deux scénarios » en haut de l’onglet.',
      'Schémas : retirés du menu, ils s’ouvrent depuis le volet Repères (et restent dans la recherche et dans Références et calculs).'
    ] },
    { v: '2026-11-26.14', date: '26/11/2026', items: [
      'Barre du haut allégée : Dates, Calculatrice, Mode clair / sombre et Recharger sont regroupés dans le bouton « Outils ». La recherche retrouve de la place.',
      'Menu : champ « Filtrer les outils… » en haut (Entrée ouvre le premier résultat) ; rubriques repliées par défaut, sauf celle de l’outil ouvert ; un clic sur une rubrique l’ouvre ou la ferme, et le choix est mémorisé.',
      'Mails : menus déroulants pour les mois (« septembre 2026 »), le type d’admission (définitive ou provisoire) et l’événement déclaré par erreur, avec un choix « Autre » en texte libre.',
      'CVM Direct : étiquette « ✎ brouillon » sur les modèles dont la saisie est en cours et bouton « Brouillons » pour n’afficher qu’eux ; bouton « Plus utilisés » qui liste vos modèles les plus copiés sur cet appareil, avec l’étoile pour les mettre en favoris.',
      'Post-it : jusqu’à 6 notes (onglets 1, 2, 3… et +), avec Copier, Envoyer par mail et Effacer.',
      'Phrase d’introduction des outils limitée à une ligne : un clic l’affiche en entier.',
      'Nettoyage : suppression du code de l’ancien simulateur Cumul CNS, du mode entretien et de la vue usager. Relecture automatique des mails renforcée (accolades orphelines, espaces doublés, textes presque identiques, listes à choix).'
    ] },
    { v: '2026-11-26.13', date: '26/11/2026', items: [
      'CVM Direct, affichage en liste : pastille de couleur de la catégorie et titre en gras, avec Modifier, Supprimer et Favori juste à droite du titre ; aperçu du mail sur une ligne ; étiquettes dessous (catégorie, nombre de champs ou « prêt à copier », mots-clés).',
      'Motifs de trop-perçu classés par ordre alphabétique, dans l’onglet Trop-perçu comme dans les modèles CVM.'
    ] },
    { v: '2026-11-26.11', date: '26/11/2026', items: [
      'Trop-perçu : le menu des motifs reprend la liste de l’application (pénalité administrative, double paiement, activité salariée, IJSS transmises par la CPAM, trop-perçu de PAS…), sans les codes lettres. Même liste et même texte dans l’onglet et dans les modèles CVM.',
      'Trop-perçu : le mail de notification a son propre bouton en haut de l’onglet, « Mail : trop-perçu notifié », entre « Échéancier » et « Délais et recours » (aussi accessible par la recherche).'
    ] },
    { v: '2026-11-26.10', date: '26/11/2026', items: [
      'Modèles de trop-perçu : le champ « Motif du trop-perçu » devient un menu déroulant avec les motifs de l’application (codes * à £). Le mail s’adapte au motif choisi, par exemple « correspondant à une activité professionnelle non déclarée lors de vos actualisations ». Un choix « Autre motif » permet un texte libre.',
      'CVM Direct, liste : colonne des titres plus lisible (icône, titre en gras sur deux lignes, séparateur) ; le sous-titre disparaît quand il répète le titre.'
    ] },
    { v: '2026-11-26.9', date: '26/11/2026', items: [
      'Post-it dans la barre du haut : une note rapide sur papier jaune, enregistrée automatiquement sur cet appareil. Un point orange signale qu’une note est en cours.',
      '« Aide-mémo » devient « Repères » (seuils et montants clés, touche ?).',
      'Interprète vocal : icône seule dans la barre du haut (le nom reste en info-bulle).',
      'CVM Direct : titres centrés et soulignés dans la liste ; le panneau du mail s’ouvre avec un glissement, un fondu du fond et une apparition progressive du contenu.'
    ] },
    { v: '2026-11-26.8', date: '26/11/2026', items: [
      'CVM Direct : choix de l’affichage des modèles, « Liste » (par défaut : une ligne par modèle avec deux lignes d’aperçu) ou « Tuiles », à côté du nombre de résultats. Le choix est mémorisé sur cet appareil.'
    ] },
    { v: '2026-11-26.7', date: '26/11/2026', items: [
      'CVM Direct sur ordinateur : la liste des modèles prend toute la largeur, en cartes avec un aperçu des premières lignes du mail et les champs à remplir surlignés.',
      'Le mail s’ouvre dans un panneau qui arrive par la droite (champs, message complet, Copier). Échap ou la croix le referment ; Ctrl+↓ / Ctrl+↑ et Ctrl+Entrée fonctionnent toujours.',
      'Modèles sans champ à remplir : bouton « Copier » directement sur la carte, sans ouvrir le panneau.',
      '« Rédiger le mail CVM » depuis un simulateur ouvre directement le panneau du modèle choisi. Sur téléphone, rien ne change.'
    ] },
    { v: '2026-11-26.6', date: '26/11/2026', items: [
      'Cumul CNS repensé : bandeau d’explication, quatre chiffres clés (recevabilité, pièces, date limite, 40 % en jeu), puis trois cartes côte à côte (recevabilité, chiffres du dossier, pièces à joindre). Les cases cochées passent au vert.',
      'Toutes les pages utilisent mieux la largeur de l’écran : contenu élargi sur les grands écrans, formulaires sur deux colonnes (Délais, Conditions…), résultat qui reste visible en faisant défiler, Droits et passages sur deux colonnes, FAQ sur deux colonnes, listes de règles en colonnes.',
      'Rupture conventionnelle : durées outre-mer (608 et 913 jours) rappelées dans les simulateurs Conditions et Parcours dossier.',
      'Échéances : fin du cumul ASS et AAH au 1er janvier 2027.',
      'Veille automatique : un contrôle approfondi chaque début de mois vérifie aussi les seuils écrits dans les textes et simulateurs (65 / 88 / 121 jours, durées de rupture conventionnelle, etc.).'
    ] },
    { v: '2026-11-26.5', date: '26/11/2026', items: [
      'Cumul CNS : le simulateur laisse la place à l’onglet « Dossier IPR » pour la demande de poursuite exceptionnelle au-delà du plafond de 60 %. Il couvre la recevabilité (aucun revenu ni dividende, activité poursuivie, délai de 6 mois), les pièces à joindre selon la forme de l’activité, la date limite de dépôt et les 40 % en jeu. Il prépare aussi le mail des pièces manquantes et la note de transmission.',
      'Menu : repère « Nouveau » ou « Mis à jour » pendant 30 jours sur les outils récents, avec un point sur la rubrique et dans la barre des rubriques.',
      'Vérification complète du barème au regard de la réglementation en vigueur. Les montants sont confirmés : aucune revalorisation de l’ARE au 1er juillet 2026, ASS et ATA au 1er avril 2026, diviseur du différé spécifique 111,8, durées des ruptures conventionnelles depuis le 01/09/2026, primo-entrants, pension d’invalidité.',
      'Corrections : trimestres requis pour la retraite (169 pour fin 1961 et 1962). La démission d’un emploi repris après une perte involontaire passe à 88 jours travaillés ou 610 h (démissions depuis le 01/04/2025).',
      'Barre des rubriques collante : fond opaque, le contenu ne se voit plus à travers en faisant défiler la page.'
    ] },
    { v: '2026-11-26.4', date: '26/11/2026', items: [
      'Retour au menu précédent : il s’ouvre et se ferme avec le bouton « Menu », comme avant. L’accueil (tuiles, chiffres clés, cartes d’outils) et le pied de page restent.'
    ] },
    { v: '2026-11-26.3', date: '26/11/2026', items: [
      'Accueil : tuiles de chiffres (outils, modèles de mails, barème vérifié, revalorisation) et bandeau défilant des chiffres clés du barème (allocation minimale, partie fixe, dégressivité, ASS…). Le bandeau se met en pause au survol.',
      'Cartes d’outils de l’accueil : un sous-titre sous chaque outil et le badge « Nouveau ».',
      'Touche « / » : place le curseur dans la recherche.',
      'Pied de page sur ordinateur : sources (Unédic, France Travail, Service-public), date de vérification de la réglementation et mention « Indicatif ».'
    ] },
    { v: '2026-11-26.2', date: '26/11/2026', items: [
      'Barre du haut des simulateurs sur deux niveaux : les rubriques sur la première ligne, puis les onglets « Simulateur / Règles et calculs » en dessous, plus grands et d’une couleur distincte.'
    ] },
    { v: '2026-11-26.1', date: '26/11/2026', items: [
      'Complément ARE : nouveau bloc « Ce qui se cumule avec l’ARE » en trois colonnes (cumulable, sous conditions, non cumulable), avec la règle et la source officielle de chaque motif, et un filtre de recherche.',
      'Fenêtres « Mes données » (export des modèles) et « Modifier le modèle » : fond opaque et textes contrastés, en clair comme en sombre.'
    ] },
    { v: '2026-11-17.1', date: '17/11/2026', items: [
      'CVM : le bouton « Copier » ne peut plus planter si le réglage « Effacer après copie » est illisible.'
    ] },
    { v: '2026-11-16.2', date: '16/11/2026', items: [
      'Nouvel onglet « Pièces justificatives » (Autres outils) : les pièces à demander selon la situation, et le mail de demande prêt à copier ou à imprimer.',
      'Nouvel onglet « Calendrier des versements » (Références et calculs) : période d’actualisation, versement probable, jours fériés, jours ouvrés et jours indemnisés du mois, avec un message à l’allocataire.',
      'Nouvel onglet « Journal réglementaire » (Références et calculs) : date de la dernière vérification automatique, mises à jour publiées par la veille et changements intégrés au site.',
      'Nouvel onglet « Pense-bête d’entretien » (Autres outils) : les points à aborder selon le motif du rendez-vous, à cocher, avec une synthèse à copier. Rien n’est enregistré.',
      'Conditions et ARE : carte résumé en haut (allocation mensuelle, premier jour indemnisable, durée), frise des dates et détail du calcul repliable.',
      'En-têtes d’outils harmonisés : icône, titre et objectif, avec « Rédiger le mail CVM » et « Imprimer / PDF » directement dans l’en-tête. La fiche imprimée porte le logo et la date du barème.'
    ] },
    { v: '2026-11-16.1', date: '16/11/2026', items: [
      'Correction : « Copier le texte » dans CVM Direct ouvrait la fenêtre Paramètres au lieu de copier le mail.'
    ] },
    { v: '2026-11-13.59', date: '13/11/2026', items: [
      'Mails CVM vérifiés sur la réglementation en vigueur : affiliation 130 jours / 910 h (et non 182 jours), 36 mois à partir de 55 ans (et non 53), démission en cours d’indemnisation : 88 jours / 610 h depuis le 1er avril 2025, plafond RFF 775,65 €.',
      'Avant de copier un mail : alerte si une date est invalide ou dans le désordre (fin avant début), ou si un montant paraît anormal.',
      'Du simulateur au mail : bouton « Rédiger le mail CVM » dans les outils, qui ouvre le mail correspondant déjà rempli avec les résultats.',
      'Recherche des mails : dans le texte et les champs, avec les sigles du métier (ICCP ↔ congés payés, DV ↔ démission, TP ↔ trop-perçu…).',
      'Raccourcis CVM : Entrée = champ suivant, Ctrl+Entrée = copier, Ctrl+↓ / ↑ = mail suivant / précédent.'
    ] },
    { v: '2026-11-13.58', date: '13/11/2026', items: [
      'CVM : les mails n’ont plus de dates, montants ou durées d’anciens dossiers dans le texte : ce sont des champs à compléter.',
      'CVM : champs intelligents — saisie rapide des dates (01082026 → 01/08/2026), calendrier, alerte si la date est invalide, montants mis en forme, et calculs automatiques (délai d’attente, 1er jour indemnisable, capital ARCE, totaux…). Un champ calculé reste modifiable.',
      'CVM : libellés des champs en entier, et un champ vide apparaît dans le mail avec son libellé.',
      'CVM : catégories regroupées (18 au lieu de 28, plus de « Divers ») et fautes corrigées.',
      'Les mails officiels se mettent à jour automatiquement sur votre poste (sauf ceux que vous avez modifiés).',
      'Thème clair : textes secondaires plus lisibles.'
    ] },
    { v: '2026-11-13.57', date: '13/11/2026', items: [
      'CVM Direct : les champs à compléter portent maintenant un nom clair selon le mail (ex. « Date de la démission », « Montant du trop-perçu », « 1er jour indemnisable ») au lieu de « DATE (2) », « X » ou d’une valeur d’exemple.',
      'Les montants différents d’un même mail ont chacun leur champ (ex. régularisation de trop-perçu sur deux mois).',
      'Ménage : 6 mails en double ou dépassés retirés (109 → 103 modèles).'
    ] },
    { v: '2026-11-13.56', date: '13/11/2026', items: [
      'Côte à côte : chaque outil défile bien jusqu’en bas.',
      'Côte à côte optimisé : chaque outil se met en page selon sa demi-largeur (colonnes empilées, plus rien de coupé). CVM Direct : catégories en icônes, liste resserrée, le mail garde la place.'
    ] },
    { v: '2026-11-13.54', date: '13/11/2026', items: [
      'Deux outils côte à côte sur grand écran : bouton « À côté » sous le titre (ou Ctrl+K « côte à côte »). Le second outil reste ouvert quand vous changez d’outil à gauche.',
      'Thèmes de couleurs : textes et boutons aussi lisibles que dans le thème Océan, en clair comme en sombre.',
      'Correction : après un rechargement sur le mode formation, le comparateur ou la FAQ, la page revenait mal.'
    ] },
    { v: '2026-11-13.52', date: '13/11/2026', items: [
      'Menu et changements d’onglet plus fluides : les icônes ne sont plus toutes redessinées à chaque action.',
      'Thèmes de couleurs en mode sombre redessinés : fond profond et discret, sans grande tache de couleur.',
      'Thèmes de couleurs revus : fonds sobres légèrement teintés, la couleur est réservée aux boutons, icônes et liens.',
      'Plus d’une centaine d’icônes supplémentaires pour personnaliser les outils et les rubriques.',
      'Mon compte : le bouton Enregistrer reste visible même sur un petit écran.',
      'Vue usager retirée.',
      'Le mode entretien (Ctrl+J) est retiré.',
      'Affichage allégé appliqué pour tous : défilement fluide partout.',
      'Nouvel accueil : à gauche dossier, liens et repères ; au centre les outils ; à droite Mes favoris, CVM favoris et Quoi de neuf.',
      'Accueil épuré : plus de tuiles étirées avec du vide, la tuile « Reprendre » est retirée.',
      'Site beaucoup plus fluide : une boucle cachée redessinait l’accueil et le menu plusieurs fois par seconde, c’est corrigé. Défilement et survol allégés.',
    ] },
    { v: '2026-11-13.41', date: '13/11/2026', items: [
      'Que faire si… : décrivez une situation (« reprise d’un CDD », « trop-perçu contesté »…) dans la recherche ou depuis l’accueil : le bon outil, le bon mail et le point clé s’affichent.',
      'Comparer deux scénarios : reprise d’emploi à deux salaires, ARE ou ARCE, deux SJR, côte à côte avec l’écart (menu, Références et calculs).',
      'Sigles expliqués : dans les outils, survolez ou touchez un sigle souligné (SJR, PJI, ICCP…) pour afficher sa définition.',
      'Rappels dans l’agenda : un bouton 📅 ajoute un rappel au calendrier de l’iPhone ou à Outlook.',
      'Chargement plus rapide : les polices et les icônes ne bloquent plus l’affichage de la page.'
    ] },
    { v: '2026-11-13.40', date: '13/11/2026', items: [
      'Mises à jour automatiques : les nouvelles versions du site s’installent toutes seules, au premier moment calme (aucune saisie en cours) ; l’outil ouvert, les champs remplis et la position dans la page sont conservés.'
    ] },
    { v: '2026-11-13.39', date: '13/11/2026', items: [
      'Mon activité : dans le menu de votre compte, vos outils et mails les plus utilisés, votre activité par semaine et vos scores de formation (visibles par vous seul).',
      'Thème automatique : dans Paramètres, « Auto » suit le réglage de votre appareil, « Horaire » passe en clair de 7 h à 19 h et en sombre le soir.',
      'Relief des tuiles : les tuiles et boutons d’outils ont désormais toujours un effet de profondeur, réglable de léger à très marqué dans Paramètres.',
      'Raccourcis de l’appli : sur Android et sur ordinateur, un appui long (ou clic droit) sur l’icône de l’appli installée propose Mails, Simulateurs, Mes rappels et Rechercher.'
    ] },
    { v: '2026-11-13.38', date: '13/11/2026', items: [
      'Paramètres → Affichage : deux curseurs sur 100 pour régler l’intensité des néons des icônes (0 = aucun) et l’effet de profondeur des tuiles (ombres, relief, légère élévation au survol).'
    ] },
    { v: '2026-11-13.37', date: '13/11/2026', items: [
      'Couleurs : choisissez un thème de couleurs (Océan, Émeraude, Sarcelle, Améthyste, Framboise, Ardoise) dans Paramètres, en mode sombre comme en mode clair.',
      'Menu du compte allégé : Mon compte, Paramètres, Mes rappels et Se déconnecter ; notifications, visite guidée, confidentialité et synchronisation sont dans Paramètres.'
    ] },
    { v: '2026-11-13.36', date: '13/11/2026', items: [
      'Annonces par agence : un message peut désormais concerner une seule agence ; il ne s’affiche que pour ses conseillers.',
      'Résumé du mois : le 1er de chaque mois, une notification récapitule les nouveautés du site et les changements réglementaires du mois écoulé (si les notifications sont activées).'
    ] },
    { v: '2026-11-13.35', date: '13/11/2026', items: [
      'Paramètres : thème, taille du texte, contraste, lecture facilitée, animations, page d’ouverture, notifications… réunis dans une seule fenêtre (icône ⚙ en haut, menu du compte ou menu « ⋯ » sur téléphone).',
      'Aide-mémo : l’ancien bouton « Repères » s’appelle maintenant « Aide-mémo » ; il se ferme en touchant à côté du volet.',
      'Mode formation : chaque calcul est détaillé pas à pas, et le récapitulatif de fin reprend toutes les questions avec votre réponse, la bonne réponse et l’explication.',
      'Profil : le prénom, le nom et l’agence de rattachement sont désormais obligatoires (demandés une fois à la connexion s’ils manquent).',
      'Accueil : « Derniers calculs » s’affiche juste sous « Mes favoris ».'
    ] },
    { v: '2026-11-13.33', date: '13/11/2026', items: [
      'Mes rappels : programmez un rappel (« relancer dans 15 jours ») depuis le menu de votre compte, la recherche ou le bouton « ⏰ Rappel » sous chaque mail généré ; vous recevez une notification à la date choisie, même appli fermée. Les prochains rappels s’affichent sur l’accueil.',
      'Mails pré-remplis : dans la page Mails, « Remplir les champs vides » reprend les montants, dates et durées de votre dernier calcul (et chaque champ propose les valeurs du calcul). Vérifiez toujours avant d’envoyer.',
      'Mode formation : un quiz de 10 questions sur les règles et les calculs, par thème, pour s’entraîner ou réviser (menu, rubrique Autres outils).',
      'Hors ligne : tout le site est gardé sur l’appareil dès la première visite ; sans réseau, simulateurs et modèles restent disponibles et un repère l’indique.'
    ] },
    { v: '2026-11-13.31', date: '13/11/2026', items: [
      'Notifications : elles arrivent maintenant même quand le site ou l’appli est fermé (nouveautés, annonces, mises à jour réglementaires). Activez-les depuis le menu de votre compte ; sur iPhone, depuis l’appli installée sur l’écran d’accueil.'
    ] },
    { v: '2026-11-13.30', date: '13/11/2026', items: [
      'Chargement plus rapide : le site est découpé en fichiers que votre navigateur garde en mémoire ; à chaque mise à jour, seuls les fichiers modifiés sont téléchargés.'
    ] },
    { v: '2026-11-13.28', date: '13/11/2026', items: [
      'Nouvel outil « Fin de droits : ASS et ATA » (Situations particulières) : conditions (5 ans sur 10, réduction par enfant), plafonds seul et couple, montant différentiel, renouvellement, cumul 3 mois, repères ATA, avec mail à l’allocataire.',
      'Accueil : « Derniers calculs » garde vos 10 dernières simulations sur ce poste (sans nom d’allocataire) ; « Reprendre » rouvre l’outil avec les mêmes valeurs.',
      'Accessibilité : chaque champ est relié à son libellé, lien « Aller au contenu » au clavier (Tab), contour visible sur l’élément actif, textes gris plus contrastés, animations réduites si votre appareil le demande.'
    ] },
    { v: '2026-11-13.25', date: '13/11/2026', items: [
      'Téléphone : les onglets des rubriques défilent sur une ligne et les modes (Simulateur / Règles et calculs) passent dessous en entier ; les sélecteurs (CSP, trop-perçu…) s’affichent sur deux lignes au lieu d’être coupés ; les listes déroulantes ne débordent plus.',
      'Application installée : elle se met à jour toute seule à l’ouverture quand une nouvelle version est disponible.'
    ] },
    { v: '2026-11-13.24', date: '13/11/2026', items: [
      'Visite guidée : à la première connexion, six étapes présentent l’essentiel (favoris, menu, mails, interprète, recherche). À revoir depuis le menu de votre compte.',
      'Notifications : activez-les depuis le menu de votre compte (ou « ⋯ » sur téléphone) pour être prévenu des nouveautés, des annonces et des mises à jour réglementaires ; un clic ouvre directement le bon endroit.',
      'Quoi de neuf : chaque nouveauté a maintenant un raccourci « Ouvrir › » vers l’outil concerné.',
      'Confidentialité : une page explique ce qui est enregistré (menu du compte ou écran de connexion).'
    ] },
    { v: '2026-11-13.23', date: '13/11/2026', items: [
      'Mails générés : mise en page corrigée dans « Conditions et ARE » et la CSP (le mail s’affichait dans une colonne très étroite et passait sous les résultats). Le cadre du mail s’agrandit maintenant selon la longueur du texte, et les boutons ne se coupent plus sur deux lignes.'
    ] },
    { v: '2026-11-13.21', date: '13/11/2026', items: [
      'Apparence : les icônes ont un léger effet néon, et l’étoile « Mes favoris » de l’accueil est dorée.'
    ] },
    { v: '2026-11-13.19', date: '13/11/2026', items: [
      'Fiabilité : les montants et seuils de l’ATI, de la RFF, des trop-perçus, de la pension d’invalidité et du cumul avec une activité non salariée sont désormais tenus dans le barème central, comme ceux de l’ARE. Ils sont contrôlés par la veille réglementaire hebdomadaire et mis à jour partout en même temps.'
    ] },
    { v: '2026-11-13.16', date: '13/11/2026', items: [
      '« Menu Outils » s’appelle désormais « Menu ».',
      'En haut, à côté de « Espace Conseiller » : une pastille verte « À jour » indique que la réglementation a été vérifiée par la veille automatique hebdomadaire (date au survol).'
    ] },
    { v: '2026-11-13.13', date: '13/11/2026', items: [
      'Mon compte : menu du compte (rond avec vos initiales) → « Mon compte » pour modifier votre prénom, votre nom, votre adresse e-mail ou votre mot de passe.',
      'Création de compte : le prénom et le nom sont demandés. Si votre compte n’a pas encore de nom, le site vous propose de le compléter.'
    ] },
    { v: '2026-11-13.12', date: '13/11/2026', items: [
      'Accueil : « Mes outils » devient « Mes favoris ». Vous pouvez y cocher vos outils, y compris CVM Direct.',
      'Menu : une étoile à côté de chaque outil le place dans « Favoris du menu », en haut sous CVM Direct (il quitte sa rubrique ; un nouveau clic l’y remet). Ces favoris sont indépendants de ceux de l’accueil et propres à votre compte.'
    ] },
    { v: '2026-11-13.10', date: '13/11/2026', items: [
      'Accueil, « Liens utiles » : maintenez un lien appuyé une demi-seconde (doigt ou souris) ; les liens se mettent à trembler comme sur iPhone et vous pouvez le faire glisser à sa nouvelle place. La roue crantée donne accès aux mêmes réglages. « Terminer » pour sortir. L’ordre est enregistré dans votre compte.'
    ] },
    { v: '2026-11-13.6', date: '13/11/2026', items: [
      'Mails (CVM) : la liste sépare « Mes modèles » et les « Modèles communs », avec un sélecteur Tous / Communs / Mes modèles et le nombre de chaque.',
      'Veille réglementaire : quand un texte officiel change un montant ou une durée, le site est mis à jour et une fenêtre vous présente le changement et ses sources.'
    ] },
    { v: '2026-11-13.5', date: '13/11/2026', items: [
      'Schémas : les étapes du projet professionnel sont présentées en cartes lisibles (le texte ne déborde plus), et une flèche mal placée de l’arbre de décision a été corrigée.'
    ] },
    { v: '2026-11-13.4', date: '13/11/2026', items: [
      '« Mes outils » sur l’accueil sont désormais propres à chaque conseiller : ils sont enregistrés dans votre compte, vous suivent sur tous vos postes et ne sont plus partagés avec les autres personnes qui utilisent le même ordinateur.'
    ] },
    { v: '2026-11-13.3', date: '13/11/2026', items: [
      'Interprète vocal : le bouton haut-parleur (menu « ⋯ » sur téléphone) ouvre une conversation à deux. Chacun choisit sa langue et appuie sur « Parler » : la phrase est traduite à l’écran et lue à voix haute dans la langue de l’autre. Mode « Face à face » pour poser le téléphone entre vous.',
      'La lecture à voix haute d’une page reste disponible par la recherche (Ctrl+K → « Lire à voix haute ») et le menu « ⋯ ».'
    ] },
    { v: '2026-11-13.2', date: '13/11/2026', items: [
      'Lecture à voix haute : bouton haut-parleur dans la barre du haut (menu « ⋯ » sur téléphone). Il lit le texte sélectionné, sinon le mail ouvert ou généré, sinon la page ; un second clic arrête.',
      'Écran de connexion : boutons bleus aux couleurs du site, et messages plus clairs si la création de compte échoue.'
    ] },
    { v: '2026-11-13.1', date: '13/11/2026', items: [
      'Pension d’invalidité : même présentation que les autres simulateurs (blocs numérotés, verdict coloré, chiffres clés).',
      'Démission : la fiche détaillée d’un motif (ex. reconversion professionnelle) reste lisible en entier, délais et point de vigilance l’un sous l’autre.'
    ] },
    { v: '2026-11-12.49', date: '12/11/2026', items: [
      'Nouvelle page « Questions fréquentes » (menu, « Autres outils ») : installer l’appli, compte, données, modèles communs, fiches PDF.',
      'Bouton « Suggérer une amélioration » (FAQ, recherche Ctrl+K, menu « ⋯ » du téléphone) : idées, erreurs et questions arrivent directement à l’administrateur.',
      'Avec un compte, l’ouverture des outils et des modèles est désormais comptabilisée pour améliorer le site (aucune donnée d’allocataire).'
    ] },
    { v: '2026-11-12.46', date: '12/11/2026', items: [
      'Nouvel outil « Échéances réglementaires » (rubrique Références et calculs) : ce qui vient de changer et ce qui va bouger, avec la prochaine revalorisation.',
      'Parcours dossier : raccourcis vers l’outil adapté (ATI, formation, trop-perçu, invalidité, retraite, frontaliers, sanctions).',
      'Bouton « En faire un modèle » sous chaque mail de simulateur : le texte est enregistré dans vos modèles CVM (catégorie « Simulateurs »).',
      'Recherche (Ctrl+K) dans le contenu des outils : tapez au moins 3 lettres (« médiateur », « 77 € »…) pour trouver la règle et y aller directement.',
      'Thème clair vérifié sur tous les outils ; correction d’un bandeau resté sombre.'
    ] },
    { v: '2026-11-12.45', date: '12/11/2026', items: ['Correction : le nom de l’outil en haut de l’écran ne se répète plus après un renommage, et la barre du haut garde ses boutons à droite.'] },
    { v: '2026-11-12.44', date: '12/11/2026', items: ['Logo France Travail officiel sur l’écran de connexion.'] },
    { v: '2026-11-12.43', date: '12/11/2026', items: ['Sur ordinateur, Dates, Calculatrice, Repères, thème et rechargement sont de retour dans la barre du haut ; le menu « ⋯ » reste sur téléphone.'] },
    { v: '2026-11-12.42', date: '12/11/2026', items: ['Les liens « Modèles CVM associés » ont été retirés des rubriques.'] },
    { v: '2026-11-12.41', date: '12/11/2026', items: [
      'Logo France Travail officiel dans la barre du haut, et sur l’icône de l’appli (à réinstaller sur l’écran d’accueil pour voir la nouvelle icône).'
    ] },
    { v: '2026-11-12.40', date: '12/11/2026', items: [
      'Trop-perçu, volet « Délais et recours » : le motif se choisit dans une liste (reprise d’activité, écart de revenus, arrêt maladie, retraite, attestation rectificative…), avec « Autre » pour préciser. Le mail reprend la formulation adaptée.'
    ] },
    { v: '2026-11-12.39', date: '12/11/2026', items: [
      'Le bouton « Se connecter » ouvre de nouveau l’écran de connexion.',
      'Trop-perçu : l’outil (ex-« Indus ») rejoint la rubrique « Ouverture de droits » et réunit l’échéancier et un nouveau volet « Délais et recours » (prescription, remise, contestation, mail type).'
    ] },
    { v: '2026-11-12.38', date: '12/11/2026', items: [
      'Les nouveaux simulateurs (ATI, AREF et RFF, trop-perçus, sanctions, cas particuliers) reprennent la présentation des anciens : blocs numérotés, verdict coloré, chiffres clés, conditions avec pastilles.',
      'Barre du haut allégée : Dates, Calculatrice, Repères, thème et rechargement sont regroupés dans le bouton « ⋯ ».',
      'Accueil : « Bonjour » en grand sur téléphone, noms d’outils sur deux lignes, icônes à la couleur de leur rubrique, repères repliables.',
      'Bouton « Connexion » plus clair sur téléphone et onglets de rubrique qui signalent qu’ils défilent.'
    ] },
    { v: '2026-11-12.37', date: '12/11/2026', items: [
      'Nouvelles fiches dans « Situations particulières » : travailleurs indépendants (ATI) avec simulateur, formation (AREF et RFF), trop-perçus (prescription, recours), sanctions (suspension-remobilisation), frontaliers, intermittents et condition de résidence. Chacune avec un mail type.',
      'Retraite : âges et trimestres mis à jour après la suspension de la réforme (générations 1961 à 1969).',
      'Bouton « Fiche PDF » sous chaque mail de simulateur : résultats et message, prêts à imprimer ou à enregistrer.',
      'Accueil : « Mes outils » pour épingler vos simulateurs favoris.',
      'Sigles expliqués au survol ou au toucher (SJR, PRA, ARCE…) dans les simulateurs.',
      'Notifications sur le téléphone (menu « ⋯ ») : nouveautés et, pour l’administrateur, propositions de modèles ; pastille sur l’icône de l’appli.'
    ] },
    { v: '2026-11-12.36', date: '12/11/2026', items: [
      'Téléphone : le menu du compte (rond avec votre initiale) s’ouvre de nouveau : synchronisation, propositions, déconnexion.'
    ] },
    { v: '2026-11-12.35', date: '12/11/2026', items: [
      'Ouverture plus rapide du site, surtout sur téléphone (styles préparés à l’avance).',
      'Téléphone : barre d’onglets en bas (Accueil, Mails, Simulateurs, Rechercher) et repères repliables sur l’accueil.',
      'Bouton « Partager » sur les mails : envoi direct par Mail, Teams ou Messages.',
      'Clavier numérique avec virgule dans les simulateurs.',
      'Les collègues peuvent proposer un modèle à l’équipe (icône « équipe » d’un mail) ; l’administrateur valide ou refuse depuis son compte.',
      'Date de vérification du barème affichée dans les repères, avec un rappel à l’administrateur après chaque échéance de revalorisation.'
    ] },
    { v: '2026-11-12.34', date: '12/11/2026', items: [
      'Accueil sur téléphone : le « Bonjour » et la recherche s’affichent en premier, puis le dossier en cours, les simulateurs, les liens utiles et les repères.'
    ] },
    { v: '2026-11-12.33', date: '12/11/2026', items: [
      'Le site s’installe comme une application sur iPhone et Android : icône « Conseiller FT », ouverture en plein écran, consultation possible sans réseau. Mode d’emploi dans le menu « ⋯ » → Installer sur l’écran d’accueil.'
    ] },
    { v: '2026-11-12.32', date: '12/11/2026', items: [
      'Téléphone : la barre du haut tient entièrement dans l’écran. Les outils qui manquaient (recherche, date à date, calculatrice, repères, mes données, thème, recharger) sont dans le bouton « ⋯ ».'
    ] },
    { v: '2026-11-12.31', date: '12/11/2026', items: [
      'Mails sur téléphone : les catégories s’ouvrent dans un volet (bouton en haut de la liste ou glissement depuis le bord gauche), la liste prend tout l’écran et le mail s’ouvre en plein écran avec un bouton « Mails » pour revenir.'
    ] },
    { v: '2026-11-12.30', date: '12/11/2026', items: [
      'Fenêtre réduite et téléphone : la barre du haut s’adapte à la largeur (plus de boutons coupés), et sur téléphone toute la page défile pour accéder à l’ensemble du contenu.'
    ] },
    { v: '2026-11-12.29', date: '12/11/2026', items: [
      'Barre du haut : le bouton Accueil n’affiche plus que l’icône de la maison.'
    ] },
    { v: '2026-11-12.28', date: '12/11/2026', items: [
      'Barre du haut : boutons Précédent et Suivant (flèches à gauche de « Accueil ») pour revenir à l’écran précédent ou repartir vers le suivant. Raccourcis : Alt + ← et Alt + →.'
    ] },
    { v: '2026-11-12.27', date: '12/11/2026', items: [
      'Démission : nouveau seuil affiché pour l’emploi repris en cours de droits (88 jours ou 610 heures au plus, depuis le 1er avril 2025), à côté du seuil de 65 jours ou 455 heures (Repères de l’accueil, simulateur Démission, Sources).',
      'Mails automatiques : sans formules de politesse.',
      'Pages déroulantes (Complément ARE, Pension d’invalidité, Cumul CNS, Droits et passages, SJR) : le mail s’affiche à droite de l’écran et reste visible pendant la saisie.'
    ] },
    { v: '2026-11-12.26', date: '12/11/2026', items: [
      'Écran de connexion : nouveau bouton « Créer un compte » pour que chaque conseiller ouvre son propre compte.'
    ] },
    { v: '2026-11-12.25', date: '12/11/2026', items: [
      'Accueil : toutes les rubriques de simulateurs ont la même largeur que « Ouverture de droits ».',
      'Mail automatique sur chaque simulateur (Conditions et ARE, Délais, Complément ARE, Pension d’invalidité, ANS, Cumul CNS, CSP, Droits et passages, CFD, SJR) : rédigé avec les résultats, modifiable et copiable en un clic.'
    ] },
    { v: '2026-11-12.24', date: '12/11/2026', items: [
      'Style harmonisé sur tous les onglets : même barre de rubrique en haut, mêmes grands titres, même largeur de page, mêmes cartes, mêmes champs de saisie et textes plus lisibles (plus de très petits caractères).'
    ] },
    { v: '2026-11-12.23', date: '12/11/2026', items: [
      'Fond de page : dégradé de bleu plus marqué sur tout le site, en thème sombre comme en thème clair.'
    ] },
    { v: '2026-11-12.22', date: '12/11/2026', items: [
      'La pension d’invalidité rejoint la rubrique « Ouverture de droits » (menu, onglets de la rubrique et accueil).'
    ] },
    { v: '2026-11-12.21', date: '12/11/2026', items: [
      'Pension d’invalidité : le calcul du cumul avec l’ARE s’ouvre en premier, avant les règles.'
    ] },
    { v: '2026-11-12.20', date: '12/11/2026', items: [
      'Accueil : les Repères sont regroupés en 4 blocs successifs : Ouverture de droits, Allocation, Différés, Cumul et autres.'
    ] },
    { v: '2026-11-12.19', date: '12/11/2026', items: [
      'Nouvelle rubrique « Pension d’invalidité » : conditions d’attribution, les 3 catégories et leurs montants, règles de cumul avec l’ARE et calcul rapide du cumul.',
      'Mails : « Copier le texte » et l’étoile des favoris sont maintenant à droite de « Contenu du message ».',
      'Catégories de mails : le crayon et la corbeille n’apparaissent qu’au survol de la catégorie.'
    ] },
    { v: '2026-11-12.18', date: '12/11/2026', items: [
      'Barre du haut : le bouton « Mes données : sauvegarde et confidentialité » n’apparaît plus que sur la page des mails (CVM Direct).'
    ] },
    { v: '2026-11-12.17', date: '12/11/2026', items: [
      'Accueil : la carte « Références et calculs » est retirée (toujours accessible par le menu).',
      'Accueil : nouveaux boutons de simulateurs, plus modernes : icône colorée, effet au survol et flèche d’accès.'
    ] },
    { v: '2026-11-12.16', date: '12/11/2026', items: [
      'Calculatrice agrandie : grandes touches et affichage plus lisible.',
      'Conditions et ARE : le référentiel affiche bien les 6 conditions (affiliation, privation involontaire, inscription dans les 12 mois, recherche active, âge, aptitude et résidence).',
      'Accueil plus sobre : une carte par rubrique avec les outils sous forme de boutons courts, sans les sections en double.',
      'Menu élargi de 2 cm.',
      'Sources et vérification : petites cartes avec le titre et le statut ; le détail et la source s’affichent au survol de la souris.'
    ] },
    { v: '2026-11-12.15', date: '12/11/2026', items: [
      'Accueil : le bouton « Nouveau dossier » passe en bleu.',
      'Les onglets en haut de chaque rubrique sont classés par ordre alphabétique, comme le menu.'
    ] },
    { v: '2026-11-12.14', date: '12/11/2026', items: [
      'Administrateur : un crayon à côté de chaque outil et de chaque rubrique du menu permet de les renommer directement.'
    ] },
    { v: '2026-11-12.13', date: '12/11/2026', items: [
      'Accueil : la carte « Derniers outils » est remplacée par « Liens utiles ». Le bouton « Gérer » permet d’ajouter, de modifier ou de supprimer vos liens (Unédic déjà présent). Les liens sont enregistrés dans votre compte.'
    ] },
    { v: '2026-11-12.12', date: '12/11/2026', items: [
      'Administrateur : les noms des outils et des rubriques du menu (par exemple « Parcours dossier ») peuvent être renommés depuis le menu, avec le crayon à côté de chaque nom. Les nouveaux noms s’affichent chez tous les conseillers connectés.'
    ] },
    { v: '2026-11-12.11', date: '12/11/2026', items: [
      'Menu : les outils de chaque rubrique sont classés par ordre alphabétique, et « Situations particulières » passe au-dessus de « Fin de droits et passages ». L’accueil suit le même ordre.',
      'Mails : le crayon (renommer) et la corbeille (supprimer) de chaque catégorie sont maintenant toujours visibles dans le volet des catégories.'
    ] },
    { v: '2026-11-12.10', date: '12/11/2026', items: [
      'Complément ARE : calcul vérifié sur 30 jours quel que soit le mois (mensualisation), net après retraite complémentaire (3 % du SJR). Exemple : AJ 66,30 €, SJR 116,31 €, brut 2 000 € → 565,29 €.',
      'Cumul CNS et maintien ANS : l’allocation mensuelle est aussi calculée sur 30 jours, quel que soit le mois.'
    ] },
    { v: '2026-11-12.9', date: '12/11/2026', items: [
      'Accueil : nouvelle carte « Quoi de neuf ? » pour retrouver les dernières nouveautés à tout moment.',
      'Barre du haut : la flèche circulaire recharge maintenant la page (la réinitialisation des modèles reste accessible avec Ctrl+K, « Réinitialiser les modèles officiels »).',
      'Barre du haut : le bouton du volet latéral est retiré, il reste disponible dans le volet lui-même.'
    ] },
    { v: '2026-11-12.8', date: '12/11/2026', items: [
      'Nouvel accueil sur toute la largeur de l’écran : dossier en cours et repères à gauche, recherche et simulateurs au centre, CVM favoris et « Reprendre » à droite.',
      'Les bulles sont remplacées par des cartes par rubrique : chaque outil a son icône, son nom et une courte description.',
      'Les liens dans les mails sont maintenant cliquables (ils s’ouvrent dans un nouvel onglet).',
      'Création et modification de modèle : les catégories sont classées par ordre alphabétique.',
      'Les mentions « référence réglementaire » et « dernière relecture » sont retirées des mails.'
    ] },
    { v: '2026-11-12.7', date: '12/11/2026', items: [
      'Un mail supprimé, y compris de la base d’origine, est désormais supprimé pour de bon, sur tous vos postes. « Réinitialiser les modèles officiels » permet toujours de les récupérer.',
      'Synchronisation automatique : vos modifications sont envoyées en moins d’une seconde, et celles faites sur un autre poste arrivent toutes seules (toutes les 30 secondes et dès que vous revenez sur la page), sans recharger.'
    ] },
    { v: '2026-11-12.6', date: '12/11/2026', items: [
      'Retour à l’interface précédente (menu, accueil et mails comme avant).',
      'Les comptes conseillers, la synchronisation des modèles, la barre de recherche et les nouveautés restent en place.'
    ] },
    { v: '2026-11-12.4', date: '12/11/2026', items: [
      'Comptes conseillers : connectez-vous avec votre e-mail et votre mot de passe pour retrouver vos modèles CVM, favoris et catégories sur tous les postes.',
      'Enregistrement automatique : chaque modification est synchronisée en quelques secondes (pastille verte à côté de votre initiale, en haut).',
      'Modèles communs : les modèles publiés par l’administrateur apparaissent chez tous les conseillers.',
      'Aucune donnée de dossier ou d’allocataire n’est synchronisée. « Continuer sans compte » reste possible.'
    ] },
    { v: '2026-11-12.3', date: '12/11/2026', items: [
      'Barre du haut : le bandeau du barème Unédic et le nombre de modèles sont remplacés par une barre de recherche.',
      'Un clic dessus ouvre la recherche globale : outils, règles et modèles de mail (aussi avec Ctrl+K).'
    ] },
    { v: '2026-11-12.2', date: '12/11/2026', items: [
      'Nouvelle fenêtre « Nouveautés » : elle s’ouvre une seule fois après chaque mise à jour du site pour présenter les changements.',
      'Bandeau « Nouvelle version disponible » sur la version en ligne : un clic sur « Recharger » suffit pour passer à la dernière version.',
      'Le journal complet reste consultable dans Références et calculs → Sources.'
    ] }
  ];
  window.FT_NEWS = NEWS;
  var KEY = 'ft_news_seen';

  function cmp(a, b) { // compare 2026-11-12.2 et 2026-11-12.10 correctement
    var pa = String(a).split('.'), pb = String(b).split('.');
    if (pa[0] !== pb[0]) return pa[0] < pb[0] ? -1 : 1;
    return (parseInt(pa[1] || 0, 10)) - (parseInt(pb[1] || 0, 10));
  }
  function getSeen() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setSeen(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function open(list) {
    if (!list.length || document.getElementById('ft-news')) return;
    open.links = [];
    var last = document.activeElement;
    var w = document.createElement('div');
    w.id = 'ft-news';
    w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'ftn-title');
    w.innerHTML = '<div class="ftn-box"><header><div class="ftn-ico" aria-hidden="true">✨</div><div>' +
      '<h2 id="ftn-title">Quoi de neuf ?</h2><p class="ftn-sub">' + (open.manual ? 'Les dernières mises à jour du site' : list.length > 1 ? list.length + ' mises à jour depuis votre dernière visite' : 'Mise à jour du ' + esc(list[0].date)) + '</p></div></header>' +
      '<div class="ftn-body">' + list.map(function (e) {
        return (list.length > 1 ? '<h3>' + esc(e.date) + '</h3>' : '') + '<ul>' + e.items.map(function (x) { var lk = window.ftNewsLink ? window.ftNewsLink(x) : null; if (lk) { open.links = open.links || []; open.links.push(lk.run); } return '<li>' + esc(x) + (lk ? ' <button type="button" class="ftn-go" data-go="' + (open.links.length - 1) + '">' + esc(lk.label) + ' ›</button>' : '') + '</li>'; }).join('') + '</ul>';
      }).join('') + '</div>' +
      '<footer><button type="button" class="ftn-more">Voir le journal</button><button type="button" class="ftn-ok">J’ai compris</button></footer></div>';
    document.body.appendChild(w);
    requestAnimationFrame(function () { w.classList.add('show'); });
    var ok = w.querySelector('.ftn-ok'); ok.focus();
    function close() {
      setSeen(NEWS[0].v);
      w.classList.remove('show');
      document.removeEventListener('keydown', onKey, true);
      setTimeout(function () { w.remove(); if (last && last.focus) try { last.focus(); } catch (e) {} }, 250);
    }
    function onKey(ev) { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } }
    document.addEventListener('keydown', onKey, true);
    ok.addEventListener('click', close);
    w.addEventListener('click', function (ev) { var g = ev.target.closest && ev.target.closest('.ftn-go'); if (!g) return; var fn = (open.links || [])[+g.dataset.go]; close(); if (fn) setTimeout(function () { try { fn(); } catch (e) {} }, 300); });
    w.addEventListener('click', function (ev) { if (ev.target === w) close(); });
    w.querySelector('.ftn-more').addEventListener('click', function () {
      close();
      try { if (typeof switchNavTab === 'function') switchNavTab('sources'); } catch (e) {}
    });
  }

  // Ouvrir à la demande (Ctrl+K → « Nouveautés »)
  window.ftShowNews = function () { var byDate = []; NEWS.slice(0, 12).forEach(function (e) { var g = byDate.filter(function (x) { return x.date === e.date; })[0]; if (g) g.items = g.items.concat(e.items); else byDate.push({ v: e.v, date: e.date, items: e.items.slice() }); }); open.manual = true; open(byDate.slice(0, 4)); open.manual = false; };
  window.FT_ACTIONS = window.FT_ACTIONS || [];
  window.FT_ACTIONS.push({ t: 'Réinitialiser les modèles officiels', s: 'Remettre les modèles CVM d’origine', kw: 'réinitialiser reset modèles officiels origine restaurer', run: function () { try { resetDefaults(); } catch (e) {} } });
  window.FT_ACTIONS.push({ t: 'Nouveautés', s: 'Voir les dernières modifications du site', kw: 'nouveautés quoi de neuf mise à jour version changements', run: function () { window.ftShowNews(); } });

  function auto() {
    var seen = getSeen();
    var list = seen ? NEWS.filter(function (e) { return cmp(e.v, seen) > 0; }) : NEWS.slice(0, 1);
    if (list.length) setTimeout(function () { open(list); }, 700);
  }
  if (document.readyState === 'complete') auto(); else window.addEventListener('load', auto);
})();
