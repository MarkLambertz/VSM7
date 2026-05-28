# VSM7 Workshop Workspace

A first working slice for a generic Viable System Model workshop app with a Node.js backend.

The app treats workshop files as generated outputs, while the canonical project data stays in one browser-based workspace:

`Organization -> VSM Project -> Steps I-VII -> Structured Artifacts -> Exports`

## Run

Use the Node.js development server from this folder:

```sh
npm run dev
```

Then open `http://localhost:4174`.

The server stores project data in `data/workspaces.json`. That file is ignored by Git so workshop data does not leak into source control.

## Scope

This slice focuses on the canonical VSM data model and the SCT-centered flow:

- Step I: Operative units and segmentation decision
- Step II: manageability assessment
- Step III: success-critical tasks
- Step IV: central/decentral allocation and accountability
- Step V-VII: structured capture for meetings, communication checks, representation, and implementation
- Completeness assistant
- Downloadable Word/Excel-compatible outcomes plus project JSON
- Node.js API-backed project persistence, with browser localStorage fallback if the API is unavailable

## Architecture

- `src/domain`: VSM entities, factory functions, and completeness policies
- `src/application`: workspace repository coordination
- `src/infrastructure`: browser repository adapters and export adapters
- `src/presentation`: browser UI
- `src/server`: Node.js HTTP server and file-backed workspace store
- `tests`: domain-level checks
