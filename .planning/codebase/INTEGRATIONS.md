# External Integrations

**Analysis Date:** 2026-04-30

## APIs & External Services

**None detected.** The application makes no outbound HTTP/API calls at runtime. All data processing occurs in-browser. There are no calls to `fetch`, `XMLHttpRequest`, `axios`, or any HTTP client in production source files.

## Data Storage

**Databases:**
- None (no server-side database)

**Browser Storage — Primary:**
- `localStorage` - Diagram state persistence; key prefix `clouddiagram_state_*`
  - Implementation: `src/common/state/persistentAtoms.ts`
  - Writes are debounced 200ms to avoid choke on drag events
  - Flushed synchronously on `beforeunload` and `pagehide`
  - Read/write helpers: `persistentAtom()` and `persistentAtomFamily()` in `src/common/state/persistentAtoms.ts`

**Browser Storage — Cleanup:**
- `indexedDB` - Referenced only in `clearPersistedState()` at `src/common/persistence/statePersistence.ts`; deletes the `clouddiagram_state` database on reset. Not used for active writes.

**Storage Key:**
- `STORAGE_KEY = 'clouddiagram_state'` defined in `src/common/persistence/statePersistence.ts`
- Version: `STORAGE_VERSION = '1.0'`

**File Storage:**
- Local filesystem via browser download — diagram export writes files client-side (PNG, SVG, Mermaid text, PlantUML text, CloudDiagram JSON). No server upload.

**Caching:**
- None (no service worker, no CDN cache layer in source)

## Authentication & Identity

**Auth Provider:** None — no authentication mechanism exists in the codebase.

No login, session, token, or auth library imports detected anywhere in `src/`.

## Persistence Mode

**Two modes** (not an external service, but a key integration point for host apps):

- `PersistenceMode.Local` (default) — writes to `localStorage` automatically
- `PersistenceMode.Host` — disables all `localStorage` reads/writes; host app is responsible for persistence

Controlled via `PersistenceService.setPersistenceMode(mode)` at `src/services/persistence/persistenceService.ts`. Host apps using the npm package call this to take ownership of state persistence.

## Monitoring & Observability

**Error Tracking:** None — no Sentry, Datadog, or similar SDK detected.

**Logs:**
- `console.log` / `console.error` used directly throughout for storage errors and IndexedDB lifecycle events (e.g., `src/common/persistence/statePersistence.ts`, `src/common/state/persistentAtoms.ts`)
- No structured logging library

## CI/CD & Deployment

**Hosting:** Not configured in source — no deployment config files (Vercel, Netlify, Dockerfile, etc.) detected.

**CI Pipeline:** Not configured — no `.github/workflows/`, `.circleci/`, or similar CI config found.

## Export Format Integrations

The app implements **import/export bridges** to external diagram format ecosystems. These are pure text-format parsers/serializers — no network calls.

**Mermaid** (import + export):
- Supported diagram types: Sequence, Class/Structure, Flowchart, Gantt, ER, Pie Chart
- Entry: `src/features/export/mermaidFormat.ts`
- Per-type exporters: `src/features/export/mermaid/mermaidClassExporter.ts`, `mermaidGanttExporter.ts`, `mermaidErExporter.ts`, `mermaidPieExporter.ts`
- Per-type importers: `src/features/export/mermaid/mermaidErImporter.ts`, `mermaidPieImporter.ts`, `mermaidImportUtils.ts`

**PlantUML** (export only):
- Supported diagram type: Sequence
- Entry: `src/features/export/plantUmlSequenceFormat.ts`

**Lucid Charts** (export only):
- Supported diagram type: Sequence
- Entry: `src/features/export/lucidSequenceFormat.ts`

**PNG / SVG** (export only):
- Raster export via Konva stage: `src/features/export/pngFormat.ts`
- Vector export via react-konva-to-svg: `src/features/export/svgFormat.ts`

**CloudDiagram JSON** (import + export):
- Native format; schema versioned (`CLOUD_DIAGRAM_SCHEMA_VERSION`)
- Entry: `src/features/export/CloudDiagramFormat.ts`

## AWS Architecture Diagram Icons

The app bundles SVG icons for AWS services — used as static diagram node shapes, not as SDK integrations:
- SQS, Kinesis, ELB, Route53, S3, CloudFront, ECS, DynamoDB, Lambda, WAF, Cognito, API Gateway
- Location: `src/features/graphics/aws/` (SVG files)
- Reader: `src/features/graphics/graphicsReader.ts`

## Webhooks & Callbacks

**Incoming:** None

**Outgoing:** None

## MCP Server (Dev Tooling Only)

**File:** `mcp-server-playwright.ts` (root of project, not part of npm package)

- Implements a local Model Context Protocol server exposing browser automation tools (navigate, screenshot, click, type, get_content) via Playwright/Chromium
- Uses `@modelcontextprotocol/sdk` 1.25.3 and `playwright` 1.49.0
- **Not included in the library build** — excluded from `dist/lib/editor.js`
- Purpose: AI-assisted development tooling; not a production integration

## Environment Configuration

**Required env vars:** None — no environment variables are required at runtime.

**Secrets location:** Not applicable — no secrets are needed.

---

*Integration audit: 2026-04-30*
