# Step VII Collaboration Report for Claude

Date: 2026-07-17

Purpose: summarize the latest Codex-side changes and product contracts that matter for UX/UI work, especially Step VII 7.1-7.7, so Claude can continue visual/interface work without stepping on host/model responsibilities, recursion-level rules, or canonical reuse rules.

## Executive Summary

Mark has resolved a product rule: **R0 / System-in-Focus is the default workshop lens.**

That rule is now both documented and partially implemented:

- Step 7.1 vessel creation now defaults the organizational/recursion scope to R0/SIF.
- Step 7.2 RASIC Accountability now opens with `Scope: R0 / SIF` selected.
- Step 7.3 Metrics, Artifacts & Tools now also opens with the R0/SIF lens: it lists all SCTs that have at least one R0/SIF contribution, while keeping the authored metrics/artifacts/tools per canonical SCT.
- Data cleanup: a blank accepted legacy role artifact in Mark's `Transformation 2026` workspace was removed, and host/domain normalization now drops nameless Step VII role/vessel artifacts that carry no legacy SCT links instead of rendering them as `- accepted`.
- KPI reuse: Step 7.3 KPI inputs and Step 7.4/7.5 role/function-specific KPI inputs now use browser autocomplete suggestions sourced from existing Step 7.3 KPI/metric entries, so workshops reuse metric vocabulary instead of creating near-duplicates.
- Step 7.4/7.5 now fall back to the first real role/function if the previous selected vessel id is no longer present, avoiding the stale `undefined` detail pane.
- New product direction: Step VII should become a reuse graph over the SCT contribution spine. Meetings, participants, KPIs, artifacts, tools, decision rights, and communication loops should reference canonical entries rather than duplicating text.
- R-1, R+1, and other recursion levels remain available through explicit scope controls.
- The model still keeps one RASIC assignment per `(SCT contribution x vessel)`.
- Codex did not redesign Step 7.7/org-chart visuals, but added a skin bridge so embedded Claude-owned frames can receive the active Workshop or Command Deck skin from the host.
- Step 7.2 RASIC cell clicks now preserve the matrix/page scroll position while the local RASIC matrix re-renders, so workshop users do not jump back to the top after assigning a letter.
- Follow-up UX decision: the `Accountable unit` dropdown in the Step 7.2 top filter bar is redundant with the recursion `Scope` selector and should be removed from that visible filter row.

The intent is facilitation focus: workshop screens should start with the System-in-Focus and let the facilitator deliberately widen the view when needed.

## Shared Contract Now In Force

The following is now treated as a contract between Codex and Claude:

- R0/SIF is the default for workshop-facing screens, dialogs, matrices, filters, and selectors that span recursion levels.
- Multi-level canonical data must not be deleted or collapsed into a false single-level model.
- Other recursion levels must stay accessible through explicit UI controls such as "all recursion levels", level filters, grouping, drill-down, or collapse/expand.
- Recursion levels must remain visibly distinct whenever multiple levels are shown.
- Repeated SCT rows are expected because RASIC is scoped to SCT contribution rows, not only to SCTs.
- Step 7.2 should use the `Scope` selector as the single visible recursion/unit-scope filter. Do not also show `Accountable unit` as a peer selector in the top filter bar.
- Step 7.3 should use the same recursion `Scope` selector pattern as Step 7.2, but deduplicate to SCTs because the authored content remains per canonical SCT.
- Step VII should reuse existing objects wherever possible. The default UX should be "pick existing first, create new only when needed".
- Meetings should reference existing role/function vessels as participants, reusable KPI definitions as measures, reusable artifacts as inputs/outputs, and Step VI loops where applicable.

These contracts are now documented in:

- `AGENTS.md` for the standing R0/SIF default-lens rule.
- `STEP7-REPRESENTATION-BRIEFING.md` for the R0/SIF Step VII rules and the new reuse-graph contract.

## Files Codex Changed

### `AGENTS.md`

Added the standing rule that the default workshop focus is always R0/SIF.

Important meaning:

- Codex will preserve R0/SIF as the default lens in future host/domain work.
- If repeated SCT contribution rows become noisy, Codex should group, collapse, or filter by default rather than deleting lower/higher recursion contribution data.

### `STEP7-REPRESENTATION-BRIEFING.md`

Added section `3a. Shared recursion-focus contract`.

Important meaning for Claude:

- Claude-owned Step VII surfaces should preselect `meta.sif`, a unit with `sif:true`, or a unit with `level:'R0'`.
- Other recursion levels should be reachable by explicit UX controls.
- The Step 7.2 RASIC matrix remains `(SCT contribution x vessel)` in data terms.
- The Step 7.1 vessel dialog defaults to R0/SIF scope.
- Step 7.3 remains an SCT editor, but its list is filtered by scoped SCT contributions and its system chips are derived from those contributions.
- Added section `3b. Shared reuse-graph contract`.

Important meaning for Claude:

- The Step VII UX should not treat role descriptions, meeting charters, KPIs, artifacts, and tools as separate free-text islands.
- Use existing vessels, SCTs, metrics, artifacts, tools, and Step VI loops as first-class pickable objects.
- Codex owns the canonical ids, persistence, and relationship semantics; Claude owns the interaction pattern that makes reuse pleasant in a workshop.

### `design-previews/step7-ux.html`

Codex made focused changes to the Step VII preview surface:

#### Step 7.1

The "Add organizational vessel" dialog no longer assumes the demo id `u-sif`.

Default scope resolution now follows this order:

1. `meta.sif`, if it matches a real unit id.
2. A unit marked `sif:true`.
3. A unit with `level:'R0'`.
4. A tolerant R0 level match.
5. First available unit only as a last fallback.

This matters because live project unit ids are not the same as the preview/demo ids.

#### Step 7.2

The RASIC matrix now has a new explicit scope filter:

- `Scope: R0 / SIF` is selected by default.
- `Scope: all recursion levels` exposes the full contribution set.
- Level-specific options are generated from the available Step I units, for example `R+1`, `R-1`, `R-2`.
- Follow-up fix: scope labels now include row counts, and recursion levels with zero Step VII contribution rows are disabled so an empty level does not look like a loading failure.
- Follow-up UX instruction for Claude: remove the separate `Accountable unit` dropdown from the Step 7.2 top filter bar. It duplicates the role of the `Scope` selector and makes the workshop surface feel over-filtered. The underlying Step IV accountable-unit field must stay in the model for warnings, inspector text, and method logic.

The relevant implementation concepts are:

- `defaultFilters()` returns `scope:'sif'`.
- `scopeFilter()` renders the selector.
- `scopeMatchesContribution()` filters contribution rows according to selected scope.
- `clearf` resets to the R0/SIF lens, not to all levels.
- `window.STEP7.filter(spec)` merges into the same default, so host-driven filter updates keep R0/SIF as the baseline.
- Follow-up fix: native dropdown filters now commit on the `change` event, not `click`, so Scope, VSM system, Priority, and Vessel type update the matrix reliably in Safari and other browsers. The old `Accountable unit` selector should be removed from the visible UI.

The underlying `CONTRIBS` array is not truncated. This is only the workshop lens.

#### Step 7.3

The Metrics, Artifacts & Tools substep now follows Mark's clarified rule:

- Default view: all SCTs that have at least one R0/SIF contribution.
- Scope selector: same recursion-scope selector pattern as Step 7.2.
- Level-specific views: choosing `R-1`, `R+1`, etc. shows SCTs with contributions at that selected level.
- Deduplication: if several contributions in the selected scope reference the same SCT, the SCT appears once in the 7.3 list.
- Authored data model: KPI, artifact, and tool entries remain stored per canonical SCT, not per contribution.
- Visible system chips: now derived from the selected-scope contribution systems, not from the legacy SCT-level `task.system` field.

This resolves the "all S3" symptom Mark saw in Step 7.3. Claude should not design around the old badges as method truth.

### `asset-tests/step7-ux.spec.js`

Added focused browser regressions:

- Step 7.1 dialog defaults scope to host SIF/R0 even when R-2 and R-1 units appear earlier in the unit list.
- Step 7.2 matrix defaults to R0/SIF contribution rows and exposes all levels through the scope selector.
- Step 7.2 dropdown filters commit on change and update matrix rows.
- Step 7.3 defaults to SCTs with SIF/R0 contributions, exposes the same recursion scope selector, and derives visible system chips from scoped contribution data.

### Cache Labels

Updated cache-busting labels so Safari loads the changed host/domain code and Step VII frame:

- `index.html`
- `start.command`
- `src/presentation/app.js`
- `src/presentation/steps/step7.js`
- `src/presentation/steps/focusMode.js`
- `src/presentation/styles.css`

Current cache label:

`20260717-tile-fullscreen-views`

### Tile-Level Fullscreen Direction

Mark has deprecated the global/topbar fullscreen mode. The new product direction is:

- Fullscreen belongs to specific view elements or tiles, not to the whole step/app shell.
- A matrix, map, chart, embedded design, or other workshop work surface may offer its own fullscreen affordance.
- The same canonical data must power both the embedded view and the fullscreen view.
- The fullscreen rendering may be different from the embedded rendering when the larger surface needs clearer facilitation, denser matrix space, or stronger distance-reading.
- Escape exits fullscreen.

Codex action:

- Removed the global/topbar fullscreen trigger from the host header.
- Added a local fullscreen affordance to Step I Evaluation's segmentation matrix tile.
- The tile opens directly as a single fullscreen view, without the old cross-step Back/Forward fullscreen deck navigation.
- Added tests proving Step I Evaluation exposes the tile-level fullscreen control and the app header no longer renders the old global trigger.
- Follow-up fix: `app.js` now imports `step1.js` with the same cache label (`?v=20260717-tile-fullscreen-views`) so Safari cannot pair the refreshed app shell with an older Step I module and throw `renderStep1FullscreenTile` missing-export errors.

Claude guidance:

- Do not design against the old topbar fullscreen button.
- For Claude-owned embedded designs, treat fullscreen as an optional per-asset or per-view capability.
- If an embedded design supports fullscreen, it should expose that affordance inside the relevant view and keep the host bridge data contract unchanged.

### RASIC Scroll Continuity

Mark reported that clicking/selecting a RASIC letter in Step 7.2 caused the page/matrix to jump back to the top.

Codex action:

- Added scroll capture/restore helpers inside `design-previews/step7-ux.html`.
- Applied them to local RASIC cell cycling and row selection.
- Preserved the Step VII page scroll and the internal `.matrix-scroll` vertical/horizontal positions across the local re-render.
- Restored scroll immediately and again on the next animation frame to avoid browser focus/layout timing issues.
- Added a root regression guard in `tests/step7PreviewBridge.test.js` and a focused Playwright asset regression in `asset-tests/step7-ux.spec.js`.

Claude guidance:

- Do not solve this by removing the local re-render or by changing the matrix model.
- Any future RASIC matrix visual redesign should preserve viewport continuity for in-place assignment, selection, warning refresh, and inspector updates.
- If Claude makes the RASIC matrix a dedicated asset later, preserving scroll position after cell edits is part of the UX contract.

### Embedded Claude Skin Bridge

Mark asked that embedded Claude designs also display correctly in the Command Deck skin.

Codex action:

- Kept the existing host-to-Step-VII command: `{ cmd: "setSkin", skin: "workshop" | "deck" }`.
- Added a Step VII preview-shell relay from `design-previews/step7-ux.html` to any nested iframes.
- The relay sends both supported command variants:
  - `{ cmd: "setSkin", skin }`, used by assets such as `meeting-landscape.html`.
  - `{ cmd: "skin", skin }`, used by `org-chart.html`.
- Newly rendered iframes are armed with a load handler so the skin is resent after the embedded document finishes loading.
- The Step 7.7 org-chart frame also receives the active skin after `orgFeed()` sends canonical context/model data.
- Added a root regression test in `tests/step7PreviewBridge.test.js`.

Claude guidance:

- Front-end-owned embedded assets should accept at least one of these commands. Preferred going forward is `{ cmd: "setSkin", skin: "workshop" | "deck" }`.
- Existing `org-chart.html` can continue accepting `{ cmd: "skin", skin }`; the host bridge supports it for compatibility.
- Skin commands must change visual presentation only. They must not alter canonical VSM data, exports, RASIC assignments, org-chart semantics, or persisted workshop records.
- If Claude adds more embedded Step VII assets later, they should either listen for the same command or document their skin command name so Codex can extend the relay without changing model semantics.

### KPI Reuse Autocomplete

Mark asked to push reuse of metrics and KPIs from Step 7.3.

Codex action:

- Added an HTML datalist sourced from current Step 7.3 KPI/metric entries.
- Attached that datalist to Step 7.3 KPI inputs.
- Attached that datalist to Step 7.4 role-specific KPI inputs.
- Attached that datalist to Step 7.5 function-specific KPI inputs.
- Kept artifacts and tools unchanged for now; the request was specifically about metrics/KPIs.
- Fixed a stale-selection issue where 7.4/7.5 could render a detail pane for a missing demo vessel and show `undefined`.

Claude guidance:

- Treat KPI reuse as host/behavior already provided through native autocomplete.
- Claude may improve the visual affordance later, but should not replace this with a separate custom picker unless Mark asks for that interaction.
- Keep Step 7.3 as the canonical source for shared KPI/metric wording.

### Superseded Host Fullscreen / Focus Refresh

Mark first found that the Step VII fullscreen/focus view was still showing the old host table "Roles, Functions, and Organizational Entities" with an empty Add Row grid. Codex refreshed that host-rendered content, but Mark has since deprecated the global/topbar fullscreen deck entirely. Treat the work below as historical cleanup and reusable rendering reference, not as an active UX target.

Codex action:

- Replaced the legacy fullscreen Step VII role-table tile in `src/presentation/steps/focusMode.js`.
- The superseded Step VII fullscreen renderer reads from the current Step VII representation model:
  - organizational vessels,
  - RASIC assignments,
  - SCT contribution coverage,
  - meeting participation links,
  - KPI/metric reuse entries,
  - artifact/result-type entries,
  - tool/method entries.
- Added a "Step VII Representation Spine" fullscreen tile for accountability/vessel coverage.
- Added a "Meetings, KPIs, Artifacts, and Tools" fullscreen tile for reuse-graph signals.
- Kept the "Representation Notes" fullscreen tile.
- Added Command Deck skin overrides for the new Step VII fullscreen stat cards, panels, list rows, risk rows, good states, and reuse chips so they do not render as Workshop-mode panels in the dark skin.
- Added root tests proving the renderer no longer exposes the old `add-role` table path and does surface reusable KPI/artifact/tool evidence.
- Removed the app-wide shell path that opened the old global/cross-step fullscreen deck.
- Current host cache label after the tile-level fullscreen update is `20260717-tile-fullscreen-views`.

Claude guidance:

- Do not design against the old empty fullscreen role table; it has been removed.
- Do not design against the old global/topbar fullscreen entry point; it is now obsolete.
- If Step VII needs fullscreen later, prefer a per-view/per-asset fullscreen affordance inside the relevant Claude-owned or host-owned tile and keep the host bridge payload unchanged.

### Step VII Reuse Graph Direction

Mark clarified the intended data model direction:

`SCT -> SCT contribution -> RASIC assignment -> organizational vessel`

Everything else should reuse from that spine instead of becoming duplicated free text:

- Roles, functions, and meetings are organizational vessels with stable ids.
- A meeting is a vessel plus a steering charter, not just a calendar item.
- Meeting participants should reference existing role/function vessels.
- KPIs/metrics should have reusable definitions and local uses.
- Artifacts/result types should be reusable objects such as decision log, roadmap, audit report, dashboard, backlog, risk register, or strategy one-pager.
- Tools/methods should be reusable objects such as Wardley Mapping, OKR review, retrospective, audit walk, or scenario planning.
- Meeting charters should connect SCT contributions, participants, input artifacts, output artifacts/decisions, KPIs/metrics, decision rights, Step VI communication loops, and escalation/algedonic paths.

Codex recommendation:

- Model reusable `definition` objects separately from local `use` records.
- Example: metric definition = "Decision cycle time"; metric use = Monthly Executive Retrospective uses it with target `< 10 days`, monthly frequency, source `decision log`.
- This keeps reuse manageable while still allowing different roles/meetings/SCTs to use the same metric with different targets.

Ownership boundary:

- Codex owns canonical relationship model, stable ids, migration, deduplication, persistence, exports, and tests.
- Claude owns the UX for pickers, chips, reuse suggestions, autocomplete, merge nudges, empty states, and layout.

Claude guidance:

- This is front-end-heavy concept work, so it is reasonable for Mark to wait for Claude before implementing a richer UI.
- Do not implement a fully custom reuse model in the front end without a host contract.
- Good UX direction: "reuse existing first, create new only when needed".
- Show reused entries as chips with source context: inherited from SCT, derived from RASIC, meeting-specific, role-specific, or human-authored.
- Avoid modal-heavy database-editor flows; keep workshop capture fast.

### Data Cleanup: Blank Role Artifact

Mark found a blank accepted role in Step 7.4 Role Descriptions.

Codex action:

- Removed the blank role vessel from `VSM7-Workspaces/EU AI Solutions SE/Transformation 2026--project3/workspace.vsm7.json`.
- Removed the matching legacy `step7.roles` entry.
- Removed the matching empty `step7.vesselAspects` stub.
- Tightened host/domain normalization so nameless legacy roles with no linked SCT evidence and nameless vessels are discarded before they reach the Step VII editor.
- Preserved nameless legacy roles only when they still carry linked SCT references; those are kept as legacy relationship records for rewiring, but are not promoted into visible Step VII vessels.
- Tightened `setStep7EditorModel()` so a nameless vessel emitted by the editor is not persisted.

Claude guidance:

- Do not solve blank role artifacts through visual hiding or label styling.
- If a blank vessel appears again, treat it as a host/data issue for Codex.

## Step 7.7 Boundary

Codex did not continue Step 7.7 implementation work.

Relevant note:

- `orgFeed()` in `design-previews/step7-ux.html` is intentionally back to its prior form.
- The Step 7.7 org-chart implementation remains Claude's active lane.
- If Claude changes Step 7.7, Codex should only review host integration, persistence, bridge safety, and tests when asked.

## UX/UI Guidance for Claude

The current screenshot shows the next obvious UX problem in Step 7.2: vessel names do not fit into narrow matrix columns.

Claude can safely address that as UX/UI work, with these constraints:

- Keep the new `Scope` selector visible and understandable.
- Remove the separate `Accountable unit` selector from the Step 7.2 top filter bar; `Scope` is the single visible recursion/unit-scope control.
- Do not remove or hide the R0/SIF default.
- Do not change the RASIC data model from `(SCT contribution x vessel)` to `(SCT x vessel)`.
- Do not delete non-R0 contribution rows to reduce visual noise.
- Full vessel names should remain available, even if visible labels are shortened.
- The first contribution/SCT column should remain usable, ideally sticky.
- RASIC cells must remain large enough to click during a workshop.
- Group headers for Roles, Functions, and Meetings must remain clear.
- If names are abbreviated, use title/tooltips or an inspector to expose the full name.

Suggested visual solutions, in order of preference:

1. Wider columns with horizontal scrolling and sticky first column.
2. Two-line wrapped/clamped labels with full-name tooltip.
3. Better header interaction, such as hover/focus expansion or a selected-column detail.
4. Rotated labels only if necessary, because they are harder to read in live workshops.

## Step 7.3 Note: SCT-Level Editor With Contribution-Scoped Lens

Mark noticed that Step 7.3 "Metrics, Artifacts & Tools" currently shows only `S3` badges and has no selector like Step 7.2.

Resolution implemented by Codex:

- Step 7.3 stays SCT-level for authored content: KPIs, artifacts, and tools attach to the canonical SCT.
- The visible list is now contribution-scoped: it starts with all SCTs that have at least one R0/SIF contribution.
- The same recursion `Scope` selector pattern from Step 7.2 is available so the facilitator can switch to all levels or a specific level.
- SCTs are deduplicated in the list even if multiple contributions in the selected scope reference the same SCT.
- System chips shown in 7.3 are derived from the scoped contribution systems, not from the legacy SCT-level system field.

Implementation note:

- If multiple scoped contributions for one SCT carry different VSM systems, 7.3 now shows multiple system chips rather than pretending the SCT has one authoritative system.
- Do not add an `Accountable unit` filter to 7.3. The scope selector is the level-control mechanism.

Claude guidance:

- Treat Step 7.3 as an SCT editor with a contribution-scoped list.
- Do not redesign 7.3 around the old all-`S3` symptom.
- It is safe to improve layout/readability around the scope selector and SCT list, but do not move the authored data model from SCT-level to contribution-level without a product decision.

## What Claude Should Avoid Touching

Unless Mark explicitly asks, Claude should avoid:

- `src/domain/**`
- `src/application/**`
- `src/infrastructure/**`
- host persistence
- cache/version labels
- root `tests/**`
- `AGENTS.md`
- the R0/SIF contract text

If Claude needs a host/data change, leave a note or handoff request for Codex rather than changing host code directly.

## What Codex Owns From Here

Codex should own:

- Host-side `meta.sif` and `meta.sifName` feed.
- Stable Step I unit ids and recursion levels.
- Canonical SCT contribution rows.
- Canonical reuse graph: vessel ids, participation links, metric/artifact/tool definitions, local uses, meeting charter references, and Step VI loop references.
- RASIC persistence.
- Any export/report behavior.
- Tests that prove R0/SIF defaults and full-recursion access are preserved.
- Cache-busting labels when host-loaded frontend files change.

## Verification Status

Codex ran:

- `npm test`

Result:

- 160 tests passed.

Codex also checked:

- The cleaned `Transformation 2026` workspace JSON parses successfully.
- The removed blank role id has zero remaining references.
- `src/domain/vsm.js` and `src/presentation/app.js` pass syntax checks.
- The Step VII preview script compiles.
- The live in-app browser shows Step 7.4 on `CEO`, no `undefined` detail pane, and the role-specific KPI input wired to `step7-kpi-suggestions` with four suggestions.
- The live in-app browser shows the Step I Evaluation page on `20260717-tile-fullscreen-views` with no global/topbar fullscreen trigger and with a local fullscreen affordance on the segmentation matrix tile.
- The local Step I Evaluation fullscreen tile opens as a single fullscreen surface, shows the evaluation matrix, has no old Back/Forward deck controls, and exits with Escape.
- The live in-app browser no longer shows a visible startup problem after the Step I module cache-label fix.

Codex also ran a script parse check for `design-previews/step7-ux.html`:

- Step VII preview script compiles.

The focused Playwright tests could not run in the Codex sandbox because the Playwright test server was blocked from binding to port `7799` with `EPERM`. This is an environment restriction, not an observed product failure.

When running locally outside the sandbox, use:

```bash
cd /Users/mark/Documents/VSM7/asset-tests
npx playwright test step7-ux.spec.js -g "7.1 new vessel|7.2 RASIC|7.3 defaults"
```

## Suggested Claude Task Prompt

```text
Please improve the Step VII 7.2 RASIC Accountability matrix header/layout so vessel names are readable in workshop use.

Respect the current Codex/host contract:
- R0/SIF is the default workshop lens.
- Keep the `Scope: R0 / SIF` selector visible and selected by default.
- Keep `Scope: all recursion levels` and level-specific access available.
- Remove the redundant `Accountable unit` dropdown from the Step 7.2 top filter bar. The Step IV accountable unit remains host/domain data for warnings and inspector details, but should not be a peer workshop filter next to `Scope`.
- Do not change the data model: RASIC remains one assignment per SCT contribution x vessel.
- Do not remove lower/higher recursion contribution rows to reduce visual noise.
- Step 7.3 is now an SCT editor with a contribution-scoped SCT list. Keep the R0/SIF default and the recursion Scope selector; do not add an Accountable unit selector there.
- Coordinate Step 7.7/org-chart changes with the active Claude org-chart lane; Codex owns only host integration, persistence, bridge safety, and tests around it.

Preferred UX direction:
- Use wider columns plus horizontal scrolling and a sticky contribution column.
- Allow two-line or compact labels, but preserve full names via tooltip/hover/focus detail.
- Keep Roles / Functions / Meetings group headers clear.
- Keep RASIC cells large enough to click reliably during a workshop.
```

## Second Suggested Claude Task Prompt

```text
Please design the Step VII reuse UX for meetings, role/function descriptions, KPIs, artifacts, and tools.

Respect the current Codex/host contract:
- Step VII is a reuse graph over SCT contributions and organizational vessels.
- Reuse existing entries first; create new only when needed.
- Meetings should reference existing role/function vessels as participants.
- KPIs/metrics should reuse definitions from Step 7.3 where possible, with local targets/frequency/source as usage data.
- Artifacts/result types and tools/methods should become reusable pickable objects, not duplicated text fields.
- Meeting charters should connect SCT contributions, participants, input artifacts, output artifacts/decisions, KPIs/metrics, decision rights, Step VI loops, and escalation/algedonic paths.
- Codex owns canonical ids, persistence, relationship tables, deduplication, exports, and tests.
- Claude owns the picker/chip/autocomplete/merge-suggestion UX and layout.
- Keep the workshop flow fast and non-database-like.
```
