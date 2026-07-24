# Org-Chart Hierarchy Editor — Rebriefing (Step VII · 7.7 v2)

**Date:** 2026-07-01 · **Status:** BRIEFING — awaiting PO go-ahead before implementation.
**Requirement (Mark):** 7.7 must become a **manual hierarchy editor**. Operative units stay as first-level boxes; beneath them the functions from 7.5 (which can nest further). Dragging a box **or a whole branch** to restructure must be easy — "a very human thing." Benchmark-grounded UX.

---

## 1. Scope answer: UX/UI or core?

**~95% UX/UI (my asset).** The editor — boxes, drag & drop, layout, undo — lives entirely in `org-chart.html`. It does **not** touch vessels, RASIC, warnings, or any host logic.

**The one host touch (small, additive, later):** an authored hierarchy is data. Codex persists **one new model field** (`hierarchy`) via the already-reserved-but-dormant `change{model}` event on `window.ORG`. Until wired, the asset persists it in its own localStorage — fully usable standalone.

---

## 2. Concept: *structure authored, accountability canonical*

7.7 v1 was a pure view that derived structure. v2 splits cleanly:

| | Authored (user, via editor) | Canonical (host, untouched) |
|---|---|---|
| What | Parent/child + sibling order of boxes | Vessels, units, SCTs, RASIC, warnings |
| Where | `hierarchy: { nodeId: { parent, order } }` | Fed via `setContext`/`loadModel` as today |
| Rule | Arrange **existing** vessels only | The editor never invents or edits a vessel; "new box" routes through vessel creation (7.1 pattern → `vessel{op:'created'}` intent) |

Honesty layer unchanged: headline, badges, verbatim warnings, S3★ — badges follow a box wherever it is dragged. **A drag can never silence a warning.**

**Tree semantics:** SIF → **operative units** (level 1, from Step I — draggable *within* the chart but not deletable) → **functions** (7.5 capability containers; functions may nest into functions) → **roles** (attach to units or functions). Meetings stay an overlay, not tree nodes. Type rules: a role is always a leaf.

**Seeded default, human-owned result** (house pattern "suggest, never assert"): first open derives a starting tree — functions under their scoped unit, metasystem functions under the SIF, roles under their unit. The user refines manually from there; the seed never re-runs over an edited tree. An **Unassigned tray** holds unplaced vessels — nothing is forced into the chart, and removing a box from the chart returns it to the tray (never deletes the vessel).

---

## 3. Interaction spec (benchmark-grounded)

North star from the research: **Notion's drag vocabulary at Pingboard scale, with Lucidchart's instant auto-layout underneath.** Key patterns (full digest in the research output):

1. **Two-signal drop vocabulary** *(Atlassian hitbox; Notion; Finder)* — each box has a three-zone hitbox: outer 25% edges = **insert as sibling** (2px insertion line with terminal dot in the gap), middle 50% = **become child** (border/fill tint over the whole card). Line = reorder, fill = nest — never mixed.
2. **Branch-move is the default** *(all org tools)* — mousedown + 4–5px threshold lifts the box; a branch collapses to **one chip with a "+N" badge** as the drag ghost (source stays at 40% opacity). "Move alone" is a visible on-drop choice, not a hidden modifier chord.
3. **Instant auto-layout with tween** *(Lucidchart; anti-Visio)* — the tree is the data model, the SVG is derived. Every drop recomputes the tidy-tree layout and tweens boxes + connectors ~300ms. Static indicators *during* the drag; animation only after commit.
4. **Atlassian's feedback constants** — grab/grabbing cursors; 350ms target tint (legal targets only); **700ms post-drop flash** + pan-into-view; Esc/illegal-release = ghost snaps back. Hand-built pointer-events ghost — never the native HTML5 drag API.
5. **Cycle prevention, visibly** — descendants of the dragged branch dim for the whole drag; hovering one shows a blocked indicator + not-allowed cursor. Validate live, never post-hoc.
6. **Spring-loaded expand** — hovering a collapsed box 500ms auto-expands it (Space = expand now). After a drop: auto-expand ancestors + pan so the moved box is visible.
7. **Every drag has a click/menu twin** *(WCAG 2.2 SC 2.5.7 — drag-only is a formal failure)* — per-box "…" menu: Move up/down · Promote · Demote · **Move to…** (type-ahead picker, illegal targets filtered). Doubles as the deliberate, narratable mode for the projector.
8. **One `move()` command with stored inverses** — drag, menu, picker, keyboard all call the same `move(nodeId, parent, index)`; unlimited undo/redo (Ctrl+Z + visible buttons + snackbar "Moved Dispatch (+4) under Logistics — Undo"). **No confirmation on moves** (invertible); the single confirm is deleting a non-empty branch, restating counts.
9. **Scratch-building** *(draw.io / SmartArt)* — selected box shows directional **+ buttons** (below = child, right = sibling); keyboard mirror Enter / Tab / Shift+Tab (sibling / demote / promote). Inline name edit on create.
10. **Collapse with count badge + "collapse to level N"** — persistent ± toggle, hidden-descendant count, and a view control (e.g. "units only") for projection focus.
11. **Manual sibling order is durable** *(Pingboard)* — order carries meaning in VSM (value-stream order of S1 units); auto-layout never re-sorts; "reset order" is an explicit command.
12. **Edge auto-pan** while dragging (~30px band, proximity+time-ramped speed) — long-distance re-parenting in one gesture.
13. **ARIA treeview + live-region announcements** — roving tabindex, arrow-key navigation, "Dispatch moved under Logistics, position 2 of 3, from Fleet".
14. **Projector-sized affordances** — ≥24px controls, visible on selection/focus (never hover-only), saturated highlights, no rotated ghosts.

Top anti-patterns to avoid (full list in digest): deferred re-layout (Visio), one undifferentiated drop signal, hidden modifier chords, full-height branch ghosts, native HTML5 DnD, live reflow during drag, silent illegal drops, confirmations on moves, hover-only micro-affordances, forced auto-sorting, free-canvas drawing where hierarchy is only implied.

---

## 4. Modes & migration

- **Levels** becomes the **editing surface** (the hierarchy editor described above — it grows real depth: units → functions → sub-functions → roles).
- **Nested + Cabinet** stay **read-only projections** of the authored tree (Nested renders the same hierarchy as containment; Cabinet unchanged).
- Recursion unfold, overlays, Plain⇄Expert, tour, export: unchanged. Export renders the authored tree (still watermark + gap-count).

## 5. Bridge deltas (additive)

- `change{model}` **comes alive**: debounced, carries `{ hierarchy }` (authored data only). Codex persists it.
- `loadModel`/`setContext` accept optional `hierarchy` back (host truth in, silent).
- New intents: `hierarchy{op:'move', nodeId, parent, index}` (granular, after each commit) · existing `vessel{op:'created'}` for new boxes.
- Everything else unchanged; absent `hierarchy` → the seeded default.

## 6. Decisions (PO, 2026-07-01)

1. **Hierarchy is CANONICAL** — not presentation-level. The authored parent/child structure (incl. function-in-function nesting) is domain truth; Codex persists it as a real containment relation, not layout metadata. The bridge shape is unchanged (`change{model}` carries `hierarchy`); only its status is elevated — it feeds reports/exports and may later inform warning rules.
2. **Roles: rendering is a view toggle, data identical** — a role's parent is always in the canonical hierarchy; the chart offers "Roles: chips · cards · hidden" (default **chips** — shallow, scales; **cards** for presenting role-level accountability). Role badges bubble onto the parent box in chip mode, sit on the role card in card mode.
3. **Units: fully draggable — reorder AND re-parent.** A unit may be nested under another unit (nested viable systems). ⚠ Codex reconciliation note: unit re-parenting expresses recursion structure, which Step I owns — the host must decide whether a 7.7 unit move writes back to Step I or flags a divergence. The asset emits it as a normal `hierarchy{op:'move'}` intent either way.
4. **Scenario variants: later** — one authored hierarchy per SIF for v1.

## 7. Implementation plan (on go-ahead)

1. Hierarchy model + seeded derivation + Unassigned tray + tidy-tree layout with tween (replaces the static Levels renderer).
2. Drag engine: pointer-events state machine, three-zone hitbox, chip ghost, dim/blocked, spring-expand, auto-pan, snap-back.
3. `move()` command + undo/redo + snackbar; "…" menu + Move-to picker; +buttons + Enter/Tab/Shift+Tab.
4. Bridge deltas + localStorage persistence; Nested/Cabinet read the authored tree.
5. Playwright specs (drop-zone semantics, cycle guard, branch move, undo, seed-once, order durability) + live verification both skins.

Est. one focused build pass, same footprint discipline as v1. No Codex files touched; Codex's persistence task is one field + round-trip.
