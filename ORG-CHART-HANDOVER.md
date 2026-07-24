# Handover to Codex — Step VII 7.7 "Organizational Representation" (org-chart.html)

**From:** Claude (front-end / standalone assets)  **To:** Codex (VSM7 host)  **Date:** 2026-07-01
**Status:** Asset BUILT + verified (live, both skins, 0 console errors) + 17 asset-tests green; wired into the `step7-ux` preview as a working reference integration. **No host files were touched.** This document specifies the contract; it does **not** ask you to accept any code into Codex-owned files without your review.

---

## 1. What was built

**Purpose.** The org chart is the capstone leadership/layperson artifact of Step VII: one picture that reads like a familiar org chart on the surface and reveals the viable-system truth (recursion, the metasystem, S3★, accountability) as the user reaches for it — *and can never be circulated with its accountability truth stripped out*. Concept = **"The Nested Estate"** (progressive disclosure IS the architecture; honesty is never opt-out).

**Feature surface.** Three layout modes — **Levels** (default, familiar), **Nested** (containment), **Cabinet** (Beer/Pfiffner cell grammar with the independent S3★ audit seat + channel isolation) — plus recursion unfold, an always-present accountability **headline** and node **badges**, a Plain⇄Expert language toggle, overlays (colour / accountability / gaps / meetings / algedonic / candidate-state), a coach tour, a warning stepper, and SVG/PNG export with an honesty watermark.

**Files I created / changed (all Claude-owned):**

| File | Change | Kind |
|---|---|---|
| `org-chart.html` | **NEW** — the asset | Standalone **and** embeddable |
| `asset-tests/org-chart.spec.js` | **NEW** — 17 Playwright specs | Test |
| `asset-tests/step7-ux.spec.js` | +1 cross-frame integration test | Test |
| `design-previews/step7-ux.html` | `viewOrg()` now iframe-embeds `org-chart.html`; added host-side feed + `requestFix` apply | Reference integration (my preview file) |
| `meeting-landscape.html` | (separate, earlier) form labels de-Germanized to English | — |
| `ORG-CHART-HANDOVER.md`, memory, `STEP7-REPRESENTATION-BRIEFING.md` | docs | — |

**Standalone or embedded?** **Both.** `org-chart.html` runs on its own with a built-in realistic sample model (so it demos and tests without a host), and it runs embedded — when it detects a parent frame it applies host data silently and defers export to the host. The `step7-ux` preview is a *reference* host so you can see the exact wiring; your production integration replaces that.

---

## 2. Ownership boundary

**Claude-owned (I maintain; Codex please do not edit):**
- `org-chart.html`, `meeting-landscape.html`, `vsm.html`, `e2e-robustness-check.html`, `channel-variety-check.html`
- `design-previews/**` (incl. `step7-ux.html`)
- `asset-tests/**`
- The briefing/handover `*.md` files (`ORG-CHART-HANDOVER.md`, `STEP7-REPRESENTATION-BRIEFING.md`, `MEETING-LANDSCAPE-BRIEFING.md`, etc.)

**Codex-owned (I will not edit without explicit agreement):**
- `src/**`, `index.html`, `tests/**`, `AGENTS.md`, `README.md`
- Persistence, the canonical domain model, exports/reports, and all host-side integration logic

**Files Codex must integrate *from the host side* (no edits to my files needed):**
- Host code that (a) mounts `org-chart.html`, (b) feeds it the canonical model over the bridge, (c) applies its `requestFix` proposals to the RASIC store, and (d) optionally persists its presentation state and orchestrates export. All of this is host code calling the documented `postMessage` contract — you never modify `org-chart.html`.

---

## 3. Bridge / API contract — `window.ORG`

House pattern, identical in spirit to `window.MTL` (meetings) and `window.STEP7`. The asset talks to the host **two ways, kept in sync**: a JS global `window.ORG` (when same-window) **and** `postMessage` (when embedded in an iframe — the production path). Prefer `postMessage` for production so it works cross-origin. `TARGET='*'` on the asset side — **the host must verify `event.origin`.**

### 3.1 Required initialization sequence
1. Host mounts the asset (iframe `src="…/org-chart.html"`, `allow="fullscreen"`).
2. Asset loads, renders its sample model, and emits **`ready`** → `{ evt:'ready', api:1 }`.
3. **On `ready`,** host posts **`setContext`** (host truth) then **`loadModel`** (authoring layer). Both are applied **silently** (no echo).
4. Asset re-renders from host data. Steady state begins.
5. Thereafter the host may send commands at any time; the asset emits intent events.

> The asset also self-recovers: any command re-renders, and `setContext`/`loadModel` reconcile navigation (drop selection/drill-down pointing at removed ids). Sending `setContext`+`loadModel` again at any time is always safe and idempotent.

### 3.2 Host → asset commands (`postMessage({cmd, …})`)

| `cmd` | Payload | Effect | Silent? |
|---|---|---|---|
| `setContext` | `{ units, vessels, contribs, scts, rasic, sifName, warnings? }` (any subset) | Replace recognized arrays/map + SIF label; reconcile nav; re-render | **yes** |
| `loadModel` | `{ model: { units, vessels, contribs, rasic, scts, warnings? } }` | Replace the full model; reconcile nav; re-render | **yes** |

> **`warnings` (optional, additive — implemented 2026-07-01).** If present, the chart renders host warnings **verbatim** and skips all local computation (host = single source of truth); if absent, it falls back to the parity predicate. Shape: `warnings: { [contribId]: [ { code, severity(1..4), loud?, message, vesselId?, homeUnitId? } ] }`, `code ∈ no-accountable | double-accountable | responsible-no-accountable | accountable-out-of-scope | accountable-no-support | candidate-accountable` (unknown codes render generically by severity). `message` is shown verbatim in the inspector. Send `warnings: null` to return to the fallback.
| `select` | `{ id }` | Select a unit/vessel/contribution by stable id | yes |
| `setMode` | `{ mode: 'levels'\|'nested'\|'cabinet' }` | Switch layout (Cabinet forces VSM colour on) | yes |
| `setOverlay` | `{ id, on }` — id ∈ `colour\|acct\|gaps\|meetings\|alg\|state` | Toggle an overlay | yes |
| `setLang` | `{ lang: 'plain'\|'vsm' }` | Plain⇄Expert labels | yes |
| `skin` | `{ skin: 'workshop'\|'deck' }` | Token-only skin | yes |
| `focus` | `{ on }` | Facilitation focus tiles | yes |
| `fullscreen` | `{ on }` | Real browser fullscreen (needs iframe `allow="fullscreen"`) | yes |
| `export` | `{ format, preset, requestId }` | Standalone: renders + downloads. Embedded: replies `exportError` (defers to host) | — |

### 3.3 Asset → host events (`postMessage({evt, …})`, also delivered to an optional `window.ORG.onEmit` hook)

| `evt` | Payload | When | Host action |
|---|---|---|---|
| `ready` | `{ api:1 }` | Once, after first render | Send `setContext` + `loadModel` |
| `select` | `{ kind:'vessel'\|'unit', id }` | User clicks a node | Optional: mirror selection elsewhere |
| `mode` | `{ mode, depth }` | Layout switch / recursion depth change | Optional: persist view |
| `overlay` | `{ id, on }` | Overlay toggled | Optional: persist view |
| `unfold` | `{ unitId, depth }` | Recursion descend/surface | Optional: persist view |
| **`requestFix`** | `{ contribId, vesselId, letter:'A' }` | User proposes an accountability fix | **Required for the fix loop:** validate + apply to the RASIC store, then push a fresh model back via `loadModel`/`setContext`. The asset **never mutates canonical data itself.** |
| `acknowledgeException` | `{ contribId, note }` | User marks a warning a deliberate exception | Record the decision (audit trail) |
| `exportError` | `{ requestId, message }` | Export was host-deferred (embedded), or failed | Orchestrate a host-side render, or ignore if you let the asset download directly |
| `fullscreenchange` | `{ fullscreen }` | Fullscreen entered/exited | Optional |

**Optional / dormant:** a `change` event (`{ evt:'change', model }`, debounced ~120 ms) is defined for house-consistency but **is not currently emitted** — the org chart is a pure *view + proposer* and authors no canonical data. All model mutation flows through `requestFix` → host → `loadModel`. If a future version lets the chart author presentation-only metadata you want persisted, it will arrive via `change`; until then you can ignore it.

### 3.4 `window.ORG.getState()` (read-only snapshot)
`{ ctx:{ sif, units, scts }, model:{ units, vessels, contribs, rasic, scts }, ui:{ mode, lang, overlays, selected, depth, skin } }`

---

## 4. Data expectations

The asset consumes the **same canonical shapes `step7-ux` already uses** (identical ids), so if you already feed those to the RASIC editor there is **no mapping**:

- **`UNITS`**: `{ id, name, level:'R+1'|'R0'|'R-1', sif?:bool, parent?:unitId }` — recursion tree. The R0 unit (or `sif:true`) is the System-in-Focus; `parent` chains give recursion. **The asset resolves the SIF and parent generically — no id is hardcoded**, so your own ids work.
- **`SCTS`**: `{ id, did:'SCT-001', name, sys, prio }`
- **`CONTRIBS`** (SCT contribution = SCT × unit, with the Step IV accountable unit): `{ id, sct:sctId, unit:unitId, sys, accUnit:unitId, text }`
- **`VESSELS`** (system-agnostic; a meeting **is** a vessel): `{ id, type:'role'|'function'|'meeting', name, purpose, scope:unitId, prov, state:'candidate'|'accepted', sys, alg?:bool }`
- **`RASIC`**: a flat map keyed **`"contribId|vesselId" → 'R'|'A'|'S'|'I'|'C'`**

**Ids that must be stable** (the asset references by id, never by name; badges/selection/drill-down/`requestFix` all key off these): `unit.id`, `sct.id`, `contrib.id`, `vessel.id`, and the composite `contribId|vesselId` RASIC key. Renames of `name`/`did` are safe; id changes break references.

**Display-only fields** (resolved live, never used as keys): `name`, `purpose`, `prov`, `text`, `did`, `sifName`, `sys` labels. `sys` also drives colour/geometry but is not an identity.

**Must be persisted by Codex** (canonical — the asset persists none of it): `UNITS, VESSELS, CONTRIBS, SCTS, RASIC`, and specifically **any RASIC change produced by a `requestFix`**. The asset's own `localStorage['orgChart1']` holds **presentation metadata only** (mode, lang, overlays, caption, tour-seen) and is disposable — persist it only if you want the *view* to survive reloads (read `getState().ui`).

**Migration / back-compat notes:**
- The asset degrades gracefully on partial/empty payloads: missing `name` → clipped-safe; empty `UNITS` (or no R0) → a designed empty state that **refuses to invent structure** (it will not draw a fabricated SIF). So a host that feeds units-before-vessels shows labelled-but-empty seats, not a crash.
- No versioned payload envelope is required today; the shapes above are v1. If you add fields, the asset ignores unknown fields. If you rename an id field, that is a breaking change and needs a coordinated bump.

---

## 5. Integration tasks for Codex

1. **Placement.** Mount `org-chart.html` as Step VII substep **7.7 "Organizational Representation"** — an iframe in the 7.7 pane (or a served route). Give the iframe `allow="fullscreen"`. If you sandbox it, include `allow-scripts` and (if the asset should download exports directly) `allow-downloads`; use `postMessage` (not `contentWindow` access) so origin isolation is fine. A working reference is `design-previews/step7-ux.html` → `viewOrg()`.
2. **Feed the model.** On the asset's `ready`, post `setContext` (units/scts/contribs/vessels/rasic/sifName) then `loadModel`. Re-feed whenever the canonical model changes host-side.
3. **Close the accountability loop (the one required behavior).** Handle `requestFix{contribId,vesselId,letter}`: apply it to the RASIC store under your rules (this is the same decision surface as 7.2), then re-feed. The chart's headline/badges then update and the gap visibly closes. Handle `acknowledgeException` as a recorded decision.
4. **Persist.** The canonical model (you already own this). Optionally persist the asset's `ui` view state.
5. **Export / report.** Decide one of two: **(a)** let the asset download directly (SVG/PNG, honesty watermark + gap count already baked into the file and filename) — simplest; or **(b)** host-orchestrate export: on the asset's `exportError` reply, render a higher-res/A1 version host-side. **If you render host-side, preserve the honesty invariants**: never omit S3★ or the warning layer without watermarking, and never add a completeness percentage (house rule).
6. **Warning-rule parity (important).** The chart computes its headline and badges from `CONTRIBS × RASIC × VESSELS` using the **exact `warnings()` predicate copied verbatim from `step7-ux.html`** (double-A, no-A, R-without-A, A-out-of-scope, A-without-support, candidate-A). As long as the host's canonical warning rules match that predicate, the chart and 7.2 grid agree by construction. **If the host owns diverging warning rules, we must reconcile** — ideally by the host exposing the authoritative warning set so the chart consumes it rather than recomputing. Flag this early if your rules differ.
7. **Test (host-side).** The `ready → setContext/loadModel` silent feed; the `requestFix` round-trip (apply → re-feed → headline decrements); origin verification on inbound messages; and that your canonical warning output matches the asset's for the shared sample. My side already covers the embed + round-trip in `asset-tests/step7-ux.spec.js`, and the asset's own honesty/mode/export behavior in `asset-tests/org-chart.spec.js`.

---

## 6. Open questions & risks

- **Warning-rule ownership (highest).** The chart currently recomputes warnings locally from the fed model. This is safe only while the host's rules equal `step7-ux`'s `warnings()`. **Decision needed:** keep them identical, or have the host push an authoritative warning set for the chart to render. A silent divergence would make the capstone disagree with 7.2 — the worst failure mode.
- **requestFix policy.** The asset proposes `letter:'A'` for a missing accountable. The host decides whether to accept, reject, or route it (and whether applying it may create a new soft flag — e.g. a candidate becoming accountable legitimately raises "candidate/thin" counts, which the chart shows honestly). Confirm the host applies-and-refeeds rather than silently dropping proposals.
- **Export ownership.** Standalone export works now (token-free, foreignObject-free SVG → 2× PNG, watermark + gap-count filename). Embedded, the asset defers via `exportError`. **Decision needed:** allow direct download from the embed, or host-orchestrate. If host-orchestrated, A1/PDF poster output is a host job (deferred on my side).
- **Recursion depth.** The chart unfolds **one** level and shows a dignified "not yet unfolded" scaffold when a unit has no `parent`-linked children. Real multi-level recursion needs the host to supply nested `UNITS` (parent chains). Multi-level unfold is a deferred front-end enhancement.
- **Meetings overlay.** Shows meeting-type vessels as organ chips and (by design) **links out to `meeting-landscape.html`** rather than embedding its cadence truth. Live meeting cadence inside the org chart is a future data feed, not built.
- **UX assumptions.** (a) `sys` values are the canonical `S1/S2/S3/S3*/S4/S5` set; an unexpected `sys` renders a neutral/unclassified state rather than a wrong line. (b) One R0 SIF per mounted instance (drill-down re-roots the focus, it does not change the SIF). (c) Colour is **off** by default (layperson-safe); Cabinet forces it on.
- **Front-end changes I still anticipate (pending your/Mark's call, not blocking):**
  - `?chrome=min` to hide the asset's own topbar for a cleaner embed (today the embed shows the asset's toolbar inside the pane — functional but a second bar). Would relocate the mode switcher into the sub-toolbar.
  - An optional "always download locally even when embedded" flag, if you choose not to host-orchestrate export.
  - Animated Levels↔Nested morph (currently a crossfade/hard switch) and live meeting data — both deferred v2.

**Sibling assets for context (their own contracts, same house pattern):** meetings 7.6 → `meeting-landscape.html` / `window.MTL` (see `MEETING-LANDSCAPE-BRIEFING.md`); the Step VII overview and asset-split rationale in `STEP7-REPRESENTATION-BRIEFING.md`. This handover covers 7.7 specifically.
