/**
 * principal.js — Point d'entrée de la page « Essai des combats ».
 *
 * Relie les écrans du menu, les réglages, l'histoire, la collecte des résultats
 * et l'affichage du combat. Les règles du combat sont dans ../moteur/.
 */
import { installerBruitages, installerAffichage } from './reglages.js';
import { installerHistoire } from './histoire.js';
import { installerCollecte } from './collecte.js';
import { installerCombat } from './combat.js';

var collecte = installerCollecte();

// Hors ligne et installation sur l'écran d'accueil (sw.js). Sans effet si le navigateur ne le permet pas.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () { /* pas de hors ligne, la page marche quand même */ });
  });
}

// Affiche un seul écran à la fois et place le focus sur son titre.
function montrer(id) {
  if (id !== 'histoire' && window.Musique) { Musique.arreter(); }
  document.querySelectorAll('.ecran').forEach(function (e) { e.hidden = (e.id !== id); });
  if (id === 'resultats') { collecte.afficherBilan(); }
  var titre = document.querySelector('#' + id + ' h1');
  if (id !== 'combat' && titre) { titre.focus(); }
  window.scrollTo(0, 0);
}

installerAffichage();
installerBruitages();
installerHistoire(montrer);
var combats = installerCombat(montrer, collecte);

// ---------------------------------------------------------------------
// RÉGLAGES DEPUIS N'IMPORTE QUEL ÉCRAN (touche O), et retour à cet écran
// ---------------------------------------------------------------------
var ecranAvantReglages = 'menu';

function ecranVisible() {
  var e = document.querySelector('.ecran:not([hidden])');
  return e ? e.id : 'menu';
}

function ouvrirReglages() {
  var actuel = ecranVisible();
  if (actuel !== 'reglages' && actuel !== 'ecouter-sons') { ecranAvantReglages = actuel; }
  montrer('reglages');
}

document.getElementById('quitter-reglages').addEventListener('click', function () {
  var retour = ecranAvantReglages;
  ecranAvantReglages = 'menu';
  if (retour === 'combat' && combats.reprendre()) { return; }
  montrer(retour === 'histoire' ? 'menu' : retour);
});

// ---------------------------------------------------------------------
// CLAVIER COMMUN À TOUS LES ÉCRANS (cahier des charges, §9)
// ---------------------------------------------------------------------
function saisieEnCours() {
  var a = document.activeElement;
  return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT');
}

// Les boutons qu'on parcourt aux flèches sur l'écran visible : les choix d'abord.
function boutonsDeLEcran() {
  var ecran = document.querySelector('.ecran:not([hidden])');
  if (!ecran) { return []; }
  return Array.prototype.filter.call(ecran.querySelectorAll('button'), function (b) {
    return !b.disabled && b.offsetParent !== null && !b.closest('#des');
  });
}

document.addEventListener('keydown', function (e) {
  if (e.ctrlKey || e.metaKey || e.altKey || saisieEnCours()) { return; }
  if (document.getElementById('combat').classList.contains('roule')) { return; }
  if (e.key === 'o' || e.key === 'O') { e.preventDefault(); ouvrirReglages(); return; }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') { return; }
  var boutons = boutonsDeLEcran();
  if (!boutons.length) { return; }
  e.preventDefault();
  var i = boutons.indexOf(document.activeElement);
  if (i < 0) { boutons[e.key === 'ArrowDown' ? 0 : boutons.length - 1].focus(); return; }
  var suivant = (i + (e.key === 'ArrowDown' ? 1 : -1) + boutons.length) % boutons.length;
  boutons[suivant].focus();
});

// Navigation : système, puis adversaire, puis le combat.
var choix = { systeme: null, monstre: null };

document.querySelectorAll('[data-aller]').forEach(function (b) {
  b.addEventListener('click', function () {
    var cible = b.getAttribute('data-aller');
    if (cible === 'reglages') { ouvrirReglages(); return; }
    montrer(cible);
  });
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
