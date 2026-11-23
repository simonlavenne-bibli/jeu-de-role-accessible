/**
 * Système E : deux actions par tour (inspiré de TinyD6).
 */
import { HEROS_E } from '../donnees.js';
import { pv, pluriel, annonce } from '../texte.js';

export default function systemeE(c) {
  var partie = c.partie;
  var raconter = c.raconter, proposer = c.proposer, etape = c.etape, versMonstre = c.versMonstre;
  var continuer = c.continuer, finAssaut = c.finAssaut, subir = c.subir, proposerChance = c.proposerChance;
  var fuir = c.fuir, vaincre = c.vaincre, duMonstre = c.duMonstre;
  var de = c.de, au = c.au, lancer = c.lancer;

  var E = {
    nom: 'E, deux actions par tour',
    parTours: true,
    init: function () { partie.vie = partie.vieMax = HEROS_E.vie; partie.concentre = false; },
    regles: function () {
      var r = partie.regles;
      return [
        'Règles, inspirées de TinyD6. À chaque tour, tu fais 2 actions, puis ' + partie.monstre.nom + ' attaque.',
        'Attaquer : tu lances 2 dés. Un seul 5 ou 6 suffit pour toucher, et chaque touche retire 1 point de vie. ' + partie.monstre.Nom + ' en a ' + r.vie + ', toi ' + HEROS_E.vie + '.',
        'Te concentrer : ta prochaine attaque se fait avec 3 dés.',
        'Esquiver : ce tour-ci, ' + partie.monstre.nom + ' n\'attaque qu\'avec 1 dé au lieu de ' + r.des + '.',
        'Il te touche s\'il fait au moins un 5 ou un 6, et tu perds ' + pv(r.degats) + '. Fuir prend tes 2 actions.'
      ];
    },
    tour: function () {
      partie.actions = 2;
      partie.esquive = false;
      E.menu([]);
    },
    menu: function (phrases) {
      var t = 'Il te reste ' + pluriel(partie.actions, 'action', 'actions') + '.';
      if (partie.concentre) { t += ' Tu es concentré : ta prochaine attaque se fait avec 3 dés.'; }
      if (partie.esquive) { t += ' Tu esquives ce tour-ci.'; }
      raconter(phrases.concat([t]));
      proposer([
        ['Attaquer', E.attaque],
        ['Te concentrer', function () {
          if (partie.concentre) { E.menu(['Tu es déjà concentré.']); return; }
          partie.concentre = true;
          partie.decisions.concentrations += 1;
          E.fin(['Tu respires et tu fixes ' + partie.monstre.nom + '.']);
        }],
        ['Esquiver', function () {
          if (partie.esquive) { E.menu(['Tu esquives déjà ce tour-ci.']); return; }
          partie.esquive = true;
          partie.decisions.esquives += 1;
          E.fin(['Tu te mets sur tes gardes.']);
        }],
        ['Fuir', function () {
          if (partie.actions < 2) { E.menu(['Pour fuir, il faut tes 2 actions. Attends le tour suivant.']); return; }
          fuir();
        }]
      ]);
    },
    attaque: function () {
      var n = partie.concentre ? 3 : 2;
      partie.concentre = false;
      var t = lancer(n);
      var phrases = ['Tu lances ' + n + ' dés : ' + annonce(t) + '.'];
      if (t.some(function (v) { return v >= 5; })) {
        partie.vieMonstre -= 1;
        phrases.push(au(partie.monstre.touche) + ' ' + partie.monstre.Nom + ' perd 1 point de vie.');
        if (partie.vieMonstre <= 0) { vaincre(phrases); return; }
      } else {
        c.signaler('rate');
        phrases.push('Ni 5 ni 6 : raté.');
      }
      E.fin(phrases);
    },
    fin: function (phrases) {
      partie.actions -= 1;
      if (partie.actions > 0) { E.menu(phrases); return; }
      versMonstre(phrases, E.riposte);
    },
    riposte: function (phrases) {
      var r = partie.regles;
      var n = partie.esquive ? 1 : r.des;
      var t = lancer(n);
      phrases = phrases.concat([partie.monstre.Nom + ' attaque avec ' + pluriel(n, 'dé', 'dés') + ' : ' + annonce(t) + '.']);
      if (!t.some(function (v) { return v >= 5; })) {
        // « Il te manque » : coup dans le vide. (L'esquive réussie reste sans bruitage, comme avant.)
        if (!partie.esquive) { c.signaler('rate'); }
        continuer(phrases.concat([partie.esquive ? 'Tu esquives le coup.' : 'Il te manque.']));
        return;
      }
      subir(r.degats, phrases.concat(['Il te touche. ' + au(partie.monstre.frappe)]));
    },
    fuiteRatee: function (phrases) { partie.esquive = false; versMonstre(phrases, E.riposte); },
    journal: function (d) { return ' · concentrations ' + d.concentrations + ' · esquives ' + d.esquives; }
  };
  return E;
}
