/*!
 * Schattenwerkstatt — Einstellungs-Speicher (Besitz A1)
 * =====================================================================
 * localStorage wird ausschliesslich fuer EINSTELLUNGEN benutzt
 * (Ortswahl, Layout, zuletzt gewaehlte Aufgabe). Nie fuer Spielstand.
 *
 * JEDER Zugriff laeuft durch try/catch. Es gibt drei dokumentierte Zustaende:
 *   'persistent'  - localStorage vorhanden, Lesen und Schreiben klappt
 *   'nurLesen'    - Lesen klappt, Schreiben wirft (z. B. privater Modus)
 *   'blockiert'   - localStorage fehlt oder wirft beim Zugriff
 *   'ersatz'      - Testpunkt: simuliert blockiert, Bild im Arbeitsspeicher
 * In allen vier Zustaenden laeuft die App weiter. Es gibt keinen Pfad,
 * auf dem ein Speicherfehler den Spielbetrieb anhaelt.
 *
 * TESTPUNKT (kein blosses Versprechen):
 * In der Oberflaege sichtbar als Kontrollkaestchen
 * "Speicherzugriff simuliert blockiert" (id: speicher-blockieren) und als
 * Schaltflaeche "Speicher pruefen" (id: speicher-test). Der Testpunkt
 * schaltet intern auf 'ersatz' um, in dem jeder Zugriff absichtlich eine
 * Ausnahme wirft — die App muss danach bedienbar bleiben. Ergebnis steht
 * danach im Element id="speicher-status".
 * =====================================================================
 */
(function (root) {
  'use strict';

  var KEY = 'schattenwerkstatt.einstellungen.v1';
  var ersatzSpeicher = {};
  var modus = 'persistent';
  var letzterFehler = null;

  function roherZugriff() {
    // Absichtlicher Zugriff, um Verfuegbarkeit zu pruefen. Wirft z. B.
    // in someiten Browserkontexten, in getrennten Profilen oder bei
    // blockierten Third-Party-Speichern.
    if (!root.localStorage) throw new Error('localStorage ist nicht vorhanden');
    return root.localStorage;
  }

  function setModusBlockiert(an) {
    modus = an ? 'ersatz' : 'unbekannt';
    if (!an) modus = 'persistent';
    if (an) { ersatzSpeicher = {}; letzterFehler = null; }
  }

  function lesen() {
    if (modus === 'ersatz') throw new Error('Testpunkt: Speicherzugriff absichtlich blockiert');
    var ls = roherZugriff();
    var roh = ls.getItem(KEY);            // <- kann werfen
    if (roh === null) return null;
    return JSON.parse(roh);               // <- kann bei kaputten Daten werfen
  }

  function schreiben(objekt) {
    if (modus === 'ersatz') throw new Error('Testpunkt: Speicherzugriff absichtlich blockiert');
    var ls = roherZugriff();
    ls.setItem(KEY, JSON.stringify(objekt));   // <- kann werfen
  }

  function loeschen() {
    if (modus === 'ersatz') throw new Error('Testpunkt: Speicherzugriff absichtig blockiert');
    var ls = roherZugriff();
    ls.removeItem(KEY);
  }

  // Der Testpunkt-Zustand 'ersatz' darf nicht durch 'blockiert' ueberschrieben
  // werden, sonst verliert die Oberflaeche die Erkenntnis, dass absichtlich
  // blockiert wurde.
  function setzeFehlerModus() {
    if (modus !== 'ersatz') modus = 'blockiert';
  }

  function hole(name, standard) {
    var alle, wert;
    try {
      alle = lesen();
    } catch (e) {
      setzeFehlerModus();
      letzterFehler = e;
      return standard;
    }
    if (!alle || typeof alle !== 'object') return standard;
    wert = alle[name];
    return (wert === undefined || wert === null) ? standard : wert;
  }

  function merke(name, wert) {
    var alle;
    try {
      alle = lesen() || {};
    } catch (e) {
      setzeFehlerModus();
      letzterFehler = e;
      return false;
    }
    alle[name] = wert;
    try {
      schreiben(alle);
      if (modus === 'unbekannt') modus = 'persistent';
      return true;
    } catch (e2) {
      modus = 'nurLesen';
      letzterFehler = e2;
      return false;
    }
  }

  function alleAufraeumen() {
    try {
      loeschen();
      return true;
    } catch (e) {
      letzterFehler = e;
      return false;
    }
  }

  /**
   * Dokumentierter Testpunkt. Schreibt einen Wert, liest ihn zurueck und
   * meldet das Ergebnis — inklusive der echten Ausnahme, falls eine
   * auftritt. Wirft selbst NIE.
   */
  function probe() {
    var wert = 'probe-' + modus + '-1';
    var schritt, zurueck;
    try {
      schritt = 'Schreiben';
      var probeObj = { __probe: wert };
      var vorher = lesen() || {};
      vorher.__probe = wert;
      schreiben(vorher);
      zurueck = 'Schreiben ok';
    } catch (e) {
      return {
        ok: false,
        modus: modus,
        fehler: String(e && e.message ? e.message : e),
        schritt: schritt,
        text: 'Schreiben fehlgeschlagen: ' + String(e && e.message ? e.message : e) +
          ' — die App arbeitet ohne Speicher weiter.'
      };
    }
    try {
      schritt = 'Lesen';
      var daten = lesen();
      var ok = !!daten && daten.__probe === wert;
      if (ok) {
        try { loeschen(); } catch (e3) { /* Aufraeumen ist optional */ }
      }
      if (ok && modus === 'unbekannt') modus = 'persistent';
      return {
        ok: ok,
        modus: modus,
        schritt: schritt,
        fehler: null,
        text: ok
          ? 'Speicher lesbar und beschreibbar (' + modus + ').'
          : 'Lesen lieferte nicht den geschriebenen Wert.'
      };
    } catch (e2) {
      return {
        ok: false,
        modus: modus,
        schritt: schritt,
        fehler: String(e2 && e2.message ? e2.message : e2),
        text: 'Lesen fehlgeschlagen: ' + String(e2 && e2.message ? e2.message : e2) +
          ' — die App arbeitet ohne Speicher weiter.'
      };
    }
  }

  function info() {
    var beschriftung = {
      persistent: 'Einstellungen werden dauerhaft gespeichert.',
      nurLesen: 'Speicher nur lesbar — Einstellungen gelten nur fuer diese Sitzung.',
      blockiert: 'localStorage nicht verfuegbar — Einstellungen gelten nur fuer diese Sitzung.',
      ersatz: 'Testpunkt aktiv: Speicher absichtlich blockiert — App laeuft ohne Speicher.',
      unbekannt: 'Speicherzustand unbekannt.'
    };
    return {
      modus: modus,
      key: KEY,
      beschriftung: beschriftung[modus] || beschriftung.unbekannt,
      letzterFehler: letzterFehler ? String(letzterFehler.message || letzterFehler) : null
    };
  }

  var API = {
    KEY: KEY,
    hole: hole,
    merke: merke,
    alleAufraeumen: alleAufraeumen,
    probe: probe,
    info: info,
    setModusBlockiert: setModusBlockiert,
    lesen: lesen,
    schreiben: schreiben
  };

  root.SWStore = API;
  if (typeof module === 'object' && module && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);