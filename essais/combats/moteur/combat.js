/**
 * combat.js — Le déroulement commun d'un combat, quel que soit le système.
 *
 * Le moteur ne touche jamais à la page, au son ni à l'image : il parle à
 * l'interface uniquement par l'objet « ui » qu'on lui donne. On peut donc le
 * faire tourner sans navigateur (tests, simulation d'équilibrage).
 *
 * Le moteur ne contient aucun texte non plus : il émet des messages nommés,
 *   { type: 'heros-perd', donnees: { degats: 2 } }
 * que l'interface traduit en phrases avec ../contenu/textes.js.
 *
 * Ce que le moteur demande à l'interface (ui) :
 *   titre(message)                     le titre de l'écran
 *   raconter(messages)                 le récit de l'écran (efface les choix)
 *   proposer([[message, action], …])   les choix du joueur
 *   modifierChoix(rang, message)       un choix devient « déjà utilisé »
 *   jet(valeur)                        un dé vient d'être tiré
 *   signaler(nom, monstre, options)    un événement à faire entendre (voir plus bas)
 *   ambiance(allumer)                  l'ambiance de fond du combat
 *   audioDisponible()                  vrai si le navigateur peut jouer des sons
 *   signe(intention, reecoute)         système C : le monstre annonce son intention
 *   annulerSigne()                     système C : le signe prévu ne doit plus jouer
 *   desAGarder(des, basculer)          système B : les dés à garder ou relancer
 *   cacherDes()                        système B : plus de dés à choisir
 *   terminer(donnees)                  fin du combat : les résultats à enregistrer
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
import { SYSTEMES } from './systemes/index.js';

export function creerCombat(options) {
  var ui = options.ui;
  var hasard = creerHasard(options.graine);
  var systeme = options.systeme;
  var cle = options.monstre;
  var monstre = MONSTRES[cle];   // les chiffres de l'adversaire
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
  // Un nombre entre 0 et 1 qui choisira la variante d'un texte (voir contenu/textes.js).
  function tirage() { return hasard(); }
  // Un message : son type, et les valeurs dont le texte a besoin.
  function msg(type, donnees) { return { type: type, donnees: donnees || {} }; }
  function titre(type, donnees) { ui.titre(msg(type, donnees)); }
  function signaler(nom, monstreDuSon, opts) { ui.signaler(nom, monstreDuSon, opts); }

  // Le récit de l'écran. Les messages sont aussi gardés dans la trace de la partie.
  function raconter(messages) {
    messages.forEach(function (m) { partie.trace.push(m); });
    ui.raconter(messages);
  }
  function proposer(liste) { ui.proposer(liste); }

  // ---------------------------------------------------------------------
  // TOUR PAR TOUR : ton jet, tes dégâts, puis le monstre, puis le bilan.
  // ---------------------------------------------------------------------
  // Fin de ton tour : le monstre ne joue que lorsque tu appuies sur le bouton.
  // suite(phrases) déroule le tour du monstre.
  function versMonstre(messages, suite) {
    raconter(messages);
    proposer([[msg('choix-au-tour-du-monstre'), function () { suite([]); }]]);
  }

  // Une étape intermédiaire : le récit, puis un seul bouton pour continuer.
  function etape(messages, choix, suite) {
    raconter(messages);
    proposer([[msg(choix), suite]]);
  }

  // Les deux tours sont finis : on passe à l'assaut suivant.
  function finAssaut(messages) {
    raconter(messages);
    proposer([[msg('choix-continuer'), tourSuivant]]);
  }

  // Le monstre frappe. Si le coup est mortel, on propose les dés de chance.
  function subir(degats, messages) {
    if (partie.vie - degats > 0) {
      partie.vie -= degats;
      finAssaut(messages.concat([msg('heros-perd', { degats: degats })]));
      return;
    }
    proposerChance(degats, messages, finAssaut);
  }

  // ensuite(messages) est appelé si la chance te sauve.
  function proposerChance(degats, messages, ensuite) {
    var texte = messages.concat([msg('coup-mortel')]);
    if (partie.chances === 0) {
      texte.push(msg('chance-epuisee'));
      raconter(texte);
      proposer([[msg('choix-continuer'), function () { mourir(); }]]);
      return;
    }
    texte.push(msg('chance-proposee', { desRestants: partie.chances, seuil: partie.seuilChance }));
    raconter(texte);
    proposer([
      [msg('choix-tenter-sa-chance'), function () {
        var resultat = de();
        partie.chances -= 1;
        partie.decisions.chancesUtilisees += 1;
        var lu = msg('chance-resultat', { de: resultat, desRestants: partie.chances });
        if (resultat >= partie.seuilChance) {
          partie.decisions.chancesReussies += 1;
          signaler('chance-reussie');
          ensuite([lu, msg('chance-reussie')]);
        } else {
          signaler('chance-ratee');
          proposerChance(degats, [lu, msg('chance-ratee')], ensuite);
        }
      }],
      [msg('choix-renoncer'), function () { mourir(); }]
    ]);
  }

  function fuir() {
    ui.annulerSigne();
    var r = partie.regles;
    var resultat = de();
    partie.decisions.fuites += 1;
    var lu = msg('fuite-resultat', { de: resultat, seuil: r.fuite, reussie: resultat >= r.fuite });
    if (resultat >= r.fuite) {
      signaler('fuite');
      ui.ambiance(false);
      etape([lu, msg('fuite-reussie')], 'choix-suite', function () {
        titre('titre-fuite');
        raconter([msg('fuite-bilan')]);
        terminer('fuite');
      });
      return;
    }
    moteur.fuiteRatee([lu, msg('fuite-ratee')]);
  }

  function vaincre(messages) {
    etape(messages.concat([msg('monstre-vaincu')]), 'choix-suite', function () {
      titre('titre-victoire');
      ui.ambiance(false);
      signaler('victoire');
      raconter([msg('victoire')]);
      terminer('victoire');
    });
  }

  function mourir() {
    partie.vie = 0;
    titre('titre-mort');
    ui.ambiance(false);
    signaler('mort-heros');
    raconter([msg('heros-mort')]);
    terminer('mort');
  }

  // ---------------------------------------------------------------------
  // RÈGLES, ENTRÉE EN SCÈNE, ASSAUTS
  // ---------------------------------------------------------------------
  // Les pages de règles : celles du système, puis la chance et la fuite.
  function reglesDuSysteme() {
    return moteur.regles().concat(['regle-chance', 'regle-fuite']);
  }

  // Les règles, une page à la fois.
  function montrerRegle(i) {
    var pages = reglesDuSysteme();
    titre('titre-regles', { page: i + 1, pages: pages.length });
    raconter([msg(pages[i])]);
    var suite = i + 1 < pages.length
      ? [[msg('choix-suivant'), function () { montrerRegle(i + 1); }], [msg('choix-passer-regles'), entreeEnScene]]
      : [[msg('choix-voir-adversaire'), entreeEnScene]];
    if (i > 0) { suite.push([msg('choix-regle-precedente'), function () { montrerRegle(i - 1); }]); }
    proposer(suite);
  }

  function entreeEnScene() {
    partie.enCombat = true;
    titre('titre-adversaire');
    ui.ambiance(true);
    signaler('apparition', cle);
    raconter([msg('monstre-apparait', { monstre: cle })]);
    proposer([[msg('choix-commencer'), tourSuivant]]);
  }

  function tourSuivant() {
    partie.tours += 1;
    titre('titre-tour', { numero: partie.tours, parTours: !!moteur.parTours });
    moteur.tour();
  }

  // ---------------------------------------------------------------------
  // FIN DU COMBAT : les données à enregistrer (la ligne du journal est écrite par l'interface).
  // ---------------------------------------------------------------------
  function terminer(issue) {
    var d = partie.decisions;
    partie.fini = true;
    partie.issue = issue;
    ui.terminer({
      type: 'combat',
      systeme: systeme,
      adversaire: cle,
      seuilChance: partie.seuilChance,
      indice: systeme === 'C' ? partie.indice : '',
      issue: issue,
      tours: partie.tours,
      vie: systeme === 'F' ? '' : Math.max(0, partie.vie),
      chancesLancees: d.chancesUtilisees,
      chancesReussies: d.chancesReussies,
      fuites: d.fuites
    });
  }

  // ---------------------------------------------------------------------
  // CE QUE LES SYSTÈMES PEUVENT UTILISER
  // ---------------------------------------------------------------------
  var c = {
    partie: partie, ui: ui, hasard: hasard,
    de: de, lancer: lancer, tirage: tirage, msg: msg, titre: titre, signaler: signaler,
    raconter: raconter, proposer: proposer,
    versMonstre: versMonstre, etape: etape,
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
    demarrer: function () { montrerRegle(0); }
  };
}
