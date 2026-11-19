/**
 * Collecte des résultats de la page « Essai des combats ».
 *
 * Ce script reçoit, depuis la page d'essai, une ligne par combat terminé
 * et une ligne par avis envoyé, et les ajoute aux onglets Combats et Avis
 * de la feuille de calcul à laquelle il est rattaché.
 *
 * Installation : voir docs/collecte-resultats.md.
 */

var ONGLET_COMBATS = 'Combats';
var ONGLET_AVIS = 'Avis';

// Ordre des colonnes après « Reçu le », identique aux en-têtes des onglets.
var COLONNES_COMBATS = [
  'testeur', 'seance', 'systeme', 'adversaire', 'seuilChance', 'issue', 'tours', 'vie',
  'relances', 'encaisse', 'arrets', 'trebuche', 'bonnesLectures', 'lectures',
  'chancesLancees', 'chancesReussies', 'fuites'
];
var COLONNES_AVIS = [
  'testeur', 'seance', 'apprecies', 'prefere', 'commentaire', 'combatsA', 'combatsB', 'combatsC'
];

function doPost(e) {
  var verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    var donnees = JSON.parse(e.postData.contents);
    var onglet;
    var colonnes;
    if (donnees.type === 'combat') {
      onglet = ONGLET_COMBATS;
      colonnes = COLONNES_COMBATS;
    } else if (donnees.type === 'avis') {
      onglet = ONGLET_AVIS;
      colonnes = COLONNES_AVIS;
    } else {
      throw new Error('Type de données inconnu');
    }
    var ligne = [new Date()].concat(colonnes.map(function (nom) { return nettoyer(donnees[nom]); }));
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(onglet).appendRow(ligne);
    return repondre({ ok: true });
  } catch (erreur) {
    return repondre({ ok: false, erreur: String(erreur) });
  } finally {
    verrou.releaseLock();
  }
}

// Permet de vérifier, depuis un navigateur, que la collecte est en ligne.
function doGet() {
  return repondre({ ok: true, message: 'Collecte des résultats active' });
}

// Limite la longueur des textes et empêche qu'un texte soit lu comme une formule.
function nettoyer(valeur) {
  if (valeur === undefined || valeur === null) { return ''; }
  if (typeof valeur === 'number') { return isFinite(valeur) ? valeur : ''; }
  var texte = String(valeur).slice(0, 1000);
  if (/^[=+\-@]/.test(texte)) { texte = "'" + texte; }
  return texte;
}

function repondre(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}
