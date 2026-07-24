# Step VII Reuse Graph — Handoff to Codex (host/data asks)

**From:** Claude (front-end lane) · **To:** Codex (host/domain lane)
**Companion:** [`STEP7-REUSE-GRAPH-UX-BRIEFING.md`](STEP7-REUSE-GRAPH-UX-BRIEFING.md) (the UX concept these asks support).
**Nature:** every item below is **additive** over today's wire and each has a **graceful degrade** — the front-end reuse UX renders and works (read-mostly) on the current bridge; each host addition simply lights up more of a band. **These are accept/push-back requests, not front-end faits accomplis.** I will not change `src/**`, persistence, ids, relationship tables, dedup, exports, or tests.

---

## Grounding facts (from the live `design-previews/step7-ux.html`)

- `step7Model()` (~line 1022) today emits `{ vessels, rasic, aspects, descriptions, membership, vesselAspects, meetings:{} }`. **`meetings` is an empty stub** — 7.6 charter authoring is *greenfield* host persistence, so everything below is net-new, not a table migration.
- Intent shape is flat: `emit(evt, extra) → {evt, ...extra}`. Precedents: `rasic{contribId,vesselId,letter,prev}`, `vessel{op,vessel,tempId}`, `membership{vesselId,meetingId,op}`, `aspect{sctId,kind,op}`. **All new intents follow this flat `{evt,...}` shape.**
- `setContext(c)` (~line 1031) already ingests `c.meta` (`meta.sif`), `c.units`, `c.scts`, `c.contribs`, `c.vessels`. Additive context keys attach here.
- Aspect item shape is `{id,text}` (`aspItemId()` → `ai-local-N`); the host already assigns canonical ids on reconcile. **The new definition pools reuse this exact shape.**
- New in-editor objects emit `tempId 'local:<n>'`; the host mints the real id and reconciles, exactly as it does for vessels today. This convention extends to `siteId` / `rightId` / `linkId`.

---

## The asks, ranked by blocking-ness

**Blocking for *any* charter authoring:** D8, D4, D2.
**Blocking for *full* reuse fidelity:** D1, D3, D6, D5.
**Hard cross-asset dependency:** D7 (loop ids).
**Cross-asset reconciliation (do once, don't fork):** cadence (D8) and participation SoT (D4) with the meeting-landscape asset.
**Merge/export:** D9. **Bridge hygiene:** D10.

---

### D1 · Reusable definition pools (context in)
Extend `setContext` with four canonical, **recursion-agnostic** registries, each `{id,text,…}` reusing the aspect `{id,text}` shape, plus a host-maintained `reuseCount`:

```
c.metricDefs:   [{id, text, unit?, reuseCount}]                   // "Decision cycle time" — DEFINITION only
c.artifactDefs: [{id, text, kind?, reuseCount}]                   // decision log, roadmap, audit report, dashboard, backlog, risk register, strategy one-pager
c.toolDefs:     [{id, text, producesArtifactDefId?, reuseCount}]  // Wardley Mapping →(produces) Wardley Map; OKR review; retrospective; audit walk; scenario planning
c.decisionDefs: [{id, text, reuseCount}]                          // optional canonical decision labels (may be empty)
```
These are the Suggested/Matches pool for the ranked picker in every band. `reuseCount` powers the faint *"used in N"* micro-tag; omit it and the front end hides that tag (no fabrication).
**Degrade:** if only `metricDefs` ships first, the artifact/tool/decision pickers seed their pool from existing 7.3 aspects already in ctx; within-session reuse still works, cross-meeting dedup is weaker until the real registries land.
**Push-back hook:** you may prefer ONE unified `{id,text,kind:'metric'|'artifact'|'tool'|'decision'}` registry — the front end accepts either; it needs only a stable id + text + a way to filter by kind.

### D2 · `measureUse` — definition vs local use *(open-q #10, flagship handoff)*
A NEW per-(charter, definition) record distinct from the definition. A definition is reused; each **use** carries its own target/frequency/source/owner.
```
Intent:  emit('measureUse', { meetingId, siteId:'local:<n>'|realId,
                              definitionRef:realId | tempDefinition:{text},
                              use:{ target, frequency, source, owner } })
         // use.source = an artifactDef id  OR  a free-text string (PO 2026-07-18: conception/workshop
         //              sources may be a free description, not a formal artifact — persist a string;
         //              upgrade to an artifactDef id if it later matches/creates one)
         // use.owner  = a participant VESSEL id already on this charter (never typed)
Model:   meetings[meetingId].metricUses: [ {siteId, definitionRef, target, frequency, source, owner} ]
```
Persist `metricUses` as their own table FK-linked to the definition; renaming the definition must **not** fork it (see D9). `tempDefinition` only when create-new fired; mint the def id AND the use id, reconcile both.
**Degrade:** if the wire stores metric as a plain string only, the four use fields still render but grey out with *"host stores name only — use fields pending"* — the front end will not fake persistence.

### D3 · `ioLink` — inputs/outputs reference an artifact **OR another meeting**
A directional link so the SAME object is an INPUT on one charter and an OUTPUT on another. **PO 2026-07-18: an input/output can also be another *meeting* — communication triggers communication** (a steering organ's output feeds the next organ). So the ref carries a `kind`.
```
Intent:  emit('ioLink', { meetingId, direction:'input'|'output',
                          ref:{ kind:'artifact'|'meeting', id:realId } | tempArtifact:{text,kind?},
                          isDecision?:true, decidesRef?:(sctContribId|artifactId) })
Model:   meetings[meetingId].inputs:[{linkId, kind:'artifact'|'meeting', ref}]
         meetings[meetingId].outputs:[{linkId, kind, ref, isDecision, decidesRef}]
```
A `kind:'meeting'` ref points at a meeting VESSEL id (reuse the existing vessel registry — no new object). A "decision" is an artifact-of-type-decision (`isDecision`) in `outputs` — **not** a separate table. Direction is purely which band the chip lands in. To offer an upstream OUTPUT as a one-click INPUT, expose per object *which meetings output it*; the meeting→meeting edges also let the host draw the communication chain.
**Degrade:** if only artifacts are supported first, meeting refs render as labelled chips and emit with `kind:'meeting'` but don't yet persist a typed edge; the cross-meeting index degrades the "output of X" suggestion, plain reuse still works.

### D4 · `participation` edge with `roleType` *(open-q #11 — MUST reconcile with meeting-landscape)*
A participation edge linking a meeting to a role/function VESSEL by stable id, carrying a `roleType` enum. **Distinct** from 7.4 `membership` (generic "sits in meeting"); charter participation additionally carries a steering role.
```
roleType: 'chair' | 'decisionOwner' | 'contributor' | 'consulted' | 'informed' | 'escalationOwner'
Intent:   emit('participation', { meetingId, vesselRef:vesselId, roleType,
                                  op:'add'|'setRole'|'remove', derivedFromRASIC?:true })
Model:    meetings[meetingId].participants:[{vesselRef, roleType, derivedFromRASIC}]
```
**CRITICAL RECONCILIATION:** the meeting-landscape asset already raised participations-vs-`membership` as a single-source-of-truth question. This edge and 7.4 `MEMBERSHIP` must be **ONE reconciled concept** in the host, not two divergent tables. **Please decide the SoT once; the front end binds to whichever you name.** Front-end pre-fills `roleType` from the RASIC letter (**A→decisionOwner, R→contributor, S→contributor, C→consulted, I→informed**; chair/escalationOwner are human choices) — the host stores the chosen `roleType`, it need not compute the default.
**Degrade:** if `roleType` can't be persisted, participants still store as a `vesselRef` list; the inline roleType selector renders but is marked non-persisted.

### D5 · `derivedFromRASIC` marker — honest ghost-vs-solid
An explicit boolean on host-proposed chips marking *derived-from-graph* vs *human-picked*. This is what lets a chip render **ghost** (unratified) vs **solid**.
- **(in)** proposed derived elements arrive in ctx / the `regenerate` feed carrying `derived:true`, so the charter opens pre-assembled with correct ghosts.
- **(out)** when the human ratifies a ghost, the `participation`/`measureUse`/… intent carries the pick, flipping it solid host-side.

**Degrade (the single agreed rule):** if you cannot tag derived-vs-authored, the front end treats **everything host-fed as ghost and everything locally-picked as solid** — correct, it just re-offers ratification on reload. (We do *not* drop pre-assembly.)

### D6 · `decisionRight` object — brand-new, no host table exists *(handoff (c))*
```
Shape:  { id, decision:(text|decisionDefRef), ownerVesselId, affectedRef:(sctContribId|artifactId) }
Intent: emit('decisionRight', { meetingId, rightId:'local:<n>'|realId,
                                decision:{ref?|text}, ownerVesselId, affectedRef,
                                op:'add'|'edit'|'remove' })
Model:  meetings[meetingId].decisionRights:[{rightId, decision, ownerVesselId, affectedRef}]
```
Owner defaults front-side to the chair/decisionOwner participant. A colliding second Accountable owner raises the front end's loud double-accountability warning (reusing 7.2 `.warn.loud`) — the host need not enforce, only persist. Codex owns persistence + dedup + export-to-design.
**Degrade:** if declined this round, band 7 renders read-only *"decision rights (pending host support)"* and emits nothing.

### D7 · `loopRef` + `escalationPath` — Step VI loop ids MUST match cross-asset *(HARD dependency)*
```
(a) setContext gains  c.loops:[{id, label, system, kind?}]   // id EXACTLY MATCHES channel ids used by
                                                             // channel-variety-check.html AND e2e-robustness-check.html
(b) Intent: emit('loopLink',       { meetingId, loopRef:loopId, relation:'supports'|'closes', op:'add'|'remove' })
    Intent: emit('escalationPath',  { meetingId, kind:'algedonic', targetVesselRef?, op:'add'|'remove' })
    Model:  meetings[meetingId].loopRefs:[{loopRef, relation}]
            meetings[meetingId].escalationPath:{kind:'algedonic', targetVesselRef}
```
Loops are **never created in 7.6** (create row suppressed) so the spine can't be forked. The committed chip carries the loop's system colour; *"also closed by X"* needs the host to expose which other meetings close a loop.
**Degrade:** if loop ids are absent or don't match cross-asset ids, band 8 degrades to a **labelled placeholder** (*"Step VI loops — link pending id sync"*) and emits nothing, rather than inventing ids. **This is the one precondition to verify up front**, not discover during integration.

### D8 · Meeting charter header — cadence, steered contributions + free agenda become host data
Promote the currently hardcoded front-end cadence map (line 825) and the steered-contributions set into the persisted charter, plus a **free-authored agenda** (PO 2026-07-18: the facilitator types the agenda as bullet points — authored text, not reuse chips).
```
Model on meetings[meetingId]:  name, cadence:{frequency, interval, duration},
                               scope:(unitId, default meta.sif), state:'candidate'|'accepted',
                               alg:boolean, contribs:[sctContribId],
                               agenda:string   // multi-line; each line a bullet — plain authored text
Intents:  emit('meeting', { meetingId, op:'setCadence', cadence:{...} })
          emit('meeting', { op:'steerContrib', meetingId, contribRef, add|remove })
          emit('meeting', { op:'setAgenda', meetingId, agenda })   // debounced; free text
          emit('meeting', { op:'setState'|'rename'|'setScope'|'toggleAlg', ... })
```
**`cadence` feeds the meeting-landscape asset — please reconcile ONE cadence shape shared between 7.6 and meeting-landscape (do not persist two).** Editing `contribs` re-derives ghosts front-side; the host just stores the set.
**Degrade:** if cadence stays a host-derived map, 7.6 renders it read-only and hides the cadence editor.

### D9 · Dedup / merge — which id survives, rewire by stable id
Merge that **rewires references by stable id** and works for **both** vessels AND the new definition objects (metric/artifact/tool/decisionRight), not vessel-only.
```
Intent:  emit('merge', { kind:'vessel'|'metricDef'|'artifactDef'|'toolDef'|'decisionRight', keepId, dropId })
```
`keepId` survives; every reference to `dropId` (RASIC cells, memberships, participations, metricUses, artifactLinks, decisionRights, loopRefs) rewires to `keepId`; **nothing is hard-deleted** (confirm-before-destroy + undo toast front-side; the front end shows *"N references move to the survivor"* but does not mutate the store). On `local:<n>` reconcile the host MAY flag *"≈ dup of Y"* for a passive later-cleanup badge.
**Push-back:** is reference-count-by-id cheap to expose? The front end wants it for the merge-review *"N references"* line; it degrades to hiding the count if not.

### D10 · `window.STEP7` bridge additions — strictly additive, `api:1 → api:2`
Handshake stays `emit('ready',{api:1})`; bump to `{api:2}` **only once these land**, so the host can feature-detect.
```
setContext NEW keys:  metricDefs, artifactDefs, toolDefs, decisionDefs, loops
                      (+ derived:true markers and reuseCount on def objects).
                      Existing keys (meta/units/scts/contribs/vessels) UNCHANGED.
step7Model() CHANGE:  meetings:{} stops being empty →
   meetings[meetingId] = { name, cadence, scope, state, alg, contribs, agenda,
                           participants, inputs, outputs,
                           metricUses, decisionRights, loopRefs, escalationPath }
   ( inputs/outputs each: [{linkId, kind:'artifact'|'meeting', ref, ...}] )
   Every existing model key (vessels, rasic, aspects, descriptions, membership, vesselAspects) UNCHANGED.
NEW intents (all flat {evt,...}):  measureUse, ioLink, participation, decisionRight,
                                   loopLink, escalationPath, meeting, merge.
UNCHANGED intents:  rasic, vessel, membership, aspect, select, goto, warningAction, regenerate, ready, change.
```
Because `meetings:{}` already ships and every addition is a new key / new evt, **a host on the current wire keeps working verbatim**; a host that has adopted the delta gets full charter persistence.

---

## PO gates (front end waits on these before wiring)

1. **Charter-first** — 7.6 is the sole proving ground this round; 7.1/7.2 layout untouched.
2. **Algedonic violet → magenta** — `.alg` at `design-previews/step7-ux.html:92` moves off `var(--violet)` to a new `--magenta`, freeing violet for from-the-graph provenance (also fixes a live code/brief discrepancy). Visual-only, no data impact.
3. **A charter is valid with only a header + one contribution** — no required-field blocks, no completeness %.

---

## Boundary note

Front end owns the picker/chip/autocomplete/merge-nudge interaction, layout, provenance rendering, empty states, and the fast-capture flow. Codex owns canonical ids, persistence, the relationship tables above, deduplication, migration, exports, and tests. Everything here degrades gracefully, so we can build and demo the charter UX (mockup: [`design-previews/step7-reuse-concept.html`](design-previews/step7-reuse-concept.html)) and port it into `step7-ux.html` incrementally as each host piece lands.
