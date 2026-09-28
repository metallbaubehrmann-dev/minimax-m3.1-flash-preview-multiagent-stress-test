#!/usr/bin/env node
/*!
 * Schattenwerkstatt — UI-Vertragstest (Besitz A1: tests/ui/**)
 * =====================================================================
 * Lauft ohne Framework, ohne Pakete, ohne Netz:
 *     node tests/ui/ui-contract.test.js
 * Exit-Code 0 = alle Pruefungen bestanden, 1 = mindestens eine verletzt.
 *
 * Was hier wirklich geprueft wird:
 *   1) Die referenzierten Engine-Funktionen werden mit richtigem Namen UND
 *      richtiger Parameterform aufgerufen (echte Muster, keine Wortsuche).
 *   2) Kein CDN-Link, kein http(s)-Ressourcenlink, kein @import, kein fetch.
 *      Erlaubt ist ausschliesslich der XML-Namensraum der Inline-SVG.
 *   3) Keine ES-Modul-Syntax in src/ui — sie wuerde unter file:// brechen.
 *   4) Die drei Aufgaben haben ERREICHBARE, aus der Rechnung abgeleitete
 *      Erfolgsbedingungen. Teil davon ist ein echter Verhaltenstest: die
 *      Aufgabenlogik wird unter Node geladen und mit nachgebauten
 *      Messwerten geprueft (Treffer / Nichttreffer / Nacht).
 *   5) Der dokumentierte localStorage-Testpunkt ist vorhanden.
 *
 * WICHTIG: Die nachgebauten Messwerte sind bewusst synthetisch. Sie testen
 * die ERFOLGSLOGIK der Oberflaeche, nicht die Sonnenrechnung. Fuer Letzteres
 * sind die Engine-Tests des Hauptagenten zustaendig.
 * =====================================================================
 */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..', '..');
var UI = path.join(ROOT, 'src', 'ui');
var HTML = path.join(UI, 'shadow-workshop.html');

var bestanden = 0, gescheitert = 0, warnungen = 0;

function ok(name, zusatz) {
  bestanden++;
  process.stdout.write('  OK   ' + name + (zusatz ? '  (' + zusatz + ')' : '') + '\n');
}
function fail(name, grund) {
  gescheitert++;
  process.stdout.write('  FEHL ' + name + '\n         -> ' + grund + '\n');
}
function warn(name, grund) {
  warnungen++;
  process.stdout.write('  HINW ' + name + '\n         -> ' + grund + '\n');
}
function pruefe(name, bedingung, zusatz) {
  if (bedingung) ok(name, zusatz); else fail(name, 'Bedingung nicht erfuellt');
  return !!bedingung;
}
function abschnitt(t) { process.stdout.write('\n' + t + '\n'); }

function lesen(p) { return fs.readFileSync(p, 'utf8'); }

function listeDateien(dir) {
  var r = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(dir, e.name);
    if (e.isDirectory()) r = r.concat(listeDateien(p));
    else if (/\.(js|html|css)$/.test(e.name)) r.push(p);
  });
  return r.sort();
}

/**
 * Entfernt Kommentare OHNE die Beute in String-Literalen zu zerstoeren.
 * Zustandsautomat ueber Zeichen: Code, //, /* * /, <!-- -->, ', ", `.
 * Wichtig, weil Quelltexte selbst "file://" und "//"-aehnliches enthalten.
 * HTML-Kommentare muessen mit entfernt werden: sonst wuerden die
 * Erklaerungstexte im Kopf des HTML (die ausdruecklich CDN, fetch und
 * url(http) ERWAHNEN) als Verstoesse gegen die Regeln gewertet.
 */
function ohneKommentare(src) {
  var out = '', i = 0, n = src.length, state = 'code';
  while (i < n) {
    var c = src[i], d = src[i + 1];
    if (state === 'code') {
      if (c === '/' && d === '/') { state = 'line'; i += 2; continue; }
      if (c === '/' && d === '*') { state = 'block'; i += 2; continue; }
      if (c === '<' && d === '!' && src.substr(i + 2, 2) === '--') { state = 'html'; i += 4; continue; }
      if (c === "'") { state = 'sq'; out += c; i++; continue; }
      if (c === '"') { state = 'dq'; out += c; i++; continue; }
      if (c === '`') { state = 'bq'; out += c; i++; continue; }
      out += c; i++; continue;
    }
    if (state === 'line') {
      if (c === '\n') { state = 'code'; out += '\n'; }
      i++; continue;
    }
    if (state === 'block') {
      if (c === '*' && d === '/') { state = 'code'; i += 2; continue; }
      if (c === '\n') out += '\n';
      i++; continue;
    }
    if (state === 'html') {
      if (c === '-' && d === '-' && src[i + 2] === '>') { state = 'code'; i += 3; continue; }
      if (c === '\n') out += '\n';
      i++; continue;
    }
    // Stringzustand
    if (c === '\\') { out += src.substr(i, 2); i += 2; continue; }
    if ((state === 'sq' && c === "'") || (state === 'dq' && c === '"') ||
        (state === 'bq' && c === '`')) { state = 'code'; out += c; i++; continue; }
    out += c; i++;
  }
  return out;
}

var erwartet = ['engine-adapter.js', 'storage.js', 'tasks.js', 'app.js', 'styles.css', 'shadow-workshop.html'];
var dateien = listeDateien(UI);

process.stdout.write('Schattenwerkstatt — UI-Vertragstest\n');
process.stdout.write('UI-Verzeichnis: ' + UI + '\n');

/* ================================================================= */
abschnitt('1) Dateien');
erwartet.forEach(function (f) {
  pruefe('vorhanden: src/ui/' + f, fs.existsSync(path.join(UI, f)));
});
if (gescheitert > 0) {
  process.stdout.write('\nAbbruch: Pflichtdateien fehlen, weitere Pruefungen sind sinnlos.\n');
  process.exit(1);
}
var html = lesen(HTML);
var htmlCode = ohneKommentare(html);
var gesamtCode = dateien.map(function (f) { return ohneKommentare(lesen(f)); }).join('\n');
var adapter = ohneKommentare(lesen(path.join(UI, 'engine-adapter.js')));
var appCode = ohneKommentare(lesen(path.join(UI, 'app.js')));

/* ================================================================= */
abschnitt('2) Engine-Vertrag: Name und Parameterform');

pruefe('solar.computeState({ utcMs, latDeg, lonDeg, tzId }) aufgerufen',
  /\.solar\.computeState\(\s*\{\s*utcMs\s*:[^}]*latDeg\s*:[^}]*lonDeg\s*:[^}]*tzId\s*:[^}]*\}\s*\)/.test(adapter),
  'Muster: solar.computeState({ utcMs: …, latDeg: …, lonDeg: …, tzId: … })');

pruefe('shadow.projectShadow({ px, py, pz, sx, sy, sz }) aufgerufen',
  /\.shadow\.projectShadow\(\s*\{\s*px\s*:[^}]*py\s*:[^}]*pz\s*:[^}]*sx\s*:[^}]*sy\s*:[^}]*sz\s*:[^}]*\}\s*\)/.test(adapter),
  'Muster: shadow.projectShadow({ px: …, py: …, pz: …, sx: …, sy: …, sz: … })');

pruefe('solar.projectAt(state, { x, y, z }) aufgerufen',
  /\.solar\.projectAt\(\s*[A-Za-z_$][\w$]*\s*,\s*\{\s*x\s*:[^}]*y\s*:[^}]*z\s*:[^}]*\}\s*\)/.test(adapter),
  'Muster: solar.projectAt(state, { x: …, y: …, z: … })');

pruefe('Oberflaeche fragt den Sonnenstand ueber den Adapter ab',
  /SWEngine/.test(appCode) && /(E|root\.SWEngine)\.computeState\(/.test(appCode));

pruefe('Oberflaeche projiziert ueber projectAt mit (Zustand, Punkt)',
  /\.\s*projectAt\(\s*zustand\.solar\s*,\s*\{\s*x\s*:/.test(appCode));

pruefe('Schattenpolygon benutzt dieselbe SVG-Y-Abbildung wie die Spitzenmarke',
  /\(sh\.bx \+ nx\) \+ ',' \+ \(-sh\.by \+ ny\)/.test(appCode) &&
  /\(sh\.tx - nx\) \+ ',' \+ \(-sh\.ty - ny\)/.test(appCode) &&
  /cx: sh\.tx, cy: -sh\.ty/.test(appCode),
  'Regression fuer den extern gefundenen Y-Doppelinvertierungsfehler');

pruefe('TODO-ENGINE ist im Adapter sichtbar markiert',
  /TODO-ENGINE/.test(adapter) && /TODO-ENGINE/.test(lesen(path.join(UI, 'engine-adapter.js'))),
  'Ersatzrechnung ist als Entwicklungsstand gekennzeichnet, nicht getarnt');

pruefe('Adapter nennt die erwartete globale Engine-Anmeldung',
  /SW_ENGINE/.test(adapter) && /root\[ENGINE_CANDIDATES\[i\]\]/.test(adapter),
  'SW_ENGINE zuerst, danach weitere Fenster-Namen');

pruefe('Adapter faellt dokumentiert zurueck, wenn keine Engine da ist',
  /engineUsable\(eng\)/.test(adapter) && /fallbackSolar/.test(adapter));

/* ================================================================= */
abschnitt('3) Keine externen Ressourcen');

var skriptTags = htmlCode.match(/<script\b[^>]*>/gi) || [];
var externeSkripte = skriptTags.filter(function (t) {
  return /\bsrc\s*=\s*["']?(?:[a-z]+:)?\/\//i.test(t);
});
pruefe('kein <script> mit http(s)- oder protokollrelativer Quelle',
  externeSkripte.length === 0, externeSkripte.length + ' Treffer');

var linkTags = htmlCode.match(/<link\b[^>]*>/gi) || [];
var externeLinks = linkTags.filter(function (t) {
  return /\bhref\s*=\s*["']?(?:[a-z]+:)?\/\//i.test(t);
});
pruefe('kein <link> auf eine externe Ressource', externeLinks.length === 0, externeLinks.length + ' Treffer');

// Jede http(s)-Fundstelle im Code wird aufgelistet. Erlaubt ist ausdruecklich
// nur der XML-Namensraum fuer Inline-SVG, weil createElementNS ihn braucht.
var NS = 'http://www.w3.org/2000/svg';
var fundstellen = [];
gesamtCode.replace(/https?:\/\/[^\s'"()<>]+/g, function (m) { fundstellen.push(m); return m; });
var unerlaubt = fundstellen.filter(function (u) { return u !== NS; });
pruefe('keine http(s)-Quelle ausser dem SVG-Namensraum',
  unerlaubt.length === 0,
  'erlaubt: ' + NS + ' · gefunden: ' + (fundstellen.length ? fundstellen.join(', ') : 'keine'));

pruefe('keine CDN-Hostnamen',
  !/cdn\.|unpkg|jsdelivr|cdnjs|googleapis\.com|bootstrapcdn|cloudflare\.com\/cdn/i.test(htmlCode + gesamtCode));

// KORRIGIERT: vorher wurde die ROHE Datei geprueft, nicht der Code ohne
// Kommentare. styles.css Z.3 enthaelt im KOPFKOMMENTAR den Satz
// "KEINE externen Ressourcen: keine CDN, keine Webfonts, keine url(http)."
// — das war ein Falschpositiv des Tests, kein Verstoss gegen die Regel.
pruefe('kein @import und keine url(...) in CSS',
  !/@import/i.test(gesamtCode) && !/url\s*\(/i.test(ohneKommentare(lesen(path.join(UI, 'styles.css')))));

pruefe('kein fetch, kein XMLHttpRequest, kein WebSocket',
  !/\bfetch\s*\(/.test(gesamtCode) && !/XMLHttpRequest/.test(gesamtCode) && !/WebSocket/.test(gesamtCode),
  'Netzaufrufe wuerden unter file:// ohnehin scheitern');

pruefe('keine Webfont-Angabe',
  !/@font-face/i.test(gesamtCode) && !/font-family\s*:[^;]*(url|\.woff|\.ttf|\.otf)/i.test(gesamtCode));

/* ================================================================= */
abschnitt('4) datei://-Tauglichkeit');

var esmTreffer = [];
gesamtCode.split('\n').forEach(function (z, i) {
  if (/^\s*import\s+[\w{*]/.test(z) || /^\s*export\s+(default|const|let|var|function|class|\{)/.test(z)) {
    esmTreffer.push('Zeile ' + (i + 1) + ': ' + z.trim().slice(0, 70));
  }
});
pruefe('keine ES-Modul-Syntax in src/ui (bricht unter file:// per CORS)',
  esmTreffer.length === 0, esmTreffer.join(' | '));

pruefe('alle vier Skripte sind klassisch eingebunden',
  (function () {
    var reihenfolge = ['engine-adapter.js', 'storage.js', 'tasks.js', 'app.js'];
    var pos = -1;
    for (var i = 0; i < reihenfolge.length; i++) {
      var p = htmlCode.indexOf('"' + reihenfolge[i] + '"');
      if (p <= pos) return false;
      pos = p;
    }
    return true;
  })(), 'Reihenfolge: adapter -> storage -> tasks -> app');

pruefe('die datei://-Begruendung steht im Quelltext',
  /file:\/\//.test(lesen(path.join(UI, 'engine-adapter.js'))) &&
  /file:\/\//.test(html) &&
  /CORS/.test(lesen(path.join(UI, 'engine-adapter.js'))),
  'erklaert in Code-Kommentar und HTML-Kopf');

pruefe('Umlaute sind echte Zeichen, nicht ae/oe/ue-Ersatz',
  /[ÄÖÜäöüß]/.test(gesamtCode));

/* ================================================================= */
abschnitt('5) Die drei Aufgaben: definierte Erfolgsbedingungen');

var SWTasks = require(path.join(UI, 'tasks.js'));

pruefe('Aufgabenmodul laedt und liefert genau drei Aufgaben',
  SWTasks && Array.isArray(SWTasks.TASKS) && SWTasks.TASKS.length === 3,
  SWTasks ? SWTasks.TASKS.length + ' Aufgaben' : 'Modul lieferte nichts');

var pflichtFelder = ['id', 'nr', 'titel', 'auftrag', 'hinweis', 'bedingungText', 'pruefe', 'bedingtErfuellt', 'toleranz'];
var ids = {};
SWTasks.TASKS.forEach(function (t) {
  var fehlend = pflichtFelder.filter(function (f) {
    if (f === 'pruefe' || f === 'bedingtErfuellt') return typeof t[f] !== 'function';
    if (f === 'toleranz') return !(typeof t[f] === 'number' && t[f] > 0);
    // KORRIGIERT: 'nr' ist eine laufende ORDNUNGSZAHL (1, 2, 3), kein Textfeld.
    // Die Laengenregel "String(x).length >= 3" galt fuer nr nie und meldete
    // drei vollstaendig definierte Aufgaben als unvollstaendig.
    if (f === 'nr') return !(Number.isInteger(t[f]) && t[f] > 0);
    return !t[f] || String(t[f]).length < 3;
  });
  pruefe('Aufgabe "' + t.id + '" ist vollstaendig definiert',
    fehlend.length === 0 && !ids[t.id], fehlend.length ? 'fehlt: ' + fehlend.join(', ') : 'Nr ' + t.nr + ', Toleranz ' + t.toleranz);
  ids[t.id] = true;
});

pruefe('die drei geforderten Aufgabentexte sind vorhanden',
  /12-Uhr-Marke/i.test(SWTasks.TASKS[0].titel) &&
  /längste[nr]? Schatten des Tages/i.test(SWTasks.TASKS[1].titel) &&
  /6-Uhr-Marke/i.test(SWTasks.TASKS[2].titel),
  SWTasks.TASKS.map(function (t) { return t.nr + ') ' + t.titel; }).join(' | '));

pruefe('Marken liegen auf 12 = Norden, 3 = Osten, 6 = Sueden, 9 = Westen',
  (function () {
    var m12 = SWTasks.markePunkt(12), m3 = SWTasks.markePunkt(3);
    var m6 = SWTasks.markePunkt(6), m9 = SWTasks.markePunkt(9);
    return Math.abs(m12.x) < 1e-9 && m12.y > 0 &&
      m3.x > 0 && Math.abs(m3.y) < 1e-9 &&
      Math.abs(m6.x) < 1e-9 && m6.y < 0 &&
      m9.x < 0 && Math.abs(m9.y) < 1e-9;
  })(), 'x = Ost, y = Nord');

/* --- Verhaltenstest mit synthetischen Messwerten ------------------- */
function messung(over) {
  var m = {
    isDay: true,
    altitudeDeg: 40,
    azimuthDeg: 180,
    declinationDeg: 0,
    latDeg: 48.78,
    simUtcMs: Date.UTC(2026, 8, 28, 12, 0, 0),
    abstandZuMarke: {},
    tagesTiefpunkt: null,
    sechsErreichbar: false
  };
  var keys = Object.keys(over || {});
  for (var i = 0; i < keys.length; i++) m[keys[i]] = over[keys[i]];
  return m;
}
function abstandZu(nr, versatz) {
  var mp = SWTasks.markePunkt(nr);
  return SWTasks.abstand({ x: mp.x + versatz, y: mp.y }, mp);
}

var a1 = SWTasks.byId('aufgabe-1'), a2 = SWTasks.byId('aufgabe-2'), a3 = SWTasks.byId('aufgabe-3');

var t1treffer = a1.pruefe(messung({ abstandZuMarke: { '12': 0, '6': 200 } }));
var t1nicht = a1.pruefe(messung({ abstandZuMarke: { '12': 40, '6': 200 } }));
pruefe('Aufgabe 1: Treffer loest aus, 40 cm daneben nicht',
  t1treffer.erfuellt === true && t1nicht.erfuellt === false,
  'Treffer: "' + t1treffer.text.slice(0, 40) + '…"');
pruefe('Aufgabe 1: Toleranzgrenze liegt bei ' + SWTasks.TOL + ' cm',
  abstandZu(12, 0) === 0 && Math.abs(abstandZu(12, SWTasks.TOL) - SWTasks.TOL) < 1e-9);

// KORRIGIERT: der Test stellte den Tiefpunkt auf 06:30, liess simUtcMs aber
// auf dem Vorgabewert 12:00 stehen. Damit betrug der Abstand 5 h 30 min und
// selbst der "Treffer"-Fall blieb unerfuellt — der Aufbau ueberlebte sich
// selbst nicht. Jetzt ist simUtcMs = tp (Treffer) bzw. 10 min daneben.
var tp = Date.UTC(2026, 8, 28, 6, 30, 0);
var t2treffer = a2.pruefe(messung({ simUtcMs: tp, tagesTiefpunkt: { ms: tp, altDeg: 5, lokal: '06:30 Uhr', laengeUnits: 100 } }));
var t2nicht = a2.pruefe(messung({ simUtcMs: tp, tagesTiefpunkt: { ms: tp - 10 * 60000, altDeg: 5, lokal: '06:20 Uhr', laengeUnits: 100 } }));
pruefe('Aufgabe 2: exakter Tiefpunkt loest aus, 10 Minuten daneben nicht',
  t2treffer.erfuellt === true && t2nicht.erfuellt === false,
  '2-Minuten-Fenster, Abstand im Trefferfall: ' + t2treffer.zahl + ' min');

var t3treffer = a3.pruefe(messung({ abstandZuMarke: { '12': 200, '6': 1 }, sechsErreichbar: true }));
var t3nicht = a3.pruefe(messung({ abstandZuMarke: { '12': 200, '6': 80 }, sechsErreichbar: false }));
pruefe('Aufgabe 3: 1 cm neben der 6-Marke loest aus, 80 cm daneben nicht',
  t3treffer.erfuellt === true && t3nicht.erfuellt === false);
pruefe('Aufgabe 3: nennt den Grund, wenn die 6-Marke breitenbedingt unerreichbar ist',
  /Breite/.test(t3nicht.text) && /Sonnendeklination/.test(t3nicht.text));

var nacht = { isDay: false, abstandZuMarke: { '12': 0, '6': 0 }, tagesTiefpunkt: null };
pruefe('nachts ist KEINE Aufgabe loesbar, auch nicht mit perfektem Abstand',
  a1.pruefe(nacht).erfuellt === false && a2.pruefe(nacht).erfuellt === false && a3.pruefe(nacht).erfuellt === false,
  'Pflicht: bei Sonne unter dem Horizont kein Erfolg');

var ohneTag = a2.pruefe(messung({ tagesTiefpunkt: null }));
pruefe('Aufgabe 2 verweigert den Erfolg ohne Tagesrechnung',
  ohneTag.erfuellt === false && /nicht vor/.test(ohneTag.text));

pruefe('alle drei Aufgaben melden ihre Bedingung im Klartext',
  SWTasks.TASKS.every(function (t) { return t.bedingungText.length > 15; }));

/* ================================================================= */
abschnitt('6) Kein Erfolg ohne Nutzeraktion');

pruefe('bewertet() verlangt fuer einen Erfolg ein wahres Nutzerereignis',
  /function bewertet\(istNutzeraktion\)/.test(appCode) &&
  /if \(!istNutzeraktion\) \{/.test(appCode) &&
  /zustand\.geloest\[task\.id\] = true/.test(appCode));

pruefe('die laufende Uhr ruft aktualisiere ohne Nutzeraktion',
  (function () {
    var ticks = appCode.match(/setInterval\([\s\S]{0,900}?\},\s*\d+\s*\)/g) || [];
    if (ticks.length < 2) return false;             // verhindert Leeres-Passieren
    return ticks.every(function (t) {
      return /aktualisiere\(false\)/.test(t) && !/aktualisiere\(true\)/.test(t);
    });
  })(), 'beide Timer (Simulation und Live) uebergeben false');

pruefe('es gibt einen Bedienweg, der mit aktualisiere(true) wertet',
  (appCode.match(/aktualisiere\(true\)/g) || []).length >= 8,
  (appCode.match(/aktualisiere\(true\)/g) || []).length + ' Aufrufstellen');

pruefe('es gibt keinen Knopf, der Erfolg ohne Rechnung setzt',
  !/id="task-fertig"/.test(htmlCode) && !/data-task="fertig"/.test(htmlCode));

/* ================================================================= */
abschnitt('7) localStorage: Ausnahme darf die App nicht zerbrechen');

var storageCode = lesen(path.join(UI, 'storage.js'));
pruefe('localStorage-Zugriffe sind strukturell von try/catch umgeben',
  (function () {
    var treffer = storageCode.match(/localStorage|\.getItem\(|\.setItem\(|\.removeItem\(/g) || [];
    var tryAnzahl = (storageCode.match(/\btry\s*\{/g) || []).length;
    var catchAnzahl = (storageCode.match(/\bcatch\s*\(/g) || []).length;
    return treffer.length > 0 && tryAnzahl >= treffer.length / 2 && catchAnzahl >= 3;
  })(), (storageCode.match(/\btry\s*\{/g) || []).length + ' try / ' +
  (storageCode.match(/\bcatch\s*\(/g) || []).length + ' catch — nur Struktur, siehe Verhaltenstest unten');

pruefe('die Schnittstelle merke() gibt bei Fehler false statt zu werfen',
  /return false;/.test(storageCode) && /modus = 'blockiert'/.test(storageCode));
pruefe('probe() wirft selbst nie, sondern meldet die Ausnahme',
  /function probe\(\)/.test(storageCode) && /fehler:/.test(storageCode) &&
  /function setzeFehlerModus\(\)/.test(storageCode),
  'der Testpunkt-Zustand bleibt sichtbar');

/* --- Verhaltenstest des Speichers unter Node ---------------------- *
 * storage.js laesst sich unter Node laden. Es werden drei Fehlerlagen
 * ERZEUGT und geprueft, dass keine davon eine Ausnahme nach aussen
 * durchlässt. Das ist der Beleg fuer Anforderung 12 — kein Versprechen.
 * ------------------------------------------------------------------ */
var SWStore = require(path.join(UI, 'storage.js'));

// KORRIGIERT: vorher stand hier ein ungeschuetztes
//     var originalLS = globalThis.localStorage;
// VOR dem try-Block und vor jeder Testvorbereitung. Neuere Node-Versionen
//definieren localStorage als Getter, der ohne --localstorage-file mit
//     DOMException [SecurityError]: Cannot initialize local storage ...
// wirft. Damit starb der Harness, BEVOR der zu testende Schutzcode
// (try/catch in storage.js) überhaupt erreicht wurde. Der Getter-Wurf ist
// fuer den Test dieselbe Lage wie "localStorage fehlt".
function leseLokalenSpeicher() {
  try { return globalThis.localStorage; } catch (e) { return undefined; }
}
function setzeLokalenSpeicher(wert) {
  try { globalThis.localStorage = wert; return true; } catch (e) { return false; }
}
function entferneLokalenSpeicher() {
  try { delete globalThis.localStorage; } catch (e) { /* nicht konfigurierbar */ }
}

var originalLS = leseLokalenSpeicher();
try {
  // Lage 1: localStorage fehlt vollstaendig.
  entferneLokalenSpeicher();
  var h1 = SWStore.hole('ort', 'ersatzwert');
  var m1 = SWStore.merke('ort', { latDeg: 1 });
  var p1 = SWStore.probe();
  pruefe('Lage 1 — localStorage fehlt: hole() liefert Standard, merke() false, probe() meldet',
    h1 === 'ersatzwert' && m1 === false && p1 && p1.ok === false && !!p1.fehler && !!p1.text,
    'Ausnahme: ' + (p1 && p1.fehler ? p1.fehler : '?'));
  pruefe('Lage 1 — der Zustand wird als blockiert gemeldet',
    SWStore.info().modus === 'blockiert', SWStore.info().modus);

  // Lage 2: localStorage existiert, wirft aber bei jedem Zugriff.
  setzeLokalenSpeicher({
    getItem: function () { throw new Error('SecurityError: Zugriff verweigert'); },
    setItem: function () { throw new Error('SecurityError: Zugriff verweigert'); },
    removeItem: function () { throw new Error('SecurityError: Zugriff verweigert'); }
  });
  var h2 = SWStore.hole('ort', 'ersatzwert');
  var p2 = SWStore.probe();
  pruefe('Lage 2 — localStorage wirft: nichts bricht, probe() nennt die Ausnahme',
    h2 === 'ersatzwert' && p2 && p2.ok === false && /SecurityError/.test(p2.fehler || ''),
    'Ausnahme: ' + (p2 && p2.fehler ? p2.fehler : '?'));

  // Lage 3: der dokumentierte Testpunkt — absichtlich blockiert.
  setzeLokalenSpeicher({
    getItem: function () { return null; },
    setItem: function () { return undefined; },
    removeItem: function () { return undefined; }
  });
  SWStore.setModusBlockiert(true);
  var modusNachTestpunkt = SWStore.info().modus;
  var h3 = SWStore.hole('ort', 'ersatzwert');
  var p3 = SWStore.probe();
  pruefe('Lage 3 — Testpunkt aktiv: hole() liefert Standard, probe() meldet, wirft nicht',
    h3 === 'ersatzwert' && p3 && p3.ok === false && /Testpunkt/.test(p3.fehler || '') &&
    modusNachTestpunkt === 'ersatz' && SWStore.info().modus === 'ersatz',
    'Ausnahme: ' + (p3 && p3.fehler ? p3.fehler : '?'));

  // Lage 4: alles normal — der Normalfall muss weiterhin funktionieren.
  SWStore.setModusBlockiert(false);
  var speicher = {};
  setzeLokalenSpeicher({
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(speicher, k) ? speicher[k] : null; },
    setItem: function (k, v) { speicher[k] = String(v); },
    removeItem: function (k) { delete speicher[k]; }
  });
  var ok4 = SWStore.merke('breite', 48.78) && SWStore.hole('breite', null) === 48.78;
  pruefe('Lage 4 — Normalfall: schreiben und zuruecklesen gelingt', ok4 === true);
} finally {
  if (originalLS === undefined) entferneLokalenSpeicher();
  else setzeLokalenSpeicher(originalLS);
}

pruefe('dokumentierter Testpunkt im HTML vorhanden',
  /id="speicher-blockieren"/.test(htmlCode) && /id="speicher-test"/.test(htmlCode) &&
  /id="speicher-status"/.test(htmlCode),
  'Schalter, Pruefknopf, Ausgabe');
pruefe('der Testpunkt erzeugt den Fehler wirklich, statt ihn zu behaupten',
  /setModusBlockiert/.test(storageCode) && /throw new Error/.test(storageCode));
pruefe('der Testpunkt ist auch im UI erklaert',
  /simuliert blockiert/.test(htmlCode) && /localStorage/.test(htmlCode));

/* ================================================================= */
abschnitt('8) Anforderungen an die Anzeige');

pruefe('Ortszeit, UTC und wahre Sonnenzeit sind getrennt beschriftet',
  /id="z-ortszeit"/.test(htmlCode) && /id="z-utc"/.test(htmlCode) && /id="z-wahre"/.test(htmlCode));

pruefe('Sommerzeit und Zeitgleichung werden als zwei Ursachen getrennt',
  /Sommerzeit/.test(htmlCode) && /Zeitgleichung/.test(htmlCode) &&
  /Sommerzeit ist nicht die Zeitgleichung/.test(htmlCode));

pruefe('alle geforderten Messwerte haben ein Feld',
  ['m-hoehe', 'm-azimut', 'm-datum', 'm-tageslaenge', 'm-aufgang', 'm-untergang', 'm-hoechststand']
    .every(function (id) { return htmlCode.indexOf('id="' + id + '"') > -1; }),
  'Hoehe, Azimut, Datum, Tageslaenge, Aufgang, Untergang, Hoechststand');

pruefe('Nachtzustand hat einen ausdruecklichen Hinweis',
  /id="nacht-hinweis"/.test(htmlCode) && /Nacht\./.test(htmlCode));

pruefe('Schattenbegrenzung ist sichtbar gekennzeichnet',
  /id="limit-hinweis"/.test(htmlCode) && /2,5-fache Werkstattfläche/.test(appCode) &&
  /limit: 250/.test(appCode) && /schatten-grenze/.test(lesen(path.join(UI, 'styles.css'))),
  'Grenze 250 cm = 2,5 x 100 cm Werkstattflaeche, plus Text in der Oberflaeche');

pruefe('der Azimut wird bei Instabilitaet gekennzeichnet, nicht als Sprungzahl gezeigt',
  /azimuthUnstable/.test(appCode) && /instabil — kein fester Wert/.test(appCode) &&
  /'chip instabil'/.test(appCode) && /\.chip\.instabil/.test(lesen(path.join(UI, 'styles.css'))));

pruefe('bei Nacht wird kein Schatten-Element erzeugt',
  (function () {
    // Jedes gSch.appendChild muss hinter der isDay-Bedingung liegen.
    var wache = appCode.indexOf('if (s.isDay && zustand.schatten)');
    if (wache < 0) return false;
    var ende = appCode.indexOf('/* Stab */', wache);
    var vor = appCode.slice(0, wache);
    var drin = appCode.slice(wache, ende < 0 ? undefined : ende);
    return vor.indexOf('gSch.appendChild') < 0 && drin.indexOf('gSch.appendChild') > 0;
  })(),
  'die Gruppe szene-schatten wird nur im Tag-Zweig befuellt');

pruefe('der Nachtzustand meldet sich ausdruecklich',
  /Nacht — kein Schatten gezeichnet/.test(appCode) && /nacht-hinweis/.test(appCode));

pruefe('die Aufgaben messen gegen die wahre Spitze, nicht die abgeschnittene',
  /txTrue/.test(appCode) && /txTrue/.test(appCode.slice(appCode.indexOf('function abstaendeZuMarken'))) &&
  !/abstaendeZuMarken[\s\S]{0,400}zustand\.schatten\.tx[,\s]/.test(appCode),
  'sonst wuerde ein begrenzter Schatten einen Treffer vortaeuschen');

pruefe('Reset setzt Ort, Zeit, Aufgabe und Aufbau zurueck',
  /function allesZuruecksetzen\(\)/.test(appCode) && /DEMO\.latDeg/.test(appCode) &&
  /setzeAufgabe\('aufgabe-1'/.test(appCode) && /stab: \{ x: 0, y: 0, h: 90 \}/.test(appCode));
pruefe('die Reset-Definition steht im UI',
  /Was setzt .Alles zurücksetzen. genau zurück/.test(htmlCode));

pruefe('Simulationszeit ist sichtbar gesetzt und nicht intern erzeugt',
  /id="sim-datum"/.test(htmlCode) && /id="sim-zeit"/.test(htmlCode) &&
  /id="zeitskala"/.test(htmlCode) && /Simulationszeit \(UTC\)/.test(appCode));

pruefe('Maus, Touch und Tastatur bedienen die Stabsposition',
  /pointerdown/.test(appCode) && /pointermove/.test(appCode) &&
  /addEventListener\('keydown'/.test(appCode) && /touch-action: none/.test(lesen(path.join(UI, 'styles.css'))));

pruefe('Tastenkuerzel sind im UI erklaert',
  /Tastaturkurzbefehle/.test(htmlCode) && /kbd/.test(htmlCode) && (htmlCode.match(/<kbd>/g) || []).length >= 8,
  (htmlCode.match(/<kbd>/g) || []).length + ' Tasten dokumentiert');

pruefe('Fokusringe sind sichtbar definiert',
  /:focus-visible/.test(lesen(path.join(UI, 'styles.css'))) && /outline: 3px solid/.test(lesen(path.join(UI, 'styles.css'))));

pruefe('Bedienelemente sind per Tab erreichbar und benannt',
  /<button[^>]*id="task-pruefen"/.test(htmlCode) && /aria-label=/.test(htmlCode) &&
  /role="status"/.test(htmlCode));

pruefe('schmales Mobil-Layout ist vorgesehen',
  /@media \(max-width: 620px\)/.test(lesen(path.join(UI, 'styles.css'))) &&
  /@media \(max-width: 900px\)/.test(lesen(path.join(UI, 'styles.css'))),
  '900px einspaltig, 620px Mobil');

pruefe('Sprache ist Deutsch',
  /<html lang="de">/.test(htmlCode) && /Prüfen/.test(htmlCode) && /zurücksetzen/.test(htmlCode));

pruefe('Start laeuft in einer Fehlerhuellung',
  /function los\(\)/.test(appCode) && /Startfehler/.test(appCode));

/* ================================================================= */
process.stdout.write('\n=====================================================\n');
process.stdout.write('bestanden: ' + bestanden + '   gescheitert: ' + gescheitert + '   Hinweise: ' + warnungen + '\n');
if (gescheitert > 0) {
  process.stdout.write('ERGEBNIS: FEHLGESCHLAGEN\n');
  process.exit(1);
}
process.stdout.write('ERGEBNIS: BESTANDEN (nur statischer Vertrag + Aufgabenlogik, kein Browser, keine Sonnenrechnung)\n');
process.exit(0);