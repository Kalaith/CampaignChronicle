## Campaign Chronicle

> Canonical frontend: `frontend/` (React/Vite). The root `index.html`,
> `app.js`, and `style.css` are retained as a compatibility archive only and
> are not part of the published product. They are owned by the Campaign
> Chronicle maintainer and scheduled for deletion after the compatibility
> review on **2026-12-31**. New features and fixes must target the React app.

D&D Campaign Companion — a small React + TypeScript frontend built with Vite to help manage campaigns, characters, locations, items, notes and relationships.

### Quick overview

- Frontend: `frontend/` — React + TypeScript + Vite app
- Archived compatibility files: `index.html`, `style.css`, `app.js`

### Prerequisites

- Node.js (LTS recommended) and npm available in your PATH
- Git (optional)

On Windows PowerShell, run commands from the project root or the `frontend` folder as shown below.

### Setup (frontend)

1. Change to the frontend directory:

   cd frontend

2. Install dependencies from the monorepo root:

   cd D:\WebHatchery
   npm ci

### Development

Start the Vite dev server with hot reload:

   npm run dev

Then open the local dev URL printed by Vite (usually http://localhost:5173).

### Build (production)

From `frontend/`:

   npm run build

This performs a TypeScript build and generates `frontend/dist` containing the production assets.

To preview the production build locally:

   npm run preview

### Linting

From the project root or `frontend/` run:

   npm run lint

### Publishing / Deployment notes

The root compatibility files are not published. Use the React build and the
project-root `publish.ps1` script; it publishes only the canonical frontend.

Simple manual deployment flow:

1. Build the frontend: `cd frontend && npm run build`.
2. Copy the contents of `frontend/dist` to your webserver document root (or appropriate subdirectory).

Example PowerShell copy (adapt paths to your environment):

   # From project root (adjust DEST_PATH)
   Copy-Item -Path .\frontend\dist\* -Destination "C:\inetpub\wwwroot\campaign_chronicle" -Recurse -Force

### Project structure (key files)

- `frontend/` — React + Vite app (source, scripts and tooling)
  - `package.json` — scripts: `dev`, `build`, `preview`, `lint`
  - `src/` — React components, hooks, styles, types
- `app.js`, `index.html`, `style.css` — small root-level assets
- `publish.ps1` — Windows PowerShell publish helper (needs review/adjustment)

### Troubleshooting

- If the root `npm ci` fails, ensure your Node version is compatible and you have network access to the npm registry.
- If TypeScript build errors occur during `npm run build`, run `npm run dev` to reproduce and inspect the console for file/typing problems.
- If preview ports are in use, set the Vite port via `--port` or in `vite.config.ts`.

### Next steps / notes

- If you want automated publishing like the included PowerShell script, I can update `publish.ps1` to target this project (build, deploy `frontend/dist`, and keep any backend folder if present). Tell me the exact deploy destination and any environment differences (`preview` vs `production`) and I will adapt it.

---

No license file is included in this repository — add one if you plan to open-source the project.
