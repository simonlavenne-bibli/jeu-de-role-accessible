/**
 * Système B : garder et relancer (inspiré de King of Tokyo).
 * 6 dés, jusqu'à 3 lancers : 6 = coup, 5 = parade, 1 = crâne.
 */
import { SEUIL_TREBUCHE, LANCERS_MAX, NB_DES_B } from '../donnees.js';

function sens(v) {
  if (v === 6) { return 'coup'; }
  if (v === 5) { return 'parade'; }
  if (v === 1) { return 'crane'; }
  return 'rien';
}

export default function systemeB(c) {
  var partie = c.partie;
  var de = c.de, msg = c.msg, tirage = c.tirage;
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

  // Ce que l'interface affiche pour un dé.
  function etatDe(i) {
    var d = desB[i];
    return {
      valeur: d.valeur,
      sens: sens(d.valeur),
      etat: d.valeur === 1 ? 'bloque' : (d.relancer ? 'a-relancer' : 'garde'),
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
    parTours: true,
    init: function () {},
    regles: function () { return ['B.regle-1', 'B.regle-2', 'B.regle-3', 'B.regle-4']; },
    tour: function () {
      c.raconter([msg('que-fais-tu')]);
      c.ui.cacherDes();
      c.proposer([[msg('choix-attaquer'), function () { B.lancer(true); }], [msg('choix-fuir'), c.fuir]]);
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
      var messages = [msg('B.lancer', { numero: lancerB_n, valeurs: valeurs }), msg('B.bilan', n)];

      if (!premier && n.cranes >= SEUIL_TREBUCHE && cranesAvant < SEUIL_TREBUCHE) {
        partie.decisions.trebuche += 1;
        c.ui.cacherDes();
        B.finTour(true, messages.concat([msg('B.trebuche')]));
        return;
      }
      if (lancerB_n >= LANCERS_MAX) {
        c.ui.cacherDes();
        B.finTour(false, messages.concat([msg('B.dernier-lancer')]));
        return;
      }
      // Par défaut, on propose de relancer les dés sans effet.
      desB.forEach(function (d) { d.relancer = (d.valeur >= 2 && d.valeur <= 4); });
      messages.push(msg('B.lancers-restants', { reste: LANCERS_MAX - lancerB_n, attention: n.cranes === SEUIL_TREBUCHE - 1 }));
      c.raconter(messages);
      afficherDes();
      B.proposerRelance();
    },
    proposerRelance: function () {
      var nb = desB.filter(function (d) { return d.relancer; }).length;
      var choix = [];
      if (nb > 0) {
        choix.push([msg('choix-B-relancer', { nombre: nb }), function () {
          partie.decisions.relances += 1;
          B.lancer(false);
        }]);
      }
      choix.push([msg('choix-B-arreter'), function () {
        partie.decisions.arrets += 1;
        c.ui.cacherDes();
        B.finTour(false, [msg('B.arret', compter())]);
      }]);
      c.proposer(choix);
    },
    finTour: function (trebuche, messages) {
      var r = partie.regles;
      var n = compter();
      var coups = trebuche ? 0 : n.coups;
      var parades = trebuche ? 0 : n.parades;
      var texte = messages.slice();
      if (coups > 0) {
        partie.vieMonstre -= coups;
        texte.push(msg('monstre-touche', { tirage: tirage(), degats: coups }));
        if (partie.vieMonstre <= 0) { c.vaincre(texte); return; }
      } else if (!trebuche) {
        c.signaler('rate');
        texte.push(msg('B.aucun-coup'));
      }
      if (parades > 0) { texte.push(msg('B.parades-gardees', { parades: parades })); }
      c.versMonstre(texte, function () {
        var degats = Math.max(0, r.force - parades);
        if (degats === 0) {
          c.signaler('parade');
          c.finAssaut([msg('B.parades-bloquent-tout')]);
          return;
        }
        c.subir(degats, [msg('B.frappe', { tirage: tirage(), bloques: parades > 0 ? Math.min(parades, r.force) : 0 })]);
      });
    },
    fuiteRatee: function (messages) {
      c.versMonstre(messages, function () {
        c.subir(partie.regles.force, [msg('frappe-sans-riposte', { tirage: tirage() })]);
      });
    }
  };
  return B;
}
