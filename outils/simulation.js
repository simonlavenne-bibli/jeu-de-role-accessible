/**
 * simulation.js — Taux de victoire de chaque système contre chaque adversaire.
 *
 *   node outils/simulation.js          (2 000 combats par case)
 *   node outils/simulation.js 10000
 *
 * Le joueur simulé joue simplement : il attaque toujours, ne fuit jamais,
 * lance ses dés de chance, relance quand on le lui propose.
 * Pour le système C, deux joueurs : l'un devine au hasard, l'autre lit
 * toujours bien le monstre. L'écart montre le poids de l'écoute.
 * Les réglages se changent dans essais/combats/moteur/donnees.js.
 */
import { jouer, LISTE_SYSTEMES, LISTE_MONSTRES } from '../tests/robot.js';

var N = parseInt(process.argv[2], 10) || 2000;
var BONNE_POSTURE = { bondir: 'Esquiver', proteger: 'Attaquer', tourner: 'Parer' };

function joueur(systeme, lecture) {
  return function (libelles, hasard, partie, intention) {
    if (libelles[0] === 'Suivant') { return 1; } // passer les règles
    if (systeme === 'C' && libelles.includes('Esquiver')) {
      return lecture === 'parfaite' ? libelles.indexOf(BONNE_POSTURE[intention]) : Math.floor(hasard() * 3);
    }
    return 0;
  };
}

function taux(systeme, monstre, lecture) {
  var victoires = 0, tours = 0;
  for (var g = 1; g <= N; g += 1) {
    var r = jouer({ systeme: systeme, monstre: monstre, graine: g, choisir: joueur(systeme, lecture) });
    if (r.resultat.issue === 'victoire') { victoires += 1; }
    tours += r.partie.tours;
  }
  return { victoires: Math.round(100 * victoires / N), tours: (tours / N).toFixed(1) };
}

var lignes = [];
LISTE_SYSTEMES.forEach(function (s) {
  (s === 'C' ? ['hasard', 'parfaite'] : [null]).forEach(function (lecture) {
    var nom = s + (lecture ? ' (lecture ' + lecture + ')' : '');
    var cases = LISTE_MONSTRES.map(function (m) { var t = taux(s, m, lecture); return (t.victoires + ' %').padStart(5) + ' en ' + t.tours.padStart(4) + ' tours'; });
    lignes.push(nom.padEnd(22) + cases.join('   '));
  });
});
console.log('Victoires sur ' + N + ' combats par case\n');
console.log(''.padEnd(22) + LISTE_MONSTRES.map(function (m) { return m.padEnd(22); }).join(' '));
lignes.forEach(function (l) { console.log(l); });
