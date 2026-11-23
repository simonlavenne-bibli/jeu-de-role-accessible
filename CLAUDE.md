# Jeu de rôle accessible — consignes de travail

Jeu de rôle « porte, monstre, trésor » pour un public aveugle ou malvoyant, porté par Simon (La Lumière). L'accessibilité est au cœur du projet.

## Avant de commencer

1. Lire `docs/etat-du-projet.md` (où en est le projet) et `docs/decisions.md` (ce qui est tranché).
2. Récupérer la dernière version de `main` : d'autres sessions y travaillent en parallèle.
3. Ne pas rediscuter une décision de `docs/decisions.md` sans que Simon le demande.

## Règles

- **Langue :** tout en français (code, commentaires, textes, messages de commit).
- **Jamais d'envoi direct sur `main`.** Une tâche = une branche partie de `main` à jour = une demande de fusion (pull request). Simon teste, puis fusionne lui-même.
- **Valider avant de construire :** proposer le plan, attendre l'accord de Simon, puis réaliser.
- **Une modification à la fois :** Simon teste chaque changement avant de demander le suivant.
- **Fichiers complets :** quand Simon doit copier un fichier, le donner en entier, prêt à coller.
- **Tester sur appareil réel :** Simon teste surtout sur iPhone, sans outils de développement.
- **Mettre à jour `docs/etat-du-projet.md`** à la fin de chaque tâche, et ajouter à `docs/decisions.md` toute décision prise par Simon.

## Où sont les choses

| Quoi | Où |
|---|---|
| Conception : cahier des charges, contrat de données | `docs/` |
| Page d'essai des combats (texte seul, systèmes A à G) | `essais/combats.html`, publiée sur https://simonlavenne-bibli.github.io/jeu-de-role-accessible/essais/combats.html |
| Moteur des combats (règles, sans page ni son) | `essais/combats/moteur/` : `combat.js` (déroulement commun), `systemes/a.js` à `g.js`, `donnees.js` (héros, monstres, équilibrage) |
| Affichage des combats (écrans, dés, bruitages, collecte) | `essais/combats/interface/`, point d'entrée `principal.js` |
| Tests du moteur et simulation d'équilibrage | `tests/` (`npm test`), `outils/simulation.js` (`npm run simulation`) |
| Dés en 3D (animation et son), communs aux essais | `essais/des3d.js`, page d'essai `essais/des.html` |
| Bruitages et ambiance du combat | `essais/sons.js`, sons enregistrés dans `essais/sons/` |
| Musique de l'histoire | `essais/musique.js` |
| Intrigue et prologue (texte de référence) | `docs/intrigue.md` ; le prologue est repris dans `essais/combats/interface/histoire.js` |
| Script de collecte des résultats (Google Apps Script) | `outils/collecte-resultats.gs`, installation dans `docs/collecte-resultats.md` |
| Premier prototype avec images, sons et voix | branche `illustrations-essai`, `prototype/premier-combat.html` |
| Illustrations au format du jeu, scripts d'images et de voix | branche `illustrations-essai` : `assets/images/`, `outils/` |
| Résultats des testeurs, illustrations, liens | Dossier Google Drive « Jeu de rôle accessible » de Simon |

## Contraintes techniques

- HTML, CSS et JavaScript sans framework ni étape de construction, hébergés sur GitHub Pages.
- Le moteur de jeu reste séparé du rendu : il reçoit des commandes et émet des messages (voir `docs/contrat-de-donnees.md`).
- Le moteur (`essais/combats/moteur/`) ne touche jamais à la page ni au son : il parle à l'interface par l'objet `ui` décrit en tête de `combat.js`. Un test le vérifie.
- Lancer `npm test` avant chaque demande de fusion (Node suffit, aucun paquet à installer). La page se teste depuis un serveur (GitHub Pages, ou `python3 -m http.server`), pas en ouvrant le fichier directement.
- Aucune information du jeu ne doit passer uniquement par l'image ou par la couleur.
- Pas de créature, de personnage ou d'image appartenant à un autre jeu ou à un éditeur.
