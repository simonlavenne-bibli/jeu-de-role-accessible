/**
 * des3d.js — Dés à six faces en 3D, avec le bruit des dés qui roulent.
 *
 * Utilisé par essais/des.html et essais/combats.html. Sans bibliothèque :
 * la 3D vient du CSS du navigateur, le son est fabriqué avec Web Audio.
 *
 *   Des3D.lancer(tapis, [4, 6]).then(function () { ... });
 *
 * Les valeurs sont déjà tirées par le jeu : le module ne fait que les montrer.
 * Le tapis est décoratif (aria-hidden) : le jeu écrit toujours le résultat en texte.
 */
(function () {
  'use strict';

  var DUREE = 1500;   // durée d'un lancer, en millisecondes
  var REBONDS = 3;    // nombre de rebonds sur la table

  // Styles du tapis et des dés, ajoutés une seule fois à la page.
  var style = document.createElement('style');
  style.textContent = [
    '.tapis-des { position: relative; height: 18rem; border: 3px solid #fff; overflow: hidden; perspective: 700px; perspective-origin: 50% -30%; }',
    '.tapis-des .emplacement { position: absolute; left: 0; top: 0; transform-style: preserve-3d; will-change: transform; }',
    '.tapis-des .ombre { position: absolute; left: 0; top: 0; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,255,255,0.25), rgba(255,255,255,0)); will-change: transform, opacity; }',
    '.tapis-des .de { position: absolute; left: 0; top: 0; transform-style: preserve-3d; }',
    '.tapis-des .face { position: absolute; left: 0; top: 0; background: linear-gradient(145deg, #fff 55%, #d6d6d6); border: 2px solid #000; border-radius: 14%; display: grid; grid-template: repeat(3, 1fr) / repeat(3, 1fr); padding: 12%; backface-visibility: hidden; -webkit-backface-visibility: hidden; }',
    '.tapis-des .face i { width: 72%; height: 72%; margin: auto; border-radius: 50%; background: #000; visibility: hidden; }',
    '.tapis-des .face i.on { visibility: visible; }'
  ].join('\n');
  document.head.appendChild(style);

  function entre(a, b) { return a + Math.random() * (b - a); }
  function animationsReduites() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  // ---------------------------------------------------------------------
  // CONSTRUCTION D'UN DÉ
  // ---------------------------------------------------------------------
  // Faces opposées : 1-6, 2-5, 3-4. Points allumés dans la grille 3 × 3 (cases 0 à 8).
  var POINTS = { 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  // Place de chaque face sur le cube, et rotation qui l'amène face au joueur.
  var FACES = [
    { valeur: 1, place: 'translateZ(D)', vers: [0, 0] },
    { valeur: 6, place: 'rotateY(180deg) translateZ(D)', vers: [0, 180] },
    { valeur: 3, place: 'rotateY(90deg) translateZ(D)', vers: [0, -90] },
    { valeur: 4, place: 'rotateY(-90deg) translateZ(D)', vers: [0, 90] },
    { valeur: 2, place: 'rotateX(90deg) translateZ(D)', vers: [-90, 0] },
    { valeur: 5, place: 'rotateX(-90deg) translateZ(D)', vers: [90, 0] }
  ];
  var ORIENTATION = {};
  FACES.forEach(function (f) { ORIENTATION[f.valeur] = f.vers; });

  function fabriquerDe(tapis, taille) {
    var emplacement = document.createElement('div');
    emplacement.className = 'emplacement';
    // Même taille que le dé : il tourne autour de son centre, pas de son coin.
    emplacement.style.width = emplacement.style.height = taille + 'px';
    var ombre = document.createElement('div');
    ombre.className = 'ombre';
    ombre.style.width = ombre.style.height = (taille * 1.5) + 'px';
    var de = document.createElement('div');
    de.className = 'de';
    de.style.width = de.style.height = taille + 'px';
    FACES.forEach(function (f) {
      var face = document.createElement('div');
      face.className = 'face';
      face.style.width = face.style.height = taille + 'px';
      face.style.transform = f.place.replace('D', (taille / 2) + 'px');
      for (var i = 0; i < 9; i += 1) {
        var point = document.createElement('i');
        if (POINTS[f.valeur].indexOf(i) >= 0) { point.className = 'on'; }
        face.appendChild(point);
      }
      de.appendChild(face);
    });
    emplacement.appendChild(de);
    tapis.appendChild(ombre);
    tapis.appendChild(emplacement);
    return { emplacement: emplacement, ombre: ombre };
  }

  // ---------------------------------------------------------------------
  // SON : chocs secs sur le bois, fabriqués par le programme
  // ---------------------------------------------------------------------
  var audio = null;
  var bruit = null;

  // À appeler pendant un appui du joueur : iPhone n'autorise le son qu'à ce moment-là.
  function preparerSon() {
    if (!window.Mixeur || !Mixeur.preparer()) { return false; }
    if (!audio) {
      audio = Mixeur.contexte();   // le contexte unique de la page (audio.js)
      // Une seconde de bruit blanc, réutilisée pour chaque choc.
      bruit = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
      var donnees = bruit.getChannelData(0);
      for (var i = 0; i < donnees.length; i += 1) { donnees[i] = Math.random() * 2 - 1; }
    }
    return true;
  }

  // Un choc : bruit filtré très court, plus grave et plus fort pour un rebond,
  // plus aigu et plus léger quand le dé roule. pan : -1 (gauche) à 1 (droite).
  function choc(instant, force, pan) {
    var source = audio.createBufferSource();
    source.buffer = bruit;
    var filtre = audio.createBiquadFilter();
    filtre.type = 'bandpass';
    filtre.frequency.value = entre(1800, 3200) - force * 900;
    filtre.Q.value = entre(4, 8);
    var volume = audio.createGain();
    var duree = 0.03 + force * 0.05;
    volume.gain.setValueAtTime(0.0001, instant);
    volume.gain.exponentialRampToValueAtTime(0.15 + force * 0.85, instant + 0.003);
    volume.gain.exponentialRampToValueAtTime(0.0001, instant + duree);
    source.connect(filtre);
    filtre.connect(volume);
    var sortie = volume;
    if (audio.createStereoPanner) {
      var panneau = audio.createStereoPanner();
      panneau.pan.value = Math.max(-1, Math.min(1, pan));
      volume.connect(panneau);
      sortie = panneau;
    }
    sortie.connect(Mixeur.couche('bruitages'));
    source.start(instant, entre(0, 0.9), duree + 0.02);
  }

  // Tous les chocs d'un dé, calés sur ses rebonds (voir hauteur()).
  function programmerSon(debut, duree, pan) {
    for (var k = 1; k <= REBONDS; k += 1) {
      var t = k / (REBONDS + 1);
      choc(debut + t * duree + entre(0, 0.01), 1 - t * 0.7, pan);
    }
    // Le dé roule après le dernier rebond : petits chocs de plus en plus espacés.
    var instant = REBONDS / (REBONDS + 1);
    var pas = 0.035;
    while (instant < 0.97) {
      instant += pas;
      pas *= 1.35;
      choc(debut + instant * duree, 0.25 * (1 - instant), pan);
    }
  }

  // ---------------------------------------------------------------------
  // MOUVEMENT
  // ---------------------------------------------------------------------
  function ralenti(p) { return 1 - Math.pow(1 - p, 3); }

  // Hauteur au-dessus de la table : des rebonds de plus en plus petits,
  // puis le dé reste posé et roule jusqu'à l'arrêt.
  function hauteur(p) {
    var fin = REBONDS / (REBONDS + 1);
    if (p >= fin) { return 0; }
    var phase = p * (REBONDS + 1);
    var k = Math.floor(phase);
    return Math.sin((phase - k) * Math.PI) * Math.pow(0.45, k);
  }

  /**
   * Fait rouler les dés sur le tapis et s'arrêter sur les valeurs données.
   * @param {HTMLElement} tapis  conteneur ; reçoit la classe « tapis-des »
   * @param {number[]} valeurs   résultats déjà tirés par le jeu (1 à 6)
   * @returns {Promise} résolue quand tous les dés sont arrêtés
   */
  function lancer(tapis, valeurs) {
    return new Promise(function (fini) {
      preparerSon();
      tapis.classList.add('tapis-des');
      tapis.textContent = '';
      var nombre = valeurs.length;
      var largeur = tapis.clientWidth;
      var haut = tapis.clientHeight;
      var parLigne = Math.min(nombre, 3);
      var lignes = Math.ceil(nombre / parLigne);
      var taille = Math.min(nombre > 3 ? 58 : 76, largeur / 4.5, haut / (lignes * 1.6));

      var des = valeurs.map(function (valeur, i) {
        var colonne = i % parLigne;
        var ligne = Math.floor(i / parLigne);
        // Position d'arrivée : les dés se posent côte à côte, sans se chevaucher.
        var orientation = ORIENTATION[valeur];
        return {
          objet: fabriquerDe(tapis, taille),
          depart: [-taille * 1.5 - entre(0, 60), entre(-taille, haut * 0.6)],
          fin: [largeur * (colonne + 0.5) / parLigne - taille / 2 + entre(-8, 8),
                haut * (ligne + 0.5) / lignes - taille / 2 + entre(-6, 6)],
          rotX: orientation[0], rotY: orientation[1],
          toursX: Math.round(entre(2, 4)) * 360 * (Math.random() < 0.5 ? -1 : 1),
          toursY: Math.round(entre(2, 4)) * 360 * (Math.random() < 0.5 ? -1 : 1),
          rotZdepart: entre(-180, 180), rotZfin: entre(-18, 18),
          decalage: entre(0, 0.06)
        };
      });

      function placer(d, p) {
        var e = ralenti(p);
        var x = d.depart[0] + (d.fin[0] - d.depart[0]) * e;
        var y = d.depart[1] + (d.fin[1] - d.depart[1]) * e;
        var h = hauteur(p) * taille * 1.2;
        var reste = 1 - e;
        var rx = d.rotX + d.toursX * reste;
        var ry = d.rotY + d.toursY * reste;
        var rz = d.rotZfin + (d.rotZdepart - d.rotZfin) * reste;
        d.objet.emplacement.style.transform =
          'translate3d(' + x + 'px,' + (y - h) + 'px,' + (h * 0.6) + 'px) rotateZ(' + rz + 'deg) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        d.objet.ombre.style.transform = 'translate(' + (x - taille * 0.25) + 'px,' + (y - taille * 0.1) + 'px) scale(' + (1 - h / (taille * 3)) + ')';
        d.objet.ombre.style.opacity = String(1 - h / (taille * 2));
      }

      function conclure() {
        des.forEach(function (d) { placer(d, 1); });
        fini();
      }

      if (animationsReduites()) {
        // Animations réduites : les dés apparaissent posés, avec un seul choc.
        if (audio) { choc(audio.currentTime + 0.01, 0.6, 0); }
        conclure();
        return;
      }

      if (audio) {
        var maintenant = audio.currentTime + 0.02;
        des.forEach(function (d) {
          programmerSon(maintenant + d.decalage * DUREE / 1000, (1 - d.decalage) * DUREE / 1000,
            (d.fin[0] + taille / 2) / largeur * 2 - 1);
        });
      }

      var debut = null;
      function image(instant) {
        if (debut === null) { debut = instant; }
        var ecoule = (instant - debut) / DUREE;
        des.forEach(function (d) {
          placer(d, Math.max(0, Math.min(1, (ecoule - d.decalage) / (1 - d.decalage))));
        });
        if (ecoule < 1) { requestAnimationFrame(image); } else { conclure(); }
      }
      requestAnimationFrame(image);
    });
  }

  window.Des3D = { lancer: lancer, preparerSon: preparerSon, DUREE: DUREE };
})();
