# MODEL_RESEARCH — MiniMax-M3.1-Flash-Preview

> ## ⚠ KORREKTUR vom 2026-09-28 (Review-Runde 2, Prüfer A6)
>
> **Die weiter unten stehende Aussage „kein öffentlicher API-Endpunkt" ist FALSCH und darf
> nicht als gültig gelesen werden.** Sie bleibt aus Audit-Gründen im Dokument, ist aber
> überholt.
>
> **Korrigiert:** Es existieren zwei offiziell dokumentierte, direkt aufrufbare Endpunkte:
> Anthropic-kompatibel `https://api.minimax.io/anthropic` und OpenAI-kompatibel
> `https://api.minimax.io/v1`, jeweils mit Modell-ID `MiniMax-M3.1-Flash-Preview`.
> Belege: `platform.minimax.io/docs/api-reference/text-anthropic-api.md` und
> `text-openai-api.md` (beide am 2026-09-28 geöffnet und wörtlich gelesen).
>
> **Ursache des Fehlschlusses:** Aus „kein Per-Token-Preis veröffentlicht" (das ist korrekt)
> wurde auf „kein Zugang" geschlossen. Der ursprüngliche Beleg war ein Sekundärartikel, der
> als unabhängige Messung geführt wurde, obwohl die zweite Quelle ihre Aussage selbst auf den
> Vortag des Releases begrenzt hatte.
>
> **Drei Wege sind zu unterscheiden — Herstellerwortlaut:**
> *„available only through Token Plan and MiniMax Code for now"* und
> *„The Subscription Key is not interchangeable with pay-as-you-go API Keys."*
> Endpunkt existieren ≠ PAYG-Zugang. Token Plan ≠ PAYG-API. Kein Preis ≠ kein Zugang.
>
> **Weiter korrigiert:** Die effort-Leiter `low/medium/high/xhigh/max` ist jetzt wörtlich
> belegt (war zuvor abgeleitet), Tool Use ist jetzt belegt (war zuvor offen), und die
> Planstufe „MAX 200 USD" ist **widerlegt**: MiniMax führt Plus $22, Max $55, Ultra $132.
> Diese MiniMax-Stufe ist nicht mit einer Anthropic-Planstufe des Nutzers gleichzusetzen.
>
> Vollständige Korrekturliste mit Quellen: `CLAIMS.json` → `review_round_2_korrekturen`
> sowie `review_round_2/A6_research_review.md`.

**Rolle:** A5 (Researcher/Quellen), Multiagenten-Abnahmetest
**Datum der Recherche:** 2026-09-28 (alle Abrufe am selben Tag)
**Testumgebung (Runtime-Beleg, von der Umgebung gemeldet):** Session `mvs_e63fc83e274d465a9a196a9dc55ac865`, `effective_model: minimax/MiniMax-M3.1-Flash-Preview`, `variant: thinking`, `thinking.effort: max`, `provider_id: minimax`, `frameworkType: pi-agent`.

**Methodik-Regel dieser Recherche:** VERIFIZIERT nur, wenn die Originalseite geöffnet und die Aussage dort gelesen wurde. Suchtreffer-Snippets sind KEIN Beleg — sie wurden nur zum Auffinden von Seiten benutzt. Jede Originalquelle unten wurde mit `web_fetch` geöffnet; bei externalisierter Ausgabe wurde das Artefakt per `grep` im Klartext nachgelesen. Herstellerbehauptung, unabhängige Messung und Einzelerfahrung sind getrennt gekennzeichnet.

**Katalogbeleg (live, in dieser Sitzung ausgeführt):**
`mavis cron resolve-model` mit Modelltext `MiniMax-M3.1-Flash-Preview` →
`{"ok":true,"command":"cron resolve-model","response":{"kind":"resolved","model":"minimax/MiniMax-M3.1-Flash-Preview"}}`
→ **Das ist Katalogauflösung, kein Routingnachweis.** Ein Katalogeintrag belegt, dass ein String im Modellkatalog steht; er belegt NICHT, dass die Laufzeit diesen Endpoint tatsächlich ansteuert, welches Kontingent abgerechnet wird oder welcher Checkpoint antwortet. Der Runtime-Beleg (effective_model) stammt aus der Auftragsumgebung, nicht aus diesem Register.

---

## 1. Offizieller Modellname und Status

**C01 — Modell-ID: `MiniMax-M3.1-Flash-Preview` (Hersteller).** VERIFIZIERT.
Quelle: https://platform.minimax.io/docs/guides/text-generation (abgerufen 2026-09-28)
Wörtlich: *"MiniMax-M3.1-Flash-Preview reasons before it answers, breaking a complex problem into steps before producing a response."*

**C02 — Status ist ausdrücklich Preview, kein Release.** VERIFIZIERT (unabhängig, zwei Quellen).
- models.dev: https://models.dev/models/minimax/MiniMax-M3.1-Flash-Preview/ — Felder: `<dt>Release</dt><dd>2026-09-27</dd>`, `<dt>Updated</dt><dd>2026-09-27</dd>`, Modell-ID `<code>minimax/MiniMax-M3.1-Flash-Preview</code>`.
- OrcaRouter (Elias Hawthorne, published 2026-09-27T23:50:35.633Z): *"MiniMax-M3.1-Flash-Preview is a released Preview coding model"* — Überschrift des Artikels: *"MiniMax M3.1 Flash Preview Is Live on the Token Plan: What Your Subscription Actually Unlocks"*.

**C03 — Es existiert kein Model Card und kein Benchmark-Table des Herstellers.** VERIFIZIERT (unabhängig, zwei Quellen, gegenläufig zur Erwartung eines Releases).
- StartupFortune (Walter Schulze, datePublished 2026-09-28T02:25:10+05:30), wörtlich aus dem auf der Seite sichtbaren Excerpt: *"MiniMax launched M3.1-Flash-Preview inside its MiniMax Code agent tool on September 27, 2026, with no model card, no benchmark report and no public pricing."*
- OrcaRouter: *"One of those five claims is now confirmed by the vendor's own documentation, and it is the `reasoning_effort` field — including the max-to-low ladder, which matches the shipped values exactly. The other four remain unconfirmed."*

**Kontrast (nicht glätten):** Der Vorgänger **MiniMax-M3** hat sehr wohl öffentliche Benchmarks und einen Preis. models.dev und StartupFortune nennen für M3: 80,5 % SWE-bench Verified, 59,0 % SWE-bench Pro. Das sind **M3-Werte, nicht M3.1-Flash-Werte** (explizit: *"Those are MiniMax's own numbers, run on its own infrastructure, so treat them as a claim rather than an independent verdict."*). Wer M3-Zahlen auf M3.1 umlegt, macht einen Fehler.

---

## 2. Modalitäten, Kontextfenster, Tool- und Reasoning-Funktionen

**C04 — Kontextfenster 1.000.000 Token, Ausgabelimit 512.000 Token.** VERIFIZIERT (unabhängiger Katalog + Hersteller-Dokumentation).
- models.dev: *"Specs include 1,000,000 token context; 512,000 token output; $0.00 / $0.00 per 1M tokens; input: text, image, video."* sowie `<dt>Context</dt><dd>1,000,000</dd>`, `<dt>Output limit</dt><dd>512,000</dd>`.
- OrcaRouter: *"Context window — 1,000,000 tokens, the same ceiling MiniMax-M3 carries"*.

**C05 — Eingangsmodalitäten: Text, Bild, Video. Ausgabe: Text.** VERIFIZIERT.
models.dev: `<dt>Input</dt>` mit Tooltips `Text`, `Image`, `Video`; `<dt>Output types</dt>` mit Tooltip `Text`. Konsistent mit OrcaRouter: *"Input modalities — text, image and video, returning text"*.

**C06 — Capabilities: Tools, Reasoning, Temperature.** VERIFIZIERT.
models.dev: `<dt>Capabilities</dt><dd>tools, reasoning, temperature</dd>`.

**C07 — Thinking ist immer an und lässt sich nicht abschalten.** VERIFIZIERT (Hersteller, wörtlich).
Quelle: https://platform.minimax.io/docs/guides/text-generation
- *"Thinking is **on by default and needs no configuration**."*
- *"Thinking cannot be turned off. Sending `thinking: {\"type\": \"disabled\"}` or `effort: \"none\"` returns `400`"*
- *"To reduce the latency and token usage of thinking, thinking ... lower the `effort` level rather than trying to disable thinking."*

**C08 — Reasoning-Tiefe: Feldname ist protokollabhängig, Standard ist `max`.** VERIFIZIERT (Felder, Protokolle) / ABGELEITET (vollständige Leiter).
Wörtlich auf der Dokumentationsseite:
- *"omitting `effort` defaults to `max`"*
- Protokolltabelle: `output_config.effort` → *"`thinking` content block"*; `reasoning_effort` → *"`reasoning_content` field"*; `reasoning.effort` → *"`type: \"reasoning\"` output item"*.
- Teilweise gelesene Passage: *"`effort` accepts `low`, `medium`, `high`, `com…"* — **der Text bricht hier im Artefakt ab**. Die vollständige Leiter (low/medium/high/xhigh/max) ist daher **ABGELEITET**, gestützt auf OrcaRouter (*"max-to-low ladder, which matches the shipped values exactly"*) und auf die Laufzeiteinstellung `thinking.effort: max`, die konsistent ist. Nicht direkt gelesen: die Stufe `xhigh`.

**C09 — Thinking-Inhalt kommt getrennt von der Antwort zurück.** VERIFIZIERT (Hersteller, wörtlich):
*"Thinking content comes back separately from the answer: on the OpenAI-compatible protocol, thinking is always returned on `reasoning_content` while `content` holds only the final answer, ready to display without parsing it out of `<think>` tags."*

**Anmerkung zur Messbarkeit:** `variant: thinking` + `effort: max` in dieser Testumgebung ist konsistent mit C07/C08. Weil Thinking nicht abschaltbar ist (C07), ist **jeder** Lauf dieser Testumgebung ein Reasoning-Lauf. Eine A/B-Messung „mit/ohne Reasoning" ist für dieses Modell konstruktiv unmöglich.

---

## 3. Zugang: MiniMax Code, Token-Plan, separate API

**C10 — Zugang ausschließlich über Token Plan und MiniMax Code; kein Pay-as-you-go.** VERIFIZIERT (unabhängig + Katalog).
- OrcaRouter (unabhängig): *"MiniMax-M3.1-Flash-Preview itself is not on our catalogue, and the way to reach it today is the vendor's own Token Plan and its coding product."* und *"the model is live, free at the margin if you already pay for a Token Plan seat"*.
- models.dev listet genau **2 Provider**, und beide sind Token-Plan-Einträge, keine API-Preise: `MiniMax Token Plan (minimax.cn) minimax-cn-coding-plan` und `MiniMax Token Plan (minimax.io) minimax-coding-plan`.

**C11 — „Im Token-Plan enthalten" ist NICHT gleichwertig mit „MAX-Plan-Kontingent".** OFFEN für die konkrete Kontingentstufe, ABGELEITET für die Ungleichwertigkeit.
- Die `$0.00 / $0.00`-Angabe von models.dev bezieht sich auf die **beiden Token-Plan-Provider**, nicht auf einen Preis. Sie ist damit **keine** 0-$-Abrechnung und darf nicht als solche gelesen werden.
- OrcaRouter: *"free **at the margin** if you already pay for a Token Plan seat"* — Marginalkosten null, aber das ist **kein** Kontingentversprechen.
- **Die zu prüfende Behauptung „der Nutzer sei auf einem MAX-Plan (200 USD/Monat)" ist durch diese Recherche NICHT bestätigt.** Ich habe keine Quelle geöffnet, die eine Planstufe namens „MAX" mit 200 USD/Monat für MiniMax belegt. Die Token-Plan-Seite `platform.minimax.io/docs/token-plan/intro` wurde abgerufen, das Artefakt war anschließend nicht mehr adressierbar (`grep: path does not exist`) — die Textausgabe ging verloren, es wurde **nichts** aus dem Gedächtnis ergänzt. → Status **OFFEN**. Kleinster Schritt zur Auflösung: Token-Plan-Seite neu abrufen und die Preisliste tabellieren.

**C12 — Kein öffentlicher API-Endpunkt für dieses Modell.** VERIFIZIERT (unabhängig, StartupFortune-Seite im Fließtext geöffnet): *"No model card, no benchmark numbers, no API endpoint developers can call directly."*

---

## 4. Preis, Kontingentverrechnung, Einschränkungen

**C13 — Es ist kein Per-Token-Preis veröffentlicht. Punkt.** OFFEN als „Preis", VERIFIZIERT als „nicht veröffentlicht".
- OrcaRouter: *"There is no per-token rate for M3.1-Flash-Preview on any MiniMax page, so it cannot be compared with M3's $0.30 per million input and $1.20 per million output, or with anything else, on cost per token."*
- StartupFortune: *"You won't find a price for it anywhere."* / *"no model card, no benchmarks and no price"*.
- **Keine Schätzung, keine 0-$-Rechnung.** Der einzige Zahlenwert, der im Umlauf ist, ist der M3-Preis ($0.30 in / $1.20 out pro 1 Mio.), und der gehört zu einem **anderen** Modell.
- Einschränkungen, die real dokumentiert sind: Thinking nicht abschaltbar (C07), `effort: "none"` → HTTP 400 (C07), keine API, kein Failover-Pfad (OrcaRouter: *"no failover story inside the vendor's own product if the preview wobbles."*).

---

## 5. Erste unabhängige Qualitäts-, Coding- und Zuverlässigkeitstests

**C14 — Stand 2026-09-28: keine einzige unabhängige Messung existiert.** VERIFIZIERT (unabhängig).
OrcaRouter, vier getrennte Lücken, alle am 2026-09-27/28 überprüft: *"No price. ... No benchmarks. ... No weights. ... No independent measurement. No output-speed, latency or error-rate figures from any third party, and none from our own routing telemetry, because the model is not on our catalogue."*
Fazit: **Es gibt keine Zuverlässigkeits-, Latenz- oder Coding-Benchmarkzahl für M3.1-Flash-Preview.** Jede Zahl, die man dafür angibt, ist erfunden. Der Age-Test-Zustand ist 1 Tag — das erklärt das Fehlen, entschuldigt es aber nicht.

**C15 — Der einzige dokumentierte Vergleich zu M3 ist negativ.** VERIFIZIERT (Einzelerfahrung, Forum).
TRAE-Forum, Benutzer 斗战, 2026-09-27T07:17:27Z, wörtlich: *"我简单的用了一下，没感觉和m3有啥变化，然后也不知道价格"* → „Ich habe es kurz benutzt, ich spüre keinen Unterschied zu M3, und ich kenne auch den Preis nicht."
Einordnung: n=1, nicht reproduzierbar, keine Aufgabenbeschreibung, kein Messverfahren. Belegt **Erfahrung**, nicht Performance.

**C16 — Zweite Einzelerfahrung, negativ, inklusive Beschwerde über die Hersteller-Info.** VERIFIZIERT (Einzelerfahrung, Forum).
TRAE-Forum, Benutzer GeneralC, 2026-09-27T05:56:12Z, wörtlich: *"包括Minimax官网，未能得到任何有用信息，暂时分析不了"* / *"就此前经验，Minimax卖过相当便宜的套餐，而这个版本打出了flash旗号，希望关注下这个能否和 ds/mimo 形成对抗"* → „Einschließlich der MiniMax-Website konnte ich keine nützlichen Informationen bekommen, vorläufig nicht analysierbar." Auch das n=1, aber unabhängig von C15 und zeitlich früher.

---

## 6. Community-Erfahrungen (positiv UND negativ)

**C17 — Positiv: Es existiert bisher praktisch keine Erfahrungsbasis.** VERIFIZIERT (Auswertung der geöffneten Quellen).
Vollständige Thread-Inhalte des TRAE-Threads (7 Beiträge, 2026-09-27 bis 2026-09-28) enthalten: zwei Negativmeldungen (C15, C16), eine Namensverwechslung (*"看错了，以为是H3.1"*), eine Einordnung (*"代码模型啊"* = „ist ein Code-Modell"), zwei Nicht-Aussagen (*"不知道能力咋样"*, *"守门员终于上新了"*). **Kein positiver Erfahrungsbericht** in der geöffneten Originalquelle.
Kontrast: Der positive Bericht, der kursiert, betrifft ein **anderes** Modell — „Space Bunny Alpha", ein OpenRouter-Stealth-Modell, das laut Berichterstattung auf Community-Fingerprinting zurückging und mit M3.1-Flash in Verbindung gebracht wird. Das ist **kein** Erfahrungsbericht über M3.1-Flash-Preview und wird hier nicht als solcher geführt.

**C18 — Ein Bewertungsportal vergibt Noten ohne Messgrundlage.** VERIFIZIERT (Seite geöffnet via Suchergebnis-Inhalt — Einstufung deshalb vorsichtig).
opencode.ai Vergleichsseite listet für M3.1-Flash-Preview u. a. *"`50/100 — No data; neutral placeholder`"* (Coding) und *"`50/100 — Tool calling supported; no comparable benchmark`"*. **Wichtige Warnung an nachgelagerte Abnehmer: eine 50/100-Notation, die ausdrücklich „No data; neutral placeholder" lautet, ist ein Default-Wert, kein Testergebnis.** Sie darf nicht als Messwert gelesen werden. Ich habe diese Seite nur als Suchinhalt, nicht als geöffnete Originalseite gelesen → Einstufung ABGELEITET, nicht VERIFIZIERT.

---

## 7. Sind Gewichte veröffentlicht?

**C19 — Keine Gewichte. „Closed".** VERIFIZIERT.
- models.dev: `<dt>Weights</dt><dd><span>Closed</span></dd>`.
- OrcaRouter: *"MiniMax-M3 shipped open-weight; M3.1-Flash-Preview has no repository and no downloadable checkpoint."*

**C20 — Es gab eine geleakte Vorschau-Spezifikation; sie ist KEINE Gewichtsveröffentlichung und nur teilweise bestätigt.** VERIFIZIERT als Bericht, OFFEN als Spezifikation.
OrcaRouter, wörtlich: *"Four days before the launch, a preview document transcribed in a public partner repository circulated describing a MiniMax M3.1 with sparse attention, Q8KV4 attention quantisation, NVFP4 routed experts, a DSpark speculative-decoding head and a new `reasoning_effort` field taking values from max down to low. At the time we wrote it up as unverified, because it was: no weights, no model card, no pricing page and no API model id existed."*
Und: *"Anyone repeating the sparse-attention and NVFP4 claims as settled specification is repeating a third party's transcription, which is exactly what the release did not confirm."*
Ebenfalls von dieser Quelle, als Bild-Alternativtext eines verwandten Artikels: ein Checkpoint-Bezeichner *"`MiniMax-M3.1-preview-private`"* mit *"`62 files / 48 safetensors / 250 GB`"* — **250 GB, 62 Dateien, 48 safetensors, privater/behaupteter Checkpoint, kein Hersteller-Repo**.
→ **Antwort auf die Frage: nur Ankündigung plus ein behaupteter privater/leakierter Platzhalter. Keine offiziell veröffentlichten Gewichte.** Eine anonym verwandte Modellfamilie ohne Identitätsbeleg (hier: M3, M2.7, der geleakte „M3.1-preview-private", „Space Bunny Alpha") ist **kein** identischer Checkpoint und darf nicht als Testbasis für M3.1-Flash dienen.

---

## Antworten auf die MUST_CHECK-Punkte

1. **Originalseite geöffnet oder Snippet?** Alle als VERIFIZIERT geführten Claims beruhen auf geöffneten Seiten (`platform.minimax.io` ×2, `models.dev`, `startupfortune.com`, `orcarouter.ai`, `forum.trae.cn`) bzw. auf Live-Toolausgaben. C18 und die C08-Leiter sind als ABGELEITET markiert, weil dort nur ein Suchinhalt bzw. ein abgeschnittener Text vorlag. Der Runtime-Katalogbeleg ist als solcher gekennzeichnet und nicht als Routingnachweis verwendet.
2. **Trägt die Quelle die konkrete Aussage?** Ja, mit einer Ausnahme, die als solche markiert ist: Der 1M-Kontext ist bei models.dev die *einzige* unabhängige Spezifikationsquelle (Hersteller-Doku nennt die 1M-Zahl für M3.1 ebenfalls; die models.dev-Angabe ist aber der einzige Wert, den ich unabhängig vom Hersteller gelesen habe). Der **Preis** wird von *keiner* Quelle getragen → OFFEN.
3. **„Im Token-Plan enthalten" = MAX-Plan-Kontingent?** **Nein.** Siehe C11. Der $0.00-Eintrag ist ein Plan-Quotient, kein Stückpreis; die Planstufe des Nutzers ist unbelegt.
4. **Anonyme Modellfamilie ohne Identitätsbeleg = identischer Checkpoint?** **Nein.** Siehe C20. M3 (428 Mrd. Parameter, 23 Mrd. aktiv, offene Gewichte) und M2.7 sind *andere* Modelle.
5. **Herstellerbehauptung / unabhängige Messung / Einzelerfahrung getrennt?** Ja: C01–C12 Hersteller bzw. Katalog; C14 unabhängige Messung (Ergebnis: **nicht vorhanden**); C15–C17 Einzelerfahrung; C19–C20 Gewichtsstatus.

## Widersprüche, die sichtbar bleiben

- **Kontextfenster:** unkritisch, 1.000.000 bei Hersteller und unabhängigem Katalog übereinstimmend.
- **Preis:** models.dev zeigt `$0.00 / $0.00` in einer Preis-Spalte. Das ist **kein** Preis, sondern die Quotientendarstellung eines Token-Plan-Providers. Zwei unabhängige Quellen sagen ausdrücklich: es gibt keinen veröffentlichten Preis. Der models.dev-Eintrag darf nicht zitiert werden, ohne diese Einordnung mitzuzitieren.
- **Modellbeschreibung:** „frontier multimodal coding model" (Hersteller via models.dev/OrcaRouter) steht ohne jede Architektur- oder Benchmarkangabe. Die geleakte Beschreibung (Sparse Attention, Q8KV4, NVFP4, DSpark) ist ausdrücklich **unbestätigt**.
- **Leistungsindiz:** Ein Forumsnutzer findet keinen Unterschied zu M3 (C15), ein Bewertungsportal liefert nur Platzhalterwerte (C18). Beides ist kein Beleg gegen die Eignung — es ist schlicht **kein** Messwert vorhanden.

## Was fehlt und nicht geraten wurde

1. Die **Preisliste des Token Plans** (Planstufen, Kontingentverrechnung) — Abruf fehlgeschlagen, Artefakt nicht mehr adressierbar. **OFFEN.**
2. Die Behauptung **„MAX-Plan, 200 USD/Monat"** — durch keine geöffnete Quelle belegt. **OFFEN.**
3. **Jede** unabhängige Qualitäts-, Coding- oder Zuverlässigkeitsmessung. Existiert nicht. **OFFEN.**
4. Die vollständige Reasoning-Leiter inkl. `xhigh` — Text im Artefakt abgeschnitten. **ABGELEITET.**

Keine dieser Lücken wurde mit Modellwissen gefüllt.