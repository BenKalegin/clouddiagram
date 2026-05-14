import {describe, it, expect} from "vitest";
import {ElementType, FlowchartNodeKind, PortAlignment} from "../../package/packageModel";
import {createDiagramForType} from "../diagramTypes/diagramTypeRegistry";
import {ExportImportFormat, importDiagramAs} from "../export/exportFormats";
import {layoutFor} from "./layoutTesting";

const USER_FLOWCHART = `flowchart LR
    U["User intent<br/>(free text)"] --> R["<b>Router</b><br/>operating screen?<br/>generated task?<br/>direct answer?"]
    R --> G["<b>Generator</b><br/>data model<br/>+ permissions<br/>+ business rules<br/>→ UI spec"]
    G --> P["<b>Preview UI</b><br/>shows exactly<br/>what will happen"]
    P --> H{"Human<br/>confirms?"}
    H -->|yes| X["<b>Execute</b><br/>via existing<br/>service layer"]
    H -->|edit| P
    X --> L["<b>Audit log</b><br/>intent, UI shown,<br/>data posted, diff"]
    style R fill:#1e3a5f,color:#fff
    style G fill:#1e4a3a,color:#fff
    style P fill:#1e4a3a,color:#fff
    style L fill:#4a1e3a,color:#fff`;

async function importFlowchart(source: string, id = "test") {
    const base = createDiagramForType(ElementType.FlowchartDiagram, id);
    return importDiagramAs(base, ExportImportFormat.MermaidFlowchartDiagram, source) as Promise<{
        diagram: any; elements: any;
    }>;
}

describe("Structure relayout via importDiagramAs", () => {
    it("lays out a flowchart with a back-edge (no edges lost, LR progression preserved)", async () => {
        const result = await importFlowchart(USER_FLOWCHART, "test-back-edge");
        const L = layoutFor(result);

        L.edges().count(7);
        L.edge({fromText: "Human", toText: "Preview UI"}).hasLabel("edit");
        L.edge({fromText: "Human", toText: "Execute"}).hasLabel("yes");
        L.node("User intent").leftOf("Audit log");
    });

    it("puts decision-node inputs and outputs on opposite sides (LR)", async () => {
        const result = await importFlowchart(USER_FLOWCHART, "test-elk-decision");

        const diamond = Object.values(result.elements).find(
            (e: any) => e.type === ElementType.ClassNode && e.flowchartKind === FlowchartNodeKind.Decision
        ) as any;
        expect(diamond).toBeDefined();

        const {incoming, outgoing} = layoutFor(result).portsOf(diamond.text);

        expect(incoming).toContain(PortAlignment.Left);
        expect(outgoing).toContain(PortAlignment.Right);
        for (const side of incoming) {
            expect(outgoing).not.toContain(side);
        }
    });

    it("preserves style colors applied during import", async () => {
        const result = await importFlowchart(USER_FLOWCHART, "test-elk-color");
        const elements = result.elements as any;
        const router = Object.values(elements).find(
            (n: any) => n.type === ElementType.ClassNode && String(n.text).includes("Router")
        ) as any;

        expect(router.colorSchema.fillColor).toBe("#1e3a5f");
        expect(router.colorSchema.textColor).toBe("#fff");
        expect(router.colorSchema.rawColors).toBe(true);
    });

    it("strips surrounding quotes from edge labels", async () => {
        const source = `flowchart TB
            A[Start] -->|"label with spaces"| B[Middle]
            B -->|unquoted| C[End]`;
        const result = await importFlowchart(source, "test-edge-quotes");
        const L = layoutFor(result);

        L.edge({fromText: "Start", toText: "Middle"}).hasLabel("label with spaces");
        L.edge({fromText: "Middle", toText: "End"}).hasLabel("unquoted");
    });

    it("produces no edge crossings for a simple branching tree", async () => {
        const source = `flowchart TB
            Root --> A
            Root --> B
            Root --> C
            A --> A1
            B --> B1
            C --> C1`;
        const result = await importFlowchart(source, "test-no-crossings");
        layoutFor(result).edges().noCrossings();
    });

    it("preserves source declaration order for branches with descendants (TB)", async () => {
        // Regression for the ERP-flowchart screenshot: three columns with leaf
        // descriptions below them came out reversed (Long tail, Middle, Operating
        // instead of Operating, Middle, Long tail). Now backed by OrderBefore
        // hints emitted from the importer based on edge declaration order.
        const source = `flowchart TB
            A[Root] --> B{Decision}
            B -->|"first"| C[First]
            B -->|"second"| D[Second]
            B -->|"third"| E[Third]
            C --> C1[First detail]
            D --> D1[Second detail]
            E --> E1[Third detail]`;
        const result = await importFlowchart(source, "test-column-order");
        const L = layoutFor(result);
        L.nodes("First", "Second", "Third").orderedLeftToRight();
        L.nodes("First detail", "Second detail", "Third detail").orderedLeftToRight();
    });

    it("places intra-subgraph edges so chain members stack vertically (TB)", async () => {
        const source = `graph TB
            subgraph Pipe["Pipeline"]
                A[Upload]
                B[Parse]
                C[Embed]
                D[Store]
                A --> B --> C --> D
            end`;
        const result = await importFlowchart(source, "test-intra-stack");
        const L = layoutFor(result);
        L.nodes("Upload", "Parse", "Embed", "Store").orderedTopToBottom();
        L.nodes("Upload", "Parse", "Embed", "Store").sameColumn();
    });

    it("imports chained-arrow edges (A --> B --> C --> D as three edges)", async () => {
        const source = `flowchart TB
            subgraph Ingestion["Ingestion Pipeline"]
                Upload[Document Upload]
                Parse[Document Parser]
                Chunk[Text Chunker]
                Embed[Embedding]
                Store1[Vector Store]
                Upload --> Parse --> Chunk --> Embed --> Store1
            end`;
        const result = await importFlowchart(source, "test-chain");
        const L = layoutFor(result);
        L.edges().count(4);
        L.edge({fromText: "Document Upload", toText: "Document Parser"}).hasLabel(undefined);
        L.edge({fromText: "Document Parser", toText: "Text Chunker"}).hasLabel(undefined);
        L.edge({fromText: "Text Chunker", toText: "Embedding"}).hasLabel(undefined);
        L.edge({fromText: "Embedding", toText: "Vector Store"}).hasLabel(undefined);
    });

    it("preserves source order with rich-text labels and per-node styles (ERP screenshot shape)", async () => {
        const source = `flowchart TB
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
        const result = await importFlowchart(source, "test-erp-screenshot");
        const L = layoutFor(result);
        L.nodes("Operating screens", "Middle band", "Long tail").orderedLeftToRight();
        L.nodes("Hand-crafted, dense, fast", "Templated generation", "Generated on demand").orderedLeftToRight();
        L.edge({fromText: "Usage frequency", toText: "Operating screens"}).hasLabel("Daily, hours per user");
        L.edge({fromText: "Usage frequency", toText: "Middle band"}).hasLabel("Weekly, few users");
        L.edge({fromText: "Usage frequency", toText: "Long tail"}).hasLabel("Rare, edge-case");
    });
});
