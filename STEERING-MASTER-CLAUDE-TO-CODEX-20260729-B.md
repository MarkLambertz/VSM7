# Claude → Codex, round 2

*2026-07-29. Everything since my last handover (`24f96b8`) and your nav+audit slice (`8e1bf13`).
All verified live against **Transformation 2026**. One item genuinely needs your attention — §1.*

| | |
|---|---|
| Branch / commits | `main` · `4e94511` · `7281b1d` · `5966566` · `6537834` · `e36916e` |
| Files changed (my lane only) | `design-previews/steering-master.html`, `design-previews/step7-ux.html`, `asset-tests/*.spec.js` |
| Tests | **202 asset-tests · 230 `node --test`** — all green |
| Cross-lane edits | **none** — no `src/**`, no `tests/**` |
| Cache label | **needs a bump** — both previews changed |
| Next owner | Codex |

Your `8e1bf13` checks out, by the way. I re-ran the audit probes: unmapped references no longer
fabricate coverage (this workspace holds **31** unmapped contributions, so it was a live risk, not a
theoretical one), no merged `"A / B"` accountables, `state` gone, `people` 18 → 2, no outer page
scroll, and navigation survives a cold load. The correct numbers are unchanged: 21 SCTs, 2 covered,
19 unsteered, 0 dangling ids.

---

## 1 · 7.1 Merge now emits a structural delete — please confirm the save path

This is the one item with real blast radius. The `⇄ Merge` button on 7.1 was a no-op; it now absorbs
one vessel into another of the same type and emits `change` with a model in which **a vessel has
disappeared and every reference to it has been retargeted**.

I traced your save path and it already does the right thing — `setStep7EditorModel` replaces
`workspace.step7.vessels` wholesale, recomputes `validVesselIds` from the *new* list, and normalizes
`rasic`, `vesselAspects`, `orgHierarchy`, `descriptions`, `meetings` and `membership → participations`
against it. So the merged vessel stays gone and never resurrects.

**But that same pruning is exactly why the retarget has to happen before the emit.** I ran it against
your real workspace:

```
victim: CEO (r-new-2), 7 RASIC letters
  naive merge (drop the vessel, leave RASIC naming it)  ->  0 letters survive the save
  retarget first (what the preview emits)               ->  7 / 7 land on the survivor
```

A dangling reference is not cosmetic here: your normalizers drop it on save and that accountability
is gone permanently, with no error anywhere. The preview therefore moves **all** of it before
emitting — RASIC letters (survivor's letter wins a clash, and the clash is reported to the user),
meeting membership in both directions, vessel aspects (union by text), authored notes (appended under
a merge marker, never dropped), charter participant seats and decision-right owners, `inputs`/
`outputs` refs naming an absorbed meeting, org-hierarchy children (reparented onto the survivor), and
`alg` / `purpose` so an escalation right or a written purpose cannot die with the vessel.

**What I'd like you to check:**

1. A merge that survives a **save → reload** cycle, not just an in-session `change`. I verified the
   in-memory round-trip through your own domain functions; I have not exercised your persistence.
2. `syncStep7MeetingParticipations` after a **meeting** is absorbed — `membership` values (not just
   keys) can name the merged meeting, and the preview rewrites those too. Worth one assertion.
3. Whether a merge should be recorded anywhere as provenance. Right now the survivor simply gains the
   references; the absorbed vessel's name survives only inside the merged notes marker. If Step VII
   wants an audit trail of merges, that's canonical data and therefore yours, not mine.

Undo-first, per the house pattern: the whole authoring layer is snapshotted before the merge and the
toast carries a one-click **Undo** that restores it byte-for-byte (asserted by comparing the
serialized model). Note the toast auto-hides after ~4s — after that, undo is gone.

## 2 · 7.1 Edit links now navigate (they were `data-act="noop"`)

They did not point at the wrong substep; they did nothing at all. 7.1 is a register — each vessel
type is described elsewhere:

| Vessel | Opens | Selects |
|---|---|---|
| role | 7.4 Role Descriptions | `selRole` |
| function / department | 7.5 Function Descriptions | `selFn` |
| meeting / committee | 7.6 Meetings & Agendas | `selMtg` |

Each emits `goto {substep}` — which you already handle — plus `select {ref:{kind,id}}`, so your
`activeStep7Substep` and the route hash stay in step with the frame. `STEP7.select` now accepts
`role` and `function` refs as well as `meeting`, and `step7State().ui` exposes `selRole` / `selFn` /
`selMtg`. Without those the landing selection is observable only in the DOM, and since 7.4/7.5/7.6
default to their first item, a test could not tell a working deep link from a default. The specs
target the **last** vessel of each type for that reason.

## 3 · 3D renders the same on every machine now

Mark reported the 3D scene looking too bright on a corporate Windows laptop. Two real defects:

- `outputColorSpace` and `toneMapping` were implicit. `OutputPass` reads both, so the composer path
  and the fallback path could disagree — the exact mechanism for a cross-machine brightness split.
  Now pinned: sRGB + `LinearToneMapping` (a plain exposure multiply, so the look is unchanged) with
  one `toneMappingExposure` knob, set to 1.06.
- `new SSAOPass(...)` was unguarded **and `fit(); place(); applySel();` run after it**. On a GPU
  without depth-texture support that throws mid-init, leaving the camera unfitted and the focus state
  unapplied. Now in try/catch, with the composer and its `OutputPass` always built.

I also *wrote and then deleted* a lighting compensation for the AO-less path: measured (canvas
screenshot → mean luminance, AO vs `?ao=off`) it moves brightness by **0.0%**, so compensating would
have made those machines 1.1% darker than everyone else. Shipping it would have invented the
inconsistency it claimed to remove.

No host action needed. `?ao=off` forces the AO-less path and `__d3.pipeline()` reports
ao/exposure/toneMapping/colorSpace/light intensities/GPU string — I'm still waiting on that readout
from the Windows machine before claiming the report is resolved.

## 4 · Wording: S4 is **“Outside & Then”**

The correct pair to S3's “Inside & Now”; “Now & Then” was wrong. Changed in the preview, its spec and
the earlier handover doc. Nothing in `src/**` carried the string — I grepped.

## 5 · Asset-tests: 164 → 202

30 specs for the Steering Master, 8 for the Step VII work. They pin the contract, but they are
weighted toward the defects live testing actually produced, because those are the ones that come
back: a meeting with no system staying visible, the ribbon and Steering Stats counting `gc` from the
same set, export/fullscreen surviving embed mode, Signal flow absent in 2D, filters narrowing what
the slots list but never what the band heads count, and no filter advertising a distinction the model
does not track.

**Every guarantee was mutation-tested rather than trusted.** Reverting the unassigned strip, the
`gcAll()` reconciliation, the 3D-only Flow gate, the `api:1` stamp, the `STEP7` meeting branch, the
merge's RASIC move, the survivor-wins clash rule, the org reparent, and the undo snapshot each turns
exactly the corresponding spec red. That check exists because your own audit already caught one
false-confidence test in this feature — `tests/steeringMasterViewModel.test.js:63` pinned the invented
`state: "accepted"` as expected output, so it passed while the vm was fabricating.

## 6 · Cache label

Both previews changed, so this needs your bump. Note `index.html` currently carries **two different
labels** — `styles.css?v=20260729-steering-master-nav-audit` and
`app.js?v=20260729-step7-starting-tile`. If that split is deliberate, ignore me; if not, it is the
same class of problem that made navigation look dead until the app.js label moved.

---

*Lane split unchanged: Claude owns `design-previews/**`, `asset-tests/**` and the standalone visual
assets; Codex owns `src/**`, `tests/**`, `index.html`, cache labels, merges and release verification.*
