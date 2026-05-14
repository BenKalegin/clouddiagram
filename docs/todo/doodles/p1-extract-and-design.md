# P1 — Extract services + design doodle language

Two parallel tracks: **extract** (mechanical, no behavior change) and **design** (the public schema).

## Track 1 — Mechanical extract

Move from clouddiagram into a new workspace, with no functional change.

### Steps

1. Create `github.com/BenKalegin/doodles` (monorepo, mirroring filigree's layout).
2. Workspace packages:
   - `@benkalegin/doodles-core` — types, validate, migrate
   - `@benkalegin/doodles-mermaid` — Mermaid parser → Doodle
   - `@benkalegin/doodles-layout` — wraps filigree, applies doodle hints
   - `@benkalegin/doodles-svg` — Doodle → SVG (with theme)
   - `@benkalegin/doodles-api` — single-import facade re-exporting the above
3. Move from clouddiagram repo:
   - `src/features/export/mermaid/*` → `packages/doodles-mermaid/src/`
   - `src/features/layout/*` → `packages/doodles-layout/src/`
   - `src/package/packageModel.ts` (Diagram, NodeState, LinkState, etc.) → `packages/doodles-core/src/`
   - `src/features/layout/layoutTesting.ts` → `packages/doodles-core/src/testing/` (exported separately)
   - Relevant tests follow the source files
4. clouddiagram-editor `dependsOn @benkalegin/doodles-api`, imports replace local paths.
5. Publish `@benkalegin/doodles-* 0.1.0` to GitHub Packages.

### Acceptance for track 1

- clouddiagram-editor's full test suite still passes.
- clouddiagram-editor's UI behaves identically to before extract.
- No public API contracts change.
- Doodles 0.1.0 published.

## Track 2 — Design the doodle language

The public schema. Versioned, validated, migratable.

### Top-level shape

```ts
interface Doodle {
  version: "1.0";                  // semver, migrations live in doodles-core
  metadata?: Record<string, unknown>;  // free-form (author, source-type, source-text, etc.)
  theme?: ThemeRef;                // string reference, resolved at render time
  nodes: DoodleNode[];
  edges: DoodleEdge[];
  compounds: DoodleCompound[];
  hints: DoodleHint[];             // pin, sameLayer, orderBefore, group, focus
}

interface DoodleNode {
  id: string;                      // stable across edits — see Identity below
  label: RichText;
  kind: string;                    // 'process' | 'decision' | 'aws-ec2' | … (open registry)
  shape?: ShapeId;                 // overrides kind's default shape
  position?: { x: number; y: number };  // pinned position; layout honors it
  size?: { width: number; height: number };  // pinned size
  z?: number;                      // z-order within siblings
  style?: NodeStyle;               // overrides theme; explicit colors, borders
  parent?: string;                 // compound id; replaces explicit compound.children
}

interface DoodleEdge {
  id: string;
  source: { nodeId: string; portHint?: PortHint };
  target: { nodeId: string; portHint?: PortHint };
  label?: RichText;
  style?: EdgeStyle;
  waypoints?: { x: number; y: number }[];  // pinned bend points (skipped by layout)
}

interface DoodleCompound {
  id: string;
  label?: RichText;
  kind: string;                    // 'subgraph' | 'aws-vpc' | 'aws-region' | …
  parent?: string;                 // nested compounds
  style?: CompoundStyle;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

type DoodleHint =
  | { kind: 'pin'; nodeId: string; x: number; y: number }
  | { kind: 'same-layer'; nodeIds: string[] }
  | { kind: 'order-before'; before: string; after: string }
  | { kind: 'group'; nodeIds: string[] }
  | { kind: 'focus'; nodeId: string; centerX?: number; centerY?: number };
```

### Node identity (load-bearing for morphs)

- Every node has a stable `id` that survives label / position / style edits.
- Inbound compilers generate ids from source identifiers (Mermaid `Upload` → `mermaid:Upload`). Re-importing the same source produces the same ids → morph matches by id automatically.
- For free-form edits, ids are generated (nanoid or counting).
- For agent rewrites that don't preserve source ids, doodles offers an `identityResolver` callback. Default: by-id. Pluggable: text-similarity, structural-similarity.

```ts
interface IdentityResolver {
  match(from: DoodleNode, candidates: DoodleNode[]): DoodleNode | undefined;
}
```

### Validation rules

`doodles.validate(d) → ValidationResult` enforces:

- Every `edge.source.nodeId` / `edge.target.nodeId` references an existing node or compound.
- Every `node.parent` / `compound.parent` references an existing compound.
- No cycles in compound nesting.
- Every `hint` references existing ids.
- `version` is supported by the current doodles release.
- No duplicate ids across nodes + edges + compounds.

`validate` is total: returns errors and warnings, never throws.

### Versioning approach

- Doodle file format is semver-versioned. Breaking schema changes bump major.
- `doodles.migrate(d) → Doodle` runs registered migrations to bring a doodle to the current version. Idempotent.
- Inbound compilers always emit the current version.
- Consumers always read → migrate → use. The runtime always works in the current version.
- Old files keep working forever via migrations; new files can use new features.

### Render API takes preferences

```ts
doodles.svg.render(d, {
  theme: ThemeTokens,             // structured tokens (colors, font, spacing)
  viewport?: { width, height, padding? },
  accessibility?: { ariaLabel?, role? },
  animation?: MorphScript,        // for playback
  hints?: { ... }                 // renderer-specific tweaks
}) → SVGString;
```

Theme is a structured object, not a string id. Shared `ThemeTokens` interface in `doodles-core`. cd-editor's user prefs and ax's markdown theme both translate to `ThemeTokens` once and pass it in. Same function, same output.

### Deliverables for track 2

1. Schema types in `doodles-core` with JSON Schema generation.
2. `doodles.validate` + `doodles.migrate`.
3. `doodles-svg` renderer (new code, separate from cd's Konva renderer).
4. Theme tokens definition.
5. Schema docs (`docs/schema.md`) with examples.
6. Doodles `0.2.0`.

### Acceptance for track 2

- All inbound compilers emit valid doodles per `validate`.
- Round-trip: `parse → validate → migrate → render` produces an SVG for every test fixture without warnings.
- cd-editor still operates on the same internal model; doodles types are the public surface.
