/**
 * Système D : seuil et karma (inspiré d'EZD6).
 */
import { HEROS_D } from '../donnees.js';
import { pv, pluriel } from '../texte.js';

export default function systemeD(c) {
  var partie = c.partie;
  var raconter = c.raconter, proposer = c.proposer, etape = c.etape, versMonstre = c.versMonstre;
  var continuer = c.continuer, finAssaut = c.finAssaut, subir = c.subir, proposerChance = c.proposerChance;
  var fuir = c.fuir, vaincre = c.vaincre, duMonstre = c.duMonstre;
  var de = c.de, au = c.au, lancer = c.lancer;

  var D = {
    nom: 'D, seuil et karma',
    init: function () { partie.vie = partie.vieMax = HEROS_D.vie; partie.karma = 0; },
    regles: function () {
      var r = partie.regles;
      return [
        'Règles, inspirées d\'EZD6. Tu lances un seul dé. Pour toucher ' + partie.monstre.nom + ', il faut ' + r.seuil + ' ou plus. Chaque touche lui retire 1 point de vie. Il en a ' + r.vie + ', toi ' + HEROS_D.vie + '.',
        'Un 1 rate toujours. Un 6 touche et tu relances : chaque nouveau dé qui atteint le seuil touche encore, et un nouveau 6 relance encore.',
        'Chaque échec te donne 1 point de karma. Quand tu rates de peu, tu peux dépenser du karma : chaque point ajoute 1 à ton dé.',
        'Ensuite ' + partie.monstre.nom + ' attaque : il te touche sur ' + r.attaque + ' ou plus. S\'il touche, tu utilises ton bouclier : tu lances un dé, et sur ' + HEROS_D.armure + ' ou plus, ton bouclier arrête le coup. Sinon tu perds ' + pv(r.degats) + '.'
      ];
    },
    compteurs: function (affichage) { affichage.extra.push(pluriel(partie.karma, 'point de karma', 'points de karma')); },
    tour: function () {
      raconter(['Que fais-tu ?']);
      proposer([['Attaquer', D.attaque], ['Fuir', fuir]]);
    },
    attaque: function () {
      var r = partie.regles;
      var d = de();
      var phrases = ['Tu lances : ' + d + '. Il faut ' + r.seuil + ' ou plus.'];
      if (d === 1) {
        partie.karma += 1;
        c.signaler('rate');
        versMonstre(phrases.concat(['Un 1 rate toujours. Tu gagnes 1 point de karma.']), D.riposte);
        return;
      }
      if (d >= r.seuil) { D.touches(d, phrases); return; }
      var manque = r.seuil - d;
      c.signaler('rate');
      if (partie.karma < manque) {
        partie.karma += 1;
        versMonstre(phrases.concat(['Raté. Tu gagnes 1 point de karma.']), D.riposte);
        return;
      }
      raconter(phrases.concat(['Raté de ' + manque + '. Tu as ' + pluriel(partie.karma, 'point de karma', 'points de karma') + '.']));
      proposer([
        ['Dépenser ' + pluriel(manque, 'point de karma', 'points de karma') + ' et toucher', function () {
          partie.karma -= manque;
          partie.decisions.karma += manque;
          D.blesser(1, ['Tu puises dans ton karma : ton ' + d + ' devient ' + r.seuil + '.']);
        }],
        ['Garder ton karma', function () {
          partie.karma += 1;
          versMonstre(['Tu gardes ton karma pour plus tard, et tu en gagnes 1 de plus.'], D.riposte);
        }]
      ]);
    },
    touches: function (d, phrases) {
      var r = partie.regles;
      var n = 1;
      while (d === 6 && n < partie.vieMonstre) {
        d = de();
        phrases.push('Un 6 ! Tu relances : ' + d + '.');
        if (d >= r.seuil) { n += 1; } else { break; }
      }
      D.blesser(n, phrases);
    },
    blesser: function (n, phrases) {
      partie.vieMonstre -= n;
      phrases.push(au(partie.monstre.touche) + ' ' + partie.monstre.Nom + ' perd ' + pv(n) + '.');
      if (partie.vieMonstre <= 0) { vaincre(phrases); return; }
      versMonstre(phrases, D.riposte);
    },
    // Son attaque, puis, s'il touche, ton jet d'armure dans une seconde étape.
    riposte: function (phrases) {
      var r = partie.regles;
      var m = de();
      if (m < r.attaque) {
        c.signaler('rate');
        continuer(phrases.concat([partie.monstre.Nom + ' attaque : ' + m + '. Il lui fallait ' + r.attaque + '. Il te manque.']));
        return;
      }
      etape(phrases.concat([partie.monstre.Nom + ' attaque : ' + m + '. Il lui fallait ' + r.attaque + '. Il te touche. ' + au(partie.monstre.frappe),
        'Ton bouclier peut arrêter le coup : il faut ' + HEROS_D.armure + ' ou plus.']), 'Utiliser ton bouclier', function () {
        var a = de();
        if (a >= HEROS_D.armure) {
          c.signaler('parade');
          continuer(['Ton bouclier : ' + a + '. Il arrête le coup.']);
          return;
        }
        subir(r.degats, ['Ton bouclier : ' + a + '. Il ne suffit pas.']);
      });
    },
    fuiteRatee: function (phrases) { versMonstre(phrases, D.riposte); },
    journal: function (d) { return ' · karma dépensé ' + d.karma + ' · karma restant ' + partie.karma; }
  };
  return D;
}
