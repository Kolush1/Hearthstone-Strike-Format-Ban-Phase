# Hearthstone Strike Ban Phase

Application web pour organiser une phase de strike/ban entre deux joueurs sur Hearthstone, avec 3 classes par joueur, une matrice de 9 affrontements possibles, 4 bannissements, puis un ordre aléatoire des 5 matchs restants.

## Principe

Chaque joueur choisit **exactement 3 classes**. Une fois les deux compositions validées, l'application construit une grille 3 x 3 qui représente tous les affrontements possibles entre les classes du joueur A et celles du joueur B.

La phase de bannissement se joue ensuite en **4 bans alternés**. À la fin, il reste **5 affrontements valides**, qui sont affichés dans un ordre aléatoire.

## Créer un match

1. Ouvrir la page d'accueil.
2. Entrer son pseudo.
3. Sélectionner exactement 3 classes.
4. Cliquer sur **Créer le match**.

Après création, le créateur est redirigé vers la page du match avec son lien sécurisé personnel. Ce lien contient un token de joueur 1 et ne doit pas être partagé.

## Inviter l'adversaire

Sur la page du match, tant que le second joueur n'a pas rejoint :

1. Cliquer sur **Copier le lien**.
2. Envoyer ce lien à l'adversaire.

Le lien copié est un **lien d'invitation**. Il permet de rejoindre le match, mais ne donne pas directement les droits d'action du joueur 2 tant que celui-ci n'a pas terminé sa propre entrée dans le match.

## Rejoindre un match

Le joueur qui reçoit le lien d'invitation doit :

1. Ouvrir le lien reçu.
2. Entrer son pseudo.
3. Sélectionner exactement 3 classes.
4. Cliquer sur **Rejoindre**.

Une fois le formulaire validé, le joueur 2 est redirigé automatiquement vers sa propre URL sécurisée. Cette URL contient son token personnel et ne doit pas être partagée.

## Déroulement de la phase de ban

Quand les deux joueurs ont rejoint :

- les joueurs sont assignés aléatoirement à **Joueur A** et **Joueur B** ;
- les classes du joueur A apparaissent sur les lignes ;
- les classes du joueur B apparaissent sur les colonnes ;
- chaque case du tableau correspond à un affrontement possible.

La séquence de bans suit l'ordre affiché par l'interface. Quand c'est au tour d'un joueur, celui-ci peut cliquer sur une case encore disponible.

### Couleurs du tableau

- **Vert** : affrontement encore disponible.
- **Rouge** : affrontement banni.

Après les 4 bans, l'application verrouille la grille et affiche l'ordre aléatoire des 5 affrontements restants.

## Sécurité des liens

Le site utilise deux mécanismes distincts :

- un **token joueur** pour autoriser les actions sensibles comme les bannissements ;
- un **token d'invitation** pour permettre au second joueur de rejoindre sans exposer à l'avance son vrai token d'action.

Cela évite qu'un joueur puisse se contenter de modifier `player=1` ou `player=2` dans l'URL pour agir à la place de l'autre. Les droits réels sont vérifiés côté serveur à partir du token transmis.

## Règles d'utilisation

- Ne pas partager son lien personnel de joueur après connexion au match.
- Partager uniquement le lien d'invitation tant que l'adversaire n'a pas rejoint.
- Chaque joueur doit choisir exactement 3 classes.
- Une case bannie ne peut plus être sélectionnée.
- Un joueur ne peut bannir que lorsque c'est son tour.

## Résolution rapide des problèmes

### Le bouton « Créer le match » ne fonctionne pas

Vérifier que :

- un pseudo est bien saisi ;
- exactement 3 classes sont sélectionnées.

### Le bouton « Copier le lien » indique que le lien est indisponible

Cela signifie généralement que le match n'a pas été chargé correctement ou que le token d'invitation n'a pas été généré côté serveur.

### « Match not found »

Causes fréquentes :

- URL incomplète ou copiée partiellement ;
- match supprimé ou serveur relancé si le stockage est seulement en mémoire ;
- identifiant de match invalide.

### Un joueur ne peut pas bannir

Vérifier que :

- le bon lien sécurisé est utilisé ;
- c'est bien son tour ;
- la case n'a pas déjà été bannie.

## Résumé du flux

1. Joueur 1 crée le match.
2. Joueur 1 copie le lien d'invitation.
3. Joueur 2 ouvre ce lien et rejoint le match.
4. Les rôles A/B sont attribués aléatoirement.
5. Les 4 bans sont joués à tour de rôle.
6. Les 5 matchs restants sont affichés dans un ordre aléatoire.
