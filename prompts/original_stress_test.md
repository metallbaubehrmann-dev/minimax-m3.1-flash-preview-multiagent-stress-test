# MiniMax Code – Multiagentischer Arbeits- und Abnahmetest

## 0. Auftrag und Erfolgskriterium

Du arbeitest auf Alexanders Windows-PC in MiniMax Code. Zielmodell dieses Tests ist die in der Oberfläche gewählte Variante „MiniMax-M3.1-Flash-Preview“. Prüfe die tatsächliche Modellzuordnung, statt aus deinem Namen darauf zu schließen.

Führe den Auftrag aus, nicht nur einen Plan dafür schreiben:

1. Lies und untersuche reale lokale Projektdateien und Konfigurationen.
2. Entwickle eine tatsächlich benutzbare, spielartige HTML-SONNENUHR.
3. Recherchiere dein eingesetztes Modell einschließlich Fähigkeiten, Kosten und unabhängiger Erfahrungen mit nachprüfbaren Quellen.
4. Ermittle Umfang und Struktur der Obsidian-Vaults, die tatsächlichen Aufgaben von n8n und die wirksamen Verbindungen zu Mnemosyne und MemFTS.
5. Nutze den vorhandenen MiniMax-Code-Agenten-Stack mit mehreren Codern und Coder-Verifier. Starte sechs getrennte Subagenten; arbeite tatsächlich parallel.
6. Durchlaufe Implementierung → Test → unabhängiges Review → Reparatur → erneuten Test, bis die neue Anwendung funktioniert oder ein belegter harter Blocker verbleibt.

Ein schöner Bericht ist kein Ersatz für eine funktionierende Anwendung. Ein gefundener Infrastrukturdefekt ist umgekehrt nicht automatisch ein Fehler deiner Untersuchung.

Selbst geschriebene Erfolgsmeldungen und Receipts sind zunächst Behauptungen. Belege sie mit ursprünglichen Tool-/Harness-Rückgaben, Dateireadbacks oder überprüfbaren Laufzeitdaten. Ein Hash sichert eine konkrete Dateiversion, nicht automatisch deren fachliche Richtigkeit.

## 1. Arbeitsgrenzen und vorhandenen Bestand nutzen

Systemuntersuchung: READ ONLY. Neue Anwendung, Tests, Quellenbelege und Berichte: Schreiben im neuen Testarbeitsraum erlaubt.

Ermittle den echten Windows-Desktop über die Betriebssystemfunktion, nicht durch Raten von Benutzername oder OneDrive-Pfad. Lege dort einen neuen, kollisionsfreien Ordner an:

MiniMax_M31_Test_<lokaler-Zeitstempel>

Dieser neu anzulegende Ordner heißt im Auftrag RUN_ROOT. Prüfe Existenz, absoluten Pfad und Schreibbarkeit. Verwende keine alten Testordner als neue Ergebnisse.

Erlaubt sind neue Dateien, isolierte Testkopien, lokale Testprozesse, Browser-Tests und notwendige projektlokale Testabhängigkeiten unter RUN_ROOT. Vor Änderungen an einem eigenen bereits geprüften Artefakt: Version/Hash und reversiblen Zwischenstand sichern.

Nicht erlaubt sind produktive Reparaturen, Dienst-/Docker-/Gateway-Neustarts, globale Installationen, Änderungen an bestehenden Agentendefinitionen, Provider-Konfigurationen, SOUL/USER/MEMORY-Dateien, produktiven Vault-Inhalten, Indizes oder n8n-Workflows. Keine neue Memory-, Router- oder Datenbankschicht bauen. Keine fremden Prozesse beenden. Keine Abos, Credits oder kostenpflichtigen Dienste kaufen.

Normale MiniMax-Code-Sessionlogs sind keine verbotene Produktivreparatur. Unvermeidbare Zugriffslogs oder automatisch ausgelöste Nebenwirkungen benennen; keine vollständige Schreibfreiheit behaupten, wenn sie nicht gegeben war. Vor einem aktiven Retrieval-Aufruf prüfen, ob er Memory schreibt, bewertet oder konsolidiert. Solche Funktionen ausschalten nur per vorhandener, temporärer Aufrufoption; sonst passiven Nachweis verwenden und die Live-Grenze melden.

Secrets nicht ausgeben oder in normale Logs exportieren. Konfigurationen anhand benötigter Felder auslesen und vor Speicherung redigieren. Keine privaten Dokumente für Modellrecherche ins öffentliche Web oder an zusätzliche Anbieter hochladen. Bevorzuge technische, nicht sensible Projektbelege.

Lies zuerst einschlägige lokale Projektregeln und tatsächlich verwendete Skills. Dokumentiere geladene Regel-/Skill-Dateien und ihre Quellen. Keine neuen Hooks nur für diesen Test in produktive Systeme einbauen.

Historische SUCHANKER, keine bestätigten heutigen Zustände:
- G:\MD3_Obsidian_Map
- G:\hermes
- G:\n8n-pilot

Prüfe diese nur gezielt und entdecke den aktuellen Bestand aus realen Konfigurationen. Keine alten Größen, Ports, Agenten-IDs oder Datenbankzahlen übernehmen.

## 2. Modell- und Agenten-Preflight

Inventarisiere die tatsächlich verfügbaren Agenten, Skills, Datei-/Terminal-/Browser-/Webwerkzeuge und den nativen Delegationsmechanismus. Benutze den vorhandenen Stack statt einer neuen Orchestrierung.

Erfasse pro Rolle:
- vorhandener Agentenname und zugewiesene Aufgabe;
- tatsächliche Session-/Run-ID und Parent-ID, soweit exponiert;
- angefordertes Modell und vom Lauf belegtes Modell getrennt;
- Provider/Zugangsweg ohne Zugangsdaten;
- Reasoning-Einstellung, soweit sichtbar;
- verwendete Tools/Skills und Belegquelle.

Modellselbstauskunft ist kein Routingnachweis. Fehlt eine gelieferte Modell-ID, markiere sie als unbekannt. Stelle bestehende Rollenmodelle nicht heimlich um. Bei gemischten Modellen lautet das Ergebnis „Stack-Test mit M3.1“, nicht „alles von M3.1 erledigt“. Getrennte Sessions desselben Modells sind keine modellübergreifende Unabhängigkeit.

Prüfe freien RAM und Speicherplatz. Sechs Cloud-Agentensessions erfordern nicht sechs lokale Modellserver. Starte keine zusätzlichen lokalen Großmodelle. Vermeide sechs gleichzeitige Vollscans derselben Festplatte. Teile einen dokumentierten Inventar-Snapshot zwischen den Untersuchern.

## 3. Sechs echte Subagenten und klare Zuständigkeiten

Du bist der koordinierende Hauptagent; die folgenden sechs Subagenten kommen hinzu. Die Rollen sind Aufgabenbezeichnungen, keine erfundenen Tool- oder Agenten-IDs. Ordne sie vorhandenen Agenten zu; verwende nötigenfalls mehrere getrennte Instanzen eines vorhandenen Rollenprofils.

A1 – CODER UI / SPIEL
Baut Oberfläche, Bedienung, Spielaufgaben und Offline-Bundle. Besitzt die UI-Dateien.

A2 – CODER SONNENMODELL
Baut Zeitumrechnung, Sonnenstand, Gnomon-/Schattengeometrie und deren dokumentierte Schnittstelle. Besitzt die Engine-Dateien. Arbeitet nach einem früh abgestimmten Vertrag mit A1.

A3 – AUDITOR OBSIDIAN / MEMORY
Untersucht Vault-Umfang, Quellen, Indizes, Mnemosyne, MemFTS und reale Retrieval-/Prompt-Pfade. Keine produktive Reparatur.

A4 – AUDITOR n8n / DATEIOPERATIONEN
Untersucht laufendes n8n, Workflowdefinitionen, Zeitpläne, letzte Ausführungen und reale Ein-/Ausgänge. Führt zusätzlich den isolierten Dateitest aus.

A5 – RESEARCHER MODELL / QUELLEN
Recherchiert das genaue Modell und prüfbare astronomische Referenzen. Liefert Quellenausschnitte und Claim-Zuordnung, keine bloße Linkliste.

A6 – CODER-VERIFIER / UNABHÄNGIGE QA
Entwirft unabhängige Abnahmetests, prüft reale Browserausführung, Dateien und Quellen sowie die Auditorberichte. Repariert nicht selbst die produktive Anwendung und darf sie nicht allein aufgrund eines Coderberichts freigeben.

Starte die erste Arbeitswelle parallel: A1–A5 bearbeiten ihre Pakete, A6 bereitet unabhängig Tests vor. Danach Übergaben und Review-/Reparaturwellen. Keine zwei Agenten gleichzeitig dieselbe Datei überschreiben lassen. Für die Integration einen eindeutigen Eigentümer bestimmen.

Jedes Handoff enthält Aufgabe, relevante Regeln, erlaubte Pfade, Eingabeversionen, erwartete Artefakte und Abnahmekriterien. Prüfe die vollständige Übergabe, insbesondere bei mehrzeiligen Aufträgen; nicht nur die erste Zeile weiterreichen. Kein pauschales Kopieren der gesamten Historie in jeden Subagenten.

Parallelitätsanforderung:
- sechs reale getrennte Subagentenläufe;
- mindestens drei Subagenten mit belegbar überlappender produktiver Arbeit;
- Ziel: alle sechs parallel, soweit der tatsächliche Account-/Harness-Pfad es zulässt.

Queued ist nicht running. Überlappende Session-Lebensdauer allein beweist keine gleichzeitige Inferenz. Dokumentiere beobachtete Arbeitsintervalle und echte Tool-/Laufereignisse. Melde maximale beobachtete Parallelität und nicht sichtbare Inferenzparallelität getrennt. Keine künstlichen Sleep-Schleifen als Parallelitätsbeweis.

Bei einem echten Parallelitätslimit: Aufgaben in belegten Wellen fertigstellen, Limit dokumentieren und die nicht erreichte Anforderung offen lassen. Keine simulierten Agentendialoge. Einzelagentenarbeit nicht als Multiagententest verkaufen.

## 4. Anwendung: eine Sonnenuhr als kleines Spiel

Titelvorschlag: „Schattenwerkstatt“.

Liefere eine eigenständige index.html mit eingebettetem JavaScript/CSS. Sie muss per Doppelklick über file:// funktionieren, ohne Internet, CDN, API-Key, externen Font oder laufenden Server. Die Entwicklung darf modular sein; das finale Artefakt bleibt eine eigenständige HTML-Datei.

### Sichtbare Pflichtfunktionen

- Sofort erkennbarer Aufbau: Sonne, horizontales Zifferblatt, sichtbarer Schattenwerfer/Gnomon, Schatten, Himmelsrichtungen und lesbare Stundenzahlen.
- Tatsächliche horizontale Sonnenuhr mit polparallel ausgerichtetem Gnomon und dazu passenden Stundenlinien; keine normale Uhr mit einem als Schatten verkleideten Sekundenzeiger.
- Demo-Eingaben: Breite 48,78° N, Länge 9,18° E, Zeitzone Europe/Berlin. Dies sind Testvorgaben, keine ermittelte persönliche Position.
- Datum, Uhrzeit, Standortkoordinaten und Zeitzone bedienbar; unterstützter Breitenbereich mindestens 5° bis 85° Nord. Nicht unterstützte Werte ausdrücklich behandeln.
- Echtzeitmodus und Simulationsmodus mit Pause, Zeitschieber und Geschwindigkeitswahl. Zeige deutlich, welcher Modus aktiv ist.
- Sonne, Sonnenhöhe, Sonnenazimut und Schatten reagieren auf Datum, Zeit und Ort.
- Bürgerliche Ortszeit, UTC und wahre Sonnenzeit getrennt und korrekt beschriftet. Sommerzeit und Zeitgleichung nicht verwechseln.
- Unter dem geometrischen Horizont: Nachtzustand, kein erfundener Sonnen-Schatten. Überlange Schatten am Horizont sinnvoll begrenzen und die Darstellungsgrenze anzeigen.
- Informationsfeld mit verwendeten Konventionen, Modellgrenzen und Herkunft des astronomischen Verfahrens.
- Drei spielbare Aufgaben mit überprüfbaren Erfolgsbedingungen, beispielsweise Nordausrichtung, eine Ziel-Schattenrichtung einstellen und die Sonnenzeit ablesen. Kein automatischer Sieg ohne passende Eingabe.
- Deutsches UI, klare große Beschriftung, Maus-/Touch- und Tastaturbedienung, brauchbares Desktop- und schmales Mobil-Layout.
- Reset stellt einen definierten Ausgangszustand wieder her. Einstellungen dürfen lokal gespeichert werden; verweigertes Browser-Storage darf die Anwendung nicht zerstören.

Optische Gestaltung darf hochwertig sein. Sie ersetzt aber weder sichtbare Zahlen noch korrekte Geometrie oder funktionierende Buttons.

### Physikalische Nachweisbarkeit

Definiere Koordinaten, Azimutrichtung, Winkelmaße, Gnomonkonstruktion und Zeitskalen schriftlich. Mathematische Engine und Darstellung müssen getrennt testbar sein. Testzeit und Zufallsseed müssen kontrollierbar sein; Tests dürfen nicht von der aktuellen PC-Uhr abhängen.

Für die allgemeine Schattenprojektion gelten diese analytischen Testvorgaben:

Koordinaten: x=Ost, y=Nord, z=oben. Für Sonnenrichtung S mit sz>0 und einen Punkt P oberhalb der Ebene z=0 muss der Ebenenschatten bei

(Px - Pz*Sx/Sz, Py - Pz*Sy/Sz, 0)

liegen. Teste damit auch einen SYNTHETISCHEN VERTIKALEN Teststift; verwechsle ihn nicht mit dem geneigten Gnomon der Anwendung:

- Spitze (0,0,1), Sonne aus Osten bei 45° Höhe → Schattenpunkt (-1,0,0).
- Spitze (0,0,1), Sonne aus Süden bei 45° Höhe → Schattenpunkt (0,1,0).
- Doppelter Stift bei unverändertem Sonnenstand → doppelte Schattenlänge.
- Sonne im Zenit → Schatten des vertikalen Stifts am Fußpunkt; undefinierte Richtungen dürfen nicht zu NaN im UI führen.
- Sonne auf/unter dem Horizont → keine normale endliche Tagesprojektion behaupten.

Diese mathematischen Beispiele sind keine vollständige Validierung des astronomischen Sonnenstands.

A6 erstellt zusätzlich mindestens acht Referenzfälle gegen ein unabhängig recherchiertes Verfahren oder veröffentlichte Referenzwerte. Datum, UTC, Koordinaten, geometrische/apparente Höhe, Azimutkonvention, Quellenstand und Toleranz müssen nachvollziehbar sein. Keine Sollwerte aus derselben zu prüfenden Engine erzeugen. Für reguläre Fälle oberhalb 5° Sonnenhöhe ist die Zielabweichung höchstens 1° bei Höhe/Azimut und zwei Minuten bei wahrer Sonnenzeit. Singularitäten und Refraktion gesondert behandeln, statt Toleranzen nachträglich passend zu machen.

## 5. Echte Browserabnahme und Regression

A6 öffnet die final erzeugte HTML-Datei in einem echten verfügbaren Browser. Quelltextlesen allein ist kein UI-Test. Nutze vorhandene Browserautomation; keine vorhandene Nutzersitzung schließen oder ersetzen.

Prüfe mindestens:
- Laden per file:// ohne unerwartete Netzabhängigkeit und ohne unbehandelte JavaScript-Fehler;
- sichtbare Zahlen, Gnomon, Schatten und Himmelsrichtungen;
- Datum-/Zeit-/Ortsänderung verändert den berechneten Zustand und die Darstellung;
- Pause stoppt die simulierte Zeit; Fortsetzen setzt sie fort;
- Sommer-/Winterzeit sowie beide Zeitumstellungsrichtungen;
- ungültige oder doppeldeutige lokale Zeit wird ausdrücklich behandelt;
- Morgen, Sonnenmittag, Abend und Nacht;
- Winter/Sommer und hoher Breitengrad mit Polartag/Polarnacht;
- alle drei Spielaufgaben: falsche Eingabe nicht gewinnen, richtige Eingabe gewinnen;
- Reset, erneutes Öffnen sowie Desktop- und Mobilansicht;
- kein dauerndes Konsolen-Spam und keine offensichtlich ungebremste Timer-/Speichervermehrung.

Screenshots mindestens für Morgen, Sonnenmittag, Abend, Nacht und schmales Layout. Jeder Screenshot gehört zu einer konkreten Artefaktversion und bekannten Eingaben. Animation durch mindestens zwei deterministische Zustände und die dazwischen nachgewiesene Änderung belegen, nicht nur durch ein Standbild.

Prüfe die Tester selbst an getrennten MUTATIONSKOPIEN: Entferne dort einmal die Stundenzahlen und kehre einmal die Schattenrichtung um. Die passenden Abnahmetests müssen beide Fehler erkennen. Diese Fehler niemals in Produktivdateien oder ins finale Artefakt einbauen. Ein guter App-Test muss anschließend die unveränderte korrekte Fassung akzeptieren.

## 6. Dateitest: lesen, schreiben, zurücklesen

A4 führt einen kontrollierten Dateitest ausschließlich unter RUN_ROOT durch:

1. Drei nicht sensible reale Projekt-/Konfigurationsdateien auswählen, begründet lesen und Befunde mit Pfad, Abschnitt und Beobachtungszeit belegen.
2. Eine eigene UTF-8-Testdatei mit Umlauten, mehreren Zeilen und eindeutigem Endmarker erzeugen.
3. Mit separatem Leseaufruf Inhalt, Länge und SHA-256 feststellen.
4. Gezielt einen Abschnitt ändern und nachweisen, dass die übrigen Abschnitte erhalten blieben.
5. Eigene Datei umbenennen, neuen Pfad lesen und Abwesenheit am alten Pfad prüfen.
6. Eine eigene Wegwerfkopie löschen und deren Abwesenheit anschließend verifizieren.

Kein Löschtest außerhalb des Testordners. Erfolg stammt aus Readback und Dateisystembefund, nicht aus „write completed“.

## 7. Systemaudit: Wie groß ist Obsidian wirklich?

Trenne Obsidian-Anwendung, registrierte Vaults, weitere gefundene Vault-Kandidaten und Suchindizes. Ein großer Index ist nicht automatisch ein großer Vault; ein Ordner mit Markdown ist nicht automatisch ein aktiv registrierter Vault.

Ermittle pro bestätigtem Vault:
- kanonischer Pfad und Nachweis seiner Registrierung/Nutzung;
- Dateianzahl, Ordneranzahl, Markdown-Anzahl und Anhänge nach Typ;
- logische Gesamtbytes, Markdown-Bytes, Anhang-Bytes und .obsidian-Konfigurationsbytes;
- Index-/Cache-/Backup-Anteile separat, nicht doppelt dazuzählen;
- größte Dateien/Unterordner und zeitlicher Stand;
- übersprungene, unlesbare oder während der Messung veränderte Bereiche.

Reparse Points/Junctions/Symlinks nicht blind verfolgen oder mehrfach zählen. Cloud-Platzhalter nicht unbemerkt massenhaft herunterladen. „Belegt auf Datenträger“ nur mit passender Messung nennen; nicht aus logischer Dateigröße erfinden. Dynamisch wachsende Bestände als Zeitfenster messen, nicht als ewige exakte Zahl.

Liefere eine maschinenlesbare Zusammenfassung, ein begrenztes Metadateninventar und einen verständlichen Bericht. Nicht sämtliche Notizinhalte in den Agentenkontext laden.

## 8. Systemaudit: Obsidian → Mnemosyne / MemFTS → Agent

Rekonstruiere die tatsächlich vorhandenen Wege, ohne aus Produktnamen eine Verbindung anzunehmen:

Quelldatei → Import/Watcher → Extraktion/Chunking → Index/Faktenstore → Retrieval → Agentenaufruf → tatsächlich bereitgestellter Kontext.

MemFTS, Mnemosyne, mögliche separate Obsidian-FTS-Indizes, Qdrant und Sessiondaten nicht gleichsetzen. Berichte auch, wenn eine Komponente bewusst nur Fakten oder Sitzungen speichert und keine vollständige Vault-Kopie sein soll.

Für jeden relevanten Weg prüfen:
- Konfiguration, implementierter Aufrufpfad, Registrierung und laufende Komponente;
- welche Vaults/Dateitypen tatsächlich dazugehören sollen;
- Datenquelle, Source-ID/Pfadbezug, Änderungs-/Indexzeit und Ausschlussregeln;
- verwaiste Indexeinträge, doppelte Quellen und erkennbare veraltete Inhalte;
- tatsächlicher Recall und – soweit sicher beobachtbar – Weitergabe an den nutzenden Agenten.

SQLite sicher lesend öffnen. Keine Migration, VACUUM, Reparatur oder Neuindexierung. Live-Datenbanken mit WAL nicht durch unkoordinierte Dateikopie als konsistent erklären; native konsistente Lesesicht verwenden und deren Grenzen protokollieren.

Coverage nur mit passendem Nenner berechnen: verschiedene erwartete Quelldateien, nicht Chunk-/Fakten-/Trefferzeilen. Unbekannter Nenner bedeutet unbekannte Coverage, nicht 0 %. Stichproben nicht als Vollerhebung ausgeben.

A6 wählt sechs geeignete, nicht sensible bereits vorhandene Quellnotizen aus verschiedenen Bereichen und Altersklassen; daraus entstehen zwölf Abfragen: je eine gezielte und eine sinngemäße Frage. Die erwartete Antwort vorher anhand der Originaldatei dokumentieren, aber dem abgefragten Agenten nicht mitliefern.

Teste die vorhandenen relevanten Retrieval-Wege. Messe richtige Quelle in Top-k, inhaltlich passende Belegstelle, Aktualität, Latenz und Fehler. Ein direkter SQL-Treffer beweist nicht, dass Hermes ihn erhält. Ein vom Modell aus eigenem Wissen beantworteter Satz beweist ebenfalls kein Retrieval.

Ein echter Ende-zu-Ende-Nachweis benötigt Trace/Toolresultat/ausgelieferten Kontext mit der zugehörigen Quelle. Ist nur der direkte Suchweg prüfbar, genau diese Stufe bestätigen und Prompt-Anbindung offen lassen. Keine Testnotizen in den produktiven Vault schreiben, um einen Treffer zu erzwingen.

Prüfe außerdem, ob tatsächlich selektiver Retrieval-Kontext verwendet wird oder trotz entsprechender Konfiguration große Memory-/Vault-Texte vollständig eingebaut werden. Nur tatsächlich sichtbare Größen messen; Token-Schätzungen kennzeichnen. Keine vollständigen privaten Systemprompts in den Bericht kopieren.

Bewertung je Weg: QUELLE GEFUNDEN → KONFIGURIERT → GELADEN → AUFGERUFEN → TREFFER GEPRÜFT → KONTEXTÜBERGABE GEPRÜFT. Jede Stufe mit eigenem Beleg; keine erfundene Gesamtprozentzahl „gut angeschlossen“.

## 9. Systemaudit: Was tut n8n tatsächlich?

Ermittle erst die reale Installation und Zugriffsmöglichkeit: nativ/Container, aktive Instanz, Version soweit belegbar, Datenhaltung und sichere lesende Schnittstelle. Alte Compose-Dateien beweisen keine laufende Instanz.

Erfasse Workflow-ID, Name, enabled/active-Zustand, Trigger/Schedule, fachliche Funktion, relevante Ein-/Ausgänge, aufgerufene Dienste, letzte tatsächliche Ausführung und letzten Fehler. Credential-Werte gehören nicht in den Bericht.

Trenne deutlich:
- Definition vorhanden;
- aktiviert/geplant;
- zuletzt erfolgreich ausgeführt;
- Ergebnisartefakt tatsächlich vorhanden;
- nachgelagerter Empfänger hat es übernommen.

Prüfe besonders tatsächlich gefundene Wege zu Research, YouTube/X/Web, Hermes, Obsidian, Memory, Exports und gegebenenfalls Drive. Diese sind Suchfragen, keine vorausgesetzten Features.

Mindestens drei vorhandene unterschiedliche Workflows anhand echter jüngerer Ausführungen bis zu ihrem Ergebnis verfolgen; gibt es weniger, den tatsächlichen Bestand berichten. JSON-Definition allein genügt nicht. Bereits vorhandene Execution-/Artefaktbelege verwenden. Keine unbekannten Webhooks auslösen, keine Nachricht senden und keinen produktiven Workflow manuell starten.

Prüfe Failures, Timeouts, Retry-/Fehlerpfade, Aktualität und mögliche Aktivierung ohne erfolgreichen Lauf. Ein leerer Feed oder „keine neuen Ereignisse“ ist nicht automatisch ein Ausfall. Maskierte Credentials oder HTTP 200 beweisen keine erfolgreiche fachliche Verarbeitung.

## 10. Modellrecherche mit belastbaren Belegen

Recherchiere das genaue Zielmodell und die im Test tatsächlich verwendeten Modelle getrennt. Aktuelle Herstellerdokumentation zuerst; anschließend originale GitHub-Issues/PRs, Hugging-Face-Modellkarten/Diskussionen und originale Nutzerberichte.

Zu klären:
- offizieller Modellname und Status der Preview;
- dokumentierte Eingabemodalitäten, Kontext und Tool-/Reasoning-Funktionen;
- Zugang in MiniMax Code, Token-Plan und separater API;
- veröffentlichter Preis, Kontingentverrechnung, Einschränkungen und eventuell nicht veröffentlichte Angaben;
- erste unabhängige Qualitäts-/Coding-/Zuverlässigkeitstests;
- konkrete positive und negative Community-Erfahrungen;
- veröffentlichte Gewichte oder nur Platzhalter/Ankündigungen.

Behandle jede frühere Chat-Aussage dazu als zu prüfende Behauptung. „Im Plan enthalten“ ist kein Nachweis gleicher Kontingentkosten wie M3. Ein möglicherweise verwandtes anonymes Modell ist ohne belastbaren Identitätsbeleg kein identischer Checkpoint. Keine selbst erfundene Halluzinationsrate und keine erfundenen Modellparameter.

Erstelle ein Claim-Register: Claim-ID, Aussage, Quelle, Autor/Herkunft, Veröffentlichungs-/Abrufdatum, kurze tragende Belegstelle, Bewertung VERIFIZIERT/ABGELEITET/OFFEN. Widersprüche sichtbar lassen. Herstellerbehauptung, unabhängige Messung und einzelner Erfahrungsbericht unterscheiden.

A6 öffnet sämtliche tragenden Quellen selbst und prüft, ob sie die konkrete Aussage tragen. Quellenverfügbarkeit und Aussagebeleg getrennt bewerten. Bei fehlendem Webzugriff die Recherche als offen kennzeichnen, nicht aus Modellwissen auffüllen.

## 11. Prüfer-Stresstest gegen falsche Freigaben

Der Hauptagent erzeugt zwölf isolierte, anonymisierte Evidence-Fälle mit maschinell festgelegten Sollurteilen. A6 bekommt nur Fallauftrag und zu prüfende Artefakte, nicht die Lösungstabelle. Zufällige IDs statt Dateinamen wie „offensichtlich_falsch“.

Abzudecken sind:
- behaupteter PASS bei fehlgeschlagenem Test;
- behauptete Dateierstellung bei fehlender Datei;
- behauptetes Fehlen einer vorhandenen Datei;
- echte Quelle, die die behauptete Aussage nicht trägt;
- erfolgreicher Test für eine ältere Artefaktversion;
- widersprüchliche Werte aus unterschiedlichen Messzeitpunkten;
- keine Daten fälschlich als Null;
- behaupteter Toolaufruf ohne Ausführungsbeleg;
- früherer Fehler, späterer Erfolg;
- vollständig korrekte Arbeit;
- korrekt eingeschränktes Teilergebnis;
- tatsächlich unauflösbarer Quellenwiderspruch.

A6 urteilt ACCEPT/REJECT/OPEN mit Beleg und benennt notwendige Nachprüfungen. Urteile vor dem Sollvergleich speichern und hashen. Danach deterministisch auswerten: falsche Freigaben, falsche Ablehnungen, falsche/offene Urteile und erfundene Ausführungen.

Gold-Daten außerhalb des dem Prüfer bereitgestellten Pakets halten. Vorhandene native Zugriffstrennung nutzen. Ein anderer Ordner oder die Bitte „nicht öffnen“ ist keine technisch erzwungene Blindheit. Wenn Zugriff technisch möglich bleibt, die Grenze ausdrücklich dokumentieren. Nicht das Produktivsystem mit erfundenen Fällen oder neuen Sperrhooks verändern.

Erstversuch separat erhalten. Nach Hinweisen bestandene Fälle dürfen den Erstversuch nicht nachträglich verbessern. Ein künstlich eingesäter Fehler ist kein realer Modellfehler; das Übersehen dieses Fehlers kann dagegen ein Prüferfehler sein.

## 12. Review- und Reparaturschleife

Mindestens zwei vollständige Prüf-/Reviewdurchläufe:

Runde 1: Implementierung/Untersuchung → echte Tests → unabhängige Befunde.
Runde 2: gezielte Reparaturen am Testartefakt → vollständige Regression → frische Endabnahme.

Bei weiteren Fehlern fortsetzen, solange ein neuer begründeter Reparaturschritt vorliegt. Keine unveränderte Endlosschleife. Drei identische Wiederholungen ohne neue Evidenz verlangen Ursachenentscheidung oder belegten BLOCKED-Status; unabhängige Arbeitspakete trotzdem weiterführen. Bei ausgeschöpftem Kontingent kein fremdes Modell heimlich übernehmen.

Pro Befund: ID, Anforderung, beobachteter Fehler, Rohbeleg, verantwortlicher Agent, konkrete Änderung, neuer Hash und Regressionsergebnis. Kein „jetzt sollte es gehen“ als Abnahme.

Nach jeder Änderung gelten alte Tests nur für die alte Version. A6 liest die endgültigen Dateien neu. Bei fehlerfreien Erstresultaten ist Runde 2 eine unabhängige Wiederholungs-/Regressionprüfung; keine Fehler erfinden, nur um einen Repair-Loop zu zeigen.

Produktive Systemfehler nur mit Ursache/Beleg, Auswirkung und kleinstem Änderungsvorschlag dokumentieren. „Loop bis funktioniert“ autorisiert hier die Reparatur deiner neuen Anwendung und Testskripte, nicht den Umbau von Hermes, n8n oder Memory.

Nach jedem wesentlichen Meilenstein knapp berichten: erledigt, gemessen, fehlgeschlagen, nächster Schritt. Nicht nach jedem Read fragen und nicht zwischen Phasen auf ein „weiter“ warten.

Vor Kontextverdichtung oder Sitzungswechsel einen knappen Checkpoint unter RUN_ROOT sichern: offene Anforderungen, letzte geprüfte Versionen, Fehlerliste, Agentenstatus und nächste konkrete Aktion. Danach anhand der Artefakte wiederaufnehmen, nicht allein aus einer Zusammenfassung.

## 13. Artefakte, Messwerte und Abschluss

Halte die Ablage kompakt. Unter RUN_ROOT mindestens:

index.html
README.md
TEST_REPORT.md
SYSTEM_AUDIT.md
MODEL_RESEARCH.md
FINAL_REPORT.md
RESULTS.json
AGENTS.json
CLAIMS.json
REVIEW_CHALLENGE_RESULTS.json
MANIFEST.sha256
src/
tests/
evidence/
screenshots/

Unterordner bei Bedarf; keine hunderten unnötigen Markdown-Dateien. Ein nativer Taskzustand bleibt führend; ein Berichtsexport ist kein zweites produktives Kanban.

Jeder maschinenlesbare Testbefund enthält: Test-ID, Anforderung, Status, tatsächliche Eingaben, erwartetes/beobachtetes Ergebnis, Run-/Agent-ID, Zeitpunkt, geprüfte Artefakthashes und Rohbelegpfad. stdout/stderr/Exitcode nur angeben, wenn wirklich verfügbar. Fehlende Werte als null/unbekannt, nicht 0.

Messe soweit verfügbar: Gesamt-/Rollenlaufzeit, reale Parallelität, erste und letzte Passrate, notwendige Reparaturen, Retries/Timeouts, Toolcalls sowie Token-/Kontingentverbrauch. Aboverbrauch, zusätzliche Geldkosten und geschätzten API-Gegenwert nicht vermischen. Keine erfundene 0-$-Rechnung bei fehlenden Abrechnungsdaten.

Abschlussstatus getrennt ausweisen:
- APP_FUNCTIONAL
- FILE_OPERATIONS
- MULTIAGENT_EXECUTION
- RESEARCH_EVIDENCE
- SYSTEM_AUDIT_COMPLETENESS
- REVIEWER_CHALLENGE
- OBSIDIAN_MEMFTS_HEALTH
- OBSIDIAN_MNEMOSYNE_HEALTH
- N8N_WORKFLOW_HEALTH
- PRODUCTIVE_CHANGES

Benutze PASS/PARTIAL/FAIL/BLOCKED/NOT_TESTED mit konkreter Begründung. Die Qualität deines Audits und die Gesundheit der geprüften Infrastruktur sind verschiedene Ergebnisse. Ein sauber belegter kaputter Workflow kann einen gelungenen Audit darstellen; ein nicht ausgeführter Pflichtversuch bleibt dennoch nicht ausgeführt.

Keine pauschale Erfolgsmeldung bei fehlender Browserabnahme, nicht belegter Multiagentenarbeit oder falsch freigegebenen Fällen. Aktueller Lauf beweist keine allgemeine Halluzinationsrate, keine 1M-Kontextstabilität und keine Windows-Neustartfestigkeit.

Vor Abschluss alle finalen Dateien nochmals lesen, Statuswidersprüche bereinigen und Hashmanifest über die endgültigen Artefakte erzeugen; das Manifest selbst nicht in seine eigene Hashliste aufnehmen. Nach einer Änderung Manifest und betroffene Prüfung erneuern. Der Abschlussbericht muss Prüflauf und Artefaktversion eindeutig verbinden.

Öffne die fertige index.html im vorhandenen Browser/Preview und nenne den absoluten Pfad. README erklärt Doppelklickstart, Spielbedienung und reproduzierbaren Testaufruf. Eine erfolgreich neu geöffnete HTML-Datei ist kein System-Reboot-Test.

Am Ende im Chat: Ergebnis der Sonnenuhr, welche sechs Agenten wirklich gearbeitet haben, beobachtete Parallelität, wesentliche Systembefunde, Erst-/Endergebnisse des Prüfers, Kosten-/Verbrauchslücken und konkrete offene Punkte. Keine dauerhafte Front-Agent-/Reviewer-Eignung aus nur diesem Lauf ableiten.

BEGINNE JETZT mit Preflight, Arbeitsraum und nativer Agenten-Discovery. Danach führe den Auftrag bis zur belegten Abnahme oder zu konkret dokumentierten Restblockern aus.