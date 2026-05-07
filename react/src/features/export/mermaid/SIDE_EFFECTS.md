# Mermaid import side effects

Notes about non-obvious behavior of the mermaid importers. Anything in this directory that surprises a future maintainer should be captured here.

## Element ID generation

Importers create node/port/link IDs via `createMermaidIdGenerator()` in `mermaidImportUtils.ts`. The generator's contract: **IDs are globally unique across all imports in the session**.

Implementation: `mermaid_<nanoid8>_<counter>`. The per-import `nanoid8` prefix is critical.

### History (do not regress)

The original generator returned `mermaid_${++counter}` with the counter starting at 0 each invocation. Two consequences:

1. Importing into two different diagrams produced colliding IDs (`mermaid_1`, `mermaid_2`, …) in both.
2. Element state lives in the global `elementsAtom(id)` family — not per-diagram. The second import's elements **overwrote** the first import's, corrupting the first diagram while leaving its `nodes`/`ports`/`links` reference maps intact but pointing to nothing.

Symptoms: switching back to a previously-imported diagram showed a black canvas and console errors like `Port placement is undefined for port mermaid_34 on node mermaid_2`. Already-corrupted diagrams cannot be auto-recovered; they have to be re-imported.

### Rule

Never make mermaid IDs deterministic across imports. If you reset the counter (e.g., to make tests stable), keep the per-import nanoid prefix or use a per-test fixture seed.

## Partially-populated nodes

Some importers (mind map and possibly others) write `NodeState` objects without a `ports` array. Renderers must defend with `(node.ports ?? [])` rather than `node.ports` — see `Node.tsx`. Don't "fix" this by deleting the fallback; the importers are the source of truth for what fields they set, and a fallback is cheaper than auditing every importer on every change.

## Crash hardening downstream

Renderers (`portRenderSelector`, `linkRenderSelector`, `Port.tsx`, `Link.tsx`, `Node.tsx`) return `null` when the diagram's port/node placement maps don't contain the referenced ID. This catches the deletion-teardown frame race **and** any cross-diagram corruption before it crashes the canvas. Keep these guards even if you "prove" they can't fire — empirically, they fire.
