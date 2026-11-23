/**
 * Système G : 2 dés contre 9 (inspiré de Barbarians of Lemuria).
 * Contre le squelette : une bande de squelettes à 1 point de vie.
 */
import { HEROS_G } from '../donnees.js';

export default function systemeG(c) {
  var partie = c.partie;
  var de = c.de, msg = c.msg, tirage = c.tirage;

  // Deux dés, ou trois dont on garde les deux meilleurs avec l'avantage.
  function jetG(avantage) {
    var t = c.lancer(avantage ? 3 : 2);
    var gardes = t.slice().sort(function (a, b) { return b - a; }).slice(0, 2);
    return { des: t, gardes: gardes, avantage: !!avantage, somme: gardes[0] + gardes[1] };
  }

  var G = {
    init: function () {
      partie.vie = partie.vieMax = HEROS_G.vie;
      partie.bande = partie.regles.bande || 0;
      if (partie.bande) { partie.vieMonstre = partie.bande; }
      partie.avantageMonstre = false;
    },
    regles: function () { return ['G.regle-1', 'G.regle-2', 'G.regle-3', 'G.regle-4']; },
    tour: function () {
      c.raconter([msg('que-fais-tu')]);
      c.proposer([
        [msg('choix-attaquer'), function () { G.attaque(false); }],
        [msg('choix-G-feroce'), function () { G.attaque(true); }],
        [msg('choix-fuir'), c.fuir]
      ]);
    },
    attaque: function (feroce) {
      var r = partie.regles;
      var j = jetG(feroce);
      var total = j.somme + HEROS_G.bonus - r.defense;
      if (feroce) { partie.decisions.feroces += 1; partie.avantageMonstre = true; }
      var messages = [msg('G.jet', { feroce: !!feroce, jet: j, defense: r.defense, total: total })];
      if (total < 9) {
        c.signaler('rate');
        c.versMonstre(messages.concat([msg('G.rate')]), G.riposte);
        return;
      }
      if (partie.bande) {
        // Contre la bande, une touche abat un squelette : pas de jet de dégâts.
        var abattus = Math.min(partie.vieMonstre, total >= 12 ? 2 : 1);
        partie.vieMonstre -= abattus;
        messages.push(abattus === 2 ? msg('G.heroique') : msg('G.squelette-abattu', { tirage: tirage() }));
        if (partie.vieMonstre <= 0) { c.vaincre(messages); return; }
        c.versMonstre(messages, G.riposte);
        return;
      }
      c.etape(messages.concat([msg('tu-touches')]), 'choix-degats', function () {
        var d = de();
        var deg = Math.max(1, d + 1 - r.armure);
        partie.vieMonstre -= deg;
        var texte = [msg('G.degats-heros', { de: d, armure: r.armure, tirage: tirage(), degats: deg })];
        if (partie.vieMonstre <= 0) { c.vaincre(texte); return; }
        c.versMonstre(texte, G.riposte);
      });
    },
    // Ses attaques, puis, s'il touche, ses dégâts dans une seconde étape.
    riposte: function (messages) {
      var r = partie.regles;
      var avantage = partie.avantageMonstre;
      partie.avantageMonstre = false;
      var nb = partie.bande ? partie.vieMonstre : 1;
      var touches = [];   // numéros des squelettes qui touchent (1 contre un seul adversaire)
      for (var i = 0; i < nb; i += 1) {
        var j = jetG(avantage);
        var total = j.somme + r.attaque - HEROS_G.defense;
        if (total >= 9) { touches.push(i + 1); }
        messages = messages.concat([msg('G.attaque-monstre', { numero: i + 1, jet: j, total: total, touche: total >= 9 })]);
      }
      if (!touches.length) { c.signaler('rate'); c.continuer(messages); return; }
      c.raconter(messages);
      c.proposer([[msg('choix-G-degats', { numeros: touches }), function () {
        var degats = 0;
        var texte = touches.map(function (numero) {
          var d = de();
          var deg = Math.max(1, d + r.degats - HEROS_G.armure);
          degats += deg;
          return msg('G.degats-monstre', { numero: numero, plusieurs: touches.length > 1, de: d, degats: deg });
        });
        c.subir(degats, texte.concat([msg('monstre-frappe', { tirage: tirage() })]));
      }]]);
    },
    fuiteRatee: function (messages) { c.versMonstre(messages, G.riposte); }
  };
  return G;
}
