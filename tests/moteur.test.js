/**
 * Tests du moteur de combat, sans navigateur : « npm test » ou « node --test tests/ ».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { jouer, LISTE_SYSTEMES, LISTE_MONSTRES } from './robot.js';
import { creerHasard } from '../essais/combats/moteur/hasard.js';
import { MONSTRES } from '../essais/combats/contenu/textes.js';

var PARTIES = 150;

test('chaque combat se termine, dans les 7 systèmes et contre les 3 adversaires', function () {
  LISTE_SYSTEMES.forEach(function (systeme) {
    LISTE_MONSTRES.forEach(function (monstre) {
      ['premier', 'hasard'].forEach(function (choisir) {
        for (var graine = 1; graine <= PARTIES; graine += 1) {
          var r = jouer({ systeme: systeme, monstre: monstre, graine: graine, choisir: choisir });
          var d = r.resultat;
          var cas = systeme + ' contre ' + monstre + ', graine ' + graine + ', robot ' + choisir;
          assert.ok(['victoire', 'mort', 'fuite'].includes(d.issue), cas);
          assert.equal(d.systeme, systeme, cas);
          assert.ok(r.ligne.startsWith('Système ' + systeme + ' · '), cas);
          assert.ok(r.partie.vie <= r.partie.vieMax, cas);
          assert.ok(r.partie.chances >= 0, cas);
          if (d.issue === 'victoire') { assert.ok(r.partie.vieMonstre <= 0 || r.partie.niveauMonstre >= 4, cas); }
          if (d.issue === 'mort') { assert.equal(r.partie.vie, 0, cas); }
          r.ecrans.forEach(function (e) {
            e.phrases.forEach(function (p) { assert.ok(!/undefined|NaN|null/.test(p), cas + ' : ' + p); });
          });
        }
      });
    });
  });
});

test('avec la même graine, le combat se rejoue à l\'identique', function () {
  LISTE_SYSTEMES.forEach(function (systeme) {
    var a = jouer({ systeme: systeme, monstre: 'loup-garou', graine: 42, choisir: 'hasard' });
    var b = jouer({ systeme: systeme, monstre: 'loup-garou', graine: 42, choisir: 'hasard' });
    assert.deepEqual(a.partie.trace, b.partie.trace, systeme);
    var c = jouer({ systeme: systeme, monstre: 'loup-garou', graine: 43, choisir: 'hasard' });
    assert.notDeepEqual(a.partie.trace, c.partie.trace, systeme);
  });
});

test('le hasard avec graine reste entre 0 et 1', function () {
  var h = creerHasard(5);
  for (var i = 0; i < 10000; i += 1) { var x = h(); assert.ok(x >= 0 && x < 1); }
});

// Avant le découpage, la page devinait « coup paré » et « coup dans le vide »
// en cherchant des mots dans le récit. Le moteur le signale maintenant lui-même :
// on vérifie qu'il le fait partout où l'ancienne recherche l'aurait trouvé.
test('les événements « parade » et « rate » remplacent la recherche de mots dans le récit', function () {
  var PARADE = /tu pares|pare\.|bloquent tout|bloque tout|il arrête le coup|ne passes pas sa garde/i;
  var RATE = /raté|te manque|aucun de tes coups|se croisent|ne l'entame|sans broncher/i;
  var AUTRES = { apparition: 1, victoire: 1, 'mort-heros': 1, fuite: 1, 'chance-reussie': 1, 'chance-ratee': 1 };
  var verifies = { parade: 0, rate: 0 };
  LISTE_SYSTEMES.forEach(function (systeme) {
    LISTE_MONSTRES.forEach(function (monstre) {
      for (var graine = 1; graine <= 60; graine += 1) {
        var r = jouer({ systeme: systeme, monstre: monstre, graine: graine, choisir: 'hasard' });
        var avant = null;
        r.ecrans.forEach(function (e) {
          var apres = e.etat;
          var texte = e.phrases.join(' ');
          var blesse = avant && (apres.monstre < avant.monstre || apres.etatMonstre > avant.etatMonstre ||
            apres.heros < avant.heros || apres.etatHeros > avant.etatHeros);
          avant = apres;
          if (!e.enCombat || blesse || e.sons.some(function (s) { return AUTRES[s]; })) { return; }
          if (/te touche|tu touches\./i.test(texte)) { return; }
          var attendu = PARADE.test(texte) ? 'parade' : RATE.test(texte) ? 'rate' : null;
          if (!attendu || !e.des.length) { return; }
          assert.ok(e.sons.includes(attendu), systeme + ' contre ' + monstre + ' : « ' + texte + ' » devrait signaler ' + attendu);
          verifies[attendu] += 1;
        });
      }
    });
  });
  assert.ok(verifies.parade > 50 && verifies.rate > 50, JSON.stringify(verifies));
});

test('système C sans son : l\'intention du monstre est décrite par un geste', function () {
  var r = jouer({ systeme: 'C', monstre: 'demon', graine: 2, audio: false });
  assert.equal(r.partie.indice, 'texte');
  var gestes = [].concat(MONSTRES.demon.signes.bondir, MONSTRES.demon.signes.proteger, MONSTRES.demon.signes.tourner);
  assert.ok(r.ecrans.some(function (e) { return gestes.includes(e.phrases[0]); }));
});

test('le moteur ne touche jamais à la page ni au son, et ne contient aucun texte', function () {
  var dossiers = ['essais/combats/moteur/', 'essais/combats/moteur/systemes/'];
  dossiers.forEach(function (dossier) {
    readdirSync(dossier).filter(function (f) { return f.endsWith('.js'); }).forEach(function (f) {
      var code = readFileSync(dossier + f, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      assert.ok(!/\b(document|window|localStorage|AudioContext|Sons|Des3D|Musique)\b/.test(code), dossier + f);
      // Aucun texte français non plus : seulement des messages nommés (voir contenu/textes.js).
      var phrase = code.match(/'[^'\n]*[a-zéèàù]{2,} [a-zéèàù]{2,}[^'\n]*'/i);
      assert.ok(!phrase || /Combat inconnu/.test(phrase[0]), dossier + f + ' contient un texte : ' + (phrase && phrase[0]));
    });
  });
});
