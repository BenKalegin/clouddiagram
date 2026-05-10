# Technology Stack

**Analysis Date:** 2026-04-30

## Languages

**Primary:**
- TypeScript 5.9.3 - All application source in `src/`
- TSX (TypeScript JSX) - React component files throughout `src/features/`, `src/editor/`

**Secondary:**
- CSS/SCSS - Styles; one CSS Module in `src/features/classDiagram/Link.module.scss`; global styles in `src/index.css`
- SVG - Inline diagram graphics in `src/features/graphics/aws/` and `src/features/graphics/`

## Runtime

**Environment:**
- Browser (DOM target); no Node.js server runtime in production
- Node.js 25.x used only for local dev tooling (confirmed version: v25.2.1)

**Package Manager:**
- npm 11.6.2
- Lockfile: present (`package-lock.json`, lockfileVersion 2)

## Frameworks

**Core:**
- React 19.2.5 - UI rendering (`src/index.tsx` → `src/app/App.tsx`)
- React DOM 19.2.5 - Browser rendering, `createRoot` in `src/index.tsx`

**Canvas Rendering:**
- Konva 9.3.22 - 2D canvas drawing engine for diagram rendering
- react-konva 19.2.3 - React bindings for Konva; used throughout diagram editor components
- react-konva-to-svg 1.0.2 - Converts Konva stages to SVG for export (`src/features/export/svgFormat.ts`)

**UI Component Library:**
- MUI (@mui/material) 6.5.0 - Material UI components (53+ import sites across `src/features/`)
- MUI Icons (@mui/icons-material) 6.5.0 - Icon set for toolbar/controls
- Emotion React 11.14.0 + Emotion Styled 11.14.1 - CSS-in-JS used by MUI
- @fontsource/roboto 4.5.8 - Self-hosted Roboto font; loaded in `src/index.tsx`

**State Management:**
- Jotai 2.19.1 - Primary atom-based state (42+ import sites); atoms in `src/features/*/` and `src/common/state/`
- jotai-family 1.0.1 - `atomFamily` for per-diagram-element atoms; used in `src/common/state/persistentAtoms.ts`
- @reduxjs/toolkit 2.11.2 - Secondary slice-based state; `createSlice` in `src/features/diagramEditor/diagramEditorSlice.ts` (39+ import sites)

**Interaction:**
- react-draggable 4.5.0 - Draggable panels; used in `src/features/structureDiagram/NodeContentNoIconRect.tsx` and diagram editor components
- react-hotkeys-hook 4.6.1 - Keyboard shortcut handling; used in `src/features/diagramTabs/KeyboardShortcutsHandler.tsx`
- use-image 1.1.1 - Async SVG/image loading for Konva shapes in `src/features/graphics/graphicsReader.ts`

**Testing:**
- Vitest 4.1.5 - Unit and integration test runner (configured in `vite.config.ts`)
- @testing-library/react 16.3.2 - React component testing utilities
- @testing-library/jest-dom 6.9.1 - Custom DOM matchers; configured via `vitest.setup.ts`
- @testing-library/user-event 14.6.1 - Simulates user interactions in tests
- jsdom 29.1.0 - DOM environment for tests (set as `environment: "jsdom"` in `vite.config.ts`)
- Cypress 13.17.0 - End-to-end browser testing; config in `cypress.config.ts`, specs in `cypress/e2e/`

**Build/Dev:**
- Vite 8.0.10 - Dev server and bundler; config in `vite.config.ts`; dev port 3000
- @vitejs/plugin-react 6.0.1 - Vite plugin for React/JSX transform
- vite-plugin-dts 4.5.4 - Generates `.d.ts` declarations for the library build; config in `vite.config.ts`
- sass 1.85.0 - SCSS preprocessing for `*.module.scss` files
- typescript 5.9.3 - Type checking; `tsconfig.json` (app), `tsconfig.editor.json` (library types)
- start-server-and-test 2.0.0 - Starts dev server then runs Cypress for `npm run test:e2e`

**MCP Tooling (dev only):**
- @modelcontextprotocol/sdk 1.25.3 - MCP server SDK; used in `mcp-server-playwright.ts` (a local dev helper, not part of the library)
- playwright 1.49.0 - Browser automation; used only by `mcp-server-playwright.ts`

## Key Dependencies

**Critical:**
- `konva` 9.3.22 - Core canvas engine; all diagram rendering depends on it (`src/features/*/`)
- `react-konva` 19.2.3 - Bridges React state to Konva canvas; architectural backbone
- `jotai` 2.19.1 - Primary reactivity layer; removing/replacing would require rewriting most state
- `@reduxjs/toolkit` 2.11.2 - Manages undo/redo and diagram editor state; `diagramEditorSlice.ts`
- `@mui/material` 6.5.0 - All UI chrome (toolbar, dialogs, properties panel)

**Infrastructure:**
- `classnames` 2.3.1 - Utility for conditional class strings (devDependency; used at build time)

## Configuration

**Environment:**
- No `.env` files detected — no runtime environment variables required by the app itself
- `PersistenceMode` toggled programmatically via `PersistenceService.setPersistenceMode()` at `src/services/persistence/persistenceService.ts`

**Build:**
- `vite.config.ts` - Controls both app build (`outDir: build`) and library build (`outDir: dist/lib`, `--mode library`)
- `tsconfig.json` - App TypeScript config (strict mode, `moduleResolution: bundler`, `jsx: react-jsx`)
- `tsconfig.editor.json` - Extends `tsconfig.json`; emits declarations to `dist/editor-types/` for npm package
- Library entry: `src/editor/index.ts`; externalizes only React/React-DOM; bundles all other deps

## Platform Requirements

**Development:**
- Node.js 18+ (tested with 25.2.1); npm 11+
- Run `npm start` or `npm run dev` to start Vite dev server on port 3000

**Production:**
- Distributable: npm package `clouddiagram-editor` v0.1.0 (`dist/lib/editor.js`, ES module format)
- Peer dependencies: React ≥ 19, React-DOM ≥ 19 (must be provided by host application)
- Browser target: modern browsers supporting ESM
- Standalone app build: `npm run build` → `build/` directory (static SPA)

---

*Stack analysis: 2026-04-30*
