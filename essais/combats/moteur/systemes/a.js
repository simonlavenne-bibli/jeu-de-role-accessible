/**
 * Système A : relance risquée.
 * Chacun lance 2 dés plus son habileté ; si tu perds, tu peux relancer ton dé le plus faible.
 */
import { HEROS } from '../donnees.js';
import { pv } from '../texte.js';

export default function systemeA(c) {
  var partie = c.partie;
  var de = c.de, au = c.au;

  var A = {
    nom: 'A, relance risquée',
    init: function () {},
    regles: function () {
      var r = partie.regles;
      return [
        'Règles. Chacun lance deux dés et ajoute son habileté : 7 pour toi, ' + r.habilete + ' pour ' + partie.monstre.nom + '. Le plus haut total touche et retire ' + pv(r.degats) + ' (2 pour toi).',
        'Si tu perds un assaut, tu peux relancer ton dé le plus faible, une seule fois. Le jeu te dit le chiffre qu\'il te faudrait. Si tu perds quand même, ' + partie.monstre.nom + ' frappe deux fois.'
      ];
    },
    tour: function () {
      c.raconter(['Que fais-tu ?']);
      c.proposer([['Attaquer', A.assaut], ['Fuir', c.fuir]]);
    },
    // Ton jet d'abord, puis celui du monstre, puis on compare.
    assaut: function () {
      var dh = [de(), de()];
      var th = dh[0] + dh[1] + HEROS.habilete;
      c.versMonstre(['Tu lances ' + dh[0] + ' et ' + dh[1] + '. Avec ton habileté : ' + th + '.'], function () {
        A.comparer(dh, th);
      });
    },
    comparer: function (dh, th) {
      var r = partie.regles;
      var dm = [de(), de()];
      var tm = dm[0] + dm[1] + r.habilete;
      var phrases = [
        partie.monstre.Nom + ' lance ' + dm[0] + ' et ' + dm[1] + '. Avec son habileté : ' + tm + ', contre ton ' + th + '.'
      ];
      if (th > tm) { A.toucher(phrases); return; }
      if (th === tm) {
        c.signaler('rate');
        c.finAssaut(phrases.concat(['Égalité. Les coups se croisent sans toucher.']));
        return;
      }
      // Assaut perdu : relance possible du dé le plus faible.
      var i = dh[0] <= dh[1] ? 0 : 1;
      var besoin = dh[i] + (tm - th) + 1;
      var annonce = besoin <= 6
        ? 'Pour gagner, il te faudrait ' + besoin + ' ou plus en relançant ton ' + dh[i] + '.'
        : 'Même un 6 ne te ferait pas gagner en relançant ton ' + dh[i] + '.';
      c.raconter(phrases.concat(['Tu perds l\'assaut.', annonce]));
      c.proposer([
        ['Relancer ton ' + dh[i], function () {
          partie.decisions.relances += 1;
          var nouveau = de();
          dh[i] = nouveau;
          var t2 = dh[0] + dh[1] + HEROS.habilete;
          var lu = 'Tu relances : ' + nouveau + '. Avec ton habileté : ' + t2 + ' contre ' + tm + '.';
          if (t2 > tm) { A.toucher([lu]); return; }
          if (t2 === tm) {
            c.finAssaut([lu, 'Égalité. Tu échappes au coup de justesse.']);
            return;
          }
          c.subir(r.degats * 2, [lu, 'Tu perds quand même. ' + partie.monstre.Nom + ' frappe deux fois. ' + au(partie.monstre.frappe)]);
        }],
        ['Encaisser', function () {
          partie.decisions.encaisse += 1;
          c.subir(r.degats, [au(partie.monstre.frappe)]);
        }]
      ]);
    },
    toucher: function (phrases) {
      partie.vieMonstre -= 2;
      var texte = phrases.concat([au(partie.monstre.touche) + ' ' + partie.monstre.Nom + ' perd 2 points de vie.']);
      if (partie.vieMonstre <= 0) { c.vaincre(texte); return; }
      c.finAssaut(texte);
    },
    fuiteRatee: function (phrases) {
      c.versMonstre(phrases, function () {
        c.subir(partie.regles.degats, [partie.monstre.Nom + ' frappe sans riposte. ' + au(partie.monstre.frappe)]);
      });
    },
    journal: function (d) { return ' · relances ' + d.relances + ' · encaissé ' + d.encaisse; }
  };
  return A;
}
