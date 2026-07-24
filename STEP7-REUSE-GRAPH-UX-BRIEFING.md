# Step VII — Reuse-Graph UX · Concept Briefing

**Status:** UX concept (front-end-owned). Not a persistence contract.
**Companion docs:** [`STEP7-REPRESENTATION-BRIEFING.md`](STEP7-REPRESENTATION-BRIEFING.md) §3a/§3b (the standing R0/SIF + reuse-graph contracts) · [`STEP7-REUSE-GRAPH-HANDOFF.md`](STEP7-REUSE-GRAPH-HANDOFF.md) (the additive host asks D1–D10).
**Interactive mockup:** [`design-previews/step7-reuse-concept.html`](design-previews/step7-reuse-concept.html) — click-through of the editable meeting charter.
**Target surface (build):** `design-previews/step7-ux.html`, replacing the read-only `viewMeetings()` (~line 800).
**Method:** produced by a design workflow — 5 whole-concept proposals from distinct interaction philosophies → adversarial judge panel → synthesis (winner `inline-chip-inspector`, 21/25, grafted with the best of the other four) → deep-design of the flagship surfaces → a completeness critic whose findings are resolved in §11.

---

## 1. TL;DR

Step VII stops being seven islands of free text and becomes **one reuse graph over the SCT→contribution→RASIC→vessel spine**. The whole thing is carried by **one interaction primitive** — a ranked reuse picker whose *create-new row is physically last* — and **one chip grammar** that shows provenance in two independently-readable channels. The **editable meeting charter (7.6)** is the flagship, because a single meeting touches all seven reuse dimensions at once.

> **The Reuse Inspector.** 7.6 becomes a **list + inspector twin of the 7.2 RASIC matrix**: pick a meeting on the left, its charter opens on the right *already assembled* from the graph as **ghost chips** the facilitator ratifies. Every reference is added through one anchored ranked picker whose create-new row is forced dead-last behind existing matches — so **"reuse first" is the physics of the layout, not a warning.**

Why this shape wins: it reuses the exact idiom (list+inspector, chips, filters, sticky scope) a facilitator already learned in 7.1/7.2, so there is nothing new to teach; and it never invents a foreign paradigm (no command-line spine, no shell-wide two-pane inversion, no completeness gauge).

---

## 2. The one primitive — the Ranked Reuse Picker

**One component, all seven dimensions, both skins.** An anchored popover (~300px, *not* a modal — it reuses the same float mechanics as the 7.2 header hover-peek and the 7.1 add-vessel dupe hint; dismiss on Esc / outside-click). It is spawned by a dashed **"+ ‹verb›"** ghost pill at the tail of every chip row (`.rail`).

**Fixed vertical order — load-bearing, identical everywhere:**

1. **Search** — autofocused input, placeholder *"Reuse or create…"*, a right-edge `Scope: R0 ▾` micro-chip mirroring the top control.
2. **Suggested** — 3–6 existing entries ranked by **graph proximity to *this* charter** (e.g. roles already RASIC-linked to the meeting's contributions float top, tagged *"from RASIC"*; an upstream meeting's **output artifact** is offered as a one-click **input** here). Each row = glyph · name · provenance micro-tag · faint *"used in N"*.
3. **Matches** — live fuzzy filter over the full canonical pool as you type.
4. A thin rule, a **"no existing match"** line, then a single de-emphasised dashed **"＋ Create new '‹typed›'"** row that only appears *after* the typed text fails to match.

**Keyboard:** `↑/↓` move · **`Enter` picks the top existing match — never create** (you must arrow past every match to reach the create row) · `Tab` accept-and-jump-to-next-band · `Shift+Enter` keep-open-add-several · `Cmd/Ctrl+Enter` force-create · `Esc` close.

**Two rules that make reuse structural, not advisory:**

- **Create is dead-last, always.** The keypress that feels fast (`Enter`) always reuses; creating is a deliberate reach. This is the single idea all five judges said *must* survive.
- **A reference chip has no editable text field — ever.** The chip carries the object's **stable id** in `data-ref` and renders a **host-resolved label**. Rename or merge upstream and every chip reflows. This enforces *ids over names* at the widget level.

Every commit fires **one granular intent** (`participation` / `measureUse` / `artifactLink` / `decisionRight` / `loopLink` / …, each `{meetingId, ref:<stableId>, tempId?}`) plus the debounced `change{model}`. Nothing is persisted client-side.

---

## 3. Provenance — two orthogonal channels, never one overloaded chip

The judges unanimously killed the naïve "five provenance kinds on four colours." Provenance is split into **two channels a facilitator decodes independently**, even across a projected room.

### Channel A — Ratification (opacity + outline only, *zero colour spent*)
- **GHOST** = derived by the graph, not yet touched → `opacity:.62`, 1px **dashed** outline, a muted `↵` glyph at the right edge.
- **SOLID** = a human picked / confirmed / authored it → full opacity, 1px solid outline, no `↵`.
- Confirming a ghost is one keystroke (`Enter` on it). This carries *"no automatic org-truth until a human ratifies"* with no colour and **no completeness bar**.

### Channel B — Origin (a 3px left **stripe** + a real `.tag` token + a one-word micro-tag)
Five brief kinds collapse to **three colour-blind-safe families**, each also distinguished by **stripe dash-pattern** so it survives colour-blindness and peripheral reading:

| Family | Colour | Stripe | `.tag` | Micro-tag words | Covers |
|---|---|---|---|---|---|
| **From the graph** | `--violet` on `--violet-soft` | **solid** | `.tag.derived` | `from SCT` · `RASIC · A on c3` | inherited-from-SCT **and** derived-from-RASIC |
| **Added here** | `--amber` on `--amber-soft` | **dashed** | `.tag.cand` | `on this meeting` · `on this role` | meeting-specific + role-specific |
| **Authored** | `--teal` on `--teal-soft` | **dotted** | `.tag.human` | `typed here` | the *only* origin the create path can mint |

**Decode axes are redundant** — {hue, `.tag` token, stripe dash-pattern, text word} — so origin is legible four ways.

**Reserved / banned (load-bearing):**
- `--blue` is **banned from provenance** — it is the surface's *active/selected* affordance (`.btn.primary`, `.seg2.on`, `.substep-button.is-active`). A blue chip reads as "selected."
- **Chip-body fill stays reserved for VSM system-from-SCT** (`.sys.S1…S5`). Origin lives on the *stripe*, system lives in the *fill*; they never collide.
- `--violet` is freed for from-the-graph provenance by **moving algedonic off violet onto a new `--magenta`** — see the PO gate in §12.

Hover gives the full one-sentence lineage ("Derived because Audit Lead is Supporting on SCT-004 in the 7.2 matrix."). Every chip pairs colour with a text micro-tag for accessibility.

---

## 4. Definition vs Use (the KPI rule, generalised)

A reusable **definition** and a local **use** are **two distinct chip shapes** so the reusable noun and its local reading can never be confused:

- A **definition** ("Decision cycle time") lives only in the shared 7.3 metric pool. In a picker it is a **fully-round pill** with a small `def` corner-mark and a *"used with N targets elsewhere"* reuse signal. It has no target/frequency/source/owner, and **its wording is not editable inside a meeting** — a rename attempt warns *"This renames the shared metric used in N places"* and routes to a host rename/merge intent, never a silent fork.
- A **use** lives on the charter. Picking a definition does **not copy** it — it mints a local use and **inflates an inline four-field use-editor docked in the chip well** (an accordion, not a modal): **target** (free text, e.g. `< 10 days`), **frequency** (defaults to the meeting's cadence, so usually zero edits), **source** (a nested artifact pick — the source is itself a reused artifact chip, e.g. *decision log*), **owner** (a nested participant pick — a role already on this meeting, by id). The result is a **rectangular chip** reading *"Decision cycle time · <10d · monthly · decision log"* with the from-graph violet stripe **plus** a small amber *"· target authored"* sub-tag marking the reused-definition / authored-use seam.

The same definition dropped on another meeting mints its own independent use. This is the near-unanimous best-realised expression of the PO's *"reusable definition, local use"* rule.

---

## 5. The editable meeting charter (7.6) — flagship

**Layout = list + inspector, the deliberate twin of 7.2.** A facilitator who learned RASIC already knows this screen.

- **LEFT — meeting list** (`.list` of `.lirow`, R0/SIF-scoped through the *same* `scopeFilter()` control the whole surface ships — no separate selector). Each row: name · cadence chip · a subtle **origin-blend stripe** hinting the charter's reuse character (violet = mostly-from-graph, amber = mostly-added-here, teal = mostly-authored, grey = empty). A dashed **"+ new meeting"** row sits last. A small **search/sort** header appears once there are enough meetings to need it.
- **RIGHT — the charter sheet** (`.charter` card, extended). **The current read-only card *is* the collapsed state; expanding a band *is* the editor — no mode switch, no Save.** It opens **pre-assembled**: every derivable element is already a **ghost chip**; the verbs are **Accept / Swap / Add / Remove**.

**Header**
- **Name** — a plain editable text input (authored; no provenance stripe).
- **Scope badge** — pinned `R0 · SIF`, clicking routes to the top Scope control (never a competing selector).
- **Cadence editor** — frequency · interval · duration, replacing the old hardcoded map; **feeds the meeting-landscape asset** (one shared cadence shape — handoff D8). Ghost-styled until a human touches it.
- **Algedonic** `▲` toggle (magenta) · candidate/accepted state chip.

**Bands** — each a native `<details>` (keyboard/aria for free), summary shows *glyph · label · hotkey badge · faint count*, body is a `.rail` of chips ending in the add pill:

| # | Band | Glyph · hotkey | What reuses in | Chip |
|---|---|---|---|---|
| 1 | **Steering** (SCT contributions) | ◆ · `s` | the spine root; Suggested = contributions already RASIC-linked | from-graph, `.sys` fill |
| 2 | **Participants** (roles/functions) | ◐ · `p` | role/function vessels; Suggested = RASIC-linked roles | from-graph ghost, **roleType** control |
| — | **Agenda** | ≡ · `a` | *not a reuse rail* — a **free-authored bulleted text field** (Enter starts a new bullet); authored provenance | textarea, dotted-teal stripe |
| 3 | **Inputs** | ▽ · `i` | artifact registry **and other meetings** — *communication triggers communication*; Suggested cross-links **upstream outputs** | artifact **or** `⟲ meeting` chip, `dir:input` |
| 4 | **Outputs & Decisions** | △ · `o` | same pool, `dir:output`; a decision is an artifact-of-type-decision; an output can be **another meeting it triggers** | artifact **or** `⟲ meeting` chip |
| 5 | **Tools / methods** | ⚙ · `t` | method registry; a tool carries *"→ produces"* → one-click cross-add its artifact to Outputs (confirm-first) | tool chip |
| 6 | **Measures** (KPIs) | ◷ · `m` | 7.3 definition pool → local **use** (§4); the use's **source is free-text** (or a picked artifact) | def→use two-shape |
| 7 | **Decision rights** | ⚖ · `d` | compound `{decision · owner · affected}`; ghost from a single RASIC `A` | compound chip |
| 8 | **Step VI loops** | ↺ · `l` | loops from `setContext` — **never created here**; tagged supports/closes | loop chip, stripe = loop's system colour |
| 9 | **Escalation / algedonic** | ▲ · `Shift+A` | a distinct magenta path (source → S5/target) | magenta chip |

Three fields are **freely authored, not reuse chips** (PO feedback 2026-07-18): the **Agenda** (a bullet-point text field — "communication is drafted, not just wired"), and, inside a Measures **use**, the **source/description** (during conception/workshop you may not have a formal artifact yet, so it's a free text input with existing artifacts offered as datalist suggestions). Both wear the *authored* (teal) treatment. And **Inputs/Outputs are not artifact-only** — a meeting can be the input or output of another meeting, so a steering organ can trigger or be triggered by another (the chip shows a `⟲ meeting` marker).

Editing **band 1** re-derives ghosts in bands 2/3/6 — **but only unratified (ghost) chips; solid human decisions are never silently overwritten.**

**Regeneration glass wall (degraded to stay in-boundary):** upstream changes never silently rewrite. A quiet *"graph moved · N changes"* ribbon (neutral panel styling, **not** blue) offers **Review → a diff of accept/reject lines**. The front end does **not** hard-depend on host per-field locking — it degrades to a **whole-chip lock** (solid chips excluded from auto-apply, ghosts eligible).

---

## 6. Reuse across all seven dimensions

All seven ride the **one** picker; only `{pool, accent, one specialisation}` differ, so nothing is re-learned.

| Dimension | Pool lives | Specialisation | Def/Use? |
|---|---|---|---|
| **Participants** | role/function vessels | inline **roleType** pre-filled from RASIC | — |
| **Role/function descriptions** (7.4/7.5) | inherited-from-SCT aspects + vessel-specific | Suggested ranked by the vessel's own RASIC links | KPIs yes |
| **KPIs / metrics** | 7.3 definition pool (canonical) | promote `kpiSuggestionValues()` from datalist → ranked list | **yes** (§4) |
| **Artifacts / result types** | shared registry (`{id,text}`) | Suggested cross-links **upstream output → input**; direction = which band | no (direction is positional) |
| **Tools / methods** | method registry | *"→ produces"* one-click cross-add of the artifact | no |
| **Decision rights** | net-new object | 3-slot inline mini-composer (decision → owner → affected), breadcrumb + Esc-to-abort | no |
| **Step VI loops** | `ctx.loops` (from Step VI) | create suppressed ("loops come from Step VI"); supports/closes; "also closed by X" | no |

---

## 7. R0/SIF stays the default lens — as ranking, never a hard filter

Enforced at three points, all reusing the existing `scopeFilter()` / `sifScopeUnitIds()` control (one Scope control, no separate accountable-unit selector, per the in-force contract):

1. **Pools are scoped** — every picker's Suggested/Matches default to R0/SIF entries. Recursion-agnostic nouns (KPI defs, artifacts, tools, decision rights) always show; only **vessels and loops** carry recursion scope, and other-level entries sit below an explicit *"reuse from another scope (R-1/R+1…)"* fold.
2. **The meeting list** is R0/SIF-scoped via the same select.
3. **Derivation respects the lens** — ghost pre-fill only pulls contributions/participants within the current scope.

**Cross-level reuse is allowed but always labelled** — an R-1 role picked onto an R0 charter keeps an `R-1` level badge on its stripe. Repeated SCT rows across levels are expected and correct (RASIC is per-contribution). Changing lens re-ranks and switches band 1's pool; **the model is never mutated** (default + re-rank, never delete R-1/R+1 rows).

---

## 8. The fast-capture flow (the <10s live test)

Add a reused participant **and** a reused KPI-with-local-target to an open charter — zero mouse, no modal, no page jump (the existing scroll-preservation contract applies).

- **Reused participant (~4s):** press `p` → picker opens, Suggested already lists the RASIC-linked roles. Type `aud` → **Audit Lead** is the top match (from-graph, *"RASIC · S on c7"*). `Enter` → chip lands **solid** (an explicit pick is a ratification), roleType pre-filled from RASIC (S→contributor). *Faster still:* if Audit Lead already sat as a ghost from derivation, just `Enter` on the ghost — no picker.
- **Reused KPI with local target (~5s):** press `m` → Suggested shows definitions inherited from the meeting's SCTs. Type `cycle` → **Decision cycle time** (def corner-mark, *"used 4×"*). `Enter` picks it; the use-editor auto-opens with **target** focused. Type `<10d`; frequency already defaults to the cadence; `Enter` commits and collapses.

**≈9s, two canonical objects reused, zero duplicates, both provenance-stamped.** The rhythm — *hotkey · filter · Enter · [inline tweak] · Enter* — is **identical in every dimension**; `Tab` instead of `Enter` accept-and-jumps to the next band, so a fresh charter fills in one continuous type-Tab-type-Tab pass. A quiet keyboard-hint strip (*"↵ reuse top match · ⇥ next slot · ↓↓ create new"*) teaches it without clutter. **Keyboard is the accelerator, never the only path** — every picker is fully operable with plain Tab/arrow/typing + aria roles, and drag is a first-class fallback for touch/projector.

---

## 9. Empty & merge states

**Empty** (three levels, all quiet, none red, no completeness %):
1. **Empty band** — just its add pill + one muted hint naming the reuse *source and count*: *"+ participant · none yet — 3 roles are Accountable/Responsible on this meeting's SCTs"* (those 3 sit as ghosts ready to confirm). Under derive-then-refine most bands are never truly empty.
2. **Empty pool** (fresh org, genuinely nothing to reuse) — the picker drops Suggested/Matches and **promotes the create row to primary** with *"No artifacts exist yet — the first one you name becomes reusable everywhere."* The one moment creation is foregrounded, stated plainly so it is not a dead end.
3. **Zero search results** — a single *"no existing match"* line **above** the create row, so reuse is visibly checked before creation is offered.

**Merge / dedup** (non-blocking; host owns the rewire, front end only nudges + emits intents):
- **At create time (front line):** generalise the existing `vesselDupes()` / `updateDupeHint()` fuzzy heuristic (exact / substring / shared ≥4-char word) to **every** pool; as you type toward create, a slim amber `.dupewarn` strip surfaces above the create row — *"Looks like ‹existing› — reuse it?"* — the existing entry one `Enter` away. Most duplicates die here, at the keystroke.
- **Deliberate merge** stays a **separate, gated action outside the live charter flow** (never a mid-edit modal, never a reference-count table on the workshop screen — that would be the database-editor the rules forbid). It emits `merge{kind,keepId,dropId}`; the host rewires by id, nothing is hard-deleted, confirm-before-destroy + undo toast.

---

## 10. What the graph gives you for free (the reuse payoff)

Because it all hangs off the spine, the charter arrives *mostly filled*:
- **Participants** derive from the RASIC letters on the meeting's steered contributions, roleType pre-typed.
- **Inputs** can be an **upstream meeting's outputs** on the same Step VI loop — one click.
- **Measures** Suggested = the KPI definitions already attached to the meeting's SCTs in 7.3.
- **Decision rights** ghost-derive where a single Accountable exists.
- **Loops** Suggested = the loop already named in the meeting-vessel's provenance string.

The facilitator's job shrinks from *authoring* to *ratifying* — the point of derive-then-refine.

---

## 11. Resolved design decisions (the critic's seams, closed)

The completeness critic found real sharp edges. These are the build-time resolutions:

1. **Hotkey guard must catch `contenteditable`.** The single-letter slot hotkeys (`p/m/i/o/d/t/l/s`) fire only when no field is active. The meeting **name is a plain `<input>`** (not `contenteditable`), and the guard checks `input|textarea|select` **and** `e.target.isContentEditable`. `f` (global fullscreen) is **suppressed while the charter is focused** to free `f` semantics.
2. **`S` (Support) → `contributor`.** The roleType pre-fill is **A→decision owner, R→contributor, S→contributor, C→consulted, I→informed**; chair and escalation-owner are human-only choices. (Fixes the fast-path example that used an unmapped `S`.)
3. **One ghost-degrade rule.** If the host cannot mark derived-vs-authored: **everything host-fed renders as ghost, everything locally-picked renders as solid.** Derive-then-refine still works; a reload simply re-offers ratification. (We do **not** drop pre-assembly.)
4. **roleType is not an inline 6-segment control** (it will not fit a 28px chip). The chip shows the current roleType as a compact caret pill (*"contributor ▾"*); clicking/`Enter` opens a small 6-option popover reusing the picker mechanics.
5. **Committed compound chips are editable in place.** Re-opening a decision-right chip re-enters its 3-slot composer; an artifact chip can flip input↔output; a loop chip can switch supports↔closes — all without delete-and-re-add.
6. **Double-accountability at open** (the common seed case): the decision-rights band shows **both** A-owners as ghosts **plus** the loud `.warn.loud` banner — it never auto-picks one owner. Warnings invite, never block.
7. **Fast mis-pick undo.** `Cmd/Ctrl+Z` removes the last committed chip (a session undo stack over the granular intents); a just-added chip also shows a brief inline undo. The fast-commit path gets an equally-fast recovery.
8. **Tools is a first-class band** (band 5) with its own empty state and count — not an uncounted sub-band.
9. **The origin-blend stripe is not a completeness score.** It encodes only the *dominant origin family* as a subtle hue; there is no "% authored" readout, no ordering by it, no shaming copy. If it ever reads as a maturity gauge in testing, it is the first thing removed.
10. **The "graph moved" ribbon is neutral, not blue** (blue = selected on this surface); it uses panel styling with a small violet "graph" dot.
11. **Nested pickers are optional, not required steps.** For a KPI use, owner defaults to the chair and source is skippable, so the common path is *target only* — `Enter` at any point commits with defaults. The decision-rights composer likewise defaults the owner to the chair/decision-owner. This caps the nested-popover depth that the judges flagged.
12. **Loop-id parity is a precondition, not a discovery.** Band 8 requires `ctx.loops` ids to equal the channel ids used by `channel-variety-check.html` / `e2e-robustness-check.html`; absent that, the band degrades to a labelled placeholder rather than inventing ids (handoff D7).
13. **Participation vs membership is reconciled *once* before any participation intent ships** — see the #1 blocking handoff (D4); today `MEMBERSHIP` is already live and persisted, so a second participant-linking concept must not fork "who is in a meeting" on day one.

---

## 12. Scope, rollout, and what we build now

**Ship charter-first.** 7.6 is the sole proving ground this round; **7.1 and 7.2 layout are untouched** — proving the pattern on the richest single screen keeps the change small and reviewable before it generalises. (`step7-ux.html` is Claude-owned; the host only embeds it via an iframe and controls its `?v=` cache label.) The same primitive later generalises to the 7.4/7.5 aspect rails with zero new concepts.

**Build order:**
1. **The mockup** (`design-previews/step7-reuse-concept.html`) — done, for PO reaction. It demonstrates the charter, the ranked picker, provenance chips, ghost/solid, def→use, roleType, and the fast path against sample data.
2. **On PO + Codex sign-off**, port the primitive into `step7-ux.html`'s `viewMeetings()` against the additive bridge, degrading gracefully on every field the host hasn't landed yet (the charter works read-mostly on the current wire; each host addition lights up a band).

**The reuse UX degrades gracefully at every step** — nothing here hard-requires the host to move before it renders; missing host support greys the affected fields with an honest *"pending"* note rather than faking persistence.

---

## 13. PO gates + handoff pointer

**Three PO decisions gate the round** (see `STEP7-REUSE-GRAPH-HANDOFF.md` for the full asks):
1. **Confirm charter-first** — 7.6 only this round, 7.1/7.2 layout untouched.
2. **Confirm algedonic moves violet → magenta** (`.alg` at `step7-ux.html:92`). Required to free `--violet` for from-the-graph provenance; also fixes a live code/brief discrepancy (the brief says algedonic is magenta, the code binds it to violet).
3. **Sign off that a charter is valid with only a header + one contribution** — no required-field blocks, no completeness %.

**The additive host contract** (definition/use tables, participation-with-roleType reconciled with meeting-landscape, decision-right object, artifact links, loop-id parity, cadence-as-host-data, merge-by-id) is written up as **D1–D10** in [`STEP7-REUSE-GRAPH-HANDOFF.md`](STEP7-REUSE-GRAPH-HANDOFF.md). All are additive over today's `meetings:{}` stub and gated behind an `api:1→api:2` feature bump, so a host on the current wire keeps working verbatim.

---

## Appendix · Chip & token cheat-sheet (for the builder)

```
/* Channel A — ratification (opacity + outline only) */
.chip.ghost{opacity:.62;border:1px dashed var(--line-strong)}   /* + right-edge ↵ glyph */
.chip.solid{opacity:1;border:1px solid var(--line)}

/* Channel B — origin (3px left stripe + .tag token + one-word micro-tag) */
.chip.o-graph{border-left:3px solid  var(--violet)}   /* from SCT / RASIC · A on c3 → .tag.derived */
.chip.o-here {border-left:3px dashed var(--amber)}    /* on this meeting/role     → .tag.cand    */
.chip.o-auth {border-left:3px dotted var(--teal)}     /* typed here               → .tag.human   */
.chip[data-orig]{overflow:hidden;padding-left:9px}

/* def vs use shapes */
.def{border-radius:999px}                              /* pill, in pickers only, "def" corner-mark */
.use{border-radius:8px}                                /* rectangular, on the charter              */

/* new token — frees --violet for provenance */
:root{--magenta:#c8489e}  body[data-skin="deck"]{--magenta:#e070c0}
.alg{color:var(--magenta)}                             /* was var(--violet) at line 92 */

/* BANNED for provenance: --blue (it is the active/selected affordance) */
/* RESERVED: chip-body fill = VSM system-from-SCT (.sys.S1..S5) only */
```

New CSS classes: `.ch-band`(`<details>`) · `.rail` · `.picker`+`.pk-sug`/`.pk-match`/`.pk-create`/`.pk-crumb` · `.hk` (hotkey badge) · `.scopechip` · `.use-ed` (KPI use accordion) · `.regen` (glass-wall ribbon, neutral) · `.lirow.mix` (origin-blend). New JS: `viewMeetings()` rewrite · `renderCharter()` · `charterBands()` · `deriveGhosts()` (scope-respecting) · `openPicker()`/`pickerRows()`/`pickerKeydown()` · `mintMeasureUse()`/`renderUseEditor()` · `decisionComposer()` · `roleTypeFromRasic()`. Reuse verbatim: `.charter`/`.list`/`.lirow`/`.chip`/`.seg2`/`.dupewarn`/`.warn.loud`/`.diff-add|rm`/`.empty`/`.hint`, `scopeFilter()`, `kpiSuggestionValues()`, `vesselDupes()`, `rg()`, `emit()`.
