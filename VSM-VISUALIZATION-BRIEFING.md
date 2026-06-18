# VSM Visualization — Build Briefing

A self-contained set of instructions for visualizing the **Viable System Model** correctly in browser-native HTML/SVG, faithful to the **Pfiffner / Bosch** visual language (Martin Pfiffner, *The Neurology of Business: Implementing the Viable System Model*, Springer 2022).

> **Source of truth:** the Bosch training deck `VSM-Coach-Day2-and-Day3-Application.pdf`. The canonical assembled model is deck **p.15**; the element toolkit is **p.14**; the recursion/unfold idea is **p.4 & p.26**; the six channels are labelled on **p.39**.

> **🔌 Connecting a backend? Codex, start here →** jump to **§12 — Frontend code & backend-integration guide** (read **§12.0** first — it defines who owns what). §12 is authoritative for the *shipped* file `vsm.html`; §1–11 describe the visual-design intent, some of which evolved during the build (see **§12.10 Build delta**). The artifact is a **standalone, code-native VSM diagram** with **its own entry point in the main navigation** *and* an embedded use in **Step V** — Step V is **not** the only entry point. (On the "code-native, not bitmap" requirement, see `AGENTS.md`.)

---

## 0. Non-negotiable principles

1. **Recursion-first.** The VSM is *one structure repeated at every scale*, not a 5-box hierarchy. The visualization's backbone is the ability to move between recursion levels (drill down / zoom out), not a single static picture. This is what "modular / adaptive" means.
2. **Never forget System 3\*.** The audit channel is the element most diagrams drop. It must always be present and correct. Systems are **1, 2, 3, 3\*, 4, 5** — never stop at 5.
3. **Pixel-faithful to the deck.** Use the exact shapes, sides, colours, and amoeba/homeostat motifs below. Don't invent a new visual language.
4. **It is NOT an org chart.** Levels are *containment* (a viable system inside a viable system), not command. Each unit is independently viable.
5. **Distinguish operational units (S1) from support functions.** They are different things (cardinal error #9).

---

## 1. The systems (semantics)

| System | Name | One-line role |
|---|---|---|
| **S1** | Operations | The primary, value-producing units. Each is *itself a full VSM*. |
| **S2** | Coordination | Damps oscillation/conflict between S1 units (shared standards, scheduling). |
| **S3** | Control | Runs the inside as a whole, here & now; allocates resources; optimises the S1 collective. |
| **S3\*** | Audit | Sporadic, direct probe into operations that **bypasses** the command line to verify ground truth. |
| **S4** | Intelligence | Looks outside & ahead; models the future; adapts. |
| **S5** | Policy / Identity | Ethos, identity, final arbiter; balances S3 (now) vs S4 (future). |

**Groupings:** S1+S2+S3(+3\*) = *operative management / inside & now*. S3↔S4 = *strategic*. S5 = *normative*.

---

## 2. Element catalog (the toolkit — deck p.14)

Draw each element exactly as specified. Sides matter: **S3\* is LEFT, S2 is RIGHT.**

| Element | Shape | Fill | Label | Position |
|---|---|---|---|---|
| System 5 | Rounded rectangle (wide), with two arms curving down both sides to embrace operations | `#A0C0D5` | "5" (white) | Top, centre |
| System 4 | Rounded rectangle | `#7BCA79` | "4" (white) | Below S5 |
| System 3 | Rounded rectangle | `#FF5534` | "3" (white) | Below S4 |
| System 3\* | **Inverted** triangle (▽) | `#FF5534` | "3\*" (white) | **Left**, below S3 |
| System 2 | **Upward** triangle (△) | `#FFCC50` | "2" (white) | **Right**, below S3 |
| S1 management | Circle, white fill, gray stroke | `#FFFFFF` / stroke `#9A9A9A` | — | One per unit, centre-left of the system block |
| S1 operation | Rounded square, white fill, gray stroke | `#FFFFFF` / stroke `#9A9A9A` | "1a"…"1d" | Right of its management circle |
| Command channel | Thick **double** vertical line | `#FF5534` | — | Centre, S3 → through all S1 squares |
| Resource ladder | Two vertical rails + a rung at each S1 level | `#FFCC50` | — | Right side, S2 → each unit |
| Audit channel | Thick line branching down-left into each circle | `#FF5534` | — | Left side, S3\* → each circle |
| Operational env. | Large light-gray amoeba (outer) containing dark-gray sub-blobs (one per S1) | outer `#D7D7D7`, blobs `~#8F8F8F` | — | Left column |
| Future env. | Green amoeba blob | `#A2DAA0` | — | Top of the left column (scanned by S4) |
| Env. overlap | Amber lens/eye shape between adjacent env blobs | `#FFCC50` | — | Between S1 environments |
| Amplifier/attenuator | Black double-headed horizontal arrows | `#333` | — | Between each env blob and its S1 circle |
| Coordination squiggle | Yellow vertical wavy line | `#FFCC50` | — | Between adjacent S1 units (anti-oscillation) |
| Mgmt link | Navy curved arrows | `#1D3880` | — | Vertically between adjacent management circles |
| Homeostat (3↔4) | Red curl loop | `#FF5534` | — | Upper-left of S3 |
| Recursive curl | Green curved arrow | `#7BCA79` | — | Right of S4 (and S5) |
| S4↔future env. | Green double arrows | `#7BCA79` | — | From S4 left to the green env blob |

---

## 3. Canonical layout of one level (R0) — deck p.15

Use a **portrait** SVG canvas (suggested `viewBox="0 0 900 1100"`). Three zones:

```
┌───────────────┬──────────────────────────────────────┐
│ ENVIRONMENT   │            THE SYSTEM (R0)            │
│ (left ~30%)   │                                      │
│               │        ┌────────── S5 ──────────┐    │  ← S5 wide bar, arms curve
│  green blob ◄─┼─ green │        ┌──── S4 ────┐  │ ↻  │    down both sides
│  (future env) │  arrows│   ↺red └──── S3 ────┘ ↻│amber  ← homeostat curls
│               │        ▽3*            △2          │
│  gray amoeba  │        ║              ║           │
│   ┌ blob 1a ◄─┼─►○──□1a ║════rung════ ║           │  ← ○ mgmt circle, □ operation
│   ✦ overlap   │     ↕navy  ⌇yellow    ║resource   │  ← command ║ (centre, red double)
│   ┌ blob 1b ◄─┼─►○──□1b ║════rung════ ║ ladder    │  ← audit (left) into circles
│   ✦ overlap   │     ↕     ⌇           ║           │  ← resource rungs (right)
│   ┌ blob 1c ◄─┼─►○──□1c ║════rung════ ║           │
│   ✦ overlap   │     ↕     ⌇           ║           │
│   └ blob 1d ◄─┼─►○──□1d ║════rung════ ║           │
└───────────────┴──────────────────────────────────────┘
        ▲ black double-headed env arrows (amplify/attenuate)
```

**Vertical order of the metasystem (top→bottom):** S5 → S4 → S3, then S3\* (left) and S2 (right) flanking the top of the S1 stack. **The whole picture is ONE recursion level.**

---

## 4. The six communication channels (deck p.39, "vertical variety" a–f)

These are the connective tissue and should be **independently toggleable layers**. Use the deck's own labels:

| # | Channel | Visual | Colour |
|---|---|---|---|
| **a** | Environmental overlaps | Amber lens shapes between S1 env blobs | `#FFCC50` |
| **b** | **System 3\*** (sporadic audits) | Left red channel from 3\* into each circle | `#FF5534` |
| **c** | Operational dependencies | Direct links between adjacent S1 operations | `#1D3880` |
| **d** | Resource bargain & accountability | Right amber ladder (rails + rungs) | `#FFCC50` |
| **e** | Corporate intervention (command) | Central red double line | `#FF5534` |
| **f** | System 2 (coordination) | Yellow vertical squiggles between units | `#FFCC50` |

---

## 5. Recursion model (the backbone)

- **Notation:** `R+1` = the system that *contains* the current one; `R0` = the **System in Focus (SIF)** currently rendered; `R-1` = the S1 sub-units, each of which unfolds into its own full VSM.
- **Unfold mechanic** (deck p.26 — real Bosch example: Bosch Group → Mobility Solutions → ETAS → DAP → Probes → Teams): clicking an S1 unit makes **that unit become the new R0** (its operation "opens" into a complete VSM). Zooming out makes the current R0 become one S1 unit of R+1.
- **Breadcrumb / recursion ladder:** always show the path, e.g. `R+1 ▸ R0 (SIF) ▸ R-1`, so the user knows which level they are on. Only three levels are ever in focus at once.
- **Self-similarity:** every level renders with the *identical* structure from §3. No special "top" level.

---

## 6. Interaction spec (modular / adaptive behaviours)

1. **Drill down:** click any S1 operation → descend one recursion level (that unit becomes SIF). Animate the unfold.
2. **Zoom out:** click an ancestor breadcrumb chip → ascend one level (SIF becomes an S1 of R+1).
3. **Channel layers:** six toggles (a–f from §4) + Environment + Metasystem, each independently show/hide.
4. **Modular units:** add / remove / rename S1 units; the layout (circles, squares, rungs, env blobs, squiggles) regenerates to match the count.
5. **Variety read-out (Step II):** show a simple **horizontal-variety vs vertical-variety** indicator; warn when many dissimilar units overload the channels, and suggest the three fixes (strengthen control / re-cluster S1 / add a recursion level).
6. **Element info panel:** click any element → show its name, role, and the copy in §9.
7. **Methodology overlay (optional):** a guided walk through the 7 steps (§8) using the deck's examples (Pasta Lasta restaurant; Automotive Interior AG).

---

## 7. Colour palette (exact, sampled from deck p.14)

```
S5 Policy / light blue ........ #A0C0D5
S4 Intelligence / green ....... #7BCA79
S3 Control / command / red .... #FF5534   (S3* uses the same red)
S2 Coordination / amber ....... #FFCC50   (also resource ladder, squiggles, env overlaps)
Future environment / green .... #A2DAA0
Navy connector arrows ......... #1D3880
Environment amoeba (outer) .... #D7D7D7
Environment sub-blobs (gray) .. #8F8F8F
Element stroke / outlines ..... #9A9A9A
Operation/management fill ..... #FFFFFF
Amplifier/attenuator arrows ... #333333
Text on coloured bars ......... #FFFFFF
```

---

## 8. The Pfiffner 7-step method (for the overlay)

| Step | Name | What it produces |
|---|---|---|
| I | Operative Units | S1 segmentation of the SIF (by product, region, customer…), scored on key buying criteria — *customer value first*. |
| II | Manageability & Flattening | Balance horizontal vs vertical variety; avoid unnecessary recursion levels. |
| III | Success-Critical Tasks | The mission-critical tasks; basis for support functions; amplifiers & attenuators. |
| IV | Central vs Decentral | Subsidiarity: keep decentral/autonomous unless a real synergy exists that doesn't hurt key buying criteria. |
| V | Designing S2–S5 | Define the metasystem functions and their channels. |
| VI | Communication Channels | Lay in all six channels (a–f) between recursion levels. |
| VII | Representation | RASIC matrix, roles/boards, org chart, meeting cadence. |

**Design principles:** subsidiarity · recursiveness · viability · relative autonomy · simplification · work *on* (not *in*) the system.

---

## 9. Info-panel copy (per element)

- **S5 — Policy/Identity:** Ultimate authority and identity. Sets policy, holds the ethos, balances present (S3) vs future (S4). Governs by exception.
- **S4 — Intelligence:** Scans the outside and the future; models options; adapts. Bridges the inside (S3) with the environment.
- **S3 — Control:** Runs the whole S1 complex here and now; allocates resources; drives synergy.
- **S3\* — Audit:** Sporadic, direct probe into operations that bypasses the command line to verify reality. Without it, S3 has no check.
- **S2 — Coordination:** Damps oscillation and conflict between units via shared standards and scheduling. Reduces load on S3.
- **S1 — Operation:** A primary value-producing unit. Itself a complete viable system — click to unfold.
- **Environment:** Each unit has its own local environment; these overlap (amber lenses). S4 additionally scans the future environment (green).

---

## 10. Mistakes to avoid

**From the first attempt:**
- Treating recursion as a label/arrow instead of the structure. ✗
- Putting S3\* and S2 on the wrong sides, or omitting S3\*. ✗
- Oversimplified environment (no future-vs-local split, no overlaps, no amplifier/attenuator arrows). ✗
- Missing homeostat loops (S3↔S4, S4↔future-env). ✗
- Resource bargain drawn as decoration rather than a real channel tied to each unit. ✗

**Pfiffner's 10 cardinal errors (condensed):** starting from the org chart · organizing around past customer benefit · copying competitors · optimizing weaknesses · escaping into the matrix · starting with people · **overlooking nested structures** · organizing the new in the old · **not distinguishing support units from operational units** · neglecting "neurology" (the channels).

---

## 11. Acceptance checklist — "the visualization is correct when…"

- [ ] All of **1, 2, 3, 3\*, 4, 5** are present and correctly placed (S3\* left ▽, S2 right △).
- [ ] The picture is clearly **one recursion level**, and you can **drill into any S1** to get the same structure again, plus **zoom out**.
- [ ] A **recursion breadcrumb** (R+1 ▸ R0 ▸ R-1) is always visible.
- [ ] The **environment** shows future (green) + local (gray) blobs with **amber overlaps** and **double-headed amplifier/attenuator arrows**.
- [ ] All **six channels (a–f)** are present and individually toggleable.
- [ ] **Homeostat curls** (3↔4 red, S4 recursive green) are drawn.
- [ ] Colours match §7 exactly.
- [ ] S1 units are **modular** (add/remove/rename) and the layout adapts.
- [ ] Clicking any element shows the correct **info copy** (§9).

---

## 12. Frontend code & backend-integration guide (for Codex)

> Authoritative description of the **shipped** single file `vsm.html`. Goal: let a host/backend (the VSM7 app) drive this diagram and persist its state. If you read only three things, read **12.2** (data model), **12.7** (persistence gap), and **12.9** (how to plug in).

### 12.0 Ownership boundary (MECE) & entry points
Accountability is split clean — **M**utually **E**xclusive, **C**ollectively **E**xhaustive:

| Lane | Owner | Scope (edits these files) |
|---|---|---|
| **Front-end / interaction** | Front-end & interaction designer | `vsm.html` (all SVG, layout, interaction, **and the in-file integration bridge/API**) + this briefing. |
| **Back-end / host app** | **Codex** | the VSM7 host — `index.html`, `src/**`, `tests/**`, `AGENTS.md`, `README.md` — plus embedding the diagram, feeding & persisting its data, and Step-V mapping logic. |
| **The seam (shared)** | by agreement only | the data model (12.2) + the message/API contract (12.9). |

- **Hard rule:** Codex does **not** edit `vsm.html`'s visual/interaction code — request changes via the front-end designer. The front-end designer does **not** edit host/back-end code (`src/**`, `AGENTS.md`, …). The `postMessage`/API bridge lives *inside* `vsm.html`, so it is the **front-end's** deliverable; Codex writes the host side that calls it.
- **Entry points (≥ 2, by design):** the diagram is reached from **(1) a dedicated link/button in the main navigation** (standalone full-screen view) **and (2) embedded inside Step V**. Treat it as a **reusable component**, not a Step-V-only widget. Both entry points need the same data feed (12.7); Step V *additionally* consumes element-click for SCT→system mapping (12.5 / 12.8). The standalone view should work even if no Step-V context is loaded.

### 12.1 Runtime shape
- **One self-contained file**: inline CSS + a single `<script>` (`"use strict"`). No build step, no dependencies, no network calls; runs from `file://`.
- The diagram is an **SVG string generated in JS** and injected into `#stagewrap`. `render()` rebuilds it from scratch on every change (stateless repaint — cheap; never cache SVG child nodes across renders).
- Shows **exactly one recursion level** at a time (the System-in-Focus).

### 12.2 Data model — the only state a backend must own
```js
node(name, kids) -> { id:Int, name:String, children:node[]|null, _gen:Bool, hostId?:String }
//  id     : auto-increment, process-local — NOT stable across reloads (see 12.8)
//  _gen   : placeholder-name flag; set false the moment a user renames the node
//  hostId : stable id supplied by the host via loadTree (absent in standalone) = cross-boundary identity
let  tree = node('Global Group', [ node('Mobility',[…]), … ]);   // default sample; replaced by loadTree
let  path  = [tree];                       // root → … → SIF
const sif  = () => path[path.length-1];    // current System-in-Focus = R0
ensureChildren(n)                          // lazily gives a node 3 placeholder children
```
- **`sif().children` are the S1 operational units rendered** (labelled `1a,1b,…` via `letters[i]`).
- The tree **is** the recursion hierarchy: a node's children are its R-1 sub-units; `path` is the drill trail → `R+1 = path[len-2]`, `R0 = sif()`, `R-1 = sif().children`.

### 12.3 State variables (module-scoped — see 12.9 about access)
| Var | Type | Meaning |
|---|---|---|
| `path` | `node[]` | recursion trail; last element = SIF/R0 |
| `shown` | `{a..g, env, meta : Bool}` | channel/layer visibility; `g` defaults **false**; `env`/`meta` always true |
| `selected` | `{type, idx?}` \| `null` | last-clicked element (drives the Element-info panel) |
| `shapes` | `{red,green,armL,armR}`, each `[[x,y]×4]` | homeostat bézier control points — **persisted** |
| `editMode`,`drag` | — | homeostat shape-editor internals |

### 12.4 Render pipeline
`render()` → build SVG string from `sif()` + state → set `#stagewrap.innerHTML` → then `drawBreadcrumb · drawLayers · drawUnits · drawInfo · drawShapeEditor · bindSvg`. **Call `render()` after any mutation.** Each sidebar sub-renderer targets a stable container id (12.6).

### 12.5 Interaction & mutation map (the wiring seams)
| User action | Handler | State change | Backend should… |
|---|---|---|---|
| Double-click an operation, or `[data-drill]` | `drillInto(idx)` | `path.push(child)` → emits `drill` | set current SIF / recursion level |
| Breadcrumb chip `[data-bc=i]` (click an ancestor = zoom out) | inline | `path = path.slice(0,i+1)` → emits `zoom` | set current SIF — **this is the zoom-out control** (the old `#zoomout` button was removed; the `zoom` event is unchanged) |
| Click any `[data-el]` in the SVG | `bindSvg` click | `selected = {type, idx}` | drives the info panel; **in the Step-V entry point** also = assign the selected SCT contribution to that VSM system (standalone view just inspects) |
| Channel toggle `[data-tgl]` | inline | `shown[id] ^= 1` | optional: persist view prefs |
| Rename unit `input[data-uidx]` | inline | `child.name=…; _gen=false` | persist name (keep stable id!) |
| Remove unit `[data-rm]` | inline | `children.splice(i,1)` | delete (confirm + cascade per AGENTS.md) |
| Reorder unit (drag grip ⠿) | inline | `children` reordered | persist order |
| Add unit `#addUnit` | inline | `children.push(node('New unit'))` | create unit |

### 12.6 DOM seams
- SVG container `#stagewrap`; sidebar containers `#unitList`, `#layerToggles`, `#info`, `#shapeEditor`, `#breadcrumb`; controls `#addUnit`, `#paneToggle` (collapse/show the details pane); tooltip `#tt`. **Zoom-out is via the breadcrumb** (ancestor chip), not a dedicated button. The collapsible pane uses `body.pane-hidden` → `.sidebar{display:none}`.
- Inside the SVG, every interactive node carries **`data-el`** ∈ {`5`,`4`,`3`,`3*`,`2`,`a`…`g`,`unit`,`env`,`future`}; units additionally carry **`data-idx`** (index into `sif().children`). This is the click/selection contract.

### 12.7 Persistence — today vs. needed
- **Today:** only `shapes` → `localStorage['vsmShapes2']` (versioned key — bump the suffix if you change `SHAPE_DEF`). **The tree/units live in memory only and reset on reload.**
- **Needed from the backend:** supply `tree` + `path` on load; persist unit create/rename/reorder/delete; optionally persist `shown` (channel prefs) and `shapes`.

### 12.8 Mapping to VSM7 concepts (`AGENTS.md`)
| `vsm.html` | VSM7 |
|---|---|
| `node` | Step-I organizational unit |
| `node.children` | that unit's R-1 units |
| `sif()` / `path` | System-in-Focus & recursion level |
| click a system `[data-el = 5/4/3/3*/2]` | **Step-V entry point only:** target VSM system for an SCT contribution (in the standalone nav view it's plain inspection) |
| `node.id` | **must be backed by a stable VSM7 unit id.** The local id is a process-local counter; keep an `id ↔ vsm7UnitId` map so renames/moves preserve downstream SCT contributions (AGENTS.md requires stable refs). |
- Color grammar already matches VSM7 (S1 navy, S2 amber, S3/3\* red, S4 green, S5 light-blue) — satisfies the "code-native, not bitmap" Step-V requirement out of the box.

### 12.9 Integration API — **IMPLEMENTED** (iframe + postMessage, with an inline mirror)
> Shipped in `vsm.html` (the `INTEGRATION BRIDGE` block) and verified end-to-end. **Standalone is unaffected:** with no parent frame and no `window.VSM.onEmit`, the bridge is inert. Embed `vsm.html` in an `<iframe>`; the host should **wait for `{evt:'ready'}` before sending commands** (the message listener is attached before `ready` fires, so earlier commands are also tolerated). All ids below are **host ids** (`node.hostId`, or the fallback `'local:<n>'` for nodes the host never supplied — e.g. a unit the user added, or the default standalone tree).

**Host → vsm.html** — `iframe.contentWindow.postMessage(msg, '*')`:
| `msg.cmd` | payload | effect |
|---|---|---|
| `loadTree` | `{ cmd:'loadTree', tree }`, `tree = { id, name, children?:[ {id,name,children?}, … ] }` (recursive; `id` = stable host id) | replaces the tree, resets path to `[root]`, re-renders; stores each `id` as `node.hostId`. |
| `setPath` | `{ cmd:'setPath', ids }`, `ids = [rootHostId, …, sifHostId]` | sets recursion path / SIF by **host ids**; if the exact chain isn't found, locates the last id anywhere in the tree. |
| `setChannels` | `{ cmd:'setChannels', shown }`, `shown` = any subset of `{a,b,c,d,e,f,g,env,meta}` booleans | applies recognised keys, re-renders. |
| `select` | `{ cmd:'select', type, idx? }`, `type` = a `data-el` value, `idx` required for `'unit'` | sets selection + info panel (no `elementClick` echo); `type:null` clears. |
| `setPaneVisibility` | `{ cmd:'setPaneVisibility', pane:'details', visible:boolean }` | shows/hides the internal **details side-pane** (operational units · channels · element info · legend · homeostat editor). `visible:false` frees its width to the diagram, which re-centres/reflows immediately; emits `paneVisibilityChanged`. `pane` omitted ⇒ treated as `'details'`. Standalone default = visible. |

> **URL param (no bridge needed):** embed `vsm.html?pane=hidden` (synonyms: `collapsed`/`false`/`0`) to open with the details pane already collapsed — ideal for the **standalone main-nav entry** that wants a diagram-only view without wiring postMessage. The in-iframe toggle button still works.
>
> **Sizing note for hosts:** the diagram has a fixed portrait aspect (~0.87). `vsm.html` fills 100% of its iframe height (`100vh`), so **give the iframe a definite full height** (e.g. iframe `width:100%;height:100%;display:block;border:0` inside a parent chain that reaches a `100vh`/`100dvh` or flex `flex:1` container) — otherwise the iframe collapses to less than the available space. With the pane open in a tall/narrow frame the diagram is width-bound (vertical letterbox is unavoidable for fixed aspect); collapsing the pane (above) gives it the full width (~+25% in testing).

**vsm.html → Host** — posted to `window.parent` with `'*'` (also delivered to `window.VSM.onEmit(msg)` when inlined). Host should verify `event.origin`/`event.source`:
| `msg.evt` | exact payload |
|---|---|
| `ready` | `{ evt:'ready', api:1 }` — once, after the first render |
| `elementClick` | `{ evt:'elementClick', type, idx, hostId, name, sifId }` — fires on **every** `data-el` click, **in addition to** the info panel. `idx`/`hostId`/`name` are `null` for non-unit elements. Key `type`s: `5, 4, 3, 3*, 2, unit`. |
| `mutate` add | `{ evt:'mutate', op:'add', parentId, path, hostId:'local:<n>', tempId:'local:<n>', name, index }` — the new unit has no host id yet; host should assign one (correlate via `tempId`) and persist. |
| `mutate` remove | `{ evt:'mutate', op:'remove', parentId, path, hostId, name, index }` |
| `mutate` rename | `{ evt:'mutate', op:'rename', parentId, path, hostId, name, index }` |
| `mutate` reorder | `{ evt:'mutate', op:'reorder', parentId, path, hostId, name, order:[hostId,…], from, to }` — `order` = the new full child order by host id (authoritative) |
| `drill` | `{ evt:'drill', path:[hostId,…], sifId }` — user double-clicked an S1 operation |
| `zoom` | `{ evt:'zoom', path:[hostId,…], sifId }` — user zoomed out or used a breadcrumb |
| `paneVisibilityChanged` | `{ evt:'paneVisibilityChanged', pane:'details', visible:boolean }` — emitted whenever the details pane is toggled, **both** by the user (the compact panel button in the top control bar, `aria-label` "Hide/Show VSM detail pane") **and** by a host `setPaneVisibility` command |

where `parentId` / `sifId` = the current SIF host id, and `path` = host ids from root to SIF.

**Inline alternative (option B, also shipped):** `window.VSM = { loadTree, setPath, setChannels, select, setPaneVisibility, getState, onEmit }` mirrors the commands for hosts that inline the `<script>` instead of using an iframe (`setPaneVisibility(boolean)`). `getState()` → `{ path:[hostId…], sif, shown, selected, paneShown }`; set `onEmit = fn` to receive the outgoing `evt` messages without postMessage.

**Host gotchas:** `loadTree` children may be lazy — a unit with no `children` still drills (vsm.html generates placeholder R-1 children locally, which carry **no** host id), so feed a real sub-tree on the `drill` event if the host needs identified sub-units. After an `add`, reconcile the `tempId`/`local:<n>` placeholder with a real host id (a follow-up `loadTree` or `setPath` is the simplest path).

### 12.10 Build delta (final code vs §1–11 intent)
- Resource bargain (**d**) is a **single** red line, not a two-rail ladder; audit (**b**) has **no** arrowheads.
- Environment is an **organic light-grey silhouette** (not a rectangle): green future cloud at top + **strongly overlapping** grey sub-blobs with **40 %-transparent** amber overlaps; the operation↔environment **eye-loops are open ellipses**.
- Channel **g · Algedonic** added (magenta, default **off**). Channels are **a–g**.
- **Removed:** the "Manageability · variety" panel; the Environment & Metasystem **toggles** (both are always-on now).
- Sidebar order (top→bottom): **Operational units → Channels → Element info → Legend → Homeostat shape editor**.
- **No dark title `<header>`** (removed — redundant in the embed and with the breadcrumb); the breadcrumb bar (`#bcbar`) is the top row. Drill/click guidance lives in hover tooltips + the Element-info panel. Zoom control is a compact `+/%/−` cluster.
- Homeostat (red/green curls + blue S5 arms) is **drag-editable and persisted**; defaults live in `SHAPE_DEF`.
- S1 units are **drag-reorderable** via a grip handle.
- The `<svg>` carries explicit `width`/`height` + `preserveAspectRatio` (Safari renders a blank stage without them — see 12.11).
- **Integration bridge is implemented** (see §12.9): the iframe + `postMessage` contract plus a `window.VSM` inline mirror, verified end-to-end. `node` now carries an optional `hostId`; `tree` is a `let` (replaceable via `loadTree`). Standalone behavior and visuals are unchanged.
- **Collapsible details pane** (for embedded mode): a compact panel button in the top control bar + the `setPaneVisibility` host command hide/show the sidebar; hiding frees the width to the diagram (auto re-centre/reflow, click targets stay precise). Emits `paneVisibilityChanged`. Standalone default = visible.
- **Canvas pan + zoom** (Miro/Maps-style; *geometric*, distinct from the recursion drill): floating `+ / % / −` control at the bottom-right, **mouse-wheel = zoom at cursor**, **drag = pan**, the `%` chip resets to fit. **The SVG fills the whole stage** (`.stage svg{width:100%;height:100%}`) and the **viewBox is computed each render to match the stage's aspect ratio** while framing the content (`CONTENT={x:130,y:34,w:652}`, `h=baseViewH=H-36`) — so the *entire viewport is the canvas* and zoom/pan use all of it (no fixed narrow drawing box). State: module `zoom` (1=fit) + `panX`/`panY` (view-centre offset, content units); helpers `fitVB()/curVB()/clampView()/applyVB()/zoomAround()`. Clicks/drill/shape-editor stay accurate (`getScreenCTM`); a pan-drag suppresses the trailing click (the flag is cleared on each fresh `mousedown`). View **resets to fit** on recursion navigation (drill / breadcrumb / `loadTree` / `setPath`, via `resetView()`) and **on frame/iframe resize**; **persists** across non-nav renders. Currently **local** — no bridge command (could add `setView`/`resetView`).
- **Fit vs. the portrait aspect:** at fit, the content is framed to the stage aspect — so on a *wide/landscape* frame the **portrait** diagram (~0.89) is centred with side gaps (inherent: filling the width while keeping the whole diagram visible isn't possible without cropping/scrolling). The win of the full-stage canvas is that **zooming/panning now use the entire viewport** instead of a narrow box. To open the standalone view diagram-first, use `?pane=hidden` and give the iframe full width/height.

### 12.11 Gotchas
- **Safari/WebKit:** an inline SVG with only a `viewBox` collapses to zero height → blank stage. Explicit `width`/`height` fix it (done); re-verify after any SVG-header edit. The Chromium-only preview tooling will NOT catch this — test in Safari.
- `render()` recreates all SVG nodes — never hold a reference to an SVG child across a render; re-query.
- Sidebar **container** ids are stable; their **contents** are regenerated on each `drawX()`.
- `node.id` is process-local — drive identity from the backend id map (12.8), not from it.
