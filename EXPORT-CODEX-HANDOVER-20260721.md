# Handover → Codex · Export Panel Phase 0 (`window.EXPORT api:1`)

## 1 · Status

`design-previews/export-panel.html` is no longer a mockup — it is the real embeddable singleton speaking `window.EXPORT (api:1)`. It renders **purely** from a host-supplied view-model and never touches canonical state. An adversarial review found four conformance gaps; **all four are fixed** (see §11). **11 bridge specs green** in `asset-tests/export-panel.spec.js`; **146 total** across the asset-tests suite. Ready to integrate. Boundaries hold: Codex won't edit `export-panel.html`; Claude won't reach into `src/`.

## 2 · The exact bridge

Two transports, **identical effect**: postMessage a `{cmd,…}` object at the iframe, **or** call the mirror method on `iframe.contentWindow.EXPORT` (it forwards into the same handler). Every outbound message carries `api:1`.

**HOST → panel** (`cmd` in):

| cmd | payload | effect |
|---|---|---|
| `setViewModel` | `{stepId,tileId,vm}` | cache a normalized vm at key `stepId/tileId` (`tileId:null`→`*`). Auto-opens **only** if a prior `open(stepId,tileId)` for the same key left a pending request; otherwise caches silently |
| `open` | `{stepId,tileId,scope?,origin?}` | open for a target; renders immediately if cached, else shows a skeleton and emits `needViewModel` |
| `setBundle` | `{bundle:[{stepId,tileId,scope,label?}]}` | set the app-bundle manifest; drives the bundle checklist + emitted `target.bundle` (re-renders live if a bundle vm is open) |
| `setSkin` | `{skin:'workshop'\|'deck'}` | flip theme (legacy `{cmd:'skin'}` also accepted) |
| `close` | — | programmatic close, **no** `cancel` emitted |
| `exportReady` | `{requestId,downloadName}` | if `requestId` matches the in-flight export → close drawer + "Saved" toast |
| `exportError` | `{requestId,message}` | if `requestId` matches the in-flight export → keep drawer open + inline failure banner |

Mirror methods (`window.EXPORT.*`): `setViewModel(stepId,tileId,vm)` · `open(stepId,tileId,scope,origin)` · `setBundle(bundle)` · `setSkin(skin)` · `close()` · `exportReady(requestId,downloadName)` · `exportError(requestId,message)`. Read-only helpers: `intent()` · `getState()` · `onEmit(fn)` · `_registry`.

**panel → HOST** (`evt` out):

| evt | payload | when |
|---|---|---|
| `ready` | `{evt:'ready',api:1}` | once, on load |
| `needViewModel` | `{evt:'needViewModel',api:1,stepId,tileId,requestId}` | `open` for an uncached target |
| `export` | the full intent (§7) | user clicks Export |
| `cancel` | `{evt:'cancel',api:1}` | **only** user-initiated close (Cancel / ✕ / scrim / Esc) |
| `resize` | `{evt:'resize',api:1,height}` | every open / render / close |

All outbound goes through `window.parent.postMessage(msg,'*')`.

## 3 · Mount recipe

1. **Attach your `message` listener BEFORE setting the iframe `src`.** `ready` fires once at boot; set `src` first and you miss it.
2. **postMessage is origin-agnostic; the mirror API is same-origin-only.** The wire path (`open`/`setViewModel`/`export`/…) works cross-origin. The convenience mirror methods and read-only helpers on `iframe.contentWindow.EXPORT` require **same-origin** DOM access. A same-origin mount gets you both; a cross-origin mount still works over postMessage but loses the mirror API. Recommend same-origin.
3. **`body.embed` auto-collapses the demo shell** (background transparent, only scrim + drawer remain). Nothing for you to strip.
4. **Size the overlay from `resize{height}`** — emitted on every open/render/close.
5. **You own** mount position, **z-index (the drawer must beat a fullscreened tile)**, and show/hide of the iframe overlay. The panel does not manage stacking against host chrome.

## 4 · The `needViewModel` ↔ `setViewModel` recovery loop

Normal path is host-preloaded: `setViewModel` before `open`. If you `open` an uncached `(stepId,tileId)`, the panel shows a skeleton and emits `needViewModel{stepId,tileId,requestId}`; answer with `setViewModel` for the **same** `(stepId,tileId)` and it auto-opens. A `setViewModel` with no pending open just caches.

Send the **contract vm shape** — the panel adapts it and advertises **only what is real**:

- `availableFormats:[…]` → exactly these format buttons (fallback `['pdf']` if empty).
- `availableScopes:[{kind,label,count}]` → scope chips; `count:0` renders disabled; omit a scope to not offer it.
- `availableIncludes:[…]` → include toggles, verbatim subset of the 7.
- `defaultPreset` → `exec|doc|data|memo|follow|appendix` **or `null`** (null/omitted is safe — the panel falls back to the first preset compatible with `availableFormats`).
- `monolithic` (drops per-item `selection` scope) · `substeps:[{id,title}]` · `selection:[{kind,id,label}]` · `project:{name,date}`.

`selection` is normalized to opaque `{kind,id}` (label dropped) and, when the user picks the `selection` scope, is echoed back in `target.selection` (§7). Proof: a vm with `availableFormats:['pdf','docx']` / `availableIncludes:['notes','owners','gaps']` renders exactly those and nothing else (`export-panel.spec.js`).

## 5 · Origin inference

When `origin` is omitted on `open`, the panel fills it: `tileId==null` → `step`; `stepId==='implementation' && tileId==='workspace'` → `app`; else `tile`. Pass `origin` explicitly to override.

## 6 · Two hard guarantees for your parser

- **`stepId` is always a wire id** — `step1..step7` or `implementation`, **never Roman**. Holds for every `target.bundle[].stepId` too.
- **`options` is always all 7 keys as real booleans** — `{notes,warnings,scores,owners,provenance,timestamps,gaps}`, each `true`/`false`, never numeric, never partial.
- **Masking:** the panel computes `preset ∩ availableIncludes`, so an include absent from `availableIncludes` is always `false`.

## 7 · The export intent + lifecycle

```js
{ evt:'export', api:1,
  origin,                    // 'tile' | 'step' | 'app'
  stepId,                    // wire id
  tileId,                    // null on bundle
  scope,                     // 'tile' | 'selection' | 'step' | 'bundle'
  target:{                   // only the keys relevant to scope are present
    substeps?:['7.1',…],                             // substep ids (Step VII)
    bundle?:[{stepId,tileId,scope}],                 // from your setBundle manifest, wire-id refs
    selection?:[{kind,id}] },                        // opaque refs, when scope==='selection'
  format,                    // 'pptx'|'docx'|'xlsx'|'pdf'|'png'|'svg'
  preset,                    // preset id, or null if the user customized
  options:{notes,warnings,scores,owners,provenance,timestamps,gaps},  // 7 booleans, always
  filename, skin, requestId }
```

Lifecycle (embedded path):

- On Export the panel posts the intent and **stays open in a "Generating…" state**, awaiting your reply, and records the `requestId` as in-flight.
- **`exportReady{requestId,downloadName}`** → if it matches the in-flight request, the drawer closes and toasts `Saved <downloadName>`.
- **`exportError{requestId,message}`** → if it matches, the drawer stays open, restores controls, and shows an inline failure banner to retry.
- A reply whose `requestId` doesn't match the in-flight export is **ignored** — a late/superseded/cancelled reply can't act on the wrong drawer. (Omitting `requestId` acts on the current drawer, for lenient hosts.)

## 8 · step3/scts first slice (per §F)

Phase 0 is **step3/scts, xlsx-first**, old export buttons stay live until parity is proven — your host-side plan. What the surface guarantees you:

- The tile's ⬇ open call is `EXPORT.open('step3','scts')` (or `{cmd:'open',stepId:'step3',tileId:'scts'}`).
- **xlsx-first is a property of your view-model, not automatic.** The opening format/preset comes entirely from what `getExportViewModel('step3','scts')` returns: the panel opens on `defaultPreset` and falls back to `availableFormats[0]` if that preset's format isn't offered. **To get xlsx-first, return `{ defaultPreset:'data', availableFormats:['xlsx', …] }`** (xlsx first, or at least present). The panel's built-in demo seed (`VM.scts`, `def:'data'`) is only a standalone/test fixture — it does not substitute for your vm.
- On the wire for that tile you'll receive `origin:'tile'`, `stepId:'step3'`, `tileId:'scts'`, and — with the vm above — `format:'xlsx'`, `preset:'data'`.

## 9 · Ownership boundary

Claude owns `export-panel.html` + the `window.EXPORT` surface + `asset-tests/`. Codex owns `getExportViewModel(workspace, appState, {stepId,tileId,origin,scope})`, the mount/glyph/z-index, and intent → generation → `exportReady`/`exportError`.

**No new canonical field is requested.** The panel conforms to §A/§F exactly. If a future tile needs a new field, it lands in this doc first before any surface assumes it.

Step VII stays `window.STEP7 api:2`; its nested export relay may speak `api:1` upward (per §F) — out of scope for Phase 0.

## 10 · Source of truth

- Contract + accepted reply + surface-ready + hardening notes: `STEP1-4-EXPORT-CODEX-HANDOFF.md` §A / §F / §G.
- Observable wire behavior: `asset-tests/export-panel.spec.js` (11 specs).

## 11 · What changed since §G was first written (the hardening pass)

Four conformance fixes, each now covered by a spec — so this handover has zero "not-yet-safe" caveats:

1. **`defaultPreset:null` no longer crashes** — falls back to the first compatible preset.
2. **`setBundle` now drives the app bundle** — checklist + `target.bundle` come from your manifest, not the panel's own step list.
3. **`selection` scope round-trips** — `target.selection:[{kind,id}]` echoed from the vm.
4. **`exportReady`/`exportError` are requestId-correlated** — stale/superseded replies are ignored.
