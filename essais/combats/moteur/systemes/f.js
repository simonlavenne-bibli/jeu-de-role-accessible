/**
 * Système F : réserve de dés et états de santé (inspiré de Mini Six).
 * Pas de points de vie : des états, de « indemne » (0) à « hors de combat » (4).
 */
import { HEROS_F } from '../donnees.js';

var MALUS_F = [0, 0, 1, 2];   // dés perdus selon l'état : blessé 1, gravement blessé 2
function somme(t) { return t.reduce(function (a, b) { return a + b; }, 0); }
function gravite(ecart) { return ecart <= 0 ? 0 : ecart <= 3 ? 1 : ecart <= 8 ? 2 : 3; }

export default function systemeF(c) {
  var partie = c.partie;
  var de = c.de, msg = c.msg, tirage = c.tirage;

  // Lance n dés dont un dé libre : un 6 se relance et s'ajoute, un 1 annule le meilleur autre dé.
  function reserve(n) {
    n = Math.max(1, n);
    var autres = c.lancer(n - 1);
    var libre = [de()];
    var total;
    var meilleur = 0;
    if (libre[0] === 1) {
      meilleur = autres.length ? Math.max.apply(null, autres) : 0;
      total = somme(autres) - meilleur;
    } else {
      while (libre[libre.length - 1] === 6) { libre.push(de()); }
      total = somme(autres) + somme(libre);
    }
    return { autres: autres, libre: libre, meilleur: meilleur, total: total };
  }

  var F = {
    init: function () { partie.niveauHeros = 0; partie.niveauMonstre = 0; },
    regles: function () { return ['F.regle-1', 'F.regle-2', 'F.regle-3', 'F.regle-4']; },
    tour: function () {
      c.raconter([msg('que-fais-tu')]);
      c.proposer([[msg('choix-attaquer'), F.attaque], [msg('choix-fuir'), c.fuir]]);
    },
    attaque: function () {
      var r = partie.regles;
      var n = HEROS_F.des - MALUS_F[partie.niveauHeros];
      var a = reserve(n);
      var messages = [msg('F.attaque', { nombre: n, reserve: a, seuil: r.parade })];
      if (a.total < r.parade) {
        c.signaler('parade');
        c.versMonstre(messages.concat([msg('F.monstre-pare')]), F.riposte);
        return;
      }
      c.etape(messages.concat([msg('tu-touches')]), 'choix-degats', function () {
        var d = reserve(HEROS_F.degatsDes);
        var deg = d.total + HEROS_F.degatsBonus;
        var g = gravite(deg - r.vigueur);
        var texte = [msg('F.degats-heros', { reserve: d, bonus: HEROS_F.degatsBonus, total: deg, vigueur: r.vigueur })];
        if (!g) {
          c.signaler('rate');
          texte.push(msg('F.pas-entame'));
        } else {
          partie.niveauMonstre = Math.min(4, partie.niveauMonstre + g);
          texte.push(msg('F.monstre-etat', { tirage: tirage(), niveau: partie.niveauMonstre }));
          if (partie.niveauMonstre >= 4) { c.vaincre(texte); return; }
        }
        c.versMonstre(texte, F.riposte);
      });
    },
    // Son attaque, puis, s'il touche, ses dégâts dans une seconde étape.
    riposte: function (messages) {
      var r = partie.regles;
      var n = r.des - MALUS_F[partie.niveauMonstre];
      var a = reserve(n);
      messages = messages.concat([msg('F.riposte', { nombre: n, reserve: a, parade: HEROS_F.parade })]);
      if (a.total < HEROS_F.parade) { c.signaler('parade'); c.continuer(messages.concat([msg('F.tu-pares')])); return; }
      c.etape(messages.concat([msg('F.il-te-touche')]), 'choix-degats-monstre', function () {
        var d = reserve(r.degatsDes);
        var deg = d.total + r.degatsBonus;
        var g = gravite(deg - HEROS_F.vigueur);
        var texte = [msg('F.degats-monstre', { reserve: d, bonus: r.degatsBonus, total: deg, vigueur: HEROS_F.vigueur, tirage: tirage() })];
        if (!g) { c.signaler('rate'); c.continuer(texte.concat([msg('F.sans-broncher')])); return; }
        if (partie.niveauHeros + g < 4) {
          partie.niveauHeros += g;
          c.continuer(texte.concat([msg('F.heros-etat', { niveau: partie.niveauHeros })]));
          return;
        }
        c.proposerChance(0, texte, c.finAssaut);
      });
    },
    fuiteRatee: function (messages) { c.versMonstre(messages, F.riposte); }
  };
  return F;
}
