/**
 * Système C : écouter le monstre.
 * Avant chaque assaut, le monstre annonce son intention par un son ;
 * la bonne posture ajoute 3 au total du héros.
 * Le moteur choisit l'intention ; l'interface fabrique et joue le son.
 */
import { HEROS } from '../donnees.js';

var POSTURE_JUSTE = { bondir: 'esquiver', proteger: 'attaquer', tourner: 'parer' };

export default function systemeC(c) {
  var partie = c.partie;
  var de = c.de, msg = c.msg, tirage = c.tirage;

  var C = {
    init: function () {},
    regles: function () {
      var annonce = partie.indice === 'sonore' ? ['C.regle-son-1', 'C.regle-son-2'] : ['C.regle-geste'];
      return annonce.concat(['C.regle-posture', 'C.regle-jet', 'C.regle-degats']);
    },
    tour: function () {
      var intentions = ['bondir', 'proteger', 'tourner'];
      var intention = intentions[Math.floor(c.hasard() * 3)];
      var choix = [
        [msg('choix-attaquer'), function () { C.assaut(intention, 'attaquer'); }],
        [msg('choix-esquiver'), function () { C.assaut(intention, 'esquiver'); }],
        [msg('choix-parer'), function () { C.assaut(intention, 'parer'); }],
        [msg('choix-fuir'), c.fuir]
      ];
      if (partie.indice !== 'sonore') {
        c.raconter([msg('C.geste', { intention: intention, tirage: tirage() })]);
        c.proposer(choix);
        return;
      }
      // Indice sonore : l'interface rejoue le même son pour la réécoute.
      var reecoute = false;
      c.raconter([msg('C.ecoute')]);
      choix.push([msg('choix-reecouter'), function () {
        if (reecoute) { return; }
        reecoute = true;
        partie.decisions.reecoutes += 1;
        c.ui.modifierChoix(4, msg('choix-reecouter-utilise'));
        c.ui.signe(intention, true);
      }]);
      c.proposer(choix);
      c.ui.signe(intention, false);
    },
    assaut: function (intention, posture) {
      c.ui.annulerSigne();
      var juste = POSTURE_JUSTE[intention] === posture;
      partie.decisions.lectures += 1;
      if (juste) { partie.decisions.bonnesLectures += 1; }
      var dh = [de(), de()];
      var th = dh[0] + dh[1] + HEROS.habilete + (juste ? 3 : 0);
      c.versMonstre([
        msg('C.lecture', { intention: intention, juste: juste }),
        msg('C.jet-heros', { des: dh, total: th })
      ], function () { C.comparer(intention, posture, th); });
    },
    comparer: function (intention, posture, th) {
      var r = partie.regles;
      var dm = [de(), de()];
      var tm = dm[0] + dm[1] + r.habilete;
      var messages = [msg('C.jet-monstre', { des: dm, total: tm, totalHeros: th })];
      if (th > tm) {
        var inflige = 2 + (posture === 'attaquer' ? 1 : 0);
        partie.vieMonstre -= inflige;
        messages.push(msg('monstre-touche', { tirage: tirage(), degats: inflige }));
        if (partie.vieMonstre <= 0) { c.vaincre(messages); return; }
        c.finAssaut(messages);
        return;
      }
      if (th === tm) {
        c.finAssaut(messages.concat([msg('C.egalite')]));
        return;
      }
      if (intention === 'proteger') {
        c.signaler('parade');
        c.finAssaut(messages.concat([msg('C.garde')]));
        return;
      }
      var degats = r.degats;
      var bond = intention === 'bondir' && posture !== 'esquiver';
      if (bond) { degats *= 2; }
      if (posture === 'parer') { degats -= 1; }
      if (degats <= 0) {
        c.signaler('parade');
        c.finAssaut(messages.concat([msg('C.parade-totale')]));
        return;
      }
      c.subir(degats, messages.concat([msg('C.frappe', { tirage: tirage(), bond: bond, parade: posture === 'parer' })]));
    },
    fuiteRatee: function (messages) {
      c.versMonstre(messages, function () {
        c.subir(partie.regles.degats, [msg('frappe-sans-riposte', { tirage: tirage() })]);
      });
    }
  };
  return C;
}
