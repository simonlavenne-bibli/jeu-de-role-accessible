# État du projet

Mis à jour le 21 novembre 2026.

**En une phrase :** la conception est posée, l'habillage (images, sons, voix) est en pause, et on teste en texte seul plusieurs systèmes de combat auprès de testeurs pour choisir le plus prenant.

## Fait

### Conception

- Cahier des charges et contrat de données validés par Simon (`docs/`).
- Règles de base : système D6, héros prédéfini (Habileté 7, Vie 12, 3 dés de chance), donjon de 8 salles plus un boss, sauvegarde à chaque salle.
- Bestiaire : gobelin, squelette, araignée géante, loup-garou, le Murmureur (créature propre au jeu), et un démon en boss final.
- Intrigue générale et prologue en cinq parties (`docs/intrigue.md`) : à Legia, un groupe de francs-tireurs enquête sur des pèlerins disparus et découvre un pacte avec un démon ; piégé dans les catacombes, un seul survit, le héros.

### Illustrations

- 16 images en pixel art monochrome, générées avec Canva puis converties par script, affichables en quatre couleurs.
- Au format du jeu dans la branche `illustrations-essai` (`assets/images/`), en blanc sur noir dans le dossier Drive, originaux dans Canva.
- Les règles de style et le bestiaire ont été ajoutés au cahier des charges sur la branche `illustrations-essai`, pas encore sur `main`.

### Premier prototype (branche `illustrations-essai`)

- `prototype/premier-combat.html` : porte, salle, combat contre un gobelin, butin.
- Dés animés à l'écran, jauges de vie, table de combat qui explique le calcul.
- Bruitages et ambiance fabriqués par le jeu, couleur sonore rétro.
- Voix en suspens : la synthèse du navigateur a été jugée mauvaise, et la voix enregistrée ne fonctionnait plus sur iPhone.

### Voix

- Deux voix neuronales essayées : A (Siwis, féminine, licence CC-BY 4.0) et B (Tom, masculine, licence AGPL). Simon préfère B.
- Décision : Simon fera enregistrer les textes par une personne. Liste des 118 phrases du prototype, avec consignes, dans le document « Textes à enregistrer — Premier combat » sur Claude.

### Essai des combats en texte seul (`main`)

- `essais/combats.html`, publiée sur GitHub Pages, compare sept systèmes :
  - **A :** relance risquée.
  - **B :** garder et relancer, inspiré de King of Tokyo.
  - **C :** lire le monstre, avec un indice sonore ou un indice texte.
  - **D :** seuil et karma, inspiré d'EZD6.
  - **E :** deux actions par tour, inspiré de TinyD6.
  - **F :** réserve de dés et états de santé, inspiré de Mini Six.
  - **G :** 2 dés contre 9, inspiré de Barbarians of Lemuria.
- Chaque combat terminé et chaque avis de testeur sont envoyés à la feuille Google « Essai des combats — résultats des testeurs ».
- La collecte fonctionne : premiers combats reçus le 20 novembre.
- Depuis le 20 novembre, les combats se jouent en tour par tour dans les sept systèmes. Tu lances tes dés, puis tes dégâts si le système en a. Ensuite seulement, le monstre lance ses dés, puis ses dégâts s'il te touche, chacun sur son bouton. Chaque assaut se termine par un bilan des points de vie des deux combattants (états de santé en F, squelettes encore debout en G).
- Depuis le 21 novembre, la page est découpée en écrans : menu principal (Jouer, Avis, Résultats et journal, Réglages), une question par écran, règles page par page. En combat, seuls les compteurs (monstre à gauche, héros à droite), le récit de l'étape et les choix sont affichés. Le système C se joue uniquement au son.
- Illustrations à l'encre dans l'essai des combats (21 novembre) : squelette, loup-garou et démon (`essais/images/`), en grand sur l'écran « Ton adversaire », puis en bandeau sous les compteurs. Images décoratives, ignorées par le lecteur d'écran ; un réglage permet de les masquer. Le style à l'encre reste un essai non validé.
- Essai des dés en 3D (21 novembre, `essais/des.html`) : 1, 2, 3 ou 6 dés qui roulent à l'écran en 1,5 seconde et s'arrêtent sur le bon résultat, avec un bruit de dés fabriqué par le programme. Le résultat est écrit à la fin, pour le lecteur d'écran. Validé par Simon et intégré à l'essai des combats le 21 novembre : chaque jet roule à l'écran avant que le récit et les boutons n'apparaissent ; les compteurs changent une fois les dés arrêtés. Réglage « Animation et bruit des dés ». Le moteur des dés est commun aux deux pages (`essais/des3d.js`).
- Bruitages et ambiance dans l'essai des combats (21 novembre, `essais/sons.js`) : cri de chaque monstre à son arrivée, cri de douleur et choc de lame quand il est touché, puis cri de rage (trois variantes par monstre, plus furieux quand il lui reste peu de vie), son de mort, coup sourd quand le héros est touché, parade, coup dans le vide, dés de chance, fanfare, glas, fuite, et ambiance de fond (grondement, gouttes d'eau). Sons rétro fabriqués par le programme, joués quand les dés s'arrêtent. Réglage « Bruitages et ambiance » et sous-menu « Écouter les bruitages ».
- L'histoire dans l'essai des combats (21 novembre) : « 1. L'histoire » dans le menu principal, le prologue de `docs/intrigue.md` en cinq parties, une par écran, avec une musique sombre fabriquée par le programme (`essais/musique.js` : orgue grave en ré mineur, bourdon, cloche lointaine) qui joue tant qu'on lit. Case « Musique de l'histoire » dans Réglages.

## En cours

- Séances de test des systèmes de combat avec plusieurs joueurs.

## Prochaines étapes

1. Choisir le système de combat d'après la feuille de résultats et les avis.
2. Tester les mécaniques suivantes en texte seul :
   - **Les portes avec écoute :** choisir entre plusieurs portes en écoutant ce qu'il y a derrière.
   - **Le stop ou encore :** le butin transporté est perdu à la mort ; on le met à l'abri à un feu de camp.
3. Reporter sur `main` ce qui est validé dans la branche `illustrations-essai` (cahier des charges, illustrations).
4. Reprendre l'habillage (images, sons, voix enregistrée) une fois les mécaniques choisies.

## Questions ouvertes

- **Licence de la voix B :** l'usage des enregistrements produits avec elle n'est pas clair. À vérifier avant toute diffusion, ou passer à la voix A ou à une voix humaine.
- **Lecteur d'écran :** que fait le jeu si VoiceOver ou TalkBack est déjà actif ?
- **Dés de chance :** réussite à 4 ou plus, ou à 5 ou plus ? Les deux sont testés.
- **Ton des monstres :** sombre seulement, ou une touche d'humour ?
- **Intrigue :** nom du démon, nom et rôle du frère hospitalier, sort des compagnons, fin de l'aventure (voir `docs/intrigue.md`).
