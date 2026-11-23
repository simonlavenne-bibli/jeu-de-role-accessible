/**
 * signes-sonores.js — Système C : le son par lequel le monstre annonce son intention.
 *
 *   bondir   : un son qui monte
 *   proteger : deux sons graves, courts et étouffés
 *   tourner  : trois sons qui passent d'une oreille à l'autre
 * Chaque monstre a sa voix. Hauteur et durée varient un peu à chaque assaut.
 * Sons générés dans la page, sans fichier.
 */
var VOIX = {
  'squelette':  { onde: 'square',   base: 660, filtre: 5000, volume: 0.12, cliquetis: true },
  'loup-garou': { onde: 'sawtooth', base: 130, filtre: 1200, volume: 0.30, grondement: true },
  'demon':      { onde: 'sawtooth', base: 65,  filtre: 600,  volume: 0.40, souffle: true }
};

var audio = null;
var bruitBlanc = null;

export function preparerAudio() {
  if (!window.Mixeur || !Mixeur.preparer()) { return false; }
  if (!audio) {
    audio = Mixeur.contexte();   // le contexte unique de la page (essais/audio.js)
    bruitBlanc = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    var data = bruitBlanc.getChannelData(0);
    for (var i = 0; i < data.length; i++) { data[i] = Math.random() * 2 - 1; }
  }
  return true;
}

function hasard(min, max) { return min + Math.random() * (max - min); }

// Un son : glissement de fréquence, enveloppe, filtre, position gauche-droite.
function son(voix, t, f1, f2, duree, pan, filtre) {
  var sortie = Mixeur.couche('indices');
  if (audio.createStereoPanner) {
    var p = audio.createStereoPanner();
    p.pan.value = pan;
    p.connect(sortie);
    sortie = p;
  }
  var env = audio.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(voix.volume, t + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  env.connect(sortie);

  var lp = audio.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = filtre || voix.filtre;
  lp.connect(env);

  var entree = lp;
  if (voix.grondement) {
    var trem = audio.createGain();
    trem.gain.value = 0.6;
    var lfo = audio.createOscillator();
    var prof = audio.createGain();
    lfo.frequency.value = 28;
    prof.gain.value = 0.4;
    lfo.connect(prof);
    prof.connect(trem.gain);
    trem.connect(lp);
    entree = trem;
    lfo.start(t);
    lfo.stop(t + duree + 0.05);
  }

  var osc = audio.createOscillator();
  osc.type = voix.onde;
  osc.frequency.setValueAtTime(f1, t);
  osc.frequency.exponentialRampToValueAtTime(f2, t + duree);
  osc.connect(entree);
  osc.start(t);
  osc.stop(t + duree + 0.05);

  if (voix.souffle) {
    var b = audio.createBufferSource();
    b.buffer = bruitBlanc;
    var bp = audio.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(f1 * 6, t);
    bp.frequency.exponentialRampToValueAtTime(f2 * 6, t + duree);
    bp.Q.value = 2;
    b.connect(bp);
    bp.connect(env);
    b.start(t);
    b.stop(t + duree + 0.05);
  }
}

// Le squelette « cliquette » : un glissement devient une suite de clics.
function segment(voix, t, f1, f2, duree, pan, filtre) {
  if (!voix.cliquetis) { son(voix, t, f1, f2, duree, pan, filtre); return; }
  var n = Math.max(2, Math.round(duree / 0.06));
  for (var i = 0; i < n; i++) {
    var f = f1 * Math.pow(f2 / f1, i / (n - 1));
    son(voix, t + i * (duree / n), f, f * 0.97, 0.03, pan, filtre);
  }
}

// Tire une variante (hauteur, durée, côté) pour cet assaut.
export function tirerVariante() {
  return { h: hasard(0.88, 1.14), d: hasard(0.85, 1.15), cote: Math.random() < 0.5 ? -1 : 1 };
}

export function jouerSigne(cleMonstre, intention, v) {
  if (!preparerAudio()) { return; }
  if (window.Sons) { Sons.attenuer(2500); }
  var voix = VOIX[cleMonstre];
  var f = voix.base * v.h;
  var t = audio.currentTime + 0.05;
  if (intention === 'bondir') {
    segment(voix, t, f, f * 2.6, 0.7 * v.d, 0);
  } else if (intention === 'proteger') {
    segment(voix, t, f * 0.6, f * 0.5, 0.16 * v.d, 0, voix.filtre * 0.35);
    segment(voix, t + 0.24 * v.d, f * 0.6, f * 0.5, 0.16 * v.d, 0, voix.filtre * 0.35);
  } else {
    [0, 1, 2].forEach(function (i) {
      var pan = (i % 2 === 0 ? 1 : -1) * v.cote * 0.9;
      segment(voix, t + i * 0.28 * v.d, f, f * 0.98, 0.18 * v.d, pan);
    });
  }
}
