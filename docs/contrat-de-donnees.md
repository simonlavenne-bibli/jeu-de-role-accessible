# Contrat de données — Jeu de rôle accessible

Version 0.1 — 15 novembre 2026 — à valider

Ce document fixe ce que le moteur de jeu reçoit, ce qu'il garde en mémoire et ce qu'il émet. Tant qu'il est respecté, on peut modifier le moteur, la voix, l'écran ou les sons sans casser le reste.

```
commande  →  MOTEUR  →  messages  →  voix, écran, image, sons
               ↕
             état
```

Le moteur ne contient aucun texte, aucun son, aucune image : il émet des messages nommés, et chaque module de rendu décide quoi en faire.

## 1. Règles (système D6)

### Caractéristiques du héros

| Caractéristique | Rôle | Valeur de départ (à valider) |
|---|---|---|
| Habileté | valeur au combat | 7 |
| Vie | points de vie | 12 |
| Chance | réserve de dés de chance | 3 dés |

### Assaut

1. Le héros lance 2D6 et ajoute son Habileté et le bonus de son arme.
2. Le monstre lance 2D6 et ajoute son Habileté.
3. Le plus haut total touche et retire 2 points de Vie à l'autre (ou les dégâts de l'arme).
4. Égalité : personne n'est blessé.
5. Double 6 : coup critique, dégâts doublés.

### Fuite

Le héros lance 1D6 et réussit si le résultat atteint le seuil de fuite du monstre (4 par défaut, 3 pour un monstre lent, 5 pour un rapide). En cas d'échec, le monstre inflige ses dégâts sans riposte.

### Chance

Le jeu propose de lancer un dé de chance dans trois situations : coup mortel, fuite ratée, piège déclenché. Le joueur accepte ou refuse.

- 4 ou plus : l'effet est évité.
- 3 ou moins : l'effet s'applique.

Le dé est dépensé dans les deux cas. Certains trésors rendent un dé.

### Butin

| Genre | Effet |
|---|---|
| Arme | bonus d'Habileté (+1 ou +2) ou dégâts de 3 |
| Information | +1 en Habileté contre le monstre ou le boss concerné, et avancée de l'intrigue |
| Dé de chance | +1 dé dans la réserve |

## 2. État du jeu

L'état est un seul objet, enregistrable tel quel pour la sauvegarde.

```json
{
  "version": 1,
  "phase": "exploration",
  "graine": 48213,
  "heros": {
    "habilete": 7,
    "vie": 12,
    "vieMax": 12,
    "desDeChance": 3,
    "arme": "epee-rouillee",
    "informations": []
  },
  "donjon": {
    "salleCourante": 0,
    "salles": [
      {
        "id": 0,
        "type": "vide",
        "contenu": null,
        "visitee": true,
        "portes": [1, 2]
      }
    ]
  },
  "combat": null,
  "chanceEnAttente": null,
  "choix": [
    { "id": "porte-1", "genre": "porte" },
    { "id": "porte-2", "genre": "porte" }
  ]
}
```

| Champ | Valeurs |
|---|---|
| `phase` | `accueil`, `exploration`, `combat`, `chance`, `butin`, `mort`, `victoire` |
| `graine` | nombre qui détermine le donjon et les dés, pour pouvoir rejouer une partie à l'identique lors des tests |
| `salles[].type` | `vide`, `monstre`, `tresor`, `piege`, `evenement`, `boss` |
| `combat` | `null` hors combat, sinon `{ "monstre": "gobelin", "vieMonstre": 6, "tour": 1 }` |
| `chanceEnAttente` | `null`, sinon `{ "situation": "coup-mortel" }` (`coup-mortel`, `fuite-ratee`, `piege`) |
| `choix` | les actions possibles maintenant, toujours dans le même ordre |

## 3. Commandes (ce que le moteur reçoit)

| Commande | Effet |
|---|---|
| `{ "type": "nouvelle-partie" }` | crée un donjon et un héros neufs |
| `{ "type": "reprendre" }` | recharge la dernière sauvegarde |
| `{ "type": "choisir", "id": "porte-1" }` | exécute un des choix proposés |
| `{ "type": "faire-le-point" }` | réémet l'état du héros et les choix possibles |

Les identifiants de choix en combat sont `attaquer` et `fuir` ; devant un dé de chance, `tenter-sa-chance` et `renoncer` ; devant un butin, `prendre` et `laisser`.

« Répéter le dernier message » et les réglages ne passent pas par le moteur : ce sont les modules de rendu qui s'en chargent.

## 4. Messages (ce que le moteur émet)

Chaque commande produit une liste ordonnée de messages. Tous ont la même forme :

```json
{ "type": "assaut-resultat", "donnees": { "gagnant": "heros", "degats": 2 } }
```

| Type | Données |
|---|---|
| `partie-commencee` | `vie`, `vieMax`, `desDeChance` |
| `porte-ouverte` | `porte` |
| `salle-entree` | `salle`, `typeSalle` |
| `monstre-apparait` | `monstre`, `vieMonstre` |
| `des-lances` | `qui` (`heros` ou `monstre`), `des` (ex. `[3, 5]`), `bonus`, `total` |
| `assaut-resultat` | `gagnant` (`heros`, `monstre`, `egalite`), `degats`, `critique`, `vieHeros`, `vieMonstre` |
| `fuite-resultat` | `de`, `seuil`, `reussie` |
| `chance-proposee` | `situation`, `desRestants` |
| `chance-resultat` | `de`, `seuil`, `reussie`, `desRestants` |
| `piege-declenche` | `piege`, `degats` |
| `monstre-vaincu` | `monstre` |
| `butin-trouve` | `genre` (`arme`, `information`, `de-de-chance`), `objet` |
| `butin-pris` | `objet` |
| `etat-heros` | `vie`, `vieMax`, `desDeChance`, `arme` |
| `choix-proposes` | `choix` |
| `sauvegarde-faite` | — |
| `heros-mort` | — |
| `victoire` | — |

### Ce que chaque module en fait

Exemple pour `monstre-apparait` avec `{ "monstre": "gobelin" }` :

| Module | Action |
|---|---|
| Voix | dit le texte `monstre-apparait.gobelin` |
| Écran | affiche ce même texte |
| Image | affiche l'illustration `gobelin` |
| Sons | joue le son `gobelin-cri` |

## 5. Fichiers de contenu

Tout le contenu est dans `data/`, séparé du code.

```json
{
  "id": "gobelin",
  "habilete": 5,
  "vie": 6,
  "degats": 2,
  "seuilFuite": 4,
  "butin": ["dague", "information-crypte"]
}
```

| Fichier | Contenu |
|---|---|
| `personnage.json` | caractéristiques de départ du héros |
| `monstres.json` | monstres et boss |
| `objets.json` | armes, informations, trésors |
| `salles.json` | types de salles et règles de génération du donjon |
| `textes.json` | tous les textes dits et affichés, avec plusieurs variantes par message pour éviter les répétitions |

## 6. À valider

1. Valeurs de départ du héros : Habileté 7, Vie 12, 3 dés de chance.
2. Taille du donjon : 8 salles avant le boss, pour tenir en 15 minutes environ.
3. Sauvegarde automatique à chaque entrée dans une salle.
