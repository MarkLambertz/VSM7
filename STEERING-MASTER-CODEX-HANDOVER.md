# Steering Master → Codex handover

*2026-07-29 · Claude. Subject: wiring the new `#/vsm` increment (“Steering Master”) into the host.
Claude-owned preview is **built, PO-reviewed and committed**; this document is the host slice.*

---

## 1 · What this is

`#/vsm` becomes the **Steering Master** — an overview of the organization’s *steering elements*: per system
(S5 · S4 · S3 · S3\* · S2) the success-critical tasks, the steering meetings, the instruments, the
accountability and the channel health. It is the third of the PO’s three lenses:

| Lens | Where | Dimension |
|---|---|---|
| Hierarchy (formal/legal accountability) | 7.7 org chart | structure org |
| Work organization (process) | Step VI E2E routes | process org |
| **Steering (control org)** | **`#/vsm` Steering Master** | **control org ← this** |

**It is read-mostly and owns no data.** Everything shown is aggregated from Steps I/III/V/VI/VII. Nothing
is stored, nothing is authored here; every chip deep-links back to the step that owns it.

## 2 · Status

- **Preview (Claude lane, done):** `design-previews/steering-master.html` — 12 commits, `116eb4c` … `5f4ba60`.
- **Vendored (Claude lane):** `design-previews/vendor/three.module.min.js` + `design-previews/vendor/jsm/**`
  (three.js r160 + postprocessing for ambient occlusion, MIT). **Local on purpose — no CDN**, so the app
  stays offline-shareable in workshop rooms. ~710 KB total, loaded only when the 3D view is opened.
- **Not done (Codex):** the host view-model + the `#/vsm` page embedding. **No host file has been touched.**
- Open on the Claude side afterwards: asset-tests for the preview (I’ll add once the vm shape is settled).

## 3 · What the page does (so the vm makes sense)

- **Bands** in the method’s own order: S5 Normative Guidelines · S4 Outside & Then · S3 Inside & Now ·
  **S3\* Auditing & Real-Life Information as its own lane** (never folded into S3) · S2 Coordination
  Functions, plus a toggleable S1 context strip.
- **The shared VSM diagram is reused as a library** — `vsm.html` embedded and driven through its documented
  api:1 (`loadTree` · `select` · `highlight` · `setChannels`), listening to `elementClick`. **Nothing is
  redrawn.** Band ↔ diagram selection syncs both ways. A **2D/3D toggle** offers a Three.js reading of the
  same model; 2D is the default.
- **Honesty spine, all computed:** unsteered SCTs (mapped to a system but covered by no meeting — the
  method’s Step V trap), meetings steering nothing (“systematic garbage collection”), empty seats, missing
  accountables, weak loops. **No completeness percentages, ever.**

## 4 · The host slice — one aggregated view-model

Compose it from getters that already exist; **no new storage, no new canonical data.**

```js
// suggested: src/application/steeringMasterViewModel.js
export function getSteeringMasterViewModel(workspace) {
  return { context: {...}, model: {...} };
}
```

### 4.1 `context` → sent as `{cmd:'setContext', ...}`

| Field | Type | Source |
|---|---|---|
| `sif` | string | `workspace.sif.name` (SIF display name) |
| `level` | string | `'R0'` |
| `units` | string[] | **Step I operative units** — `workspace.step1.operativeUnits.map(u => u.name)`. These are the S1 row in the diagram and the S1 context strip. |

### 4.2 `model` → sent as `{cmd:'setModel', model:{...}}`

**`scts`** — one entry per SCT that Step V mapped to a system:
```js
{ id: 'sct-uuid', did: 'SCT-007', name: 'Allocate budget & capacity',
  sys: 'S5'|'S4'|'S3'|'S3*'|'S2', state: 'accepted'|'candidate' }
```
- `did` = the readable id (`formatSctNumber`), never a UUID in the UI.
- `sys` = the **Step V assignment of the R0/SIF contribution** (`getStep5AssignedSystem`). An SCT whose
  contributions map to several systems may legitimately appear once per system — send one entry per
  (sct, system) pair with a stable `id` per pair if that happens.
- SCTs with no Step V system are simply omitted (the page shows the seat as empty, honestly).

**`organs`** — the steering meetings from 7.6 (the UI labels them *Steering meetings*):
```js
{ id: 'mtg-uuid', name: 'Operations Review', sys: 'S3',
  cad: 'Weekly', people: 11, covers: ['sct-uuid', ...], alg: false }
```
- `sys` — which system the meeting serves. If 7.6 does not yet carry a system tag, derive it from the
  systems of the SCTs it covers, and send `null` when genuinely unknown (the page will show it honestly).
- `covers` — the SCT ids this meeting steers. **This is the load-bearing field**: an SCT covered by no
  meeting is flagged “unsteered”, and a meeting covering nothing becomes a garbage-collection candidate.
  If 7.6 has no explicit link yet, derive from the meeting’s agenda/SCT references and say so — do not
  invent coverage.
- `alg: true` marks an algedonic line (exempt from the garbage-collection check by design).

**`aspects`** — 7.3 instruments, keyed by SCT id:
```js
{ 'sct-uuid': { kpis: [...], artifacts: [...], tools: [...] } }
```
Straight from `workspace.step7.aspects` (now the canonical store shared with Step III).

**`accountable`** — the RASIC **A**-holder per SCT, keyed by SCT id:
```js
{ 'sct-uuid': 'CFO' | null }
```
Resolve from `workspace.step7.rasic` (letter `A`) → vessel name. `null` where no accountable exists — the
page renders that as an open gap, which is the point.

**`loops`** — the canonical vertical loops from **6.2**, in 6.2’s own shape:
```js
{ id: 'l-s3star', sys: ['S3*'], name: 'S3*–S1 real-life information',
  ratings: [3,2,1,3], note: '...', ch: 'b' }
```
- `ratings` = the four fixed criteria **[capacity, clarity, synchronicity, closure]**, `0` = unrated.
  The page derives the verdict as the **weakest link, never an average**.
- `ch` = the `vsmChannel` token 6.2 already stores (`f e d b g s4env h34 h5`) — the page uses it to light
  that channel in the shared diagram. Please pass it through unchanged.
- `sys` = which bands the loop belongs to (a homeostat lists both).

## 5 · Bridge protocol (`window.SMASTER`, api:1)

Same iframe + postMessage pattern as org-chart / step7-ux.

**Down (host → page)** — `setContext {sif,level,units}` · `setModel {model}` · `select {system}` ·
`setLens {lens,on}` (keys: `instruments` · `accountability` · `channels`) · `skin {skin:'deck'|'workshop'}` ·
`fullscreen {on}`
**Up (page → host)** — `ready {}` · `select {system}` · `view {view:'2d'|'3d'}` · `requestExportPanel {}` ·
`fullscreenchange {fullscreen}`

`window.SMASTER.getState()` returns `{sif, selected, lens, systems[], headline}` for tests —
`headline` is `{orphans, gc, seats, redLoops, noAcc}`, i.e. the honesty spine as five integers.

Embed as: `design-previews/steering-master.html?host=vsm7&v=<cache-label>` (the `host` param collapses the
preview’s own topbar, exactly like the other embedded assets). Feed `setContext` + `setModel` on `ready`
and after every workspace change.

## 6 · Constraints

1. **Do not redraw the VSM diagram.** The page embeds `vsm.html`; it may point the embed elsewhere with
   `?vsm=<url>` if the host prefers a different path.
2. **No new storage.** If a field above has no canonical source yet, send `null`/omit rather than
   inventing one — the page is built to show honest gaps.
3. **R0/SIF default**, S3\* stays a distinct lane, no completeness percentages — the standing rules.
4. **Cache label** — yours to bump; the preview and the vendored three.js need to reach Safari.
5. `requestExportPanel` should open the existing shared export panel; a future `vsm/steering-master`
   export target is the natural home for the “board slide” of the steering system (not required now).

## 7 · Verification

- Host: the vm composes for a workshop at **any** maturity — Steps I–III only (bands render as skeletons),
  Step V mapped, 7.6 present, 7.2/7.3/6.2 present. No crash on empty.
- Live: open `#/vsm` on *Transformation 2026* → bands populate, the diagram shows S1→S5, clicking a system
  focuses its band and vice versa, Steering Stats counts match the steps.
- Claude will re-run the asset suite and add specs for the preview once the vm lands. Ping me and I’ll
  live-verify the embedded page end-to-end.

---

*Ownership unchanged: Claude owns `design-previews/**`, `asset-tests/**` and the standalone assets;
Codex owns `src/**`, `tests/**`, `index.html`, `start.command` and cache labels.*
