/*!
 * Schattenwerkstatt — Engine-Adapter (Besitz A1: src/ui/**)
 * =====================================================================
 * ACHTUNG, datei://-REGEL (siehe auch src/ui/README.md):
 * Diese Datei ist ein KLASSISCHES Skript ohne ES-Modul-Syntax. Grund:
 * Chromium blockiert `import`/`export` unter file:// per CORS ("origin null"),
 * ein Doppelklick auf index.html wuerde also nichts laden. Klassische
 * <script src="...">-Tags funktionieren unter file:// dagegen sehr wohl.
 * Ausserdem wird hier KEIN fetch()/XHR benutzt — auch das ist unter
 * file:// verboten. Die Engine muss sich daher ueber ein globales Fenster
 * anmelden, nicht ueber einen Netzwerkabruf.
 *
 * GLOBALE ANMELDUNG, die diese Datei sucht (Reihenfolge, erste gewinnt):
 *   1) window.SW_ENGINE   <- von A2 empfohlen: { solar: {...}, shadow: {...} }
 *   2) window.SW_ENGINE_RAW
 *   3) window.SW.engine
 *   4) window.solar + window.shadow
 * Fehlt eine davon, wird `mode: 'fallback'` benutzt. Der Hauptagent sollte
 * A2 briefen, `window.SW_ENGINE` zu setzen.
 *
 * TODO-ENGINE: ALLES zwischen den Markern "TODO-ENGINE BEGINN" und
 * "TODO-ENGINE ENDE" ist Ersatzrechnung und verschwindet, sobald A2 liefert.
 * Der Ersatz ist eine NOAA-Standardrechnung (Deklination, Stundenwinkel,
 * Zeitgleichung) — kein Platzhalter und keine erfundene Zahl, aber eben
 * NICHT die Engine des Projekts.
 * =====================================================================
 */
(function (root) {
  'use strict';

  var RAD = Math.PI / 180;
  var DEG = 180 / Math.PI;
  var MIN_MS = 60000;
  var DAY_MS = 86400000;

  /* ------------------------------------------------------------------ *
   * 1) Engine entdecken
   * ------------------------------------------------------------------ */
  var ENGINE_CANDIDATES = ['SW_ENGINE', 'SW_ENGINE_RAW'];

  function pickEngine() {
    var i, raw, c;
    for (i = 0; i < ENGINE_CANDIDATES.length; i++) {
      raw = root[ENGINE_CANDIDATES[i]];
      if (raw && raw.solar && raw.shadow) {
        return { solar: raw.solar, shadow: raw.shadow, quelle: 'global:' + ENGINE_CANDIDATES[i] };
      }
    }
    if (root.SW && root.SW.engine && root.SW.engine.solar && root.SW.engine.shadow) {
      return { solar: root.SW.engine.solar, shadow: root.SW.engine.shadow, quelle: 'global:SW.engine' };
    }
    if (root.solar && root.shadow) {
      return { solar: root.solar, shadow: root.shadow, quelle: 'global:solar+shadow' };
    }
    return null;
  }

  function engineUsable(eng) {
    return !!(
      eng &&
      eng.solar &&
      typeof eng.solar.computeState === 'function' &&
      eng.shadow &&
      typeof eng.shadow.projectShadow === 'function'
    );
  }

  /* ------------------------------------------------------------------ *
   * 2) Zeitzonen-Hilfen (Intl, kein Netz, kein externes Datum)
   * ------------------------------------------------------------------ */
  var FMT_CACHE = {};
  function zoneFormatter(tzId) {
    if (!FMT_CACHE[tzId]) {
      FMT_CACHE[tzId] = new Intl.DateTimeFormat('en-US', {
        timeZone: tzId, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    }
    return FMT_CACHE[tzId];
  }

  // Lokale Wanduhr-Bestandteile fuer einen UTC-Zeitpunkt.
  function localParts(utcMs, tzId) {
    var parts, p = {}, i, asUtc;
    try {
      parts = zoneFormatter(tzId).formatToParts(new Date(utcMs));
      for (i = 0; i < parts.length; i++) p[parts[i].type] = parts[i].value;
      asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
      return {
        jahr: +p.year, monat: +p.month, tag: +p.day,
        stunde: (+p.hour) % 24, minute: +p.minute, sekunde: +p.second,
        offsetMin: Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / MIN_MS),
        ok: true
      };
    } catch (e) {
      // Bekannter Randfall: unbekannte Zeitzone. UTC-Annahme, dokumentiert.
      var d = new Date(utcMs);
      return {
        jahr: d.getUTCFullYear(), monat: d.getUTCMonth() + 1, tag: d.getUTCDate(),
        stunde: d.getUTCHours(), minute: d.getUTCMinutes(), sekunde: d.getUTCSeconds(),
        offsetMin: 0, ok: false, fehler: String(e && e.message ? e.message : e)
      };
    }
  }

  // Lokale Mitternacht des Tages, zu dem utcMs gehoert, als UTC-Ms.
  function localMidnightUtcMs(utcMs, tzId) {
    var p = localParts(utcMs, tzId);
    return Date.UTC(p.jahr, p.monat - 1, p.tag, 0, 0, 0) - p.offsetMin * MIN_MS;
  }

  function isoUtc(utcMs) {
    var d = new Date(utcMs);
    return d.toISOString().replace('.000Z', 'Z');
  }

  function isoLocal(utcMs, tzId) {
    var p = localParts(utcMs, tzId);
    var sgn = p.offsetMin < 0 ? '-' : '+';
    var a = Math.abs(p.offsetMin);
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return p.jahr + '-' + two(p.monat) + '-' + two(p.tag) + 'T' +
      two(p.stunde) + ':' + two(p.minute) + ':' + two(p.sekunde) +
      sgn + two(Math.floor(a / 60)) + ':' + two(a % 60);
  }

  /* ------------------------------------------------------------------ *
   * 3) TODO-ENGINE BEGINN — Ersatzrechnung (NOAA), solange A2 fehlt
   * ------------------------------------------------------------------ */
  function fallbackSolar(utcMs, latDeg, lonDeg, tzId) {
    var jd = utcMs / DAY_MS + 2440587.5;
    var n = jd - 2451545.0 + 0.0008;

    var L0 = mod360(280.46646 + n * (36000.76983 + n * 0.0003032));      // mittlere Laenge
    var M = 357.52911 + n * (35999.05029 - 0.0001537 * n);              // mittlere Anomalie
    var e = 0.016708634 - n * (0.000042037 + 0.0000001267 * n);         // Exzentrizitaet
    var C = Math.sin(M * RAD) * (1.914602 - n * (0.004817 + 0.000014 * n)) +
      Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * n) +
      Math.sin(3 * M * RAD) * 0.000289;                                 // Sonnengleichung
    var trueLong = L0 + C;
    var omega = 125.04 - 1934.136 * n;
    var lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD); // scheinbare Laenge
    var eps0 = 23 + (26 + (21.448 - n * (46.815 + n * (0.00059 - n * 0.001813))) / 60) / 60;
    var eps = eps0 + 0.00256 * Math.cos(omega * RAD);                   // geneigte Ekliptik

    var decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) * DEG;

    var y = Math.tan((eps / 2) * RAD);
    y *= y;
    var eot = 4 * DEG * (
      y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD)
    );                                                                  // Minuten

    var p = localParts(utcMs, tzId);
    var localMin = p.stunde * 60 + p.minute + p.sekunde / 60;
    var tst = mod1440(localMin + eot + 4 * lonDeg - p.offsetMin);        // wahre Sonnenzeit
    var H = tst / 4 - 180;                                              // Stundenwinkel
    var phi = latDeg;

    var cosZ = Math.sin(phi * RAD) * Math.sin(decl * RAD) +
      Math.cos(phi * RAD) * Math.cos(decl * RAD) * Math.cos(H * RAD);
    cosZ = Math.max(-1, Math.min(1, cosZ));
    var zen = Math.acos(cosZ) * DEG;
    var alt = 90 - zen;

    var az;
    var sinZ = Math.sin(zen * RAD);
    if (Math.abs(sinZ) < 1e-9 || Math.abs(Math.cos(phi * RAD)) < 1e-9) {
      az = 180;
    } else {
      var c = (Math.sin(phi * RAD) * cosZ - Math.sin(decl * RAD)) /
        (Math.cos(phi * RAD) * sinZ);
      c = Math.max(-1, Math.min(1, c));
      az = H > 0 ? mod360(Math.acos(c) * DEG + 180) : mod360(540 - Math.acos(c) * DEG);
    }

    return {
      altitudeDeg: alt,
      azimuthDeg: az,
      declinationDeg: decl,
      equationOfTimeMin: eot,
      trueSolarTimeMin: tst,
      localCivil: isoLocal(utcMs, tzId),
      utc: isoUtc(utcMs),
      offsetMin: p.offsetMin,
      // TODO-ENGINE: eigene Konvention, im Vertrag NICHT zugesagt. Hier:
      // Azimut gilt unter 0,5 Grad Hoehe als instabil, weil die Formel dort
      // ueber den Zenitwinkel entartet. Die echte Engine entscheidet das.
      azimuthUnstable: alt < 0.5
    };
  }

  function mod360(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function mod1440(x) { x = x % 1440; return x < 0 ? x + 1440 : x; }
  /* --------------------------- TODO-ENGINE ENDE --------------------- */

  /* ------------------------------------------------------------------ *
   * 4) Tageslauf: Aufgang, Untergang, Hoechststand, Tageslaenge
   *    Wird nur bei Bedarf gerechnet und pro (Tag,Ort) gecacht.
   * ------------------------------------------------------------------ */
  var tagesCache = {};

  function tageslauf(o) {
    var key = [o.tzId, o.latDeg, o.lonDeg, Math.floor(localMidnightUtcMs(o.utcMs, o.tzId) / DAY_MS)].join('|');
    if (tagesCache[key]) return tagesCache[key];

    var t0 = localMidnightUtcMs(o.utcMs, o.tzId);
    var steps = 1440;
    var alt = new Float64Array(steps);
    var i, ms, a, aufIdx = -1, aufMin = null, aufSign = 0, unterIdx = -1;
    var maxIdx = 0, minIdx = 0;

    // WICHTIG: hier wird bewusst roherSolarZustand() benutzt und NICHT
    // computeState(). Sonst ruft computeState -> tageslauf -> computeState
    // sich selbst endlos auf, solange der Tag noch nicht im Cache liegt.
    for (i = 0; i < steps; i++) {
      ms = t0 + i * MIN_MS;
      a = roherSolarZustand({ utcMs: ms, latDeg: o.latDeg, lonDeg: o.lonDeg, tzId: o.tzId });
      alt[i] = a.altitudeDeg;
      if (a.altitudeDeg > alt[maxIdx]) maxIdx = i;
      if (a.altitudeDeg < alt[minIdx]) minIdx = i;
      if (i > 0) {
        if (aufMin === null && alt[i - 1] < 0 && a.altitudeDeg >= 0) { aufIdx = i; aufMin = ms; aufSign = 1; }
        else if (aufMin !== null && aufSign === 1 && alt[i - 1] >= 0 && a.altitudeDeg < 0) { unterIdx = i; }
      }
    }

    var res = {
      ok: true,
      t0UtcMs: t0,
      samples: alt,
      steps: steps,
      minutenJeTag: steps,
      maxAltDeg: alt[maxIdx],
      maxAltMin: maxIdx,
      minAltDeg: alt[minIdx],
      aufgangUtcMs: aufMin,
      untergangUtcMs: unterIdx >= 0 ? t0 + unterIdx * MIN_MS : null,
      solarNoonUtcMs: t0 + maxIdx * MIN_MS,
      dayLengthMin: (aufMin !== null && unterIdx >= 0) ? (unterIdx - aufIdx) : 0,
      // Polartag/Polarnacht sauber benennen statt 0 Stunden zu melden.
      zustand: (aufMin === null)
        ? (alt[maxIdx] > 0 ? 'Polartag' : 'Polarnacht')
        : (unterIdx < 0 ? 'Polartag' : 'normal')
    };
    tagesCache[key] = res;
    // Begrenzte Historie: der Nutzer kann viele Tage durchspulen, jeder Tag
    // belegt ein Float64Array mit 1440 Werten.
    var schluessel = Object.keys(tagesCache);
    while (schluessel.length > 8) { delete tagesCache[schluessel.shift()]; }
    return res;
  }

  function clearDayCache() { tagesCache = {}; }

  /* ------------------------------------------------------------------ *
   * 5) Oeffentliche API — bindet sich an den Vertrag
   * ------------------------------------------------------------------ */
  var lastSource = 'unbekannt';

  /**
   * Roher Sonnenstand OHNE Tageslauf. Genau diese eine Funktion benutzt
   * tageslauf(), damit computeState() und tageslauf() sich nicht gegenseitig
   * aufrufen. Vertragsform auch hier: computeState({ utcMs, latDeg, lonDeg, tzId })
   */
  function roherSolarZustand(o) {
    var eng = pickEngine();
    if (engineUsable(eng)) {
      var raw = eng.solar.computeState({
        utcMs: o.utcMs, latDeg: o.latDeg, lonDeg: o.lonDeg, tzId: o.tzId
      });
      lastSource = 'engine';
      return raw || {};
    }
    lastSource = 'fallback';
    return fallbackSolar(o.utcMs, o.latDeg, o.lonDeg, o.tzId);
  }

  function computeState(o) {
    var s = normalizeState(roherSolarZustand(o), o);
    if (s.source !== 'engine') {
      var run = tageslauf(o);
      s.sunriseLocal = run.aufgangUtcMs === null ? null : isoLocal(run.aufgangUtcMs, o.tzId);
      s.sunsetLocal = run.untergangUtcMs === null ? null : isoLocal(run.untergangUtcMs, o.tzId);
      s.solarNoonLocal = isoLocal(run.solarNoonUtcMs, o.tzId);
      s.dayLengthMin = run.dayLengthMin;
      s.tagesZustand = run.zustand;
      s.source = 'fallback';
      lastSource = 'fallback';
    }
    return s;
  }

  function normalizeState(raw, o) {
    var s = raw || {};
    var run = null;
    if (s.sunriseLocal === undefined || s.sunsetLocal === undefined || s.solarNoonLocal === undefined || s.dayLengthMin === undefined) {
      run = tageslauf(o);
    }
    return {
      altitudeDeg: num(s.altitudeDeg),
      azimuthDeg: num(s.azimuthDeg),
      declinationDeg: num(s.declinationDeg),
      equationOfTimeMin: num(s.equationOfTimeMin),
      trueSolarTimeMin: num(s.trueSolarTimeMin),
      localCivil: s.localCivil || isoLocal(o.utcMs, o.tzId),
      utc: s.utc || isoUtc(o.utcMs),
      isDay: s.isDay === undefined ? num(s.altitudeDeg) > 0 : !!s.isDay,
      dayLengthMin: s.dayLengthMin === undefined ? (run ? run.dayLengthMin : 0) : num(s.dayLengthMin),
      sunriseLocal: s.sunriseLocal === undefined ? (run && run.aufgangUtcMs !== null ? isoLocal(run.aufgangUtcMs, o.tzId) : null) : s.sunriseLocal,
      sunsetLocal: s.sunsetLocal === undefined ? (run && run.untergangUtcMs !== null ? isoLocal(run.untergangUtcMs, o.tzId) : null) : s.sunsetLocal,
      solarNoonLocal: s.solarNoonLocal === undefined ? (run ? isoLocal(run.solarNoonUtcMs, o.tzId) : null) : s.solarNoonLocal,
      // Vertragsfeld, im urspruenglichen CHECKPOINT-4 nicht gelistet, im
      // Auftrag an A1 aber gefordert. Fehlt es in der Engine, gilt false.
      azimuthUnstable: !!s.azimuthUnstable,
      offsetMin: s.offsetMin === undefined ? localParts(o.utcMs, o.tzId).offsetMin : num(s.offsetMin),
      tagesZustand: s.tagesZustand || (run ? run.zustand : 'normal'),
      source: lastSource
    };
  }

  function num(v) { return typeof v === 'number' && isFinite(v) ? v : NaN; }

  // Einheitsvektor ZUR Sonne. x=Ost, y=Nord, z=oben. Azimut 0=N, 90=O.
  function sunVector(state) {
    var a = num(state.altitudeDeg) * RAD;
    var z = num(state.azimuthDeg) * RAD;
    var ch = Math.cos(a);
    return { sx: ch * Math.sin(z), sy: ch * Math.cos(z), sz: Math.sin(a) };
  }

  function projectShadow(pt) {
    var eng = pickEngine();
    if (engineUsable(eng)) {
      // Vertragsform: projectShadow({ px, py, pz, sx, sy, sz })
      var r = eng.shadow.projectShadow({
        px: pt.px, py: pt.py, pz: pt.pz, sx: pt.sx, sy: pt.sy, sz: pt.sz
      });
      if (!r) return null;
      return { x: num(r.x), y: num(r.y) };
    }
    if (!(pt.sz > 0)) return null;               // Sonne unter dem Horizont
    var t = pt.pz / pt.sz;
    return { x: pt.px - t * pt.sx, y: pt.py - t * pt.sy };
  }

  function projectAt(state, pt) {
    var eng = pickEngine();
    if (engineUsable(eng) && typeof eng.solar.projectAt === 'function') {
      // Vertragsform: projectAt(state, { x, y, z })
      var r = eng.solar.projectAt(state, { x: pt.x, y: pt.y, z: pt.z });
      if (!r) return null;
      return { x: num(r.x), y: num(r.y) };
    }
    var v = sunVector(state);
    return projectShadow({ px: pt.x, py: pt.y, pz: pt.z, sx: v.sx, sy: v.sy, sz: v.sz });
  }

  function status() {
    var eng = pickEngine();
    var ok = engineUsable(eng);
    return {
      engine: ok,
      quelle: ok ? eng.quelle : 'keine',
      letzteRechnung: lastSource,
      computeState: ok ? (eng.solar.computeState ? 'gefunden' : 'FEHLT') : 'nicht vorhanden',
      projectShadow: ok ? (eng.shadow.projectShadow ? 'gefunden' : 'FEHLT') : 'nicht vorhanden',
      projectAt: ok && typeof eng.solar.projectAt === 'function' ? 'gefunden' : 'nicht vorhanden',
      text: ok
        ? 'Engine geladen über ' + eng.quelle + '.'
        : 'TODO-ENGINE: keine Engine am Fenster. Es wird die dokumentierte Ersatzrechnung verwendet.'
    };
  }

  var API = {
    computeState: computeState,
    projectShadow: projectShadow,
    projectAt: projectAt,
    sunVector: sunVector,
    tageslauf: tageslauf,
    clearDayCache: clearDayCache,
    localParts: localParts,
    isoLocal: isoLocal,
    isoUtc: isoUtc,
    localMidnightUtcMs: localMidnightUtcMs,
    status: status,
    RAD: RAD,
    DEG: DEG
  };

  root.SWEngine = API;
  if (typeof module === 'object' && module && module.exports) module.exports = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);