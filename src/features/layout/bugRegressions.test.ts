import {describe, it, beforeAll} from "vitest";
import {ElementType} from "../../package/packageModel";
import {createDiagramForType} from "../diagramTypes/diagramTypeRegistry";
import {ExportImportFormat, importDiagramAs} from "../export/exportFormats";
import {LayoutFacade, layoutFor} from "./layoutTesting";

/**
 * Bug regressions, one test per reported issue, using the full real source
 * from the user-reported screenshot that surfaced each bug. Each describe
 * pins a single fixture; each it() asserts one human-obvious relation that
 * must hold for that fixture's render.
 *
 * Adding a new regression: drop a Mermaid source here, add it()'s for the
 * things a human would expect to see. The layoutFor() DSL is engine-
 * agnostic, so these survive a future layout-engine swap.
 */

async function importFlowchart(source: string, id: string): Promise<{diagram: any; elements: any}> {
    const base = createDiagramForType(ElementType.FlowchartDiagram, id);
    return await importDiagramAs(base, ExportImportFormat.MermaidFlowchartDiagram, source) as {diagram: any; elements: any};
}

describe("Bug regression — ERP UI surfaces (screenshot 2026-05-12)", () => {
    // Surfaced bugs:
    //   - edge labels shown with literal surrounding `"..."`
    //   - three-column branch rendered reversed (Long tail / Middle / Operating)
    //     instead of source order (Operating / Middle / Long tail)
    const SOURCE = `flowchart TB
        A[All ERP UI surfaces] --> B{Usage frequency}
        B -->|"Daily, hours per user"| C["<b>Operating screens</b><br>~10–20 per role"]
        B -->|"Weekly, few users"| D["<b>Middle band</b><br>moderately used"]
        B -->|"Rare, edge-case"| E["<b>Long tail</b><br>~3,000+ transactions"]
        C --> F["Hand-crafted, dense, fast"]
        D --> G["Templated generation"]
        E --> H["Generated on demand"]
        style C fill:#3a2d5f,stroke:#8b7fd6,color:#fff
        style D fill:#3f2d1a,stroke:#d99c47,color:#fff
        style E fill:#1e3f30,stroke:#5fb085,color:#fff`;

    let L: LayoutFacade;
    beforeAll(async () => {
        L = layoutFor(await importFlowchart(SOURCE, "bug-erp"));
    });

    it("edge labels are stripped of surrounding quotes", () => {
        L.edge({fromText: "Usage frequency", toText: "Operating screens"}).hasLabel("Daily, hours per user");
        L.edge({fromText: "Usage frequency", toText: "Middle band"}).hasLabel("Weekly, few users");
        L.edge({fromText: "Usage frequency", toText: "Long tail"}).hasLabel("Rare, edge-case");
    });

    it("three-branch decision keeps left-to-right source order", () => {
        L.nodes("Operating screens", "Middle band", "Long tail").orderedLeftToRight();
    });

    it("leaf descendants inherit the parent branch order", () => {
        L.nodes("Hand-crafted, dense, fast", "Templated generation", "Generated on demand").orderedLeftToRight();
    });
});

describe("Bug regression — RAG ingestion + query pipelines (screenshot 2026-05-14 12:33)", () => {
    // Surfaced bugs:
    //   - chained-arrow lines (`A --> B --> C --> D`) silently dropped, leaving
    //     subgraph nodes unlinked
    //   - intra-subgraph nodes laid out horizontally instead of vertically (TB)
    //     because edges were placed at root rather than at the LCA of their
    //     endpoints, so filigree's per-compound layered algorithm saw zero
    //     edges and packed every leaf into one layer
    //   - edge between Query Condenser and Preflight Analyzer rendered with
    //     a horizontal jog because the wider Preflight Analyzer label drifted
    //     the box center off-column
    //
    // Note: the user's original source has `Store1[Vector Store]` and
    // `Store2[Vector Store]`. The layout DSL keys nodes by display-text and
    // can't disambiguate identical text today, so we widen the display text
    // here without changing the bugs being asserted.
    const SOURCE = `graph TB
        subgraph Ingestion["Ingestion Pipeline"]
            direction TB
            Upload[Document Upload]
            Parse[Document Parser]
            Chunk[Text Chunker]
            Embed[Embedding]
            Store1[Vector Store - docs]
            Upload --> Parse --> Chunk --> Embed --> Store1
        end
        subgraph Query["Query Pipeline"]
            direction TB
            Query1[User Query]
            Condense[Query Condenser]
            Preflight[Preflight Analyzer]
            PlanGen[Plan Generator]
            Execute[DurableAgent]
            Store2[Vector Store - queries]
            Query1 --> Condense --> Preflight --> PlanGen --> Execute
            Execute --> Store2
        end`;

    let L: LayoutFacade;
    beforeAll(async () => {
        L = layoutFor(await importFlowchart(SOURCE, "bug-rag"));
    });

    it("chained-arrow syntax produces an edge for every consecutive pair", () => {
        // Ingestion chain (4 edges) + Query chain (4 edges) + Execute→Store2 (1)
        L.edges().count(9);
    });

    it("Ingestion subgraph nodes stack vertically in source order", () => {
        L.nodes("Document Upload", "Document Parser", "Text Chunker", "Embedding", "Vector Store - docs")
            .orderedTopToBottom();
    });

    it("Query subgraph nodes stack vertically in source order", () => {
        L.nodes("User Query", "Query Condenser", "Preflight Analyzer", "Plan Generator", "DurableAgent", "Vector Store - queries")
            .orderedTopToBottom();
    });

    it("wider-text node aligns center with its narrower chain neighbors", () => {
        L.node("Query Condenser").centeredHorizontallyWith("Preflight Analyzer");
        L.node("Preflight Analyzer").centeredHorizontallyWith("Plan Generator");
    });

    it("each subgraph encloses its declared members", () => {
        L.cluster("Ingestion Pipeline").contains(
            "Document Upload", "Document Parser", "Text Chunker", "Embedding", "Vector Store - docs"
        );
        L.cluster("Query Pipeline").contains(
            "User Query", "Query Condenser", "Preflight Analyzer", "Plan Generator", "DurableAgent", "Vector Store - queries"
        );
    });
});
