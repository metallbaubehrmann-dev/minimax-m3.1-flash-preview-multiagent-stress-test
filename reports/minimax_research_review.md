# A6 — Research-Review MODEL_RESEARCH.md / CLAIMS.json (Abruf aller Quellen: 2026-09-28)

## Hauptvorwurf
**(1) „Kein öffentlicher API-Endpunkt" — BESTÄTIGT, die Aussage ist FALSCH.** Herstellerdoku
`https://platform.minimax.io/docs/api-reference/text-anthropic-api.md`: *„export ANTHROPIC_BASE_URL=https://api.minimax.io/anthropic"* + *„curl https://api.minimax.io/anthropic/v1/messages … "model": "MiniMax-M3.1-Flash-Preview"*.
`.../text-openai-api.md`: *„export OPENAI_BASE_URL=https://api.minimax.io/v1"* + *„model="MiniMax-M3.1-Flash-Preview"*. Beide Endpunkte, beide Model-IDs, offiziell.
**(2) „Preis fehlt ⇒ Zugang fehlt" — BESTÄTIGT als Fehlschluss.** C13 („kein Per-Token-Preis") ist richtig, wurde aber mit C10/C12 zu einer Zugangsaussage verdichtet.
**(3) Entlastung der alten Recherche — TEILWEISE.** Der eigentliche Beleg (StartupFortune, ein *Forum*-artiger Sekundärartikel) war als „unabhängig" geführt; OrcaRouter scopingt seine Aussage selbst auf den Vortag: *„Four days before the launch … because it was: no weights, no model card, no pricing page and no API model id existed."* Die Zeitbindung ging in C10/C12 verloren.

## Die drei Wege sind sauber getrennt — und dokumentiert
Endpunkt ≠ PAYG: `token-plan/intro.md`: *„available only through Token Plan and MiniMax Code for now."*
Token Plan ≠ PAYG: *„The Subscription Key is not interchangeable with pay-as-you-go API Keys."* Kein Preis ≠ kein Zugang: obwohl kein M3.1-Preis existiert, ist der Endpunkt voll dokumentiert.
**Punkt 4 (Kontingent-Gleichwertigkeit): NEIN, nicht gleichwertig — und jetzt konkret belegbar.** Max = **$55/Monat** (nicht $200), 4-5 Agents, 5-Stunden-Rolling- + Wochenfenster. Das Kontingent ist **keine veröffentlichte Tokenzahl**, sondern *„shown as a usage bar in the console"* — ein „gleiches Kontingent" ist für M3.1 vs. andere Modelle derzeit **nicht** nachweisbar.

## 9 Pruefpunkte
| # | Punkt | Ergebnis | Quelle (wörtlich) |
|---|-------|----------|-------------------|
| 1 | Kontextfenster 1M | BESTÄTIGT | `text-anthropic-api.md`: `MiniMax-M3.1-Flash-Preview` \| `1,000,000` \| *„1M context window"* |
| 2 | Multimodaler Input | BESTÄTIGT | `text-openai-api.md`: *„support text, image, and video input for `MiniMax-M3.1-Flash-Preview`"*; JPEG/PNG/GIF/WEBP, MP4/AVI/MOV/MKV, Video ≤50 MB (Files API ≤512 MB) |
| 3 | Tool Use | BESTÄTIGT (war OFFEN) | `text-anthropic-api.md`: `type="tool_use"` \| *Fully supported*; `tools` *Fully supported*; Dokuabschnitt *„Tool Use & Interleaved Thinking"* nennt M3.1-Flash-Preview explizit |
| 4 | Thinking immer aktiv | BESTÄTIGT | *„`MiniMax-M3.1-Flash-Preview` always thinks and returns `400` if `disabled` is sent."*; Fehlertext *„requires adaptive thinking … (2013)"* |
| 5 | effort low/med/high/xhigh/max | BESTÄTIGT — C08 war ABGELEITET, ist jetzt wörtlich | *„Accepts `low`, `medium`, `high`, `xhigh`, and `max`; defaults to `max` when omitted."* |
| 6 | Default effort = max | BESTÄTIGT | ebd. + *„When omitted, `reasoning_effort` defaults to `max`."* |
| 7 | Token-Plan-Zugang | BESTÄTIGT | `token-plan/intro.md`: *„available only through Token Plan and MiniMax Code for now"*; Zugang über **Subscription Key**. **Rest-Unsicherheit:** Plan-Footnote nennt Coverage *„(M3 / M2.7 / image / speech)"* ohne M3.1 — nicht auflösbar, Fußnote ist nicht erschöpfend |
| 8 | Separater PAYG-Preis | BESTÄTIGT: **existiert nicht** | `pricing-paygo.md`, LLM-Tabellen enthalten M3, M3-highspeed, M2.7(+highspeed), Legacy M2.5/M2.1/M2 — **keine Zeile für M3.1-Flash-Preview** |
| 9 | Planstufen | BESTÄTIGT, **$200 ist widerlegt** | `pricing-token-plan.md`: Plus **$22**/Max **$55**/Ultra **$132** pro Monat; Credits 1.000 = $1, 365 Tage gültig |

**C14 (keine unabhängige Messung):** kein Gegenbeleg gefunden — Hersteller nennt *„measurably improves accuracy"* **ohne jede Zahl**; models.dev ohne Benchmark. Bleibt VERIFIZIERT. **Benchmarks:** M3≠M3.1-Trennung war richtig; C03 ist nur insofern zu eng, als die Doku sehr wohl eine (unquantifizierte) Leistungsaussage enthält.

## Zu korrigierende Claims
- **C12 + C10-Halbsatz — KORRIGIERT.** OLD: „kein API-Endpunkt, den Entwickler direkt aufrufen können" (VERIFIZIERT) bzw. „kein Pay-as-you-go und kein öffentlicher API-Endpunkt". NEW: beide Endpunkte existieren offiziell und sind voll dokumentiert; kein PAYG-Zugang ja, aber ein öffentlicher Endpunkt. WHY: zwei Sachverhalte zu einem Claim verdichtet; Beleg war ein Sekundärartikel (StartupFortune), der als „unabhängig" geführt wurde, obwohl OrcaRouter seine Aussage selbst auf den Vortag scoped. SOURCE: `text-anthropic-api.md`, `text-openai-api.md`.
- **C08 — HOCHGESTUFT.** OLD: Leiter ABGELEITET, `xhigh` ungelesen. NEW: VERIFIZIERT, vollständige Leiter wörtlich. SOURCE: `text-openai-api.md`, `text-anthropic-api.md`.
- **C11 — AUFGELOEST.** OLD: Planstufe „MAX 200 USD" OFFEN. NEW: MiniMax-Token-Plan-Max kostet **$55/Monat**, 4-5 Agents; $200 gehört nicht dazu. WHY: Quellenzugriff war 2026-09-28 möglich, blieb aber aus. SOURCE: `pricing-token-plan.md`, `token-plan/intro.md`.
- **C13 + C03 — BESTÄTIGT, aber zu eng gefasst.** OLD: „kein Per-Token-Preis. Punkt." als Teil einer Zugangsaussage; „kein Benchmark-Table" als Totalaussage. NEW: kein M3.1-Preis ist korrekt (fehlt in der PAYG-Tabelle) und darf nicht mit „kein Zugang" verknüpft werden; es gibt keine Benchmark-*Zahlen*, aber die Doku behauptet unquantifiziert *„measurably improves accuracy"*. SOURCE: `pricing-paygo.md`, `text-generation.md`.
- **OFFEN BLEIBT:** konkretes Kontingent des Nutzers in Token-Plan-Einheiten (nur „usage bar" publiziert) und ob M3.1 in der Plan-Coverage-Fußnote gemeint ist.