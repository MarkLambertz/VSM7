# Handover to Codex — Step VII "Representation" (complete)

**From:** Claude (front-end / standalone assets)  **To:** Codex (VSM7 host)  **Date:** 2026-07-01
**Scope:** Everything in Step VII — all seven substeps, the three front-end surfaces, their bridges, the shared model, and every host-side integration task. Report-style; no host code included. **No Codex-owned files were touched.**

This is the umbrella entry point. Two companion docs go deeper on individual surfaces and remain authoritative for their detail:
- `ORG-CHART-HANDOVER.md` — 7.7 org chart (`window.ORG`), full contract.
- `MEETING-LANDSCAPE-BRIEFING.md` — 7.6 meetings (`window.MTL`), full spec.
- `STEP7-REPRESENTATION-BRIEFING.md` — UX rationale + asset-split reasoning for 7.1–7.7.

---

## 0. One-page map

Step VII turns the Step VI evidence into an organization: vessels (roles/functions/meetings), accountability (RASIC), operating detail, descriptions, meetings-as-steering-organs, and finally the org chart. It is a **view + editor over one canonical SCT/RASIC backbone** — never an independent source of org truth.

| Substep | What it does | Front-end surface | Bridge | Standalone? |
|---|---|---|---|---|
| **7.1 Organizational Vessels** | Accept/edit/merge/reject candidate roles·functions·meetings (system-agnostic) | `design-previews/step7-ux.html` (native) | `window.STEP7` | preview only |
| **7.2 RASIC Accountability** | The matrix editor + live warnings (the steering-allocation core) | `step7-ux.html` (native) | `window.STEP7` | preview only |
| **7.3 Metrics, Artifacts & Tools** | Optional per-SCT KPIs / artifacts / tools | `step7-ux.html` (native) | `window.STEP7` | preview only |
| **7.4 Role Descriptions** | RASIC-grouped links, editable purpose/interfaces, meeting membership, inherited+own aspects | `step7-ux.html` (native) | `window.STEP7` | preview only |
| **7.5 Function Descriptions** | Same pattern as 7.4, for functions | `step7-ux.html` (native) | `window.STEP7` | preview only |
| **7.6 Meetings & Agendas** | Cadence landscape + meeting form (steering organs, not a calendar) | **`meeting-landscape.html`** (standalone) | `window.MTL` | **yes** |
| **7.7 Organizational Representation** | The capstone org chart ("The Nested Estate") | **`org-chart.html`** (standalone, embedded in 7.7) | `window.ORG` | **yes** |

**Key architectural fact:** 7.1–7.5 live inside the `step7-ux.html` *preview* (one `window.STEP7` bridge). 7.6 and 7.7 are **separate production-grade standalone assets** with their own bridges, because they are genuinely distinct interactive surfaces (a cadence timeline; a multi-mode chart). `step7-ux.html`'s 7.6 is a native re-render; its 7.7 now **iframe-embeds the real `org-chart.html`** as a working reference for how you host it.

---

## 1. What was built / changed (all Claude-owned)

| File | What | Kind |
|---|---|---|
| `design-previews/step7-ux.html` | The 7-substep interaction base; `window.STEP7` bridge; 7.1–7.5 native editors; 7.6 native meeting charters; **7.7 now embeds `org-chart.html`** + hosts it (feeds model on `ready`, applies `requestFix` to RASIC) | Reference preview |
| `org-chart.html` | **NEW** 7.7 org chart; `window.ORG` | Standalone **and** embedded |
| `meeting-landscape.html` | 7.6 cadence landscape + form; `window.MTL`; (2026-07-01) form labels de-Germanized to English | Standalone **and** embeddable |
| `STEP7-HANDOVER.md` (this), `ORG-CHART-HANDOVER.md`, `MEETING-LANDSCAPE-BRIEFING.md`, `STEP7-REPRESENTATION-BRIEFING.md` | Docs | — |
| `asset-tests/step7-ux.spec.js` (6), `asset-tests/meeting-landscape.spec.js` (7), `asset-tests/org-chart.spec.js` (17) | Tests | — |

**Purpose of the whole:** give a workshop a legible, honest path from "who is accountable for what" (7.1–7.5) through "how do we steer" (7.6) to "here is our organization" (7.7), anchored in the SCT/RASIC model rather than boxes-and-lines, and never hiding an accountability gap.

---

## 2. Ownership boundary

**Claude-owned (I maintain; please don't edit):** `org-chart.html`, `meeting-landscape.html`, `vsm.html`, `e2e-robustness-check.html`, `channel-variety-check.html`; `design-previews/**` (incl. `step7-ux.html`); `asset-tests/**`; the briefing/handover `*.md` files.

**Codex-owned (I won't edit without explicit agreement):** `src/**`, `index.html`, `tests/**`, `AGENTS.md`, `README.md`; persistence; the canonical domain model; exports/reports; all host-side integration logic.

**Codex integrates *from the host side* (no edits to my files):** mount each surface, feed it the canonical model over its bridge, apply the intents it emits, persist canonical data, orchestrate exports. `step7-ux.html`'s 7.7 embed is a *reference* — your production host replaces it with equivalent host code.

> Note: `step7-ux.html` (7.1–7.5) is a **preview/interaction base**, not a shippable production asset — no real persistence or exports. You may (a) reimplement 7.1–7.5 natively in the host using the `window.STEP7` contract as the spec, or (b) promote parts of it (e.g. the RASIC editor) into a standalone asset the way 7.6/7.7 were. My recommendation is in `STEP7-REPRESENTATION-BRIEFING.md §3`. 7.6 and 7.7 are already production-grade standalone assets ready to embed.

---

## 3. The shared canonical model (the backbone all substeps read)

One model underlies everything. **Reference by stable id, never by name.** Shapes (identical across `window.STEP7` and `window.ORG`; `window.MTL` adds the meeting/connection records):

| Entity | Shape | Owner |
|---|---|---|
| **Unit** | `{ id, name, level:'R+1'|'R0'|'R-1', sif?:bool, parent?:unitId }` | Step I (host) |
| **SCT** | `{ id, did:'SCT-001', name, sys, prio }` | canonical (host) |
| **Contribution** | `{ id, sct:sctId, unit:unitId, sys, accUnit:unitId, text }` (SCT × unit; `accUnit` = Step IV accountable unit) | host |
| **Vessel** | `{ id, type:'role'|'function'|'meeting', name, purpose, scope:unitId, prov, state:'candidate'|'accepted', sys, alg?:bool }` — **system-agnostic**; a meeting **is** a vessel | Step VII (host registry) |
| **RASIC** | flat map `"contribId|vesselId" → 'R'|'A'|'S'|'I'|'C'` | host |
| **aspects** | `{ sctId: { kpis:[str], artifacts:[str], tools:[str] } }` (7.3) | host |
| **descriptions** | `{ vesselId: { purpose:str, interfaces:str } }` (7.4/7.5 human text) | host |
| **membership** | `{ vesselId: [meetingId] }` (role/function ↔ meeting) | host |
| **vesselAspects** | `{ vesselId: { kpis:[str], artifacts:[str], tools:[str] } }` (vessel-specific 7.4/7.5) | host |
| **Meeting record** (7.6) | `{ id (=vessel id), name, scope:{level,unitId|'shared'}, sys, cadence:{kind:'rhythmic'|'on-signal'|'one-off', every, unit, day, durationMin}, type, purpose, intendedResult, agenda:[], participations:[{vesselId,roleType}], outputs:[], decisionModes:[], loops:[] }` | host |
| **Connection** (7.6) | `{ id, from:meetingId, to:meetingId, flow:'report'|'decision'|'action-list'|'escalation' }` | host |

**Stable ids (must never change under a live model):** `unit.id`, `sct.id`, `contrib.id`, `vessel.id`, the `contribId|vesselId` RASIC key, `meeting.id` (= its vessel id), `connection.id`. Renaming `name`/`did`/`text` is safe; changing an id breaks references.

**Display-only (resolved live, never keys):** `name`, `purpose`, `prov`, `text`, `did`, `interfaces`, `intendedResult`, `sifName`, and the human strings in aspects.

**Codex must persist:** the entire model above. The assets persist **nothing canonical** — each keeps only disposable *presentation* state in its own `localStorage` (`step7-ux` view, `meetingLandscape1`, `orgChart1`).

**Cross-surface reconciliation Codex owns:**
- **Meeting = vessel.** A 7.6 meeting record and its 7.1 vessel share one id. Accept a meeting vessel in 7.1 → it can carry a cadence in 7.6.
- **membership ↔ participations.** 7.4/7.5 `membership[vesselId]=[meetingId]` and 7.6 `meeting.participations[].vesselId` are two views of the same role-in-meeting relation. Pick a single source of truth and mirror (open question §7).
- **Meeting I/O ↔ aspects.** 7.6 meeting `outputs` reference 7.3 artifact aspects — this needs stable per-item ids (open question §7).

---

## 4. Bridge contracts

All three follow the house pattern: a JS global **and** `postMessage` kept in sync; `ready{api:1}` handshake; host truth applied **silently**; the asset emits granular intents; `onEmit` inline hook; `getState()` snapshot; `TARGET='*'` on the asset side → **host must verify `event.origin`**. **Init is always: mount → asset emits `ready` → host posts `setContext` then `loadModel` (both silent) → steady state.**

### 4A. `window.STEP7` — substeps 7.1–7.5

**Host → asset:** `{cmd:'setContext', units, scts, contribs, vessels?}` (silent) · `{cmd:'loadModel', model:{vessels, rasic, aspects, descriptions, membership, vesselAspects}}` (silent) · `{cmd:'setVessels', vessels}` · `{cmd:'setRasic', rasic}` · `{cmd:'goto', substep}` (`'vessels'|'rasic'|'aspects'|'roles'|'functions'|'meetings'|'org'` or `'7.1'…'7.7'`) · `{cmd:'select', ref:{kind:'contrib'|'node', id}}` · `{cmd:'filter', spec:{sys,prio,unit,vtype,attn,q}}` · `{cmd:'setSkin', skin}` · `{cmd:'fullscreen', on}` · `{cmd:'export', …}`.

**Asset → host:** `ready{api:1}` · **`change{model}`** (debounced ~120 ms, authoritative — fires on genuine user edits) · granular intents: `vessel{op:'created'|'accepted'|'edited'|'rejected'|'merged', …}` · `rasic{contribId, vesselId, letter}` · `aspect{sctId, kind, …}` · `membership{vesselId, meetingId, op}` · `select{…}` · `goto{…}` · `warningAction{action, contribId, …}` · `fullscreenchange` · `exportError{requestId, message}`.

**getState:** `{ ctx:{units, scts, contribs, meta:{sif, sifName}}, model:{vessels, rasic, aspects, descriptions, membership, vesselAspects}, ui:{step, selContrib, selVessel, selNode, filter, skin} }`.

*Because 7.1–7.5 author canonical data, `change{model}` is the authoritative channel here (unlike 7.7). Take `change` as the debounced truth; the granular intents are for reacting precisely (undo, audit, targeted recompute).*

### 4B. `window.MTL` — substep 7.6 (meetings)

**Host → asset:** `{cmd:'setContext', units, roles, loops}` (units = recursion; roles = role vessels for participation; loops = Step VI channel ids) · `{cmd:'loadModel', model:{meetings, connections}}` · `{cmd:'select', id}` · `{cmd:'goto', mode:'landscape'|'form'}` · `{cmd:'setHorizon', timeframe:'quarter'|'6m'|'1y'|'2-5y'}` · `{cmd:'setSkin', skin}` · `{cmd:'fullscreen', on}` · `{cmd:'export', …}`.

**Asset → host:** `ready{api:1}` · `change{model}` (debounced) · `meeting{op:'create'|'move'|'delete', id, …}` · `connection{op:'create', from, to}` · `participation{meetingId, op, …}` · `mode{mode}` · `select{meetingId}` · `fullscreenchange` · `exportError`.

**getState:** `{ ctx:{units, roles, loops}, model:{meetings, connections}, ui:{mode, timeframe, selected, skin} }`. Export currently **deferred** (replies `exportError`). See `MEETING-LANDSCAPE-BRIEFING.md` for the full meeting/cadence spec and the §8 open questions.

### 4C. `window.ORG` — substep 7.7 (org chart) — *summary; full detail in `ORG-CHART-HANDOVER.md`*

**Host → asset:** `{cmd:'setContext', units, vessels, contribs, scts, rasic, sifName}` (silent) · `{cmd:'loadModel', model:{units, vessels, contribs, rasic, scts}}` (silent) · `{cmd:'select', id}` · `{cmd:'setMode', mode:'levels'|'nested'|'cabinet'}` · `{cmd:'setOverlay', id, on}` (id ∈ `colour|acct|gaps|meetings|alg|state`) · `{cmd:'setLang', lang:'plain'|'vsm'}` · `{cmd:'skin', skin}` · `{cmd:'focus', on}` · `{cmd:'fullscreen', on}` · `{cmd:'export', format, preset, requestId}`.

**Asset → host:** `ready{api:1}` · `select{kind, id}` · `mode{mode, depth}` · `overlay{id, on}` · `unfold{unitId, depth}` · **`requestFix{contribId, vesselId, letter:'A'}`** (a proposal — the chart never mutates data) · `acknowledgeException{contribId, note}` · `exportError{requestId, message}` · `fullscreenchange{fullscreen}`. *(`change` is defined for house-consistency but not emitted: 7.7 is a pure view + proposer.)*

**getState:** `{ ctx:{sif, units, scts}, model:{units, vessels, contribs, rasic, scts}, ui:{mode, lang, overlays, selected, depth, skin} }`.

**The one required host behavior for 7.7:** handle `requestFix` → apply to the RASIC store under your rules → re-feed via `loadModel`/`setContext`. The chart's headline/badges then update and the gap visibly closes. (Proven working in the `step7-ux` embed and in `asset-tests/step7-ux.spec.js`.)

### 4D. Additive bridge deltas — implemented 2026-07-01 (all backward-compatible; absent fields = prior behavior)

1. **`window.ORG` — optional host-authoritative warnings.** `setContext`/`loadModel` accept an optional `warnings` map. **If present, the chart renders it verbatim and does zero local computation** (host is the single source of truth); **if absent (default), it falls back to the parity predicate.** Adopt it whenever you're ready — no further front-end change needed.
   ```
   warnings: { [contribId]: [ { code, severity, loud?, message, vesselId?, homeUnitId? } ] }
   // code ∈ no-accountable | double-accountable | responsible-no-accountable
   //       | accountable-out-of-scope | accountable-no-support | candidate-accountable  (unknown codes render generically by severity)
   // severity 1..4 (4 loud/hard · 3 hard · 2/1 soft) → badge tier + headline bucket
   // message = verbatim inspector text · vesselId = badge anchor · homeUnitId = out-of-scope tether target
   ```
2. **`window.MTL` — aspects in context + artifact output refs.** `setContext` now also accepts `aspects` (7.3, `{id,text}` items) and `scts`; a meeting record gains `outputRefs: [artifactItemId]`. **v1 offers ARTIFACTS only as selectable meeting outputs**; kpis/tools are display/future context. Editing emits `meeting{op:'output', id, outputRefs}`.
   ```
   MTL.setContext({ units, roles, loops,
     aspects?: { [sctId]: { kpis:[{id,text}], artifacts:[{id,text}], tools:[{id,text}] } },
     scts?:   [{ id, did, name, sys }] })
   ```
3. **Aspect item shape → `{id, text}` everywhere.** `step7-ux` 7.3/7.4/7.5 now store aspect + vessel-aspect items as `{id, text}` (extra fields like `source/owner/note` tolerated, never keyed by `text`; `id` opaque, never displayed). The `window.STEP7` `model.aspects` and `model.vesselAspects` reflect this shape.

**Meeting identity & membership (decisions 6–7):** no bridge change. The asset already treats `meeting.id` as the shared stable id (host reconciles the `meeting{op:'create', id, tempId}` temp id to the canonical meeting-vessel id), and it consumes whichever of `membership` (7.4/7.5) or `participations` (7.6) you mirror — note `participations` carry a `roleType` that plain membership does not, so your single source of truth must hold participation-level detail.

---

## 5. Per-substep integration

| Substep | Where it appears | Codex persists | Codex exports/reports | Codex must test |
|---|---|---|---|---|
| 7.1 | Step VII entry — vessel register | vessels + candidate/accepted state + provenance | vessel register (optional) | accept/edit/merge/reject → `vessel` intents; `change` debounce |
| 7.2 | RASIC matrix | the RASIC map | accountability report; the **warning set** (rules live host-side) | warning parity vs asset; double-A/no-A/out-of-scope surface |
| 7.3 | Metrics/Artifacts/Tools | `aspects` (per-SCT) | — | optional aspects round-trip; empty is valid |
| 7.4 / 7.5 | Role / Function descriptions | `descriptions`, `membership`, `vesselAspects` | role/function one-pagers | editable text persist; membership persist; inherited-vs-own aspects |
| 7.6 | Meetings pane — embed `meeting-landscape.html` | `meetings`, `connections` (+ reconcile meeting↔vessel, membership↔participations) | meeting landscape image (export deferred → host-orchestrate) | `ready→setContext/loadModel`; `meeting`/`connection`/`participation` intents |
| 7.7 | Org-chart pane — embed `org-chart.html` | RASIC changes from `requestFix`; (optional) view state | **the boardroom chart** (SVG/PNG; watermark + gap-count preserved) | `requestFix` round-trip; warning parity; origin check |

**Cross-cutting host tasks:**
1. **Embedding.** Mount 7.6 and 7.7 as iframes (`allow="fullscreen"`; if sandboxed, `allow-scripts` and, for direct downloads, `allow-downloads`). Communicate via `postMessage` only (works cross-origin). Reference: `step7-ux.html` → `viewOrg()` for the exact `ready → feed → requestFix-apply` loop.
2. **Origin verification** on every inbound message (assets post with `TARGET='*'`).
3. **Warning-rule parity** (see risks) — the single most important correctness item.
4. **Export ownership** — per surface, choose direct-download (assets already produce honest, self-explaining files for 7.7) vs host-orchestrated hi-res.
5. **Persistence** of the whole canonical model; the assets persist only disposable view state.

---

## 6. Open questions & risks (decide before deeper integration)

1. **Warning-rule ownership (highest).** 7.7's chart and 7.2's grid both compute warnings from `CONTRIBS × RASIC × VESSELS` using the **verbatim `warnings()` predicate** (double-A, no-A, R-without-A, A-out-of-scope, A-without-support, candidate-A). This is safe only while the host's canonical rules equal that predicate. **Decide:** keep host rules identical, or have the host publish an authoritative warning set the surfaces render. A silent divergence makes the capstone contradict 7.2 — the worst failure mode.
2. **Vessel canonicity & id authority.** The preview assumes a host-owned vessel registry with stable ids (nothing references a vessel by name). Confirm. Every Step VII artifact points at vessels.
3. **membership ↔ participations single source of truth.** 7.4/7.5 `membership` and 7.6 `participations` describe the same role-in-meeting relation. Pick one SoT; mirror the other. Otherwise they drift.
4. **Meeting id authority + meeting-vessel duality.** A meeting is a vessel (7.1) *and* a cadence record (7.6). Confirm one id space and who creates a meeting (accept-in-7.1 vs create-in-7.6).
5. **Aspect item stable ids (blocks 7.6 I/O refs).** 7.3 `aspects` items are plain strings today. 7.6 meeting `outputs` need to reference specific artifacts — that requires **stable per-item ids** on aspect entries. Front-end change on my side once you confirm the id scheme.
6. **Cadence home.** Does cadence live on the meeting vessel or only in the 7.6 editor's meeting record? (Affects what 7.7's meetings overlay and reports can show.) See `MEETING-LANDSCAPE-BRIEFING.md §8`.
7. **Org recursion depth.** 7.7 unfolds **one** level and shows a dignified "not yet unfolded" scaffold when a unit has no `parent`-linked children. Real multi-level recursion needs the host to supply nested `UNITS` (parent chains); multi-level unfold is a deferred front-end enhancement.
8. **Function vs Step I org-unit identity.** An S1 "Mobility Unit" function overlaps the Step I "Mobility" unit — same entity or distinct vessel referencing a unit? The preview treats them as distinct; pick one to avoid double-modeling in the chart and reports.
9. **Algedonic / escalation right home.** Modeled as a vessel flag (`alg`) today, not a RASIC letter. Confirm that's the canonical home.
10. **Export ownership per surface.** 7.7 downloads honest SVG/PNG standalone (watermark + gap-count filename) and defers when embedded; 7.6 export is deferred entirely. Decide direct vs host-orchestrated; if host-side, **preserve the honesty invariants** (never omit S3★/warnings without a watermark; never add a completeness percentage — house rule).

**Known limitations / UX assumptions:** colour is off by default (layperson-safe); one R0 SIF per mounted instance; `sys` ∈ the canonical `S1/S2/S3/S3*/S4/S5` set (an unexpected value renders neutral, not a wrong line); 7.7 shows the asset's own toolbar inside the pane (a `?chrome=min` to hide it is an anticipated front-end change); animated Levels↔Nested morph, live meeting-cadence inside 7.7, and A1/PDF poster export are deferred v2.

**Front-end changes I still anticipate (pending your calls, none blocking):** `?chrome=min` for cleaner embeds; stable per-item aspect ids (item 5) so 7.6 I/O refs work; an "always download locally when embedded" flag if you won't host-orchestrate export; multi-level recursion; the animated reveal morph.

---

## 7. Test coverage

**My side — `asset-tests/**` (isolated Playwright; 102 specs green; run `cd asset-tests && npm test`):**
- `step7-ux.spec.js` (6) — 7-substep structure; 7.3 optional aspects; 7.4 role descriptions (RASIC-grouped links, editable fields, meeting membership, inherited/own aspects); `window.STEP7` model shape / silent `loadModel` / debounced `change`; **7.7 embed integration** (iframe feeds model + `requestFix` closes the loop into RASIC).
- `meeting-landscape.spec.js` (7) — `window.MTL` shape; recursion bands + markers; band collapse; timeframe zoom; drag-to-replace re-scope + emit; connect-mode typed connection; form list/cadence-edit/add-meeting.
- `org-chart.spec.js` (17) — `window.ORG` shape; levels/nested/cabinet; honest headline from verbatim `warnings()`; **S3★ badge never dropped**; Plain⇄Expert; accountability chips; warning stepper; **`requestFix` never mutates**; unfold + no-fabrication; export token-free/foreignObject-free + gap-count filename; designed empty state; meetings overlay live; channel isolation; stale-stack reconcile; no jargon leak; no completeness %.

**Codex should test (host-side):** `ready → setContext/loadModel` silent feed for each surface; `change{model}` debounce for 7.1–7.5 edits; the `requestFix` round-trip (7.7) and `meeting`/`connection`/`participation` intents (7.6) applied to persistence; **canonical warning output matches the asset's** for the shared sample; origin verification; export orchestration (if host-side).

---

## 8. Doc map

- **This file** — Step VII complete handover (all substeps + bridges + shared model + integration + risks).
- `ORG-CHART-HANDOVER.md` — 7.7 `window.ORG` full contract, per its 6-section brief.
- `MEETING-LANDSCAPE-BRIEFING.md` — 7.6 `window.MTL`, the cadence/meeting spec, and §8 open questions.
- `STEP7-REPRESENTATION-BRIEFING.md` — UX rationale + the asset-split recommendation for 7.1–7.7.
- Memory (continuity): `org-chart.md`, `meeting-landscape.md`, `step7-representation-concept.md`, `asset-test-harness.md`.
