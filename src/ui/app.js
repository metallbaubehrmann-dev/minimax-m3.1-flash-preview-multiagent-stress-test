/*!
 * Schattenwerkstatt — Anwendungslogik (Besitz A1: src/ui/**)
 * =====================================================================
 * Klassisches Skript, kein ES-Modul, kein fetch/XHR — Grund siehe
 * src/ui/engine-adapter.js und src/ui/README.md.
 *
 * SICHERHEITSHÜLLE: das gesamte Skript läuft in einem try/catch. Selbst ein
 * Fehler im Zeichen- oder Aufgabenteil darf die Oberflaeche nicht leer
 * lassen — im Fehlerfall bleibt die zuletzt gültige Anzeige stehen und der
 * Fehler wird in #engine-status genannt.
 *
 * ERFOLGSREGEL: bewertet() gibt einen Erfolg NUR zurück, wenn als zweites
 * Argument true übergeben wird. Das passiert ausschließlich in
 * aktualisiere(..., true), und das wiederum ausschließlich aus einem
 * echten Bedienereignis (Klick, Tastendruck, Ziehen, Regler). Die laufende
 * Uhr ruft aktualisiere(..., false) und erzeugt daher höchstens eine
 * Vorschau, keinen Erfolg.
 * =====================================================================
 */
(function (root) {
  'use strict';

  var E = root.SWEngine;
  var T = root.SWTasks;
  var S = root.SWStore;

  /* ================= Grundwerte ================= */
  var DEMO = { latDeg: 48.78, lonDeg: 9.18, tzId: 'Europe/Berlin', label: 'Demo-Ort 48,78 N / 9,18 E (Europe/Berlin)' };
  var SZENE = {
    rad: 100,          // Radius der Werkstattflaeche in cm
    limit: 250,        // = 2,5 x Werkstattflaeche (Radius), sichtbar gekennzeichnet
    stablinie: 6,      // Kantenlaenge des Stabquerschnitts in cm
    minBereich: 120,
    maxBereich: 300,
    griffBereich: 70   // Radius, bis zu dem der Stab verschoben werden darf
  };
  var SPEICHER_MIN_HOEHE = 3;   // identisch zu SWTasks.TAGES_MIN_HOEHE

  var zustand = null;
  var tagesLauf = null;
  var letzterTick = 0;
  var timer = null;
  var userActions = 0;

  function el(id) { return document.getElementById(id); }
  function setText(id, txt) { var e = el(id); if (e) e.textContent = txt; }
  function leeren(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  function zahl(w, n) {
    if (typeof w !== 'number' || !isFinite(w)) return '–';
    return (Math.round(w * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n).replace('.', ',');
  }
  function vorzeichen(w, n) {
    return (w > 0 ? '+' : (w < 0 ? '−' : '±')) + zahl(Math.abs(w), n);
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function mod1440(x) { x = x % 1440; return x < 0 ? x + 1440 : x; }
  function zeitText(minuten) {
    var m = Math.round(mod1440(minuten));
    return String(Math.floor(m / 60)) + ':' + pad2(m % 60);
  }
  function dauerText(min) {
    if (typeof min !== 'number' || !isFinite(min) || min <= 0) return '–';
    return Math.floor(min / 60) + ' h ' + pad2(Math.round(min % 60)) + ' min';
  }
  function isoZuText(iso) {
    if (!iso) return '–';
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
    if (!m) return iso;
    return m[3] + '.' + m[2] + '.' + m[1] + ', ' + m[4] + ':' + m[5];
  }
  function htmlEsc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function svg(tag, attr) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag), k;
    for (k in attr) if (Object.prototype.hasOwnProperty.call(attr, k)) n.setAttribute(k, attr[k]);
    return n;
  }

  /* ================= Startwerte ================= */
  function heuteMittagUtcMs(tzId, refMs) {
    var p = E.localParts(refMs, tzId);
    return Date.UTC(p.jahr, p.monat - 1, p.tag, 12, 0, 0) - p.offsetMin * 60000;
  }

  function frischerZustand() {
    var jetzt = Date.now();
    return {
      ort: { latDeg: DEMO.latDeg, lonDeg: DEMO.lonDeg, tzId: DEMO.tzId, label: DEMO.label },
      modus: 'live',
      laeuft: false,
      // Simulationszeit ist eine sichtbare, vom Nutzer gesetzte Groesse.
      // Startwert: das heutige Datum um 12:00 Ortszeit, sichtbar angezeigt.
      simUtcMs: heuteMittagUtcMs(DEMO.tzId, jetzt),
      geschwindigkeit: 900,          // Simulations-Minuten je echte Sekunde
      stab: { x: 0, y: 0, h: 90 },
      aufgabe: 'aufgabe-1',
      geloest: { 'aufgabe-1': false, 'aufgabe-2': false, 'aufgabe-3': false }
    };
  }

  function aktuelleUtcMs() {
    return zustand.modus === 'live' ? Date.now() : zustand.simUtcMs;
  }

  /* ================= Rechnung ================= */
  function rechne() {
    var o = {
      utcMs: aktuelleUtcMs(),
      latDeg: zustand.ort.latDeg,
      lonDeg: zustand.ort.lonDeg,
      tzId: zustand.ort.tzId
    };
    zustand.solar = E.computeState(o);
    tagesLauf = E.tageslauf(o);

    // Schattenspitze des Stabendes. Vertragsform projectAt(state, {x, y, z}).
    var oben = E.projectAt(zustand.solar, { x: zustand.stab.x, y: zustand.stab.y, z: zustand.stab.h });
    zustand.schatten = null;
    zustand.schattenBegrenzt = false;
    zustand.schattenLaenge = 0;

    if (zustand.solar.isDay && oben && isFinite(oben.x) && isFinite(oben.y)) {
      var dx = oben.x - zustand.stab.x;
      var dy = oben.y - zustand.stab.y;
      var laenge = Math.sqrt(dx * dx + dy * dy);
      zustand.schattenLaenge = laenge;
      var gezeichnet = laenge;
      if (laenge > SZENE.limit) {
        gezeichnet = SZENE.limit;
        zustand.schattenBegrenzt = true;
      }
      zustand.schatten = {
        bx: zustand.stab.x,
        by: zustand.stab.y,
        tx: zustand.stab.x + dx * (gezeichnet / laenge),
        ty: zustand.stab.y + dy * (gezeichnet / laenge),
        // Wahre Spitze unabhaengig von der Zeichenbegrenzung. Die Aufgaben
        // messen gegen txTrue/tyTrue — sonst wuerde ein abgeschnittener
        // Schatten faelschlich als Treffer an einer Marke gelten.
        txTrue: oben.x,
        tyTrue: oben.y
      };
    }
    return zustand.solar;
  }

  function tagesTiefpunkt() {
    if (!tagesLauf) return null;
    var bestIdx = -1, bestAlt = Infinity, i, a;
    for (i = 0; i < tagesLauf.steps; i++) {
      a = tagesLauf.samples[i];
      if (a >= SPEICHER_MIN_HOEHE && a < bestAlt) { bestAlt = a; bestIdx = i; }
    }
    if (bestIdx < 0) return null;
    var ms = tagesLauf.t0UtcMs + bestIdx * 60000;
    var p = E.localParts(ms, zustand.ort.tzId);
    return {
      ms: ms,
      altDeg: bestAlt,
      lokal: zeitText(p.stunde * 60 + p.minute) + ' Uhr',
      laengeUnits: zustand.stab.h / Math.tan(bestAlt * E.RAD)
    };
  }

  function abstaendeZuMarken() {
    var r = {};
    if (!zustand.schatten) return r;
    // Bewusst die WAHRE Spitze, nicht die gezeichnete: ein begrenzter Schatten
    // darf keinen Aufgabenerfolg vortaeuschen.
    var spitze = { x: zustand.schatten.txTrue, y: zustand.schatten.tyTrue };
    [12, 3, 6, 9].forEach(function (nr) {
      r[String(nr)] = T.abstand(spitze, T.markePunkt(nr));
    });
    return r;
  }

  function messlage() {
    return {
      isDay: zustand.solar.isDay,
      altitudeDeg: zustand.solar.altitudeDeg,
      azimuthDeg: zustand.solar.azimuthDeg,
      declinationDeg: zustand.solar.declinationDeg,
      latDeg: zustand.ort.latDeg,
      simUtcMs: zustand.simUtcMs,
      abstandZuMarke: abstaendeZuMarken(),
      tagesTiefpunkt: tagesTiefpunkt(),
      // Die Sonne steht nur dann im Norden, wenn die Deklination groesser ist
      // als die Breite. Nur dann kann ein Schatten ueberhaupt nach Sueden fallen.
      sechsErreichbar: zustand.solar.declinationDeg > zustand.ort.latDeg
    };
  }

  /**
   * Erfolg wird NUR vergeben, wenn `istNutzeraktion` true ist. Bei false gibt
   * die Funktion ausschliesslich eine Vorschau zurueck.
   */
  function bewertet(istNutzeraktion) {
    var task = T.byId(zustand.aufgabe);
    if (!task) return { vorschau: false, erfuellt: false, geloest: false, text: '' };
    var m = messlage();
    var vorschau = task.bedingtErfuellt(m);

    if (!istNutzeraktion) {
      return { vorschau: !!vorschau.erfuellt, erfuellt: false, geloest: zustand.geloest[task.id], text: '' };
    }
    if (zustand.geloest[task.id]) {
      return {
        vorschau: true, erfuellt: true, geloest: true,
        text: 'Diese Aufgabe ist bereits gelöst. Nachprüfung: ' +
          (vorschau.erfuellt ? 'Die Bedingung hält noch.' : 'Die Bedingung hält nicht mehr — die Lösung bleibt trotzdem bestehen.')
      };
    }
    var r = task.pruefe(m);
    if (r.erfuellt) {
      zustand.geloest[task.id] = true;
      S.merke('geloest-' + task.id, true);
    }
    return { vorschau: !!vorschau.erfuellt, erfuellt: !!r.erfuellt, geloest: zustand.geloest[task.id], text: r.text };
  }

  /* ================= Zeitzerlegung ================= */
  // Zonenversatz der Zone ohne Sommerzeit (nur Anzeige, kein Rechenkern).
  function standardOffset(tzId, ms) {
    try {
      var jahr = new Date(ms).getUTCFullYear();
      var jan = E.localParts(Date.UTC(jahr, 0, 15, 12), tzId).offsetMin;
      var jul = E.localParts(Date.UTC(jahr, 6, 15, 12), tzId).offsetMin;
      return Math.min(jan, jul);
    } catch (e) { return 0; }
  }

  /* ================= Darstellung ================= */
  function zeichne() {
    var s = zustand.solar;
    if (!s) return;

    var bewertung = bewertet(false);   // Vorschau, kein Erfolg

    /* --- Messwerte --- */
    setText('m-hoehe', zahl(s.altitudeDeg, 2) + '°');

    var azFeld = el('m-azimut');
    leeren(azFeld);
    if (s.azimuthUnstable) {
      azFeld.appendChild(document.createTextNode('instabil — kein fester Wert '));
      var chip = document.createElement('span');
      chip.className = 'chip instabil';
      // Die Engine markiert Instabilitaet bei Zenitdistanz < 2 Grad, der Notfallpfad
      // bei sehr flachem Stand. Deshalb die Begruendung aus der tatsaechlichen Hoehe
      // ableiten statt eine feste, fuer beide Pfade falsche Zahl zu nennen.
      var fastZenit = s.altitudeDeg > 88;
      var fastHorizont = s.altitudeDeg < 1;
      chip.textContent = fastZenit ? 'Sonne nahe dem Zenit'
        : (fastHorizont ? 'Sonne nahe dem Horizont' : 'Azimut instabil');
      chip.title = fastZenit
        ? 'Steht die Sonne nahe dem Zenit, ist der Azimut rechnerisch nicht stabil: '
          + 'die Stundenwinkel-Differenz geht gegen null. Es wird bewusst keine Sprungzahl gezeigt.'
        : (fastHorizont
          ? 'Steht die Sonne nahe dem Horizont, ist der Azimut rechnerisch nicht stabil. '
            + 'Es wird bewusst keine Sprungzahl gezeigt.'
          : 'In diesem Bereich ist der Azimut rechnerisch nicht stabil. '
            + 'Es wird bewusst keine Sprungzahl gezeigt.');
      azFeld.appendChild(chip);
    } else {
      azFeld.appendChild(document.createTextNode(zahl(s.azimuthDeg, 1) + '°'));
    }

    var off = s.offsetMin;
    setText('m-datum', isoZuText(s.localCivil) + ' (UTC' + (off < 0 ? '−' : '+') +
      pad2(Math.floor(Math.abs(off) / 60)) + ':' + pad2(Math.abs(off) % 60) + ')');
    setText('m-tageslaenge', (tagesLauf && tagesLauf.zustand !== 'normal')
      ? tagesLauf.zustand + ' — an diesem Tag kein Auf- und Untergang'
      : dauerText(s.dayLengthMin));
    setText('m-aufgang', s.sunriseLocal ? isoZuText(s.sunriseLocal) : 'kein Aufgang');
    setText('m-untergang', s.sunsetLocal ? isoZuText(s.sunsetLocal) : 'kein Untergang');
    setText('m-hoechststand', s.solarNoonLocal ? isoZuText(s.solarNoonLocal) : '–');
    setText('m-deklination', vorzeichen(s.declinationDeg, 2) + '°');

    /* --- Die drei Zeiten, getrennt und mit getrennter Ursache --- */
    var p = E.localParts(aktuelleUtcMs(), zustand.ort.tzId);
    var stand = standardOffset(zustand.ort.tzId, aktuelleUtcMs());
    var zonenversatz = off - stand;                       // +60 = Sommerzeit
    var meridian = stand / 60 * 15;                       // Zonenmeridian in Grad Länge
    var laengenfehler = 4 * (zustand.ort.lonDeg - meridian);
    var lokalMin = p.stunde * 60 + p.minute + p.sekunde / 60;
    var meridianMin = lokalMin - zonenversatz;
    var wahreMittel = meridianMin + laengenfehler;
    var wahreSonne = wahreMittel + s.equationOfTimeMin;

    setText('z-ortszeit', zeitText(lokalMin) + ' Uhr' +
      (zonenversatz > 0 ? ' · Sommerzeit aktiv' : ''));
    setText('z-utc', zeitText(lokalMin - off) + ' Uhr');
    setText('z-wahre', zeitText(wahreSonne) + ' Uhr');

    setText('z-schritt0', zeitText(lokalMin) + ' Uhr Ortszeit');
    setText('z-schritt1', vorzeichen(-zonenversatz, 0) + ' min Zonenversatz' +
      (zonenversatz > 0 ? ' (Sommerzeit, Regelwerk)' : ' (keine Sommerzeit)'));
    setText('z-schritt2', zeitText(meridianMin) + ' Uhr');
    setText('z-schritt3', vorzeichen(laengenfehler, 1) + ' min Längenfehler gegenüber dem Zonenmeridian ' +
      zahl(meridian, 1) + '° O (Regelwerk, 4 min je Grad)');
    setText('z-schritt4', zeitText(wahreMittel) + ' Uhr');
    setText('z-schritt5', vorzeichen(s.equationOfTimeMin, 1) + ' min Zeitgleichung (Astronomie, Erdbahn und Achsneigung)');
    setText('z-schritt6', zeitText(wahreSonne) + ' Uhr');
    setText('z-pruefzeile', 'Gegenrechnung: wahre Sonnenzeit It. Motor = ' + zeitText(s.trueSolarTimeMin) +
      ' Uhr · Abweichung zur aufgebauten Kette = ' +
      zahl(Math.abs(mod1440(s.trueSolarTimeMin) - mod1440(wahreSonne)) > 720
        ? 1440 - Math.abs(mod1440(s.trueSolarTimeMin) - mod1440(wahreSonne))
        : Math.abs(mod1440(s.trueSolarTimeMin) - mod1440(wahreSonne)), 1) + ' min.');

    /* --- Simulationsanzeige --- */
    if (zustand.modus === 'sim') {
      setText('sim-ortszeit', zeitText(p.stunde * 60 + p.minute) + ' Uhr Ortszeit — ' +
        (zustand.laeuft ? 'läuft' : 'angehalten'));
      setText('sim-utc-anzeige', 'Simulationszeit (UTC): ' + E.isoUtc(zustand.simUtcMs));
    }

    /* --- Schattenlage --- */
    zeichneSzene();
    if (!s.isDay) {
      setText('schatten-info', 'Kein Schatten. Die Sonne steht ' + zahl(Math.abs(s.altitudeDeg), 2) + '° unter dem Horizont.');
    } else if (!zustand.schatten) {
      setText('schatten-info', 'Kein Schatten berechenbar — die Sonne steht exakt am Horizont.');
    } else {
      setText('schatten-info', 'Schattenlänge: ' + zahl(zustand.schattenLaenge, 1) + ' cm' +
        (zustand.schattenBegrenzt ? ' — gezeichnet bis ' + SZENE.limit + ' cm' : '') +
        ' · Spitze bei x = ' + zahl(zustand.schatten.tx, 0) + ' cm, y = ' + zahl(zustand.schatten.ty, 0) + ' cm');
    }

    el('nacht-hinweis').hidden = !!s.isDay;
    el('limit-hinweis').hidden = !zustand.schattenBegrenzt;
    if (zustand.schattenBegrenzt) {
      setText('limit-text', ' Schattenlänge begrenzt: gezeichnet bis ' + SZENE.limit +
        ' cm (2,5-fache Werkstattfläche). Die wahre Länge beträgt ' + zahl(zustand.schattenLaenge, 0) +
        ' cm — sie steht oben in der Zeile "Schattenlänge" und wird hier nicht still abgeschnitten.');
    }

    zeichneAufgabenstand(bewertung);
  }

  function zeichneAufgabenstand(bewertung) {
    var task = T.byId(zustand.aufgabe);
    if (!task) return;
    var box = el('task-stand');
    leeren(box);

    var st = document.createElement('div');
    if (zustand.geloest[task.id]) {
      st.innerHTML = '<span class="chip ok">gelöst</span> ' + htmlEsc(task.titel);
    } else if (!zustand.solar.isDay) {
      st.innerHTML = '<span class="chip nacht">Nacht</span> ohne Sonne gibt es keinen Schatten — ' +
        'die Aufgabe ist jetzt nicht lösbar. Auf den nächsten Tag warten oder die Zeit vorstellen.';
    } else if (bewertung.vorschau) {
      st.innerHTML = '<span class="chip ok">Bedingung erfüllt</span> noch nicht bestätigt. ' +
        'Die laufende Uhr stellt keinen Erfolg selbst ein — <kbd>H</kbd> oder „Prüfen" bestätigt.';
    } else {
      st.innerHTML = '<span class="chip">offen</span> ' + htmlEsc(task.bedingungText);
    }
    box.appendChild(st);

    var rest = document.createElement('div');
    rest.textContent = T.TASKS.filter(function (t) { return t.id !== task.id; })
      .map(function (t) { return (zustand.geloest[t.id] ? '✓ ' : '– ') + t.nr + '. ' + t.titel; })
      .join('   ·   ');
    box.appendChild(rest);
  }

  /* ================= Szene ================= */
  function zeichneSzene() {
    var s = zustand.solar;
    var gMarken = el('szene-marken'), gLimit = el('szene-limite'), gSch = el('szene-schatten');
    var gStab = el('szene-stab'), gHim = el('szene-himmel'), gText = el('szene-text');
    leeren(gMarken); leeren(gLimit); leeren(gSch); leeren(gStab); leeren(gHim); leeren(gText);

    /* Stundenmarken: 12 = Norden, 3 = Osten, 6 = Sueden, 9 = Westen */
    for (var i = 0; i < 12; i++) {
      var nr = (i === 0) ? 12 : i;
      var mp = T.markePunkt(nr);
      var gross = (nr === 12 || nr === 6 || nr === 3 || nr === 9);
      var von = gross ? 68 : 78, bis = 100;
      gMarken.appendChild(svg('line', {
        x1: mp.x * von / T.MARK_R, y1: mp.y * von / T.MARK_R,
        x2: mp.x * bis / T.MARK_R, y2: mp.y * bis / T.MARK_R,
        class: 'marke-linie' + (nr === 12 ? ' marke-nord' : (nr === 6 ? ' marke-sued' : ''))
      }));
      var tn = svg('text', {
        x: mp.x * 1.16, y: mp.y * 1.16, class: 'marke-ziffer',
        'text-anchor': 'middle', 'dominant-baseline': 'middle'
      });
      tn.textContent = String(nr);
      gMarken.appendChild(tn);
    }
    [[0, -T.MARK_R * 1.34, '12'], [0, T.MARK_R * 1.34, '6'],
    [T.MARK_R * 1.34, 0, '3'], [-T.MARK_R * 1.34, 0, '9']].forEach(function (p) {
      var t = svg('text', { x: p[0], y: p[1], class: 'marke-text', 'text-anchor': 'middle', 'dominant-baseline': 'middle' });
      t.textContent = p[2];
      gMarken.appendChild(t);
    });
    [T.MARK_R, SZENE.rad].forEach(function (r) {
      gMarken.appendChild(svg('circle', { cx: 0, cy: 0, r: r, fill: 'none', stroke: '#2c3746', 'stroke-width': 1 }));
    });
    gMarken.appendChild(svg('line', { x1: -SZENE.rad, y1: 0, x2: SZENE.rad, y2: 0, class: 'bahn' }));
    gMarken.appendChild(svg('line', { x1: 0, y1: -SZENE.rad, x2: 0, y2: SZENE.rad, class: 'bahn' }));

    /* Begrenzungskreis — nur zeichnen, wenn wirklich begrenzt wird */
    if (zustand.schattenBegrenzt) {
      gLimit.appendChild(svg('circle', { cx: 0, cy: 0, r: SZENE.limit, class: 'schatten-grenze' }));
      var lt = svg('text', { x: 0, y: -SZENE.limit - 7, class: 'szene-text', 'text-anchor': 'middle' });
      lt.setAttribute('fill', '#ff8a5b');
      lt.textContent = 'Grenze ' + SZENE.limit + ' cm (2,5 × Werkstattfläche)';
      gLimit.appendChild(lt);
    }

    /* Schatten — bei Nacht wird GAR NICHTS gezeichnet, nicht einmal ein Punkt */
    if (s.isDay && zustand.schatten) {
      var sh = zustand.schatten;
      var vx = sh.tx - sh.bx, vy = -(sh.ty - sh.by);
      var vl = Math.sqrt(vx * vx + vy * vy) || 1;
      var nx = -vy / vl * (SZENE.stablinie / 2), ny = vx / vl * (SZENE.stablinie / 2);
      gSch.appendChild(svg('polygon', {
        points: [
          (sh.bx + nx) + ',' + (-sh.by + ny),
          (sh.bx - nx) + ',' + (-sh.by - ny),
          (sh.tx - nx) + ',' + (-sh.ty - ny),
          (sh.tx + nx) + ',' + (-sh.ty + ny)
        ].join(' '),
        class: 'schatten'
      }));
      gSch.appendChild(svg('circle', {
        cx: sh.tx, cy: -sh.ty, r: zustand.schattenBegrenzt ? 5 : 3.2,
        fill: zustand.schattenBegrenzt ? '#ff8a5b' : '#000',
        opacity: zustand.schattenBegrenzt ? 1 : .55
      }));
      if (zustand.schattenBegrenzt) {
        var ta = svg('text', { x: sh.tx, y: -sh.ty - 11, class: 'szene-text', 'text-anchor': 'middle' });
        ta.setAttribute('fill', '#ff8a5b');
        ta.textContent = 'hier abgeschnitten';
        gSch.appendChild(ta);
      }
    }

    /* Stab */
    var st = zustand.stab;
    gStab.appendChild(svg('rect', {
      x: st.x - SZENE.stablinie / 2, y: -st.y - SZENE.stablinie / 2,
      width: SZENE.stablinie, height: SZENE.stablinie, class: 'stab-sockel'
    }));
    gStab.appendChild(svg('circle', { cx: st.x, cy: -st.y, r: SZENE.stablinie * 0.62, class: 'stab' }));
    gStab.appendChild(svg('circle', { cx: st.x, cy: -st.y, r: 12, class: 'griff' }));

    /* Sonne oder Mond */
    var az = s.isDay ? s.azimuthDeg : (s.azimuthDeg + 180) % 360;
    if (s.azimuthUnstable) az = s.azimuthDeg;   // instabil: keine erfundene Ausweichrichtung
    var a = az * E.RAD;
    var hr = Math.min(SZENE.limit * 0.9, 148);
    var hx = hr * Math.sin(a), hy = -hr * Math.cos(a);
    if (s.isDay) {
      gHim.appendChild(svg('circle', { cx: hx, cy: hy, r: 13, fill: '#f0b429', opacity: .9 }));
      for (var k = 0; k < 8; k++) {
        var ka = k * Math.PI / 4;
        gHim.appendChild(svg('line', {
          x1: hx + Math.cos(ka) * 17, y1: hy + Math.sin(ka) * 17,
          x2: hx + Math.cos(ka) * 23, y2: hy + Math.sin(ka) * 23,
          stroke: '#f0b429', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: .75
        }));
      }
    } else {
      gHim.appendChild(svg('path', {
        d: 'M ' + (hx + 7) + ' ' + (hy - 12) + ' a 12 12 0 1 0 9 17 a 14 14 0 1 1 -9 -17 z',
        fill: '#8fa3c8', opacity: .85
      }));
    }

    /* Nachttext ersetzt jeden Schatten */
    if (!s.isDay) {
      var nt = svg('text', { x: 0, y: 4, class: 'nacht-text', 'text-anchor': 'middle' });
      nt.textContent = 'Nacht — kein Schatten gezeichnet';
      gText.appendChild(nt);
      var nt2 = svg('text', { x: 0, y: 24, class: 'szene-text', 'text-anchor': 'middle' });
      nt2.textContent = 'Sonne ' + zahl(Math.abs(s.altitudeDeg), 1) + '° unter dem Horizont';
      gText.appendChild(nt2);
    }

    /* Ausschnitt so weit, dass Stab, Schatten und Grenze sichtbar sind */
    var b = SZENE.minBereich;
    b = Math.max(b, Math.abs(st.x) + 40, Math.abs(st.y) + 40);
    if (zustand.schatten) {
      b = Math.max(b, Math.abs(zustand.schatten.tx) * 1.12, Math.abs(zustand.schatten.ty) * 1.12);
    }
    if (zustand.schattenBegrenzt) b = Math.max(b, SZENE.limit + 34);
    b = Math.min(SZENE.maxBereich, b);
    el('szene').setAttribute('viewBox', (-b) + ' ' + (-b) + ' ' + (2 * b) + ' ' + (2 * b));
  }

  /* ================= Aktualisieren ================= */
  function aktualisiere(nutzeraktion) {
    try {
      rechne();
      zeichne();
      if (nutzeraktion) {
        var r = bewertet(true);
        var e = el('task-ergebnis');
        leeren(e);
        if (r.erfuellt) {
          e.className = 'ergebnis hinweis gut';
          e.textContent = r.text;
        } else {
          e.className = 'ergebnis';
          e.textContent = r.text || 'Noch nicht erfüllt.';
        }
        speichereEinstellungen();
      }
    } catch (err) {
      setText('engine-status', 'Fehler in der Oberfläche: ' + (err && err.message ? err.message : err));
      if (root.console && root.console.error) root.console.error(err);
    }
  }

  function nutzerAktion() { userActions++; }

  /* ================= Modus / Zeit ================= */
  function setzeModus(m) {
    zustand.modus = m;
    el('modus-live').setAttribute('aria-pressed', m === 'live' ? 'true' : 'false');
    el('modus-sim').setAttribute('aria-pressed', m === 'sim' ? 'true' : 'false');
    el('sim-bereich').hidden = (m !== 'sim');
    if (m !== 'sim' && timer) { root.clearInterval(timer); timer = null; zustand.laeuft = false; setzeLaufKnopf(); }
    if (m === 'sim') { setzeSimFelder(); setzeLaufKnopf(); }
  }

  function setzeSimFelder() {
    var p = E.localParts(zustand.simUtcMs, zustand.ort.tzId);
    el('sim-datum').value = p.jahr + '-' + pad2(p.monat) + '-' + pad2(p.tag);
    el('sim-zeit').value = pad2(p.stunde) + ':' + pad2(p.minute);
    el('zeitskala').value = String(p.stunde * 60 + p.minute);
  }

  function setzeLaufKnopf() {
    el('sim-play').textContent = zustand.laeuft ? 'Pause' : 'Start';
    el('sim-play').setAttribute('aria-pressed', zustand.laeuft ? 'true' : 'false');
  }

  // Liest Datum und Uhrzeit aus den Feldern und rechnet daraus die
  // Simulationszeit. Kein internes Datum: der Wert kommt immer aus den Feldern.
  function setzeSimAusFeldern() {
    var dv = el('sim-datum').value, tv = el('sim-zeit').value;
    if (!dv || !tv) return false;
    var d = dv.split('-').map(Number), t = tv.split(':').map(Number);
    if (d.length < 3 || t.length < 2 || !isFinite(d[0]) || !isFinite(t[0])) return false;
    var tz = zustand.ort.tzId;
    var roh = Date.UTC(d[0], d[1] - 1, d[2], t[0], t[1], 0);
    // Zonenversatz zweimal bestimmen, damit die Sommerzeitgrenze stimmt.
    var off = E.localParts(roh, tz).offsetMin;
    var ms = roh - off * 60000;
    var off2 = E.localParts(ms, tz).offsetMin;
    if (off2 !== off) ms = roh - off2 * 60000;
    zustand.simUtcMs = ms;
    var end = E.localParts(ms, tz);
    el('zeitskala').value = String(end.stunde * 60 + end.minute);
    return true;
  }

  function starteStoppeSimulation() {
    if (timer) {
      root.clearInterval(timer); timer = null; zustand.laeuft = false;
    } else {
      zustand.laeuft = true;
      letzterTick = Date.now();
      timer = root.setInterval(function () {
        if (zustand.modus !== 'sim' || !zustand.laeuft) return;
        var jetzt = Date.now();
        zustand.simUtcMs += (jetzt - letzterTick) * zustand.geschwindigkeit / 1000;
        letzterTick = jetzt;
        var p = E.localParts(zustand.simUtcMs, zustand.ort.tzId);
        el('zeitskala').value = String(p.stunde * 60 + p.minute);
        el('sim-zeit').value = pad2(p.stunde) + ':' + pad2(p.minute);
        el('sim-datum').value = p.jahr + '-' + pad2(p.monat) + '-' + pad2(p.tag);
        // Laufende Uhr: nur anzeigen, niemals einen Erfolg vergeben.
        aktualisiere(false);
      }, 100);
    }
    setzeLaufKnopf();
  }

  /* ================= Aufgaben ================= */
  function setzeAufgabe(id, mitAktion) {
    var task = T.byId(id);
    if (!task) return;
    zustand.aufgabe = id;
    T.TASKS.forEach(function (t) {
      el('task-btn-' + t.nr).setAttribute('aria-pressed', t.id === id ? 'true' : 'false');
    });
    setText('task-titel', task.nr + '. ' + task.titel);
    setText('task-auftrag', task.aufgabe);
    setText('task-hinweis', task.hinweis);
    setText('task-bedingung', task.bedingungText);
    var e = el('task-ergebnis');
    e.className = 'ergebnis';
    e.textContent = '–';
    el('task-hinweis-box').open = false;
    if (mitAktion) aktualisiere(false);
  }

  /* ================= Ort ================= */
  function ortUebernehmen() {
    var b = parseFloat(el('ort-breite').value);
    var l = parseFloat(el('ort-laenge').value);
    var tz = el('ort-tz').value || 'UTC';
    if (!isFinite(b) || !isFinite(l)) {
      setText('ort-hinweis', 'Breite und Länge müssen Zahlen sein. Der letzte gültige Ort bleibt aktiv.');
      return;
    }
    var bAlt = zustand.ort.latDeg;
    b = Math.max(5, Math.min(85, b));
    l = Math.max(-180, Math.min(180, l));
    el('ort-breite').value = b.toFixed(2);
    el('ort-laenge').value = l.toFixed(2);
    zustand.ort = {
      latDeg: b, lonDeg: l, tzId: tz,
      label: zahl(b, 2) + '° N / ' + zahl(l, 2) + '° E, ' + tz
    };
    if (bAlt !== b) E.clearDayCache();
    aktualisiere(true);
  }

  /* ================= Stab ================= */
  function setzeStabPosition(x, y) {
    var r = Math.sqrt(x * x + y * y);
    if (r > SZENE.griffBereich) { x = x / r * SZENE.griffBereich; y = y / r * SZENE.griffBereich; }
    zustand.stab.x = x;
    zustand.stab.y = y;
  }
  function stabsHoehe(d) {
    zustand.stab.h = Math.max(20, Math.min(220, zustand.stab.h + d));
    el('stab-hoehe').value = String(zustand.stab.h);
    setText('stab-hoehe-wert', zustand.stab.h + ' cm');
    aktualisiere(true);
  }

  /* ================= Zeigereingabe (Maus, Stift, Touch) ================= */
  function bildZuWelt(ev) {
    var s = el('szene');
    if (!s.createSVGPoint || !s.getScreenCTM) return null;
    var p = s.createSVGPoint();
    p.x = ev.clientX; p.y = ev.clientY;
    var ctm = s.getScreenCTM();
    if (!ctm) return null;
    var q = p.matrixTransform(ctm.inverse());
    return { x: q.x, y: -q.y };   // Bildschirm-y zeigt nach unten
  }

  function bindeSzene() {
    var s = el('szene');
    var zieht = false, versatz = null;

    s.addEventListener('pointerdown', function (ev) {
      var w = bildZuWelt(ev);
      if (!w) return;
      zieht = true;
      versatz = { x: w.x - zustand.stab.x, y: w.y - zustand.stab.y };
      s.classList.add('zieht');
      if (ev.pointerId !== undefined && ev.target.setPointerCapture) {
        try { ev.target.setPointerCapture(ev.pointerId); } catch (e) { /* egal */ }
      }
      ev.preventDefault();
    });
    s.addEventListener('pointermove', function (ev) {
      if (!zieht) return;
      var w = bildZuWelt(ev);
      if (!w) return;
      setzeStabPosition(w.x - versatz.x, w.y - versatz.y);
      ev.preventDefault();
    });
    function loslassen() {
      if (!zieht) return;
      zieht = false; versatz = null;
      s.classList.remove('zieht');
      nutzerAktion();
      aktualisiere(true);
    }
    s.addEventListener('pointerup', loslassen);
    s.addEventListener('pointercancel', loslassen);
  }

  /* ================= Tastatur ================= */
  function bindeTastatur() {
    document.addEventListener('keydown', function (ev) {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var ziel = ev.target;
      var inFeld = ziel && (ziel.tagName === 'INPUT' || ziel.tagName === 'SELECT' || ziel.tagName === 'TEXTAREA');
      if (inFeld) return;                      // Eingabefelder behalten ihre Tasten
      var k = ev.key;
      var minutenSchritt = ev.shiftKey ? 60 : 1;
      var benutzt = true;

      function simSchritt(ms) {
        if (zustand.modus !== 'sim') return;
        zustand.simUtcMs += ms;
        setzeSimFelder();
      }

      switch (k) {
        case ' ':
        case 'Spacebar':
          nutzerAktion(); setzeModus('sim'); starteStoppeSimulation(); aktualisiere(false);
          break;
        case 'l': case 'L':
          nutzerAktion(); setzeModus(zustand.modus === 'live' ? 'sim' : 'live'); aktualisiere(false);
          break;
        case '[':
          nutzerAktion(); simSchritt(-minutenSchritt * 60000); aktualisiere(true); break;
        case ']':
          nutzerAktion(); simSchritt(minutenSchritt * 60000); aktualisiere(true); break;
        case 'ArrowLeft':
          nutzerAktion(); simSchritt(-10 * 60000); aktualisiere(true); break;
        case 'ArrowRight':
          nutzerAktion(); simSchritt(10 * 60000); aktualisiere(true); break;
        case 'ArrowUp':
          nutzerAktion(); setzeStabPosition(zustand.stab.x, zustand.stab.y + 5); aktualisiere(true); break;
        case 'ArrowDown':
          nutzerAktion(); setzeStabPosition(zustand.stab.x, zustand.stab.y - 5); aktualisiere(true); break;
        case 'a': case 'A':
          nutzerAktion(); setzeStabPosition(zustand.stab.x - 5, zustand.stab.y); aktualisiere(true); break;
        case 'd': case 'D':
          nutzerAktion(); setzeStabPosition(zustand.stab.x + 5, zustand.stab.y); aktualisiere(true); break;
        case '+': case '=':
          nutzerAktion(); stabsHoehe(5); break;
        case '-': case '_':
          nutzerAktion(); stabsHoehe(-5); break;
        case 'h': case 'H':
          nutzerAktion(); aktualisiere(true); break;
        case '1':
          nutzerAktion(); setzeAufgabe('aufgabe-1', true); break;
        case '2':
          nutzerAktion(); setzeAufgabe('aufgabe-2', true); break;
        case '3':
          nutzerAktion(); setzeAufgabe('aufgabe-3', true); break;
        case 'r': case 'R':
          nutzerAktion(); allesZuruecksetzen(); break;
        default:
          benutzt = false;
      }
      if (benutzt) ev.preventDefault();
    });
  }

  /* ================= Einstellungen und Speicher ================= */
  function speichereEinstellungen() {
    S.merke('ort', { latDeg: zustand.ort.latDeg, lonDeg: zustand.ort.lonDeg, tzId: zustand.ort.tzId });
    S.merke('aufgabe', zustand.aufgabe);
    S.merke('geschwindigkeit', zustand.geschwindigkeit);
    ['aufgabe-1', 'aufgabe-2', 'aufgabe-3'].forEach(function (id) {
      S.merke('geloest-' + id, zustand.geloest[id] === true);
    });
    speicherStatusZeichnen(false);
  }

  function ladeEinstellungen() {
    var o = S.hole('ort', null);
    if (o && isFinite(o.latDeg) && isFinite(o.lonDeg) && typeof o.tzId === 'string') {
      zustand.ort = {
        latDeg: Math.max(5, Math.min(85, o.latDeg)),
        lonDeg: o.lonDeg, tzId: o.tzId,
        label: o.latDeg + '° N / ' + o.lonDeg + '° E, ' + o.tzId
      };
    }
    zustand.geschwindigkeit = S.hole('geschwindigkeit', zustand.geschwindigkeit);
    ['aufgabe-1', 'aufgabe-2', 'aufgabe-3'].forEach(function (id) {
      zustand.geloest[id] = S.hole('geloest-' + id, false) === true;
    });
    var a = S.hole('aufgabe', 'aufgabe-1');
    zustand.aufgabe = T.byId(a) ? a : 'aufgabe-1';
  }

  function speicherStatusZeichnen(mitProbe) {
    var info = S.info();
    var p = mitProbe ? S.probe() : null;
    var txt = p ? p.text + ' ' : '';
    txt += 'Zustand: ' + info.modus + '. ' + info.beschriftung +
      (info.letzterFehler ? ' Letzte Ausnahme: ' + info.letzterFehler : '');
    setText('speicher-status', txt);
    el('speicher-status').className = 'hinweis' + (p ? (p.ok ? ' gut' : '') : '');
  }

  /* ================= Reset ================= */
  function allesZuruecksetzen() {
    if (timer) { root.clearInterval(timer); timer = null; }
    var alt = zustand.aufgabe;
    zustand = frischerZustand();
    zustand.aufgabe = alt;                 // setzeAufgabe unten stellt selbst um
    el('ort-breite').value = DEMO.latDeg.toFixed(2);
    el('ort-laenge').value = DEMO.lonDeg.toFixed(2);
    el('ort-tz').value = DEMO.tzId;
    el('stab-hoehe').value = String(zustand.stab.h);
    setText('stab-hoehe-wert', zustand.stab.h + ' cm');
    el('sim-geschwindigkeit').value = String(zustand.geschwindigkeit);
    E.clearDayCache();
    setzeModus('live');
    setzeAufgabe('aufgabe-1', false);
    setzeLaufKnopf();
    speichereEinstellungen();
    aktualisiere(false);
  }

  /* ================= Verdrahtung ================= */
  function bindeSteuerung() {
    el('ort-uebernehmen').addEventListener('click', function () { nutzerAktion(); ortUebernehmen(); });
    el('ort-demo').addEventListener('click', function () {
      el('ort-breite').value = DEMO.latDeg.toFixed(2);
      el('ort-laenge').value = DEMO.lonDeg.toFixed(2);
      el('ort-tz').value = DEMO.tzId;
      nutzerAktion(); ortUebernehmen();
    });
    ['ort-breite', 'ort-laenge', 'ort-tz'].forEach(function (id) {
      el(id).addEventListener('change', function () { nutzerAktion(); ortUebernehmen(); });
    });

    el('modus-live').addEventListener('click', function () { nutzerAktion(); setzeModus('live'); aktualisiere(false); });
    el('modus-sim').addEventListener('click', function () { nutzerAktion(); setzeModus('sim'); aktualisiere(false); });

    el('sim-play').addEventListener('click', function () { nutzerAktion(); starteStoppeSimulation(); aktualisiere(false); });
    el('sim-geschwindigkeit').addEventListener('change', function () {
      zustand.geschwindigkeit = parseInt(el('sim-geschwindigkeit').value, 10) || 900;
      nutzerAktion(); speichereEinstellungen();
    });
    el('sim-datum').addEventListener('change', function () {
      nutzerAktion();
      if (setzeSimAusFeldern()) aktualisiere(true);
    });
    el('sim-zeit').addEventListener('change', function () {
      nutzerAktion();
      if (setzeSimAusFeldern()) aktualisiere(true);
    });
    el('zeitskala').addEventListener('input', function () {
      var p = E.localParts(zustand.simUtcMs, zustand.ort.tzId);
      var mitte = parseInt(el('zeitskala').value, 10);
      zustand.simUtcMs = E.localMidnightUtcMs(zustand.simUtcMs, zustand.ort.tzId) + mitte * 60000;
      el('sim-zeit').value = pad2(Math.floor(mitte / 60)) + ':' + pad2(mitte % 60);
      el('sim-datum').value = p.jahr + '-' + pad2(p.monat) + '-' + pad2(p.tag);
      nutzerAktion();
      aktualisiere(false);      // waehrend des Ziehens nur Vorschau
    });
    // Beim Loslassen wird gewertet. So kann ein Erfolg nicht mitten im
    // Ziehen einrasten, und trotzdem zaehlt jede Bedienung als Nutzeraktion.
    el('zeitskala').addEventListener('change', function () { aktualisiere(true); });

    el('stab-hoehe').addEventListener('input', function () {
      zustand.stab.h = parseInt(el('stab-hoehe').value, 10);
      setText('stab-hoehe-wert', zustand.stab.h + ' cm');
      nutzerAktion();
      aktualisiere(false);
    });
    el('stab-hoehe').addEventListener('change', function () { aktualisiere(true); });

    T.TASKS.forEach(function (t) {
      el('task-btn-' + t.nr).addEventListener('click', function () { nutzerAktion(); setzeAufgabe(t.id, true); });
    });
    el('task-pruefen').addEventListener('click', function () { nutzerAktion(); aktualisiere(true); });
    el('task-zuruecksetzen').addEventListener('click', function () {
      zustand.geloest[zustand.aufgabe] = false;
      S.merke('geloest-' + zustand.aufgabe, false);
      var e = el('task-ergebnis');
      e.className = 'ergebnis';
      e.textContent = '–';
      nutzerAktion(); aktualisiere(false);
    });

    el('reset-alles').addEventListener('click', function () { nutzerAktion(); allesZuruecksetzen(); });
    el('reset-einstellungen').addEventListener('click', function () {
      var ok = S.alleAufraeumen();
      setText('speicher-status', (ok
        ? 'Einstellungen gelöscht. Der Spielzustand ist davon nicht betroffen. '
        : 'Löschen nicht möglich — der Speicher verweigert den Zugriff. Der Spielzustand ist davon nicht betroffen. ') +
        S.info().beschriftung);
    });
    el('speicher-test').addEventListener('click', function () { speicherStatusZeichnen(true); });
    el('speicher-blockieren').addEventListener('change', function (ev) {
      S.setModusBlockiert(!!ev.target.checked);
      speicherStatusZeichnen(true);
    });
  }

  /* ================= Start ================= */
  function los() {
    try {
      zustand = frischerZustand();
      ladeEinstellungen();

      el('ort-breite').value = zustand.ort.latDeg.toFixed(2);
      el('ort-laenge').value = zustand.ort.lonDeg.toFixed(2);
      el('ort-tz').value = zustand.ort.tzId;
      el('stab-hoehe').value = String(zustand.stab.h);
      setText('stab-hoehe-wert', zustand.stab.h + ' cm');
      el('sim-geschwindigkeit').value = String(zustand.geschwindigkeit);

      bindeSteuerung();
      bindeSzene();
      bindeTastatur();
      setzeModus('live');
      setzeAufgabe(zustand.aufgabe, false);

      var st = E.status();
      setText('engine-status', st.text);
      setText('fuss-engine', 'Rechenweg: ' + st.text +
        ' Benutzter Vertrag: solar.computeState({utcMs, latDeg, lonDeg, tzId}) · ' +
        'shadow.projectShadow({px, py, pz, sx, sy, sz}) · solar.projectAt(state, {x, y, z}).');

      speicherStatusZeichnen(true);
      aktualisiere(false);

      // Live-Modus: die echte Uhr. Sie stellt keinen Erfolg selbst ein.
      root.setInterval(function () {
        if (zustand.modus === 'live') aktualisiere(false);
      }, 1000);
    } catch (err) {
      setText('engine-status', 'Startfehler: ' + (err && err.message ? err.message : err));
      if (root.console && root.console.error) root.console.error(err);
    }
  }

  /* Pruefhilfe fuer die Browser-Abnahme. Aendert keinen Spielzustand. */
  root.SWApp = {
    zustand: function () { return zustand; },
    sonnenstatus: function () { return zustand ? zustand.solar : null; },
    messlage: messlage,
    tageslauf: function () { return tagesLauf; },
    pruefeAufgabe: function (id) {
      var task = T.byId(id || (zustand && zustand.aufgabe));
      return task ? task.pruefe(messlage()) : null;
    },
    setzeStab: function (x, y, h) {
      if (typeof x === 'number' && typeof y === 'number') setzeStabPosition(x, y);
      if (typeof h === 'number') {
        zustand.stab.h = Math.max(20, Math.min(220, h));
        el('stab-hoehe').value = String(zustand.stab.h);
        setText('stab-hoehe-wert', zustand.stab.h + ' cm');
      }
      aktualisiere(false);
    },
    setzeOrt: function (latDeg, lonDeg, tzId) {
      if (typeof latDeg === 'number') zustand.ort.latDeg = latDeg;
      if (typeof lonDeg === 'number') zustand.ort.lonDeg = lonDeg;
      if (tzId) zustand.ort.tzId = tzId;
      E.clearDayCache();
      aktualisiere(false);
    },
    setzeZeit: function (utcMs) {
      setzeModus('sim');
      zustand.simUtcMs = utcMs;
      setzeSimFelder();
      aktualisiere(false);
    },
    speicherProbe: function () { return S.probe(); },
    speicherInfo: function () { return S.info(); },
    speicherBlockieren: function (an) { S.setModusBlockiert(!!an); },
    nutzeraktionen: function () { return userActions; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', los);
  } else {
    los();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);