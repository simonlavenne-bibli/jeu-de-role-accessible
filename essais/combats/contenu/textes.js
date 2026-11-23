/**
 * textes.js — Tous les textes des combats, affichés (et plus tard dits par la voix).
 *
 * Le moteur ne contient aucun texte : il émet des messages nommés,
 *   { type: 'monstre-touche', donnees: { tirage: 0.42, degats: 2 } }
 * et ce fichier les traduit en phrases (voir docs/contrat-de-donnees.md, §4 et §5).
 *
 * Pour réécrire une phrase, il suffit de la modifier ici : le moteur n'a pas à changer.
 * Quand un message a plusieurs variantes (listes), « tirage » (un nombre entre 0 et 1,
 * tiré par le moteur) choisit laquelle : avec une graine, le combat se rejoue à l'identique.
 *
 * Règles d'écriture (docs/intrigue.md) : le joueur est tutoyé, sans nom ni genre.
 */
import { HEROS_D, HEROS_E, HEROS_F, HEROS_G } from '../moteur/donnees.js';

// ---------------------------------------------------------------------
// OUTILS
// ---------------------------------------------------------------------
export function pv(n) { return n + (n > 1 ? ' points de vie' : ' point de vie'); }
export function pluriel(n, un, plusieurs) { return n + ' ' + (n > 1 ? plusieurs : un); }
// « 4, 2 et 6 »
export function liste(valeurs) {
  if (valeurs.length <= 1) { return valeurs.join(''); }
  return valeurs.slice(0, -1).join(', ') + ' et ' + valeurs[valeurs.length - 1];
}
function annonce(des) { return liste(des.map(String)); }
function au(variantes, tirage) { return variantes[Math.floor(tirage * variantes.length)]; }

// ---------------------------------------------------------------------
// LES ADVERSAIRES
// ---------------------------------------------------------------------
export var MONSTRES = {
  'squelette': {
    nom: 'le squelette', Nom: 'Le squelette',
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

export var NOMS_SYSTEMES = {
  A: 'A, relance risquée', B: 'B, garder et relancer', C: 'C, écouter le monstre', D: 'D, seuil et karma',
  E: 'E, deux actions par tour', F: 'F, réserve de dés et états de santé', G: 'G, 2 dés contre 9'
};

var ETATS_F = ['indemne', 'sonné', 'blessé', 'gravement blessé', 'hors de combat'];
var SENS_B = { coup: 'coup', parade: 'parade', crane: 'crâne', rien: 'rien' };
var ETAT_DE_B = { bloque: 'bloqué', 'a-relancer': 'à relancer', garde: 'gardé' };
var INTENTIONS_C = { bondir: 'Il voulait bondir.', proteger: 'Il voulait se protéger.', tourner: 'Il cherchait une ouverture.' };
var NUMEROS_LANCER = { 1: 'Premier', 2: 'Deuxième', 3: 'Troisième' };

// Le monstre du combat, et quelques tournures qui en dépendent.
function m(p) { return MONSTRES[p.cleMonstre]; }
// « du squelette », « des squelettes » (bande du système G)…
function duMonstre(p) { return p.bande ? 'des squelettes' : m(p).nom.replace(/^le /, 'du '); }

// Système F : le texte d'une réserve de dés (voir moteur/systemes/f.js).
function reserve(r) {
  var texte = r.autres.length ? 'Dés : ' + annonce(r.autres) + '. ' : '';
  if (r.libre[0] === 1) {
    return texte + 'Dé libre : 1' + (r.autres.length ? ', il annule ton meilleur dé, le ' + r.meilleur : '') + '.';
  }
  return texte + 'Dé libre : ' + r.libre.join(' puis ') + '.';
}

// Système G : « 4, 2 et 6, garde 6 et 4 » avec l'avantage, sinon « 4 et 2 ».
function jetG(j) { return j.avantage ? annonce(j.des) + ', garde ' + j.gardes.join(' et ') : j.des.join(' et '); }

// ---------------------------------------------------------------------
// LES MESSAGES : type → function (donnees, partie) → phrase
// ---------------------------------------------------------------------
var T = {
  // --- Titres ---------------------------------------------------------
  'titre-regles': function (d) { return 'Règles · ' + d.page + ' sur ' + d.pages; },
  'titre-adversaire': function () { return 'Ton adversaire'; },
  'titre-tour': function (d) { return (d.parTours ? 'Tour ' : 'Assaut ') + d.numero; },
  'titre-fuite': function () { return 'Tu as fui'; },
  'titre-victoire': function () { return 'Victoire !'; },
  'titre-mort': function () { return 'Tu es mort'; },

  // --- Choix ----------------------------------------------------------
  'choix-suivant': function () { return 'Suivant'; },
  'choix-passer-regles': function () { return 'Passer les règles'; },
  'choix-voir-adversaire': function () { return 'Voir l\'adversaire'; },
  'choix-regle-precedente': function () { return 'Règle précédente'; },
  'choix-commencer': function () { return 'Commencer le combat'; },
  'choix-attaquer': function () { return 'Attaquer'; },
  'choix-fuir': function () { return 'Fuir'; },
  'choix-au-tour-du-monstre': function (d, p) { return 'Au tour ' + duMonstre(p); },
  'choix-continuer': function () { return 'Continuer'; },
  'choix-suite': function () { return 'Suite'; },
  'choix-tenter-sa-chance': function () { return 'Lancer un dé de chance'; },
  'choix-renoncer': function () { return 'Renoncer'; },
  'choix-relancer-de': function (d) { return 'Relancer ton ' + d.de; },
  'choix-encaisser': function () { return 'Encaisser'; },
  'choix-B-relancer': function (d) { return 'Relancer ' + pluriel(d.nombre, 'dé', 'dés') + ' (les dés marqués « à relancer »)'; },
  'choix-B-arreter': function () { return 'M\'arrêter et frapper'; },
  'choix-esquiver': function () { return 'Esquiver'; },
  'choix-parer': function () { return 'Parer'; },
  'choix-reecouter': function () { return 'Réécouter'; },
  'choix-reecouter-utilise': function () { return 'Réécouter : déjà utilisé'; },
  'choix-D-depenser': function (d) { return 'Dépenser ' + pluriel(d.manque, 'point de karma', 'points de karma') + ' et toucher'; },
  'choix-D-garder': function () { return 'Garder ton karma'; },
  'choix-D-bouclier': function () { return 'Utiliser ton bouclier'; },
  'choix-E-concentrer': function () { return 'Te concentrer'; },
  'choix-degats': function () { return 'Lancer tes dégâts'; },
  'choix-degats-monstre': function (d, p) { return m(p).Nom + ' lance ses dégâts'; },
  'choix-G-feroce': function () { return 'Assaut féroce'; },
  'choix-G-degats': function (d, p) {
    if (d.numeros.length > 1) { return 'Les squelettes lancent leurs dégâts'; }
    return (p.bande ? 'Squelette ' + d.numeros[0] : m(p).Nom) + ' lance ses dégâts';
  },

  // --- Commun à tous les systèmes ------------------------------------
  'que-fais-tu': function () { return 'Que fais-tu ?'; },
  'monstre-apparait': function (d, p) {
    // Système G contre la bande : l'illustration ne montre que le premier, les autres attendent dans l'ombre.
    if (p.bande) {
      return 'Au fond de la salle, un squelette se redresse dans un cliquetis sec et lève son épée ébréchée. Dans l\'ombre derrière lui, ' +
        (p.bande - 1) + ' autres attendent leur tour. Ils sont ' + p.bande + ' en tout.';
    }
    return m(p).entree;
  },
  'monstre-touche': function (d, p) { return au(m(p).touche, d.tirage) + ' ' + m(p).Nom + ' perd ' + pv(d.degats) + '.'; },
  'monstre-frappe': function (d, p) { return au(m(p).frappe, d.tirage); },
  'frappe-sans-riposte': function (d, p) { return m(p).Nom + ' frappe sans riposte. ' + au(m(p).frappe, d.tirage); },
  'il-te-touche': function (d, p) { return 'Il te touche. ' + au(m(p).frappe, d.tirage); },
  'il-te-manque': function () { return 'Il te manque.'; },
  'tu-touches': function () { return 'Tu touches.'; },
  'heros-perd': function (d) { return 'Tu perds ' + pv(d.degats) + '.'; },
  'coup-mortel': function () { return 'Ce coup serait le dernier.'; },
  'chance-epuisee': function () { return 'Il ne te reste aucun dé de chance.'; },
  'chance-proposee': function (d) { return 'Il te reste ' + pluriel(d.desRestants, 'dé de chance', 'dés de chance') + '. Il faut ' + d.seuil + ' ou plus.'; },
  'chance-resultat': function (d) { return 'Dé de chance : ' + d.de + '.'; },
  'chance-reussie': function () { return 'La chance te sourit : le coup te frôle sans te toucher.'; },
  'chance-ratee': function () { return 'Raté.'; },
  'fuite-resultat': function (d) { return 'Tu tentes de fuir : ' + d.de + '. Il fallait ' + d.seuil + ' ou plus.'; },
  'fuite-reussie': function () { return 'Tu recules d\'un bond et claques la porte derrière toi.'; },
  'fuite-bilan': function (d, p) { return 'Tu as échappé à ' + m(p).nom + '.'; },
  'fuite-ratee': function (d, p) { return m(p).Nom + ' te barre le passage.'; },
  'chance-fuite-proposee': function (d, p) {
    return 'Il te reste ' + pluriel(d.desRestants, 'dé de chance', 'dés de chance') + '. Sur ' + d.seuil + ' ou plus, tu lui échappes quand même.';
  },
  'chance-fuite-reussie': function (d, p) { return 'La chance te sourit : tu te glisses sous sa garde et claques la porte derrière toi.'; },
  'chance-refusee': function (d, p) { return 'Tu restes face à ' + m(p).nom + '.'; },
  'choix-rester': function () { return 'Rester et combattre'; },
  'monstre-vaincu': function (d, p) { return p.bande ? 'Le dernier squelette s\'effondre en tas sur les dalles.' : m(p).mort; },
  'victoire': function (d, p) { return 'Tu as vaincu ' + m(p).nom + '.'; },
  'heros-mort': function () { return 'Le noir se referme sur toi.'; },

  // --- Faire le point ---------------------------------------------------
  'point-heros': function (d, p) {
    var t = p.systeme === 'F' ? 'Tu es ' + ETATS_F[d.etat] + '.' : 'Il te reste ' + pv(d.vie) + ' sur ' + d.vieMax + '.';
    t += d.desDeChance ? ' Il te reste ' + pluriel(d.desDeChance, 'dé de chance', 'dés de chance') + '.' : ' Tu n\'as plus de dé de chance.';
    if (p.systeme === 'D') { t += ' Tu as ' + pluriel(d.karma, 'point de karma', 'points de karma') + '.'; }
    return t;
  },
  'point-monstre': function (d, p) {
    if (p.systeme === 'F') { return m(p).Nom + ' est ' + ETATS_F[d.etat] + '.'; }
    if (d.bande) { return d.vie > 1 ? d.vie + ' squelettes sont encore debout.' : 'Un squelette est encore debout.'; }
    return m(p).Nom + ' a ' + pv(d.vie) + '.';
  },

  // --- Règles communes -------------------------------------------------
  'regle-chance': function (d, p) {
    return 'Si un coup doit te tuer, ou si ta fuite échoue, tu peux lancer un dé de chance : sur ' + p.seuilChance +
      ' ou plus, tu y échappes. Si tu échoues, tu peux en lancer un autre, tant qu\'il t\'en reste.';
  },
  'regle-fuite': function (d, p) {
    return 'Fuir : tu lances un dé, il faut ' + p.regles.fuite + ' ou plus. Si tu échoues et que tu ne tentes pas ta chance, ' + m(p).nom + ' frappe sans riposte.';
  },

  // --- Système A : relance risquée -------------------------------------
  'A.regle-1': function (d, p) {
    return 'Chacun lance deux dés et ajoute son habileté : 7 pour toi, ' + p.regles.habilete + ' pour ' + m(p).nom + '. Le plus haut total touche et retire ' + pv(p.regles.degats) + ' (2 pour toi).';
  },
  'A.regle-2': function (d, p) {
    return 'Si tu perds un assaut, tu peux relancer ton dé le plus faible, une seule fois. Le jeu te dit le chiffre qu\'il te faudrait. Si tu perds quand même, ' + m(p).nom + ' frappe deux fois.';
  },
  'A.jet-heros': function (d) { return 'Tu lances ' + d.des[0] + ' et ' + d.des[1] + '. Avec ton habileté : ' + d.total + '.'; },
  'A.jet-monstre': function (d, p) { return m(p).Nom + ' lance ' + d.des[0] + ' et ' + d.des[1] + '. Avec son habileté : ' + d.total + ', contre ton ' + d.totalHeros + '.'; },
  'A.egalite': function () { return 'Égalité. Les coups se croisent sans toucher.'; },
  'assaut-perdu': function () { return 'Tu perds l\'assaut.'; },
  'A.besoin': function (d) {
    return d.besoin <= 6
      ? 'Pour gagner, il te faudrait ' + d.besoin + ' ou plus en relançant ton ' + d.de + '.'
      : 'Même un 6 ne te ferait pas gagner en relançant ton ' + d.de + '.';
  },
  'A.relance': function (d) { return 'Tu relances : ' + d.de + '. Avec ton habileté : ' + d.total + ' contre ' + d.totalMonstre + '.'; },
  'A.egalite-relance': function () { return 'Égalité. Tu échappes au coup de justesse.'; },
  'A.frappe-double': function (d, p) { return 'Tu perds quand même. ' + m(p).Nom + ' frappe deux fois. ' + au(m(p).frappe, d.tirage); },

  // --- Système B : garder et relancer ----------------------------------
  'B.regle-1': function () { return 'À ton tour, tu lances 6 dés. Après chaque lancer, tu choisis les dés à relancer, jusqu\'à 3 lancers. Tu peux t\'arrêter quand tu veux.'; },
  'B.regle-2': function (d, p) { return 'Un 6 est un coup : ' + m(p).nom + ' perd 1 point de vie. Un 5 est une parade : elle bloque 1 point de dégâts. Un 1 est un crâne : il reste sur la table. Les 2, 3 et 4 ne donnent rien.'; },
  'B.regle-3': function () { return 'Si une relance amène ton troisième crâne, tu trébuches : tes coups et tes parades de ce tour sont perdus. Des crânes au premier lancer ne te font jamais trébucher.'; },
  'B.regle-4': function (d, p) { return 'À la fin de ton tour, ' + m(p).nom + ' frappe : ' + pv(p.regles.force) + ', moins tes parades.'; },
  'B.lancer': function (d) { return NUMEROS_LANCER[d.numero] + ' lancer : ' + annonce(d.valeurs) + '.'; },
  'B.arret': function (d) { return 'Tu t\'arrêtes. ' + T['B.bilan'](d); },
  'B.bilan': function (d) {
    var morceaux = [];
    if (d.coups) { morceaux.push(pluriel(d.coups, 'coup', 'coups')); }
    if (d.parades) { morceaux.push(pluriel(d.parades, 'parade', 'parades')); }
    if (d.cranes) { morceaux.push(pluriel(d.cranes, 'crâne', 'crânes')); }
    if (d.rien) { morceaux.push(d.rien + ' sans effet'); }
    return 'Tu as ' + liste(morceaux) + '.';
  },
  'B.trebuche': function () { return 'Troisième crâne : tu trébuches ! Tes coups et tes parades de ce tour sont perdus.'; },
  'B.dernier-lancer': function () { return 'C\'était ton dernier lancer.'; },
  'B.lancers-restants': function (d) {
    return 'Il te reste ' + pluriel(d.reste, 'lancer', 'lancers') + '.' + (d.attention ? ' Attention : un crâne de plus et tu trébuches.' : '');
  },
  'B.aucun-coup': function () { return 'Aucun de tes coups ne porte.'; },
  'B.parades-gardees': function (d) { return 'Tu gardes ' + pluriel(d.parades, 'parade', 'parades') + ' pour son attaque.'; },
  'B.parades-bloquent-tout': function (d, p) { return m(p).Nom + ' frappe, mais tes parades bloquent tout.'; },
  'B.frappe': function (d, p) {
    return m(p).Nom + ' frappe. ' + au(m(p).frappe, d.tirage) +
      (d.bloques > 0 ? ' Tes parades bloquent ' + pluriel(d.bloques, 'point', 'points') + '.' : '');
  },

  // --- Système C : écouter le monstre ----------------------------------
  'C.regle-son-1': function (d, p) { return 'Avant chaque assaut, ' + m(p).nom + ' fait un bruit qui annonce son intention. Un son qui monte : il va bondir sur toi. Deux sons graves et étouffés : il se protège. Trois sons qui passent d\'une oreille à l\'autre : il tourne autour de toi pour chercher une ouverture.'; },
  'C.regle-son-2': function () { return 'Chaque monstre a sa propre voix, et ses bruits changent un peu d\'un assaut à l\'autre. Tu peux réécouter une fois par assaut. Après l\'assaut, tu sauras ce qu\'il voulait faire.'; },
  'C.regle-geste': function (d, p) { return 'Avant chaque assaut, ' + m(p).nom + ' fait un geste qui annonce son intention : bondir sur toi, se protéger, ou tourner autour de toi pour chercher une ouverture. À toi de deviner laquelle.'; },
  'C.regle-posture': function () { return 'Tu choisis alors ta posture. Esquiver contre un bond, attaquer quand il se protège, parer quand il cherche une ouverture : la bonne posture ajoute 3 à ton total.'; },
  'C.regle-jet': function (d, p) { return 'Puis chacun lance deux dés et ajoute son habileté : 7 pour toi, ' + p.regles.habilete + ' pour ' + m(p).nom + '. Le plus haut total touche.'; },
  'C.regle-degats': function (d, p) { return 'Tes coups retirent 2 points de vie, 3 si tu as choisi d\'attaquer. Ses coups retirent ' + pv(p.regles.degats) + ', le double s\'il bondit et que tu n\'esquives pas, 1 de moins si tu pares. Quand il se protège, il ne frappe pas.'; },
  'C.geste': function (d, p) { return au(m(p).signes[d.intention], d.tirage); },
  'C.ecoute': function (d, p) { return 'Écoute ' + m(p).nom + '…'; },
  'C.lecture': function (d) { return INTENTIONS_C[d.intention] + (d.juste ? ' Bonne lecture : plus 3.' : ' Mauvaise lecture.'); },
  'C.jet-heros': function (d) { return 'Tu lances ' + d.des[0] + ' et ' + d.des[1] + '. Total : ' + d.total + '.'; },
  'C.jet-monstre': function (d, p) { return m(p).Nom + ' lance ' + d.des[0] + ' et ' + d.des[1] + '. Total : ' + d.total + ', contre ton ' + d.totalHeros + '.'; },
  'C.egalite': function () { return 'Égalité. Personne n\'est touché.'; },
  'C.garde': function () { return 'Tu ne passes pas sa garde, mais il ne riposte pas.'; },
  'C.parade-totale': function () { return 'Ta parade bloque tout le coup.'; },
  'C.frappe': function (d, p) {
    return au(m(p).frappe, d.tirage) + (d.bond ? ' Son bond double les dégâts.' : '') + (d.parade ? ' Ta parade en retire 1.' : '');
  },

  // --- Système D : seuil et karma (inspiré d'EZD6) ---------------------
  'D.regle-1': function (d, p) { return 'Inspiré d\'EZD6. Tu lances un seul dé. Pour toucher ' + m(p).nom + ', il faut ' + p.regles.seuil + ' ou plus. Chaque touche lui retire 1 point de vie. Il en a ' + p.regles.vie + ', toi ' + HEROS_D.vie + '.'; },
  'D.regle-2': function () { return 'Un 1 rate toujours. Un 6 touche et tu relances : chaque nouveau dé qui atteint le seuil touche encore, et un nouveau 6 relance encore.'; },
  'D.regle-3': function () { return 'Chaque échec te donne 1 point de karma. Quand tu rates de peu, tu peux dépenser du karma : chaque point ajoute 1 à ton dé.'; },
  'D.regle-4': function (d, p) { return 'Ensuite ' + m(p).nom + ' attaque : il te touche sur ' + p.regles.attaque + ' ou plus. S\'il touche, tu utilises ton bouclier : tu lances un dé, et sur ' + HEROS_D.armure + ' ou plus, ton bouclier arrête le coup. Sinon tu perds ' + pv(p.regles.degats) + '.'; },
  'D.jet': function (d) { return 'Tu lances : ' + d.de + '. Il faut ' + d.seuil + ' ou plus.'; },
  'D.un': function () { return 'Un 1 rate toujours. Tu gagnes 1 point de karma.'; },
  'D.rate': function () { return 'Raté. Tu gagnes 1 point de karma.'; },
  'D.rate-de': function (d) { return 'Raté de ' + d.manque + '. Tu as ' + pluriel(d.karma, 'point de karma', 'points de karma') + '.'; },
  'D.karma': function (d) { return 'Tu puises dans ton karma : ton ' + d.de + ' devient ' + d.seuil + '.'; },
  'D.karma-garde': function () { return 'Tu gardes ton karma pour plus tard, et tu en gagnes 1 de plus.'; },
  'D.relance': function (d) { return 'Un 6 ! Tu relances : ' + d.de + '.'; },
  'D.attaque-ratee': function (d, p) { return m(p).Nom + ' attaque : ' + d.de + '. Il lui fallait ' + d.seuil + '. Il te manque.'; },
  'D.attaque-touche': function (d, p) { return m(p).Nom + ' attaque : ' + d.de + '. Il lui fallait ' + d.seuil + '. Il te touche. ' + au(m(p).frappe, d.tirage); },
  'D.bouclier-propose': function () { return 'Ton bouclier peut arrêter le coup : il faut ' + HEROS_D.armure + ' ou plus.'; },
  'D.bouclier-arrete': function (d) { return 'Ton bouclier : ' + d.de + '. Il arrête le coup.'; },
  'D.bouclier-insuffisant': function (d) { return 'Ton bouclier : ' + d.de + '. Il ne suffit pas.'; },

  // --- Système E : deux actions par tour (inspiré de TinyD6) -----------
  'E.regle-1': function (d, p) { return 'Inspiré de TinyD6. À chaque tour, tu fais 2 actions, puis ' + m(p).nom + ' attaque.'; },
  'E.regle-2': function (d, p) { return 'Attaquer : tu lances 2 dés. Un seul 5 ou 6 suffit pour toucher, et chaque touche retire 1 point de vie. ' + m(p).Nom + ' en a ' + p.regles.vie + ', toi ' + HEROS_E.vie + '.'; },
  'E.regle-3': function () { return 'Te concentrer : ta prochaine attaque se fait avec 3 dés.'; },
  'E.regle-4': function (d, p) { return 'Esquiver : ce tour-ci, ' + m(p).nom + ' n\'attaque qu\'avec 1 dé au lieu de ' + p.regles.des + '.'; },
  'E.regle-5': function (d, p) { return 'Il te touche s\'il fait au moins un 5 ou un 6, et tu perds ' + pv(p.regles.degats) + '. Fuir prend tes 2 actions.'; },
  'E.actions': function (d) {
    return 'Il te reste ' + pluriel(d.actions, 'action', 'actions') + '.' +
      (d.concentre ? ' Tu es concentré : ta prochaine attaque se fait avec 3 dés.' : '') +
      (d.esquive ? ' Tu esquives ce tour-ci.' : '');
  },
  'E.deja-concentre': function () { return 'Tu es déjà concentré.'; },
  'E.concentration': function (d, p) { return 'Tu respires et tu fixes ' + m(p).nom + '.'; },
  'E.deja-esquive': function () { return 'Tu esquives déjà ce tour-ci.'; },
  'E.esquive': function () { return 'Tu te mets sur tes gardes.'; },
  'E.fuite-impossible': function () { return 'Pour fuir, il faut tes 2 actions. Attends le tour suivant.'; },
  'E.jet': function (d) { return 'Tu lances ' + d.des.length + ' dés : ' + annonce(d.des) + '.'; },
  'E.rate': function () { return 'Ni 5 ni 6 : raté.'; },
  'E.attaque': function (d, p) { return m(p).Nom + ' attaque avec ' + pluriel(d.des.length, 'dé', 'dés') + ' : ' + annonce(d.des) + '.'; },
  'E.esquive-reussie': function () { return 'Tu esquives le coup.'; },

  // --- Système F : réserve de dés et états de santé (inspiré de Mini Six)
  'F.regle-1': function () { return 'Inspiré de Mini Six. Tu attaques avec ' + HEROS_F.des + ' dés que tu additionnes. L\'un d\'eux est le dé libre : s\'il fait 6, on le relance et on ajoute ; s\'il fait 1, il annule ton meilleur dé.'; },
  'F.regle-2': function (d, p) { return 'Pour toucher ' + m(p).nom + ', il faut atteindre sa parade : ' + p.regles.parade + '. Tu lances alors tes dégâts, ' + HEROS_F.degatsDes + ' dés plus ' + HEROS_F.degatsBonus + ', contre sa vigueur : ' + p.regles.vigueur + '.'; },
  'F.regle-3': function () { return 'Pas de points de vie : selon l\'écart, la cible passe d\'un à trois états plus bas. Indemne, sonné, blessé, gravement blessé, hors de combat. Blessé coûte 1 dé, gravement blessé 2 dés.'; },
  'F.regle-4': function (d, p) { var r = p.regles; return m(p).Nom + ' attaque avec ' + r.des + ' dés contre ta parade de ' + HEROS_F.parade + ', et ses dégâts, ' + r.degatsDes + ' dés plus ' + r.degatsBonus + ', contre ta vigueur de ' + HEROS_F.vigueur + '.'; },
  'F.attaque': function (d) { return 'Ton attaque, ' + pluriel(d.nombre, 'dé', 'dés') + '. ' + reserve(d.reserve) + ' Total : ' + d.reserve.total + ', il fallait ' + d.seuil + '.'; },
  'F.monstre-pare': function (d, p) { return m(p).Nom + ' pare.'; },
  'F.degats-heros': function (d) { return 'Tes dégâts : ' + reserve(d.reserve) + ' Plus ' + d.bonus + ' : ' + d.total + ' contre sa vigueur de ' + d.vigueur + '.'; },
  'F.pas-entame': function () { return 'Le coup ne l\'entame pas.'; },
  'F.monstre-etat': function (d, p) { return au(m(p).touche, d.tirage) + ' ' + m(p).Nom + ' est ' + ETATS_F[d.niveau] + '.'; },
  'F.riposte': function (d, p) { return m(p).Nom + ' attaque, ' + pluriel(d.nombre, 'dé', 'dés') + '. ' + reserve(d.reserve) + ' Total : ' + d.reserve.total + ' contre ta parade de ' + d.parade + '.'; },
  'F.tu-pares': function () { return 'Tu pares.'; },
  'F.il-te-touche': function () { return 'Il te touche.'; },
  'F.degats-monstre': function (d, p) { return 'Ses dégâts : ' + reserve(d.reserve) + ' Plus ' + d.bonus + ' : ' + d.total + ' contre ta vigueur de ' + d.vigueur + '. ' + au(m(p).frappe, d.tirage); },
  'F.sans-broncher': function () { return 'Tu encaisses sans broncher.'; },
  'F.heros-etat': function (d) { return 'Tu es ' + ETATS_F[d.niveau] + '.'; },

  // --- Système G : 2 dés contre 9 (inspiré de Barbarians of Lemuria) ---
  'G.regle-1': function (d, p) { return 'Inspiré de Barbarians of Lemuria. Tu lances 2 dés, tu ajoutes 3 et tu retires la défense ' + duMonstre(p) + ' : ' + p.regles.defense + '. Il faut 9 ou plus pour toucher.'; },
  'G.regle-2': function (d, p) {
    return p.bande
      ? 'Tu affrontes une bande de ' + p.bande + ' squelettes. Chaque touche en abat un. Avec 12 ou plus, coup héroïque : tu en abats deux.'
      : 'Chaque touche retire 1 dé plus 1, moins son armure de ' + p.regles.armure + ', avec au moins 1. ' + m(p).Nom + ' a ' + pv(p.regles.vie) + '.';
  },
  'G.regle-3': function (d, p) { return 'Assaut féroce : tu lances 3 dés et gardes les 2 meilleurs, mais à son attaque suivante, ' + (p.bande ? 'chaque squelette fait' : m(p).nom + ' fait') + ' de même.'; },
  'G.regle-4': function (d, p) {
    var r = p.regles;
    return (p.bande ? 'Chaque squelette debout attaque' : m(p).Nom + ' attaque') + ' avec 2 dés plus ' + r.attaque + ', moins ta défense de ' + HEROS_G.defense + ' : 9 ou plus te touche. Dégâts : 1 dé plus ' + r.degats + ', moins ton armure de ' + HEROS_G.armure + '. Tu as ' + pv(HEROS_G.vie) + '.';
  },
  'G.jet': function (d) {
    return (d.feroce ? 'Assaut féroce. ' : '') + 'Tu lances ' + jetG(d.jet) + '. Plus ' + HEROS_G.bonus +
      (d.defense ? ', moins ' + d.defense : '') + ' : ' + d.total + '. Il faut 9.';
  },
  'G.rate': function () { return 'Raté.'; },
  'G.heroique': function () { return 'Coup héroïque : deux squelettes volent en éclats.'; },
  'G.squelette-abattu': function (d, p) { return au(m(p).touche, d.tirage) + ' Un squelette s\'effondre.'; },
  'G.degats-heros': function (d, p) {
    return 'Tes dégâts : ' + d.de + ' plus 1' + (d.armure ? ' moins ' + d.armure : '') + '. ' + au(m(p).touche, d.tirage) + ' ' + m(p).Nom + ' perd ' + pv(d.degats) + '.';
  },
  'G.attaque-monstre': function (d, p) {
    var qui = p.bande ? 'Squelette ' + d.numero : m(p).Nom;
    return qui + (d.jet.avantage ? ', féroce' : '') + ' : ' + jetG(d.jet) + ', total ' + d.total + '.' + (d.touche ? ' Il te touche.' : ' Raté.');
  },
  'G.degats-monstre': function (d, p) {
    return (d.plusieurs || p.bande ? 'Squelette ' + d.numero + ', dégâts : ' : 'Ses dégâts : ') +
      d.de + ' plus ' + p.regles.degats + ' moins ' + HEROS_G.armure + ' : ' + d.degats + '.';
  }
};

/**
 * Traduit un message du moteur en phrase. partie : l'état du combat (lecture seule).
 * Un message inconnu est une erreur : on veut le voir tout de suite, pas afficher un trou.
 */
export function ecrire(message, partie) {
  var f = T[message.type];
  if (!f) { throw new Error('Texte manquant pour le message « ' + message.type + ' »'); }
  return f(message.donnees || {}, partie);
}

export function existe(type) { return !!T[type]; }

// ---------------------------------------------------------------------
// COMPTEURS ET JOURNAL
// ---------------------------------------------------------------------
// Ce qu'affichent les compteurs : monstre en haut à gauche, héros en haut à droite.
export function compteurs(p) {
  var c = {
    monstre: m(p).Nom.replace(/^Le /, '').replace(/^./, function (l) { return l.toUpperCase(); }),
    valeurMonstre: String(Math.max(0, p.vieMonstre)),
    valeurHeros: String(Math.max(0, p.vie)),
    extra: [pluriel(p.chances, 'dé de chance', 'dés de chance')],
    mots: false
  };
  if (p.systeme === 'D') { c.extra.push(pluriel(p.karma, 'point de karma', 'points de karma')); }
  if (p.systeme === 'F') {
    // Pas de points de vie en F : on affiche l'état de santé.
    c.valeurMonstre = ETATS_F[p.niveauMonstre];
    c.valeurHeros = ETATS_F[p.niveauHeros];
    c.mots = true;
  }
  if (p.systeme === 'G' && p.bande) { c.monstre = 'Squelettes debout'; }
  return c;
}

var JOURNAL = {
  A: function (d) { return ' · relances ' + d.relances + ' · encaissé ' + d.encaisse; },
  B: function (d) { return ' · relances ' + d.relances + ' · arrêts ' + d.arrets + ' · trébuché ' + d.trebuche; },
  C: function (d, p) {
    return ' · indice ' + p.indice + ' · bonnes lectures ' + d.bonnesLectures + '/' + d.lectures +
      (p.indice === 'sonore' ? ' · réécoutes ' + d.reecoutes : '');
  },
  D: function (d, p) { return ' · karma dépensé ' + d.karma + ' · karma restant ' + p.karma; },
  E: function (d) { return ' · concentrations ' + d.concentrations + ' · esquives ' + d.esquives; },
  F: function (d, p) { return ' · état final ' + ETATS_F[p.niveauHeros] + ' contre ' + ETATS_F[p.niveauMonstre]; },
  G: function (d) { return ' · assauts féroces ' + d.feroces; }
};

// La ligne du journal des combats, envoyée aussi à la feuille des résultats.
export function ligneDeJournal(p) {
  var d = p.decisions;
  return 'Système ' + p.systeme + ' · ' + m(p).nom +
    ' · chance ' + p.seuilChance + '+ · ' + p.issue +
    ' en ' + p.tours + ' tour(s)' + (p.systeme === 'F' ? '' : ' · vie ' + Math.max(0, p.vie) + '/' + p.vieMax) +
    JOURNAL[p.systeme](d, p) +
    ' · dés de chance ' + d.chancesReussies + '/' + d.chancesUtilisees + ' réussis · fuites tentées ' + d.fuites;
}

// Pour la feuille de résultats : « squelette », « loup-garou », « démon ».
export function nomDeLAdversaire(p) { return m(p).nom.replace(/^le /, ''); }

// Système B : ce qu'un dé veut dire, pour l'étiquette du bouton.
export function etiquetteDeB(d) { return { sens: SENS_B[d.sens], etat: ETAT_DE_B[d.etat] }; }

