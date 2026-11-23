/**
 * donnees.js — Le héros, les adversaires et leurs réglages pour chaque système.
 *
 * C'est ici qu'on équilibre les combats : modifier les nombres, rien d'autre.
 * Lancer « node outils/simulation.js » pour voir l'effet sur les victoires.
 */

export var HEROS = { vie: 12, habilete: 7, desDeChance: 3 };

// Les chiffres de chaque adversaire, système par système (A, B, C ici ; D à G plus bas).
// Les noms et les phrases des monstres sont dans ../contenu/textes.js.
export var MONSTRES = {
  'squelette': {
    A: { habilete: 7, vie: 6, degats: 2, fuite: 4 },
    B: { vie: 6, force: 3, fuite: 4 },
    C: { habilete: 7, vie: 6, degats: 2, fuite: 4 }
  },
  'loup-garou': {
    A: { habilete: 8, vie: 8, degats: 2, fuite: 5 },
    B: { vie: 8, force: 4, fuite: 5 },
    C: { habilete: 8, vie: 8, degats: 3, fuite: 5 }
  },
  'demon': {
    A: { habilete: 9, vie: 10, degats: 3, fuite: 6 },
    B: { vie: 10, force: 5, fuite: 6 },
    C: { habilete: 9, vie: 10, degats: 4, fuite: 6 }
  }
};

// Système B : garder et relancer.
export var SEUIL_TREBUCHE = 3;      // nombre de crânes qui font trébucher (système B)
export var LANCERS_MAX = 3;         // lancers par tour (système B)
export var NB_DES_B = 6;            // dés lancés par tour (système B)

// =====================================================================
// SYSTÈMES INSPIRÉS DE JEUX EXISTANTS (D, E, F, G)
// Réglages par adversaire : modifier ici pour équilibrer.
// =====================================================================
var REGLES_INSPIREES = {
  // D (EZD6) : seuil = il faut ce chiffre ou plus pour le toucher ; attaque = son seuil pour te toucher.
  D: {
    'squelette':  { seuil: 4, vie: 3, attaque: 3, degats: 1, fuite: 4 },
    'loup-garou': { seuil: 4, vie: 3, attaque: 2, degats: 2, fuite: 5 },
    'demon':      { seuil: 5, vie: 4, attaque: 2, degats: 2, fuite: 6 }
  },
  // E (TinyD6) : des = nombre de dés de son attaque (réussite sur 5 ou 6).
  E: {
    'squelette':  { vie: 4, des: 2, degats: 2, fuite: 4 },
    'loup-garou': { vie: 5, des: 3, degats: 2, fuite: 5 },
    'demon':      { vie: 6, des: 3, degats: 2, fuite: 6 }
  },
  // F (Mini Six) : parade = total à atteindre pour le toucher ; vigueur = résistance aux dégâts.
  F: {
    'squelette':  { des: 3, parade: 11, vigueur: 8,  degatsDes: 2, degatsBonus: 2, fuite: 4 },
    'loup-garou': { des: 4, parade: 13, vigueur: 10, degatsDes: 3, degatsBonus: 2, fuite: 5 },
    'demon':      { des: 5, parade: 13, vigueur: 10, degatsDes: 3, degatsBonus: 2, fuite: 6 }
  },
  // G (Barbarians of Lemuria) : bande = nombre de squelettes à 1 point de vie.
  G: {
    'squelette':  { bande: 3, attaque: 2, defense: 0, armure: 0, degats: 1, fuite: 4 },
    'loup-garou': { vie: 12, attaque: 3, defense: 1, armure: 1, degats: 2, fuite: 5 },
    'demon':      { vie: 12, attaque: 4, defense: 1, armure: 1, degats: 3, fuite: 6 }
  }
};
export var HEROS_D = { vie: 3, armure: 4 };
export var HEROS_E = { vie: 8 };
export var HEROS_F = { des: 4, parade: 12, vigueur: 10, degatsDes: 3, degatsBonus: 2 };
export var HEROS_G = { vie: 12, bonus: 3, defense: 1, armure: 1 };

Object.keys(REGLES_INSPIREES).forEach(function (s) {
  Object.keys(REGLES_INSPIREES[s]).forEach(function (cle) { MONSTRES[cle][s] = REGLES_INSPIREES[s][cle]; });
});
