/*!
 * Schattenwerkstatt — Die drei Aufgaben (Besitz A1)
 * =====================================================================
 * Reines Rechenmodul: kein DOM, kein localStorage, kein Datum. Lauffaehig
 * unter Node (require) und im Browser (window.SWTasks). Genau darum prueft
 * tests/ui/ui-contract.test.js die Aufgaben auch inhaltlich, nicht nur
 * ueber Textsuche.
 *
 * ERFOLGSREGEL, verbindlich fuer alle drei Aufgaben:
 *   Der Erfolg wird AUSSCHLIESSLICH aus der Rechnung abgeleitet — gemessen
 *   an der Geometrie des Schattens bzw. an der Tagesrechnung. Es gibt
 *   keinen Knopf "fertig" und keinen Erfolg ohne Nutzeraktion: `pruefe()`
 *   wird nur aus einem echten Bedienereignis aufgerufen. Die laufende Uhr
 *   im Live-Modus aktualisiert nur `bedingtErfuellt` (Vorschau) und
 *   stellt den Erfolg nicht selbst ein.
 *
 * Szenene-Massstab: 1 Einheit (unit) = 1 cm. Markenradius MARK_R = 78 cm.
 * Azimut 0 = Nord = 12-Uhr-Marke, 90 = Ost = 3, 180 = Sued = 6, 270 = West = 9.
 * =====================================================================
 */
(function (root) {
  'use strict';

  var MARK_R = 78;          // Radius der Stundenmarken in cm
  var TOL = 5;              // Erfolgstoleranz in cm
  var ZEIT_TOL_MS = 2 * 60000;   // Aufgaben 2: +/- 2 Minuten
  var TAGES_MIN_HOEHE = 3;  // Aufgaben 2: nur Sonne ueber 3 Grad, sonst
                             // waechst der Schatten am Horizont gegen unendlich

  function markePunkt(nr) {
    // Stundenring: 12 Marken zu je 30 Grad. 12 = 0 Grad = Norden,
    // 3 = 90 Grad = Osten, 6 = 180 Grad = Sueden, 9 = 270 Grad = Westen.
    var az = (nr - 12) * 30;
    var r = az * Math.PI / 180;
    return { nr: nr, azimuthDeg: az, x: MARK_R * Math.sin(r), y: MARK_R * Math.cos(r) };
  }

  function abstand(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function zahl(w, n) {
    return (Math.round(w * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n).replace('.', ',');
  }

  /* ---------------------------------------------------------------- *
   * Aufgabe 1 — 12-Uhr-Marke
   * Bedingung: Sonne ueber dem Horizont UND Abweichung der Schattenspitze
   * zur 12-Marke <= TOL. Reiner Geometrievergleich, kein Schwellwert auf
   * irgendeiner Anzeige.
   * ---------------------------------------------------------------- */
  var a1 = {
    id: 'aufgabe-1',
    nr: 1,
    titel: 'Schatten auf die 12-Uhr-Marke',
    kurz: 'Mittagslinie',
    auftrag: 'Stelle den Stab so, dass sein Schatten genau auf die 12-Uhr-Marke fällt. ' +
      'Die 12-Uhr-Marke zeigt nach Norden.',
    hinweis: 'Bei der Sonnenhöhe, die du gerade hast, liegt die Schattenspitze auf einem ' +
      'festen Strich durch den Stab. Verschiebe den Stab auf diesen Strich und kürze oder ' +
      'verlängere ihn, bis die Spitze die Marke trifft.',
    bedingungText: 'Abweichung der Schattenspitze zur 12-Uhr-Marke höchstens ' + TOL + ' cm.',
    toleranz: TOL,
    zielMarke: 12,
    bedingtErfuellt: function (m) {
      if (!m.isDay) return { erfuellt: false, grund: 'Nacht' };
      return { erfuellt: m.abstandZuMarke['12'] <= TOL, abstand: m.abstandZuMarke['12'] };
    },
    pruefe: function (m) {
      if (!m.isDay) {
        return { erfuellt: false, text: 'Nacht — die Sonne steht unter dem Horizont, es gibt keinen Schatten.' };
      }
      var d = m.abstandZuMarke['12'];
      return {
        erfuellt: d <= TOL,
        zahl: zahl(d, 1),
        text: d <= TOL
          ? 'Geschafft: Die Schattenspitze liegt ' + zahl(d, 1) + ' cm von der 12-Uhr-Marke entfernt (Grenze ' + TOL + ' cm).'
          : 'Noch ' + zahl(d, 1) + ' cm bis zur 12-Uhr-Marke (Grenze ' + TOL + ' cm). ' +
            (d > TOL ? 'Zu lang: Stab kürzen oder Stab nach Süden setzen.' : '')
      };
    }
  };

  /* ---------------------------------------------------------------- *
   * Aufgabe 2 — laengster Schatten des Tages
   * Bedingung: die aktuell eingestellte Zeit liegt hoechstens 2 Minuten
   * neben dem per Tagesrechnung ermittelten Zeitpunkt der kleinsten
   * Sonnenhoehe ueber 3 Grad. Der Erfolg ist damit unabhaengig von der
   * Staubenhoehe — die kann den Zeitpunkt nicht verschieben — und wird
   * trotzdem vollstaendig aus der Rechnung abgeleitet.
   * ---------------------------------------------------------------- */
  var a2 = {
    id: 'aufgabe-2',
    nr: 2,
    titel: 'Der längste Schatten des Tages',
    kurz: 'Tiefste Sonne',
    auftrag: 'Finde den Zeitpunkt, an dem der Schatten des Stabes am längsten ist. ' +
      'Gezählt wird für den ganzen Tag, solange die Sonne höher als ' + TAGES_MIN_HOEHE + ' Grad steht.',
    hinweis: 'Je tiefer die Sonne, desto länger wird der Schatten. Stelle den Zeitregler ' +
      'zuerst auf den Vormittag, dann auf den Nachmittag, und vergleiche die Länge. ' +
      'Die App rechnet den ganzen Tag durch und nennt dir den Zeitpunkt — ' +
      'du musst ihn selbst einstellen und dann H drücken.',
    bedingungText: 'Eingestellte Zeit höchstens ' + (ZEIT_TOL_MS / 60000) + ' Minuten neben dem errechneten Tiefpunkt.',
    toleranz: ZEIT_TOL_MS,
    zielMarke: null,
    tagesMinHoehe: TAGES_MIN_HOEHE,
    bedingtErfuellt: function (m) {
      if (!m.tagesTiefpunkt) return { erfuellt: false, grund: 'Tagesrechnung liegt nicht vor' };
      return { erfuellt: Math.abs(m.simUtcMs - m.tagesTiefpunkt.ms) <= ZEIT_TOL_MS };
    },
    pruefe: function (m) {
      if (!m.tagesTiefpunkt) {
        return { erfuellt: false, text: 'Die Tagesrechnung liegt für diesen Ort und Tag nicht vor — Aufgabenort oder Tag wechseln.' };
      }
      var diff = m.simUtcMs - m.tagesTiefpunkt.ms;
      var ok = Math.abs(diff) <= ZEIT_TOL_MS;
      return {
        erfuellt: ok,
        zahl: zahl(Math.abs(diff) / 60000, 1),
        text: ok
          ? 'Geschafft: Du stehst ' + zahl(Math.abs(diff) / 60000, 1) + ' Minuten neben dem Tiefpunkt des Tages (' + m.tagesTiefpunkt.lokal + ' Ortszeit).'
          : (diff < 0
            ? 'Noch ' + zahl(Math.abs(diff) / 60000, 1) + ' Minuten zu früh. Der Tiefpunkt liegt bei ' + m.tagesTiefpunkt.lokal + ' Ortszeit.'
            : 'Du bist ' + zahl(Math.abs(diff) / 60000, 1) + ' Minuten zu spät. Der Tiefpunkt liegt bei ' + m.tagesTiefpunkt.lokal + ' Ortszeit.')
      };
    }
  };

  /* ---------------------------------------------------------------- *
   * Aufgabe 3 — 6-Uhr-Marke
   * Bedingung: Sonne ueber dem Horizont UND Schattenspitze <= TOL von der
   * 6-Marke. Die 6-Marke liegt im Sueden; der Schatten erreicht sie nur,
   * wenn die Sonne im Norden steht. Das ist eine echte Bedingung des
   * Projekts, kein Bedienfehler: bei 48,78 Grad N steht die Sonne nie im
   * Norden. Der Hinweis sagt das vorher und nennt den Ausweg
   * (Breite unter die Sonnendeklination senken oder Sommerdatum waehlen).
   * ---------------------------------------------------------------- */
  var a3 = {
    id: 'aufgabe-3',
    nr: 3,
    titel: 'Schatten bis zur 6-Uhr-Marke',
    kurz: 'Sonnenschatten nach Süden',
    auftrag: 'Baue einen Schatten, der genau auf die 6-Uhr-Marke reicht. ' +
      'Die 6-Uhr-Marke zeigt nach Süden.',
    hinweis: 'Die Sonne muss dabei im Norden stehen, damit der Schatten nach Süden fällt. ' +
      'Das gelingt nur, wenn die Breite kleiner ist als die aktuelle Sonnendeklination. ' +
      'Bei 48,78 Grad N ist das nicht möglich — sentere die Breite oder wähle ein sommerliches Datum.',
    bedingungText: 'Abweichung der Schattenspitze zur 6-Uhr-Marke höchstens ' + TOL + ' cm, Sonne über dem Horizont.',
    toleranz: TOL,
    zielMarke: 6,
    bedingtErfuellt: function (m) {
      if (!m.isDay) return { erfuellt: false, grund: 'Nacht' };
      return { erfuellt: m.abstandZuMarke['6'] <= TOL, abstand: m.abstandZuMarke['6'] };
    },
    pruefe: function (m) {
      if (!m.isDay) {
        return { erfuellt: false, text: 'Nacht — die Sonne steht unter dem Horizont, es gibt keinen Schatten.' };
      }
      var d = m.abstandZuMarke['6'];
      if (d <= TOL) {
        return { erfuellt: true, zahl: zahl(d, 1), text: 'Geschafft: Die Schattenspitze liegt ' + zahl(d, 1) + ' cm von der 6-Uhr-Marke entfernt (Grenze ' + TOL + ' cm).' };
      }
      var zusatz = m.sechsErreichbar
        ? 'Die Sonne steht gerade nicht weit genug im Norden.'
        : 'Bei ' + zahl(m.latDeg, 2) + ' Grad N und einer Sonnendeklination von ' + zahl(m.declinationDeg, 2) +
          ' Grad ist die 6-Marke heute nicht erreichbar. Senke die Breite oder wähle ein Sommerdatum.';
      return {
        erfuellt: false,
        zahl: zahl(d, 1),
        text: 'Noch ' + zahl(d, 1) + ' cm bis zur 6-Uhr-Marke (Grenze ' + TOL + ' cm). ' + zusatz
      };
    }
  };

  var TASKS = [a1, a2, a3];

  function byId(id) {
    for (var i = 0; i < TASKS.length; i++) if (TASKS[i].id === id) return TASKS[i];
    return null;
  }

  var API = {
    TASKS: TASKS,
    byId: byId,
    markePunkt: markePunkt,
    abstand: abstand,
    MARK_R: MARK_R,
    TOL: TOL,
    ZEIT_TOL_MS: ZEIT_TOL_MS,
    TAGES_MIN_HOEHE: TAGES_MIN_HOEHE
  };

  root.SWTasks = API;
  if (typeof module === 'object' && module && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);