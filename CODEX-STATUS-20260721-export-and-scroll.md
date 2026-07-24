# Status → Codex — Export module + Safari scroll fix (2026-07-21, from Claude)

Two things: (1) a heads-up that I edited your `src/` for a Safari scroll regression (Mark authorized it), and (2) the concrete list of what's still needed on your side to make export actually work end-to-end.

---

## 1 · Safari scroll fix — I touched `src/presentation/styles.css` (CSS only, no JS)

**Symptom (Mark, macOS Safari):** "In Step 7 the scrolling of embedded content is not working anymore." Safari-only; regressed with the export-module churn.

**Root cause:** the singleton export panel mounts at boot as a permanent full-viewport iframe (`ensureExportPanelFrame()` app.js:140/741). `.export-panel-host-frame` was hidden only via `opacity:0; pointer-events:none` — **never `display:none`**. Safari does **not** reliably pass wheel/touch *through* a `pointer-events:none` iframe (WebKit 154807/119839/18768), so the invisible overlay ate scroll. Steps I–VI still scrolled around it; Step VII (whole viewport = embedded editor) died. Chrome/Firefox pass through fine → "Safari only".

**What I changed (all in `styles.css`, additive/minimal):**
- `.export-panel-host-frame` → **`display:none`** (base) / **`display:block`** (`.is-active`) instead of opacity/pointer-events. `display:none` removes it from Safari hit-testing; the iframe still loads + handshakes while hidden, and `setExportPanelActive()` (app.js:876, toggles `.is-active`) works unchanged. **No JS change.**
- Added `svh` fallbacks (kept every `vh` line, added a `svh` line below it — old browsers ignore the invalid decl) on the `calc(100vh − …)` frame/scroller sizes (Step VII frame, e2e/channel-variety/vsm frames, settings layer) for the iOS-toolbar overshoot.
- Removed a legacy `-webkit-overflow-scrolling:touch`.

**Verified:** host tests **183 green**, asset-tests **150 green** (I touched no `design-previews/**` and no JS; the `exportPanelBridge.test.js` pin `/\.export-panel-host-frame/` still matches). Chromium: inactive overlay computes `display:none`, active `display:block`, 0 console errors.

**⚠️ What you need to do here:** **bump the app cache label** so Safari users receive this past HTTP cache. I deliberately did **not** bump it — the tests pin `20260721-safari-sct-scroll-2` and labels/`start.command`/`index.html` are your lane. Bump it wherever you normally do and update the pinned assertions together.

**Rule for us both going forward:** an inactive overlay iframe must be `display:none`, never a transparent `pointer-events:none` hit-target (Safari eats scroll otherwise).

**Optional cleanups I deferred to you** (same review, in your recently-churned area, so your call): drop the redundant `syncStep7Frame` echo on the `goto` branch (app.js:512, perf only); make the Step 3 register scroll horizontally (`.sct-table-panel { overflow-x:auto }` — near your `step3.test.js` pins); delete Step VI's `transform:scale(1.12)` iframe hack (styles.css ~6020, shrinks render ~11%, removes a WebKit hit-test hazard).

---

## 2 · Export surface — what Claude built (done, don't redo)

- **`design-previews/export-panel.html`** — the ONE shared panel on `window.EXPORT api:1`. Built, hardened (4 conformance fixes: null-`defaultPreset` safe, `setBundle` drives the bundle, `selection` scope round-trips, `exportReady`/`exportError` are `requestId`-correlated), and **parity-verified against your `step3/scts` view-model**. 12 specs.
- **`design-previews/step7-ux.html`** — the **B6 Step VII export relay** is built: it nests the shared panel and relays it (DOWN: `openExport`/`setViewModel`/`open`/`setBundle`/`exportReady`/`exportError`/`closeExport`/`setSkin`; UP: the panel's `api:1` `export`/`needViewModel`/`cancel` forwarded **verbatim**). 3 double-embed specs. Additive — the legacy `#exportBtn` Blob stays live until your VII generator lands.
- Full per-step execution plan written: **`EXPORT-CODEX-REALM-HANDOVER-20260721.md`** (linked as §K in `STEP1-4-EXPORT-CODEX-HANDOFF.md`).

Boundary: please don't edit `export-panel.html` or `step7-ux.html` (Claude surface). New view-model fields go through the handoff §A first.

---

## 3 · What's needed to make export work (your realm)

Full detail is in **`EXPORT-CODEX-REALM-HANDOVER-20260721.md`**; the essentials:

**A. The one thing blocking Step VII export — the B6 host gap (realm handover §4).** Today both listeners drop the VII-relayed `api:1` traffic: `handleExportBridgeMessage` (app.js:747) rejects any `event.source !== exportPanelFrame.contentWindow`, and `handleStep7BridgeMessage` (app.js:489) only handles `ready`/`goto`/`change`/`rasic`. So a Step VII `export` intent goes nowhere. To finish it:
1. In `handleStep7BridgeMessage`, after the existing branches, handle `message.evt === 'export' | 'needViewModel' | 'cancel'` **gated on `message.api === 1`** (never intercept STEP7's own `api:2`).
2. Route `export` through `exportExportIntent(workspace, intent)`, then reply **DOWN via `postToStep7Frame(frame, {cmd:'exportReady', requestId, downloadName})`** / `{cmd:'exportError', requestId, message}` — **not** `postToExportPanel` (different iframe).
3. Add a `step7/all` docx/pdf branch to `buildExportIntentArtifact` (`exporters.js:144`, currently `return null` past step3/step4). **`step7Doc(workspace)` already exists** (`exporters.js:285`) — seed the docx path from it.
4. Add a shell trigger: a Step VII step-header ⬇ calling `postToStep7Frame(frame, {cmd:'openExport'})` — a **distinct** action from `open-export-panel` (that one targets the singleton, VII needs the nested frame).
5. When your `step7/all` generator is green, signal me — **I** repoint `#exportBtn` from the Blob to `openStep7Export`. You don't touch `step7-ux.html`.

**B. Fan-out the rest (realm handover §3).** You've already landed `step3/scts` **and** `step4/contribution-matrix` end-to-end (§H understated this — Step IV is your reference pattern). For each remaining tile across Steps I–VII + Overview + Implementation: add a `getExportViewModel` case (`exportViewModels.js`) + a `buildExportIntentArtifact` branch (`exporters.js`), keyed on `(stepId,tileId)`. Plus the B-fixes: **B2** a shared step-⬇ helper (`stepHeader` has no export slot — build this first, it unblocks 9 surfaces), **B3** carry the ⬇ into fullscreen/Focus renders, **B4** pair ⬇ with every monolithic ⛶, **B5** seed Step VI formats per-tile from the real generators (`step6-e2e`=svg/png/pdf/pptx, `step6-channels`=svg/png only — don't advertise more), **B7** fold the two global buttons into an App ⬇.

**C. The honesty rule governs everything:** advertise a format/scope/include in the view-model **only** if the generator actually produces/honors it. Over-populate = the panel offers a section your generator must no-op (blank promise); under-populate = you hide real capability. `exportReady`/`exportError` must echo the `requestId`.

**Acceptance per tile:** vm returns only-real capability → tile ⬇ opens the panel with it → intent round-trips to a real file via `exportReady{requestId,downloadName}` → legacy button retired → host tests stay green (extend `exportViewModels.test.js`/`artifacts.test.js`; add the missing VII coverage: `export`→generate→`exportReady` down, `needViewModel` answerable, `cancel` clears state).

---

**TL;DR:** Scroll regression fixed (CSS only) — **bump the cache label** so Safari users get it. Export surface + Step VII relay are done and green. To make export work: close the **B6 host gap** (route VII `api:1` traffic in `handleStep7BridgeMessage` + add a `step7/all` generator), then fan out `getExportViewModel` + `buildExportIntentArtifact` per tile per the realm handover. Don't edit the two Claude-owned `design-previews` files.
