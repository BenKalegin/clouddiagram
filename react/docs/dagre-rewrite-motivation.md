# Motivation for replacing dagre with a custom layout engine

Dagre implements the full Sugiyama layered-graph algorithm (cycle removal → rank assignment → crossing minimisation → coordinate assignment). It was designed for flat directed graphs. Compound/clustered graphs are a bolted-on extension that was never fully integrated, and it shows in several ways that are hard to work around without forking the library.

## Core problems

### 1. Compound graph API is unreliable
Dagre does not produce usable cluster bounding-box coordinates for compound nodes. After layout we ignore all cluster coordinates from dagre and recompute bounding boxes bottom-up from the positioned leaf nodes (`computeClusterBoundsFromNodes`). This is a known dagre limitation that has been open for years.

### 2. Rank inversions from back-flow edges inside clusters
When edges cross cluster boundaries in the "wrong" direction (minority direction for a cluster pair), dagre's rank-assignment phase pulls cluster members to the wrong rank tier. This manifests as nodes appearing outside their parent cluster rectangle.

Workaround: `filterMinorityClusterEdges()` — majority-vote filter that drops minority-direction cross-cluster edges before running dagre. Fragile: it discards semantic information and breaks on equal-count tie cases.

### 3. Cluster widths inflated by edge routing
Dagre routes inter-cluster edges through virtual nodes that contribute to rank-width calculations. This causes cluster containers to be stretched horizontally far beyond what their member nodes require.

### 4. Sibling nodes ranked inside nested clusters
A node that is a sibling of a cluster (same nesting level) can be assigned the same rank as leaf nodes *inside* that cluster, because dagre's rank assignment does not respect cluster-boundary semantics. The node ends up visually co-ranked with deeper nodes.

### 5. No control over intra-cluster layout
All subgraph members share the global rank grid. You cannot give a nested cluster a different layout direction or spacing from its parent without running a separate dagre instance.

---

## Issue examples

### Example 1 — Back-flow edges eject nodes from cluster

```
graph TD
    subgraph AWSServices [AWS Services Layer]
        subgraph DDBTables [DynamoDB Tables]
            DDBVS[VehicleState]
            DDBFifo[FifoQueue]
        end
        subgraph SQSQueues [SQS Queues]
            SQSVeh[VehicleQueue]
        end
    end
    subgraph LambdaLayer [Lambda Functions]
        VL[VehicleLambda]
        PL[ProcessLambda]
    end

    SQSVeh --> VL
    SQSVeh --> PL
    VL --> DDBVS
    PL --> DDBFifo
```

**What dagre does:** `VL → DDBVS` and `PL → DDBFifo` are back-flow edges (Lambdas are ranked after DynamoDB by the majority edge direction). Dagre's rank assignment honours these edges and pulls `DDBVS`/`DDBFifo` to a lower rank than LambdaLayer, placing them outside the AWSServices cluster rectangle.

**Current workaround:** Count edges in both directions for each root-cluster pair; drop the minority direction before running dagre.

**Custom engine fix:** Cluster-aware rank assignment: freeze member rank ranges per cluster, then route inter-cluster edges to cluster-boundary virtual nodes only.

---

### Example 2 — Cluster width inflation from edge routing

```
graph LR
    subgraph CoreSvcs [Core Services]
        Auth[Auth Service]
        Gateway[API Gateway]
        Cache[Redis Cache]
    end
    subgraph Clients [Clients]
        Web[Web App]
        Mobile[Mobile App]
    end
    subgraph Storage [Storage]
        DB[PostgreSQL]
        S3[S3 Bucket]
    end

    Web --> Gateway
    Mobile --> Gateway
    Gateway --> Auth
    Gateway --> Cache
    Auth --> DB
    Cache --> DB
    Gateway --> S3
```

**What dagre does:** Edges from `Gateway → S3` cross the CoreSvcs boundary. Dagre inserts virtual "dummy" nodes along long inter-rank edges to route them. These dummy nodes participate in the `nodesep` spacing calculation, stretching CoreSvcs horizontally to accommodate edge clearance — the cluster ends up 2-3× wider than its member nodes need.

**Custom engine fix:** Route inter-cluster edges outside cluster bounds; dummy nodes belong to a global routing layer, not to the source cluster.

---

### Example 3 — Sibling node co-ranked with nested cluster members

```
graph TD
    subgraph AWSServices [AWS Services Layer]
        subgraph DDBTables [DynamoDB Tables]
            DDB1[Table A]
            DDB2[Table B]
        end
        Kinesis[Kinesis Stream]
    end
    subgraph LambdaLayer [Lambda Functions]
        L1[Lambda A]
        L2[Lambda B]
    end

    L1 --> DDB1
    L2 --> DDB2
    L1 --> Kinesis
```

**What dagre does:** `Kinesis` is a sibling of `DDBTables` inside `AWSServices`. Because `L1 → Kinesis` and `L1 → DDB1` have the same depth from the source, dagre assigns `Kinesis` the same rank as `DDB1` and `DDB2` — i.e., the same row as the *contents* of the nested cluster. Visually `Kinesis` floats mid-cluster at the wrong row instead of sitting beside `DDBTables`.

**Custom engine fix:** Cluster-level rank assignment: assign `Kinesis` and `DDBTables` to the same cluster-rank tier; only then subdivide `DDBTables` internally.

---

### Example 4 — Edge label position detached from path

```
graph TD
    SQS[SQS Queue] -->|S3 event notification| S3[S3 Bucket]
    SQS --> Lambda[Lambda]
    Lambda --> DDB[DynamoDB]
```

**What dagre does:** This is not strictly dagre's fault, but a consequence of using dagre's bounding-box midpoint for label placement. The label `"S3 event notification"` is positioned at the midpoint of the edge's axis-aligned bounding box. When the edge routes through several waypoints (orthogonal routing), the bounding-box centre is often far from the actual path midpoint, and the label floats in empty space.

**Custom engine fix:** Walk the polyline segments, compute the cumulative arc length, and place the label at the 50 % arc-length point.

---

## Size estimate for a custom engine

| Phase | Lines | Notes |
|---|---|---|
| Rank assignment (cluster-aware) | ~150 | Longest-path + cluster tier promotion |
| Crossing minimisation (1-pass barycentric) | ~100 | Good enough for ≤ 50 nodes |
| Coordinate assignment (Brandes-Köpf simplified) | ~150 | x-coord only; y from rank |
| Cluster bbox + padding | ~80 | Already written (`computeClusterBoundsFromNodes`) |
| Back-edge detection + reversal | ~60 | DFS; already partially exists |
| **Total** | **~540** | vs dagre's ~2 700 lines |

Effort estimate: **1.5–2 days** including tests. Crossing minimisation quality will be worse than dagre's multi-pass heuristic for large graphs (> 30 nodes), but acceptable for typical architecture diagrams.
