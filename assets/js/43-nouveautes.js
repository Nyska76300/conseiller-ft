(function () {
  /* Nouveautés : ajouter une entrée en haut de la liste à chaque mise à jour
     (v = même valeur que la balise ft-version). */
  var NEWS = [
    { v: '2026-11-13.37', date: '13/11/2026', items: [
      'Couleurs : choisissez un thème de couleurs (Océan, Émeraude, Sarcelle, Améthyste, Framboise, Ardoise) dans Paramètres, en mode sombre comme en mode clair.',
      'Menu du compte allégé : Mon compte, Paramètres, Mes rappels et Se déconnecter ; notifications, visite guidée, confidentialité et synchronisation sont dans Paramètres.'
    ] },
    { v: '2026-11-13.36', date: '13/11/2026', items: [
      'Vue usager : sous chaque mail généré par un simulateur, « 👁 Vue usager » affiche les résultats en grand et sans jargon, à montrer à la personne reçue (texte agrandissable, impression).',
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
