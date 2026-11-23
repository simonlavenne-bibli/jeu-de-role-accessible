/**
 * reglages.js — Les cases à cocher mémorisées sur l'appareil, et les bruitages.
 */

// Une case à cocher dont l'état est gardé sur l'appareil (« oui » ou « non »).
// auChangement(coche) est appelé quand le joueur la modifie.
export function caseMemorisee(id, cle, auChangement) {
  var c = document.getElementById(id);
  try { if (localStorage.getItem(cle) === 'non') { c.checked = false; } } catch (e) { /* stockage indisponible */ }
  c.addEventListener('change', function () {
    try { localStorage.setItem(cle, c.checked ? 'oui' : 'non'); } catch (e) { /* stockage indisponible */ }
    if (auChangement) { auChangement(c.checked); }
  });
  return c;
}

export function lireRadio(nom) {
  var choisi = document.querySelector('input[name="' + nom + '"]:checked');
  return choisi ? choisi.value : null;
}

// Les curseurs de volume, une couche de son chacun (essais/audio.js).
function installerVolumes() {
  document.querySelectorAll('input[data-couche]').forEach(function (curseur) {
    var couche = curseur.getAttribute('data-couche');
    function dire() { curseur.setAttribute('aria-valuetext', curseur.value + ' %'); }
    curseur.value = String(Math.round((window.Mixeur ? Mixeur.lireVolume(couche) : 1) * 100));
    dire();
    curseur.addEventListener('input', function () {
      dire();
      if (window.Mixeur) { Mixeur.volume(couche, parseInt(curseur.value, 10) / 100); }
    });
  });
}

// Réglage « Bruitages et ambiance », volumes, et écran « Écouter les bruitages » (module sons.js).
export function installerBruitages() {
  installerVolumes();
  var caseSons = caseMemorisee('reglage-sons', 'sons', function (coche) {
    if (window.Sons) { Sons.activer(coche); }
  });
  if (window.Sons) { Sons.activer(caseSons.checked); }

  document.querySelectorAll('[data-son]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!window.Sons) { return; }
      var morceaux = b.getAttribute('data-son').split(':');
      Sons.preparer();
      Sons.activer(true);
      Sons.jouer(morceaux[0], morceaux[1], { fureur: parseFloat(morceaux[2] || '0') });
      Sons.activer(caseSons.checked);
    });
  });
  document.getElementById('essai-ambiance').addEventListener('click', function () {
    if (!window.Sons) { return; }
    Sons.preparer();
    Sons.activer(true);
    Sons.ambiance(true);
    setTimeout(function () { Sons.ambiance(false); Sons.activer(caseSons.checked); }, 10000);
  });
}
