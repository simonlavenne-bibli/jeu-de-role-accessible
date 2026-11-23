/**
 * combat.js (interface) — Affiche le combat que le moteur déroule, et le fait entendre.
 *
 * Le moteur (../moteur/combat.js) décide de tout ; ce module ne fait que traduire
 * ses messages en texte (../contenu/textes.js), boutons, dés qui roulent,
 * illustration et bruitages.
 */
import { creerCombat } from '../moteur/combat.js';
import { ecrire, compteurs, ligneDeJournal, nomDeLAdversaire, etiquetteDeB, NOMS_SYSTEMES, MONSTRES } from '../contenu/textes.js';
import { caseMemorisee, lireRadio } from './reglages.js';
import { preparerAudio, tirerVariante, jouerSigne } from './signes-sonores.js';

var DELAI_SIGNE = 1300; // ms : laisse le lecteur d'écran dire « Écoute » avant le son
// Événements qui ne s'entendent que si personne n'a été blessé à cet écran.
var ISSUES = { parade: true, rate: true };

// montrer(id) : affiche un écran du menu ; collecte : voir collecte.js.
export function installerCombat(montrer, collecte) {
  var ecranCombat = document.getElementById('combat');
  var zoneCompteurs = document.getElementById('compteurs');
  var zoneRecit = document.getElementById('recit');
  var zoneDes = document.getElementById('des');
  var zoneChoix = document.getElementById('choix');
  var titreCombat = document.getElementById('titre-combat');
  var sousTitre = document.getElementById('sous-titre');
  var tapis = document.getElementById('tapis');
  var desEnCours = document.getElementById('des-en-cours');
  var zonePoint = document.getElementById('point');
  var image = document.getElementById('illustration');
  var cadreImage = document.getElementById('cadre-illustration');
  var caseVibrations = caseMemorisee('reglage-vibrations', 'vibrations');
  var caseDes = caseMemorisee('reglage-des', 'des');
  var caseIllustrations = caseMemorisee('reglage-illustrations', 'illustrations');

  var combat = null;          // le combat en cours, créé par le moteur
  var dernierChoix = null;    // { systeme, monstre }, pour rejouer
  var desEnAttente = [];      // dés tirés depuis le dernier choix, à faire rouler
  var sonsEnAttente = [];     // événements signalés depuis le dernier écran
  var dernierInstantane = null;
  var minuteurSigne = null;
  var varianteSigne = null;

  function partie() { return combat ? combat.partie : null; }
  function texte(message) { return ecrire(message, combat.partie); }

  // ---------------------------------------------------------------------
  // CE QUE LE MOTEUR DEMANDE (voir ../moteur/combat.js)
  // ---------------------------------------------------------------------
  var ui = {
    titre: function (message) { titreCombat.textContent = texte(message); },
    raconter: raconter,
    proposer: proposer,
    modifierChoix: function (rang, message) {
      var bouton = zoneChoix.querySelectorAll('button')[rang];
      if (bouton) {
        bouton.textContent = (rang + 1) + '. ' + texte(message);
        bouton.setAttribute('aria-disabled', 'true');
      }
    },
    jet: function (valeur) { desEnAttente.push(valeur); },
    signaler: function (nom, monstre, options) { sonsEnAttente.push([nom, monstre, options]); },
    ambiance: function (allumer) { if (window.Sons) { Sons.ambiance(allumer); } },
    audioDisponible: preparerAudio,
    signe: signe,
    annulerSigne: function () { clearTimeout(minuteurSigne); },
    desAGarder: desAGarder,
    cacherDes: function () { zoneDes.hidden = true; },
    terminer: terminer
  };

  // Écrit le récit de l'écran et place le focus dessus, pour qu'un lecteur d'écran le lise.
  function raconter(messages) {
    zoneRecit.textContent = '';
    zoneChoix.textContent = '';
    messages.forEach(function (message) {
      var p = document.createElement('p');
      p.textContent = texte(message);
      zoneRecit.appendChild(p);
    });
    window.scrollTo(0, 0);
    // Pendant que les dés roulent, le récit reste caché : le focus va sur « Les dés roulent… »,
    // puis sur le récit une fois les dés arrêtés. Les compteurs gardent leurs anciennes valeurs,
    // et les bruitages attendent que les dés s'arrêtent.
    zonePoint.hidden = true;
    var sons = sonsEnAttente;
    sonsEnAttente = [];
    if (!montrerDes(sons)) { zoneRecit.focus(); afficherCompteurs(); bruitages(sons); }
  }

  // choix = [[message ou libellé, fonction], …]
  function proposer(liste) {
    zoneChoix.textContent = '';
    liste.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = (i + 1) + '. ' + (typeof c[0] === 'string' ? c[0] : texte(c[0]));
      b.addEventListener('click', function () { desEnAttente = []; sonsPrets(); c[1](); });
      zoneChoix.appendChild(b);
    });
  }

  // Système B : les dés à garder ou à relancer. basculer(rang) rend le nouvel état du dé.
  function desAGarder(des, basculer) {
    zoneDes.textContent = '';
    zoneDes.hidden = false;
    des.forEach(function (d, i) {
      var b = document.createElement('button');
      b.type = 'button';
      var face = document.createElement('span');
      face.className = 'face';
      face.textContent = d.valeur;
      var etiquette = document.createElement('span');
      etiquette.className = 'sens';
      b.appendChild(face);
      b.appendChild(etiquette);
      function majEtiquette(e) {
        var mots = etiquetteDeB(e);
        etiquette.textContent = mots.sens + ', ' + mots.etat;
        b.setAttribute('aria-label', 'Dé ' + (i + 1) + ' : ' + e.valeur + ', ' + mots.sens + ', ' + mots.etat);
        b.setAttribute('aria-pressed', e.relancer ? 'true' : 'false');
      }
      if (d.bloque) {
        b.disabled = true;
      } else {
        b.addEventListener('click', function () { majEtiquette(basculer(i)); });
      }
      majEtiquette(d);
      zoneDes.appendChild(b);
    });
  }

  // Système C : le monstre annonce son intention. La réécoute rejoue exactement le même son.
  function signe(intention, reecoute) {
    var cle = partie().cleMonstre;
    if (reecoute) { jouerSigne(cle, intention, varianteSigne); return; }
    var variante = tirerVariante();
    varianteSigne = variante;
    clearTimeout(minuteurSigne);
    minuteurSigne = setTimeout(function () { jouerSigne(cle, intention, variante); }, DELAI_SIGNE);
  }

  function terminer(donnees) {
    var heure = new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' });
    var p = combat.partie;
    collecte.enregistrerCombat(Object.assign({}, donnees, { adversaire: nomDeLAdversaire(p) }), heure + ' · ' + ligneDeJournal(p));
    proposer([
      ['Rejouer le même combat', function () { commencer(dernierChoix.systeme, dernierChoix.monstre); }],
      ['Changer de combat', function () { quitterCombat('choix-systeme'); }],
      ['Menu principal', function () { quitterCombat('menu'); }]
    ]);
  }

  // ---------------------------------------------------------------------
  // DÉBUT ET FIN
  // ---------------------------------------------------------------------
  // Graine facultative dans l'adresse (…/combats.html?graine=12) : le combat se rejoue à l'identique.
  function graineDeLAdresse() {
    var g = parseInt(new URLSearchParams(window.location.search).get('graine'), 10);
    return isNaN(g) ? undefined : g;
  }

  function commencer(systeme, monstre) {
    dernierChoix = { systeme: systeme, monstre: monstre };
    desEnAttente = [];
    sonsEnAttente = [];
    dernierInstantane = null;
    combat = creerCombat({
      systeme: systeme,
      monstre: monstre,
      seuilChance: parseInt(lireRadio('seuil-chance'), 10),
      graine: graineDeLAdresse(),
      ui: ui
    });
    zoneDes.hidden = true;
    sousTitre.textContent = 'Système ' + NOMS_SYSTEMES[systeme] + ' · contre ' + MONSTRES[monstre].nom;
    montrer('combat');
    combat.demarrer();
  }

  function quitterCombat(ecran) {
    ui.ambiance(false);
    combat = null;
    montrer(ecran);
  }

  // ---------------------------------------------------------------------
  // DÉS EN 3D (module des3d.js)
  // ---------------------------------------------------------------------
  // S'il y a eu des jets depuis le dernier choix, ils roulent d'abord ;
  // le récit et les boutons n'apparaissent qu'une fois les dés arrêtés.
  function montrerDes(sons) {
    var valeurs = desEnAttente;
    var p = partie();
    desEnAttente = [];
    if (!valeurs.length || !caseDes.checked || !window.Des3D || !p || !p.enCombat) { tapis.hidden = true; return false; }
    tapis.hidden = false;
    ecranCombat.classList.add('roule');
    desEnCours.hidden = false;
    desEnCours.focus();
    Des3D.lancer(tapis, valeurs).then(function () {
      ecranCombat.classList.remove('roule');
      desEnCours.hidden = true;
      afficherCompteurs();
      bruitages(sons);
      zoneRecit.focus();
    });
    return true;
  }

  // ---------------------------------------------------------------------
  // COMPTEURS ET ILLUSTRATION
  // ---------------------------------------------------------------------
  // Le monstre en haut à gauche, le héros en haut à droite. Seulement des valeurs.
  function afficherCompteurs() {
    var p = partie();
    sousTitre.hidden = !!(p && p.tours > 0);
    afficherIllustration();
    if (!p || !p.enCombat) { zoneCompteurs.hidden = true; return; }
    var c = compteurs(p);
    document.getElementById('nom-monstre').textContent = c.monstre;
    document.getElementById('vie-monstre').textContent = c.valeurMonstre;
    document.getElementById('vie-heros').textContent = c.valeurHeros;
    document.getElementById('extra-heros').textContent = c.extra.join(' · ');
    zoneCompteurs.classList.toggle('mots', c.mots);
    zoneCompteurs.hidden = false;
  }

  // En grand sur l'écran « Ton adversaire », en bandeau pendant le combat, absente pendant les règles.
  function afficherIllustration() {
    var p = partie();
    if (!p || !p.enCombat || !caseIllustrations.checked) { cadreImage.hidden = true; return; }
    var source = 'images/' + p.cleMonstre + '.jpg';
    if (image.getAttribute('src') !== source) { image.setAttribute('src', source); }
    image.classList.toggle('bandeau', p.tours > 0);
    cadreImage.hidden = false;
  }

  // ---------------------------------------------------------------------
  // BRUITAGES (module sons.js)
  // ---------------------------------------------------------------------
  function sonsPrets() { if (window.Sons) { Sons.preparer(); } }

  // Ce que l'on compare d'un écran à l'autre pour savoir qui a été blessé.
  function instantane(p) {
    return { monstre: p.vieMonstre, heros: p.vie, etatMonstre: p.niveauMonstre || 0, etatHeros: p.niveauHeros || 0 };
  }

  // 0 : monstre en pleine forme ; 1 : presque mort.
  function fureurDuMonstre(p) {
    if (p.systeme === 'F') { return (p.niveauMonstre || 0) / 3; }
    var depart = p.bande || p.regles.vie || p.vieMonstre || 1;
    return Math.max(0, Math.min(1, 1 - Math.max(0, p.vieMonstre) / depart));
  }

  function jouer(son) {
    if (son[0] === 'mort-heros') {
      // Le cri de victoire du monstre, puis le glas.
      Sons.jouer('victoire-monstre');
      Sons.jouer('mort', null, { delai: Sons.duree('victoire-monstre') - 0.5 });
      return;
    }
    Sons.jouer(son[0], son[1], son[2]);
  }

  // Vibrations (téléphones qui le permettent) : un motif par événement, en millisecondes.
  var VIBRATIONS = { victoire: [80, 60, 80], 'mort-heros': [500], 'chance-reussie': [30, 40, 30], fuite: [60] };
  function vibrer(motif) {
    if (motif && caseVibrations.checked && navigator.vibrate) { try { navigator.vibrate(motif); } catch (e) { /* refusé */ } }
  }

  // Vibrations de l'écran qui vient d'apparaître : coup reçu, coup porté, fin du combat.
  function vibrations(sons, avant, apres) {
    var evenement = sons.filter(function (s) { return VIBRATIONS[s[0]]; })[0];
    if (evenement) { vibrer(VIBRATIONS[evenement[0]]); return; }
    if (!avant) { return; }
    if (apres.heros < avant.heros || apres.etatHeros > avant.etatHeros) { vibrer([200]); return; }
    if (apres.monstre < avant.monstre || apres.etatMonstre > avant.etatMonstre) { vibrer([40]); }
  }

  // Joue les bruitages (et les vibrations) de l'écran qui vient d'apparaître.
  function bruitages(sons) {
    var p = partie();
    if (p) { vibrations(sons, dernierInstantane, instantane(p)); }
    if (!p || !window.Sons) { return; }
    var avant = dernierInstantane;
    var apres = instantane(p);
    dernierInstantane = apres;
    var evenements = sons.filter(function (s) { return !ISSUES[s[0]]; });
    if (evenements.length) { evenements.forEach(jouer); return; }
    if (!avant || !p.enCombat) { return; }
    var monstreBlesse = apres.monstre < avant.monstre || apres.etatMonstre > avant.etatMonstre;
    var herosBlesse = apres.heros < avant.heros || apres.etatHeros > avant.etatHeros;
    var monstreMort = p.vieMonstre <= 0 || (p.niveauMonstre || 0) >= 4;
    if (monstreBlesse) {
      Sons.jouer(monstreMort ? 'mort' : 'douleur', p.cleMonstre);
      // Touché mais debout : il enrage, d'autant plus qu'il lui reste peu de vie.
      // (Il commence quand le cri de douleur se termine.)
      if (!monstreMort) { Sons.jouer('rage', p.cleMonstre, { delai: Sons.duree('douleur', p.cleMonstre) - 0.1, fureur: fureurDuMonstre(p) }); }
    }
    if (herosBlesse) { Sons.jouer('touche-heros'); }
    if (monstreBlesse || herosBlesse) { return; }
    // Personne n'est blessé : coup paré, ou coup dans le vide, tel que le moteur l'a signalé.
    sons.forEach(function (s) { Sons.jouer(s[0]); });
  }

  // ---------------------------------------------------------------------
  // RÉPÉTER ET FAIRE LE POINT (cahier des charges, §3 : le joueur garde la main)
  // ---------------------------------------------------------------------
  // Répéter : le focus quitte le récit puis y revient, pour que le lecteur d'écran le relise.
  function repeter() {
    if (!combat || ecranCombat.classList.contains('roule')) { return; }
    zonePoint.hidden = true;
    document.getElementById('repeter').focus();
    setTimeout(function () { zoneRecit.focus(); }, 50);
  }

  // Où j'en suis : la vie, les dés de chance, et les choix possibles en ce moment.
  function faireLePoint() {
    if (!combat || ecranCombat.classList.contains('roule')) { return; }
    var phrases = combat.faireLePoint().map(texte);
    var choix = Array.prototype.map.call(zoneChoix.querySelectorAll('button'), function (b) { return b.textContent; });
    if (choix.length) { phrases.push('Tes choix : ' + choix.join(', ') + '.'); }
    zonePoint.textContent = phrases.join(' ');
    zonePoint.hidden = false;
    zonePoint.focus();
  }

  document.getElementById('repeter').addEventListener('click', repeter);
  document.getElementById('faire-le-point').addEventListener('click', faireLePoint);

  // ---------------------------------------------------------------------
  // CLAVIER : les chiffres choisissent, R répète, P fait le point.
  // ---------------------------------------------------------------------
  document.addEventListener('keydown', function (e) {
    if (ecranCombat.hidden || ecranCombat.classList.contains('roule')) { return; }
    if (e.ctrlKey || e.metaKey || e.altKey) { return; }
    var touche = e.key.toLowerCase();
    if (touche === 'r') { e.preventDefault(); repeter(); return; }
    if (touche === 'p') { e.preventDefault(); faireLePoint(); return; }
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) {
      var boutons = zoneChoix.querySelectorAll('button');
      if (boutons[n - 1]) { e.preventDefault(); boutons[n - 1].click(); }
    }
  });

  // Revenir au combat en cours (par exemple après les réglages) : le récit est relu.
  function reprendre() {
    if (!combat) { return false; }
    montrer('combat');
    zoneRecit.focus();
    return true;
  }

  return { commencer: commencer, reprendre: reprendre };
}
