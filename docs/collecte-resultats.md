# Collecte des résultats de l'essai des combats

La page `essais/combats.html` envoie chaque combat terminé et chaque avis à une feuille de calcul Google, par l'intermédiaire d'un petit script Google Apps Script.

## La feuille de calcul

« Essai des combats — résultats des testeurs », dans le Google Drive de La Lumière, avec trois onglets :

- **Synthèse :** combats joués, victoires et préférences, par système. Tout est calculé à partir des deux autres onglets.
- **Combats :** une ligne par combat terminé.
- **Avis :** une ligne par avis envoyé.

## Installer le script (une seule fois)

1. Ouvrir la feuille de calcul, puis le menu **Extensions > Apps Script**.
2. Remplacer le contenu de `Code.gs` par celui de `outils/collecte-resultats.gs`, puis enregistrer.
3. Cliquer sur **Déployer > Nouveau déploiement**, choisir le type **Application Web**.
4. Régler **Exécuter en tant que : Moi** et **Qui a accès : Tout le monde**, puis **Déployer**.
5. Autoriser l'accès demandé par Google (le script n'écrit que dans cette feuille).
6. Copier l'**URL de l'application Web**, qui se termine par `/exec`.
7. Coller cette adresse dans `essais/combats.html`, à la ligne `var ADRESSE_COLLECTE = '';`.

Pour vérifier que la collecte est en ligne, ouvrir l'URL dans un navigateur : elle répond `{"ok":true,"message":"Collecte des résultats active"}`.

## Modifier le script plus tard

Après une modification du script, utiliser **Déployer > Gérer les déploiements**, modifier le déploiement existant et choisir **Nouvelle version**. L'URL reste la même ; un nouveau déploiement en créerait une autre.

## Ce qui est collecté

Pour chaque combat : le système, l'adversaire, le seuil des dés de chance, l'indice choisi pour le système C, l'issue, le nombre de tours, la vie restante, les dés de chance et les fuites, ainsi que la ligne complète du journal, qui détaille les décisions propres à chaque système. Pour chaque avis : les systèmes appréciés, le système préféré, un commentaire libre et le nombre de combats joués par système.

Chaque appareil reçoit un identifiant de séance au hasard (par exemple `S-ED9KTK`) pour regrouper ses combats. Aucune autre donnée n'est collectée, à part le prénom ou pseudo si le testeur le saisit.
