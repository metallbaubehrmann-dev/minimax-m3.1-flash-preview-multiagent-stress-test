# CHECKPOINT — MultiMax-M3.1 Multiagenten-Stresstest

Stand: 2026-09-28 14:20 Europe/Berlin
Zweck: Wiederaufnahme in einer neuen Session mit funktionierender Shell.

---

## 0. Auftrag

Quelldokument: `G:\.minimax\v2\assets\2026\09\28\13-39-15-027-asset_20260928-133915-027_3a72cf21bceb_70393f3f-MiniMax_M31_Multiagent_Stresstest_Prompt.md`

Ziel: Sonnenuhr-Spiel „Schattenwerkstatt" bauen, Systemaudit (Obsidian / MemFTS+Mnemosyne / n8n),
Modellrecherche, 6 echte Subagenten, Browserabnahme, Mutationstests, Pruefer-Stresstest,
Reparaturschleife, Artefaktset unter RUN_ROOT.

---

## 1. ERLEDIGT (mit Beleg)

### 1.1 Skills geladen
- `agent-orchestration` (Pfad: `C:\Users\Alexa\.agents\skills\agent-orchestration\SKILL.md`)
- `minimax-m3-senior-engineering-team` v1.0.0 (Pfad: `G:\.minimax\skills\minimax-m3-senior-engineering-team\SKILL.md`)
- `memory_truth_and_accuracy` (Pfad: `G:\.minimax\skills\memory_truth_and_accuracy\SKILL.md`, Pflicht-Voraussetzung laut Team-Skill Abschnitt 0)

### 1.2 Modellzuordnung BELEGT (nicht aus dem Namen abgeleitet)
Quelle: natives `mavis`-Werkzeug, Kommando `session get`, Session-ID `mvs_e63fc83e274d465a9a196a9dc55ac865`

- `effective_model`: `minimax/MiniMax-M3.1-Flash-Preview`
- `effective_model_variant`: `thinking`
- `model.thinking.effort`: `max`
- `model.provider_id`: `minimax`
- `model.model_id`: `MiniMax-M3.1-Flash-Preview`
- `frameworkType`: `pi-agent`
- `sessionType`: 0
- `workspaceDir`: `D:\`  <-- Ursache des Blockers
- `title`: "Lade System Anker Hermes Update"  (Session vom 2026-07-01, laeuft heute weiter)
- `createdAt`: 1782895789518

Zusaetzlich: `mavis cron resolve-model` mit Modelltext `MiniMax-M3.1-Flash-Preview`
loest auf zu `minimax/MiniMax-M3.1-Flash-Preview` (Katalog-Aufloesung, KEIN Routingnachweis).

### 1.3 Agenten-Inventar (natives `mavis agent list`, include_primary=true)
Vorhandene Agenten und Rollen:

| name | Rolle | gedachte Zuordnung |
|---|---|---|
| `mavis` | orchestrator | Hauptagent (ich) |
| `explore` | explore (read-only) | A3 Obsidian/Memory, ggf. Messungen |
| `worker` | worker | A4 n8n + Dateitest |
| `verifier` | verifier | A6 unabhaengige QA |
| `coder` | worker | A1 UI, A2 Sonnenmodell (zwei Instanzen) |
| `general` | worker | A5 Recherche (Web-Tools) |
| `agent-0c5aaec7a1a9` | worker, Wahrheitspruefer-Persona | optional zusaetzlich |

Native Delegation: Werkzeug `task` (Subagenten). Route-Aliase aus `agent-orchestration`
(Codex-spezifisch) sind in dieser Laufzeit nicht anwendbar.

### 1.4 RUN_ROOT angelegt und Schreibbarkeit belegt
- Pfad: `C:\Users\Alexa\Desktop\MiniMax_M31_Test_20260928_133915`
- Desktop ueber Betriebssystemfunktion ermittelt (`[Environment]::GetFolderPath('Desktop')` steht im
  Auftrag als Pflicht; Pfad per Glob-Existenz bestaetigt)
- Schreibtest: `_RUN_ROOT_PROBE.txt` (295 Bytes) erzeugt und per Read zurueckgelesen (Inhalt inkl. Umlauten bestaetigt)

---

## 2. BLOCKER (hart, umgebungsbedingt)

**Bash ist in diesem Session-Baum vollstaendig blockiert.**

Fehlermeldung woertlich:
`Background bash failed: Working directory does not exist: D:\ — Cannot execute commands.`

Belege:
1. Hauptagent: 3 Shell-Aufrufe, alle mit identischem Fehler
2. `glob` auf `D:\` → `glob path does not exist: D:\`
3. Subagent `explore` (Session `mvs_5dc7e36edea04657bb20b01038edce75`), 2 Shell-Aufrufe,
   gleicher Fehler → **Subagenten erben denselben defekten Arbeitsordner**
4. Nach Auswahl „Volltest" durch den Operator erneut geprueft: weiterhin Fehler,
   `workspaceDir` steht weiter auf `D:\`

Funktionierende Werkzeuge: `read`, `write`, `edit`, `glob`, `grep`, `web_search`, `web_fetch`,
natives `mavis`, `memory`, `mcp__chrome-devtools__*`.
Nicht verfuegbar: `bash` und damit alles Prozess-, Hash-, SQLite-, Docker- und CLI-abhaengige.

### 2.1 dadurch blockierte Pflichtabschnitte des Auftrags
- §2 Ressourcenmessung (RAM/Disk) — braucht Shell
- §6 Dateitest Schritt 5 (umbenennen) und 6 (loeschen) — braucht Shell
- §7 Vault-Messung (Dateizahlen, Bytes, Junctions, Zeitfenster) — braucht Shell
- §8 MemFTS / Mnemosyne / Qdrant / SQLite-Lesen, Stichproben-Recall — braucht Shell
- §9 n8n (Instanz, Version, Workflow-Executions, Ergebnisartefakte) — braucht Shell
- §13 `MANIFEST.sha256` (Hashberechnung) — braucht Shell

### 2.2 workaround-faehige Abschnitte
- §4 Engine-Tests: Ausfuehrung im Browser statt Node (Bewertungswechsel, dokumentieren)
- §5 Browserabnahme: voll durchfuehrbar (chrome-devtools, unabhaengig von Shell)
- §11 Pruefer-Stresstest: voll durchfuehrbar (Dateien + Read/Write/Glob)
- §10 Modellrecherche: voll durchfuehrbar (web_search/web_fetch)

---

## 3. NAECHSTE KONKRETE AKTION (in neuer Session)

1. Arbeitsordner der Session auf einen existierenden Pfad stellen, z. B. `C:\Users\Alexa`
   (bzw. neue Session eroeffnen und dieses CHECKPOINT laden).
2. Shell-Gegenprobe: `Get-Location` muss einen gueltigen Pfad liefern.
3. `README`-Pflichtdateien und `src/`, `tests/`, `evidence/`, `screenshots/` anlegen.
4. A1/A2-Vertrag festlegen (siehe Abschnitt 4) und Welle 1 mit 6 Subagenten starten.
5. Modulare Entwicklung in `src/`, Endbundle als einzelne `index.html`.

---

## 4. A1/A2-VERTRAG (vorab festgelegt, Verfeinerung erlaubt)

`src/engine/` (Besitz A2) exportiert, `src/ui/` (Besitz A1) konsumiert:

```
solar.computeState({ utcMs, latDeg, lonDeg, tzId })
  -> { altitudeDeg, azimuthDeg, declinationDeg, equationOfTimeMin,
       trueSolarTimeMin, localCivil, utc, isDay, dayLengthMin,
       sunriseLocal, sunsetLocal, solarNoonLocal }
shadow.projectShadow({ px, py, pz, sx, sy, sz })
  -> { x, y }   // Ebenenschatten auf z=0, undefined wenn sz <= 0
```
Konventionen: x=Ost, y=Nord, z=oben. Azimut 0=Nord, 90=Ost (im Uhrzeigersinn).
Nicht geteilt: A1 schreibt `src/ui/**`, A2 schreibt `src/engine/**`, keine Ueberschneidung.

---

## 5. OFFENE ANFORDERUNGEN (komplett)

- App: „Schattenwerkstatt", eigenstaendige `index.html`, `file://`, kein CDN/Netz/API-Key/Font
- Demo-Ort: 48,78 N / 9,18 E / Europe/Berlin; Breitenbereich 5–85 N
- Echtzeit- und Simulationsmodus mit Pause, Zeitschieber, Geschwindigkeit
- Ortszeit / UTC / wahre Sonnenzeit getrennt beschriftet; Sommerzeit vs. Zeitgleichung getrennt
- Nachtzustand ohne erfundenen Schatten; ueberlange Schatten begrenzen + Grenze anzeigen
- Drei spielbare Aufgaben mit pruefbaren Erfolgsbedingungen, kein automatischer Sieg
- Deutsches UI, Maus/Touch/Tastatur, Desktop + schmales Mobil-Layout
- Reset definiert; verweigertes localStorage darf App nicht zerstoeren
- Screenshots: Morgen, Sonnenmittag, Abend, Nacht, Mobil
- Mutationstests an Kopien: Ziffern entfernt, Schattenrichtung umgekehrt
- A6: mindestens 8 unabhaengige Referenzfaelle, Toleranz 1 Grad Hoehe/Azimut,
  2 Minuten wahre Sonnenzeit fuer regulaere Faelle oberhalb 5 Grad
- A4: Dateitest (lesen, schreiben, zuruecklesen, Abschnitt aendern, umbenennen, loeschen)
- Artefakte: `index.html`, `README.md`, `TEST_REPORT.md`, `SYSTEM_AUDIT.md`, `MODEL_RESEARCH.md`,
  `FINAL_REPORT.md`, `RESULTS.json`, `AGENTS.json`, `CLAIMS.json`,
  `REVIEW_CHALLENGE_RESULTS.json`, `MANIFEST.sha256`, `src/`, `tests/`, `evidence/`, `screenshots/`
- Abschlussstatus getrennt: APP_FUNCTIONAL, FILE_OPERATIONS, MULTIAGENT_EXECUTION,
  RESEARCH_EVIDENCE, SYSTEM_AUDIT_COMPLETENESS, REVIEWER_CHALLENGE,
  OBSIDIAN_MEMFTS_HEALTH, OBSIDIAN_MNEMOSYNE_HEALTH, N8N_WORKFLOW_HEALTH, PRODUCTIVE_CHANGES

Produktive Systeme bleiben unangetastet: keine Reparaturen, keine Dienst-/Docker-/Gateway-
Neustarts, keine globalen Installationen, keine Aenderungen an Agentendefinitionen,
Provider-Konfigurationen, SOUL/USER/MEMORY, Vault-Inhalten, Indizes oder n8n-Workflows.