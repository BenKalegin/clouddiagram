# Doodles — planning

Planning for a new shared layer that owns diagram parsing, layout request, and rendering, sitting between domain apps (clouddiagram editor, axonize) and the layout library (filigree).

The goal is that **one Mermaid source renders identically in clouddiagram and axonize**, by construction: both apps consume the same `doodles` package and the same renderer functions.

## Layer model

```
                 ┌──────────────────────────────────────────────────┐
                 │ axonize           clouddiagram editor            │
                 │ (markdown view)   (Konva canvas, properties      │
                 │                    panel, undo, drag, select)    │
                 └──────────┬───────────────────────┬───────────────┘
                            │                       │
                            │  doodles facade API   │
                            ▼                       ▼
                 ┌──────────────────────────────────────────────────┐
                 │ doodles                                          │
                 │ • Internal format (versioned schema)             │
                 │ • Compilers in: mermaid, plantuml, bpmn, uml     │
                 │ • Compiler out: doodles → SVG                    │
                 │ • Auto-layout request (delegates to filigree)    │
                 │ • Morph planner: doodles_v1 + doodles_v2 → trans │
                 │ • Command/event log (CQRS surface)               │
                 └──────────┬───────────────────────────────────────┘
                            │
                            ▼
                 ┌──────────────────────────────────────────────────┐
                 │ filigree                                         │
                 │ • Pure layout algorithms                         │
                 │ • Hints                                          │
                 │ • Generic graph in, positioned graph out         │
                 └──────────────────────────────────────────────────┘
```

## Responsibilities

| Layer | Knows about | Doesn't know about |
|---|---|---|
| **filigree** | Graphs, layered/force/tree algorithms, hints | Mermaid, Konva, themes, ports, RichText |
| **doodles** | Mermaid syntax, the doodle model, ports + port-alignment conventions, themes, SVG rendering | Konva, Electron, editor state, undo/redo |
| **clouddiagram editor** | Drag, select, properties panel, undo, keyboard shortcuts, Konva canvas | Mermaid parsing (delegates to doodles) |
| **axonize** | Markdown rendering, Mermaid block detection, "edit visually" handoff | Layout, diagram parsing (delegates to doodles) |

## Why a separate layer (and not just sharing cd's internal code)

1. **Identical rendering is a property of architecture, not discipline.** Both apps call the same function on the same data → same output.
2. **clouddiagram keeps Konva.** Konva is necessary for animations, virtual screens, performance at scale. SVG is the canonical *export* / inline-render format; Konva is the interactive surface. Both consume the same doodles model.
3. **Multiple inbound languages.** Mermaid is one of several inputs (PlantUML, BPMN, UML planned). A separate layer makes adding compilers a contained change.
4. **AI agents need a stable target.** Agents emit commands against the doodle schema, not against Mermaid source. The schema is the contract.

## Naming

"doodles" is the working name. It's available on GitHub and short to type. The npm scope `@benkalegin/doodles-*` per-package keeps options open if you want to rebrand the workspace later without renaming every sub-package. Alternatives that age better for enterprise audiences: `schematic`, `synoptic`, `glyph-lang`. Not worth churning over now.

## Three workstreams

- [P1 — Extract services + design doodle schema](./p1-extract-and-design.md)
- [P2 — axonize renders Mermaid via doodles, identical to cd](./p2-axonize-integration.md)
- [P3 — Agent morphs (add cache, move to VPC v2, …)](./p3-agent-morphs.md)

## Suggested cadence

- **Weeks 1–2**: P1 track 1 (mechanical extract). cd-editor still works, tests still pass. Doodles `0.1.0` published, doing exactly what cd does today.
- **Weeks 2–4**: P1 track 2 (schema cleanup). Refine public types, write validate/migrate, add doodles-svg renderer. Doodles `0.2.0`.
- **Weeks 3–5**: P2 wires ax (in parallel with track 2 finishing). ax renders Mermaid via doodles. Drop ax's dagre/elkjs.
- **Weeks 5+**: P3 starts as a design doc, then prototype one AWS-style example (add cache between A and B) end to end. Agent tool integration comes after.

## Open clarifications

Before P1 track 2 (schema) lands:

1. **Does cd ever need to export Mermaid back from a doodle?** Round-trip vs one-way matters for the data model. The current recommendation is one-way (Mermaid → doodle is lossy by design; the doodle becomes the source of truth after import).
2. **Theme parity between ax and cd.** Same theme tokens or separate? Recommendation: shared `ThemeTokens` interface in `doodles-core`; both apps map their own theme system to it before calling render.
3. **AWS kind registry.** Open-ended `string` (anyone can register a kind) or a closed enum we control? Recommendation: open-ended `string` with a curated default palette, similar to filigree's algorithm IDs.

## Out of scope (for now)

- Multi-user / real-time collaboration on doodles.
- Server-side rendering (`doodles → SVG` from Node) — design supports it but not a priority.
- Domain-specific reasoning (cost estimation, security review). The agent stays at the visual level.

## Test layout (organize, don't grow)

| Today's test | Goes to |
|---|---|
| `bugRegressions.test.ts` (full Mermaid sources → rendered relations) | **doodles** — integration tests of `mermaid.parse + layout` |
| `structureRelayout.test.ts` (back-edge, decision ports, colors, no-crossings) | **doodles** |
| `layoutTesting.ts` DSL | **doodles** — testing utility for consumers |
| `mermaidFormat.test.ts` (parser unit tests) | **doodles** — `mermaid` compiler unit tests |
| Algorithm unit tests | **filigree** (already there) |
| Future: "rendered SVG matches reference" | **doodles** — golden test |
| Future: "Konva render of doodle matches SVG render of same doodle" | **clouddiagram-editor** — guards against renderer drift |
| Cypress UI tests, Redux slice tests | **clouddiagram-editor** |
| "Markdown inline Mermaid renders" | **axonize** |

No new tests written for now. Sorting exercise during extraction.
