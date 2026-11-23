/**
 * musique.js — Musique sombre de l'histoire, fabriquée par le programme.
 *
 * Nappes d'orgue graves en ré mineur, bourdon et cloche lointaine, dans l'esprit
 * rétro des premières cartes son. Elle se joue en boucle, en douceur, assez bas
 * pour ne pas couvrir le lecteur d'écran.
 *
 *   Musique.jouer();    // pendant un appui du joueur (iPhone)
 *   Musique.arreter();  // fondu de sortie
 */
(function () {
  'use strict';

  var VOLUME = 0.16;
  var DUREE_ACCORD = 6;        // secondes par accord
  var audio = null;
  var sortie = null;
  var minuteur = null;
  var enCours = false;
  var prochain = 0;            // instant du prochain accord
  var rang = 0;                // position dans la progression
  var bourdons = [];

  function hz(note) { return 440 * Math.pow(2, (note - 69) / 12); }   // numéro MIDI → fréquence
  function entre(a, b) { return a + Math.random() * (b - a); }

  // Ré mineur, couleur sombre : Rém, Sib, Solm, La (le do dièse donne la tension).
  var PROGRESSION = [
    [50, 53, 57],   // ré fa la
    [46, 50, 53],   // si bémol ré fa
    [43, 46, 50],   // sol si bémol ré
    [45, 49, 52]    // la do dièse mi
  ];
  var CLOCHE = [74, 77, 81, 69, 72];   // ré, fa, la, la, do aigus

  function preparer() {
    if (!window.Mixeur || !Mixeur.preparer()) { return false; }
    if (!audio) {
      audio = Mixeur.contexte();   // le contexte unique de la page (audio.js)
      sortie = audio.createGain();
      sortie.gain.value = 0;
      sortie.connect(Mixeur.couche('musique'));
    }
    return true;
  }

  // Une note d'orgue : deux ondes légèrement désaccordées, attaque et extinction lentes.
  function orgue(t, note, duree, volume) {
    var filtre = audio.createBiquadFilter();
    filtre.type = 'lowpass';
    filtre.frequency.value = 900;
    var g = audio.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(volume, t + 1.6);
    g.gain.setValueAtTime(volume, t + duree - 1.2);
    g.gain.linearRampToValueAtTime(0.0001, t + duree + 1.5);
    filtre.connect(g);
    g.connect(sortie);
    [-4, 4].forEach(function (cents) {
      var osc = audio.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = hz(note);
      osc.detune.value = cents;
      osc.connect(filtre);
      osc.start(t);
      osc.stop(t + duree + 1.6);
    });
  }

  // La cloche lointaine : quelques partiels qui s'éteignent lentement.
  function cloche(t, note) {
    var f = hz(note);
    [[1, 0.05], [2.76, 0.02], [5.4, 0.01]].forEach(function (p) {
      var osc = audio.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f * p[0];
      var g = audio.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(p[1], t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
      osc.connect(g);
      g.connect(sortie);
      osc.start(t);
      osc.stop(t + 4.6);
    });
  }

  // Le bourdon : un ré très grave, tenu tout du long.
  function demarrerBourdon(t) {
    [26, 38].forEach(function (note, i) {
      var osc = audio.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = hz(note);
      var g = audio.createGain();
      g.gain.value = i === 0 ? 0.5 : 0.12;
      osc.connect(g);
      g.connect(sortie);
      osc.start(t);
      bourdons.push(osc);
    });
  }

  // Programme les accords un peu à l'avance, sans jamais s'arrêter.
  function programmer() {
    if (!enCours) { return; }
    while (prochain < audio.currentTime + 2) {
      var accord = PROGRESSION[rang % PROGRESSION.length];
      accord.forEach(function (note) { orgue(prochain, note, DUREE_ACCORD, 0.11); });
      // Une cloche lointaine environ un accord sur deux.
      if (rang % 2 === 1 || Math.random() < 0.3) {
        cloche(prochain + entre(1, 4), CLOCHE[Math.floor(Math.random() * CLOCHE.length)]);
      }
      prochain += DUREE_ACCORD;
      rang += 1;
    }
    minuteur = setTimeout(programmer, 500);
  }

  function jouer() {
    if (enCours || !preparer()) { return; }
    enCours = true;
    var t = audio.currentTime + 0.05;
    sortie.gain.cancelScheduledValues(t);
    sortie.gain.setValueAtTime(sortie.gain.value, t);
    sortie.gain.linearRampToValueAtTime(VOLUME, t + 3);
    demarrerBourdon(t);
    prochain = t;
    rang = 0;
    programmer();
  }

  function arreter() {
    if (!enCours) { return; }
    enCours = false;
    clearTimeout(minuteur);
    var t = audio.currentTime;
    sortie.gain.cancelScheduledValues(t);
    sortie.gain.setValueAtTime(sortie.gain.value, t);
    sortie.gain.linearRampToValueAtTime(0, t + 2);
    var anciens = bourdons;
    bourdons = [];
    anciens.forEach(function (osc) { osc.stop(t + 2.1); });
  }

  window.Musique = { jouer: jouer, arreter: arreter, enCours: function () { return enCours; } };
})();
