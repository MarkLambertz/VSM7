# VSM7 · UX Streamlining Diagnosis — duplicate features & buttons

*2026-07-22 · Claude. Method: live user-simulation across every step on 4173 (Transformation 2026) — walked all steps, counted every visible interactive control per screen state, looked inside all embedded iframes — then confirmed each finding in the code (file:line). The yardstick is Mark's: the compact **icon pair ⬇ + ⛶** per tile (+ at most one short text button like "Reset sliders", the Step II assessment tile pattern, `step2.js:164`). One visible control per function per context.*

---

## 1 · The findings at a glance

| # | Where | What a user sees | Severity |
|---|---|---|---|
| F1 | **Step VII · 7.7** | **3× Export + 2× Fullscreen on one screen** | ●●● worst |
| F2 | **Step VI · E2E** | 2× Export + 2× Fullscreen simultaneously | ●●● |
| F3 | **Overview** | **8 legacy "Download" buttons** (old raw .doc/.xls path) | ●●● |
| F4 | **Step VI · Channels** | 2× Fullscreen | ●● |
| F5 | App-wide | Same actions styled 4 ways (icon ⬇ vs text "⬇ Export" vs "⤓ Export" vs "Download") | ●● |
| F6 | **Step II** | 9 per-slider "Reset to neutral" minis + the global "Reset sliders" | ● optional |
| F7 | **Step I** | 4× identical "Add org." labels on different recursion rows | ○ nit |

## 2 · The detail

**F1 — 7.7 has three export buttons.** Visible at once: ① the Step VII toolbar "⬇ Export" (whole-VII report, `step7-ux.html` topbar), ② my layer button "⬇ Export chart" (`#orgExportBtn` → shared panel), ③ the org-chart's own "⬇ Export" (`org-chart.html:624` → its **own modal** with its own PNG/SVG download — a second export *mechanism*, not just a second button). Plus two fullscreens: toolbar "⛶ Full screen" + the chart's "⛶ Full screen" (`org-chart.html:188`).

**F2 — Step VI E2E doubles both.** The host tile now carries the canonical icon pair ("Export E2E route" ⬇ + ⛶), but the embedded editor still shows its own "⤓ Export" (`e2e-robustness-check.html:183` → own PNG/SVG path, bypasses the panel) and its own "Full screen (F)" (`:198`). Channels (F4) is half-fixed: its internal export is gone, but the internal "Full screen (F)" (`channel-variety-check.html:75`) still doubles the host ⛶. Note also: internal fullscreen = browser `requestFullscreen`, host ⛶ = overlay — **two different fullscreen behaviors** for the same icon.

**F3 — Overview still ships the pre-panel world.** `renderStepOutcomeGrid` renders one "Download" per step (`overview.js:106`, 8 buttons) wired to the legacy `export-step` → raw single-format `.doc`/`.xls` (`exportStepOutcome`) — the path every step-level ⬇ was already removed from. It duplicates the per-tile panel exports *and* reintroduces the HTML-as-Word problem we just eliminated (its .doc output is the old generator).

**F5 — four styles for one action.** Canonical icon-⬇ (host tiles) · text "⬇ Export" (Step VII toolbar, org-chart) · "⤓ Export" (E2E — even a different glyph) · "Download" (Overview legacy). Fullscreen likewise: icon-⛶ vs text "⛶ Full screen".

**F6 — Step II resets.** The tile-level "Reset sliders" is the praised pattern — keep. The 9 per-slider ↺ buttons (`step2.js:362`) are convenience repeated into noise. Optional: remove, or reveal on row-hover.

## 3 · What is *not* a finding (keep — don't over-prune)
- **More → "⬇ Export project"** — app-scope, correctly tucked away (`app.js:1368-85`).
- **Per-row data-grid actions** (Step IV accountable cells, Step V "Unmap", Implementation "Create backlog item" per finding) — matrix semantics, each row is a distinct object.
- **E2E zoom cluster** (Full/Fit/±/Reset) — distinct operations of a canvas editor.
- **`window.STEP7.export()`** Blob fallback — API-only, no visible button.
- **Same control on different screens** — every screen needs its own affordances.
- **Step VII toolbar "⬇ Export"** (whole-VII report) — *scope-distinct* from tile exports; see D1 below.

## 4 · The streamline plan (ordered; nothing loses its only affordance)

| # | Change | Owner | Effort |
|---|---|---|---|
| S1 | **Overview: delete the 8-button Download grid** + retire the legacy `export-step`/`exportStepOutcome` path entirely (last caller). Every step's content stays exportable via its tiles; whole project via More. | Codex | S |
| S2 | **Step VI: embedded assets hide their own Export/Fullscreen** — e2e `#bExport`+`#btnFs`, cvc `#btnFs` get `display:none` when embedded (assets already detect `host=vsm7`). Host icon pair = the one affordance. Standalone keeps them. | Claude | S |
| S3 | **7.7: one chart export, one fullscreen.** Remove my layer "⬇ Export chart"; in embed mode the org-chart's own ⬇ opens the **shared panel** (relay exists) instead of its modal; hide the Step VII toolbar ⛶ on 7.7 (the chart owns fullscreen there, as 7.7 already delegates). Result: toolbar ⬇ (whole VII) + chart ⬇ (chart) — two scopes, two buttons, zero duplicates. | Claude | M |
| S4 | **Icon-pair convergence:** Step VII toolbar + org-chart toolbar text buttons → compact icon ⬇/⛶ with tooltips; unify the ⤓ glyph to ⬇ everywhere. | Claude | S |
| S5 | *(optional — PO call)* Step II: drop or hover-reveal the 9 per-slider resets. | Codex | S |
| S6 | *(nit)* Step I: title-differentiate the four "Add org." buttons (tooltip per level). | Codex | S |

**Decision for Mark (D1):** the Step VII toolbar "⬇ Export" exports the *whole* Step VII report (docx/pdf). Strictly, that's a step-level export — against the tile-only rule. My recommendation: **keep it** as the editor's own tile-export (the VII editor *is* the tile), styled per S4. Alternative: drop it and later give 7.1–7.6 per-substep exports (more work, more buttons — against the taste).

## 5 · After the plan
Every screen shows exactly **one ⬇ and one ⛶ per content unit**, in one visual style; all exports flow through the one panel; the last legacy download path is gone. Total: 3 Claude changes (S2–S4), 2–3 Codex changes (S1, S5–S6), no new mechanisms — only cuts.

## 6 · Status (2026-07-22 evening) + the Safari export-flip fix

**Done & Mark-confirmed:** S2, S3, S4 (Claude) — the compact green ⬇ + blue ⛶ tile pair is now the ONE export/fullscreen affordance on every surface (Step VII substep heads, org-chart toolbar, Step VI embeds hide their internals when embedded). Step VII also lost its redundant internal info bar, the 7.1 sort dropdowns, and the substep numbering. Open: S1 (Codex), S5 (Codex, PO-approved), S6 (Codex), D1 resolved = keep the Step VII head ⬇ as the editor's tile export.

**Safari export "flip" — root-caused & FIXED (Mark confirmed in real Safari 2026-07-22).** Cause: release Safari keeps a `display:none` iframe's internal FrameView stale; on re-show, the export panel's fixed children laid out against the old viewport and the un-laid-out remainder composited as dead white over the app. The `display:none` hiding was itself the 2026-07-21 fix for Safari's wheel-routing-into-`pointer-events:none`-iframes bug — two Safari bugs chained.

**The standing overlay-iframe pattern (do not regress — applies to ANY overlay iframe, current or future):**
1. Inactive = `visibility:hidden` + `pointer-events:none` + `transform:translateX(-200%)` — never `display:none` (layout stays live and tracks resizes; hidden ≠ hit-testable; off-screen guards wheel routing).
2. Size = `width:100%; height:100%` — never vw/vh (stale-resolvable), never bare `inset:0` (iframe is replaced → intrinsic 300×150).
3. On every open: pin live px from `documentElement.clientWidth/Height` + force a sync layout; re-sync on window resize while open; clear on close.

Implementation: `src/presentation/styles.css` `.export-panel-host-frame` (~2150) · `src/presentation/app.js` `setExportPanelActive` + `syncExportPanelFrameSize` + the resize listener (~1113) · nested copy `design-previews/step7-ux.html` `ensureExportFrame`/`expShow`. Specs now assert `style.visibility === 'visible'/'hidden'` (asset-tests/step7-export-relay.spec.js, step7-ux.spec.js). Verified: Playwright-WebKit harness ×3 scenarios + wheel-regression clean, Chromium live, asset **157** / host **201** green, **real-Safari confirmation by Mark**.
