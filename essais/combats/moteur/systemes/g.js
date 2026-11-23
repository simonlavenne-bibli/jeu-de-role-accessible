/**
 * Système G : 2 dés contre 9 (inspiré de Barbarians of Lemuria).
 */
import { HEROS_G } from '../donnees.js';
import { pv, annonce } from '../texte.js';

export default function systemeG(c) {
  var partie = c.partie;
  var raconter = c.raconter, proposer = c.proposer, etape = c.etape, versMonstre = c.versMonstre;
  var continuer = c.continuer, finAssaut = c.finAssaut, subir = c.subir, proposerChance = c.proposerChance;
  var fuir = c.fuir, vaincre = c.vaincre, duMonstre = c.duMonstre;
  var de = c.de, au = c.au, lancer = c.lancer;

  // Deux dés, ou trois dont on garde les deux meilleurs avec l'avantage.
  function jetG(avantage) {
    var t = lancer(avantage ? 3 : 2);
    var gardes = t.slice().sort(function (a, b) { return b - a; }).slice(0, 2);
    var texte = avantage ? annonce(t) + ', garde ' + gardes.join(' et ') : t.join(' et ');
    return { somme: gardes[0] + gardes[1], texte: texte };
  }

  var G = {
    nom: 'G, 2 dés contre 9',
    init: function () {
      partie.vie = partie.vieMax = HEROS_G.vie;
      partie.bande = partie.regles.bande || 0;
      if (partie.bande) { partie.vieMonstre = partie.bande; }
      partie.avantageMonstre = false;
    },
    entree: function () {
      // L'illustration ne montre que le premier : les autres attendent dans l'ombre.
      return partie.bande ? 'Au fond de la salle, un squelette se redresse dans un cliquetis sec et lève son épée ébréchée. Dans l\'ombre derrière lui, ' +
        (partie.bande - 1) + ' autres attendent leur tour. Ils sont ' + partie.bande + ' en tout.' : null;
    },
    mort: function () { return partie.bande ? 'Le dernier squelette s\'effondre en tas sur les dalles.' : null; },
    regles: function () {
      var r = partie.regles;
      var cible = partie.bande
        ? 'Tu affrontes une bande de ' + partie.bande + ' squelettes. Chaque touche en abat un. Avec 12 ou plus, coup héroïque : tu en abats deux.'
        : 'Chaque touche retire 1 dé plus 1, moins son armure de ' + r.armure + ', avec au moins 1. ' + partie.monstre.Nom + ' a ' + pv(r.vie) + '.';
      return [
        'Règles, inspirées de Barbarians of Lemuria. Tu lances 2 dés, tu ajoutes 3 et tu retires la défense ' + duMonstre() + ' : ' + r.defense + '. Il faut 9 ou plus pour toucher.',
        cible,
        'Assaut féroce : tu lances 3 dés et gardes les 2 meilleurs, mais à son attaque suivante, ' + (partie.bande ? 'chaque squelette fait' : partie.monstre.nom + ' fait') + ' de même.',
        (partie.bande ? 'Chaque squelette debout attaque' : partie.monstre.Nom + ' attaque') + ' avec 2 dés plus ' + r.attaque + ', moins ta défense de ' + HEROS_G.defense + ' : 9 ou plus te touche. Dégâts : 1 dé plus ' + r.degats + ', moins ton armure de ' + HEROS_G.armure + '. Tu as ' + pv(HEROS_G.vie) + '.'
      ];
    },
    // Contre la bande : le nombre de squelettes encore debout.
    compteurs: function (affichage) { if (partie.bande) { affichage.monstre = 'Squelettes debout'; } },
    tour: function () {
      raconter(['Que fais-tu ?']);
      proposer([
        ['Attaquer', function () { G.attaque(false); }],
        ['Assaut féroce', function () { G.attaque(true); }],
        ['Fuir', fuir]
      ]);
    },
    attaque: function (feroce) {
      var r = partie.regles;
      var j = jetG(feroce);
      var total = j.somme + HEROS_G.bonus - r.defense;
      if (feroce) { partie.decisions.feroces += 1; partie.avantageMonstre = true; }
      var phrases = [(feroce ? 'Assaut féroce. ' : '') + 'Tu lances ' + j.texte + '. Plus ' + HEROS_G.bonus +
        (r.defense ? ', moins ' + r.defense : '') + ' : ' + total + '. Il faut 9.'];
      if (total < 9) {
        c.signaler('rate');
        versMonstre(phrases.concat(['Raté.']), G.riposte);
        return;
      }
      if (partie.bande) {
        // Contre la bande, une touche abat un squelette : pas de jet de dégâts.
        var abattus = Math.min(partie.vieMonstre, total >= 12 ? 2 : 1);
        partie.vieMonstre -= abattus;
        phrases.push(abattus === 2 ? 'Coup héroïque : deux squelettes volent en éclats.' : au(partie.monstre.touche) + ' Un squelette s\'effondre.');
        if (partie.vieMonstre <= 0) { vaincre(phrases); return; }
        versMonstre(phrases, G.riposte);
        return;
      }
      etape(phrases.concat(['Tu touches.']), 'Lancer tes dégâts', function () {
        var d = de();
        var deg = Math.max(1, d + 1 - r.armure);
        partie.vieMonstre -= deg;
        var texte = ['Tes dégâts : ' + d + ' plus 1' + (r.armure ? ' moins ' + r.armure : '') + '. ' + au(partie.monstre.touche) + ' ' + partie.monstre.Nom + ' perd ' + pv(deg) + '.'];
        if (partie.vieMonstre <= 0) { vaincre(texte); return; }
        versMonstre(texte, G.riposte);
      });
    },
    // Ses attaques, puis, s'il touche, ses dégâts dans une seconde étape.
    riposte: function (phrases) {
      var r = partie.regles;
      var avantage = partie.avantageMonstre;
      partie.avantageMonstre = false;
      var nb = partie.bande ? partie.vieMonstre : 1;
      var touches = [];
      for (var i = 0; i < nb; i += 1) {
        var j = jetG(avantage);
        var total = j.somme + r.attaque - HEROS_G.defense;
        var qui = partie.bande ? 'Squelette ' + (i + 1) : partie.monstre.Nom;
        var t = qui + (avantage ? ', féroce' : '') + ' : ' + j.texte + ', total ' + total + '.';
        if (total >= 9) { touches.push(qui); t += ' Il te touche.'; } else { t += ' Raté.'; }
        phrases = phrases.concat([t]);
      }
      if (!touches.length) { c.signaler('rate'); continuer(phrases); return; }
      var libelle = touches.length > 1 ? 'Les squelettes lancent leurs dégâts' : (partie.bande ? touches[0] : partie.monstre.Nom) + ' lance ses dégâts';
      etape(phrases, libelle, function () {
        var degats = 0;
        var texte = touches.map(function (qui) {
          var d = de();
          var deg = Math.max(1, d + r.degats - HEROS_G.armure);
          degats += deg;
          return (touches.length > 1 || partie.bande ? qui + ', dégâts : ' : 'Ses dégâts : ') + d + ' plus ' + r.degats + ' moins ' + HEROS_G.armure + ' : ' + deg + '.';
        });
        subir(degats, texte.concat([au(partie.monstre.frappe)]));
      });
    },
    fuiteRatee: function (phrases) { versMonstre(phrases, G.riposte); },
    journal: function (d) { return ' · assauts féroces ' + d.feroces; }
  };
  return G;
}
