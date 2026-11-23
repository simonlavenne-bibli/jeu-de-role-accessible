/**
 * Système D : seuil et karma (inspiré d'EZD6).
 */
import { HEROS_D } from '../donnees.js';

export default function systemeD(c) {
  var partie = c.partie;
  var de = c.de, msg = c.msg, tirage = c.tirage;

  var D = {
    init: function () { partie.vie = partie.vieMax = HEROS_D.vie; partie.karma = 0; },
    regles: function () { return ['D.regle-1', 'D.regle-2', 'D.regle-3', 'D.regle-4']; },
    tour: function () {
      c.raconter([msg('que-fais-tu')]);
      c.proposer([[msg('choix-attaquer'), D.attaque], [msg('choix-fuir'), c.fuir]]);
    },
    attaque: function () {
      var r = partie.regles;
      var d = de();
      var messages = [msg('D.jet', { de: d, seuil: r.seuil })];
      if (d === 1) {
        partie.karma += 1;
        c.signaler('rate');
        c.versMonstre(messages.concat([msg('D.un')]), D.riposte);
        return;
      }
      if (d >= r.seuil) { D.touches(d, messages); return; }
      var manque = r.seuil - d;
      c.signaler('rate');
      if (partie.karma < manque) {
        partie.karma += 1;
        c.versMonstre(messages.concat([msg('D.rate')]), D.riposte);
        return;
      }
      c.raconter(messages.concat([msg('D.rate-de', { manque: manque, karma: partie.karma })]));
      c.proposer([
        [msg('choix-D-depenser', { manque: manque }), function () {
          partie.karma -= manque;
          partie.decisions.karma += manque;
          D.blesser(1, [msg('D.karma', { de: d, seuil: r.seuil })]);
        }],
        [msg('choix-D-garder'), function () {
          partie.karma += 1;
          c.versMonstre([msg('D.karma-garde')], D.riposte);
        }]
      ]);
    },
    touches: function (d, messages) {
      var r = partie.regles;
      var n = 1;
      while (d === 6 && n < partie.vieMonstre) {
        d = de();
        messages.push(msg('D.relance', { de: d }));
        if (d >= r.seuil) { n += 1; } else { break; }
      }
      D.blesser(n, messages);
    },
    blesser: function (n, messages) {
      partie.vieMonstre -= n;
      messages.push(msg('monstre-touche', { tirage: tirage(), degats: n }));
      if (partie.vieMonstre <= 0) { c.vaincre(messages); return; }
      c.versMonstre(messages, D.riposte);
    },
    // Son attaque, puis, s'il touche, ton bouclier dans une seconde étape.
    riposte: function (messages) {
      var r = partie.regles;
      var m = de();
      if (m < r.attaque) {
        c.signaler('rate');
        c.continuer(messages.concat([msg('D.attaque-ratee', { de: m, seuil: r.attaque })]));
        return;
      }
      c.etape(messages.concat([msg('D.attaque-touche', { de: m, seuil: r.attaque, tirage: tirage() }), msg('D.bouclier-propose')]), 'choix-D-bouclier', function () {
        var a = de();
        if (a >= HEROS_D.armure) {
          c.signaler('parade');
          c.continuer([msg('D.bouclier-arrete', { de: a })]);
          return;
        }
        c.subir(r.degats, [msg('D.bouclier-insuffisant', { de: a })]);
      });
    },
    fuiteRatee: function (messages) { c.versMonstre(messages, D.riposte); }
  };
  return D;
}
