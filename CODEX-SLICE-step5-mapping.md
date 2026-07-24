# Next export slice → Codex: `step5/step5-mapping` (2026-07-21, from Claude)

The next Phase-1 tile. Step V is a near-exact copy of your Step IV work — same shape, same 4 edits. The panel already renders this view-model (proven by the `step4` + parity tests); **no Claude-surface change needed**, this is all `src/`.

**Target:** `step5/step5-mapping` — the SCT-contribution → VSM-system steering map. **First format: `xlsx`** (it's a table, like step4). Monolithic surface → step scope only, no `selection`.

**Reference to copy:** `getStep4ContributionMatrixExportViewModel` (`exportViewModels.js`), `buildStep4ContributionMatrixXlsx` (`exporters.js`), and step4's tile-⬇ placement (`step4.js:72` fullscreen, `:81` normal).

---

## Edit 1 — `src/application/exportViewModels.js` (view-model)

Add the case (next to the step4 one) + the function:

```js
if (stepId === "step5" && tileId === "step5-mapping") {
  return getStep5SteeringMapExportViewModel(workspace, appState);
}
```

```js
function getStep5SteeringMapExportViewModel(workspace, appState) {
  // one row per assigned contribution; count = total assignments across visible systems
  const assignments = workspace.step5?.assignments || {};
  const count = Object.values(assignments).reduce((n, keys) => n + (keys?.length || 0), 0);
  return {
    stepId: "step5",
    tileId: "step5-mapping",
    title: "SCT → VSM Steering-System Map",
    kind: "matrix",
    count,
    unitNoun: "mappings",
    monolithic: true,               // one steering surface → panel drops the selection scope automatically
    defaultPreset: "data",
    availableFormats: ["xlsx"],     // add "docx" later only when a narrative generator exists
    availableScopes: [
      { kind: "step", label: "Whole Step V", count }
    ],
    availableIncludes: ["notes", "provenance", "gaps"],  // honest: Step V has no owners/scores; gaps = unassigned contributions
    selectable: false,
    selection: [],
    siblings: [{ tileId: "step5-mapping", title: "Steering-System Map" }],
    project: {
      name: workspace.project?.name || "VSM7 Project",
      date: appState.today || new Date().toISOString().slice(0, 10)
    }
  };
}
```

Honesty check: advertise `notes/provenance/gaps` **only** if Edit 2 actually emits those columns. Don't advertise `owners`/`scores` — not a Step V concept.

## Edit 2 — `src/infrastructure/exporters.js` (generator)

Add the branch inside `buildExportIntentArtifact` (before `return null`):

```js
if (intent.format === "xlsx" && intent.stepId === "step5" && intent.tileId === "step5-mapping") {
  return buildStep5SteeringMapXlsx(workspace, intent);
}
```

```js
export function buildStep5SteeringMapXlsx(workspace, intent = {}) {
  const options = intent.options || {};
  const includeNotes = options.notes !== false;         // SCT description
  const includeProvenance = options.provenance !== false; // SCT source
  const includeGaps = options.gaps !== false;            // unassigned flag
  const headers = [
    "SCT ID", "Success-Critical Task", "Contribution / Unit", "VSM System",
    ...(includeNotes ? ["Description"] : []),
    ...(includeProvenance ? ["Source"] : []),
    ...(includeGaps ? ["Unassigned"] : [])
  ];
  // resolve each contribution to its assigned system via your existing helpers
  // (workspace.step5.assignments + assignmentSystemFor(workspace, contributionKey) + the step3/step4 contribution list)
  const rows = [headers, /* …one row per contribution, columns conditional on the include flags… */];
  // reuse the same workbook writer + safeFileName(...) path as buildStep4ContributionMatrixXlsx
  return /* { mimeType, filename: `${safeFileName(...-step5-steering-map)}.xlsx`, base64/bytes } */;
}
```

Mirror step4's OOXML writer exactly so `artifacts.test.js` assertions (PK header, `xl/worksheets/sheet1.xml`) hold. Filename convention: `…-step5-steering-map.xlsx`.

## Edit 3 — `src/presentation/steps/step5.js` (B4 tile ⬇ + B3 fullscreen ⬇)

`step5.js` does **not** import `tileExportButton` yet. Add it to the import (line 8), then place the ⬇ next to the ⛶ in **both** renders (copy step4):

- **B4 (normal):** at `:35` the mapping section renders `tileFullscreenButton("step5-mapping", …)`. Add before it:
  `${tileExportButton("step5", "step5-mapping", "Export steering-system map")}`
- **B3 (fullscreen):** `renderStep5FullscreenTile` (`:97`) is ⛶-only — add the same `tileExportButton("step5","step5-mapping",…)` into its toolbar, exactly as `step4.js:72` does for its fullscreen tile.
- Keep the legacy `Download Outcome` (`data-action="export-step"`, `:36`) **live** until parity; then retire/repoint it (Phase-1 rule).

(The `step5-signals` tile can stay ⛶-only for now — it's diagnostics, not a distinct export target. Fold its content into the mapping export or defer.)

## Edit 4 — tests

- `tests/exportViewModels.test.js`: assert `getExportViewModel(workspace, appState, {stepId:"step5",tileId:"step5-mapping"})` returns `availableFormats:["xlsx"]`, `monolithic:true`, `availableIncludes` = `["notes","provenance","gaps"]`, and `availableScopes` has **no** `selection`.
- `tests/artifacts.test.js`: build `{stepId:"step5",tileId:"step5-mapping",format:"xlsx"}` through `exportExportIntent`, assert the `PK`/`xl/worksheets/sheet1.xml` shape, a known mapping row, filename `…-step5-steering-map.xlsx`, and that dropping `options.provenance` removes the Source column (copy the step4 options-honored assertion).

---

## Acceptance (this tile "done")

1. Panel opens for `step5/step5-mapping` with **xlsx only**, the 3 real includes, **step scope only** (no selection — monolithic).
2. Export → a real `.xlsx` downloads via `exportReady{requestId,downloadName}`; wrong/failed → `exportError{requestId,message}`.
3. The mapping tile shows **⬇ next to ⛶** in both normal and fullscreen (B4/B3).
4. Legacy `Download Outcome` retired/repointed once parity holds.
5. Host tests green.

**Boundary:** all edits in `src/**` + `tests/**`. No `design-previews/**`. No new view-model field (the panel already handles this shape — verified by the parity spec). Per-module cache label as you normally bump.

**When it lands, ping me** — I'll verify the `step5/step5-mapping` round-trip live in the browser (open → xlsx download → exportReady), same as I just did for Step VII. Then the identical recipe repeats for Step II, Step I (fold recursion into the `sif` vm — no standalone tile), Overview, Implementation, and Step VI (reuse your svg/png/pdf/pptx generators, per-tile formats).
