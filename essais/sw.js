/**
 * sw.js — Service worker : la page s'installe et se joue hors ligne.
 *
 * Toujours le réseau d'abord : en ligne, on reçoit la dernière version publiée
 * (Simon teste chaque changement aussitôt). Le cache ne sert que hors ligne.
 * Les envois de résultats (feuille Google) ne passent pas par ici.
 *
 * Ajouter ici tout nouveau fichier de la page : un test le vérifie (npm test).
 */
var CACHE = 'combats-v1';
var FICHIERS = [
  './combats.html',
  './des.html',
  './manifest.webmanifest',
  './audio.js',
  './sons.js',
  './musique.js',
  './des3d.js',
  './combats/contenu/textes.js',
  './combats/moteur/combat.js',
  './combats/moteur/donnees.js',
  './combats/moteur/hasard.js',
  './combats/moteur/systemes/index.js',
  './combats/moteur/systemes/a.js',
  './combats/moteur/systemes/b.js',
  './combats/moteur/systemes/c.js',
  './combats/moteur/systemes/d.js',
  './combats/moteur/systemes/e.js',
  './combats/moteur/systemes/f.js',
  './combats/moteur/systemes/g.js',
  './combats/interface/principal.js',
  './combats/interface/combat.js',
  './combats/interface/collecte.js',
  './combats/interface/histoire.js',
  './combats/interface/reglages.js',
  './combats/interface/signes-sonores.js',
  './images/squelette.jpg',
  './images/loup-garou.jpg',
  './images/demon.jpg',
  './sons/cri-monstre.mp3',
  './sons/cri-heros.mp3',
  './sons/victoire-monstre.mp3',
  './icones/icone-192.png',
  './icones/icone-512.png',
  './icones/icone-masquable-512.png',
  './icones/icone-apple-180.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FICHIERS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (noms) {
    return Promise.all(noms.filter(function (n) { return n !== CACHE; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var requete = e.request;
  if (requete.method !== 'GET' || new URL(requete.url).origin !== self.location.origin) { return; }
  e.respondWith(fetch(requete).then(function (reponse) {
    if (reponse.ok) {
      var copie = reponse.clone();
      caches.open(CACHE).then(function (c) { c.put(requete, copie); });
    }
    return reponse;
  }).catch(function () {
    // Hors ligne : la version gardée. L'adresse avec ?graine=… retombe sur la page sans paramètre.
    return caches.match(requete, { ignoreSearch: true });
  }));
});
