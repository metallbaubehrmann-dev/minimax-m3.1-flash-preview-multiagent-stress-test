/**
 * solar.mjs — Astronomische Rechen-Engine der Sonnenuhr (reine, deterministische Funktionen).
 *
 * MODULTYP: ES-Modul (ESM, Dateiendung .mjs).
 *   Browser: <script type="module" src="src/engine/index.mjs">
 *   Node:     import { computeState } from './src/engine/solar.mjs'
 *
 * OEFFENTLICHE API
 *   computeState({utcMs, latDeg, lonDeg, tzId, horizonDeg}) -> State
 *   projectAt(state, {x,y,z}) -> {x,y,length,...} | undefined
 *   solarGeometry(utcMs), hourAngleDeg(trueSolarTimeMin), altitudeDegAt(...)
 *   SUNRISE_HORIZON_GEOMETRIC = 0, SUNRISE_HORIZON_REFRACTED = -0.833
 *
 * KOORDINATEN UND KONVENTIONEN
 *   x = Ost, y = Nord, z = oben.  Azimut: 0° = Nord, 90° = Ost, im Uhrzeigersinn.
 *
 * UMRECHNUNG ZUR NOAA-REFERENZ (Fallstrick 1, ausdruecklich dokumentiert)
 *   Die NOAA-Rechnung zaehlt Laengengrade WEST-POSITIV:
 *       lonWest(NOAA) = -lonEast(Engine)
 *   und definiert die wahre Sonnenzeit als
 *       TST(NOAA) = LST + EqT + 4*lonWest - 60*tz
 *   Wir rechnen durchgaengig in UTC-Minuten und damit OST-POSITIV:
 *       wahre Sonnenzeit = UTC + 4*lonEast + EqT
 *   Ortszeit (Zonenzeit) = UTC + 60*tz, Zone laengt lonZone = 15*tz Grad:
 *       wahre Sonnenzeit = Ortszeit + 4*(lonEast - lonZone) + EqT   (identisch, Vorgabe 5)
 *   Der Stundenwinkel H = wahreSonnenzeit/4 - 180 ist damit vorzeichenrichtig
 *   direkt verwendbar; am Vormittag (H < 0) steht die Sonne im Osten.
 *
 * AZIMUT-RECHNUNG (Konvention: ab Nord, im Uhrzeigersinn)
 *   cosA = (sin(dec) - sin(h)*sin(lat)) / (cos(h)*cos(lat));  A = acos(cosA)
 *   H > 0 (Nachmittag)  -> A = 360 - A,  damit Ost (90) und West (270) korrekt liegen.
 *   Nordhalbkugel: Sonne geht im Osten auf (A nahe 90, im Sommer knapp < 90) und
 *   im Westen unter (A nahe 270).  Bei Zenitdurchgang (Zendistanz < 2°) ist A
 *   instabil -> azimuthUnstable: true, damit die UI keine Unsinnswerte zeigt.
 *
 * ANNAHMEN (bewusst getroffen, nicht geraten)
 *   A1) Standardhorizont ist 0.0° (Sonnenmitte, geometrisch), weil die geforderten
 *       Referenzwerte (48.78 N: 21.06. ~15h55m) dazu passen und weil Taglaenge
 *       (21.06.) + Taglaenge (21.12.) dann exakt 24h ergibt. Fuer die zivile
 *       Definition horizonDeg: SUNRISE_HORIZON_REFRACTED (-0.833) verwenden,
 *       dann ca. 16h10m / 8h15m.  Beide Varianten sind derselbe Code-Pfad.
 *   A2) Sonnenhoehe wird als MITTENPUNKT der Sonne gerechnet, ohne Parallaxe und
 *       ohne Aberration. Fuer eine Sonnenuhr mit mm-Genauigkeit ist das die
 *       uebliche Naeherung.
 *   A3) Der Sonnentag wird numerisch ueber die Stundenhöhe bestimmt (Scan ueber
 *       den vollen Sonnentag in 1-min-Schritten + Bisektion auf ~1e-7 min), NICHT
 *       ueber eine geschlossene H0-Formel. Dadurch wird Polarnacht sauber als
 *       "kein Aufgang" (null) erkannt und Polartag als 1440 min.
 *   A4) Zenitdistanz < 2° gilt als instabil (Vorgabe 2).
 *
 * DETERMINISMUS
 *   - Kein new Date() ohne Argument, kein Date.now(), kein Math.random().
 *     Die Zeit kommt zu 100% aus utcMs. new Date(utcMs) ist erlaubt (Argument!).
 *   - Astronomische Felder (altitudeDeg, azimuthDeg, declinationDeg,
 *     equationOfTimeMin, trueSolarTimeMin, hourAngleDeg, dayLengthMin, isDay)
 *     sind zeitzonen- UND dst-frei. Nur localCivil* / sunriseLocal /
 *     sunsetLocal / solarNoonLocal haengen an tzId (und damit an der tzdata
 *     der Laufzeit) — das ist dokumentiert, nicht versteckt.
 */

import { projectShadow, sunVectorFromState, shadowLengthFromAltitude } from './shadow.mjs';

export const SUNRISE_HORIZON_GEOMETRIC = 0;
export const SUNRISE_HORIZON_REFRACTED = -0.833;
export const ZENITH_UNSTABLE_DEG = 2;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const MIN_MS = 60000;
const DAY_MS = 86400000;

const mod360 = (x) => ((x % 360) + 360) % 360;
const mod1440 = (x) => ((x % 1440) + 1440) % 1440;
const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);
const sinD = (d) => Math.sin(d * RAD);
const cosD = (d) => Math.cos(d * RAD);
const asinD = (x) => Math.asin(clamp(x, -1, 1)) * DEG;
const acosD = (x) => Math.acos(clamp(x, -1, 1)) * DEG;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/* ------------------------------------------------------------------ Zeitzone */

const fmtCache = new Map();

function formatterFor(tzId) {
  if (typeof tzId !== 'string' || tzId.length === 0) {
    throw new TypeError('computeState: tzId muss ein nicht leerer String sein (IANA, z.B. "Europe/Berlin").');
  }
  let f = fmtCache.get(tzId);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-US', {
        timeZone: tzId,
        hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
    } catch (err) {
      throw new RangeError(`computeState: unbekannte Zeitzone "${tzId}" (${err && err.message}).`);
    }
    fmtCache.set(tzId, f);
  }
  return f;
}

function civilParts(utcMsValue, tzId) {
  const parts = formatterFor(tzId).formatToParts(new Date(utcMsValue));
  const p = { year: 1970, month: 1, day: 1, hour: 0, minute: 0, second: 0 };
  for (const part of parts) {
    if (part.type in p) p[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  p.utcOffsetMin = Math.round((asUtc - Math.floor(utcMsValue / 1000) * 1000) / MIN_MS);
  p.dayIndex = Math.floor(Date.UTC(p.year, p.month - 1, p.day) / DAY_MS);
  p.hhmm = `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
  p.iso = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')} ${p.hhmm}:${String(p.second).padStart(2, '0')}`;
  return p;
}

/* --------------------------------------------------------------- Astronomie */

export function julianDay(utcMsValue) {
  return utcMsValue / DAY_MS + 2440587.5;
}

/**
 * Sonnenbahngroessen nach NOAA/Meeus (Bahnrichtungsabweichung + Schiefe der
 * Erdbahn). Reine Funktion von utcMs.
 */
export function solarGeometry(utcMsValue) {
  const T = (julianDay(utcMsValue) - 2451545.0) / 36525; // Julianische Jahrhunderte seit J2000
  const L0 = mod360(280.46646 + T * (36000.76983 + T * 0.0003032)); // mittlere Länge
  const M = mod360(357.52911 + T * (35999.05029 - 0.0001537 * T)); // mittlere Anomalie
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T); // Exzentrizitaet
  const C = // Gleichung des Mittelpunkts
    sinD(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    sinD(2 * M) * (0.019993 - 0.000101 * T) +
    sinD(3 * M) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T; // Nutation in Laenge (naeherungsweise)
  const lambda = trueLong - 0.00569 - 0.00478 * sinD(omega); // scheinbare Laenge
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * cosD(omega); // korrigierte Schiefe
  const declinationDeg = asinD(sinD(eps) * sinD(lambda));
  const rightAscensionDeg = mod360(
    Math.atan2(cosD(eps) * sinD(lambda), cosD(lambda)) * DEG,
  );
  const y = Math.tan((eps * RAD) / 2) ** 2;
  // Zeitgleichung = wahre Sonnenzeit minus mittlere Sonnenzeit, in Minuten.
  const equationOfTimeMin =
    4 * DEG *
    (y * sinD(2 * L0) -
      2 * e * sinD(M) +
      4 * e * y * sinD(M) * cosD(2 * L0) -
      0.5 * y * y * sinD(4 * L0) -
      1.25 * e * e * sinD(2 * M));
  return { julianDay: julianDay(utcMsValue), T, L0, M, e, lambda, eps, declinationDeg, rightAscensionDeg, equationOfTimeMin };
}

/** Stundenwinkel in Grad, -180..180. H = wahre Sonnenzeit/4 - 180. */
export function hourAngleDeg(trueSolarTimeMin) {
  return trueSolarTimeMin / 4 - 180;
}

function altitudeFrom(latDeg, declDeg, hAngleDeg) {
  return asinD(sinD(latDeg) * sinD(declDeg) + cosD(latDeg) * cosD(declDeg) * cosD(hAngleDeg));
}

function trueSolarTimeFrom(utcMsValue, lonDeg, eqTimeMin) {
  return mod1440(mod1440(utcMsValue / MIN_MS) + 4 * lonDeg + eqTimeMin);
}

export function altitudeDegAt(utcMsValue, latDeg, lonDeg) {
  const g = solarGeometry(utcMsValue);
  return altitudeFrom(latDeg, g.declinationDeg, hourAngleDeg(trueSolarTimeFrom(utcMsValue, lonDeg, g.equationOfTimeMin)));
}

/**
 * Horizontale Sonnenkoordinaten fuer Breite, Deklination, Stundenwinkel.
 * Liefert nie NaN: im Polfall wird azimuthDeg als 0/180 gesetzt und
 * azimuthUnstable gesetzt, weil der Azimut dort nicht definiert ist.
 */
export function horizontalFrom(latDeg, declDeg, hAngleDeg) {
  const altitudeDeg = altitudeFrom(latDeg, declDeg, hAngleDeg);
  const denom = cosD(altitudeDeg) * cosD(latDeg);
  let azimuthDeg;
  let azimuthUnstable = false;
  if (Math.abs(denom) < 1e-9) {
    azimuthDeg = declDeg >= 0 ? 0 : 180; // Zenitdurchgang oder Pol — beliebig, markiert
    azimuthUnstable = true;
  } else {
    const cosA = clamp((sinD(declDeg) - sinD(altitudeDeg) * sinD(latDeg)) / denom, -1, 1);
    azimuthDeg = acosD(cosA); // ab Nord
    if (sinD(hAngleDeg) > 0) azimuthDeg = 360 - azimuthDeg; // Nachmittag -> Westseite
  }
  const zenithDeg = 90 - altitudeDeg;
  if (zenithDeg < ZENITH_UNSTABLE_DEG) azimuthUnstable = true;
  return { altitudeDeg, azimuthDeg, zenithDeg, azimuthUnstable };
}

/* ------------------------------------------------- Sonnentag / Aufgang /untergang */

function refineMaximum(fn, center, halfWidthMin, iterations = 80) {
  let lo = center - halfWidthMin;
  let hi = center + halfWidthMin;
  for (let i = 0; i < iterations; i += 1) {
    const m1 = lo + (hi - lo) / 3;
    const m2 = hi - (hi - lo) / 3;
    if (fn(m1) < fn(m2)) lo = m1;
    else hi = m2;
  }
  return (lo + hi) / 2;
}

function bisectRoot(fn, a, b, iterations = 32) {
  const fa = fn(a);
  for (let i = 0; i < iterations; i += 1) {
    const m = (a + b) / 2;
    const fm = fn(m);
    if ((fa <= 0) === (fm <= 0)) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

/**
 * Sonnenhöchststand, Aufgang, Untergang und Tageslaenge fuer den Sonnentag,
 * der den Zeitpunkt utcMsValue enthaelt. Aufgang/Untergang = null bei Polar-
 * nacht/Polartag (kein Fehler, sondern fachlich korrekt).
 */
export function solarDayEvents(utcMsValue, latDeg, lonDeg, horizonDeg = SUNRISE_HORIZON_GEOMETRIC) {
  const utcMin = mod1440(utcMsValue / MIN_MS);
  const localMeanMin = mod1440(utcMin + 4 * lonDeg);
  const dayStartMs = Math.floor((utcMsValue - localMeanMin * MIN_MS) / MIN_MS) * MIN_MS;
  let noonMs = dayStartMs + 720 * MIN_MS;
  for (let i = 0; i < 2; i += 1) {
    noonMs = dayStartMs + (720 - solarGeometry(noonMs).equationOfTimeMin) * MIN_MS;
  }
  const alt = (ms) => altitudeDegAt(ms, latDeg, lonDeg);
  noonMs = refineMaximum(alt, noonMs, 240);
  const maxAltitudeDeg = alt(noonMs);

  const SPAN_MIN = 800; // deckt jeden Sonnentag (<= 1440 min) sicher ab
  let sunriseMs = null;
  let sunsetMs = null;
  let t0 = noonMs - SPAN_MIN * MIN_MS;
  let f0 = alt(t0) - horizonDeg;
  for (let m = 1; m <= 2 * SPAN_MIN; m += 1) {
    const t1 = t0 + MIN_MS;
    const f1 = alt(t1) - horizonDeg;
    if (f0 <= 0 && f1 > 0) {
      const c = bisectRoot((ms) => alt(ms) - horizonDeg, t0, t1);
      if (c <= noonMs) sunriseMs = c; // letzter Aufgang vor dem Hoechststand gewinnt
    } else if (f0 > 0 && f1 <= 0) {
      const c = bisectRoot((ms) => alt(ms) - horizonDeg, t0, t1);
      if (c >= noonMs && sunsetMs === null) sunsetMs = c; // erster Untergang danach gewinnt
    }
    t0 = t1;
    f0 = f1;
  }

  let dayLengthMin;
  let polarDay = false;
  let polarNight = false;
  if (sunriseMs !== null && sunsetMs !== null) {
    dayLengthMin = (sunsetMs - sunriseMs) / MIN_MS;
  } else if (maxAltitudeDeg >= horizonDeg) {
    dayLengthMin = 1440;
    polarDay = true;
  } else {
    dayLengthMin = 0;
    polarNight = true;
  }
  return { solarNoonMs: noonMs, maxAltitudeDeg, sunriseMs, sunsetMs, dayLengthMin, polarDay, polarNight };
}

/* ------------------------------------------------------------------ computeState */

/**
 * computeState({utcMs, latDeg, lonDeg, tzId = 'UTC', horizonDeg = 0}) -> State
 * Pflichtfelder des UI-Vertrags:
 *   altitudeDeg, azimuthDeg, declinationDeg, equationOfTimeMin,
 *   trueSolarTimeMin, localCivil, utc, isDay, dayLengthMin,
 *   sunriseLocal, sunsetLocal, solarNoonLocal
 * Erweiterungen (dokumentiert): azimuthUnstable, hourAngleDeg,
 *   rightAscensionDeg, localMeanSolarTimeMin, localCivilParts, localCivilUtcOffsetMin,
 *   sunriseUtcMs, sunsetUtcMs, solarNoonUtcMs, sunriseLocalDayOffset,
 *   sunsetLocalDayOffset, solarNoonLocalDayOffset, horizonDeg, maxAltitudeDeg,
 *   polarDay, polarNight, shadowAvailable
 */
export function computeState({ utcMs, latDeg, lonDeg, tzId = 'UTC', horizonDeg = SUNRISE_HORIZON_GEOMETRIC } = {}) {
  if (!isNum(utcMs)) throw new TypeError('computeState: utcMs muss eine endliche Zahl sein (Epoch-Millisekunden, UTC).');
  if (!isNum(latDeg) || latDeg < -90 || latDeg > 90) throw new RangeError(`computeState: latDeg ausserhalb [-90,90]: ${latDeg}`);
  if (!isNum(lonDeg) || lonDeg < -180 || lonDeg > 180) throw new RangeError(`computeState: lonDeg ausserhalb [-180,180]: ${lonDeg}`);
  if (!isNum(horizonDeg)) throw new TypeError('computeState: horizonDeg muss eine endliche Zahl sein.');

  const t = Math.floor(utcMs);
  const g = solarGeometry(t);
  const utcMin = mod1440(t / MIN_MS);
  const localMeanSolarTimeMin = mod1440(utcMin + 4 * lonDeg);
  const trueSolarTimeMin = mod1440(localMeanSolarTimeMin + g.equationOfTimeMin);
  const hAngle = hourAngleDeg(trueSolarTimeMin);
  const horiz = horizontalFrom(latDeg, g.declinationDeg, hAngle);

  const events = solarDayEvents(t, latDeg, lonDeg, horizonDeg);
  const ref = civilParts(t, tzId);
  const localEvent = (ms) => {
    if (ms === null || ms === undefined) return null;
    const p = civilParts(ms, tzId);
    return { hhmm: p.hhmm, iso: p.iso, dayOffset: p.dayIndex - ref.dayIndex };
  };
  const sunrise = localEvent(events.sunriseMs);
  const sunset = localEvent(events.sunsetMs);
  const noon = localEvent(events.solarNoonMs);

  return {
    altitudeDeg: horiz.altitudeDeg,
    azimuthDeg: horiz.azimuthDeg,
    azimuthUnstable: horiz.azimuthUnstable,
    declinationDeg: g.declinationDeg,
    equationOfTimeMin: g.equationOfTimeMin,
    trueSolarTimeMin,
    localCivil: ref.iso,
    utc: new Date(t).toISOString(),
    isDay: horiz.altitudeDeg >= horizonDeg,
    dayLengthMin: events.dayLengthMin,
    sunriseLocal: sunrise ? sunrise.hhmm : null,
    sunsetLocal: sunset ? sunset.hhmm : null,
    solarNoonLocal: noon ? noon.hhmm : null,

    hourAngleDeg: hAngle,
    rightAscensionDeg: g.rightAscensionDeg,
    zenithDeg: horiz.zenithDeg,
    localMeanSolarTimeMin,
    localCivilParts: ref,
    localCivilUtcOffsetMin: ref.utcOffsetMin,
    sunriseUtcMs: events.sunriseMs,
    sunsetUtcMs: events.sunsetMs,
    solarNoonUtcMs: events.solarNoonMs,
    sunriseLocalDayOffset: sunrise ? sunrise.dayOffset : null,
    sunsetLocalDayOffset: sunset ? sunset.dayOffset : null,
    solarNoonLocalDayOffset: noon ? noon.dayOffset : null,
    horizonDeg,
    maxAltitudeDeg: events.maxAltitudeDeg,
    polarDay: events.polarDay,
    polarNight: events.polarNight,
    shadowAvailable: horiz.altitudeDeg > 0,
  };
}

/* ------------------------------------------------------------------- projectAt */

/**
 * projectAt(state, {x,y,z}) -> Schattenpunkt auf z=0 oder undefined.
 * Nimmt die Ausgabe von computeState (oder ein handgebautes
 * {altitudeDeg, azimuthDeg}) — damit hat die UI genau EINE Rechenstelle.
 */
export function projectAt(state, point) {
  if (!state || !isNum(state.altitudeDeg) || !isNum(state.azimuthDeg)) return undefined;
  if (!(state.altitudeDeg > 0)) return undefined; // Nacht: kein Schatten, kein NaN
  const s = sunVectorFromState(state.altitudeDeg, state.azimuthDeg);
  const p = projectShadow({
    px: point && isNum(point.x) ? point.x : 0,
    py: point && isNum(point.y) ? point.y : 0,
    pz: point && isNum(point.z) ? point.z : 0,
    sx: s.sx, sy: s.sy, sz: s.sz,
  });
  if (!p) return undefined;
  return {
    x: p.x,
    y: p.y,
    length: shadowLengthFromAltitude(point && isNum(point.z) ? point.z : 0, state.altitudeDeg),
    altitudeDeg: state.altitudeDeg,
    azimuthDeg: state.azimuthDeg,
    azimuthUnstable: state.azimuthUnstable === true,
  };
}