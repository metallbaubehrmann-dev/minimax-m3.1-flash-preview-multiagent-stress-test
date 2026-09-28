# Schattenwerkstatt — UI (Besitz A1: `src/ui/**`, `tests/ui/**`)

Stand 2026-09-28. Reines HTML/CSS/JavaScript. Kein Build-Schritt, kein Paketmanager,
keine Abhängigkeiten.

## Dateien

| Datei | Zweck |
|---|---|
| `src/ui/shadow-workshop.html` | UI-Rahmen. **Kein** `index.html` — die Einzeldatei ist Hauptagent-Arbeit. |
| `src/ui/styles.css` | Layout, Fokusringe, Mobil-Layout. Keine Webfonts, keine `url(...)`. |
| `src/ui/engine-adapter.js` | Dünner Adapter auf die Engine + dokumentierter `TODO-ENGINE`-Ersatz. |
| `src/ui/storage.js` | localStorage für Einstellungen, jeder Zugriff in try/catch. |
| `src/ui/tasks.js` | Die drei Aufgaben mit aus der Rechnung abgeleiteten Erfolgsbedingungen. Reines Rechenmodul, unter Node `require`-bar. |
| `src/ui/app.js` | Verdrahtung: Rechnung, Szene, Zeiten, Aufgaben, Eingaben, Reset. |
| `tests/ui/ui-contract.test.js` | Node-Test ohne Framework, Exit 0/1. |

## Warum keine ES-Module (verbindlich)

Chromium blockiert `import`/`export` unter `file://` per CORS (Herkunft `null`).
Ein Doppelklick auf eine HTML-Datei, die ES-Module lädt, liefert eine leere Seite.
Deshalb:

- alle Skripte sind **klassisch** (`<script src="…">`), IIFE, Namensraum über `window`
  (`SWEngine`, `SWStore`, `SWTasks`, `SWApp`),
- **kein** `fetch()`, **kein** `XMLHttpRequest` — beides wäre unter `file://` ebenfalls blockiert,
- die Engine meldet sich **global** an, nicht über einen Netzabruf.

Reihenfolge im HTML: `engine-adapter.js` → `storage.js` → `tasks.js` → `app.js`.

## Zusammenbau zur Einzeldatei (Hauptagent)

`shadow-workshop.html` ist direkt lauffähig (Doppelklick im Ordner `src/ui`).
Für die geforderte Einzeldatei `index.html` am RUN_ROOT-Wurzelverzeichnis:

1. den Inhalt von `styles.css` in ein `<style>` kopieren und den
   `<link rel="stylesheet">` entfernen,
2. die Inhalte der vier Skripte der Reihe nach in **einen** `<script>`-Block
   ohne `<script src>`-Tags einfügen,
3. die Inline-SVG-`<symbol>`-Defitionen bleiben unverändert im Body.

`src/ui/shadow-workshop.html` selbst wird dabei **nicht** verändert.

## Anschluss an die Engine (A2) — nötige Absprache

Der Adapter probiert in dieser Reihenfolge und nimmt den ersten Treffer:

1. `window.SW_ENGINE = { solar: {...}, shadow: {...} }`  ← **empfohlen**
2. `window.SW_ENGINE_RAW`
3. `window.SW.engine`
4. `window.solar` + `window.shadow`

Benutzter Vertrag, wörtlich so im Adapter aufgerufen:

```
solar.computeState({ utcMs, latDeg, lonDeg, tzId })
  -> { altitudeDeg, azimuthDeg, declinationDeg, equationOfTimeMin,
       trueSolarTimeMin, localCivil, utc, isDay, dayLengthMin,
       sunriseLocal, sunsetLocal, solarNoonLocal, azimuthUnstable }

shadow.projectShadow({ px, py, pz, sx, sy, sz })  -> { x, y }
solar.projectAt(state, { x, y, z })               -> { x, y } | null
```

- `sx, sy, sz` ist der **Einheitsvektor zur Sonne**, nicht zu einem Objekt.
  Herleitung im Adapter: `sx = cos(alt)·sin(az)`, `sy = cos(alt)·cos(az)`,
  `sz = sin(alt)`. Bei `sz <= 0` gibt es keinen Schatten und `projectAt`
  liefert `null`.
- `azimuthUnstable` steht im Auftrag an A1, fehlt aber in der ursprünglichen
  Vertragsfassung aus `CHECKPOINT.md` Abschnitt 4. Fehlt das Feld in der
  Engine, behandelt der Adapter es als `false`. Braucht A2 eine eigene
  Definition (z. B. Sichtbarkeitsgrenze des Horizonts), ist das die richtige
  Stelle.
- Fehlen `sunriseLocal` / `sunsetLocal` / `solarNoonLocal` / `dayLengthMin`,
  rechnet der Adapter den Tageslauf selbst nach (60-minütiges Raster,
  1-min-Punkte, Fehlersuche an den 0°-Schnittpunkten).

Findet der Adapter keine Engine, rechnet er selbst — NOAA-Standardverfahren
(Deklination, Stundenwinkel, Zeitgleichung), im Code als `TODO-ENGINE`
markiert. Das ist eine echte Rechnung und kein Platzhalter, aber **nicht** die
Engine des Projekts. Die Oberfläche zeigt im Kopfbereich jederzeit an, welcher
Rechenweg benutzt wurde.

## Reset — verbindliche Definition

`allesZuruecksetzen()` (Schaltfläche „Alles zurücksetzen", Taste `R`) setzt
**Spielzustand** zurück:

| Bereich | auf |
|---|---|
| Ort | 48,78 N / 9,18 E, `Europe/Berlin` (Demo-Ort) |
| Zeit | echter aktueller Zeitpunkt; danach Simulation mit heutigem Datum, 12:00 Ortszeit, 15 min/s, **angehalten** |
| Aufgabe | Aufgabe 1, alle drei Aufgaben wieder offen, kein Erfolg vermerkt |
| Aufbau | Stab bei (0 / 0), Höhe 90 cm |

`reset-einstellungen` („Nur Einstellungen löschen") fasst den Spielzustand
**nicht** an und entfernt nur `localStorage`.

## localStorage — Testpunkt, nicht Behauptung

Gespeichert werden ausschließlich Einstellungen: Ort, Aufgabe, Geschwindigkeit,
die drei Lösungs-Flags. Nie Geometrie, nie Rechenwerte.

Zustände: `persistent`, `nurLesen`, `blockiert`, `ersatz` (Testpunkt), `unbekannt`.
In allen läuft die App weiter; `SWStore.hole()` liefert im Fehlerfall den
Standardwert, `SWStore.merke()` liefert `false`. Es gibt keinen Pfad, auf dem ein
Speicherfehler den Spielbetrieb anhält.

**Reproduzierbar prüfen:**

1. Kästchen „Speicherzugriff simuliert blockiert" (`#speicher-blockieren`) →
   `SWStore.setModusBlockiert(true)`. Danach wirft **jeder** Zugriff eine
   Ausnahme (`throw new Error('Testpunkt: …')`), und Ort, Zeit, Schatten und
   Aufgaben bleiben bedienbar.
2. Schaltfläche „Speicher prüfen" (`#speicher-test`) → `SWStore.probe()`
   schreibt, liest zurück und schreibt Ergebnis **samt Ausnahme** nach
   `#speicher-status`.
3. Per Konsole: `SWApp.speicherProbe()`, `SWApp.speicherInfo()`,
   `SWApp.speicherBlockieren(true|false)`.

Zusätzlich echte Wege: Browser mit blockiertem Third-Party-Speicher, oder
Profilverzeichnis ohne Schreibrecht.

## Aufgaben und Erfolgsbedingungen

Szenene: 1 Einheit = 1 cm. Markenradius 78 cm. **12 = Norden, 3 = Osten,
6 = Süden, 9 = Westen.** Azimut 0° = Norden, im Uhrzeigersinn.

| # | Erfolgsbedingung (alles aus der Rechnung) |
|---|---|
| 1 | Sonne über dem Horizont **und** Abstand Schattenspitze→12-Marke ≤ 5 cm |
| 2 | eingestellte Simulationszeit ≤ 2 min neben dem per Tagesrechnung ermittelten Minimum der Sonnen Höhe ≥ 3° |
| 3 | Sonne über dem Horizont **und** Abstand Schattenspitze→6-Marke ≤ 5 cm |

Zu Aufgabe 3: bei 48,78 N steht die Sonne nie im Norden, die 6-Marke ist dort
nicht erreichbar. Der Hinweis nennt die Bedingung (`Deklination > Breite`) und
den Ausweg. Das ist eine Eigenschaft des Projekts, kein Bedienfehler — und die
Bedingung bleibt rein geometrisch.

**Kein Erfolg ohne Nutzeraktion:** `bewertet(istNutzeraktion)` vergibt einen
Erfolg nur bei `true`. Das erreicht nur `aktualisiere(true)`, und das nur aus
Klick, Tastendruck, Ziehen oder Reglerbedienung. Die laufende Uhr (Live-Timer
und Simulationstimer) ruft `aktualisiere(false)` und erzeugt höchstens die
Anzeige „Bedingung erfüllt — noch nicht bestätigt". Es existiert kein „fertig"-Knopf.

## Test

```
node tests/ui/ui-contract.test.js
```

Exit 0 = bestanden, 1 = verletzt. Der Test prüft den statischen Vertrag
(Parametrierung der Engine-Aufrufe, keine CDN-/http-Ressourcen, keine
ES-Module, Reset-Definition, localStorage-Testpunkt) **und** lädt
`src/ui/tasks.js` unter Node, um die drei Erfolgsbedingungen mit
synthetischen Messwerten zu prüfen: Treffer löst aus, 40 cm daneben löst
nicht aus, nachts löst nichts aus.

Der Test sagt nichts über die Sonnenrechnung — dafür sind die Engine-Tests des
Hauptagenten zuständig.