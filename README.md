# Hearthstone Strike Ban Phase

Application web pour organiser une phase de ban en format Strike entre deux joueurs sur Hearthstone, avec 3 classes par joueur, une matrice de 9 matchups possibles, 4 bans, puis un ordre aléatoire des 5 matchs restants.


## Format Strike

Créé en 2016 par RDU avec l'aide de Gaara, le format Strike (appelé "Destiny" à la base) a pour objectif de permettre de jouer un BO5 avec 3 decks.

Chaque joueur choisit **exactement 3 classes**.

L'application web construit une grille 3 x 3 qui représente tous les matchups possibles entre les classes du joueur A et celles du joueur B.

Les joueurs font **4 bans alternés** (ABBA). À la fin, il reste **5 matchups valides**, qui sont joués dans un ordre aléatoire.

<img src="./public/images/tableau_bans.png" alt="Tableau des bans" width="700" />

## Résumé du processus

1. Joueur 1 crée le match.
2. Joueur 1 copie le lien d'invitation.
3. Joueur 2 ouvre ce lien et rejoint le match.
4. Les rôles A/B sont attribués aléatoirement.
5. Les 4 bans sont joués à tour de rôle (ABBA).
6. Les 5 matchups restants sont affichés dans un ordre aléatoire.

## Créer un match

1. Ouvrir la page d'accueil.
2. Entrer son pseudo.
3. Sélectionner exactement 3 classes.
4. Cliquer sur **Créer le match**.

## Inviter l'adversaire

Sur la page du match, tant que le second joueur n'a pas rejoint :

1. Cliquer sur **Copier le lien**.
2. Envoyer ce lien à l'adversaire.

## Rejoindre un match

Le joueur qui reçoit le lien d'invitation doit :

1. Ouvrir le lien reçu.
2. Entrer son pseudo.
3. Sélectionner exactement 3 classes.
4. Cliquer sur **Rejoindre**.

## Déroulement de la phase de ban

Quand les deux joueurs ont rejoint :

- les joueurs sont assignés aléatoirement à **Joueur A** et **Joueur B** ;
- les classes du joueur A apparaissent sur les lignes ;
- les classes du joueur B apparaissent sur les colonnes ;
- chaque case du tableau correspond à un matchup possible.

La séquence de bans suit l'ordre affiché par l'interface. Quand c'est au tour d'un joueur, celui-ci peut cliquer sur une case encore disponible.

### Couleurs du tableau

- **Vert** : matchup encore disponible.
- **Rouge** : matchup banni.

Après les 4 bans, l'application verrouille la grille et affiche l'ordre aléatoire des 5 matchups restants.


## Résolution rapide des problèmes

### Le bouton « Créer le match » ne fonctionne pas

Vérifier que :

- un pseudo est bien saisi ;
- exactement 3 classes sont sélectionnées.


### « Match not found »

Causes fréquentes :

- URL incomplète ou copiée partiellement ;
- match supprimé ou serveur relancé si le stockage est seulement en mémoire ;
- identifiant de match invalide.

### Un joueur ne peut pas bannir

Vérifier que :

- le bon lien est utilisé ;
- c'est bien son tour ;
- la case n'a pas déjà été bannie.

### Sources

- https://www.reddit.com/r/hearthstone/comments/56tj8s/how_to_transform_conquest_into_a_great_format/
- https://www.youtube.com/watch?v=j31l-Kl6TcE
- https://www.youtube.com/watch?v=KA4wHSS5izw
- https://blizzpro.com/2016/11/18/rdus-new-tournament-format-strike-app-already-available-beta/

