# VSM7 App-Wide Export — FINALIZATION PACKAGE

*Peer-to-peer handover, Claude → Codex. Everything below is grounded in the four verified maps and re-checked against `src/`. Wire-id stepIds only (`step1..step7|implementation`, plus the reserved app-tier `app`). Never Roman, never `step8`.*

---

## 1 · STATUS DASHBOARD

### Done — the export SURFACE (Claude's realm, shipped)
- **Shared panel** — `design-previews/export-panel.html`, `window.EXPORT api:1`, renders from the host view-model. **Do not edit** (Claude-owned).
- **Step VII relay** — `design-previews/step7-ux.html` skin/relay wired. **Do not edit** (Claude-owned). *This same relay is the export path for `step7/org-chart` — see §3.*
- **Global panel mount + sizing fix** — landed.
- **Cache-label bump** — *pending, Codex owns it* (bump on the final host PR).

### Done — 4 targets landed end-to-end (DO NOT re-assign)
| Tile | Formats | Recipe complete |
|---|---|---|
| `step3/scts` | xlsx | ✅ vm + generator + B3/B4 + tests |
| `step4/contribution-matrix` | xlsx | ✅ |
| `step5/step5-mapping` | xlsx | ✅ |
| `step7/all` | docx + pdf | ✅ |

### Remaining checklist
**Codex's realm — `src/**` + `tests/**` only:**
- [ ] **B2** shared step-⬇ helper (`stepExportButton` + `stepHeader` slot) — *blocks 9 surfaces, do first*
- [ ] `step1/all` (+ optional 5 subpage tiles) — docx; recursion folded into `sif`
- [ ] `step2-assessment`, `step2-remedies` — docx/xlsx
- [ ] `overview-project-frame` (+ decide `overview-step-outcomes` launcher)
- [ ] `implementation-backlog` (+ optional derived `implementation-findings`, `implementation-channel-weaknesses`)
- [ ] `step6-e2e` (svg/png/pdf/pptx), `step6-channels` (svg/png) — **async re-home**, reuse existing generators
- [ ] **B7** App ⬇ (`origin:'app'`, reserved `stepId:"app"`) — Report + Archive

**JOINT slice — Codex host + Claude relay (NOT `src/**`-only):**
- [ ] Phase-4: `step7/org-chart` png/svg — **last**; async iframe-relay export via the Claude-owned `step7-ux.html` → org-chart frame, reusing the client `buildExportSVG`/`svgToPng` renderers in `design-previews/org-chart.html`. Same per-tile handshake as `step7/all`. Codex must **not** edit `design-previews/**`.

**Cross-cutting:**
- [ ] Retire legacy raw-download buttons after each parity
- [ ] Final cache-label bump (Codex)

### Flagged ⛶-only exceptions (intentional — no paired ⬇)
Derived/computed views that are NOT export artifacts and stay fullscreen-only:
- `step3-drivers` (`step3.js:100`), `step3-hints` (`step3.js:413`) — computed views inside the done Step III
- `step5-signals` (`step5.js:260`) — computed steering-signals view inside the done Step V
- `implementation-findings`, `implementation-channel-weaknesses` — derived from Step VI
- `overview-step-outcomes` — a launcher/index, not content

These are the complete B4 exception set; the DoD gate (§5) enumerates them.

---

## 2 · SEQUENCING — the order that finishes fastest

**Batch A — foundation + synchronous clones (one PR)**
1. **B2 first.** Add `stepExportButton` + `stepHeader` export slot. Unblocks step-level export on 9 main + Focus surfaces and de-dups the step1 double + 2 focus strays. *Honesty gate:* only advertise the panel step-⬇ on a step that already has a step-scope VM; otherwise leave the legacy `export-step` until its VM branch lands.
2. **The docx/xlsx clones** — copy the step5 recipe verbatim: Steps I, II, Overview, Implementation. All synchronous, all derive from `workspace`. Cheapest wins.

**Batch B — async + app tier (one PR)**
3. **Step VI** — re-home via the **async `handleExportIntent` branch** (NOT `buildExportIntentArtifact`); reuse `e2eRouteDocuments.js` + coordinators verbatim.
4. **B7** — single-artifact App ⬇ (Report + Archive), reserved `stepId:"app"`.

**Batch C — joint async (last)**
5. **Phase-4 `step7/org-chart`** png/svg — async via the Claude-owned relay; joint handshake (see §3, §4).

`setBundle` / multi-artifact bundle is explicitly **out of scope** for this package (realm-handover Phase 5, after single-artifact App ⬇ parity).

**The proven 4-edit recipe** (template for every synchronous tile):
1. `getExportViewModel` case — `src/application/exportViewModels.js:3-24` (before `return null` at `:23`)
2. `buildExportIntentArtifact` branch — `src/infrastructure/exporters.js:147-185` (before `return null` at `:184`)
3. `tileExportButton(stepId,tileId,label)` next to `tileFullscreenButton` in **both** normal render **and** fullscreen render (B4+B3)
4. extend `tests/exportViewModels.test.js` + `tests/artifacts.test.js`

---

## 3 · PER-REMAINING-TILE SPEC

### B2 — Shared step-⬇ helper *(do this first)*

**Add the factory** in `renderHelpers.js` next to `tileExportButton` (~`:110`), routing through the panel:
```js
export function stepExportButton(stepId, label = "Export step") {
  return `
    <button class="tile-export-button step-export-button"
      data-action="open-export-panel"
      data-export-step="${escapeAttr(stepId)}"
      data-export-scope="step"
      data-export-origin="step"
      title="${escapeAttr(label)}" aria-label="${escapeAttr(label)}"
    ><span aria-hidden="true">⬇</span></button>`;
}
```
Dispatch already supports it (`app.js:1938-1939` reads `dataset.exportScope`/`exportOrigin` → `openExportPanel(stepId, undefined, "step", "step")`; precedent `openStep7ExportPanel` `app.js:876-879`).

**Give `stepHeader` an export slot** — add optional `actions=""` param, render `<div class="step-header-actions">${actions}</div>` before `renderMethodVisual` (`renderHelpers.js:7-16`).

**Fan across MAIN renders** (via slot): step2`:19`, step3`:48`, step4`:31`, step5`:13`, step6`:34`, implementation`:11`.
- **step1** — no `stepHeader`; add the slot to `renderStep1Stage` (`step1.js:182-192`) and **delete** the two inline buttons (`step1.js:260`, `:578`).
- **step7** — leave `step7.js:7` (iframe toolbar ⬇ already IS the step-⬇).
- **overview** — no `stepHeader`; reconcile the per-step grid `overview.js:92` (keep as index OR adopt factory — see Overview spec).

**Fan across FOCUS renders** — attach to focus tile header `renderFullscreenTileHeader` (`focusMode.js:157`) keyed by viewId; **delete** the two strays (`focusMode.js:320` step3, `:679` step7).

**HONESTY GATE:** `openExportPanel → getExportViewModel` must return a VM for `{stepId, scope:'step'}`. Existing cases are tile-scoped. So per step: either add a step-scope VM branch OR keep the legacy `export-step` (works for all 8 wire-ids via `buildStepOutcome`). Don't advertise a panel step-⬇ where no VM branch exists yet.

---

### STEP I — `step1`

**Structural traps (all confirmed in code):**
- **No `recursion` subpage.** Five subpages only: `sif`, `segmentation`, `criteria`, `six-pack`, `evaluation` (`step1.js:16,28,40,52,64`). The recursion-levels table is the **2nd fullscreen tile of `sif`** (`step1.js:284`, built `:665` from `workspace.step1.recursionLevels`). **Fold recursion into the `sif` export — never register `step1/recursion`.**
- **Step I does NOT use `stepHeader`** — bespoke `renderStep1Stage` (`step1.js:182`). B2 slot must be wired here too.
- **Step I fullscreen is bespoke** — fires `step1-tile-fullscreen-open` (not `host-tile-fullscreen-open`); both entries route through `renderFullscreenTileHeader` (`step1.js:161-172`), which today has **no action cluster** → B3 must inject the ⬇ there.

**Format honesty (docx):** `step1Doc` (`exporters.js:313`) builds HTML via `documentShell` and ships as `application/msword` under a `.docx` name — **the same convention already shipped for `step7/all`** (`buildStep7RepresentationExport` `exporters.js:305-311`: `docx` → `step7Doc`, mimeType `application/msword`). Advertise `"docx"` exactly the way `step7/all` does; it is HTML-msword, not real OOXML. (See the uniform docx note under B7.)

**Primary registration (parity now, mirrors `step7/all`):** one monolithic **`step1/all`** — `kind:"substeps"`, `substeps:[sif,segmentation,criteria,six-pack,evaluation]`, `monolithic:true`, `availableScopes:[{kind:"step",label:"Whole Step I"}]`, `availableFormats:["docx"]`, `defaultPreset:"doc"`, reusing `step1Doc` (`exporters.js:313-329` — already assembles all five subpages + recursion + decision + operative units).

**Optional per-subpage expansion** (only if per-subpage xlsx wanted):
| tileId | data source | formats | includes |
|---|---|---|---|
| `sif` | `workspace.sif.{name,purpose,customers}` (**top-level** `vsm.js:163-170`, NOT `step1.sif`) + `workspace.step1.recursionLevels[]` `{level,name,description}` | `docx` | `[]` — recursion folded here |
| `segmentation` | `step1.segmentationOptions[]` `{name,description,decisionNotes}` | `docx`,`xlsx` | `["notes"]` |
| `criteria` | `step1.keyBuyingCriteria[]` `{name,explanation,weight,relativePosition}` | `docx`,`xlsx` | `["notes"]` (weight/relativePosition are core cols, not `scores`) |
| `six-pack` | `step1.strategicFields[]` `{variable,direction,links,files}` (reuse `strategicFieldsTable` `exporters.js:382`) | `docx` | `["provenance"]` (judgment call) |
| `evaluation` | segmentation+criteria+strategicFields + `step1.evaluation.{scores,comments}` + `selectedSegmentationOptionId` + `decisionRationale` + `operativeUnits[]` (reuse `segmentationEvaluationTable` `exporters.js:403`) | `docx`,`xlsx` | `["scores","notes"]` — **only Step-I tile where `scores` is honest** |

**Honesty guardrails (Step I):** `owners`/`gaps`/`timestamps` **never** honest. `scores` honest **only** on `evaluation`. `step1Doc` currently honors **no** include toggles — either wire them or advertise conservatively.

**B3/B4/legacy placement:**
- B2: slot into `renderStep1Stage` (`:182`), delete legacy step-⬇ #1 — the SIF "Download Outcome" `export-step` button at **`step1.js:260`** — and #2 (`:578`, a dup of #1).
- B3: inject ⬇ into `renderFullscreenTileHeader` (`:161`).
- B4: pair ⬇ with lone ⛶ at `segmentation` (`:362`), `criteria` (`:395`), `six-pack` per-field (`:451`) — or rely on the single header ⬇ if going `step1/all`.
- Retire: `buildStepOutcome` step1 branch (`exporters.js:66-72`).

---

### STEP II — `step2`

Two subpages (`assessment`, `challenges` `step2.js:4-13`); two existing fullscreen tile-ids **`step2-assessment`** (`:156`), **`step2-remedies`** (`:58`) — clean B4 pairing. Uses shared `stepHeader` (`:19`), so B2 reaches it normally. Both fullscreen views route through `renderStep2FullscreenTile` (`:220`) → `fullscreenTile` with **no action cluster** → B3 gap.

**Format honesty (docx):** `step2Doc` (`exporters.js:331`) is HTML-`application/msword`, same convention as `step7/all`/`step1/all` — advertise `"docx"` identically (not real OOXML).

| tileId | data source | formats | includes | scopes/selectable |
|---|---|---|---|---|
| `step2-assessment` | `step2.horizontalAssessment` + `verticalAssessment` (`vsm.js:188-203`) + computed `evaluateStep2Variety` (`vsm.js:2052`); reuse `step2Doc` (`exporters.js:331`) | `docx`; `xlsx` for the two variety tables | `["notes"]`; `warnings` defensible (advisory `sctSignals`) — flag | `monolithic:true`, `[{tile},{step}]`, `selectable:false` |
| `step2-remedies` | `step2.options[]` `{name,timeToEffect,robustness,pros,cons,challenges}` (`vsm.js:364`) + `selectedOptionIds[]` | `xlsx`+`docx` | `[]` (pros/cons/challenges are core; "Selected" a flag) | `monolithic:true`, `[{tile},{step}]`; `selectable:true` honest — `selectedOptionIds` is a real subset; conservative default `false` |

✅ **S3\* preserved (standing rule):** `system3Star` is a real vertical-variety slider (`step2.js:207`, `vsm.js:123`) flowing into `step2Doc` (`exporters.js:347`) + `evaluateStep2Variety` (`vsm.js:2064`) — the assessment export MUST keep it.

**B3/B4/legacy:** legacy step-⬇ at `step2.js:158` (retire after parity); B4 pair ⬇ with ⛶ at remedies heading `:58`; B3 inject ⬇ into `renderStep2FullscreenTile` (`:220`); retire `buildStepOutcome` step2 branch (`exporters.js:74-80`).

**Honesty:** `owners`/`gaps`/`timestamps`/`scores` **never** honest for Step II. Advertise `xlsx` only once its branch is written.

---

### OVERVIEW — `overview.js`

Bespoke `.view-header` (`:7-17`), not `stepHeader`; `overview` filtered out of step order (`:86`). Two tiles → each needs a **tile ⬇ (B4)**, no step-⬇ concept.

- **`overview-project-frame`** — ⛶ at `:27`, legacy `export-project-report` beside it at `:28`; fullscreen `:58-66` (B3 gap). Data (`renderProjectFrameFields :69-81`): `project.status`, `sif.{recursionLevel,parentLevel,purpose,customers}`. Narrative → `docx`/`doc` only, no xlsx. `monolithic:true`, `selectable:false`. **Design option to flag:** fold this into the B7 App ⬇ `appendix` preset (it's the report's cover data) rather than build a frame-only generator.
- **`overview-step-outcomes`** — ⛶ at `:37`, fullscreen `:46-56` (B3 gap). This is a **launcher, not an artifact** — `renderStepOutcomeGrid` (`:83-97`) emits one `export-step` button per step (`:92`). **Do NOT give it a generator/format.** Two honest designs: **(A)** rewire each row to a step-scope panel open (needs each step's step-scope vm first); **(B)** retire the grid once B2 gives every header its step-⬇ (realm-handover Phase 5 chooses this). **Flag:** pairing a ⬇ with this tile's ⛶ is questionable — it's an index, not exportable content (a flagged B4 exception).

---

### IMPLEMENTATION — `implementation` *(keep `stepId:"implementation"`, never `step8`)*

`stepHeader("Implementation", …)` (`:11`) — B2 slot, no step-⬇ today. Three ⛶-only tiles.

- **`implementation-backlog`** (primary, unique artifact) — ⛶ `:75`, fullscreen `:132-140` (B3 gap; `renderImplementationFullscreenTile:99`). Data: `implementation.items[]` = `{id,challenge,requirement,responsible,dueDate,status,source,sourceStatus}` (`vsm.js:1481-1492`); `source` = e2e-finding | channel-variety-weakness | null. **Format `xlsx`** — wrap legacy `implementationTable` (`exporters.js:654-671`, 11 cols) into `buildSimpleXlsx` as `buildImplementationBacklogXlsx`. `monolithic:true`, `selectable:false`, `defaultPreset:"data"`. Includes: `owners` (Responsible), `provenance` (source-* cols), `notes`/`gaps` (status/sourceStatus). Retire `buildStepOutcome(…,"implementation")` (`:127-133`) after parity.
- **`implementation-findings`** (derived, read-only) — ⛶ `:39`, fullscreen `:108-118`. Data `getStep6FindingCandidates` (`vsm.js:1322`). `xlsx` via `e2eFindingTable` (`exporters.js:535-550`). **Flag:** duplicates Step VI E2E content — legitimately stays ⛶-only (flagged B4 exception).
- **`implementation-channel-weaknesses`** (derived, read-only) — ⛶ `:58`, fullscreen `:120-130`. Data `getStep6ChannelVarietyWeaknessCandidates` (`vsm.js:1019-1050`). `xlsx` via a small new weakness-subset table (`channelTable :515` is the full matrix, not the subset). **Flag:** also derived from Step VI — same ⛶-only treatment (flagged B4 exception).

---

### STEP VI — `step6` *(the async wrinkle — read carefully)*

Two real tiles, ⛶-only today, **zero ⬇ of any kind**. All three render paths (normal, fullscreen, Focus) funnel through the **same two functions** → **one `tileExportButton` insertion per function covers B3+B4+Focus+normal**.

| Tile | Backing asset | Render fn / ⛶ | HONEST formats |
|---|---|---|---|
| `step6-e2e` | `./e2e-robustness-check.html` | `renderStep6E2ECheck` `step6.js:63` / ⛶`:89` | **`svg,png,pdf,pptx`** |
| `step6-channels` | `./channel-variety-check.html` | `renderStep6Channels` `:160` / ⛶`:171` | **`svg,png`** |

**Real-format limits (honesty rule — this corrects any blanket `[svg,png,pdf,pptx,xlsx]`):**
- `step6-e2e`: svg/png (iframe direct), pdf/pptx (frame→png → `buildE2ERouteDocument` `e2eRouteDocuments.js`) all REAL.
- `step6-channels`: svg/png REAL. **pdf/pptx are a BLANK PROMISE** — no generator; the channel coordinator hard-rejects non-png/svg (`channelVarietyExport.js:14-16`). **Do not advertise them.**
- xlsx on either tile: feasible-but-not-built (sync `e2eFindingTable`/`channelTable`). Advertise only if built.

**THE LOAD-BEARING FINDING — re-home via `handleExportIntent`, NOT `buildExportIntentArtifact`.** The visual exports are rendered by the live iframe via async postMessage; they are **not** derivable from `workspace`, and `buildExportIntentArtifact` is synchronous with no iframe handle. Correct point = `handleExportIntent(intent)` (`app.js:914`, already async). Add a branch (glue only — generators/coordinators/`getE2ERouteDocumentContext` untouched) that:
1. locates the live frame — `[data-e2e-frame]` / `[data-channel-variety-frame]`;
2. `frameFormat = (pdf|pptx) ? "png" : format` (reuse `app.js:978`);
3. `await e2eRouteExportCoordinator.request(frame, frameFormat)` / `channelVarietyExportCoordinator.request(...)`;
4. pdf/pptx: reuse the existing call pattern at **`app.js:993-997`** — `await buildE2ERouteDocument(format, result.blob, getE2ERouteDocumentContext(frame.dataset.e2eSctId))` (`getE2ERouteDocumentContext` is defined at `app.js:1040`);
5. `downloadBrowserBlob(...)` (`app.js:1079`);
6. `postToExportPanel({cmd:"exportReady", requestId: intent.requestId, downloadName})` — echo requestId (or `exportError`).

⚠️ `handleExportIntent` calls `exportExportIntent` unconditionally (`app.js:917`), which throws for a null artifact — **intercept the step6 branch BEFORE that call.**

**Part 1 (vm case) is mandatory + blocking:** `getExportViewModel` returns `null` for step6 → ⬇ silently no-ops. Add `step6-e2e`/`step6-channels` cases (template step5/step7 `:111`/`:142`): `monolithic:true`, `availableScopes:[{kind:'tile'}]`, honest `availableFormats` above, no `selection`.

**B2/B3/B4:** import `tileExportButton` (missing at `step6.js:6-13`); insert once per function, **outside** the `options.fullscreen ? "" : tileFullscreenButton(...)` guard (`:89`,`:171`) so ⬇ shows in normal+fullscreen+Focus (lone ⬇ in fullscreen is correct). Keep-then-retire bespoke menus: E2E `<details data-e2e-export-menu>` (`step6.js:126-135`, handler `app.js:971`), Channels menu (`step6.js:172-178`, handler `app.js:1010`). **Coordinators + `e2eRouteDocuments.js` stay** — the panel path reuses them.

---

### `step7/org-chart` — Phase 4 *(JOINT async slice — do last)*

**Realm:** this is **NOT a `src/**`-only Codex tile.** Like Step VI it is an async iframe-relay export — the png/svg bytes are produced by the **client** renderer inside the Claude-owned asset `design-previews/org-chart.html` (`buildExportSVG` / `svgToPng`), reached through the Claude-owned `design-previews/step7-ux.html` relay. There is **no** `buildExportIntentArtifact` branch — the artifact is not derivable from `workspace`. **Codex must not edit `design-previews/**`.**

**Export path (mirror `step7/all`'s relay, add a format):**
- **Frame:** the org-chart runs embedded inside Step VII (`step7.js:7` iframe → `step7-ux.html` → `org-chart.html`, per the org-chart memory: "live in step7-ux 7.7").
- **Generators (reuse verbatim, client-side):** `buildExportSVG` (svg) and `svgToPng` (png) already exposed on the org-chart bridge. Do **not** rebuild these in `src/`.
- **Relay:** Claude's `step7-ux.html` forwards the panel intent to the org-chart frame and returns the blob to the host, exactly as `step7/all` is relayed today.
- **vm case (host, `src/`):** add a `step7/org-chart` case to `getExportViewModel` — `monolithic:true`, `availableScopes:[{kind:'tile'}]`, `availableFormats:["png","svg"]`, no `selection`. **Advertise png/svg only** — no pdf/pptx/xlsx generator exists.
- **exportReady/exportError** echo requestId, same as every other tile.

**Handshake:** treated as a JOINT slice with the same per-tile handshake as `step7/all` (§4). Codex lands the host vm case + wiring + tests; Claude owns the org-chart client renderer, the `step7-ux.html` relay leg, and verifies the live round-trip. Neither side edits the other's realm.

---

### B7 — App ⬇ (`origin:'app'`)

Fold the two topbar buttons — `export-project-report` "Report" (`app.js:1305`) + `export-project-json` "Archive" (`app.js:1306`; handlers `:1954`/`:1948`) — into one **App ⬇**. Report → `appendix` preset; Archive → Advanced/raw-JSON.

1. **App-scope vm** — add an app case to `getExportViewModel`. Advertise `doc` (see docx honesty note below — `buildProjectReport` is HTML-`application/msword`, **not** real OOXML docx unless built) for Report, `json` for Archive. `monolithic:true`, `selectable:false`. **Do NOT advertise pdf/xlsx** (no generator).
2. **Generator branch** — app branch in `buildExportIntentArtifact`: doc/docx → **`buildProjectReport` (`exporters.js:32`)**; json → **`buildProjectJson` (`exporters.js:23`)**. (Lines `:13`/`:18` are the `exportProjectJson`/`exportProjectReport` download wrappers — reuse the *builders*, not the wrappers.) Reuse verbatim.
3. **App ⬇ button** — `tileExportButton` doesn't emit `data-export-origin`; add a variant emitting `data-action="open-export-panel" data-export-origin="app"`. Handler already honors it (`app.js:1939`).
4. **Retire** the two topbar buttons + `overview.js:28` Download Report after parity.

**Uniform docx honesty note (applies to B7, `step1/all`, `step2-*`, and the already-shipped `step7/all`):** every "docx" in this app is HTML wrapped as `application/msword` under a `.docx`/`.doc` filename (`documentShell` → `buildProjectReport`/`step1Doc`/`step2Doc`/`step7Doc`), **not** real OOXML. `step7/all` already advertises it this way (`buildStep7RepresentationExport` `exporters.js:305-311`, mimeType `application/msword`). Advertise `"docx"` identically everywhere — do not imply OOXML unless a real OOXML generator is built.

⚠️ **CRITICAL refresh-stability subtlety — key on a reserved `stepId`, NOT on `origin`.** The `needViewModel` refresh path (`app.js:842-843 → sendExportViewModel(stepId,tileId)`, `:886-897`) rebuilds the vm from **stepId+tileId only — `origin` is dropped**. So use a reserved `stepId:"app"`, `tileId:null` that survives refresh; `origin:'app'` still drives button semantics + intent routing. This reserved id is app-tier, distinct from wire-ids, never `step8`. `setBundle`/multi-artifact bundle = out of scope (Phase 5, last).

---

## 4 · COORDINATION MODEL

**Codex (host):** for each remaining **synchronous** tile, land the full batch — view-model + generator + buttons (B3/B4) + tests — in `src/**` + `tests/**`. Never touch `design-previews/**` (Claude-owned). Owns the final cache-label bump. Does NOT re-assign the 4 landed tiles.

**Claude (surface):** owns `export-panel.html` + `step7-ux.html` + `org-chart.html` + the panel protocol. Verifies each tile's **live round-trip** — open → generate → `exportReady` (requestId echoed) → download — the same way step5/step7 were verified. Handles any **new** view-model shape the panel needs, described in a short handoff **before** Codex wires it (so the vm contract is agreed before generator work).

**Async / joint slices (Step VI, `step7/org-chart`):** the export bytes come from a live iframe, not `workspace`. Codex lands the host glue (vm case + `handleExportIntent` branch / relay wiring + tests); Claude owns the asset-side generators and relay legs and verifies the round-trip. `step7/org-chart` specifically routes through Claude's `step7-ux.html` relay to the Claude-owned `org-chart.html` renderer — Codex must not edit either.

**Shared artifact:** one tile-by-tile checklist (Section 1). Each tile flips to done only when Codex's tests are green AND Claude has verified the live round-trip.

**Per-tile handshake:**
1. Codex posts the intended `(stepId, tileId, availableFormats, availableIncludes, availableScopes)` for review.
2. Claude confirms the vm shape renders in the panel (or ships a panel tweak first).
3. Codex lands vm + generator/glue + buttons + tests.
4. Claude runs the live round-trip; on green, the tile is checked off.
5. Legacy raw-download button retired in the same PR as parity.

---

## 5 · DEFINITION OF "DONE"

- [ ] Every export-worthy tile round-trips: open → generate → `exportReady`/`exportError` (requestId echoed) → real bytes download.
- [ ] **B4:** every ⛶ has a paired ⬇, **except** these intentional, flagged ⛶-only exceptions (exhaustive list): `step3-drivers`, `step3-hints`, `step5-signals`, `implementation-findings`, `implementation-channel-weaknesses`, and the `overview-step-outcomes` launcher.
- [ ] **B2:** every step + Focus header carries exactly one step ⬇ from the single `stepExportButton` factory; the step1 double (`:260`, `:578`) + 2 focus strays collapsed.
- [ ] **Honesty rule** held: every advertised format/scope/include is actually produced — no Step VI channel pdf/pptx, no app-tier pdf/xlsx, no `step7/org-chart` pdf/pptx/xlsx, `scores` only on `step1/evaluation`, S3\* preserved in `step2-assessment`, and every `"docx"` advertised uniformly as HTML-`application/msword` (the `step7/all` convention), not OOXML.
- [ ] Wire-id stepIds only (`step1..step7|implementation` + reserved `app`); never Roman, never `step8`.
- [ ] Legacy raw-download buttons retired: `buildStepOutcome` step1/step2 branches, the two Step VI bespoke menus, the two topbar buttons, `overview.js:28`.
- [ ] `design-previews/**` untouched by Codex (org-chart + step7-ux relays stay Claude-owned).
- [ ] Host tests (`node --test`) + asset tests (150 green baseline) all green.
- [ ] Final cache-label bumped by Codex.
- [ ] Mark confirms Safari scroll intact + spot-checks a couple of live exports (including one async: Step VI or `step7/org-chart`).

*Out of scope for this package: `setBundle` / multi-artifact app bundle (Phase 5, after single-artifact App ⬇ parity).*