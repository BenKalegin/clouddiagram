# P3 — Agent morphs

Depends on [P1](./p1-extract-and-design.md). AWS-presentation use cases drive the design:

- "Add a cache level between A and B."
- "Move A to VPC v2."
- "Replace the load balancer with API Gateway."

Each is a small structural change. The user wants the diagram to **morph** smoothly, keeping focused nodes in view, not flash-redraw.

## Architecture

```
User intent (chat) ──► Agent ──► Doodle commands ──► doodles.apply(doodle, cmds) ──► new doodle
                                                                                          │
                                                  ┌───────────────────────────────────────┘
                                                  ▼
                                  doodles.morph.plan(old, new, focus?) ──► MorphScript
                                                                                  │
                                  cd-editor (Konva) plays MorphScript ◄──────────┘
                                          (or doodles-svg via CSS animations
                                           for inline ax playback)
```

## Doodle commands (CQRS write side)

A closed enum of mutations the agent (or human) can emit. Each command produces a `DoodleEvent`.

```ts
type DoodleCommand =
  | { kind: 'AddNode'; id: string; label: RichText; nodeKind: string; parent?: string; hints?: NodeHints }
  | { kind: 'RemoveNode'; id: string }
  | { kind: 'EditLabel'; id: string; label: RichText }
  | { kind: 'MoveToCompound'; nodeId: string; compoundId: string }       // re-parent
  | { kind: 'AddEdge'; id: string; source: EdgeEndpoint; target: EdgeEndpoint; label?: RichText }
  | { kind: 'RemoveEdge'; id: string }
  | { kind: 'Pin'; id: string; position: { x: number; y: number } }
  | { kind: 'Unpin'; id: string }
  | { kind: 'AddCompound'; id: string; compoundKind: string; parent?: string; label?: RichText }
  | { kind: 'RemoveCompound'; id: string }
  | { kind: 'SetTheme'; themeRef: string };

doodles.apply(doodle, commands) → { newDoodle: Doodle; events: DoodleEvent[] };
```

Events are the substrate for:
- Undo / redo in cd-editor.
- AI's "explain what I did" capability.
- Audit log for compliance-sensitive AWS diagrams.

## Morph planner

```ts
doodles.morph.plan(from: Doodle, to: Doodle, opts?: {
  focus?: NodeId[];              // these stay in viewport
  defaultDuration?: number;       // ms
  identityResolver?: IdentityResolver;  // see P1 schema
}) → MorphScript;
```

### Match algorithm

1. Index `from` and `to` by id. Direct id matches → produce `Transition.Move | Transition.Identity`.
2. Unmatched `to` nodes → `Transition.FadeIn(finalPos)`.
3. Unmatched `from` nodes → `Transition.FadeOut(initialPos)`.
4. Edges: matched by `(source.id, target.id)`. New edges fade in after their source/target nodes have arrived; removed edges fade out before their endpoints depart.
5. Compounds: re-parented nodes get `Transition.Reparent(oldCompound, newCompound, oldPos, newPos)` — animates relative position smoothly across the compound boundary.

### Focus preservation

During morph playback, the viewport pans so that the focus node's center stays at the same screen position. Computed as a viewport transform overlay on the script.

```ts
interface MorphScript {
  duration: number;
  transitions: Transition[];
  viewport?: { focusAnchor: { id: string; screenPos: { x: number; y: number } } };
}
```

### Playback

- **cd-editor**: drives Konva tweens, ~30fps. Tweening is native to Konva.
- **doodles-svg**: emits CSS animation declarations for the same script — so ax can show the same morph in markdown views (e.g., tutorial GIFs or runtime playback).

Both surfaces interpret the same `MorphScript`. Playback is rendering-engine-specific, the script is portable.

## Agent integration

### Tool definition for Claude (or another LLM)

```typescript
// pseudocode for an Anthropic tool spec
{
  name: "doodles.applyCommands",
  description: "Apply a list of mutations to the current doodle. Returns the new doodle.",
  input_schema: {
    type: "object",
    properties: {
      commands: { type: "array", items: { $ref: "DoodleCommand" } }
    }
  }
}
```

### System prompt content

- Schema reference for current doodles version.
- Common AWS kind palette: `aws-ec2`, `aws-lambda`, `aws-rds`, `aws-s3`, `aws-vpc`, `aws-alb`, `aws-cloudfront`, `aws-route53`, `aws-sqs`, …
- Conventions:
  - "Place caches between consumer and provider."
  - "Group AWS services by VPC compound when source diagram has one."
  - "Use `Pin` for elements the user explicitly placed."
- Example interactions (few-shot) showing intent → command list.

### Flow

1. User types intent in chat panel.
2. Agent receives intent + current doodle + chat history.
3. Agent emits a `DoodleCommand[]`.
4. `doodles.apply(currentDoodle, commands) → newDoodle, events`.
5. `doodles.morph.plan(currentDoodle, newDoodle, { focus: userVisible })` → script.
6. cd-editor previews morph (no commit yet).
7. User accepts → commit + emit events. User rejects → revert.

## AWS-presentation specifics

The user's primary use case is cloud architecture diagrams. The morph planner should be tuned for:

- **Insert-between**: "add cache between A and B." The new node arrives at the midpoint of the existing edge, the edge splits in two. Existing nodes shift apart smoothly.
- **Re-containment**: "move A to VPC v2." The compound boundary itself animates (VPC v2 grows; VPC v1 shrinks). The node's center crosses the boundary.
- **Replace**: "replace ALB with API Gateway." The old node fades out as the new one fades in at the same position; edges re-anchor.
- **Restructure**: "split the monolith." Multiple new nodes emerge from the original's position, spread outward to layered positions. Old node fades; new edges fan out.

Each of these maps to a small set of commands. The morph planner produces visually coherent transitions because it knows the topology change is small.

## Out of scope for P3 v1

- Multi-step morph storyboards (intermediate states between A and B).
- Agent-suggested layouts beyond filigree's auto-layout.
- Multi-user collaboration / OT-style command merging.
- Domain-specific reasoning (cost estimation, security implications). The agent stays at the visual level.
- Non-Mermaid input compilers (PlantUML, BPMN) — these are inbound; agent works on the doodle directly.

## Phases

1. **Design doc + command schema** — write `DoodleCommand` types, `apply` function signature, `MorphScript` shape. No implementation.
2. **`doodles.apply` prototype** — implement the command interpreter. Tests against a fixture set ("starting state X + command Y → expected state Z").
3. **`doodles.morph.plan` prototype** — basic id-based matcher, position interpolation, edge re-anchoring. Test by snapshotting MorphScripts for representative state pairs.
4. **cd-editor playback** — Konva tween driver consuming MorphScript. Manual test on one fixture.
5. **Agent integration** — Claude tool definition, system prompt, chat UI in cd-editor. End-to-end test: "add cache between A and B" prompt produces a working morph.
6. **doodles-svg playback** — CSS animation emission for ax's inline morph display.
7. **AWS palette** — kinds + iconography + conventions in the system prompt.

Each phase is reversible and small enough to evaluate independently.

## Acceptance for P3 v1

- Single end-to-end demo: user types "add Redis cache between API and database" in cd-editor's chat panel; agent emits commands; doodle updates; morph plays for ~1 second; new cache node visible with edges; user accepts.
- All commands have apply + reverse-apply (for undo).
- MorphScript is JSON-serializable (for ax playback later).
- At least 5 AWS kinds rendered correctly (ec2, lambda, rds, s3, vpc).
