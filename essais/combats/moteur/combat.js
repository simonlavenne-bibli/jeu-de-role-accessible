/**
 * combat.js — Le déroulement commun d'un combat, quel que soit le système.
 *
 * Le moteur ne touche jamais à la page, au son ni à l'image : il parle à
 * l'interface uniquement par l'objet « ui » qu'on lui donne. On peut donc le
 * faire tourner sans navigateur (tests, simulation d'équilibrage).
 *
 * Ce que le moteur demande à l'interface (ui) :
 *   titre(texte)                       le titre de l'écran
 *   raconter(phrases)                  le récit de l'écran (efface les choix)
 *   proposer([[libellé, action], …])   les choix du joueur
 *   modifierChoix(rang, libellé)       un choix devient « déjà utilisé »
 *   jet(valeur)                        un dé vient d'être tiré
 *   signaler(nom, monstre, options)    un événement à faire entendre (voir plus bas)
 *   ambiance(allumer)                  l'ambiance de fond du combat
 *   audioDisponible()                  vrai si le navigateur peut jouer des sons
 *   signe(intention, reecoute)         système C : le monstre annonce son intention
 *   annulerSigne()                     système C : le signe prévu ne doit plus jouer
 *   desAGarder(des, basculer)          système B : les dés à garder ou relancer
 *   cacherDes()                        système B : plus de dés à choisir
 *   terminer(resultat)                 fin du combat : { ligne, donnees }
 *
 * Événements signalés : apparition, victoire, mort-heros, fuite,
 * chance-reussie, chance-ratee, et, quand personne n'est blessé,
 * parade (coup paré) ou rate (coup dans le vide).
 * Les blessures se déduisent de l'état (partie) : l'interface le compare
 * d'un écran à l'autre.
 *
 *   var combat = creerCombat({ systeme: 'A', monstre: 'squelette', seuilChance: 4, ui: ui });
 *   combat.demarrer();
 */
import { creerHasard } from './hasard.js';
import { HEROS, MONSTRES } from './donnees.js';
import { pv, pluriel } from './texte.js';
import { SYSTEMES } from './systemes/index.js';

export function creerCombat(options) {
  var ui = options.ui;
  var hasard = creerHasard(options.graine);
  var systeme = options.systeme;
  var cle = options.monstre;
  var monstre = MONSTRES[cle];
  if (!monstre || !SYSTEMES[systeme]) { throw new Error('Combat inconnu : système ' + systeme + ' contre ' + cle); }

  var partie = {
    systeme: systeme,
    cleMonstre: cle,
    monstre: monstre,
    regles: monstre[systeme],
    seuilChance: options.seuilChance || 4,
    indice: 'sonore',
    enCombat: false,
    fini: false,
    issue: null,
    vie: HEROS.vie,
    vieMax: HEROS.vie,
    chances: HEROS.desDeChance,
    vieMonstre: monstre[systeme].vie,
    tours: 0,
    decisions: { bonnesLectures: 0, lectures: 0, relances: 0, encaisse: 0, arrets: 0, trebuche: 0, chancesUtilisees: 0, chancesReussies: 0, fuites: 0, reecoutes: 0, karma: 0, concentrations: 0, esquives: 0, feroces: 0 },
    trace: []
  };

  // ---------------------------------------------------------------------
  // OUTILS
  // ---------------------------------------------------------------------
  // Chaque dé tiré est signalé à l'interface, qui le fera rouler à l'écran.
  function de() {
    var valeur = 1 + Math.floor(hasard() * 6);
    ui.jet(valeur);
    return valeur;
  }
  function lancer(n) { var t = []; for (var i = 0; i < n; i += 1) { t.push(de()); } return t; }
  function au(liste) { return liste[Math.floor(hasard() * liste.length)]; }
  function titre(texte) { ui.titre(texte); }
  function signaler(nom, monstreDuSon, opts) { ui.signaler(nom, monstreDuSon, opts); }

  // Le récit de l'écran. Il est aussi gardé dans la trace de la partie.
  function raconter(phrases) {
    var texte = phrases.filter(function (p) { return !!p; });
    texte.forEach(function (p) { partie.trace.push(p); });
    ui.raconter(texte);
  }
  function proposer(liste) { ui.proposer(liste); }

  // ---------------------------------------------------------------------
  // TOUR PAR TOUR : ton jet, tes dégâts, puis le monstre, puis le bilan.
  // ---------------------------------------------------------------------
  // « du squelette », « des squelettes » (bande du système G)…
  function duMonstre() {
    return partie.bande ? 'des squelettes' : monstre.nom.replace(/^le /, 'du ');
  }

  // Fin de ton tour : le monstre ne joue que lorsque tu appuies sur le bouton.
  // suite(phrases) déroule le tour du monstre.
  function versMonstre(phrases, suite) {
    raconter(phrases);
    proposer([['Au tour ' + duMonstre(), function () { suite([]); }]]);
  }

  // Une étape intermédiaire : le récit, puis un seul bouton pour continuer.
  function etape(phrases, libelle, suite) {
    raconter(phrases);
    proposer([[libelle, suite]]);
  }

  // Les deux tours sont finis : on passe à l'assaut suivant.
  function finAssaut(phrases) {
    raconter(phrases);
    proposer([['Continuer', tourSuivant]]);
  }

  // Le monstre frappe. Si le coup est mortel, on propose les dés de chance.
  function subir(degats, phrases) {
    if (partie.vie - degats > 0) {
      partie.vie -= degats;
      finAssaut(phrases.concat(['Tu perds ' + pv(degats) + '.']));
      return;
    }
    proposerChance(degats, phrases, finAssaut);
  }

  // ensuite(phrases) est appelé si la chance te sauve.
  function proposerChance(degats, phrases, ensuite) {
    var texte = phrases.concat(['Ce coup serait le dernier.']);
    if (partie.chances === 0) {
      texte.push('Il ne te reste aucun dé de chance.');
      raconter(texte);
      proposer([['Continuer', function () { mourir(); }]]);
      return;
    }
    texte.push('Il te reste ' + pluriel(partie.chances, 'dé de chance', 'dés de chance') + '. Il faut ' + partie.seuilChance + ' ou plus.');
    raconter(texte);
    proposer([
      ['Lancer un dé de chance', function () {
        var resultat = de();
        partie.chances -= 1;
        partie.decisions.chancesUtilisees += 1;
        var lu = 'Dé de chance : ' + resultat + '.';
        if (resultat >= partie.seuilChance) {
          partie.decisions.chancesReussies += 1;
          signaler('chance-reussie');
          ensuite([lu, 'La chance te sourit : le coup te frôle sans te toucher.']);
        } else {
          signaler('chance-ratee');
          proposerChance(degats, [lu, 'Raté.'], ensuite);
        }
      }],
      ['Renoncer', function () { mourir(); }]
    ]);
  }

  function fuir() {
    ui.annulerSigne();
    var r = partie.regles;
    var resultat = de();
    partie.decisions.fuites += 1;
    var lu = 'Tu tentes de fuir : ' + resultat + '. Il fallait ' + r.fuite + ' ou plus.';
    if (resultat >= r.fuite) {
      signaler('fuite');
      ui.ambiance(false);
      etape([lu, 'Tu recules d\'un bond et claques la porte derrière toi.'], 'Suite', function () {
        titre('Tu as fui');
        raconter(['Tu as échappé à ' + monstre.nom + '.']);
        terminer('fuite');
      });
      return;
    }
    moteur.fuiteRatee([lu, monstre.Nom + ' te barre le passage.']);
  }

  function vaincre(phrases) {
    etape(phrases.concat([(moteur.mort && moteur.mort()) || monstre.mort]), 'Suite', function () {
      titre('Victoire !');
      ui.ambiance(false);
      signaler('victoire');
      raconter(['Tu as vaincu ' + monstre.nom + '.']);
      terminer('victoire');
    });
  }

  function mourir() {
    partie.vie = 0;
    titre('Tu es mort');
    ui.ambiance(false);
    signaler('mort-heros');
    raconter(['Le noir se referme sur toi.']);
    terminer('mort');
  }

  // ---------------------------------------------------------------------
  // RÈGLES, ENTRÉE EN SCÈNE, ASSAUTS
  // ---------------------------------------------------------------------
  function reglesDuSysteme() {
    var r = partie.regles;
    var chance = 'Si un coup doit te tuer, tu peux lancer un dé de chance : sur ' + partie.seuilChance +
      ' ou plus, tu l\'évites. Si tu échoues, tu peux en lancer un autre, tant qu\'il t\'en reste.';
    var fuite = 'Fuir : tu lances un dé, il faut ' + r.fuite + ' ou plus. Si tu échoues, ' + monstre.nom + ' frappe sans riposte.';
    return moteur.regles().concat([chance, fuite]);
  }

  // Les règles, une page à la fois.
  function montrerRegle(i) {
    var pages = reglesDuSysteme();
    titre('Règles · ' + (i + 1) + ' sur ' + pages.length);
    raconter([pages[i].replace(/^Règles\. /, '').replace(/^Règles, inspirées /, 'Inspiré ')]);
    var suite = i + 1 < pages.length
      ? [['Suivant', function () { montrerRegle(i + 1); }], ['Passer les règles', entreeEnScene]]
      : [['Voir l\'adversaire', entreeEnScene]];
    if (i > 0) { suite.push(['Règle précédente', function () { montrerRegle(i - 1); }]); }
    proposer(suite);
  }

  function entreeEnScene() {
    partie.enCombat = true;
    titre('Ton adversaire');
    ui.ambiance(true);
    signaler('apparition', cle);
    raconter([(moteur.entree && moteur.entree()) || monstre.entree]);
    proposer([['Commencer le combat', tourSuivant]]);
  }

  function tourSuivant() {
    partie.tours += 1;
    titre((moteur.parTours ? 'Tour ' : 'Assaut ') + partie.tours);
    moteur.tour();
  }

  // ---------------------------------------------------------------------
  // FIN DU COMBAT : une ligne de journal et les données à envoyer.
  // ---------------------------------------------------------------------
  function terminer(issue) {
    var d = partie.decisions;
    partie.fini = true;
    partie.issue = issue;
    var ligne = 'Système ' + systeme + ' · ' + monstre.nom +
      ' · chance ' + partie.seuilChance + '+ · ' + issue +
      ' en ' + partie.tours + ' tour(s)' + (systeme === 'F' ? '' : ' · vie ' + Math.max(0, partie.vie) + '/' + partie.vieMax) +
      moteur.journal(d) +
      ' · dés de chance ' + d.chancesReussies + '/' + d.chancesUtilisees + ' réussis · fuites tentées ' + d.fuites;
    ui.terminer({
      ligne: ligne,
      donnees: {
        type: 'combat',
        systeme: systeme,
        adversaire: monstre.nom.replace(/^le /, ''),
        seuilChance: partie.seuilChance,
        indice: systeme === 'C' ? partie.indice : '',
        issue: issue,
        tours: partie.tours,
        vie: systeme === 'F' ? '' : Math.max(0, partie.vie),
        chancesLancees: d.chancesUtilisees,
        chancesReussies: d.chancesReussies,
        fuites: d.fuites
      }
    });
  }

  // ---------------------------------------------------------------------
  // CE QUE LES SYSTÈMES PEUVENT UTILISER
  // ---------------------------------------------------------------------
  var c = {
    partie: partie, ui: ui, hasard: hasard,
    de: de, lancer: lancer, au: au, titre: titre, signaler: signaler,
    raconter: raconter, proposer: proposer,
    duMonstre: duMonstre, versMonstre: versMonstre, etape: etape,
    finAssaut: finAssaut, continuer: finAssaut,
    subir: subir, proposerChance: proposerChance, fuir: fuir, vaincre: vaincre, mourir: mourir
  };
  var moteur = SYSTEMES[systeme](c);
  moteur.init();
  if (systeme === 'C' && !ui.audioDisponible()) {
    partie.indice = 'texte'; // navigateur sans son : on retombe sur le texte
  }

  return {
    partie: partie,
    moteur: moteur,
    nom: moteur.nom,
    demarrer: function () { montrerRegle(0); }
  };
}
