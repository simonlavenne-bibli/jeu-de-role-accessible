/**
 * principal.js — Point d'entrée de la page « Essai des combats ».
 *
 * Relie les écrans du menu, les réglages, l'histoire, la collecte des résultats
 * et l'affichage du combat. Les règles du combat sont dans ../moteur/.
 */
import { installerBruitages } from './reglages.js';
import { installerHistoire } from './histoire.js';
import { installerCollecte } from './collecte.js';
import { installerCombat } from './combat.js';

var collecte = installerCollecte();

// Affiche un seul écran à la fois et place le focus sur son titre.
function montrer(id) {
  if (id !== 'histoire' && window.Musique) { Musique.arreter(); }
  document.querySelectorAll('.ecran').forEach(function (e) { e.hidden = (e.id !== id); });
  if (id === 'resultats') { collecte.afficherBilan(); }
  var titre = document.querySelector('#' + id + ' h1');
  if (id !== 'combat' && titre) { titre.focus(); }
  window.scrollTo(0, 0);
}

installerBruitages();
installerHistoire(montrer);
var combats = installerCombat(montrer, collecte);

// Navigation : système, puis adversaire, puis le combat.
var choix = { systeme: null, monstre: null };

document.querySelectorAll('[data-aller]').forEach(function (b) {
  b.addEventListener('click', function () { montrer(b.getAttribute('data-aller')); });
});
document.querySelectorAll('[data-systeme]').forEach(function (b) {
  b.addEventListener('click', function () {
    choix.systeme = b.getAttribute('data-systeme');
    montrer(choix.systeme === 'C' ? 'conseil-son' : 'choix-monstre');
  });
});
document.querySelectorAll('[data-monstre]').forEach(function (b) {
  b.addEventListener('click', function () {
    choix.monstre = b.getAttribute('data-monstre');
    // Pendant l'appui : iPhone n'autorise le son qu'à ce moment-là.
    if (window.Sons) { Sons.preparer(); }
    combats.commencer(choix.systeme, choix.monstre);
  });
});
