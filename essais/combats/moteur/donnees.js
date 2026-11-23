/**
 * donnees.js — Le héros, les adversaires et leurs réglages pour chaque système.
 *
 * C'est ici qu'on équilibre les combats : modifier les nombres, rien d'autre.
 * Lancer « node outils/simulation.js » pour voir l'effet sur les victoires.
 */

export var HEROS = { vie: 12, habilete: 7, desDeChance: 3 };

export var MONSTRES = {
  'squelette': {
    nom: 'le squelette', Nom: 'Le squelette',
    A: { habilete: 7, vie: 6, degats: 2, fuite: 4 },
    B: { vie: 6, force: 3, fuite: 4 },
    C: { habilete: 7, vie: 6, degats: 2, fuite: 4 },
    signes: {
      bondir: ['Il lève son épée à deux mains au-dessus de son crâne.', 'Ses genoux d\'os se plient, il prend son élan.'],
      proteger: ['Il se replie derrière son bouclier fendu.', 'Il recule d\'un pas, le bouclier levé.'],
      tourner: ['Il glisse sur le côté, la pointe de l\'épée basse.', 'Sa tête pivote lentement, il cherche une faille.']
    },
    entree: 'Au fond de la salle, un squelette se redresse dans un cliquetis sec. Il lève une épée ébréchée et son bouclier rond.',
    touche: ['Ta lame fait voler une côte.', 'Tu brises une vertèbre.', 'Ton coup fend son bouclier.'],
    frappe: ['Son épée s\'abat sur ton épaule.', 'La lame rouillée t\'entaille le bras.', 'Il te frappe au flanc.'],
    mort: 'Ses os s\'effondrent en tas sur les dalles.'
  },
  'loup-garou': {
    nom: 'le loup-garou', Nom: 'Le loup-garou',
    A: { habilete: 8, vie: 8, degats: 2, fuite: 5 },
    B: { vie: 8, force: 4, fuite: 5 },
    C: { habilete: 8, vie: 8, degats: 3, fuite: 5 },
    signes: {
      bondir: ['Il se ramasse sur ses pattes arrière.', 'Ses griffes raclent la pierre, ses épaules se tendent.'],
      proteger: ['Il gronde et recule, les oreilles plaquées.', 'Il baisse la tête et se met hors de portée.'],
      tourner: ['Il tourne autour de toi, tête basse.', 'Il trotte de gauche à droite sans te quitter des yeux.']
    },
    entree: 'Un grondement roule sous la voûte. Un loup-garou se déplie, le poil hérissé, les crocs luisants.',
    touche: ['Tu lui ouvres le flanc.', 'Ta lame le cueille à l\'épaule.', 'Tu frappes sa patte avant.'],
    frappe: ['Ses griffes te labourent la poitrine.', 'Ses crocs se referment sur ton bras.', 'Il te renverse d\'un coup d\'épaule.'],
    mort: 'Le loup-garou s\'écroule avec un dernier râle.'
  },
  'demon': {
    nom: 'le démon', Nom: 'Le démon',
    A: { habilete: 9, vie: 10, degats: 3, fuite: 6 },
    B: { vie: 10, force: 5, fuite: 6 },
    C: { habilete: 9, vie: 10, degats: 4, fuite: 6 },
    signes: {
      bondir: ['Ses ailes se déploient d\'un coup.', 'Il plie les jambes et ses ailes battent une fois.'],
      proteger: ['Il croise les bras devant sa poitrine, les écailles hérissées.', 'Il replie ses ailes autour de lui comme un manteau.'],
      tourner: ['Sa queue fouette l\'air, il te jauge.', 'Il tourne entre les colonnes à pas lents.']
    },
    entree: 'La chaleur devient insoutenable. Entre les colonnes, à la lueur des braseros, un démon cornu déploie ses ailes et tend vers toi ses griffes.',
    touche: ['Ta lame entaille son aile.', 'Tu frappes sous la cuirasse d\'écailles.', 'Ton coup fait jaillir une gerbe de braises.'],
    frappe: ['Son poing de pierre t\'écrase l\'épaule.', 'Sa queue te fouette les jambes.', 'Ses griffes brûlantes te lacèrent.'],
    mort: 'Le démon s\'effondre et se dissout en cendres.'
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
