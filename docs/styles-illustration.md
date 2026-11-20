# Styles d'illustration : deux pistes

Mis à jour le 20 novembre 2026.

**Statut :** le style décidé reste le **pixel art monochrome** (décision du 15/11/2026). Le **dessin à l'encre** est un essai que Simon apprécie, mais le changement **n'est pas validé**. Cette fiche garde la trace des deux pistes pour pouvoir choisir plus tard.

Dans les deux cas, les règles d'accessibilité ne changent pas : l'image accompagne la narration et ne porte jamais seule une information du jeu.

## Piste 1 : pixel art monochrome (style décidé)

- Décidé le 15/11/2026.
- Images générées en noir et blanc à fort contraste avec Canva, puis converties en pixel art monochrome par script.
- Affichables en blanc sur noir, noir sur blanc, jaune sur noir et orange sur noir.
- 16 images au format du jeu sur la branche `illustrations-essai`, dans `assets/images/` (couloir, porte, coffre, salle vide, salle du boss, piège, gobelin, squelette, araignée, loup-garou, Murmureur, démon, dague, épée, parchemin, dé de chance).

## Piste 2 : dessin à l'encre façon gravure (en essai)

- Essai du 20/11/2026, inspiré d'une capture d'écran de Whipstone partagée par Simon (référence de style uniquement, aucun élément repris).
- Dessin à l'encre noir et blanc très contrasté, hachures façon gravure et bande dessinée old-school, murs en gros blocs de pierre fissurés.
- Vue subjective : on voit la scène par les yeux du héros. Pour les monstres, ses mains tiennent un bouclier rond et une épée au premier plan.
- Éclairage plutôt clair et lisible. Simon a préféré cette version à une première, plus sombre.
- Simon a validé l'apparence du Murmureur dans ce style.
- À vérifier si la piste est retenue : le rendu en quatre couleurs avec le script de conversion, et la lisibilité sur petit écran (traits fins).

### Images de l'essai

Les fichiers de `assets/images/essai-encre/` sont des **vignettes** (environ 200 × 150 pixels), pour garder une trace. Les originaux en haute définition sont dans Canva.

| Fichier | Sujet | Original dans Canva |
|---|---|---|
| `couloir.png` | Couloir voûté, torche au mur, fond dans le noir | [MAHbftt1S78](https://www.canva.com/M/MAHbftt1S78) |
| `salle-squelette.png` | Salle avec squelette affaissé sous des chaînes, coffre | [MAHbfpQuHGw](https://www.canva.com/M/MAHbfpQuHGw) |
| `squelette.png` | Squelette en garde, épée et bouclier | [MAHbfrSqw64](https://www.canva.com/M/MAHbfrSqw64) |
| `loup-garou.png` | Loup-garou dressé, griffes en avant | [MAHbflaRZH8](https://www.canva.com/M/MAHbflaRZH8) |
| `murmureur.png` | Le Murmureur : forme encapuchonnée qui flotte, en lambeaux, longs doigts osseux | [MAHbfmkY21k](https://www.canva.com/M/MAHbfmkY21k) |
| `demon.png` | Démon, boss final : cornes, ailes déployées, salle à colonnes | [MAHbfpZrVmQ](https://www.canva.com/M/MAHbfpZrVmQ) |
| `gobelin.png` | Gobelin nerveux, une lame dans chaque main | [MAHbfjrIlog](https://www.canva.com/M/MAHbfjrIlog) |

### Refaire une image dans ce style

1. Dans Canva, générer l'image en donnant `squelette.png` (original MAHbfrSqw64) comme **image de référence** : c'est elle qui fixe le style, la lumière et le cadrage.
2. Utiliser une description de cette forme, en remplaçant le sujet :

> Dans exactement le même style de dessin que l'image de référence (encre noir et blanc, hachures, même luminosité claire, même salle de donjon en pierre, vue subjective avec les mains du héros tenant bouclier et épée au premier plan), **[sujet, attitude, détails]**, aucune couleur, aucun texte

3. Format paysage 4:3.

Pour un lieu sans monstre, retirer la mention des mains du héros. Sans image de référence, Canva ne retrouve pas ce style : le premier essai a donné un couloir de maison bourgeoise.
