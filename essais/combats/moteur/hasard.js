/**
 * hasard.js — Le tirage au sort du moteur.
 *
 * Sans graine : le hasard du navigateur, comme avant.
 * Avec une graine (un nombre) : la même suite de tirages à chaque fois,
 * pour rejouer exactement un combat signalé par un testeur ou dans les tests.
 */
export function creerHasard(graine) {
  if (graine === undefined || graine === null || isNaN(graine)) { return Math.random; }
  var etat = graine >>> 0;
  // Générateur « mulberry32 » : court, rapide et suffisant pour un jeu.
  return function () {
    etat = (etat + 0x6D2B79F5) >>> 0;
    var t = etat;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
