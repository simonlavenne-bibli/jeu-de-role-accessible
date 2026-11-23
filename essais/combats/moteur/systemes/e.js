/**
 * Système E : deux actions par tour (inspiré de TinyD6).
 */
import { HEROS_E } from '../donnees.js';

function touche(des) { return des.some(function (v) { return v >= 5; }); }

export default function systemeE(c) {
  var partie = c.partie;
  var msg = c.msg, tirage = c.tirage;

  var E = {
    parTours: true,
    init: function () { partie.vie = partie.vieMax = HEROS_E.vie; partie.concentre = false; },
    regles: function () { return ['E.regle-1', 'E.regle-2', 'E.regle-3', 'E.regle-4', 'E.regle-5']; },
    tour: function () {
      partie.actions = 2;
      partie.esquive = false;
      E.menu([]);
    },
    menu: function (messages) {
      c.raconter(messages.concat([msg('E.actions', { actions: partie.actions, concentre: partie.concentre, esquive: partie.esquive })]));
      c.proposer([
        [msg('choix-attaquer'), E.attaque],
        [msg('choix-E-concentrer'), function () {
          if (partie.concentre) { E.menu([msg('E.deja-concentre')]); return; }
          partie.concentre = true;
          partie.decisions.concentrations += 1;
          E.fin([msg('E.concentration')]);
        }],
        [msg('choix-esquiver'), function () {
          if (partie.esquive) { E.menu([msg('E.deja-esquive')]); return; }
          partie.esquive = true;
          partie.decisions.esquives += 1;
          E.fin([msg('E.esquive')]);
        }],
        [msg('choix-fuir'), function () {
          if (partie.actions < 2) { E.menu([msg('E.fuite-impossible')]); return; }
          c.fuir();
        }]
      ]);
    },
    attaque: function () {
      var n = partie.concentre ? 3 : 2;
      partie.concentre = false;
      var t = c.lancer(n);
      var messages = [msg('E.jet', { des: t })];
      if (touche(t)) {
        partie.vieMonstre -= 1;
        messages.push(msg('monstre-touche', { tirage: tirage(), degats: 1 }));
        if (partie.vieMonstre <= 0) { c.vaincre(messages); return; }
      } else {
        c.signaler('rate');
        messages.push(msg('E.rate'));
      }
      E.fin(messages);
    },
    fin: function (messages) {
      partie.actions -= 1;
      if (partie.actions > 0) { E.menu(messages); return; }
      c.versMonstre(messages, E.riposte);
    },
    riposte: function (messages) {
      var r = partie.regles;
      var t = c.lancer(partie.esquive ? 1 : r.des);
      messages = messages.concat([msg('E.attaque', { des: t })]);
      if (!touche(t)) {
        // « Il te manque » : coup dans le vide. (L'esquive réussie reste sans bruitage, comme avant.)
        if (!partie.esquive) { c.signaler('rate'); }
        c.continuer(messages.concat([msg(partie.esquive ? 'E.esquive-reussie' : 'il-te-manque')]));
        return;
      }
      c.subir(r.degats, messages.concat([msg('il-te-touche', { tirage: tirage() })]));
    },
    fuiteRatee: function (messages) { partie.esquive = false; c.versMonstre(messages, E.riposte); }
  };
  return E;
}
