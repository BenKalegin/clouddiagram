import {Diagram} from "../../../common/model";

export type MermaidImporter = (baseDiagram: Diagram, content: string) => Diagram;

export type MermaidDiagramKind =
    | "flowchart"
    | "sequence"
    | "class"
    | "state"
    | "er"
    | "journey"
    | "gantt"
    | "pie"
    | "quadrant"
    | "requirement"
    | "gitgraph"
    | "c4"
    | "mindmap"
    | "timeline"
    | "zenuml"
    | "sankey"
    | "xychart"
    | "block"
    | "packet"
    | "kanban"
    | "architecture"
    | "radar"
    | "treemap"
    | "venn"
    | "ishikawa"
    | "treeview";

export interface MermaidDiagramTypeDefinition {
    kind: MermaidDiagramKind;
    name: string;
    declarations: string[];
    nativeImport: boolean;
}

export interface MermaidDiagramTypeRegistryEntry extends Omit<MermaidDiagramTypeDefinition, "nativeImport"> {
    importer?: MermaidImporter;
}
