# P2 — axonize renders Mermaid via doodles (identical to clouddiagram)

Depends on [P1](./p1-extract-and-design.md). Three substeps plus a theme bridge and golden tests.

## Goal

When the same Mermaid source appears:
- In a markdown block in axonize → rendered inline as SVG.
- Opened in clouddiagram-editor → rendered on Konva canvas.

…both renderings show the **same logical layout** (positions, edges, compound bounds). Pixel-identical isn't required across renderers; logical-layout identical is.

## Step 1 — Wire ax to consume `@benkalegin/doodles-api`

For each ```mermaid block in the markdown viewer:

```ts
import {mermaid, layout, svg} from "@benkalegin/doodles-api";

const doodle = mermaid.parse(blockSource);
const positioned = await layout(doodle);
const svgString = svg.render(positioned, { theme });
// inline the SVG in the DOM
```

- Drop ax's existing dagre/elkjs path entirely. Remove the deps from ax.
- ax stores nothing about the diagram beyond what was in the markdown source (for first-render — see step 2 for the visual-edit case).

## Step 2 — "Edit visually" handoff

ax has a button on each Mermaid block that opens cd-editor on that block. After P2:

- Handoff sends the **doodle** to cd-editor, not the Mermaid source. Preserves any post-import positioning, hints, and user style overrides.
- cd-editor opens, lets the user edit, returns the modified doodle.
- ax stores the modified doodle alongside the markdown (sidecar file `block.doodle.json`, or in the markdown frontmatter under a `doodles:` key, or in an Electron-side store keyed by block hash).

### Source-of-truth question

Once a Mermaid block has been visually edited, what's authoritative?

- **Option A — Doodle wins**: the saved doodle is the source of truth. The Mermaid source becomes a historical comment / starting point. Future re-renders use the doodle. Re-importing Mermaid would overwrite the doodle (explicit user action only).
- **Option B — Mermaid wins**: cd-editor regenerates Mermaid from the doodle on save (lossy export — hints and positions are lost). The markdown file always has the canonical text.

**Recommendation: Option A.** Mermaid is fire-and-forget input. Once a user customizes, that customization is the document. Mermaid → doodle is one-way; doodle is the artifact.

### Storage shape

```yaml
# in the markdown frontmatter
---
title: My architecture
doodles:
  block-3a4f: { ... }  # serialized doodle, keyed by block hash
---

# ...

```mermaid
graph TB
  A --> B
```
```

Block hash keys are stable across edits to the Mermaid source as long as the source doesn't change. When the source changes, the doodle is invalidated (or migrated, if structure-compatible).

## Step 3 — Golden tests for cross-app consistency

In the doodles repo, a fixtures directory of representative Mermaid sources:

```
packages/doodles-mermaid/fixtures/
   erp-ui-surfaces.mmd
   rag-pipelines.mmd
   aws-architecture.mmd
   …
```

For each fixture, a golden test:

```ts
import {mermaid, layout} from "@benkalegin/doodles-api";

const doodle = mermaid.parse(readFixture("rag-pipelines.mmd"));
const positioned = await layout(doodle);

// Snapshot positions/bounds. Stored as JSON in fixtures/, gitignored under .snapshot.
expect(snapshot(positioned)).toMatchSnapshot();
```

cd-editor's Konva renderer must consume the same `positioned` doodle and produce the same logical layout. A separate test in clouddiagram-editor renders each fixture into a "logical layout" snapshot from the Konva tree and compares against the doodles-svg snapshot. Drift fails the test.

## Theme bridge

ax and cd-editor must agree on theme tokens. Define `ThemeTokens` in `doodles-core`:

```ts
interface ThemeTokens {
  colors: {
    background: string;
    foreground: string;
    nodeFill: string;
    nodeStroke: string;
    nodeText: string;
    edgeStroke: string;
    edgeText: string;
    compoundFill: string;
    compoundStroke: string;
    compoundLabel: string;
    // …
  };
  font: { family: string; size: number; lineHeight: number };
  spacing: { padding: number; nodeSep: number; layerSep: number };
  shapes: Partial<Record<ShapeId, ShapeStyle>>;
}
```

Both apps map their internal theme system to `ThemeTokens` before calling `svg.render`. No theme leakage across the wire.

## Acceptance for P2

- ax renders every fixture in the doodles repo inline as SVG.
- "Edit visually" round-trip: Mermaid → ax displays → user clicks edit → cd-editor opens → user moves a node → save → ax displays the updated render.
- Drop dagre and elkjs from ax's `package.json`.
- Golden tests pass; cross-renderer drift detected.

## Out of scope for P2

- Server-side rendering (Node-side `svg.render` for static-site export). Schema supports it; implementation later.
- "Live edit" — ax displaying the cd-editor surface inline rather than as a popout. Future enhancement.
