/**
 * Système F : réserve de dés et états de santé (inspiré de Mini Six).
 */
import { HEROS_F } from '../donnees.js';
import { pluriel, annonce, somme } from '../texte.js';

var ETATS_F = ['indemne', 'sonné', 'blessé', 'gravement blessé', 'hors de combat'];
var MALUS_F = [0, 0, 1, 2];
function gravite(ecart) { return ecart <= 0 ? 0 : ecart <= 3 ? 1 : ecart <= 8 ? 2 : 3; }

export default function systemeF(c) {
  var partie = c.partie;
  var raconter = c.raconter, proposer = c.proposer, etape = c.etape, versMonstre = c.versMonstre;
  var continuer = c.continuer, finAssaut = c.finAssaut, subir = c.subir, proposerChance = c.proposerChance;
  var fuir = c.fuir, vaincre = c.vaincre, duMonstre = c.duMonstre;
  var de = c.de, au = c.au, lancer = c.lancer;

  // Lance n dés dont un dé libre : un 6 se relance et s'ajoute, un 1 annule le meilleur autre dé.
  function reserve(n) {
    n = Math.max(1, n);
    var autres = lancer(n - 1);
    var libre = [de()];
    var texte = (autres.length ? 'Dés : ' + annonce(autres) + '. ' : '');
    var total;
    if (libre[0] === 1) {
      var meilleur = autres.length ? Math.max.apply(null, autres) : 0;
      total = somme(autres) - meilleur;
      texte += 'Dé libre : 1' + (autres.length ? ', il annule ton meilleur dé, le ' + meilleur : '') + '.';
    } else {
      while (libre[libre.length - 1] === 6) { libre.push(de()); }
      total = somme(autres) + somme(libre);
      texte += 'Dé libre : ' + libre.join(' puis ') + '.';
    }
    return { total: total, texte: texte };
  }

  var F = {
    nom: 'F, réserve de dés et états de santé',
    init: function () { partie.niveauHeros = 0; partie.niveauMonstre = 0; },
    regles: function () {
      var r = partie.regles;
      return [
        'Règles, inspirées de Mini Six. Tu attaques avec ' + HEROS_F.des + ' dés que tu additionnes. L\'un d\'eux est le dé libre : s\'il fait 6, on le relance et on ajoute ; s\'il fait 1, il annule ton meilleur dé.',
        'Pour toucher ' + partie.monstre.nom + ', il faut atteindre sa parade : ' + r.parade + '. Tu lances alors tes dégâts, ' + HEROS_F.degatsDes + ' dés plus ' + HEROS_F.degatsBonus + ', contre sa vigueur : ' + r.vigueur + '.',
        'Pas de points de vie : selon l\'écart, la cible passe d\'un à trois états plus bas. Indemne, sonné, blessé, gravement blessé, hors de combat. Blessé coûte 1 dé, gravement blessé 2 dés.',
        partie.monstre.Nom + ' attaque avec ' + r.des + ' dés contre ta parade de ' + HEROS_F.parade + ', et ses dégâts, ' + r.degatsDes + ' dés plus ' + r.degatsBonus + ', contre ta vigueur de ' + HEROS_F.vigueur + '.'
      ];
    },
    // Pas de points de vie en F : on affiche l'état de santé.
    compteurs: function (affichage) {
      affichage.valeurMonstre = ETATS_F[partie.niveauMonstre];
      affichage.valeurHeros = ETATS_F[partie.niveauHeros];
      affichage.mots = true;
    },
    tour: function () {
      raconter(['Que fais-tu ?']);
      proposer([['Attaquer', F.attaque], ['Fuir', fuir]]);
    },
    attaque: function () {
      var r = partie.regles;
      var n = HEROS_F.des - MALUS_F[partie.niveauHeros];
      var a = reserve(n);
      var phrases = ['Ton attaque, ' + pluriel(n, 'dé', 'dés') + '. ' + a.texte + ' Total : ' + a.total + ', il fallait ' + r.parade + '.'];
      if (a.total < r.parade) {
        c.signaler('parade');
        versMonstre(phrases.concat([partie.monstre.Nom + ' pare.']), F.riposte);
        return;
      }
      etape(phrases.concat(['Tu touches.']), 'Lancer tes dégâts', function () {
        var d = reserve(HEROS_F.degatsDes);
        var deg = d.total + HEROS_F.degatsBonus;
        var g = gravite(deg - r.vigueur);
        var texte = ['Tes dégâts : ' + d.texte + ' Plus ' + HEROS_F.degatsBonus + ' : ' + deg + ' contre sa vigueur de ' + r.vigueur + '.'];
        if (!g) {
          c.signaler('rate');
          texte.push('Le coup ne l\'entame pas.');
        } else {
          partie.niveauMonstre = Math.min(4, partie.niveauMonstre + g);
          texte.push(au(partie.monstre.touche) + ' ' + partie.monstre.Nom + ' est ' + ETATS_F[partie.niveauMonstre] + '.');
          if (partie.niveauMonstre >= 4) { vaincre(texte); return; }
        }
        versMonstre(texte, F.riposte);
      });
    },
    // Son attaque, puis, s'il touche, ses dégâts dans une seconde étape.
    riposte: function (phrases) {
      var r = partie.regles;
      var n = r.des - MALUS_F[partie.niveauMonstre];
      var a = reserve(n);
      phrases = phrases.concat([partie.monstre.Nom + ' attaque, ' + pluriel(n, 'dé', 'dés') + '. ' + a.texte + ' Total : ' + a.total + ' contre ta parade de ' + HEROS_F.parade + '.']);
      if (a.total < HEROS_F.parade) { c.signaler('parade'); continuer(phrases.concat(['Tu pares.'])); return; }
      etape(phrases.concat(['Il te touche.']), partie.monstre.Nom + ' lance ses dégâts', function () {
        var d = reserve(r.degatsDes);
        var deg = d.total + r.degatsBonus;
        var g = gravite(deg - HEROS_F.vigueur);
        var texte = ['Ses dégâts : ' + d.texte + ' Plus ' + r.degatsBonus + ' : ' + deg + ' contre ta vigueur de ' + HEROS_F.vigueur + '. ' + au(partie.monstre.frappe)];
        if (!g) { c.signaler('rate'); continuer(texte.concat(['Tu encaisses sans broncher.'])); return; }
        if (partie.niveauHeros + g < 4) {
          partie.niveauHeros += g;
          continuer(texte.concat(['Tu es ' + ETATS_F[partie.niveauHeros] + '.']));
          return;
        }
        proposerChance(0, texte, finAssaut);
      });
    },
    fuiteRatee: function (phrases) { versMonstre(phrases, F.riposte); },
    journal: function () { return ' · état final ' + ETATS_F[partie.niveauHeros] + ' contre ' + ETATS_F[partie.niveauMonstre]; }
  };
  return F;
}
