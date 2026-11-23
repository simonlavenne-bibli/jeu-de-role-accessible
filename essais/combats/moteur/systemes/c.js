/**
 * Système C : écouter le monstre.
 * Avant chaque assaut, le monstre annonce son intention par un son ;
 * la bonne posture ajoute 3 au total du héros.
 * Le moteur choisit l'intention ; l'interface fabrique et joue le son.
 */
import { HEROS } from '../donnees.js';
import { pv } from '../texte.js';

var POSTURE_JUSTE = { bondir: 'esquiver', proteger: 'attaquer', tourner: 'parer' };
var INTENTIONS = { bondir: 'Il voulait bondir.', proteger: 'Il voulait se protéger.', tourner: 'Il cherchait une ouverture.' };

export default function systemeC(c) {
  var partie = c.partie;
  var de = c.de, au = c.au;

  var C = {
    nom: 'C, écouter le monstre',
    init: function () {},
    regles: function () {
      var r = partie.regles;
      var annonce = partie.indice === 'sonore'
        ? ['Règles. Avant chaque assaut, ' + partie.monstre.nom + ' fait un bruit qui annonce son intention. Un son qui monte : il va bondir sur toi. Deux sons graves et étouffés : il se protège. Trois sons qui passent d\'une oreille à l\'autre : il tourne autour de toi pour chercher une ouverture.',
           'Chaque monstre a sa propre voix, et ses bruits changent un peu d\'un assaut à l\'autre. Tu peux réécouter une fois par assaut. Après l\'assaut, tu sauras ce qu\'il voulait faire.']
        : ['Règles. Avant chaque assaut, ' + partie.monstre.nom + ' fait un geste qui annonce son intention : bondir sur toi, se protéger, ou tourner autour de toi pour chercher une ouverture. À toi de deviner laquelle.'];
      return annonce.concat([
        'Tu choisis alors ta posture. Esquiver contre un bond, attaquer quand il se protège, parer quand il cherche une ouverture : la bonne posture ajoute 3 à ton total.',
        'Puis chacun lance deux dés et ajoute son habileté : 7 pour toi, ' + r.habilete + ' pour ' + partie.monstre.nom + '. Le plus haut total touche.',
        'Tes coups retirent 2 points de vie, 3 si tu as choisi d\'attaquer. Ses coups retirent ' + pv(r.degats) + ', le double s\'il bondit et que tu n\'esquives pas, 1 de moins si tu pares. Quand il se protège, il ne frappe pas.'
      ]);
    },
    tour: function () {
      var intentions = ['bondir', 'proteger', 'tourner'];
      var intention = intentions[Math.floor(c.hasard() * 3)];
      var choix = [
        ['Attaquer', function () { C.assaut(intention, 'attaquer'); }],
        ['Esquiver', function () { C.assaut(intention, 'esquiver'); }],
        ['Parer', function () { C.assaut(intention, 'parer'); }],
        ['Fuir', c.fuir]
      ];
      if (partie.indice !== 'sonore') {
        c.raconter([au(partie.monstre.signes[intention])]);
        c.proposer(choix);
        return;
      }
      // Indice sonore : l'interface rejoue le même son pour la réécoute.
      var reecoute = false;
      c.raconter(['Écoute ' + partie.monstre.nom + '…']);
      choix.push(['Réécouter', function () {
        if (reecoute) { return; }
        reecoute = true;
        partie.decisions.reecoutes += 1;
        c.ui.modifierChoix(4, 'Réécouter : déjà utilisé');
        c.ui.signe(intention, true);
      }]);
      c.proposer(choix);
      c.ui.signe(intention, false);
    },
    assaut: function (intention, posture) {
      c.ui.annulerSigne();
      var juste = POSTURE_JUSTE[intention] === posture;
      partie.decisions.lectures += 1;
      if (juste) { partie.decisions.bonnesLectures += 1; }
      var dh = [de(), de()];
      var bonus = juste ? 3 : 0;
      var th = dh[0] + dh[1] + HEROS.habilete + bonus;
      c.versMonstre([
        INTENTIONS[intention] + (juste ? ' Bonne lecture : plus 3.' : ' Mauvaise lecture.'),
        'Tu lances ' + dh[0] + ' et ' + dh[1] + '. Total : ' + th + '.'
      ], function () { C.comparer(intention, posture, th); });
    },
    comparer: function (intention, posture, th) {
      var r = partie.regles;
      var dm = [de(), de()];
      var tm = dm[0] + dm[1] + r.habilete;
      var phrases = [
        partie.monstre.Nom + ' lance ' + dm[0] + ' et ' + dm[1] + '. Total : ' + tm + ', contre ton ' + th + '.'
      ];
      if (th > tm) {
        var inflige = 2 + (posture === 'attaquer' ? 1 : 0);
        partie.vieMonstre -= inflige;
        phrases.push(au(partie.monstre.touche) + ' ' + partie.monstre.Nom + ' perd ' + pv(inflige) + '.');
        if (partie.vieMonstre <= 0) { c.vaincre(phrases); return; }
        c.finAssaut(phrases);
        return;
      }
      if (th === tm) {
        c.finAssaut(phrases.concat(['Égalité. Personne n\'est touché.']));
        return;
      }
      if (intention === 'proteger') {
        c.signaler('parade');
        c.finAssaut(phrases.concat(['Tu ne passes pas sa garde, mais il ne riposte pas.']));
        return;
      }
      var degats = r.degats;
      var precision = '';
      if (intention === 'bondir' && posture !== 'esquiver') { degats *= 2; precision = ' Son bond double les dégâts.'; }
      if (posture === 'parer') { degats -= 1; precision += ' Ta parade en retire 1.'; }
      if (degats <= 0) {
        c.signaler('parade');
        c.finAssaut(phrases.concat(['Ta parade bloque tout le coup.']));
        return;
      }
      c.subir(degats, phrases.concat([au(partie.monstre.frappe) + precision]));
    },
    fuiteRatee: function (phrases) {
      c.versMonstre(phrases, function () {
        c.subir(partie.regles.degats, [partie.monstre.Nom + ' frappe sans riposte. ' + au(partie.monstre.frappe)]);
      });
    },
    journal: function (d) {
      return ' · indice ' + partie.indice + ' · bonnes lectures ' + d.bonnesLectures + '/' + d.lectures +
        (partie.indice === 'sonore' ? ' · réécoutes ' + d.reecoutes : '');
    }
  };
  return C;
}
