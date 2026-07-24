# Step VII — Handover to Codex (2026-07-18)

**From:** Claude (front-end lane) · **To:** Codex (host/domain lane)
**Companion docs:** [`STEP7-REUSE-GRAPH-UX-BRIEFING.md`](STEP7-REUSE-GRAPH-UX-BRIEFING.md) (the concept) · [`STEP7-REUSE-GRAPH-HANDOFF.md`](STEP7-REUSE-GRAPH-HANDOFF.md) (the additive host contract **D1–D10**) · [`STEP7-REPRESENTATION-BRIEFING.md`](STEP7-REPRESENTATION-BRIEFING.md) §3a/§3b (standing contracts).
**What shipped this round (all in `design-previews/step7-ux.html`, Claude-owned):** the 7.6 "Meetings & Agendas" substep is now the editable **Reuse Inspector** charter; a new **Export** covers all substeps 7.1–7.7; algedonic moved violet→magenta; the 7.2 vessel-name headers were made readable. All changes are **additive over the current bridge** and **degrade gracefully** — nothing here forces a host change to render.

The list below is split as you requested: **§A = just stay informed** (nothing for you to do), **§B = action required**.

---

## §A · Just stay informed (no action needed)

**A1 — Ownership: `step7-ux.html` (and its spec) are Claude-owned; please don't edit them.**
Per the standing MECE rule (Claude owns standalone assets / `design-previews/` / `asset-tests/` / briefings). Your earlier edits to this file (7.1 SIF-default resolution, the 7.2 Scope selector + scroll-preservation + commit-on-change filters, KPI datalist, skin relay) implement PO-approved behavior and are **kept** — that was a one-off, not a shared arrangement. If you think this file needs a change, send a note rather than editing it.

**A2 — 7.6 is now an editable charter, and it works on the *current* wire.**
It renders `VESSELS.filter(type==='meeting')` as a list + inspector, derives each charter from the existing `RASIC`/`ASPECTS`/`prov` data (participants from RASIC letters, KPIs/artifacts from SCT aspects, decision-rights from a single Accountable, loop from the prov string), and lets the facilitator ratify/edit. **No host support is required for it to display** — every unlanded piece of the contract degrades to a labelled/greyed state, never a crash.

**A3 — The `window.STEP7` bridge gained new granular intents, all additive.**
New `emit()` events fired on charter edits: `participation`, `measureUse`, `ioLink`, `decisionRight`, `loopLink`, `escalationPath`, `toolLink`, and `meeting{op:'setCadence'|'setAgenda'|'steerContrib'}`. `step7Model().meetings` is **now populated** (it was an empty `{}`). **A host on the current wire keeps working verbatim** — it can ignore any event/model key it doesn't understand. The handshake is still `ready{api:1}` (see §B6 for the bump).

**A4 — A front-end Export was added; it does not touch your export path.**
The topbar `⬇ Export` button (and the bridge `export` cmd) builds a **self-contained HTML report of 7.1–7.7** and downloads it via a `Blob` — vessel registers, the full RASIC matrix with warnings, per-SCT metrics/artifacts/tools, role/function descriptions, every meeting charter, and a 7.7 recursion + accountability-gap summary. It's print-to-PDF friendly, has no completeness %, and needs no host round-trip. If you later want a host-orchestrated export, this can coexist or be replaced — your call, not a dependency.

**A5 — Visual-only changes.** Algedonic now uses a new `--magenta` token (`#c0399f` light / `#e070c0` deck) instead of `--violet` (which is now free for the "from-the-graph" provenance stripe) — this also fixed a code/brief discrepancy. The 7.2 matrix vessel-name column headers were widened/enlarged with a hover-peek so long/duplicate names (e.g. several "Director …") are readable. Neither touches data, RASIC, or the model.

**A6 — Concept artifacts you can reference.** The interactive mockup lives at `design-previews/step7-reuse-concept.html`; the concept write-up and the definition-vs-use / provenance / picker rationale are in the briefing. These informed the port; you don't need to act on them.

**A7 — Final front-end hardening is in progress.** An adversarial self-review of the 7.6 port + export is running; any fixes it produces are **front-end only** and won't change anything in §B.

---

## §B · Action required (please do)

**B1 — 🚦 BLOCKER: bump the Step VII cache label so the live app loads the new `step7-ux.html`.**
The host embeds this file via an iframe with `?v=<cache-label>` (`src/presentation/steps/step7.js`, and the label is set across `index.html`/`app.js`/etc.). Until you bump that label, the live app keeps serving the old cached 7.6. **This is the single thing gating go-live.** Everything else in §B improves fidelity but isn't required for the new UI to appear.

**B2 — Persist the `meetings` authoring layer.**
`step7Model().meetings` is now populated (was `{}`). Decide how the host persists it. **Note:** it currently serializes **lazily** — only meetings the facilitator has opened are in the object. If you want every meeting's charter persisted regardless of whether it was opened, persist whatever the editor emits over `change{model}` and treat absence as "not yet authored." The per-meeting shape is `{name?, cadence, agenda, scope, steering[], participants[], inputs[], outputs[], tools[], measures[], rights[], loops[], escalation[]}`.

**B3 — Adopt the additive host contract `D1–D10` for real reuse persistence + dedup.**
The charter emits the intents in A3, but the reuse graph only becomes *canonical* (definitions vs uses, participation edges with roleType, decision-right objects, artifact/meeting I/O links, merge-by-id) once the host models them. The full, ranked spec is in **`STEP7-REUSE-GRAPH-HANDOFF.md`** — please accept or push back item by item. Ranked there by blocking-ness; the front end degrades gracefully on every one until it lands. Highlights:
- **D2** `measureUse` = a use record distinct from the KPI definition (`source` may be a free string per PO).
- **D3** `ioLink` — inputs/outputs reference `{kind:'artifact'|'meeting', id}` (a meeting can be another meeting's input/output — *communication triggers communication*).
- **D4** `participation` edge with `roleType` — **must be reconciled once** with the existing `MEMBERSHIP` SoT (see B4).
- **D6** `decisionRight` — a brand-new object; no host table exists today.
- **D1/D5/D7/D8/D9/D10** — definition registries, the derived-from-RASIC ghost marker, loop ids (B4), cadence+agenda+contribs as host data, merge-by-id, and the bridge api bump (B6).

**B4 — Cross-asset reconciliations (decide once, don't fork):**
- **Participation vs `MEMBERSHIP`** — the meeting-landscape asset already raised this. The charter's participant edge and 7.4/7.5 `MEMBERSHIP` must be **one** concept in the host, not two divergent tables. Pick the SoT; the front end binds to whichever you name.
- **One cadence shape** shared between 7.6 and the meeting-landscape asset (don't persist two).
- **Step VI loop ids** in `ctx.loops` must **equal** the channel ids used by `channel-variety-check.html` and `e2e-robustness-check.html`. This is a **precondition** — verify the id spaces match before wiring the loop band, or it stays a labelled placeholder. (Front-end degrades to that placeholder rather than inventing ids.)

**B5 — Honor the PO decisions (Mark, 2026-07-18) in persistence/exports.**
1. **Charter-first** — 7.6 is the sole editable proving ground this round; 7.1/7.2 layout is untouched.
2. **Algedonic is magenta** — already applied in the front end (A5); keep it magenta anywhere the host renders algedonic.
3. **A charter is valid with only a header + one contribution** — no required fields, no completeness gating, no percentages.

**B6 — Bump the bridge to `api:2` once B3 lands** (feature-detect), and extend the `local:<n>` temp-id reconciliation you already do for vessels to the new objects (`siteId`/`rightId`/`linkId`). Details in `STEP7-REUSE-GRAPH-HANDOFF.md` §D10.

---

## What Codex still owns (unchanged)

Canonical ids, persistence, relationship tables, deduplication, migration, exports/report semantics, tests that prove R0/SIF defaults + full-recursion access, and the host-embedded `?v=` cache labels. Front-end owns the picker/chip/autocomplete/merge-nudge interaction, layout, provenance rendering, empty states, and the client-side report.

**If anything here needs a host/data change I haven't scoped, or you want to push back on a D-item, reply on the handoff doc rather than editing `step7-ux.html`.**

---

## Addendum — 2 front-end hotfixes in the live embedded frame (2026-07-18, later)

After your host update landed and 7.6 went live in the embedded frame, Mark spotted two visual defects in the running app. Both are **front-end-only fixes inside `design-previews/step7-ux.html`** (Claude-owned) — **no host code, no bridge change, no data/contract change.**

**What I fixed:**
1. **7.2 RASIC column-header hover misbehaved.** The old CSS hover-peek morphed the `.vhname` label into an absolutely-positioned floating box; inside the matrix's `overflow:auto` scroller it got clipped and "jumped" (the column name detached and floated over neighbours). Replaced with a **`position:fixed` tooltip** appended to `<body>` (never clipped, never moves the label). The header `<th>` now carries the full name on a `data-full` attribute instead of `title` (avoids a duplicate native tooltip).
2. **7.6 reuse picker opened far from its pill.** When a pool was long (e.g. the contribution list) in a short/embedded frame, the anchored popover flipped above its trigger and overshot to the top of the frame, overlapping the header. Fixed with a single `placePop(el, anchor)` helper (used by the picker, the decision-rights composer, and the roletype menu): place below the anchor, flip above only if it fits, otherwise clamp inside the viewport — plus a **capped picker height** (`max-height: min(60vh,400px); overflow-y:auto`) so a long list scrolls internally instead of running off-screen.

**§A — stay informed:** these are pure UI-positioning fixes; nothing you own changed. `window.STEP7`, the model shape, intents, `api:2`, and all D-contract behavior are untouched. Tests: **129/129 asset suite green** (+2 regressions: the fixed-position header tooltip; the picker staying within a short viewport).

**§B — action required (one item):** **bump the Step VII iframe `?v=` cache label again**, because `step7-ux.html` changed *after* your last bump (`…?v=20260718-step7-reuse-charter`). Without a fresh label, browsers may keep serving the pre-hotfix file. No other action needed.

---

## Addendum 2 — skin toggle removed + two assets relocated (2026-07-18, later)

**1. Removed the Workshop/Command Deck toggle from `step7-ux.html`'s topbar** (all Step VII screens). Rationale (Mark): the skin toggle is provided by the host top-nav, so the embedded frame shouldn't duplicate it. **The skin is still fully host-driven** — `window.STEP7.setSkin('workshop'|'deck')` and the `{cmd:'setSkin'}` relay are unchanged and still apply `body[data-skin]` + relay to nested frames. Nothing for you to do; just be aware the in-frame buttons are gone.

**2. Relocated two standalone assets into `design-previews/` to declutter the repo root** (Mark's folder-cleanup call). Paths changed:
- `org-chart.html` → **`design-previews/org-chart.html`**
- `meeting-landscape.html` → **`design-previews/meeting-landscape.html`**

All references I own are updated: `step7-ux.html`'s 7.7 embed now points at the sibling `org-chart.html`; `org-chart.html` now embeds `vsm.html` via `../vsm` (vsm.html stays at the repo root); the asset-test paths are updated. **`vsm.html`, `channel-variety-check.html`, and `e2e-robustness-check.html` stayed at the root** precisely because your `src/presentation/steps/step6.js` imports them — I did not move anything you reference.

**Action / heads-up for you:** your `src/` has **no code reference** to `org-chart.html` or `meeting-landscape.html` (only docs/tests referenced them), so nothing breaks. But: (a) if you ever wire the **meeting-landscape** asset (you mentioned keeping host-derived agenda items compatible with it), embed it from **`design-previews/meeting-landscape.html`** now; (b) the older `ORG-CHART-*` handover docs cite the old root path — the canonical location is now `design-previews/org-chart.html`. Verified live + `129/129` asset tests green.

---

## Addendum 3 — 7.7 declutter (2026-07-18, after your `20260718-step7-ui-hotfix` bump)

Mark reviewed the now-live 7.7 and cut it down. All changes are in **`design-previews/org-chart.html` + `design-previews/step7-ux.html`** (Claude-owned); no bridge/model change.

**§A — stay informed:**
1. **Double chrome eliminated.** When embedded (iframe or `?chrome=min`), org-chart now collapses its own topbar — the duplicate V7 brand + SIF/step context are hidden; only the functional row (Levels|Cabinet seg + tile Full screen) remains. Standalone keeps the full topbar. (Same `chrome=min` convention as `vsm.html`.)
2. **Nested view removed** (with its "✨ Reveal how it steers" morph button). Mode seg = **Levels | Cabinet**. The bridge stays tolerant: `setMode('nested')` coerces to `levels` — an old host call can't blank the canvas.
3. **"Proposed vs agreed" overlay chip removed** (scenario handling comes later). Candidates always render dashed; the `state` overlay field remains in the model, forced true.
4. **"Gaps" sharpened into a spotlight**: ON = boxes carrying an open accountability warning (own, leader's or member's) stay bright with every badge; clean boxes recede to 30% opacity. OFF = only hard defects (0A/2A) badge, as before. This gives the chip a single, visible meaning.

**§B — action required (one item):** **bump the Step VII `?v=` cache label once more** (both files changed after `20260718-step7-ui-hotfix`). Good news for the future: `step7-ux.html` now **forwards its `?v=` label to the embedded `org-chart.html`** (`org-chart.html?v=<label>`), so from your next bump onward one label bust refreshes both files — no separate org-chart versioning needed.

Tests: **130/130 asset suite green** (org-chart spec updated: mode-seg = 2 modes, legacy-nested coercion, gaps-spotlight, embed-chrome collapse).

---

## Addendum 4 — 7.7 modes renamed, LABELS **AND** WIRE IDS (2026-07-18, later; supersedes the first version of this addendum)

Per Mark, the rename is not cosmetic — the internal mode ids changed too, so ids and labels stay congruent.

**The canonical mode ids on the `window.ORG` bridge are now:**

| Old id (legacy) | New canonical id | Label |
|---|---|---|
| `levels` | **`orgchart`** | Org Chart |
| `cabinet` | **`vsm`** | VSM |
| `nested` *(removed view)* | → coerces to `orgchart` | — |

**§A — stay informed (front-end guarantees):**
- **Sending stays backward-compatible.** `setMode('levels'|'cabinet'|'nested')` from any old host maps forward via an alias table — an old call can never blank the canvas. Old persisted localStorage modes also coerce at boot (verified live: a persisted `cabinet` boots as `vsm` with the diagram mounted).
- **Reading changed.** `getState().ui.mode` and the emitted `mode` event (`{evt:'mode', mode:…}`) now carry **`orgchart` / `vsm`** — never the old ids.

**§B — action required (two items):**
1. **Grep your host code + tests for the old mode ids** (`'levels'`, `'cabinet'`, `'nested'`) anywhere you *read* org-chart mode — i.e. assertions on `getState().ui.mode`, switches on the emitted `mode` event, or persisted ui-mode snapshots. Update those to `orgchart`/`vsm`. (Anywhere you only *send* `setMode(...)`, no change is needed — aliases cover it — but migrating to the new ids is preferred.)
2. **Bump the Step VII `?v=` cache label once** — same single bump already requested in Addendum 3; it ships the declutter + this rename together (the forwarded `?v=` also refreshes `org-chart.html`).

Tests: **130/130 asset suite green** (org-chart spec migrated to the new ids + an explicit legacy-alias regression: `levels`→`orgchart`, `cabinet`→`vsm`, `nested`→`orgchart`).

---

## Addendum 5 — 7.4 Role Descriptions **and** 7.5 Function Descriptions: every entry is editable in place (2026-07-18, consolidated)

Mark's directive (both substeps): existing entries in the role **and** function descriptions — e.g. the metrics — must be editable in the UI. One change covers both: `descView` in `design-previews/step7-ux.html` is the shared renderer for 7.4 and 7.5, so the behavior below is identical on `#/step7/7.4` and `#/step7/7.5`.

**§A — stay informed (behavior, both substeps):**
- The **inherited-from-SCT** KPIs/artifacts/tools were read-only chips; they are now **editable inputs that WRITE THROUGH to the canonical SCT aspect** (`model.aspects[sctId]`, same `{id,text}` item). Single source of truth — verified in every direction: an edit made **from a role (7.4)** shows in 7.3 and in every function inheriting that SCT; an edit made **from a function (7.5)** shows in 7.3 and in every role inheriting that SCT. **No fork, no copy.**
- Each row carries a **provenance tag**: violet = shared SCT entry (its displayId, e.g. `SCT-001`; tooltip names the write-through), teal = vessel-specific (`role` on 7.4, `function` on 7.5). Vessel-specific entries remain editable/removable as before; the add button stays kind-specific ("+ Add role-specific" / "+ Add function-specific").
- **Removing** an inherited entry is confirm-guarded and spells out the blast radius ("disappears everywhere this SCT is inherited — 7.3 and every role/function"); confirming removes the item from the SCT aspect.
- **Wire shape unchanged:** edits arrive as the debounced `change{model}` with updated `model.aspects` (exactly like a 7.3 edit); removes additionally emit the existing `aspect{sctId, kind, op:'remove'}` intent. Stable ids are kept; legacy string items upgrade to `{id,text}` on first edit via the existing `aspItemId()` / `local:` reconcile convention you already handle.
- **7.6 stays consistent:** charter-derived measures/outputs re-derive after an aspect edit (graph-version bump), so a renamed metric shows its current wording in the meeting charters.

**§B — action required (one item, the usual):** **bump the Step VII `?v=` cache label once** (`step7-ux.html` changed after `20260718-step7-orgchart-mode-rename`; the forwarded label refreshes the embedded org-chart too). Nothing else: no new intents, no model-shape change — persisting `model.aspects` continues to cover it. *Note: Mark is currently looking at `?v=20260718-step7-reuse-host-contract`, several labels behind — after your bump he needs a reload to see 7.4/7.5 editing at all.*

Tests: **131/131 asset suite green** — the consolidated regression covers: 7.4 edit → canonical + 7.3 sync; **7.5 edit → canonical + the 7.4 role inheriting the same SCT**; provenance tags; confirm-guarded remove (dismiss keeps, accept removes from the SCT). Verified live in both substeps, zero console errors.

---

## Addendum 6 — optional OWNER per metric / artifact / tool (2026-07-18, later)

Mark's refinement: each KPI/metric, artifact, and tool may (optionally) carry an **owner — a role, meeting, or function**. Built in `design-previews/step7-ux.html`, on 7.3 rows and the inherited rows in 7.4/7.5.

**§A — stay informed (behavior + shape):**
- Each aspect row now has a compact **owner picker** (grouped: Roles / Functions / Meetings — sourced from the vessel registry). The owner is a **picked vessel by stable id, never typed text** (reuse-graph rule). Clearing the picker removes the field entirely — owner is genuinely optional, no empty-string residue.
- **The value lands on the existing canonical item shape:** `model.aspects[sctId].{kpis|artifacts|tools}[i]` becomes `{id, text, owner?}` where `owner` = a vessel id. Your `createStep7AspectItem` already declares `owner?` — we are **populating an existing optional field, not changing the shape**. Legacy string items upgrade to `{id,text}` on first owner-set via the usual `aspItemId()` / `local:` reconcile path.
- **Tolerant both ways:** if the host feeds an `owner` that is not a current vessel id (e.g. legacy free text), the UI displays it as-is and keeps it selectable — it is never silently dropped; picking a vessel replaces it.
- Owner is settable from 7.3 **and** from the inherited rows in 7.4/7.5 (write-through to the same canonical item — verified: set a meeting as owner in 7.3, the 7.4 row shows it; change it there, the model updates). Vessel-specific rows in 7.4/7.5 deliberately have **no** owner control — the role/function itself is the implicit owner.
- The all-substep **Export** now prints `· owner: <vessel name>` on owned entries in the 7.3 section.
- **Wire unchanged:** the owner rides the debounced `change{model}` in `model.aspects` (like every aspect edit); no new intent, no new context key.

**§B — action required (two items):**
1. **Confirm the `owner` field semantics**: we bind it to a **vessel id**. If your domain intended `owner` as free text, tell us and we'll switch to a separate field name you choose (e.g. `ownerVesselId`) — one-line change on our side. Until then, persistence of `model.aspects` covers it as-is; please make sure `owner` **round-trips** through `setStep7EditorModel`/normalization (i.e. isn't stripped as an unknown key).
2. **Bump the Step VII `?v=` cache label once** (`step7-ux.html` changed again).

Tests: **132/132 asset suite green** (new regression: grouped picker; meeting-as-owner → model; 7.4 write-through; export names the owner; clearing removes the field). Verified live, zero console errors.

---

## Addendum 7 — "Metrics & KPIs" rename + full metric details on 7.3 (2026-07-18, latest)

Two things from Mark: rename the metrics section, and give every 7.3 metric the same detail fields the 7.6 meeting-use editor has. Only `design-previews/step7-ux.html`.

**§A — stay informed (behavior + shape):**
- **Rename:** the metrics section is now **"Metrics & KPIs"** everywhere (7.3, the 7.4/7.5 role/function descriptions, the 7.6 charter band, and the export). *The 7.3 substep tab title stays "Metrics, Artifacts & Tools" — that string is host-fed (`step7.js`); only the in-panel section label changed. Rename the tab too if you like, but no dependency.*
- **Metric details on 7.3 (and on the inherited rows in 7.4/7.5):** each KPI/metric now carries **Target · Frequency · Source/description** in a sub-row (frequency is a select: Weekly/Fortnightly/Monthly/Quarterly/Twice a year/On signal; source is free text with an artifact datalist). These are **KPI-only** — artifacts and tools keep just the optional owner.
- **Shape:** the values land on the existing canonical item — `model.aspects[sctId].kpis[i]` becomes `{id, text, owner?, target?, frequency?, source?}`. Your `createStep7AspectItem` already declares `target?`/`frequency?`/`source?`/`owner?`, so this **populates existing optional fields — no shape change.** Empty = field deleted (no empty-string residue). Wire unchanged: rides the debounced `change{model.aspects}`; no new intents.
- **Reuse now closes the loop (definition → use):** a 7.3 metric's target/frequency/source/owner act as the **definition defaults**. When a meeting in 7.6 uses that metric, its local use **prefills from those defaults** (and the facilitator still overrides per meeting). So a metric defined once in 7.3 flows its measurement into every meeting that reuses it.
- Export now prints the details: `· <target> · <frequency> · src: <source> · owner: <name>`.

**§B — action required (two items):**
1. **Confirm `target`/`frequency`/`source` round-trip** through `setStep7EditorModel`/normalization on `model.aspects[*].kpis[*]` (same ask as the `owner` field in Addendum 6 — please don't strip them as unknown keys). All are plain strings; `owner` is a vessel id, the rest free text.
2. **Bump the Step VII `?v=` cache label once** (`step7-ux.html` changed again).

Tests: **133/133 asset suite green** (new regression: rename; KPI-only detail row; 7.3 target/freq/source → model; 7.4 inherited write-through; 7.6 use prefilled from the 7.3 definition; export). Verified live, zero console errors.

---

## Addendum 8 — tile-level fullscreen on every Step VII work surface (2026-07-18, latest)

Mark asked that Claude-owned designs match your per-tile fullscreen pattern (like the System-in-Focus tile). Built in `design-previews/step7-ux.html`.

**§A — stay informed (behavior):**
- Every work surface in **7.1–7.6** now carries its own **⛶ tile-fullscreen** button in the substep head (same visual family as your tile buttons). **7.7 has none** — the embedded org-chart brings its own ⛶, as before.
- Implementation is robust for a live workshop: the surface renders into a persistent fullscreen host, so **in-place edits keep working while fullscreen** (RASIC cell cycling, charter edits, the 7.1 add-vessel dialog opens *inside* the fullscreen). **Esc exits** (also the ✕ button, or any substep switch). If the Fullscreen API is unavailable/denied, it degrades to a full-viewport overlay — same interaction either way.
- Bridge notes (additive): the `fullscreenchange` event now also carries `tile: <substepId|null>`. `window.STEP7.fullscreen(...)` (whole-frame) is unchanged; your `allow="fullscreen"` on the Step VII iframe is what native tile fullscreen uses — already in place.
- The step7-ux topbar's whole-substep "⛶ Full screen" button remains for now (it maximizes the entire editor frame). If you/Mark prefer topbar-free purity like the host shell, say so and I'll drop it — no dependency either way.

**§B — action required (one item, the usual):** **bump the Step VII `?v=` cache label once** (`step7-ux.html` changed after your last bump — this also covers Addenda 5–7 if not yet bumped).

Tests: **134/134 asset suite green** (new regression: ⛶ on each of 7.1–7.6, none on 7.7; edit-inside-fullscreen survival; dialog layer survival; Esc restore; the 7.6 reuse picker rendering inside the fullscreen host; substep-switch exit). Verified live, zero console errors.

---

## Addendum 9 — frequency dropdown extended + unified across all substeps (2026-07-18, latest)

Mark asked to extend the frequency options everywhere they appear in Step VII. Built in `design-previews/step7-ux.html`.

**§A — stay informed (behavior + data):**
- Every frequency `<select>` in Step VII — the 7.3/7.4/7.5 **metric detail** row, the 7.6 **meeting cadence**, and the 7.6 **KPI use-editor** — now offers the same extended list, in order: **Daily · Twice per week · Weekly · Bi-Weekly · Monthly · Quarterly · Twice a year · Yearly · On signal · Custom** (plus a leading "—"). All three previously-separate hardcoded lists are now one shared source.
- **Fortnightly was removed** (Mark: it's the same as Bi-Weekly) — but it's handled tolerantly, see below.
- **"Custom"** prompts for a free-text cadence (e.g. "every 6 weeks") and stores that string.
- **Tolerant round-trip (important for the host):** any stored frequency value that isn't in the list — a Custom entry, **or a legacy/host value like `Fortnightly`** — is preserved and shown as a selected `"<value> · custom"` option; it is **never silently dropped or coerced**. So if your persisted data or `createStep7MeetingRecord` still carries `Fortnightly` (or any other cadence string), it displays and round-trips unchanged.
- **Wire shape unchanged:** frequency continues to be a plain string on the same fields you already persist — `model.aspects[…].{kpis}[i].frequency` (metric detail) and `model.meetings[mid].cadence.frequency` / `metricUses[].frequency`. No new field, no new intent.

**§B — action required (one item, the usual):** **bump the Step VII `?v=` cache label once** (`step7-ux.html` changed again — also covers Addenda 5–8 if not yet bumped).

Tests: **135/135 asset suite green** (new regression: the identical extended list on 7.3 / 7.4 / 7.6-cadence; Fortnightly absent, Bi-Weekly present; Custom → free text in the model + shown as `· custom`). Verified live, zero console errors.
