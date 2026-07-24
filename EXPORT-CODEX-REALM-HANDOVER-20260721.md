# HANDOVER TO CODEX — Finish the App-Wide Export Module (your realm)

Peer-to-peer. Grounded in `src/` as of app-shell cache label `20260721-safari-sct-scroll-2`. Nothing here re-assigns work you already landed.

---

## 1 · Status & scope

**Done (don't redo):**
- **Claude surface** — the one shared panel `design-previews/export-panel.html` (`window.EXPORT api:1`) is built, hardened (4 conformance fixes), and parity-verified against your first slice. Step VII surface relay in `step7-ux.html` is built and waiting on your host side (§4). `asset-tests/` green (150).
- **Your Phase 0 + start of Phase 1** — singleton mount (`ensureExportPanelFrame` app.js:731), `handleExportBridgeMessage` (app.js:747), `getExportViewModel` registry, `exportExportIntent` + real xlsx generators, tests green. This already covers **two** targets end-to-end: `step3/scts` **and** `step4/contribution-matrix` (registry `exportViewModels.js:7`, generators `buildStep3SctRegisterXlsx`/`buildStep4ContributionMatrixXlsx`, `tile ⬇` on step3.js:73 + step4.js:72,81, tests `exportViewModels.test.js`/`artifacts.test.js`). **Step IV is your reference implementation** — it's already B3-correct (⬇ carried into fullscreen via the toolbar).

**This handover covers the rest of your realm:** per-step/per-tile fan-out, the remaining B-fixes (B2/B3/B4/B5/B7), the B6 Step VII host handshake, the migration/retirement order, and acceptance criteria.

**Boundary (hard):** you do **not** edit `design-previews/export-panel.html` or `design-previews/step7-ux.html`. Any new view-model field goes through the handoff (`STEP1-4-EXPORT-CODEX-HANDOFF.md` §A) before you emit it.

---

## 2 · The fan-out contract (one paragraph)

For each new target you add exactly two things, keyed on the same `(stepId,tileId)` tuple the intent carries (`api:1 && stepId && tileId && format`): **(1)** a `getExportViewModel(...,{stepId,tileId,...})` case in `exportViewModels.js` returning the full vm shape, and **(2)** a `buildExportIntentArtifact` branch in `src/infrastructure/exporters.js` that generates the file. The **honesty rule governs everything**: the panel renders *only* what the vm advertises via `availableFormats` / `availableScopes` / `availableIncludes`. Under-populate and you silently hide real capability; over-populate and the panel offers a section your generator must no-op — a blank promise. So advertise a format only once its generator exists, and list an include (`notes|warnings|scores|owners|provenance|timestamps|gaps` — any subset) only if the generator actually honors it. Zero-count scope → panel disables it; N/A scope (e.g. `selection` on a monolithic tile) → omit it. `exportReady`/`exportError` are `requestId`-correlated — echo it back.

---

## 3 · Per-step plan (I–VII + Overview + Implementation)

Legend: **B2** shared step ⬇ · **B3** ⬇ in fullscreen/Focus renders · **B4** ⬇/⛶ pairing on monolithic tiles · **B5** keep Step VI's native formats · **B7** absorb the two global buttons.

| Step / file | Register `(stepId,tileId)` | Honest formats | B-fixes | Notes |
|---|---|---|---|---|
| **I** `step1.js` | `sif`, `segmentation`, `criteria`, `six-pack`, `evaluation` | Start `docx` (reuse `buildStepOutcome`/`step1Doc` shell); `xlsx` where tabular | **B2 (de-dup)**, **B3** | `step1Subpages` has exactly **five** ids (step1.js:16,28,40,52,64) — no standalone `recursion`. The recursion-levels view is the **second fullscreen tile of the `sif` subpage** (`renderStep1TileButton("sif",2,…)` step1.js:284), so fold recursion export into the `sif` vm (sub-scope), **not** a sibling tileId. The step ⬇ (`export-step data-step="step1"`) is **duplicated**: SIF section `:260` **and** Evaluation `:578`. Collapse to one header ⬇. Fullscreen tiles (`renderStep1FullscreenTile`) carry ⛶ but no ⬇ → add. |
| **II** `step2.js` | `step2-assessment`, `step2-remedies` | `docx`; `xlsx` for the variety/lever tables | **B4**, **B3** | Monolithic. One legacy `export-step` at `:120`. `renderStep2FullscreenTile:182` renders both via `tileFullscreenButton` (⛶) — pair with ⬇. |
| **III** `step3.js` | `scts` ✅ **done**; add `step3-drivers`, `step3-hints` | `scts`=`xlsx` (live); drivers/hints `xlsx`/`docx` | **B3**, retire `:44` | Carry the existing `scts` ⬇ into `renderStep3FullscreenTile:105` (currently dropped). Retire legacy `export-step` at `:44` only once a `drivers` vm+generator exists. |
| **IV** `step4.js` | `contribution-matrix` ✅ **done** | `xlsx` (live) | — reference | Already B3-correct. Later: add `pptx`/`pdf`/`docx` formats behind the same intent when generators land. |
| **V** `step5.js` | `step5-mapping`, `step5-signals` | `docx`; `xlsx` for the mapping table | **B4**, **B3** | Monolithic. Legacy `export-step` at `:36`. `renderStep5FullscreenTile:97` is ⛶-only. §F confirms V joins the surface contract. |
| **VI** `step6.js` | `step6-e2e`, `step6-channels` | **B5, split per tile (see below)** | **B2**, **B4**, **B3** | **Reuse the existing generators** behind `buildExportIntentArtifact`; seed `availableFormats` from what each generator *actually* produces. Keep the bespoke `data-format` menus working until parity, then retire (Phase 2). Step VI currently has **no** step ⬇ at all. |
| **VII** `step7.js` (iframe → `step7-ux.html`) | `('step7','all')`, `kind:'substeps'` | `docx`, `pdf` (from surface default vm) | **B6** — see §4 | Whole substep set as one target; selected substeps ride in `target.substeps`, **not** `tileId`. `step7/org-chart` `png`/`svg` is a later slice (§5 Phase 4). |
| **Overview** `overview.js` | `overview-project-frame`, `overview-step-outcomes` | `docx`; the per-step grid is step-scope opens | **B4**, grid migration | Two fullscreen tiles carry ⛶ but no ⬇ (`tileFullscreenButton("overview-project-frame")` :27, `("overview-step-outcomes")` :37) — pair each with ⬇. `renderStepOutcomeGrid()` (`:83-96`) emits one `export-step data-step="${step.id}"` **per step** — treat each as a step-scope open, or retire the grid into the per-step ⬇s. |
| **Implementation** `implementation.js` | `implementation-findings`, `implementation-channel-weaknesses`, `implementation-backlog` | `docx`; `xlsx` for backlog | **B2 (has none)**, **B4** | **Keep `stepId:'implementation'` (B1) — never `step8`.** No step ⬇ exists today. `renderImplementationFullscreenTile:99` is ⛶-only. |

**B5 — Step VI formats are asymmetric; seed each tile from its real generator.** The two menus are **not** the same set:
- **`step6-e2e`** → the E2E route menu offers `svg/png/pdf/pptx` (step6.js:129–132); re-home `e2eRouteDocuments.js` (route svg/png/pdf/pptx) behind the intent and seed `availableFormats:['svg','png','pdf','pptx']`. Add `xlsx` only once an xlsx table generator exists.
- **`step6-channels`** → the channel-variety menu offers **only** `svg/png` (step6.js:175–176), and the coordinator hard-rejects anything else (`channelVarietyExport.js:1` `new Set(["png","svg"])`; app.js:923 `format = button.dataset.format === "png" ? "png" : "svg"`). Seed `availableFormats:['svg','png']` today; add `pdf`/`pptx`/`xlsx` **only** as generators land. Advertising them now is the exact "blank promise" the honesty rule (§2) forbids — a per-tile refinement of accepted handoff §B5's blanket `stepVI/*` set.

**B2 — the shared step ⬇ helper (build this first, it unblocks 9 surfaces).** `stepHeader(token,title,description,guidance)` (`renderHelpers.js:4`) has **no export slot** — that's why all the `export-step` buttons are hand-placed. Add a `stepExportButton(stepId)` factory next to `tileExportButton` (`renderHelpers.js:97`) and give `stepHeader` an export slot. Fan it across **step1–7 + implementation + overview**, in **both** the main render and the Focus-Mode render (`focusMode.js:320` and `:679` carry stray legacy `export-step`s too). Then remove/repoint every legacy `export-step` (`step1×2` at :260+:578, step2:120, step3:44, step5:36, overview per-step grid, focusMode:320+679).

**B3 — fullscreen/Focus paths.** The `renderStepNFullscreenTile` overlays + `step1-fullscreen-overlay` don't render the tile action cluster, so no ⬇ (and often no ⛶) appears there. Step IV is the pattern to copy (`step4.js:72` puts `tileExportButton` in the fullscreen toolbar).

**B7 — absorb the two global buttons.** `export-project-report` (Report `.doc`) and `export-project-json` (Archive `.json`) live in the topbar menu (app.js:1214–1215, handlers :1801/:1807); Report also appears on **overview.js:28** only. (Note: overview.js:92 is the per-step `export-step` grid — a *different* pattern, covered by B2 and §5 Phase 5, **not** part of the Report inventory.) Fold both topbar buttons into a single **App ⬇** (`origin:'app'`): **Report → `appendix` preset**, **Archive → an Advanced/raw-JSON path**. The wire already supports `origin:'app'`, but nothing emits it and `getExportViewModel` returns `null` for any app-tier target — you'll need an app-scope vm and, for the bundle case, `setBundle` (host emits none today; app-tier bundle export is unbuilt — treat as the last slice). Remove the parallel top-nav buttons once the App ⬇ reaches parity.

---

## 4 · Step VII (B6) — the exact host handshake

Claude's surface (`step7-ux.html`) is **done**. It nests a **second, independent** export-panel instance inside Step VII and:
- **UP (verbatim to host via `postToHost`, step7-ux.html:1591–1597):** the relay forwards `export`/`needViewModel`/`cancel` **verbatim** from the nested panel — it keys only on `m.evt` (step7-ux.html:1594) and does **not** itself check `m.api`. The `api:1` stamp originates in the embedded export-panel's emit, not the relay, so **api-gating is entirely your responsibility on receive** (§4a). The panel emits the `export` intent with panel-resolved scope (step-scope by default for the substeps vm); `openStep7Export` sets `stepId:'step7'`, `tileId:'all'`, `origin:'step'`, `target.substeps:['7.1'…'7.7']`, `format:'docx'|'pdf'`, `preset:'doc'`, standard `options{7 booleans}`, `filename`, `skin`, `requestId`.
- **DOWN (consumed by `relayExportDown` before any `window.STEP7` cmd):** `openExport{vm?}` (no `vm` ⇒ surface supplies its own honest default vm: `step7/all`, `kind:'substeps'`, `availableFormats:['docx','pdf']`, `availableScopes:[{kind:'step',label:'All substeps',count:7}]`, `availableIncludes:['notes','owners','gaps','warnings']`, `defaultPreset:'doc'`), plus `setViewModel · open · exportReady · exportError · closeExport` relayed verbatim to the nested panel. `setSkin` already fans out via the existing skin relay — no new work.

**The gap (both listeners drop VII export traffic today):**
- `handleExportBridgeMessage` (app.js:747) hard-rejects any `event.source !== exportPanelFrame.contentWindow` (:751–759) — a VII-relayed message is from the *step7* frame, so it never reaches the export branches.
- `handleStep7BridgeMessage` (app.js:489–521) matches the step7 frame but only handles `ready`/`goto`/`change`/`rasic` — `export`/`needViewModel`/`cancel` fall through.

**Your B6 to-do — extend `handleStep7BridgeMessage` (recommended over relaxing the singleton handler's source invariant):**

**(a) Route VII-relayed `api:1` traffic.** After the existing branches, add `message.evt === 'export' | 'needViewModel' | 'cancel'` **gated on `message.api === 1`** (so you never intercept STEP7's own `api:2` evts; `window.STEP7` stays `api:2`, step7-ux.html:1600). The frame is already confirmed as `event.source` via `findStep7FrameForSource`; `isTrustedFrameMessage` already gates origin. Reply **DOWN to the VII frame via `postToStep7Frame(frame,…)` (app.js:553), never `postToExportPanel`** — they are two different iframes.
- `export` → run `handleExportIntent` logic (`exportExportIntent(workspace, intent)`), then `postToStep7Frame(frame,{cmd:'exportReady',requestId,downloadName})` / `{cmd:'exportError',requestId,message}`.
- `needViewModel` → optional. The surface already supplies a local default vm, so you only need this if you want to push a richer host-authored vm via `setViewModel`+`open`. If you don't register a `step7/all` vm, do **not** answer `needViewModel` (it would return "not available yet"); let the surface's local vm stand.
- `cancel` → clear your own VII-export active state. The overlay is already hidden by step7-ux (:1595).

**(b) `getExportViewModel('step7','all')` registry entry** — only needed if you push a host-authored vm. `kind:'substeps'`, honest `availableFormats`/`availableIncludes`. Otherwise rely on the surface default.

**(c) The real `step7/all` generator** behind the intent — `buildExportIntentArtifact` (`exporters.js:144`) currently falls to `return null` (`:163`) for anything past step3/step4 ⇒ "not available yet." Add a `step7/all` docx/pdf branch. **`step7Doc(workspace)` already exists** (`exporters.js:285`, used by `buildStepOutcome:116`) — it's the natural seed for the docx path.

**(d) A shell trigger** — a step-header ⬇ on Step VII that calls `postToStep7Frame(frame,{cmd:'openExport'})`. Note the existing `data-action="open-export-panel"` (app.js:1796) targets the **singleton** panel — VII needs a **distinct action** pointing at the nested frame. Until this lands, VII export is reachable only via the legacy `#exportBtn`.

**When to demote the Blob:** the legacy `#exportBtn` (`step7-ux.html:366` → `exportStep7()` Blob) is **surface-owned and stays live** for no-regression. The signal you owe back is one-directional: **"VII `step7/all` docx/pdf generator green."** On that signal, **Claude** repoints `#exportBtn` from `exportStep7` to `openStep7Export`. You do **not** touch `step7-ux.html`. `window.STEP7.export` remains as offline fallback.

---

## 5 · Migration & retirement order

Nothing that downloads today breaks. Old paths stay live in parallel until the panel produces an equal-or-better artifact for that target, then retire per-target:
1. **Phase 1 — Steps I–V + Overview**: register vm + generator per tile, add the B2/B3/B4 ⬇, then retire that tile's/step's legacy `export-step`.
2. **Phase 2 — Step VI**: re-home `e2eRouteDocuments.js` (svg/png/pdf/pptx) + channel-variety builder (svg/png) behind the intent (B5 per-tile formats preserved), then retire the bespoke `export-e2e-route`/`export-channel-variety` menus.
3. **Phase 3 — Step VII**: after your `step7/all` docx/pdf generator lands (§4c), signal green; Claude repoints `#exportBtn`.
4. **Phase 4 — org-chart `png`/`svg`** — register as **`step7/org-chart`** (wire id per B1; org-chart is substep 7.7 inside step7-ux, `stepId:'step7'`), once those generators exist.
5. **Phase 5 — global (B7)**: App ⬇ absorbs Report (`appendix`) + Archive (raw JSON); retire the two topbar buttons + overview's per-step grid; build `setBundle`/app-tier bundle last.

Legacy generators that stay live meanwhile: `exportStepOutcome`/`buildStepOutcome` (`exporters.js:60`), `exportProjectReport`/`exportProjectJson`, step6's coordinators + `e2eRouteDocuments.js`, and the surface-owned step7 `#exportBtn` Blob. Retire each only on parity.

---

## 6 · Acceptance criteria (per tile "done")

A `(stepId,tileId)` is **done** when:
1. `getExportViewModel` returns a real vm — `availableFormats`/`availableScopes`/`availableIncludes` reflect *only* what the generator actually produces/honors (honesty rule).
2. The tile ⬇ opens the panel with that vm (via `setViewModel` then `open`); the step ⬇ opens step-scope; both present on **main and fullscreen/Focus** renders (B3), and every monolithic ⛶ has a paired ⬇ (B4) — **including Overview's two fullscreen tiles**.
3. The `export` intent round-trips: `exportExportIntent` generates a real file, host posts `exportReady{requestId,downloadName}` (correlated), panel downloads it. Failure posts `exportError{requestId,message}`.
4. The target's legacy `export-step`/bespoke button is retired (or repointed) — no duplicate download path.
5. **Host tests stay green** (`node --test tests/*.test.js`). Extend, don't duplicate: `exportViewModels.test.js` (vm shape/availability/selection), `artifacts.test.js` (real OOXML: `PK` header, `xl/worksheets/sheet1.xml`, `options` honored, filename normalization), `exportPanelBridge.test.js` (mount + `api:1` + cache-label pins). **Add the currently-missing VII coverage:** VII `export` → generation → `exportReady` relayed DOWN to the step7 frame; `needViewModel` bubbles and is answerable; `cancel` clears shell state (`step7PreviewBridge.test.js` neighborhood has none yet).

**App-wide invariants:** every `⛶` tile also has `⬇` (the ⬇⛶ law, B4); every step/Focus header has one step ⬇ (B2); `stepId` on the wire is always a wire id (`step1`…`step7`|`implementation`, **never Roman, never `step8`, never `stepVII`**, B1); replies for VII go to `postToStep7Frame`, replies for everything else to `postToExportPanel`.

---

## 7 · Boundary reminder

- **Do not edit** `design-previews/export-panel.html` or `design-previews/step7-ux.html`. They're Claude's surface.
- **Propose any new view-model field** in `STEP1-4-EXPORT-CODEX-HANDOFF.md` (§A) before emitting it — the panel renders against the pinned vm shape.
- On the cache label: the canonical app-shell/pinned label is **`20260721-safari-sct-scroll-2`** — pinned at `index.html:15,38`, `start.command:9` (`VERSION=…`), the export-panel mount `app.js:741` (`export-panel.html?host=vsm7&embed=1&v=20260721-safari-sct-scroll-2`), and the bridge test `exportPanelBridge.test.js:16/22/23` (mount URL + `app.js?v` + `start.command VERSION`). Note `app.js` uses **per-module** import labels by convention (9 distinct `?v=` values today); the export module's imports (`getExportViewModel`, `exportExportIntent`, `step3.js`, `step4.js` at lines 57,59,74,75) and the panel mount are all already on `20260721-safari-sct-scroll-2`, consistent with the bridge test. When an export change ships, bump those export pins + `index.html` + `start.command` + the bridge-test assertions together.

---

**Key files:** host bridge/mount/handlers `/Users/mark/Documents/VSM7/src/presentation/app.js` (`openExportPanel:783`, `handleExportBridgeMessage:747`, `handleExportIntent:823`, `handleStep7BridgeMessage:489`, `postToStep7Frame:553`, `exportChannelVariety:919`, globals :1214/:1801/:1807, dispatch :1796/:1813); vm registry `/Users/mark/Documents/VSM7/src/application/exportViewModels.js`; generator router `/Users/mark/Documents/VSM7/src/infrastructure/exporters.js` (`buildExportIntentArtifact:144`, `return null:163`, legacy `buildStepOutcome:60`, `step7Doc:285`, existing table builders); shared helpers `/Users/mark/Documents/VSM7/src/presentation/shared/renderHelpers.js` (`stepHeader:4`, `tileExportButton:97`, `tileFullscreenButton:83`, `fullscreenTile:112`); channel export coordinator `/Users/mark/Documents/VSM7/src/presentation/shared/channelVarietyExport.js`; per-step `/Users/mark/Documents/VSM7/src/presentation/steps/{step1..7,overview,implementation,focusMode}.js`; built surface relay `/Users/mark/Documents/VSM7/design-previews/step7-ux.html:1560-1601`; tests `/Users/mark/Documents/VSM7/tests/{exportViewModels,exportPanelBridge,artifacts,step3,step4,step7PreviewBridge}.test.js`.