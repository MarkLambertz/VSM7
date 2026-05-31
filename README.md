# VSM7 Workshop Workspace

A first working slice for a generic Viable System Model workshop app that runs in the browser.

The app treats workshop files as generated outputs, while the canonical project data stays in browser localStorage:

`Organization -> VSM Project -> Steps I-VII -> Structured Artifacts -> Exports`

## Run

### Development (with live reload)

On macOS, double-click `start.command` or run it from the terminal:

```sh
./start.command
```

This starts a local HTTP server at `http://localhost:4174` and opens the app in your browser. The server uses Python's built-in HTTP server (included with macOS) or falls back to Node.js if available.

### For Stakeholders (no server needed)

**Why this is needed:** Modern browsers block ES Modules (files using `import`/`export`) when loaded directly from the file system (`file://` protocol) due to CORS security policies. The build process bundles all code into regular JavaScript that works without a server.

**How to build and share:**

```sh
npm install      # Install Vite bundler (one time setup)
npm run build    # Creates production-ready dist/ folder
```

This creates a `dist/` folder containing:
- `index.html` — entry point with regular script tags (no `type="module"`)
- `assets/bundle.js` — all JavaScript bundled as IIFE (Immediately Invoked Function Expression)
- `assets/styles.css` — all styles

**Sharing options:**
1. **Direct file sharing**: Zip the `dist/` folder and send it. Stakeholders open `index.html` directly — works in Chrome, Firefox, Safari, Edge without any server.
2. **Static hosting**: Upload `dist/` to any static web host (GitHub Pages, Netlify, S3, etc.)
3. **Local network**: Place `dist/` on a network share and open via `file://`

> **Note:** `dist/` is excluded from version control (in `.gitignore`) since it contains generated files.

Node.js is only needed for development and building. The built `dist/` folder requires nothing.

## Scope

This slice focuses on the canonical VSM data model and the SCT-centered flow:

- Step I: Operative units and segmentation decision
- Step II: manageability assessment
- Step III: success-critical tasks
- Step IV: central/decentral allocation and accountability
- Step V-VII: structured capture for meetings, communication checks, representation, and implementation
- Completeness assistant
- Downloadable Word/Excel-compatible outcomes plus project JSON
- Browser localStorage persistence for workshop/project data

## Architecture

- `src/domain`: VSM entities, factory functions, and completeness policies
- `src/application`: workspace repository coordination
- `src/infrastructure`: browser localStorage and export adapters
- `src/presentation`: browser UI
- `tests`: domain-level checks

## Tests

```sh
npm test
```
