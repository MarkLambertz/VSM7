# VSM Workshop Workspace

A first working slice for a generic Viable System Model workshop app.

The app treats workshop files as generated outputs, while the canonical project data stays in one browser-based workspace:

`Organization -> VSM Project -> Steps I-VII -> Structured Artifacts -> Exports`

## Run

Use any static web server from this folder. For example:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Scope

This slice focuses on the canonical VSM data model and the SCT-centered flow:

- Step I: Operative units and segmentation decision
- Step II: manageability assessment
- Step III: success-critical tasks
- Step IV: central/decentral allocation and accountability
- Step V-VII: structured capture for meetings, communication checks, representation, and implementation
- Completeness assistant
- Downloadable Word/Excel-compatible outcomes plus project JSON

## Architecture

- `src/domain`: VSM entities, factory functions, and completeness policies
- `src/application`: workspace repository coordination
- `src/infrastructure`: local storage and export adapters
- `src/presentation`: browser UI
- `tests`: domain-level checks
