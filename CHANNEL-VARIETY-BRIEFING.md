# Channel Variety Checks — integration briefing (`channel-variety-check.html`)

Authoritative contract for the standalone **Communication Variety Checks** asset — the redesigned **Step VI substep 2**. Owned by Claude (front-end). Embeds in the VSM7 host via iframe + `postMessage`, runs 100% standalone with no parent frame. Built 2026-06-20; verified live + 4 Playwright specs (`asset-tests/channel-variety-check.spec.js`).

## 1. What it is
Rate each VSM loop's communication channel against four channel criteria — **capacity** (≈ requisite variety / Ashby), **clarity** (≈ transduction), **synchronicity** (≈ timeliness), **feedback** (≈ closed loop — does a response come back?). The editor renders a click-to-cycle RAG matrix (each criterion header has a hover tooltip explaining what it assesses), a live channel-robustness radar, a weakest-link readout (viability is capped by the most fragile channel), and a per-loop detail (communication/artifact/role + observation). System chips use the canonical VSM7 colours from `vsm.html` (`--s2/--s3/--s4/--s5`). It also has the full-screen control (button + `F`) shared by all three assets, and a **live VSM** above the radar — it **embeds the real `vsm.html`** (iframe, `?pane=hidden&chrome=min`) and drives it over `vsm.html`'s `window.VSM` bridge so selecting a loop **lights up that loop's channel in the actual Pfiffner diagram** (one consistent VSM across Step V and here). Purely visual on the channel-variety side — it adds no `window.CVC` command or model field; the only cross-asset dependency is `vsm.html`'s additive `highlight` command (see `VSM-VISUALIZATION-BRIEFING.md §12.9`).

## 2. MECE lanes
- **Claude (this file):** the visualisation + interaction + the `window.CVC` bridge. Mine to change.
- **Codex (host):** embedding, persistence, the per-SIF loop list, reconciliation, reports/backlog, and the outcome download (unless you ask me to add the in-editor export — see §7).
- Do not edit each other's files.

## 3. Model
```js
{
  meta: { sct?: string, sifName?: string },          // display only
  loops: [
    { id: string,                                     // STABLE host id
      sys: 'S2'|'S3'|'S3*'|'S4'|'S5'|string,          // system colour chip; a '/'-separated list (e.g. 'S4/S3') renders one chip per system — use it for the bilateral S3–S4 homeostat
      label: string,                                  // e.g. "S3*–S1 real-life information"
      communication: string,                          // free text — "Communication & Meetings" (how the loop is run)
      artifact: string,                               // free text — "Artifact" (shared dashboard, RACI, backlog…)
      role: string,                                   // free text — "Role" (who runs/owns the channel)
      ratings: [cap, clarity, syn, feedback],         // positional; each 0=unrated, 1=weak, 2=caution, 3=pass
      note: string,                                   // free-text observation
      vsmChannel?: string }                           // which vsm.html channel this loop lights up — see "Embedded VSM" below
  ]
}
```
The **four criteria are fixed** (capacity, clarity, synchronicity, feedback — in that order). The radar, overall score, and weakest-link are computed **in-editor** from `ratings`; the host only stores the ratings/notes. `localStorage` key `cvcChecks1` (standalone autosave).

## 4. Bridge contract (mirrors `vsm.html` §12.9 / `e2e-robustness-check.html`)
Standalone-safe: with no parent frame and no `window.CVC.onEmit`, the bridge is inert. Host should wait for `{evt:'ready'}` before sending commands (the listener is attached before `ready`, so earlier commands are tolerated).

**HOST → frame** (`iframe.contentWindow.postMessage(msg, '*')`, or call `window.CVC.<fn>` when inlined):
| `msg.cmd` | payload | effect |
|---|---|---|
| `loadModel` | `{ cmd:'loadModel', model }` | replace the whole model (restore saved ratings/notes for this SIF) |
| `setLoops` | `{ cmd:'setLoops', loops:[{id,sys,label}] }` | set the loops to check for this SIF (stable host ids). **Existing ratings/notes are preserved by id** across a re-feed; new ids start unrated; dropped ids are removed |
| `setMeta` | `{ cmd:'setMeta', meta:{sct?,sifName?} }` | display metadata only |
| `select` | `{ cmd:'select', id }` | select a loop by id (`null` clears) |
| `fullscreen` | `{ cmd:'fullscreen', on? }` | `true` enter / `false` exit / omit toggle. **Exit always works; entering needs a user gesture** (a postMessage has none → the reliable enter is the button / `F` key). **⚠ the host `<iframe>` MUST carry `allow="fullscreen"`** or the browser blocks it |
| `export` | `{ cmd:'export', format, requestId, filename? }` | `format='png'\|'svg'`. Renders the **outcome** (matrix + radar + weakest-link + robustness score) off-screen and replies with `exportReady` (or `exportError`) carrying the **same `requestId`**. Pure read — doesn't touch state/selection. The host owns the actual download; the in-editor download button is hidden when embedded |

**frame → HOST** (posted to `window.parent` with `'*'`; also delivered to `window.CVC.onEmit(msg)` when inlined). Host should verify `event.origin`/`event.source`:
| `msg.evt` | payload |
|---|---|
| `ready` | `{ evt:'ready', api:1 }` — once, after the first render |
| `change` | `{ evt:'change', model }` — **debounced; authoritative.** The full ratings/notes to persist |
| `select` | `{ evt:'select', ref:{id,label} \| null }` |
| `fullscreenchange` | `{ evt:'fullscreenchange', fullscreen:boolean }` |
| `exportReady` | `{ evt:'exportReady', requestId, format, filename, mimeType, blob }` — `blob` is a structured-clone-safe `Blob` (`image/png` or `image/svg+xml`); `requestId` echoes the request |
| `exportError` | `{ evt:'exportError', requestId, format, message }` |

**Inline mirror:** `window.CVC = { loadModel, setLoops, setMeta, select, fullscreen, isFullscreen, export, onEmit, getState }` (`window.CVC.export({format, requestId, filename?})`). `getState()` → a deep clone of the model.

No new event is needed beyond `change` — it is the single source of truth for persistence.

## 5. Host responsibilities (checklist)
1. **Embed** the iframe with **`allow="fullscreen"`**, a definite height (it fills `100%`), and **`?vsm=<url-to-vsm.html>`** so the live-VSM panel resolves (without it the panel 404s — see §5a).
2. **On mount / SIF change:** send `setLoops` with that SIF's loops — `id` (stable), `sys`, `label`, and **`vsmChannel`** (the token that lights the loop's channel in the embedded VSM — see §5a). If you hold prior state, send `loadModel` with the saved model (or let standalone autosave carry it). **Re-feed on every (re)mount** — loops are passed each session; ratings/notes/detail live in the model (persisted by you via `change`, or in `localStorage` standalone).
3. **Persist** `change{model}` (debounced ~120 ms) — the authoritative record. Per loop it carries `ratings`, `note`, and the three free-text detail fields **`communication`, `artifact`, `role`** (these **replaced** the old single `channels` field — migrate any stored `channels` → `communication`). All are preserved across `setLoops` re-feeds by `id`. Reference findings/backlog items back to `{loopId, criterionIndex}` if you spin weak cells into actions.
4. Use `sys` values `'S2' | 'S3' | 'S3*' | 'S4' | 'S5'` so the chips get the right VSM colour (unknown → neutral grey); pass **`'S4/S3'`** for the bilateral S3–S4 homeostat → one chip per system.
5. The four criteria are fixed — don't try to configure them.

## 5a. Embedded VSM (the "viable system" panel)
The editor shows a live VSM by **embedding `vsm.html` in a nested iframe** and lighting up the selected loop's channel. Two things the host must provide:
1. **Tell the editor where `vsm.html` is** — embed `channel-variety-check.html` with **`?vsm=<url-to-vsm.html>`** (absolute path or full URL; the editor appends `pane=hidden&chrome=min` itself). The default is the sibling `vsm` (extensionless), which only resolves on the dev server — **if it isn't set, the panel shows a 404.** `vsm.html` must be served and reachable from the editor's context.
2. **Tell the editor which channel each loop maps to** — set **`vsmChannel`** on each loop in `setLoops`/`loadModel`. Tokens: `f` (S2 coordination), `e` (command), `d` (resource bargain), `b` (S3\* audit), `g` (algedonic), `s4env` (S4↔environment), `h34` (S3–S4 homeostat), `h5` (S5→S4/S3 normative). Loops without `vsmChannel` simply don't highlight (graceful). The standalone default loops already carry these.

This is the only contract addition for the VSM panel: an **optional `vsmChannel`** field on the loop model + the **`?vsm`** embed param. Everything else (`vsm.html`'s `highlight` command, `?chrome=min`) is documented in `VSM-VISUALIZATION-BRIEFING.md §12.9` and is additive there.

## 6. Standalone & URL
Opening `channel-variety-check.html` directly shows a prefilled 8-loop demo (the canonical VSM loops, incl. S3\* audit and S5–S1 algedonic). Standalone autosaves to `localStorage`. No URL params required.

## 7. Open items / decisions for Codex
- **Outcome download — DONE (2026-06-20).** Per Codex's call, the editor now renders the outcome (matrix + radar + weakest-link + robustness score) to PNG/SVG. Codex orchestrates the download: send `{cmd:'export', format, requestId}` and handle the returned `exportReady{blob, filename, mimeType}` (or `exportError`). The in-editor download button is the standalone affordance and is hidden when embedded.
- **Per-SIF loop list (Codex's open question).** Recommended: **retain the canonical loop set; instantiate it per SIF rather than derive-by-filtering.** Beer's vertical channels are invariant at every recursion level, and a *missing* channel is exactly the finding the check must surface — so don't drop channels the SIF hasn't modelled. VSM7 should bind each canonical loop to the SIF's real systems/units (real ids/labels, optionally prefilled `communication`/`artifact`/`role`), optionally append SIF-specific extras, and feed via `setLoops`. (The current 8 are the vertical channels; `vsm.html` also models the horizontal S1↔S1 channels `a` env-overlaps / `c` operational-dependencies — add as extra loops if you want full parity with the diagram.) Final call is the PO's.
- **Diagram-overlay (the marquee follow-up).** Project these ratings onto the Step-V `vsm.html` channels (colour them green/amber/red). Highest payoff but needs the ratings to flow into `vsm.html` too — a small cross-asset contract I'd add when you're ready.

## 8. Status
Prototype, **verified live + 5 Playwright specs** (matrix/radar render, cell-cycle recompute, `window.CVC` bridge round-trip, full-screen, PNG/SVG export). Awaiting Codex integration. Same lane discipline as `vsm.html` and `e2e-robustness-check.html`.

## 9. Changelog since the contract (2026-06-20)
Refinements since this contract was first handed over — **the bridge is stable; everything below is additive, semantic, or purely visual, and nothing breaks.** **Contract-relevant (additive/backward-compatible):** (1) **`sys` accepts a `/`-separated list** (e.g. `'S4/S3'`) → one coloured chip per system; send it for the bilateral **S3–S4 homeostat** (single-system loops unchanged). (2) **The single `channels` free-text field was split into three** per-loop fields — **`communication`** ("Communication & Meetings"), **`artifact`** ("Artifact"), **`role`** ("Role") — under the guiding question "How are you running and changing this loop?". This **replaces** `channels` (removed). **Host action:** persist `communication`/`artifact`/`role` instead of `channels`; all three ride in `change{model}` and are preserved across `setLoops` re-feeds exactly like ratings/notes. (3) **Export is now implemented** (the option Codex chose): `{cmd:'export'}` → `exportReady`/`exportError`; the host orchestrates the download (in-editor button hidden when embedded). The exported SVG/PNG also renders a **per-loop detail** section (communication/artifact/role + observation; loops with content only) below the matrix/radar — height auto-extends. (4) **Two criteria renamed** (labels + one meaning): *Intelligibility* → **Clarity** (same concept, transduction), and *Security* → **Feedback** with a **changed definition** — it now rates *does a response come back and close the loop?* (was channel integrity). Ratings stay **positional** `[capacity, clarity, synchronicity, feedback]` → **no data migration**; just update any report text that echoes the old names and note criterion #4's new meaning. Each criterion header also gained a hover tooltip. **Front-end only (zero contract impact):** VSM-matched system colours; the loop-detail panel moved below the matrix; the **live VSM above the radar** (embeds the real `vsm.html`); **per-loop VSM views** — selecting a loop now reveals only that loop's own systems + channel and dims the rest (the three metasystem loops — S4↔env, S3–S4, S5-normative — also hide the S1 units), driven entirely by `vsmChannel` + an in-editor map and `vsm.html`'s additive highlight tokens; and a **toggle** — clicking the already-selected loop returns the VSM to the default view. None of these add a `window.CVC` command, event, or model field. Net host action delta: send `sys:'S4/S3'` for the homeostat loop; **persist `communication`/`artifact`/`role` (replacing `channels`)**. **Cross-asset note:** the embed relies on `vsm.html`'s additive `highlight` command + `?chrome=min` param (in `VSM-VISUALIZATION-BRIEFING.md §12.9`) — no impact on the `window.CVC` contract.
