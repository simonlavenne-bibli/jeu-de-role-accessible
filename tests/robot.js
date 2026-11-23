/**
 * robot.js — Joue un combat entier sans navigateur, à la place du joueur.
 *
 * Il fournit au moteur une fausse interface (ui) qui note tout ce qui se passe :
 * chaque écran, les choix proposés, les dés tirés, les événements signalés.
 *
 *   var r = jouer({ systeme: 'A', monstre: 'squelette', graine: 1, choisir: 'premier' });
 *   r.resultat.donnees.issue   // 'victoire', 'mort' ou 'fuite'
 */
import { creerCombat } from '../essais/combats/moteur/combat.js';
import { creerHasard } from '../essais/combats/moteur/hasard.js';

var ETAPES_MAX = 2000;

// choisir : 'premier' (attaque toujours, lance toujours la chance),
//           'hasard'  (n'importe quel choix),
//           ou une fonction (libelles, hasard, partie, intention) → rang du choix.
// L'intention est celle que le monstre du système C vient d'annoncer par son signe.
export function jouer(options) {
  var hasardRobot = creerHasard((options.graine || 0) + 7919);
  var choix = [];
  var ecrans = [];
  var enAttente = { sons: [], des: [] };
  var resultat = null;
  var combat = null;
  var intention = null; // système C : ce que le monstre vient d'annoncer

  function etat() {
    var p = combat.partie;
    return { monstre: p.vieMonstre, heros: p.vie, etatMonstre: p.niveauMonstre || 0, etatHeros: p.niveauHeros || 0 };
  }

  var ui = {
    titre: function () {},
    raconter: function (phrases) {
      ecrans.push({ phrases: phrases.slice(), sons: enAttente.sons, des: enAttente.des, etat: etat(), enCombat: combat.partie.enCombat });
      enAttente = { sons: [], des: [] };
      choix = [];
    },
    proposer: function (liste) { choix = liste.slice(); },
    modifierChoix: function () {},
    jet: function (v) {
      if (v < 1 || v > 6 || Math.floor(v) !== v) { throw new Error('Dé impossible : ' + v); }
      enAttente.des.push(v);
    },
    signaler: function (nom) { enAttente.sons.push(nom); },
    ambiance: function () {},
    audioDisponible: function () { return options.audio !== false; },
    signe: function (i) { intention = i; },
    annulerSigne: function () {},
    desAGarder: function () {},
    cacherDes: function () {},
    terminer: function (r) { resultat = r; }
  };

  combat = creerCombat({ systeme: options.systeme, monstre: options.monstre, seuilChance: options.seuilChance, graine: options.graine, ui: ui });
  combat.demarrer();

  var etapes = 0;
  while (!resultat) {
    etapes += 1;
    if (etapes > ETAPES_MAX) { throw new Error('Combat sans fin : ' + options.systeme + ' contre ' + options.monstre); }
    if (!choix.length) { throw new Error('Aucun choix proposé, combat bloqué : ' + JSON.stringify(ecrans[ecrans.length - 1])); }
    var libelles = choix.map(function (c) { return c[0]; });
    var rang = 0;
    if (options.choisir === 'hasard') { rang = Math.floor(hasardRobot() * choix.length); }
    else if (typeof options.choisir === 'function') { rang = options.choisir(libelles, hasardRobot, combat.partie, intention); }
    else if (libelles[0] === 'Suivant') { rang = 1; } // passer les règles
    choix[rang][1]();
  }
  return { resultat: resultat, ecrans: ecrans, partie: combat.partie, etapes: etapes };
}

export var LISTE_SYSTEMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export var LISTE_MONSTRES = ['squelette', 'loup-garou', 'demon'];
