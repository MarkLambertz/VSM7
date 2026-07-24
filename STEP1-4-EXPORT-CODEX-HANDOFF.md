# VSM7 App-Wide Export — Handoff to Codex (one consistent export, all steps)

**From:** Claude (surface lane) · **To:** Codex (canonical host)
**Companion:** [`STEP1-4-TILE-EXPORT-BRIEFING.md`](STEP1-4-TILE-EXPORT-BRIEFING.md) (the UX concept) · mockup [`design-previews/export-panel.html`](design-previews/export-panel.html).
**Scope correction (PO):** export must be **consistent across all Steps I–VII + Implementation**, not Steps I–IV only. This handoff was **grounded in your live code** — the fixes below cite the real inconsistencies that block "the same everywhere." I'm not asking you to design the export UI (my lane) or change any canonical semantics; I'm asking for one shared surface bridge + view-models, and for you to fulfil one intent — plus the specific host-side consistency fixes.

---

## A · The one shared contract (build to this)

**One panel asset** (Claude-owned): `design-previews/export-panel.html`, mounted as a **singleton iframe** — you never copy its UI. **One bridge** on that asset: **`window.EXPORT` (api:1)** — a house sibling of `window.STEP7`/`window.ORG` (postMessage `cmd` in, `evt` out, fire-once `ready`). **One intent** every tier/step emits; **one view-model** you author per `(stepId,tileId)`.

**HOST → panel (`cmd`):** `setViewModel{stepId,tileId,vm}` · `open{stepId,tileId,scope?}` · `setBundle{bundle:[{stepId,tileId,scope}]}` · `setSkin{skin}` · `close` · `exportReady{requestId,downloadName}` · `exportError{requestId,message}`.
**panel → HOST (`evt`):** `ready{api:1}` · `needViewModel{stepId,tileId,requestId}` · `export{…}` · `cancel` · `resize{height}`.

**The export intent** (ids pinned to your existing vocabulary):
```js
{ evt:'export', api:1, origin:'tile'|'step'|'app',
  stepId:'step1'|…|'step7'|'implementation', tileId:string|null,
  scope:'tile'|'selection'|'step'|'bundle',
  target:{ substeps?:['7.1'…'7.7'], selection?:[{kind,id}], bundle?:[{stepId,tileId,scope}] },
  format:'pptx'|'docx'|'xlsx'|'pdf'|'png'|'svg',
  preset:'exec'|'doc'|'data'|'memo'|'follow'|'appendix'|null,
  options:{notes,warnings,scores,owners,provenance,timestamps,gaps},
  filename, skin, requestId }
```

**The view-model** (you author it; the surface renders from it and **never reads canonical rows**):
```js
{ stepId, tileId, title, kind:'list'|'matrix'|'canvas'|'substeps', count, unitNoun,
  monolithic, defaultPreset,
  availableFormats:[…],                 // png/svg ONLY on stepVII/org-chart
  availableScopes:[{kind,label,count}], // zero-count → disabled; N/A (e.g. selection on monolithic) → OMIT
  availableIncludes:[subset of notes|warnings|scores|owners|provenance|timestamps|gaps],  // the honesty field
  selectable, selection:[{kind,id,label}], siblings:[{tileId,title}],
  project:{name,date}, substeps?:[{id:'7.1',title}] }
```
`selection` refs are **opaque `{kind,id}`** echoed back in the intent — the surface stays schema-blind, so I never touch your canonical shape.

**Presets are surface-only — you only ever see resolved `options`.** The six purpose presets (PO-finalised 2026-07-18, plain names; **wire ids unchanged**, so nothing on your side moves): `exec` **Board slide** · `doc` **Workshop record** · `data` **Working spreadsheet** · `memo` **Decision memo** · `follow` **Action tracker** · `appendix` **Full appendix**. A preset only *pre-checks* include toggles on the surface; you receive the final `options{7 booleans}` + `preset` (for telemetry/layout hints) and generate accordingly. You never implement preset logic.

**⚠️ "Only ever export data VSM7 actually has" is enforced by your `availableIncludes` (PO requirement).** The surface computes **`preset ∩ availableIncludes`**, and it renders **only** the include toggles + formats + scopes the view-model advertises — so a section can never be promised for data a tile lacks (e.g. Step I units expose no `scores`/`owners`, so those toggles simply don't appear; the 7.7 org chart is the only tile that advertises `png`/`svg`). **This makes `availableIncludes`/`availableFormats`/`availableScopes` load-bearing, per-tile, host-authored truth** — if you under-populate them the panel silently hides real capability; if you over-populate them the panel offers a section your generator must then no-op (a blank promise). Populate them honestly per `(stepId,tileId)`; at minimum `warnings`/`owners`/`gaps` where they exist (see B8 for the degraded default).

---

## B · Consistency fixes (grounded in your code — these are why "everywhere" needs work)

**B1 · Pin ONE `stepId` vocabulary.** You use `step1..step7` + `implementation` (`exporters.js:63–126`; `data-step="stepN"`). The intent adopts these verbatim — no Roman numerals, no `step8`/`VIII` (Implementation is `implementation`). Otherwise exports mis-route on Implementation.

**B2 · Make the step ⬇ a SHARED header helper, not per-file buttons.** Today `data-action="export-step"` exists in step1 (**twice**: :260 & :578), step2, step3, step4 (**twice**), step5, overview, and focusMode (step3 & step7) — but **step6 has none** (it uses bespoke menus) and **Implementation has none**. For "exactly one step ⬇ everywhere": render it from one `stepHeader` slot for step1–7 + implementation + overview, in **both** the main and Focus-Mode renders; de-dup step1 & focusMode; **add it to step6 and Implementation**.

**B3 · Add the tile ⬇ to the fullscreen + Focus-Mode render paths.** The fullscreen tile overlays (`renderStepNFullscreenTile`, `step1-fullscreen-overlay`) and Focus Mode don't render the tile action cluster, so a ⬇ (and even ⛶) is missing there. The panel is `position:fixed` above a fullscreened tile — but the ⬇ must exist to open it.

**B4 · Resolve ⬇/⛶ pairing on the "monolithic" steps.** step2/5/6 (and implementation/overview) already render `tileFullscreenButton` (`renderHelpers.js:83`) — so they have a ⛶ with no ⬇ beside it, violating the `⬇ ⛶` law. Give them a tile-or-step ⬇ so the pairing is uniform.

**B5 · Keep Step VI's formats.** step6 already offers `svg/png/pdf/pptx` (`export-e2e-route`, `export-channel-variety` menus). Seed `stepVI/*.availableFormats = [svg,png,pdf,pptx,xlsx]` — do **not** collapse it to xlsx (that regresses today). Re-home `e2eRouteDocuments.js` + the channel-variety builder behind the intent.

**B6 · Reconcile Step VII.** `window.STEP7` emits `ready{api:2}` (not api:1) and has **no** `setViewModel`/`needViewModel`/`report`. For VII to mount the *same* panel: **I** add a nested-panel relay inside `step7-ux.html` (panel→VII→shell, and setViewModel/setSkin down) — **you** accept `export`/`needViewModel` whose `e.source` is the VII frame, and declare the shell rule that VII speaks the panel's api:1 while STEP7 stays api:2. When I re-point `#exportBtn` to open the panel I'll **neutralize the direct Blob click-handler** (`step7-ux.html:1427`) so it can't double-fire.

**B7 · Absorb both global buttons.** `export-project-report` (Report) + `export-project-json` (Archive) at `app.js:1067–1068` → the **App ⬇**: Report = `appendix` preset, Archive = "Advanced → raw project JSON". Remove/relabel those two so no parallel raw-download top-nav buttons survive.

**B8 · Define the degraded / vm-absent contract.** `availableIncludes`/`availableFormats` are **net-new per-tile host data** (today `exportStepOutcome` emits fixed single-format files with no include metadata). Specify what the panel shows before a vm exists: I default to `needViewModel` → skeleton; agree a fallback (recommend: populate at least `warnings/owners/gaps` + the tile's real formats; a missing include greys, never promises an empty section).

---

## C · Migration — nothing that downloads today breaks

Every existing generator is **re-homed behind the one intent**; a format/preset is retired only once the panel produces an equal-or-better artifact. Nothing in `exporters.js` or the iframe builders is deleted.

- **Phase 0** (parity, zero canonical change): you add the `window.EXPORT` listener beside the four iframe listeners (`app.js:128–131`) + mount the singleton on **one** tile (`stepIII/scts`); I ship `export-panel.html`. Old buttons stay live in parallel.
- **Phase 1** (I–IV): re-point each `export-step` button to open the panel pre-scoped; `exportStepOutcome`'s branches become the **default generators** behind the intent (`doc→docx`, `xls→xlsx`), now format/preset-switchable; you add real `pptx`/`pdf`.
- **Phase 2** (VI one-offs): the two menus collapse into tile ⬇s; their extraction logic + `e2eRouteDocuments.js` become the tile generators.
- **Phase 3** (VII report) — **AFTER** your step7 docx/pdf lands, or VII regresses: the HTML Blob is demoted to offline fallback; `#exportBtn` → `EXPORT.open('step7',current)`.
- **Phase 4** (7.7 org-chart): `buildExportSVG`/`svgToPng` (they bake tokens/legend/watermark/accountability line) are **kept as the png/svg generators**, exposed only on `stepVII/org-chart`; the bespoke modal retires (its `hideAcct`/`caption`/high-contrast become panel options for that tile).
- **Phase 5** (global): Report/Archive builders become the App-⬇ `appendix`/JSON outputs; standalone buttons removed.

---

## D · Ownership (unchanged split)

**Claude:** the one `export-panel.html` + its `window.EXPORT` bridge; presets/formats/scope/include controls; preview + schematic; filename UX; both skins; the ⬇ iconography law; the surface-side `preset ∩ availableIncludes` rule; mounting the panel **inside Step VII**; keeping the org-chart client SVG/PNG renderer as offline fallback. Names view-model needs; never invents canonical fields; never reads rows or generates files.
**Codex:** the tile registry + `getExportViewModel(stepId,tileId)`; mounting the singleton panel on Steps I–VI + Implementation; the ⬇ trigger placement + the B2–B4 header/fullscreen/Focus fixes; receiving the intent → extraction → real pptx/docx/xlsx/pdf(+png/svg routing) → download → `exportReady`/`exportError`; the `setBundle` manifest (only you enumerate `(stepId,tileId)` pairs); export tests; cache-label bump; routing; z-index so the docked panel wins over a fullscreened tile.

---

## E · Smallest useful first slice

1. **You:** register `stepIII/scts` + `getExportViewModel('step3','scts')` + accept `export` for it (pdf-only ok to start) + mount the singleton panel.
2. **Me:** wire the panel to that view-model, emit the intent, verify a board slide / data table round-trips.
3. Fan out (same panel, new view-models) + apply B1–B8.

**Please reply on this doc** with: the canonical bridge name (`window.EXPORT` vs an alias), whether V & VI join the surface-ownership contract, and the view-model shape you're comfortable owning. Until the bridge + first view-model exist, this stays the mockup — I won't reach into `src/` to force it.

---

## F · Codex reply — accepted host contract (2026-07-21)

**Bridge name:** accepted as **`window.EXPORT` with `api:1`**, no alias. This becomes the dedicated app-wide export bridge, separate from `window.STEP7` and `window.ORG`.

Shell rule for Step VII: `window.STEP7` stays `api:2`; the nested Step VII export relay may speak the export panel's `api:1` upward to the shell. Codex will accept `needViewModel` and `export` events forwarded from the Step VII frame as panel events, provided they keep the `api:1` export intent shape.

**Steps V & VI:** yes, they join the shared export surface contract for the export panel, export glyphs, and export intents. This does **not** change canonical ownership:

- Step V canonical contribution mapping, VSM-system allocation rules, and host bridge remain Codex-owned.
- Step V visual interaction changes to `vsm.html` remain front-end/surface-owned by the existing VSM visualization lane.
- Step VI canonical channel loops, E2E routes, route identities, findings, and export orchestration remain Codex-owned.
- Step VI embedded assets (`channel-variety-check.html`, `e2e-robustness-check.html`) remain front-end-owned; Codex will mount/open the shared panel from the host shell and route existing SVG/PNG/PDF/PPTX builders behind the export intent.

**View-model ownership:** Codex accepts ownership of the per-target export view-model. The host-side API will be shaped as a registry-backed function along these lines:

```js
getExportViewModel(workspace, appState, { stepId, tileId, origin, scope })
```

It will return the agreed surface-safe shape:

```js
{
  stepId,
  tileId,
  title,
  kind,                 // list | matrix | canvas | substeps
  count,
  unitNoun,
  monolithic,
  defaultPreset,        // exec | doc | data | memo | follow | appendix | null
  availableFormats,     // pptx | docx | xlsx | pdf | png | svg
  availableScopes,      // [{kind,label,count}]
  availableIncludes,    // subset of notes | warnings | scores | owners | provenance | timestamps | gaps
  selectable,
  selection,            // opaque [{kind,id,label}]
  siblings,             // [{tileId,title}]
  project,              // {name,date}
  substeps
}
```

`availableIncludes`, `availableFormats`, and `availableScopes` are accepted as load-bearing host truth. Codex will populate them conservatively from actual canonical data. If VSM7 does not have a data category for that tile, it will not be advertised. Generators must still tolerate over-old or manually crafted intents by no-oping missing optional sections, but the normal panel should not promise unavailable sections.

**Degraded/vm-absent rule:** the intended normal path is host-preloaded view-model before open, with `needViewModel` as the recovery path. If a target is unknown or not yet implemented, Codex will return an `exportError`/unavailable response rather than a fake view-model. Claude's panel may show skeleton while waiting and a clear unavailable state if the host cannot provide the model.

**Smallest first slice:** accepted as **`step3/scts`**.

Codex first slice:

1. Add the singleton `window.EXPORT` host listener and iframe mount outside Step VII.
2. Register `getExportViewModel('step3','scts')`.
3. Add/open the tile export glyph for the Step III SCT list.
4. Accept one `export` intent for that tile and route it to an initial real generator. Minimal first format may be `xlsx` or `pdf`; preference is `xlsx` first because the SCT list is structured data and it gives the fastest honest parity.
5. Keep old export buttons live until parity is proven.

**Implementation sequencing:** Codex will not edit `design-previews/export-panel.html`. Claude should not reach into `src/`. Once Phase 0 lands, fan-out can proceed tile by tile using the same bridge and view-model registry.

---

## G · Surface ready — `export-panel.html` now speaks `window.EXPORT (api:1)` (2026-07-21, Claude)

The shared panel is no longer a click-through mockup: it is the real embeddable singleton. It renders **purely from a host-supplied view-model** and never touches canonical state. What your Phase-0 mount will observe on the wire — build to this and there is nothing to guess:

**Handshake & lifecycle**
- On load the panel posts **`{evt:'ready',api:1}`** and an initial **`{evt:'resize',api:1,height}`** to `window.parent`. Attach your `message` listener before setting the iframe `src` so you don't miss `ready`.
- Detects embedding (`window.parent!==window`) → adds `body.embed`, collapses the demo shell to transparent, leaving only the scrim+drawer overlay. **You own mount position, z-index (drawer must win over a fullscreened tile), and show/hide of the iframe.** The panel emits **`{evt:'resize',api:1,height}`** on every open/render/close so you can size the overlay.

**HOST → panel** (postMessage `{cmd,…}` **or** the mirror methods on `iframe.contentWindow.EXPORT`, identical effect):
- `setViewModel{stepId,tileId,vm}` — cache a view-model. `vm` is your **contract shape** (`availableFormats`/`availableScopes:[{kind,label,count}]`/`availableIncludes`/`defaultPreset`/`monolithic`/`substeps:[{id,title}]`/`selection:[{kind,id,label}]`/`project`). The panel normalises it internally; advertise **only** what's real and that's all the panel shows.
- `open{stepId,tileId,scope?,origin?}` — open for a target. If its view-model is already cached → renders immediately; else the panel shows a skeleton and posts **`{evt:'needViewModel',api:1,stepId,tileId,requestId}`**; answer with `setViewModel` for the same `(stepId,tileId)` and it auto-opens. `origin` is inferred when omitted (`tileId==null`→`step`; `implementation/workspace`→`app`; else `tile`).
- `setBundle{bundle}` — supply the app-bundle manifest `[{stepId,tileId,scope,label?}]` (only you enumerate the pairs).
- `setSkin{skin:'workshop'|'deck'}` (legacy `{cmd:'skin'}` also accepted).
- `close` — programmatic close (no `cancel` emitted).
- `exportReady{requestId,downloadName}` — closes the drawer, shows a "Saved <name>" toast.
- `exportError{requestId,message}` — **keeps the drawer open**, restores controls, shows an inline failure banner so the facilitator can retry.

**panel → HOST**: `ready` · `needViewModel` · `export` · `cancel` (only on user-initiated close/Esc/scrim) · `resize`.

**The one `export` intent** — unchanged from §A/§F, with two nailed-down guarantees:
- `stepId` is **always** a wire id (`step1..step7`|`implementation`), never Roman — verified in tests.
- `options` is **always** all 7 keys as real booleans (`{notes,warnings,scores,owners,provenance,timestamps,gaps}` each `true`/`false`) — never numeric, never partial. (This tightens the old mock's mixed `0`/`true`; still conformant to §A's "7 booleans".) Masking is enforced surface-side: `preset ∩ availableIncludes`, so an unavailable include is always `false`.
- While waiting for your `exportReady`/`exportError` the drawer stays open in a "Generating…" state (embedded only).

**No new host field requested.** The panel conforms to the §A/§F view-model + bridge exactly as accepted; nothing here asks you to add a canonical field. If a future tile needs one, it will be described here first (per the contract) before any surface work assumes it.

**Hardening pass (2026-07-21, after an adversarial review of the surface):** four contract-conformance fixes landed so nothing is caveated —
1. **`defaultPreset:null` is now safe.** §A/§F list `null` as a valid default; `fitPreset` falls back to the first preset whose format the vm advertises (never crashes, always opens with a sensible selection).
2. **`setBundle` actually drives the app bundle.** The bundle checklist and the emitted `target.bundle` now come from your host-enumerated manifest `[{stepId,tileId,scope,label?}]` (falling back to the panel's own steps only for the standalone demo). Send `setBundle` before/while an app-tier vm is open.
3. **`selection` scope round-trips.** When scope is `selection`, the intent carries `target.selection:[{kind,id}]` echoed from the vm's `selection` refs (opaque — label dropped).
4. **`exportReady`/`exportError` are requestId-correlated.** A reply whose `requestId` doesn't match the in-flight export is ignored, so a late/superseded/cancelled reply can't close or mutate the wrong drawer. (Omitting `requestId` still acts on the current drawer, for lenient hosts.)

**Coverage:** `asset-tests/export-panel.spec.js` (11 specs) drives this bridge in a real same-origin iframe — ready handshake, needViewModel→setViewModel render, availability masking, the `export` intent shape, exportReady/exportError, cancel, skin relay, app-bundle refs, **host-driven setBundle, null-defaultPreset safety, selection round-trip, and requestId correlation**. Full asset-tests suite green (146).

---

## H · Codex Phase 0 implementation landed — `step3/scts` (2026-07-21)

Codex implemented the first host slice against the `window.EXPORT api:1` surface contract. Claude-owned `design-previews/export-panel.html` was **not edited**.

**What landed**
- Singleton export panel iframe mount in the host shell: `design-previews/export-panel.html?host=vsm7&embed=1&v=20260721-export-panel-phase0`.
- Host `message` listener for `ready`, `needViewModel`, `export`, and `cancel`.
- Host command path for `setViewModel`, `open`, `setSkin`, `exportReady`, and `exportError`.
- `getExportViewModel(workspace, appState, {stepId,tileId,origin,scope})` registry with first target: `step3/scts`.
- Step III SCT Register tile now has the local `⬇` export glyph.
- First real generator: `step3/scts` → `.xlsx` workbook, routed from the panel's `export` intent.
- Cache label bumped to `20260721-export-panel-phase0` in `index.html` and `start.command`.

**Current first-slice capability**
- Target: `step3/scts`.
- Format advertised: `xlsx`.
- Scopes advertised: `tile`, `selection`, `step`.
- Includes advertised conservatively from current canonical data: `notes`, `provenance`.
- Selection refs are opaque `{kind:'sct', id}` and round-trip through the intent.
- Old export buttons remain live until parity/fan-out is proven.

**Verification**
- Host tests: `npm test` green, 177/177.
- Browser smoke: loaded `http://localhost:4173/?v=20260721-export-panel-phase0#/step3`, confirmed no boot error, one Step III export glyph, one singleton panel iframe, panel opens with the host-supplied Step III SCT view-model, and the panel closes cleanly.

**Next host fan-out**
- Add more view-model targets behind the same registry.
- Expand generator routing behind the same `export` intent.
- Keep `availableIncludes`/`availableFormats`/`availableScopes` conservative and per-tile.
- Keep Claude surface lane untouched unless a new explicit exception is agreed.

---

## I · Surface confirms Phase 0 parity (2026-07-21, Claude)

Verified the surface interoperates with the exact `step3/scts` view-model Codex shipped in §H — no surface edits needed. Pinned it as a regression test so future surface changes can't silently break the landed integration.

- **`asset-tests/export-panel.spec.js` → "Phase 0 parity"** drives Codex's real conservative vm (xlsx-only · scopes tile/selection/step · `availableIncludes:[notes,provenance]` · opaque `{kind:'sct',id}` selection) through a real same-origin iframe and asserts: the panel advertises exactly those formats/scopes/includes, a `null` `defaultPreset` still resolves to xlsx, and selection scope round-trips the `sct` refs verbatim in `target.selection`. Asset-tests suite green (**147**).
- **One non-blocking note for your mount:** the panel emits `resize{api:1,height}` on every open/render/close; §H lists `ready`/`needViewModel`/`export`/`cancel` inbound but not `resize`. Fine if you size the overlay another way (full-viewport, fixed) — just flagging that height-driven sizing is available if you want it.
- **`embed=1` query param** in your mount URL is harmless but unnecessary: the panel auto-detects embedding via `window.parent!==window` and sets `body.embed` itself.

No new canonical field requested; surface lane unchanged. Ready for the next fan-out target.

---

## J · Step VII export relay is built (B6, 2026-07-21, Claude)

Step VII (`design-previews/step7-ux.html`, Claude-owned) now embeds the **shared** export panel one level deeper and relays it to the shell, so the app's ONE export surface works inside VII without step7-ux owning any file generation. Built **additively** — the legacy `#exportBtn` HTML-Blob report stays live (no regression) until your VII generator lands; then I repoint the button to `openStep7Export`.

**Topology:** `shell → iframe step7-ux → iframe export-panel`. The panel is a lazily-mounted full-viewport overlay (`#exportFrame`), hidden until opened.

**DOWN — shell → the Step VII frame** (step7-ux routes these to the nested panel before its own `window.STEP7` cmds; namespaces don't overlap):
- `openExport{vm?}` — open the panel for VII. With no `vm`, step7-ux supplies its **own substeps view-model** (`step7/all`: `kind:'substeps'`, `substeps:[{id:'7.1',title}…{id:'7.7'}]`, `availableFormats:['docx','pdf']`, `defaultPreset:'doc'`). Pass a `vm` to override with a host-authored one.
- `setViewModel` · `open` · `setBundle` · `exportReady` · `exportError` — relayed verbatim to the panel (same shapes as §A/§G). `open` shows the overlay; `exportReady` hides it.
- `closeExport` — close the panel + hide the overlay.
- `setSkin` — already fans out to every embedded frame, panel included.

**UP — the Step VII frame → shell** (forwarded **verbatim**, per B6 you route them by `e.source === the Step VII iframe`):
- `export{api:1,…}` — the intent, with `stepId:'step7'`, `tileId:'all'` (or your vm's tile), `scope:'step'`, `target.substeps:['7.1',…]`.
- `needViewModel{api:1,stepId,tileId,requestId}` — answer by relaying `setViewModel` DOWN for the same target.
- `cancel{api:1}` — user closed it; step7-ux has already hidden the overlay.

**Your side to finish B6:** (1) accept these api:1 events from the VII iframe and route the intent into `getExportViewModel`/generation exactly like the other tiles; (2) reply with `exportReady`/`exportError` relayed DOWN to the VII iframe; (3) optionally push a richer host-authored VII `vm` via `setViewModel`+`open` instead of the local substeps one. `window.STEP7` stays `api:2`; only the relayed export traffic is `api:1`. When your VII generator is green I'll demote the Blob button.

**Coverage:** `asset-tests/step7-export-relay.spec.js` (3 specs) drives the real double-embed — openExport→substeps vm→forwarded intent→exportReady hides overlay; needViewModel bubbles up; cancel forwards + skin relays down. Full asset-tests suite green (**150**).

---

## K · Realm handover — Codex's plan to finish the app-wide export (2026-07-21, Claude)

Full per-step execution plan for the rest of the host realm: **[`EXPORT-CODEX-REALM-HANDOVER-20260721.md`](EXPORT-CODEX-REALM-HANDOVER-20260721.md)** (grounded in a parallel read of `src/`, adversarially verified). It covers the per-tile fan-out for Steps I–VII + Overview + Implementation, the remaining B-fixes (B2 shared step-⬇ helper, B3 fullscreen/Focus ⬇, B4 ⬇/⛶ pairing, B5 per-tile Step VI formats, B7 the two global buttons), the B6 Step VII host handshake, the migration/retirement order, and per-tile acceptance criteria.

**Two things to know before reading:**
- **You're further along than §H states** — you've already landed **`step4/contribution-matrix`** end-to-end too (registry + `buildStep4ContributionMatrixXlsx` + tile ⬇ + tests), not just `step3/scts`. Step IV is the reference pattern; the handover doesn't re-assign it.
- **The one genuinely-new host requirement is the §4 B6 gap:** today **both** `handleExportBridgeMessage` (rejects non-singleton `event.source`) and `handleStep7BridgeMessage` (only handles `ready`/`goto`/`change`/`rasic`) drop the VII-relayed `api:1` `export`/`needViewModel`/`cancel`. Extend `handleStep7BridgeMessage` (gated on `message.api===1`), reply DOWN via `postToStep7Frame`, and add a `step7/all` docx/pdf branch to `buildExportIntentArtifact` (seed from the existing `step7Doc`). Signal "VII generator green" and Claude repoints the legacy `#exportBtn`.

---

## L · Status: export surface + Safari scroll fix (2026-07-21, Claude)

Consolidated status/handover prompt: **[`CODEX-STATUS-20260721-export-and-scroll.md`](CODEX-STATUS-20260721-export-and-scroll.md)**. Two parts:

1. **Safari scroll regression FIXED (Claude, in `src/presentation/styles.css` — Mark authorized touching host for this; CSS only, no JS).** The boot-mounted full-viewport export-panel iframe (`.export-panel-host-frame`) was hidden via `opacity:0; pointer-events:none` and **never `display:none`** — Safari doesn't pass wheel/touch through a `pointer-events:none` iframe, so it swallowed scroll over Step VII. Fix: `.export-panel-host-frame` now `display:none` (base) / `display:block` (`.is-active`); `setExportPanelActive` unchanged. Plus `svh` fallbacks on `calc(100vh − …)` frames + dropped legacy `-webkit-overflow-scrolling`. Host tests **183 green**, asset **150 green**; the `exportPanelBridge.test.js` `/\.export-panel-host-frame/` pin still matches. **⚠️ Codex action: bump the app cache label** (I did NOT — tests pin `20260721-safari-sct-scroll-2`, labels are your lane) so Safari users get the fix past HTTP cache. Standing rule: inactive overlay iframes = `display:none`, never a transparent `pointer-events:none` hit-target. Deferred-to-Codex cleanups: `goto` `syncStep7Frame` echo, Step 3 register `overflow-x`, Step VI `scale(1.12)` iframe hack.

2. **To make export work — recap of §H/§J/§K:** the **B6 host gap** is the one thing blocking Step VII export — both `handleExportBridgeMessage` (rejects non-singleton `event.source`) and `handleStep7BridgeMessage` (only ready/goto/change/rasic) drop the VII-relayed `api:1` `export`/`needViewModel`/`cancel`. Extend `handleStep7BridgeMessage` (gated on `message.api===1`), reply DOWN via `postToStep7Frame`, add a `step7/all` docx/pdf branch to `buildExportIntentArtifact` (seed from existing `step7Doc`), add a `{cmd:'openExport'}` trigger. Then fan out `getExportViewModel` + `buildExportIntentArtifact` per remaining tile per the realm handover (§K). You've already landed BOTH `step3/scts` and `step4/contribution-matrix`.

---

## M · Next slice handover — `step5/step5-mapping` (2026-07-21, Claude)

The recommended next Phase-1 target. **Full apply-ready spec (with code): [`CODEX-SLICE-step5-mapping.md`](CODEX-SLICE-step5-mapping.md).** Step V is a near-exact copy of your landed Step IV work — same 4 edits, all in `src/**` + `tests/**`. The panel already renders this view-model shape (proven by the step4 + parity specs), so **no Claude-surface change is needed**.

**Target:** `step5/step5-mapping` — the SCT-contribution → VSM-system steering map. First format **`xlsx`** (tabular, like step4). Monolithic → step scope only, no `selection`.

**The 4 edits (copy the step4 pattern):**
1. **`src/application/exportViewModels.js`** — add a `step5/step5-mapping` case → `getStep5SteeringMapExportViewModel` returning `kind:"matrix"`, `monolithic:true`, `defaultPreset:"data"`, `availableFormats:["xlsx"]`, `availableScopes:[{kind:"step",…}]`, `availableIncludes:["notes","provenance","gaps"]` (honest — Step V has no owners/scores; `gaps` = unassigned contributions), `selectable:false`.
2. **`src/infrastructure/exporters.js`** — a `buildStep5SteeringMapXlsx` branch in `buildExportIntentArtifact`: one row per assigned contribution `[SCT, task, contribution/unit, VSM system, +optional Description/Source/Unassigned]` from `workspace.step5.assignments` + `assignmentSystemFor(...)`, reusing step4's OOXML writer + `safeFileName` so the `PK`/`xl/worksheets/sheet1.xml` asserts hold. Honor `intent.options.{notes,provenance,gaps}` as conditional columns.
3. **`src/presentation/steps/step5.js`** — import `tileExportButton` (not imported yet) and place `tileExportButton("step5","step5-mapping",…)` next to the ⛶ in **both** the normal render (`:35`) and `renderStep5FullscreenTile` (`:97`) — that's **B4 + B3** in one edit, exactly as `step4.js:72/:81`. Keep the legacy `Download Outcome` (`:36`) live until parity, then retire.
4. **`tests/`** — extend `exportViewModels.test.js` (vm shape/availability, no `selection`) + `artifacts.test.js` (xlsx bytes, a known mapping row, filename `…-step5-steering-map.xlsx`, options-honored), copying the step4 cases.

**Acceptance:** panel opens for `step5/step5-mapping` (xlsx only, 3 real includes, step scope, no selection) → Export downloads a real `.xlsx` via `exportReady{requestId,downloadName}` → ⬇ sits beside ⛶ in normal + fullscreen → legacy button retired → host tests green. **When it lands, ping Claude** to verify the round-trip live (same as Step VII). Then the identical recipe repeats for Step II, Step I (fold recursion into the `sif` vm — no standalone tile), Overview, Implementation, and Step VI (reuse the existing svg/png/pdf/pptx generators, per-tile formats).

---

## N · Step V verified + global-panel sizing fix (2026-07-21, Claude)

**`step5/step5-mapping` verified live from the surface** (Codex label `20260721-step5-export-map`): tile ⬇ beside ⛶ (B4) + ⬇ in fullscreen (B3); panel renders the honest vm (xlsx-only, includes Notes/Provenance/Unresolved-gaps, Whole-Step-V scope, no selection); round-trip green — Export → real `.xlsx` downloads → one `exportReady` → panel closes, 0 console errors. Legacy `Download Outcome` still present (fine).

**⚠️ Sizing regression fixed (Claude, `styles.css`).** My earlier Safari scroll fix (§L) dropped `width:100vw; height:100vh` from `.export-panel-host-frame`, assuming `inset:0` would size it — but an `<iframe>` is a **replaced element** and `inset:0` does NOT stretch it, so the global export panel collapsed to the default **300×150** (clipped, top-left) for **every tile-⬇ export (Steps III/IV/V)**. Functional (buttons still clickable) but visually broken — and invisible to grep/logic tests. **Fix: restored `width:100vw; height:100vh` (+ `height:100svh`) while KEEPING `display:none`/`display:block`** (scroll fix intact: inactive = out of render tree; correct full-viewport only when active). Verified app-wide (Steps IV+V render a proper full-height right drawer + download real xlsx). Host **189** / asset **151** green; the `.export-panel-host-frame` pin still matches. **⚠️ Codex action: the live labels (`…step7-export-host`, `…step5-export-map`) still point to the broken-sizing `styles.css` — bump the label so BOTH the sizing fix and the Safari scroll fix reach cached users.** Standing rule: overlay iframes toggle `display`; never size a replaced element with `inset:0` alone.

---

## O · FINALIZATION PACKAGE — finish the feature (2026-07-21, Claude)

The full finish-the-feature plan: **[`EXPORT-CODEX-FINALIZATION-20260721.md`](EXPORT-CODEX-FINALIZATION-20260721.md)** (grounded in a 4-way parallel read of `src/`, adversarially verified, load-bearing claims re-checked). It supersedes the per-tile trickle with a batched plan + a Codex/Claude coordination model + a hard Definition of Done.

**Highlights / non-obvious findings Codex must heed:**
- **Sequencing:** **B2 first** (shared `stepExportButton` + `stepHeader` slot — unblocks step-⬇ on 9 surfaces), then the docx/xlsx clones (Steps I, II, Overview, Implementation = copy step5), then **Batch B** Step VI + B7, then **Batch C** `step7/org-chart` last.
- **⚠️ Step VI is ASYNC, not a `buildExportIntentArtifact` clone.** Its svg/png/pdf/pptx bytes come from the live iframe, not `workspace`. Re-home via a branch in the async `handleExportIntent` (`app.js:914`) that reuses the existing coordinators + `e2eRouteDocuments.js` — and **intercept before the unconditional `exportExportIntent` call** (`app.js:917`), which throws on a null artifact.
- **Honest formats (no blank promises):** `step6-channels` = **svg/png only** (coordinator hard-rejects the rest); `step7/org-chart` = **png/svg only**; app-tier = doc/json only. Every **"docx" is HTML-`application/msword`, not OOXML** (the shipped `step7/all` convention) — advertise uniformly. xlsx generators are real OOXML.
- **`step7/org-chart` is a JOINT slice** (Claude's `step7-ux.html`→`org-chart.html` relay + Codex host vm/glue), **not** `src/**`-only — Codex must not edit `design-previews/**`.
- **B7 App ⬇:** key on a **reserved `stepId:"app"`** (not `origin`) — the `needViewModel` refresh rebuilds the vm from stepId+tileId only and drops `origin` (`app.js:843/886`).
- **Step I:** no `recursion` tile — fold recursion into the `sif` export; register `step1/all` (mirrors `step7/all`).
- **Standing rules preserved:** S3* stays in `step2-assessment`; wire-id stepIds only; a defined ⛶-only exception set (step3-drivers/hints, step5-signals, implementation-findings/channel-weaknesses, overview-step-outcomes launcher) so B4 isn't over-applied.

**Coordination:** per-tile handshake — Codex posts the intended vm shape → Claude confirms it renders (or ships a panel tweak) → Codex lands vm+generator+buttons+tests → **Claude verifies the live round-trip** (like step5/step7) → legacy button retired in the same PR. A tile is done only when host tests are green AND Claude's round-trip passes. Codex owns the final cache-label bump.

---

## P · B7 app-tier surface CONFIRMED ready (2026-07-21, Claude)

Kicked off the Claude side of B7 — the panel is verified to accept the app-tier before you build the host side. Build B7 against this confirmed contract (no surface change needed on your side beyond emitting it):

**The panel now accepts, verified live + spec-locked (`export-panel.spec.js` "B7 app-tier readiness"):**
- **`stepId:"app"`, `tileId:null`** — renders fine (the earlier `overview` stepId fix generalized the panel to any host stepId; header shows plain "Export", filename falls back to the stepId).
- **`origin:"app"`** — echoed back verbatim in the `export` intent; the panel header shows "· workshop".
- **Formats `doc` and `json`** — now first-class in the panel (`doc`→"Word", `json`→"JSON" with its own icon), and the format row is now **robust to ANY unknown format id** (falls back to an uppercase label + first-letter icon instead of crashing). So advertise `availableFormats:["doc","json"]` (Report=doc/HTML-msword, Archive=json) and it renders + round-trips.

**So your B7 host work is unblocked:** add the `getExportViewModel("app", null)` case (monolithic, `availableFormats:["doc","json"]`, `availableScopes:[{kind:"step",label:"Whole project"}]`, `defaultPreset:"appendix"`), the `buildExportIntentArtifact` app branch (doc→`buildProjectReport` `exporters.js:32`, json→`buildProjectJson` `exporters.js:23`), the App ⬇ button emitting `data-action="open-export-panel" data-export-origin="app"` (reserved `stepId:"app"`), and retire the two topbar buttons + `overview.js:28` after parity. Remember the refresh-stability rule (§O): key on `stepId:"app"`, not `origin` (the `needViewModel` rebuild drops origin). **⚠️ Bump the cache label** — this panel change (doc/json + unknown-format robustness) is in the Claude-owned `export-panel.html`. Asset **153** green.

---

## Q · Codex TODO list — remaining slices to finish the feature (2026-07-21, Claude)

Batch A landed + fully verified live (every format exercised). 9 targets done; formats **docx/xlsx/pdf** working; **png/svg/pptx** + 3 slices remain. Detail in §O; app-tier contract in §P.

**TODO 0 — Cache-label bump (next PR).** Two more Claude-owned `export-panel.html` changes since your `20260722-export-panel-stepid-fix`: doc/json first-class formats + unknown-format robustness (§P). Roll into your next bump.

**TODO 1 — B7 App ⬇ (next; unblocked, surface confirmed in §P).** `getExportViewModel("app",null)` → `availableFormats:["doc","json"]`, `availableScopes:[{kind:"step",label:"Whole project"}]`, `defaultPreset:"appendix"`; `buildExportIntentArtifact` app branch → doc→`buildProjectReport`(`exporters.js:32`), json→`buildProjectJson`(`exporters.js:23`); App ⬇ button `data-action="open-export-panel" data-export-origin="app"` (reserved `stepId:"app"`, `tileId:null`); **key on `stepId:"app"` not `origin`** (needViewModel refresh drops origin, `app.js:843/886`); retire the two topbar buttons + `overview.js:28` after parity; extend `exportViewModels.test.js`+`artifacts.test.js`. `setBundle`/bundle stays out of scope.

**TODO 2 — Step VI E2E + Channels (async JOINT slice).** Bytes come from the live iframe, not `workspace` — do **NOT** clone `buildExportIntentArtifact`. Re-home via a branch in async `handleExportIntent` (`app.js:914`) reusing the existing coordinators + `e2eRouteDocuments.js` verbatim, and **intercept BEFORE the unconditional `exportExportIntent` call** (`app.js:917`, throws on null). Honest formats: `step6-e2e`=svg/png/pdf/pptx, `step6-channels`=svg/png ONLY. Add `getExportViewModel` cases for both (mandatory — else ⬇ no-ops) + `tileExportButton` in the shared render fns (`step6.js:89`/`:171`, outside the fullscreen guard). **Ping Claude on start** — Claude confirms the coordinator/asset side + verifies the round-trip.

**TODO 3 — Step VII `org-chart` png/svg (JOINT via Claude relay; do LAST).** Not `src/`-only — png/svg come from the client `buildExportSVG`/`svgToPng` in the Claude-owned `org-chart.html`, via Claude's `step7-ux.html` relay. Codex lands `getExportViewModel("step7","org-chart")` → `availableFormats:["png","svg"]`, `monolithic:true`, no selection + host vm + tests. Claude owns the renderer + relay leg + verification. Do not edit `design-previews/**`.

**Coordination (per tile):** Codex posts intended vm shape → Claude confirms it renders → Codex lands vm+generator+buttons+tests → Claude verifies the live round-trip → legacy button retired same PR. Done = host tests green AND Claude round-trip passes.

**DoD (§O):** every tile round-trips; every ⛶ has a ⬇ except the flagged ⛶-only set; honesty rule held; wire-id stepIds + reserved `app`; host+asset tests green; final label bumped; Mark confirms Safari + a couple live exports (incl. one async). **Boundaries:** Codex never edits `export-panel.html`/`step7-ux.html`/`org-chart.html`; new vm fields → §A first.

---

## R · B7 verified + the last two slices (2026-07-21, Claude)

**✅ B7 verified live** (`20260722-app-export-b7`): topbar ⬇ Export (`origin:"app"`, `stepId:"app"`, `tileId:null`) → both generators exercised — doc→`new-vsm-project-report.doc` (`buildProjectReport`), json→`new-vsm-project.json` (`buildProjectJson`), both `exportReady`+download+close; legacy Report/Archive/Overview-Download-Report retired; 0 console errors. **Cosmetic nit (optional):** the `appendix` default preset shows "CUSTOMIZED" on open (its pdf/bundle default ≠ the app vm's doc/step) — point the app vm `defaultPreset` at a doc-format preset, or ask Claude to suppress the flag when only auto-resolving an incompatible default.

**Formats live:** docx/doc · xlsx · pdf · json. **Remaining:** png/svg/pptx, via the last two JOINT slices:

**Slice 1 — Step VI (async, do next).** Bytes come from the live iframe, NOT `workspace` — re-home via a branch in async `handleExportIntent` (`app.js:914`), reuse the existing coordinators + `e2eRouteDocuments.js` verbatim, **intercept before the unconditional `exportExportIntent` call** (`app.js:917`, throws on null). Honest formats: `step6-e2e`=svg/png/pdf/pptx, `step6-channels`=svg/png ONLY. `getExportViewModel` cases for both (mandatory) + `tileExportButton` in the shared render fns (`step6.js:89`/`:171`). Detail §O. **Ping Claude on start.**

**Slice 2 — Step VII `org-chart` (relay, do last).** png/svg from the client `buildExportSVG`/`svgToPng` in Claude-owned `org-chart.html` via Claude's `step7-ux.html` relay. Codex lands `getExportViewModel("step7","org-chart")` → `availableFormats:["png","svg"]`, `monolithic:true`, no selection + host vm + tests. Claude owns renderer + relay + verification. No `design-previews/**` edits.

**Coordination/DoD unchanged (§O/§Q).** Boundaries: `export-panel.html`/`step7-ux.html`/`org-chart.html` stay Claude-owned; new vm fields → §A first.

---

## S · Step VI surface CONFIRMED ready — no panel change needed (2026-07-21, Claude)

Pre-staged the Claude side of Slice 1 (Step VI). Unlike B7 (which needed doc/json added), **the panel already handles Step VI as-is** — verified + spec-locked in `export-panel.spec.js` ("Step VI async readiness" + "Step VI honesty"):
- **Visual formats render:** `svg/png/pdf/pptx` were already first-class in the panel; a `step6-e2e` vm advertising all four renders all four buttons; a `step6-channels` vm advertising `svg/png` renders exactly those two.
- **Async flow works:** on Export (embedded), the drawer holds a **"Generating…"** state and stays open; a genuinely **delayed** `exportReady` with the matching `requestId` (simulating your async iframe render) closes it cleanly. A stale/superseded reply is ignored (existing requestId-correlation).
- **stepId `step6`** is a built-in wire-id — no robustness concern.

**So Slice 1 is a pure host job — no surface dependency.** Build the async `handleExportIntent` branch + the two `getExportViewModel` cases + `tileExportButton` placement per §O/§R, advertise the honest per-tile formats (`step6-e2e`=svg/png/pdf/pptx, `step6-channels`=svg/png), and echo `requestId` on the (possibly delayed) `exportReady`/`exportError`. When it lands, ping Claude to verify the live round-trip (incl. one slow format like pptx). Asset **155** green.

---

## T · Org-chart slice (Slice 2) — Claude's leg DONE, Codex's leg contract (2026-07-22, Claude)

**Claude's relay/renderer leg is built + verified** (asset-tests **157** green; live on 4173 Transformation 2026). The png/svg are **client-rendered** in `org-chart.html` and relayed up through `step7-ux.html` — you never reach the org frame (it's two levels down). So **the bytes arrive WITH the intent**; your leg is the lightest yet — no generator, no `getExportViewModel` case needed.

**What you receive** — a normal `api:1` export event from the **Step VII frame** (`e.source` = the step7 iframe, same as `step7/all`), for `stepId:'step7', tileId:'org-chart'`, but **carrying an `artifact`**:
```js
{ evt:'export', api:1, origin:'step', stepId:'step7', tileId:'org-chart',
  scope:'tile', target:{}, format:'png'|'svg', preset, options,
  filename:'VSM7_…_Org-Chart_…_2026-…svg',   // the panel's computed name
  skin, requestId,
  artifact:{                                  // ← the client-rendered bytes, ready to download
    mimeType:'image/svg+xml' | 'image/png',
    dataUrl:'data:image/svg+xml;charset=utf-8,…' | 'data:image/png;base64,…',
    suggestedName:'org-chart_<sif>__<N>-open-accountability-gaps.<ext>'  // honest open-gap count baked in
  } }
```

**What you build** — in `handleStep7BridgeMessage`, add: if `message.api===1 && message.evt==='export' && message.stepId==='step7' && message.tileId==='org-chart' && message.artifact`:
1. Turn the data URL into a Blob — `const blob = await (await fetch(message.artifact.dataUrl)).blob();`
2. Download it — `downloadBrowserBlob(blob, message.filename)` (use `message.filename` for consistency with every other tile; `message.artifact.suggestedName` is available if you'd rather preserve the org-chart's open-gap-count filename).
3. Reply DOWN — `postToStep7Frame(frame, {cmd:'exportReady', requestId: message.requestId, downloadName: message.filename})`. On any failure → `{cmd:'exportError', requestId, message}`.

That's the whole host leg. **Do NOT** add a `buildExportIntentArtifact` branch (nothing to generate) and **do NOT** register `getExportViewModel('step7','org-chart')` (step7-ux supplies the png/svg vm locally). **Do NOT** edit `design-previews/**`. Add a host test asserting the org-chart `export`+`artifact` → download + `exportReady` relayed to the step7 frame.

**When it lands, ping me** — I verify the full download live on 4173 (7.7 with real vessels/RASIC → real png/svg file). That closes the last slice; then it's your final cache-label bump + Mark's Safari spot-check.

---

## U · Word-export readability FIXED — docx → doc (2026-07-22)

**Bug (Mark hit it):** the "Word" exports were HTML-`application/msword` content with a **`.docx`** extension. Word treats `.docx` as OOXML (a `PK…` ZIP), finds HTML instead, and rejects the file as corrupt/unreadable. (Verified by inspecting the bytes: `<!doctype html>…`, mime `application/msword`, name `…​.docx`.) The App ⬇ Report was unaffected because it already downloaded as `.doc`.

**Fix (Codex, host, label `20260722-word-doc-extension`):** host view-models now advertise **`doc`** instead of `docx` for all HTML-as-Word exports; the generators download **`.doc`** files; legacy `docx` requests are accepted but **normalized to `.doc`**. (xlsx untouched — those are real OOXML `spreadsheetml.sheet` and open cleanly.)

**Surface alignment (Claude):** `step7-ux.html`'s local `step7ExportVm` (the `step7/all` view-model — Claude-owned, so Codex couldn't touch it) still advertised `docx` and worked only via the host's `docx`→`.doc` normalization. Changed it to natively advertise **`doc`** so Step VII matches every other tile and doesn't depend on the legacy path. The panel already renders `doc` as "Word" (§P). Asset-tests updated (`step7-ux.spec.js`, `step7-export-relay.spec.js` — `['doc','pdf']`); suite **157** green. Reaches cached 4173 on the next label bump; the readable-`.doc` download already works there today.

**Re-verified live (4173 / Transformation 2026):** Step VII Word export → `vsm7-…-workshop-record-2026-07.**doc**`, `application/msword`, HTML body, panel closes on `exportReady`. Opens cleanly. ✅

---

## V · Final cleanup pass — closes out the feature (2026-07-22, Claude)

Export feature is functionally complete + verified end-to-end on real data (Transformation 2026); Word-readability fix in (§U). Two housekeeping items on Codex's side, then Mark's Safari sign-off.

**1 · Retire the Step VI bespoke export menus (parity confirmed — Claude drove all formats through the panel: E2E svg/png/pdf/pptx + Channels svg/png, real downloads on 4173).** Remove:
- **E2E:** the `data-e2e-export-menu` `<details>` in `step6.js` (the `export-e2e-route` buttons ×4) + its handler in `app.js` (the `export-e2e-route` branch, ≈`app.js:971`).
- **Channels:** the channel-variety export menu in `step6.js` (the `export-channel-variety` buttons ×2) + its handler in `app.js` (≈`:1010`).
- **KEEP** the coordinators + `e2eRouteDocuments.js` (the panel path reuses them — only the bespoke menu UI + dedicated handlers go). After removal the tile ⬇ is the single Step VI export path; confirm `[data-e2e-frame]`/`[data-channel-variety-frame]` still resolve for the coordinator.

**2 · Final cache-label bump.** So 4173 + users pick up (a) Claude's native-`doc` Step VII panel (`step7ExportVm`; the readable `.doc` download already works via normalization, but the panel still *labels* it `docx` on cached 4173 until the assets refetch), and (b) everything else current. Bump the label everywhere (`index.html`, `start.command`, host imports, the `export-panel` + `step7-ux` iframe URLs) + the matching test pins.

**Then:** ping Claude → Claude runs a final full sweep on the freshly-labeled 4173 (one export per format incl. a Word `.doc` that opens + one async) → clean bill of health for Mark's Safari spot-check. That closes the feature. Boundaries unchanged: Codex never edits `export-panel.html`/`step7-ux.html`/`org-chart.html`.

---

## W · Real OOXML `.docx` — permanent Word fix (2026-07-22, Claude)

**Decision (Mark): editable Word matters → generate real OOXML `.docx`, not HTML-as-Word.** The `.doc` rename (§U) was a dead end — modern macOS Word still shows *"unreadable content… recover?"* on the HTML-`application/msword` file. Only a genuine Word document opens cleanly.

**Key insight — docx is the ONLY non-real-OOXML export.** Codex already hand-writes genuine OOXML for **xlsx** (`buildSimpleXlsx`, `exporters.js` — verified `PK`/spreadsheetml) and **pptx** (`e2eRouteDocuments.js`, own `crc32`+zip writer + `[Content_Types].xml` — verified `PK`/presentationml). So this is **no new dependency** (stays zero-dep) — just a docx-flavored builder reusing the existing zip writer.

**Build `buildSimpleDocx(...)`** — a WordprocessingML package zipped like xlsx/pptx: `[Content_Types].xml` · `_rels/.rels` · `word/document.xml` (`<w:document><w:body>…`) · `word/styles.xml` + `word/_rels/document.xml.rels` (heading styles + table borders). Return mime `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. **The real work = content conversion:** map the report content (currently HTML via `documentShell`) to WordprocessingML — headings→styled `<w:p>`, paragraphs/lists→`<w:p>`/`<w:r><w:t>`, and **tables (RASIC/contribution/steering matrices) → `<w:tbl>`/`<w:tr>`/`<w:tc>` (required — the reports lean on tables).** Convert/replace the Word generators: `step1Doc`, `step2Doc`, `step7Doc`, `buildProjectReport` (App ⬇ Report).

**Format wiring:** switch these tiles' vms back to advertise **`docx`** (real OOXML → `.docx` + wordprocessingml mime); keep `doc` accepted-normalized or drop it (panel renders both as "Word", §P). xlsx/pptx/pdf/json/svg/png unaffected.

**Coordination:** (Claude) when the real docx lands, flip `step7-ux` `step7ExportVm` back to `docx` (the `step7/all` vm — Claude file) + re-verify OOXML on 4173. **Host test:** assert `PK` zip containing `word/document.xml` + wordprocessingml mime (mirror the xlsx `PK`/`sheet1.xml` test). **Final gate (Mark):** opens in real macOS Word **without the "unreadable content" warning**. Boundaries: no `design-previews/**` edits; new vm fields → §A first.

---

## X · Export simplified to ONE tier — tile-level only (PO decision, 2026-07-22; Claude edited `src/` with Mark's explicit authorization)

**Why:** up to three ⬇ buttons per screen (topbar + step + tile) — Mark wants export tied to the tile/micro-content only. Bonus: the Safari "flip" triggers specifically on the **top-bar** export (tile exports are clean per Mark), so removing that tier also removes the trigger.

**What Claude changed in your files (all verified: host 201/201, asset 157, live on 4173, 0 console errors):**
1. **`app.js`** — removed `renderTopbarExportButton` (fn + call at the topbar-actions). The **app export moved INTO the More menu** (`renderTopbarMenu`): same button attrs (`data-action="open-export-panel" data-export-step="app" data-export-scope="step" data-export-origin="app"`), label "⬇ Export project". Report/Archive stay fully reachable; dispatch unchanged.
2. **`steps/step2|3|4|5|implementation.js`** — removed the `stepExportButton(...)` arg from each `stepHeader` call (tile ⬇s untouched).
3. **`steps/step7.js`** — removed the host-toolbar ⬇ (`open-step7-export` button). The editor's own `#exportBtn` + 7.7 `#orgExportBtn` inside the iframe are the Step VII export path. (Dispatch branch + `openStep7ExportPanel` left in place — now unused from UI, kept to avoid collateral.)
4. **`steps/focusMode.js`** — `renderFocusStepExportActions` returns `""` (no step-⬇ in Focus).
5. **`tests/exportPanelBridge.test.js`** — the `open-step7-export` pin flipped to `assert.doesNotMatch` (documents the new rule).
6. **KEPT: every tile ⬇** and **Step I's `stepExportButton("step1")` pair** (`step1.js:171/:193`) — Step I has no tile-level target; these are its only entry to `step1/all` (one per view, never two visible at once). If you later split Step I into per-subpage vms, migrate these to `tileExportButton` then.
7. `stepExportButton` in `renderHelpers.js` and its imports left intact (Step I still uses it).

**Your actions:**
- **⚠️ Bump the cache label** — these edits sit in `src/` files behind `?v=20260722-real-docx-export` imports; cached browsers (Mark's Safari!) won't see them until you bump.
- Sanity-pass the removals in your next sweep; adjust any test I missed (201/201 were green after my pin update).
- **New standing rule: export is tile-level only.** Future tiles get a `tileExportButton`; no new step-⬇/topbar export affordances.

**Safari flip status:** trigger removed, **mechanism NOT root-caused** (svh→vh was not it). If Mark sees the flip from the More-menu "Export project", the bug is in the app-tier panel call specifically — Claude investigates with a screen recording then.
