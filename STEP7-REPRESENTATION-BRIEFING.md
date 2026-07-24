# Step VII — Representation · Concept Briefing

**Status:** UX concept, not a production contract. Front-end-owned.
**Deliverable:** [`design-previews/step7-ux.html`](design-previews/step7-ux.html) — a single-file, dependency-free preview, intended as the implementation base for Codex.
**Scope of this doc:** UX rationale · proposed boundaries for future standalone assets · domain ambiguities to resolve before a clean production contract. A draft bridge exists in §6 and is already used by the host shell; treat it as the current working contract until the open model questions settle.

---

## 1. What the preview demonstrates

One self-contained HTML file, all six substeps clickable, driven by a small **canonical-id sample model** (units, SCTs, SCT contributions, vessels, RASIC map). Everything renders from that model, so warnings, derivations, and the focus-mode "live state" are computed, not faked.

| Substep | Demonstrated |
|---|---|
| **7.1 Vessels** | Three registers (roles · functions · meetings), provenance on every card, candidate↔accepted toggle, accept/edit/merge/reject, dashed candidates, algedonic flag, duplicate hint. |
| **7.2 RASIC** | Matrix-plus-inspector: sticky SCT column **and** sticky Roles/Functions/Meetings group headers, the matrix scrolls internally, click-to-cycle R/A/S/I/C cells (pastel: **A=red · R=yellow · S=blue · I=light-grey · C=dark-grey**), subtle column-group banding, 6 filters + search, focused inspector, and soft-warning classes — including a **loud double-accountability alert** (pulsing red cells + red row tag + loud inspector banner), since two A's on one SCT should be a deliberate exception. Vessels carry **no VSM system** (system comes from the SCT). |
| **7.3 Metrics, Artifacts & Tools** | **NEW.** Optional per-SCT enrichment: **KPIs & metrics**, **artifacts & result types**, **tools & methods** (e.g. Wardley Mapping → Wardley Map artifact). Add/edit/remove items per section; every section is OPTIONAL — an empty SCT is valid. SCT list shows an aspect count. |
| **7.4 Roles** | List + inspector. **Linked SCTs read by RASIC** (hierarchical **A→R→S→C→I**, each listing the SCT *names*, from 7.2); **editable** Purpose + Interfaces text; **add the role to one or more meetings** (membership chips + add-select); KPIs / artifacts / tools **inherited from the linked SCTs** (read-only, tagged by SCT) **plus optional role-specific** items. Everything optional. |
| **7.5 Functions** | Identical treatment to roles (linked SCTs by RASIC · editable purpose/interfaces · meeting membership · inherited + function-specific KPIs/artifacts/tools). |
| **7.6 Meetings** | Charters derived from assigned SCTs + Step VI channel evidence: purpose, linked SCTs, participants, cadence, inputs→decisions→outputs, algedonic trigger. |
| **7.7 Org representation** | Code-native recursion hierarchy (R+1 / R0 metasystem / R-1 S1 units), role/function nodes, **VSM-colour overlay** (units), clicking any node reveals its SCTs + RASIC. "The chart is a view, not canonical truth." |
| **Cross-cutting** | Workshop + Command Deck skins (token-only, no markup duplication); tile-level fullscreen for selected work surfaces; empty / warning / populated states; confirm-before-reject; **no completeness percentages anywhere**. |

The five warning classes (computed live): *no accountable · multiple accountable · responsible-without-accountable · accountable-outside-Step-IV-scope · accountability-without-support*, plus a candidate-accountable nudge. The focus-mode "Live state" tile reads them back ("8 of 14 contributions need a decision").

---

## 2. UX rationale (short)

- **RASIC is the hard surface, so it gets the most structure.** A single flat spreadsheet of contributions × all vessels would be unreadable at 30+ SCTs. The answer is *matrix + inspector*: the matrix carries the at-a-glance pattern (with collapsible vessel groups and filters to shrink the working set), and the inspector carries the depth (assignments, the Step IV anchor, and the warnings) for one selected contribution. Sticky scope on both axes keeps the facilitator oriented while scrolling.
- **Suggest, never assert.** Vessels arrive as *candidates* with explicit provenance (which Step VI `loop.role` / `loop.communication` / Step I unit seeded them). The human accepts/edits/merges/rejects. This matches the method rule that the app produces no automatic organizational truth.
- **Derive-then-refine, with a glass wall.** Descriptions and meeting charters are drafted from the RASIC graph, but every block is tagged derived or human-authored, and regeneration is a *preview with a diff*, not a write. Human edits are never silently overwritten.
- **Warnings invite, never block.** Every diagnostic is a soft prompt with a human decision attached. Empty cells are valid. No scores, no forced completion.
- **The accountability lives in the model, not the boxes.** The org chart (7.7) is explicitly a *representation* over the SCT/RASIC graph; clicking through always lands back on canonical SCTs.
- **Facilitation-first.** Distance-readable type, compact controls, sticky context, progressive disclosure; skins are visual-only and never touch method data; fullscreen belongs to specific work surfaces rather than a global step deck.

---

## 3. Proposed boundaries for future standalone front-end assets

Step VII is bigger than one editor. I recommend splitting it the way Steps V–VI were split, rather than one monolith:

| Candidate asset | Why standalone | Owns | Host owns |
|---|---|---|---|
| **RASIC matrix editor** (7.1 + 7.2) | The genuinely complex interactive surface — same class as `vsm.html` / `e2e-robustness-check.html`. Vessels and RASIC are tightly coupled (you accept a vessel, then assign it), so keep them in one asset. | Matrix/inspector layout, cell interaction, collapsing/filtering, warning *rendering*, vessel cards, focus tiles, skins. | Canonical SCTs, contributions, Step I units, the **Step IV accountable unit**, the **vessel registry** (stable ids), the RASIC store, **warning *rules*** (so they stay consistent with method logic), persistence, exports, reports. |
| **Org representation** (7.7) — **BUILT: `org-chart.html` "The Nested Estate"**, bridge `window.ORG` | A distinct visual/interaction surface (three layout modes + overlays + recursion unfold), reusable as its own nav entry like `vsm.html`; the leadership/layperson capstone artifact. Shipped 2026-07-01 as a standalone asset (embeddable in 7.7), same pattern as 7.6→`meeting-landscape.html`. | The three layout modes (Levels/Nested/Cabinet), overlays (colour/accountability/gaps/meetings/alg/state), Plain⇄Expert language, node interaction, coach tour, export (token-free SVG/PNG), skins/focus/fullscreen — and it renders the honesty layer by copying 7.2's `warnings()` **verbatim**. | The recursion/unit structure, vessel scopes, the RASIC store + warning *rules*, whether reporting relations are independently editable (§4.6), and applying accountability fixes (the chart only emits a `requestFix` intent — it never mutates the spine). |
| **Descriptions & meetings** (7.3–7.5) | Mostly form + derived-text surfaces. Could be **host-rendered** with a shared derivation service, or a thin editor — lighter than the two above. | (if an asset) the inspector + diff-preview UX. | The derivation/regeneration engine and per-field provenance/lock state (§4.4). |

If we go this way, the bridge for the RASIC editor would mirror the existing assets (`loadModel` / a `setContext` for SCTs+units+Step IV anchor / debounced `change` emit / stable-id reconciliation), and the host would orchestrate persistence and exports. **I have not written that contract yet** — it should wait until the §4 ambiguities are resolved, because they change the data shape.

---

## 3a. Shared recursion-focus contract

**Resolved PO rule (2026-07-17): R0 / System-in-Focus is the default workshop lens.** Canonical Step VII data may and should carry SCT contributions across R-1, R0, R+1, and deeper recursion levels, but workshop-facing screens must start from the SIF before exposing the wider recursion stack.

- **Front-end / Claude-owned surfaces:** when a Step VII screen, matrix, dialog, visual, or selector spans several recursion levels, preselect `meta.sif`, a unit marked `sif:true`, or the unit with `level:'R0'`. Other recursion levels must be reachable through explicit controls such as "All levels", level filters, grouping, drill-down, or collapse/expand. They should never appear mixed into the default view without a visible level distinction.
- **Host / Codex-owned surfaces:** feed `meta.sif` and `meta.sifName` consistently, preserve stable Step I unit ids, and keep all SCT contribution rows canonical. Do not remove R-1/R+1 contribution data to reduce noise; instead default to R0/SIF, group by SCT, collapse non-R0 rows, or provide deliberate scope filters.
- **Step 7.2 RASIC matrix specifically:** the model remains one RASIC assignment per `(SCT contribution x vessel)`, because accountability can differ by recursion level. The default workshop view should focus on R0/SIF contribution rows, with clear access to all recursion levels when the facilitator needs to compare or audit them. The top filter bar should use the recursion `Scope` selector as the single level/unit-scope control; do not also show a separate `Accountable unit` selector there, because it is redundant and confusing in workshops. The Step IV accountable unit remains host/domain data for warnings, inspector details, and method logic.
- **Step 7.3 Metrics, Artifacts & Tools specifically:** the authored content remains per canonical SCT, but the SCT list is scoped through the same recursion lens as Step 7.2. By default, show all SCTs that have at least one R0/SIF contribution. When the facilitator chooses another recursion level, show the SCTs with contributions in that selected level. Visible VSM-system chips should be derived from the scoped contributions, not from a legacy SCT-level system field.
- **Step 7.1 vessel dialogs specifically:** the organizational/recursion scope defaults to R0/SIF. If a vessel is intentionally scoped elsewhere, the facilitator chooses that level explicitly.

This is a facilitation rule, not just a display preference: focus is key in workshops, and recursion-level distinction is part of the method.

---

## 3b. Shared reuse-graph contract

**Resolved PO direction (2026-07-17): Step VII should reuse organization data instead of creating isolated text islands.** Organizational vessels and SCTs are related through the SCT contribution spine. Meetings, role/function descriptions, KPIs, artifacts, tools, and participants should reuse existing canonical entries wherever possible.

Core relationship spine:

`SCT -> SCT contribution -> RASIC assignment -> organizational vessel`

Everything else should attach to or reuse from that spine:

- **Organizational vessels:** roles, functions, and meetings share one vessel registry with stable ids. A meeting is a vessel, not a separate free-floating calendar item.
- **Participation links:** meeting participants should reference existing role/function vessels by stable id. A participation link may later carry `roleType` such as chair, decision owner, contributor, consulted, informed, or escalation owner.
- **KPI / metric definitions:** metric names should be reused from the Step 7.3 KPI/metric pool. A metric definition is the reusable wording, for example "Decision cycle time" or "Audit findings closed (%)".
- **KPI / metric uses:** a meeting, role, function, or SCT may use a metric definition with local target/frequency/source. Example: "Decision cycle time" used by the Monthly Executive Retrospective with target `< 10 days`, monthly, source `decision log`.
- **Artifacts / result types:** artifacts such as decision log, roadmap, audit report, dashboard, backlog, risk register, and strategy one-pager should become reusable result objects, not copied text.
- **Tools / methods:** methods such as Wardley Mapping, OKR review, retrospective, audit walk, or scenario planning should be reusable method entries.
- **Meeting charters:** a meeting should link to SCT contributions, participants, input artifacts, output artifacts/decisions, metrics, decision rights, Step VI communication loops, and escalation/algedonic paths where relevant.
- **Decision rights:** decisions should reference the meeting or vessel that owns the decision, plus the SCT contribution or artifact affected.
- **Step VI communication loops:** meetings should be able to show which communication loop they support or close.

Ownership boundary:

- **Codex / host-owned:** canonical ids, relationship tables, deduplication rules, persistence, migration, exports, report semantics, and tests.
- **Claude / front-end-owned:** the picker/autocomplete/chip UX, how reuse is surfaced without clutter, merge suggestions, empty states, layout, and interaction flow.

Current implemented seed:

- Step 7.3 KPI entries are the current source for KPI wording.
- Step 7.4/7.5 KPI inputs already use native autocomplete suggestions from existing Step 7.3 KPIs.
- This is only the first reuse nudge. A fuller production model should distinguish reusable definitions from local uses.

Fullscreen note:

- As of 2026-07-17, Mark has deprecated the global/topbar fullscreen deck. Future fullscreen affordances live on the specific tile, view, or embedded asset that benefits from focus.
- The old host fullscreen Step VII role table must not be preserved or redesigned around.
- Codex removed the app-wide shell path for the old global fullscreen mode and added the first tile-level pattern on Step I Evaluation's segmentation matrix.
- If Claude improves Step 7.7/org-chart visuals, any fullscreen behavior should be designed as an asset-local or view-local affordance, using the same host bridge data and the active Workshop / Command Deck skin.

Embedded skin bridge note:

- As of 2026-07-17, the host app sends Step VII the active skin through `{cmd:'setSkin', skin:'workshop'|'deck'}`.
- The Step VII preview shell now relays that skin to nested Claude-owned iframes.
- For compatibility, the relay sends both `{cmd:'setSkin', skin}` and `{cmd:'skin', skin}`.
- `org-chart.html` currently consumes `{cmd:'skin', skin}`; future embedded assets should prefer `{cmd:'setSkin', skin}` unless there is a documented reason to use another command.
- The skin bridge is visual-only. It must not mutate canonical Step VII model data.

RASIC scroll-continuity note:

- Step 7.2 RASIC cell assignment and contribution-row selection must preserve the user's current matrix/page scroll position.
- The current preview shell captures and restores `.matrix-scroll` and page scroll around local RASIC re-renders.
- Future Claude-owned RASIC matrix work should treat viewport continuity as part of the interaction contract, especially during live workshops.

Recommended UX direction for Claude:

- Prefer "pick existing first, create new only when needed".
- Show reused entries as chips with source context rather than duplicating text blocks.
- Keep the capture path fast enough for a live workshop; avoid modal-heavy flows unless the facilitator asks for detail.
- Make provenance visible: derived from RASIC, inherited from SCT, role-specific, meeting-specific, or human-authored.
- Avoid turning every field into a database editor. The workshop screen should stay facilitation-friendly.

---

## 4. Domain ambiguities to resolve before a production contract

These are the questions that would otherwise force rework. The preview takes a reasonable position on each (noted), but the host/domain owner should confirm.

1. **Vessel canonicity & identity.** Are roles/functions/meetings **canonical host entities with stable ids** (like SCTs), referenced by RASIC, descriptions, and the org chart? *Preview assumes yes — a host-owned vessel registry; nothing references a vessel by name.* This must be confirmed, because every other Step VII artifact points at vessels.
2. **RASIC scope granularity.** One RASIC assignment is scoped to **(SCT contribution × vessel)**, i.e. matrix rows = SCT contributions (SCT × organizational unit). The same SCT may carry RASIC at more than one recursion level simultaneously through multiple contribution rows. The host owns which contributions exist; per §3a, the default workshop lens is R0/SIF, with deliberate access to other levels.
3. **Where does the algedonic / escalation right live?** Codex said: separate indicator, **don't invent a RASIC letter**. *Preview models it as a flag on the **vessel** (roles + meetings), surfaced per contribution.* Confirm the canonical home — vessel, assignment, or SCT — so it persists and exports consistently.
4. **Per-field provenance for safe regeneration.** "Regeneration must never overwrite human edits silently" implies the host tracks, **per field**, whether content is derived or human-edited (a lock/override flag), plus the last-derived snapshot to diff against. *Preview fakes this with a static derived/human split.* Confirm the host owns this provenance model — it's the crux of 7.3–7.5.
5. **Function vs Step I organizational unit.** An S1 "Mobility Unit" function and the Step I "Mobility" org unit overlap. Are they the **same entity** (a function *is* the unit) or **distinct vessels that reference a unit**? *Preview treats them as distinct vessels scoped to a unit* — clean for RASIC, but risks double-modeling. Pick one to avoid ambiguity in the org chart and reports.
6. **Org chart: derived view or editable structure?** Are reporting/structural relations **derived** from recursion + vessel scope (a pure view), or an **independently editable, persisted** structure? *Preview derives them.* If they're editable, the host needs a reporting-relation store and the chart becomes an editor, not just a representation.
7. **Meeting participants & inputs/outputs — derived or authored?** *Preview derives participants from RASIC (roles assigned to the meeting's SCTs) and stubs inputs/outputs.* Confirm which charter fields are derived vs human-authored (they fall under the same §4.4 provenance question).
8. **Vessel merge / split semantics.** Duplicate detection implies merge. Like the Step VI SCT split/merge rules, a vessel merge must **rewire RASIC, descriptions, and chart references by stable id**, and keep evidence rather than silently dropping it. Confirm the merge contract (which id survives, how assignments are unioned/deduped).
9. **Vessel↔contribution reuse across SIFs/recursions.** Can a vessel be scoped to more than one unit, or is it strictly one scope? *Preview uses a single `scope` per vessel.* Confirm, as it affects the matrix columns and the chart placement.
10. **Definition vs use for KPIs/artifacts/tools.** Should KPIs, artifacts, and tools become reusable definition objects plus local usage records, or remain embedded under SCTs/vessels? Codex recommendation: use definitions plus uses, so the same metric can be reused with different target/frequency/source in a meeting, role, function, or SCT.
11. **Meeting charter reuse model.** Which meeting fields should reference reusable objects: participants, agenda items, decision rights, input artifacts, output artifacts, metrics, Step VI communication loops, and backlog follow-ups? Confirm the minimum production set before Claude designs a rich meeting editor.

---

## 5. Boundary compliance

- Historical note: the original preview only created this briefing and `design-previews/step7-ux.html`. Since then, Mark has explicitly asked Codex to wire the preview into the production host, add persistence/model support, update tests, and keep this document current for Claude.
- Current ownership boundary: Claude/front-end owns visual and interaction design inside front-end assets; Codex/host owns canonical ids, persistence, routing, cache labels, model migrations, exports, tile-level fullscreen shell behavior, tests, and bridges between host and embedded assets.
- No real export is owned by the preview itself; production exports remain host-orchestrated.
- **Automated tests:** `asset-tests/step7-ux.spec.js` (Playwright, run via `npm test` in `asset-tests/`) — 5 specs covering the 7-substep structure, the optional 7.3 aspects, the 7.4 role descriptions (RASIC-grouped links, editable fields, meeting membership, inherited + vessel-specific aspects), and the `window.STEP7` bridge (model shape, silent `loadModel`, debounced `change`). Part of the **77-green** asset-tests suite.
- **Exception (Mark directed, 2026-06-30):** a **DRAFT `window.STEP7` bridge** was added so Codex can build against a concrete shape — this reverses Codex's "no bridge contract yet" instruction. It is explicitly a draft: the §4 ambiguities may still move the model shape, and §6 brackets each open question so the wire format flexes rather than breaks.
- **Exception (Mark directed, 2026-07-17):** the R0/SIF default workshop-lens rule in §3a was added here and mirrored in `AGENTS.md` so Codex and Claude share the same recursion-focus contract.
- Read `AGENTS.md` (SCT Canonical Backbone, UX Direction, Visual Language) to keep the concept aligned: canonical SCTs never copied, stable ids over names, DDD vocabulary, VSM colour grammar (S1 navy, S2 amber, S3/S3* red, S4 green, S5 light blue), no completeness percentages, confirm-before-destroy.

## 6. `window.STEP7` — bridge contract (DRAFT, implemented in the preview)

House-consistent with `window.VSM` / `window.CVC` / `window.E2E`: `ready{api:1}` fire-once handshake, debounced (~120 ms) authoritative `change{model}`, settable `onEmit` inline hook, `inFrame` standalone-safety, stable-id reconciliation, silent programmatic feeds. **Verified live in the preview** (intents fire synchronously, `change` debounces, `loadModel` is silent, `getState` shape correct, no console errors). localStorage key `step7Model1`; `TARGET='*'` (host must verify `event.origin`).

**Model split** — host supplies read-only **context**; the editor owns and emits the **authoring layer**:
```
ctx   (HOST truth, via setContext; rendered, never persisted by the editor)
  units[]    {id,name,level(R+1|R0|R-1),parent,sif}            // Step I recursion
  scts[]     {id,displayId,name,sys,prio}                       // canonical, NEVER copied
  contribs[] {id,sctId,unitId,sys,accUnit,text}                // Step IV; accUnit = ⚓ accountable-unit anchor
  meta       {sif,sifName}
model (EDITOR-owned, the thing the host persists; via change)
  vessels[]      {id,type(role|function|meeting),name,purpose,scope,prov,state(candidate|accepted),alg}   // NO sys: a vessel is system-agnostic; the VSM system comes from the SCT/contribution it is mapped to (a vessel may act across systems by context)
  rasic{}        "<contribId>|<vesselId>" -> R|A|S|I|C
  aspects{}      <sctId> -> {kpis:[…], artifacts:[…], tools:[…]}   // 7.3 optional per-SCT enrichment; any list may be empty
  descriptions{} <vesselId> -> {purpose, interfaces}              // 7.4/7.5 editable role/function text (production: per-field {value,src,lastDerived})
  membership{}   <vesselId> -> [meetingVesselId…]                 // 7.4/7.5 a role/function added to one or more meetings
  vesselAspects{}<vesselId> -> {kpis:[…], artifacts:[…], tools:[…]}  // 7.4/7.5 OPTIONAL vessel-specific KPIs/artifacts/tools (in addition to those inherited from its linked SCTs)
  meetings{}     <vesselId> -> per-field {value,src,lastDerived}
```

**`window.STEP7` =** `{ setContext, loadModel, setVessels, setRasic, goto, select, filter, fullscreen, isFullscreen, setSkin, export, onEmit, getState }`.

**HOST → frame** `{cmd}`: `setContext{units?,scts?,contribs?,meta?,warnings?,vessels?}` (merge host truth, **silent**) · `loadModel{model}` (replace authoring layer, **silent**) · `setVessels` / `setRasic` (silent) · `goto{substep}` (`'7.1'..'7.7'` or `vessels|rasic|roles|functions|meetings|org`) · `select{ref}` · `filter{spec}` · `setSkin{'workshop'|'deck'}` · `fullscreen{on?}` (needs `allow="fullscreen"`) · `export{format,scope?,requestId}` (deferred — replies `exportError` in the concept, per "no real exports yet").

**frame → HOST** `{evt}` — two tiers:
- **Authoritative:** `ready{api:1}` · `change{model}` (debounced; the persistence record; **silent on programmatic feeds**).
- **Granular intents** (host owns the mutation): `vessel{op:created|accepted|edited|rejected|merged, vessel, tempId?, into?, from?}` · `rasic{contribId,vesselId,letter,prev}` · `regenerate{target,vesselId,requestId}` (host derivation engine; editor shows the diff, never silent-overwrites) · `alg{vesselId,on}` · `warningAction{class,contribId,action}` · `select{ref}` · `goto{substep}` · `fullscreenchange{fullscreen}` · `exportReady`/`exportError`.

**Why two tiers:** `change` persists the authoring layer, but the host also owns truth the editor can't author — the **vessel registry / canonical ids** (`vessel`), the **warning RULES** (`rasic`+`warningAction` let the host recompute its `warnings[]` overlay), the **derivation engine** (`regenerate`), and the **canonical home of the algedonic right** (`alg`). Intents request those host-owned mutations; `change` follows once the editor's local model reflects them. New in-editor vessels emit `tempId:'local:<n>'` (the vsm.html convention); the host assigns a real id and reconciles via `setVessels`/`setContext`.

**Open questions are bracketed in the wire format** (see §4): vessel canonicity (host registry vs editor-local — wire is the same, only authority shifts) · RASIC scope (`contribId|vesselId`; coarser = fewer contribs, no wire change) · algedonic home (carried by `alg` regardless) · per-field provenance (`{value,src,lastDerived}` either side can own) · function-vs-unit identity · org chart derived-vs-editable (additive `reporting[]`+`setReporting` if it becomes editable) · merge/split rewiring (host-side, by stable id). Full spec generated by the bridge-design workflow; this section is the authoritative summary.

## 7. Next step (your call)
Decide the asset split in §3 and resolve the §4 ambiguities. The §6 bridge is a draft against the current model shape — once the open questions settle, it hardens into the production contract for whichever surfaces become front-end-owned (recommended: the RASIC+vessels editor first).
