/**
 * Système B : garder et relancer (inspiré de King of Tokyo).
 * 6 dés, jusqu'à 3 lancers : 6 = coup, 5 = parade, 1 = crâne.
 */
import { SEUIL_TREBUCHE, LANCERS_MAX, NB_DES_B } from '../donnees.js';
import { pv, pluriel, liste } from '../texte.js';

function sens(v) {
  if (v === 6) { return 'coup'; }
  if (v === 5) { return 'parade'; }
  if (v === 1) { return 'crâne'; }
  return 'rien';
}

export default function systemeB(c) {
  var partie = c.partie;
  var de = c.de, au = c.au;
  var desB = [];          // [{ valeur, relancer }]
  var lancerB_n = 0;

  function compter() {
    var n = { coups: 0, parades: 0, cranes: 0, rien: 0 };
    desB.forEach(function (d) {
      if (d.valeur === 6) { n.coups += 1; }
      else if (d.valeur === 5) { n.parades += 1; }
      else if (d.valeur === 1) { n.cranes += 1; }
      else { n.rien += 1; }
    });
    return n;
  }

  function resume(n) {
    var morceaux = [];
    if (n.coups) { morceaux.push(pluriel(n.coups, 'coup', 'coups')); }
    if (n.parades) { morceaux.push(pluriel(n.parades, 'parade', 'parades')); }
    if (n.cranes) { morceaux.push(pluriel(n.cranes, 'crâne', 'crânes')); }
    if (n.rien) { morceaux.push(n.rien + ' sans effet'); }
    return 'Tu as ' + liste(morceaux) + '.';
  }

  // Ce que l'interface affiche pour un dé.
  function etatDe(i) {
    var d = desB[i];
    return {
      valeur: d.valeur,
      sens: sens(d.valeur),
      etat: d.valeur === 1 ? 'bloqué' : (d.relancer ? 'à relancer' : 'gardé'),
      bloque: d.valeur === 1,
      relancer: d.relancer
    };
  }

  function afficherDes() {
    c.ui.desAGarder(desB.map(function (d, i) { return etatDe(i); }), function basculer(i) {
      if (desB[i].valeur !== 1) { desB[i].relancer = !desB[i].relancer; }
      B.proposerRelance();
      return etatDe(i);
    });
  }

  var B = {
    nom: 'B, garder et relancer',
    parTours: true,
    init: function () {},
    regles: function () {
      var r = partie.regles;
      return [
        'Règles. À ton tour, tu lances 6 dés. Après chaque lancer, tu choisis les dés à relancer, jusqu\'à 3 lancers. Tu peux t\'arrêter quand tu veux.',
        'Un 6 est un coup : ' + partie.monstre.nom + ' perd 1 point de vie. Un 5 est une parade : elle bloque 1 point de dégâts. Un 1 est un crâne : il reste sur la table. Les 2, 3 et 4 ne donnent rien.',
        'Si une relance amène ton troisième crâne, tu trébuches : tes coups et tes parades de ce tour sont perdus. Des crânes au premier lancer ne te font jamais trébucher.',
        'À la fin de ton tour, ' + partie.monstre.nom + ' frappe : ' + pv(r.force) + ', moins tes parades.'
      ];
    },
    tour: function () {
      c.raconter(['Que fais-tu ?']);
      c.ui.cacherDes();
      c.proposer([['Attaquer', function () { B.lancer(true); }], ['Fuir', c.fuir]]);
    },
    // premier : vrai pour le premier lancer du tour (tous les dés).
    lancer: function (premier) {
      var cranesAvant = 0;
      if (premier) {
        lancerB_n = 1;
        desB = [];
        for (var i = 0; i < NB_DES_B; i += 1) { desB.push({ valeur: de(), relancer: false }); }
      } else {
        lancerB_n += 1;
        cranesAvant = compter().cranes;
        var relances = 0;
        desB.forEach(function (d) {
          if (d.relancer) { d.valeur = de(); d.relancer = false; relances += 1; }
        });
        if (!relances) { lancerB_n -= 1; return; }
      }
      var n = compter();
      var valeurs = desB.map(function (d) { return d.valeur; }).sort(function (a, b) { return b - a; });
      var phrases = [(lancerB_n === 1 ? 'Premier' : lancerB_n === 2 ? 'Deuxième' : 'Troisième') + ' lancer : ' + liste(valeurs.map(String)) + '.', resume(n)];

      if (!premier && n.cranes >= SEUIL_TREBUCHE && cranesAvant < SEUIL_TREBUCHE) {
        partie.decisions.trebuche += 1;
        c.ui.cacherDes();
        B.finTour(true, phrases.concat(['Troisième crâne : tu trébuches ! Tes coups et tes parades de ce tour sont perdus.']));
        return;
      }
      if (lancerB_n >= LANCERS_MAX) {
        c.ui.cacherDes();
        B.finTour(false, phrases.concat(['C\'était ton dernier lancer.']));
        return;
      }
      // Par défaut, on propose de relancer les dés sans effet.
      desB.forEach(function (d) { d.relancer = (d.valeur >= 2 && d.valeur <= 4); });
      var reste = LANCERS_MAX - lancerB_n;
      phrases.push('Il te reste ' + pluriel(reste, 'lancer', 'lancers') + '.' +
        (n.cranes === SEUIL_TREBUCHE - 1 ? ' Attention : un crâne de plus et tu trébuches.' : ''));
      c.raconter(phrases);
      afficherDes();
      B.proposerRelance();
    },
    proposerRelance: function () {
      var nb = desB.filter(function (d) { return d.relancer; }).length;
      var choix = [];
      if (nb > 0) {
        choix.push(['Relancer ' + pluriel(nb, 'dé', 'dés') + ' (les dés marqués « à relancer »)', function () {
          partie.decisions.relances += 1;
          B.lancer(false);
        }]);
      }
      choix.push(['M\'arrêter et frapper', function () {
        partie.decisions.arrets += 1;
        c.ui.cacherDes();
        B.finTour(false, ['Tu t\'arrêtes. ' + resume(compter())]);
      }]);
      c.proposer(choix);
    },
    finTour: function (trebuche, phrases) {
      var r = partie.regles;
      var n = compter();
      var coups = trebuche ? 0 : n.coups;
      var parades = trebuche ? 0 : n.parades;
      var texte = phrases.slice();
      if (coups > 0) {
        partie.vieMonstre -= coups;
        texte.push(au(partie.monstre.touche) + ' ' + partie.monstre.Nom + ' perd ' + pv(coups) + '.');
        if (partie.vieMonstre <= 0) { c.vaincre(texte); return; }
      } else if (!trebuche) {
        c.signaler('rate');
        texte.push('Aucun de tes coups ne porte.');
      }
      if (parades > 0) { texte.push('Tu gardes ' + pluriel(parades, 'parade', 'parades') + ' pour son attaque.'); }
      c.versMonstre(texte, function () {
        var degats = Math.max(0, r.force - parades);
        if (degats === 0) {
          c.signaler('parade');
          c.finAssaut([partie.monstre.Nom + ' frappe, mais tes parades bloquent tout.']);
          return;
        }
        c.subir(degats, [partie.monstre.Nom + ' frappe. ' + au(partie.monstre.frappe) +
          (parades > 0 ? ' Tes parades bloquent ' + pluriel(Math.min(parades, r.force), 'point', 'points') + '.' : '')]);
      });
    },
    fuiteRatee: function (phrases) {
      c.versMonstre(phrases, function () {
        c.subir(partie.regles.force, [partie.monstre.Nom + ' frappe sans riposte. ' + au(partie.monstre.frappe)]);
      });
    },
    journal: function (d) { return ' · relances ' + d.relances + ' · arrêts ' + d.arrets + ' · trébuché ' + d.trebuche; }
  };
  return B;
}
