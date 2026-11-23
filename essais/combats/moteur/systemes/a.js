/**
 * Système A : relance risquée.
 * Chacun lance 2 dés plus son habileté ; si tu perds, tu peux relancer ton dé le plus faible.
 */
import { HEROS } from '../donnees.js';

export default function systemeA(c) {
  var partie = c.partie;
  var de = c.de, msg = c.msg, tirage = c.tirage;

  var A = {
    init: function () {},
    regles: function () { return ['A.regle-1', 'A.regle-2']; },
    tour: function () {
      c.raconter([msg('que-fais-tu')]);
      c.proposer([[msg('choix-attaquer'), A.assaut], [msg('choix-fuir'), c.fuir]]);
    },
    // Ton jet d'abord, puis celui du monstre, puis on compare.
    assaut: function () {
      var dh = [de(), de()];
      var th = dh[0] + dh[1] + HEROS.habilete;
      c.versMonstre([msg('A.jet-heros', { des: dh.slice(), total: th })], function () {
        A.comparer(dh, th);
      });
    },
    comparer: function (dh, th) {
      var r = partie.regles;
      var dm = [de(), de()];
      var tm = dm[0] + dm[1] + r.habilete;
      var messages = [msg('A.jet-monstre', { des: dm, total: tm, totalHeros: th })];
      if (th > tm) { A.toucher(messages); return; }
      if (th === tm) {
        c.signaler('rate');
        c.finAssaut(messages.concat([msg('A.egalite')]));
        return;
      }
      // Assaut perdu : relance possible du dé le plus faible.
      var i = dh[0] <= dh[1] ? 0 : 1;
      var besoin = dh[i] + (tm - th) + 1;
      c.raconter(messages.concat([msg('assaut-perdu'), msg('A.besoin', { besoin: besoin, de: dh[i] })]));
      c.proposer([
        [msg('choix-relancer-de', { de: dh[i] }), function () {
          partie.decisions.relances += 1;
          var nouveau = de();
          dh[i] = nouveau;
          var t2 = dh[0] + dh[1] + HEROS.habilete;
          var lu = msg('A.relance', { de: nouveau, total: t2, totalMonstre: tm });
          if (t2 > tm) { A.toucher([lu]); return; }
          if (t2 === tm) {
            c.finAssaut([lu, msg('A.egalite-relance')]);
            return;
          }
          c.subir(r.degats * 2, [lu, msg('A.frappe-double', { tirage: tirage() })]);
        }],
        [msg('choix-encaisser'), function () {
          partie.decisions.encaisse += 1;
          c.subir(r.degats, [msg('monstre-frappe', { tirage: tirage() })]);
        }]
      ]);
    },
    toucher: function (messages) {
      partie.vieMonstre -= 2;
      var texte = messages.concat([msg('monstre-touche', { tirage: tirage(), degats: 2 })]);
      if (partie.vieMonstre <= 0) { c.vaincre(texte); return; }
      c.finAssaut(texte);
    },
    fuiteRatee: function (messages) {
      c.versMonstre(messages, function () {
        c.subir(partie.regles.degats, [msg('frappe-sans-riposte', { tirage: tirage() })]);
      });
    }
  };
  return A;
}
