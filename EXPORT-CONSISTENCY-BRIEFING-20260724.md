# VSM7 · Export Consistency Briefing — advertise-vs-deliver

*2026-07-24 · Claude. Trigger: PO Mark, on the Step VII export panel — "I am missing the PPT export option" and "this whole purpose section sounds like a lot of bragging compared to the real output/download." Method: direct read of the panel (`design-previews/export-panel.html`, Claude-owned), the host view-models (`src/application/exportViewModels.js`, Codex), the dispatch + generators (`src/infrastructure/exporters.js`, `src/infrastructure/e2eRouteDocuments.js`, Codex), and the Step VII relay (`design-previews/step7-ux.html`, Claude). Every claim below is line-cited. **No implementation — this is the design.***

---

## 0 · How to read this

Two complaints, one root cause. §1 states the complaints exactly. §2 is the ground-truth matrix — what is advertised vs what is delivered, with line anchors. §3 is the root-cause synthesis. §4 sets the honesty contract. §5 is the proposed target model (formats-per-step, the redefined Purpose model, the pptx decision, the preset→generator binding, the panel behavior). §6 is the ownership split and work breakdown. §7 is acceptance criteria. §8 is the short list of decisions only Mark can make.

The single sentence: **the panel presents six richly-described "purposes" and a palette of formats as if each yields a distinct, purpose-built artifact, but the host collapses them — for Step VII, to one undifferentiated Word document (or a flat-text PDF) — and no generator ever reads which purpose was chosen.**

---

## 1 · The two complaints, precisely

**C1 — "Missing the PPT export option" (Step VII).** The Step VII panel offers only Word + PDF. More broadly: PowerPoint is offered for **exactly one** target in the whole real app, and even then only because that one target is an image. There is no general "export this step as a slide deck" capability anywhere.

**C2 — "The purpose section sounds like a lot of bragging compared to the real output."** The PURPOSE cards (Board slide, Workshop record, Working spreadsheet, Decision memo, Action tracker, Full appendix) describe six distinct, polished deliverables. On Step VII, choosing any of them yields the **same** file. The generator never reads the chosen purpose. Three of the six point at formats Step VII cannot produce, and the panel silently swaps the format out from under the user without saying so.

---

## 2 · Current-state ground truth

### 2.1 What the panel advertises — and the standalone-vs-real split

There are **two** advertise sources, and they disagree:

- **Standalone fallback VMs** — `export-panel.html` `VM{…}` (lines 168–192). These advertise `pptx` almost everywhere: `units` `['pptx','docx','pdf']` (172), `segmentation` `['pptx','pdf','xlsx']` (174), `manageability` `['pptx','docx','pdf']` (176), `scts` `['xlsx','docx','pptx','pdf']` (178), `contribution-matrix` `['xlsx','pptx','pdf']` (180), `steering-map` `['docx','pptx','pdf']` (182), `channel-variety` `['svg','png','pdf','pptx','xlsx']` (184), `e2e-routes` `['svg','png','pdf','pptx']` (186), `org-chart` `['pptx','pdf','svg','png']` (190). **These are demo fictions** — the standalone panel only echoes the intent to a toast (line 300, `else{ toast(…); closePanel(); }`); nothing is generated. They exist so the prototype looks complete.

- **Host VMs** — `exportViewModels.js` `availableFormats` (the real app). The whole list: app `['docx','json']` (75), step1 `['docx']` (104), step2 `['docx','xlsx']` (170, 199), step3 `['xlsx']` (235), step4 `['xlsx']` (278), step5-mapping `['xlsx']` (307), **step6-e2e `['svg','png','pdf','pptx']` (335)** ← the only pptx in the real app, step6-channels `['svg','png']` (363), step7 `['docx','pdf']` (420), implementation `['xlsx']` (457).

Mark is looking at the **real embedded app**, so the host VMs govern. The panel's own pptx-rich VMs never load there. (This drift is itself a defect — §3 RC3.)

For **Step VII specifically**, the whole-step vm is built by `step7-ux.html` `step7ExportVm()` (~line 1605–1613), which **hardcodes** `availableFormats:['docx','pdf']`. The host's `exportViewModels.js` step7 (line 420) agrees. So docx+pdf is the answer from both — no pptx path exists to reach.

> **Authoritative source depends on the entry path — and the PO's screenshot uses the one that ignores the host.**
> - **Path A — the substep-head ⬇** (what the screenshot shows): `step7-ux.html` calls `openStep7Export()` with *no argument* → it uses its **local** `step7ExportVm()` and pre-seeds the panel via `setViewModel`, so the panel never emits `needViewModel` and the host's `buildExportViewModel`/`sendStep7ExportViewModel` (app.js) is **never consulted**. The authoritative list here is **`step7-ux.html`'s hardcoded array**.
> - **Path B — a host-driven open** (`open-step7-export`, app.js ~902/2045): the host builds the vm from `exportViewModels.js:420` and pushes it down; that host list wins.
>
> Consequence for any fix: the two lists must move **in lockstep**. Adding pptx only to `exportViewModels.js:420` would leave the PO's exact path unchanged; `step7-ux.html`'s `step7ExportVm()` must change too (Claude-owned). This is reflected in §6.

### 2.2 What the host actually delivers

`buildExportIntentArtifact(workspace, intent)` (`exporters.js:66`) is the entire dispatch. Its branches, verbatim in effect:

| stepId | tile | formats it routes | generator | real output? |
|---|---|---|---|---|
| app | — | word, json | `buildProjectReport` / `buildProjectJson` | docx real OOXML; json real |
| step1 | all | word | `buildStep1OperativeUnitsExport` → `buildSimpleDocx` | real OOXML |
| step2 | * | word, xlsx | `buildStep2Export` | real OOXML both |
| step3 | scts | xlsx | `buildStep3SctRegisterXlsx` → `buildSimpleXlsx` | real OOXML |
| step4 | contribution-matrix | xlsx | `buildStep4ContributionMatrixXlsx` | real OOXML |
| step5 | step5-mapping | xlsx | `buildStep5SteeringMapXlsx` | real OOXML |
| overview | project-frame | word | `buildOverviewProjectFrameExport` | real OOXML |
| **step7** | all | **word, pdf** | `buildStep7RepresentationExport` | docx real OOXML; **pdf = flat text** |
| implementation | backlog | xlsx | `buildImplementationBacklogXlsx` | real OOXML |

**There is no `pptx` branch anywhere in `buildExportIntentArtifact`.** Any doc-level pptx intent returns `null`. The only pptx generator in the codebase is `buildE2ERoutePptxBytes(pngBytes, imageWidth, imageHeight, …)` (`e2eRouteDocuments.js:71`) — it wraps a **PNG of a route diagram** into a 1–2 slide deck (image slide + optional findings slide, `slideCount` line 76). It is invoked through the **step6 E2E artifact path**, not through `buildExportIntentArtifact`. It cannot render a report; it renders a picture onto a slide.

**The Step VII PDF is not a designed document.** `buildStep7RepresentationExport` pdf branch (`exporters.js` ~330) calls `buildSimpleTextPdf(step7PdfLines(workspace))`, and `step7PdfLines = htmlToPlainText(step7Doc(workspace))`. So the "PDF" is the Word document's HTML **stripped to plain text lines** — tables flattened, no layout. A dense text dump.

### 2.3 The Purpose presets — what they promise and how they behave

The six presets, verbatim (`export-panel.html:201–208`):

| id | title | description (the promise) | fmt | scope | default includes |
|---|---|---|---|---|---|
| exec | **Board slide** | "Distance-readable slides — the headline" | `pptx` | tile | scores, gaps |
| doc | **Workshop record** | "The written record of the session" | `docx` | step | notes, warnings, scores, owners, gaps |
| data | **Working spreadsheet** | "Raw rows to sort and slice" | `xlsx` | step | scores, owners |
| memo | **Decision memo** | "What was decided + what's open" | `pdf` | step | warnings, owners, gaps |
| follow | **Action tracker** | "Open gaps + owners, ready to track" | `xlsx` | step | owners, gaps |
| appendix | **Full appendix** | "Everything, every step, dated" | `pdf` | bundle | all 7 |

**All six always render**, unconditionally, for every target — `renderPanel` maps over the full `PRESETS` array with no availability filter (`export-panel.html:261`).

**Clicking an unavailable preset silently remaps the format.** `applyPreset` → `fitPreset` (line 242–244): `const p={...base}; if(!vm.formats.includes(p.fmt))p.fmt=vm.formats[0];`. So on Step VII (`['docx','pdf']`): "Board slide" (pptx) → `docx`; "Working spreadsheet" (xlsx) → `docx`; "Action tracker" (xlsx) → `docx`. The card stays lit as "Board slide," the format chip flips to **Word**, and no message explains the swap. That is precisely the "bragging" the PO sees: a card labelled *distance-readable slides* that downloads a dense Word file.

### 2.4 Does the generator honor the purpose? No.

The intent carries `preset` and `options` (the include booleans) — `export-panel.html:293` `preset:state.customized?null:state.preset`, `options:ALLINC.reduce(…)`. But:

- **`preset` is read by no generator.** Grep for `intent.preset` / `.preset` across `exporters.js` and `app.js`: **zero** hits. The chosen purpose has exactly three effects, all cosmetic: (a) which format is preselected, (b) which include-toggles are preselected, (c) the **filename slug** (`defName`, line 247, `clean(p.t)` → `…_Board-slide_…`). It never changes document structure or content.

- **`options` (includes) are honored inconsistently.** The xlsx generators read them — e.g. `buildStep3…`/step4/step5 respect `includeNotes/provenance/owners/gaps` (`exporters.js:228–232, 294–297`). But **`step7Doc(workspace)` takes only the workspace** (`exporters.js`, `function step7Doc(workspace)`) — it ignores `intent.options` entirely. So on Step VII, toggling Notes/Owners/Gaps changes nothing in the output.

**Net for Step VII:** all six purposes × all include-toggles collapse to **two** byte-stable artifacts — one Word doc and one flat-text PDF — differentiated only by filename. For xlsx-capable steps the collapse is milder (includes change which columns appear) but `preset` is still cosmetic.

### 2.5 The pptx reality, stated plainly

- Real app advertises pptx on **1 of 13** targets (step6-e2e, an image).
- That pptx is an **image-wrapper**, not a report generator.
- Every "Board slide" preset elsewhere is **undeliverable** and silently becomes the target's first format.
- The standalone panel advertises pptx on **9** targets, all fictional.

---

## 3 · Root-cause synthesis

- **RC1 — No contract binds presets ↔ formats ↔ generators.** Three layers evolved independently: the panel's presets/VMs, the host's `availableFormats`, and the dispatch table. Nothing guarantees that an advertised format has a generator, or that a shown preset can be fulfilled. The `fitPreset` silent-remap (2.3) is the symptom that hides the gap instead of surfacing it.

- **RC2 — `preset` is decorative.** Purposes are a UI fiction: the generators branch on `format` and (sometimes) `options`, never on the purpose the user picked. Six purposes cannot yield six artifacts when the code path can't see the purpose.

- **RC3 — Standalone demo VMs drifted from host VMs.** The panel's built-in `VM{}` table (pptx-rich) was the design prototype; the host later shipped narrow, honest `availableFormats`. The two never reconciled, so the panel *documents* capabilities the app doesn't have — and any future host tile that copies the panel's shape inherits the lie.

- **RC4 — Format sets are ad hoc per step.** docx-only / docx+xlsx / xlsx-only / docx+pdf with no stated principle. A user cannot predict what any step will offer, which is itself the "inconsistency across export pages" the PO flagged.

---

## 4 · The honesty contract (design principles)

This codebase already has an honesty ethic (the org-chart export watermarks a hidden accountability layer and writes the open-gap count into the filename; "no completeness percentage is ever added"). Extend it to exports wholesale:

1. **Never advertise what you cannot deliver.** A format chip appears for a target **iff** a generator produces a real file of that format for that target. No chip is a placeholder.
2. **Never silently substitute.** If a purpose implies a format the target can't produce, the panel must not swap it behind the user's back. Either the purpose is not offered for that target, or selecting it visibly explains the substitution.
3. **A named purpose must produce a distinct artifact, or it must not claim one.** If "Decision memo" and "Full appendix" yield the same bytes, they are one purpose, not two. Distinctness must be realized in the generator, not merely in the card copy.
4. **One source of truth for capability.** The host's `availableFormats` (+ a new per-target purpose list) is authoritative; the panel renders from it. Standalone fallback VMs must mirror the real contract, marked explicitly as samples, never exceed it.
5. **Copy describes the real file.** Every preset description must match what the bytes actually contain for the current target.

---

## 5 · The target model (proposed design)

### 5.1 Principled formats-per-step

Bind each format to what the content *is*, not to taste:

- **docx (Word)** — the narrative record. Available for every step that has prose/tables worth a written record: step1, step2, step5, **step7**, overview, app. Real OOXML (already have `buildSimpleDocx`).
- **xlsx (Excel)** — tabular data meant to be sorted/sliced: step3 (SCT register), step4 (contribution matrix), step5 (mapping), step2 (assessment), implementation (backlog). Real OOXML (already have `buildSimpleXlsx`).
- **pdf** — a *paginated, laid-out* read-only rendering. **Today's flat-text PDF does not qualify** and should either be upgraded to a real layout or dropped from the menu (decision D3). Offered only where a designed layout exists.
- **pptx** — slides. Only where a genuine deck generator exists (decision D1). Today: step6-e2e image deck only.
- **svg / png** — canvas/diagram tiles only (step5 map, step6 e2e, step6 channels, step7 org-chart). Already real (client render).
- **json** — machine dump of the whole project (app tier). Already real.

The deliverable of §5.1 is a **single table** (below, in §6) that every layer must agree with.

### 5.2 The Purpose model, redefined so each purpose is real

The current six purposes conflate three orthogonal axes — **format**, **content depth** (headline vs full), and **audience framing** (board vs working). That over-specifies and creates undeliverable combinations. Replace with a model where a purpose = a **content profile** the generator actually implements, and the format is chosen separately (only from the target's real formats):

- **Purpose becomes "what goes in," not "what file."** Proposed profiles: **Headline** (the decisions + open gaps, terse), **Working record** (full tables, everything captured), **Action list** (only open gaps + owners). Each maps to a concrete include-set **and** a generator branch that actually emits that shape.
- **Format is a separate, honest choice** from the target's real `availableFormats`. "Headline" as docx = a 1-page summary doc; "Headline" as pptx (where decks exist) = a few title+bullet slides; "Working record" as xlsx = all rows.
- **The generator MUST branch on the profile.** This is the load-bearing change: `step7Doc` (and peers) take `{profile, options}` and emit genuinely different content. If a profile can't be honored for a target, it isn't shown for that target.

This kills the "bragging": three purposes that are each real beat six that collapse to one.

*(Alternative, lighter model in D2: keep purposes as pure include-presets — no audience framing at all — and rename them to what they truly do. Cheapest; least ambitious.)*

### 5.3 The pptx decision (the PO's C1)

Three honest options:

- **D1-A — Real universal deck generator.** Build `buildDeckPptx(sections)` producing title + bullet slides from any step's model (reuse the OOXML packaging already proven in `e2eRouteDocuments.js`). Then pptx becomes a legitimate format for step1/2/5/7/app. **Largest effort; fully satisfies C1.** Codex-owned generator + dispatch branch.
- **D1-B — Image-deck only, honestly scoped.** Keep pptx **only** where an image exists (the canvas tiles: step5 map, step6 e2e already, step6 channels, step7 org-chart) by reusing `buildE2ERoutePptxBytes`'s pattern (render the diagram → wrap in a slide). Step VII would get pptx **for its org chart**, not for the whole-step report. Medium effort; honest; partially satisfies C1 (slides of the picture, not the tables).
- **D1-C — Drop pptx from the menu entirely** (including step6-e2e) until a real deck story exists, and remove every "Board slide" preset. Smallest; most honest short-term; tells the PO "no slides yet" plainly.

**Recommendation: D1-B now, D1-A later.** Wrapping the org chart (and other canvas tiles) into slides is real, reuses proven code, and gives Mark a genuine "board slide" for the politically-important org picture — which is exactly the artifact a steering meeting wants. A universal text-deck (D1-A) is a bigger, separable project.

### 5.4 The preset → (format, includes, profile) binding + generator contract

- The panel stops shipping a hardcoded `PRESETS` array with baked-in formats. Instead each **target's vm** carries `availablePurposes` (ids + copy + default format + include-set), sourced from the host. The panel renders only those.
- Selecting a purpose sets `{profile, format=purpose.defaultFormat (∈ availableFormats), options=purpose.includes}`. Format remains independently switchable **within the target's real formats**.
- The **intent** gains a first-class `profile` field. Every generator that claims >1 purpose MUST read it. A target that implements only one profile advertises only one purpose (no fiction).

### 5.5 Panel behavior — no silent remap

- Presets whose profile/format the target cannot deliver are **not rendered** for that target (preferred), or rendered **disabled** with a one-line reason ("Slides need a diagram — not available for this step"). Never lit-but-lying.
- Remove `fitPreset`'s silent `p.fmt=vm.formats[0]` fallback as the *primary* path; keep it only as a defensive last resort behind a visible "format adjusted" note.
- The Format row and the Purpose row must never contradict (no pptx-purpose selected while only docx/pdf chips exist).

---

## 6 · Ownership split & work breakdown

**The authoritative capability table** (every layer conforms to this; ✅ = real generator exists today, 🔨 = to build per decision):

| stepId · tile | docx | xlsx | pdf | pptx | svg/png | json |
|---|---|---|---|---|---|---|
| app | ✅ | — | D3 | D1-A🔨 | — | ✅ |
| step1 | ✅ | — | D3 | D1🔨 | — | — |
| step2 | ✅ | ✅ | D3 | D1🔨 | — | — |
| step3 scts | — | ✅ | — | — | — | — |
| step4 matrix | — | ✅ | — | — | — | — |
| step5 mapping | — | ✅ | — | — | — | — |
| step5 map (canvas) | — | — | ✅? | D1-B🔨 | ✅ | — |
| step6 e2e | — | — | ✅ | ✅ | ✅ | — |
| step6 channels | — | — | D3 | D1-B🔨 | ✅ | — |
| **step7 report** | ✅ | — | **D3 (flat today)** | D1-A🔨 | — | — |
| **step7 org-chart** | — | — | — | **D1-B🔨** | ✅ | — |
| implementation | — | ✅ | — | — | — | — |

**Claude (surface: `export-panel.html`, `step7-ux.html`, `org-chart.html`, `asset-tests/**`):**
- Render presets/formats strictly from the vm's `availablePurposes` + `availableFormats`; delete the always-render-all-six behavior (`export-panel.html:261`).
- Remove silent format remap as primary (`fitPreset`, line 242–244); add the "not available / adjusted" affordance (§5.5).
- Reconcile the standalone fallback `VM{}` table (168–192) to mirror the real contract, labelled "sample."
- Wire `profile` into the intent (293) and `getState` (430).
- If D1-B: `org-chart.html` gains a pptx render path (diagram → PNG → the relay already carries artifact bytes; step7-ux forwards).
- Update the panel/relay asset-tests (export-panel.spec, step7-export-relay.spec) to assert no undeliverable preset renders.

**Codex (host: `exportViewModels.js`, `exporters.js`, `e2eRouteDocuments.js` pattern, `tests/**`):**
- Add `availablePurposes` per target to the vms; make `availableFormats` conform to the table.
- Add `profile` to the intent contract; make `step7Doc` (and any multi-purpose generator) branch on `{profile, options}` — real content differences, and honor includes on the Word/PDF paths (close the step7 `options`-ignored gap).
- D3: either upgrade the Step VII PDF from `htmlToPlainText`/`buildSimpleTextPdf` to a laid-out PDF, or drop pdf where only flat text exists.
- D1: build `buildDeckPptx` (A) and/or the canvas→pptx wrapper reuse (B); add the `pptx` dispatch branch(es) in `buildExportIntentArtifact`.
- Tests: a generator-honors-profile test per multi-purpose target; a "every advertised (target,format) returns a real artifact, never null" coverage test.

---

## 7 · Acceptance criteria

1. For every target, every visible format chip downloads a real, openable file of that type (no `null`, no format masquerade). A test enumerates (target × advertised format) and asserts a real artifact.
2. No preset is shown for a target it cannot fulfil; selecting a preset never silently changes the format without a visible note.
3. Any two distinctly-named purposes produce **provably different** bytes for the same target, or they are merged. A test diffs their outputs.
4. Step VII: `options` toggles change the Word/PDF output; the PDF is either laid-out or removed.
5. pptx: per the chosen D1 option — either a real deck exists for the advertised targets, or pptx is removed from the menu (no "Board slide" without a deck).
6. Standalone `export-panel.html` advertises exactly the real contract (marked sample), so demo == app.

---

## 8 · Decisions only Mark can make

- **D1 — pptx scope.** A) universal text-deck for step1/2/5/7/app, B) image-deck for the canvas tiles incl. the **Step VII org chart** (recommended now), or C) drop pptx entirely for now. *Recommendation: B now, A later.*
- **D2 — Purpose model.** Redefine to three real content profiles (Headline / Working record / Action list) with the generator honoring them (§5.2), **or** the lighter path: keep purposes as pure include-presets and just rename them to the truth. *Recommendation: the three-profile model — it's what makes the section stop bragging.*
- **D3 — Step VII PDF.** Upgrade the flat-text PDF to a laid-out document, or drop PDF from Step VII and keep Word as the written record. *Recommendation: drop the flat PDF now; add a real laid-out PDF only if a board actually asks for it.*
- **D4 — Rollout.** One coordinated change (contract + panel + generators together) vs. staged (first make the panel honest by hiding undeliverable presets/formats — a Claude-only, same-day change — then add pptx/profiles behind it). *Recommendation: stage it — honesty first (fast, Claude-only), capability second.*

---

## 9 · Decisions taken (PO Mark, 2026-07-24) + staging status

- **D1 = image-decks (B) for the start.** pptx = wrap a rendered canvas (org chart, step5 map, step6 channels) into slides, reusing `buildE2ERoutePptxBytes`'s pattern. No universal text-deck yet.
- **D2 = skip Purpose entirely.** No presets. Format is the choice; the panel offers only what the target can deliver (tables → xlsx, canvases → pptx/svg/png, narrative → docx). Every available include defaults ON.
- **D3 = drop the Step VII PDF** (the flat-text `htmlToPlainText`/`buildSimpleTextPdf` output).
- **D4 = stage it.** Honesty-first (Claude-only), capability second (Codex).

### Stage 1 — DONE (Claude, `export-panel.html` + asset-tests), shipped honesty-first
- Removed the entire Purpose section + the 6 `PRESETS` + `fitPreset`/`applyPreset`/`maskInc` + the silent format-remap + the "customized" concept + dead `.preset`/`.cust` CSS.
- Panel is now **format-led**: `openFor` defaults `fmt = vm.formats[0]`, `scope = defScope(vm)` (first enabled), `inc = allInc(vm)` (all available ON). `defName` dropped the purpose slug. `intent.preset` is always `null`. `getState` no longer exposes preset/customized.
- Live-verified on 4173: Step VII → Format(Word/PDF), Step III register → Format(Excel only); no Purpose anywhere; 0 console errors. Asset **160** green (3 preset-driven specs rewritten to assert format-led behavior).
- **Note:** the Step VII PDF chip is still present after Stage 1 — dropping it (D3) needs the host vm + dispatch to change in lockstep (Stage 2), because step7-ux.html:1605 and exportViewModels.js:420 both list it.

### Stage 2 — Codex (capability), pending
Per the ownership split in §6 and the lockstep note in §2.1. Summary: drop the flat Step VII PDF from both vms + dispatch (D3); add pptx image-decks for the canvas tiles incl. the 7.7 org chart (D1-B); confirm the tables=xlsx / narrative=docx feasibility set; make `availableFormats` the single source of truth. No purpose/preset work remains (D2 deleted it). Claude supplies the org-chart→PNG render for the pptx wrap on request.

### Stage 2 — "never out of sync" guarantee (PO directive, 2026-07-24)

The Step VII export format list currently lives in **two** places — `design-previews/step7-ux.html` `step7ExportVm()` (~1610, Path A) and `src/application/exportViewModels.js` `getStep7RepresentationExportViewModel` (~420, Path B) — both presently `["docx","pdf"]` (verified in sync). PO requires they can **never** diverge. Discipline ("change both together") is not acceptable; the fix is **structural — remove the duplicate**:

- **Single source of truth = the host** (`exportViewModels.js`). step7-ux must NOT own a second copy of `availableFormats`.
- **Mechanism (flash-free):** Codex pushes the authoritative Step VII export vm to step7-ux during the existing sync handshake (`syncStep7Frame` — add a `setViewModel{stepId:'step7',tileId:'all',vm}` alongside the current `setContext`/`loadModel`/`goto`). Claude: step7-ux caches that pushed vm and uses it in `openStep7Export()`; the hardcoded `step7ExportVm()` survives ONLY as a standalone-mode fallback (no host present) and is explicitly labelled as such.
- **Result:** dropping `pdf` (D3) is then a **one-file change in `exportViewModels.js`** that both entry paths reflect simultaneously — divergence becomes impossible by construction. The pdf-drop and this de-duplication land in the **same** Stage 2 change; until then both copies stay `["docx","pdf"]` (no divergence window).
- **Coordination:** Claude will change step7-ux's consumption side only once Codex's push lands, in lockstep. No unilateral edit to either format list before then.
