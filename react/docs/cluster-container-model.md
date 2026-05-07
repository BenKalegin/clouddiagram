# Cluster / Container Model

## Overview

A **cluster** (also called a container or folder) is a named grouping of nodes that is visually rendered as a bounding box with a label header. Examples: Mermaid `subgraph`, deployment containers, state diagram compound states.

Clusters are unified with regular nodes — they live in `diagram.nodes` and use `NodeState` as their element type, with `ElementType.Cluster` as the distinguishing type value.

| Layer | Type | Stored in | Scope |
|---|---|---|---|
| Semantic identity | `NodeState` (type=Cluster) | `elementsAtom(clusterId)` | Cross-diagram |
| Visual placement | `NodePlacement` | `diagram.nodes[clusterId]` | Per-diagram |

---

## `NodeState` for clusters (semantic, cross-diagram)

```typescript
// A cluster is a NodeState with type === ElementType.Cluster
interface NodeState extends DiagramElement, HasColorSchema {
    type: ElementType.Cluster;
    text: string;          // display label
    ports: Id[];
    memberNodeIds?: string[];  // IDs of directly-contained nodes
}
```

- Lives in `elementsAtom(clusterId)` — the same atom family used by all `NodeState` and `LinkState` elements.
- `memberNodeIds` is the authoritative parent→child relationship.
- The label is stored in `text` (same as all other nodes).

## `NodePlacement` (layout, per-diagram)

```typescript
type NodePlacement = {
    bounds: Bounds;
}
```

- Lives in `diagram.nodes[clusterId]` inside `StructureDiagramState` — same dict as regular nodes.
- Only stores the bounding box for this specific diagram.

---

## Parent-child relationship semantics

The relationship is **diagram-level**, not embedded in the node:

- Cluster membership is not stored inside child nodes; it lives in `NodeState.memberNodeIds` on the cluster and references node IDs.

This means the same node can have different parents in different diagrams, enabling multiple overlapping projections.

---

## Key files

| File | Role |
|---|---|
| `src/package/packageModel.ts` | `NodeState` with `memberNodeIds`, `ElementType.Cluster` enum value |
| `src/features/structureDiagram/structureDiagramState.ts` | `NodePlacement` (shared with regular nodes) |
| `src/features/structureDiagram/NodeContentContainer.tsx` | Visual renderer for cluster nodes |
| `src/features/structureDiagram/Node.tsx` | Routes `ElementType.Cluster` to `NodeContentContainer` |
| `src/features/structureDiagram/StructureDiagramEditor.tsx` | Sorts nodes by containment depth so containers render below children |
| `src/features/structureDiagram/structureDiagramModel.ts` | `moveElementImpl` — moves member nodes when cluster moves |
| `src/features/structureDiagram/structureDiagramHandler.ts` | `getElement` — reads cluster state via `elementsAtom` |
| `src/features/export/mermaid/mermaidStructureImporter.ts` | Populates `NodeState.memberNodeIds` from parsed `nodeParents` |
| `src/features/export/mermaid/mermaidDeploymentImporter.ts` | Same |
| `src/features/export/mermaid/mermaidStateImporter.ts` | Same |

---

## How importers wire up membership

Importers parse the source and build `nodeParents: { [nodeId]: clusterId }`. After auto-layout they invert this map and write cluster entries into both `nodes` (placement) and `elements` (state):

```typescript
// invert nodeParents → memberNodeIds per cluster
const clusterMembers: { [clusterId: string]: string[] } = {};
for (const [nodeId, clusterId] of Object.entries(nodeParents)) {
    (clusterMembers[clusterId] ??= []).push(nodeId);
}

for (const [clusterId, bounds] of Object.entries(clusterBoundsById)) {
    nodes[clusterId] = { bounds };
    elements[clusterId] = {
        id: clusterId,
        type: ElementType.Cluster,
        text: labelFor(clusterId),
        ports: [],
        colorSchema: defaultColorSchema,
        memberNodeIds: clusterMembers[clusterId] ?? []
    } as NodeState;
}
```

---

## Move behavior

When a cluster is dragged, `moveElementImpl` (in `structureDiagramModel.ts`):

1. Reads `NodeState.memberNodeIds` from `elementsAtom`.
2. Updates the cluster bounds in `diagram.nodes` (same as any node).
3. Applies the same delta to every member node's bounds in the diagram state.

This keeps member nodes co-located with their cluster without needing spatial heuristics.

---

## Rendering order

`StructureDiagramEditor` sorts all node IDs by containment depth before rendering, so parent containers have a lower z-index (rendered first) and child nodes appear on top. The depth is computed from the `memberNodeIds` graph at render time.
