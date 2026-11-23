/**
 * diagnostic.js — Panneau de diagnostic (cahier des charges, §10).
 *
 * Pour tester sur appareil réel sans outils de développement : la version de la page,
 * le navigateur, l'état du son, du hors ligne et du stockage, les réglages,
 * et les erreurs notées depuis le chargement (voir le <head> de combats.html).
 */
export var VERSION = '23 novembre 2026';

function oui(v) { return v ? 'oui' : 'non'; }

function stockageDisponible() {
  try { localStorage.setItem('essai-stockage', '1'); localStorage.removeItem('essai-stockage'); return true; } catch (e) { return false; }
}

function lire(cle) { try { return localStorage.getItem(cle); } catch (e) { return null; } }

export function texteDuDiagnostic() {
  var racine = document.documentElement;
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lignes = [
    'Page : Essai des combats, version du ' + VERSION,
    'Adresse : ' + location.href,
    'Navigateur : ' + navigator.userAgent,
    'Écran : ' + screen.width + ' × ' + screen.height + ', fenêtre ' + window.innerWidth + ' × ' + window.innerHeight,
    'Installée sur l\'écran d\'accueil : ' + oui(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || navigator.standalone),
    'Hors ligne prêt : ' + oui(navigator.serviceWorker && navigator.serviceWorker.controller),
    'En ligne : ' + oui(navigator.onLine),
    'Stockage sur l\'appareil : ' + oui(stockageDisponible()),
    'Son : ' + (window.Mixeur ? Mixeur.etat() : 'module absent') +
      (window.Mixeur ? ' · volumes ' + Mixeur.COUCHES.map(function (c) { return c + ' ' + Math.round(Mixeur.lireVolume(c) * 100) + ' %'; }).join(', ') : ''),
    'Modules : sons ' + oui(window.Sons) + ', musique ' + oui(window.Musique) + ', dés ' + oui(window.Des3D),
    'Vibrations possibles : ' + oui(navigator.vibrate),
    'Animations réduites demandées : ' + oui(reduit),
    'Réglages : couleurs ' + racine.getAttribute('data-couleurs') + ', texte ' + racine.getAttribute('data-taille') + ' %' +
      ', bruitages ' + (lire('sons') || 'oui') + ', dés animés ' + (lire('des') || 'oui') + ', illustrations ' + (lire('illustrations') || 'oui') +
      ', musique ' + (lire('musique') || 'oui') + ', vibrations ' + (lire('vibrations') || 'oui'),
    'Séance : ' + (lire('seance-essai') || '—'),
    'Erreurs depuis le chargement : ' + (window.__erreurs && window.__erreurs.length ? '' : 'aucune')
  ];
  return lignes.concat((window.__erreurs || []).slice(-20).map(function (e) { return '  ' + e; })).join('\n');
}

// Appelé à chaque ouverture de l'écran Diagnostic.
export function afficherDiagnostic() {
  document.getElementById('texte-diagnostic').value = texteDuDiagnostic();
  document.getElementById('info-diagnostic').textContent = '';
}

export function installerDiagnostic() {
  var zone = document.getElementById('texte-diagnostic');
  var info = document.getElementById('info-diagnostic');
  document.getElementById('copier-diagnostic').addEventListener('click', function () {
    function repli() {
      zone.focus();
      zone.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* refusé */ }
      info.textContent = ok ? 'Diagnostic copié.' : 'Le texte est sélectionné : copie-le avec le menu de ton appareil.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(zone.value).then(function () { info.textContent = 'Diagnostic copié.'; }, repli);
    } else {
      repli();
    }
  });
  document.getElementById('son-diagnostic').addEventListener('click', function () {
    if (!window.Sons || !Sons.preparer()) { info.textContent = 'Ce navigateur ne peut pas jouer de son.'; return; }
    Sons.activer(true);
    Sons.jouer('victoire');
    Sons.activer(document.getElementById('reglage-sons').checked);
    // L'état du son change après l'appui : on met le texte à jour.
    setTimeout(function () { zone.value = texteDuDiagnostic(); info.textContent = 'Son joué. Sur iPhone, coupe le mode silencieux si tu n\'entends rien.'; }, 300);
  });
}
