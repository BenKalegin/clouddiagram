import { Diagram } from "../../common/model";
/**
 * Import a Mermaid sequence diagram into CloudDiagram format
 */
export declare function importMermaidSequenceDiagram(baseDiagram: Diagram, content: string): Diagram;
/**
 * Import a Mermaid class/flowchart diagram into CloudDiagram structure format
 */
export declare function importMermaidFlowchartDiagram(baseDiagram: Diagram, content: string): Diagram;
interface ImportStructureOptions {
    forceFlowchart?: boolean;
}
export declare function importMermaidStructureDiagram(baseDiagram: Diagram, content: string, options?: ImportStructureOptions): Diagram;
export {};
//# sourceMappingURL=mermaidFormat.d.ts.map