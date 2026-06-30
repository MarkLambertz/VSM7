# Meeting Landscape — Asset Briefing (Step VII · 7.6)

## 1. Overview

**Meeting Landscape** is a NEW standalone front-end asset — `meeting-landscape.html` — a sibling of `vsm.html`, `e2e-robustness-check.html`, `channel-variety-check.html`, and `design-previews/step7-ux.html`. It is embedded in Step VII substep **7.6 "Meetings & Agendas"** and gets its **own** bridge: `window.MTL` + `postMessage`. The asset has **two modes over one shared data record**: **Mode 1 — the single-meeting TILE/FORM view** (author a meeting's purpose, agenda, structured cadence, owner/roles, outputs) and **Mode 2 — the CADENCE LANDSCAPE canvas** (place meetings on a recursion × time grid, render their rhythm as markers-vs-bands, optionally connect them). A meeting **is a vessel** (`type:'meeting'`) whose identity, scope, provenance, candidate/accepted state, and algedonic right are host-owned in `step7-ux`; this asset enriches that vessel with where/when/how it plays out. It reuses `step7-ux`'s vessels, `membership`, and `aspects` and the route editor's swim-lane/snap/drag/connect machinery rather than reinventing any of it; the only genuinely new machinery is the time-axis semantic zoom and the markers-vs-bands recurrence renderer. Robustness diagnostics (loop coverage, cadence nesting, steering gaps, path-to-S5) are **designed-for but deferred** — the model is shaped so they bolt on as read-only overlays with no reshape.

## 2. Decisions log (locked forks)

- **New standalone asset** `meeting-landscape.html`, not folded into `step7-ux.html`.
- **Bridge global is `window.MTL`** (+ postMessage); localStorage key `meetingLandscape1`.
- **Two modes, one record:** TILE/FORM (Mode 1) and CADENCE LANDSCAPE (Mode 2) read/write the same per-meeting record.
- **A meeting IS a vessel** (`type:'meeting'`); meeting id = vessel id; no parallel id space.
- **Vessels are system-agnostic** — no `sys` field on a meeting; system colour derives from the linked SCTs/contributions it steers.
- **Canonical entities are never copied** — SCTs, contributions, Step I units, Step VI loops referenced by stable id only; names/`displayId` resolve live; `Source unavailable` fallback on removal.
- **Cadence is structured, not free text** — one cadence object drives both marker-vs-band rendering and (deferred) diagnostics.
- **Marker-vs-band is computed at render time** from cadence × current timeframe (zoom-independent stored data); author-overridable per meeting.
- **Connections are OPTIONAL** — a landscape is valid with zero; when present they are typed by what flows (`report | decision | action-list | escalation`).
- **Bands/lanes are read-only** — Step I owns recursion structure; the asset places meetings into lanes, it never edits the lane set.
- **Roles reuse `membership`** — the asset adds only a role-in-meeting *type*; membership presence stays host/`step7-ux`-owned.
- **Two-tier emit** — debounced authoritative `change{model}` + granular host-owned intents.
- **House rules locked:** no completeness percentages; DDD vocabulary; VSM colour grammar (S1 navy · S2 amber · S3/S3★ red · S4 green · S5 light blue); Workshop + Command Deck skins (token-only); focus mode; stable ids over names; confirm before destructive; preserve viewport on in-place edits.
- **System 3★ is never dropped** — the `S3★–S1 audit` loop is present and renderable like any other.
- **Export & diagnostics are deferred** (export replies `exportError`; diagnostics are post-MVP overlays).

## 3. Cadence canvas spec (Mode 2)

### 3.1 Mental model — two structures at once

The canvas makes the **VSM nesting of rhythms** legible at a glance, showing inter- and intra-recursion simultaneously:

- **Inter-recursion (top→bottom):** swim **bands** grouped by recursion level R+1 / R0 / R-1 (Step I order, most-aggregate at top — identical to the flight-route lane convention). A higher-scope meeting sits in a higher band.
- **Intra-recursion (within a band):** each unit at that level gets its own **sub-lane**, plus a synthetic **`shared`** sub-lane for meetings scoped to the whole level rather than one unit.

Time runs left→right. Fast cadences cluster low (R-1, daily/weekly), slow cadences cluster high (R+1, quarterly/annual). This is an **editor**, not a viewer: drag from a palette, snap to (lane, time), connect, annotate, inspect, edit, delete — with undo/redo, autosave, export, focus mode, skins.

### 3.2 Two-level lane model (collapsible)

```
BAND  (recursion level — from Step I; READ-ONLY; host owns set/order/names)
 └─ SUB-LANE  (one per unit at that level + one synthetic "shared/cross-unit" sub-lane)
```

- **Bands** map 1:1 to `ctx.units` grouped by `level`, preserving Step I order. Read-only: no add/rename/reorder. The only lane interaction is placing/dragging a meeting into a sub-lane, which sets its `scope`.
- **Sub-lanes** are the level's units plus the `shared` lane. A meeting's `scope` resolves to `{level, unitId|'shared'}` (`unitId` → a real Step I unit; `'shared'` → the band's cross-unit lane). *(Open Q for the host: whether `laneUnitId` may ever be a level id; tentatively always a unit id, with level as a view rollup — see §8.)*
- **Collapse is per band, independent.** Three states: **Expanded** (full sub-lanes at `SUBLANE_H`); **Collapsed** (one strip at `BAND_COLLAPSED_H`, meetings flattened, keeping X position + cadence styling); **Collapsed + count** (right-aligned `"n meetings · m units"` chip). Collapse state lives in `horizons.collapsedLevels[]` / `lanes{}` (view state; persisted with the local save but **not** emitted in `change`). Collapsing **preserves the viewport** (bands above keep their screen Y; bands below reflow). An empty band still renders header + empty strip so the recursion structure is always fully visible.

### 3.3 Geometry (named constants — variable-height layout)

```
HEAD_W            = 188   // left label gutter (band + sub-lane names, chevrons)
TIME_TOP          = 34    // time-axis ruler band height
SUBLANE_H         = 64    // one expanded unit sub-lane
BAND_HEADER_H     = 26    // band title row (chevron + R-level + name + count chip)
BAND_COLLAPSED_H  = 56    // a collapsed band's single strip
BAND_PAD          = 6     // vertical padding inside a band
COL0              = HEAD_W + 16   // x where the timeline area starts
MARKER_R          = 9     // discrete-cadence marker radius
BAND_THICK        = 14    // continuous-cadence rhythm-band thickness
```

Band Y is the running sum of header + (expanded ? Σ sub-lanes : collapsed strip) + pad, computed once per render into a `bandLayout[]` table (the variable-height replacement for the route editor's fixed `LANE_H`). Sub-lane Y = `bandTop + BAND_HEADER_H + subIndex*SUBLANE_H + SUBLANE_H/2`. Everything downstream (hit-test, snap, connection routing) reads `subLaneY(meeting)` the way the route editor reads `laneY`. Each band's left gutter is quietly tinted by the dominant system of its meetings (VSM colour grammar); a meeting's **own** system colour (from its SCTs) carries on the marker/band. Skins are token-only and never change method colours.

### 3.4 Time axis + timeframe zoom

The X-axis is **real time**. A sticky **time ruler** (`TIME_TOP` tall) pins to the top. An **anchor date** (`meta.anchorDate`, default = today) sets X=`COL0`. A segmented control sets the **timeframe** (semantic zoom): **`Quarter` · `6 Months` · `1 Year` · `2–5 Years`** (the 2–5 range is itself adjustable via a small stepper). Raw pan/zoom still works via wheel/`+`/`−` for fine framing; `Fit`/`Full` reused from the route editor.

| Timeframe | Horizon | Major ticks | Minor (snap) grid |
|---|---|---|---|
| **Quarter** | ~13 weeks | weeks | days |
| **6 Months** | ~26 weeks | months | weeks |
| **1 Year** | 12 months | quarters | months |
| **2–5 Years** | up to 60 months | years | quarters |

Switching timeframe **preserves the anchor and vertical viewport**, re-fitting horizontally by default. Active timeframe lives in `horizons.timeframe` (view state; persisted). Stored meeting times are **zoom-independent** (cadence + phase, §3.6), so the same model re-renders correctly at any zoom/anchor and marker-vs-band re-derives live.

### 3.5 Snap grid (two-axis)

- **Vertical snap → sub-lane row** (sets `scope`). Dropping on a band header / empty area → that band's `shared` sub-lane. Dropping on the **band-boundary gutter** between two levels is a deliberate affordance for an inter-recursion steering organ: it tags the meeting `spanLevels:[upper,lower]` so it renders straddling the boundary.
- **Horizontal snap → the timeframe's minor grid** (sets the meeting's **phase/anchor**, not a pixel).
- Snap is visualised on drag with a ghost crosshair (highlighted sub-lane + grid line). Two meetings may share a (sub-lane, time) cell — they **fan** vertically so both stay clickable; a crowded sub-lane auto-grows in height (variable-height layout supports it).

### 3.6 Markers vs Bands — the recurrence renderer (the signature visual)

The renderer chooses one of two modes per meeting from a deterministic rule:

- **MARKERS (slow / discrete):** each occurrence is a countable glyph in the meeting's system colour at its computed X, with a thin connector tick to the ruler. **Shape encodes cadence family** (annual = diamond, quarterly = square, monthly = circle) for label-free distance reading. The name leads on the **first** visible marker; later occurrences are bare glyphs. Algedonic/escalation meetings carry a red ⚡ overlay.
- **BANDS (fast / continuous):** a continuous horizontal rhythm band (`BAND_THICK` tall, rounded ends) spanning the meeting's active `window` (or the whole horizon), in the system colour at reduced opacity, **overlaid with a repeating tick texture** whose spacing = the cadence period (a weekly band ticks denser than a monthly one). A **cadence label pill** sits at the left end (`"Weekly"`, `"Every 2 weeks"`).

**The exact rule** for a meeting M in active timeframe T:
1. Compute `occurrencesInHorizon(M, T)`.
2. `on-signal` / `adhoc` → neither (below).
3. `occurrencesInHorizon ≤ MARKER_CAP` (default **12**) → **MARKERS**.
4. Else → **BAND**.

`MARKER_CAP = 12` is the single tunable; it makes the timeframe thresholds fall out automatically (weekly = ~13/quarter → band; monthly = ~3/quarter → markers; quarterly = ~20/5yr → band). A meeting may carry an explicit `render:'markers'|'band'|'auto'` override (default `'auto'`) set from the inspector. Because the rule is purely cadence × horizon × cap, **switching timeframe re-derives marker-vs-band live with no model change** — that *is* the rhythm-nesting visualisation. *(The TILE/FORM preview pill, §4, uses a coarser editor shorthand — period ≤ ~14 days → band — which the canvas's occurrence rule subsumes; the canvas is authoritative. `MARKER_CAP` and the 14-day shorthand are editor constants, retunable without a data change.)*

**Non-periodic meetings:**
- **`on-signal`** (algedonic / escalation line): a **dashed always-on rail** spanning the full horizon in red with a ⚡ cap and an `"on signal"` pill — no schedule, but a standing channel that must always be visible; typically a cross-level rail (S1→S5).
- **`adhoc`**: a single hollow dotted marker at its anchor ("as needed"), no repetition.

**Density:** colliding markers fan vertically; a band draws at the row baseline with markers floating above; a right-edge **"+n more →"** affordance hints a meeting continues past the horizon.

### 3.7 Drag-drop + palette

- **Drop from palette → canvas:** vertical release → nearest sub-lane → sets `scope` (band-boundary → `spanLevels`); horizontal release → snapped grid → sets `phase.anchor`; **cadence is read from the meeting's own data**, never invented by the drop — the renderer then decides markers-vs-band.
- **Move on canvas:** drag re-snaps lane (re-scopes) and/or anchor (re-phases); cross-band drag re-assigns recursion level. Live ghost shows target highlight + tooltip (`"R0 · Mobility Unit · anchors Mon, wk 12"`). Dragging a band's left/right end adjusts `schedule.window`. Defensive: stale-drag cleanup on mousedown, drop-outside cancels, Esc cancels — carried over from the route editor.
- **Palette** (collapsible pane, `?pane=hidden` supported): lists host-fed meeting vessels **not yet placed**, grouped by suggested level, tagged with system pill + cadence chip (`⟲ Weekly`) + algedonic ⚡. Click = quick-place at the suggested scope's `shared` lane; drag = precise place. Placed meetings leave the palette (return on removal). **"+ New meeting"** mints a `tempId:'local:<n>'` vessel and emits a `meeting{op:'created'}` intent — the asset never invents canonical vessel ids.

### 3.8 System colouring (reuse, not reinvent)

A meeting's VSM system is resolved from its linked SCTs/contributions (via RASIC membership / `linkedSctIds`, host-fed). The dominant system fills its marker/band; secondary systems show as a thin striped accent. SCTs are never copied — only `sctId` references are held, names/`displayId` resolve live (`Source unavailable` fallback). No completeness percentages.

### 3.9 Optional typed connections

Connections express what flows between meetings. Drawn port-to-port (output right → input left) with the route editor's rubber-band/elbow/arrowhead geometry; self-loops and duplicates guarded. Each carries `flow ∈ {report, decision, action-list, escalation}`, rendered by colour + line style + a midpoint glyph chip:
- `report` — neutral grey solid, 📄;
- `decision` — amber solid, ◆;
- `action-list` — blue solid, ☑;
- `escalation` — red **dashed**, ⚡.

Cross-band crossings are made obvious (a connection climbing R-1→R0→R+1 is the visible inter-recursion steering path). Time direction matters: an edge anchors at the source's nearest occurrence and lands at the target's next occurrence after it, so a `report → decision` edge visibly spans the lag between a weekly sync and the quarterly review it feeds; edges re-route live as occurrences shift with zoom. Connections are frame-owned (emitted in `change`). Optionally a connection carries `loopId` (which Step VI loop it realises) and `carries` (the specific artifact, tying one meeting's typed output to another's typed input) — both additive, see §5.

### 3.10 Selection, inspector, call-outs

Click selects a meeting (its whole recurrence highlights together), a connection, or a call-out; shift-multi-select + marquee + Esc-clear + arrow-pan / Shift-nudge reused. The inspector is a **floating popover** anchored to the selection (reusing the route editor's `#propPop`; re-anchors on pan/zoom, clamps to stage, closes with ×; for a connection it spans both endpoints so it never covers the re-route handles).
- **Meeting popover:** name (dbl-click edit), scope (band + sub-lane dropdowns, read-only band set), **cadence editor** (the same fields as Mode 1's form — shared editor), derived system read-out + override palette, algedonic toggle, `render` override, linked-SCTs read-out, derived participants read-out, call-out add.
- **Connection popover:** from→to with a `· lane hand-off` flag when it crosses bands, `flow` picker, optional label, delete.
- **Call-outs** (`kind = context | transition`, in-box editable, draggable, persisted `dx/dy`): transition call-outs on a cross-band connection capture the human's steering/hand-off observation. These are the human's annotations; the canvas asserts nothing.

### 3.11 Workshop UX

- **Focus mode** (`F` / bridge `fullscreen`): presentation-grade — bigger type, palette/inspector recede, the landscape fills the screen. Move across collapse states / timeframes without leaving focus. Host `<iframe>` must carry `allow="fullscreen"`.
- **Skins:** Workshop (calm/bright default) + Command Deck (high-contrast), token-only.
- **Viewport preservation:** every in-place action (collapse, edit, add/remove connection, switch skin) preserves vertical scroll + anchor framing; only explicit `Fit`/`Full` or a timeframe change re-frames.
- **Confirm before destructive:** deleting a meeting from the canvas, a connection carrying a transition call-out/finding, or clearing the landscape names the artifact and asks first. Removing a meeting from the *canvas* returns it to the palette (does **not** delete the canonical vessel — that is an explicit host-owned intent).
- **Persistence/export:** autosave to `meetingLandscape1`; export/import JSON; PNG/SVG export of the chrome-free landscape via `export{format,requestId}` → `exportReady` (deferred, §6). View state is in the local save but not in the emitted model.

## 4. Meeting tile/form spec (Mode 1)

Mode 1 edits the same meeting record as the canvas, so its cadence editor is the **shared editor** used by the canvas inspector. The PO delegated form size; the split is **5 always-visible v1 tiles** (the steering spine) + **6 progressively-disclosed tiles** (refinement). Every tile is collapsible; disclosure state is per-meeting UI, not persisted to the model. A vessel is system-agnostic, so the form shows no `sys` field — system chips appear only on linked SCTs and derived participants.

**v1 — always visible (the steering spine):**

| # | Tile (DE → EN) | Why v1 |
|---|---|---|
| T1 | **Zweck & Resultat** — Purpose & Result (+ meeting-type) | A meeting owning no decision/result is the #1 anti-pattern; type seeds defaults. |
| T2 | **Agenda & Ablauf** — Agenda & Flow | The operative content: check-in → priority items → check-out + breaks. |
| T3 | **Dauer & Frequenz** — Duration & Cadence | **Drives canvas position & rhythm.** The single most important field in the asset. |
| T4 | **Owner & Roles** — Owner, Moderator & meeting roles | Who runs it; role-in-meeting links (reuses `membership`). |
| T5 | **Werkzeuge zur Doku** — Documentation Tools (the OUTPUTS) | The artifacts produced — the hand-off surface. |

**Progressive disclosure — collapsed by default ("More detail ▸"):**

| # | Tile | Notes |
|---|---|---|
| T6 | **Teilnehmerprofil** — Participant profile (required expertise / leadership level) | Disclosure because participants are largely **derived** from RASIC + `membership` (shown live in T4); the profile is the refinement. |
| T7 | **Entscheidungsprozess(e)** — Decision process(es) | Disclosure but **pre-seeded by meeting type**, so v1 defaults are sensible without opening it. |
| T8 | **Einladung** — Invitation (prep effort, self-catering note) | |
| T9 | **Format & Beteiligung** — Format & participation (open vs strict; do participants know each other; is each contribution clear) | |
| T10 | **Material & Catering** | logistics |
| T11 | **Nachbereitung** — Follow-up / implementation | **links results to the transformation backlog** by stable id |

> **"weitere Rollen"** (time-keeper, documentation, observer) folds **into T4**, not a separate tile — it is the same role-in-meeting mechanism with a different `roleType`.

**Meeting-type seed defaults** (glass-wall rule: seeds fill only empty fields, tagged "seeded", never overwrite human input — same derive-then-refine rule as `step7-ux`). Tokens (label localizable): `team-meeting` (decisionModes:[consent]; check-in/out on) · `status-report` (expert-recommendation; outputs:[action-list]) · `one-on-one` (openness:open) · `budget-planning` (consent; outputs:[decision-list]) · `kennenlernen` (participantsKnowEachOther:no; openness:open) · `idea-generation` (openness:open; outputs:[parking-lot, backlog]) · `problem-identification` (outputs:[impediments, parking-lot]) · `workshop` (breaks suggested; outputs:[action-list, decision-list]) · `conflict-resolution` (consensus; openness:strict) · `training` (expertise prompt).

**Cadence editor (T3 — structured, shared with the canvas).** A **mode** segmented control (Recurring / One-off / On signal). For Recurring: a compact "**every [n] [unit]**" stepper + unit dropdown, optional anchor (weekday / day-of-month / month), optional occurrence count. A live **preview pill** shows the resolved label and the render kind the canvas will use — "⟲ Weekly · shown as a rhythm **band**" vs "● Quarterly · shown as **markers**" — so the facilitator sees the rhythm-nesting intent while editing. `duration.minutes` lives in the same tile (separate from cadence) and sets marker/band thickness on the canvas.

**Roles (T4).** Roles are **existing role/function vessels** from `step7-ux` 7.1, never authored here. The roster picker lists `ctx` vessels of `type ∈ {role, function}`, scope-affinity first. Picking one creates a participation (default `roleType:'participant'`); a segmented control sets the type. **`owner` and `moderator` are singletons** (radio semantics); the rest allow many. **Derived participants** appear automatically: any role whose RASIC touches a linked SCT shows as a `source:'derived'` chip ("from RASIC"); the facilitator promotes it to authored (e.g. names it owner) or leaves it. Authoring/removing a participation keeps `membership[vesselId]` in sync via the existing `membership{…, op:'add'|'remove'}` intent; the role-in-meeting **type** is the additive enrichment this asset contributes (rides on the meeting record + `participation` intent, so `membership` stays a plain id→ids map).

**Outputs (T5).** Five toggle chips (`action-list | decision-list | impediments | parking-lot | backlog`), each with an optional note — the meeting's produced artifacts and the hand-off surface; `decision-list`/`action-list` are the natural source for `followUp.backlogRefs` (T11) and for typed canvas connections. Inherited KPIs/artifacts/tools from the linked SCTs' aspects render read-only here but are **not** stored on the meeting.

**Validation (invite, never block; no scores, no %):** no `owner` → soft warn "no owner assigned"; empty `intendedResult` → soft warn "this meeting owns no stated result"; agenda minutes + breaks > duration → neutral overflow hint ("runs 15 min over"), not a red score; second `owner`/`moderator` assignment → inline swap prompt (singletons). Destructive actions confirm and name the artifact; removing a linked SCT keeps the agenda items/participations that referenced it and flags the source detached (preserve-evidence rule).

## 5. Canonical data model + VSM extensions

This model **extends** the `window.STEP7` model. It reuses STEP7's `ctx` (host truth) and STEP7's authoring layer (`vessels`, `rasic`, `aspects`, `membership`, `vesselAspects`, `meetings` charter fields) **by reference, by stable id** — never re-declaring or copying them. Everything new lives in an additive enrichment, keyed by the existing meeting-vessel id.

### 5.1 Reuse map — host-owned vs editor-owned

| Concept | Owner | Relationship |
|---|---|---|
| Recursion units (R+1/R0/R-1) = **lanes** | **HOST** (Step I) | Lane = the meeting's `scope` unit id; referenced, never copied. |
| Canonical SCTs | **HOST** (Step III) | Reference only; names/`displayId` resolve live. |
| SCT contributions (SCT × unit, Step IV) | **HOST** (Step IV) | I/O, decision scope, RASIC anchor reference these. |
| Step VI canonical loop ids (the seven) | **HOST** (Step VI) | `loopCoverage` + connection `loopId` reference them; never enumerated/filtered. |
| The **meeting vessel** (name, purpose, scope, prov, state, alg) | **HOST / step7-ux** | Meeting id = vessel id; this asset enriches, never re-declares. |
| `rasic{}` (A/R/S/I/C per contribution) | **HOST / step7-ux** | Decision-rights `accountable` resolves the `A` live from here. |
| `membership{}` (who is in a meeting) | **HOST / step7-ux** | Authoritative member set; this asset adds only the role *type*. |
| `aspects{}` / `vesselAspects{}` (KPIs/artifacts/tools) | **HOST / step7-ux** | I/O `ArtifactRef` targets (needs stable per-item ids — §8). |
| `meetings{}` charter fields (`{value,src,lastDerived}`) | **HOST-derived / step7-ux** | The form *renders* these; structured `cadence` supersedes the free-text cadence field for rendering. |
| **cadence** (mode/frequency/interval/duration/anchor/signal) | **EDITOR** | Structured; drives marker-vs-band + diagnostics. |
| **placement** (lane mirror, t/x0, pinned, order) | **EDITOR** | Canvas position; `scope` stays authoritative for lane. |
| **connections[]** (typed inter-meeting flows) | **EDITOR** | Optional overlay; not canonical. |
| **participations[].roleType** | **EDITOR** | Type annotation only; presence owned by `membership`. |
| **io.inputs/outputs** (the act of wiring typed I/O) | **EDITOR** | Refs only; every target host-owned. |
| **decisionRights[]** (mode, scope, titles) | **EDITOR** | `accountable` is a *pointer* into host `rasic`, not a stored holder. |
| **loopCoverage[]** (strength, note) | **EDITOR** | References host loop ids. |
| **followUps[]** (before promotion) | **EDITOR** | Promotion hands off to host backlog by intent. |
| Transformation-backlog item from a follow-up | **HOST** (Implementation) | Carries `source:{kind:'meeting-followup',…}`. |
| `horizons` / view state (timeframe/origin/collapse) | **EDITOR** | Pure view state; persisted, non-canonical, never read by a diagnostic. |

### 5.2 Top-level shape

The asset emits the same STEP7 authoring `model` it received, with one additive block keyed by existing vessel id (sparse — a meeting with no enrichment simply has no entry):

```
model.landscape {
  meetings   { <meetingVesselId> -> MeetingLandscapeRecord }
  connections[ ]                       // OPTIONAL inter-meeting flows
  horizons   { timeframe, originDate/anchorDate, collapsedLevels[], collapsedUnits[] }   // view state
  schemaVersion : <int>
}
```

The vessel itself (name, purpose, scope, state, alg) stays in `model.vessels`; the landscape never duplicates it. A dangling `landscape.meetings[id]` (vessel deleted host-side) is flagged orphaned and offered for clearing (confirm-before-destroy), not silently dropped.

### 5.3 `MeetingLandscapeRecord` (one per meeting; both modes share it)

```
MeetingLandscapeRecord {
  id              // = meeting vessel id (STABLE). New-in-editor => tempId 'local:<n>', host assigns real id.

  // --- T1 Purpose & Result ---
  purpose, intendedResult,
  meetingType,                         // enum (§4); seeds defaults
  linkedSctIds:[sctId], relatedSctIds:[sctId],   // stable refs; NEVER copies the SCT

  // --- T2 Agenda & Flow ---
  agenda { checkIn{enabled,text}, items:[AgendaItem], checkOut{enabled,text}, breaks:[{afterItemId,minutes}] }

  // --- T3 Duration & structured Cadence (drives canvas) ---
  duration { minutes },
  cadence {
    mode:'recurring'|'one-off'|'on-signal',        // band/marker + diagnostic driver
    every:int, unit:'day'|'week'|'month'|'quarter'|'year', interval default 1,   // recurring
    anchor { startsOn?, dayOfWeek?, dayOfMonth?('last'), monthOfYear?, timeOfDay? },  // generative; occurrences NOT stored as a list
    count:int|null,                                // optional limited occurrences
    date?:'YYYY-MM-DD',                            // one-off
    signal?:{ trigger:'algedonic'|'escalation'|'threshold'|'event'|'other', loopId?, note },  // on-signal; pairs with vessel.alg
    label                                          // human cadence label on the canvas band/marker
  }

  // --- T4 roles (role-in-meeting); presence mirrors step7-ux membership ---
  participations:[ { id, vesselId(role|function), roleType:'owner'|'moderator'|'time-keeper'|'documentation'|'observer'|'participant', source:'authored'|'derived' } ]

  // --- T5 Documentation tools = OUTPUTS ---
  outputs { tools:[ { kind:'action-list'|'decision-list'|'impediments'|'parking-lot'|'backlog', enabled, note } ] }

  // --- typed I/O (refs only; every target host-owned) ---
  io { inputs:[IoRef], outputs:[IoRef] }   // IoRef { flow:'report'|'decision'|'action-list'|'escalation', ref:ArtifactRef, label? }
                                           // ArtifactRef = sct-aspect | vessel-aspect | contribution | decision | external(text escape-hatch)

  // --- decision rights (mode the PO asked for; ties to RASIC, never re-declares it) ---
  decisionRights:[ { decisionId('dec:<n>'), title,
                     mode:'consent'|'consensus'|'majority'|'delegated'|'advisory'|'command',
                     scope:DecisionScope(contribution|sct|unit|free),
                     accountable:{ contribId, note } } ]   // resolves the 'A' live from host rasic; NOT stored here

  // --- loop coverage (deferred-diagnostic hook) ---
  loopCoverage:[ { loopId(Step VI), strength:'primary'|'partial'|'incidental', note } ]   // qualitative, NOT a score

  // --- T6–T11 refinement ---
  profile { expertise:[string], leadershipLevel:''|'operational'|'tactical'|'strategic'|'normative' },
  decisionModes:[ 'consensus'|'consent'|'simple-vote'|'expert-recommendation' ],   // T7 picker (pre-seeded by type)
  invitation { prepEffort, prepNote, selfCatering, selfCateringNote },
  format { openness:''|'open'|'strict', participantsKnowEachOther:''|'yes'|'partly'|'no', contributionClear:''|'yes'|'unclear' },
  logistics { materials:[string], catering, location:''|'in-person'|'remote'|'hybrid' },
  followUps:[ { id('fu:<n>'), text, decisionId?, status:'open'|'promoted'|'dropped', backlogRefs:[{backlogItemId,label}] } ],

  // --- canvas placement (editor-owned; scope authoritative for lane) ---
  placement { laneUnitId(=vessels.scope mirror), t(ISO date|grid slot), x0, pinned, order, render:'markers'|'band'|'auto', spanLevels?:[upper,lower] }
}

AgendaItem { id, order(1=highest, contiguous), title, minutes?, purpose:''|'inform'|'discuss'|'decide', decisionMode?, ownerRef?(participationId) }
```

Notes that resolve the cross-draft forks:
- **Decision vocabulary:** `decisionRights[].mode` is the meeting-design register (`consent | consensus | majority | delegated | advisory | command`); the per-agenda-item / T7 picker `decisionModes` is the lighter facilitation set (`consensus | consent | simple-vote | expert-recommendation`). Both are kept — the former types a *decision the meeting owns*, the latter labels *how an item is decided*.
- **`roleType` is not RASIC.** RASIC lives per SCT-contribution in `rasic{}`; `roleType` is per meeting. The tie is via `decisionRights.accountable` resolving the `A` live, never a merged letter.
- **Occurrences are generated, not stored** (from `anchor` + `frequency` + `interval`), keeping the model small and making cadence-nesting a pure computation over recursion level × frequency.
- **Singletons:** `owner` and `moderator` are radio-enforced per meeting.
- **Diagnostics-ready, do not render now:** this shape lets a later pass compute loop coverage, cadence nesting, steering gaps, and operations→S5 paths from existing fields — no field is added later.

## 6. Draft bridge contract (`window.MTL`)

House-consistent with `window.VSM` / `window.E2E` / `window.CVC` / `window.STEP7`: `ready{api:1}` fired once after first render (listener attached before `ready` so earlier host commands are tolerated); debounced (~120 ms) authoritative `change{model}`, **silent on programmatic feeds**; `inFrame` standalone-safety; inline `onEmit` hook; `TARGET='*'` with the host verifying `event.origin`; stable-id reconciliation; `local:<n>` temp-ids; localStorage key `meetingLandscape1`.

### 6.1 `ctx` (HOST truth in, via `setContext`; rendered, never persisted)

```
ctx.units[]          {id,name,level('R+1'|'R0'|'R-1'|…),parent,sif}     // Step I; lanes grouped by level
ctx.scts[]           {id,displayId,name,sys,prio}                       // canonical, NEVER copied
ctx.contribs[]       {id,sctId,unitId,sys,accUnit,text}                 // Step IV; accUnit = ⚓ accountable anchor
ctx.loops[]          {id,kind,fromSys,toSys,scope,label}                // the seven Step VI loops (incl. S3★–S1 audit)
ctx.vessels[]        {id,type('role'|'function'|'meeting'),name,scope,state,purpose?,prov?,alg?}  // meeting + role/function vessels
ctx.rasic{}          "<contribId>|<vesselId>" -> R|A|S|I|C              // derive participants + resolve accountability
ctx.membership{}     <roleVesselId> -> [meetingVesselId…]               // step7-ux 7.4/7.5 role↔meeting map — reused
ctx.aspects{}        <sctId> -> {kpis,artifacts,tools}                  // inherited outputs context (read-only I/O targets)
ctx.vesselAspects{}  <vesselId> -> {…}                                  // vessel-specific aspect targets
ctx.backlog[]        {id,label}                                         // transformation backlog targets (T11)
ctx.meta             {sif,sifName}
```

### 6.2 Authoring layer (EDITOR-owned, host persists, via `change`)

`model.landscape` (§5.2) plus the round-tripped STEP7 authoring layer; `model.membership{}` is kept in sync with `participations` as the backward-compat mirror.

### 6.3 `window.MTL` inline surface

```
window.MTL = { setContext, loadModel, openMeeting, goto, setMode, setHorizon, select,
               setSkin, fullscreen, isFullscreen, setPaneVisibility, export, onEmit, getState }
// getState() -> deep clone of { ctx, model, ui:{ mode, horizon, selected, paneShown, fullscreen } }
```

### 6.4 HOST → frame commands

| `cmd` | payload | effect |
|---|---|---|
| `setContext` | `{units?,scts?,contribs?,loops?,vessels?,rasic?,membership?,aspects?,vesselAspects?,backlog?,meta?}` | **Merge host truth** (any subset). **SILENT** — re-renders, no `change`. |
| `loadModel` | `{model}` | **Replace the authoring layer** (incl. `model.landscape`). **SILENT.** Ids round-trip; `bumpId`/`dedupe` repair on load. |
| `openMeeting` | `{id}` | Focus the TILE/FORM on a meeting; `'new'` opens a blank form. |
| `setMode` / `goto` | `{mode:'tile'|'landscape'}` | Switch modes. `goto{substep}` accepts `'7.6'`/`meetings` (single-substep; mostly confirms focus). |
| `setHorizon` | `{horizon:'quarter'|'6mo'|'1yr'|'2-5yr'}` | Timeframe/zoom of the canvas. |
| `select` | `{ref:{kind:'meeting'|'placement'|'connection'|'loop'|'lane',id}\|null}` | Sets selection + opens inspector; no `select` echo. |
| `setSkin` | `{'workshop'|'deck'}` | Token-only skin. |
| `fullscreen` | `{on?}` | Enter needs a user gesture (in-frame button / `F`); exit always works. `<iframe>` needs `allow="fullscreen"`. Emits `fullscreenchange`. |
| `setPaneVisibility` | `{visible}` | Show/hide inspector pane; reflows canvas. Emits `paneVisibilityChanged`. |
| `export` | `{format,scope?,requestId,filename?}` | **DEFERRED** — replies `exportError` (§6.6). |

**URL params (no bridge):** `?pane=hidden`, `?mode=landscape|tile`, `?horizon=quarter|6mo|1yr|2-5yr`.

### 6.5 frame → HOST events — two tiers

**Tier A — Authoritative (the persistence record):**
- `ready{api:1}` — once, after first render.
- `change{model}` — debounced ~120 ms; the full editor-owned authoring layer incl. `landscape`; **silent on programmatic feeds**.

**Tier B — Granular intents (host owns the canonical mutation; `change` follows):**

| `evt` | payload | why an intent |
|---|---|---|
| `meeting` | `{op:'created'|'edited'|'deleted'|'placed'|'unplaced', meeting?, placement?, tempId?, meetingId?}` | vessel registry + canonical ids are host-owned; new meeting emits `tempId:'local:<n>'`. |
| `move` | `{placementId, meetingId, laneUnitId, x0, prevLaneUnitId?, prevX0?}` | placement dragged + snapped; emit on **drop**, not per pointermove. |
| `cadence` | `{meetingId, placementId?, cadence/recurrence, render, prev?}` | cadence change + marker↔band flip (a cadence-nesting diagnostic signal). |
| `participation` | `{op:'add'|'remove'|'retype', meetingId, vesselId, roleType, prev?}` | the typed role-in-meeting link. |
| `membership` | `{vesselId, meetingId, op:'add'|'remove'}` | **the existing step7-ux intent**, emitted alongside `participation` to keep 7.4/7.5 in sync. |
| `connect` | `{op:'created'|'retyped'|'removed', connection, prev?}` | optional typed input→output flow; loop-coverage/steering-gap diagnostics read these. |
| `alg` | `{meetingId, on}` | algedonic flag (canonical home is the vessel). |
| `agenda` | `{meetingId, op:'add'|'edit'|'remove', item?}` | agenda-item authoring (also carried in `change.model`). |
| `followup` / `followUpPromote` | `{meetingId, followUpId/op:'toBacklog'}` | follow-up → backlog promotion; host owns the backlog destination + `source` pointer. |
| `decisionConfirm` | `{meetingId, decisionId('dec:<n>')}` | host may canonicalise a temp decision id. |
| `horizon` / `mode` / `select` / `goto` / `paneVisibilityChanged` / `fullscreenchange` | per §6.4 | view/selection echoes; `select` carries `count` for multi-select parity. |
| `exportReady` / `exportError` | §6.6 | export result. |

RASIC and the canonical membership set are **read** via `ctx`, never mutated here except via the explicit `participation` + `membership` intents.

### 6.6 Export — DEFERRED

`export` replies for now:
```
{evt:'exportError', requestId, format,
 message:'Meeting Landscape — export is deferred; PNG/SVG/ICS rendering lands with the production asset.'}
```
The production reply is pre-reserved as `{evt:'exportReady', requestId, format, filename, mimeType, blob}` (structured-clone Blob, matching E2E), with `format` expected to grow to include `'ics'` (calendar) alongside `'png'|'svg'`, so wiring it later needs no contract change.

### 6.7 Standalone

Opening `meeting-landscape.html` directly (no parent, no `onEmit`) is fully usable and inert on the wire: it shows a prefilled demo (e.g. a "Quarterly Strategy Review", scope R0, S4 linked SCT, owner + moderator + documentation roles, quarterly cadence rendered as markers) and autosaves to `meetingLandscape1`.

## 7. Deferred / future — robustness diagnostics

Diagnostics are **deferred but designed-for**. The model + render already carry the hooks; each diagnostic is an **additive read-only overlay** toggled in the toolbar, computed from data already present, with **no change to the lane model, time model, or persisted schema**. Warnings stay host-owned (the two-tier pattern), surfaced as a side checklist + canvas glow.

- **Loop coverage** — for each of the seven canonical vertical loops (S5–S1 algedonic, S3–S1 command, S3–S1 resource bargain, **S3★–S1 audit**, S2–S1 coordination, S4–S3 homeostat, S5–S4/S3 normative): is there ≥1 meeting (by `loopCoverage` / its linked-SCT systems + scope) or a typed connection covering it? *Reads:* `loopCoverage`, resolved system, scope, `connection.loopId`. Flags any loop with **no covering organ** — never dropping the standing S3★ audit channel.
- **Cadence nesting** — is each level's rhythm faster than its parent's (R-1 faster than R0 faster than R+1)? *Reads:* `cadence.frequency` ordinal × `ctx.units.level`. Per-band "fastest/median cadence" badge + an inversion warning if a higher band runs faster than a lower one.
- **Steering gaps** — a (band × system) cell with no steering organ; a unit with operational meetings but no link up; a meeting owning a decision over contribution X whose `A` (resolved from `rasic`) is not a participant. *Reads:* sub-lane occupancy by system, `decisionRights.accountable` vs `participations`.
- **Path to S5** — a connected chain of typed connections (`flow:'escalation'` + `loopId`) from operations up to a normative/S5 organ, plus the algedonic short-circuit. *Reads:* `connections`, their `flow` types + band-crossings. Traces/animates the path and flags broken chains.

Candidate additive fields when diagnostics land — `connection.loopId?`, a read-only `ctx`-fed `diagnostics[]` overlay (host-computed, like STEP7's `warnings[]`), and a `diagnostic{class,…}`/`diagnosticAction` intent pair — **none reshape the MVP model**. No diagnostic result is ever stored; all four are pure functions over `landscape` + `ctx`; none reads view state (`horizons`).

## 8. Open questions for the PO

1. **Meeting id authority** — confirm meetings are host-canonical vessels (stable id), as `step7-ux` §4.1 assumes. Wire is identical either way (`tempId`/reconcile); only authority shifts.
2. **`participations` vs `membership` source of truth** — recommend `participations[]` (typed) is authoritative on the meeting record, `membership{}` is the derived backward-compat mirror. Confirm so the two don't drift.
3. **Cadence home** — cadence is editor-owned for MVP (a property of the rhythm on the landscape). Should it round-trip into the canonical meeting **vessel** instead (a property of the steering organ)? The `cadence` intent carries it either way; only authority shifts.
4. **Multiple placements per meeting** — may one meeting vessel have several placements (same committee at two levels / split across timeframes)? The model allows it; confirm the UX intends it or constrain to one-per-meeting.
5. **Multi-scope meetings** — single-scope per meeting for v1 (lane = `scope`). Confirm; multi-scope is additively extensible (`alsoSpans[unitId…]` + span ticks) without reshaping placement.
6. **Intra-recursion rendering** — is `laneUnitId` always a unit id (level grouping a view rollup), or may it be a level id? Tentatively always a unit id.
7. **Marker→band threshold** — confirm the occurrence-count rule (`MARKER_CAP = 12`, timeframe-relative) as authoritative, with the 14-day form-side shorthand subsumed by it; both are retunable editor constants. Is `monthly` a marker or band at each zoom, and is the override per-meeting (drafted) or a global canvas setting?
8. **Connection `loopId`** — should a connection carry the loop id it realises so loop-coverage computes without re-inferring from `flow`? (Additive: `connection.loopId?`, nothing else changes.)
9. **`setHorizon` and `change`** — is the timeframe a persisted authoring choice (debounce a `change`) or transient view state (emit only `horizon`)? Tentatively view state, persisted in the local save but not emitted.
10. **Type seed-defaults** — confirm the §4 meeting-type seed map (glass-wall: fills only empty fields, tagged "seeded", never overwrites).
11. **Backlog for T11** — confirm `ctx.backlog[].id` shape, where the backlog lives (Step VII artifact / 7.3 aspect / external tracker), whether a follow-up may *create* a backlog item (additive `backlogCreate` intent) or only link existing ones, and whether the editor gets a read-back of accepted backlog ids to mark a follow-up promoted. Promotion is an explicit human action; the host-created item must carry `source:{kind:'meeting-followup', meetingId, followUpId}` and survive the meeting's deletion (flagged detached, never silently removed).

**Hard host/step7-ux dependency to flag before build:** `aspects{}` / `vesselAspects{}` list items must carry a **stable per-item `id`** so I/O `ArtifactRef`s survive reordering; if they are currently positional, the host must add item ids (otherwise I/O falls back to the lossy `external` text escape-hatch). Secondary: the live Step VI loop list in `ctx` must use the **same loop ids** as `channel-variety-check.html` / `e2e-robustness-check.html` for cross-asset consistency; and an `on-signal` meeting with `signal.trigger:'algedonic'` should stay consistent with the vessel's `alg` flag (confirm whether the asset may *suggest* setting `alg` via intent or only reads it).

---

**Files referenced (all absolute):**
- Target asset to build: `/Users/mark/Documents/VSM7/meeting-landscape.html` (NEW standalone, bridge `window.MTL`; not inside `design-previews/step7-ux.html`).
- Reuse base (read, do not edit): `/Users/mark/Documents/VSM7/design-previews/step7-ux.html` (vessels / `membership` / `aspects` conventions, 7.6 meeting render), `/Users/mark/Documents/VSM7/e2e-robustness-check.html` (lane render, two-axis snap, ports/connections, floating inspector, call-outs to port).
- Bridge + conventions: `/Users/mark/Documents/VSM7/STEP7-REPRESENTATION-BRIEFING.md` §6 (the `window.STEP7` model this extends), `/Users/mark/Documents/VSM7/FLIGHT-ROUTE-BRIEFING.md` §8, `/Users/mark/Documents/VSM7/CHANNEL-VARIETY-BRIEFING.md`, `/Users/mark/Documents/VSM7/VSM-VISUALIZATION-BRIEFING.md` §12.9.
- Domain anchors: `/Users/mark/Documents/VSM7/AGENTS.md` (SCT Canonical Backbone, the seven Step VI loops + S3★ rule, Step I recursion, E2E finding→backlog pattern, VSM colour grammar, no-completeness-percentages, confirm-before-destroy, preserve-viewport).
