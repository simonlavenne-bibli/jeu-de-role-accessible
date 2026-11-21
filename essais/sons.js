/**
 * sons.js — Bruitages et ambiance du combat, fabriqués par le programme.
 *
 * Esprit rétro des années 80 (premières cartes son). Aucun fichier à télécharger :
 * tout est synthétisé avec Web Audio. Les sons ne portent jamais d'information
 * à eux seuls : le jeu écrit toujours ce qui se passe.
 *
 *   Sons.preparer();                       // pendant un appui du joueur (iPhone)
 *   Sons.jouer('apparition', 'loup-garou');
 *   Sons.ambiance(true);
 */
(function () {
  'use strict';

  var audio = null;
  var bruit = null;
  var general = null;        // volume général des bruitages
  var ambianceGain = null;   // volume de l'ambiance de fond
  var ambianceNoeuds = [];
  var minuteurGouttes = null;
  var actif = true;
  var VOLUME_AMBIANCE = 0.05;

  function entre(a, b) { return a + Math.random() * (b - a); }

  // ---------------------------------------------------------------------
  // SONS ENREGISTRÉS (fournis par Simon, libres de droits) : essais/sons/
  // ---------------------------------------------------------------------
  // S'ils ne sont pas encore chargés (ou introuvables), les sons fabriqués prennent le relais.
  var FICHIERS = {
    'cri-monstre': 'sons/cri-monstre.mp3',
    'cri-heros': 'sons/cri-heros.mp3',
    'victoire-monstre': 'sons/victoire-monstre.mp3'
  };
  var enregistrements = {};
  var chargementLance = false;

  function chargerEnregistrements() {
    if (chargementLance || !window.fetch) { return; }
    chargementLance = true;
    Object.keys(FICHIERS).forEach(function (nom) {
      fetch(FICHIERS[nom])
        .then(function (r) { if (!r.ok) { throw new Error(r.status); } return r.arrayBuffer(); })
        .then(function (donnees) {
          // Forme à rappels : acceptée aussi par les anciens Safari.
          audio.decodeAudioData(donnees, function (tampon) { enregistrements[nom] = tampon; }, function () { /* son fabriqué à la place */ });
        })
        .catch(function () { /* hors ligne ou fichier absent : son fabriqué à la place */ });
    });
  }

  // Joue un enregistrement. vitesse < 1 : plus grave et plus lent ; > 1 : plus aigu et plus sec.
  // Rend sa durée en secondes, ou 0 s'il n'est pas disponible.
  function enregistrement(nom, t, o) {
    var tampon = enregistrements[nom];
    if (!tampon) { return 0; }
    o = o || {};
    var source = audio.createBufferSource();
    source.buffer = tampon;
    source.playbackRate.value = o.vitesse || 1;
    var g = audio.createGain();
    g.gain.value = o.volume || 0.9;
    source.connect(g);
    sortie(g, o.pan);
    source.start(t);
    return tampon.duration / (o.vitesse || 1);
  }

  // Hauteur du cri enregistré selon le monstre.
  var VITESSE_CRI = { squelette: 1.25, 'loup-garou': 1, demon: 0.75 };

  function preparer() {
    if (!audio) {
      var Contexte = window.AudioContext || window.webkitAudioContext;
      if (!Contexte) { return false; }
      audio = new Contexte();
      bruit = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
      var d = bruit.getChannelData(0);
      for (var i = 0; i < d.length; i += 1) { d[i] = Math.random() * 2 - 1; }
      general = audio.createGain();
      general.gain.value = 0.8;
      general.connect(audio.destination);
      ambianceGain = audio.createGain();
      ambianceGain.gain.value = 0;
      ambianceGain.connect(audio.destination);
      chargerEnregistrements();
    }
    if (audio.state === 'suspended') { audio.resume(); }
    return true;
  }

  // ---------------------------------------------------------------------
  // BRIQUES DE BASE
  // ---------------------------------------------------------------------
  // Sortie avec placement gauche-droite si le navigateur le permet.
  function sortie(noeud, pan, vers) {
    if (pan && audio.createStereoPanner) {
      var p = audio.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      noeud.connect(p);
      p.connect(vers || general);
    } else {
      noeud.connect(vers || general);
    }
  }

  // Enveloppe : montée rapide, puis descente jusqu'au silence.
  function enveloppe(g, t, volume, attaque, duree) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), t + attaque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  }

  // Une note : forme d'onde, fréquence qui glisse de f1 à f2.
  // o : { type, f1, f2, duree, volume, attaque, pan, filtre, vibrato }
  function note(t, o) {
    var osc = audio.createOscillator();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f1, t);
    if (o.f2 && o.f2 !== o.f1) { osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.duree); }
    if (o.vibrato) {
      var lfo = audio.createOscillator();
      var profondeur = audio.createGain();
      lfo.frequency.value = o.vibrato[0];
      profondeur.gain.value = o.vibrato[1];
      lfo.connect(profondeur);
      profondeur.connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + o.duree + 0.05);
    }
    var g = audio.createGain();
    enveloppe(g, t, o.volume || 0.2, o.attaque || 0.01, o.duree);
    var dernier = osc;
    if (o.filtre) {
      var f = audio.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.filtre;
      osc.connect(f);
      dernier = f;
    }
    dernier.connect(g);
    sortie(g, o.pan);
    osc.start(t);
    osc.stop(t + o.duree + 0.05);
  }

  // Un souffle de bruit filtré, dont le filtre glisse de f1 à f2.
  // o : { type ('bandpass', 'lowpass', 'highpass'), f1, f2, q, duree, volume, attaque, pan }
  function souffle(t, o) {
    var src = audio.createBufferSource();
    src.buffer = bruit;
    var f = audio.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f1, t);
    if (o.f2 && o.f2 !== o.f1) { f.frequency.exponentialRampToValueAtTime(o.f2, t + o.duree); }
    var g = audio.createGain();
    enveloppe(g, t, o.volume || 0.2, o.attaque || 0.005, o.duree);
    src.connect(f);
    f.connect(g);
    sortie(g, o.pan);
    src.start(t, entre(0, 1));
    src.stop(t + o.duree + 0.05);
  }

  // Un choc court (os, bois) : bruit très bref et aigu.
  function clic(t, hauteur, volume, pan) {
    souffle(t, { type: 'bandpass', f1: hauteur, f2: hauteur * 0.8, q: 6, duree: 0.04, volume: volume, attaque: 0.002, pan: pan });
  }

  // Un coup sourd.
  function sourd(t, volume) {
    note(t, { type: 'sine', f1: 140, f2: 45, duree: 0.25, volume: volume, attaque: 0.003 });
    souffle(t, { type: 'lowpass', f1: 500, f2: 120, duree: 0.15, volume: volume * 0.6 });
  }

  // ---------------------------------------------------------------------
  // LES BRUITAGES
  // ---------------------------------------------------------------------
  var BRUITAGES = {
    // --- Arrivée des monstres ---
    'apparition-squelette': function (t) {
      for (var i = 0; i < 10; i += 1) { clic(t + i * entre(0.05, 0.09), entre(2500, 4200), 0.35, entre(-0.6, 0.6)); }
      // Le rire sec : petites notes carrées qui descendent.
      [520, 470, 430, 390].forEach(function (f, i) {
        note(t + 0.8 + i * 0.13, { type: 'square', f1: f, f2: f * 0.9, duree: 0.09, volume: 0.12, filtre: 1800 });
      });
    },
    'apparition-loup-garou': function (t) {
      // Le hurlement : la voix monte, tient, puis retombe en tremblant.
      note(t, { type: 'sawtooth', f1: 280, f2: 620, duree: 0.7, volume: 0.22, attaque: 0.15, filtre: 1400, vibrato: [6, 10] });
      note(t + 0.65, { type: 'sawtooth', f1: 620, f2: 380, duree: 1.0, volume: 0.22, attaque: 0.05, filtre: 1300, vibrato: [6, 14] });
      souffle(t, { type: 'bandpass', f1: 800, f2: 1200, q: 2, duree: 1.6, volume: 0.05, attaque: 0.2 });
    },
    'apparition-demon': function (t) {
      // Le rugissement grave, puis le souffle de feu.
      note(t, { type: 'sawtooth', f1: 95, f2: 60, duree: 1.4, volume: 0.35, attaque: 0.08, filtre: 600, vibrato: [9, 6] });
      note(t, { type: 'square', f1: 48, f2: 38, duree: 1.4, volume: 0.2, attaque: 0.08, filtre: 300 });
      souffle(t, { type: 'lowpass', f1: 300, f2: 900, duree: 1.3, volume: 0.25, attaque: 0.1 });
      souffle(t + 0.9, { type: 'bandpass', f1: 400, f2: 3000, q: 0.8, duree: 0.9, volume: 0.22, attaque: 0.2 });
    },

    // --- Un monstre est touché : le coup de lame, puis son cri ---
    'douleur-squelette': function (t) {
      BRUITAGES.lame(t);
      if (enregistrement('cri-monstre', t + 0.08, { vitesse: VITESSE_CRI.squelette })) { return; }
      souffle(t + 0.08, { type: 'highpass', f1: 1500, f2: 900, duree: 0.08, volume: 0.4 });
      for (var i = 0; i < 6; i += 1) { clic(t + 0.15 + i * 0.05, entre(2000, 3800), 0.3, entre(-0.5, 0.5)); }
    },
    'douleur-loup-garou': function (t) {
      BRUITAGES.lame(t);
      if (enregistrement('cri-monstre', t + 0.08, { vitesse: VITESSE_CRI['loup-garou'] })) { return; }
      note(t + 0.1, { type: 'sawtooth', f1: 700, f2: 1100, duree: 0.12, volume: 0.2, filtre: 2000 });
      note(t + 0.22, { type: 'sawtooth', f1: 1100, f2: 450, duree: 0.25, volume: 0.2, filtre: 1800 });
    },
    'douleur-demon': function (t) {
      BRUITAGES.lame(t);
      if (enregistrement('cri-monstre', t + 0.08, { vitesse: VITESSE_CRI.demon })) { return; }
      note(t + 0.1, { type: 'sawtooth', f1: 130, f2: 75, duree: 0.5, volume: 0.3, attaque: 0.02, filtre: 700, vibrato: [12, 8] });
      souffle(t + 0.1, { type: 'lowpass', f1: 600, f2: 200, duree: 0.4, volume: 0.15 });
    },

    // --- Cris de rage : le monstre touché se reprend et enrage ---
    // f (fureur) : 0 en pleine forme, 1 quand il ne lui reste presque plus de vie.
    // v (variante) : 0, 1 ou 2, tirée au hasard pour éviter la répétition.
    'rage-squelette': function (t, f, v) {
      // Claquement de mâchoire et sifflement rauque.
      var claquements = function (debut, nombre) {
        for (var i = 0; i < nombre; i += 1) {
          clic(debut + i * (0.04 - f * 0.012), entre(1700, 2600), 0.3 + f * 0.2, entre(-0.3, 0.3));
        }
      };
      var siffle = function (debut) {
        souffle(debut, { type: 'highpass', f1: 2600 - f * 600, f2: 4800, duree: 0.45 + f * 0.25, volume: 0.12 + f * 0.1, attaque: 0.05 });
      };
      var n = 6 + Math.round(f * 6);
      if (v === 0) { claquements(t, n); siffle(t + n * 0.035); }
      else if (v === 1) { siffle(t); claquements(t + 0.35, n); }
      else { claquements(t, Math.ceil(n / 2)); claquements(t + 0.4, n); siffle(t + 0.3); }
    },
    'rage-loup-garou': function (t, f, v) {
      var k = 1 + f * 0.25;
      // Le grognement : voix grave qui gronde, puis monte en aboiement.
      var grogne = function (debut, duree) {
        note(debut, { type: 'sawtooth', f1: 95 * k, f2: 120 * k, duree: duree, volume: 0.22 + f * 0.1, attaque: 0.06, filtre: 750, vibrato: [24, 14] });
        souffle(debut, { type: 'bandpass', f1: 500, f2: 700, q: 3, duree: duree, volume: 0.06 + f * 0.05, attaque: 0.06 });
      };
      var aboie = function (debut) {
        note(debut, { type: 'sawtooth', f1: 380 * k, f2: 640 * k, duree: 0.07, volume: 0.24 + f * 0.08, attaque: 0.005, filtre: 2600 });
        note(debut + 0.07, { type: 'sawtooth', f1: 640 * k, f2: 300 * k, duree: 0.12, volume: 0.24 + f * 0.08, attaque: 0.005, filtre: 2400 });
      };
      var aboiements = (v === 1 ? 2 : 1) + (f > 0.6 ? 1 : 0);
      var debut = t;
      if (v === 2) {
        // Babines retroussées : un souffle rageur à la place du grognement.
        souffle(t, { type: 'bandpass', f1: 900, f2: 1300, q: 4, duree: 0.45, volume: 0.16 + f * 0.08, attaque: 0.03 });
        debut += 0.45;
      } else {
        grogne(t, 0.55 - f * 0.15);
        debut += 0.55 - f * 0.15;
      }
      for (var i = 0; i < aboiements; i += 1) { aboie(debut + i * 0.24); }
    },
    'rage-demon': function (t, f, v) {
      var k = 1 + f * 0.2;
      var contours = [[80, 115, 70], [70, 70, 55], [100, 140, 85]];
      var c = contours[v];
      var duree = 0.7 + f * 0.3;
      // Rugissement court : monte, tient, retombe.
      note(t, { type: 'sawtooth', f1: c[0] * k, f2: c[1] * k, duree: duree * 0.4, volume: 0.3 + f * 0.1, attaque: 0.05, filtre: 900, vibrato: [11, 10] });
      note(t + duree * 0.4, { type: 'sawtooth', f1: c[1] * k, f2: c[2] * k, duree: duree * 0.6, volume: 0.3 + f * 0.1, attaque: 0.01, filtre: 800, vibrato: [11, 12] });
      note(t, { type: 'square', f1: c[0] * k / 2, f2: c[2] * k / 2, duree: duree, volume: 0.15, attaque: 0.05, filtre: 300 });
      // Crépitement de feu autour de lui.
      for (var i = 0; i < 10 + Math.round(f * 12); i += 1) {
        clic(t + 0.1 + Math.random() * duree, entre(600, 1600), 0.12 + f * 0.1, entre(-0.9, 0.9));
      }
      souffle(t + 0.2, { type: 'bandpass', f1: 700, f2: 2400, q: 0.8, duree: duree, volume: 0.1 + f * 0.1, attaque: 0.15 });
    },

    // --- Mort des monstres ---
    'mort-squelette': function (t) {
      for (var i = 0; i < 16; i += 1) { clic(t + i * entre(0.03, 0.08), entre(1500, 4000), 0.35 * (1 - i / 20), entre(-0.8, 0.8)); }
      sourd(t + 0.9, 0.3);
    },
    'mort-loup-garou': function (t) {
      note(t, { type: 'sawtooth', f1: 520, f2: 180, duree: 1.2, volume: 0.2, attaque: 0.05, filtre: 1200, vibrato: [7, 15] });
      sourd(t + 1.1, 0.35);
    },
    'mort-demon': function (t) {
      note(t, { type: 'sawtooth', f1: 110, f2: 35, duree: 1.2, volume: 0.3, filtre: 500 });
      souffle(t + 0.3, { type: 'lowpass', f1: 2500, f2: 60, duree: 2.0, volume: 0.5, attaque: 0.01 });
      note(t + 0.3, { type: 'sine', f1: 90, f2: 30, duree: 1.5, volume: 0.5, attaque: 0.01 });
    },

    // --- Le héros ---
    'touche-heros': function (t) {
      sourd(t, 0.45);
      if (enregistrement('cri-heros', t + 0.05)) { return; }
      note(t + 0.06, { type: 'sawtooth', f1: 170, f2: 110, duree: 0.22, volume: 0.18, attaque: 0.02, filtre: 900 });
    },

    // --- Les coups ---
    lame: function (t) {
      souffle(t, { type: 'highpass', f1: 1200, f2: 5000, duree: 0.1, volume: 0.18, attaque: 0.02 });
      souffle(t + 0.08, { type: 'lowpass', f1: 1200, f2: 300, duree: 0.08, volume: 0.3 });
    },
    parade: function (t) {
      // Le bouclier ou la lame qui sonne : quelques fréquences métalliques qui s'éteignent.
      [523, 1230, 1871, 2563].forEach(function (f, i) {
        note(t, { type: 'sine', f1: f, f2: f, duree: 0.7 - i * 0.12, volume: 0.12 - i * 0.02, attaque: 0.002 });
      });
      souffle(t, { type: 'highpass', f1: 3000, duree: 0.05, volume: 0.2 });
    },
    rate: function (t) {
      souffle(t, { type: 'bandpass', f1: 400, f2: 1800, q: 1.5, duree: 0.3, volume: 0.15, attaque: 0.08 });
    },

    // --- Dés de chance ---
    'chance-reussie': function (t) {
      [1047, 1319, 1568, 2093].forEach(function (f, i) {
        note(t + i * 0.07, { type: 'triangle', f1: f, f2: f, duree: 0.35, volume: 0.13, attaque: 0.005 });
      });
    },
    'chance-ratee': function (t) {
      note(t, { type: 'square', f1: 120, f2: 95, duree: 0.45, volume: 0.15, filtre: 800 });
    },

    // --- Fins de combat ---
    victoire: function (t) {
      [262, 330, 392, 523].forEach(function (f, i) {
        note(t + i * 0.12, { type: 'square', f1: f, f2: f, duree: i === 3 ? 0.7 : 0.14, volume: 0.13, filtre: 2500 });
      });
      note(t + 0.36, { type: 'square', f1: 659, f2: 659, duree: 0.7, volume: 0.08, filtre: 2500 });
    },
    // Le monstre a gagné : son cri de victoire (enregistré), avant le glas.
    'victoire-monstre': function (t) {
      if (enregistrement('victoire-monstre', t, { volume: 1 })) { return; }
      note(t, { type: 'sawtooth', f1: 110, f2: 160, duree: 1.2, volume: 0.3, attaque: 0.1, filtre: 900, vibrato: [8, 10] });
    },
    mort: function (t) {
      // Le glas : trois coups de cloche graves.
      for (var i = 0; i < 3; i += 1) {
        [196, 392, 523, 784].forEach(function (f, k) {
          note(t + i * 1.0, { type: 'sine', f1: f, f2: f * 0.995, duree: 1.6 - k * 0.3, volume: 0.18 - k * 0.04, attaque: 0.003 });
        });
      }
    },
    fuite: function (t) {
      for (var i = 0; i < 6; i += 1) { sourd(t + i * (0.22 - i * 0.015), 0.18); }
      // La porte qui claque.
      sourd(t + 1.2, 0.6);
      souffle(t + 1.2, { type: 'lowpass', f1: 900, f2: 100, duree: 0.4, volume: 0.35 });
    }
  };

  /**
   * Joue un bruitage. Pour les sons propres à un monstre, donner sa clé :
   * Sons.jouer('apparition', 'demon'), Sons.jouer('douleur', 'squelette'), Sons.jouer('mort', 'loup-garou').
   * Options : { delai: secondes avant le son, fureur: 0 à 1 (cris de rage) }.
   */
  function jouer(nom, monstre, options) {
    if (!actif || !preparer()) { return; }
    options = options || {};
    var cle = monstre ? nom + '-' + monstre : nom;
    var bruitage = BRUITAGES[cle];
    var fureur = Math.max(0, Math.min(1, options.fureur || 0));
    if (bruitage) { bruitage(audio.currentTime + 0.03 + (options.delai || 0), fureur, Math.floor(Math.random() * 3)); }
  }

  // ---------------------------------------------------------------------
  // AMBIANCE DE FOND : grondement sourd et gouttes d'eau
  // ---------------------------------------------------------------------
  function goutte() {
    if (!audio || !ambianceNoeuds.length) { return; }
    var t = audio.currentTime + 0.02;
    var f = entre(1400, 2200);
    var osc = audio.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.09);
    var g = audio.createGain();
    enveloppe(g, t, 0.5, 0.003, 0.12);
    osc.connect(g);
    sortie(g, entre(-0.8, 0.8), ambianceGain);
    osc.start(t);
    osc.stop(t + 0.15);
    minuteurGouttes = setTimeout(goutte, entre(1800, 6000));
  }

  function ambiance(allumer) {
    if (!allumer || !actif) {
      clearTimeout(minuteurGouttes);
      if (audio && ambianceNoeuds.length) {
        var t = audio.currentTime;
        ambianceGain.gain.cancelScheduledValues(t);
        ambianceGain.gain.setValueAtTime(ambianceGain.gain.value, t);
        ambianceGain.gain.linearRampToValueAtTime(0, t + 0.8);
        var noeuds = ambianceNoeuds;
        ambianceNoeuds = [];
        setTimeout(function () { noeuds.forEach(function (n) { try { n.stop(); } catch (e) { /* déjà arrêté */ } }); }, 900);
      }
      return;
    }
    if (!preparer() || ambianceNoeuds.length) { return; }
    var t0 = audio.currentTime;
    // Deux notes très graves, légèrement désaccordées : le grondement des profondeurs.
    var filtre = audio.createBiquadFilter();
    filtre.type = 'lowpass';
    filtre.frequency.value = 220;
    filtre.connect(ambianceGain);
    [55, 55.6, 82.4].forEach(function (f, i) {
      var osc = audio.createOscillator();
      osc.type = i < 2 ? 'sawtooth' : 'sine';
      osc.frequency.value = f;
      var g = audio.createGain();
      g.gain.value = i < 2 ? 0.5 : 0.3;
      osc.connect(g);
      g.connect(filtre);
      osc.start(t0);
      ambianceNoeuds.push(osc);
    });
    ambianceGain.gain.cancelScheduledValues(t0);
    ambianceGain.gain.setValueAtTime(0, t0);
    ambianceGain.gain.linearRampToValueAtTime(VOLUME_AMBIANCE, t0 + 2);
    minuteurGouttes = setTimeout(goutte, entre(1000, 3000));
  }

  // Baisse l'ambiance un moment (par exemple pendant l'indice sonore du système C).
  function attenuer(millisecondes) {
    if (!audio || !ambianceNoeuds.length) { return; }
    var t = audio.currentTime;
    ambianceGain.gain.cancelScheduledValues(t);
    ambianceGain.gain.setValueAtTime(ambianceGain.gain.value, t);
    ambianceGain.gain.linearRampToValueAtTime(VOLUME_AMBIANCE * 0.15, t + 0.2);
    ambianceGain.gain.setValueAtTime(VOLUME_AMBIANCE * 0.15, t + millisecondes / 1000);
    ambianceGain.gain.linearRampToValueAtTime(VOLUME_AMBIANCE, t + millisecondes / 1000 + 1);
  }

  function activer(oui) {
    actif = !!oui;
    if (!actif) { ambiance(false); }
  }

  // Durée approximative d'un bruitage, en secondes, pour enchaîner le suivant.
  function duree(nom, monstre) {
    if (nom === 'douleur' && enregistrements['cri-monstre']) {
      return 0.08 + enregistrements['cri-monstre'].duration / (VITESSE_CRI[monstre] || 1);
    }
    if (nom === 'victoire-monstre' && enregistrements['victoire-monstre']) {
      return enregistrements['victoire-monstre'].duration;
    }
    return { douleur: 0.6, 'victoire-monstre': 1.3 }[nom] || 0;
  }

  window.Sons = { preparer: preparer, jouer: jouer, duree: duree, ambiance: ambiance, attenuer: attenuer, activer: activer };
})();
