/**
 * histoire.js — Le prologue, une partie par écran, avec une musique sombre (module musique.js).
 */
import { caseMemorisee } from './reglages.js';

// Texte repris de docs/intrigue.md (prologue). Tutoiement, sans nom ni genre.
var HISTOIRE = [
  {
    "titre": "Legia",
    "texte": [
      "Legia ne s'est jamais tant aimée qu'en ces jours-là.",
      "Pendant des siècles, la ville s'est inclinée devant ses évêques. Puis les guerres contre le duc de Limbourg ont saigné leurs trésors, une saison après l'autre, jusqu'à la dernière pièce. Les guildes ont payé. Elles ont payé chaque impôt, chaque rançon, chaque mur relevé. Et à chaque fois, elles ont demandé quelque chose en retour : un droit, un siège, une clé.",
      "Un matin, Legia s'est réveillée sans maître. Les guildes avaient élu l'un des leurs, et la ville avait un mayeur.",
      "Un pouvoir neuf est un pouvoir fragile. L'évêque, qui garde la cathédrale, n'a rien pardonné, et le duc guette depuis ses forêts. Le mayeur le sait : la moindre erreur suffirait à tout faire tomber."
    ]
  },
  {
    "titre": "La commande",
    "texte": [
      "Vous l'avez rencontré une nuit, dans l'arrière-salle d'une maison de guilde, volets clos. Il n'a pas tourné autour du pot.",
      "Des pèlerins disparaissent. Ils montent au Mont-Legia prier la Lumière, et personne ne les revoit. Si la rumeur enfle, ils iront prier ailleurs, et Legia perdra ce qui la nourrit. Le mayeur ne peut demander de l'aide ni au duc, ni à l'évêque. Il lui fallait des gens sans bannière.",
      "Il lui fallait des francs-tireurs.",
      "Vous étiez quatre : Bertrand, l'épée la plus sûre de la compagnie ; Isaure, qui lisait dans les flammes ce que les autres refusaient de voir ; Gilles, capable d'ouvrir n'importe quelle porte sans la faire grincer. Et toi.",
      "Le mayeur a posé une bourse sur la table, puis il a ajouté, sans lever les yeux : « Si l'on vous prend, je ne vous connais pas. »"
    ]
  },
  {
    "titre": "Le Mont-Legia",
    "texte": [
      "La cathédrale se voit de partout. Elle domine la ville comme une promesse.",
      "Des malades viennent de tout le continent toucher ses pierres. On y raconte des miracles : un aveugle qui revoit le jour, un enfant que la fièvre a quitté. Les cierges y brûlent nuit et jour, et l'or des offrandes s'entasse aux pieds de la Lumière.",
      "Pendant des semaines, vous vous êtes fondus dans la foule. Vous avez prié avec les pèlerins, mangé leur pain, écouté leurs histoires. Et vous avez remarqué ce que personne ne voulait remarquer : les miracles touchaient toujours des pèlerins aux bourses pleines. Ceux qui disparaissaient n'avaient jamais rien."
    ]
  },
  {
    "titre": "Le marché",
    "texte": [
      "La plupart des frères n'en savaient rien. Ils priaient sincèrement et soignaient de leur mieux, aveugles à ce qui se tramait sous leurs pieds.",
      "Mais un nom revenait toujours. Celui du frère hospitalier, qui accueille les pauvres à la porte, leur offre un lit pour la nuit, et décide lesquels on ne reverra pas.",
      "Isaure a été la première à comprendre. Une nuit, en contemplant les flammes, elle a pâli. « Ce ne sont pas des miracles, a-t-elle murmuré. C'est un marché. »",
      "Quelque chose dort sous la cathédrale, et ce quelque chose a faim. Il accorde aux riches leurs petites guérisons. En paiement, on lui livre ceux qui ne manqueront à personne."
    ]
  },
  {
    "titre": "Les catacombes",
    "texte": [
      "Il vous a fallu trois tentatives. La troisième fois, Gilles a fait céder la grille derrière l'autel sans un bruit. Vous êtes descendus, une torche pour quatre, dans l'air froid qui sentait la pierre et la cire.",
      "Vous aviez été vus.",
      "Le grondement est venu de derrière, sourd, énorme. La voûte s'est ouverte comme une gorge. Il y a eu la poussière, le fracas, une main qui cherchait la tienne, puis plus rien.",
      "Quand le silence est revenu, la torche brûlait encore, couchée sur les dalles. Derrière toi, un mur de roche a remplacé l'escalier. Tu as appelé Bertrand, Isaure, Gilles. Seul l'écho t'a répondu.",
      "Devant toi, le couloir s'enfonce dans l'obscurité.",
      "Il n'y a plus de retour possible. Il ne reste qu'à avancer."
    ]
  }
];

// montrer(id) : affiche un écran du menu.
export function installerHistoire(montrer) {
  var caseMusique = caseMemorisee('reglage-musique', 'musique');

  function montrerHistoire(i) {
    var partieHistoire = HISTOIRE[i];
    document.getElementById('page-histoire').textContent = 'Partie ' + (i + 1) + ' sur ' + HISTOIRE.length;
    document.getElementById('titre-histoire').textContent = partieHistoire.titre;
    var zone = document.getElementById('texte-histoire');
    zone.textContent = '';
    partieHistoire.texte.forEach(function (t) {
      var p = document.createElement('p');
      p.textContent = t;
      zone.appendChild(p);
    });
    var boutons = [];
    if (i + 1 < HISTOIRE.length) {
      boutons.push(['Suivant', function () { montrerHistoire(i + 1); }]);
    } else {
      boutons.push(['Jouer un combat', function () { montrer('choix-systeme'); }]);
    }
    if (i > 0) { boutons.push(['Précédent', function () { montrerHistoire(i - 1); }]); }
    boutons.push(['Menu principal', function () { montrer('menu'); }]);
    var zoneBoutons = document.getElementById('choix-histoire');
    zoneBoutons.textContent = '';
    boutons.forEach(function (c, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = (n + 1) + '. ' + c[0];
      b.addEventListener('click', c[1]);
      zoneBoutons.appendChild(b);
    });
    montrer('histoire');
  }

  document.getElementById('ouvrir-histoire').addEventListener('click', function () {
    // La musique démarre ici, pendant l'appui : iPhone ne l'autorise qu'à ce moment-là.
    if (caseMusique.checked && window.Musique) { Musique.jouer(); }
    montrerHistoire(0);
  });

  // Dans l'histoire, les chiffres choisissent aussi les boutons.
  document.addEventListener('keydown', function (e) {
    if (document.getElementById('histoire').hidden) { return; }
    var k = parseInt(e.key, 10);
    var bh = document.querySelectorAll('#choix-histoire button');
    if (k >= 1 && bh[k - 1]) { e.preventDefault(); bh[k - 1].click(); }
  });
}
