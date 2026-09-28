# A5b — n8n AUDIT (READ ONLY)

Agent: A5b | Datum: 2026-09-28 | Modus: READ ONLY (ausserhalb RUN_ROOT nur gelesen)
Shell-Werkzeug: **NICHT VERFUEGBAR** (siehe A5_fileops_receipt.md). Alle Befunde stammen
aus `glob`, `grep`, `read`. Kein Docker, kein netstat, keine Prozessliste, keine Hashes.

---

## 0. Kernbefund in einem Satz

Es existiert **keine n8n-Installation auf diesem Windows-System**. Es existiert ein
**Docker-basiertes n8n-Pilotprojekt unter `G:\n8n-pilot\`**, das n8n als Container
(`docker.io/n8nio/n8n:2.35.7`) fuehrt. Die Frage "laeuft es gerade?" ist ohne Docker-Zugriff
**nicht beantwortbar** — siehe Frage 5.

---

## Frage 1 — Existiert eine n8n-Installation? → **TEILWEISE BELEGT (Docker, nicht nativ)**

| Erwarteter Ort | Ergebnis | Beleg |
|---|---|---|
| `%APPDATA%\n8n` | **existiert nicht** | glob: "glob path does not exist: C:\Users\Alexa\AppData\Roaming\n8n" |
| `%LOCALAPPDATA%\n8n` | **existiert nicht** | glob: "glob path does not exist: C:\Users\Alexa\AppData\Local\n8n" |
| `C:\Program Files\n8n` | nicht pruefbar | glob: "ripgrep exited with code 2" (Zugriff verweigert) — **kein Beweis fuer Nicht-Existenz** |
| `C:\ProgramData\n8n*` | nicht pruefbar | glob: "ripgrep exited with code 2" |
| npm global (`AppData\Roaming\npm\n8n*`) | **kein Treffer** | glob: "No files matched" |
| **Docker-Compose-Projekt** | **VORHANDEN** | `G:\n8n-pilot\compose.yaml:1-116` |

**Befund:** n8n laeuft nicht als Windows-Programm, sondern als Container.
`compose.yaml:5` pinnt `docker.io/n8nio/n8n:2.35.7@sha256:166d7e3c...`,
`compose.yaml:6` Container `hermes-n8n-pilot`, Port `127.0.0.1:5678` (`compose.yaml:9`).
Zweiter Container: `hermes-n8n-update-collector` (`compose.yaml:74`).
`README.md:3` bestaetigt: "one n8n Community container, SQLite, localhost only."

**Nebenbefund (kein Fehler, nur Kontext):** `C:\Users\Alexa\Desktop\_Aufgeraeumt\2026-07-14\n8n-recherche\n8n_ki_automatisierung_research.md`
ist ein **Recherche-Dokument**, keine Installation.

---

## Frage 2 — Liegt eine n8n-Datenbank (database.sqlite) vor? → **NEIN (auf Dateisystem), BELEGT**

| Suche | Ergebnis | Beleg |
|---|---|---|
| `C:\Users\Alexa\**\database.sqlite` | kein Treffer | glob: "No files matched" |
| `G:\n8n-pilot\**\database.sqlite` | kein Treffer | glob: "No files matched" |
| `G:\n8n-pilot\**\*.sqlite` | 1 Treffer: `_tmp_n8n_db_ro.sqlite` | glob |

**BELEGT: auf dem Dateisystem liegt KEINE `database.sqlite`.**
Dateigroesse: **nicht messbar** — `Get-ChildItem` mit Groessenausgabe steht in dieser
Sitzung nicht zur Verfuegung. [NICHT VERIFIZIERT]

**Erklaerung (Deutung, [INFERENCE] — nicht gemessen):** `compose.yaml:38-39` bindet den
Datenpfad als **Docker-Named-Volume** ein (`n8n_data:/home/node/.n8n`, `compose.yaml:110-111`
`name: hermes_n8n_pilot_data`). Docker-Volumes liegen nicht im Host-Dateisystem, sondern in
`\\wsl$\...\docker-desktop-data` bzw. unter `C:\ProgramData\DockerDesktop`. Eine
`database.sqlite` waere daher **nicht per glob auffindbar** — sie ist aber **nicht
nachgewiesen nicht vorhanden**. Fuer ihren Zustand braucht es:
`docker exec hermes-n8n-pilot ls -l /home/node/.n8n/database.sqlite`

`_tmp_n8n_db_ro.sqlite` ist ein **temporaeres Read-only-Artefakt eines Analyse-Skripts**
Praefix `_tmp_`, nicht die Live-Datenbank.

---

## Frage 3 — Existieren exportierte Workflow-JSON? → **JA, 11 Stueck, BELEGT**

Gesucht wurde nach Dateien, die `"connections"` UND `"nodes"` enthalten.
grep `"connections"` in `G:\n8n-pilot\workflows\*.json` → **11 Treffer in 11 Dateien**.
Alle 11 enthalten zusaetzlich `"type": "n8n-nodes-base....` (79 Treffer).

| # | Pfad |
|---|---|
| 1 | `G:\n8n-pilot\workflows\chatgpt_youtube_channel_watcher_v1.json` |
| 2 | `G:\n8n-pilot\workflows\youtube_gemini_analysis_v1.json` |
| 3 | `G:\n8n-pilot\workflows\_yt_gemini_import.json` |
| 4 | `G:\n8n-pilot\workflows\[SYSTEM]_hermes_campaign_continuation_supervisor_v1.json` |
| 5 | `G:\n8n-pilot\workflows\chatgpt_x_source_watcher_v1.json` |
| 6 | `G:\n8n-pilot\workflows\update_intelligence.json` |
| 7 | `G:\n8n-pilot\workflows\gmail_readonly_skeleton.json` |
| 8 | `G:\n8n-pilot\workflows\chatgpt_research_event_ingress_v1.json` |
| 9 | `G:\n8n-pilot\workflows\n8n_to_hermes_canary.json` |
| 10 | `G:\n8n-pilot\workflows\research_source_basket_blocked.json` |
| 11 | `G:\n8n-pilot\workflows\webhook_receiver.json` |

Ausserdem Exportkopien ausserhalb von `workflows\`: `G:\n8n-pilot\workspace\workflow_with_auth*.json`
(5 Varianten) und `current_workflow_2026*.json` (3 Zeitstempel) + `current_export.json`,
sowie `G:\n8n-pilot\tmp_export\` und `tmp_n8n_state\` und `supervisor_*.json`.
**Diese Kopien wurden NICHT inhaltlich geprueft** — nur nach Benennung inventarisiert.

---

## Frage 4 — Je Datei: Knoten, Trigger, Dienste (HEURISTIK) → **HEURISTISCH, klar markiert**

Knotenzahl = Anzahl Treffer `"type": "n8n-nodes-base.` — das ist eine **untere Schranke**,
keine exakte `nodes[]`-Laenge. Dienste = Trefferzahl des jeweiligen Schluesselwort-Musters
(jeweils eigener grep-Lauf, nicht addierbar mit der Gesamttabelle oben).

| Workflow | Knoten* | Trigger (belegt) | `active` im Export | Dienste (Schluesselwort-Treffer) |
|---|---|---|---|---|
| `chatgpt_youtube_channel_watcher_v1.json` | 17 | `n8n-nodes-base.webhook` "Manual Webhook", `webhookId: chatgpt-research-youtube-watch-v1` (:33-37) | **true** (:506) | httpRequest 2; youtube 11; openai/luna/terra 4 |
| `youtube_gemini_analysis_v1.json` | 14 | Webhook, Pfad `youtube-gemini` (:203,:302) | **true** (:436) | httpRequest 3; youtube 17; openai/luna/terra 9 |
| `_yt_gemini_import.json` | 14 | `n8n-nodes-base.webhook` "Webhook Input", `ytg-webhook`, Pfad `youtube-gemini` | **nicht gefunden** (einzeilige Datei) | httpRequest 3; youtube 17 |
| `[SYSTEM]_hermes_campaign_continuation_supervisor_v1.json` | 12 | im grep-Fenster nicht erfasst | **false** (:232) | hermes 7; httpRequest 2 |
| `chatgpt_x_source_watcher_v1.json` | 7 | `n8n-nodes-base.webhook`, `webhookId: chatgpt-research-x-watch-v1` (:36-38) | **true** (:4) | httpRequest 1 |
| `update_intelligence.json` | 4 | `manualTrigger` (:8) **UND** `webhook` "Webhook Input" (:24) | **true** (:94) | hermes 6 |
| `gmail_readonly_skeleton.json` | 3 | `manualTrigger` (:8) + `gmailTrigger` "DISABLED" (:29) | **false** (:67) | hermes 1 |
| `chatgpt_research_event_ingress_v1.json` | 2 | `n8n-nodes-base.webhook` "Event Webhook", `webhookId: chatgpt-research-event-v1` (:13-17) | **true** (:4) | httpRequest 1 |
| `n8n_to_hermes_canary.json` | 2 | `n8n-nodes-base.webhook` "Canary Webhook", webhookId UUID (:13-16) | **false** (:71) | hermes 2; httpRequest 1 |
| `research_source_basket_blocked.json` | 2 | `manualTrigger` (:8) | **false** (:43) | hermes 1 |
| `webhook_receiver.json` | 2 | `webhook` "Webhook Input", Pfad `hermes-update-webhook` (:7,:12) | **false** (:34) | hermes 1 |

\* = untere Schaetzung, siehe oben.

**Dienst-Befund (belegt):**
- **KEIN** nativer `n8n-nodes-base.openai`-Knoten, **KEIN** `googleDrive`, **KEIN** `twitter`/`x`-Knoten.
  Der Treffer "openai|luna|terra" sitzt ausschliesslich in den **youtube**-Workflows und
  bezeichnet **Modell-Routing in Code/Parametern**, keine n8n-OpenAI-Integration.
- **KEIN** `youtube`-Native-Knoten. YouTube laeuft ueber `httpRequest` + eigene Code-Node
  (Video-ID-Extraktion, Transkript).
- **X/Twitter** laeuft laut Receipt ueber **Websuche**, nicht ueber die X-API:
  `exports\AI_RESEARCH\ROUTING_MONITORING_RECEIPT_2026-09-24.md:5` nennt
  "openai-codex OAuth" als Trieger. Die Tageslogs bemaengen **11x woertlich**
  "x_search war in dieser Sitzung nicht verfuegbar" — das ist ein **dokumentierter
  Funktionsausfall**, kein Erfolg.
- `hermes` ist der haeufigste Dienst (6 von 11 Dateien).

**`"active": true` bedeutet NUR: so stand der Stand beim Export.** Es ist **kein** Nachweis,
dass der Workflow in der laufenden Instanz aktiviert ist.

---

## Frage 5 — Aktive Workflows, Executions, Fehlerquoten, Artefakte → **GESTRICHEN: BLOCKED**

**BLOCKED. Ohne laufende Instanz nicht belegbar.**

| Gefordert | Status | Grund |
|---|---|---|
| Aktiv aktive Workflows (live) | **BLOCKED** | braucht `docker exec` / n8n REST API |
| Letzte Executions | **BLOCKED** | Executions liegen in der Docker-DB, nicht im FS |
| Fehlerquoten / Erfolgsrate | **BLOCKED** | keine Execution-Daten erreichbar |
| Output-Artefakte | **TEILWEISE BELEGT (Dateisystem)** | siehe unten |

**Zusatzbeleg, dass Executions in den Exporten NICHT stehen:**
grep `"executionId"|"finished": true|"mode": "manual"` ueber alle 11 Workflow-JSON
→ **"No matches found"**. Die Exporte enthalten also nachweislich keine Execution-Historie.

**Es werden hier KEINE Execution-IDs, KEINE Erfolgsquoten und KEINE Knotenketten erfunden.**

### Output-Artefakte (das ist der einzige hart belegbare Lauf-Indikator)

`exports\AI_RESEARCH\daily\2026-09-28.md` verweist auf 11 Artefakte von **heute**.
**Alle 11 wurden per glob einzeln gegengeprueft und EXISTIEREN physisch auf Platte:**

```
web\20260928T145013Z_HERMES_OPENCLAW_auto.json      <- juengster Eintrag, 16:50:13
web\20260928T144955Z_AI_GENERAL_auto.json
web\20260928T125005Z_HERMES_OPENCLAW_auto.json
web\20260928T125003Z_AI_GENERAL_auto.json
web\20260928T105008Z_HERMES_OPENCLAW_auto.json
web\20260928T104956Z_AI_GENERAL_auto.json
web\20260928T085012Z_AI_GENERAL_auto.json
web\20260928T085000Z_HERMES_OPENCLAW_auto.json
youtube\20260928T080505Z_7LyixHqahMQ_auto.json
youtube\20260928T080140Z_7LyixHqahMQ_auto.json
```

[VERIFIZIERT] Diese Dateien liegen auf Platte, unter `G:\n8n-pilot\exports\AI_RESEARCH\`.
Der Pfad ist genau das in `compose.yaml:42` gemountete n8n-Write-Volume
(`./exports/AI_RESEARCH:/home/node/.n8n-files/AI_RESEARCH:rw`).
[INFERENCE, nicht gemessen] Die Dateien wurden daher mit hoher Wahrscheinlichkeit von
den n8n-Workflows geschrieben, nicht von einem anderen Scheduler. **Belegt ist nur: sie
existieren, sie tragen n8n-Volumen-Pfade, sie tragen Zeitstempel bis 16:50 am heutigen Tag.**

**Wichtige Einschraenkung:** Das beweist, dass das System **heute zwischen 08:01 und 16:50
Output erzeugt hat**. Es beweist **NICHT**, dass es **jetzt** (17:43) laeuft. Ohne
`docker ps` ist der Jetzt-Zustand **BLOCKED**. Zwei der drei YouTube-Logzeilen
(10:01, 10:05) betreffen dieselbe Video-ID `7LyixHqahMQ` mit Luna **und** Terra — das ist
eine Doppelverarbeitung oder ein Retry, **kein** Beleg fuer zwei verschiedene Videos.

**Inhaltliche Fehlerquote:** In `daily\2026-09-28.md` sind 8 von 11 Einträgen
Web-/X-Eintraege, deren Ergebniswortlaut **"nicht verfuegbar"/"kein verifizierter neuer
Beitrag"** lautet. Das ist eine **qualitative Beobachtung am Dateiinhalt**, keine berechnete
Quote. Eine echte Fehlerquote erfordert die n8n-Execution-Tabelle → **BLOCKED**.

---

## Frage 6 — AUSDRUECKLICHER HINWEIS (wörtlich so zu zitieren)

> **Eine Workflow-JSON-Datei, die auf der Platte existiert, beweist NICHT, dass der
> Workflow funktionsfaehig ist.** Sie belegt ausschliesslich, dass zu irgendeinem Zeitpunkt
> ein JSON-Dokument mit dem Bauplan geschrieben wurde. Ob der Workflow importiert wurde,
> ob seine Credentials existieren, ob die Knoten in der aktuellen n8n-Version 2.35.7 noch
> existieren, ob er aktiviert ist und ob er beim Lauf Erfolg hat, ist davon **nicht**
> ableitbar. Umgekehrt gilt: `"active": true` in einer Exportdatei ist ein **Zustand beim
> Export**, kein Beleg fuer Aktivitaet jetzt.

Konkret belegt in diesem Projekt:
- `research_source_basket_blocked.json` traegt im Code-Node woertlich
  `status: 'BLOCKED'`, `dead_letter: true`, `error_class: 'SEARXNG_COMPOSE_NOT_PROVEN'` (`:17`).
  **Die Datei ist da, der Workflow ist trotzdem blockiert.**
- `gmail_readonly_skeleton.json:41` traegt `status: 'DISABLED_AWAITING_OPERATOR_OAUTH'`,
  `dry_run: true`. Datei vorhanden, Funktionalitaet ausdruecklich nicht vorhanden.
- `README.md:35-37` bestaetigt fuer alle drei Kern-Workflows: inactive bzw. BLOCKED.

---

## 7. Sicherheitsbefund (nicht angefasst, nur gemeldet)

`G:\n8n-pilot\secrets\` enthaelt fuenf Dateien:
`n8n_api_credential.json`, `n8n.env`, `n8n-owner.env`, `n8n-mcp.env`, `hermes-gateway.env`.
Zusaetzlich `G:\n8n-pilot\n8n_api_credential.json` im Projektwurzelverzeichnis.

**Ich habe diese Dateien NICHT gelesen und ihre Inhalte NICHT ausgegeben** — sie enthalten
mit hoher Wahrscheinlichkeit API-Keys. `README.md:30-31` warnt selbst davor, den
Encryption-Key "in workflow JSON, logs or reports" zu kopieren; dieser Bericht haelt sich daran.
Hinweis: `compose.yaml:40` mountet `./workflows` als `:ro` (read-only) — korrekt.
`n8n_api_credential.json` **im Wurzelverzeichnis** (nicht in `secrets/`) ist organisatorisch
auffaellig — Backup-/Copy-Risiko. **Nicht veraendert, nur gemeldet.**

---

## 8. Was dieser Audit NICHT behauptet

- NICHT behauptet: n8n laeuft / laeuft nicht gerade.
- NICHT behauptet: irgendein Workflow hat erfolgreich gearbeitet.
- NICHT behauptet: die 5 `"active": true` sind in der Live-Instanz aktiv.
- NICHT behauptet: `database.sqlite` existiert nicht (nur: sie ist auf dem Host-FS nicht auffindbar).
- NICHT behauptet: Dateigroessen, Hashes, Prozess- oder Portzustand — alle nicht messbar.
- `C:\Program Files` und `C:\ProgramData` waren **nicht durchsuchbar** (ripgrep exit 2).
  Eine n8n-Installation dort ist **nicht ausgeschlossen**.