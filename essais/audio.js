/**
 * audio.js — Le contexte audio unique de la page, et les couches de son réglables.
 *
 * Avant, chaque module (bruitages, musique, dés, indices du système C) créait
 * son propre contexte audio. iPhone en limite le nombre et oblige à débloquer
 * chacun pendant un appui. Maintenant, tous passent par celui-ci.
 *
 * Chaque son va dans une couche, dont le volume se règle séparément
 * (cahier des charges, §4 et §7) et est gardé sur l'appareil :
 *   bruitages  coups, cris, dés, fanfares
 *   ambiance   le fond du donjon (grondement, gouttes)
 *   musique    la musique de l'histoire
 *   indices    les sons par lesquels le monstre annonce son intention (système C)
 *
 *   Mixeur.preparer();                 // pendant un appui du joueur (iPhone)
 *   var audio = Mixeur.contexte();
 *   noeud.connect(Mixeur.couche('bruitages'));
 *   Mixeur.volume('ambiance', 0.5);    // de 0 à 1
 */
(function () {
  'use strict';

  var COUCHES = ['bruitages', 'ambiance', 'musique', 'indices'];
  var audio = null;
  var gains = {};

  function lireVolume(nom) {
    var v = null;
    try { v = localStorage.getItem('volume-' + nom); } catch (e) { /* stockage indisponible */ }
    v = v === null ? 1 : parseFloat(v);
    return isNaN(v) ? 1 : Math.max(0, Math.min(1, v));
  }

  // À appeler pendant un appui du joueur : iPhone n'autorise le son qu'à ce moment-là.
  // Rend faux si le navigateur ne sait pas jouer de son.
  function preparer() {
    if (!audio) {
      var Contexte = window.AudioContext || window.webkitAudioContext;
      if (!Contexte) { return false; }
      audio = new Contexte();
      COUCHES.forEach(function (nom) {
        var g = audio.createGain();
        g.gain.value = lireVolume(nom);
        g.connect(audio.destination);
        gains[nom] = g;
      });
    }
    if (audio.state === 'suspended') { audio.resume(); }
    return true;
  }

  function contexte() { return audio; }

  function couche(nom) {
    if (!gains[nom]) { throw new Error('Couche de son inconnue : ' + nom); }
    return gains[nom];
  }

  // Règle le volume d'une couche (0 à 1), et le garde sur l'appareil.
  function volume(nom, valeur) {
    valeur = Math.max(0, Math.min(1, valeur));
    try { localStorage.setItem('volume-' + nom, String(valeur)); } catch (e) { /* stockage indisponible */ }
    if (audio && gains[nom]) {
      var t = audio.currentTime;
      gains[nom].gain.cancelScheduledValues(t);
      gains[nom].gain.setValueAtTime(gains[nom].gain.value, t);
      gains[nom].gain.linearRampToValueAtTime(valeur, t + 0.05);
    }
  }

  // Pour le panneau de diagnostic.
  function etat() { return audio ? audio.state : (window.AudioContext || window.webkitAudioContext ? 'pas encore créé' : 'non disponible'); }

  window.Mixeur = { preparer: preparer, contexte: contexte, couche: couche, volume: volume, lireVolume: lireVolume, etat: etat, COUCHES: COUCHES };
})();
