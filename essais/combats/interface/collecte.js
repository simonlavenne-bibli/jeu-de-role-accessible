/**
 * collecte.js — Envoi des résultats à la feuille Google, bilan de la séance et journal des combats.
 */
import { pluriel } from '../contenu/textes.js';
import { lireRadio } from './reglages.js';

// Adresse de l'application Google Apps Script qui reçoit les résultats.
// Vide : rien n'est envoyé, la page fonctionne quand même.
var ADRESSE_COLLECTE = 'https://script.google.com/macros/s/AKfycbx_CFACJU8mEMSn4EN4Av9NlxnyiaAG6_RHD_8398IT-qRFKaCvu7gu0v-XdRjCMIzsNA/exec';

var SYSTEMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

export function installerCollecte() {
  var zoneJournal = document.getElementById('journal');
  var zoneBilan = document.getElementById('bilan');
  var champTesteur = document.getElementById('testeur');
  var seance = '';
  try {
    seance = localStorage.getItem('seance-essai') || '';
    champTesteur.value = localStorage.getItem('testeur-essai') || '';
  } catch (e) {}
  if (!seance) {
    seance = 'S-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    try { localStorage.setItem('seance-essai', seance); } catch (e) {}
  }
  champTesteur.addEventListener('change', function () {
    try { localStorage.setItem('testeur-essai', champTesteur.value.trim()); } catch (e) {}
  });

  if (!ADRESSE_COLLECTE) {
    document.getElementById('mention-collecte').textContent =
      'Version de démonstration : les résultats restent sur cet appareil, rien n\'est envoyé.';
  }

  // Envoi sans attendre de réponse : une page sur un autre site ne peut pas la lire.
  function transmettre(donnees) {
    if (!ADRESSE_COLLECTE) { return Promise.resolve(false); }
    donnees.testeur = champTesteur.value.trim();
    donnees.seance = seance;
    return fetch(ADRESSE_COLLECTE, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(donnees)
    }).then(function () { return true; }, function () { return false; });
  }

  function combatsJoues() {
    var morceaux = [];
    Object.keys(bilan).forEach(function (s) {
      var b = bilan[s];
      var total = b.victoire + b.mort + b.fuite;
      if (total) { morceaux.push(s + ' : ' + total); }
    });
    return morceaux.join(', ');
  }

  document.getElementById('envoyer-avis').addEventListener('click', function () {
    var info = document.getElementById('info-avis');
    var apprecies = Array.prototype.slice.call(document.querySelectorAll('input[name="apprecie"]:checked'))
      .map(function (c) { return c.value; });
    var prefere = lireRadio('prefere');
    var commentaire = document.getElementById('commentaire').value.trim();
    if (!apprecies.length && prefere === 'aucun' && !commentaire) {
      info.textContent = 'Coche au moins un système ou écris un commentaire avant d\'envoyer.';
      return;
    }
    if (!ADRESSE_COLLECTE) {
      info.textContent = 'L\'envoi n\'est pas encore activé sur cette version de la page.';
      return;
    }
    info.textContent = 'Envoi en cours…';
    transmettre({
      type: 'avis',
      apprecies: apprecies.join(', '),
      prefere: prefere === 'aucun' ? '' : prefere,
      commentaire: commentaire,
      combats: combatsJoues()
    }).then(function (ok) {
      info.textContent = ok ? 'Merci, ton avis est envoyé.' : 'L\'envoi a échoué. Vérifie ta connexion et réessaie.';
    });
  });

  // =====================================================================
  // BILAN DE LA SÉANCE ET JOURNAL
  // =====================================================================
  var bilan = {};
  SYSTEMES.forEach(function (s) { bilan[s] = { victoire: 0, mort: 0, fuite: 0 }; });

  // Un combat terminé : donnees vient du moteur, ligne est la ligne du journal.
  function enregistrerCombat(donnees, ligne) {
    bilan[donnees.systeme][donnees.issue] += 1;
    zoneJournal.value = (zoneJournal.value ? zoneJournal.value + '\n' : '') + ligne;
    transmettre(Object.assign({}, donnees, { detail: ligne }));
    sauverJournal();
    afficherBilan();
  }

  function afficherBilan() {
    var morceaux = [];
    SYSTEMES.forEach(function (s) {
      var b = bilan[s];
      var total = b.victoire + b.mort + b.fuite;
      if (total) {
        morceaux.push('Système ' + s + ' : ' + pluriel(total, 'combat', 'combats') + ', ' +
          pluriel(b.victoire, 'victoire', 'victoires') + ', ' + pluriel(b.mort, 'mort', 'morts') + ', ' +
          pluriel(b.fuite, 'fuite', 'fuites') + '.');
      }
    });
    zoneBilan.textContent = morceaux.length ? morceaux.join(' ') : 'Aucun combat joué pour l\'instant.';
  }

  function sauverJournal() {
    try { localStorage.setItem('journal-combats', zoneJournal.value); } catch (e) {}
  }

  try { zoneJournal.value = localStorage.getItem('journal-combats') || ''; } catch (e) {}

  document.getElementById('copier').addEventListener('click', function () {
    var info = document.getElementById('info-copie');
    var texte = zoneJournal.value;
    if (!texte) { info.textContent = 'Le journal est vide.'; return; }
    function repli() {
      zoneJournal.focus();
      zoneJournal.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      info.textContent = ok ? 'Journal copié.' : 'Le journal est sélectionné : copie-le avec le menu de ton appareil.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(function () { info.textContent = 'Journal copié.'; }, repli);
    } else {
      repli();
    }
  });

  document.getElementById('effacer').addEventListener('click', function () {
    zoneJournal.value = '';
    sauverJournal();
    document.getElementById('info-copie').textContent = 'Journal effacé.';
  });

  return { afficherBilan: afficherBilan, enregistrerCombat: enregistrerCombat };
}
