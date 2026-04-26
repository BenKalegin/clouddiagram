import { Diagram } from "../../common/model";
import { ElementType } from "../../package/packageModel";
import Konva from "konva";
import Stage = Konva.Stage;
import { CloudDiagramImportResult, ElementResolver } from "./CloudDiagramFormat";
export type { ElementResolver };
export declare enum ExportImportFormat {
    PlantUmlSequenceDiagram = "plantuml_sequence",
    LucidChartSequenceDiagram = "lucid_sequence",
    Png = "png",
    Svg = "svg",
    CloudDiagram = "cd",
    MermaidSequenceDiagram = "mermaid_sequence",
    MermaidStructureDiagram = "mermaid_structure",
    MermaidFlowchartDiagram = "mermaid_flowchart"
}
export interface DiagramExportContext {
    stage?: Stage | null;
    resolveElement?: ElementResolver;
}
export type DiagramImportResult = CloudDiagramImportResult;
type ImportedDiagram = Diagram | DiagramImportResult;
interface ExportRegistryEntry {
    format: ExportImportFormat;
    name: string;
    supportedDiagram: ElementType[];
    exportFunction?: (diagram: Diagram, context: DiagramExportContext) => Promise<string>;
    importFunction?: (diagram: Diagram, content: string) => ImportedDiagram;
}
export declare const formatRegistry: ExportRegistryEntry[];
export declare function exportFormats(diagramType: ElementType): [ExportImportFormat, string][];
export declare function importFormats(diagramType: ElementType): [ExportImportFormat, string][];
export declare function exportDiagramAs(diagram: Diagram, kind: ExportImportFormat, stage?: Stage | null, resolveElement?: ElementResolver): Promise<string>;
export declare function importDiagramAs(diagram: Diagram, kind: ExportImportFormat, content: string): DiagramImportResult;
//# sourceMappingURL=exportFormats.d.ts.map