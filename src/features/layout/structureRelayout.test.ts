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

});
