# Cahier des charges — Jeu de rôle accessible

Version 0.3 — 15 novembre 2026 — à valider

## 1. Intention

Créer un jeu de rôle d'exploration de donjon, de type « porte, monstre, trésor », conçu d'abord pour des joueurs aveugles ou malvoyants, et agréable aussi pour des joueurs voyants.

L'accessibilité n'est pas une option ajoutée après coup : le jeu doit être entièrement jouable sans rien voir, et s'adapter aux besoins de chaque joueur.

## 2. Public et cadre de jeu

- Adultes et adolescents, aveugles, malvoyants ou voyants.
- Un seul joueur.
- Langue : français uniquement.
- Partie courte : environ 15 minutes.
- Appareils : ordinateur, tablette et smartphone.

## 3. Principes d'accessibilité

1. **Tout passe par le son.** Aucune information nécessaire au jeu n'existe uniquement à l'image.
2. **Tout est aussi à l'écran.** Chaque texte dit par la voix est affiché, en grands caractères.
3. **Le jeu parle de lui-même.** Il n'exige pas de lecteur d'écran.
4. **Le joueur garde la main.** Il peut à tout moment faire répéter le dernier message, couper la voix en cours, et demander où il en est (points de vie, équipement, choix possibles).
5. **Peu de choix à la fois.** Chaque situation propose un petit nombre d'actions, toujours annoncées dans le même ordre.
6. **Rien n'est chronométré.** Le jeu attend le joueur.

## 4. Adaptation au joueur

Au premier lancement, le jeu pose à voix haute quelques questions simples et règle le jeu en conséquence. Tous les réglages restent modifiables ensuite et sont mémorisés.

| Réglage | Valeurs |
|---|---|
| Voix | débit, hauteur, volume |
| Ambiance sonore | volume |
| Bruitages | volume |
| Illustrations | affichées ou masquées |
| Couleurs | blanc sur noir, noir sur blanc, jaune sur noir, orange sur noir |
| Taille du texte | plusieurs paliers |
| Vibrations (mobile) | activées ou non |

## 5. Univers et ton

- Fantasy, entre classique et sombre.
- Référence d'ambiance : les jeux de la fin des années 1980, comme *Barbarian* sur Commodore 64, à l'époque des premières puces et cartes son.
- L'écriture est une priorité : descriptions courtes, évocatrices, faites pour être entendues (phrases brèves, l'information importante en fin de phrase, pas de listes).

## 6. Déroulement d'une partie

- Le joueur incarne un personnage prédéfini, aux caractéristiques fixées à l'avance : Habileté, Vie et Chance.
- Le donjon comporte un seul niveau, généré aléatoirement, qui se termine par un boss fixe.
- Le joueur avance de salle en salle en choisissant une porte.
- Une salle contient un monstre, un trésor, un événement, ou rien.
- Une intrigue se dévoile au fil des salles.

### Combat

- Au tour par tour, résolu par des lancers de dés annoncés à voix haute.
- Uniquement des dés à six faces (D6), pour que le jeu puisse aussi exister en jeu de société avec des dés tactiles.
- Les règles restent assez simples pour être jouées sur table, sans calcul caché.
- Le joueur peut tenter de fuir : la fuite réussit sur un jet de dés.
- En situation critique, le joueur peut tenter de s'en sortir en lançant un dé de chance.
- Si le personnage meurt, la partie reprend à la dernière sauvegarde.

### Butin

Après un affrontement gagné, le joueur peut récupérer :

- une **arme** ou un objet, qui modifie ses chances au combat ;
- une **information**, qui fait avancer l'intrigue ou révèle une faiblesse d'un monstre ou du boss.

## 7. Immersion sonore

Le son porte le jeu. Il se compose de quatre couches, réglables séparément :

1. **La voix** du narrateur, qui décrit les lieux et les événements.
2. **L'ambiance** de fond (souffle du donjon, gouttes, vent).
3. **Les bruitages** d'action : porte qui grince, pas, dés qui roulent, armes, cris des monstres.
4. **Les signaux** courts et constants : réussite, échec, danger, butin.

Règles :

- La voix est toujours prioritaire : l'ambiance baisse quand elle parle.
- Un même événement produit toujours le même son, pour que le joueur apprenne à les reconnaître.
- Chaque type de monstre a une signature sonore propre.
- Couleur sonore rétro, façon puce son des années 1980, pour les bruitages, les signaux et la musique.
- Première version : tous les sons sont fabriqués par le jeu (synthèse).
- Chaque son peut être remplacé par un fichier enregistré, sans modifier le reste du jeu, si le résultat de la synthèse n'est pas satisfaisant.

### Voix

- Première version : synthèse vocale du navigateur.
- Comme pour les sons, le module de voix peut utiliser des fichiers audio préparés à l'avance si la synthèse n'est pas satisfaisante.
- Le grain rétro de la voix ne doit jamais nuire à la compréhension (voir point ouvert n° 1).

## 8. Illustrations

- Pixel art monochrome, une illustration par type de salle, de monstre et d'objet.
- Chaque image est stockée une seule fois ; la couleur est appliquée par le jeu selon le réglage choisi.
- Les illustrations renforcent l'ambiance mais ne portent aucune information indispensable.

## 9. Commandes

- **Clavier :** flèches pour parcourir les choix, Entrée pour valider, raccourcis pour répéter, faire le point et ouvrir les réglages.
- **Tactile :** gros boutons, peu nombreux, toujours aux mêmes endroits.
- Chaque choix est annoncé par la voix quand il est sélectionné, avant d'être validé.

## 10. Technique

- Application web installable (PWA), jouable hors ligne.
- HTML, CSS et JavaScript sans framework, hébergée sur GitHub Pages.
- Le moteur de jeu est séparé du rendu : il reçoit des commandes et émet des messages, que des modules indépendants traduisent en voix, texte, image et son.
- Le contenu (personnage, monstres, objets, salles, textes) est stocké dans des fichiers de données, modifiables sans toucher au code.
- Sauvegarde automatique sur l'appareil.
- Panneau de diagnostic intégré, pour tester sur appareil réel sans outils de développement.

## 11. Hors périmètre de la première version

- Création de personnage par le joueur.
- Plusieurs niveaux de donjon.
- Multijoueur.
- Autres langues.

## 12. Points ouverts

1. **Grain rétro de la voix.** La synthèse du navigateur ne peut pas être filtrée : seuls son débit et sa hauteur se règlent. Un vrai grain « années 80 » sur la voix demande des fichiers audio préparés à l'avance. Proposition : narrateur clair en première version, grain rétro sur les bruitages et la musique, et voix rétro en option quand on passera aux fichiers audio.
2. **Lecteur d'écran actif.** Que fait le jeu si VoiceOver ou TalkBack tourne déjà, pour éviter deux voix en même temps ?
3. **Sauvegarde.** À chaque salle, ou à des points précis du donjon ?

Les règles de dés (assaut, fuite, chance, butin) sont décrites dans `contrat-de-donnees.md`.
