/**
 * Les sept systèmes de combat à comparer.
 * Chaque système reçoit les outils du combat (voir combat.js) et rend un objet :
 *   nom, init(), regles(), tour(), fuiteRatee(phrases), journal(decisions)
 *   et, s'il le faut : parTours, entree(), mort(), compteurs(c).
 */
import A from './a.js';
import B from './b.js';
import C from './c.js';
import D from './d.js';
import E from './e.js';
import F from './f.js';
import G from './g.js';

export var SYSTEMES = { A: A, B: B, C: C, D: D, E: E, F: F, G: G };
