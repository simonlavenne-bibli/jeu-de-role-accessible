/**
 * texte.js — Petits outils pour écrire les phrases du jeu.
 */
export function pv(n) { return n + (n > 1 ? ' points de vie' : ' point de vie'); }

export function pluriel(n, un, plusieurs) { return n + ' ' + (n > 1 ? plusieurs : un); }

// « 4, 2 et 6 »
export function liste(valeurs) {
  if (valeurs.length <= 1) { return valeurs.join(''); }
  return valeurs.slice(0, -1).join(', ') + ' et ' + valeurs[valeurs.length - 1];
}

export function annonce(des) { return liste(des.map(String)); }

export function somme(t) { return t.reduce(function (a, b) { return a + b; }, 0); }
