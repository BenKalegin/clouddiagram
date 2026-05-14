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

### Current state (deferred)

The original sketch (full doodle stored in markdown frontmatter or sidecar files) is **deferred**. Reason: a full doodle bloats the semantic volume of the markdown source — typical doodle JSON is 1–3 KB and a complex AWS diagram is 10–20 KB, dwarfing the user's Mermaid text. Sidecar files fragment the document and complicate sharing. The previous `x-axonize:` per-block overlay (positions only) has been **removed from ax**'s visual-edit apply path — visual edit is now effectively preview-only until the future model below lands.

### Future direction — hint-based persistence

The new vision: a user (or LLM agent) makes a structural change in cd-editor. Instead of dumping all `(x, y, width, height)` coordinates back into the markdown, cd-editor emits a small, human-readable **hint** describing the change in semantic terms. Examples:

```yaml
x-axonize:
  hints:
    - pin: "Database"           # keep this node where it is now
      at: { x: 800, y: 200 }
    - move-between:             # insert the cache between API and DB
      node: "Redis cache"
      between: ["API", "Database"]
    - group:
      members: ["Lambda", "DynamoDB"]
      compound: "AWS services"
    - reparent:
      node: "API"
      into: "VPC v2"
```

Properties of this model:
- **Small** — a typical hint set is a handful of YAML lines, not kilobytes of JSON.
- **Readable** — a reviewer reading the markdown source can see what the visual edit semantically changed.
- **Robust to re-layout** — the auto-layouter consumes hints (`OrderBefore`, `Pin`, `Group`, `SameLayer` already exist in filigree), so the rendered result follows the intent even if other nodes move around.
- **LLM-friendly** — an agent can emit hints directly without computing pixel coordinates.

The hints subsystem already exists in filigree and is partially used in the import pipeline (`OrderBefore` for source-declaration order preservation). Extending it to capture user intent from cd-editor edits is the natural next step.

### What lands when this future model is implemented

1. cd-editor exposes a "what did the user change?" delta on save, expressed as a list of `Hint` objects.
2. ax serializes that delta into the Mermaid block's `x-axonize.hints:` frontmatter.
3. On render, ax parses Mermaid → applies hints → lays out via doodles → renders.
4. On re-open visual editor, the hints are loaded into cd-editor's hint registry, and the editor shows the diagram in its hinted state (and lets the user add/edit/remove hints).
5. Round-trip is lossless for hints; structural changes (add/remove nodes, rename) still flow through the Mermaid text.

This is its own work-item — call it **P2.4-hints** — and depends on cd-editor exposing the delta API.

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
